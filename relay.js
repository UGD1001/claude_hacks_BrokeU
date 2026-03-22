// BROKE U — Multiplayer Relay Server
// Relays WebSocket messages between all connected browser windows.
// Run with: node relay.js
// All browser windows (any port) connect to ws://localhost:3001

import { WebSocketServer } from 'ws'

const PORT = 3001
const clients = new Set()

// Cache all active lobbies by sessionId so new clients get them on connect
const activeSessions = new Map() // sessionId → raw JSON string of HOST_ANNOUNCE

const wss = new WebSocketServer({ port: PORT })

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.`)
    console.error(`    Another relay is probably already running — that's fine, use that one.\n`)
  } else {
    console.error('Server error:', err.message)
  }
  process.exit(0)
})

wss.on('listening', () => {
  console.log(`\n🎮  BROKE U relay server running at ws://localhost:${PORT}`)
  console.log(`    Open the game on any port — all windows will find each other.\n`)
})

wss.on('connection', (ws, req) => {
  clients.add(ws)
  console.log(`[+] Client connected from ${req.headers.origin ?? 'unknown'} — ${clients.size} total`)

  // Replay all active lobbies to the new client immediately
  for (const msg of activeSessions.values()) {
    if (ws.readyState === 1) ws.send(msg)
  }

  ws.on('message', (data) => {
    const msg = data.toString()

    try {
      const parsed = JSON.parse(msg)
      if (parsed.type === 'HOST_ANNOUNCE') {
        activeSessions.set(parsed.sessionId, msg)
        console.log(`[lobby] Session ${parsed.sessionId} active (${activeSessions.size} total)`)
      }
      if (parsed.type === 'GAME_START') {
        activeSessions.delete(parsed.sessionId)
        console.log(`[lobby] Session ${parsed.sessionId} started — removed`)
      }
    } catch {}

    for (const client of clients) {
      if (client !== ws && client.readyState === 1 /* OPEN */) {
        client.send(msg)
      }
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log(`[-] Client disconnected — ${clients.size} remaining`)
  })

  ws.on('error', (err) => console.error('WS client error:', err.message))
})
