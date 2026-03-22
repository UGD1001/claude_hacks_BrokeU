import type { GameState } from '../types'

interface Props {
  state: GameState
  onStartGame: () => void
  onBack: () => void
}

export default function LobbyScreen({ state, onStartGame, onBack }: Props) {
  const isHost = state.mpRole === 'host'
  const allPlayers = [
    { id: state.mpPlayerId, name: state.playerName, isMe: true, isHost },
    ...state.remotePlayers.map(p => ({ id: p.id, name: p.name, isMe: false, isHost: false })),
  ]

  return (
    <div className="lobby-screen">
      <div className="lobby-card">
        <div className="lobby-eyebrow">&gt;_ MULTIPLAYER LOBBY</div>
        <h2 className="lobby-title">BROKE U</h2>

        <div className="lobby-session">
          <span className="lobby-session-label">SESSION</span>
          <span className="lobby-session-id">{state.mpSessionId.toUpperCase()}</span>
        </div>

        {isHost && (
          <div className="lobby-how-to">
            <div className="lobby-how-step"><span className="lobby-how-num">1</span>Share the session code above with other players.</div>
            <div className="lobby-how-step"><span className="lobby-how-num">2</span>They click <strong>Join Game</strong> on the menu and enter the code.</div>
            <div className="lobby-how-step"><span className="lobby-how-num">3</span>Click <strong>Start Game</strong> once everyone has joined.</div>
          </div>
        )}

        <div className="lobby-info">
          {isHost
            ? 'All players share the same market — who survives best wins.'
            : 'Waiting for the host to start the game…'}
        </div>

        <div className="lobby-players-header">PLAYERS ({allPlayers.length})</div>
        <div className="lobby-players">
          {allPlayers.map(p => (
            <div key={p.id} className={`lobby-player ${p.isMe ? 'me' : ''}`}>
              <span className="lobby-player-dot">●</span>
              <span className="lobby-player-name">
                {p.name || 'Anonymous'}
                {p.isMe && <em className="lobby-you"> (you)</em>}
                {p.isHost && <em className="lobby-host"> · host</em>}
              </span>
              <span className="lobby-player-ready">READY</span>
            </div>
          ))}
        </div>

        <div className="lobby-actions">
          {isHost && (
            <button className="menu-btn primary lobby-start-btn" onClick={onStartGame}>
              <span className="menu-btn-prompt">&gt;_</span>
              Start Game ({allPlayers.length} player{allPlayers.length !== 1 ? 's' : ''})
            </button>
          )}
          <button className="menu-btn secondary" onClick={onBack}>
            ← Leave Lobby
          </button>
        </div>
      </div>
    </div>
  )
}
