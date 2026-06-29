import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + uses node fs — keep it (and postgres.js) out of the
  // bundler so they load from node_modules at runtime in server code.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
