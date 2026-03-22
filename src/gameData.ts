import type { StockId, CryptoId, GameEvent, GameState, HouseOption, MortgageTerm } from './types'
import rawGameStocks from './data/gameStocks.json'

// Typed access to the real historical price data
const GAME_STOCKS = rawGameStocks as Record<string, Record<string, number | null>>

// ── Real-data helpers ──────────────────────────────────────────────────────────

/** Map (startDate, halfYearsElapsed) → "YYYY-MM" */
export function getCalendarDate(startDate: string, halfYearsElapsed: number): string {
  const [y, m] = startDate.split('-').map(Number)
  const totalMonths = y * 12 + (m - 1) + halfYearsElapsed * 6
  const year  = Math.floor(totalMonths / 12)
  const month = (totalMonths % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Look up a real price; null if not yet in data */
export function getRealPrice(ticker: string, date: string): number | null {
  const month = GAME_STOCKS[date]
  if (!month) return null
  const v = month[ticker]
  return typeof v === 'number' ? v : null
}

/** Pick a random game-start month (1993-01 to 2005-01, step 1yr) */
export function pickGameStartDate(): string {
  const years = [1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005]
  const year = years[Math.floor(Math.random() * years.length)]
  return `${year}-01`
}

// ── Constants ──────────────────────────────────────────────────────────────────
export const TOTAL_YEARS      = 20
export const HALF_YEAR_SEC    = 30   // real seconds per half-year tick
export const MONTHLY_SEC      = 5    // real seconds between stock price updates
export const CAR_GOAL         = 25000

// Sprint mode
export const SPRINT_HALF_YEARS = 20   // max 10 real minutes (20 half-years = 10 years simulated)

// Backend: annual growth applied each full year
export const ANNUAL_SALARY_GROWTH      = 0.02   // 2% salary increase per year
export const ANNUAL_EXPENSE_INFLATION  = 0.015  // 1.5% expense inflation per year

// Real stock tickers — diversified across sectors
export const STOCK_IDS:  StockId[]  = ['AAPL', 'MSFT', 'KO', 'WMT', 'JNJ', 'XOM']
export const CRYPTO_IDS: CryptoId[] = ['BTGD', 'SMTC', 'FSTC', 'MMTK']

// Computer profile
export const COMP_SALARY   = 50_000
export const COMP_RENT     = 1_200
export const COMP_EXPENSES = 800
export const COMP_TUITION  = 15_000

// ── Real stock metadata ────────────────────────────────────────────────────────
// During gameplay: show fakeTicker + name. Revealed only on the end screen.

export const STOCK_META: Record<StockId, {
  name: string        // fake company name shown during game
  fakeTicker: string  // fake ticker shown during game
  sector: string
  price: number       // fallback only; real prices loaded from gameStocks.json
  realName: string    // revealed at end
  realTicker: string  // revealed at end (same as StockId key)
}> = {
  AAPL: { name: 'NovaTech',  fakeTicker: 'NVTK', sector: 'Technology',  price: 10, realName: 'Apple',             realTicker: 'AAPL' },
  MSFT: { name: 'PeakSoft',  fakeTicker: 'PKSR', sector: 'Technology',  price: 10, realName: 'Microsoft',         realTicker: 'MSFT' },
  KO:   { name: 'RefreshCo', fakeTicker: 'RFCO', sector: 'Consumer',    price: 5,  realName: 'Coca-Cola',         realTicker: 'KO'   },
  WMT:  { name: 'MegaMart',  fakeTicker: 'MMRT', sector: 'Retail',      price: 5,  realName: 'Walmart',           realTicker: 'WMT'  },
  JNJ:  { name: 'CareGroup', fakeTicker: 'CRGP', sector: 'Healthcare',  price: 10, realName: 'Johnson & Johnson', realTicker: 'JNJ'  },
  XOM:  { name: 'FuelCorp',  fakeTicker: 'FLCO', sector: 'Energy',      price: 5,  realName: 'ExxonMobil',        realTicker: 'XOM'  },
}

export const CRYPTO_META: Record<CryptoId, { name: string; price: number }> = {
  BTGD: { name: 'BitGold',     price: 62_000 },
  SMTC: { name: 'SmartChain',  price: 3_200  },
  FSTC: { name: 'FastCoin',    price: 142    },
  MMTK: { name: 'MemeToken',   price: 0.14   },
}

// ── Market parameters ──────────────────────────────────────────────────────────

export const MARKET_PARAMS = {
  bank:         { base: 0.015, variance: 0.005 },
  index:        { base: 0.07,  variance: 0.025 },
  stocks:       { base: 0.09,  variance: 0.18  },
  cryptoBasket: { base: 0.22,  variance: 0.50  },
  crypto:       { base: 0.20,  variance: 0.55  },
}

// ── Sparkline generation ───────────────────────────────────────────────────────

function genSparkline(price: number, variance: number): number[] {
  const pts: number[] = []
  let p = price * (0.75 + Math.random() * 0.5)
  for (let i = 0; i < 8; i++) {
    p = Math.max(0.001, p * (1 + (Math.random() - 0.5) * variance))
    pts.push(p)
  }
  return pts
}

/** Build an 8-point sparkline from real historical half-year prices (going back 7 half-years) */
function genRealSparkline(ticker: string, startDate: string): number[] {
  const pts: number[] = []
  for (let i = -7; i <= 0; i++) {
    const date  = getCalendarDate(startDate, i)
    const price = getRealPrice(ticker, date)
    if (price !== null) pts.push(price)
  }
  if (pts.length < 2) {
    const fallback = getRealPrice(ticker, startDate) ?? STOCK_META[ticker as StockId]?.price ?? 10
    return Array.from({ length: 8 }, (_, i) => fallback * (0.82 + i * 0.025))
  }
  return pts
}

export function makeInitialMarketData(startDate: string) {
  const stockPrices      = {} as Record<StockId,  number>
  const stockSparklines  = {} as Record<StockId,  number[]>
  const cryptoPrices     = {} as Record<CryptoId, number>
  const cryptoSparklines = {} as Record<CryptoId, number[]>

  for (const id of STOCK_IDS) {
    const realPrice     = getRealPrice(id, startDate) ?? STOCK_META[id].price
    stockPrices[id]     = realPrice
    stockSparklines[id] = genRealSparkline(id, startDate)
  }
  for (const id of CRYPTO_IDS) {
    cryptoPrices[id]     = CRYPTO_META[id].price
    cryptoSparklines[id] = genSparkline(CRYPTO_META[id].price, 0.50)
  }

  return { stockPrices, stockSparklines, cryptoPrices, cryptoSparklines }
}

// ── House options ──────────────────────────────────────────────────────────────

export const HOUSE_OPTIONS: HouseOption[] = [
  {
    type:                 'starter',
    label:                'Starter Home',
    neighbourhood:        'Eastside Flats',
    price:                120_000,
    appreciationRate:     0.04,
    rentalIncomeMonthly:  900,
  },
  {
    type:                 'suburban',
    label:                'Suburban Home',
    neighbourhood:        'Maplewood Heights',
    price:                200_000,
    appreciationRate:     0.05,
    rentalIncomeMonthly:  1_500,
  },
  {
    type:                 'upscale',
    label:                'Upscale Home',
    neighbourhood:        'Riverview Estates',
    price:                280_000,
    appreciationRate:     0.07,
    rentalIncomeMonthly:  2_200,
  },
]

// Mortgage rates by term
export const MORTGAGE_RATES: Record<MortgageTerm, number> = {
  10: 0.045,
  15: 0.055,
  20: 0.065,
}

// Standard monthly mortgage payment (amortisation formula)
export function computeMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0
  const r = annualRate / 12
  const n = termYears * 12
  if (r === 0) return principal / n
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

// Minimum cash needed before the house-offer event can fire
// = 1.5 × 20% downpayment of cheapest house
export const HOUSE_OFFER_CASH_THRESHOLD = 1.5 * 0.2 * HOUSE_OPTIONS[0].price   // $36,000

// ── Side hustles (auto-activated by events, no player cost) ───────────────────

export const SIDE_HUSTLES = [
  { id: 'freelance' as const, name: 'Freelancing',     icon: '💻', annualIncome: 3_000, growthYears: 0 },
  { id: 'store'     as const, name: 'Online Store',    icon: '🛒', annualIncome: 4_000, growthYears: 0 },
  { id: 'content'   as const, name: 'Content Creator', icon: '🎥', annualIncome: 2_000, growthYears: 3 },
  { id: 'digital'   as const, name: 'Digital Product', icon: '📝', annualIncome: 2_400, growthYears: 0 },
  // rental is a special case — only unlocked via house + move-out decision
  { id: 'rental'    as const, name: 'Room Rental',     icon: '🏠', annualIncome: 0,     growthYears: 0 }, // income set from house.rentalIncomeMonthly × 12
] as const

// ── Life events ────────────────────────────────────────────────────────────────

export const LIFE_EVENTS: GameEvent[] = [
  // ─ Financial life events ─────────────────────────────────────────────
  {
    id: 'car_breakdown', icon: '🚗',
    title: 'Car breaks down — $3,200 repair',
    desc: 'Your car needs urgent repairs. Emergency fund? Loan? Sell investments?',
    choices: [
      { key: 'A', label: 'Pay from savings',          cashChange: -3200,            outcomeClass: 'neutral', outcome: 'Expensive but done' },
      { key: 'B', label: 'Take a loan (18% APR)',     addDebt: 3200,                outcomeClass: 'bad',     outcome: '+$3,200 debt · interest drains' },
      { key: 'C', label: 'Sell index fund shares',    sellIndexAmount: 3200,        outcomeClass: 'neutral', outcome: 'Investments sold · back on track' },
    ],
  },
  {
    id: 'medical_emergency', icon: '🏥',
    title: 'Hospital bill — $8,000',
    desc: 'Nothing life-threatening. The bill, however, very much is.',
    choices: [
      { key: 'A', label: 'Pay out of pocket',         cashChange: -8000,            outcomeClass: 'bad',     outcome: 'Ouch. Debt-free though.' },
      { key: 'B', label: 'Payment plan (18% APR)',    addDebt: 8000,                outcomeClass: 'bad',     outcome: '+$8,000 debt at 18% APR' },
      { key: 'C', label: 'Liquidate portfolio',       sellAllInvestments: true,     outcomeClass: 'bad',     outcome: 'Sold investments to cover it' },
    ],
  },
  {
    id: 'market_crash', icon: '📉',
    title: 'Market crashes — down 20%!',
    desc: 'Your portfolio just dropped. What do you do?',
    choices: [
      { key: 'A', label: 'Panic sell!',               sellAllInvestments: true,     outcomeClass: 'bad',     outcome: 'Locked in losses' },
      { key: 'B', label: 'Hold steady',                                             outcomeClass: 'neutral', outcome: 'Market will recover' },
      { key: 'C', label: 'Buy the dip! ($2,000)',     cashChange: -2000, investInIndex: 2000, outcomeClass: 'good', outcome: 'Smart move · buying low' },
    ],
  },
  {
    id: 'market_boom', icon: '🚀',
    title: 'Bull run — market up 15%!',
    desc: 'Everything is green. The market is surging.',
    choices: [
      { key: 'A', label: 'Take profits',              sellAllInvestments: true,     outcomeClass: 'neutral', outcome: 'Cashed out at the top' },
      { key: 'B', label: 'Stay invested',                                           outcomeClass: 'good',    outcome: 'Riding the wave' },
      { key: 'C', label: 'Double down! ($5,000)',     cashChange: -5000, investInIndex: 5000, outcomeClass: 'neutral', outcome: 'More exposure, more upside' },
    ],
  },
  {
    id: 'job_layoff', icon: '📋',
    title: 'Laid off — 6 months no income!',
    desc: 'Restructuring. Your role has been eliminated.',
    choices: [
      { key: 'A', label: 'Live off savings',          loseHalfYearIncome: true,                                 outcomeClass: 'bad', outcome: 'Lost 6 months of income' },
      { key: 'B', label: 'Liquidate to cover',        sellAllInvestments: true, loseHalfYearIncome: true,     outcomeClass: 'bad', outcome: 'Sold investments + lost income' },
    ],
  },
  {
    id: 'pay_raise', icon: '📈',
    title: 'Promotion — salary +15%!',
    desc: 'Your boss finally noticed. Well done.',
    choices: [
      { key: 'A', label: 'Accept the raise',          salaryMultiplier: 1.15,       outcomeClass: 'good',    outcome: 'Salary increased by 15%!' },
      { key: 'B', label: 'Negotiate harder',          salaryMultiplier: 1.25,       outcomeClass: 'good',    outcome: '+25% — earned it' },
    ],
  },
  {
    id: 'unexpected_bonus', icon: '💰',
    title: 'Work bonus — $5,000!',
    desc: 'You actually hit your targets this year. Here\'s your reward.',
    choices: [
      { key: 'A', label: 'Invest in index fund',      cashChange: 5000, investInIndex: 5000, outcomeClass: 'good',    outcome: 'Into the index it goes!' },
      { key: 'B', label: 'Add to savings',            cashChange: 5000,             outcomeClass: 'good',    outcome: 'Cash cushion grows' },
      { key: 'C', label: 'Treat yourself (half)',     cashChange: 2500,             outcomeClass: 'neutral', outcome: 'Half saved, half enjoyed' },
    ],
  },
  {
    id: 'inheritance', icon: '🏛️',
    title: 'Unexpected inheritance — $20,000!',
    desc: 'A distant relative left you money. Life is unpredictable.',
    choices: [
      { key: 'A', label: 'Invest everything',         cashChange: 20000, investInIndex: 20000, outcomeClass: 'good', outcome: 'All into index fund' },
      { key: 'B', label: 'Keep as cash buffer',       cashChange: 20000,            outcomeClass: 'good',    outcome: 'Strong emergency fund' },
      { key: 'C', label: 'Split 50/50',               cashChange: 20000, investInIndex: 10000, outcomeClass: 'good', outcome: '$10k invested, $10k cash' },
    ],
  },
  {
    id: 'tax_refund', icon: '📊',
    title: 'Tax refund — $2,400!',
    desc: 'The government sent money back. Use it wisely.',
    choices: [
      { key: 'A', label: 'Invest it all',             cashChange: 2400, investInIndex: 2400, outcomeClass: 'good',    outcome: 'Boosted your portfolio!' },
      { key: 'B', label: 'Add to savings',            cashChange: 2400,             outcomeClass: 'good',    outcome: 'Cash cushion grows' },
      { key: 'C', label: 'Treat yourself',            cashChange: 1200,             outcomeClass: 'neutral', outcome: 'Half saved, half enjoyed' },
    ],
  },
  {
    id: 'friend_loan', icon: '💸',
    title: 'Friend needs $10,000 loan (3 yrs)',
    desc: 'Your buddy is in a tight spot. They\'ll return it in 3 years.',
    choices: [
      { key: 'A', label: 'Lend it!',                  lend: 10000,                  outcomeClass: 'neutral', outcome: 'Money locked for 3 years' },
      { key: 'B', label: 'Offer $2,000 instead',      lend: 2000,                   outcomeClass: 'neutral', outcome: 'Less exposure, still friendly' },
      { key: 'C', label: 'Decline politely',                                         outcomeClass: 'neutral', outcome: 'Kept your money' },
    ],
  },
  {
    id: 'hot_tip', icon: '🎰',
    title: '"This coin will 10x!" — $10,000?',
    desc: 'Your cousin swears this is legitimate. The odds are not in your favor.',
    choices: [
      { key: 'A', label: 'GO ALL IN 🎲',              gamble: 10000,                outcomeClass: 'bad',     outcome: '30% win 10×, 70% lose 80%' },
      { key: 'B', label: 'Small bet ($2k)',            gamble: 2000,                 outcomeClass: 'neutral', outcome: '30% win 10×, 70% lose 80%' },
      { key: 'C', label: 'Pass — sounds sketchy',                                    outcomeClass: 'good',    outcome: 'Smart move' },
    ],
  },
  {
    id: 'new_baby', icon: '👶',
    title: 'New baby — +$800/mo expenses!',
    desc: 'Congratulations? Your monthly expenses just jumped.',
    choices: [
      { key: 'A', label: 'Adjust budget, stay course', expenseAddMonthly: 800,      outcomeClass: 'neutral', outcome: '+$800/mo expenses permanently' },
      { key: 'B', label: 'Reduce lifestyle expenses',  expenseAddMonthly: 400,      outcomeClass: 'neutral', outcome: '+$400/mo — tightened elsewhere' },
    ],
  },
  {
    id: 'rent_hike', icon: '🏘️',
    title: 'Landlord raises rent — +$300/mo!',
    desc: 'Notice arrived. Effective next month.',
    choices: [
      { key: 'A', label: 'Accept the hike',            rentHikeMonthly: 300,        outcomeClass: 'bad',     outcome: '+$300/mo rent permanently' },
      { key: 'B', label: 'Roommate (half increase)',   rentHikeMonthly: 150,        outcomeClass: 'neutral', outcome: '+$150/mo (roommate covers rest)' },
      { key: 'C', label: 'Move (one-time $1,500)',     cashChange: -1500,           outcomeClass: 'neutral', outcome: 'Moving costs but no rent hike' },
    ],
  },
  {
    id: 'crypto_surge', icon: '🪙',
    title: 'Crypto surges 60% this year!',
    desc: 'The market went wild. Your crypto positions are printing.',
    choices: [
      { key: 'A', label: 'Take profits (sell all)',    sellAllInvestments: true,     outcomeClass: 'good',    outcome: 'Locked in gains' },
      { key: 'B', label: 'Hold for more',                                            outcomeClass: 'neutral', outcome: 'Riding the wave' },
    ],
  },
  {
    id: 'crypto_unlock', icon: '🔓',
    title: 'Crypto market now accessible!',
    desc: 'Year 10 milestone: BitGold, SmartChain, FastCoin, and MemeToken are available.',
    choices: [
      { key: 'A', label: 'Noted — let\'s explore!',                                  outcomeClass: 'good',    outcome: 'Crypto Basket + coins unlocked' },
    ],
  },

  // ─ House events ─────────────────────────────────────────────────────────
  {
    id: 'house_repair', icon: '🔧',
    title: 'Major home repair needed!',
    desc: 'Your property needs urgent work. How do you cover it?',
    choices: [
      { key: 'A', label: 'Pay out of pocket ($8k)',    payRepair: 8000,              outcomeClass: 'neutral', outcome: 'Fixed. Expensive.' },
      { key: 'B', label: 'Take a repair loan ($8k)',   houseRepairDebt: 8000,        outcomeClass: 'bad',     outcome: '+$8,000 at 18% APR' },
      { key: 'C', label: 'Cheap patch ($3k, lowers value)', payRepair: 3000, houseAppreciationMod: { delta: -0.01, years: 2 }, outcomeClass: 'bad', outcome: 'Patched — appreciation down 2 yrs' },
    ],
  },
  {
    id: 'neighbourhood_improve', icon: '🌳',
    title: 'Neighbourhood is booming!',
    desc: 'New development nearby is pushing property values up.',
    choices: [
      { key: 'A', label: 'Great news — hold the house', houseAppreciationMod: { delta: 0.04, years: 2 }, outcomeClass: 'good', outcome: '+4% appreciation bonus for 2 years' },
    ],
  },
  {
    id: 'neighbourhood_decline', icon: '📦',
    title: 'Neighbourhood is declining',
    desc: 'Businesses are leaving. Property values are sliding.',
    choices: [
      { key: 'A', label: 'Ride it out',               houseAppreciationMod: { delta: -0.03, years: 2 }, outcomeClass: 'bad', outcome: '-3% appreciation for 2 years' },
    ],
  },
  {
    id: 'robbery', icon: '🚨',
    title: 'Break-in at the property!',
    desc: 'Your home was robbed. Insurance covers part of it.',
    choices: [
      { key: 'A', label: 'File insurance claim',      cashChange: -1500,            outcomeClass: 'neutral', outcome: 'Net loss $1,500 after deductible' },
      { key: 'B', label: 'Pay out of pocket',         cashChange: -4000,            outcomeClass: 'bad',     outcome: 'Full loss — $4,000' },
    ],
  },
  {
    id: 'event_nearby', icon: '🏗️',
    title: 'Major development planned nearby!',
    desc: 'A new transit hub / park / commercial centre is coming to your area.',
    choices: [
      { key: 'A', label: 'Exciting news!',            houseAppreciationMod: { delta: 0.06, years: 1 }, outcomeClass: 'good', outcome: '+6% appreciation this year' },
    ],
  },
  {
    id: 'property_tax_break', icon: '🏛️',
    title: 'Property tax break — $1,500 saved!',
    desc: 'A new government incentive reduced your property taxes.',
    choices: [
      { key: 'A', label: 'Great, invest the savings', cashChange: 1500, investInIndex: 1500, outcomeClass: 'good', outcome: '+$1,500 into index fund' },
      { key: 'B', label: 'Keep as cash',              cashChange: 1500,             outcomeClass: 'good',    outcome: '+$1,500 cash buffer' },
    ],
  },
]

// ── Side hustle notification messages (auto-fire, no choice) ──────────────────

export const SIDE_HUSTLE_NOTIFICATIONS: Record<string, { icon: string; text: string }> = {
  freelance: { icon: '💻', text: 'New freelance client! +$3,000/yr added to income.' },
  store:     { icon: '🛒', text: 'Online store is gaining traction! +$4,000/yr.' },
  content:   { icon: '🎥', text: 'Content creator income added! Grows over 3 years.' },
  digital:   { icon: '📝', text: 'Digital product is selling! +$2,400/yr.' },
}

// ── Achievements ───────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  { id: 'first5k',  threshold: 5_000,    text: '💰 First $5,000 net worth!' },
  { id: 'ten',      threshold: 10_000,   text: '🔥 $10k milestone!' },
  { id: 'twenty',   threshold: 20_000,   text: '📈 $20k net worth!' },
  { id: 'fifty',    threshold: 50_000,   text: '🚀 $50k club!' },
  { id: 'hundred',  threshold: 100_000,  text: '💎 Six figures!' },
  { id: 'twofifty', threshold: 250_000,  text: '🌟 Quarter million!' },
  { id: 'million',  threshold: 1_000_000, text: '🏆 Millionaire!' },
]

// ── Education glossary (shown on final screen) ─────────────────────────────────

export const GLOSSARY_ENTRIES = [
  {
    term: 'Compound Interest',
    emoji: '📈',
    definition: 'Earning returns on your returns. $1,000 at 7%/yr becomes $3,870 in 20 years without adding a single dollar.',
    formula: 'A = P × (1 + r)ⁿ',
  },
  {
    term: 'Net Worth',
    emoji: '💼',
    definition: 'The true measure of financial health: everything you own minus everything you owe.',
    formula: 'Net Worth = Assets − Liabilities',
  },
  {
    term: 'Index Funds',
    emoji: '📊',
    definition: 'Funds that track a market index. Historically 7–10%/year, low fees, proven to outperform most active strategies over 20+ years.',
    formula: 'Return ≈ 7%/yr avg · variance ±2.5%',
  },
  {
    term: 'Mortgage & APR',
    emoji: '🏠',
    definition: 'A loan to buy property. Monthly payments cover interest + principal. Shorter terms cost more per month but less overall.',
    formula: 'Payment = P × r(1+r)ⁿ / ((1+r)ⁿ − 1)',
  },
  {
    term: 'Debt Interest (APR)',
    emoji: '💳',
    definition: 'High-interest debt (18% APR) doubles every 4 years. Always pay high-interest debt before investing.',
    formula: 'Doubles in: 72 / APR years  →  72/18 = 4 yrs',
  },
  {
    term: 'Diversification',
    emoji: '🎯',
    definition: 'Spreading investments across different assets and sectors to reduce the impact of any single loss.',
    formula: 'Risk ↓ as correlation between assets ↓',
  },
  {
    term: 'Inflation',
    emoji: '🌡️',
    definition: 'Money loses ~3–7% purchasing power per year. Cash sitting idle is slowly losing value.',
    formula: 'Real return = Nominal return − Inflation rate',
  },
  {
    term: 'Opportunity Cost',
    emoji: '⚖️',
    definition: 'Every financial choice has a hidden cost: the value of the best alternative you didn\'t take.',
    formula: 'Opportunity Cost = Best foregone option\'s return',
  },
]

// ── Net worth calculators ──────────────────────────────────────────────────────

export function calcNetWorth(s: GameState): number {
  const stockValue  = STOCK_IDS.reduce((sum, id)  => sum + s.stockHeld[id]  * s.stockPrices[id],  0)
  const cryptoValue = CRYPTO_IDS.reduce((sum, id) => sum + s.cryptoHeld[id] * s.cryptoPrices[id], 0)
  const investments = s.bankValue + s.indexValue + s.cryptoBasketValue + stockValue + cryptoValue
  const houseValue  = s.house ? s.house.currentValue - s.house.mortgageBalance : 0
  const carValue    = s.carOwned ? s.carValue : 0
  const debts       = s.loanDebt + s.tuitionRemaining
  return s.cash + investments + houseValue + carValue - debts
}

export function calcCompNetWorth(s: GameState): number {
  const houseEquity = s.compHouse ? s.compHouse.currentValue - s.compHouse.mortgageBalance : 0
  const carVal      = s.compCarOwned ? s.compCarValue : 0
  return s.compCash + s.compIndexValue + houseEquity + carVal - Math.max(0, s.compTuitionRemaining)
}

// ── Annual flow display ────────────────────────────────────────────────────────

export function getSideHustleAnnualIncome(s: GameState): number {
  let total = 0
  for (const h of SIDE_HUSTLES) {
    if (!s.activeSideHustles.includes(h.id)) continue
    if (h.id === 'rental') {
      // Rental income comes from the house
      total += s.house && s.house.isRentedOut ? s.house.rentalIncomeMonthly * 12 : 0
      continue
    }
    const halfYearsActive = s.sideHustleHalfYearsActive[h.id] ?? 0
    const yearsActive     = halfYearsActive / 2
    if (h.growthYears > 0) {
      // Content creator: starts at annualIncome, doubles each year up to growthYears
      const multiplier = Math.min(Math.pow(2, Math.floor(yearsActive)), 4)
      total += h.annualIncome * multiplier
    } else {
      total += h.annualIncome
    }
  }
  return total
}

export function getAnnualFlow(s: GameState): {
  salaryYr:       number
  hustleYr:       number
  rentYr:         number
  expensesYr:     number
  tuitionYr:      number
  mortgageYr:     number
  loanInterestYr: number
  netYr:          number
} {
  const effectiveSalary = s.salary * s.salaryMultiplier
  const salaryYr        = effectiveSalary
  const hustleYr        = getSideHustleAnnualIncome(s)
  const apartmentRent   = s.house?.movedIn ? 0 : (s.rent + s.rentExtra) * 12  // cancelled if moved in
  const rentYr          = apartmentRent
  const expensesYr      = (s.monthlyExpenses + s.expensesExtra) * 12
  const tuitionYr       = s.tuitionRemaining > 0 ? Math.min(s.tuitionRemaining, 1000) : 0
  const mortgageYr      = s.house && s.house.mortgageMonthsPaid < s.house.mortgageTotalMonths
    ? s.house.monthlyPayment * 12
    : 0
  const loanInterestYr  = s.loanDebt > 0 ? s.loanDebt * 0.18 : 0
  const netYr           = salaryYr + hustleYr - rentYr - expensesYr - tuitionYr - mortgageYr - loanInterestYr
  return { salaryYr, hustleYr, rentYr, expensesYr, tuitionYr, mortgageYr, loanInterestYr, netYr }
}
