# BROKE U — Financial Survival RPG
## Claude Code Master Brief

This file is the single source of truth for building BROKE U.
Read this entire file before writing any code.

---

## What this is

A browser-based financial literacy game. Single HTML app, no backend required for MVP.
Players manage a personal budget, invest across 5 asset types, react to life event cards,
and race a computer opponent to the highest net worth over a 20-year simulation
(20 real-world minutes, 1 minute = 1 year).

---

## File structure to build

```
broke-u/
├── index.html          # entry point
├── style.css           # all styles (design system below)
├── game.js             # main game controller, timer, state machine
├── simulation.js       # year-tick logic, market engine, computer AI
├── events.js           # event card library (15+ cards)
├── stocks.js           # stock + crypto data, sparkline renderer
├── ui.js               # DOM updates, screen transitions, overlay manager
└── data/
    ├── stocks.json     # stock definitions
    ├── cryptos.json    # crypto definitions
    └── events.json     # event card library
```

---

## Design system — apply exactly

### Colors (CSS variables)
```css
:root {
  --red: #c75347;
  --orange: #c7725c;
  --yellow: #ffdb6d;
  --green: #a2e45a;
  --teal: #4bc1c1;
  --blue: #5064cb;
  --purple: #724b9f;
  --pink: #c454b4;
  --sky: #d8eeff;
  --muted: #7ca9cb;
  --dark: #36344c;
  --darker: #26243a;
  --darkest: #100e1e;
  --ink: #0a0814;
  --mid: #626178;
  --body: #1a1828;
}
```

### Typography
- Primary font: `IBM Plex Mono` (monospace) — all UI labels, numbers, nav
- Display font: `Bebas Neue` — large titles, amounts, section headers
- Body font: `Nunito Sans` — descriptions, longer text
- Import from Google Fonts

### Global rules
- Background: `var(--ink)` (#0a0814)
- Blueprint grid overlay: `rgba(80,100,203,0.04)` 32px grid on body::before
- Scanline animation: slow horizontal line sweep across viewport
- All borders: `1px solid var(--darker)` (#26243a)
- Border radius: 4–6px for cards, 3px for buttons
- Nav: fixed, height 52px, backdrop-filter blur(8px)

---

## Screen flow

```
SETUP SCREEN
    ↓ (player fills profile)
GAME SCREEN (20 min timer starts)
    ↓ (year ticks every 60 seconds)
    ├── EVENT OVERLAY (blocks game, must respond)
    ├── GOAL TRANSITION ($25k reached → buy car prompt)
    └── GAME OVER (cash = $0, no liquid assets)
END GAME SCREEN
    ↓
EDUCATION RECAP SCREEN
```

---

## Setup screen

Player configures before game starts:

| Field | Options |
|-------|---------|
| Name | Text input |
| Salary | $30k / $50k / $75k / $100k per year |
| Rent | $600 / $1,200 / $2,000 per month |
| Monthly expenses | $400–$1,500 slider |
| Tuition debt | None / $15,000 / $40,000 |
| Starting cash | $500 (fixed for all) |

Computer opponent: always assigned median profile (salary $50k, rent $1,200, expenses $800, tuition $15k).

---

## Game screen layout — 2 columns

```
┌─ NAV: BROKE U logo | // year N of 20 | ● 12:04 remaining ─┐
│                                                              │
│  LEFT SIDEBAR (188px)    │  CENTER PANEL (flex: 1)          │
│                          │                                   │
│  Net worth card          │  Goal bar (always top)           │
│  Cash available card     │                                   │
│  ─────────────           │  hint: tap tile to invest        │
│  Monthly flow            │                                   │
│    Salary +$X            │  Core investment tiles (4-across) │
│    Rent −$X              │  [Bank] [Index] [Real Est] [lock] │
│    Expenses −$X          │                                   │
│    Tuition −$X           │  Stocks section (collapsible)    │
│    ──────────            │  [AAPL][TSLA][MSFT][AMZN]        │
│    Net/mo +$X            │  [NVDA][GOOG]                    │
│  ─────────────           │                                   │
│  Debt tracker            │  Crypto section (locked yr 10)   │
│  ─────────────           │  [BTC][ETH][SOL][DOGE]           │
│  Side hustles            │                                   │
│    Active: val           │                                   │
│    Inactive: [+]         │                                   │
│  ─────────────           │                                   │
│  Leaderboard             │                                   │
│    #1 You    $X          │                                   │
│    #2 Comp   $X          │                                   │
│  ─────────────           │                                   │
│  Codex X/24              │                                   │
└──────────────────────────┴───────────────────────────────────┘
```

---

## Investment tiles — core (4-across grid)

Each tile is compact, square-ish. Click to expand inline. Only one tile open at a time.

### Collapsed state
```
┌─────────────┐
│ 🏦    +1.5% │  ← icon + return badge
│ Bank savings│  ← name
│ $2,100      │  ← current value
│ no risk     │  ← sub label
└─────────────┘
```

### Expanded state (appended below collapsed content)
```
Cash: $4,280
[+$500] [+$1k]
[−$500] [done ✓]
```

### Return badge colors
- Positive return: green bg `rgba(162,228,90,0.15)`, text `#a2e45a`
- Negative return: red bg `rgba(199,83,71,0.15)`, text `#c75347`
- Locked: gray bg, text `#626178`

### Unlock schedule
| Investment | Unlocks | Notes |
|-----------|---------|-------|
| Bank savings | Year 1 (default) | Always available |
| Index fund | Year 2 | Computer uses this exclusively |
| Real estate | Year 7 | $10k minimum |
| Crypto pool | Year 10 | Tile in core grid |

---

## Stock tiles (4-across, same size as core tiles)

Each stock tile shows:
- Ticker (yellow, bold) + % change badge
- Company name (small, muted)
- Sparkline chart (SVG, 8 data points)
- Current price
- Shares held (teal, only shown if > 0)

### Expanded state
```
qty  [−] 2 [+]
cost: $348
[buy 2]  [sell 2]
[done ✓]
```

- Quantity selector updates cost line in real time
- Sell button dimmed (opacity 0.3, pointer-events none) if held = 0
- Buy button text updates with quantity

### Stock data
```javascript
const STOCKS = [
  { id:'AAPL', name:'Apple',     price:174, chg:+2.1, held:0 },
  { id:'TSLA', name:'Tesla',     price:248, chg:-8.4,  held:0 },
  { id:'MSFT', name:'Microsoft', price:412, chg:+1.3, held:0 },
  { id:'AMZN', name:'Amazon',    price:186, chg:-3.2,  held:0 },
  { id:'NVDA', name:'Nvidia',    price:892, chg:+5.7, held:0 },
  { id:'GOOG', name:'Alphabet',  price:138, chg:+0.8, held:0 },
];

const CRYPTOS = [
  { id:'BTC',  name:'Bitcoin',   price:62000, chg:+4.2, held:0 },
  { id:'ETH',  name:'Ethereum',  price:3200,  chg:-2.1,  held:0 },
  { id:'SOL',  name:'Solana',    price:142,   chg:+9.1, held:0 },
  { id:'DOGE', name:'Dogecoin',  price:0.14,  chg:-12.0, held:0 },
];
```

### Sparkline generation
- 8 historical data points per asset
- SVG polyline, color = green if chg positive, red if negative
- Dot at last data point
- `preserveAspectRatio="none"` to fill tile width

---

## Simulation engine

### Timer
- Total: 20 minutes real time
- 1 real minute = 1 in-game year
- `setInterval` every 60,000ms triggers `onYearTick(year)`
- Timer display counts down MM:SS

### Year tick — runs for both player and computer
```javascript
function onYearTick(year) {
  const seed = generateYearSeed(year); // same for both

  // 1. Deposit monthly income × 12
  // 2. Deduct annual expenses (rent×12 + expenses×12 + debt payment×12)
  // 3. Update all investment values using seed
  // 4. Add side hustle income if active
  // 5. Check event card roll
  // 6. Run computer AI tick (silent)
  // 7. Refresh leaderboard
  // 8. Check goal transition ($25k)
  // 9. Check game over (cash <= 0 and no liquid assets)
  // 10. Unlock new investments if year threshold reached
}
```

### Market simulation
```javascript
// Per-asset return ranges (annual)
const MARKET_PARAMS = {
  bank:        { base: 0.015, variance: 0.005 },
  index:       { base: 0.07,  variance: 0.02  },
  stocks:      { base: 0.09,  variance: 0.15  }, // per individual stock
  realEstate:  { base: 0.06,  variance: 0.03  },
  crypto:      { base: 0.20,  variance: 0.45  }, // per individual coin
};

// Market events override standard variance for that year
// crash: index −20%, stocks −25%, real estate −10%
// boom:  index +15%, stocks +20%
// crypto surge: crypto +60%
```

### Computer AI
```javascript
function computerYearTick(year, marketReturn) {
  // 1. Deposit income, deduct expenses (same as player formula)
  // 2. Put ALL surplus cash into index fund
  // 3. If cash >= 25000 and car not bought: buy car
  // 4. After car: continue putting surplus into index fund
  // 5. Event cards: always pick most conservative option
  // 6. Never buys stocks, crypto, real estate
  // 7. Maintains $2,000 cash buffer at all times
}
```

---

## Event card system

### Trigger logic
```javascript
function rollEventCard(year, playerState) {
  let probability = 0.20; // base 20% per year
  if (!playerState.hasEmergencyFund) probability += 0.15;
  if (playerState.cryptoValue > 0)   probability += 0.10;
  if (playerState.debtRatio > 0.5)   probability += 0.20;

  // Milestone events always fire
  if (year === 10) triggerEvent('CRYPTO_UNLOCK_WARNING');

  if (Math.random() < probability) {
    return pickRandomEvent(year);
  }
}
```

### Event card overlay
- Covers entire screen with `rgba(6,4,14,0.88)` backdrop
- Card: `width: 310px`, dark bg, red top border `3px solid #c75347`
- Game timer PAUSES until player picks a choice
- Player must click a choice — no close/dismiss without choosing
- Computer auto-resolves (most conservative choice) simultaneously

### Event card structure
```javascript
{
  id: 'CAR_BREAKDOWN',
  title: 'Car breaks down — $3,200 repair',
  desc: 'Your car needs urgent repairs. How do you cover it?',
  impact: 'Cost: $3,200 immediate',
  category: 'asset',
  choices: [
    { key:'A', text:'Pay from savings',           outcome:'safe',     effect: { cash: -3200 } },
    { key:'B', text:'Take a high-interest loan',  outcome:'risky',    effect: { debt: +3200, interestRate: 0.18 } },
    { key:'C', text:'Sell investments to cover',  outcome:'warning',  effect: { sellInvestments: 3200 } },
  ]
}
```

### Event library (minimum 15 — build all of these)

| ID | Title | Category | Impact |
|----|-------|----------|--------|
| CAR_BREAKDOWN | Car breaks down — $3,200 repair | asset | −$3,200 |
| MEDICAL_EMERGENCY | Hospital bill — $8,000 | medical | −$8,000 |
| MARKET_CRASH | Market dips 20% | market | portfolio −20% |
| MARKET_BOOM | Bull run — market up 15% | market | portfolio +15% |
| JOB_LAYOFF | Laid off — 6 months no income | income | −6 months salary |
| PAY_RAISE | Promotion — salary +15% | income | salary ×1.15 |
| UNEXPECTED_BONUS | Work bonus — $5,000 | windfall | +$5,000 |
| INHERITANCE | Unexpected inheritance — $20,000 | windfall | +$20,000 |
| TAX_REFUND | Tax refund — $2,400 | windfall | +$2,400 |
| FRIEND_LOAN | Friend needs $10,000 loan | social | −$10k for 3 years |
| HOT_TIP | Stock tip: 30% 10x / 70% −80% | opportunity | gamble |
| NEW_BABY | New baby — costs +$800/mo | life | expenses +$800/mo |
| CRYPTO_SURGE | Crypto up 60% this year | market | crypto ×1.6 |
| RENT_HIKE | Landlord raises rent +$300/mo | life | rent +$300/mo |
| CRYPTO_UNLOCK_WARNING | Crypto market now accessible | milestone | unlocks crypto |

---

## Goal system

### Phase 1 — Race to $25,000
- Goal bar in center panel always visible at top
- Shows: progress bar, % complete, $ saved, $ remaining
- Computer races toward same goal independently

### Goal transition modal ($25k reached)
```
Full screen overlay (same as event card but yellow border)

"You have $25,000 saved."
"The car is within reach."

[Buy the car — $25,000]     [Keep investing]

Subtext: Computer bought its car at Year X.
```

- If player buys: car asset added (depreciates 10%/yr), goal shifts to net worth max
- If player skips: goal is immediately net worth max, car prompt reappears every 3 years
- Computer ALWAYS buys immediately

### Phase 2 — Net worth maximization
- Goal bar replaced by net worth sparkline (last 5 years)
- Leaderboard becomes the primary competitive display

---

## Side hustles

```javascript
const SIDE_HUSTLES = [
  { id:'freelance',  name:'Freelancing',     cost:0,    annualIncome:3000,  availableFromYear:1 },
  { id:'store',      name:'Online store',    cost:200,  annualIncome:4000,  availableFromYear:3 },
  { id:'content',    name:'Content creator', cost:0,    annualIncome:2000,  availableFromYear:1, growthYears:3 },
  { id:'digital',    name:'Digital product', cost:5000, annualIncome:2400,  availableFromYear:1 },
  { id:'rental',     name:'Room rental',     cost:500,  annualIncome:6000,  requiresRealEstate:true },
];
```

- Active hustle: shows name + income/yr in left sidebar
- Inactive hustle: shows name + [+] button
- Clicking [+] deducts setup cost and activates (income starts next year)
- Content creator income grows over 3 years: $2k → $4k → $8k

---

## Leaderboard (left sidebar)

```
// year 8 standings
#1  You       $18,420   ← yellow
#2  Computer  $17,880   ← muted
```

- Updates every year tick
- Car icon (🚗) shown next to name once car is purchased
- In multiplayer sessions (future): shows all human players + computer

---

## Finance Codex

- 24 entries total, starts with 4 unlocked
- Unlocks triggered by game events (see GDD for full unlock schedule)
- Accessible from nav or left sidebar
- Shows notification dot when new entries are unlocked
- Each entry: title, plain-language explanation, formula block, game tip, scenario with choices

---

## End game screen

Triggered at minute 20 (or game over).

### Results (shown first)
- Final leaderboard — frozen
- Player vs Computer side-by-side:
  - Total income earned
  - Total invested
  - Best single investment return
  - Net worth at Year 5, 10, 15, 20

### Education recap (shown after results)
Personalized tips generated from player's actual decisions:
- What you did well (green callout)
- What hurt your score (yellow callout)
- Key lesson from this run (blue callout)
- How computer compared (teal callout)

---

## Net worth formula

```javascript
function calcNetWorth(state) {
  const cash = state.cash;
  const investments =
    state.bankValue +
    state.indexValue +
    state.realEstateValue +
    state.stocksValue +     // sum of (shares × current price) per stock
    state.cryptoValue;      // sum of (units × current price) per coin
  const assets =
    state.carOwned ? state.carValue : 0; // depreciates 10%/yr
  const debts =
    state.tuitionDebt +
    state.loanDebt;

  return cash + investments + assets - debts;
}
```

---

## Game over condition

```javascript
function checkGameOver(state) {
  const liquidAssets = state.cash + state.bankValue + state.indexValue;
  if (liquidAssets <= 0 && state.cash <= 0) {
    triggerGameOver();
  }
}
```

Game over screen shows: year reached, net worth at death, key decision that caused it.

---

## Things NOT to build in MVP

- User accounts / login
- Backend / database
- Multiplayer sync (UI slots exist but computer is the only opponent)
- Multi-language
- Native mobile app
- Monetization

---

## Start here

1. Build `index.html` with the setup screen
2. Add `style.css` with the full design system
3. Build the game screen layout (2-column, nav, all panels)
4. Wire up `game.js` with the timer and state object
5. Build `simulation.js` year tick
6. Build `events.js` with 15 event cards
7. Build `stocks.js` with sparklines
8. Wire up end game + recap screens
9. Test full 20-minute run

When in doubt about visual design, refer to the mockup HTML in `mockup.html`.
