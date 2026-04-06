import { lazy, Suspense, useState } from 'react'
import { TopNav, Callout } from '../components/Layout.jsx'
import CodeBlock from '../components/CodeBlock.jsx'
import { chapters, difficultyLabel } from '../data/chapters.js'

const contentModules = {
  ch01: lazy(() => import('../content/ch01.jsx')),
  ch02: lazy(() => import('../content/ch02.jsx')),
  ch03: lazy(() => import('../content/ch03.jsx')),
  ch04: lazy(() => import('../content/ch04.jsx')),
  ch05: lazy(() => import('../content/ch05.jsx')),
  ch06: lazy(() => import('../content/ch06.jsx')),
  ch07: lazy(() => import('../content/ch07.jsx')),
  ch08: lazy(() => import('../content/ch08.jsx')),
  ch09: lazy(() => import('../content/ch09.jsx')),
}

export default function ChapterPage({ chapter, onBack, onOpenChapter }) {
  const ChapterContent = contentModules[chapter.id]
  const chapterIndex   = chapters.findIndex((c) => c.id === chapter.id)
  const prevChapter    = chapters[chapterIndex - 1]
  const nextChapter    = chapters[chapterIndex + 1]

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <TopNav onHome={onBack} currentChapter={chapter} />

      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '0 2rem' }}>

        {/* Back link */}
        <div style={{ paddingTop: '40px', marginBottom: '40px' }}>
          <BackLink onClick={onBack} />
        </div>

        {/* Chapter header */}
        <header style={{ marginBottom: '40px' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-sn-green-light)',
              letterSpacing: '0.08em',
            }}>
              CH{String(chapter.number).padStart(2, '0')}
            </span>
            <span style={{ color: 'var(--color-border-hover)', fontSize: '12px' }}>·</span>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              fontWeight: 300,
            }}>
              {difficultyLabel[chapter.difficulty]}
            </span>
            {chapter.isMvp && (
              <>
                <span style={{ color: 'var(--color-border-hover)', fontSize: '12px' }}>·</span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#a5b4fc',
                  background: 'rgba(99,102,241,0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  MVP
                </span>
              </>
            )}
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              fontWeight: 300,
            }}>
              {chapter.duration}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 500,
            lineHeight: 1.2,
            color: 'var(--color-text-primary)',
            marginBottom: '12px',
            letterSpacing: '-0.01em',
          }}>
            {chapter.title}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '16px',
            lineHeight: '1.65',
            color: 'var(--color-text-secondary)',
            fontWeight: 300,
            marginBottom: '0',
          }}>
            {chapter.subtitle}
          </p>
        </header>

        {/* Packages used */}
        <div style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '40px',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary)',
            marginBottom: '10px',
          }}>
            Packages
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {chapter.sdkPackages.map((pkg) => (
              <code key={pkg} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-sn-green-light)',
                background: 'var(--color-sn-green-dim)',
                padding: '3px 10px',
                borderRadius: '4px',
              }}>
                {pkg}
              </code>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '40px' }} />

        {/* Chapter content */}
        <div style={{ paddingBottom: '24px' }}>
          <Suspense fallback={
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
              Loading…
            </p>
          }>
            <ChapterContent CodeBlock={CodeBlock} Callout={Callout} />
          </Suspense>
        </div>

        {/* Prev / Next */}
        <div style={{ height: '1px', background: 'var(--color-border)', margin: '48px 0 32px' }} />
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '80px' }}>
          {prevChapter && <NavCard chapter={prevChapter} direction="prev" onClick={() => onOpenChapter(prevChapter)} />}
          {nextChapter && <NavCard chapter={nextChapter} direction="next" onClick={() => onOpenChapter(nextChapter)} />}
        </div>
      </div>
    </div>
  )
}

function BackLink({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
        transition: 'color 200ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      ← All chapters
    </button>
  )
}

function NavCard({ chapter, direction, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        textAlign: direction === 'prev' ? 'left' : 'right',
        padding: '20px',
        background: hovered ? 'var(--color-surface-overlay)' : 'var(--color-surface-raised)',
        border: `1px solid ${hovered ? 'var(--color-border-hover)' : 'var(--color-border)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
    >
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '6px', fontWeight: 300 }}>
        {direction === 'prev' ? '← Previous' : 'Next →'}
      </p>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
        {chapter.title}
      </p>
    </button>
  )
}
