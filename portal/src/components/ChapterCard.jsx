import { useState } from 'react'
import { difficultyLabel } from '../data/chapters.js'

const difficultyDot = {
  beginner:     'var(--color-sn-green-light)',
  intermediate: 'var(--color-medium)',
  advanced:     'var(--color-critical)',
}

export default function ChapterCard({ chapter, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => onClick(chapter)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'left',
        width: '100%',
        background: hovered ? 'var(--color-surface-overlay)' : 'var(--color-surface-raised)',
        border: `1px solid ${hovered ? 'var(--color-border-hover)' : 'var(--color-border)'}`,
        borderRadius: '10px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* Top row: chapter number + difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-sn-green-light)',
            letterSpacing: '0.05em',
          }}>
            {String(chapter.number).padStart(2, '0')}
          </span>
          {chapter.isMvp && (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a5b4fc',
              background: 'rgba(99,102,241,0.12)',
              padding: '2px 7px',
              borderRadius: '4px',
            }}>
              MVP
            </span>
          )}
          {chapter.isCommunity && (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              background: 'rgba(255,255,255,0.04)',
              padding: '2px 7px',
              borderRadius: '4px',
            }}>
              Community
            </span>
          )}
        </div>

        {/* Difficulty indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: difficultyDot[chapter.difficulty],
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
            {difficultyLabel[chapter.difficulty]}
          </span>
        </div>
      </div>

      {/* Title — serif */}
      <h3 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '17px',
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        lineHeight: '1.35',
        marginBottom: '8px',
        transition: 'color 200ms ease',
      }}>
        {chapter.title}
      </h3>

      {/* Subtitle */}
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        lineHeight: '1.6',
        color: 'var(--color-text-secondary)',
        marginBottom: '20px',
        fontWeight: 300,
      }}>
        {chapter.subtitle}
      </p>

      {/* Footer: tags + duration */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {chapter.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-tertiary)',
              background: 'rgba(255,255,255,0.04)',
              padding: '2px 6px',
              borderRadius: '3px',
              letterSpacing: '0.02em',
            }}>
              {tag}
            </span>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 300, whiteSpace: 'nowrap', marginLeft: '12px' }}>
          {chapter.duration}
        </span>
      </div>
    </button>
  )
}
