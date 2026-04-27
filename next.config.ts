import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSE 스트리밍 응답을 위해 API 라우트 타임아웃 연장 (Vercel 기본 10s → 60s)
  serverExternalPackages: [],
};

export default nextConfig;
