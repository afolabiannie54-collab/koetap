"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/auth/form-error";
import { Label } from "@/components/ui/label";

// For things that can't be undone. The button stays off until the person types the exact name of what they are
// deleting, so it can't be done by a stray click. Mount it only while it should be open (it starts fresh each time).
//
//   {open && (
//     <TypeToConfirmDialog
//       title="Delete Kemi's Store?" description={<>...</>} expected="Kemi's Store"
//       confirmLabel="Delete store" onClose={() => setOpen(false)}
//       onConfirm={async () => { ...; return error message or "" }}   // "" means it worked
//     />
//   )}
export function TypeToConfirmDialog({ title, description, expected, confirmLabel = "Delete permanently", onConfirm, onClose }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const matches = typed === expected;

  async function submit(e) {
    e.preventDefault();
    if (!matches || busy) return;
    setBusy(true);
    setError("");
    const problem = await onConfirm();
    // A successful delete usually navigates away, so the dialog stays busy until the page changes.
    if (problem) {
      setError(problem);
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-error-soft text-error-ink">
            <TriangleAlert className="size-5" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">{description}</div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="confirm-name">
              To confirm, type <span className="rounded bg-muted px-1.5 py-0.5 font-bold">{expected}</span>
            </Label>
            <Input
              id="confirm-name"
              autoFocus
              autoComplete="off"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setError("");
              }}
              aria-invalid={error ? true : undefined}
            />
          </div>

          {error && <FormError>{error}</FormError>}

          <DialogFooter>
            <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" loading={busy} disabled={!matches}>
              {busy ? "Deleting..." : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
