import { useEffect } from 'react'
import type { GameState, StockId, CryptoId, EventChoice } from '../types'
import {
  TOTAL_YEARS, YEAR_SEC, CAR_GOAL,
  STOCK_IDS, CRYPTO_IDS,
  MARKET_PARAMS, LIFE_EVENTS, ACHIEVEMENTS,
  SIDE_HUSTLES, CODEX_ENTRIES,
  calcNetWorth, calcCompNetWorth, getSideHustleAnnualIncome,
  COMP_SALARY, COMP_RENT, COMP_EXPENSES,
} from '../gameData'

const TICK_MS  = 250
const TICK_SEC = TICK_MS / 1000
const PRICE_UPDATE_INTERVAL = 8

type MarketEvent = 'normal' | 'crash' | 'boom' | 'cryptosurge'

function rolledReturn(base: number, variance: number, event: MarketEvent): number {
  let r = base + (Math.random() * 2 - 1) * variance
  if (event === 'crash') r = Math.min(r, -0.18 + Math.random() * 0.05)
  if (event === 'boom')  r = Math.max(r,  0.14 + Math.random() * 0.06)
  return r
}

function rollMarketEvent(year: number): MarketEvent {
  const roll = Math.random()
  if (roll < 0.05) return 'crash'
  if (roll < 0.10) return 'boom'
  if (year >= 10 && roll < 0.15) return 'cryptosurge'
  return 'normal'
}

function pushToast(s: GameState, text: string) {
  s.achievementToasts = [
    ...s.achievementToasts,
    { id: `${Date.now()}-${Math.random()}`, text, ts: Date.now() },
  ]
}

function fmtN(n: number) { return Math.floor(Math.abs(n)).toLocaleString('en-US') }

function applyMicroPriceUpdate(prev: GameState): GameState {
  const s: GameState = {
    ...prev,
    stockPrices:      { ...prev.stockPrices },
    stockSparklines:  { ...prev.stockSparklines } as Record<StockId, number[]>,
    cryptoPrices:     { ...prev.cryptoPrices },
    cryptoSparklines: { ...prev.cryptoSparklines } as Record<CryptoId, number[]>,
  }
  for (const id of STOCK_IDS) {
    s.stockPrices[id] = Math.max(1, s.stockPrices[id] * (1 + (Math.random()-0.5)*0.01))
    const spark = [...s.stockSparklines[id]]; spark.shift(); spark.push(s.stockPrices[id])
    s.stockSparklines[id] = spark
  }
  for (const id of CRYPTO_IDS) {
    s.cryptoPrices[id] = Math.max(0.001, s.cryptoPrices[id] * (1 + (Math.random()-0.5)*0.04))
    const spark = [...s.cryptoSparklines[id]]; spark.shift(); spark.push(s.cryptoPrices[id])
    s.cryptoSparklines[id] = spark
  }
  return s
}

function pickEvent(year: number, s: GameState) {
  const hasInvestments = s.indexValue + s.bankValue + s.realEstateValue > 500
  const pool = LIFE_EVENTS.filter(e => {
    if (e.id === 'crypto_unlock' || e.id === 'crypto_surge') return false
    if (e.id === 'rent_hike'     && s.rentExtra > 600)       return false
    if (e.id === 'car_breakdown' && !s.carOwned)              return false
    if (e.id === 'market_crash'  && !hasInvestments)          return false
    if (e.id === 'new_baby'      && year > 15)                return false
    return true
  })
  if (pool.length === 0) return LIFE_EVENTS.find(e => e.id === 'tax_refund')!
  return pool[Math.floor(Math.random() * pool.length)]
}

function applyYearTick(prev: GameState): GameState {
  const s: GameState = {
    ...prev,
    stockHeld:         { ...prev.stockHeld },
    stockPrices:       { ...prev.stockPrices },
    stockSparklines:   { ...prev.stockSparklines } as Record<StockId, number[]>,
    cryptoHeld:        { ...prev.cryptoHeld },
    cryptoPrices:      { ...prev.cryptoPrices },
    cryptoSparklines:  { ...prev.cryptoSparklines } as Record<CryptoId, number[]>,
    activeSideHustles: [...prev.activeSideHustles],
    sideHustleYearsActive: { ...prev.sideHustleYearsActive },
    achievementToasts: [...prev.achievementToasts],
    achievementsUnlocked: [...prev.achievementsUnlocked],
    codexUnlocked:     [...prev.codexUnlocked],
    snapshots:         [...prev.snapshots],
  }

  const year = s.year
  const marketEvent = rollMarketEvent(year)

  // 1. Investment returns
  if (s.bankValue > 0)
    s.bankValue *= 1 + rolledReturn(MARKET_PARAMS.bank.base, MARKET_PARAMS.bank.variance, 'normal')
  if (s.indexValue > 0)
    s.indexValue *= 1 + rolledReturn(MARKET_PARAMS.index.base, MARKET_PARAMS.index.variance, marketEvent)
  if (s.realEstateValue > 0)
    s.realEstateValue *= 1 + rolledReturn(MARKET_PARAMS.realEstate.base, MARKET_PARAMS.realEstate.variance, marketEvent === 'crash' ? 'crash' : 'normal')
  if (year >= 10 && s.cryptoPoolValue > 0)
    s.cryptoPoolValue *= 1 + rolledReturn(MARKET_PARAMS.cryptoPool.base, MARKET_PARAMS.cryptoPool.variance, marketEvent === 'cryptosurge' ? 'boom' : marketEvent)

  // 2. Stock prices
  for (const id of STOCK_IDS) {
    const ret = rolledReturn(MARKET_PARAMS.stocks.base, MARKET_PARAMS.stocks.variance, marketEvent === 'cryptosurge' ? 'normal' : marketEvent)
    s.stockPrices[id] = Math.max(1, s.stockPrices[id] * (1 + ret))
    s.stockSparklines = { ...s.stockSparklines, [id]: [...s.stockSparklines[id].slice(1), s.stockPrices[id]] }
  }

  // 3. Crypto prices
  for (const id of CRYPTO_IDS) {
    const ret = rolledReturn(MARKET_PARAMS.crypto.base, MARKET_PARAMS.crypto.variance, marketEvent === 'cryptosurge' ? 'boom' : marketEvent)
    s.cryptoPrices[id] = Math.max(0.001, s.cryptoPrices[id] * (1 + ret))
    s.cryptoSparklines = { ...s.cryptoSparklines, [id]: [...s.cryptoSparklines[id].slice(1), s.cryptoPrices[id]] }
  }

  // 4. Annual income & expenses
  const hustleIncome   = getSideHustleAnnualIncome(s)
  const annualSalary   = s.salary * s.salaryMultiplier
  const annualRent     = (s.rent + s.rentExtra) * 12
  const annualExpenses = (s.monthlyExpenses + s.expensesExtra) * 12
  const tuitionPayment = Math.min(s.tuitionRemaining, 1000)
  const loanInterest   = s.loanDebt * 0.18

  s.cash += annualSalary + hustleIncome - annualRent - annualExpenses - tuitionPayment - loanInterest
  s.tuitionRemaining = Math.max(0, s.tuitionRemaining - tuitionPayment)

  // 5. Car depreciation
  if (s.carOwned) s.carValue *= 0.9

  // 6. Lent money return
  if (s.lentMoney > 0 && year >= s.lentReturnYear) {
    s.cash += s.lentMoney
    pushToast(s, `💸 Friend returned $${fmtN(s.lentMoney)}!`)
    s.lentMoney = 0; s.lentReturnYear = 0
  }

  // 7. Side hustle year increment
  for (const id of s.activeSideHustles) {
    s.sideHustleYearsActive[id] = (s.sideHustleYearsActive[id] ?? 0) + 1
  }

  // 8. Computer AI
  const compTuitionPmt = Math.min(s.compTuitionRemaining, 1000)
  const compSurplus    = COMP_SALARY - COMP_RENT * 12 - COMP_EXPENSES * 12 - compTuitionPmt
  s.compTuitionRemaining = Math.max(0, s.compTuitionRemaining - compTuitionPmt)
  s.compCash += compSurplus
  s.compIndexValue *= 1 + rolledReturn(MARKET_PARAMS.index.base, MARKET_PARAMS.index.variance, marketEvent)
  if (s.compCash > 2000) { s.compIndexValue += s.compCash - 2000; s.compCash = 2000 }
  if (s.compCarOwned) s.compCarValue *= 0.9
  if (!s.compCarOwned && calcCompNetWorth(s) >= CAR_GOAL) {
    if (s.compCash >= CAR_GOAL) {
      s.compCarOwned = true; s.compCarValue = CAR_GOAL; s.compCash -= CAR_GOAL
    } else {
      const needed = CAR_GOAL - s.compCash
      if (s.compIndexValue >= needed) {
        s.compIndexValue -= needed; s.compCarOwned = true; s.compCarValue = CAR_GOAL; s.compCash = 0
      }
    }
  }

  // 9. Snapshot
  const playerNW = calcNetWorth(s)
  const compNW   = calcCompNetWorth(s)
  s.snapshots = [...s.snapshots, { year, playerNW, compNW }]

  // 10. Codex unlocks
  const defaultUnlocks = CODEX_ENTRIES.filter(e => e.defaultUnlocked && !s.codexUnlocked.includes(e.id)).map(e => e.id)
  if (defaultUnlocks.length) s.codexUnlocked = [...s.codexUnlocked, ...defaultUnlocks]

  const unlockCodex = (id: string) => { if (!s.codexUnlocked.includes(id)) s.codexUnlocked = [...s.codexUnlocked, id] }
  if (s.indexValue > 0) unlockCodex('index_fund')
  if (s.loanDebt > 0) { unlockCodex('debt_interest'); unlockCodex('debt_snowball') }
  if (year >= 5)  unlockCodex('diversification')
  if (year >= 3)  unlockCodex('dollar_cost_avg')
  if (s.realEstateValue > 0) unlockCodex('real_estate')
  if (STOCK_IDS.some(id => s.stockHeld[id] > 0)) unlockCodex('stock_market')
  if (year >= 10) { unlockCodex('crypto'); unlockCodex('asset_allocation') }
  if (s.carOwned) unlockCodex('car_depreciation')
  if (s.activeSideHustles.length > 0) unlockCodex('side_hustle')
  if (year >= 6)  { unlockCodex('opportunity_cost'); unlockCodex('inflation'); unlockCodex('liquidity') }
  if (year >= 8)  unlockCodex('market_timing')
  if (year >= 12) unlockCodex('lifestyle_creep')
  if (year >= 15) unlockCodex('fin_literacy')
  if (year >= 4)  unlockCodex('passive_income')
  if (year >= 2)  unlockCodex('salary_nego')
  if (year >= 9)  unlockCodex('risk_reward')

  // 11. Achievements
  for (const ach of ACHIEVEMENTS) {
    if (!s.achievementsUnlocked.includes(ach.id) && playerNW >= ach.threshold) {
      s.achievementsUnlocked = [...s.achievementsUnlocked, ach.id]
      pushToast(s, ach.text)
    }
  }

  // 12. Market event toasts
  if (marketEvent === 'crash')       pushToast(s, '📉 MARKET CRASH THIS YEAR! PORTFOLIOS HIT.')
  if (marketEvent === 'boom')        pushToast(s, '🚀 BULL RUN! MARKET UP BIG THIS YEAR.')
  if (marketEvent === 'cryptosurge') pushToast(s, '🪙 CRYPTO SURGE! WILD YEAR IN CRYPTO.')

  // 13. Life event firing
  if (year >= s.nextEventYear && !s.activeEvent) {
    s.activeEvent   = pickEvent(year, s)
    s.isPaused      = true
    s.nextEventYear = year + 2 + Math.floor(Math.random() * 2)
  }
  if (year === 9 && !s.achievementsUnlocked.includes('crypto_unlocked')) {
    s.achievementsUnlocked = [...s.achievementsUnlocked, 'crypto_unlocked']
    s.activeEvent = LIFE_EVENTS.find(e => e.id === 'crypto_unlock') ?? s.activeEvent
    s.isPaused = true
  }

  // 14. Car modal
  if (!s.carModalShown && playerNW >= CAR_GOAL && s.phase === 'car') {
    s.showCarModal = true; s.carModalShown = true; s.isPaused = true
  }

  // 15. End checks
  const newYear      = year + 1
  const liquidAssets = s.cash + s.bankValue + s.indexValue

  if (s.cash < -5000 || (s.cash < 0 && liquidAssets < 500)) {
    return { ...s, screen: 'endgame', gameOverReason: 'You went bankrupt.', playerWon: false }
  }
  if (newYear > TOTAL_YEARS) {
    return { ...s, year: newYear, screen: 'endgame', gameOverReason: '', playerWon: calcNetWorth(s) > calcCompNetWorth(s) }
  }

  return { ...s, year: newYear }
}

export function useGameLoop(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  useEffect(() => {
    if (gameState.screen !== 'game') return

    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.screen !== 'game') return prev

        let s = { ...prev }
        s.gameTick += 1

        if (!s.isPaused) s.timeToNextYear -= TICK_SEC

        const now = Date.now()
        s.achievementToasts = s.achievementToasts.filter(t => now - t.ts < 4000)

        if (!s.isPaused && s.gameTick % PRICE_UPDATE_INTERVAL === 0) {
          s = applyMicroPriceUpdate(s)
        }

        if (!s.isPaused && s.timeToNextYear <= 0) {
          s = applyYearTick(s)
          if (s.screen === 'game') s.timeToNextYear = YEAR_SEC
        }

        return s
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [gameState.screen, setGameState])
}

export function applyEventChoice(prev: GameState, choice: EventChoice): GameState {
  const s: GameState = {
    ...prev,
    stockHeld:         { ...prev.stockHeld },
    cryptoHeld:        { ...prev.cryptoHeld },
    achievementToasts: [...prev.achievementToasts],
  }

  if (choice.cashChange !== undefined) s.cash += choice.cashChange
  if (choice.addDebt    !== undefined) s.loanDebt += choice.addDebt
  if (choice.investInIndex !== undefined) s.indexValue += choice.investInIndex

  if (choice.sellAllInvestments) {
    let total = s.bankValue + s.indexValue + s.realEstateValue + s.cryptoPoolValue
    for (const id of STOCK_IDS)  { total += (s.stockHeld[id]  ?? 0) * s.stockPrices[id];  s.stockHeld[id]  = 0 }
    for (const id of CRYPTO_IDS) { total += (s.cryptoHeld[id] ?? 0) * s.cryptoPrices[id]; s.cryptoHeld[id] = 0 }
    s.bankValue = 0; s.indexValue = 0; s.realEstateValue = 0; s.cryptoPoolValue = 0
    s.cash += total * 0.80
  }

  if (choice.sellIndexAmount !== undefined) {
    const sell = Math.min(choice.sellIndexAmount, s.indexValue)
    s.indexValue -= sell; s.cash += sell
  }

  if (choice.lend !== undefined) {
    const amt = Math.min(choice.lend, Math.max(0, s.cash))
    s.cash -= amt; s.lentMoney = amt; s.lentReturnYear = s.year + 3
  }

  if (choice.gamble !== undefined) {
    const bet = Math.min(choice.gamble, Math.max(0, s.cash))
    s.cash -= bet
    if (Math.random() < 0.30) {
      s.cash += bet * 10
      s.achievementToasts = [...s.achievementToasts, { id:`gw-${Date.now()}`, text:`🎰 YOU WON! +$${Math.floor(bet*10).toLocaleString()}`, ts:Date.now() }]
    } else {
      s.cash += bet * 0.20
      s.achievementToasts = [...s.achievementToasts, { id:`gl-${Date.now()}`, text:`💀 LOST $${Math.floor(bet*0.80).toLocaleString()} GAMBLING`, ts:Date.now() }]
    }
  }

  if (choice.salaryMultiplier   !== undefined) s.salaryMultiplier   *= choice.salaryMultiplier
  if (choice.rentHikeMonthly    !== undefined) s.rentExtra          += choice.rentHikeMonthly
  if (choice.expenseAddMonthly  !== undefined) s.expensesExtra      += choice.expenseAddMonthly
  if (choice.loseHalfYearIncome)               s.cash              -= (s.salary * s.salaryMultiplier) / 2

  s.activeEvent   = null
  s.showCarModal  = false
  s.isPaused      = false

  return s
}

// suppress unused import
void (SIDE_HUSTLES)
void (CAR_GOAL as unknown)
