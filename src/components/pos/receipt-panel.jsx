"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Check, Printer, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/koetap/form-field";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";
import { PAYMENT_LABELS, receiptNumber } from "@/lib/pos";
import { imageThumb } from "@/lib/images";
import { formatMoney } from "@/lib/stores";
import { cn } from "@/lib/utils";

// What the store's logo slot shows: the logo image, or the store's name set as a wordmark.
export function StoreBrand({ store, className = "" }) {
  return store.logoUrl ? (
    // A plain <img> (not the fading one): this is also what gets printed, and it must be there when the page prints.
    // eslint-disable-next-line @next/next/no-img-element -- logo URLs are arbitrary external images
    <img
      src={imageThumb(store.logoUrl, { w: 320, h: 96, fit: "limit" })}
      alt={store.name}
      className={cn("max-h-12 w-auto object-contain", className)}
    />
  ) : (
    <span className={`truncate font-bold tracking-tight ${className}`}>{store.name}</span>
  );
}

const ACCENT_STYLE = { background: "var(--store-accent, var(--primary))", color: "var(--store-accent-fg, var(--primary-foreground))" };

// Replaces the cart after a sale. The receipt itself is paper: always black on white, in light or dark mode,
// and it is the only thing that prints.
export function ReceiptPanel({ sale, store, onNewSale }) {
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
  const { errors, onBlur, validate } = useFormValidation(
    { email: [rules.required("Customer email"), rules.email()] },
    { email },
    { idPrefix: "receipt-" }
  );

  async function sendEmail(e) {
    e.preventDefault();
    if (!validate()) return;
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-success-soft text-success-ink">
          <Check className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Sale complete</p>
          <p className="text-xs text-muted-foreground">Receipt #{number}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div ref={printRef} className="receipt-paper rounded-2xl border p-5 shadow-sm">
          <div className="text-center">
            <StoreBrand store={store} className="mx-auto text-xl" />
            {store.logoUrl && <p className="mt-1 text-lg font-bold">{store.name}</p>}
            {store.address && <p className="receipt-muted mt-0.5 text-xs">{store.address}</p>}
          </div>

          <div className="receipt-muted mt-4 space-y-0.5 text-xs">
            <p>Receipt #{number}</p>
            <p>{date}</p>
            <p>Cashier: {sale.cashierName}</p>
          </div>

          <div className="my-3 border-t border-dashed" />

          <ul className="space-y-2 text-sm">
            {sale.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="receipt-muted text-xs">
                    {item.quantity} x {money(item.price)}
                  </p>
                </div>
                <p className="shrink-0 font-medium">{money(item.total)}</p>
              </li>
            ))}
          </ul>

          <div className="my-3 border-t border-dashed" />

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="receipt-muted">Subtotal</dt>
              <dd>{money(sale.subtotal)}</dd>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <dt className="receipt-muted">Discount</dt>
                <dd>-{money(sale.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>{money(sale.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="receipt-muted">Paid by</dt>
              <dd>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</dd>
            </div>
          </dl>

          {store.receiptFooter && <p className="receipt-muted mt-5 text-center text-xs">{store.receiptFooter}</p>}
        </div>

        <form onSubmit={sendEmail} noValidate className="space-y-2 rounded-2xl border border-border bg-background p-4">
          <FormField id="receipt-email" label="Send receipt to email" optional error={errors.email}>
            {(a11y) => (
              <div className="flex gap-2">
                <Input
                  {...a11y}
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailStatus({ type: "", message: "" });
                  }}
                  onBlur={onBlur("email")}
                  placeholder="customer@example.com"
                />
                <Button type="submit" loading={sending} style={ACCENT_STYLE} className="shrink-0">
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            )}
          </FormField>
          {emailStatus.message && (
            <p
              role={emailStatus.type === "error" ? "alert" : "status"}
              className={`animate-slideUp text-xs font-medium ${emailStatus.type === "error" ? "text-error-ink" : "text-success-ink"}`}
            >
              {emailStatus.message}
            </p>
          )}
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border p-4">
        <Button type="button" variant="secondary" size="lg" onClick={print}>
          <Printer />
          Print Receipt
        </Button>
        <Button type="button" size="lg" onClick={onNewSale} style={ACCENT_STYLE}>
          <ShoppingCart />
          New Sale
        </Button>
      </div>
    </div>
  );
}
