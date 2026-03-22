interface MenuScreenProps {
  onNewGame: () => void
  gpa: number
  knowledge: number
  stress: number
}

export default function MenuScreen({ onNewGame, gpa, knowledge, stress }: MenuScreenProps) {
  const stats = [
    { name: 'GPA', value: gpa, max: 4.0, displayVal: gpa.toFixed(1), color: 'var(--green)' },
    { name: 'Knowledge', value: knowledge, max: 100, displayVal: `${knowledge}%`, color: 'var(--blue)' },
    { name: 'Stress', value: stress, max: 100, displayVal: `${stress}%`, color: stress > 60 ? 'var(--red)' : 'var(--yellow)' },
    { name: 'Broke-ness', value: 82, max: 100, displayVal: '82%', color: 'var(--red)' },
  ]

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

        <div className="stat-bars">
          {stats.map(s => (
            <div key={s.name} className="stat-row">
              <span className="stat-name">{s.name}</span>
              <div className="stat-track">
                <div
                  className="stat-fill"
                  style={{
                    width: `${(s.value / s.max) * 100}%`,
                    background: s.color,
                  }}
                />
              </div>
              <span className="stat-val">{s.displayVal}</span>
            </div>
          ))}
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={onNewGame}>
            <span>🎮</span>
            New Game — Start Surviving
            <span className="menu-btn-arrow">→</span>
          </button>
          <button
            className="menu-btn secondary"
            onClick={() => alert('CODEX: Master the art of passive income. Buy assets, not liabilities. Keep stress low and net worth high. Time is your enemy — every second counts!')}
          >
            <span>📖</span>
            Codex — Financial Tips
            <span className="menu-btn-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="menu-right">
        <div className="menu-right-content">
          <div className="menu-scene-label">📍 Your apartment · Semester 3</div>
          <div className="menu-scene-time">{timeStr}</div>
          <div className="menu-scene-desc">
            Ramen for dinner again. Your student loans aren't going to pay themselves.
            Time to hustle.
          </div>
          <div className="menu-goals-preview">
            <span className="goal-chip">🚗 Buy a car</span>
            <span className="goal-chip">🎓 Pay loans</span>
            <span className="goal-chip">🚀 Start biz</span>
            <span className="goal-chip">🏠 House down</span>
            <span className="goal-chip">🌴 Early retire</span>
          </div>
        </div>
      </div>
    </div>
  )
}
