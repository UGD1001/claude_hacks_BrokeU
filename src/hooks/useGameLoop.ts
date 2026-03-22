import { useEffect } from 'react'
import type { GameState, StockId, CryptoId, EventChoice, SideHustleId, House, MortgageTerm, MarketCondition } from '../types'
import {
  TOTAL_YEARS, HALF_YEAR_SEC, CAR_GOAL, SPRINT_HALF_YEARS,
  ANNUAL_SALARY_GROWTH, ANNUAL_EXPENSE_INFLATION,
  STOCK_IDS, CRYPTO_IDS,
  MARKET_PARAMS, LIFE_EVENTS, ACHIEVEMENTS, SIDE_HUSTLE_NOTIFICATIONS,
  HOUSE_OPTIONS, HOUSE_OFFER_CASH_THRESHOLD,
  computeMonthlyPayment, MORTGAGE_RATES,
  calcNetWorth, calcCompNetWorth, getSideHustleAnnualIncome,
  getCalendarDate, getRealPrice,
} from '../gameData'

const TICK_MS  = 250
const TICK_SEC = TICK_MS / 1000

// ── Market helpers ─────────────────────────────────────────────────────────────

type MarketEvent = 'normal' | 'crash' | 'boom' | 'cryptosurge'

function conditionMultiplier(condition: MarketCondition): number {
  if (condition === 'bull') return 1.55
  if (condition === 'bear') return 0.30
  return 1.0
}

function rolledReturn(base: number, variance: number, event: MarketEvent, condition: MarketCondition = 'neutral'): number {
  const cMod = conditionMultiplier(condition)
  let r = base * cMod + (Math.random() * 2 - 1) * variance
  if (event === 'crash') r = Math.min(r, -0.18 + Math.random() * 0.05)
  if (event === 'boom')  r = Math.max(r,  0.14 + Math.random() * 0.06)
  return r
}

function stepMarketCondition(s: GameState): void {
  const prev = s.marketCondition
  if (s.marketConditionYearsLeft > 0) {
    s.marketConditionYearsLeft -= 1
    return
  }
  const roll = Math.random()
  if (s.marketCondition === 'neutral') {
    if      (roll < 0.15) { s.marketCondition = 'bull'; s.marketConditionYearsLeft = 1 + Math.floor(Math.random() * 3) }
    else if (roll < 0.27) { s.marketCondition = 'bear'; s.marketConditionYearsLeft = 1 + Math.floor(Math.random() * 2) }
  } else if (s.marketCondition === 'bull') {
    if (roll < 0.35) { s.marketCondition = 'neutral'; s.marketConditionYearsLeft = 0 }
  } else {
    if (roll < 0.45) { s.marketCondition = 'neutral'; s.marketConditionYearsLeft = 0 }
  }
  if (s.marketCondition !== prev) {
    if (s.marketCondition === 'bull')    pushToast(s, '📈 Bull market! Strong returns expected.')
    else if (s.marketCondition === 'bear') pushToast(s, '📉 Bear market. Brace for rough returns.')
    else                                 pushToast(s, '↔️ Market normalising.')
  }
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

function fmt(n: number) {
  return Math.floor(Math.abs(n)).toLocaleString('en-US')
}

// ── Monthly stock price update (fires every 5 real seconds) ───────────────────

function applyMonthlyStockUpdate(prev: GameState): GameState {
  const s = {
    ...prev,
    stockPrices:      { ...prev.stockPrices },
    stockSparklines:  { ...prev.stockSparklines } as Record<StockId, number[]>,
    cryptoPrices:     { ...prev.cryptoPrices },
    cryptoSparklines: { ...prev.cryptoSparklines } as Record<CryptoId, number[]>,
  }

  const cond = s.marketCondition

  // Stocks: tiny cosmetic noise between half-year ticks (real prices snap at half-year boundary)
  for (const id of STOCK_IDS) {
    const noise = (Math.random() - 0.5) * 0.008  // ±0.4% visual flutter only
    s.stockPrices[id] = Math.max(0.01, s.stockPrices[id] * (1 + noise))
    s.stockSparklines = {
      ...s.stockSparklines,
      [id]: [...s.stockSparklines[id].slice(1), s.stockPrices[id]],
    }
  }

  // Cryptos: also update monthly when unlocked
  if (s.year >= 10) {
    for (const id of CRYPTO_IDS) {
      const ret = rolledReturn(MARKET_PARAMS.crypto.base / 12, MARKET_PARAMS.crypto.variance / 3, 'normal', cond)
      s.cryptoPrices[id] = Math.max(0.001, s.cryptoPrices[id] * (1 + ret))
      s.cryptoSparklines = {
        ...s.cryptoSparklines,
        [id]: [...s.cryptoSparklines[id].slice(1), s.cryptoPrices[id]],
      }
    }
  }

  return s
}

// ── Life event picker ─────────────────────────────────────────────────────────

function pickLifeEvent(year: number, s: GameState) {
  const hasInvestments = s.indexValue + s.bankValue > 500
  const hasCrypto = s.year >= 10 && (
    s.cryptoBasketValue + CRYPTO_IDS.reduce((a, id) => a + s.cryptoHeld[id] * s.cryptoPrices[id], 0) > 100
  )
  const hasHouse = s.house !== null

  const HOUSE_EVENT_IDS = ['house_repair', 'neighbourhood_improve', 'neighbourhood_decline', 'robbery', 'event_nearby', 'property_tax_break']

  const pool = LIFE_EVENTS.filter(e => {
    // Always excluded from random pool (fired by milestones)
    if (e.id === 'crypto_unlock')  return false
    if (e.id === 'crypto_surge' && !hasCrypto) return false
    if (e.id === 'rent_hike' && (s.house?.movedIn || s.rentExtra > 600)) return false
    if (e.id === 'job_layoff' && s.salary * s.salaryMultiplier < 20000) return false
    if (e.id === 'car_breakdown' && !s.carOwned) return false
    if (e.id === 'market_crash' && !hasInvestments) return false
    if (e.id === 'new_baby' && year > 15) return false
    // House events only if player owns a house
    if (HOUSE_EVENT_IDS.includes(e.id) && !hasHouse) return false
    // Non-house events only (don't cluster too many house events)
    return true
  })

  if (pool.length === 0) return LIFE_EVENTS.find(e => e.id === 'tax_refund')!
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Side hustle event picker (auto-fires, no player choice) ───────────────────

function maybeFireSideHustle(s: GameState): GameState {
  // All auto-hustles except rental
  const AUTO_HUSTLES: SideHustleId[] = ['freelance', 'store', 'content', 'digital']
  // Only fire if not already active and not already all active
  const remaining = AUTO_HUSTLES.filter(id => !s.activeSideHustles.includes(id))
  if (remaining.length === 0) return s

  // 15% chance per half-year that a new hustle activates
  if (Math.random() > 0.15) return s

  const newHustle = remaining[Math.floor(Math.random() * remaining.length)]
  const note = SIDE_HUSTLE_NOTIFICATIONS[newHustle]
  const ns = { ...s, activeSideHustles: [...s.activeSideHustles, newHustle] }
  if (note) pushToast(ns, `${note.icon} ${note.text}`)
  return ns
}

// ── Half-year tick (fires every 30 real seconds) ───────────────────────────────

function applyHalfYearTick(prev: GameState): GameState {
  const s: GameState = {
    ...prev,
    stockHeld:         { ...prev.stockHeld },
    stockPrices:       { ...prev.stockPrices },
    stockSparklines:   { ...prev.stockSparklines } as Record<StockId, number[]>,
    cryptoHeld:        { ...prev.cryptoHeld },
    cryptoPrices:      { ...prev.cryptoPrices },
    cryptoSparklines:  { ...prev.cryptoSparklines } as Record<CryptoId, number[]>,
    activeSideHustles: [...prev.activeSideHustles],
    sideHustleHalfYearsActive: { ...prev.sideHustleHalfYearsActive },
    achievementToasts:   [...prev.achievementToasts],
    achievementsUnlocked: [...prev.achievementsUnlocked],
    snapshots:           [...prev.snapshots],
  }

  const halfYear = s.halfYearsElapsed + 1  // after this tick
  s.halfYearsElapsed = halfYear
  const year = Math.ceil(halfYear / 2)     // 1–20
  const isNewYear = halfYear % 2 === 0     // true on 2nd half of each year

  const marketEvent = rollMarketEvent(year)

  const cond = s.marketCondition

  // ── 1. Half-year investment returns ───────────────────────────────────────
  // Bank: synthetic (risk-free savings rate)
  if (s.bankValue > 0)
    s.bankValue *= 1 + rolledReturn(MARKET_PARAMS.bank.base / 2, MARKET_PARAMS.bank.variance / 2, 'normal', 'neutral')

  // Real stock prices — snap to actual historical data at each half-year boundary
  {
    const currentDate = getCalendarDate(s.gameStartDate, halfYear)
    const prevDate    = getCalendarDate(s.gameStartDate, halfYear - 1)
    for (const id of STOCK_IDS) {
      const newPrice = getRealPrice(id, currentDate)
      if (newPrice !== null && newPrice > 0) {
        s.stockPrices[id] = newPrice
        s.stockSparklines[id] = [...s.stockSparklines[id].slice(1), newPrice]
      }
    }

    // Index fund: real SPY return; fallback to synthetic if SPY data missing
    const spyNew  = getRealPrice('SPY', currentDate)
    const spyPrev = getRealPrice('SPY', prevDate)
    if (spyNew !== null && spyPrev !== null && spyPrev > 0 && s.indexValue > 0) {
      const spyReturn = (spyNew - spyPrev) / spyPrev
      s.indexValue *= (1 + spyReturn)
    } else if (s.indexValue > 0) {
      s.indexValue *= 1 + rolledReturn(MARKET_PARAMS.index.base / 2, MARKET_PARAMS.index.variance / 2, marketEvent, cond)
    }
  }

  if (year >= 10 && s.cryptoBasketValue > 0)
    s.cryptoBasketValue *= 1 + rolledReturn(MARKET_PARAMS.cryptoBasket.base / 2, MARKET_PARAMS.cryptoBasket.variance / 2,
      marketEvent === 'cryptosurge' ? 'boom' : marketEvent, cond)

  // ── 2. Half-year income & expenses ───────────────────────────────────────
  const hustleIncome    = getSideHustleAnnualIncome(s) / 2  // half of annual
  const halfSalary      = (s.salary * s.salaryMultiplier) / 2
  const apartmentRent   = s.house?.movedIn ? 0 : (s.rent + s.rentExtra) * 6  // 6 months
  const halfExpenses    = (s.monthlyExpenses + s.expensesExtra) * 6
  const tuitionPmt      = s.tuitionRemaining > 0 ? Math.min(s.tuitionRemaining, 500) : 0  // $1k/yr → $500/half
  const loanInterest    = s.loanDebt > 0 ? s.loanDebt * 0.18 / 2 : 0

  // Mortgage payment (6 months)
  let mortgagePmt = 0
  if (s.house && s.house.mortgageMonthsPaid < s.house.mortgageTotalMonths) {
    mortgagePmt = s.house.monthlyPayment * 6
    const newPaid = Math.min(s.house.mortgageMonthsPaid + 6, s.house.mortgageTotalMonths)
    // Simple principal reduction (half-year interest portion)
    const halfYrInterest = s.house.mortgageBalance * s.house.mortgageRate / 2
    const principalPaid  = Math.min(mortgagePmt - halfYrInterest, s.house.mortgageBalance)
    s.house = {
      ...s.house,
      mortgageMonthsPaid: newPaid,
      mortgageBalance:    Math.max(0, s.house.mortgageBalance - principalPaid),
    }
    if (newPaid >= s.house.mortgageTotalMonths) {
      pushToast(s, '🏠 Mortgage paid off! No more monthly payments.')
    }
  }

  s.cash += halfSalary + hustleIncome - apartmentRent - halfExpenses - tuitionPmt - loanInterest - mortgagePmt
  s.tuitionRemaining = Math.max(0, s.tuitionRemaining - tuitionPmt)

  // ── 3. Side hustle half-year increment ───────────────────────────────────
  for (const id of s.activeSideHustles) {
    s.sideHustleHalfYearsActive[id] = (s.sideHustleHalfYearsActive[id] ?? 0) + 1
  }

  // ── 4. Maybe fire a side hustle event ────────────────────────────────────
  Object.assign(s, maybeFireSideHustle(s))

  // ── 5. Year-only actions (run once per year on 2nd half) ──────────────────
  if (isNewYear) {
    // Salary growth (+2%/yr automatic raises) — applied to both player and computer
    s.salaryMultiplier     *= (1 + ANNUAL_SALARY_GROWTH)
    s.compSalaryMultiplier *= (1 + ANNUAL_SALARY_GROWTH)

    // Expense inflation (+1.5%/yr)
    s.expensesExtra += s.monthlyExpenses * ANNUAL_EXPENSE_INFLATION

    // Market condition state machine
    stepMarketCondition(s)

    // Car depreciation
    if (s.carOwned) s.carValue *= 0.9

    // House appreciation
    if (s.house) {
      const baseRate = s.house.appreciationRate
      const modRate  = s.houseAppreciationMod ? s.houseAppreciationMod.delta : 0
      s.house = { ...s.house, currentValue: s.house.currentValue * (1 + baseRate + modRate) }

      // Decrement appreciation modifier
      if (s.houseAppreciationMod) {
        const yearsLeft = s.houseAppreciationMod.yearsLeft - 1
        s.houseAppreciationMod = yearsLeft > 0 ? { ...s.houseAppreciationMod, yearsLeft } : null
      }
    }

    // Lent money return
    if (s.lentMoney > 0 && halfYear >= s.lentReturnHalfYear) {
      s.cash += s.lentMoney
      pushToast(s, `💸 Friend returned $${fmt(s.lentMoney)}!`)
      s.lentMoney = 0
      s.lentReturnHalfYear = 0
    }

    // Snapshot
    const playerNW = calcNetWorth(s)
    const compNW   = calcCompNetWorth(s)
    s.snapshots = [...s.snapshots, { year, playerNW, compNW }]

    // Achievements
    for (const ach of ACHIEVEMENTS) {
      if (!s.achievementsUnlocked.includes(ach.id) && playerNW >= ach.threshold) {
        s.achievementsUnlocked = [...s.achievementsUnlocked, ach.id]
        pushToast(s, ach.text)
      }
    }

    // Market event toasts (once per year)
    if (marketEvent === 'crash')       pushToast(s, '📉 Market crash this year! Portfolios hit.')
    if (marketEvent === 'boom')        pushToast(s, '🚀 Bull run! Market up big this year.')
    if (marketEvent === 'cryptosurge') pushToast(s, '🪙 Crypto surge! Wild year in crypto.')
  }

  // ── 6. Computer AI (runs each half-year) ─────────────────────────────────
  const compTuitionPmt = s.compTuitionRemaining > 0 ? Math.min(s.compTuitionRemaining, 500) : 0
  const compMortgagePmt = (() => {
    if (!s.compHouse || s.compHouse.mortgageMonthsPaid >= s.compHouse.mortgageTotalMonths) return 0
    return s.compHouse.monthlyPayment * 6
  })()
  // Computer mirrors player's base salary/rent/expenses (same financial background)
  const compApartmentRent = s.compHouse ? 0 : s.rent * 6
  const compHalfSalary    = (s.salary * s.compSalaryMultiplier) / 2

  const compHalfSurplus = compHalfSalary
    - compApartmentRent
    - s.monthlyExpenses * 6
    - compTuitionPmt
    - compMortgagePmt

  s.compTuitionRemaining = Math.max(0, s.compTuitionRemaining - compTuitionPmt)
  s.compCash += compHalfSurplus

  // Index fund returns — same real SPY return as player (both face identical market)
  {
    const currentDate = getCalendarDate(s.gameStartDate, halfYear)
    const prevDate    = getCalendarDate(s.gameStartDate, halfYear - 1)
    const spyNew  = getRealPrice('SPY', currentDate)
    const spyPrev = getRealPrice('SPY', prevDate)
    if (spyNew !== null && spyPrev !== null && spyPrev > 0 && s.compIndexValue > 0) {
      s.compIndexValue *= (1 + (spyNew - spyPrev) / spyPrev)
    } else if (s.compIndexValue > 0) {
      s.compIndexValue *= 1 + rolledReturn(MARKET_PARAMS.index.base / 2, MARKET_PARAMS.index.variance / 2, marketEvent)
    }
  }

  // Surplus into index
  if (s.compCash > 2000) {
    s.compIndexValue += s.compCash - 2000
    s.compCash = 2000
  }

  // Computer house logic (buys when cash >= 1.5× 20% downpayment of starter)
  if (!s.compHouseBought && s.compCash >= HOUSE_OFFER_CASH_THRESHOLD) {
    const h = HOUSE_OPTIONS[0]  // always buys starter
    const down = h.price * 0.20
    const principal = h.price - down
    const term: MortgageTerm = 10
    const rate = MORTGAGE_RATES[term]
    const payment = computeMonthlyPayment(principal, rate, term)
    s.compCash -= down
    s.compHouse = {
      purchasePrice:       h.price,
      currentValue:        h.price,
      mortgageBalance:     principal,
      mortgageRate:        rate,
      monthlyPayment:      payment,
      mortgageMonthsPaid:  0,
      mortgageTotalMonths: term * 12,
      appreciationRate:    h.appreciationRate,
    }
    s.compHouseBought = true
    pushToast(s, '🤖 Computer bought a house!')
  }

  // Computer house appreciation (yearly)
  if (isNewYear && s.compHouse) {
    s.compHouse = {
      ...s.compHouse,
      currentValue: s.compHouse.currentValue * (1 + s.compHouse.appreciationRate),
    }
    // Mortgage progress
    if (s.compHouse.mortgageMonthsPaid < s.compHouse.mortgageTotalMonths) {
      const newPaid = Math.min(s.compHouse.mortgageMonthsPaid + 12, s.compHouse.mortgageTotalMonths)
      const yearInterest = s.compHouse.mortgageBalance * s.compHouse.mortgageRate
      const principalPaid = Math.min(s.compHouse.monthlyPayment * 12 - yearInterest, s.compHouse.mortgageBalance)
      s.compHouse = {
        ...s.compHouse,
        mortgageMonthsPaid: newPaid,
        mortgageBalance:    Math.max(0, s.compHouse.mortgageBalance - principalPaid),
      }
    }
  }

  // Computer car
  if (isNewYear && s.compCarOwned) s.compCarValue *= 0.9
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

  // ── 7. Crypto unlock milestone (at start of year 10) ─────────────────────
  if (year === 10 && !s.achievementsUnlocked.includes('crypto_unlocked') && !s.activeEvent) {
    s.achievementsUnlocked = [...s.achievementsUnlocked, 'crypto_unlocked']
    s.activeEvent = LIFE_EVENTS.find(e => e.id === 'crypto_unlock') ?? null
    s.isPaused = true
  }

  // ── 8. Life event firing ─────────────────────────────────────────────────
  if (!s.activeEvent && !s.isPaused && halfYear >= s.nextEventHalfYear) {
    s.activeEvent = pickLifeEvent(year, s)
    s.isPaused = true
    // Next event in 1–7 half-years from now
    s.nextEventHalfYear = halfYear + 1 + Math.floor(Math.random() * 7)
  }

  // ── 9. House offer event (suppressed in sprint mode — focus on car goal) ──
  if (s.gameMode !== 'sprint' && !s.houseEventFired && !s.activeEvent && !s.isPaused && s.cash >= HOUSE_OFFER_CASH_THRESHOLD) {
    s.houseEventFired = true
    s.houseOptions = HOUSE_OPTIONS
    s.showHouseOffer = true
    s.isPaused = true
  }

  // ── 10. Car modal ────────────────────────────────────────────────────────
  if (!s.carModalShown && !s.activeEvent && !s.showHouseOffer && calcNetWorth(s) >= CAR_GOAL && s.phase === 'car') {
    s.showCarModal = true
    s.carModalShown = true
    s.isPaused = true
  }

  // ── 11. Game over / end checks ───────────────────────────────────────────
  const liquidAssets = s.cash + s.bankValue + s.indexValue
  if (s.cash < -5000 || (s.cash < 0 && liquidAssets < 500)) {
    return { ...s, screen: 'endgame', gameOverReason: 'You ran out of money.', playerWon: false }
  }

  // Sprint mode: computer beats player to the car
  if (s.gameMode === 'sprint' && s.compCarOwned && !s.carOwned) {
    return {
      ...s, screen: 'endgame',
      gameOverReason: 'The computer bought the car first.',
      playerWon: false,
    }
  }

  // Sprint mode: timer expires (10 min max)
  if (s.gameMode === 'sprint' && halfYear >= SPRINT_HALF_YEARS) {
    return {
      ...s, year,
      screen: 'endgame',
      gameOverReason: 'Time up! Closest to the goal wins.',
      playerWon: calcNetWorth(s) >= calcCompNetWorth(s),
    }
  }

  // Standard mode: 20-year timer
  if (s.gameMode === 'standard' && year >= TOTAL_YEARS && isNewYear) {
    return {
      ...s,
      year: TOTAL_YEARS,
      screen: 'endgame',
      gameOverReason: '',
      playerWon: calcNetWorth(s) > calcCompNetWorth(s),
    }
  }

  // Update year counter
  s.year = year

  return s
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useGameLoop(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  useEffect(() => {
    if (gameState.screen !== 'game') return

    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.screen !== 'game') return prev

        let s = {
          ...prev,
          timeToNextHalfYear:     prev.timeToNextHalfYear,
          timeToNextMonthlyUpdate: prev.timeToNextMonthlyUpdate,
        }

        // Clean stale toasts
        const now = Date.now()
        s.achievementToasts = s.achievementToasts.filter(t => now - t.ts < 4000)

        if (!s.isPaused) {
          s.timeToNextHalfYear      -= TICK_SEC
          s.timeToNextMonthlyUpdate -= TICK_SEC
        }

        // Monthly stock update every 5 real seconds
        if (s.timeToNextMonthlyUpdate <= 0) {
          s = applyMonthlyStockUpdate(s)
          s.timeToNextMonthlyUpdate = 5
        }

        // Half-year tick every 30 real seconds
        if (!s.isPaused && s.timeToNextHalfYear <= 0) {
          s = applyHalfYearTick(s)
          if (s.screen === 'game') s.timeToNextHalfYear = HALF_YEAR_SEC
        }

        return s
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [gameState.screen, setGameState])
}

// ── Event choice applier ───────────────────────────────────────────────────────

export function applyEventChoice(prev: GameState, choice: EventChoice): GameState {
  const s: GameState = {
    ...prev,
    stockHeld:  { ...prev.stockHeld },
    cryptoHeld: { ...prev.cryptoHeld },
    achievementToasts: [...prev.achievementToasts],
  }

  if (choice.cashChange   !== undefined) s.cash      += choice.cashChange
  if (choice.addDebt      !== undefined) s.loanDebt  += choice.addDebt
  if (choice.investInIndex !== undefined) s.indexValue += choice.investInIndex

  if (choice.sellAllInvestments) {
    let total = s.bankValue + s.indexValue + s.cryptoBasketValue
    for (const id of STOCK_IDS)  { total += (s.stockHeld[id]  ?? 0) * s.stockPrices[id];  s.stockHeld[id]  = 0 }
    for (const id of CRYPTO_IDS) { total += (s.cryptoHeld[id] ?? 0) * s.cryptoPrices[id]; s.cryptoHeld[id] = 0 }
    s.bankValue = 0; s.indexValue = 0; s.cryptoBasketValue = 0
    s.cash += total * 0.80
  }

  if (choice.sellIndexAmount !== undefined) {
    const sell = Math.min(choice.sellIndexAmount, s.indexValue)
    s.indexValue -= sell
    s.cash += sell
  }

  if (choice.lend !== undefined) {
    const amt = Math.min(choice.lend, Math.max(0, s.cash))
    s.cash -= amt
    s.lentMoney = amt
    s.lentReturnHalfYear = s.halfYearsElapsed + 6  // ~3 years
  }

  if (choice.gamble !== undefined) {
    const bet = Math.min(choice.gamble, Math.max(0, s.cash))
    s.cash -= bet
    if (Math.random() < 0.30) {
      s.cash += bet * 10
      s.achievementToasts = [...s.achievementToasts, { id: `gw-${Date.now()}`, text: `🎰 You WON! +$${fmt(bet * 10)}`, ts: Date.now() }]
    } else {
      s.cash += bet * 0.20
      s.achievementToasts = [...s.achievementToasts, { id: `gl-${Date.now()}`, text: `💀 Lost $${fmt(bet * 0.80)} gambling`, ts: Date.now() }]
    }
  }

  if (choice.salaryMultiplier   !== undefined) s.salaryMultiplier *= choice.salaryMultiplier
  if (choice.rentHikeMonthly    !== undefined) s.rentExtra        += choice.rentHikeMonthly
  if (choice.expenseAddMonthly  !== undefined) s.expensesExtra    += choice.expenseAddMonthly
  if (choice.loseHalfYearIncome)               s.cash             -= (s.salary * s.salaryMultiplier) / 2

  // House repair choices
  if (choice.payRepair         !== undefined) s.cash     -= choice.payRepair
  if (choice.houseRepairDebt   !== undefined) s.loanDebt += choice.houseRepairDebt
  if (choice.houseAppreciationMod)            s.houseAppreciationMod = { delta: choice.houseAppreciationMod.delta, yearsLeft: choice.houseAppreciationMod.years }

  s.activeEvent  = null
  s.isPaused     = false

  return s
}

// ── House purchase applier ────────────────────────────────────────────────────

export function applyHousePurchase(
  prev: GameState,
  option: import('../types').HouseOption,
  downPct: number,
  termYears: MortgageTerm,
): GameState {
  const downPayment = option.price * downPct
  const principal   = option.price - downPayment
  const rate        = MORTGAGE_RATES[termYears]
  const payment     = computeMonthlyPayment(principal, rate, termYears)

  const house: House = {
    type:               option.type,
    purchasePrice:      option.price,
    currentValue:       option.price,
    appreciationRate:   option.appreciationRate,
    downPayment,
    mortgageBalance:    principal,
    mortgageRate:       rate,
    mortgageTotalMonths: termYears * 12,
    mortgageMonthsPaid: 0,
    monthlyPayment:     payment,
    movedIn:            false,
    isRentedOut:        false,
    rentalIncomeMonthly: option.rentalIncomeMonthly,
  }

  return {
    ...prev,
    cash:            prev.cash - downPayment,
    house,
    houseOptions:    null,
    showHouseOffer:  false,
    showHouseMoveModal: true,
    isPaused:        true,   // still paused for the move modal
  }
}

// ── House move-in / rent-out applier ─────────────────────────────────────────

export function applyHouseMoveIn(prev: GameState): GameState {
  if (!prev.house) return prev
  return {
    ...prev,
    house: { ...prev.house, movedIn: true, isRentedOut: false },
    showHouseMoveModal: false,
    isPaused: false,
  }
}

export function applyHouseRentOut(prev: GameState): GameState {
  if (!prev.house) return prev
  const ns = {
    ...prev,
    house: { ...prev.house, movedIn: false, isRentedOut: true },
    activeSideHustles: prev.activeSideHustles.includes('rental')
      ? prev.activeSideHustles
      : [...prev.activeSideHustles, 'rental' as SideHustleId],
    showHouseMoveModal: false,
    isPaused: false,
  }
  pushToast(ns, `🏠 House is rented out! +$${fmt(prev.house.rentalIncomeMonthly)}/mo income.`)
  return ns
}

