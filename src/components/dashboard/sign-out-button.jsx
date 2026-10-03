"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAllHeldOrders } from "@/lib/held-orders";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      title="Sign out"
      className="text-slate-400 hover:bg-slate-800 hover:text-white"
      onClick={() => {
        // An owner who used the POS on this device shouldn't leave held sales behind.
        clearAllHeldOrders();
        signOut({ callbackUrl: "/login" });
      }}
    >
      <LogOut />
    </Button>
  );
}
