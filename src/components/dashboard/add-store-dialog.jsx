"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { FormField } from "@/components/ui/koetap/form-field";
import { useToast } from "@/components/ui/koetap/toast";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";
import { CURRENCIES } from "@/lib/stores";

const EMPTY = { name: "", address: "", currency: "NGN", lowStockThreshold: "5" };

const SCHEMA = {
  name: [rules.required("Store name"), rules.maxLength(100, "Store name")],
  address: [rules.maxLength(200, "Address")],
  lowStockThreshold: [rules.required("Low stock alert"), rules.number({ min: 0, whole: true, label: "Low stock alert" })],
};

export function AddStoreDialog({ label = "Add Store", variant = "default", size = "default" }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { errors, onBlur, validate } = useFormValidation(SCHEMA, form, { idPrefix: "store-" });

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError("");
  };

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setForm(EMPTY);
      setError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField id="store-name" label="Store name" error={errors.name}>
            {(a11y) => (
              <Input {...a11y} value={form.name} onChange={update("name")} onBlur={onBlur("name")} placeholder="e.g. Main Branch" />
            )}
          </FormField>
          <FormField id="store-address" label="Address" optional error={errors.address}>
            {(a11y) => <Input {...a11y} value={form.address} onChange={update("address")} onBlur={onBlur("address")} />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="store-currency" label="Currency">
              {(a11y) => (
                <Select value={form.currency} onValueChange={(currency) => setForm({ ...form, currency })}>
                  <SelectTrigger {...a11y} className="w-full">
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
              )}
            </FormField>
            <FormField
              id="store-lowStockThreshold"
              label="Low stock alert at"
              error={errors.lowStockThreshold}
              hint="Warn when a product falls to this many."
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.lowStockThreshold}
                  onChange={update("lowStockThreshold")}
                  onBlur={onBlur("lowStockThreshold")}
                />
              )}
            </FormField>
          </div>

          {error && <FormError>{error}</FormError>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Creating..." : "Create store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
