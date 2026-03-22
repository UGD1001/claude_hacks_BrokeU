import type { Screen } from '../types'

interface NavProps {
  screen: Screen
  netWorth: number
  onBack?: () => void
}

function fmt(n: number) {
  return '$' + Math.floor(n).toLocaleString('en-US')
}

export default function Nav({ screen, netWorth, onBack }: NavProps) {
  return (
    <nav className="nav">
      <div className="nav-logo">
        BROKE <span>U</span>
      </div>
      {screen === 'game' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginLeft: 'auto', marginRight: 20 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--mid)' }}>
            NET WORTH: <span style={{ color: 'var(--green)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 16 }}>{fmt(netWorth)}</span>
          </span>
        </div>
      )}
      {onBack && screen !== 'game' && (
        <button className="btn-back" onClick={onBack} style={{ marginBottom: 0, marginLeft: 'auto', marginRight: 12 }}>
          ← Back
        </button>
      )}
      <div className="nav-status">
        <div className="nav-dot" />
        FINANCIAL SURVIVAL RPG
      </div>
    </nav>
  )
}
