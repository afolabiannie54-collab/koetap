// Image rules shared by the upload route, the forms and the screens that show images (safe to import anywhere).

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// The file's real type from its first bytes, or null if it isn't one of the allowed images. The browser's declared
// type can be anything, so the upload route checks this too.
export function sniffImageType(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// Only our own Cloudinary images may be saved against a store or product, so nobody can point a logo at any
// address on the internet. Empty means "no image".
export function isAllowedImageUrl(url) {
  if (typeof url !== "string" || url.length > 500) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return false;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  return !cloud || parsed.pathname.startsWith(`/${cloud}/`);
}

// A smaller, optimised version of a Cloudinary image (Cloudinary makes it on the fly). Anything that isn't a
// Cloudinary upload URL comes back unchanged.
//   fit "fill":  crop to exactly w x h (product tiles, logo tiles)
//   fit "limit": shrink to fit inside w x h, never crop or enlarge (receipt logos)
export function imageThumb(url, { w, h, fit = "fill" } = {}) {
  if (!url || !url.includes("/image/upload/")) return url;
  const size = [w && `w_${w}`, h && `h_${h}`].filter(Boolean).join(",");
  const transform = `${fit === "fill" ? "c_fill,g_auto" : "c_limit"},${size},q_auto,f_auto`;
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}
