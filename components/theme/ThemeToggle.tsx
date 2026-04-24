"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// 다크/라이트 모드 토글 버튼 — 랜딩/빌더 공용
// resolvedTheme가 undefined이면 SSR 단계이므로 Moon 아이콘을 기본 렌더 (hydration mismatch 방지)
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
      aria-label={resolvedTheme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      suppressHydrationWarning
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
