import type { GameState } from '../types'
import { calcNetWorth, calcCompNetWorth, STOCK_IDS, CRYPTO_IDS, GLOSSARY_ENTRIES, STOCK_META, TOTAL_YEARS, getRealPrice, getCalendarDate } from '../gameData'

interface Props {
  state: GameState
  onPlayAgain: () => void
  onMenu: () => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs/1_000_000).toFixed(2) + 'M'
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function generateTips(state: GameState, playerNW: number, compNW: number): string[] {
  const tips: string[] = []

  // Debt tip
  if (state.loanDebt > 0) {
    tips.push('⚠️ You ended with high-interest debt. Pay off 18% APR loans before investing — it\'s a guaranteed 18% return.')
  }

  // Panic sell / cash heavy tip — infer from low investment totals vs net worth
  const stockValue     = STOCK_IDS.reduce((sum, id)  => sum + state.stockHeld[id]  * state.stockPrices[id],  0)
  const cryptoValue    = CRYPTO_IDS.reduce((sum, id) => sum + state.cryptoHeld[id] * state.cryptoPrices[id], 0)
  const totalInvested  = state.bankValue + state.indexValue + state.cryptoBasketValue + stockValue + cryptoValue
  if (totalInvested < 1000 && playerNW > 5000) {
    tips.push('📉 It looks like most of your portfolio ended up in cash. Keeping money invested — even through crashes — typically outperforms holding cash.')
  }

  // Index fund tip — if they didn't use it much
  if (state.indexValue < 10000 && playerNW > 20000) {
    tips.push('📈 The computer puts all surplus into the index fund at 7%/yr average. This simple strategy beats most active approaches over 20 years.')
  }

  // Side hustle tip — side hustles are now auto-activated by events, so check if none fired
  if (state.activeSideHustles.length === 0) {
    tips.push('💻 No side hustles came your way this run. In future runs, random events can unlock freelancing, an online store, content creation, and more — each adding passive income.')
  }

  // Car tip
  if (state.carOwned) {
    tips.push('🚗 Your car depreciated 10%/yr. Cars are expenses, not investments — the computer kept investing instead and grew its portfolio faster.')
  }

  // House tip — use state.house instead of the old realEstateValue
  if (!state.house && state.year > 10) {
    tips.push('🏡 You didn\'t own property by Year 10. Real estate builds equity over time and can generate rental income — it\'s a stable addition to a diversified portfolio.')
  }

  // Mortgage tip
  if (state.house && state.house.mortgageBalance > 0) {
    tips.push('🏠 You carry a mortgage — remember that each payment builds equity. Shorter mortgage terms (10yr) cost more monthly but save tens of thousands in total interest.')
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
  const compNW   = calcCompNetWorth(state)
  const won      = playerNW > compNW
  const bankrupt = !!state.gameOverReason

  const stockValue    = STOCK_IDS.reduce((sum, id)  => sum + state.stockHeld[id]  * state.stockPrices[id],  0)
  const cryptoValue   = CRYPTO_IDS.reduce((sum, id) => sum + state.cryptoHeld[id] * state.cryptoPrices[id], 0)
  const totalInvested = state.bankValue + state.indexValue + state.cryptoBasketValue + stockValue + cryptoValue

  const tips = generateTips(state, playerNW, compNW)

  const snaps = [5,10,15,20].map(yr => state.snapshots.find(s => s.year >= yr)).filter(Boolean)

  return (
    <div className="endgame-screen">
      <div className="endgame-icon">{bankrupt ? '💀' : won ? '🏆' : '📊'}</div>

      <div className="endgame-eyebrow" style={{ color: bankrupt ? 'var(--burg)' : won ? 'var(--teal)' : 'var(--dsage)' }}>
        · {bankrupt ? 'GAME OVER' : won ? 'VICTORY' : 'YEAR 20 COMPLETE'} ·
      </div>

      <h2 className="endgame-title" style={{ color: bankrupt ? 'var(--burg)' : won ? 'var(--amber)' : 'var(--sage)' }}>
        {bankrupt ? 'BROKE OUT' : won ? 'YOU WIN!' : "TIME'S UP"}
      </h2>

      {bankrupt && (
        <p className="endgame-subtitle">{state.gameOverReason}</p>
      )}

      {/* VS comparison */}
      <div className="endgame-vs">
        <div className="endgame-vs-col player">
          <div className="endgame-vs-label">{state.playerName || 'YOU'}</div>
          <div className="endgame-vs-nw" style={{ color: won ? 'var(--teal)' : 'var(--burg)' }}>{fmt(playerNW)}</div>
          <div className="endgame-vs-detail">Cash: {fmt(state.cash)}</div>
          <div className="endgame-vs-detail">Investments: {fmt(totalInvested)}</div>
          {state.house && (
            <div className="endgame-vs-detail">
              🏠 House equity: {fmt(state.house.currentValue - state.house.mortgageBalance)}
            </div>
          )}
          <div className="endgame-vs-detail">Debt: {state.loanDebt > 0 ? fmt(state.loanDebt) : 'None'}</div>
          {state.carOwned && <div className="endgame-vs-detail">🚗 Car: {fmt(state.carValue)}</div>}
        </div>
        <div className="endgame-vs-divider">VS</div>
        <div className="endgame-vs-col comp">
          <div className="endgame-vs-label">COMPUTER</div>
          <div className="endgame-vs-nw" style={{ color: won ? 'var(--slate)' : 'var(--amber)' }}>{fmt(compNW)}</div>
          <div className="endgame-vs-detail">Cash: {fmt(state.compCash)}</div>
          <div className="endgame-vs-detail">Index Fund: {fmt(state.compIndexValue)}</div>
          {state.compHouse && (
            <div className="endgame-vs-detail">
              🏠 House equity: {fmt(state.compHouse.currentValue - state.compHouse.mortgageBalance)}
            </div>
          )}
          <div className="endgame-vs-detail">Debt: None</div>
          {state.compCarOwned && <div className="endgame-vs-detail">🚗 Car: {fmt(state.compCarValue)}</div>}
        </div>
      </div>

      {/* Net worth history */}
      {snaps.length > 0 && (
        <div className="endgame-history">
          <div className="endgame-history-title">// NET WORTH OVER TIME</div>
          <div className="endgame-history-grid">
            {snaps.map((snap, i) => snap && (
              <div key={i} className="endgame-hist-col">
                <div className="endgame-hist-yr">YEAR {snap.year}</div>
                <div className="endgame-hist-you" style={{ color: snap.playerNW >= snap.compNW ? 'var(--teal)' : 'var(--burg)' }}>
                  {fmt(snap.playerNW)}
                </div>
                <div className="endgame-hist-comp">{fmt(snap.compNW)}</div>
              </div>
            ))}
          </div>
          <div className="endgame-hist-legend">
            <span style={{ color:'var(--teal)' }}>■ YOU</span>
            <span style={{ color:'var(--slate)' }}>■ COMPUTER</span>
          </div>
        </div>
      )}

      {/* Education recap */}
      {tips.length > 0 && (
        <div className="endgame-recap">
          <div className="endgame-recap-title">// EDUCATION RECAP</div>
          {tips.map((tip, i) => (
            <div key={i} className="endgame-tip">{tip}</div>
          ))}
        </div>
      )}

      {/* Era reveal */}
      {(() => {
        const startYear = parseInt(state.gameStartDate.slice(0, 4))
        const endYear   = startYear + TOTAL_YEARS
        const endDate   = getCalendarDate(state.gameStartDate, TOTAL_YEARS * 2)
        const spyStart  = getRealPrice('SPY', state.gameStartDate)
        const spyEnd    = getRealPrice('SPY', endDate)
        const spyReturn = spyStart && spyEnd ? ((spyEnd - spyStart) / spyStart * 100) : null
        return (
          <div className="endgame-reveal">
            <div className="endgame-reveal-title">🔓 ERA REVEALED</div>
            <div className="endgame-reveal-period">
              You just played the <strong>{startYear} – {endYear}</strong> era
            </div>
            <div className="endgame-reveal-sub">
              The stocks were real — only the names were hidden.
            </div>
            <div className="endgame-reveal-grid">
              {STOCK_IDS.map(id => {
                const meta       = STOCK_META[id]
                const startPrice = getRealPrice(id, state.gameStartDate)
                const endPrice   = getRealPrice(id, endDate)
                const ret        = startPrice && endPrice
                  ? ((endPrice - startPrice) / startPrice * 100)
                  : null
                const pos = ret !== null && ret >= 0
                return (
                  <div key={id} className="endgame-reveal-row">
                    <span className="reveal-fake">{meta.fakeTicker}</span>
                    <span className="reveal-arrow">→</span>
                    <span className="reveal-real">{meta.realName} <span className="reveal-ticker">({meta.realTicker})</span></span>
                    {ret !== null && (
                      <span className={`reveal-ret ${pos ? 'pos' : 'neg'}`}>
                        {pos ? '+' : ''}{ret.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )
              })}
              {spyReturn !== null && (
                <div className="endgame-reveal-row index-row">
                  <span className="reveal-fake">INDEX</span>
                  <span className="reveal-arrow">→</span>
                  <span className="reveal-real">S&amp;P 500 <span className="reveal-ticker">(SPY)</span></span>
                  <span className={`reveal-ret ${spyReturn >= 0 ? 'pos' : 'neg'}`}>
                    {spyReturn >= 0 ? '+' : ''}{spyReturn.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Finance Codex */}
      <div className="endgame-codex">
        Finance Codex: <strong>{state.codexUnlocked.length}/24 entries</strong> unlocked this run
      </div>

      {/* Financial Glossary */}
      <div className="endgame-glossary">
        <div className="endgame-glossary-title">📚 FINANCIAL GLOSSARY</div>
        <div className="endgame-glossary-grid">
          {GLOSSARY_ENTRIES.map(entry => (
            <div key={entry.term} className="glossary-card">
              <div className="glossary-card-header">
                <span className="glossary-emoji">{entry.emoji}</span>
                <span className="glossary-term">{entry.term}</span>
              </div>
              <p className="glossary-def">{entry.definition}</p>
              <code className="glossary-formula">{entry.formula}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="outcome-actions">
        <button className="outcome-btn primary" onClick={onPlayAgain}>▶ PLAY AGAIN</button>
        <button className="outcome-btn secondary" onClick={onMenu}>◄ MAIN MENU</button>
      </div>
    </div>
  )
}
