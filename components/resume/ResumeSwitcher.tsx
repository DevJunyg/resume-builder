"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, ChevronDown, Copy, Trash2, Pencil, Check } from "lucide-react";
import type { CloudSync } from "@/lib/use-cloud-sync";

// 로그인 사용자용 이력서 목록 스위처 (헤더).
// 여러 이력서를 전환/생성/복제/삭제/이름변경한다. 비로그인은 렌더링하지 않음.
export function ResumeSwitcher({ cloud }: { cloud: CloudSync }) {
  const { isCloud, resumes, activeId, switchResume, createResume, duplicateResume, deleteResume, renameResume } = cloud;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!isCloud) return null;

  const active = resumes.find((r) => r.id === activeId);

  const startRename = (id: string, current: string) => {
    setEditingId(id);
    setDraftTitle(current);
  };
  const commitRename = (id: string) => {
    if (draftTitle.trim()) renameResume(id, draftTitle);
    setEditingId(null);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 max-w-[200px] items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-medium text-foreground transition-colors hover:border-accent-brand/40 hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
        title="이력서 전환"
      >
        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" aria-hidden="true" />
        <span className="truncate">{active?.title ?? "이력서"}</span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
          <div className="max-h-[320px] overflow-y-auto py-1">
            {resumes.map((r) => {
              const isActive = r.id === activeId;
              const isEditing = editingId === r.id;
              return (
                <div
                  key={r.id}
                  className={`group flex items-center gap-1 px-2 py-1.5 ${
                    isActive ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(r.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => commitRename(r.id)}
                      className="min-w-0 flex-1 rounded-md border border-accent-brand/50 bg-surface px-2 py-1 text-[12px] text-foreground focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        void switchResume(r.id);
                        setOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left"
                    >
                      <span
                        className={`truncate text-[12px] ${
                          isActive ? "font-semibold text-foreground" : "text-text-muted"
                        }`}
                      >
                        {r.title}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-accent-brand" aria-hidden="true" />
                      )}
                    </button>
                  )}

                  {!isEditing && (
                    <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startRename(r.id, r.title)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-surface-3 hover:text-foreground"
                        aria-label="이름 변경"
                        title="이름 변경"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void duplicateResume(r.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-surface-3 hover:text-foreground"
                        aria-label="복제"
                        title="복제"
                      >
                        <Copy className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`"${r.title}" 이력서를 삭제할까요? 대화 내역도 함께 삭제됩니다.`)) {
                            void deleteResume(r.id);
                          }
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-red-500/10 hover:text-red-400"
                        aria-label="삭제"
                        title="삭제"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                void createResume();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium text-foreground hover:bg-surface-2"
            >
              <Plus className="h-3.5 w-3.5 text-accent-brand" aria-hidden="true" />
              새 이력서
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
