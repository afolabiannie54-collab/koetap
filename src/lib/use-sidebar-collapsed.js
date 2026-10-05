"use client";

import { useCallback, useSyncExternalStore } from "react";

// Whether a desktop sidebar is collapsed to icons. Remembered per sidebar in localStorage, and read with
// useSyncExternalStore so the server render can't mismatch the browser.
// `defaultCollapsed` is what a first-time visitor gets; once they press the toggle, their choice wins.
const listeners = new Set();
const subscribe = (onChange) => {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

export function useSidebarCollapsed(key, defaultCollapsed = false) {
  const storageKey = `koetap-sidebar-${key}`;
  const collapsed = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const saved = localStorage.getItem(storageKey);
        return saved === null ? defaultCollapsed : saved === "1";
      } catch {
        return defaultCollapsed;
      }
    },
    () => defaultCollapsed
  );

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(storageKey, collapsed ? "0" : "1");
    } catch {
      // Storage blocked: nothing to remember the choice with.
    }
    listeners.forEach((l) => l());
  }, [storageKey, collapsed]);

  return [collapsed, toggle];
}
