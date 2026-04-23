
// ── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onStart, theme, onThemeToggle }) {
  const [demoPhase, setDemoPhase] = React.useState(0);
  // Demo animation: 0=normal, 1=yellow, 2=green, 3=normal
  React.useEffect(() => {
    const cycle = () => {
      setDemoPhase(1);
      setTimeout(() => setDemoPhase(2), 1200);
      setTimeout(() => setDemoPhase(3), 2800);
      setTimeout(() => setDemoPhase(0), 4000);
    };
    const t = setTimeout(cycle, 1500);
    const interval = setInterval(cycle, 5500);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);

  const demoHighlight = {
    0: { background: 'transparent', borderRadius: 3 },
    1: { background: 'rgba(234,179,8,0.35)', borderRadius: 3, transition: 'background 0.3s ease' },
    2: { background: 'rgba(34,197,94,0.25)', borderRadius: 3, transition: 'background 0.8s ease' },
    3: { background: 'transparent', borderRadius: 3, transition: 'background 1.2s ease' },
  }[demoPhase];

  // TODO (Claude Code): import { Zap, Target, MessageSquare } from 'lucide-react'
  const features = [
    { icon: null, iconNote: 'Zap', title: '스트리밍 Diff 하이라이트', desc: 'AI가 수정한 부분이 실시간으로 노란색→초록색으로 fade되며 강조됩니다.' },
    { icon: null, iconNote: 'Target', title: 'JD 매칭 분석', desc: '채용 공고를 붙여넣으면 이력서에서 매칭되는 핵심 섹션을 자동으로 강조합니다.' },
    { icon: null, iconNote: 'MessageSquare', title: '대화형 편집', desc: '원하는 방향을 자연어로 말하면 즉시 이력서가 수정됩니다.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 64, borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', background: 'rgba(8,8,14,0.7)' }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <GlowButton onClick={onStart} size="sm">시작하기 →</GlowButton>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 48px 80px', maxWidth: 1280, margin: '0 auto', gap: 80 }}>
        {/* Left: Copy */}
        <div style={{ flex: '0 0 520px' }}>
          <Badge variant="accent" style={{ marginBottom: 24 }}>AI-Powered Resume Builder</Badge>
          <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 24, color: 'var(--text)' }}>
            AI와 대화하며<br />
            <GradientText>완성하는 이력서</GradientText>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: 40, maxWidth: 420 }}>
            자연어로 지시하면 AI가 즉시 수정합니다. 채용 공고를 넣으면 매칭 포인트를 강조하고, 모든 변경사항은 실시간 하이라이트로 확인하세요.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <GlowButton onClick={onStart} size="lg">무료로 시작하기</GlowButton>
            <GlowButton variant="ghost" size="lg">데모 보기</GlowButton>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>신용카드 불필요 · 5분 안에 완성</p>
        </div>

        {/* Right: Animated mockup */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Glow behind */}
          <div style={{ position: 'absolute', inset: '-40px', background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)' }}>
            {/* Mini header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>resumé.ai/builder</span>
            </div>

            {/* Mini builder preview */}
            <div style={{ display: 'flex', height: 380 }}>
              {/* Mini chat */}
              <div style={{ width: 200, borderRight: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Chat</div>
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 10, fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.5 }}>자기소개를 더 임팩트있게 수정해줘</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#22d3ee)', flexShrink: 0 }} />
                  <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: 'var(--text)', lineHeight: 1.5, flex: 1 }}>
                    자기소개를 업데이트했어요! 비즈니스 임팩트를 강조했습니다.
                  </div>
                </div>
              </div>

              {/* Mini resume */}
              <div style={{ flex: 1, padding: 16, background: '#fff', color: '#1a1a2e', overflowY: 'hidden' }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: '#0d0d1a' }}>김지현</div>
                <div style={{ fontSize: 11, color: '#6868a0', marginBottom: 12 }}>jihyun@email.com · 010-1234-5678</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0d0d1a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>자기소개</div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: '#2d2d4a', padding: '4px 6px', ...demoHighlight }}>
                  5년 경력의 프론트엔드 엔지니어. React/TypeScript 기반의 복잡한 SaaS 제품을 처음부터 끝까지 주도하며...
                </div>
                <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#0d0d1a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>경력</div>
                <div style={{ borderLeft: '3px solid #22d3ee', paddingLeft: 8, background: 'rgba(34,211,238,0.06)', borderRadius: '0 4px 4px 0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0d0d1a' }}>시니어 프론트엔드 개발자</div>
                  <div style={{ fontSize: 11, color: '#6868a0' }}>(주)테크스타트 · 2022–현재</div>
                </div>
                {/* Diff badge */}
                {demoPhase > 0 && demoPhase < 3 && (
                  <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4, background: demoPhase === 1 ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.15)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: demoPhase === 1 ? '#d97706' : '#16a34a', transition: 'all 0.6s ease' }}>
                    <span>{demoPhase === 1 ? '✏️' : '✓'}</span>
                    {demoPhase === 1 ? 'AI 수정 중...' : 'AI가 수정했어요'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 48px 100px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12 }}>
            킬러 <GradientText>피처</GradientText>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>인터뷰어가 "AI UX를 아는 개발자"라고 느끼게 하는 차별화된 기능들</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 64 }}>
          <GlowButton onClick={onStart} size="lg">지금 이력서 만들기 →</GlowButton>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, iconNote, title, desc }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      padding: 28, borderRadius: 12, border: `1px solid ${hov ? 'rgba(99,102,241,0.28)' : 'var(--border)'}`,
      background: hov ? 'var(--surface-2)' : 'var(--surface)',
      transition: 'all 0.2s ease', cursor: 'default',
    }}>
      {/* TODO: replace with <{iconNote} size={20} strokeWidth={1.8} /> */}
      <div style={{ marginBottom: 16, width: 20, height: 20, borderRadius: 4, background: 'var(--surface-3)', opacity: 0.7 }} />
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

Object.assign(window, { LandingPage });
