"use client";

import { useState } from "react";
import { Search, FileDown, Clipboard, Check } from "lucide-react";
import { useResumeStore } from "@/stores/resume-store";
import { resumeToMarkdown } from "@/lib/resume/to-markdown";
import type { Tone } from "@/types/resume";

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  { value: "professional", label: "전문적", description: "격식체, 안정감" },
  { value: "creative", label: "창의적", description: "개성 있는 표현" },
  { value: "academic", label: "학술적", description: "논리적, 체계적" },
  { value: "startup", label: "스타트업", description: "열정적, 임팩트" },
];

export function ToolsPanel() {
  const { resume, updateJdMetadata, updateTone } = useResumeStore();
  const currentTone = resume.metadata.tone;

  const [jdInput, setJdInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [mdCopied, setMdCopied] = useState(false);

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportMarkdown = async () => {
    const md = resumeToMarkdown(resume);
    try {
      await navigator.clipboard.writeText(md);
      setMdCopied(true);
      setTimeout(() => setMdCopied(false), 2000);
    } catch {
      // clipboard API 실패 시 fallback: textarea 방식
      const el = document.createElement("textarea");
      el.value = md;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setMdCopied(true);
      setTimeout(() => setMdCopied(false), 2000);
    }
  };

  const handleAnalyzeJd = async () => {
    if (!jdInput.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText: jdInput.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        keywords?: string[];
        requiredSkills?: string[];
        preferredSkills?: string[];
        error?: string;
      };
      if (data.error) throw new Error(data.error);

      // 풍부한 메타데이터로 업데이트
      updateJdMetadata({
        rawText: jdInput.trim(),
        keywords: data.keywords ?? [],
        requiredSkills: data.requiredSkills ?? [],
        preferredSkills: data.preferredSkills ?? [],
        analyzedAt: new Date().toISOString(),
      });
      setIsAnalyzed(true);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "분석 실패");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToneChange = (tone: Tone) => {
    updateTone(tone);
  };

  return (
    <aside className="flex h-full flex-col overflow-y-auto" aria-label="도구 패널">
      {/* 헤더 */}
      <div className="border-b border-border px-5 py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          도구
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {/* JD 분석 */}
        <section aria-label="채용공고 분석">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            JD 분석
          </h3>
          <label htmlFor="jd-textarea" className="sr-only">
            채용공고 입력
          </label>
          <textarea
            id="jd-textarea"
            value={jdInput}
            onChange={(e) => {
              setJdInput(e.target.value);
              setIsAnalyzed(false);
              setAnalyzeError(null);
            }}
            placeholder="채용공고 내용을 붙여넣으세요..."
            rows={5}
            className="w-full resize-y rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-[12px] text-foreground placeholder:text-text-muted focus:border-accent-brand/50 focus:outline-none focus:ring-2 focus:ring-accent-brand/30 transition-colors"
          />
          {analyzeError && (
            <p className="text-[12px] text-red-400 mt-1" role="alert">
              {analyzeError}
            </p>
          )}
          <button
            type="button"
            onClick={handleAnalyzeJd}
            disabled={!jdInput.trim() || isAnalyzing || isAnalyzed}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl gradient-button px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="JD 분석 시작"
          >
            {isAnalyzing ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" style={{ animation: "thinking-dot 1.2s ease 0ms infinite" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" style={{ animation: "thinking-dot 1.2s ease 200ms infinite" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" style={{ animation: "thinking-dot 1.2s ease 400ms infinite" }} />
                <span className="ml-1">분석 중...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                {isAnalyzed ? "분석 완료" : "JD 매칭 분석"}
              </>
            )}
          </button>
        </section>

        {/* 구분선 */}
        <div className="h-px bg-border" aria-hidden="true" />

        {/* 톤 선택 */}
        <section aria-label="이력서 톤 설정">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            톤 설정
          </h3>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="톤 선택">
            {TONE_OPTIONS.map((option) => {
              const isActive = currentTone === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToneChange(option.value)}
                  aria-pressed={isActive}
                  className={`flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? "border-accent-brand bg-accent-brand/10 shadow-[0_0_0_3px_rgba(99,102,241,0.18)] text-accent-brand"
                      : "border-border bg-surface text-foreground hover:border-accent-brand/40 hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`text-[12px] font-bold ${isActive ? "text-accent-brand" : "text-foreground"}`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`text-[11px] ${isActive ? "text-accent-brand/70" : "text-text-muted"}`}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 구분선 */}
        <div className="h-px bg-border" aria-hidden="true" />

        {/* 내보내기 */}
        <section aria-label="이력서 내보내기">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            내보내기
          </h3>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[12px] text-foreground transition-colors hover:border-accent-brand/40 hover:bg-surface-2"
              aria-label="PDF로 내보내기"
            >
              <FileDown className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <span>PDF로 내보내기</span>
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[12px] text-foreground transition-colors hover:border-accent-brand/40 hover:bg-surface-2"
              aria-label="Markdown 복사"
            >
              {mdCopied ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-400" aria-hidden="true" />
              ) : (
                <Clipboard className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              )}
              <span>{mdCopied ? "복사 완료!" : "Markdown 복사"}</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
