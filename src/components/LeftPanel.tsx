import { useState } from 'react'
import type { GameState, SideHustleId } from '../types'
import { calcNetWorth, calcCompNetWorth, getAnnualFlow, SIDE_HUSTLES, CAR_GOAL, CODEX_ENTRIES } from '../gameData'

interface Props {
  state: GameState
  onActivateSideHustle: (id: SideHustleId) => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs/1_000_000).toFixed(2) + 'M'
  return sign + '$' + Math.floor(abs).toLocaleString('en-US')
}

function fmtYr(n: number): string {
  const abs = Math.abs(n)
  const prefix = n >= 0 ? '+' : '−'
  if (abs >= 1_000_000) return prefix + '$' + (abs / 1_000_000).toFixed(2) + 'M'
  return prefix + '$' + Math.floor(abs).toLocaleString('en-US')
}

export default function LeftPanel({ state, onActivateSideHustle }: Props) {
  const [flowOpen, setFlowOpen] = useState(false)
  const [hustlesOpen, setHustlesOpen] = useState(false)
  const [showCodex, setShowCodex] = useState(false)
  const [codexId,   setCodexId]   = useState<string|null>(null)

  const nw = calcNetWorth(state)
  const compNW = calcCompNetWorth(state)
  const flow = getAnnualFlow(state)
  const goalPct = state.phase === 'car' ? Math.min(100, (nw / CAR_GOAL) * 100) : 100

  const codexUnlockedEntries = CODEX_ENTRIES.filter(e => state.codexUnlocked.includes(e.id))
  const detailEntry = codexId ? CODEX_ENTRIES.find(e => e.id === codexId) : null

  const lbEntries = [
    { label: state.playerName || 'You', nw, isMe: true, car: state.carOwned, house: !!state.house },
    { label: 'Computer', nw: compNW, isMe: false, car: state.compCarOwned, house: !!state.compHouse },
  ].sort((a, b) => b.nw - a.nw)

  const activeHustles   = SIDE_HUSTLES.filter(h => state.activeSideHustles.includes(h.id))
  const inactiveHustles = SIDE_HUSTLES.filter(h => h.id !== 'rental' && !state.activeSideHustles.includes(h.id))

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

      <div className="divider" />

      {/* Key stats */}
      <div className="lp-kv">
        <span className="lp-k">NET WORTH</span>
        <span className="lp-v" style={{ color: nw < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(nw)}</span>
      </div>
      <div className="lp-kv">
        <span className="lp-k">CASH</span>
        <span className="lp-v" style={{ color: state.cash < 500 ? 'var(--red)' : 'var(--sky)' }}>{fmt(state.cash)}</span>
      </div>

      <div className="divider" />

      {/* Annual flow — collapsible */}
      <div className="lp-collapsible-hdr" onClick={() => setFlowOpen(v => !v)}>
        <span className="lp-label">ANNUAL FLOW</span>
        <span className={`lp-caret ${flowOpen ? 'open' : ''}`}>▼</span>
      </div>
      <div className="lp-kv lp-flow-summary">
        <span className="lp-k">Net / yr</span>
        <span className="lp-v" style={{ color: flow.netYr >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {fmtYr(flow.netYr)}
        </span>
      </div>
      {flowOpen && (
        <div className="lp-flow-detail">
          <div className="lp-fr">
            <span className="lp-fr-k">Salary</span>
            <span className="lp-pos lp-fr-v">{fmtYr(flow.salaryYr)}</span>
          </div>
          {flow.hustleYr > 0 && (
            <div className="lp-fr">
              <span className="lp-fr-k">Side hustles</span>
              <span className="lp-pos lp-fr-v">{fmtYr(flow.hustleYr)}</span>
            </div>
          )}
          {flow.rentYr > 0 && (
            <div className="lp-fr">
              <span className="lp-fr-k">Rent</span>
              <span className="lp-neg lp-fr-v">{fmtYr(-flow.rentYr)}</span>
            </div>
          )}
          <div className="lp-fr">
            <span className="lp-fr-k">Expenses</span>
            <span className="lp-neg lp-fr-v">{fmtYr(-flow.expensesYr)}</span>
          </div>
          {flow.tuitionYr > 0 && (
            <div className="lp-fr">
              <span className="lp-fr-k">Tuition</span>
              <span className="lp-neg lp-fr-v">{fmtYr(-flow.tuitionYr)}</span>
            </div>
          )}
          {flow.mortgageYr > 0 && (
            <div className="lp-fr">
              <span className="lp-fr-k">Mortgage</span>
              <span className="lp-neg lp-fr-v">{fmtYr(-flow.mortgageYr)}</span>
            </div>
          )}
          {flow.loanInterestYr > 0 && (
            <div className="lp-fr">
              <span className="lp-fr-k">Loan int.</span>
              <span className="lp-neg lp-fr-v">{fmtYr(-flow.loanInterestYr)}</span>
            </div>
          )}
        </div>
      )}

      {/* Debts */}
      {(state.loanDebt > 0 || state.tuitionRemaining > 0) && (
        <>
          <div className="divider" />
          <div className="lp-label">DEBT TRACKER</div>
          {state.loanDebt > 0 && (
            <div className="lp-kv">
              <span className="lp-k">Loan (18%)</span>
              <span className="lp-neg lp-v">{fmt(state.loanDebt)}</span>
            </div>
          )}
          {state.tuitionRemaining > 0 && (
            <div className="lp-kv">
              <span className="lp-k">Student loan</span>
              <span className="lp-neg lp-v">{fmt(state.tuitionRemaining)}</span>
            </div>
          )}
        </>
      )}
      {state.lentMoney > 0 && (
        <div className="lp-lent">💸 {fmt(state.lentMoney)} lent · returns h-yr {state.lentReturnHalfYear}</div>
      )}

      {/* House */}
      {state.house && (
        <>
          <div className="divider" />
          <div className="lp-label">PROPERTY</div>
          <div className="lp-kv">
            <span className="lp-k">Value</span>
            <span className="lp-v">{fmt(state.house.currentValue)}</span>
          </div>
          <div className="lp-kv">
            <span className="lp-k">Mortgage left</span>
            <span className="lp-neg lp-v">{fmt(state.house.mortgageBalance)}</span>
          </div>
          <div className="lp-kv">
            <span className="lp-k">Status</span>
            <span className="lp-muted lp-v">
              {state.house.movedIn ? 'Living in it' : state.house.isRentedOut ? 'Rented out' : 'Vacant'}
            </span>
          </div>
        </>
      )}

      {/* Side hustles — collapsible */}
      <div className="divider" />
      <div className="lp-collapsible-hdr" onClick={() => setHustlesOpen(v => !v)}>
        <span className="lp-label">SIDE HUSTLES</span>
        <span className={`lp-caret ${hustlesOpen ? 'open' : ''}`}>▼</span>
      </div>
      {hustlesOpen && (
        <div className="lp-hustle-list">
          {activeHustles.map(h => {
            const halfYrs = state.sideHustleHalfYearsActive[h.id] ?? 0
            let annualInc: number = h.annualIncome
            if (h.id === 'rental') {
              annualInc = state.house?.isRentedOut ? (state.house.rentalIncomeMonthly * 12) : 0
            } else if (h.growthYears > 0) {
              const mult = Math.min(Math.pow(2, Math.floor(halfYrs / 2)), 4)
              annualInc = h.annualIncome * mult
            }
            return (
              <div key={h.id} className="lp-hustle-item">
                <span>{h.icon} {h.name}</span>
                <span className="lp-pos">+{fmt(annualInc)}/yr</span>
              </div>
            )
          })}
          {inactiveHustles.map(h => (
            <div key={h.id} className="lp-hustle-item lp-hustle-inactive">
              <span className="lp-hustle-info">
                <span>{h.icon} {h.name}</span>
                <span className="lp-muted" style={{fontSize:'0.7rem'}}>{h.cost > 0 ? `$${h.cost} setup` : 'free'}</span>
              </span>
              <button
                className="lp-hustle-add"
                disabled={state.cash < h.cost}
                onClick={() => onActivateSideHustle(h.id)}
                title={state.cash < h.cost ? `Need $${h.cost} to start` : `Start for $${h.cost}`}
              >+</button>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="divider" />
      <div className="lp-label">LEADERBOARD</div>
      <div className="lp-lb">
        {lbEntries.map((e, i) => (
          <div key={e.label} className={`lp-lb-row ${e.isMe ? 'me' : ''}`}>
            <span className="lp-lb-rank">#{i + 1}</span>
            <span className="lp-lb-name">
              {e.label}{e.car ? ' 🚗' : ''}{e.house ? ' 🏠' : ''}
            </span>
            <span className="lp-lb-nw" style={{ color: e.isMe ? 'var(--yellow)' : 'var(--mid)' }}>{fmt(e.nw)}</span>
          </div>
        ))}
      </div>

      {/* Codex */}
      <div className="divider" />
      <div className="lp-card lp-card-codex">
        <div className="lp-card-header" style={{ marginBottom:0 }}>
          <div className="lp-codex-hdr" onClick={() => setShowCodex(v=>!v)}>
            <span className="lp-label">CODEX</span>
            <span className="lp-codex-ct">{codexUnlockedEntries.length}/{CODEX_ENTRIES.length}</span>
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
    </div>
  )
}
