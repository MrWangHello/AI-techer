import type { NextConfig } from "next";

const isBuildForPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  ...(isBuildForPages
    ? {
        output: "export" as const,
        basePath: "/AI-techer",
        assetPrefix: "/AI-techer/",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        images: { unoptimized: true },
      }),
  allowedDevOrigins: [
    "run-agent-*.remote-agent.svc.cluster.local",
    "*.remote-agent.svc.cluster.local",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;