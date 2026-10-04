"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KInput } from "@/components/ui/koetap/KInput";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", businessName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
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
      footer={
        <>
          By creating an account you agree to Koetap&apos;s Terms of Service and Privacy Policy.
        </>
      }
    >
      <GoogleButton label="Continue with Google" callbackUrl="/register" />

      <OrDivider>or continue with email</OrDivider>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <KInput id="name" required autoComplete="name" value={form.name} onChange={update("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <KInput
            id="businessName"
            required
            placeholder="e.g. Ada's Provisions"
            value={form.businessName}
            onChange={update("businessName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <KInput
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@business.com"
            value={form.email}
            onChange={update("email")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <KInput
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters."
            value={form.password}
            onChange={update("password")}
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
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
