import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the workspace root: a stray package-lock.json in the home directory was
  // making Next infer the wrong root. This keeps file tracing scoped to the app.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
