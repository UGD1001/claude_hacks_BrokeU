import { useState } from 'react'
import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice } from '../types'
import { STOCK_IDS, CRYPTO_IDS, STOCK_META, CRYPTO_META, calcNetWorth, CAR_GOAL } from '../gameData'
import EventModal from './EventModal'
import CarModal from './CarModal'

// ── Investment info content ─────────────────────────────────────────────────
const CORE_INFO: Record<CoreInvestmentId, { desc: string; tip: string }> = {
  bank: {
    desc: 'The safest option. Your money grows slowly but steadily at ~1.5% per year with virtually zero risk. FDIC insured up to $250k.',
    tip: 'Keep 3-6 months of expenses here as an emergency fund. Without this buffer, one bad event card can spiral into debt.',
  },
  index: {
    desc: 'A diversified fund tracking the entire stock market. Historically returns 7-10% per year. Low fees, broad exposure, minimal effort.',
    tip: 'The computer opponent puts ALL surplus cash here — and it works. This is the "boring" strategy that beats most active traders.',
  },
  realEstate: {
    desc: 'Property investment that appreciates ~6% yearly. Less volatile than stocks but requires larger capital. Unlocks rental income opportunities.',
    tip: 'Once you own real estate, you can activate the "Room Rental" side hustle for $6,000/year extra income.',
  },
  cryptoPool: {
    desc: 'A diversified basket of cryptocurrencies. Extreme volatility — can double or lose 50% in a single year. High risk, high potential reward.',
    tip: 'Only invest money you can afford to lose completely. Crypto has made millionaires and bankrupted others.',
  },
}

const STOCK_INFO: Record<StockId, { desc: string; tip: string }> = {
  AAPL: {
    desc: 'Apple Inc. Tech giant known for iPhone, Mac, and services. Steady growth, strong cash position, loyal customer base.',
    tip: 'Blue chip stock with moderate volatility. Good for beginners looking for individual stock exposure.',
  },
  TSLA: {
    desc: 'Tesla Inc. Electric vehicle and clean energy leader. High growth potential but extremely volatile — can swing 50%+ in a year.',
    tip: 'High risk, high reward. Position sizing matters — don\'t put everything in one volatile stock.',
  },
  MSFT: {
    desc: 'Microsoft Corp. Enterprise software, cloud computing (Azure), and gaming. Consistent performer with strong dividends.',
    tip: 'One of the most stable tech stocks. Cloud growth provides recurring revenue.',
  },
  AMZN: {
    desc: 'Amazon.com Inc. E-commerce giant plus AWS cloud services. Growth-focused, reinvests profits into expansion.',
    tip: 'AWS is the profit engine. Watch for consumer spending trends.',
  },
  NVDA: {
    desc: 'NVIDIA Corp. GPU maker dominating AI/ML chip market. Explosive growth tied to artificial intelligence boom.',
    tip: 'Currently riding the AI wave. High valuation means high expectations — can drop fast if AI hype cools.',
  },
  GOOG: {
    desc: 'Alphabet Inc. Google parent company. Search advertising, YouTube, cloud, and "moonshot" projects.',
    tip: 'Advertising revenue is the core business. More stable than it looks.',
  },
}

const CRYPTO_INFO: Record<CryptoId, { desc: string; tip: string }> = {
  BTC: {
    desc: 'Bitcoin. The original cryptocurrency and digital "gold." Limited supply of 21 million coins. Most established and widely accepted.',
    tip: 'Considered the "safest" crypto due to its track record, but still extremely volatile compared to traditional assets.',
  },
  ETH: {
    desc: 'Ethereum. Smart contract platform powering DeFi, NFTs, and dApps. More utility than Bitcoin but also more complex.',
    tip: 'The "platform play" — if crypto succeeds broadly, ETH likely benefits. Watch for network upgrades.',
  },
  SOL: {
    desc: 'Solana. Fast, low-fee blockchain competing with Ethereum. Known for speed but has had reliability issues.',
    tip: 'Higher risk than BTC/ETH but potentially higher reward. Network outages have hurt confidence in the past.',
  },
  DOGE: {
    desc: 'Dogecoin. Started as a meme, now has real market cap. No supply limit, relies heavily on community and social media hype.',
    tip: 'Pure speculation. Can 10x or crash 90% based on tweets. Only "invest" what you\'d spend at a casino.',
  },
}

interface Props {
  state: GameState
  onEventChoice: (c: EventChoice) => void
  onCarBuy: () => void
  onCarSkip: () => void
  onInvestCore: (type: CoreInvestmentId, amount: number) => void
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

// ── Info Modal ────────────────────────────────────────────────────────────────

interface InfoModalProps {
  icon: string
  name: string
  returnRate: string
  isPositive: boolean
  desc: string
  tip: string
  currentValue?: number
  riskLabel?: string
  onClose: () => void
}

function InfoModal({ icon, name, returnRate, isPositive, desc, tip, currentValue, riskLabel, onClose }: InfoModalProps) {
  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal-card" onClick={e => e.stopPropagation()}>
        <div className="info-modal-header">
          <span className="info-modal-icon">{icon}</span>
          <span className="info-modal-title">{name}</span>
          <span className={`info-modal-return ${isPositive ? 'pos' : 'neg'}`}>{returnRate}</span>
        </div>
        <div className="info-modal-desc">{desc}</div>
        <div className="info-modal-tip">{tip}</div>
        {(currentValue !== undefined || riskLabel) && (
          <div className="info-modal-stats">
            {currentValue !== undefined && (
              <div className="info-modal-stat">
                <div className="info-modal-stat-label">Your Holdings</div>
                <div className="info-modal-stat-val" style={{ color: 'var(--teal)' }}>{fmt(currentValue)}</div>
              </div>
            )}
            {riskLabel && (
              <div className="info-modal-stat">
                <div className="info-modal-stat-label">Risk Level</div>
                <div className="info-modal-stat-val" style={{
                  color: riskLabel.includes('extreme') ? 'var(--red)' :
                         riskLabel.includes('medium') ? 'var(--yellow)' : 'var(--green)'
                }}>{riskLabel}</div>
              </div>
            )}
          </div>
        )}
        <button className="info-modal-close" onClick={onClose}>Got it ✓</button>
      </div>
    </div>
  )
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
  onInvest: (amount: number) => void
}

function CoreTile({ id, icon, name, value, returnRate, riskLabel, riskClass, locked, lockMsg, cash, onInvest }: CoreTileProps) {
  const [expanded, setExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const isPositive = !returnRate.startsWith('−')
  const info = CORE_INFO[id]

  return (
    <>
      <div className={`inv-tile ${locked ? 'locked' : ''} ${expanded ? 'expanded' : ''}`} onClick={() => !locked && setExpanded(v => !v)}>
        <button
          className="info-btn"
          onClick={e => { e.stopPropagation(); setShowInfo(true) }}
          title="Learn more"
        >
          i
        </button>
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
              <button className="inv-btn inv-btn-done" onClick={() => setExpanded(false)}>done ✓</button>
            </div>
            {value > 0 && (
              <div className="inv-expand-holding">Holding: {fmt(value)}</div>
            )}
          </div>
        )}
      </div>

      {showInfo && (
        <InfoModal
          icon={icon}
          name={name}
          returnRate={returnRate}
          isPositive={isPositive}
          desc={info.desc}
          tip={info.tip}
          currentValue={value}
          riskLabel={riskLabel}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  )
}

// ── Stock tile ────────────────────────────────────────────────────────────────

interface StockTileProps {
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

function AssetTile({ id, ticker, company, price, sparkline, held, cash, isCrypto, onBuy, onSell }: StockTileProps) {
  const [expanded, setExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [qty, setQty] = useState(1)

  const prev = sparkline.length >= 2 ? sparkline[sparkline.length - 2] : sparkline[0]
  const chgPct = prev > 0 ? ((price - prev) / prev) * 100 : 0
  const isUp = chgPct >= 0
  const holdingVal = held * price
  const buyCost = price * qty
  const minQty = isCrypto ? 0.01 : 1

  const info = isCrypto ? CRYPTO_INFO[id as CryptoId] : STOCK_INFO[id as StockId]

  return (
    <>
      <div className={`stock-tile ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(v => !v)}>
        <button
          className="info-btn"
          onClick={e => { e.stopPropagation(); setShowInfo(true) }}
          title="Learn more"
        >
          i
        </button>
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
              <button className="st-qty-btn" onClick={() => setQty(q => Math.max(minQty, q - (isCrypto ? 0.01 : 1)))}>−</button>
              <span className="st-qty-val">{isCrypto ? qty.toFixed(2) : qty}</span>
              <button className="st-qty-btn" onClick={() => setQty(q => q + (isCrypto ? 0.01 : 1))}>+</button>
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

      {showInfo && (
        <InfoModal
          icon={isCrypto ? '🪙' : '📊'}
          name={`${ticker} · ${company}`}
          returnRate={`${isUp ? '+' : ''}${chgPct.toFixed(1)}%`}
          isPositive={isUp}
          desc={info.desc}
          tip={info.tip}
          currentValue={holdingVal > 0 ? holdingVal : undefined}
          riskLabel={isCrypto ? 'extreme risk' : 'high risk'}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  )
}

// ── Center panel ──────────────────────────────────────────────────────────────

export default function CenterPanel({
  state, onEventChoice, onCarBuy, onCarSkip,
  onInvestCore, onBuyStock, onSellStock, onBuyCrypto, onSellCrypto,
}: Props) {
  const nw = calcNetWorth(state)
  const cryptoUnlocked = state.year >= 10
  const realEstateUnlocked = state.year >= 7

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
            locked={false} cash={state.cash} onInvest={amt => onInvestCore('bank', amt)}
          />
          <CoreTile
            id="index" icon="📈" name="Index Fund" value={state.indexValue}
            returnRate="+7%/yr avg" riskLabel="medium risk" riskClass="medium"
            locked={false} cash={state.cash} onInvest={amt => onInvestCore('index', amt)}
          />
          <CoreTile
            id="realEstate" icon="🏡" name="Real Estate" value={state.realEstateValue}
            returnRate="+6%/yr" riskLabel="medium risk" riskClass="medium"
            locked={!realEstateUnlocked} lockMsg={`🔒 unlocks yr 7 (yr ${state.year})`}
            cash={state.cash} onInvest={amt => onInvestCore('realEstate', amt)}
          />
          <CoreTile
            id="cryptoPool" icon="🪙" name="Crypto Pool" value={state.cryptoPoolValue}
            returnRate="+20%/yr avg" riskLabel="extreme risk" riskClass="extreme"
            locked={!cryptoUnlocked} lockMsg={`🔒 unlocks yr 10 (yr ${state.year})`}
            cash={state.cash} onInvest={amt => onInvestCore('cryptoPool', amt)}
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
              ticker={id}
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
