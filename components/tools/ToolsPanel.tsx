"use client";

import { useState } from "react";
import { Sliders, FileDown, FileText } from "lucide-react";
import { useResumeStore } from "@/stores/resume-store";
import type { Tone } from "@/types/resume";

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  { value: "professional", label: "전문적", description: "격식체, 안정감" },
  { value: "creative", label: "창의적", description: "개성 있는 표현" },
  { value: "academic", label: "학술적", description: "논리적, 체계적" },
  { value: "startup", label: "스타트업", description: "열정적, 임팩트" },
];

export function ToolsPanel() {
  const { resume, updateJd, updateTone } = useResumeStore();
  const currentTone = resume.metadata.tone;

  const [jdInput, setJdInput] = useState("");
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleAnalyzeJd = () => {
    if (!jdInput.trim()) return;
    updateJd(jdInput.trim());
    setIsAnalyzed(true);
  };

  const handleToneChange = (tone: Tone) => {
    updateTone(tone);
  };

  return (
    <aside
      className="flex h-full flex-col overflow-y-auto"
      aria-label="도구 패널"
    >
      {/* 헤더 */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">도구</h2>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4">
        {/* JD 입력 */}
        <section aria-label="채용공고 분석">
          <h3 className="mb-2 text-sm font-medium text-foreground">채용공고 (JD)</h3>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            지원하는 채용공고를 붙여넣으면 AI가 키워드를 분석하고 이력서를 최적화합니다.
          </p>
          <label htmlFor="jd-textarea" className="sr-only">
            채용공고 입력
          </label>
          <textarea
            id="jd-textarea"
            value={jdInput}
            onChange={(e) => {
              setJdInput(e.target.value);
              setIsAnalyzed(false);
            }}
            placeholder="채용공고 내용을 붙여넣으세요..."
            rows={6}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="채용공고 입력창"
          />
          <button
            type="button"
            onClick={handleAnalyzeJd}
            disabled={!jdInput.trim() || isAnalyzed}
            className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="JD 분석 시작"
          >
            {isAnalyzed ? "분석 완료" : "JD 분석하기"}
          </button>
          {isAnalyzed && (
            <p className="mt-2 text-center text-xs text-muted-foreground" role="status">
              채용공고가 저장되었습니다.
            </p>
          )}
        </section>

        {/* 톤 선택 */}
        <section aria-label="이력서 톤 설정">
          <h3 className="mb-2 text-sm font-medium text-foreground">이력서 톤</h3>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            이력서의 문체와 표현 방식을 선택하세요.
          </p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="톤 선택">
            {TONE_OPTIONS.map((option) => {
              const isActive = currentTone === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToneChange(option.value)}
                  aria-pressed={isActive}
                  className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xs font-medium">{option.label}</span>
                  <span
                    className={`text-xs ${isActive ? "text-primary/70" : "text-muted-foreground"}`}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 내보내기 */}
        <section aria-label="이력서 내보내기">
          <h3 className="mb-2 text-sm font-medium text-foreground">내보내기</h3>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            완성된 이력서를 원하는 형식으로 내보냅니다.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              aria-label="PDF 내보내기 (준비 중)"
              title="준비 중"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              <span>PDF로 내보내기</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">준비 중</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              aria-label="Markdown 내보내기 (준비 중)"
              title="준비 중"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Markdown으로 내보내기</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">준비 중</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
