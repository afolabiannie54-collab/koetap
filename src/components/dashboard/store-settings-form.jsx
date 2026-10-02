"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/stores";

export function StoreSettingsForm({ store }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: store.name,
    address: store.address,
    currency: store.currency,
    lowStockThreshold: String(store.lowStockThreshold),
    accentColor: store.accentColor,
    receiptFooter: store.receiptFooter,
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setSaving(true);

    const res = await fetch(`/api/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lowStockThreshold: Number(form.lowStockThreshold) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setStatus({ type: "error", message: data.error || "Could not save changes" });
      return;
    }
    setStatus({ type: "success", message: "Changes saved" });
    router.refresh();
  }

  async function toggleActive() {
    setStatus({ type: "", message: "" });
    setToggling(true);

    // Deactivating uses DELETE (soft delete); reactivating is a PATCH.
    const res = store.isActive
      ? await fetch(`/api/stores/${store.id}`, { method: "DELETE" })
      : await fetch(`/api/stores/${store.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
    setToggling(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: data.error || "Could not update the store" });
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="s-name">Store name</Label>
          <Input id="s-name" required value={form.name} onChange={update("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-address">Address</Label>
          <Input id="s-address" value={form.address} onChange={update("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="s-currency">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(currency) => setForm({ ...form, currency })}
            >
              <SelectTrigger id="s-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-threshold">Low stock threshold</Label>
            <Input
              id="s-threshold"
              type="number"
              min="0"
              step="1"
              required
              value={form.lowStockThreshold}
              onChange={update("lowStockThreshold")}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-color">Accent color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick accent color"
              value={/^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "#4f46e5"}
              onChange={update("accentColor")}
              className="h-8 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            <Input
              id="s-color"
              value={form.accentColor}
              onChange={update("accentColor")}
              placeholder="#4F46E5"
              maxLength={7}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-footer">Receipt footer</Label>
          <Input
            id="s-footer"
            value={form.receiptFooter}
            onChange={update("receiptFooter")}
            placeholder="Thank you for shopping with us!"
          />
        </div>

        {status.message && (
          <p
            role={status.type === "error" ? "alert" : "status"}
            className={
              status.type === "error"
                ? "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                : "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            }
          >
            {status.message}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          {store.isActive ? "Deactivate store" : "Reactivate store"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {store.isActive
            ? "Deactivating hides the store from selling. Its products and sales history are kept."
            : "This store is inactive. Reactivate it to use it again."}
        </p>
        <Button
          type="button"
          variant={store.isActive ? "destructive" : "outline"}
          disabled={toggling}
          onClick={toggleActive}
        >
          {toggling ? "Working..." : store.isActive ? "Deactivate store" : "Reactivate store"}
        </Button>
      </div>
    </div>
  );
}
