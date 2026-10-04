"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// An input with its helper text. `error` (a message) turns the border red and shows the message
// below it; `hint` is quiet grey help shown while there is no error.
export function KInput({ error, hint, className, id, ...props }) {
  const autoId = useId();
  const helperId = `${id ?? autoId}-helper`;
  const message = error || hint;

  return (
    <div className="w-full">
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? helperId : undefined}
        className={className}
        {...props}
      />
      {message && (
        <p
          id={helperId}
          role={error ? "alert" : undefined}
          className={cn("mt-1.5 text-xs", error ? "text-destructive" : "text-muted-foreground")}
        >
          {message}
        </p>
      )}
    </div>
  );
}
