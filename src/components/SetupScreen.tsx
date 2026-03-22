import { useState } from 'react'

import type { GameMode } from '../types'

interface SetupConfig {
  name: string
  salary: number
  rent: number
  expenses: number
  tuitionDebt: number
  gameMode: GameMode
}

interface Props {
  onStart: (config: SetupConfig) => void
  onBack: () => void
}

const SALARY_OPTIONS  = [30000, 50000, 75000, 100000]
const RENT_OPTIONS    = [600, 1200, 2000]
const TUITION_OPTIONS = [
  { label: 'None',    value: 0     },
  { label: '$15,000', value: 15000 },
  { label: '$40,000', value: 40000 },
]

function fmtMo(n: number) { return '$' + Math.round(n).toLocaleString('en-US') + '/mo' }
function fmtK(n: number)  { return '$' + n.toLocaleString('en-US') }

export default function SetupScreen({ onStart, onBack }: Props) {
  const [name,     setName]     = useState('')
  const [salary,   setSalary]   = useState(50000)
  const [rent,     setRent]     = useState(1200)
  const [expenses, setExpenses] = useState(800)
  const [tuition,  setTuition]  = useState(0)
  const [gameMode, setGameMode] = useState<GameMode>('standard')

  const annualNet  = salary - rent * 12 - expenses * 12 - Math.min(tuition, 1000)
  const monthlyNet = annualNet / 12
  const compAnnualNet = salary - rent * 12 - expenses * 12 - Math.min(tuition, 1000)

  const diffLabel = () => {
    if (annualNet > 40000) return { text:'EASY',   color:'var(--teal)' }
    if (annualNet > 20000) return { text:'MEDIUM',  color:'var(--amber)' }
    if (annualNet > 5000)  return { text:'HARD',    color:'var(--terra)' }
    return                        { text:'BRUTAL',  color:'var(--burg)' }
  }
  const d = diffLabel()

  return (
    <div className="setup-screen">
      <div className="setup-left">
        <div className="setup-eyebrow">// configure your financial profile</div>
        <h2 className="setup-title">PLAYER SETUP</h2>

        {/* Mode toggle */}
        <div className="setup-mode-toggle">
          <button
            className={`mode-btn ${gameMode === 'standard' ? 'active' : ''}`}
            onClick={() => setGameMode('standard')}
          >
            STANDARD
            <span className="mode-sub">20 years · full simulation</span>
          </button>
          <button
            className={`mode-btn sprint ${gameMode === 'sprint' ? 'active' : ''}`}
            onClick={() => setGameMode('sprint')}
          >
            ⚡ SPRINT
            <span className="mode-sub">first to car wins · 10 min max</span>
          </button>
        </div>

        <div className="setup-field">
          <label className="setup-label">YOUR NAME</label>
          <input
            className="setup-input"
            type="text"
            placeholder="Alex"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="setup-field">
          <label className="setup-label">ANNUAL SALARY</label>
          <div className="setup-options">
            {SALARY_OPTIONS.map(s => (
              <button key={s} className={`setup-opt ${salary===s?'active':''}`} onClick={()=>setSalary(s)}>
                {fmtK(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-field">
          <label className="setup-label">MONTHLY RENT</label>
          <div className="setup-options">
            {RENT_OPTIONS.map(r => (
              <button key={r} className={`setup-opt ${rent===r?'active':''}`} onClick={()=>setRent(r)}>
                {fmtMo(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-field">
          <label className="setup-label">MONTHLY EXPENSES — {fmtMo(expenses)}</label>
          <input
            className="setup-slider"
            type="range" min={400} max={1500} step={50}
            value={expenses}
            onChange={e => setExpenses(Number(e.target.value))}
          />
          <div className="setup-slider-labels">
            <span>$400 (frugal)</span>
            <span>$1,500 (lavish)</span>
          </div>
        </div>

        <div className="setup-field">
          <label className="setup-label">STUDENT LOAN DEBT</label>
          <div className="setup-options">
            {TUITION_OPTIONS.map(t => (
              <button key={t.value} className={`setup-opt ${tuition===t.value?'active':''}`} onClick={()=>setTuition(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-field">
          <div className="setup-fixed-note">
            Starting cash: $500 (fixed for all players)
          </div>
        </div>

        <div className="setup-actions">
          <button className="setup-btn-start" onClick={() => onStart({ name, salary, rent, expenses, tuitionDebt: tuition, gameMode })}>
            START SURVIVING →
          </button>
          <button className="setup-btn-back" onClick={onBack}>◄ BACK</button>
        </div>
      </div>

      <div className="setup-right">
        <div className="setup-preview">
          <div className="setup-preview-title">// YOUR PROFILE</div>
          <div className="setup-preview-block">
            <div className="setup-preview-row">
              <span>Salary</span>
              <span className="pos">+{fmtMo(salary/12)}</span>
            </div>
            <div className="setup-preview-row">
              <span>Rent</span>
              <span className="neg">−{fmtMo(rent)}</span>
            </div>
            <div className="setup-preview-row">
              <span>Expenses</span>
              <span className="neg">−{fmtMo(expenses)}</span>
            </div>
            {tuition > 0 && (
              <div className="setup-preview-row">
                <span>Tuition</span>
                <span className="neg">−{fmtMo(Math.min(tuition,1000)/12)}</span>
              </div>
            )}
            <div className="setup-preview-divider"/>
            <div className="setup-preview-row net">
              <span>Net / month</span>
              <span style={{ color: monthlyNet >= 0 ? 'var(--teal)' : 'var(--burg)' }}>
                {monthlyNet >= 0 ? '+' : ''}{fmtMo(monthlyNet)}
              </span>
            </div>
          </div>

          <div className="setup-diff-row">
            <span className="setup-diff-label">DIFFICULTY</span>
            <span className="setup-diff-badge" style={{ color:d.color, outlineColor:d.color }}>
              {d.text}
            </span>
          </div>
        </div>

        <div className="setup-preview">
          <div className="setup-preview-title">// COMPUTER OPPONENT</div>
          <div className="setup-preview-block">
            <div className="setup-preview-row">
              <span>Salary</span>
              <span className="pos">+{fmtMo(salary / 12)}</span>
            </div>
            <div className="setup-preview-row">
              <span>Rent</span>
              <span className="neg">−{fmtMo(rent)}</span>
            </div>
            <div className="setup-preview-row">
              <span>Expenses</span>
              <span className="neg">−{fmtMo(expenses)}</span>
            </div>
            {tuition > 0 && (
              <div className="setup-preview-row">
                <span>Tuition (${Math.min(tuition, 1000).toLocaleString()}/yr)</span>
                <span className="neg">−{fmtMo(Math.min(tuition, 1000) / 12)}</span>
              </div>
            )}
            <div className="setup-preview-divider" />
            <div className="setup-preview-row net">
              <span>Net / month</span>
              <span style={{ color: compAnnualNet / 12 >= 0 ? 'var(--teal)' : 'var(--burg)' }}>
                {compAnnualNet / 12 >= 0 ? '+' : ''}{fmtMo(compAnnualNet / 12)}
              </span>
            </div>
            <div className="setup-comp-note">Same profile · strategy: all surplus → index fund</div>
          </div>
        </div>
      </div>
    </div>
  )
}
