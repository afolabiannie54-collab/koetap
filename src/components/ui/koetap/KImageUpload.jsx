"use client";

import { useId, useRef, useState } from "react";
import { CircleAlert, ImagePlus, LoaderCircle, X } from "lucide-react";
import { FadeImage } from "@/components/ui/koetap/fade-image";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, imageThumb } from "@/lib/images";
import { cn } from "@/lib/utils";

// Photos from a phone are often 4-8MB. Anything bigger than this, or wider than MAX_SIDE, is shrunk in the browser
// before it is sent (a logo or a product picture never needs more than that), which also keeps it under the
// upload limit. GIFs are sent as they are, so they keep their animation.
const SHRINK_ABOVE_BYTES = 2.5 * 1024 * 1024;
const MAX_SIDE = 2000;
const HARD_LIMIT_BYTES = 25 * 1024 * 1024; // refuse to even try anything larger than this

// Tells the server an uploaded image was not kept, so it can delete it right away. The server only deletes images that
// no store or product uses, so it is always safe to call; failures are ignored (the daily cleanup catches strays).
export function discardImage(url) {
  if (!url) return;
  fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }), keepalive: true }).catch(() => {});
}

async function prepare(file) {
  if (file.type === "image/gif") return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // can't read it here; let the server decide
  }
  const longest = Math.max(bitmap.width, bitmap.height);
  if (file.size <= SHRINK_ABOVE_BYTES && longest <= MAX_SIDE) {
    bitmap.close?.();
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  // JPEGs stay JPEG; PNG/WebP become WebP (keeps transparency, much smaller). If the browser can't make WebP, send the original.
  const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob || blob.type !== type) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + (type === "image/jpeg" ? ".jpg" : ".webp"), { type });
}

// One image: click (or drop a file) to choose, it uploads straight away, and onChange gets the new URL (or null when
// removed). Used for the store logo and for product pictures. Everything is optional: no image is a normal state.
export function KImageUpload({
  value,
  onChange,
  label,
  hint,
  shape = "square",
  size = 120,
  optional = false,
  disabled = false,
  onUploadingChange,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const round = shape === "circle";
  const whole = shape === "logo"; // show the whole image, uncropped, in a rounded square

  function setBusy(busy) {
    setUploading(busy);
    onUploadingChange?.(busy);
  }

  async function handleFile(file) {
    if (!file || disabled) return;
    setError("");

    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > HARD_LIMIT_BYTES) {
      setError("That image is too large. Try one under 5MB.");
      return;
    }

    setBusy(true);
    try {
      const ready = await prepare(file);
      if (ready.size > MAX_IMAGE_BYTES) {
        setError("That image is still over 5MB. Try a smaller one.");
        return;
      }

      const body = new FormData();
      body.append("file", ready);
      let res;
      try {
        res = await fetch("/api/upload", { method: "POST", body });
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "The image couldn't be uploaded. Please try again.");
        return;
      }
      discardImage(value); // the one it replaces
      onChange(data.url);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = ""; // so choosing the same file again still fires
    }
  }

  const helperId = `${inputId}-helper`;
  const radius = round ? "rounded-full" : "rounded-2xl";

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor={inputId} className="text-sm leading-none font-medium">
            {label}
          </label>
          {optional && <span className="text-xs text-muted-foreground">Optional</span>}
        </div>
      )}

      <div className="relative inline-block" style={{ width: size, height: size }}>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          aria-label={value ? `Change ${label ?? "image"}` : `Upload ${label ?? "an image"}`}
          aria-describedby={error || hint ? helperId : undefined}
          className={cn(
            "group/upload relative flex size-full items-center justify-center overflow-hidden border-2 transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            radius,
            value ? "border-border bg-muted" : "border-dashed border-input bg-card hover:border-foreground hover:bg-accent",
            dragging && "scale-[1.03] border-foreground bg-accent",
            error && "border-destructive"
          )}
        >
          {value ? (
            <>
              <FadeImage
                src={imageThumb(value, { w: size * 2, h: size * 2, fit: whole ? "limit" : "fill" })}
                alt=""
                className={cn("size-full", whole ? "bg-white object-contain p-2" : "object-cover")}
              />
              {/* On hover or keyboard focus: a dark cover that says what a click does */}
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover/upload:opacity-100 group-focus-visible/upload:opacity-100">
                Change photo
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1 px-2 text-center text-muted-foreground transition-colors duration-200 group-hover/upload:text-foreground">
              <ImagePlus className={size >= 100 ? "size-7" : "size-5"} strokeWidth={1.5} />
              <span className="text-xs leading-tight font-medium">Click to upload</span>
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 flex animate-fadeIn items-center justify-center bg-background/75 backdrop-blur-[1px]">
              <LoaderCircle className="size-6 animate-spin" aria-label="Uploading" />
            </span>
          )}
        </button>

        {/* Removing the image is always possible: an image is never required */}
        {value && !uploading && !disabled && (
          <KTooltip label="Remove this image" side="top" align="end" className="absolute -top-1.5 -right-1.5 z-10">
            <button
              type="button"
              onClick={() => {
                setError("");
                discardImage(value);
                onChange(null);
              }}
              aria-label="Remove image"
              className="flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors duration-150 hover:bg-error-soft hover:text-error-ink"
            >
              <X className="size-3.5" />
            </button>
          </KTooltip>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div id={helperId} className="mt-1.5 max-w-xs">
        {error ? (
          <p role="alert" className="flex animate-slideUp items-start gap-1.5 text-xs font-medium text-error-ink">
            <CircleAlert className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{hint ?? "JPG, PNG or WebP. Max 5MB."}</p>
        )}
      </div>
    </div>
  );
}
