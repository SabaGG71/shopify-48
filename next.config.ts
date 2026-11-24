import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The light blue page is the only landing page, at "/". The lime /demo page was removed;
  // its old links (and /demo-1, /demo-2) land on the same page on the main site.
  async redirects() {
    return [
      { source: "/demo", destination: "/", permanent: false },
      { source: "/demo/:path*", destination: "/:path*", permanent: false },
      { source: "/demo-1", destination: "/", permanent: false },
      { source: "/demo-2", destination: "/", permanent: false },
    ]
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
