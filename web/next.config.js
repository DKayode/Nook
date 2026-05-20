const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Disable in dev and against localhost — SW cache turns every iteration into a
  // "did the new code ship?" mystery. Real HTTPS deploys still get it.
  disable:
    process.env.NODE_ENV === "development" ||
    (process.env.NEXTAUTH_URL ?? "").includes("localhost"),
  register: true,
  workboxOptions: {
    // skipWaiting + clientsClaim + cleanupOutdatedCaches together = each deploy's
    // new SW takes over immediately for open tabs and wipes the old cache, so users
    // don't get stuck on a stale dashboard after we ship new components.
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    navigateFallbackDenylist: [/^\/api\//, /^\/sign-in/, /^\/verify-request/],
    runtimeCaching: [
      // Auth + bank/api callbacks must hit the network every time. Caching 4xx or
      // bouncing methods would silently break sign-in, sync, callbacks, etc.
      { urlPattern: /^\/api\/auth\/.*/, handler: "NetworkOnly" },
      { urlPattern: /^\/api\/.*/, handler: "NetworkOnly" },

      // App pages (anything HTML the user navigates to) — fetch fresh while online,
      // fall back to cache only when offline. Short maxAge so even cached copies don't
      // outlive the next deploy long.
      {
        urlPattern: ({ request, url }) =>
          request.mode === "navigate" && !url.pathname.startsWith("/api"),
        handler: "NetworkFirst",
        options: {
          cacheName: "nook-pages-v2",
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
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
