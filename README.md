# BrokeU

**Financial Survival RPG** — a 20-year investment simulation game where you race against a computer opponent to build the highest net worth.

## What is it?

BrokeU puts you in charge of your finances for 20 simulated years (20 real minutes). Starting with just $500, you make decisions about income, investments, and life events — all while a computer opponent quietly executes the "boring but effective" strategy of dumping every spare dollar into index funds.

### Features

- **20-year simulation** — 1 real minute = 1 game year, displayed with a live countdown
- **Phase 1: Race to $25k** — first goal is buying a car (an intentional lesson in depreciation)
- **Phase 2: Net Worth battle** — outgrow the computer by Year 20
- **Investment options** — bank savings, index fund, real estate (yr 7+), crypto pool (yr 10+), 6 individual stocks, 4 cryptocurrencies with live sparklines
- **15 life events** — medical emergencies, job layoffs, market crashes, surprise windfalls, and more — each pauses the clock and forces a decision
- **Side hustles** — freelancing, e-commerce, content creation, digital products, rental income
- **Computer opponent** — always investing, never panicking, available for real-time comparison
- **Finance Codex** — 24 educational entries that unlock contextually as you play
- **Education recap** — personalized tips at game end based on your decisions

## How to run

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech stack

- React 18 + TypeScript
- Vite
- IBM Plex Mono / Bebas Neue / Nunito Sans (Google Fonts)

## Project structure

```
src/
  App.tsx              — screen routing, all game action handlers
  types.ts             — full GameState and type definitions
  gameData.ts          — market params, stock/crypto data, events, side hustles, codex
  hooks/
    useGameLoop.ts     — 250ms tick loop, year simulation, AI opponent, event firing
  components/
    Nav.tsx            — top bar with year counter, countdown timer, net worth
    MenuScreen.tsx     — landing page
    SetupScreen.tsx    — player profile builder (salary, rent, expenses, tuition)
    GameScreen.tsx     — game layout: left panel + center panel
    LeftPanel.tsx      — monthly flow, debt, side hustles, leaderboard, codex
    CenterPanel.tsx    — investment tiles, stock/crypto grid with sparklines
    EventModal.tsx     — life event overlay with choice buttons
    CarModal.tsx       — Phase 1 car purchase decision
    EndGameScreen.tsx  — results: VS comparison, net worth history, education recap
    AchievementToast.tsx
```
