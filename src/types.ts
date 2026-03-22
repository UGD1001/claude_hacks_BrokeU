export type Screen = 'menu' | 'setup' | 'game' | 'endgame'
export type GameMode = 'standard' | 'sprint'
export type MarketCondition = 'bull' | 'bear' | 'neutral'

// Real stock tickers
export type StockId   = 'AAPL' | 'MSFT' | 'KO' | 'WMT' | 'JNJ' | 'XOM'
export type CryptoId  = 'BTGD' | 'SMTC' | 'FSTC' | 'MMTK'
export type SideHustleId = 'freelance' | 'store' | 'content' | 'digital' | 'rental'
export type CoreInvestmentId = 'bank' | 'index' | 'cryptoBasket'

export type HouseType = 'starter' | 'suburban' | 'upscale'
export type MortgageTerm = 10 | 15 | 20

export interface HouseOption {
  type: HouseType
  label: string           // "Starter Home", "Suburban Home", "Upscale Home"
  neighbourhood: string   // flavour label
  price: number
  appreciationRate: number  // annual, e.g. 0.04
  rentalIncomeMonthly: number
}

export interface House {
  type: HouseType
  purchasePrice: number
  currentValue: number
  appreciationRate: number          // e.g. 0.04 per year

  // Mortgage
  downPayment: number
  mortgageBalance: number           // remaining principal
  mortgageRate: number              // annual, e.g. 0.045
  mortgageTotalMonths: number       // 120 | 180 | 240
  mortgageMonthsPaid: number
  monthlyPayment: number            // fixed payment

  // Occupancy
  movedIn: boolean                  // true → rent cancelled, cannot rent out
  isRentedOut: boolean              // true → earns rental income
  rentalIncomeMonthly: number
}

export interface EventChoice {
  key: string
  label: string
  outcome: string
  outcomeClass: 'good' | 'neutral' | 'bad'
  cashChange?: number
  addDebt?: number
  investInIndex?: number
  sellAllInvestments?: boolean
  sellIndexAmount?: number
  lend?: number
  gamble?: number
  salaryMultiplier?: number
  rentHikeMonthly?: number
  expenseAddMonthly?: number
  loseHalfYearIncome?: boolean
  // House repair choices
  payRepair?: number
  houseRepairDebt?: number
  // Neighbourhood modifier (annual appreciation delta for N years)
  houseAppreciationMod?: { delta: number; years: number }
}

export interface GameEvent {
  id: string
  icon: string
  title: string
  desc?: string
  choices: EventChoice[]
}

export interface AchievementToastItem {
  id: string
  text: string
  ts: number
}

export interface YearSnapshot {
  year: number
  playerNW: number
  compNW: number
}

// ── Computer AI state (house) ────────────────────────────────────────────────
export interface CompHouse {
  purchasePrice: number
  currentValue: number
  mortgageBalance: number
  mortgageRate: number
  monthlyPayment: number
  mortgageMonthsPaid: number
  mortgageTotalMonths: number
  appreciationRate: number
}

export interface GameState {
  screen: Screen

  // Player profile
  playerName: string
  salary: number          // annual
  rent: number            // monthly apartment rent
  monthlyExpenses: number
  tuitionDebt: number     // starting total

  // ── Mode ─────────────────────────────────────────────────────────────────────
  gameMode: GameMode   // 'standard' = 20yr full sim | 'sprint' = first to car wins, 10 min max

  // ── Timing ──────────────────────────────────────────────────────────────────
  // Game runs on half-year ticks: 1 half-year = 30 real seconds
  // 1 full year = 2 half-year ticks = 60 real seconds → 20 years = 20 min
  year: number                    // 1–20  (advances every 2 half-year ticks)
  halfYearsElapsed: number        // 0–39  (absolute counter)
  timeToNextHalfYear: number      // real seconds until next half-year tick
  timeToNextMonthlyUpdate: number // seconds until monthly stock price update (5s)
  isPaused: boolean

  // ── Market conditions ────────────────────────────────────────────────────────
  marketCondition: MarketCondition          // bull / bear / neutral
  marketConditionYearsLeft: number          // years remaining in current condition

  // ── Cash ────────────────────────────────────────────────────────────────────
  cash: number

  // ── Debts ───────────────────────────────────────────────────────────────────
  loanDebt: number
  tuitionRemaining: number

  // ── Core investments ─────────────────────────────────────────────────────────
  bankValue: number
  indexValue: number
  cryptoBasketValue: number   // replaces cryptoPoolValue (unlocked yr 10)

  // ── Individual stocks ────────────────────────────────────────────────────────
  stockHeld: Record<StockId, number>
  stockPrices: Record<StockId, number>
  stockSparklines: Record<StockId, number[]>

  // ── Individual cryptos ───────────────────────────────────────────────────────
  cryptoHeld: Record<CryptoId, number>
  cryptoPrices: Record<CryptoId, number>
  cryptoSparklines: Record<CryptoId, number[]>

  // ── Car ──────────────────────────────────────────────────────────────────────
  carOwned: boolean
  carValue: number

  // ── House ────────────────────────────────────────────────────────────────────
  house: House | null
  houseOptions: HouseOption[] | null   // non-null when house-offer event fires
  showHouseOffer: boolean
  showHouseMoveModal: boolean
  // Appreciation modifiers from neighbourhood events (years remaining)
  houseAppreciationMod: { delta: number; yearsLeft: number } | null

  // ── Phase ────────────────────────────────────────────────────────────────────
  phase: 'car' | 'networth'
  showCarModal: boolean
  carModalShown: boolean

  // ── Side hustles (auto-activated by random events) ───────────────────────────
  activeSideHustles: SideHustleId[]
  sideHustleHalfYearsActive: Partial<Record<SideHustleId, number>>

  // ── Permanent modifiers ──────────────────────────────────────────────────────
  salaryMultiplier: number
  rentExtra: number       // added to monthly apartment rent
  expensesExtra: number

  // ── Lent money ───────────────────────────────────────────────────────────────
  lentMoney: number
  lentReturnHalfYear: number   // absolute half-year when money returns

  // ── Computer opponent ────────────────────────────────────────────────────────
  compCash: number
  compIndexValue: number
  compCarOwned: boolean
  compCarValue: number
  compTuitionRemaining: number
  compSalaryMultiplier: number  // grows at same base rate as player (2%/yr), unaffected by events
  compHouse: CompHouse | null
  compHouseBought: boolean   // flag so it buys once

  // ── History ──────────────────────────────────────────────────────────────────
  snapshots: YearSnapshot[]

  // ── Events ───────────────────────────────────────────────────────────────────
  activeEvent: GameEvent | null
  nextEventHalfYear: number   // absolute half-year when next life event fires
  houseEventFired: boolean    // "found a property" event fires once

  // ── Toasts & achievements ────────────────────────────────────────────────────
  achievementToasts: AchievementToastItem[]
  achievementsUnlocked: string[]

  // ── End state ────────────────────────────────────────────────────────────────
  // ── Historical data era ───────────────────────────────────────────────────────
  gameStartDate: string  // e.g. "1999-01" — determines which real-world era is played

  // ── End state ────────────────────────────────────────────────────────────────
  gameOverReason: string
  playerWon: boolean
}
