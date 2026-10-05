"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/koetap/form-field";
import { PasswordInput } from "@/components/ui/koetap/password-input";
import { useFormValidation } from "@/lib/use-form-validation";
import { rules } from "@/lib/validate";

const HOME = { superadmin: "/admin", owner: "/dashboard", cashier: "/pos" };

const DEACTIVATED_MESSAGE = "Your account has been deactivated. Contact your store owner.";

const CREDENTIALS_ERRORS = {
  google_account: "This account was created with Google. Please sign in with Google instead.",
  deactivated: DEACTIVATED_MESSAGE,
  suspended: "Your account has been suspended. Contact support.",
};

const SCHEMA = {
  email: [rules.required("Email"), rules.email()],
  password: [rules.required("Password")],
};

// accessDenied: the user was bounced back from Google sign-in because the account is deactivated.
export default function LoginForm({ accessDenied = false, initialError = "" }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(accessDenied ? DEACTIVATED_MESSAGE : initialError);
  const [loading, setLoading] = useState(false);
  const { errors, onBlur, validate } = useFormValidation(SCHEMA, form);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setError("");
    setLoading(true);

    const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    if (res?.error) {
      // res.code carries the specific reason thrown by the credentials provider.
      setError(CREDENTIALS_ERRORS[res.code] ?? "Invalid email or password");
      setLoading(false);
      return;
    }

    const session = await getSession();
    router.push(HOME[session?.user?.role] ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthShell heading="Welcome back" subtext="Sign in to your Koetap account" footer={null}>
      <GoogleButton label="Sign in with Google" callbackUrl="/login" />

      <OrDivider>or continue with email</OrDivider>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        <FormField id="password" label="Password" error={errors.password}>
          {(a11y) => (
            <PasswordInput
              {...a11y}
              autoComplete="current-password"
              value={form.password}
              onChange={update("password")}
              onBlur={onBlur("password")}
            />
          )}
        </FormField>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
