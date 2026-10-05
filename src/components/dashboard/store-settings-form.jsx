"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/auth/form-error";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { FormField } from "@/components/ui/koetap/form-field";
import { useToast } from "@/components/ui/koetap/toast";
import { CURRENCIES } from "@/lib/stores";
import { readableTextColor } from "@/lib/pos";
import { useFormValidation } from "@/lib/use-form-validation";
import { HEX_COLOR, rules } from "@/lib/validate";

const SCHEMA = {
  name: [rules.required("Store name"), rules.maxLength(100, "Store name")],
  address: [rules.maxLength(200, "Address")],
  lowStockThreshold: [rules.required("Low stock alert"), rules.number({ min: 0, whole: true, label: "Low stock alert" })],
  accentColor: [rules.hexColor()],
  receiptFooter: [rules.maxLength(300, "Receipt footer")],
};

function Section({ title, description, children }) {
  return (
    <section className="grid gap-6 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="max-w-xl space-y-4">{children}</div>
    </section>
  );
}

export function StoreSettingsForm({ store }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const initial = {
    name: store.name,
    address: store.address,
    currency: store.currency,
    lowStockThreshold: String(store.lowStockThreshold),
    accentColor: store.accentColor,
    receiptFooter: store.receiptFooter,
  };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { errors, onBlur, validate } = useFormValidation(SCHEMA, form, { idPrefix: "s-" });

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError("");
  };
  const accentValid = HEX_COLOR.test(form.accentColor);
  // Saving is only offered when something has actually changed
  const dirty = Object.keys(initial).some((k) => form[k] !== initial[k]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setError("");
    setSaving(true);

    const res = await fetch(`/api/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lowStockThreshold: Number(form.lowStockThreshold) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Could not save changes");
      return;
    }
    toast.success("Changes saved");
    router.refresh();
  }

  async function toggleActive() {
    if (
      store.isActive &&
      !(await confirm({
        title: `Deactivate ${store.name}?`,
        description:
          "Sales stop on this store straight away and its POS shows as unavailable. Products, staff and sales history are kept, and you can reactivate the store whenever you like.",
        confirmLabel: "Deactivate store",
        destructive: true,
      }))
    ) {
      return;
    }

    setError("");
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
      setError(data.error || "Could not update the store");
      return;
    }
    toast.success(store.isActive ? `${store.name} deactivated` : `${store.name} reactivated`);
    router.refresh();
  }

  return (
    <div className="animate-contentIn">
      <form onSubmit={handleSubmit} noValidate>
        <Section title="Store details" description="The basics shown across your store and on receipts.">
          <FormField id="s-name" label="Store name" error={errors.name}>
            {(a11y) => <Input {...a11y} value={form.name} onChange={update("name")} onBlur={onBlur("name")} />}
          </FormField>
          <FormField id="s-address" label="Address" optional error={errors.address}>
            {(a11y) => <Input {...a11y} value={form.address} onChange={update("address")} onBlur={onBlur("address")} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="s-currency" label="Currency">
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
              id="s-lowStockThreshold"
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
        </Section>

        <Section title="Branding" description="How your POS looks to your cashiers, and what your receipts say.">
          <FormField id="s-accentColor" label="Accent colour" optional error={errors.accentColor}>
            {(a11y) => (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick accent colour"
                    value={accentValid ? form.accentColor : "#0a0a0a"}
                    onChange={update("accentColor")}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-input bg-background p-1 transition-colors duration-150 hover:border-muted-foreground/60"
                  />
                  <Input
                    {...a11y}
                    value={form.accentColor}
                    onChange={update("accentColor")}
                    onBlur={onBlur("accentColor")}
                    placeholder="#0A0A0A"
                    maxLength={7}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground">Preview</span>
                  <span
                    className="inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition-colors duration-200"
                    style={
                      accentValid
                        ? { background: form.accentColor, color: readableTextColor(form.accentColor) }
                        : { background: "var(--primary)", color: "var(--primary-foreground)" }
                    }
                  >
                    Complete Sale
                  </span>
                  {!accentValid && <span className="text-xs text-muted-foreground">Leave empty for Koetap black</span>}
                </div>
              </>
            )}
          </FormField>

          <FormField id="s-receiptFooter" label="Receipt footer" optional error={errors.receiptFooter}>
            {(a11y) => (
              <Textarea
                {...a11y}
                value={form.receiptFooter}
                onChange={update("receiptFooter")}
                onBlur={onBlur("receiptFooter")}
                placeholder="Thank you for shopping with us!"
                rows={3}
              />
            )}
          </FormField>
        </Section>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button type="submit" size="lg" loading={saving} disabled={!dirty}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {!dirty && !error && <span className="text-sm text-muted-foreground">No changes to save</span>}
          {error && <FormError>{error}</FormError>}
        </div>
      </form>

      {/* Danger zone */}
      <section className="mt-12 rounded-2xl border border-destructive/40 p-6">
        <h2 className="text-base font-semibold tracking-tight text-destructive">Danger zone</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-lg">
            <h3 className="text-sm font-medium">{store.isActive ? "Deactivate this store" : "Reactivate this store"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {store.isActive
                ? "Deactivating stops sales on this store. Its products and sales history are kept."
                : "This store is inactive. Reactivate it to use it again."}
            </p>
          </div>
          <Button type="button" variant={store.isActive ? "destructive" : "secondary"} loading={toggling} onClick={toggleActive}>
            {toggling ? "Working..." : store.isActive ? "Deactivate store" : "Reactivate store"}
          </Button>
        </div>
      </section>

      {confirmDialog}
    </div>
  );
}
