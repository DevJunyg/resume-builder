"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Zap, Scissors, Star, X } from "lucide-react";

type RewriteMode = "stronger" | "concise" | "star";

interface MenuPosition {
  x: number;
  y: number;
}

interface TextRewriteMenuProps {
  /** 컨텍스트 메뉴가 활성화될 컨테이너 ref */
  containerRef: React.RefObject<HTMLElement | null>;
  /** 재작성 완료 후 콜백 — 선택 범위와 새 텍스트 전달 */
  onRewrite: (original: string, rewritten: string, range: Range) => void;
}

const MENU_ITEMS: { mode: RewriteMode; label: string; icon: React.ReactNode }[] = [
  { mode: "stronger", label: "더 강하게", icon: <Zap className="h-3 w-3" aria-hidden="true" /> },
  { mode: "concise", label: "더 간결하게", icon: <Scissors className="h-3 w-3" aria-hidden="true" /> },
  { mode: "star", label: "STAR 기법으로", icon: <Star className="h-3 w-3" aria-hidden="true" /> },
];

export function TextRewriteMenu({ containerRef, onRewrite }: TextRewriteMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [activeMode, setActiveMode] = useState<RewriteMode | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setPosition(null);
    setSelectedText("");
    setSavedRange(null);
    setActiveMode(null);
    setStreamedText("");
    setIsStreaming(false);
    abortRef.current?.abort();
  }, []);

  // 우클릭 이벤트 핸들러
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";

      // 텍스트 선택 없으면 기본 컨텍스트 메뉴
      if (!text || text.length < 3) return;

      // 선택 범위가 컨테이너 내부인지 확인
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      e.preventDefault();
      setSelectedText(text);
      setSavedRange(range.cloneRange());
      setPosition({ x: e.clientX, y: e.clientY });
      setActiveMode(null);
      setStreamedText("");
    };

    container.addEventListener("contextmenu", handleContextMenu);
    return () => container.removeEventListener("contextmenu", handleContextMenu);
  }, [containerRef]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!position) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [position, closeMenu]);

  // ESC 키 닫기
  useEffect(() => {
    if (!position) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [position, closeMenu]);

  const handleRewrite = async (mode: RewriteMode) => {
    if (isStreaming) return;
    setActiveMode(mode);
    setStreamedText("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, mode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;

          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setStreamedText(accumulated);
            }
          } catch {
            // JSON parse 실패 무시
          }
        }
      }

      // 스트리밍 완료 — 콜백으로 전달
      if (accumulated && savedRange) {
        onRewrite(selectedText, accumulated, savedRange);
        closeMenu();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStreamedText("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsStreaming(false);
    }
  };

  if (!position) return null;

  // 뷰포트 경계 내에 메뉴 위치 조정
  const menuWidth = 200;
  const menuHeight = 180;
  const adjustedX = Math.min(position.x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="텍스트 재작성 메뉴"
      className="fixed z-50 min-w-[180px] rounded-xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          AI 재작성
        </span>
        <button
          type="button"
          onClick={closeMenu}
          className="rounded p-0.5 text-text-muted hover:text-foreground"
          aria-label="닫기"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* 선택 텍스트 미리보기 */}
      <div className="border-b border-border px-3 py-2">
        <p className="line-clamp-2 text-[11px] text-text-muted">
          &ldquo;{selectedText.length > 60 ? selectedText.slice(0, 60) + "…" : selectedText}&rdquo;
        </p>
      </div>

      {/* 스트리밍 결과 */}
      {streamedText && (
        <div className="border-b border-border px-3 py-2">
          <p className="text-[12px] leading-relaxed text-foreground">
            {streamedText}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-3.5 w-px bg-accent-brand streaming-cursor" />
            )}
          </p>
        </div>
      )}

      {/* 모드 버튼 목록 */}
      {!streamedText && (
        <div className="p-1">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.mode}
              type="button"
              role="menuitem"
              onClick={() => handleRewrite(item.mode)}
              disabled={isStreaming}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-left transition-colors ${
                activeMode === item.mode
                  ? "bg-accent-brand/10 text-accent-brand"
                  : "text-foreground hover:bg-surface-2"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
