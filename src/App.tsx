import { useState, useCallback } from 'react'
import type { GameState, Goal, IncomeSourceId, EventChoice } from './types'
import { INCOME_SOURCES } from './gameData'
import { useGameLoop } from './hooks/useGameLoop'
import Nav from './components/Nav'
import MenuScreen from './components/MenuScreen'
import GoalSelectScreen from './components/GoalSelectScreen'
import GameScreen from './components/GameScreen'
import VictoryScreen from './components/VictoryScreen'
import GameOverScreen from './components/GameOverScreen'

function makeInitialState(): GameState {
  const investments: Record<string, number> = {}
  for (const src of INCOME_SOURCES) {
    investments[src.id] = 0
  }
  return {
    screen: 'menu',
    selectedGoal: null,
    cash: 300,
    stress: 30,
    gpa: 3.1,
    knowledge: 14,
    activeIncomeSources: ['dayjob', 'hustle'],
    purchasedSources: ['dayjob', 'hustle'],
    investments: investments as Record<IncomeSourceId, number>,
    debt: 0,
    debtInterestPerSec: 0,
    timeRemaining: 0,
    gameTick: 0,
    nextEventIn: 25,
    activeEvent: null,
    eventCountdown: 0,
    hustleBoost: 1,
    hustleBoostRemaining: 0,
    jobUpgraded: false,
    lentMoney: 0,
    lentReturnIn: 0,
    billToasts: [],
    achievementToasts: [],
    achievementsUnlocked: [],
    gameOverReason: '',
    cryptoLastEvent: 0,
    indexLastCrash: 0,
    pendingDebt: 0,
    pendingDebtIn: 0,
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(makeInitialState())

  useGameLoop(gameState, setGameState)

  const handleNewGame = useCallback(() => {
    setGameState(prev => ({ ...prev, screen: 'goalselect' }))
  }, [])

  const handleSelectGoal = useCallback((goal: Goal) => {
    setGameState(_prev => ({
      ...makeInitialState(),
      screen: 'game',
      selectedGoal: goal,
      timeRemaining: goal.duration,
      gameTick: 0,
      nextEventIn: 25,
    }))
  }, [])

  const handleToggleSource = useCallback((id: IncomeSourceId) => {
    setGameState(prev => {
      const isActive = prev.activeIncomeSources.includes(id)
      return {
        ...prev,
        activeIncomeSources: isActive
          ? prev.activeIncomeSources.filter(s => s !== id)
          : [...prev.activeIncomeSources, id],
      }
    })
  }, [])

  const handlePurchaseSource = useCallback((id: IncomeSourceId) => {
    const src = INCOME_SOURCES.find(s => s.id === id)
    if (!src) return
    setGameState(prev => {
      if (prev.cash < src.setupCost) return prev
      const newPurchased = [...prev.purchasedSources, id]
      const newActive = src.isInvestment
        ? prev.activeIncomeSources
        : [...prev.activeIncomeSources, id]
      return {
        ...prev,
        cash: prev.cash - src.setupCost,
        purchasedSources: newPurchased,
        activeIncomeSources: newActive,
      }
    })
  }, [])

  const handleInvest = useCallback((id: IncomeSourceId, amount: number) => {
    setGameState(prev => {
      const actual = Math.min(amount, Math.floor(prev.cash))
      if (actual < 100) return prev
      return {
        ...prev,
        cash: prev.cash - actual,
        investments: {
          ...prev.investments,
          [id]: (prev.investments[id] ?? 0) + actual,
        },
      }
    })
  }, [])

  const handleEventChoice = useCallback((choice: EventChoice) => {
    setGameState(prev => {
      let state = {
        ...prev,
        investments: { ...prev.investments },
        activeIncomeSources: [...prev.activeIncomeSources],
        achievementToasts: [...prev.achievementToasts],
      }

      // Apply stress
      state.stress = Math.max(0, Math.min(100, state.stress + choice.stressChange))

      // Cash cost
      if (choice.cost !== undefined) {
        state.cash += choice.cost
      }

      // Bonus cash
      if (choice.bonus !== undefined) {
        state.cash += choice.bonus
        if (choice.investBonus) {
          // Put bonus into HYSA if purchased, else just add to cash
          const hysa = state.purchasedSources.includes('hysa')
          if (hysa) {
            state.investments = {
              ...state.investments,
              hysa: (state.investments['hysa'] ?? 0) + choice.bonus,
            }
            state.cash -= choice.bonus // move to investment
          }
        }
      }

      // Debt
      if (choice.debt !== undefined) {
        state.debt = (state.debt || 0) + choice.debt
      }

      // Sell investment
      if (choice.sellInvestment && choice.sellAmount !== undefined) {
        const invId = choice.sellInvestment
        const currentVal = state.investments[invId] ?? 0
        const sellAmt = Math.min(choice.sellAmount, currentVal)
        state.investments = {
          ...state.investments,
          [invId]: currentVal - sellAmt,
        }
        state.cash += sellAmt
      }

      // Sell all investments
      if (choice.sellAll) {
        let total = 0
        const newInv = { ...state.investments }
        for (const k of Object.keys(newInv) as IncomeSourceId[]) {
          total += newInv[k] ?? 0
          newInv[k] = 0
        }
        state.investments = newInv
        state.cash += total * 0.8 // 20% loss from panic sell
      }

      // Buy the dip
      if (choice.buyDip && choice.cost !== undefined) {
        const amt = Math.abs(choice.cost)
        const invId: IncomeSourceId = 'index'
        if (state.purchasedSources.includes(invId)) {
          state.investments = {
            ...state.investments,
            [invId]: (state.investments[invId] ?? 0) + amt,
          }
        } else {
          // give to first purchased investment
          state.cash += amt
        }
      }

      // Upgrade job
      if (choice.upgradeJob) {
        state.jobUpgraded = true
        // During transition, pause day job for 60s by using boost mechanism
        // Actually implement as: job income pauses for 60s then +25/s permanently
        // We'll just apply upgrade immediately but user sees +25/s from now
      }

      // Lend money
      if (choice.lend !== undefined) {
        const lendAmt = Math.min(choice.lend, state.cash)
        state.cash -= lendAmt
        state.lentMoney = lendAmt
        state.lentReturnIn = 90
      }

      // Gamble
      if (choice.gamble !== undefined) {
        const betAmt = Math.min(choice.gamble, state.cash)
        if (betAmt > 0) {
          state.cash -= betAmt
          const win = Math.random() < 0.3
          if (win) {
            state.cash += betAmt * 10
            state.achievementToasts = [
              ...state.achievementToasts,
              {
                id: `gamble-win-${Date.now()}`,
                text: `🎰 YOU WON! +${('$' + Math.floor(betAmt * 10).toLocaleString('en-US'))}`,
                ts: Date.now(),
              },
            ]
          } else {
            const loss = betAmt * 0.8
            // Already removed from cash; return 20%
            state.cash += betAmt - loss
            state.achievementToasts = [
              ...state.achievementToasts,
              {
                id: `gamble-loss-${Date.now()}`,
                text: `💀 Lost $${Math.floor(loss).toLocaleString('en-US')} gambling`,
                ts: Date.now(),
              },
            ]
          }
        }
      }

      // Boost hustle
      if (choice.boostHustle !== undefined) {
        state.hustleBoost = choice.boostHustle
        state.hustleBoostRemaining = choice.duration ?? 60
      }

      // Future debt (installments)
      if (choice.futureDebt !== undefined) {
        state.pendingDebt = choice.futureDebt
        state.pendingDebtIn = 60
      }

      // Clear event, schedule next
      state.activeEvent = null
      state.eventCountdown = 0
      state.nextEventIn = 20 + Math.random() * 30

      return state
    })
  }, [])

  const handleBack = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      screen: prev.screen === 'goalselect' ? 'menu' : 'menu',
    }))
  }, [])

  const handlePlayAgain = useCallback(() => {
    setGameState(_prev => ({
      ...makeInitialState(),
      screen: 'goalselect',
    }))
  }, [])

  const handleMenu = useCallback(() => {
    setGameState(makeInitialState())
  }, [])

  const investTotal = Object.values(gameState.investments).reduce((a, b) => a + b, 0)
  const netWorth = gameState.cash + investTotal - gameState.debt

  return (
    <>
      <Nav
        screen={gameState.screen}
        netWorth={netWorth}
        onBack={gameState.screen === 'goalselect' ? handleBack : undefined}
      />

      {gameState.screen === 'menu' && (
        <MenuScreen
          onNewGame={handleNewGame}
          gpa={gameState.gpa}
          knowledge={gameState.knowledge}
          stress={gameState.stress}
        />
      )}

      {gameState.screen === 'goalselect' && (
        <GoalSelectScreen
          onSelectGoal={handleSelectGoal}
          onBack={handleBack}
        />
      )}

      {gameState.screen === 'game' && (
        <GameScreen
          state={gameState}
          onToggleSource={handleToggleSource}
          onPurchaseSource={handlePurchaseSource}
          onInvest={handleInvest}
          onEventChoice={handleEventChoice}
        />
      )}

      {gameState.screen === 'victory' && (
        <VictoryScreen
          state={gameState}
          onPlayAgain={handlePlayAgain}
          onMenu={handleMenu}
        />
      )}

      {gameState.screen === 'gameover' && (
        <GameOverScreen
          state={gameState}
          onPlayAgain={handlePlayAgain}
          onMenu={handleMenu}
        />
      )}
    </>
  )
}
