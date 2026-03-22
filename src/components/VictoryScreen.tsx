import type { GameState } from '../types'

interface VictoryScreenProps {
  state: GameState
  onPlayAgain: () => void
  onMenu: () => void
}

function fmt(n: number) {
  return '$' + Math.floor(Math.abs(n)).toLocaleString('en-US')
}

function fmtTime(secs: number) {
  const m = Math.floor(Math.max(0, secs) / 60)
  const s = Math.floor(Math.max(0, secs) % 60)
  return `${m}m ${s}s`
}

export default function VictoryScreen({ state, onPlayAgain, onMenu }: VictoryScreenProps) {
  const investTotal = Object.values(state.investments).reduce((a, b) => a + b, 0)
  const netWorth = state.cash + investTotal - state.debt
  const timeUsed = state.selectedGoal
    ? state.selectedGoal.duration - state.timeRemaining
    : 0

  return (
    <div className="outcome-screen">
      <div className="outcome-glow victory" />

      <div className="outcome-icon">🏆</div>

      <div className="outcome-eyebrow" style={{ color: 'var(--green)' }}>
        · Mission Complete ·
      </div>

      <h2 className="outcome-title" style={{ color: 'var(--yellow)' }}>
        YOU DID IT!
      </h2>

      <p className="outcome-subtitle">
        {state.selectedGoal?.icon} {state.selectedGoal?.name} — achieved with{' '}
        {fmtTime(Math.max(0, state.timeRemaining))} to spare.
      </p>

      <div className="outcome-stats">
        <div className="outcome-stat">
          <div className="outcome-stat-label">Final Net Worth</div>
          <div className="outcome-stat-value" style={{ color: 'var(--green)' }}>
            {fmt(netWorth)}
          </div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Time Used</div>
          <div className="outcome-stat-value">{fmtTime(timeUsed)}</div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Cash On Hand</div>
          <div className="outcome-stat-value" style={{ color: 'var(--sky)' }}>
            {fmt(state.cash)}
          </div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Investments</div>
          <div className="outcome-stat-value" style={{ color: 'var(--teal)' }}>
            {fmt(investTotal)}
          </div>
        </div>
        <div className="outcome-stat">
          <div className="outcome-stat-label">Final Stress</div>
          <div className="outcome-stat-value" style={{ color: state.stress > 70 ? 'var(--red)' : 'var(--green)' }}>
            {Math.round(state.stress)}%
          </div>
        </div>
      </div>

      <div className="outcome-actions">
        <button className="outcome-btn primary" onClick={onPlayAgain}>
          🎮 Play Again
        </button>
        <button className="outcome-btn secondary" onClick={onMenu}>
          ← Main Menu
        </button>
      </div>
    </div>
  )
}
