"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { useToast } from "@/components/ui/koetap/toast";
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

function Field({ id, label, error, hint, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Product name is required";
  if (form.price === "" || !(Number(form.price) >= 0)) errors.price = "Enter a price of 0 or more";
  if (form.costPrice !== "" && !(Number(form.costPrice) >= 0)) {
    errors.costPrice = "Cost price must be 0 or more";
  }
  const whole = (v) => Number.isInteger(Number(v)) && Number(v) >= 0;
  if (form.stock === "" || !whole(form.stock)) errors.stock = "Enter a whole number, 0 or more";
  if (form.lowStockThreshold !== "" && !whole(form.lowStockThreshold)) {
    errors.lowStockThreshold = "Enter a whole number, 0 or more";
  }
  return errors;
}

// Add (no product) or edit (product given). Mounted only while open, so it starts fresh every time.
export function ProductDialog({ storeId, product, storeThreshold, categories, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "",
    sku: product?.sku ?? "",
    price: product ? String(product.price) : "",
    costPrice: product?.costPrice != null ? String(product.costPrice) : "",
    stock: product ? String(product.stock) : "0",
    lowStockThreshold: product?.lowStockThreshold != null ? String(product.lowStockThreshold) : "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    const url = editing
      ? `/api/stores/${storeId}/products/${product.id}`
      : `/api/stores/${storeId}/products`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErrors({ [data.field || "form"]: data.error || "Could not save the product" });
      return;
    }

    toast.success(editing ? `${form.name.trim()} updated` : `${form.name.trim()} added`);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this product's details." : "Add a product to this store's catalogue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="p-name" label="Name" error={errors.name}>
            <Input id="p-name" value={form.name} onChange={update("name")} aria-invalid={!!errors.name} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field id="p-category" label="Category (optional)" error={errors.category}>
              <Input id="p-category" list="p-categories" value={form.category} onChange={update("category")} />
              <datalist id="p-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field id="p-sku" label="SKU (optional)" error={errors.sku}>
              <Input id="p-sku" value={form.sku} onChange={update("sku")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field id="p-price" label="Price" error={errors.price}>
              <Input
                id="p-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={update("price")}
                aria-invalid={!!errors.price}
              />
            </Field>
            <Field id="p-cost" label="Cost price (optional)" error={errors.costPrice}>
              <Input
                id="p-cost"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={update("costPrice")}
                aria-invalid={!!errors.costPrice}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              id="p-stock"
              label="Stock quantity"
              error={errors.stock}
              hint={editing ? "Changes are recorded in the inventory log." : undefined}
            >
              <Input
                id="p-stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={update("stock")}
                aria-invalid={!!errors.stock}
              />
            </Field>
            <Field
              id="p-threshold"
              label="Low stock threshold"
              error={errors.lowStockThreshold}
              hint={`Optional. Store default: ${storeThreshold}`}
            >
              <Input
                id="p-threshold"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={update("lowStockThreshold")}
                placeholder={String(storeThreshold)}
                aria-invalid={!!errors.lowStockThreshold}
              />
            </Field>
          </div>

          {errors.form && (
            <FormError>{errors.form}</FormError>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
