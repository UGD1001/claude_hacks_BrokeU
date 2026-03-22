import type { House } from '../types'

interface Props {
  house: House
  currentRent: number
  onMoveIn: () => void
  onRentOut: () => void
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

export default function HouseMoveModal({ house, currentRent, onMoveIn, onRentOut }: Props) {
  return (
    <div className="house-modal-backdrop">
      <div className="house-move-modal">
        {/* Header */}
        <div className="house-modal-header">
          <div className="house-modal-title" style={{ color: 'var(--sky)' }}>
            🏠 Your New Home!
          </div>
          <div className="house-modal-subtitle">What do you want to do with it?</div>
        </div>

        {/* Two choice cards */}
        <div className="house-move-grid">
          {/* Card A — Move In */}
          <button className="house-move-card movein" onClick={onMoveIn}>
            <div className="house-move-card-icon">🚚</div>
            <div className="house-move-card-title">Move In</div>
            <div className="house-move-card-benefit" style={{ color: 'var(--green)' }}>
              Cancel apartment rent: saves {fmt(currentRent)}/mo
            </div>
            <div className="house-move-card-note">
              You cannot rent this property out
            </div>
          </button>

          {/* Card B — Rent It Out */}
          <button className="house-move-card rentout" onClick={onRentOut}>
            <div className="house-move-card-icon">💰</div>
            <div className="house-move-card-title">Rent It Out</div>
            <div className="house-move-card-benefit" style={{ color: 'var(--teal)' }}>
              Earn {fmt(house.rentalIncomeMonthly)}/mo rental income
            </div>
            <div className="house-move-card-note">
              You keep paying apartment rent
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
