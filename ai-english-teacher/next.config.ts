import type { NextConfig } from "next";

const repoName = "AI-techer";

const nextConfig: NextConfig = {
  output: "export",
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "run-agent-*.remote-agent.svc.cluster.local",
    "*.remote-agent.svc.cluster.local",
  ],
};

export default nextConfig;