// GET /api/version — 배포 확인용 빌드 정보
// ECS: Dockerfile의 GIT_SHA/BUILD_TIME build-arg → 런타임 ENV로 주입
// Vercel: VERCEL_GIT_COMMIT_SHA 자동 제공
// 런타임 ENV를 매 요청마다 읽어야 하므로 정적 프리렌더 대신 동적 처리
export const dynamic = "force-dynamic";

export function GET() {
  const sha =
    process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
  return Response.json({
    sha,
    shortSha: sha === "unknown" ? "unknown" : sha.slice(0, 7),
    builtAt: process.env.BUILD_TIME || null,
  });
}
