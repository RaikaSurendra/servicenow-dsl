import { useState } from 'react'

function tokenize(code, language) {
  const lines = code.split('\n')
  return lines.map((line) => {
    const tokens = []

    if (language === 'bash') {
      if (line.trim().startsWith('#')) {
        tokens.push({ type: 'comment', text: line })
        return tokens
      }
      const cmdMatch = line.match(/^(\s*)([\w.-]+)(.*)$/)
      if (cmdMatch) {
        tokens.push({ type: 'plain', text: cmdMatch[1] })
        tokens.push({ type: 'function', text: cmdMatch[2] })
        tokens.push({ type: 'plain', text: cmdMatch[3] })
        return tokens
      }
    }

    const patterns = [
      { type: 'comment',  re: /(\/\/.*$|\/\*[\s\S]*?\*\/)/ },
      { type: 'string',   re: /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/ },
      { type: 'keyword',  re: /\b(import|export|from|default|const|let|var|function|return|if|else|for|while|class|extends|new|this|async|await|try|catch|throw|of|in|type|interface|implements)\b/ },
      { type: 'type',     re: /\b(string|number|boolean|void|null|undefined|any|never|object|Promise|Array)\b/ },
      { type: 'function', re: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/ },
      { type: 'number',   re: /\b(\d+\.?\d*)\b/ },
      { type: 'property', re: /\.([a-zA-Z_$][\w$]*)/ },
    ]

    let remaining = line
    while (remaining.length > 0) {
      let matched = false
      for (const { type, re } of patterns) {
        const m = remaining.match(new RegExp('^(.*?)' + re.source + '(.*)$'))
        if (m) {
          if (m[1]) tokens.push({ type: 'plain', text: m[1] })
          tokens.push({ type, text: m[2] })
          remaining = m[m.length - 1]
          matched = true
          break
        }
      }
      if (!matched) { tokens.push({ type: 'plain', text: remaining }); break }
    }
    return tokens
  })
}

export default function CodeBlock({ code, language = 'js', filename, showLineNumbers = true }) {
  const [copied, setCopied] = useState(false)
  const tokenizedLines = tokenize(code.trim(), language)

  const copy = async () => {
    await navigator.clipboard.writeText(code.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#0d1117',
      margin: '16px 0',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 16px',
        background: '#0d1117',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {filename && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
            }}>
              {filename}
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            background: 'rgba(0,165,80,0.1)',
            color: 'rgba(0,192,96,0.7)',
            padding: '1px 6px',
            borderRadius: '3px',
          }}>
            {language}
          </span>
        </div>
        <button
          onClick={copy}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: copied ? 'var(--color-sn-green-light)' : 'var(--color-text-tertiary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            transition: 'color 200ms ease',
          }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* Code */}
      <pre style={{
        padding: '20px',
        overflowX: 'auto',
        fontSize: '13px',
        lineHeight: '1.75',
        margin: 0,
        fontFamily: 'var(--font-mono)',
      }}>
        {tokenizedLines.map((lineTokens, i) => (
          <div key={i} style={{ display: 'flex' }}>
            {showLineNumbers && (
              <span style={{
                userSelect: 'none',
                paddingRight: '20px',
                minWidth: '32px',
                textAlign: 'right',
                color: 'rgba(255,255,255,0.15)',
                fontSize: '12px',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
            )}
            <span>
              {lineTokens.map((token, j) => (
                <span key={j} className={`token-${token.type}`}>{token.text}</span>
              ))}
            </span>
          </div>
        ))}
      </pre>
    </div>
  )
}
