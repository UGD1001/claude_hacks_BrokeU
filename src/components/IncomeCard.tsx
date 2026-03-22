import type { IncomeSource, IncomeSourceId, GameState } from '../types'
import { INVEST_AMOUNTS } from '../gameData'

interface IncomeCardProps {
  src: IncomeSource
  state: GameState
  onToggle: (id: IncomeSourceId) => void
  onPurchase: (id: IncomeSourceId) => void
  onInvest: (id: IncomeSourceId, amount: number) => void
  netWorth: number
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

export default function IncomeCard({ src, state, onToggle, onPurchase, onInvest, netWorth }: IncomeCardProps) {
  const isActive = state.activeIncomeSources.includes(src.id)
  const isPurchased = state.purchasedSources.includes(src.id) || src.setupCost === 0
  const isUnlocked = netWorth >= src.unlockNetWorth
  const isLocked = !isUnlocked
  const investVal = state.investments[src.id] ?? 0

  const canAffordPurchase = state.cash >= src.setupCost

  let rateDisplay = ''
  let rateUnit = ''
  if (src.isInvestment && src.investRatePerMin) {
    const pct = (src.investRatePerMin * 100).toFixed(1)
    rateDisplay = `+${pct}%`
    rateUnit = '/min'
  } else if (src.ratePerSec > 0) {
    let rate = src.ratePerSec
    if (src.id === 'hustle' && state.hustleBoost > 1 && state.hustleBoostRemaining > 0) {
      rate *= state.hustleBoost
    }
    if (src.id === 'dayjob' && state.jobUpgraded) {
      rate += 25
    }
    rateDisplay = fmt(rate)
    rateUnit = '/s'
  } else if (src.id === 'crypto') {
    rateDisplay = '±20%'
    rateUnit = '/30s'
  } else {
    rateDisplay = '—'
    rateUnit = ''
  }

  return (
    <div className={`income-card ${isActive && isPurchased ? 'active' : ''} ${isLocked ? 'locked' : ''}`}>
      <div className="income-card-top">
        <span className="income-icon">{src.icon}</span>
        <span className="income-name">{src.name}</span>
        <span className={`risk-badge risk-${src.riskLevel}`}>{src.riskLevel}</span>
      </div>

      <div className="income-card-mid">
        <span className="income-rate-display">{rateDisplay}</span>
        <span className="income-rate-unit-small">{rateUnit}</span>
        {src.isInvestment && investVal > 0 && (
          <span className="income-invest-value">{fmt(investVal)}</span>
        )}
      </div>

      {isLocked && (
        <div className="locked-msg">
          🔒 Unlock at {fmt(src.unlockNetWorth)} net worth
        </div>
      )}

      {!isLocked && !isPurchased && (
        <div className="income-card-actions">
          <button
            className="btn-purchase"
            disabled={!canAffordPurchase}
            onClick={() => onPurchase(src.id)}
          >
            {canAffordPurchase ? `Setup — ${fmt(src.setupCost)}` : `Need ${fmt(src.setupCost)}`}
          </button>
        </div>
      )}

      {!isLocked && isPurchased && (
        <div className="income-card-actions">
          {!src.isInvestment && (
            <button
              className={`btn-toggle ${isActive ? 'on' : 'off'}`}
              onClick={() => onToggle(src.id)}
            >
              {isActive ? '● ON' : '○ OFF'}
            </button>
          )}

          {src.isInvestment && (
            <>
              {INVEST_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  className="btn-invest"
                  disabled={state.cash < amt}
                  onClick={() => onInvest(src.id, amt)}
                >
                  +{fmt(amt)}
                </button>
              ))}
              <button
                className="invest-all-btn"
                disabled={state.cash < 100}
                onClick={() => onInvest(src.id, Math.floor(state.cash * 0.9))}
              >
                +90% Cash
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
