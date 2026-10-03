"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PAYMENT_LABELS, receiptNumber } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";

export function StoreBrand({ store, className = "" }) {
  return store.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- logo URLs are arbitrary external images
    <img src={store.logoUrl} alt={store.name} className={`max-h-12 w-auto object-contain ${className}`} />
  ) : (
    <span className={`font-bold tracking-tight ${className}`}>{store.name}</span>
  );
}

export function ReceiptView({ sale, store, accent, accentFg, onNewSale }) {
  const printRef = useRef(null);
  const number = receiptNumber(sale._id);
  const money = (n) => formatMoney(n, store.currency);

  // Only the element behind printRef is printed, not the buttons or the rest of the page.
  const print = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${number}`,
    pageStyle: "@page { size: 80mm auto; margin: 4mm; } body { -webkit-print-color-adjust: exact; }",
  });

  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);

  async function sendEmail(e) {
    e.preventDefault();
    setEmailStatus({ type: "", message: "" });
    setSending(true);

    const res = await fetch(`/api/pos/${store.id}/sales/${sale._id}/receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setEmailStatus({ type: "error", message: data.error || "Could not send the receipt" });
      return;
    }
    setEmailStatus({ type: "success", message: `Receipt sent to ${email.trim()}` });
  }

  const date = new Date(sale.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex min-h-dvh flex-col items-center gap-5 overflow-y-auto bg-gray-100 px-4 py-6">
      <div ref={printRef} className="w-full max-w-sm rounded-2xl bg-white p-6 text-gray-900 shadow-sm">
        <div className="text-center">
          <StoreBrand store={store} className="text-xl" />
          {store.logoUrl && <p className="mt-1 text-lg font-bold">{store.name}</p>}
          {store.address && <p className="mt-0.5 text-xs text-gray-500">{store.address}</p>}
        </div>

        <div className="mt-4 space-y-0.5 text-xs text-gray-500">
          <p>Receipt #{number}</p>
          <p>{date}</p>
          <p>Cashier: {sale.cashierName}</p>
        </div>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <ul className="space-y-2 text-sm">
          {sale.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} x {money(item.price)}
                </p>
              </div>
              <p className="shrink-0 font-medium">{money(item.total)}</p>
            </li>
          ))}
        </ul>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Subtotal</dt>
            <dd>{money(sale.subtotal)}</dd>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Discount</dt>
              <dd>-{money(sale.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{money(sale.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Paid by</dt>
            <dd>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</dd>
          </div>
        </dl>

        {store.receiptFooter && (
          <p className="mt-5 text-center text-xs text-gray-500">{store.receiptFooter}</p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={print}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 active:scale-[0.98]"
          >
            <Printer className="size-4" />
            Print Receipt
          </button>
          <button
            type="button"
            onClick={onNewSale}
            style={{ background: accent, color: accentFg }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold active:scale-[0.98]"
          >
            <ShoppingCart className="size-4" />
            New Sale
          </button>
        </div>

        <form onSubmit={sendEmail} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <label htmlFor="receipt-email" className="text-sm font-medium text-gray-700">
            Send receipt to email (optional)
          </label>
          <div className="flex gap-2">
            <Input
              id="receipt-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="h-10"
            />
            <button
              type="submit"
              disabled={sending}
              style={{ background: accent, color: accentFg }}
              className="h-10 shrink-0 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          {emailStatus.message && (
            <p
              role={emailStatus.type === "error" ? "alert" : "status"}
              className={`text-xs ${emailStatus.type === "error" ? "text-red-600" : "text-emerald-600"}`}
            >
              {emailStatus.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
