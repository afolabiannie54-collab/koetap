"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  { value: "restock", label: "Restock (adds stock)" },
  { value: "correction", label: "Correction (adds stock)" },
  { value: "write-off", label: "Write-off (removes stock)" },
];

// Mounted only while open, so it starts fresh every time.
export function StockDialog({ storeId, product, onClose }) {
  const router = useRouter();
  const [type, setType] = useState("restock");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const qty = Number(quantity);
  const validQty = Number.isInteger(qty) && qty >= 1;
  const preview = validQty
    ? Math.max(0, product.stock + (type === "write-off" ? -qty : qty))
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validQty) {
      setErrors({ quantity: "Enter a whole number greater than 0" });
      return;
    }

    setErrors({});
    setLoading(true);
    const res = await fetch(`/api/stores/${storeId}/products/${product.id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, quantity: qty, reason }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErrors({ [data.field || "form"]: data.error || "Could not adjust stock" });
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="a-current">Current stock</Label>
            <Input id="a-current" value={product.stock} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="a-type">Adjustment type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="a-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p role="alert" className="text-xs text-destructive">{errors.type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="a-qty">Quantity</Label>
            <Input
              id="a-qty"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity ? (
              <p role="alert" className="text-xs text-destructive">{errors.quantity}</p>
            ) : (
              preview !== null && (
                <p className="text-xs text-muted-foreground">
                  Stock will go from {product.stock} to {preview}.
                </p>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="a-reason">Reason (optional)</Label>
            <Input
              id="a-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="e.g. New delivery from supplier"
            />
          </div>

          {errors.form && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
