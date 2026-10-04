import { DM_Sans } from "next/font/google";

// Loaded through Next's font optimisation: Google's font, served from our own domain at build time,
// so there is no flash of a different font and no extra request to Google.
export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
