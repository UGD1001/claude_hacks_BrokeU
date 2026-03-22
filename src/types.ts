export type Screen = 'menu' | 'goalselect' | 'game' | 'victory' | 'gameover'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface Goal {
  id: string
  icon: string
  name: string
  amount: number
  duration: number
  difficulty: Difficulty
}

export type IncomeSourceId =
  | 'dayjob'
  | 'hustle'
  | 'hysa'
  | 'index'
  | 'dividend'
  | 'digital'
  | 'crypto'
  | 'biz'
  | 'rental'

export type RiskLevel = 'safe' | 'medium' | 'high' | 'extreme'

export interface IncomeSource {
  id: IncomeSourceId
  icon: string
  name: string
  ratePerSec: number
  variance: number
  riskLevel: RiskLevel
  unlockNetWorth: number
  setupCost: number
  isInvestment: boolean
  investRatePerMin?: number
}

export interface Bill {
  id: string
  name: string
  amount: number
  intervalSec: number
}

export interface EventChoice {
  key: string
  label: string
  cost?: number
  debt?: number
  sellInvestment?: IncomeSourceId
  sellAmount?: number
  sellAll?: boolean
  nothing?: boolean
  buyDip?: boolean
  upgradeJob?: boolean
  lend?: number
  gamble?: number
  bonus?: number
  investBonus?: boolean
  boostHustle?: number
  duration?: number
  futureDebt?: number
  stressChange: number
  outcomeClass: 'good' | 'neutral' | 'bad'
  outcome: string
}

export interface GameEvent {
  id: string
  icon: string
  title: string
  desc?: string
  choices: EventChoice[]
}

export interface BillToastItem {
  id: string
  name: string
  amount: number
  ts: number
}

export interface AchievementToastItem {
  id: string
  text: string
  ts: number
}

export interface GameState {
  screen: Screen
  selectedGoal: Goal | null
  cash: number
  stress: number
  gpa: number
  knowledge: number
  activeIncomeSources: IncomeSourceId[]
  purchasedSources: IncomeSourceId[]
  investments: Record<IncomeSourceId, number>
  debt: number
  debtInterestPerSec: number
  timeRemaining: number
  gameTick: number
  nextEventIn: number
  activeEvent: GameEvent | null
  eventCountdown: number
  hustleBoost: number
  hustleBoostRemaining: number
  jobUpgraded: boolean
  lentMoney: number
  lentReturnIn: number
  billToasts: BillToastItem[]
  achievementToasts: AchievementToastItem[]
  achievementsUnlocked: string[]
  gameOverReason: string
  cryptoLastEvent: number
  indexLastCrash: number
  pendingDebt: number
  pendingDebtIn: number
}
