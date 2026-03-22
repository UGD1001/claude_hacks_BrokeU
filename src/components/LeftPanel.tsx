import type { GameState } from '../types'
import { INCOME_SOURCES } from '../gameData'

interface LeftPanelProps {
  state: GameState
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function fmtTime(secs: number) {
  const m = Math.floor(Math.max(0, secs) / 60)
  const s = Math.floor(Math.max(0, secs) % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function LeftPanel({ state }: LeftPanelProps) {
  const investTotal = Object.values(state.investments).reduce((a, b) => a + b, 0)
  const netWorth = state.cash + investTotal - state.debt

  const goalPct = state.selectedGoal
    ? Math.min(100, (netWorth / state.selectedGoal.amount) * 100)
    : 0

  const remaining = state.selectedGoal ? Math.max(0, state.selectedGoal.amount - netWorth) : 0

  // Compute income/s
  let incomePerSec = 0
  for (const srcId of state.activeIncomeSources) {
    const src = INCOME_SOURCES.find(s => s.id === srcId)
    if (!src || src.isInvestment) continue
    let rate = src.ratePerSec
    if (srcId === 'hustle' && state.hustleBoost > 1) rate *= state.hustleBoost
    if (srcId === 'dayjob' && state.jobUpgraded) rate += 25
    incomePerSec += rate
  }
  // Add investment passive income estimates
  const investSrcIds: Array<keyof typeof state.investments> = ['hysa', 'index', 'dividend']
  for (const id of investSrcIds) {
    const val = state.investments[id] ?? 0
    const src = INCOME_SOURCES.find(s => s.id === id)
    if (src?.investRatePerMin && val > 0) {
      incomePerSec += (src.investRatePerMin / 60) * val
    }
  }

  const stressColor =
    state.stress > 70 ? 'var(--red)' : state.stress > 40 ? 'var(--yellow)' : 'var(--green)'

  return (
    <div className="left-panel">
      <div className="panel-logo">
        BROKE <span>U</span>
      </div>

      {state.selectedGoal && (
        <div className="goal-progress-section">
          <div className="goal-progress-label">
            <span className="goal-progress-name">
              {state.selectedGoal.icon} {state.selectedGoal.name}
            </span>
            <span className="goal-progress-pct">{goalPct.toFixed(1)}%</span>
          </div>
          <div className="goal-progress-track">
            <div
              className="goal-progress-fill"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <div className="goal-progress-remaining">
            {fmt(remaining)} remaining
          </div>
        </div>
      )}

      <div className="divider" />

      <div className="stat-block">
        <div className="stat-item">
          <div className="stat-label">Net Worth</div>
          <div className="stat-value net-worth">{fmt(netWorth)}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Cash Balance</div>
          <div className={`stat-value cash ${state.cash < 500 ? 'low' : ''}`}>
            {fmt(state.cash)}
          </div>
          {state.lentMoney > 0 && (
            <div className="stat-sub">
              💸 {fmt(state.lentMoney)} lent — returns in {Math.ceil(state.lentReturnIn)}s
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="stat-item">
        <div className="stat-label">Time Remaining</div>
        <div className={`time-display ${state.timeRemaining < 60 ? 'urgent' : ''}`}>
          {fmtTime(state.timeRemaining)}
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-label">Income Rate</div>
        <div className="income-rate">
          <span className="income-rate-val">{fmt(incomePerSec)}</span>
          <span className="income-rate-unit">/s</span>
        </div>
        {state.hustleBoost > 1 && state.hustleBoostRemaining > 0 && (
          <div className="stat-sub" style={{ color: 'var(--green)' }}>
            🔥 VIRAL BOOST {Math.ceil(state.hustleBoostRemaining)}s
          </div>
        )}
        {state.jobUpgraded && (
          <div className="stat-sub" style={{ color: 'var(--teal)' }}>
            ✓ Upgraded job +$25/s
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="stress-section">
        <div className="stress-label">
          <span className="stress-name">Stress</span>
          <span className="stress-val">{Math.round(state.stress)}%</span>
        </div>
        <div className="stress-track">
          <div
            className="stress-fill"
            style={{
              width: `${state.stress}%`,
              background: stressColor,
            }}
          />
        </div>
      </div>

      {state.debt > 0 && (
        <div className="debt-section">
          <div className="debt-label">⚠ Active Debt (18% APR)</div>
          <div className="debt-value">{fmt(state.debt)}</div>
        </div>
      )}

      {investTotal > 0 && (
        <>
          <div className="divider" />
          <div className="stat-item">
            <div className="stat-label">Investments Total</div>
            <div className="stat-value" style={{ color: 'var(--teal)', fontSize: 22 }}>
              {fmt(investTotal)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
