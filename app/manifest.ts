import type { MetadataRoute } from "next";

// Web app manifest: makes the site installable (Android shows a real install prompt,
// iOS 16.4+ honors name/icons/standalone via Add to Home Screen). Launching from the
// home screen opens straight into the dashboard with no browser chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The College Agent",
    short_name: "College Agent",
    description: "Your personal AI agent for all 4 years of college.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#2D7A3A",
    icons: [
      { src: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
