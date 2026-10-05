"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/koetap/form-field";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";

const SCHEMA = { businessName: [rules.required("Business name"), rules.maxLength(100, "Business name")] };

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ businessName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { errors, onBlur, validate } = useFormValidation(SCHEMA, form);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName: form.businessName }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      heading="Almost there"
      subtext="What's your business called?"
      footer={
        <>
          Wrong account?{" "}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id="businessName" label="Business name" labelClassName="sr-only" error={errors.businessName}>
          {(a11y) => (
            <Input
              {...a11y}
              autoFocus
              placeholder="e.g. Ada's Provisions"
              value={form.businessName}
              onChange={(e) => {
                setForm({ businessName: e.target.value });
                setError("");
              }}
              onBlur={onBlur("businessName")}
              className="h-14 rounded-2xl px-5 text-lg md:text-lg"
            />
          )}
        </FormField>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" size="lg" className="h-14 w-full text-base" loading={loading}>
          {loading ? "Finishing..." : "Finish Setup"}
        </Button>
      </form>
    </AuthShell>
  );
}
