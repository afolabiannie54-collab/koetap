"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// The page's real theme is the "dark" class on <html>, set by the script in app/layout.js before first paint.
// This reads that class, so it always agrees with what is on screen, and writes the visitor's choice
// to localStorage so it is remembered (until then the device's setting decides).
function subscribe(onChange) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains("dark");
const serverIsDark = () => false;

export function ThemeToggle({ className, variant = "ghost", size = "icon-sm", label = false }) {
  const dark = useSyncExternalStore(subscribe, isDark, serverIsDark);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("koetap-theme", next ? "dark" : "light");
    } catch {
      // Storage blocked: the choice still applies until the page is closed.
    }
  }

  const text = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant={variant}
      size={label ? "sm" : size}
      onClick={toggle}
      aria-label={text}
      title={text}
      className={className}
    >
      {dark ? <Sun /> : <Moon />}
      {label && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </Button>
  );
}
