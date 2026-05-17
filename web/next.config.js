const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Disable in dev AND when running against localhost — SW cache turns every iteration
  // into a "did the new code ship?" mystery. Real HTTPS deploys still get it.
  disable:
    process.env.NODE_ENV === "development" ||
    (process.env.NEXTAUTH_URL ?? "").includes("localhost"),
  register: true,
  workboxOptions: {
    skipWaiting: true,
    // Auth + bank API calls must hit the network every time. The PWA SW caching 4xx or
    // bouncing methods would silently break sign-in, sync, callbacks, etc.
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/api\/auth\/.*/,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^\/api\/.*/,
        handler: "NetworkOnly",
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
