"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { useToast } from "@/components/ui/koetap/toast";

export function BusinessActions({ businessId, name, isActive, plan }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [busy, setBusy] = useState(false);

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
      {confirmDialog}
    </>
  );
}
