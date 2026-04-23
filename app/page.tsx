import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Download } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-lg font-bold text-foreground">AI 이력서 빌더</span>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-24 text-center">
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Claude AI 기반 이력서 작성 도구</span>
          </div>

          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-foreground">
            AI와 대화하며{" "}
            <span className="text-primary">완성하는 이력서</span>
          </h1>

          <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">
            경험을 자연스럽게 이야기하면 AI가 STAR 기법으로 재구성합니다.
            JD 분석부터 맞춤 최적화까지, 취업 준비의 모든 과정을 함께합니다.
          </p>

          <Link
            href="/builder"
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95"
          >
            이력서 만들기 시작
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>

        {/* 기능 카드 섹션 */}
        <section
          className="mx-auto max-w-6xl px-6 pb-24"
          aria-label="주요 기능"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
              title="AI 경험 추출"
              description="대화를 통해 경험을 입력하면 AI가 STAR(상황-과제-행동-결과) 기법으로 자동 재구성해 임팩트 있는 이력서를 만들어 드립니다."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" aria-hidden="true" />}
              title="JD 맞춤 최적화"
              description="지원하는 공고의 JD를 붙여넣으면 AI가 핵심 키워드를 분석하고 당신의 경험을 최적의 순서로 배치합니다."
            />
            <FeatureCard
              icon={<Download className="h-6 w-6" aria-hidden="true" />}
              title="즉시 내보내기"
              description="완성된 이력서를 PDF 또는 Markdown 형식으로 즉시 내보낼 수 있습니다. 언제든지 수정하고 다시 다운로드하세요."
            />
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>AI 이력서 빌더</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Claude Sonnet으로 구동
          </p>
        </div>
      </footer>
    </div>
  );
}
