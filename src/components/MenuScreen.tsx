interface MenuScreenProps {
  onNewGame: () => void
}

export default function MenuScreen({ onNewGame }: MenuScreenProps) {
  const now = new Date()
  const hours = now.getHours()
  const timeStr = hours < 6 ? '2:47 AM' : hours < 12 ? '9:13 AM' : hours < 17 ? '2:34 PM' : '11:22 PM'

  return (
    <div className="menu-screen">
      <div className="menu-left">
        <div className="menu-glow a" />
        <div className="menu-glow b" />
        <div className="menu-eyebrow">· Financial Survival RPG ·</div>
        <h1 className="menu-title">
          <span className="r">BROKE</span>{' '}
          <span className="y">U</span>
        </h1>
        <p className="menu-tagline">
          "Adulting is a full-time job with no training."
        </p>

        <div className="menu-feature-list">
          <div className="menu-feature">📅 20-year simulation · 1 real minute = 1 year</div>
          <div className="menu-feature">📈 Stocks, index funds, real estate, crypto</div>
          <div className="menu-feature">🤖 Race against a computer opponent</div>
          <div className="menu-feature">⚡ 15 life events that test your decisions</div>
          <div className="menu-feature">📖 Finance Codex — learn as you play</div>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={onNewGame}>
            <span>🎮</span>
            New Game — Start Surviving
            <span className="menu-btn-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="menu-right">
        <div className="menu-right-content">
          <div className="menu-scene-label">📍 Your apartment · Year 1</div>
          <div className="menu-scene-time">{timeStr}</div>
          <div className="menu-scene-desc">
            Ramen for dinner again. $500 in the bank. 20 years to build something.
            Can you outperform the computer?
          </div>
          <div className="menu-goals-preview">
            <span className="goal-chip">🏦 Bank savings</span>
            <span className="goal-chip">📈 Index funds</span>
            <span className="goal-chip">🏠 Real estate</span>
            <span className="goal-chip">📊 Individual stocks</span>
            <span className="goal-chip">🪙 Crypto (yr 10+)</span>
            <span className="goal-chip">💻 Side hustles</span>
          </div>
        </div>
      </div>
    </div>
  )
}
