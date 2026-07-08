import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/ECS 배포용 최소 이미지 — 실행에 필요한 파일만 .next/standalone 으로 산출
  // (Vercel 배포에는 영향 없음)
  output: "standalone",
  // SSE 스트리밍 응답을 위해 API 라우트 타임아웃 연장 (Vercel 기본 10s → 60s)
  serverExternalPackages: [],
};

export default nextConfig;
