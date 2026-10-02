"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      title="Sign out"
      className="text-slate-400 hover:bg-slate-800 hover:text-white"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut />
    </Button>
  );
}
