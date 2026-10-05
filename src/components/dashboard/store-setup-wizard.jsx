"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowLeft, ArrowRight, Package, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/auth/form-error";
import { PosPreview } from "@/components/dashboard/wizard/pos-preview";
import { WizardProgress } from "@/components/dashboard/wizard/wizard-progress";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { EmptyIcon } from "@/components/ui/koetap/empty-icon";
import { FormField } from "@/components/ui/koetap/form-field";
import { KImageUpload, discardImage } from "@/components/ui/koetap/KImageUpload";
import { useToast } from "@/components/ui/koetap/toast";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { Wordmark } from "@/components/ui/koetap/wordmark";
import { useFormValidation } from "@/lib/use-form-validation";
import { HEX_COLOR, rules } from "@/lib/validate";
import { CURRENCIES, formatMoney } from "@/lib/stores";
import { imageThumb } from "@/lib/images";
import { cn } from "@/lib/utils";

const STEPS = ["Details", "Branding", "Products"];
const CURRENCY_LABELS = { NGN: "NGN (₦)", USD: "USD ($)", GBP: "GBP (£)" };

// Black is "no accent colour": the store stays black and white, and adapts to dark mode by itself.
const SWATCHES = [
  ["", "Black"],
  ["#2563EB", "Blue"],
  ["#16A34A", "Green"],
  ["#D97706", "Amber"],
  ["#DC2626", "Red"],
  ["#7C3AED", "Purple"],
  ["#DB2777", "Pink"],
  ["#0891B2", "Cyan"],
];

const DETAILS_SCHEMA = {
  name: [rules.required("Store name"), rules.maxLength(100, "Store name")],
  address: [rules.maxLength(200, "Address")],
  lowStockThreshold: [rules.number({ min: 0, whole: true, label: "The alert level" })],
};
const BRANDING_SCHEMA = {
  customColor: [rules.hexColor()],
  receiptFooter: [rules.maxLength(300, "Receipt footer")],
};
const PRODUCT_SCHEMA = {
  name: [rules.required("Product name"), rules.maxLength(100, "Product name")],
  price: [rules.required("Price"), rules.number({ min: 0, label: "Price" })],
  stock: [rules.number({ min: 0, whole: true, label: "Stock" })],
  category: [rules.maxLength(50, "Category")],
};

// The small "add a product" form inside step 3. Simpler than the full product form: no SKU or cost price.
// Remounted (new key) after each add, so it starts empty and its validation starts fresh.
// onDirtyChange tells the wizard whether something has been typed, so Finish can warn before dropping a half-entered product.
function ProductDraftForm({ currency, onAdd, onCancel, onDirtyChange, onImageChange }) {
  const [draft, setDraft] = useState({ name: "", price: "", stock: "0", category: "", imageUrl: "" });
  const [uploading, setUploading] = useState(false);
  const { errors, onBlur, validate } = useFormValidation(PRODUCT_SCHEMA, draft, { idPrefix: "wp-" });
  const change = (patch) => {
    setDraft({ ...draft, ...patch });
    onDirtyChange(true);
    if ("imageUrl" in patch) onImageChange(patch.imageUrl);
  };
  const set = (k) => (e) => change({ [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    onAdd({
      name: draft.name.trim(),
      price: Number(draft.price),
      stock: draft.stock === "" ? 0 : Number(draft.stock),
      category: draft.category.trim(),
      imageUrl: draft.imageUrl,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="animate-slideUp space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <KImageUpload
        label="Product image"
        hint="Shown on your POS screen."
        size={96}
        optional
        value={draft.imageUrl || null}
        onChange={(url) => change({ imageUrl: url ?? "" })}
        onUploadingChange={setUploading}
      />
      <FormField id="wp-name" label="Product name" error={errors.name}>
        {(a11y) => <Input {...a11y} autoFocus placeholder="e.g. Ankara dress" value={draft.name} onChange={set("name")} onBlur={onBlur("name")} />}
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="wp-price" label={`Price (${currency})`} error={errors.price}>
          {(a11y) => (
            <Input {...a11y} type="number" inputMode="decimal" min="0" step="0.01" value={draft.price} onChange={set("price")} onBlur={onBlur("price")} />
          )}
        </FormField>
        <FormField id="wp-stock" label="Stock quantity" error={errors.stock}>
          {(a11y) => (
            <Input {...a11y} type="number" inputMode="numeric" min="0" step="1" value={draft.stock} onChange={set("stock")} onBlur={onBlur("stock")} />
          )}
        </FormField>
      </div>
      <FormField id="wp-category" label="Category" optional error={errors.category}>
        {(a11y) => <Input {...a11y} placeholder="e.g. Dresses" value={draft.category} onChange={set("category")} onBlur={onBlur("category")} />}
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          <Plus />
          Add
        </Button>
      </div>
    </form>
  );
}

function Wizard({ onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();

  // Everything the owner enters lives here until Finish. Nothing is saved before that.
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // which way the content slides: 1 forwards, -1 back
  const [details, setDetails] = useState({ name: "", address: "", currency: "NGN", lowStockThreshold: "5" });
  const [branding, setBranding] = useState({ logoUrl: "", accentColor: "", receiptFooter: "" });
  const [customColor, setCustomColor] = useState("");
  const [products, setProducts] = useState([]); // { id, name, price, stock, category, saved }
  const [adding, setAdding] = useState(false);
  const [draftKey, setDraftKey] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Set as soon as the store exists, so a retry after a product fails never creates the store twice.
  const [createdId, setCreatedId] = useState(null);
  const scrollRef = useRef(null);
  const draftImage = useRef(""); // the image on the product form that hasn't been added yet
  const draftDirty = useRef(false); // something typed into the product form that hasn't been added yet

  const detailsForm = useFormValidation(DETAILS_SCHEMA, details, { idPrefix: "w-" });
  const brandingForm = useFormValidation(BRANDING_SCHEMA, { customColor, receiptFooter: branding.receiptFooter }, { idPrefix: "w-" });

  const pristine =
    !details.name && !details.address && details.currency === "NGN" && details.lowStockThreshold === "5" &&
    !branding.logoUrl && !branding.accentColor && !branding.receiptFooter && products.length === 0;

  async function requestExit({ toDashboard = false } = {}) {
    if (submitting) return;
    if (createdId) {
      // The store already exists: leaving just means going to it.
      router.push(`/stores/${createdId}`);
      return;
    }
    if (!pristine) {
      const ok = await confirm({
        title: "Exit setup?",
        description: "Your progress will be lost.",
        confirmLabel: "Exit setup",
        cancelLabel: "Keep going",
        destructive: true,
      });
      if (!ok) return;
    }
    // Nothing was saved, so every image uploaded along the way goes too.
    [branding.logoUrl, draftImage.current, ...products.map((p) => p.imageUrl)].forEach(discardImage);
    onClose();
    if (toDashboard) router.push("/dashboard");
  }

  function go(next) {
    setDir(next >= step ? 1 : -1);
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0 }); // each step starts at its top, not wherever the last one was scrolled to
    setSubmitError("");
  }

  function next() {
    if (step === 0 && !detailsForm.validate()) return;
    if (step === 1 && !brandingForm.validate()) return;
    go(step + 1);
  }

  function pickSwatch(hex) {
    setBranding({ ...branding, accentColor: hex });
    setCustomColor("");
  }

  function changeCustom(value) {
    setCustomColor(value);
    if (HEX_COLOR.test(value.trim())) setBranding({ ...branding, accentColor: value.trim().toUpperCase() });
    else if (!value.trim()) setBranding({ ...branding, accentColor: "" }); // cleared: back to black, not stuck on the old colour
  }

  // Finish pressed while a product is half-typed: ask, rather than silently leaving it behind.
  async function attemptFinish(opts) {
    if (adding && draftDirty.current && !createdId) {
      const ok = await confirm({
        title: "Finish without that product?",
        description: "You started adding a product but haven't pressed Add. If you finish now, it won't be saved.",
        confirmLabel: "Finish anyway",
        cancelLabel: "Go back",
      });
      if (!ok) return;
    }
    finish(opts);
  }

  async function finish({ skipProducts = false } = {}) {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    let storeId = createdId;
    if (!storeId) {
      let res;
      try {
        res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: details.name,
            address: details.address,
            currency: details.currency,
            lowStockThreshold: details.lowStockThreshold === "" ? 5 : Number(details.lowStockThreshold),
            logoUrl: branding.logoUrl,
            accentColor: branding.accentColor,
            receiptFooter: branding.receiptFooter,
          }),
        });
      } catch {
        setSubmitError("Couldn't reach the server. Check your connection and try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Could not create the store. Please try again.");
        setSubmitting(false);
        return;
      }
      storeId = String(data.store._id);
      setCreatedId(storeId);
    }

    // Products one after another (each one also records its starting stock). Any that were already saved
    // on an earlier attempt are skipped, so retrying never duplicates anything.
    const pending = skipProducts ? [] : products.filter((p) => !p.saved);
    let failed = 0;
    let firstProblem = "";
    for (const p of pending) {
      try {
        const res = await fetch(`/api/stores/${storeId}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: p.name, price: p.price, stock: p.stock, category: p.category, imageUrl: p.imageUrl }),
        });
        if (res.ok) {
          setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, saved: true } : x)));
        } else {
          failed++;
          firstProblem ||= (await res.json().catch(() => ({}))).error || "";
        }
      } catch {
        failed++;
      }
    }

    if (failed > 0) {
      setSubmitError(
        `Your store was created, but ${failed} ${failed === 1 ? "product" : "products"} couldn't be added${firstProblem ? ` (${firstProblem})` : ""}. Press Finish Setup to try again, or go to your store and add them there.`
      );
      setSubmitting(false);
      return;
    }

    toast.success("Your store is ready! Start by opening your POS.");
    router.push(`/stores/${storeId}`);
    // The overlay is removed when the page changes, so it stays up (and the buttons stay busy) until then.
  }

  const accent = branding.accentColor;
  const wide = step === 1;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && requestExit()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            requestExit();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex animate-fadeIn flex-col bg-background outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Set up your store</DialogPrimitive.Title>

          {/* Top bar: the Koetap wordmark (back to the dashboard) and a way out */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
            <KTooltip label="Leave setup and go to your dashboard" side="bottom" align="start">
              <button type="button" onClick={() => requestExit({ toDashboard: true })} aria-label="Koetap dashboard" className="rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                <Wordmark size="sm" />
              </button>
            </KTooltip>
            <KTooltip label="Close setup. Nothing is saved until you finish." side="bottom" align="end">
              <Button type="button" variant="ghost" onClick={() => requestExit()}>
                <X />
                Exit setup
              </Button>
            </KTooltip>
          </header>

          <div className="shrink-0 px-4 pt-6 pb-2 sm:pt-8">
            <WizardProgress steps={STEPS} current={step} onGo={go} />
          </div>

          {/* The step. Keyed by step, so each one slides and fades in. */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full px-4 py-6 sm:py-8", wide ? "max-w-6xl" : "max-w-[560px]")}>
              <div key={step} className={dir >= 0 ? "animate-wizardNext" : "animate-wizardBack"}>
                {step === 0 && (
                  <form
                    id="w-step-details"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      next();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Let&apos;s set up your store</h1>
                      <p className="mt-1.5 text-muted-foreground">Tell us about your store</p>
                    </div>

                    <FormField id="w-name" label="Store name" error={detailsForm.errors.name}>
                      {(a11y) => (
                        <Input
                          {...a11y}
                          autoFocus
                          placeholder="e.g. Kemi's Fashion Store"
                          value={details.name}
                          onChange={(e) => setDetails({ ...details, name: e.target.value })}
                          onBlur={detailsForm.onBlur("name")}
                        />
                      )}
                    </FormField>
                    <FormField id="w-address" label="Address" optional error={detailsForm.errors.address}>
                      {(a11y) => (
                        <Input
                          {...a11y}
                          placeholder="e.g. 15 Broad Street, Lagos"
                          value={details.address}
                          onChange={(e) => setDetails({ ...details, address: e.target.value })}
                          onBlur={detailsForm.onBlur("address")}
                        />
                      )}
                    </FormField>
                    <FormField
                      id="w-currency"
                      label="Currency"
                      help="The currency your prices, sales and receipts are shown in."
                    >
                      {(a11y) => (
                        <Select value={details.currency} onValueChange={(currency) => setDetails({ ...details, currency })}>
                          <SelectTrigger {...a11y} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {CURRENCY_LABELS[c] ?? c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>
                    <FormField
                      id="w-lowStockThreshold"
                      label="Alert me when stock falls below"
                      optional
                      hint="You'll see a warning when any product's stock reaches this number."
                      error={detailsForm.errors.lowStockThreshold}
                    >
                      {(a11y) => (
                        <Input
                          {...a11y}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          value={details.lowStockThreshold}
                          onChange={(e) => setDetails({ ...details, lowStockThreshold: e.target.value })}
                          onBlur={detailsForm.onBlur("lowStockThreshold")}
                        />
                      )}
                    </FormField>
                  </form>
                )}

                {step === 1 && (
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-20">
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">Make it yours</h1>
                        <p className="mt-1.5 text-muted-foreground">Add your store&apos;s look and feel</p>
                      </div>

                      <KImageUpload
                        label="Store logo"
                        hint="Shown on your POS screen and receipts."
                        shape="logo"
                        size={120}
                        optional
                        value={branding.logoUrl || null}
                        onChange={(url) => setBranding({ ...branding, logoUrl: url ?? "" })}
                        onUploadingChange={setUploadingLogo}
                      />

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm leading-none font-medium">Brand colour</span>
                          <span className="text-xs text-muted-foreground">Optional</span>
                        </div>
                        <div role="radiogroup" aria-label="Brand colour" className="flex flex-wrap gap-3">
                          {SWATCHES.map(([hex, name]) => {
                            const selected = accent === hex && !customColor;
                            return (
                              <KTooltip key={name} label={name}>
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  aria-label={name}
                                  onClick={() => pickSwatch(hex)}
                                  style={{ background: hex || "#0A0A0A" }}
                                  className={cn(
                                    "size-10 rounded-full border border-black/10 transition-all duration-150 hover:scale-110 active:scale-95",
                                    selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                  )}
                                />
                              </KTooltip>
                            );
                          })}
                        </div>

                        <FormField
                          id="w-customColor"
                          label="Or use your own colour"
                          hint="A hex value like #7C3AED."
                          error={brandingForm.errors.customColor}
                        >
                          {(a11y) => (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                aria-label="Pick a custom colour"
                                value={HEX_COLOR.test(accent) ? accent : "#0a0a0a"}
                                onChange={(e) => changeCustom(e.target.value)}
                                className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-input bg-card p-1 transition-colors duration-150 hover:border-foreground"
                              />
                              <Input
                                {...a11y}
                                value={customColor}
                                onChange={(e) => changeCustom(e.target.value)}
                                onBlur={brandingForm.onBlur("customColor")}
                                placeholder="#7C3AED"
                                maxLength={7}
                              />
                            </div>
                          )}
                        </FormField>
                      </div>

                      <FormField
                        id="w-receiptFooter"
                        label="Receipt footer message"
                        optional
                        hint="Printed at the bottom of every receipt."
                        error={brandingForm.errors.receiptFooter}
                      >
                        {(a11y) => (
                          <Textarea
                            {...a11y}
                            rows={3}
                            placeholder="Thank you for shopping with us!"
                            value={branding.receiptFooter}
                            onChange={(e) => setBranding({ ...branding, receiptFooter: e.target.value })}
                            onBlur={brandingForm.onBlur("receiptFooter")}
                          />
                        )}
                      </FormField>
                    </div>

                    {/* Live preview, to the right of the form on large screens */}
                    <div className="rounded-3xl border-2 border-border p-5 sm:p-7 lg:sticky lg:top-2 lg:self-start">
                      <p className="mb-1 text-sm font-bold">Live preview</p>
                      <p className="mb-5 text-sm text-muted-foreground">This is how your POS and receipts will look.</p>
                      <div className="mx-auto max-w-md lg:max-w-none">
                        <PosPreview name={details.name} accent={accent} logoUrl={branding.logoUrl} footer={branding.receiptFooter} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Add your products</h1>
                      <p className="mt-1.5 text-muted-foreground">Add what you sell so your POS is ready to go</p>
                    </div>

                    {products.length === 0 && !adding ? (
                      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <EmptyIcon icon={Package} size="sm" />
                        <p className="text-lg font-bold">No products yet</p>
                        <p className="max-w-xs text-sm text-muted-foreground">Add a few now, or skip this and add them from your store whenever you like.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        {products.map((p) => (
                          <li key={p.id} className="flex animate-slideUp items-center gap-3 px-4 py-3">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, already optimised
                              <img src={imageThumb(p.imageUrl, { w: 80, h: 80 })} alt="" className="size-10 shrink-0 rounded-lg border border-border object-cover" />
                            ) : (
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{p.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {formatMoney(p.price, details.currency)} · {p.stock} in stock{p.category ? ` · ${p.category}` : ""}
                              </p>
                            </div>
                            {p.saved ? (
                              <span className="text-xs font-semibold text-success-ink">Added</span>
                            ) : (
                              <KTooltip label="Remove this product" align="end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Remove ${p.name}`}
                                  disabled={submitting}
                                  onClick={() => {
                                    discardImage(p.imageUrl);
                                    setProducts((list) => list.filter((x) => x.id !== p.id));
                                  }}
                                  className="text-muted-foreground hover:bg-error-soft hover:text-error-ink"
                                >
                                  <Trash2 />
                                </Button>
                              </KTooltip>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {adding ? (
                      <ProductDraftForm
                        key={draftKey}
                        currency={details.currency}
                        onDirtyChange={(d) => (draftDirty.current = d)}
                        onImageChange={(url) => (draftImage.current = url)}
                        onAdd={(p) => {
                          draftDirty.current = false;
                          draftImage.current = "";
                          setProducts((list) => [...list, { ...p, id: `${Date.now()}-${list.length}`, saved: false }]);
                          setDraftKey((k) => k + 1); // a fresh, empty form, ready for the next one
                        }}
                        onCancel={() => {
                          draftDirty.current = false;
                          discardImage(draftImage.current);
                          draftImage.current = "";
                          setAdding(false);
                        }}
                      />
                    ) : (
                      <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
                        <Plus />
                        Add Product
                      </Button>
                    )}

                    {submitError && <FormError>{submitError}</FormError>}
                  </div>
                )}

                {step !== 2 && submitError && <div className="mt-6"><FormError>{submitError}</FormError></div>}
              </div>

              {/* The way forward sits right under the step, lined up with the form (not in a bar far away at the bottom of the
                  screen). On phones it sticks to the bottom instead, so it is always within reach. */}
              <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-10 sm:max-w-[560px] sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <div className="flex items-center gap-3">
                  {step > 0 && !createdId && (
                    <Button type="button" variant="secondary" size="lg" onClick={() => go(step - 1)} disabled={submitting}>
                      <ArrowLeft />
                      Back
                    </Button>
                  )}

                  {step < 2 ? (
                    // On step 1 this is the form's submit button (it sits outside the form, so it points at the form by id), so pressing Enter in a field works.
                    <Button
                      type={step === 0 ? "submit" : "button"}
                      form={step === 0 ? "w-step-details" : undefined}
                      size="lg"
                      className="flex-1"
                      onClick={step === 0 ? undefined : next}
                      disabled={step === 1 && uploadingLogo}
                    >
                      Continue
                      <ArrowRight />
                    </Button>
                  ) : (
                    <Button type="button" size="lg" className="flex-1" loading={submitting} onClick={() => attemptFinish()}>
                      {submitting ? "Setting up..." : "Finish Setup"}
                    </Button>
                  )}
                </div>

                {step === 2 && (products.length === 0 || createdId) && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => attemptFinish({ skipProducts: true })}
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      {createdId ? "Go to my store" : "Skip for now"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>


          {confirmDialog}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// The button that opens the setup wizard. It replaces the old "Add Store" dialog everywhere.
// tip: a hover tip for the button. It goes around the button only, because the wizard's overlay must not sit inside a tooltip
// (events inside a portal bubble up through it, and the tip would pop up over the wizard).
//
// autoOpen: open by itself when the page loads. Used for an owner who has no store yet (a brand-new sign-up), whose very
// next step is to set one up. Closing it once means it stays closed for the rest of this browser session, so it never
// nags; the button still opens it.
const dismissListeners = new Set();
const subscribeDismissed = (onChange) => {
  dismissListeners.add(onChange);
  return () => dismissListeners.delete(onChange);
};
const DISMISSED_KEY = "koetap-setup-wizard-dismissed";

export function StoreSetupWizard({ label = "Add Store", variant = "default", size = "default", tip, autoOpen = false }) {
  const [manual, setManual] = useState(false);
  // Server snapshot "dismissed" so the server renders it closed; the browser then opens it right after the page loads.
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    () => {
      try {
        return sessionStorage.getItem(DISMISSED_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => true
  );
  const open = manual || (autoOpen && !dismissed);
  const close = () => {
    setManual(false);
    if (autoOpen) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, "1");
      } catch {
        // Storage blocked: it may open again on the next visit, which is fine.
      }
      dismissListeners.forEach((l) => l());
    }
  };

  return (
    <>
      <KTooltip label={tip} side="bottom" align="end">
        <Button variant={variant} size={size} onClick={() => setManual(true)}>
          <Plus />
          {label}
        </Button>
      </KTooltip>
      {/* Mounted only while open, so every time it opens it starts empty */}
      {open && <Wizard onClose={close} />}
    </>
  );
}
