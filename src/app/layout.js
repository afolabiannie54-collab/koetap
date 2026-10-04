import "./globals.css";
import { dmSans } from "@/lib/fonts";
import { ToastProvider } from "@/components/ui/koetap/toast";

export const metadata = {
  title: "Koetap",
  description: "Your store. Your POS.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Runs before the page paints, so a dark-mode user never sees a white flash.
// The choice is stored under "koetap-theme" ("light" or "dark"); with no choice it follows the device,
// including when the device switches between light and dark while the app is open.
const themeScript = `
(function () {
  var root = document.documentElement;
  function apply(dark) {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }
  var query = window.matchMedia("(prefers-color-scheme: dark)");
  var stored = null;
  try { stored = localStorage.getItem("koetap-theme"); } catch (e) {}
  apply(stored ? stored === "dark" : query.matches);
  query.addEventListener("change", function (e) {
    var chosen = null;
    try { chosen = localStorage.getItem("koetap-theme"); } catch (err) {}
    if (!chosen) apply(e.matches);
  });
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full scroll-smooth antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
