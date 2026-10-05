"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { FormField } from "@/components/ui/koetap/form-field";
import { useToast } from "@/components/ui/koetap/toast";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { CATEGORY_MAX } from "@/lib/categories-shared";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";

const SCHEMA = { name: [rules.required("Category name"), rules.maxLength(CATEGORY_MAX, "Category name")] };

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Where the owner creates, renames and deletes product categories. The product form then offers
// exactly these in a dropdown, so nobody types a category out by hand again.
export function CategoryManager({ storeId, categories, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [form, setForm] = useState({ name: "" });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // { id, name } while renaming a row
  const [editError, setEditError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const { errors, onBlur, validate, setServerError } = useFormValidation(SCHEMA, form, { idPrefix: "cat-" });

  const base = `/api/stores/${storeId}/categories`;

  async function addCategory(e) {
    e.preventDefault();
    if (!validate()) return;

    setAdding(true);
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name }),
    });
    const data = await res.json().catch(() => ({}));
    setAdding(false);

    if (!res.ok) {
      setServerError(data.field || "form", data.error || "Could not add the category");
      return;
    }
    toast.success(`${data.category.name} added`);
    setForm({ name: "" });
    router.refresh();
    document.getElementById("cat-name")?.focus();
  }

  async function saveRename(category) {
    const name = editing.name.trim();
    if (!name) return setEditError("Category name is required");
    if (name.length > CATEGORY_MAX) return setEditError(`Category name must be ${CATEGORY_MAX} characters or fewer`);
    if (name === category.name) return setEditing(null);

    setBusyId(category.id);
    const res = await fetch(`${base}/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok) return setEditError(data.error || "Could not rename the category");
    toast.success(`Renamed to ${name}`);
    setEditing(null);
    router.refresh();
  }

  async function remove(category) {
    const inUse = category.count > 0;
    const ok = await confirm({
      title: `Delete "${category.name}"?`,
      description: inUse
        ? `${plural(category.count, "product")} use${category.count === 1 ? "s" : ""} it. They are kept and simply become uncategorised.`
        : "No products use it, so nothing else changes.",
      confirmLabel: "Delete category",
      destructive: true,
    });
    if (!ok) return;

    setBusyId(category.id);
    const res = await fetch(`${base}/${category.id}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not delete the category");
      return;
    }
    toast.success(`${category.name} deleted`);
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Product categories</DialogTitle>
          <DialogDescription>
            Create the categories you sell under, then pick one when you add a product. Cashiers can filter the POS by them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={addCategory} noValidate>
          <FormField id="cat-name" label="New category" error={errors.name}>
            {(a11y) => (
              <div className="flex gap-2">
                <Input
                  {...a11y}
                  autoFocus
                  autoComplete="off"
                  placeholder="e.g. Drinks"
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  onBlur={onBlur("name")}
                />
                <Button type="submit" loading={adding} className="shrink-0">
                  <Plus />
                  Add
                </Button>
              </div>
            )}
          </FormField>
        </form>

        {categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Add your first one above, for example Drinks or Snacks."
            size="sm"
          />
        ) : (
          <ul className="max-h-[40dvh] divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {categories.map((c) => {
              const isEditing = editing?.id === c.id;
              return (
                <li key={c.id} className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-150 hover:bg-accent/50">
                  {isEditing ? (
                    <div className="min-w-0 flex-1">
                      <Input
                        autoFocus
                        aria-label={`Rename ${c.name}`}
                        aria-invalid={editError ? true : undefined}
                        value={editing.name}
                        onChange={(e) => {
                          setEditing({ ...editing, name: e.target.value });
                          setEditError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveRename(c);
                          }
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            setEditing(null);
                            setEditError("");
                          }
                        }}
                        className="h-9"
                      />
                      {editError && <p role="alert" className="mt-1 text-xs font-medium text-error-ink">{editError}</p>}
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{plural(c.count, "product")}</p>
                    </div>
                  )}

                  {isEditing ? (
                    <>
                      <KTooltip label="Save name" align="end">
                        <Button size="icon-sm" loading={busyId === c.id} aria-label="Save name" onClick={() => saveRename(c)}>
                          <Check />
                        </Button>
                      </KTooltip>
                      <KTooltip label="Cancel" align="end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Cancel renaming"
                          onClick={() => {
                            setEditing(null);
                            setEditError("");
                          }}
                        >
                          <X />
                        </Button>
                      </KTooltip>
                    </>
                  ) : (
                    <>
                      <KTooltip label="Rename" align="end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Rename ${c.name}`}
                          onClick={() => {
                            setEditing({ id: c.id, name: c.name });
                            setEditError("");
                          }}
                        >
                          <Pencil />
                        </Button>
                      </KTooltip>
                      <KTooltip label="Delete" align="end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete ${c.name}`}
                          disabled={busyId === c.id}
                          onClick={() => remove(c)}
                          className="text-error-ink hover:bg-error-soft"
                        >
                          <Trash2 />
                        </Button>
                      </KTooltip>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
