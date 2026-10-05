"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KTooltip } from "@/components/ui/koetap/tooltip";

// A password box with a show/hide button, so a typo is easy to spot before it locks someone out.
export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={`pr-11 ${className ?? ""}`} {...props} />
      <KTooltip label={label} align="end" className="absolute top-1/2 right-1.5 -translate-y-1/2">
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={label}
          aria-pressed={visible}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </KTooltip>
    </div>
  );
}
