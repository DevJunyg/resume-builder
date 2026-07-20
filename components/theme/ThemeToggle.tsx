"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// 다크/라이트 모드 토글 버튼 — 랜딩/빌더 공용
// 두 아이콘을 항상 렌더하고 `.dark` 클래스에 따라 CSS로 전환한다.
// (resolvedTheme 기반 조건부 렌더는 SSR에서 undefined라 hydration mismatch를 일으켰음)
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-all hover:bg-surface-2"
      aria-label="테마 전환"
      title="다크/라이트 전환"
    >
      {/* 다크일 때 Sun(라이트로 전환), 라이트일 때 Moon(다크로 전환) — CSS로 전환 */}
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
      <Moon className="block h-4 w-4 dark:hidden" aria-hidden="true" />
    </button>
  );
}
