import { db } from "@/lib/db";
import { resumes, chatMessages } from "@/lib/db/schema";
import { and, eq, asc, desc } from "drizzle-orm";
import type { Resume } from "@/types/resume";

// 이력서 데이터 접근 계층 — 모든 조회/변경은 userId로 소유권을 강제한다.

export async function listResumes(userId: string) {
  return db
    .select({
      id: resumes.id,
      title: resumes.title,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt));
}

export async function getResume(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createResume(
  userId: string,
  title: string,
  data: Resume
) {
  const [row] = await db
    .insert(resumes)
    .values({ userId, title, data })
    .returning({ id: resumes.id, title: resumes.title, updatedAt: resumes.updatedAt });
  return row;
}

// 소유자 확인 후 data/title 갱신. 소유 아님/없음이면 false.
export async function updateResume(
  userId: string,
  id: string,
  fields: { data?: Resume; title?: string }
) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.data !== undefined) set.data = fields.data;
  if (fields.title !== undefined) set.title = fields.title;

  const rows = await db
    .update(resumes)
    .set(set)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning({ id: resumes.id });
  return rows.length > 0;
}

export async function deleteResume(userId: string, id: string) {
  const rows = await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning({ id: resumes.id });
  return rows.length > 0;
}

export async function getMessages(userId: string, resumeId: string) {
  // 소유권 확인 후 대화 로드
  const owner = await getResume(userId, resumeId);
  if (!owner) return null;
  return db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.resumeId, resumeId))
    .orderBy(asc(chatMessages.createdAt));
}

// 대화 메시지 배열을 통째로 교체 저장 (클라이언트가 전체 스냅샷 전송).
// 정규화 테이블이지만 동기화 단순화를 위해 delete-then-insert 트랜잭션.
export async function replaceMessages(
  userId: string,
  resumeId: string,
  messages: Array<{ role: "user" | "assistant"; content: string; createdAt?: string }>
) {
  const owner = await getResume(userId, resumeId);
  if (!owner) return false;

  await db.transaction(async (tx) => {
    await tx.delete(chatMessages).where(eq(chatMessages.resumeId, resumeId));
    if (messages.length > 0) {
      await tx.insert(chatMessages).values(
        messages.map((m, i) => ({
          resumeId,
          role: m.role,
          content: m.content,
          // 순서 보존 — 전달된 시각이 없으면 인덱스로 단조 증가
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(Date.now() + i),
        }))
      );
    }
  });
  return true;
}
