import type { GameState } from '../types'

interface GameOverScreenProps {
  state: GameState
  onPlayAgain: () => void
  onMenu: () => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function fmtTime(secs: number) {
  const m = Math.floor(Math.max(0, secs) / 60)
  const s = Math.floor(Math.max(0, secs) % 60)
  return `${m}m ${s}s`
}

export default function GameOverScreen({ state, onPlayAgain, onMenu }: GameOverScreenProps) {
  const investTotal = Object.values(state.investments).reduce((a, b) => a + b, 0)
  const netWorth = state.cash + investTotal - state.debt
  const timeUsed = state.selectedGoal
    ? state.selectedGoal.duration - state.timeRemaining
    : 0
  const shortfall = state.selectedGoal
    ? Math.max(0, state.selectedGoal.amount - netWorth)
    : 0

  return (
    <div className="outcome-screen">
      <div className="outcome-glow gameover" />

      <div className="outcome-icon">💀</div>

      <div className="outcome-eyebrow" style={{ color: 'var(--red)' }}>
        · Game Over ·
      </div>

      <h2 className="outcome-title" style={{ color: 'var(--red)' }}>
        BROKE OUT
      </h2>

      <p className="outcome-subtitle">
        {state.gameOverReason} You needed{' '}
        {state.selectedGoal ? fmt(shortfall) + ' more' : 'to manage better'}.
      </p>

      <div className="outcome-stats">
        <div className="outcome-stat">
          <div className="outcome-stat-label">Final Net Worth</div>
          <div className="outcome-stat-value" style={{ color: netWorth < 0 ? 'var(--red)' : 'var(--sky)' }}>
            {fmt(netWorth)}
          </div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Time Survived</div>
          <div className="outcome-stat-value">{fmtTime(timeUsed)}</div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Shortfall</div>
          <div className="outcome-stat-value" style={{ color: 'var(--red)' }}>
            {fmt(shortfall)}
          </div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Debt</div>
          <div className="outcome-stat-value" style={{ color: state.debt > 0 ? 'var(--red)' : 'var(--green)' }}>
            {state.debt > 0 ? fmt(state.debt) : 'None!'}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 400,
          textAlign: 'center',
          marginBottom: 32,
          fontSize: 13,
          color: 'var(--mid)',
          fontFamily: 'Crimson Text, serif',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}
      >
        💡 Tip: Build passive income early, keep emergency cash buffer &gt;$1,000,
        and don't panic-sell during market dips.
      </div>

      <div className="outcome-actions">
        <button className="outcome-btn primary" onClick={onPlayAgain}>
          🔄 Try Again
        </button>
        <button className="outcome-btn secondary" onClick={onMenu}>
          ← Main Menu
        </button>
      </div>
    </div>
  )
}
