"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// An image that fades in once it has loaded, instead of popping in half-drawn. It also copes with an image the
// browser already had cached (which can finish loading before React starts listening).
export function FadeImage({ src, alt = "", className, ...props }) {
  const [loaded, setLoaded] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- images are Cloudinary URLs, already optimised there
    <img
      ref={(el) => {
        if (el?.complete && el.naturalWidth > 0) setLoaded(true);
      }}
      src={src}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={cn("transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)}
      {...props}
    />
  );
}
