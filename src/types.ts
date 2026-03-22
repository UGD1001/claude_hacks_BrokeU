export type Screen = 'menu' | 'setup' | 'lobby' | 'game' | 'endgame'
export type MPRole = 'solo' | 'host' | 'client'

export interface RemotePlayer {
  id: string
  name: string
  netWorth: number
  carOwned: boolean
  year: number
  lastSeen: number
}

export type MPMsg =
  | { type: 'HOST_ANNOUNCE'; sessionId: string; hostId: string; hostName: string }
  | { type: 'PLAYER_JOIN'; sessionId: string; playerId: string; playerName: string }
  | { type: 'LOBBY_SYNC'; sessionId: string; players: { id: string; name: string }[] }
  | { type: 'PLAYER_STATE'; playerId: string; playerName: string; netWorth: number; carOwned: boolean; year: number }
  | { type: 'GAME_START'; sessionId: string; seed: number }
  | { type: 'TIMER_SYNC'; year: number; timeToNextYear: number }
  | { type: 'PLAYER_LEAVE'; playerId: string }

export type StockId = 'AAPL' | 'TSLA' | 'MSFT' | 'AMZN' | 'NVDA' | 'GOOG'
export type CryptoId = 'BTC' | 'ETH' | 'SOL' | 'DOGE'
export type SideHustleId = 'freelance' | 'store' | 'content' | 'digital' | 'rental'
export type CoreInvestmentId = 'bank' | 'index' | 'realEstate' | 'cryptoPool'

export interface EventChoice {
  key: string
  label: string
  outcome: string
  outcomeClass: 'good' | 'neutral' | 'bad'
  cashChange?: number        // direct cash delta
  addDebt?: number           // add to loan debt
  investInIndex?: number     // add amount to index fund
  sellAllInvestments?: boolean
  sellIndexAmount?: number   // sell specific amount from index
  lend?: number              // lend cash (returned in 3 years)
  gamble?: number            // gamble this amount
  salaryMultiplier?: number  // multiply salary permanently
  rentHikeMonthly?: number   // add to monthly rent permanently
  expenseAddMonthly?: number // add to monthly expenses permanently
  loseHalfYearIncome?: boolean
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

export interface GameState {
  screen: Screen

  // Player setup profile
  playerName: string
  salary: number          // annual
  rent: number            // monthly
  monthlyExpenses: number
  tuitionDebt: number     // starting total

  // Game time
  year: number            // 1–20
  timeToNextYear: number  // real seconds until next year tick
  gameTick: number
  isPaused: boolean

  // Cash
  cash: number

  // Debts
  loanDebt: number
  tuitionRemaining: number

  // Core investments ($)
  bankValue: number
  indexValue: number
  realEstateValue: number
  cryptoPoolValue: number

  // Stocks: shares held
  stockHeld: Record<StockId, number>
  stockPrices: Record<StockId, number>
  stockSparklines: Record<StockId, number[]>

  // Cryptos: units held (unlocked at year 10)
  cryptoHeld: Record<CryptoId, number>
  cryptoPrices: Record<CryptoId, number>
  cryptoSparklines: Record<CryptoId, number[]>

  // Car asset
  carOwned: boolean
  carValue: number

  // Phase
  phase: 'car' | 'networth'
  showCarModal: boolean
  carModalShown: boolean   // only show once

  // Side hustles
  activeSideHustles: SideHustleId[]
  sideHustleYearsActive: Partial<Record<SideHustleId, number>>

  // Permanent modifiers from events
  salaryMultiplier: number
  rentExtra: number
  expensesExtra: number

  // Lent money
  lentMoney: number
  lentReturnYear: number  // year it comes back

  // Computer opponent
  compCash: number
  compIndexValue: number
  compCarOwned: boolean
  compCarValue: number
  compTuitionRemaining: number

  // History (index = year - 1)
  snapshots: YearSnapshot[]

  // Active event
  activeEvent: GameEvent | null
  nextEventYear: number

  // Toasts & achievements
  achievementToasts: AchievementToastItem[]
  achievementsUnlocked: string[]
  codexUnlocked: string[]

  // End game reason (for endgame screen)
  gameOverReason: string
  playerWon: boolean

  // Multiplayer
  mpRole: MPRole
  mpSessionId: string
  mpPlayerId: string
  mpSessionSeed: number
  remotePlayers: RemotePlayer[]
}
