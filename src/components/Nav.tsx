import type { GameState } from '../types'
import { calcNetWorth, TOTAL_YEARS, HALF_YEAR_SEC } from '../gameData'

interface NavProps {
  state: GameState
  onBack?: () => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n < 0 ? '-' : '') + '$' + (abs / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000)     return (n < 0 ? '-' : '') + '$' + Math.floor(abs).toLocaleString('en-US')
  return (n < 0 ? '-' : '') + '$' + Math.floor(abs)
}

function fmtTime(secs: number) {
  const total = Math.max(0, secs)
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Nav({ state, onBack }: NavProps) {
  const isGame = state.screen === 'game'
  const netWorth = isGame ? calcNetWorth(state) : 0

  // Total game = 40 half-years × 30s = 1200s
  // Remaining = (39 - halfYearsElapsed) × HALF_YEAR_SEC + timeToNextHalfYear
  const totalSecsLeft = isGame
    ? Math.max(0, (39 - state.halfYearsElapsed) * HALF_YEAR_SEC + state.timeToNextHalfYear)
    : 0

  return (
    <nav className="nav">
      <div className="nav-logo">
        BROKE <span>U</span>
      </div>

      {isGame && (
        <>
          <div className="nav-year">
            // year <span className="nav-year-num">{state.year}</span> of {TOTAL_YEARS}
          </div>
          <div className={`nav-timer ${totalSecsLeft < 120 ? 'urgent' : ''}`}>
            ● {fmtTime(totalSecsLeft)}
          </div>
          <div className="nav-nw">
            NET WORTH: <span className="nav-nw-val">{fmt(netWorth)}</span>
          </div>
          {state.isPaused && (
            <div className="nav-paused">⏸ PAUSED</div>
          )}
        </>
      )}

      {onBack && !isGame && (
        <button className="btn-back" onClick={onBack} style={{ marginLeft: 'auto', marginRight: 12 }}>
          ← Back
        </button>
      )}

      <div className="nav-status">
        <div className="nav-dot" />
        FINANCIAL SURVIVAL RPG
      </div>
    </nav>
  )
}
