"use client";

import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string; // 표시/입력에 공통 적용할 텍스트 스타일
}

// 클릭하면 그 자리에서 편집되는 텍스트.
// - 단일 행: <input> (내용 길이에 맞춰 폭 조정), Enter 저장 / Esc 취소
// - 여러 행: <textarea>, Enter 저장 / Shift+Enter 줄바꿈 / Esc 취소
// 저장은 onCommit으로 스토어에 반영된다(→ 클라우드 동기화까지 자동).
export function EditableText({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  multiline = false,
  className,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // 편집 시작 시 포커스 + 커서 끝으로
  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editing]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const next = multiline ? draft.replace(/\s+$/g, "") : draft.trim();
    if (next !== value) onCommit(next);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    const shared =
      "rounded-[4px] bg-[#eef2ff] px-1 -mx-1 text-inherit outline outline-1 outline-[rgba(99,102,241,0.5)] focus:outline-[rgba(99,102,241,0.8)]";
    if (multiline) {
      return (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
          }}
          rows={Math.max(2, draft.split("\n").length)}
          aria-label={ariaLabel}
          className={`block w-full resize-none ${shared} ${className ?? ""}`}
          style={{ fontFamily: "inherit" }}
        />
      );
    }
    return (
      <input
        ref={(el) => {
          inputRef.current = el;
        }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          } else if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        aria-label={ariaLabel}
        className={`${shared} ${className ?? ""}`}
        style={{
          fontFamily: "inherit",
          width: `${Math.max((draft.length || placeholder?.length || 0) + 1, 4)}ch`,
        }}
      />
    );
  }

  const isEmpty = value.trim() === "";
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={start}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          start();
        }
      }}
      title="클릭해서 편집"
      aria-label={`${ariaLabel} 편집`}
      className={`cursor-text rounded-[3px] transition-colors hover:bg-[#eef2ff] ${
        isEmpty ? "italic opacity-40 print:hidden" : ""
      } ${className ?? ""}`}
    >
      {isEmpty ? placeholder ?? "클릭해 입력" : value}
    </span>
  );
}
