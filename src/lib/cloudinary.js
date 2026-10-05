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
