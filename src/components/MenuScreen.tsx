import { useState, useEffect } from 'react'

interface MenuScreenProps {
  onNewGame: () => void
  onHostGame: () => void
  onJoinGame: () => void
  sessionCount: number
  relayConnected: boolean
}

export default function MenuScreen({ onNewGame, onHostGame, onJoinGame, sessionCount, relayConnected }: MenuScreenProps) {
  const [cursorVisible, setCursorVisible] = useState(true)

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
          <div className="menu-feature"><span className="menu-feature-icon">⚡</span> Up to 5 players on the same machine</div>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={onNewGame}>
            <span className="menu-btn-prompt">&gt;_</span>
            Solo Game
            <span className="menu-btn-cursor" style={{ opacity: cursorVisible ? 1 : 0 }}>▮</span>
          </button>

          <div className="menu-mp-row">
            <button className="menu-btn secondary menu-btn-mp" onClick={onHostGame}>
              <span className="menu-btn-prompt">⚡</span>
              Host Lobby
            </button>
            <button
              className={`menu-btn secondary menu-btn-mp ${sessionCount > 0 ? 'mp-found' : ''}`}
              onClick={onJoinGame}
            >
              <span className="menu-btn-prompt">→</span>
              Join Game{sessionCount > 0 ? ` (${sessionCount})` : ''}
            </button>
          </div>

          <div className="menu-mp-status">
            <span style={{ color: relayConnected ? 'var(--green)' : 'var(--red)' }}>
              {relayConnected ? '● relay connected' : '● relay offline — run: node relay.js'}
            </span>
            {relayConnected && (
              <span style={{ color: sessionCount > 0 ? 'var(--green)' : 'var(--mid)', marginLeft: 12 }}>
                {sessionCount > 0 ? `● ${sessionCount} lobby${sessionCount !== 1 ? 'ies' : ''} open` : '○ no lobbies yet'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
