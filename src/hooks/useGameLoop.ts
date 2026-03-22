import { useEffect, useRef } from 'react'
import type { GameState } from '../types'
import { INCOME_SOURCES, BILLS, LIFE_EVENTS, ACHIEVEMENTS } from '../gameData'
import type { IncomeSourceId, BillToastItem, AchievementToastItem } from '../types'

const TICK_MS = 250
const TICK_SEC = TICK_MS / 1000

export function useGameLoop(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  const stateRef = useRef(gameState)
  stateRef.current = gameState

  useEffect(() => {
    if (gameState.screen !== 'game') return

    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.screen !== 'game') return prev

        let state = { ...prev }
        state.investments = { ...prev.investments }
        state.billToasts = [...prev.billToasts]
        state.achievementToasts = [...prev.achievementToasts]
        state.achievementsUnlocked = [...prev.achievementsUnlocked]

        // 1. Advance time
        state.timeRemaining -= TICK_SEC
        state.gameTick += 1

        const tickNum = state.gameTick

        // 2. Income from active passive sources
        let incomeThisTick = 0
        for (const srcId of state.activeIncomeSources) {
          const src = INCOME_SOURCES.find(s => s.id === srcId)
          if (!src || src.isInvestment) continue

          let rate = src.ratePerSec
          if (srcId === 'hustle' && state.hustleBoost > 1 && state.hustleBoostRemaining > 0) {
            rate *= state.hustleBoost
          }
          if (srcId === 'dayjob' && state.jobUpgraded) {
            rate += 25
          }
          if (src.variance > 0) {
            rate += (Math.random() - 0.5) * src.variance
          }
          rate = Math.max(0, rate)
          incomeThisTick += rate * TICK_SEC
        }

        // 3. Investment growth (per tick)
        const investmentIds: IncomeSourceId[] = ['hysa', 'index', 'dividend', 'crypto']
        for (const id of investmentIds) {
          const val = state.investments[id] ?? 0
          if (val <= 0) continue
          const src = INCOME_SOURCES.find(s => s.id === id)
          if (!src?.investRatePerMin) continue
          // rate per minute → per tick
          const growthPerTick = (src.investRatePerMin / 60) * TICK_SEC * val
          state.investments[id] = val + growthPerTick
          incomeThisTick += 0 // investment growth goes into investment value, not cash
        }

        // 4. Crypto volatility every 30s
        const cryptoVal = state.investments['crypto'] ?? 0
        if (cryptoVal > 0) {
          const secondsElapsed = tickNum * TICK_SEC
          const prevSeconds = (tickNum - 1) * TICK_SEC
          if (Math.floor(secondsElapsed / 30) > Math.floor(prevSeconds / 30)) {
            const change = (Math.random() - 0.5) * 0.4 // ±20%
            state.investments['crypto'] = Math.max(0, cryptoVal * (1 + change))
          }
        }

        // 5. Index fund crash risk every 5 minutes (300s)
        const indexVal = state.investments['index'] ?? 0
        if (indexVal > 0) {
          const secondsElapsed = tickNum * TICK_SEC
          const prevSeconds = (tickNum - 1) * TICK_SEC
          if (Math.floor(secondsElapsed / 300) > Math.floor(prevSeconds / 300)) {
            if (Math.random() < 0.15) {
              state.investments['index'] = indexVal * 0.8
            }
          }
        }

        // 6. Bills
        for (const bill of BILLS) {
          const ticksPerInterval = bill.intervalSec * (1000 / TICK_MS)
          if (tickNum % Math.round(ticksPerInterval) === 0) {
            incomeThisTick -= bill.amount
            const toast: BillToastItem = {
              id: `${bill.id}-${Date.now()}`,
              name: bill.name,
              amount: bill.amount,
              ts: Date.now(),
            }
            state.billToasts = [...state.billToasts, toast]
          }
        }

        // 7. Debt interest
        if (state.debt > 0) {
          // 18% APR = 18%/365/24/3600 per second
          const annualRate = 0.18
          const perSec = (annualRate / (365 * 24 * 3600)) * state.debt
          incomeThisTick -= perSec * TICK_SEC
        }

        // Apply income
        state.cash += incomeThisTick

        // 8. Hustle boost countdown
        if (state.hustleBoostRemaining > 0) {
          state.hustleBoostRemaining -= TICK_SEC
          if (state.hustleBoostRemaining <= 0) {
            state.hustleBoost = 1
            state.hustleBoostRemaining = 0
          }
        }

        // 9. Lent money return
        if (state.lentMoney > 0 && state.lentReturnIn > 0) {
          state.lentReturnIn -= TICK_SEC
          if (state.lentReturnIn <= 0) {
            state.cash += state.lentMoney
            const ach: AchievementToastItem = {
              id: `lent-return-${Date.now()}`,
              text: `💸 Friend returned $${state.lentMoney.toLocaleString('en-US', { maximumFractionDigits: 0 })}!`,
              ts: Date.now(),
            }
            state.achievementToasts = [...state.achievementToasts, ach]
            state.lentMoney = 0
            state.lentReturnIn = 0
          }
        }

        // 10. Pending debt installments
        if (state.pendingDebt > 0 && state.pendingDebtIn > 0) {
          state.pendingDebtIn -= TICK_SEC
          if (state.pendingDebtIn <= 0) {
            state.cash -= state.pendingDebt
            state.pendingDebt = 0
            state.pendingDebtIn = 0
          }
        }

        // 11. Event system
        if (!state.activeEvent) {
          state.nextEventIn -= TICK_SEC
          if (state.nextEventIn <= 0) {
            const event = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)]
            state.activeEvent = event
            state.eventCountdown = 12
          }
        } else {
          state.eventCountdown -= TICK_SEC
          if (state.eventCountdown <= 0) {
            // Auto-select worst choice (last choice)
            const worstChoice = state.activeEvent.choices[state.activeEvent.choices.length - 1]
            // Apply a penalty for not choosing
            state.cash -= 500
            state.stress += 15
            state.activeEvent = null
            state.nextEventIn = 20 + Math.random() * 30
            void worstChoice // suppress unused warning
          }
        }

        // 12. Stress dynamics
        if (state.cash < 500) {
          state.stress = Math.min(100, state.stress + 0.05)
        } else if (state.cash > 5000) {
          state.stress = Math.max(0, state.stress - 0.02)
        }

        // 13. Net worth
        const investTotal = Object.values(state.investments).reduce((a, b) => a + b, 0)
        const netWorth = state.cash + investTotal - state.debt

        // 14. Achievements
        for (const ach of ACHIEVEMENTS) {
          if (!state.achievementsUnlocked.includes(ach.id) && netWorth >= ach.threshold) {
            state.achievementsUnlocked = [...state.achievementsUnlocked, ach.id]
            const toast: AchievementToastItem = {
              id: `${ach.id}-${Date.now()}`,
              text: ach.text,
              ts: Date.now(),
            }
            state.achievementToasts = [...state.achievementToasts, toast]
          }
        }

        // 15. Income source unlock notifications
        for (const src of INCOME_SOURCES) {
          if (
            !state.purchasedSources.includes(src.id) &&
            !state.activeIncomeSources.includes(src.id) &&
            src.unlockNetWorth > 0 &&
            netWorth >= src.unlockNetWorth &&
            !state.achievementsUnlocked.includes(`unlock-${src.id}`)
          ) {
            state.achievementsUnlocked = [...state.achievementsUnlocked, `unlock-${src.id}`]
            const toast: AchievementToastItem = {
              id: `unlock-${src.id}-${Date.now()}`,
              text: `🔓 ${src.icon} ${src.name} now available!`,
              ts: Date.now(),
            }
            state.achievementToasts = [...state.achievementToasts, toast]
          }
        }

        // 16. Clean stale toasts
        const now = Date.now()
        state.billToasts = state.billToasts.filter(t => now - t.ts < 2500)
        state.achievementToasts = state.achievementToasts.filter(t => now - t.ts < 3500)

        // 17. Win/Lose check
        if (state.selectedGoal && netWorth >= state.selectedGoal.amount) {
          return { ...state, screen: 'victory' as const }
        }
        if (state.timeRemaining <= 0) {
          return { ...state, screen: 'gameover' as const, gameOverReason: 'Time ran out!' }
        }
        if (state.cash < -2000) {
          return { ...state, screen: 'gameover' as const, gameOverReason: 'You went bankrupt!' }
        }

        return state
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [gameState.screen, setGameState])
}
