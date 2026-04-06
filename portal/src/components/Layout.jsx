export function TopNav({ onHome, currentChapter }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(20, 20, 19, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <button
          onClick={onHome}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--color-sn-green-light)', letterSpacing: '0.02em' }}>
            SN/
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '14px', color: 'var(--color-text-primary)', letterSpacing: '0.01em' }}>
            fluent-dsl
          </span>
        </button>

        {/* Breadcrumb */}
        {currentChapter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              CH{String(currentChapter.number).padStart(2, '0')}
            </span>
            <span>·</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{currentChapter.title}</span>
          </div>
        )}

        {/* CTA — Anthropic text-link style */}
        <a
          href="https://developer.servicenow.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color 200ms ease' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          Get PDI →
        </a>
      </div>
    </nav>
  )
}

export function Callout({ type = 'info', title, children }) {
  const styles = {
    info:    { accent: 'var(--color-info)',     bg: 'rgba(96,165,250,0.06)',  label: 'Note' },
    warning: { accent: 'var(--color-medium)',   bg: 'rgba(245,158,11,0.06)', label: 'Warning' },
    danger:  { accent: 'var(--color-critical)', bg: 'rgba(239,68,68,0.06)',  label: 'Security' },
    tip:     { accent: 'var(--color-sn-green-light)', bg: 'rgba(0,192,96,0.06)', label: 'Tip' },
  }
  const s = styles[type]
  return (
    <div style={{
      borderLeft: `2px solid ${s.accent}`,
      background: s.bg,
      borderRadius: '0 6px 6px 0',
      padding: '14px 18px',
      margin: '20px 0',
    }}>
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: s.accent,
        marginBottom: '6px',
      }}>
        {title || s.label}
      </p>
      <div style={{ fontSize: '14px', lineHeight: '1.65', color: 'var(--color-text-primary)' }}>
        {children}
      </div>
    </div>
  )
}

export function Divider() {
  return <div style={{ height: '1px', background: 'var(--color-border)', margin: '48px 0' }} />
}
