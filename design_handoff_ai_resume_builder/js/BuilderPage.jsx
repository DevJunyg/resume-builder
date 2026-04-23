
// ── Builder Page (Chat + Resume + Tools) ────────────────────────────────────
// TODO (Claude Code): import { Send, ArrowLeft, Search, FileDown, Clipboard, Zap, Target, MessageSquare } from 'lucide-react'
// and replace placeholder chars below with the corresponding icon components.

// ── Chat Panel ──────────────────────────────────────────────────────────────
function ChatPanel({ messages, onSend, isStreaming, skeleton }) {
  const [input, setInput] = React.useState('');
  const listRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput('');
  };

  const quickActions = AI_SCENARIOS.map(s => s.prompt);

  function renderMd(text) {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', textTransform: 'uppercase', letterSpacing: '0.06em' }}>대화</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />연결됨
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>제안</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {quickActions.map((q, i) => (
            <button key={i} onClick={() => !isStreaming && onSend(q)} style={{
              textAlign: 'left', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 12px', fontSize: 12, color: 'var(--text-subtle)',
              cursor: isStreaming ? 'not-allowed' : 'pointer', opacity: isStreaming ? 0.5 : 1,
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!isStreaming) e.target.style.borderColor = 'rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {skeleton ? (
          <>
            <SkeletonBlock height={60} style={{ borderRadius: 10 }} />
            <SkeletonBlock height={40} width="70%" style={{ borderRadius: 10, alignSelf: 'flex-end' }} />
            <SkeletonBlock height={80} style={{ borderRadius: 10 }} />
          </>
        ) : messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
            {msg.role === 'ai' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>어시스턴트</span>
              </div>
            )}
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #4f56e0)' : 'var(--surface-2)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: 13, lineHeight: 1.6,
              border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
              boxShadow: msg.role === 'user' ? '0 2px 12px rgba(99,102,241,0.3)' : 'none',
            }}>
              {msg.streaming && msg.text === '' ? (
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI가 생각 중</span>
                  <span className="thinking-dots" />
                </span>
              ) : (
                <>
                  <span dangerouslySetInnerHTML={{ __html: renderMd(msg.text) }} />
                  {msg.streaming && <span className="stream-cursor">|</span>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--surface-2)', borderRadius: 12, padding: '8px 12px', border: '1px solid var(--border)', transition: 'border-color 0.2s' }}>
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="이력서 수정 방향을 말씀해주세요..." rows={2}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}
          />
          <button onClick={handleSend} disabled={isStreaming || !input.trim()} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: input.trim() && !isStreaming ? 'linear-gradient(135deg,#6366f1,#22d3ee)' : 'var(--surface-3)',
            color: input.trim() && !isStreaming ? '#fff' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', fontSize: 13,
          }}>{/* TODO: <Send size={13} /> */}↑</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>Enter로 전송 · Shift+Enter 줄바꿈</div>
      </div>
    </div>
  );
}

// ── Resume Preview ───────────────────────────────────────────────────────────
function ResumePreview({ data, diffs, jdMatched, skeleton }) {
  function diffStyle(id) {
    if (!diffs[id]) return {};
    const phase = diffs[id];
    if (phase === 1) return { background: 'rgba(234,179,8,0.3)', borderRadius: 3, transition: 'background 0.3s' };
    if (phase === 2) return { background: 'rgba(34,197,94,0.2)', borderRadius: 3, transition: 'background 0.9s' };
    return { background: 'transparent', borderRadius: 3, transition: 'background 1.2s' };
  }
  function jdStyle(id) {
    if (!jdMatched.has(id)) return {};
    return { borderLeft: '3px solid #22d3ee', paddingLeft: 12, marginLeft: -15, background: 'rgba(34,211,238,0.05)', borderRadius: '0 4px 4px 0', transition: 'all 0.5s ease' };
  }

  const resumeText = { fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1a2e' };
  const sectionTitle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4a8a', borderBottom: '1.5px solid #e8e8f4', paddingBottom: 6, marginBottom: 12 };

  return (
    <div style={{ width: '100%', maxWidth: 640, background: '#ffffff', borderRadius: 12, padding: '36px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', ...resumeText, alignSelf: 'flex-start' }}>
        {skeleton ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonBlock height={32} width="50%" />
            <SkeletonBlock height={14} width="70%" />
            <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
            <SkeletonBlock height={60} />
            <SkeletonBlock height={14} width="30%" />
            <SkeletonBlock height={80} />
            <SkeletonBlock height={80} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24, ...jdStyle('summary') }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#0d0d1a', marginBottom: 2 }}>{data.name}</h1>
              <p style={{ fontSize: 13, color: '#6868a0', marginBottom: 10 }}>{data.title}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: '#4a4a6a' }}>
                <span>✉ {data.email}</span>
                <span>📱 {data.phone}</span>
                <span>⌥ {data.github}</span>
                <span>in {data.linkedin}</span>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>자기소개</div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#2d2d4a', ...diffStyle('summary') }}>{data.summary}</p>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>핵심역량</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.skills.map(s => (
                  <span key={s} style={{ padding: '3px 10px', background: '#f0f0f8', border: '1px solid #e0e0f0', borderRadius: 20, fontSize: 12, color: '#4a4a8a', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>경력</div>
              {data.experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: 18, paddingLeft: 15, ...jdStyle(exp.id) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0d1a' }}>{exp.role}</span>
                      <span style={{ fontSize: 13, color: '#6868a0', marginLeft: 8 }}>{exp.company}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#9898b8', whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.period}</span>
                  </div>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {exp.items.map(item => (
                      <li key={item.id} style={{ fontSize: 13, color: '#2d2d4a', lineHeight: 1.7, marginBottom: 2, ...diffStyle(item.id) }}>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Education */}
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>학력</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0d1a' }}>{data.education.school}</span>
                  <span style={{ fontSize: 13, color: '#6868a0', marginLeft: 8 }}>{data.education.degree}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9898b8' }}>{data.education.period}</span>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <div style={sectionTitle}>기술 스택</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.techStack.map(t => (
                  <span key={t} style={{ padding: '3px 10px', background: jdMatched.has(t) ? 'rgba(34,211,238,0.12)' : '#f8f8fc', border: `1px solid ${jdMatched.has(t) ? '#22d3ee' : '#e0e0f0'}`, borderRadius: 6, fontSize: 12, color: jdMatched.has(t) ? '#0e7490' : '#4a4a8a', fontWeight: 500, transition: 'all 0.4s' }}>{t}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
  );
}

// ── Tools Panel ──────────────────────────────────────────────────────────────
function ToolsPanel({ tone, onToneChange, onJDAnalyze, isAnalyzing, onExport }) {
  const [jdText, setJdText] = React.useState('');
  const [toastMsg, setToastMsg] = React.useState('');
  const tones = [
    { id: 'professional', label: '전문적', desc: '명확·간결' },
    { id: 'creative', label: '창의적', desc: '독창·개성' },
    { id: 'academic', label: '학술적', desc: '논리·체계' },
    { id: 'startup', label: '스타트업', desc: '열정·임팩트' },
  ];
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--surface)' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 999, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
          {toastMsg}
        </div>
      )}

      {/* JD Input */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>JD 분석</div>
        <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="채용 공고 내용을 여기에 붙여넣으세요..." rows={5}
          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
        <GlowButton onClick={() => onJDAnalyze(jdText)} disabled={isAnalyzing || !jdText.trim()} style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
          {isAnalyzing ? (
            <><span className="thinking-dots" />{' '}분석 중...</>
          ) : <>{/* TODO: <Search size={13} /> */}JD 매칭 분석</>}
        </GlowButton>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Tone */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>톤 & 스타일</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {tones.map(t => (
            <button key={t.id} onClick={() => onToneChange(t.id)} style={{
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              background: tone === t.id ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
              border: `1px solid ${tone === t.id ? 'rgba(99,102,241,0.45)' : 'var(--border)'}`,
              boxShadow: tone === t.id ? '0 0 14px rgba(99,102,241,0.2)' : 'none',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tone === t.id ? '#818cf8' : 'var(--text)', marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Export */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>내보내기</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(() => { const { FileDown, Clipboard } = window.LucideReact || {};
            return (<>
              <GlowButton variant="ghost" onClick={() => showToast('PDF 생성 중...')} style={{ justifyContent: 'center', width: '100%', gap: 6 }}>{/* TODO: <FileDown size={13} /> */}PDF로 저장</GlowButton>
              <GlowButton variant="ghost" onClick={() => showToast('Markdown 복사됨!')} style={{ justifyContent: 'center', width: '100%', gap: 6 }}>{/* TODO: <Clipboard size={13} /> */}Markdown 복사</GlowButton>
            </>);
          })()}
        </div>
      </div>
    </div>
  );
}

// ── Builder Page Shell ───────────────────────────────────────────────────────
function BuilderPage({ theme, onThemeToggle, onBack }) {
  const [resume, setResume] = React.useState(RESUME_DATA);
  const [diffs, setDiffs] = React.useState({});
  const [jdMatched, setJdMatched] = React.useState(new Set());
  const [messages, setMessages] = React.useState([
    { id: 0, role: 'ai', text: '안녕하세요! 이력서를 함께 개선해봐요. 아래 제안을 클릭하거나 직접 입력해주세요.' }
  ]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [tone, setTone] = React.useState('professional');
  const [skeleton, setSkeleton] = React.useState(true);

  React.useEffect(() => {
    setTimeout(() => setSkeleton(false), 1400);
  }, []);

  const applyDiff = (ids) => {
    const set = (phase) => setDiffs(prev => {
      const next = { ...prev };
      ids.forEach(id => next[id] = phase);
      return next;
    });
    set(1);
    setTimeout(() => set(2), 1000);
    setTimeout(() => set(3), 2800);
    setTimeout(() => setDiffs(prev => {
      const next = { ...prev };
      ids.forEach(id => delete next[id]);
      return next;
    }), 4200);
  };

  const handleSend = async (text) => {
    if (!text.trim() || isStreaming) return;
    const scenario = AI_SCENARIOS.find(s => s.prompt === text) || AI_SCENARIOS[0];
    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    const aiId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', streaming: true }]);

    await streamText(scenario.response, partial => {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: partial } : m));
    });
    setMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
    setIsStreaming(false);

    if (scenario.type === 'summary') {
      setResume(prev => ({ ...prev, summary: UPDATED_SUMMARY }));
      applyDiff(['summary']);
    } else if (scenario.type === 'exp') {
      setResume(prev => ({
        ...prev,
        experience: prev.experience.map(e => e.id === 'exp1' ? { ...e, items: UPDATED_EXP1 } : e)
      }));
      applyDiff(['e1-1', 'e1-2', 'e1-3']);
    } else if (scenario.type === 'jd') {
      setJdMatched(JD_MATCHED);
      applyDiff(['summary', 'exp1']);
    }
  };

  const handleJDAnalyze = async (jdText) => {
    if (!jdText.trim()) return;
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 1800));
    setJdMatched(JD_MATCHED);
    applyDiff(['summary', 'exp1']);
    setIsAnalyzing(false);
    const aiId = Date.now();
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', streaming: true }]);
    await streamText('JD 분석 완료! **React/TypeScript**, **SaaS 경험**, **성능 최적화** 부분이 강하게 매칭됩니다. 파란색으로 표시된 섹션들을 중심으로 어필하세요.', partial => {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: partial } : m));
    });
    setMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{ height: 56, flexShrink: 0, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>←</button>
          <Logo />
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>김지현의 이력서</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Object.keys(diffs).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              수정 적용 중
            </div>
          )}
          {jdMatched.size > 0 && (
            <div style={{ padding: '3px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              JD 분석됨
            </div>
          )}
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </header>

      {/* 3-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat - 340px */}
        <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
          <ChatPanel messages={messages} onSend={handleSend} isStreaming={isStreaming} skeleton={skeleton} />
        </div>

        {/* Resume preview - flex */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '8px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>미리보기</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 6 }}>실시간</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--surface-2)', display: 'flex', justifyContent: 'center' }}>
            <ResumePreview data={resume} diffs={diffs} jdMatched={jdMatched} skeleton={skeleton} />
          </div>
        </div>

        {/* Tools - 264px */}
        <div style={{ width: 264, flexShrink: 0, borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ position: 'sticky', top: 0, padding: '8px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>도구</span>
          </div>
          <ToolsPanel tone={tone} onToneChange={setTone} onJDAnalyze={handleJDAnalyze} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BuilderPage });
