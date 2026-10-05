"use client";

import { useCallback, useSyncExternalStore } from "react";

// Whether a desktop sidebar is collapsed to icons. Remembered per sidebar in localStorage, and read with
// useSyncExternalStore so the server render (always expanded) can't mismatch the browser.
const listeners = new Set();
const subscribe = (onChange) => {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

export function useSidebarCollapsed(key) {
  const storageKey = `koetap-sidebar-${key}`;
  const collapsed = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey) === "1";
      } catch {
        return false;
      }
    },
    () => false
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
