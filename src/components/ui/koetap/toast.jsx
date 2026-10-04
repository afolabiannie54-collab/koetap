"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Toasts slide in from the top right and leave by themselves after a few seconds.
//   const toast = useToast();   toast.success("Saved");   toast.error("Could not save");   toast.info("...");
const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, tone: "text-success" },
  error: { Icon: AlertCircle, tone: "text-error" },
  info: { Icon: Info, tone: "text-info" },
};

const LIFETIME_MS = 3800;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++counter.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]); // at most 4 on screen
      timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME_MS));
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map(({ id, type, message }) => {
          const { Icon, tone } = ICONS[type];
          return (
            <div
              key={id}
              role="status"
              className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-lg"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", tone)} />
              <p className="flex-1 text-sm font-medium [overflow-wrap:anywhere]">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const SILENT = { success() {}, error() {}, info() {} };

export function useToast() {
  return useContext(ToastContext) ?? SILENT;
}
