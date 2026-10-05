"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/koetap/info-tip";
import { TypeToConfirmDialog } from "@/components/ui/koetap/type-to-confirm-dialog";
import { clearAllHeldOrders } from "@/lib/held-orders";
import { plural } from "@/lib/utils";

// The owner closing their own account. This deletes the whole business: every store, product, cashier, sale and image.
// `expected` is what they must type: the business's name (or their email, before a business exists).
export function DeleteAccountSection({ expected, impact }) {
  const [open, setOpen] = useState(false);

  async function confirmDelete() {
    let res;
    try {
      res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: expected }),
      });
    } catch {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Could not delete the account.";
    clearAllHeldOrders();
    signOut({ callbackUrl: "/login" });
    return ""; // stays busy until the page changes
  }

  return (
    <section className="rounded-2xl border-2 border-destructive/50 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-semibold tracking-tight text-destructive">Delete account</h2>
        <InfoTip label="About deleting your account">
          This closes your whole Koetap account and removes everything in it for good. Deactivating a store or a cashier
          is reversible; this is not.
        </InfoTip>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-sm text-muted-foreground">
          Permanently deletes your account and your business: {plural(impact.stores, "store")}, {plural(impact.products, "product")},
          all cashier accounts and {plural(impact.sales, "sale")}. This can&apos;t be undone.
        </p>
        <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
          <Trash2 />
          Delete my account
        </Button>
      </div>

      {open && (
        <TypeToConfirmDialog
          title="Delete your account?"
          expected={expected}
          confirmLabel="Delete my account"
          onClose={() => setOpen(false)}
          onConfirm={confirmDelete}
          description={
            <>
              <p>
                This permanently deletes <strong className="text-foreground">{expected}</strong> and everything in it:
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                <li>
                  {plural(impact.stores, "store")} and {plural(impact.products, "product")}
                </li>
                <li>every cashier account</li>
                <li>{plural(impact.sales, "sale")} and their full history</li>
                <li>your sign-in and all uploaded images</li>
              </ul>
              <p>It can&apos;t be undone. If you might want a copy of your sales, export them from Reports first.</p>
            </>
          }
        />
      )}
    </section>
  );
}
