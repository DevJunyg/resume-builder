import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { ResumeSchema } from "@/lib/resume/schema";
import { eq } from "drizzle-orm";

// 사용자당 이력서 1개 (resumes.user_id unique) — GET 조회 / PUT upsert

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "UNAUTHORIZED", message: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  try {
    const [row] = await db
      .select({ data: resumes.data, updatedAt: resumes.updatedAt })
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))
      .limit(1);

    return Response.json({
      resume: row?.data ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB 오류";
    return Response.json(
      { error: "DB_ERROR", message },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "UNAUTHORIZED", message: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "INVALID_JSON", message: "요청 본문을 파싱할 수 없습니다" },
      { status: 400 }
    );
  }

  // 서버사이드 검증 — 클라이언트를 신뢰하지 않는다 (기존 zod 스키마 재사용)
  const parsed = ResumeSchema.safeParse(
    (body as { resume?: unknown })?.resume
  );
  if (!parsed.success) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "이력서 형식이 올바르지 않습니다",
      },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    await db
      .insert(resumes)
      .values({ userId: session.user.id, data: parsed.data, updatedAt: now })
      .onConflictDoUpdate({
        target: resumes.userId,
        set: { data: parsed.data, updatedAt: now },
      });

    return Response.json({ ok: true, updatedAt: now.toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB 오류";
    return Response.json(
      { error: "DB_ERROR", message },
      { status: 503 }
    );
  }
}
