import { useState } from 'react'
import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice } from '../types'
import { STOCK_IDS, CRYPTO_IDS, STOCK_META, CRYPTO_META, calcNetWorth, CAR_GOAL } from '../gameData'
import EventModal from './EventModal'
import CarModal from './CarModal'

interface Props {
  state: GameState
  onEventChoice: (c: EventChoice) => void
  onCarBuy: () => void
  onCarSkip: () => void
  onInvestCore: (type: CoreInvestmentId, amount: number) => void
  onWithdrawCore: (type: CoreInvestmentId, amount: number) => void
  onBuyStock: (id: StockId, shares: number) => void
  onSellStock: (id: StockId, shares: number) => void
  onBuyCrypto: (id: CryptoId, units: number) => void
  onSellCrypto: (id: CryptoId, units: number) => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(2) + 'M'
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function fmtPrice(p: number) {
  if (p >= 1000) return '$' + p.toFixed(0)
  if (p >= 1)   return '$' + p.toFixed(2)
  if (p >= 0.01) return '$' + p.toFixed(4)
  return '$' + p.toExponential(2)
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, width = 80, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <svg width={width} height={height} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const isUp = data[data.length - 1] >= data[0]
  const col = isUp ? '#a2e45a' : '#c75347'
  const lastIdx = data.length - 1
  const lx = (lastIdx / (data.length - 1)) * width
  const ly = height - pad - ((data[lastIdx] - min) / range) * (height - pad * 2)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={col} />
    </svg>
  )
}

// ── Core investment tile ───────────────────────────────────────────────────────

interface CoreTileProps {
  id: CoreInvestmentId
  icon: string
  name: string
  value: number
  returnRate: string
  riskLabel: string
  riskClass: string
  locked: boolean
  lockMsg?: string
  cash: number
  canWithdraw?: boolean
  onInvest: (amount: number) => void
  onWithdraw: (amount: number) => void
}

function CoreTile({ icon, name, value, returnRate, riskLabel, riskClass, locked, lockMsg, cash, canWithdraw, onInvest, onWithdraw }: CoreTileProps) {
  const [expanded, setExpanded] = useState(false)
  const isPositive = !returnRate.startsWith('−')

  return (
    <div className={`inv-tile ${locked ? 'locked' : ''} ${expanded ? 'expanded' : ''}`} onClick={() => !locked && setExpanded(v => !v)}>
      <div className="inv-tile-top">
        <span className="inv-tile-icon">{icon}</span>
        <span className={`inv-ret-badge ${isPositive ? 'pos' : 'neg'}`}>{returnRate}</span>
      </div>
      <div className="inv-tile-name">{name}</div>
      <div className="inv-tile-val">{value > 0 ? fmt(value) : locked ? '—' : '$0'}</div>
      <div className={`inv-risk risk-${riskClass}`}>{locked ? (lockMsg ?? '🔒 locked') : riskLabel}</div>

      {expanded && !locked && (
        <div className="inv-tile-expand" onClick={e => e.stopPropagation()}>
          <div className="inv-expand-cash">Cash: {fmt(cash)}</div>
          <div className="inv-expand-btns">
            {[500, 1000, 5000].map(amt => (
              <button key={amt} className="inv-btn" disabled={cash < amt} onClick={() => onInvest(amt)}>
                +${amt >= 1000 ? amt / 1000 + 'k' : amt}
              </button>
            ))}
            <button className="inv-btn inv-btn-all" disabled={cash < 100} onClick={() => onInvest(Math.floor(cash * 0.9))}>
              +90%
            </button>
          </div>
          {canWithdraw && value > 0 && (
            <div className="inv-expand-btns inv-withdraw-btns">
              {[500, 1000, 5000].map(amt => (
                <button key={amt} className="inv-btn inv-btn-sell" disabled={value < amt} onClick={() => onWithdraw(amt)}>
                  −${amt >= 1000 ? amt / 1000 + 'k' : amt}
                </button>
              ))}
              <button className="inv-btn inv-btn-sell inv-btn-all" disabled={value <= 0} onClick={() => onWithdraw(Math.floor(value))}>
                −all
              </button>
            </div>
          )}
          <button className="inv-btn inv-btn-done" onClick={() => setExpanded(false)}>done ✓</button>
        </div>
      )}
    </div>
  )
}

// ── Stock/crypto tile ─────────────────────────────────────────────────────────

interface AssetTileProps {
  id: StockId | CryptoId
  ticker: string
  company: string
  price: number
  sparkline: number[]
  held: number
  cash: number
  isCrypto?: boolean
  onBuy: (qty: number) => void
  onSell: (qty: number) => void
}

function AssetTile({ id, ticker, company, price, sparkline, held, cash, isCrypto, onBuy, onSell }: AssetTileProps) {
  const [expanded, setExpanded] = useState(false)
  const [qty, setQty] = useState(isCrypto ? 0.01 : 1)
  void id

  const prev = sparkline.length >= 2 ? sparkline[sparkline.length - 2] : sparkline[0]
  const chgPct = prev > 0 ? ((price - prev) / prev) * 100 : 0
  const isUp = chgPct >= 0
  const holdingVal = held * price
  const buyCost = price * qty
  const minQty = isCrypto ? 0.01 : 1

  return (
    <div className={`stock-tile ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(v => !v)}>
      <div className="st-top">
        <span className="st-ticker">{ticker}</span>
        <span className={`st-chg ${isUp ? 'pos' : 'neg'}`}>{isUp ? '+' : ''}{chgPct.toFixed(1)}%</span>
      </div>
      <div className="st-company">{company}</div>
      <div className="st-spark">
        <Sparkline data={sparkline} width={90} height={28} />
      </div>
      <div className="st-price">{fmtPrice(price)}</div>
      {held > 0 && (
        <div className="st-held" style={{ color: 'var(--teal)' }}>
          {isCrypto ? held.toFixed(4) : held} {isCrypto ? ticker : 'shares'} · {fmt(holdingVal)}
        </div>
      )}

      {expanded && (
        <div className="st-expand" onClick={e => e.stopPropagation()}>
          <div className="st-qty-row">
            <button className="st-qty-btn" onClick={() => setQty(q => Math.max(minQty, parseFloat((q - minQty).toFixed(2))))}>−</button>
            <span className="st-qty-val">{isCrypto ? qty.toFixed(2) : qty}</span>
            <button className="st-qty-btn" onClick={() => setQty(q => parseFloat((q + minQty).toFixed(2)))}>+</button>
          </div>
          <div className="st-cost">cost: {fmtPrice(buyCost)}</div>
          <div className="st-expand-btns">
            <button className="st-btn buy" disabled={cash < buyCost} onClick={() => { onBuy(qty); setExpanded(false) }}>
              buy {isCrypto ? qty.toFixed(2) : qty}
            </button>
            <button className="st-btn sell" disabled={held < qty} onClick={() => { onSell(qty); setExpanded(false) }}>
              sell {isCrypto ? qty.toFixed(2) : qty}
            </button>
          </div>
          <button className="st-btn-done" onClick={() => setExpanded(false)}>done ✓</button>
        </div>
      )}
    </div>
  )
}

// ── Center panel ──────────────────────────────────────────────────────────────

export default function CenterPanel({
  state, onEventChoice, onCarBuy, onCarSkip,
  onInvestCore, onWithdrawCore, onBuyStock, onSellStock, onBuyCrypto, onSellCrypto,
}: Props) {
  const nw = calcNetWorth(state)
  const cryptoUnlocked = state.year >= 10

  return (
    <div className="center-panel">
      {/* Event overlay */}
      {state.activeEvent && (
        <EventModal event={state.activeEvent} onChoice={onEventChoice} />
      )}

      {/* Car modal */}
      {state.showCarModal && (
        <CarModal state={state} onBuy={onCarBuy} onSkip={onCarSkip} />
      )}

      {/* Goal bar / net worth */}
      <div className="cp-goal-bar">
        {state.phase === 'car' ? (
          <>
            <div className="cp-goal-label">
              <span>🚗 Race to {fmt(CAR_GOAL)}</span>
              <span>{fmt(nw)} saved · {fmt(Math.max(0, CAR_GOAL - nw))} to go</span>
            </div>
            <div className="cp-goal-track">
              <div className="cp-goal-fill" style={{ width: `${Math.min(100, (nw / CAR_GOAL) * 100)}%` }} />
            </div>
          </>
        ) : (
          <div className="cp-goal-label">
            <span>📈 Net Worth Race</span>
            <span className="cp-nw-big">{fmt(nw)}</span>
          </div>
        )}
        <div className="cp-hint">Tap any tile to invest</div>
      </div>

      {/* Core investments */}
      <div className="cp-section">
        <div className="cp-section-hdr">
          <span>CORE INVESTMENTS</span>
          <div className="cp-section-line" />
        </div>
        <div className="inv-grid">
          <CoreTile
            id="bank" icon="🏦" name="Bank Savings" value={state.bankValue}
            returnRate="+1.5%/yr" riskLabel="no risk" riskClass="safe"
            locked={false} cash={state.cash} canWithdraw
            onInvest={amt => onInvestCore('bank', amt)}
            onWithdraw={amt => onWithdrawCore('bank', amt)}
          />
          <CoreTile
            id="index" icon="📈" name="Index Fund" value={state.indexValue}
            returnRate="+7%/yr avg" riskLabel="medium risk" riskClass="medium"
            locked={false} cash={state.cash} canWithdraw
            onInvest={amt => onInvestCore('index', amt)}
            onWithdraw={amt => onWithdrawCore('index', amt)}
          />
          <CoreTile
            id="cryptoBasket" icon="🪙" name="Crypto Basket" value={state.cryptoBasketValue}
            returnRate="+22%/yr avg" riskLabel="extreme risk" riskClass="extreme"
            locked={!cryptoUnlocked} lockMsg={`🔒 unlocks yr 10 (yr ${state.year})`}
            cash={state.cash} canWithdraw
            onInvest={amt => onInvestCore('cryptoBasket', amt)}
            onWithdraw={amt => onWithdrawCore('cryptoBasket', amt)}
          />
        </div>
      </div>

      {/* Stocks */}
      <div className="cp-section">
        <div className="cp-section-hdr">
          <span>STOCKS</span>
          <div className="cp-section-line" />
        </div>
        <div className="stock-grid">
          {STOCK_IDS.map(id => (
            <AssetTile
              key={id} id={id}
              ticker={STOCK_META[id].fakeTicker}
              company={STOCK_META[id].name}
              price={state.stockPrices[id]}
              sparkline={state.stockSparklines[id]}
              held={state.stockHeld[id]}
              cash={state.cash}
              onBuy={qty => onBuyStock(id, qty)}
              onSell={qty => onSellStock(id, qty)}
            />
          ))}
        </div>
      </div>

      {/* Crypto */}
      <div className="cp-section">
        <div className="cp-section-hdr">
          <span>CRYPTO {!cryptoUnlocked && <span className="cp-lock-badge">🔒 unlocks yr 10</span>}</span>
          <div className="cp-section-line" />
        </div>
        <div className="stock-grid" style={{ opacity: cryptoUnlocked ? 1 : 0.4, pointerEvents: cryptoUnlocked ? 'auto' : 'none' }}>
          {CRYPTO_IDS.map(id => (
            <AssetTile
              key={id} id={id}
              ticker={id}
              company={CRYPTO_META[id].name}
              price={state.cryptoPrices[id]}
              sparkline={state.cryptoSparklines[id]}
              held={state.cryptoHeld[id]}
              cash={state.cash}
              isCrypto
              onBuy={qty => onBuyCrypto(id, qty)}
              onSell={qty => onSellCrypto(id, qty)}
            />
          ))}
        </div>
        {!cryptoUnlocked && (
          <div className="cp-lock-msg">Crypto trading unlocks at Year 10. Prices still move — watch the market.</div>
        )}
      </div>
    </div>
  )
}
