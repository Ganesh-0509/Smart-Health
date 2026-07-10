/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for free Firebase Hosting (Spark plan) — opt-in via
  // `BUILD_STATIC=1 npm run build`, which emits a fully static `out/` dir.
  // The app is entirely client-rendered (client components + client-side
  // fetch/auth), so no SSR/Cloud Functions (Blaze plan) are needed.
  // Default builds (`npm run build`) are unchanged.
  ...(process.env.BUILD_STATIC === "1"
    ? { output: "export", images: { unoptimized: true } }
    : {}),
};

module.exports = nextConfig;
