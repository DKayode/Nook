const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Disable in dev and against localhost — SW cache turns every iteration into a
  // "did the new code ship?" mystery. Real HTTPS deploys still get it.
  disable:
    process.env.NODE_ENV === "development" ||
    (process.env.NEXTAUTH_URL ?? "").includes("localhost"),
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    navigateFallbackDenylist: [/^\/api\//, /^\/sign-in/, /^\/verify-request/],
    runtimeCaching: [
      // API calls — never cache. Sign-in callbacks, CSV imports, etc.
      { urlPattern: /^\/api\/auth\/.*/, handler: "NetworkOnly" },
      { urlPattern: /^\/api\/.*/, handler: "NetworkOnly" },

      // App HTML pages — NetworkOnly so a new component (pie chart, etc.) is visible
      // immediately after deploy. Trade-off: no offline page fallback. Acceptable for
      // a self-hosted expense tracker that needs the network for everything anyway.
      {
        urlPattern: ({ request, url }) =>
          request.mode === "navigate" && !url.pathname.startsWith("/api"),
        handler: "NetworkOnly",
      },

      // Static chunks have content-hashed URLs — safe to cache forever.
      {
        urlPattern: /^.*\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "nook-next-static",
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },

      // Icons / images.
      {
        urlPattern: /^.*\/icons\/.*\.(png|svg)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "nook-icons",
          expiration: { maxEntries: 16, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ["localhost:3001"] } },
  async headers() {
    return [
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
