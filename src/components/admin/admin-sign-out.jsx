"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSignOut() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Sign out"
      title="Sign out"
      className="text-white/70 hover:bg-white/10 hover:text-white"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut />
    </Button>
  );
}
