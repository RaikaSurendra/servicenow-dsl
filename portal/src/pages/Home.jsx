import { useState } from 'react'
import { chapters } from '../data/chapters.js'
import ChapterCard from '../components/ChapterCard.jsx'
import { TopNav } from '../components/Layout.jsx'

// Chapter 8 is the featured MVP — rest are grid chapters
const featuredChapter = chapters.find((c) => c.isMvp)
const gridChapters    = chapters.filter((c) => !c.isMvp)

const SECTIONS = [
  { label: 'Foundation',      filter: (c) => c.difficulty === 'beginner' },
  { label: 'Building Blocks', filter: (c) => c.difficulty === 'intermediate' && !c.isMvp },
  { label: 'Advanced',        filter: (c) => c.difficulty === 'advanced' && !c.isMvp },
]

export default function Home({ onOpenChapter }) {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <TopNav onHome={() => {}} />

      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 2rem' }}>

        {/* ── Page header ── */}
        <header style={{ paddingTop: '72px', paddingBottom: '56px' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-sn-green-light)',
            marginBottom: '20px',
          }}>
            @servicenow/sdk v4.x · 10 chapters
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 500,
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
            marginBottom: '20px',
            letterSpacing: '-0.01em',
          }}>
            ServiceNow Fluent DSL<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
              Learning Hub
            </em>
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '16px',
            lineHeight: '1.7',
            color: 'var(--color-text-secondary)',
            maxWidth: '560px',
            fontWeight: 300,
          }}>
            A progressive, hands-on path through the ServiceNow Fluent SDK — from first deploy
            to a production Container Vulnerability Management application.
          </p>
        </header>

        {/* ── Credential safety notice ── */}
        <div style={{
          borderLeft: '2px solid rgba(245,158,11,0.4)',
          background: 'rgba(245,158,11,0.04)',
          borderRadius: '0 6px 6px 0',
          padding: '12px 18px',
          marginBottom: '64px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '14px', marginTop: '1px' }}>🔒</span>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontWeight: 300, margin: 0 }}>
            All projects load credentials from <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px' }}>.env</code> files.
            Never commit instance URLs, usernames, or passwords. Each project ships a{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px' }}>.env.example</code> template.
          </p>
        </div>

        {/* ── Featured: MVP chapter ── */}
        <section style={{ marginBottom: '72px' }}>
          <SectionLabel>Featured</SectionLabel>
          <FeaturedCard chapter={featuredChapter} onClick={onOpenChapter} />
        </section>

        {/* ── Chapter sections ── */}
        {SECTIONS.map(({ label, filter }) => {
          const chs = gridChapters.filter(filter)
          if (!chs.length) return null
          return (
            <section key={label} style={{ marginBottom: '64px' }}>
              <SectionLabel>{label}</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {chs.map((ch) => <ChapterCard key={ch.id} chapter={ch} onClick={onOpenChapter} />)}
              </div>
            </section>
          )
        })}

        {/* ── Footer ── */}
        <footer style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '32px',
          paddingBottom: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            SN/ fluent-dsl
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 300 }}>
            React 19 · Vite 6 · Tailwind 4 · Vercel
          </span>
        </footer>
      </div>
    </div>
  )
}

/* ── Featured card — full-width editorial hero ── */
function FeaturedCard({ chapter, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => onClick(chapter)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'block',
        background: hovered ? 'var(--color-surface-overlay)' : 'var(--color-surface-raised)',
        border: `1px solid ${hovered ? 'var(--color-border-hover)' : 'var(--color-border)'}`,
        borderRadius: '12px',
        padding: 'clamp(28px, 4vw, 48px)',
        cursor: 'pointer',
        transition: 'all 220ms ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--color-sn-green-light)', letterSpacing: '0.05em' }}>
          CH{String(chapter.number).padStart(2, '0')}
        </span>
        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--color-text-tertiary)', display: 'inline-block' }} />
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#a5b4fc',
          background: 'rgba(99,102,241,0.12)',
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          MVP
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', marginLeft: 'auto', fontWeight: 300 }}>
          {chapter.duration}
        </span>
      </div>

      {/* Title */}
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(24px, 3.5vw, 36px)',
        fontWeight: 500,
        lineHeight: 1.25,
        color: 'var(--color-text-primary)',
        marginBottom: '14px',
        letterSpacing: '-0.01em',
      }}>
        {chapter.title}
      </h2>

      {/* Subtitle */}
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '15px',
        lineHeight: '1.65',
        color: 'var(--color-text-secondary)',
        fontWeight: 300,
        maxWidth: '600px',
        marginBottom: '28px',
      }}>
        {chapter.subtitle}
      </p>

      {/* Packages + tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
        {chapter.sdkPackages.slice(0, 3).map((pkg) => (
          <span key={pkg} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-sn-green-light)',
            background: 'var(--color-sn-green-dim)',
            padding: '3px 8px',
            borderRadius: '4px',
            opacity: hovered ? 1 : 0.8,
            transition: 'opacity 200ms ease',
          }}>
            {pkg}
          </span>
        ))}
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          transition: 'color 200ms ease',
        }}>
          Read chapter →
        </span>
      </div>
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-sans)',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--color-text-tertiary)',
      marginBottom: '20px',
    }}>
      {children}
    </p>
  )
}
