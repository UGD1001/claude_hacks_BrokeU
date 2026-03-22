import { useState, useEffect, useRef } from 'react'

interface MenuScreenProps {
  onNewGame: () => void
  onHostGame: () => void
  onJoinGame: () => void
  sessionCount: number
  relayConnected: boolean
}

const TITLE = [
  { char: 'B', cls: 'r' },
  { char: 'R', cls: 'r' },
  { char: 'O', cls: '' },
  { char: 'K', cls: '' },
  { char: 'E', cls: '' },
  { char: ' ', cls: '' },
  { char: 'U', cls: 'y' },
]

function useMSTClock() {
  const getMST = () => new Date().toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true })
  const [time, setTime] = useState(getMST)
  useEffect(() => {
    const t = setInterval(() => setTime(getMST()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

export default function MenuScreen({ onNewGame, onHostGame, onJoinGame, sessionCount, relayConnected }: MenuScreenProps) {
  const [cursorVisible, setCursorVisible] = useState(true)
  const [typedCount, setTypedCount] = useState(0)
  const [showMpHelp, setShowMpHelp] = useState(false)
  const mpHelpRef = useRef<HTMLDivElement>(null)
  const mstTime = useMSTClock()

  useEffect(() => {
    const t = setInterval(() => setCursorVisible(v => !v), 530)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (typedCount >= TITLE.length) return
    const t = setTimeout(() => setTypedCount(n => n + 1), 120)
    return () => clearTimeout(t)
  }, [typedCount])

  // Close mp help dropdown when clicking outside
  useEffect(() => {
    if (!showMpHelp) return
    const handler = (e: MouseEvent) => {
      if (mpHelpRef.current && !mpHelpRef.current.contains(e.target as Node)) {
        setShowMpHelp(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMpHelp])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingTop: 60, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

      {/* ── PIXEL DORM SCENE ── */}
      <svg
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0 }}
        viewBox="0 0 960 720"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        <rect width="960" height="720" fill="#231c2d"/>
        <rect width="960" height="480" fill="#2e2438"/>
        <g stroke="#3a2d3e" strokeWidth="1" opacity=".4">
          {[80,160,240,320,400].map(y=><line key={`h${y}`} x1="0" y1={y} x2="960" y2={y}/>)}
          {[80,160,240,320,400,480,560,640,720,800,880].map(x=><line key={`v${x}`} x1={x} y1="0" x2={x} y2="480"/>)}
        </g>
        {/* Left window */}
        <rect x="32" y="40" width="160" height="200" fill="#515262"/>
        <rect x="36" y="44" width="152" height="192" fill="#1a1422"/>
        <rect x="36" y="136" width="152" height="8" fill="#515262"/>
        <rect x="108" y="44" width="8" height="192" fill="#515262"/>
        <rect x="40" y="48" width="64" height="84" fill="#543344"/>
        <rect x="116" y="48" width="68" height="84" fill="#543344"/>
        <rect x="40" y="148" width="64" height="84" fill="#3a2d3e"/>
        <rect x="116" y="148" width="68" height="84" fill="#3a2d3e"/>
        <rect x="58" y="92" width="4" height="4" fill="#caa05a" opacity=".8"/>
        <rect x="88" y="84" width="4" height="4" fill="#caa05a" opacity=".6"/>
        <rect x="32" y="40" width="12" height="200" fill="#543344" opacity=".8"/>
        <rect x="180" y="40" width="12" height="200" fill="#543344" opacity=".8"/>
        {/* Right window */}
        <rect x="480" y="40" width="160" height="200" fill="#515262"/>
        <rect x="484" y="44" width="152" height="192" fill="#1a1422"/>
        <rect x="484" y="136" width="152" height="8" fill="#515262"/>
        <rect x="556" y="44" width="8" height="192" fill="#515262"/>
        <rect x="488" y="48" width="64" height="84" fill="#543344"/>
        <rect x="564" y="48" width="68" height="84" fill="#543344"/>
        <rect x="540" y="84" width="4" height="4" fill="#8b4049" opacity=".7"/>
        <rect x="480" y="40" width="12" height="200" fill="#543344" opacity=".8"/>
        <rect x="628" y="40" width="12" height="200" fill="#543344" opacity=".8"/>
        {/* Poster + sticky notes */}
        <rect x="680" y="48" width="128" height="88" fill="#515262"/>
        <rect x="684" y="52" width="120" height="80" fill="#2e2438"/>
        <rect x="696" y="64" width="96" height="6" fill="#63787d" opacity=".5"/>
        <rect x="696" y="82" width="96" height="6" fill="#8b4049" opacity=".5"/>
        <rect x="680" y="152" width="48" height="48" fill="#caa05a"/>
        <rect x="684" y="156" width="40" height="4" fill="#ae6a47"/>
        <rect x="684" y="164" width="32" height="4" fill="#ae6a47" opacity=".7"/>
        <rect x="736" y="144" width="40" height="40" fill="#63787d"/>
        <rect x="784" y="152" width="44" height="40" fill="#8ea091"/>
        {/* Desk */}
        <rect x="0" y="440" width="960" height="16" fill="#515262"/>
        <rect x="0" y="456" width="960" height="4" fill="#3a2d3e"/>
        {/* Laptop */}
        <rect x="520" y="296" width="192" height="144" fill="#515262"/>
        <rect x="524" y="300" width="184" height="136" fill="#231c2d"/>
        <rect x="528" y="304" width="176" height="128" fill="#1a1422"/>
        <rect x="528" y="304" width="176" height="12" fill="#63787d" opacity=".4"/>
        <rect x="532" y="318" width="48" height="3" fill="#8ea091"/>
        <rect x="532" y="325" width="60" height="3" fill="#8b4049"/>
        <rect x="532" y="339" width="72" height="3" fill="#caa05a"/>
        <rect x="544" y="361" width="80" height="3" fill="#c9cca1" opacity=".7"/>
        <rect x="496" y="440" width="240" height="8" fill="#3a2d3e"/>
        {/* Textbooks */}
        <rect x="24" y="404" width="72" height="14" fill="#63787d"/>
        <rect x="24" y="418" width="72" height="14" fill="#543344"/>
        <rect x="24" y="432" width="72" height="10" fill="#8b4049"/>
        {/* Phone */}
        <rect x="840" y="400" width="48" height="36" fill="#2e2438"/>
        <rect x="844" y="404" width="40" height="28" fill="#231c2d"/>
        <rect x="866" y="402" width="10" height="10" fill="#8b4049"/>
        {/* Floor */}
        <rect x="0" y="456" width="960" height="264" fill="#231c2d"/>
        <g fill="none" stroke="#2e2438" strokeWidth="1">
          {[480,504,528].map(y=><line key={`fy${y}`} x1="0" y1={y} x2="960" y2={y}/>)}
          {[80,160,240,320,400,480,560,640,720,800,880].map(x=><line key={`fx${x}`} x1={x} y1="456" x2={x} y2="720"/>)}
        </g>
        {/* Pixel character */}
        <g transform="translate(720,384)">
          <rect x="-24" y="104" width="48" height="6" fill="#3a2d3e"/>
          <rect x="-16" y="110" width="6" height="32" fill="#2e2438"/>
          <rect x="10"  y="110" width="6" height="32" fill="#2e2438"/>
          <rect x="-14" y="72"  width="12" height="32" fill="#543344"/>
          <rect x="2"   y="72"  width="12" height="32" fill="#543344"/>
          <rect x="-22" y="28"  width="44" height="48" fill="#543344"/>
          <rect x="-12" y="56"  width="24" height="16" fill="#3a2d3e"/>
          <rect x="-38" y="36"  width="16" height="40" fill="#543344"/>
          <rect x="22"  y="36"  width="16" height="40" fill="#543344"/>
          <rect x="-18" y="-10" width="36" height="32" fill="#ae6a47"/>
          <rect x="-18" y="-10" width="36" height="8"  fill="#2a2535"/>
          <rect x="-12" y="2"   width="6"  height="2"  fill="#8b4049"/>
          <rect x="6"   y="2"   width="6"  height="2"  fill="#8b4049"/>
          <rect x="20"  y="-4"  width="4"  height="6"  fill="#63787d" opacity=".8"/>
        </g>
        {/* Crumpled papers */}
        <rect x="420" y="428" width="16" height="12" fill="#515262" opacity=".5" transform="rotate(-8 428 434)"/>
        <rect x="444" y="432" width="12" height="10" fill="#515262" opacity=".4" transform="rotate(5 450 437)"/>
      </svg>

      {/* Overlays */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(to right,rgba(26,20,34,0.94) 0%,rgba(26,20,34,0.78) 48%,rgba(26,20,34,0.0) 100%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, zIndex:1, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(26,20,34,0.4) 3px,rgba(26,20,34,0.4) 4px)', pointerEvents:'none' }} />

      {/* MENU CONTENT */}
      <div style={{ position:'relative', zIndex:2, padding:'64px 56px', maxWidth:5000, display:'flex', flexDirection:'column' }}>
        <div className="menu-eyebrow">// financial survival rpg · 20 year simulation</div>
        <h1 className="menu-title">
          {TITLE.slice(0, typedCount).map((t, i) =>
            t.cls ? <span key={i} className={t.cls}>{t.char}</span> : t.char
          )}
          <span className="menu-title-cursor">{cursorVisible ? '▌' : ' '}</span>
        </h1>
        <p className="menu-tagline">
          "Adulting is a full-time job with no training."
        </p>

        <div className="menu-feature-list">
          <div className="menu-feature"><span className="menu-feature-icon">→</span> 20-year simulation · 1 real minute = 1 year</div>
          <div className="menu-feature"><span className="menu-feature-icon">$</span> Stocks, index funds, real estate, crypto</div>
          <div className="menu-feature"><span className="menu-feature-icon">×</span> Race against a computer opponent</div>
          <div className="menu-feature"><span className="menu-feature-icon">!</span> 15 life events that test your decisions</div>
          <div className="menu-feature"><span className="menu-feature-icon">⚡</span> Up to 5 players on the same machine</div>
          <div className="menu-feature"><span className="menu-feature-icon">?</span> Finance Codex — 24 entries to unlock</div>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={onNewGame}>
            <span className="menu-btn-prompt">&gt;_</span>
            Solo Game
            <span className="menu-btn-cursor" style={{ opacity: cursorVisible ? 1 : 0 }}>▮</span>
          </button>

          {/* Multiplayer row */}
          <div className="menu-mp-row">
            <button className="menu-btn-mp" onClick={onHostGame}>
              HOST LOBBY
            </button>
            <button className="menu-btn-mp" onClick={onJoinGame}>
              JOIN GAME{sessionCount > 0 ? ` (${sessionCount})` : ''}
            </button>
            <div className="menu-mp-help-wrap" ref={mpHelpRef}>
              <button className="menu-btn-mp menu-btn-mp-help" onClick={() => setShowMpHelp(v => !v)} title="Multiplayer info">?</button>
              {showMpHelp && (
                <div className="menu-mp-help">
                  <strong>Local multiplayer</strong><br />
                  One player hosts, others join on separate devices on the same network. Requires the relay server (<code>node relay.js</code>) to be running locally.
                  <div className="menu-mp-relay">
                    Relay: <span style={{ color: relayConnected ? 'var(--green)' : 'var(--red)' }}>
                      {relayConnected ? '● connected' : '○ offline'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:3,
        padding:'12px 24px',
        background:'rgba(26,20,34,0.9)',
        borderTop:'4px solid #515262',
        boxShadow:'0 -2px 0 #543344',
        display:'flex', alignItems:'center', gap:32,
      }}>
        <span style={{ fontSize:6, letterSpacing:'0.1em', color:'#63787d', textTransform:'uppercase' }}>▶ DORM ROOM 214 · WESTBROOK HALL</span>
        <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:11, color:'#c9cca1', textShadow:'2px 2px 0 #543344' }}>{mstTime} MST · YEAR 01</span>
        <span style={{ fontSize:6, color:'#8ea091', lineHeight:2 }}>PHASE 1: RACE TO $25,000 · BUY A CAR</span>
      </div>
    </div>
  )
}
