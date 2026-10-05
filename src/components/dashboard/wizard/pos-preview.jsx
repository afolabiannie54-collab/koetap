import { readableTextColor } from "@/lib/pos";
import { imageThumb } from "@/lib/images";

// A small mock-up of the store's POS, drawn from what has been chosen so far: the header bar in the brand colour
// with the store's logo and name, a couple of product tiles, a button, and the receipt footer. It updates live as
// the colour, name and logo change. No colour chosen means black (white in dark mode), like the real POS.
export function PosPreview({ name, accent, logoUrl, footer }) {
  const bg = accent || "var(--foreground)";
  const fg = accent ? readableTextColor(accent) : "var(--background)";
  const storeName = name.trim() || "Your store";

  return (
    <div aria-hidden="true" className="select-none">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
        {/* header bar */}
        <div style={{ background: bg, color: fg }} className="flex items-center gap-3 px-5 py-4 transition-colors duration-300">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, already optimised
            <img src={imageThumb(logoUrl, { w: 64, h: 64, fit: "limit" })} alt="" className="size-10 rounded-lg bg-white object-contain p-0.5" />
          ) : (
            <span style={{ background: fg, color: bg }} className="flex size-10 items-center justify-center rounded-lg text-lg font-bold transition-colors duration-300">
              {storeName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-base font-bold">{storeName}</span>
          <span className="text-xs opacity-70">Point of sale</span>
        </div>

        {/* products and cart */}
        <div className="grid grid-cols-2 gap-3 p-5">
          {[
            ["Sample item", "₦1,200"],
            ["Another item", "₦850"],
          ].map(([n, price]) => (
            <div key={n} className="overflow-hidden rounded-xl border-2 border-input">
              <div className="flex h-20 items-center justify-center bg-muted text-3xl font-bold text-foreground/20">{n.charAt(0)}</div>
              <div className="flex items-center justify-between gap-1 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{n}</p>
                  <p className="text-base font-bold">{price}</p>
                </div>
                <span style={{ background: bg, color: fg }} className="flex size-8 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors duration-300">
                  +
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <div style={{ background: bg, color: fg }} className="rounded-xl py-3.5 text-center text-base font-bold transition-colors duration-300">
            Charge ₦2,050
          </div>
        </div>
      </div>

      {/* the receipt footer, as it prints */}
      <div className="mx-auto mt-5 w-4/5 rounded-lg border border-input bg-white px-4 py-4 text-center text-xs text-neutral-500 shadow-sm">
        <p className="font-semibold text-neutral-900">{storeName}</p>
        <p className="mt-1.5">{footer.trim() || "Thank you for shopping with us!"}</p>
      </div>
    </div>
  );
}
