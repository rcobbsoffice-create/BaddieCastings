/** @type {import('next').NextConfig} */

// Set STATIC_EXPORT=true for Capacitor / mobile builds only.
// Vercel uses Next.js server natively — no static export needed there.
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true,
  },
  experimental: {
    // Force SWC so Expo's babel.config.js (Metro-only) doesn't conflict
    forceSwcTransforms: true,
  },
};

export default nextConfig;
