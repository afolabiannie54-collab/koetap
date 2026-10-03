import { roundMoney } from "@/lib/pos";

// Held ("parked") sales live only in this browser's localStorage, one list per store.
const PREFIX = "koetap_held_orders_";
const CHANGED_EVENT = "koetap-held-orders-changed";

export const heldKey = (storeId) => `${PREFIX}${storeId}`;

// The raw JSON string, so useSyncExternalStore can compare snapshots by value.
export function readHeldRaw(storeId) {
  try {
    return window.localStorage.getItem(heldKey(storeId)) ?? "[]";
  } catch {
    return "[]"; // storage blocked (private mode, policy): behave as "nothing held"
  }
}

export const serverHeldRaw = () => "[]";

// "storage" fires for changes made in other tabs; our own event covers this tab.
export function subscribeHeld(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED_EVENT, onChange);
  };
}

// Tolerates anything odd in storage (old format, hand edits) by dropping what it can't use.
export function parseHeld(raw) {
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];

  return list
    .filter((o) => o && typeof o.id === "string" && typeof o.heldAt === "string" && Array.isArray(o.items))
    .map((o) => ({
      id: o.id,
      heldAt: o.heldAt,
      items: o.items
        .filter((i) => i && typeof i.productId === "string" && Number.isInteger(i.quantity) && i.quantity > 0)
        .map((i) => ({
          productId: i.productId,
          name: typeof i.name === "string" ? i.name : "Unknown product",
          price: Number.isFinite(i.price) ? i.price : 0,
          quantity: i.quantity,
        })),
      discount: Number.isFinite(o.discount) && o.discount > 0 ? o.discount : 0,
      paymentMethod: typeof o.paymentMethod === "string" ? o.paymentMethod : "cash",
      note: typeof o.note === "string" ? o.note : undefined,
    }))
    .filter((o) => o.items.length > 0);
}

// Returns false if the browser refused to store it, so the caller can keep the cart.
function write(storeId, orders) {
  try {
    window.localStorage.setItem(heldKey(storeId), JSON.stringify(orders));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
  return true;
}

export function addHeldOrder(storeId, { items, discount, paymentMethod, note }) {
  const order = {
    id: Date.now().toString(),
    heldAt: new Date().toISOString(),
    items,
    discount,
    paymentMethod,
    ...(note ? { note } : {}),
  };
  // Always built from what is stored right now, so another tab's holds aren't overwritten.
  return write(storeId, [...parseHeld(readHeldRaw(storeId)), order]);
}

export function removeHeldOrder(storeId, orderId) {
  return write(storeId, parseHeld(readHeldRaw(storeId)).filter((o) => o.id !== orderId));
}

// On sign-out. Every store's list goes, since a shared device may have been used for several.
export function clearAllHeldOrders() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Nothing to clear if storage isn't available.
  }
}

export const heldOrderTotal = (order) =>
  roundMoney(Math.max(0, order.items.reduce((sum, i) => sum + i.price * i.quantity, 0) - order.discount));

export function timeAgo(isoDate, now) {
  const minutes = Math.floor((now.getTime() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
