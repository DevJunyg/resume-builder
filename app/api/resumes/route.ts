import { auth } from "@/auth";
import { listResumes, createResume } from "@/lib/resume/repo";
import { createEmptyResume } from "@/lib/resume/schema";
import { ResumeSchema } from "@/lib/resume/schema";

// GET  /api/resumes        — 내 이력서 목록 (메타데이터)
// POST /api/resumes        — 새 이력서 생성 ({ title?, resume? } 선택)

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const rows = await listResumes(session.user.id);
    return Response.json({
      resumes: rows.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    return Response.json(
      { error: "DB_ERROR", message: e instanceof Error ? e.message : "DB 오류" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let title = "새 이력서";
  let data = createEmptyResume(crypto.randomUUID());
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.title === "string" && body.title.trim()) title = body.title.trim();
    // 클라이언트가 초기 내용을 함께 보낼 수 있음 (예: 로컬 이력서 업로드)
    if (body?.resume) {
      const parsed = ResumeSchema.safeParse(body.resume);
      if (parsed.success) data = parsed.data;
    }
  } catch {
    /* 본문 없으면 기본값 */
  }

  try {
    const row = await createResume(session.user.id, title, data);
    return Response.json(
      { id: row.id, title: row.title, updatedAt: row.updatedAt?.toISOString() ?? null },
      { status: 201 }
    );
  } catch (e) {
    return Response.json(
      { error: "DB_ERROR", message: e instanceof Error ? e.message : "DB 오류" },
      { status: 503 }
    );
  }
}
