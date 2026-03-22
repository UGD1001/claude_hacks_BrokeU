export type Screen = 'menu' | 'setup' | 'game' | 'endgame'

export type StockId  = 'AAPL' | 'TSLA' | 'MSFT' | 'AMZN' | 'NVDA' | 'GOOG'
export type CryptoId = 'BTC'  | 'ETH'  | 'SOL'  | 'DOGE'
export type SideHustleId   = 'freelance' | 'store' | 'content' | 'digital' | 'rental'
export type CoreInvestmentId = 'bank' | 'index' | 'realEstate' | 'cryptoPool'

export interface EventChoice {
  key: string
  label: string
  outcome: string
  outcomeClass: 'good' | 'neutral' | 'bad'
  cashChange?:         number
  addDebt?:            number
  investInIndex?:      number
  sellAllInvestments?: boolean
  sellIndexAmount?:    number
  lend?:               number
  gamble?:             number
  salaryMultiplier?:   number
  rentHikeMonthly?:    number
  expenseAddMonthly?:  number
  loseHalfYearIncome?: boolean
}

export interface GameEvent {
  id:      string
  icon:    string
  title:   string
  desc?:   string
  choices: EventChoice[]
}

export interface AchievementToastItem {
  id:   string
  text: string
  ts:   number
}

export interface YearSnapshot {
  year:     number
  playerNW: number
  compNW:   number
}

export interface GameState {
  screen: Screen

  playerName:      string
  salary:          number
  rent:            number
  monthlyExpenses: number
  tuitionDebt:     number

  year:          number
  timeToNextYear: number
  gameTick:      number
  isPaused:      boolean

  cash: number

  loanDebt:         number
  tuitionRemaining: number

  bankValue:       number
  indexValue:      number
  realEstateValue: number
  cryptoPoolValue: number

  stockHeld:       Record<StockId,  number>
  stockPrices:     Record<StockId,  number>
  stockSparklines: Record<StockId,  number[]>

  cryptoHeld:       Record<CryptoId, number>
  cryptoPrices:     Record<CryptoId, number>
  cryptoSparklines: Record<CryptoId, number[]>

  carOwned: boolean
  carValue: number

  phase:        'car' | 'networth'
  showCarModal: boolean
  carModalShown: boolean

  activeSideHustles:    SideHustleId[]
  sideHustleYearsActive: Partial<Record<SideHustleId, number>>

  salaryMultiplier: number
  rentExtra:        number
  expensesExtra:    number

  lentMoney:      number
  lentReturnYear: number

  compCash:            number
  compIndexValue:      number
  compCarOwned:        boolean
  compCarValue:        number
  compTuitionRemaining: number

  snapshots: YearSnapshot[]

  activeEvent:   GameEvent | null
  nextEventYear: number

  achievementToasts:    AchievementToastItem[]
  achievementsUnlocked: string[]
  codexUnlocked:        string[]

  gameOverReason: string
  playerWon:      boolean
}
