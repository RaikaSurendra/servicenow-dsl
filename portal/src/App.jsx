import { useState } from 'react'
import Home from './pages/Home.jsx'
import ChapterPage from './pages/ChapterPage.jsx'

export default function App() {
  const [view, setView] = useState('home')
  const [activeChapter, setActiveChapter] = useState(null)

  const openChapter = (chapter) => {
    setActiveChapter(chapter)
    setView('chapter')
    window.scrollTo(0, 0)
  }

  const goHome = () => {
    setView('home')
    setActiveChapter(null)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>
      {view === 'home' && <Home onOpenChapter={openChapter} />}
      {view === 'chapter' && (
        <ChapterPage chapter={activeChapter} onBack={goHome} onOpenChapter={openChapter} />
      )}
    </div>
  )
}
