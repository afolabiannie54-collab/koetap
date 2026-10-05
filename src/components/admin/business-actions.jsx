"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { useToast } from "@/components/ui/koetap/toast";
import { TypeToConfirmDialog } from "@/components/ui/koetap/type-to-confirm-dialog";
import { plural } from "@/lib/utils";

// impact: { stores, sales } so the delete warning says what goes with the business.
export function BusinessActions({ businessId, name, isActive, plan, impact = { stores: 0, sales: 0 } }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function update(changes, prompt, successText) {
    if (!(await confirm(prompt))) return;

    setBusy(true);
    const res = await fetch(`/api/admin/businesses/${businessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      toast.error(data.error || "Could not update the business");
      return;
    }
    toast.success(successText(data));
    router.refresh();
  }

  async function deleteForever() {
    let res;
    try {
      res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: name }),
      });
    } catch {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Could not delete the business.";
    toast.success(`${name} was deleted`);
    router.push("/admin/businesses");
    return ""; // stays busy until the page changes
  }

  const nextPlan = plan === "paid" ? "free" : "paid";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isActive ? "destructive" : "default"}
          disabled={busy}
          onClick={() =>
            isActive
              ? update(
                  { isActive: false },
                  {
                    title: `Suspend "${name}"?`,
                    description: "This switches off all of its stores and cashiers, and its owner is locked out until you reinstate it.",
                    confirmLabel: "Suspend",
                    destructive: true,
                  },
                  (d) => `Suspended. ${d.cascade.stores} stores and ${d.cascade.cashiers} cashiers switched off.`
                )
              : update(
                  { isActive: true },
                  {
                    title: `Reinstate "${name}"?`,
                    description:
                      "The owner can sign in again. The stores and cashiers this suspension switched off are switched back on. Anything the owner had turned off themselves stays off.",
                    confirmLabel: "Reinstate",
                  },
                  (d) => `Reinstated. ${d.restored.stores} stores and ${d.restored.cashiers} cashiers switched back on.`
                )
          }
        >
          {isActive ? "Deactivate business" : "Reactivate business"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            update(
              { plan: nextPlan },
              {
                title: `Change "${name}" to the ${nextPlan} plan?`,
                description: `It is on the ${plan} plan now. No payment is taken: this only updates the plan.`,
                confirmLabel: "Change plan",
              },
              () => `Plan changed to ${nextPlan}.`
            )
          }
        >
          Change plan to {nextPlan === "paid" ? "Paid" : "Free"}
        </Button>
      </div>

      {/* Deleting is a deliberate second step: only a suspended business can be deleted */}
      <div className="mt-6 border-t border-border pt-5">
        {isActive ? (
          <p className="text-sm text-muted-foreground">To delete this business permanently, suspend it first.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-lg text-sm text-muted-foreground">
              This business is suspended. You can now delete it for good: its owner, cashiers, stores, products and sales.
            </p>
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete permanently
            </Button>
          </div>
        )}
      </div>

      {deleteOpen && (
        <TypeToConfirmDialog
          title={`Delete ${name} permanently?`}
          expected={name}
          confirmLabel="Delete business"
          onClose={() => setDeleteOpen(false)}
          onConfirm={deleteForever}
          description={
            <>
              <p>
                This permanently deletes <strong className="text-foreground">{name}</strong>:
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                <li>its owner account and every cashier</li>
                <li>{plural(impact.stores, "store")}, with all their products and stock history</li>
                <li>{plural(impact.sales, "sale")} and their full history</li>
                <li>all uploaded images</li>
              </ul>
              <p>It can&apos;t be undone. A short record that it was deleted is kept in the deletion log.</p>
            </>
          }
        />
      )}
      {confirmDialog}
    </>
  );
}
