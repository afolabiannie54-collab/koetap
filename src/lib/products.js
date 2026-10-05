import { isAllowedImageUrl } from "@/lib/images";

export const ADJUSTMENT_TYPES = ["restock", "correction", "write-off"];

const isBlank = (v) => v === "" || v === null || v === undefined;

// Validates product fields from a request body. Only known fields are read, so a stray
// businessId/storeId in the body can never reach the database.
// With partial: true only the supplied fields are checked.
// Errors carry the offending field name so the form can show them inline.
export function parseProductInput(body, { partial = false } = {}) {
  const data = {};
  const fail = (field, error) => ({ error, field });

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return fail("name", "Product name is required");
    data.name = name;
  }

  for (const field of ["category", "sku"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") return fail(field, `Invalid ${field}`);
      data[field] = body[field].trim();
    }
  }

  if (!partial || body.price !== undefined) {
    const price = isBlank(body.price) ? NaN : Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return fail("price", "Price is required and must be 0 or more");
    }
    data.price = price;
  }

  if (body.costPrice !== undefined) {
    if (isBlank(body.costPrice)) {
      data.costPrice = null;
    } else {
      const cost = Number(body.costPrice);
      if (!Number.isFinite(cost) || cost < 0) {
        return fail("costPrice", "Cost price must be 0 or more");
      }
      data.costPrice = cost;
    }
  }

  if (body.stock !== undefined || !partial) {
    const stock = isBlank(body.stock) ? 0 : Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return fail("stock", "Stock must be a whole number, 0 or more");
    }
    data.stock = stock;
  }

  if (body.lowStockThreshold !== undefined) {
    if (isBlank(body.lowStockThreshold)) {
      data.lowStockThreshold = null; // fall back to the store default
    } else {
      const t = Number(body.lowStockThreshold);
      if (!Number.isInteger(t) || t < 0) {
        return fail("lowStockThreshold", "Threshold must be a whole number, 0 or more");
      }
      data.lowStockThreshold = t;
    }
  }

  if (body.imageUrl !== undefined) {
    const url = typeof body.imageUrl === "string" ? body.imageUrl.trim() : null;
    if (url === null || (url !== "" && !isAllowedImageUrl(url))) return fail("imageUrl", "Use an image uploaded through Koetap");
    data.imageUrl = url;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return fail("isActive", "Invalid isActive");
    data.isActive = body.isActive;
  }

  return { data };
}

// Mongo expression: stock is at or below the product's own threshold, else the store's.
export function lowStockExpr(storeThreshold) {
  return { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", storeThreshold ?? 5] }] };
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Builds the Mongo filter for listing a store's products.
export function buildProductFilter(store, { category, status, search, low } = {}, { onlyActive = false } = {}) {
  const filter = { storeId: store._id };

  if (onlyActive || status === "active") filter.isActive = true;
  else if (status === "inactive") filter.isActive = false;

  if (category) filter.category = category;

  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: rx }, { sku: rx }];
  }

  if (low) {
    filter.isActive = true;
    filter.$expr = lowStockExpr(store.lowStockThreshold);
  }

  return filter;
}

// Plain, JSON-safe product for the API and for client components.
export function serializeProduct(doc, storeThreshold = 5) {
  const p = doc.toObject ? doc.toObject() : doc;
  const stock = p.stock ?? 0;
  const effectiveThreshold = p.lowStockThreshold ?? storeThreshold;
  const isActive = p.isActive !== false;

  return {
    id: p._id.toString(),
    storeId: p.storeId.toString(),
    name: p.name,
    sku: p.sku ?? "",
    category: p.category ?? "",
    price: p.price,
    costPrice: p.costPrice ?? null,
    stock,
    lowStockThreshold: p.lowStockThreshold ?? null,
    imageUrl: p.imageUrl ?? "",
    effectiveThreshold,
    isLowStock: isActive && stock <= effectiveThreshold,
    isActive,
  };
}
