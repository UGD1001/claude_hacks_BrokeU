import { useState, useEffect } from 'react'

interface MenuScreenProps {
  onNewGame: () => void
}

export default function MenuScreen({ onNewGame }: MenuScreenProps) {
  const [cursorVisible, setCursorVisible] = useState(true)

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="menu-screen-centered">
      <div className="menu-content">
        <div className="menu-glow a" />
        <div className="menu-glow b" />
        <div className="menu-eyebrow">&gt;_ FINANCIAL SURVIVAL RPG</div>
        <h1 className="menu-title">
          <span className="r">BROKE</span>{' '}
          <span className="y">U</span>
        </h1>
        <p className="menu-tagline">
          "Adulting is a full-time job with no training."
        </p>

        <div className="menu-feature-list">
          <div className="menu-feature"><span className="menu-feature-icon">→</span> 20-year simulation · 1 real minute = 1 year</div>
          <div className="menu-feature"><span className="menu-feature-icon">$</span> Stocks, index funds, real estate, crypto</div>
          <div className="menu-feature"><span className="menu-feature-icon">×</span> Race against a computer opponent</div>
          <div className="menu-feature"><span className="menu-feature-icon">!</span> 15 life events that test your decisions</div>
          <div className="menu-feature"><span className="menu-feature-icon">?</span> Finance Codex — learn as you play</div>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={onNewGame}>
            <span className="menu-btn-prompt">&gt;_</span>
            Start Surviving
            <span className="menu-btn-cursor" style={{ opacity: cursorVisible ? 1 : 0 }}>▮</span>
          </button>
        </div>
      </div>
    </div>
  )
}