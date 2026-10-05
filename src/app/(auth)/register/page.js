"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/koetap/form-field";
import { PasswordInput } from "@/components/ui/koetap/password-input";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/staff";

const SCHEMA = {
  name: [rules.required("Your name"), rules.maxLength(100, "Your name")],
  businessName: [rules.required("Business name"), rules.maxLength(100, "Business name")],
  email: [rules.required("Email"), rules.email()],
  password: [rules.required("Password"), rules.minLength(PASSWORD_MIN, "Password"), rules.maxLength(PASSWORD_MAX, "Password")],
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", businessName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { errors, onBlur, validate, setServerError } = useFormValidation(SCHEMA, form);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.error || "Registration failed";
      // "already registered" belongs on the email field; anything else is about the form as a whole
      if (/email/i.test(message) && /(exist|registered|taken|use)/i.test(message)) setServerError("email", message);
      else setError(message);
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (result?.error) {
      // Account exists but auto sign-in failed, so send them to log in manually.
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      heading="Create your account"
      subtext="Start your own POS in minutes"
      footer={<>By creating an account you agree to Koetap&apos;s Terms of Service and Privacy Policy.</>}
    >
      <GoogleButton label="Continue with Google" callbackUrl="/register" />

      <OrDivider>or continue with email</OrDivider>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField id="name" label="Your name" error={errors.name}>
          {(a11y) => (
            <Input {...a11y} autoComplete="name" value={form.name} onChange={update("name")} onBlur={onBlur("name")} />
          )}
        </FormField>
        <FormField id="businessName" label="Business name" error={errors.businessName}>
          {(a11y) => (
            <Input
              {...a11y}
              placeholder="e.g. Ada's Provisions"
              value={form.businessName}
              onChange={update("businessName")}
              onBlur={onBlur("businessName")}
            />
          )}
        </FormField>
        <FormField id="email" label="Email" error={errors.email}>
          {(a11y) => (
            <Input
              {...a11y}
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              value={form.email}
              onChange={update("email")}
              onBlur={onBlur("email")}
            />
          )}
        </FormField>
        <FormField id="password" label="Password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
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

        {error && <FormError>{error}</FormError>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
