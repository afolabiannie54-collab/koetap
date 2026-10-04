"use client";

import { signOut } from "next-auth/react";
import { clearAllHeldOrders } from "@/lib/held-orders";

export function SuspendedSignOut() {
  return (
    <button
      type="button"
      onClick={() => {
        clearAllHeldOrders();
        signOut({ callbackUrl: "/login" });
      }}
      className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
    >
      Sign out
    </button>
  );
}
