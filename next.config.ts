import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // /print-agent/[file] reads scripts/ at request time; make sure those
  // files ship with the serverless function on Vercel.
  outputFileTracingIncludes: {
    "/print-agent/**": ["./scripts/**"],
  },
};

export default nextConfig;
