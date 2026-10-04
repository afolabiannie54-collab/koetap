export const PAYMENT_METHODS = ["cash", "transfer", "other"];

export const PAYMENT_LABELS = { cash: "Cash", transfer: "Transfer", other: "Other" };

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const MAX_LINES = 100;
export const MAX_QUANTITY = 100000;

// Money is kept to 2 decimals so floating point noise (0.1 + 0.2) never reaches a receipt.
export const roundMoney = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// A fresh reference for one sale attempt (see Sale.clientRef).
export function newSaleKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export const receiptNumber = (id) => String(id).slice(-8).toUpperCase();

// Black or white text, whichever reads better on the store's accent colour.
export function readableTextColor(hex) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex ?? "");
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#ffffff";
}

// Validates a sale request. Prices are deliberately not accepted: the server always uses
// the product's current price, so a tampered client can't sell at its own price.
export function parseSaleInput(body) {
  const fail = (field, error) => ({ error, field });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return fail("items", "The cart is empty");
  }
  if (body.items.length > MAX_LINES) {
    return fail("items", `A sale can have at most ${MAX_LINES} different products`);
  }

  // The same product listed twice is one line with the quantities added up.
  const merged = new Map();
  for (const item of body.items) {
    const productId = typeof item?.productId === "string" ? item.productId : "";
    if (!OBJECT_ID.test(productId)) return fail("items", "Invalid product in cart");

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return fail("items", "Quantities must be whole numbers of 1 or more");
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    return fail("paymentMethod", "Choose a payment method: cash, transfer or other");
  }

  let discount = 0;
  if (body.discount !== undefined && body.discount !== null && body.discount !== "") {
    discount = Number(body.discount);
    if (!Number.isFinite(discount) || discount < 0) {
      return fail("discount", "Discount must be 0 or more");
    }
    discount = roundMoney(discount);
  }

  // Optional, so older clients keep working. When present it must look like a generated key.
  let clientRef = "";
  if (body.clientRef !== undefined && body.clientRef !== null) {
    if (typeof body.clientRef !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(body.clientRef)) {
      return fail("clientRef", "Invalid sale reference");
    }
    clientRef = body.clientRef;
  }

  let note = "";
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== "string") return fail("note", "Invalid note");
    note = body.note.trim();
    if (note.length > 500) return fail("note", "Note must be 500 characters or fewer");
  }

  return {
    data: {
      items: [...merged].map(([productId, quantity]) => ({ productId, quantity })),
      paymentMethod: body.paymentMethod,
      discount,
      note,
      clientRef,
    },
  };
}
