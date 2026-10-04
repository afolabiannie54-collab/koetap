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
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/staff";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const found = {};
    if (!form.name.trim()) found.name = "Full name is required";
    if (!form.email.trim()) found.email = "Email is required";
    else if (!EMAIL.test(form.email.trim())) found.email = "Enter a valid email address";

    // When editing, the password is only changed if something was typed.
    const needsPassword = !editing || form.password !== "";
    if (needsPassword) {
      if (!form.password) found.password = "Password is required";
      else if (form.password.length < PASSWORD_MIN) {
        found.password = `Password must be at least ${PASSWORD_MIN} characters`;
      } else if (form.password.length > PASSWORD_MAX) {
        found.password = `Password must be at most ${PASSWORD_MAX} characters`;
      }
      if (!form.confirmPassword) found.confirmPassword = "Confirm the password";
      else if (form.confirmPassword !== form.password) {
        found.confirmPassword = "Passwords do not match";
      }
    }
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

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
      setErrors({ [data.field || "form"]: data.error || "Could not save the cashier" });
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
          <Field id="s-name" label="Full name" error={errors.name}>
            <Input id="s-name" value={form.name} onChange={update("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field id="s-email" label="Email" error={errors.email}>
            <Input
              id="s-email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={update("email")}
              aria-invalid={!!errors.email}
            />
          </Field>
          <Field
            id="s-password"
            label={editing ? "New password (optional)" : "Password"}
            error={errors.password}
            hint={`At least ${PASSWORD_MIN} characters.`}
          >
            <Input
              id="s-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={update("password")}
              aria-invalid={!!errors.password}
            />
          </Field>
          <Field
            id="s-confirm"
            label={editing ? "Confirm new password" : "Confirm password"}
            error={errors.confirmPassword}
          >
            <Input
              id="s-confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
            />
          </Field>

          {errors.form && (
            <FormError>{errors.form}</FormError>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editing ? "Save changes" : "Add cashier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
