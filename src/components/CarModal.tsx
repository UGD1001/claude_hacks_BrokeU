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
  const nw = calcNetWorth(state)
  const compNW = calcCompNetWorth(state)
  const compBought = state.compCarOwned

  const canAfford = state.cash >= CAR_GOAL || (state.cash + state.indexValue) >= CAR_GOAL

  return (
    <div className="event-overlay">
      <div className="event-modal car-modal">
        <div className="car-modal-icon">🚗</div>

        <div className="event-title" style={{ textAlign: 'center', marginBottom: 8 }}>
          You have {fmt(nw)} saved!
        </div>
        <p className="event-desc" style={{ textAlign: 'center' }}>
          The car is within reach.{' '}
          {compBought
            ? `The computer already bought its car at Year ${state.year - 1}.`
            : 'The computer hasn\'t bought its car yet.'}
        </p>

        <div className="car-modal-compare">
          <div className="car-cmp-col">
            <div className="car-cmp-label">You</div>
            <div className="car-cmp-nw" style={{ color: 'var(--yellow)' }}>{fmt(nw)}</div>
          </div>
          <div className="car-cmp-col">
            <div className="car-cmp-label">Computer</div>
            <div className="car-cmp-nw" style={{ color: 'var(--mid)' }}>{fmt(compNW)}</div>
          </div>
        </div>

        <div className="car-modal-note">
          Buying the car costs {fmt(CAR_GOAL)} and depreciates 10%/yr.
          After buying, goal shifts to net worth maximization.
        </div>

        <div className="car-modal-btns">
          <button
            className="car-btn-buy"
            onClick={onBuy}
            disabled={!canAfford}
          >
            🚗 Buy the car — {fmt(CAR_GOAL)}
          </button>
          <button className="car-btn-skip" onClick={onSkip}>
            Keep investing instead →
          </button>
        </div>
      </div>
    </div>
  )
}
