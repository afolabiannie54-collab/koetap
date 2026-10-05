"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/ui/koetap/form-field";
import { useToast } from "@/components/ui/koetap/toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_MAX } from "@/lib/categories-shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";

// Values for the two special rows in the category dropdown
const NONE = "__none__";
const CREATE = "__create__";

const SCHEMA = {
  name: [rules.required("Product name"), rules.maxLength(100, "Product name")],
  sku: [rules.maxLength(50, "SKU")],
  price: [rules.required("Price"), rules.number({ min: 0, label: "Price" })],
  costPrice: [rules.number({ min: 0, label: "Cost price" })],
  stock: [rules.required("Stock quantity"), rules.number({ min: 0, whole: true, label: "Stock quantity" })],
  lowStockThreshold: [rules.number({ min: 0, whole: true, label: "Low stock threshold" })],
};

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
  const [loading, setLoading] = useState(false);
  // "Create new category" reveals a box here; the category is created together with the product
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const schema = {
    ...SCHEMA,
    newCategory: creating ? [rules.required("Category name"), rules.maxLength(CATEGORY_MAX, "Category name")] : [],
  };
  const { errors, onBlur, validate, setServerError } = useFormValidation(
    schema,
    { ...form, newCategory },
    { idPrefix: "p-" }
  );

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    let category = form.category;
    if (creating) {
      const made = await fetch(`/api/stores/${storeId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      const madeData = await made.json().catch(() => ({}));
      if (!made.ok) {
        setLoading(false);
        setServerError("newCategory", madeData.error || "Could not create the category");
        return;
      }
      category = madeData.category.name;
    }

    const url = editing
      ? `/api/stores/${storeId}/products/${product.id}`
      : `/api/stores/${storeId}/products`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, category }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setServerError(data.field || "form", data.error || "Could not save the product");
      return;
    }

    toast.success(editing ? `${form.name.trim()} updated` : `${form.name.trim()} added`);
    onClose();
    router.refresh();
  }

  const numberProps = (field, step) => ({
    type: "number",
    inputMode: "decimal",
    min: "0",
    step,
    value: form[field],
    onChange: update(field),
    onBlur: onBlur(field),
  });

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
          <FormField id="p-name" label="Name" error={errors.name}>
            {(a11y) => <Input {...a11y} value={form.name} onChange={update("name")} onBlur={onBlur("name")} />}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField id="p-category" label="Category" optional hint={categories.length === 0 && !creating ? "Create your first category here." : undefined}>
              {(a11y) => (
                <Select
                  value={creating ? CREATE : form.category || NONE}
                  onValueChange={(v) => {
                    if (v === CREATE) {
                      setCreating(true);
                      setTimeout(() => document.getElementById("p-newCategory")?.focus(), 50);
                      return;
                    }
                    setCreating(false);
                    setNewCategory("");
                    setForm({ ...form, category: v === NONE ? "" : v });
                  }}
                >
                  <SelectTrigger {...a11y} className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CREATE}>+ Create new category</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField id="p-sku" label="SKU" optional error={errors.sku}>
              {(a11y) => <Input {...a11y} value={form.sku} onChange={update("sku")} onBlur={onBlur("sku")} />}
            </FormField>
          </div>

          {creating && (
            <FormField id="p-newCategory" label="New category name" error={errors.newCategory} className="animate-slideUp">
              {(a11y) => (
                <Input
                  {...a11y}
                  autoComplete="off"
                  placeholder="e.g. Drinks"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onBlur={onBlur("newCategory")}
                />
              )}
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField id="p-price" label="Price" error={errors.price}>
              {(a11y) => <Input {...a11y} {...numberProps("price", "0.01")} />}
            </FormField>
            <FormField id="p-costPrice" label="Cost price" optional error={errors.costPrice}>
              {(a11y) => <Input {...a11y} {...numberProps("costPrice", "0.01")} />}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="p-stock"
              label="Stock quantity"
              error={errors.stock}
              hint={editing ? "Changes are recorded in the inventory log." : undefined}
            >
              {(a11y) => <Input {...a11y} {...numberProps("stock", "1")} inputMode="numeric" />}
            </FormField>
            <FormField
              id="p-lowStockThreshold"
              label="Low stock threshold"
              optional
              error={errors.lowStockThreshold}
              hint={`Store default: ${storeThreshold}`}
            >
              {(a11y) => (
                <Input {...a11y} {...numberProps("lowStockThreshold", "1")} inputMode="numeric" placeholder={String(storeThreshold)} />
              )}
            </FormField>
          </div>

          {errors.form && <FormError>{errors.form}</FormError>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Saving..." : editing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
