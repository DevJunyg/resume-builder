"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useResumeStore } from "@/stores/resume-store";
import { useChatStore } from "@/stores/chat-store";
import type { Resume } from "@/types/resume";

export type CloudSyncStatus =
  | "local" // 비로그인 — localStorage만 사용
  | "loading" // 서버에서 불러오는 중
  | "saving" // 변경분 저장 중 (디바운스)
  | "synced" // 서버와 동기화됨
  | "error"; // 마지막 요청 실패

// 이력서 목록 메타데이터 (헤더 스위처에서 사용)
export interface ResumeMeta {
  id: string;
  title: string;
  updatedAt: string | null;
}

// 훅이 반환하는 클라우드 제어 인터페이스
export interface CloudSync {
  status: CloudSyncStatus;
  isCloud: boolean; // 로그인 상태 여부
  resumes: ResumeMeta[];
  activeId: string | null;
  switchResume: (id: string) => Promise<void>;
  createResume: () => Promise<void>;
  duplicateResume: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  renameResume: (id: string, title: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SAVE_DEBOUNCE_MS = 1500;

// --- 서버 통신 헬퍼 ---

async function apiListResumes(): Promise<ResumeMeta[]> {
  const res = await fetch("/api/resumes");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { resumes: ResumeMeta[] };
  return data.resumes;
}

async function apiGetResume(id: string): Promise<Resume> {
  const res = await fetch(`/api/resumes/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { resume: Resume };
  return data.resume;
}

async function apiCreateResume(seed?: Resume): Promise<ResumeMeta> {
  const res = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(seed ? { resume: seed } : {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ResumeMeta;
}

async function apiGetMessages(
  id: string
): Promise<Array<{ role: "user" | "assistant"; content: string; createdAt: string | null }>> {
  const res = await fetch(`/api/resumes/${id}/messages`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string; createdAt: string | null }>;
  };
  return data.messages;
}

// 스트리밍 중이 아니고 내용이 있는 메시지만 스냅샷으로 추출
function chatSnapshot() {
  return useChatStore
    .getState()
    .messages.filter((m) => !m.isStreaming && m.content.trim() !== "")
    .map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }));
}

// 로그인 시 이력서/대화를 클라우드(DB)와 동기화하는 훅.
// - 여러 이력서를 저장/전환하고, 이력서별 대화 내역도 함께 저장/복원한다.
// - 비로그인은 기존처럼 localStorage 단일 이력서만 사용 (반환 status "local").
export function useCloudSync(): CloudSync {
  const { status: authStatus } = useSession();
  const [status, setStatus] = useState<CloudSyncStatus>("loading");
  const [resumes, setResumes] = useState<ResumeMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 초기 로드 완료 전의 변경(rehydrate 등)은 저장하지 않음
  const readyRef = useRef(false);
  // 서버 데이터를 스토어에 반영하는 동안의 변경은 다시 업로드하지 않음
  const applyingRemoteRef = useRef(false);
  // 콜백에서 최신 activeId를 참조하기 위한 미러
  const activeIdRef = useRef<string | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActive = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  // 서버 이력서/대화를 스토어에 로드 (전환/초기화 공용)
  const applyRemote = useCallback(async (id: string) => {
    const [resume, messages] = await Promise.all([apiGetResume(id), apiGetMessages(id)]);
    applyingRemoteRef.current = true;
    try {
      useResumeStore.getState().setResume(resume);
      // 전환 시 이전 이력서 기준의 undo 이력이 남지 않도록 정리
      useResumeStore.temporal.getState().clear();
      useChatStore.getState().setMessages(
        messages.map((m, i) => ({
          id: `srv-${i}-${Math.random().toString(36).slice(2, 7)}`,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ?? new Date().toISOString(),
        }))
      );
    } finally {
      applyingRemoteRef.current = false;
    }
  }, []);

  // 현재 활성 이력서 즉시 저장 (디바운스 우회 — 전환 직전 플러시용)
  const saveResumeNow = useCallback(async (id: string) => {
    await fetch(`/api/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: useResumeStore.getState().resume }),
    });
  }, []);

  const saveChatNow = useCallback(async (id: string) => {
    await fetch(`/api/resumes/${id}/messages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatSnapshot() }),
    });
  }, []);

  // 대기 중인 저장 타이머를 즉시 실행 (전환/삭제 전에 편집 유실 방지)
  const flushPending = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id) return;
    const jobs: Array<Promise<unknown>> = [];
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
      jobs.push(saveResumeNow(id));
    }
    if (chatTimerRef.current) {
      clearTimeout(chatTimerRef.current);
      chatTimerRef.current = null;
      jobs.push(saveChatNow(id));
    }
    if (jobs.length) await Promise.allSettled(jobs);
  }, [saveResumeNow, saveChatNow]);

  // 1) 로그인 시 초기 동기화
  // (setState는 모두 await 이후에만 호출 — effect 본문의 동기 setState 회피)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve(); // 다음 마이크로태스크로 미뤄 동기 setState 방지
      if (cancelled) return;
      if (authStatus !== "authenticated") {
        readyRef.current = false;
        setActive(null);
        setResumes([]);
        setStatus("loading");
        return;
      }
      setStatus("loading");
      try {
        let list = await apiListResumes();
        if (cancelled) return;
        if (list.length === 0) {
          // 서버가 비어있으면 현재 로컬 이력서를 첫 이력서로 업로드
          const created = await apiCreateResume(useResumeStore.getState().resume);
          if (cancelled) return;
          list = [created];
        }
        const active = list[0]; // updatedAt desc 정렬 — 가장 최근 것
        await applyRemote(active.id);
        if (cancelled) return;
        setResumes(list);
        setActive(active.id);
        readyRef.current = true;
        setStatus("synced");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // applyRemote/setActive는 안정적(useCallback)
  }, [authStatus, applyRemote, setActive]);

  // 2) 이력서 변경 감지 → 디바운스 저장
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let prev = useResumeStore.getState().resume;
    const unsub = useResumeStore.subscribe((state) => {
      if (state.resume === prev) return; // resume 외 상태 변경은 무시
      prev = state.resume;
      const id = activeIdRef.current;
      if (!readyRef.current || applyingRemoteRef.current || !id) return;

      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      setStatus("saving");
      resumeTimerRef.current = setTimeout(async () => {
        try {
          await saveResumeNow(id);
          setStatus("synced");
          // 목록의 updatedAt 갱신 (정렬/표시용)
          setResumes((prevList) =>
            prevList.map((r) =>
              r.id === id ? { ...r, updatedAt: new Date().toISOString() } : r
            )
          );
        } catch {
          setStatus("error");
        }
      }, SAVE_DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [authStatus, saveResumeNow]);

  // 3) 대화 변경 감지 → 디바운스 저장 (스트리밍 중에는 대기)
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let prevMessages = useChatStore.getState().messages;
    const unsub = useChatStore.subscribe((state) => {
      if (state.messages === prevMessages) return;
      prevMessages = state.messages;
      const id = activeIdRef.current;
      if (!readyRef.current || applyingRemoteRef.current || !id) return;
      if (state.isStreaming) return; // 스트리밍 완료 후 저장

      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
      chatTimerRef.current = setTimeout(async () => {
        try {
          await saveChatNow(id);
        } catch {
          /* 대화 저장 실패는 상태 배지에 반영하지 않음 (이력서 저장이 우선) */
        }
      }, SAVE_DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, [authStatus, saveChatNow]);

  // --- UI 제어 액션 ---

  const switchResume = useCallback(
    async (id: string) => {
      if (id === activeIdRef.current) return;
      setStatus("loading");
      try {
        await flushPending();
        await applyRemote(id);
        setActive(id);
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    },
    [applyRemote, flushPending, setActive]
  );

  const createResume = useCallback(async () => {
    setStatus("loading");
    try {
      await flushPending();
      const created = await apiCreateResume();
      setResumes((prev) => [created, ...prev]);
      await applyRemote(created.id);
      setActive(created.id);
      setStatus("synced");
    } catch {
      setStatus("error");
    }
  }, [applyRemote, flushPending, setActive]);

  const duplicateResume = useCallback(
    async (id: string) => {
      setStatus("loading");
      try {
        await flushPending();
        const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const created = (await res.json()) as ResumeMeta;
        setResumes((prev) => [created, ...prev]);
        await applyRemote(created.id);
        setActive(created.id);
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    },
    [applyRemote, flushPending, setActive]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const remaining = resumes.filter((r) => r.id !== id);
        if (id === activeIdRef.current) {
          if (remaining.length > 0) {
            await applyRemote(remaining[0].id);
            setActive(remaining[0].id);
            setResumes(remaining);
          } else {
            // 마지막 이력서를 지웠으면 빈 이력서 하나를 새로 만든다
            const created = await apiCreateResume();
            await applyRemote(created.id);
            setActive(created.id);
            setResumes([created]);
          }
        } else {
          setResumes(remaining);
        }
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    },
    [applyRemote, resumes, setActive]
  );

  // 로그아웃: 마지막 편집분을 저장한 뒤, 로컬 잔존 데이터를 지우고 로그아웃.
  // (공용 PC에서 다음 사람에게 이력서가 남지 않도록 — 프라이버시)
  const logout = useCallback(async () => {
    try {
      await flushPending(); // 진행 중이던 실제 편집분을 서버에 저장
    } catch {
      /* 저장 실패해도 로그아웃은 진행 */
    }
    // 이후 스토어 변경이 서버로 저장되지 않도록 차단
    readyRef.current = false;
    setActive(null);
    setResumes([]);
    useResumeStore.getState().resetLocal();
    useResumeStore.persist.clearStorage();
    useChatStore.getState().clearMessages();
    await signOut();
  }, [flushPending, setActive]);

  const renameResume = useCallback(async (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title: trimmed } : r)));
    try {
      await fetch(`/api/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
    } catch {
      setStatus("error");
    }
  }, []);

  return {
    status: authStatus === "authenticated" ? status : "local",
    isCloud: authStatus === "authenticated",
    resumes,
    activeId,
    switchResume,
    createResume,
    duplicateResume,
    deleteResume,
    renameResume,
    logout,
  };
}
