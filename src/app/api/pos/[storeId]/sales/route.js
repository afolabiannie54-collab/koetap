import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import InventoryLog from "@/models/InventoryLog";
import { authorizeStore } from "@/lib/api-auth";
import { parseSaleInput, roundMoney } from "@/lib/pos";

// A problem with the sale itself (stock, discount): aborts the transaction and becomes a 400.
class SaleError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.extra = extra;
  }
}

export async function POST(request, { params }) {
  const { storeId } = await params;
  const { user, store, error } = await authorizeStore(storeId);
  if (error) return error;

  if (!store.isActive) {
    return NextResponse.json({ error: "This store is inactive and can't make sales" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error: validationError, field } = parseSaleInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError, field }, { status: 400 });
  }

  // Always lock products in the same order so concurrent sales can't deadlock each other.
  const items = [...data.items].sort((a, b) => a.productId.localeCompare(b.productId));

  // A retry or double tap carries the same reference. If that sale already exists, hand it back.
  const findExisting = () =>
    data.clientRef ? Sale.findOne({ storeId: store._id, clientRef: data.clientRef }) : null;
  const already = await findExisting();
  if (already) return NextResponse.json({ sale: already, replayed: true }, { status: 200 });

  const session = await mongoose.startSession();
  try {
    let sale;
    let replayed = false;

    // All or nothing: if any line can't be fulfilled, stock for the other lines is put back
    // and no sale or log entry is written. withTransaction may re-run this callback on a
    // transient conflict, so it must start from a clean slate every time.
    await session.withTransaction(async () => {
      replayed = false;

      // Two copies of one sale can be in flight at once. Whichever commits second finds the first here.
      if (data.clientRef) {
        const duplicate = await Sale.findOne({ storeId: store._id, clientRef: data.clientRef }).session(session);
        if (duplicate) {
          sale = duplicate;
          replayed = true;
          return;
        }
      }

      const taken = [];
      const failures = [];

      for (const item of items) {
        // The stock check and the deduction are one atomic operation, so two cashiers
        // selling the last unit at the same moment can't both succeed.
        const before = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            storeId: store._id, // never touches another store's product
            isActive: true,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { returnDocument: "before", session }
        );

        if (before) {
          taken.push({ item, before });
          continue;
        }

        // Work out why it failed so the cashier gets a specific message.
        const product = await Product.findOne({ _id: item.productId, storeId: store._id })
          .select("name stock isActive")
          .session(session)
          .lean();
        failures.push(
          !product || !product.isActive
            ? { productId: item.productId, name: product?.name ?? "Unknown product", reason: "unavailable", available: 0 }
            : { productId: item.productId, name: product.name, reason: "insufficient", available: product.stock ?? 0 }
        );
      }

      if (failures.length > 0) {
        const parts = failures.map((f) =>
          f.reason === "unavailable"
            ? `${f.name} (no longer available)`
            : f.available === 0
              ? `${f.name} (out of stock)`
              : `${f.name} (only ${f.available} left)`
        );
        throw new SaleError(`Not enough stock: ${parts.join(", ")}`, { failures });
      }

      // Snapshot name and price as they are right now. Later product edits never touch old sales.
      const saleItems = taken.map(({ item, before }) => ({
        productId: before._id,
        name: before.name,
        price: before.price,
        quantity: item.quantity,
        total: roundMoney(before.price * item.quantity),
      }));
      const subtotal = roundMoney(saleItems.reduce((sum, i) => sum + i.total, 0));

      if (data.discount > subtotal) {
        throw new SaleError("Discount can't be more than the subtotal", { field: "discount" });
      }

      const newSale = new Sale({
        businessId: store.businessId,
        storeId: store._id,
        cashierId: user.id,
        cashierName: user.name || user.email || "Staff",
        items: saleItems,
        subtotal,
        discount: data.discount,
        total: roundMoney(subtotal - data.discount),
        paymentMethod: data.paymentMethod,
        note: data.note || undefined,
        clientRef: data.clientRef || undefined,
      });
      await newSale.save({ session });

      await InventoryLog.insertMany(
        taken.map(({ item, before }) => ({
          storeId: store._id,
          productId: before._id,
          type: "sale",
          delta: -item.quantity,
          previousStock: before.stock ?? 0,
          newStock: (before.stock ?? 0) - item.quantity,
          referenceId: newSale._id,
          performedBy: user.id,
        })),
        { session }
      );

      sale = newSale;
    });

    return NextResponse.json(
      { sale, ...(replayed ? { replayed: true } : {}) },
      { status: replayed ? 200 : 201 }
    );
  } catch (err) {
    // The loser of a race between two copies of one sale ends up here, either on the unique index or
    // with "not enough stock" because the winner already took it. Either way the sale exists: return it.
    if (data.clientRef && (err?.code === 11000 || err instanceof SaleError)) {
      const existing = await findExisting();
      if (existing) return NextResponse.json({ sale: existing, replayed: true }, { status: 200 });
    }
    if (err instanceof SaleError) {
      return NextResponse.json({ error: err.message, ...err.extra }, { status: 400 });
    }
    console.error("Sale failed:", err);
    return NextResponse.json({ error: "Could not complete the sale. Please try again." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
