import { useState, useCallback } from 'react'
import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice, HouseOption, MortgageTerm, GameMode } from './types'
import { makeInitialMarketData, STOCK_IDS, CRYPTO_IDS, HALF_YEAR_SEC, pickGameStartDate } from './gameData'
import { useGameLoop, applyEventChoice, applyHousePurchase, applyHouseMoveIn, applyHouseRentOut } from './hooks/useGameLoop'
import Nav from './components/Nav'
import MenuScreen from './components/MenuScreen'
import SetupScreen from './components/SetupScreen'
import TutorialOverlay from './components/TutorialOverlay'
import GameScreen from './components/GameScreen'
import EndGameScreen from './components/EndGameScreen'
import AchievementToast from './components/AchievementToast'

interface SetupConfig {
  name: string
  salary: number
  rent: number
  expenses: number
  tuitionDebt: number
  gameMode: GameMode
}

function makeInitialState(setup: SetupConfig): GameState {
  const gameStartDate = pickGameStartDate()
  const { stockPrices, stockSparklines, cryptoPrices, cryptoSparklines } = makeInitialMarketData(gameStartDate)

  const stockHeld = {} as Record<StockId, number>
  const cryptoHeld = {} as Record<CryptoId, number>
  for (const id of STOCK_IDS)  stockHeld[id]  = 0
  for (const id of CRYPTO_IDS) cryptoHeld[id] = 0

  return {
    screen: 'game',
    playerName: setup.name || 'Player',
    salary: setup.salary,
    rent: setup.rent,
    monthlyExpenses: setup.expenses,
    tuitionDebt: setup.tuitionDebt,

    gameMode: setup.gameMode,
    gameStartDate,

    year: 1,
    halfYearsElapsed: 0,
    timeToNextHalfYear: HALF_YEAR_SEC,
    timeToNextMonthlyUpdate: 5,
    isPaused: false,

    marketCondition: 'neutral',
    marketConditionYearsLeft: 0,

    cash: 500,

    loanDebt: 0,
    tuitionRemaining: setup.tuitionDebt,

    bankValue: 0,
    indexValue: 0,
    cryptoBasketValue: 0,

    stockHeld,
    stockPrices,
    stockSparklines,

    cryptoHeld,
    cryptoPrices,
    cryptoSparklines,

    carOwned: false,
    carValue: 0,

    house: null,
    houseOptions: null,
    showHouseOffer: false,
    showHouseMoveModal: false,
    houseAppreciationMod: null,

    phase: 'car',
    showCarModal: false,
    carModalShown: false,

    activeSideHustles: [],
    sideHustleHalfYearsActive: {},

    salaryMultiplier: 1,
    rentExtra: 0,
    expensesExtra: 0,

    lentMoney: 0,
    lentReturnHalfYear: 0,

    compCash: 500,
    compIndexValue: 0,
    compCarOwned: false,
    compCarValue: 0,
    compTuitionRemaining: setup.tuitionDebt,
    compSalaryMultiplier: 1,
    compHouse: null,
    compHouseBought: false,

    snapshots: [],

    activeEvent: null,
    nextEventHalfYear: 3,
    houseEventFired: false,

    achievementToasts: [],
    achievementsUnlocked: [],
    codexUnlocked: [],

    gameOverReason: '',
    playerWon: false,
  }
}

function makeBlankState(): GameState {
  const gameStartDate = '1999-01'
  const { stockPrices, stockSparklines, cryptoPrices, cryptoSparklines } = makeInitialMarketData(gameStartDate)
  const stockHeld  = {} as Record<StockId,  number>
  const cryptoHeld = {} as Record<CryptoId, number>
  for (const id of STOCK_IDS)  stockHeld[id]  = 0
  for (const id of CRYPTO_IDS) cryptoHeld[id] = 0
  return {
    screen: 'menu', playerName: '', salary: 50000, rent: 1200,
    monthlyExpenses: 800, tuitionDebt: 0,
    gameMode: 'standard',
    gameStartDate,
    year: 1,
    halfYearsElapsed: 0,
    timeToNextHalfYear: HALF_YEAR_SEC,
    timeToNextMonthlyUpdate: 5,
    isPaused: false,
    marketCondition: 'neutral',
    marketConditionYearsLeft: 0,
    cash: 500,
    loanDebt: 0, tuitionRemaining: 0,
    bankValue: 0, indexValue: 0, cryptoBasketValue: 0,
    stockHeld, stockPrices, stockSparklines,
    cryptoHeld, cryptoPrices, cryptoSparklines,
    carOwned: false, carValue: 0,
    house: null, houseOptions: null, showHouseOffer: false, showHouseMoveModal: false, houseAppreciationMod: null,
    phase: 'car', showCarModal: false, carModalShown: false,
    activeSideHustles: [], sideHustleHalfYearsActive: {},
    salaryMultiplier: 1, rentExtra: 0, expensesExtra: 0,
    lentMoney: 0, lentReturnHalfYear: 0,
    compCash: 500, compIndexValue: 0, compCarOwned: false, compCarValue: 0,
    compTuitionRemaining: 0,
    compSalaryMultiplier: 1,
    compHouse: null,
    compHouseBought: false,
    snapshots: [],
    activeEvent: null, nextEventHalfYear: 3,
    houseEventFired: false,
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
      s.carOwned = true
      s.carValue = cost
      // Sprint mode: buying the car ends the game immediately — player wins
      if (s.gameMode === 'sprint') {
        return { ...s, screen: 'endgame', gameOverReason: 'You bought the car first!', playerWon: true }
      }
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
        cash: prev.cash - actual,
        bankValue:         type === 'bank'         ? prev.bankValue         + actual : prev.bankValue,
        indexValue:        type === 'index'        ? prev.indexValue        + actual : prev.indexValue,
        cryptoBasketValue: type === 'cryptoBasket' ? prev.cryptoBasketValue + actual : prev.cryptoBasketValue,
      }
    })
  }, [])

  const handleWithdrawCore = useCallback((type: CoreInvestmentId, amount: number) => {
    setGameState(prev => {
      const held = type === 'bank' ? prev.bankValue : type === 'index' ? prev.indexValue : prev.cryptoBasketValue
      const actual = Math.min(amount, Math.floor(held))
      if (actual < 100) return prev
      return {
        ...prev,
        cash: prev.cash + actual,
        bankValue:         type === 'bank'         ? prev.bankValue         - actual : prev.bankValue,
        indexValue:        type === 'index'        ? prev.indexValue        - actual : prev.indexValue,
        cryptoBasketValue: type === 'cryptoBasket' ? prev.cryptoBasketValue - actual : prev.cryptoBasketValue,
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

  const handlePurchaseHouse = useCallback((option: HouseOption, downPct: number, termYears: MortgageTerm) => {
    setGameState(prev => applyHousePurchase(prev, option, downPct, termYears))
  }, [])

  const handleDeclineHouse = useCallback(() => {
    setGameState(prev => ({ ...prev, showHouseOffer: false, houseOptions: null, isPaused: false }))
  }, [])

  const handleMoveIn = useCallback(() => {
    setGameState(prev => applyHouseMoveIn(prev))
  }, [])

  const handleRentOut = useCallback(() => {
    setGameState(prev => applyHouseRentOut(prev))
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
          onWithdrawCore={handleWithdrawCore}
          onBuyStock={handleBuyStock}
          onSellStock={handleSellStock}
          onBuyCrypto={handleBuyCrypto}
          onSellCrypto={handleSellCrypto}
          onPurchaseHouse={handlePurchaseHouse}
          onDeclineHouse={handleDeclineHouse}
          onMoveIn={handleMoveIn}
          onRentOut={handleRentOut}
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
