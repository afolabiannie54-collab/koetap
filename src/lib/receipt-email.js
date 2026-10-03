import { PAYMENT_LABELS, receiptNumber } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";

// Names, footers etc. are user-entered, so they must be escaped before going into HTML.
const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function buildReceiptEmail({ store, sale }) {
  const money = (n) => formatMoney(n, store.currency);
  const number = receiptNumber(sale._id);
  const date = new Date(sale.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  const rows = sale.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0">${esc(i.name)}<br><span style="color:#6b7280;font-size:12px">${i.quantity} x ${esc(money(i.price))}</span></td>
        <td style="padding:6px 0;text-align:right;vertical-align:top">${esc(money(i.total))}</td>
      </tr>`
    )
    .join("");

  const line = (label, value, bold = false) =>
    `<tr><td style="padding:3px 0;${bold ? "font-weight:700;font-size:16px;" : "color:#6b7280;"}">${label}</td>
     <td style="padding:3px 0;text-align:right;${bold ? "font-weight:700;font-size:16px;" : ""}">${value}</td></tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px">
    <h1 style="margin:0 0 4px;font-size:20px;text-align:center">${esc(store.name)}</h1>
    ${store.address ? `<p style="margin:0;text-align:center;color:#6b7280;font-size:13px">${esc(store.address)}</p>` : ""}
    <p style="margin:16px 0 4px;font-size:13px;color:#6b7280">Receipt #${esc(number)}<br>${esc(date)}<br>Served by ${esc(sale.cashierName)}</p>
    <hr style="border:none;border-top:1px dashed #d1d5db;margin:12px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <hr style="border:none;border-top:1px dashed #d1d5db;margin:12px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${line("Subtotal", esc(money(sale.subtotal)))}
      ${sale.discount > 0 ? line("Discount", `-${esc(money(sale.discount))}`) : ""}
      ${line("Total", esc(money(sale.total)), true)}
      ${line("Paid by", esc(PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod))}
    </table>
    ${store.receiptFooter ? `<p style="margin:20px 0 0;text-align:center;font-size:13px;color:#6b7280">${esc(store.receiptFooter)}</p>` : ""}
  </div>
</body></html>`;

  return { subject: `Your receipt from ${store.name}`, html };
}
