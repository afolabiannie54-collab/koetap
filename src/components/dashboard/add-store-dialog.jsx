"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/stores";

const EMPTY = { name: "", address: "", currency: "NGN", lowStockThreshold: "5" };

export function AddStoreDialog({ label = "Add Store", variant = "default" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setForm(EMPTY);
      setError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lowStockThreshold: Number(form.lowStockThreshold) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not create the store");
      return;
    }

    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a store</DialogTitle>
          <DialogDescription>
            Each store has its own products, staff and sales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store name</Label>
            <Input
              id="store-name"
              required
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. Main Branch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-address">Address (optional)</Label>
            <Input id="store-address" value={form.address} onChange={update("address")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store-currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(currency) => setForm({ ...form, currency })}
              >
                <SelectTrigger id="store-currency" className="w-full">
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
              <Label htmlFor="store-threshold">Low stock threshold</Label>
              <Input
                id="store-threshold"
                type="number"
                min="0"
                step="1"
                required
                value={form.lowStockThreshold}
                onChange={update("lowStockThreshold")}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
