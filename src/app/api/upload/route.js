import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api-auth";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, sniffImageType } from "@/lib/images";

export const runtime = "nodejs";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Uploads one image to Cloudinary and returns its URL. Only owners (and the super admin) may upload, and the file
// itself is never kept: the caller saves the returned URL against a store or a product.
export async function POST(request) {
  const { user, error } = await requireOwner();
  if (error) return error;

  if (!isCloudinaryConfigured()) {
    return fail("Image uploads aren't set up on this server yet.", 503);
  }

  // Turn away an obviously oversized body before reading it.
  const declared = Number(request.headers.get("content-length"));
  if (declared && declared > MAX_IMAGE_BYTES + 512 * 1024) {
    return fail("That image is too large. The maximum is 5MB.", 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("Send the image as multipart form data.");
  }

  const file = form.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return fail("No image was sent.");
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return fail("Only JPG, PNG, WebP or GIF images can be uploaded.");
  }
  if (file.size === 0) return fail("That file is empty.");
  if (file.size > MAX_IMAGE_BYTES) return fail("That image is too large. The maximum is 5MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  // The declared type can be anything; check the file really is an image.
  if (!sniffImageType(buffer)) return fail("That file isn't a valid image.");

  // One folder per business, so images are easy to find (and to remove) if a business is ever deleted.
  const folder = `koetap/${user.businessId ?? "platform"}`;

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (err, res) =>
        err ? reject(err) : resolve(res)
      );
      stream.end(buffer);
    });
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("Cloudinary upload failed:", err?.message ?? err);
    return fail("The image couldn't be uploaded right now. Please try again.", 502);
  }
}
