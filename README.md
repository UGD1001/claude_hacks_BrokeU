# BROKE U — Financial Survival RPG

A browser-based financial literacy game. Manage a personal budget, invest across stocks, index funds, real estate, and crypto, react to life event cards, and race a computer opponent (or friends) to the highest net worth over a 20-year simulation.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

---

## Installation

```bash
npm install
```

---

## Running the game

### Solo (single player)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Multiplayer (local, same machine)

Multiplayer works by running a local relay server that lets multiple browser windows talk to each other. All windows must be on the same machine.

**Step 1 — Start the relay server**

Open a terminal and run:

```bash
npm run relay
```

Keep this terminal open for the entire session. You should see:

```
🎮  BROKE U relay server running at ws://localhost:3001
```

**Step 2 — Open a browser window for each player**

Each player needs their own browser window. Use the pre-configured dev scripts to avoid port conflicts:

| Player | Command | URL |
|--------|---------|-----|
| Player 1 (host) | `npm run dev` | http://localhost:5173 |
| Player 2 | `npm run dev:5174` | http://localhost:5174 |
| Player 3 | `npm run dev:5175` | http://localhost:5175 |
| Player 4 | `npm run dev:5176` | http://localhost:5176 |

Run each command in a **separate terminal**.

**Step 3 — Host a lobby**

In the host's window, click **Host Lobby**, fill out your character setup, and you'll land in the lobby screen. A 6-character session code will be shown — share it with the other players.

**Step 4 — Other players join**

In each other window, click **Join Game**, enter your name and the session code from the host, then fill out your own setup.

**Step 5 — Start the game**

Once everyone is in the lobby, the host clicks **Start Game**. All windows start simultaneously with the same market seed — so everyone sees the same market events and crashes.

> **Note:** The relay server must stay running for the entire session. If it stops, multiplayer sync will break. Solo play is unaffected.

---

## How the game works

- The game runs for **20 real minutes** — 1 minute = 1 in-game year
- You start with **$500 cash** and a salary, rent, and optional tuition debt you configure at setup
- Every year: salary is deposited, rent/expenses/debt are deducted, all investments grow (or shrink) based on market simulation
- A **computer opponent** always invests surplus cash into the index fund and plays conservatively
- **Life events** fire randomly (car breakdown, job layoff, market crash, inheritance, etc.) and pause the timer until you pick a choice
- In multiplayer, all windows share the same random seed so market events are identical for everyone

### Investment unlock schedule

| Investment | Unlocks |
|-----------|---------|
| Bank savings | Year 1 (always available) |
| Index fund | Year 2 |
| Individual stocks | Year 1 |
| Real estate | Year 7 (min. $10,000) |
| Crypto pool | Year 10 |

### Game phases

**Phase 1 — Race to $25,000:** Build your net worth to $25k to buy a car. The computer races toward the same goal.

**Phase 2 — Net worth battle:** After the car decision, the goal shifts to maximum net worth by Year 20. Whoever has the most wins.

---

## Data storage

There is **no backend and no database**. All game state lives in React memory for the duration of the session. When you close or refresh the tab, the game resets. Nothing is persisted to localStorage or any server.

In multiplayer, the relay server (`relay.js`) only passes WebSocket messages between windows — it never stores player data. The only state it holds is a list of active lobbies (in memory), which clears when the server restarts.

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static file server. Multiplayer still requires the relay server running alongside it.

---

## Project structure

```
broke-u/
├── relay.js                  # WebSocket relay server for multiplayer
├── src/
│   ├── App.tsx               # Root component, all screen routing and game actions
│   ├── types.ts              # TypeScript types (GameState, events, investments)
│   ├── gameData.ts           # All game constants (stocks, events, side hustles, codex)
│   ├── index.css             # All styles
│   ├── hooks/
│   │   ├── useGameLoop.ts    # Year tick logic, market simulation, computer AI
│   │   └── useMultiplayer.ts # WebSocket relay connection and state sync
│   └── components/
│       ├── MenuScreen.tsx    # Title screen with solo / multiplayer options
│       ├── SetupScreen.tsx   # Character setup (name, salary, rent, debt)
│       ├── TutorialOverlay.tsx # Intro tutorial shown before first game
│       ├── LobbyScreen.tsx   # Multiplayer lobby (host + join flow)
│       ├── GameScreen.tsx    # Main game layout
│       ├── LeftPanel.tsx     # Net worth, cash flow, side hustles, leaderboard, codex
│       ├── CenterPanel.tsx   # Investment tiles (bank, index, real estate, stocks, crypto)
│       ├── Nav.tsx           # Top navigation bar with year and timer
│       ├── EventModal.tsx    # Life event card overlay
│       ├── CarModal.tsx      # $25k goal reached — buy car prompt
│       ├── EndGameScreen.tsx # Final results and education recap
│       └── AchievementToast.tsx # Pop-up achievement notifications
```

---

## Tech stack

- React 18 + TypeScript
- Vite
- `ws` — WebSocket library for the relay server

---

## Troubleshooting

**Relay server says port 3001 is already in use**
Another relay instance is already running — that's fine, use it. No need to start another.

**"relay offline" shown on the menu screen**
The relay server is not running. Start it with `npm run relay` in a separate terminal.

**Join Game shows no lobbies / session code not found**
Make sure both windows are connected to the same relay (both should show "● relay connected" on the menu). Check that the relay terminal is still running and that the session code is correct (6 characters, case-insensitive).

**Players aren't seeing each other in the lobby**
Refresh the joining player's window and try joining again. The host's lobby is re-announced to new connections automatically.
