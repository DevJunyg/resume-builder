
// ── Shared UI components exported to window ──────────────────────────────────

function GradientText({ children, style = {} }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...style
    }}>{children}</span>
  );
}

function GlowButton({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {} }) {
  const [hov, setHov] = React.useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontWeight: 600, letterSpacing: '-0.01em',
    transition: 'all 0.2s ease', outline: 'none',
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: '6px 14px', fontSize: 13, borderRadius: 8 }, md: { padding: '10px 20px', fontSize: 14, borderRadius: 10 }, lg: { padding: '14px 28px', fontSize: 16, borderRadius: 12 } };
  const variants = {
    primary: {
      background: hov ? 'linear-gradient(135deg, #5254cc 0%, #18b9d4 100%)' : 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
      color: '#fff',
      boxShadow: hov ? '0 0 28px rgba(99,102,241,0.55)' : '0 0 16px rgba(99,102,241,0.3)',
    },
    ghost: {
      background: hov ? 'var(--surface-3)' : 'transparent',
      color: 'var(--text-subtle)',
      border: '1px solid var(--border)',
      boxShadow: hov ? 'var(--glow)' : 'none',
    },
    danger: {
      background: hov ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.25)',
    },
  };
  return (
    <button onClick={!disabled ? onClick : undefined} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Badge({ children, variant = 'default', style = {} }) {
  const vars = {
    default: { background: 'var(--surface-3)', color: 'var(--text-subtle)', border: '1px solid var(--border)' },
    accent: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' },
    cyan: { background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)' },
    green: { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' },
  };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: '0.01em', ...vars[variant], ...style }}>
      {children}
    </span>
  );
}

function SkeletonBlock({ width = '100%', height = 16, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 6, background: 'var(--surface-3)', ...style }} />
  );
}

function Panel({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      ...style
    }}>
      {children}
    </div>
  );
}

function Divider({ style = {} }) {
  return <div style={{ height: 1, background: 'var(--border)', ...style }} />;
}

function ThemeToggle({ theme, onToggle }) {
  // TODO: replace with lucide-react <Sun /> and <Moon />
  return (
    <button onClick={onToggle} title="테마 전환" style={{
      width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
      background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', fontSize: 13,
    }}>
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}

function Logo() {
  // TODO: replace inner icon with lucide-react <FileText size={13} strokeWidth={2.5} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6,
        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 12, fontWeight: 700
      }}>≡</div>
      <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', color: 'var(--text)' }}>
        resumé<GradientText>.ai</GradientText>
      </span>
    </div>
  );
}

Object.assign(window, { GradientText, GlowButton, Badge, SkeletonBlock, Panel, Divider, ThemeToggle, Logo });
