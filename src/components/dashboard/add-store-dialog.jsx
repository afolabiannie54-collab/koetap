"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/auth/form-error";
import { useToast } from "@/components/ui/koetap/toast";
import { CURRENCIES } from "@/lib/stores";

const EMPTY = { name: "", address: "", currency: "NGN", lowStockThreshold: "5" };

export function AddStoreDialog({ label = "Add Store", variant = "default", size = "default" }) {
  const router = useRouter();
  const toast = useToast();
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

    toast.success(`${form.name.trim()} created`);
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Plus />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a store</DialogTitle>
          <DialogDescription>Each store has its own products, staff and sales.</DialogDescription>
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
              <Select value={form.currency} onValueChange={(currency) => setForm({ ...form, currency })}>
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
              <Label htmlFor="store-threshold">Low stock alert at</Label>
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

          {error && <FormError>{error}</FormError>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
