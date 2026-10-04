"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SetupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName }),
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
    <AuthShell heading="Almost there" subtext="What's your business called?">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="sr-only">
            Business name
          </Label>
          <Input
            id="businessName"
            required
            autoFocus
            placeholder="e.g. Ada's Provisions"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="h-14 rounded-2xl px-5 text-lg md:text-lg"
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={loading}>
          {loading ? "Finishing..." : "Finish Setup"}
        </Button>
      </form>
    </AuthShell>
  );
}
