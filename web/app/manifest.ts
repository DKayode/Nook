import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nook",
    short_name: "Nook",
    description: "Track, categorize, and analyze expenses from your bank CSVs.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    orientation: "portrait",
    categories: ["finance", "productivity"],
    icons: [
      // SVG works in modern browsers + Chromium-based PWAs. PNGs below are needed for TWA
      // (Bubblewrap requires raster icons) and iOS apple-touch-icon. Generate them once with:
      //   npx pwa-asset-generator public/icons/icon.svg public/icons \
      //     --background "#0b0b0f" --opaque false --padding "0"
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
