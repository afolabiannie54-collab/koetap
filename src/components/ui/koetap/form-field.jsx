import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// One labelled form control with its help text and its error, laid out and announced the same way everywhere.
//
//   <FormField id="p-name" label="Name" error={errors.name} hint="Shown on receipts">
//     {(a11y) => <Input {...a11y} value={...} onChange={...} onBlur={...} />}
//   </FormField>
//
// `a11y` carries id, aria-invalid and aria-describedby for the control. The error slides in below the control
// in red with an icon; a hint shows in quiet grey while there is no error.
export function FormField({ id, label, optional = false, error, hint, className, labelClassName, children }) {
  const helperId = `${id}-helper`;
  const message = error || hint;
  const a11y = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": message ? helperId : undefined,
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={id} className={cn("flex items-baseline justify-between gap-3", labelClassName)}>
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
        </Label>
      )}

      {typeof children === "function" ? children(a11y) : children}

      {message && (
        <p
          id={helperId}
          role={error ? "alert" : undefined}
          className={cn(
            "flex items-start gap-1.5 text-xs",
            error ? "animate-slideUp font-medium text-error-ink" : "text-muted-foreground"
          )}
        >
          {error && <CircleAlert className="mt-px size-3.5 shrink-0" />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
