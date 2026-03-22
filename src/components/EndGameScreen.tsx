import type { GameState } from '../types'
import { calcNetWorth, calcCompNetWorth, STOCK_IDS, CRYPTO_IDS } from '../gameData'

interface Props {
  state: GameState
  onPlayAgain: () => void
  onMenu: () => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(2) + 'M'
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function pct(a: number, b: number) {
  if (b === 0) return '0%'
  return ((a / b) * 100).toFixed(0) + '%'
}

function generateTips(state: GameState, playerNW: number, compNW: number): string[] {
  const tips: string[] = []

  // Debt tip
  if (state.loanDebt > 0) {
    tips.push('⚠️ You ended with high-interest debt. Pay off 18% APR loans before investing — it\'s a guaranteed 18% return.')
  }

  // Panic sell tip — if they sold all investments at some point (we can infer from low investment totals)
  const totalInvested = state.bankValue + state.indexValue + state.realEstateValue + state.cryptoPoolValue
  if (totalInvested < 1000 && playerNW > 5000) {
    tips.push('📉 It looks like most of your portfolio ended up in cash. Keeping money invested — even through crashes — typically outperforms holding cash.')
  }

  // Index fund tip — if they didn't use it much
  if (state.indexValue < 10000 && playerNW > 20000) {
    tips.push('📈 The computer puts all surplus into the index fund at 7%/yr average. This simple strategy beats most active approaches over 20 years.')
  }

  // Side hustle tip
  if (state.activeSideHustles.length === 0) {
    tips.push('💻 You didn\'t activate any side hustles. Freelancing is free to start and adds $3,000/yr — starting Year 1 adds significant compounding over 20 years.')
  }

  // Car tip
  if (state.carOwned) {
    tips.push('🚗 Your car depreciated 10%/yr. Cars are expenses, not investments — the computer kept investing instead and grew its portfolio faster.')
  }

  // Real estate tip
  if (state.realEstateValue === 0 && state.year > 10) {
    tips.push('🏡 Real estate (available from Year 7) earns 6%/yr with low variance. It\'s a stable addition to a diversified portfolio.')
  }

  // Win/lose tip
  if (playerNW > compNW) {
    tips.push(`🏆 You beat the computer by ${fmt(playerNW - compNW)}! The computer\'s simple index fund strategy is hard to beat — well done for outperforming it.`)
  } else if (playerNW < compNW * 0.5) {
    tips.push(`📚 The computer beat you by ${fmt(compNW - playerNW)}. Its strategy: invest every surplus dollar in index funds, maintain a $2k cash buffer, never panic sell.`)
  }

  return tips.slice(0, 4)
}

export default function EndGameScreen({ state, onPlayAgain, onMenu }: Props) {
  const playerNW = calcNetWorth(state)
  const compNW = calcCompNetWorth(state)
  const won = playerNW > compNW
  const bankrupt = !!state.gameOverReason

  const stockValue = STOCK_IDS.reduce((sum, id) => sum + state.stockHeld[id] * state.stockPrices[id], 0)
  const cryptoValue = CRYPTO_IDS.reduce((sum, id) => sum + state.cryptoHeld[id] * state.cryptoPrices[id], 0)
  const totalInvested = state.bankValue + state.indexValue + state.realEstateValue + state.cryptoPoolValue + stockValue + cryptoValue

  const tips = generateTips(state, playerNW, compNW)

  const snapshots5  = state.snapshots.find(s => s.year === 5)
  const snapshots10 = state.snapshots.find(s => s.year === 10)
  const snapshots15 = state.snapshots.find(s => s.year === 15)
  const snapshots20 = state.snapshots.find(s => s.year >= 19)

  return (
    <div className="endgame-screen" style={{ paddingTop: 72 }}>
      <div className="endgame-glow" style={{ background: won && !bankrupt ? 'var(--green)' : 'var(--red)' }} />

      <div className="endgame-icon">{bankrupt ? '💀' : won ? '🏆' : '📊'}</div>

      <div className="endgame-eyebrow" style={{ color: won && !bankrupt ? 'var(--green)' : 'var(--red)' }}>
        · {bankrupt ? 'Game Over' : won ? 'Victory' : 'Year 20 Complete'} ·
      </div>

      <h2 className="endgame-title" style={{ color: won && !bankrupt ? 'var(--yellow)' : 'var(--sky)' }}>
        {bankrupt ? 'BROKE OUT' : won ? 'YOU WIN!' : 'TIME\'S UP'}
      </h2>

      {bankrupt && (
        <p className="endgame-subtitle">{state.gameOverReason}</p>
      )}

      {/* Side-by-side comparison */}
      <div className="endgame-vs">
        <div className="endgame-vs-col player">
          <div className="endgame-vs-label">{state.playerName || 'You'}</div>
          <div className="endgame-vs-nw" style={{ color: won ? 'var(--green)' : 'var(--red)' }}>{fmt(playerNW)}</div>
          <div className="endgame-vs-detail">Cash: {fmt(state.cash)}</div>
          <div className="endgame-vs-detail">Investments: {fmt(totalInvested)}</div>
          <div className="endgame-vs-detail">Debt: {state.loanDebt > 0 ? fmt(state.loanDebt) : 'None'}</div>
          {state.carOwned && <div className="endgame-vs-detail">🚗 Car: {fmt(state.carValue)}</div>}
        </div>
        <div className="endgame-vs-divider">VS</div>
        <div className="endgame-vs-col comp">
          <div className="endgame-vs-label">Computer</div>
          <div className="endgame-vs-nw" style={{ color: won ? 'var(--mid)' : 'var(--yellow)' }}>{fmt(compNW)}</div>
          <div className="endgame-vs-detail">Cash: {fmt(state.compCash)}</div>
          <div className="endgame-vs-detail">Index Fund: {fmt(state.compIndexValue)}</div>
          <div className="endgame-vs-detail">Debt: None</div>
          {state.compCarOwned && <div className="endgame-vs-detail">🚗 Car: {fmt(state.compCarValue)}</div>}
        </div>
      </div>

      {/* Net worth history */}
      {state.snapshots.length > 0 && (
        <div className="endgame-history">
          <div className="endgame-history-title">NET WORTH OVER TIME</div>
          <div className="endgame-history-grid">
            {[
              { label: 'Year 5',  snap: snapshots5  },
              { label: 'Year 10', snap: snapshots10 },
              { label: 'Year 15', snap: snapshots15 },
              { label: 'Year 20', snap: snapshots20 },
            ].map(({ label, snap }) => snap && (
              <div key={label} className="endgame-hist-col">
                <div className="endgame-hist-yr">{label}</div>
                <div className="endgame-hist-you" style={{ color: snap.playerNW >= snap.compNW ? 'var(--green)' : 'var(--red)' }}>
                  {fmt(snap.playerNW)}
                </div>
                <div className="endgame-hist-comp">{fmt(snap.compNW)}</div>
              </div>
            ))}
          </div>
          <div className="endgame-hist-legend">
            <span style={{ color: 'var(--green)' }}>■ You</span>
            <span style={{ color: 'var(--mid)' }}>■ Computer</span>
          </div>
        </div>
      )}

      {/* Education recap */}
      {tips.length > 0 && (
        <div className="endgame-recap">
          <div className="endgame-recap-title">📖 EDUCATION RECAP</div>
          {tips.map((tip, i) => (
            <div key={i} className="endgame-tip">{tip}</div>
          ))}
        </div>
      )}

      {/* Codex progress */}
      <div className="endgame-codex">
        Finance Codex: <strong>{state.codexUnlocked.length}/24 entries</strong> unlocked this run
      </div>

      <div className="outcome-actions">
        <button className="outcome-btn primary" onClick={onPlayAgain}>🎮 Play Again</button>
        <button className="outcome-btn secondary" onClick={onMenu}>← Main Menu</button>
      </div>
    </div>
  )
}
