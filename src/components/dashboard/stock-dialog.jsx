"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/ui/koetap/form-field";
import { useToast } from "@/components/ui/koetap/toast";
import { Input } from "@/components/ui/input";
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
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";

const TYPES = [
  { value: "restock", label: "Restock (adds stock)" },
  { value: "correction", label: "Correction (adds stock)" },
  { value: "write-off", label: "Write-off (removes stock)" },
];

const SCHEMA = {
  quantity: [rules.required("Quantity"), rules.number({ min: 1, whole: true, label: "Quantity" })],
  reason: [rules.maxLength(200, "Reason")],
};

// Mounted only while open, so it starts fresh every time.
export function StockDialog({ storeId, product, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ type: "restock", quantity: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const { errors, onBlur, validate, setServerError } = useFormValidation(SCHEMA, form, { idPrefix: "a-" });

  const qty = Number(form.quantity);
  const validQty = form.quantity !== "" && Number.isInteger(qty) && qty >= 1;
  const preview = validQty ? Math.max(0, product.stock + (form.type === "write-off" ? -qty : qty)) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await fetch(`/api/stores/${storeId}/products/${product.id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type, quantity: qty, reason: form.reason }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setServerError(data.field || "form", data.error || "Could not adjust stock");
      return;
    }

    toast.success(`Stock updated for ${product.name}`);
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
          <FormField id="a-current" label="Current stock">
            {(a11y) => <Input {...a11y} value={product.stock} readOnly disabled />}
          </FormField>

          <FormField id="a-type" label="Adjustment type" error={errors.type}>
            {(a11y) => (
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                <SelectTrigger {...a11y} className="w-full">
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
            )}
          </FormField>

          <FormField
            id="a-quantity"
            label="Quantity"
            error={errors.quantity}
            hint={preview !== null ? `Stock will go from ${product.stock} to ${preview}.` : undefined}
          >
            {(a11y) => (
              <Input
                {...a11y}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                onBlur={onBlur("quantity")}
              />
            )}
          </FormField>

          <FormField id="a-reason" label="Reason" optional error={errors.reason}>
            {(a11y) => (
              <Input
                {...a11y}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                onBlur={onBlur("reason")}
                maxLength={200}
                placeholder="e.g. New delivery from supplier"
              />
            )}
          </FormField>

          {errors.form && <FormError>{errors.form}</FormError>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Saving..." : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
