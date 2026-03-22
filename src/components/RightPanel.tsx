import type { GameState, IncomeSourceId } from '../types'
import type { EventChoice } from '../types'
import { INCOME_SOURCES } from '../gameData'
import IncomeCard from './IncomeCard'
import EventModal from './EventModal'

interface RightPanelProps {
  state: GameState
  onToggleSource: (id: IncomeSourceId) => void
  onPurchaseSource: (id: IncomeSourceId) => void
  onInvest: (id: IncomeSourceId, amount: number) => void
  onEventChoice: (choice: EventChoice) => void
  netWorth: number
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

export default function RightPanel({
  state,
  onToggleSource,
  onPurchaseSource,
  onInvest,
  onEventChoice,
  netWorth,
}: RightPanelProps) {
  const investmentSources = INCOME_SOURCES.filter(s => s.isInvestment)
  const hasAnyInvestment = investmentSources.some(s => (state.investments[s.id] ?? 0) > 0)

  return (
    <div className="right-panel">
      {state.activeEvent && (
        <EventModal
          event={state.activeEvent}
          countdown={state.eventCountdown}
          maxCountdown={12}
          onChoice={onEventChoice}
        />
      )}

      {/* Upcoming event warning */}
      {!state.activeEvent && state.nextEventIn <= 5 && (
        <div className="event-notification-bar">
          <span>⚡</span>
          <span className="event-notification-text">Life event incoming!</span>
          <span className="event-notification-countdown">{Math.ceil(state.nextEventIn)}s</span>
        </div>
      )}

      {/* Income Sources */}
      <div className="section-header-row">
        <span className="section-title-small">Income Sources</span>
        <div className="section-divider" />
      </div>

      <div className="income-grid">
        {INCOME_SOURCES.map(src => (
          <IncomeCard
            key={src.id}
            src={src}
            state={state}
            onToggle={onToggleSource}
            onPurchase={onPurchaseSource}
            onInvest={onInvest}
            netWorth={netWorth}
          />
        ))}
      </div>

      {/* Portfolio */}
      <div className="section-header-row">
        <span className="section-title-small">Portfolio</span>
        <div className="section-divider" />
      </div>

      {hasAnyInvestment ? (
        <div className="portfolio-grid">
          {investmentSources.map(src => {
            const val = state.investments[src.id] ?? 0
            if (val <= 0) return null
            const src2 = INCOME_SOURCES.find(s => s.id === src.id)
            const rateText = src2?.investRatePerMin
              ? `+${(src2.investRatePerMin * 100).toFixed(1)}%/min`
              : src.id === 'crypto'
              ? '±20% every 30s'
              : ''
            return (
              <div key={src.id} className="portfolio-card">
                <div className="portfolio-card-name">{src.icon} {src.name}</div>
                <div className="portfolio-card-value">{fmt(val)}</div>
                {rateText && <div className="portfolio-card-rate">{rateText}</div>}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="no-portfolio-msg">
          No investments yet. Purchase an investment source above and add funds to grow your wealth passively.
        </p>
      )}
    </div>
  )
}
