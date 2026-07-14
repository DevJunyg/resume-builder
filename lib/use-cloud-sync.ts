"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useResumeStore } from "@/stores/resume-store";
import type { Resume } from "@/types/resume";

export type CloudSyncStatus =
  | "local" // 비로그인 — localStorage만 사용
  | "loading" // 서버에서 불러오는 중
  | "saving" // 변경분 저장 중 (디바운스)
  | "synced" // 서버와 동기화됨
  | "error"; // 마지막 요청 실패

const SAVE_DEBOUNCE_MS = 1500;

// 로그인 시 이력서를 클라우드(DB)와 동기화하는 훅.
// - 로그인 직후: 서버에 저장본이 있으면 서버 우선(다른 기기에서 이어서 작성),
//   없으면 로컬 내용을 첫 업로드
// - 이후: 스토어 변경을 디바운스로 PUT (last-write-wins)
export function useCloudSync(): CloudSyncStatus {
  const { status: authStatus } = useSession();
  // 로그인 상태에서의 동기화 단계 — 비로그인은 반환 시 "local"로 파생
  const [status, setStatus] = useState<CloudSyncStatus>("loading");
  // 초기 로드가 끝나기 전의 변경(rehydrate 등)은 저장하지 않음
  const readyRef = useRef(false);
  // 서버 데이터를 스토어에 반영하는 동안 발생하는 변경은 다시 업로드하지 않음
  const applyingRemoteRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) 로그인 시 초기 동기화
  // (setState는 모두 fetch 이후의 비동기 콜백에서만 호출 — effect 동기 setState 회피)
  useEffect(() => {
    if (authStatus !== "authenticated") {
      readyRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/resume");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { resume: Resume | null };
        if (cancelled) return;
        if (data.resume) {
          applyingRemoteRef.current = true;
          useResumeStore.getState().setResume(data.resume);
          applyingRemoteRef.current = false;
        } else {
          // 서버가 비어있으면 로컬 내용을 첫 업로드
          await fetch("/api/resume", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume: useResumeStore.getState().resume }),
          });
        }
        if (!cancelled) {
          readyRef.current = true;
          setStatus("synced");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // 2) 변경 감지 → 디바운스 저장
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    let prev = useResumeStore.getState().resume;
    const unsub = useResumeStore.subscribe((state) => {
      if (state.resume === prev) return; // resume 외 상태 변경(isDirty 등)은 무시
      prev = state.resume;
      if (!readyRef.current || applyingRemoteRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("saving");
      timerRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/resume", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume: useResumeStore.getState().resume }),
          });
          setStatus(res.ok ? "synced" : "error");
        } catch {
          setStatus("error");
        }
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [authStatus]);

  // 비로그인은 항상 local, 로그인 직후 fetch 완료 전엔 초기값 loading
  return authStatus === "authenticated" ? status : "local";
}
