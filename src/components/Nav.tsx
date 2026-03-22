import type { GameState } from '../types'
import { calcNetWorth, TOTAL_YEARS, YEAR_SEC } from '../gameData'

interface NavProps {
  state: GameState
  onBack?: () => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n<0?'-':'')+'$'+(abs/1_000_000).toFixed(2)+'M'
  return (n<0?'-':'')+'$'+Math.floor(abs).toLocaleString('en-US')
}

function fmtTime(secs: number) {
  const t = Math.max(0, secs)
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2,'0')}`
}

export default function Nav({ state, onBack }: NavProps) {
  const isGame = state.screen === 'game'
  const netWorth = isGame ? calcNetWorth(state) : 0
  const yearsLeft = Math.max(0, TOTAL_YEARS - state.year + 1)
  const totalSecsLeft = isGame ? state.timeToNextYear + (yearsLeft - 1) * YEAR_SEC : 0

  return (
    <nav className="nav">
      <div className="nav-logo">BROKE <span>U</span></div>

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
          {state.isPaused && <div className="nav-paused">⏸ PAUSED</div>}
        </>
      )}

      {onBack && !isGame && (
        <button className="btn-back" onClick={onBack} style={{ marginBottom:0, marginLeft:'auto', marginRight:10 }}>
          ◄ BACK
        </button>
      )}

      <div className="nav-status">
        <div className="nav-dot" />
        FINANCIAL SURVIVAL RPG
      </div>
    </nav>
  )
}
