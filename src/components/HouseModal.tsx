import { useState } from 'react'
import type { HouseOption, MortgageTerm } from '../types'
import { MORTGAGE_RATES, computeMonthlyPayment } from '../gameData'

interface Props {
  options: HouseOption[]
  playerCash: number
  onPurchase: (option: HouseOption, downPct: number, termYears: MortgageTerm) => void
  onDecline: () => void
}

const DOWN_PCT_OPTIONS = [0.10, 0.20, 0.30, 0.50]
const TERM_OPTIONS: MortgageTerm[] = [10, 15, 20]

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function fmtPct(n: number) {
  return (n * 100).toFixed(0) + '%'
}

export default function HouseModal({ options, playerCash, onPurchase, onDecline }: Props) {
  const [selectedOption, setSelectedOption] = useState<HouseOption | null>(null)
  const [downPct, setDownPct] = useState<number>(0.20)
  const [termYears, setTermYears] = useState<MortgageTerm>(15)

  const downAmount    = selectedOption ? selectedOption.price * downPct : 0
  const principal     = selectedOption ? selectedOption.price - downAmount : 0
  const rate          = MORTGAGE_RATES[termYears]
  const monthlyPay    = selectedOption ? computeMonthlyPayment(principal, rate, termYears) : 0
  const annualMortgage = monthlyPay * 12
  const canAfford     = selectedOption ? playerCash >= downAmount : false

  function handleBuy() {
    if (!selectedOption || !canAfford) return
    onPurchase(selectedOption, downPct, termYears)
  }

  return (
    <div className="house-modal-backdrop">
      <div className="house-modal">
        {/* Header */}
        <div className="house-modal-header">
          <div className="house-modal-title">🏡 You Found a Property!</div>
          <div className="house-modal-subtitle">Choose your home and financing terms.</div>
        </div>

        {/* Step 1 — Choose house */}
        <div className="house-modal-section-label">STEP 1 — SELECT A PROPERTY</div>
        <div className="house-option-grid">
          {options.map(opt => {
            const isSelected = selectedOption?.type === opt.type
            return (
              <button
                key={opt.type}
                className={`house-option-tile${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedOption(opt)}
              >
                <div className="house-option-icon">
                  {opt.type === 'starter' ? '🏠' : opt.type === 'suburban' ? '🏡' : '🏛️'}
                </div>
                <div className="house-option-label">{opt.label}</div>
                <div className="house-option-neighbourhood">{opt.neighbourhood}</div>
                <div className="house-option-price">{fmt(opt.price)}</div>
                <div className="house-option-badges">
                  <span className="house-badge appreciation">
                    +{(opt.appreciationRate * 100).toFixed(0)}%/yr
                  </span>
                  <span className="house-badge rental">
                    {fmt(opt.rentalIncomeMonthly)}/mo rental
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Step 2 — Financing (only shown after house selected) */}
        {selectedOption && (
          <div className="house-financing">
            <div className="house-modal-section-label">STEP 2 — FINANCING</div>

            {/* Down payment */}
            <div className="house-financing-row">
              <div className="house-financing-row-label">Down Payment</div>
              <div className="house-dp-options">
                {DOWN_PCT_OPTIONS.map(pct => (
                  <button
                    key={pct}
                    className={`house-dp-btn${downPct === pct ? ' active' : ''}`}
                    onClick={() => setDownPct(pct)}
                  >
                    {fmtPct(pct)}
                  </button>
                ))}
              </div>
              <div className="house-payment-preview">
                = {fmt(selectedOption.price * downPct)} down &middot; {fmt(selectedOption.price - selectedOption.price * downPct)} mortgage
              </div>
            </div>

            {/* Mortgage term */}
            <div className="house-financing-row">
              <div className="house-financing-row-label">Mortgage Term</div>
              <div className="house-term-options">
                {TERM_OPTIONS.map(term => (
                  <button
                    key={term}
                    className={`house-term-btn${termYears === term ? ' active' : ''}`}
                    onClick={() => setTermYears(term)}
                  >
                    {term}yr {(MORTGAGE_RATES[term] * 100).toFixed(1)}%
                  </button>
                ))}
              </div>
              <div className="house-payment-preview">
                &asymp; {fmt(monthlyPay)}/mo &middot; Annual mortgage: {fmt(annualMortgage)}/yr
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Actions */}
        <div className="house-modal-actions">
          {selectedOption && (
            <>
              {!canAfford && (
                <div className="house-afford-warning">
                  &#9888; Not enough cash for this downpayment
                  &nbsp;(need {fmt(downAmount)}, have {fmt(playerCash)})
                </div>
              )}
              <button
                className="house-buy-btn"
                disabled={!canAfford}
                onClick={handleBuy}
              >
                Buy {selectedOption.label} &mdash; {fmt(downAmount)} down
              </button>
            </>
          )}
          <button className="house-decline-btn" onClick={onDecline}>
            Decline &mdash; I&apos;m not ready
          </button>
        </div>
      </div>
    </div>
  )
}
