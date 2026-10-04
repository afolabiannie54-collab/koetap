"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { clearAllHeldOrders } from "@/lib/held-orders";

export function SuspendedSignOut() {
  return (
    <Button
      type="button"
      size="lg"
      className="mt-7 w-full"
      onClick={() => {
        clearAllHeldOrders();
        signOut({ callbackUrl: "/login" });
      }}
    >
      Sign out
    </Button>
  );
}
