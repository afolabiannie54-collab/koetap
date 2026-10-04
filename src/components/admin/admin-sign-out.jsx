"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSignOut() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      title="Sign out"
      className="text-stone-600 hover:bg-amber-100 hover:text-stone-950"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut />
    </Button>
  );
}
