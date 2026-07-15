import { auth } from "@/auth";
import { getResume, createResume } from "@/lib/resume/repo";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/resumes/[id]/duplicate — 이력서 복제 (대화는 복제하지 않음)
export async function POST(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const src = await getResume(session.user.id, id);
    if (!src) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const row = await createResume(session.user.id, `${src.title} (복사본)`, src.data);
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
