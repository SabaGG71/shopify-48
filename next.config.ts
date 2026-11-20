import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The light blue page is now "/" and the lime page is "/demo". Old links keep working.
  async redirects() {
    return [
      { source: "/demo-1", destination: "/demo", permanent: false },
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
