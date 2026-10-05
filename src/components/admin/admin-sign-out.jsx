"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KTooltip } from "@/components/ui/koetap/tooltip";

export function AdminSignOut({ tipSide = "top" }) {
  return (
    <KTooltip label="Sign out" side={tipSide} align="end">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Sign out"
      className="text-white/70 hover:bg-white/10 hover:text-white"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut />
    </Button>
    </KTooltip>
  );
}
