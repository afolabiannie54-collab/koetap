export const CURRENCIES = ["NGN", "USD", "GBP"];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Validates store fields from a request body. With partial: true only supplied fields are checked.
export function parseStoreInput(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return { error: "Store name is required" };
    data.name = name;
  }

  for (const field of ["address", "receiptFooter"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") return { error: `Invalid ${field}` };
      data[field] = body[field].trim();
    }
  }

  if (body.currency !== undefined) {
    if (!CURRENCIES.includes(body.currency)) return { error: "Unsupported currency" };
    data.currency = body.currency;
  }

  if (body.lowStockThreshold !== undefined) {
    const n = Number(body.lowStockThreshold);
    if (!Number.isInteger(n) || n < 0) {
      return { error: "Low stock threshold must be a whole number, 0 or more" };
    }
    data.lowStockThreshold = n;
  }

  if (body.accentColor !== undefined) {
    if (typeof body.accentColor !== "string") return { error: "Invalid accent color" };
    const color = body.accentColor.trim();
    if (color && !HEX_COLOR.test(color)) {
      return { error: "Accent color must be a hex value like #4F46E5" };
    }
    data.accentColor = color;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return { error: "Invalid isActive" };
    data.isActive = body.isActive;
  }

  return { data };
}

// Plain, JSON-safe store object for passing from server to client components.
export function serializeStore(store) {
  return {
    id: store._id.toString(),
    businessId: store.businessId.toString(),
    name: store.name,
    address: store.address ?? "",
    currency: store.currency ?? "NGN",
    accentColor: store.accentColor ?? "",
    receiptFooter: store.receiptFooter ?? "",
    lowStockThreshold: store.lowStockThreshold ?? 5,
    isActive: store.isActive !== false,
  };
}

export function formatMoney(amount, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount ?? 0);
}
