import { useState, useCallback } from 'react'
import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice, SideHustleId } from './types'
import { makeInitialMarketData, STOCK_IDS, CRYPTO_IDS, COMP_TUITION } from './gameData'
import { useGameLoop, applyEventChoice } from './hooks/useGameLoop'
import Nav          from './components/Nav'
import MenuScreen   from './components/MenuScreen'
import SetupScreen  from './components/SetupScreen'
import TutorialOverlay from './components/TutorialOverlay'
import GameScreen   from './components/GameScreen'
import EndGameScreen from './components/EndGameScreen'
import AchievementToast from './components/AchievementToast'

interface SetupConfig {
  name: string; salary: number; rent: number; expenses: number; tuitionDebt: number
}

function makeInitialState(setup: SetupConfig): GameState {
  const { stockPrices, stockSparklines, cryptoPrices, cryptoSparklines } = makeInitialMarketData()
  const stockHeld  = {} as Record<StockId,  number>
  const cryptoHeld = {} as Record<CryptoId, number>
  for (const id of STOCK_IDS)  stockHeld[id]  = 0
  for (const id of CRYPTO_IDS) cryptoHeld[id] = 0

  return {
    screen: 'game',
    playerName: setup.name || 'Player',
    salary: setup.salary, rent: setup.rent,
    monthlyExpenses: setup.expenses, tuitionDebt: setup.tuitionDebt,
    year: 1, timeToNextYear: 60, gameTick: 0, isPaused: false,
    cash: 500,
    loanDebt: 0, tuitionRemaining: setup.tuitionDebt,
    bankValue: 0, indexValue: 0, realEstateValue: 0, cryptoPoolValue: 0,
    stockHeld, stockPrices, stockSparklines,
    cryptoHeld, cryptoPrices, cryptoSparklines,
    carOwned: false, carValue: 0,
    phase: 'car', showCarModal: false, carModalShown: false,
    activeSideHustles: [], sideHustleYearsActive: {},
    salaryMultiplier: 1, rentExtra: 0, expensesExtra: 0,
    lentMoney: 0, lentReturnYear: 0,
    compCash: 500, compIndexValue: 0, compCarOwned: false, compCarValue: 0,
    compTuitionRemaining: COMP_TUITION,
    snapshots: [],
    activeEvent: null, nextEventYear: 3,
    achievementToasts: [], achievementsUnlocked: [], codexUnlocked: [],
    gameOverReason: '', playerWon: false,
  }
}

function makeBlankState(): GameState {
  const { stockPrices, stockSparklines, cryptoPrices, cryptoSparklines } = makeInitialMarketData()
  const stockHeld  = {} as Record<StockId,  number>
  const cryptoHeld = {} as Record<CryptoId, number>
  for (const id of STOCK_IDS)  stockHeld[id]  = 0
  for (const id of CRYPTO_IDS) cryptoHeld[id] = 0
  return {
    screen: 'menu', playerName: '', salary: 50000, rent: 1200,
    monthlyExpenses: 800, tuitionDebt: 0,
    year: 1, timeToNextYear: 60, gameTick: 0, isPaused: false,
    cash: 500, loanDebt: 0, tuitionRemaining: 0,
    bankValue: 0, indexValue: 0, realEstateValue: 0, cryptoPoolValue: 0,
    stockHeld, stockPrices, stockSparklines,
    cryptoHeld, cryptoPrices, cryptoSparklines,
    carOwned: false, carValue: 0,
    phase: 'car', showCarModal: false, carModalShown: false,
    activeSideHustles: [], sideHustleYearsActive: {},
    salaryMultiplier: 1, rentExtra: 0, expensesExtra: 0,
    lentMoney: 0, lentReturnYear: 0,
    compCash: 500, compIndexValue: 0, compCarOwned: false, compCarValue: 0,
    compTuitionRemaining: COMP_TUITION,
    snapshots: [],
    activeEvent: null, nextEventYear: 3,
    achievementToasts: [], achievementsUnlocked: [], codexUnlocked: [],
    gameOverReason: '', playerWon: false,
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(makeBlankState())
  const [showTutorial, setShowTutorial] = useState(false)
  const [pendingSetup, setPendingSetup] = useState<SetupConfig | null>(null)
  useGameLoop(gameState, setGameState)

  const handleNewGame    = useCallback(() => setGameState(prev => ({ ...prev, screen: 'setup' })), [])

  // When setup completes, show tutorial first
  const handleStartGame  = useCallback((setup: SetupConfig) => {
    setPendingSetup(setup)
    setShowTutorial(true)
  }, [])

  // When tutorial completes, actually start the game
  const handleTutorialComplete = useCallback(() => {
    if (pendingSetup) {
      setGameState(makeInitialState(pendingSetup))
      setPendingSetup(null)
    }
    setShowTutorial(false)
  }, [pendingSetup])
  const handleEventChoice= useCallback((choice: EventChoice) => setGameState(prev => applyEventChoice(prev, choice)), [])

  const handleCarBuy = useCallback(() => {
    setGameState(prev => {
      let s = { ...prev, showCarModal:false, isPaused:false, phase:'networth' as const }
      const cost = 25000
      if (s.cash >= cost) {
        s.cash -= cost
      } else {
        const fromIndex = Math.min(cost - s.cash, s.indexValue)
        s.indexValue -= fromIndex; s.cash -= (cost - fromIndex)
      }
      s.carOwned = true; s.carValue = cost
      return s
    })
  }, [])

  const handleCarSkip = useCallback(() => {
    setGameState(prev => ({ ...prev, showCarModal:false, isPaused:false, phase:'networth' }))
  }, [])

  const handleInvestCore = useCallback((type: CoreInvestmentId, amount: number) => {
    setGameState(prev => {
      const actual = Math.min(amount, Math.floor(prev.cash))
      if (actual < 100) return prev
      return {
        ...prev,
        cash:            prev.cash - actual,
        bankValue:       type==='bank'       ? prev.bankValue       + actual : prev.bankValue,
        indexValue:      type==='index'      ? prev.indexValue      + actual : prev.indexValue,
        realEstateValue: type==='realEstate' ? prev.realEstateValue + actual : prev.realEstateValue,
        cryptoPoolValue: type==='cryptoPool' ? prev.cryptoPoolValue + actual : prev.cryptoPoolValue,
      }
    })
  }, [])

  const handleBuyStock = useCallback((id: StockId, shares: number) => {
    setGameState(prev => {
      const cost = Math.ceil(prev.stockPrices[id] * shares)
      if (prev.cash < cost || shares <= 0) return prev
      return { ...prev, cash: prev.cash - cost, stockHeld: { ...prev.stockHeld, [id]: prev.stockHeld[id] + shares } }
    })
  }, [])

  const handleSellStock = useCallback((id: StockId, shares: number) => {
    setGameState(prev => {
      const actual = Math.min(shares, prev.stockHeld[id])
      if (actual <= 0) return prev
      return { ...prev, cash: prev.cash + prev.stockPrices[id]*actual, stockHeld: { ...prev.stockHeld, [id]: prev.stockHeld[id]-actual } }
    })
  }, [])

  const handleBuyCrypto = useCallback((id: CryptoId, units: number) => {
    setGameState(prev => {
      if (prev.year < 10) return prev
      const cost = prev.cryptoPrices[id] * units
      if (prev.cash < cost || units <= 0) return prev
      return { ...prev, cash: prev.cash - cost, cryptoHeld: { ...prev.cryptoHeld, [id]: prev.cryptoHeld[id] + units } }
    })
  }, [])

  const handleSellCrypto = useCallback((id: CryptoId, units: number) => {
    setGameState(prev => {
      const actual = Math.min(units, prev.cryptoHeld[id])
      if (actual <= 0) return prev
      return { ...prev, cash: prev.cash + prev.cryptoPrices[id]*actual, cryptoHeld: { ...prev.cryptoHeld, [id]: prev.cryptoHeld[id]-actual } }
    })
  }, [])

  const handleActivateHustle = useCallback((id: SideHustleId, cost: number) => {
    setGameState(prev => {
      if (prev.cash < cost) return prev
      return {
        ...prev,
        cash: prev.cash - cost,
        activeSideHustles: [...prev.activeSideHustles, id],
        sideHustleYearsActive: { ...prev.sideHustleYearsActive, [id]: 0 },
      }
    })
  }, [])

  const handlePlayAgain = useCallback(() => {
    setShowTutorial(false)
    setPendingSetup(null)
    setGameState(prev => ({ ...prev, screen:'setup' }))
  }, [])
  const handleMenu      = useCallback(() => {
    setShowTutorial(false)
    setPendingSetup(null)
    setGameState(makeBlankState())
  }, [])
  const handleBack      = useCallback(() => setGameState(prev => ({ ...prev, screen:'menu' })), [])
  const handleQuit      = useCallback(() => setGameState(prev => ({ ...prev, screen:'setup' })), [])

  return (
    <>
      <Nav state={gameState} onBack={gameState.screen==='setup' ? handleBack : undefined} />

      {gameState.screen === 'menu' && (
        <MenuScreen onNewGame={handleNewGame} />
      )}
      {gameState.screen === 'setup' && (
        <SetupScreen onStart={handleStartGame} onBack={handleBack} />
      )}
      {showTutorial && (
        <TutorialOverlay onComplete={handleTutorialComplete} />
      )}
      {gameState.screen === 'game' && (
        <GameScreen
          state={gameState}
          onEventChoice={handleEventChoice}
          onCarBuy={handleCarBuy}
          onCarSkip={handleCarSkip}
          onInvestCore={handleInvestCore}
          onBuyStock={handleBuyStock}
          onSellStock={handleSellStock}
          onBuyCrypto={handleBuyCrypto}
          onSellCrypto={handleSellCrypto}
          onActivateHustle={handleActivateHustle}
          onQuit={handleQuit}
        />
      )}
      {gameState.screen === 'endgame' && (
        <EndGameScreen state={gameState} onPlayAgain={handlePlayAgain} onMenu={handleMenu} />
      )}
      {gameState.screen === 'game' && (
        <AchievementToast toasts={gameState.achievementToasts} />
      )}
    </>
  )
}
