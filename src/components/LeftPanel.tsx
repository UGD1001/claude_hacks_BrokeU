import { useState } from 'react'
import type { GameState, SideHustleId } from '../types'
import { calcNetWorth, calcCompNetWorth, getMonthlyFlow, SIDE_HUSTLES, CODEX_ENTRIES, CAR_GOAL } from '../gameData'

interface Props {
  state: GameState
  onActivateHustle: (id: SideHustleId, cost: number) => void
  onQuit: () => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs/1_000_000).toFixed(2) + 'M'
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

export default function LeftPanel({ state, onActivateHustle, onQuit }: Props) {
  const [showCodex, setShowCodex] = useState(false)
  const [codexId,   setCodexId]   = useState<string|null>(null)

  const nw       = calcNetWorth(state)
  const compNW   = calcCompNetWorth(state)
  const flow     = getMonthlyFlow(state)
  const goalPct  = state.phase === 'car' ? Math.min(100, (nw / CAR_GOAL) * 100) : 100
  const codexUnlocked = CODEX_ENTRIES.filter(e => state.codexUnlocked.includes(e.id))
  const detailEntry   = codexId ? CODEX_ENTRIES.find(e => e.id === codexId) : null

  const remoteLbEntries = state.mpRole !== 'solo'
    ? state.remotePlayers.map(p => ({ label: p.name || 'Player', nw: p.netWorth, isMe: false, car: p.carOwned }))
    : []

  const lbEntries = [
    { label: state.playerName || 'You', nw, isMe: true, car: state.carOwned },
    ...remoteLbEntries,
    { label: 'Computer', nw: compNW, isMe: false, car: state.compCarOwned },
  ].sort((a, b) => b.nw - a.nw)

  return (
    <div className="left-panel">
      <div className="panel-logo">BROKE <span>U</span></div>

      {/* Goal progress */}
      {state.phase === 'car' && (
        <div className="lp-card lp-goal">
          <div className="lp-goal-row">
            <span>🚗 RACE TO {fmt(CAR_GOAL)}</span>
            <span className="lp-goal-pct">{goalPct.toFixed(0)}%</span>
          </div>
          <div className="lp-track">
            <div className="lp-track-fill" style={{ width:`${goalPct}%` }} />
          </div>
          <div className="lp-goal-sub">{fmt(Math.max(0, CAR_GOAL - nw))} to go</div>
        </div>
      )}

      {/* Net Worth & Cash */}
      <div className="lp-card lp-finances">
        <div className="lp-stat">
          <div className="lp-label">NET WORTH</div>
          <div className="lp-nw" style={{ color: nw < 0 ? 'var(--burg)' : 'var(--dsage)' }}>
            {fmt(nw)}
          </div>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat">
          <div className="lp-label">CASH</div>
          <div className={`lp-cash ${state.cash < 500 ? 'low' : ''}`}>{fmt(state.cash)}</div>
        </div>
      </div>

      {/* Monthly flow */}
      <div className="lp-card">
        <div className="lp-card-header">Monthly Flow</div>
        <div className="lp-flow">
          <div className="lp-fr"><span>Salary</span><span className="lp-pos">+${Math.floor(flow.incomeMo).toLocaleString()}</span></div>
          {flow.hustleMo > 0 && <div className="lp-fr"><span>Side Hustles</span><span className="lp-pos">+${Math.floor(flow.hustleMo).toLocaleString()}</span></div>}
          <div className="lp-fr"><span>Rent</span><span className="lp-neg">−${Math.floor(flow.rentMo).toLocaleString()}</span></div>
          <div className="lp-fr"><span>Expenses</span><span className="lp-neg">−${Math.floor(flow.expensesMo).toLocaleString()}</span></div>
          {flow.tuitionMo > 0 && <div className="lp-fr"><span>Tuition</span><span className="lp-neg">−${Math.floor(flow.tuitionMo).toLocaleString()}</span></div>}
          {flow.loanInterestMo > 0 && <div className="lp-fr"><span>Loan int.</span><span className="lp-neg">−${Math.floor(flow.loanInterestMo).toLocaleString()}</span></div>}
          <div className="lp-flow-div" />
          <div className="lp-fr lp-net">
            <span>Net/mo</span>
            <span style={{ color: flow.netMo >= 0 ? 'var(--teal)' : 'var(--burg)' }}>
              {flow.netMo >= 0 ? '+' : '−'}${Math.floor(Math.abs(flow.netMo)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Debt tracker */}
      {(state.loanDebt > 0 || state.tuitionRemaining > 0) && (
        <div className="lp-card lp-card-debt">
          <div className="lp-card-header">Debt Tracker</div>
          {state.loanDebt > 0 && (
            <div className="lp-debt-row"><span>Loan (18% APR)</span><span className="lp-neg">{fmt(state.loanDebt)}</span></div>
          )}
          {state.tuitionRemaining > 0 && (
            <div className="lp-debt-row"><span>Student Loans</span><span className="lp-neg">{fmt(state.tuitionRemaining)}</span></div>
          )}
        </div>
      )}
      {state.lentMoney > 0 && (
        <div className="lp-lent">💸 {fmt(state.lentMoney)} lent · returns yr {state.lentReturnYear}</div>
      )}

      {/* Side hustles */}
      <div className="lp-card">
        <div className="lp-card-header">Side Hustles</div>
        <div className="lp-hustles">
          {SIDE_HUSTLES.map(h => {
            const isActive = state.activeSideHustles.includes(h.id)
            if (isActive) {
              const yrs = state.sideHustleYearsActive[h.id] ?? 0
              const mult = ('growthYears' in h) ? Math.min(4, 1+yrs) : 1
              const inc  = h.annualIncome * mult
              return (
                <div key={h.id} className="lp-hustle on">
                  <span>{h.icon} {h.name}</span>
                  <span className="lp-pos">+${inc.toLocaleString()}/yr</span>
                </div>
              )
            }
            const needsRE  = ('requiresRealEstate' in h) && !!(h as {requiresRealEstate?:boolean}).requiresRealEstate && state.realEstateValue <= 0
            const notAvail = state.year < h.availableFromYear
            const blocked  = needsRE || notAvail
            return (
              <div key={h.id} className="lp-hustle">
                <span style={{ opacity: blocked ? 0.4 : 1 }}>
                  {h.icon} {h.name}
                  {needsRE  && <em className="lp-lock"> (needs RE)</em>}
                  {notAvail && <em className="lp-lock"> (yr {h.availableFromYear}+)</em>}
                </span>
                <button
                  className="lp-hustle-btn"
                  disabled={blocked || state.cash < h.cost}
                  onClick={() => onActivateHustle(h.id, h.cost)}
                >
                  {h.cost > 0 ? `$${h.cost.toLocaleString()}` : 'FREE'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="lp-card">
        <div className="lp-card-header">Leaderboard</div>
        <div className="lp-lb">
          {lbEntries.map((e, i) => (
            <div key={e.label} className={`lp-lb-row ${e.isMe?'me':''}`}>
              <span className="lp-lb-rank">#{i+1}</span>
              <span className="lp-lb-name">{e.label}{e.car?' 🚗':''}</span>
              <span className="lp-lb-nw" style={{ color: e.isMe ? 'var(--amber)' : 'var(--slate)' }}>
                {fmt(e.nw)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Codex */}
      <div className="lp-card lp-card-codex">
        <div className="lp-card-header" style={{ marginBottom:0 }}>
          <div className="lp-codex-hdr" onClick={() => setShowCodex(v=>!v)}>
            <span>Codex</span>
            <span className="lp-codex-ct">{codexUnlocked.length}/{CODEX_ENTRIES.length}</span>
            <span className="lp-codex-arr">{showCodex?'▲':'▼'}</span>
          </div>
        </div>

        {showCodex && (
          <div className="lp-codex-list">
            {CODEX_ENTRIES.map(e => {
              if (!state.codexUnlocked.includes(e.id))
                return <div key={e.id} className="lp-cdx locked">🔒 ???</div>
              return (
                <div key={e.id} className={`lp-cdx ${codexId===e.id?'sel':''}`}
                  onClick={() => setCodexId(codexId===e.id ? null : e.id)}>
                  {e.title.toUpperCase()}
                </div>
              )
            })}
          </div>
        )}

        {detailEntry && (
          <div className="lp-codex-detail">
            <div className="lp-cdx-title">{detailEntry.title.toUpperCase()}</div>
            <div className="lp-cdx-body">{detailEntry.explanation}</div>
            <div className="lp-cdx-tip">💡 {detailEntry.gameTip}</div>
            <button className="lp-cdx-close" onClick={() => setCodexId(null)}>✕ CLOSE</button>
          </div>
        )}
      </div>

      {/* Quit button */}
      <button className="lp-quit-btn" onClick={onQuit}>
        ◄ QUIT GAME
      </button>
    </div>
  )
}
