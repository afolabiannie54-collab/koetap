"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Fades and lifts its content in the first time it scrolls into view. `delay` (ms) staggers siblings.
export function Reveal({ as: Tag = "div", delay = 0, from, className, style, children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-from={from} className={cn("reveal", className)} style={{ "--reveal-delay": `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
