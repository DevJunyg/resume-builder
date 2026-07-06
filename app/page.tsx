"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// resumé.ai 로고
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[6px] gradient-button text-white"
        style={{ fontSize: 13, fontWeight: 700 }}
        aria-hidden="true"
      >
        <FileText className="h-3.5 w-3.5" />
      </div>
      <span className="text-[15px] font-extrabold tracking-[-0.03em] text-foreground">
        resumé<span className="gradient-text">.ai</span>
      </span>
    </div>
  );
}

// 히어로 우측 브라우저 mockup — React state 기반 Diff 인터랙션
function BrowserMockup() {
  // 0=idle, 1=yellow(수정 중), 2=green(완료), 3=fade
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const cycle = () => {
      setPhase(1);
      setTimeout(() => setPhase(2), 1200);
      setTimeout(() => setPhase(3), 2800);
      setTimeout(() => setPhase(0), 4000);
    };
    const initial = setTimeout(cycle, 1500);
    const interval = setInterval(cycle, 5500);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  const highlightStyle: React.CSSProperties = {
    borderRadius: 3,
    padding: "4px 6px",
    transition: "background 0.6s ease",
    background:
      phase === 1
        ? "rgba(234,179,8,0.35)"
        : phase === 2
          ? "rgba(34,197,94,0.25)"
          : "transparent",
  };

  return (
    <div className="relative">
      {/* 배경 Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.18)_0%,transparent_70%)]"
      />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_40px_80px_rgba(0,0,0,0.35),0_0_0_1px_rgba(99,102,241,0.1)]">
        {/* 미니 헤더: traffic lights */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-[#f87171]" />
          <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
          <span className="ml-2 font-mono text-xs text-text-muted">
            resumé.ai/builder
          </span>
        </div>

        {/* 미니 빌더 프리뷰 */}
        <div className="flex h-[380px]">
          {/* 미니 채팅 */}
          <div className="flex w-[200px] flex-col gap-3 border-r border-border p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              AI Chat
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5 text-xs leading-relaxed text-text-subtle">
              자기소개를 더 임팩트있게 수정해줘
            </div>
            <div className="flex gap-1.5">
              <div
                className="h-6 w-6 flex-shrink-0 rounded-full gradient-button"
                aria-hidden="true"
              />
              <div className="flex-1 rounded-lg bg-[rgba(99,102,241,0.12)] px-2.5 py-2 text-xs leading-relaxed text-foreground">
                자기소개를 업데이트했어요! 비즈니스 임팩트를 강조했습니다.
              </div>
            </div>
          </div>

          {/* 미니 이력서 (흰 배경 고정) */}
          <div className="flex-1 overflow-hidden bg-white p-4 text-[#1a1a2e]">
            <div className="mb-1 text-base font-extrabold text-[#0d0d1a]">
              김지현
            </div>
            <div className="mb-3 text-[11px] text-[#6868a0]">
              jihyun@email.com · 010-1234-5678
            </div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#0d0d1a]">
              자기소개
            </div>
            <div
              className="text-xs leading-[1.6] text-[#2d2d4a]"
              style={highlightStyle}
            >
              5년 경력의 프론트엔드 엔지니어. React/TypeScript 기반의 복잡한 SaaS 제품을 처음부터 끝까지 주도하며...
            </div>

            {/* Diff 배지 */}
            {phase > 0 && phase < 3 && (
              <div
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
                style={{
                  background:
                    phase === 1
                      ? "rgba(234,179,8,0.15)"
                      : "rgba(34,197,94,0.12)",
                  color: phase === 1 ? "#d97706" : "#16a34a",
                  transition: "all 0.6s ease",
                }}
              >
                <span>{phase === 1 ? "✏️" : "✓"}</span>
                {phase === 1 ? "수정 중..." : "수정했어요"}
              </div>
            )}

            <div className="mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#0d0d1a]">
              경력
            </div>
            <div className="rounded-r-md border-l-[3px] border-[#22d3ee] bg-[rgba(34,211,238,0.06)] pl-2">
              <div className="text-xs font-bold text-[#0d0d1a]">
                시니어 프론트엔드 개발자
              </div>
              <div className="text-[11px] text-[#6868a0]">
                (주)테크스타트 · 2022–현재
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-full bg-background text-foreground">
      {/* 고정 네비 */}
      <nav className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
            aria-label="홈"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/builder"
              className="flex items-center gap-1.5 rounded-lg gradient-button px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)] active:scale-[0.98]"
            >
              시작하기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* 히어로 */}
        <section className="mx-auto flex max-w-6xl items-center gap-16 px-6 pb-20 pt-32">
          {/* 좌: 카피 */}
          <div className="flex-shrink-0 basis-[520px]">
            <h1 className="mb-6 text-[58px] font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground">
              대화하며
              <br />
              <span className="gradient-text">완성하는 이력서</span>
            </h1>

            <p className="mb-10 max-w-[420px] text-[18px] leading-[1.7] text-text-muted">
              원하는 방향을 이야기하면 이력서에 바로 반영됩니다. 채용 공고를 넣으면 관련 경력을 맞춰 정리해 줍니다.
            </p>

            <div className="flex gap-3">
              <Link
                href="/builder"
                className="flex items-center gap-2 rounded-lg gradient-button px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(99,102,241,0.35)] transition-all hover:shadow-[0_8px_28px_rgba(99,102,241,0.5)] active:scale-[0.98]"
              >
                이력서 만들기
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* 우: 브라우저 mockup */}
          <div className="flex-1">
            <BrowserMockup />
          </div>
        </section>
      </main>
    </div>
  );
}
