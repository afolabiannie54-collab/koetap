import { Button } from "@/components/ui/button";

// Koetap's names for the button styles. All of them: rounded-xl, DM Sans medium, a smooth hover,
// and a small press (scale 0.98). The styling itself lives in components/ui/button.jsx so every
// button in the app, including shadcn's own, looks the same.
const VARIANTS = {
  primary: "default", // black, white text
  secondary: "secondary", // white, black border
  destructive: "destructive", // white, red border and text
  ghost: "ghost", // transparent
};
const SIZES = { sm: "sm", md: "default", lg: "lg", icon: "icon" };

export function KButton({ variant = "primary", size = "md", ...props }) {
  return <Button variant={VARIANTS[variant] ?? variant} size={SIZES[size] ?? size} {...props} />;
}
