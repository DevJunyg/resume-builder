import { auth } from "@/auth";
import { getResume, updateResume, deleteResume } from "@/lib/resume/repo";
import { ResumeSchema } from "@/lib/resume/schema";

type Ctx = { params: Promise<{ id: string }> };

// GET    /api/resumes/[id]  — 이력서 전체 데이터
// PUT    /api/resumes/[id]  — data/title 갱신 (부분)
// DELETE /api/resumes/[id]  — 삭제 (대화 cascade)

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const row = await getResume(session.user.id, id);
    if (!row) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({
      id: row.id,
      title: row.title,
      resume: row.data,
      updatedAt: row.updatedAt?.toISOString() ?? null,
    });
  } catch (e) {
    return Response.json(
      { error: "DB_ERROR", message: e instanceof Error ? e.message : "DB 오류" },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;

  let body: { resume?: unknown; title?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const fields: { data?: import("@/types/resume").Resume; title?: string } = {};
  if (body.resume !== undefined) {
    const parsed = ResumeSchema.safeParse(body.resume);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "형식 오류" },
        { status: 400 }
      );
    }
    fields.data = parsed.data;
  }
  if (typeof body.title === "string" && body.title.trim()) fields.title = body.title.trim();
  if (fields.data === undefined && fields.title === undefined) {
    return Response.json({ error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  try {
    const ok = await updateResume(session.user.id, id, fields);
    if (!ok) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (e) {
    return Response.json(
      { error: "DB_ERROR", message: e instanceof Error ? e.message : "DB 오류" },
      { status: 503 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const ok = await deleteResume(session.user.id, id);
    if (!ok) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: "DB_ERROR", message: e instanceof Error ? e.message : "DB 오류" },
      { status: 503 }
    );
  }
}
