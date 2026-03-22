import { useEffect, useRef, useState, useCallback } from 'react'
import type { GameState, MPMsg, RemotePlayer } from '../types'

const RELAY_URL = import.meta.env.PROD
  ? 'wss://YOUR-RELAY-URL.up.railway.app'
  : 'ws://localhost:3001'

export function useMultiplayer(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  onGameStart: (seed: number) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const [relayConnected, setRelayConnected] = useState(false)
  // Map of sessionId → hostName for all known active lobbies
  const [activeSessions, setActiveSessions] = useState<Map<string, string>>(new Map())

  // Keep refs in sync with latest values so message handler is never stale
  const mpRoleRef = useRef(gameState.mpRole)
  const mpSessionIdRef = useRef(gameState.mpSessionId)
  const mpPlayerIdRef = useRef(gameState.mpPlayerId)
  useEffect(() => { mpRoleRef.current = gameState.mpRole }, [gameState.mpRole])
  useEffect(() => { mpSessionIdRef.current = gameState.mpSessionId }, [gameState.mpSessionId])
  useEffect(() => { mpPlayerIdRef.current = gameState.mpPlayerId }, [gameState.mpPlayerId])

  // Message handler stored in ref so WebSocket closure is never stale
  const handleMessageRef = useRef<(msg: MPMsg) => void>(() => {})
  useEffect(() => {
    handleMessageRef.current = (msg: MPMsg) => {

      if (msg.type === 'HOST_ANNOUNCE') {
        setActiveSessions(prev => {
          const next = new Map(prev)
          next.set(msg.sessionId, msg.hostName)
          return next
        })
      }

      if (msg.type === 'GAME_START') {
        setActiveSessions(prev => {
          const next = new Map(prev)
          next.delete(msg.sessionId)
          return next
        })
      }

      if (msg.type === 'PLAYER_JOIN') {
        if (mpRoleRef.current !== 'host' || msg.sessionId !== mpSessionIdRef.current) return
        if (msg.playerId === mpPlayerIdRef.current) return
        setGameState(prev => {
          const already = prev.remotePlayers.some(p => p.id === msg.playerId)
          const newPlayer: RemotePlayer = {
            id: msg.playerId,
            name: msg.playerName,
            netWorth: 500,
            carOwned: false,
            year: 1,
            lastSeen: Date.now(),
          }
          const updated = already ? prev.remotePlayers : [...prev.remotePlayers, newPlayer]
          // Broadcast updated player list to all clients
          wsRef.current?.send(JSON.stringify({
            type: 'LOBBY_SYNC',
            sessionId: prev.mpSessionId,
            players: [
              { id: prev.mpPlayerId, name: prev.playerName },
              ...updated.map(p => ({ id: p.id, name: p.name })),
            ],
          } satisfies MPMsg))
          return { ...prev, remotePlayers: updated }
        })
      }

      if (msg.type === 'LOBBY_SYNC') {
        if (mpRoleRef.current !== 'client' || msg.sessionId !== mpSessionIdRef.current) return
        setGameState(prev => ({
          ...prev,
          remotePlayers: msg.players
            .filter(p => p.id !== prev.mpPlayerId)
            .map(p => ({
              id: p.id,
              name: p.name,
              netWorth: 500,
              carOwned: false,
              year: 1,
              lastSeen: Date.now(),
            })),
        }))
      }

      if (msg.type === 'PLAYER_STATE') {
        setGameState(prev => {
          if (msg.playerId === prev.mpPlayerId) return prev
          const now = Date.now()
          const already = prev.remotePlayers.some(p => p.id === msg.playerId)
          if (already) {
            return {
              ...prev,
              remotePlayers: prev.remotePlayers.map(p =>
                p.id === msg.playerId
                  ? { ...p, name: msg.playerName, netWorth: msg.netWorth, carOwned: msg.carOwned, year: msg.year }
                  : p
              ),
            }
          }
          return {
            ...prev,
            remotePlayers: [...prev.remotePlayers, {
              id: msg.playerId, name: msg.playerName,
              netWorth: msg.netWorth, carOwned: msg.carOwned,
              year: msg.year,
            }],
          }
        })
      }

      if (msg.type === 'GAME_START') {
        if (mpRoleRef.current !== 'client' || msg.sessionId !== mpSessionIdRef.current) return
        onGameStart(msg.seed)
      }

      if (msg.type === 'TIMER_SYNC') {
        if (mpRoleRef.current !== 'client') return
        setGameState(prev => {
          if (prev.screen !== 'game') return prev
          const drift = Math.abs(prev.timeToNextHalfYear - msg.timeToNextYear)
          if (drift > 3 && prev.year === msg.year) return { ...prev, timeToNextHalfYear: msg.timeToNextYear }
          return prev
        })
      }

      if (msg.type === 'PLAYER_LEAVE') {
        setGameState(prev => ({
          ...prev,
          remotePlayers: prev.remotePlayers.filter(p => p.id !== msg.playerId),
        }))
      }
    }
  })

  // Open WebSocket once and keep alive with auto-reconnect
  useEffect(() => {
    let ws: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>
    let alive = true

    const connect = () => {
      if (!alive) return
      const socket = new WebSocket(RELAY_URL)
      ws = socket
      wsRef.current = socket

      socket.onopen = () => {
        // Only mark connected if this socket is still the active one
        if (wsRef.current === socket) setRelayConnected(true)
      }

      socket.onmessage = (e) => {
        try { handleMessageRef.current(JSON.parse(e.data)) } catch {}
      }

      socket.onclose = () => {
        // Only update shared state if this socket hasn't already been superseded
        // (StrictMode closes ws1 after ws2 is already set — without this guard
        // ws1.onclose would null out ws2's reference and break HOST_ANNOUNCE)
        if (wsRef.current === socket) {
          wsRef.current = null
          setRelayConnected(false)
        }
        if (alive) reconnectTimer = setTimeout(connect, 2000)
      }

      socket.onerror = () => {}
    }

    connect()

    return () => {
      alive = false
      clearTimeout(reconnectTimer)
      ws?.close()
      // Don't null wsRef here — if StrictMode's cleanup runs while a new
      // socket is already being set up, we'd clobber it. The onclose guard handles it.
    }
  }, []) // Open once, reconnects automatically

  // Host: broadcast presence while in setup or lobby so clients can discover
  useEffect(() => {
    if (gameState.mpRole !== 'host') return
    if (gameState.screen !== 'setup' && gameState.screen !== 'lobby') return

    const send = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'HOST_ANNOUNCE',
          sessionId: gameState.mpSessionId,
          hostId: gameState.mpPlayerId,
          hostName: gameState.playerName,
        } satisfies MPMsg))
      }
    }
    send()
    const id = setInterval(send, 2000)
    return () => clearInterval(id)
  }, [gameState.mpRole, gameState.screen, gameState.mpSessionId, gameState.mpPlayerId, gameState.playerName])

  // All players: push own state every second during game for leaderboard
  useEffect(() => {
    if (gameState.mpRole === 'solo' || gameState.screen !== 'game') return
    const id = setInterval(() => {
      setGameState(prev => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'PLAYER_STATE',
            playerId: prev.mpPlayerId,
            playerName: prev.playerName,
            netWorth: calcNetWorthLocal(prev),
            carOwned: prev.carOwned,
            year: prev.year,
          } satisfies MPMsg))
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [gameState.mpRole, gameState.screen, setGameState])

  // Host: send timer sync every 5s so clients stay in step
  useEffect(() => {
    if (gameState.mpRole !== 'host' || gameState.screen !== 'game') return
    const id = setInterval(() => {
      setGameState(prev => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'TIMER_SYNC',
            year: prev.year,
            timeToNextYear: prev.timeToNextHalfYear,
          } satisfies MPMsg))
        }
        return prev
      })
    }, 5000)
    return () => clearInterval(id)
  }, [gameState.mpRole, gameState.screen, setGameState])

  const broadcastGameStart = useCallback((seed: number) => {
    wsRef.current?.send(JSON.stringify({
      type: 'GAME_START',
      sessionId: gameState.mpSessionId,
      seed,
    } satisfies MPMsg))
  }, [gameState.mpSessionId])

  const joinSession = useCallback((sessionId: string, playerId: string, playerName: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'PLAYER_JOIN',
      sessionId,
      playerId,
      playerName,
    } satisfies MPMsg))
  }, [])

  return { broadcastGameStart, joinSession, relayConnected, activeSessions }
}

function calcNetWorthLocal(s: GameState): number {
  const stocksVal = Object.entries(s.stockHeld).reduce(
    (acc, [id, held]) => acc + (held as number) * (s.stockPrices[id as keyof typeof s.stockPrices] ?? 0), 0
  )
  const cryptoVal = Object.entries(s.cryptoHeld).reduce(
    (acc, [id, held]) => acc + (held as number) * (s.cryptoPrices[id as keyof typeof s.cryptoPrices] ?? 0), 0
  )
  const houseEquity = s.house ? (s.house.currentValue - s.house.mortgageBalance) : 0
  return s.cash + s.bankValue + s.indexValue + s.cryptoBasketValue + stocksVal + cryptoVal
    + houseEquity + (s.carOwned ? s.carValue : 0) - s.tuitionRemaining - s.loanDebt
}
