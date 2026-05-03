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
};

export default nextConfig;
