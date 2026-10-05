import { v2 as cloudinary } from "cloudinary";

// Server-only. Image uploads go to Cloudinary; only the resulting URL is ever stored in MongoDB.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// False when the three server variables aren't set (a fresh checkout, or a deploy that is missing them), so the
// upload route can say so plainly instead of failing with a confusing error.
export const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export default cloudinary;

// The Cloudinary public id of an image we uploaded (everything after "/koetap/..." minus the extension), or null.
// Only images in our own koetap/ folder are ever touched, whatever URL is passed in.
export function publicIdFromUrl(url) {
  if (typeof url !== "string") return null;
  const i = url.indexOf("/koetap/");
  if (!url.includes("res.cloudinary.com") || i < 0) return null;
  return url.slice(i + 1).replace(/\.[a-z0-9]+$/i, "");
}

// Best-effort removal of images from Cloudinary. A failure here must never stop a deletion that has already
// happened in the database, so problems are logged and swallowed.
export async function destroyImages(urls) {
  if (!isCloudinaryConfigured()) return 0;
  const ids = [...new Set(urls.map(publicIdFromUrl).filter(Boolean))];
  for (let i = 0; i < ids.length; i += 100) {
    try {
      await cloudinary.api.delete_resources(ids.slice(i, i + 100));
    } catch (err) {
      console.error("Cloudinary cleanup failed:", err?.message ?? err);
    }
  }
  return ids.length;
}

// Removes everything under a folder such as "koetap/<businessId>", then the folder itself.
export async function destroyFolder(prefix) {
  if (!isCloudinaryConfigured() || !prefix.startsWith("koetap/")) return;
  try {
    await cloudinary.api.delete_resources_by_prefix(prefix);
    await cloudinary.api.delete_folder(prefix).catch(() => {});
  } catch (err) {
    console.error("Cloudinary folder cleanup failed:", err?.message ?? err);
  }
}
