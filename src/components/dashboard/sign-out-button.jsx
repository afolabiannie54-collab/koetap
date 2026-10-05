"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { clearAllHeldOrders } from "@/lib/held-orders";

export function SignOutButton({ className }) {
  return (
    <KTooltip label="Sign out" align="end">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Sign out"
        className={className}
        onClick={() => {
          // An owner who used the POS on this device shouldn't leave held sales behind.
          clearAllHeldOrders();
          signOut({ callbackUrl: "/login" });
        }}
      >
        <LogOut />
      </Button>
    </KTooltip>
  );
}
