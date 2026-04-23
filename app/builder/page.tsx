"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { FileText, Sun, Moon, MessageSquare, Eye, Wrench } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ToolsPanel } from "@/components/tools/ToolsPanel";
import { useUiStore } from "@/stores/ui-store";
import type { MobileTab } from "@/stores/ui-store";

// 다크/라이트 모드 토글 버튼
function ThemeToggle() {
  // resolvedTheme 사용 — "system" 테마일 때도 실제 적용된 테마를 정확히 반영
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all hover:bg-muted"
      aria-label={resolvedTheme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

// 모바일 탭 바 아이템 정의
interface MobileTabItem {
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
}

const MOBILE_TABS: MobileTabItem[] = [
  {
    id: "chat",
    label: "채팅",
    icon: <MessageSquare className="h-5 w-5" aria-hidden="true" />,
  },
  {
    id: "preview",
    label: "이력서",
    icon: <Eye className="h-5 w-5" aria-hidden="true" />,
  },
  {
    id: "tools",
    label: "도구",
    icon: <Wrench className="h-5 w-5" aria-hidden="true" />,
  },
];

export default function BuilderPage() {
  const { activeMobileTab, setActiveMobileTab } = useUiStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-70"
            aria-label="홈으로 이동"
          >
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">AI 이력서 빌더</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* 데스크탑 3단 레이아웃 (md 이상) */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        {/* 좌: 채팅 패널 */}
        <aside className="w-[360px] flex-shrink-0 overflow-hidden border-r border-border">
          <ChatPanel />
        </aside>

        {/* 중: 이력서 미리보기 */}
        <div className="flex flex-1 overflow-hidden">
          <ResumePreview />
        </div>

        {/* 우: 도구 패널 */}
        <aside className="w-[280px] flex-shrink-0 overflow-hidden border-l border-border">
          <ToolsPanel />
        </aside>
      </div>

      {/* 모바일 탭 컨텐츠 (md 미만) */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        {/* 탭 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {activeMobileTab === "chat" && (
            <div className="h-full">
              <ChatPanel />
            </div>
          )}
          {activeMobileTab === "preview" && (
            <div className="h-full overflow-hidden">
              <ResumePreview />
            </div>
          )}
          {activeMobileTab === "tools" && (
            <div className="h-full">
              <ToolsPanel />
            </div>
          )}
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
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
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
