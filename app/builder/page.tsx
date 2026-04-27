"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Eye, Wrench, Undo2, Redo2 } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ToolsPanel } from "@/components/tools/ToolsPanel";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useUiStore } from "@/stores/ui-store";
import { useTemporalStore } from "@/stores/resume-store";
import type { MobileTab } from "@/stores/ui-store";

interface MobileTabItem {
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
}

const MOBILE_TABS: MobileTabItem[] = [
  { id: "chat", label: "채팅", icon: <MessageSquare className="h-5 w-5" aria-hidden="true" /> },
  { id: "preview", label: "이력서", icon: <Eye className="h-5 w-5" aria-hidden="true" /> },
  { id: "tools", label: "도구", icon: <Wrench className="h-5 w-5" aria-hidden="true" /> },
];

export default function BuilderPage() {
  const { activeMobileTab, setActiveMobileTab } = useUiStore();
  const { undo, redo, pastStates, futureStates } = useTemporalStore((s) => s);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // 키보드 단축키: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-70"
            aria-label="랜딩 페이지로 이동"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="text-[14px] font-semibold">AI 이력서 빌더</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Undo / Redo 버튼 */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => undo()}
                disabled={!canUndo}
                aria-label="실행 취소 (Ctrl+Z)"
                title="실행 취소"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => redo()}
                disabled={!canRedo}
                aria-label="다시 실행 (Ctrl+Y)"
                title="다시 실행"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Redo2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="h-4 w-px bg-border" aria-hidden="true" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 데스크탑 3단 레이아웃 (md 이상) */}
      <div id="main-content" className="hidden flex-1 overflow-hidden md:flex">
        {/* 좌: 채팅 패널 340px */}
        <aside className="w-[340px] flex-shrink-0 overflow-hidden border-r border-border">
          <ChatPanel />
        </aside>

        {/* 중: 이력서 미리보기 */}
        <div className="flex flex-1 overflow-hidden">
          <ResumePreview />
        </div>

        {/* 우: 도구 패널 264px */}
        <aside className="w-[264px] flex-shrink-0 overflow-hidden border-l border-border">
          <ToolsPanel />
        </aside>
      </div>

      {/* 모바일 탭 컨텐츠 (md 미만) */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex-1 overflow-hidden">
          {activeMobileTab === "chat" && <div className="h-full"><ChatPanel /></div>}
          {activeMobileTab === "preview" && <div className="h-full overflow-hidden"><ResumePreview /></div>}
          {activeMobileTab === "tools" && <div className="h-full"><ToolsPanel /></div>}
        </div>

        {/* 하단 탭 바 */}
        <nav
          className="flex-shrink-0 border-t border-border bg-background"
          aria-label="모바일 탭 내비게이션"
        >
          <div className="flex" role="tablist">
            {MOBILE_TABS.map((tab) => {
              const isActive = activeMobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tab-panel-${tab.id}`}
                  onClick={() => setActiveMobileTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    isActive ? "text-accent-brand" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
