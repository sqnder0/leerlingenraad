import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build for the Dockerfile (M8, moved up from a
  // deploy fix): only traced files get copied into the final image, no
  // full node_modules needed at runtime. See docs/plan.md §5/§6.
  output: "standalone",
};

export default nextConfig;
