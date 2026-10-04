"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KInput } from "@/components/ui/koetap/KInput";

const HOME = { superadmin: "/admin", owner: "/dashboard", cashier: "/pos" };

const DEACTIVATED_MESSAGE = "Your account has been deactivated. Contact your store owner.";

const CREDENTIALS_ERRORS = {
  google_account: "This account was created with Google. Please sign in with Google instead.",
  deactivated: DEACTIVATED_MESSAGE,
  suspended: "Your account has been suspended. Contact support.",
};

// accessDenied: the user was bounced back from Google sign-in because the account is deactivated.
export default function LoginForm({ accessDenied = false }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(accessDenied ? DEACTIVATED_MESSAGE : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
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
    <AuthShell
      heading="Welcome back"
      subtext="Sign in to your Koetap account"
      footer={null}
    >
      <GoogleButton label="Sign in with Google" callbackUrl="/login" />

      <OrDivider>or continue with email</OrDivider>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <KInput
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <KInput
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
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
