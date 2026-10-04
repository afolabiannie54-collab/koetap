"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Replaces the browser's plain window.confirm() with a proper dialog.
//
//   const [confirm, confirmDialog] = useConfirm();
//   ...
//   if (!(await confirm({ title: "Deactivate this product?", description: "...", destructive: true }))) return;
//   ...
//   return (<>{...}{confirmDialog}</>);
//
// confirm() resolves to true (confirmed) or false (cancelled, Escape, or clicking outside).
export function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOptions(next);
      }),
    []
  );

  function settle(result) {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }

  const dialog = options ? (
    <Dialog open onOpenChange={(open) => !open && settle(false)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          {options.destructive && (
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-error-soft text-error-ink">
              <AlertTriangle className="size-5" />
            </div>
          )}
          <DialogTitle>{options.title}</DialogTitle>
          {options.description && (
            <DialogDescription className="whitespace-pre-line">{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => settle(false)}>
            {options.cancelLabel ?? "Cancel"}
          </Button>
          <Button variant={options.destructive ? "destructive" : "default"} onClick={() => settle(true)}>
            {options.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return [confirm, dialog];
}
