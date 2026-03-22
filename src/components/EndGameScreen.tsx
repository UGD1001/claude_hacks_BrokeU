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
  if (abs >= 1_000_000) return sign + '$' + (abs/1_000_000).toFixed(2) + 'M'
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function generateTips(state: GameState, playerNW: number, compNW: number): string[] {
  const tips: string[] = []
  if (state.loanDebt > 0)
    tips.push('⚠ You ended with high-interest debt. Pay off 18% APR loans before investing — it\'s a guaranteed 18% return.')
  if (state.indexValue < 10000 && playerNW > 20000)
    tips.push('► The computer puts all surplus into index funds at 7%/yr avg. This simple strategy beats most active approaches over 20 years.')
  if (state.activeSideHustles.length === 0)
    tips.push('► You activated no side hustles. Freelancing is free to start and adds $3k/yr — compounded over 20 years, that\'s significant.')
  if (state.carOwned)
    tips.push('► Your car depreciated 10%/yr. Cars are expenses, not investments — the computer keeps investing instead.')
  if (playerNW > compNW)
    tips.push(`► You beat the computer by ${fmt(playerNW - compNW)}! It uses a simple index fund strategy — well done for outperforming it.`)
  else if (playerNW < compNW * 0.5)
    tips.push(`► The computer beat you by ${fmt(compNW - playerNW)}. Its playbook: invest every surplus dollar in index funds, maintain $2k cash buffer, never panic-sell.`)
  return tips.slice(0, 4)
}

export default function EndGameScreen({ state, onPlayAgain, onMenu }: Props) {
  const playerNW = calcNetWorth(state)
  const compNW   = calcCompNetWorth(state)
  const won      = playerNW > compNW
  const bankrupt = !!state.gameOverReason

  const stockValue  = STOCK_IDS.reduce((s,id) => s + state.stockHeld[id] * state.stockPrices[id], 0)
  const cryptoValue = CRYPTO_IDS.reduce((s,id) => s + state.cryptoHeld[id] * state.cryptoPrices[id], 0)
  const totalInvested = state.bankValue + state.indexValue + state.realEstateValue + state.cryptoPoolValue + stockValue + cryptoValue

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
          <div className="endgame-vs-detail">Debt: {state.loanDebt > 0 ? fmt(state.loanDebt) : 'None'}</div>
          {state.carOwned && <div className="endgame-vs-detail">🚗 Car: {fmt(state.carValue)}</div>}
        </div>
        <div className="endgame-vs-divider">VS</div>
        <div className="endgame-vs-col comp">
          <div className="endgame-vs-label">COMPUTER</div>
          <div className="endgame-vs-nw" style={{ color: won ? 'var(--slate)' : 'var(--amber)' }}>{fmt(compNW)}</div>
          <div className="endgame-vs-detail">Cash: {fmt(state.compCash)}</div>
          <div className="endgame-vs-detail">Index Fund: {fmt(state.compIndexValue)}</div>
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

      <div className="endgame-codex">
        Finance Codex: <strong>{state.codexUnlocked.length}/24 entries</strong> unlocked this run
      </div>

      <div className="outcome-actions">
        <button className="outcome-btn primary" onClick={onPlayAgain}>▶ PLAY AGAIN</button>
        <button className="outcome-btn secondary" onClick={onMenu}>◄ MAIN MENU</button>
      </div>
    </div>
  )
}
