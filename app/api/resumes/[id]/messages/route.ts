import { auth } from "@/auth";
import { getMessages, replaceMessages } from "@/lib/resume/repo";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/resumes/[id]/messages — 대화 내역 로드
// PUT /api/resumes/[id]/messages — 대화 스냅샷 전체 교체 저장

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const rows = await getMessages(session.user.id, id);
    if (rows === null) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({
      messages: rows.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt?.toISOString() ?? null,
      })),
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

  let messages: Array<{ role: "user" | "assistant"; content: string; createdAt?: string }>;
  try {
    const body = await request.json();
    if (!Array.isArray(body?.messages)) throw new Error("messages 배열 필요");
    // 방어: role 화이트리스트 + content 문자열만, 과대 입력 컷
    messages = body.messages
      .filter(
        (m: unknown): m is { role: "user" | "assistant"; content: string } =>
          !!m &&
          typeof m === "object" &&
          ((m as { role?: unknown }).role === "user" ||
            (m as { role?: unknown }).role === "assistant") &&
          typeof (m as { content?: unknown }).content === "string"
      )
      .slice(0, 500)
      .map((m: { role: "user" | "assistant"; content: string; createdAt?: string }) => ({
        role: m.role,
        content: m.content.slice(0, 20000),
        createdAt: typeof m.createdAt === "string" ? m.createdAt : undefined,
      }));
  } catch {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const ok = await replaceMessages(session.user.id, id, messages);
    if (!ok) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: "DB_ERROR", message: e instanceof Error ? e.message : "DB 오류" },
      { status: 503 }
    );
  }
}
