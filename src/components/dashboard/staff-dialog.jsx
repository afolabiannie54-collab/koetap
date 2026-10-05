"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/ui/koetap/form-field";
import { PasswordInput } from "@/components/ui/koetap/password-input";
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
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/staff";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";

// Add (no member) or edit (member given). Mounted only while open, so it starts fresh every time.
export function StaffDialog({ storeId, member, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(member);
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // When editing, the password is only changed if something was typed.
  const needsPassword = !editing || form.password !== "";
  const schema = {
    name: [rules.required("Full name"), rules.maxLength(100, "Full name")],
    email: [rules.required("Email"), rules.email()],
    password: needsPassword
      ? [rules.required("Password"), rules.minLength(PASSWORD_MIN, "Password"), rules.maxLength(PASSWORD_MAX, "Password")]
      : [],
    confirmPassword: needsPassword
      ? [rules.required("Confirm the password"), rules.matches("password", "Passwords do not match")]
      : [],
  };
  const { errors, onBlur, validate, setServerError } = useFormValidation(schema, form, { idPrefix: "s-" });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const url = editing
      ? `/api/stores/${storeId}/staff/${member.id}`
      : `/api/stores/${storeId}/staff`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setServerError(data.field || "form", data.error || "Could not save the cashier");
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
          <DialogTitle>{editing ? "Edit cashier" : "Add cashier"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this cashier's details. Leave the password blank to keep it as it is."
              : "Cashiers can sign in and use the POS for this store only."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField id="s-name" label="Full name" error={errors.name}>
            {(a11y) => <Input {...a11y} value={form.name} onChange={update("name")} onBlur={onBlur("name")} />}
          </FormField>
          <FormField id="s-email" label="Email" error={errors.email}>
            {(a11y) => (
              <Input
                {...a11y}
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={update("email")}
                onBlur={onBlur("email")}
              />
            )}
          </FormField>
          <FormField
            id="s-password"
            label={editing ? "New password" : "Password"}
            optional={editing}
            error={errors.password}
            hint={`At least ${PASSWORD_MIN} characters.`}
          >
            {(a11y) => (
              <PasswordInput
                {...a11y}
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                onBlur={onBlur("password")}
              />
            )}
          </FormField>
          <FormField
            id="s-confirmPassword"
            label={editing ? "Confirm new password" : "Confirm password"}
            error={errors.confirmPassword}
          >
            {(a11y) => (
              <PasswordInput
                {...a11y}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                onBlur={onBlur("confirmPassword")}
              />
            )}
          </FormField>

          {errors.form && <FormError>{errors.form}</FormError>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Saving..." : editing ? "Save changes" : "Add cashier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
