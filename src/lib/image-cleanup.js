import cloudinary, { isCloudinaryConfigured, publicIdFromUrl } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";

// An upload can be abandoned: someone picks a logo, then closes the wizard, removes it, or cancels the dialog.
// The file is already in Cloudinary but no store or product points at it. This finds those and deletes them.
//
// Safety: an image younger than GRACE_HOURS is never touched (it may be mid-way through a form that hasn't been saved
// yet), only images in our own koetap/ folder are considered, and nothing is deleted unless the database was read
// successfully first.
const GRACE_HOURS = 24;
const MAX_DELETE_PER_RUN = 500;

export async function sweepOrphanImages({ dryRun = false } = {}) {
  if (!isCloudinaryConfigured()) return { skipped: "Cloudinary isn't configured" };

  await connectDB();
  const [stores, products] = await Promise.all([
    Store.find({ logoUrl: { $nin: [null, ""] } }).select("logoUrl").lean(),
    Product.find({ imageUrl: { $nin: [null, ""] } }).select("imageUrl").lean(),
  ]);
  const used = new Set([...stores.map((s) => s.logoUrl), ...products.map((p) => p.imageUrl)].map(publicIdFromUrl).filter(Boolean));

  const cutoff = Date.now() - GRACE_HOURS * 60 * 60 * 1000;
  const orphans = [];
  let scanned = 0;
  let cursor;
  do {
    const page = await cloudinary.api.resources({ type: "upload", resource_type: "image", prefix: "koetap/", max_results: 500, next_cursor: cursor });
    for (const r of page.resources) {
      scanned++;
      if (!used.has(r.public_id) && new Date(r.created_at).getTime() < cutoff) orphans.push(r.public_id);
    }
    cursor = page.next_cursor;
  } while (cursor && orphans.length < MAX_DELETE_PER_RUN);

  const batch = orphans.slice(0, MAX_DELETE_PER_RUN);
  if (!dryRun) {
    for (let i = 0; i < batch.length; i += 100) {
      await cloudinary.api.delete_resources(batch.slice(i, i + 100));
    }
  }
  return { scanned, orphans: batch.length, deleted: dryRun ? 0 : batch.length };
}
