"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BusinessActions({ businessId, name, isActive, plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function update(changes, confirmText, successText) {
    if (!window.confirm(confirmText)) return;

    setMessage({ type: "", text: "" });
    setBusy(true);
    const res = await fetch(`/api/admin/businesses/${businessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Could not update the business" });
      return;
    }
    setMessage({ type: "success", text: successText(data) });
    router.refresh();
  }

  const nextPlan = plan === "paid" ? "free" : "paid";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isActive ? "destructive" : "default"}
          disabled={busy}
          onClick={() =>
            isActive
              ? update(
                  { isActive: false },
                  `Suspend "${name}"?\n\nThis switches off all of its stores and cashiers, and its owner is locked out until you reinstate it.`,
                  (d) => `Suspended. ${d.cascade.stores} stores and ${d.cascade.cashiers} cashiers switched off.`
                )
              : update(
                  { isActive: true },
                  `Reinstate "${name}"?\n\nThe owner can sign in again. Its stores and cashiers stay switched off until the owner turns them back on.`,
                  () => "Reinstated. The owner can sign in again."
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
              `Change "${name}" from the ${plan} plan to the ${nextPlan} plan?\n\nNo payment is taken: this only updates the plan.`,
              () => `Plan changed to ${nextPlan}.`
            )
          }
        >
          Change plan to {nextPlan === "paid" ? "Paid" : "Free"}
        </Button>
      </div>

      {message.text && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
