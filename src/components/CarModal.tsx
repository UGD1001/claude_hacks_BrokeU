import type { GameState } from '../types'
import { calcNetWorth, calcCompNetWorth, CAR_GOAL } from '../gameData'

interface Props {
  state: GameState
  onBuy: () => void
  onSkip: () => void
}

function fmt(n: number) {
  return '$' + Math.floor(Math.abs(n)).toLocaleString('en-US')
}

export default function CarModal({ state, onBuy, onSkip }: Props) {
  const nw     = calcNetWorth(state)
  const compNW = calcCompNetWorth(state)
  const canAfford = state.cash >= CAR_GOAL || (state.cash + state.indexValue) >= CAR_GOAL

  return (
    <div className="event-overlay">
      <div className="car-modal">
        <div className="car-modal-icon">🚗</div>

        <div className="event-title" style={{ textAlign:'center', marginBottom:8 }}>
          YOU HAVE {fmt(nw)} SAVED!
        </div>

        <p className="event-desc" style={{ textAlign:'center' }}>
          The car is within reach.{' '}
          {state.compCarOwned
            ? `The computer already bought its car.`
            : "The computer hasn't bought its car yet."}
        </p>

        <div className="car-modal-compare">
          <div className="car-cmp-col">
            <div className="car-cmp-label">YOU</div>
            <div className="car-cmp-nw" style={{ color:'var(--amber)' }}>{fmt(nw)}</div>
          </div>
          <div className="car-cmp-col">
            <div className="car-cmp-label">COMPUTER</div>
            <div className="car-cmp-nw" style={{ color:'var(--slate)' }}>{fmt(compNW)}</div>
          </div>
        </div>

        <div className="car-modal-note">
          Buying costs {fmt(CAR_GOAL)} and depreciates 10%/yr.<br/>
          After buying, goal shifts to net worth maximization.
        </div>

        <div className="car-modal-btns">
          <button className="car-btn-buy" onClick={onBuy} disabled={!canAfford}>
            🚗 BUY THE CAR — {fmt(CAR_GOAL)}
          </button>
          <button className="car-btn-skip" onClick={onSkip}>
            KEEP INVESTING →
          </button>
        </div>
      </div>
    </div>
  )
}
