import type { NextConfig } from "next";

const isBuildForPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  serverExternalPackages: ["onnxruntime-node", "onnxruntime-web"],
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
  env: {
    NEXT_PUBLIC_BASE_PATH: isBuildForPages ? "/AI-techer" : "",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    NEXT_PUBLIC_KB_WRITE_KEY:
      (process.env.NEXT_PUBLIC_KB_WRITE_KEY || "").trim() || "563876951@qq.com",
  },
  allowedDevOrigins: [
    "run-agent-*.remote-agent.svc.cluster.local",
    "*.remote-agent.svc.cluster.local",
    "*.agent-sandbox-bj-a1-gw.traecontent.cn",
    "*.traecontent.cn",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;