import { useState, useCallback, useEffect, useRef } from 'react'
import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice, HouseOption, MortgageTerm, GameMode, SideHustleId } from './types'
import { makeInitialMarketData, STOCK_IDS, CRYPTO_IDS, HALF_YEAR_SEC, pickGameStartDate, SIDE_HUSTLES } from './gameData'
import { useGameLoop, applyEventChoice, applyHousePurchase, applyHouseMoveIn, applyHouseRentOut } from './hooks/useGameLoop'
import { useMultiplayer } from './hooks/useMultiplayer'
import Nav from './components/Nav'
import MenuScreen from './components/MenuScreen'
import SetupScreen from './components/SetupScreen'
import LobbyScreen from './components/LobbyScreen'
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

function generateId(): string {
  return Math.random().toString(36).slice(2, 8)
}

function makeInitialState(setup: SetupConfig, mpRole: 'solo' | 'host' | 'client', mpSessionId: string, mpPlayerId: string, mpSessionSeed: number): GameState {
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

    mpRole,
    mpSessionId,
    mpPlayerId,
    mpSessionSeed,
    remotePlayers: [],

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
    mpRole: 'solo', mpSessionId: '', mpPlayerId: '', mpSessionSeed: 0, remotePlayers: [],
    gameOverReason: '', playerWon: false,
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(makeBlankState)
  const [showTutorial, setShowTutorial] = useState(false)
  const [pendingSetup, setPendingSetup] = useState<SetupConfig | null>(null)
  const pendingSetupRef = useRef<SetupConfig | null>(null)

  // Join modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinError, setJoinError] = useState('')
  const joinedRef = useRef(false)

  useGameLoop(gameState, setGameState)

  const handleClientGameStart = useCallback((seed: number) => {
    setGameState(prev => {
      const setup = pendingSetupRef.current ?? { name: prev.playerName, salary: 50000, rent: 1200, expenses: 800, tuitionDebt: 15000, gameMode: 'standard' as const }
      return { ...makeInitialState(setup, 'client', prev.mpSessionId, prev.mpPlayerId, seed), remotePlayers: prev.remotePlayers }
    })
  }, [])

  const { broadcastGameStart, joinSession, relayConnected, activeSessions } =
    useMultiplayer(gameState, setGameState, handleClientGameStart)

  const handleNewGame = useCallback(() => setGameState(prev => ({ ...prev, screen: 'setup', mpRole: 'solo', mpSessionId: '', mpPlayerId: '' })), [])

  const handleHostGame = useCallback(() => {
    const sessionId = generateId()
    const playerId = generateId()
    setGameState(prev => ({ ...prev, screen: 'setup', mpRole: 'host', mpSessionId: sessionId, mpPlayerId: playerId, remotePlayers: [] }))
  }, [])

  const handleJoinGame = useCallback(() => {
    setJoinCode('')
    setJoinName('')
    setJoinError('')
    setJoinModalOpen(true)
  }, [])

  const handleJoinSubmit = useCallback(() => {
    const code = joinCode.trim().toLowerCase()
    const name = joinName.trim()
    if (!name) { setJoinError('Enter your name.'); return }
    if (code.length !== 6) { setJoinError('Session code is 6 characters.'); return }
    const matchId = [...activeSessions.keys()].find(id => id.toLowerCase() === code)
    if (!matchId) { setJoinError('No lobby with that code.'); return }
    const playerId = generateId()
    setJoinModalOpen(false)
    setGameState(prev => ({ ...prev, playerName: name, screen: 'lobby', mpRole: 'client', mpSessionId: matchId, mpPlayerId: playerId, remotePlayers: [] }))
  }, [joinCode, joinName, activeSessions])

  const handleBack = useCallback(() => setGameState(prev => ({ ...prev, screen: 'menu' })), [])

  // When setup completes, show tutorial first (solo) or go to lobby (multiplayer)
  const handleStartGame = useCallback((setup: SetupConfig) => {
    pendingSetupRef.current = setup
    if (gameState.mpRole === 'solo') {
      setPendingSetup(setup)
      setShowTutorial(true)
    } else {
      // Multiplayer: save setup and go to lobby
      pendingSetupRef.current = setup
      setGameState(prev => ({ ...prev, playerName: setup.name || 'Player', screen: 'lobby' }))
    }
  }, [gameState.mpRole])

  // When tutorial completes, actually start the game
  const handleTutorialComplete = useCallback(() => {
    if (pendingSetup) {
      setGameState(makeInitialState(pendingSetup, 'solo', '', '', 0))
      setPendingSetup(null)
    }
    setShowTutorial(false)
  }, [pendingSetup])

  const handleHostStartGame = useCallback(() => {
    const setup = pendingSetupRef.current
    if (!setup) return
    const seed = (Math.random() * 0xFFFFFFFF) >>> 0
    broadcastGameStart(seed)
    setGameState(prev => ({ ...makeInitialState(setup, 'host', prev.mpSessionId, prev.mpPlayerId, seed), remotePlayers: prev.remotePlayers }))
  }, [broadcastGameStart])

  // Client: join session on entering lobby
  useEffect(() => {
    if (gameState.screen !== 'lobby' || gameState.mpRole !== 'client' || joinedRef.current) return
    joinedRef.current = true
    joinSession(gameState.mpSessionId, gameState.mpPlayerId, gameState.playerName)
  }, [gameState.screen, gameState.mpRole, gameState.mpSessionId, gameState.mpPlayerId, gameState.playerName, joinSession])

  // Reset join flag when leaving lobby
  useEffect(() => {
    if (gameState.screen !== 'lobby') joinedRef.current = false
  }, [gameState.screen])

  const handleEventChoice = useCallback((choice: EventChoice) => setGameState(prev => applyEventChoice(prev, choice)), [])

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
    setGameState(prev => ({ ...prev, showCarModal: false, isPaused: false, phase: 'networth' }))
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
      return { ...prev, cash: prev.cash + prev.stockPrices[id] * actual, stockHeld: { ...prev.stockHeld, [id]: prev.stockHeld[id] - actual } }
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
      return { ...prev, cash: prev.cash + prev.cryptoPrices[id] * actual, cryptoHeld: { ...prev.cryptoHeld, [id]: prev.cryptoHeld[id] - actual } }
    })
  }, [])

  const handleActivateSideHustle = useCallback((id: SideHustleId) => {
    setGameState(prev => {
      if (prev.activeSideHustles.includes(id)) return prev
      const hustle = SIDE_HUSTLES.find(h => h.id === id)
      if (!hustle || prev.cash < hustle.cost) return prev
      return {
        ...prev,
        cash: prev.cash - hustle.cost,
        activeSideHustles: [...prev.activeSideHustles, id],
        sideHustleHalfYearsActive: { ...prev.sideHustleHalfYearsActive, [id]: 0 },
      }
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
    setGameState({ ...makeBlankState(), screen: 'setup' })
  }, [])

  const handleMenu = useCallback(() => {
    setShowTutorial(false)
    setPendingSetup(null)
    setGameState(makeBlankState())
  }, [])

  const showBack = gameState.screen === 'setup' || gameState.screen === 'lobby'

  return (
    <>
      <Nav state={gameState} onBack={showBack ? handleBack : undefined} />

      {gameState.screen === 'menu' && (
        <MenuScreen
          onNewGame={handleNewGame}
          onHostGame={handleHostGame}
          onJoinGame={handleJoinGame}
          sessionCount={activeSessions.size}
          relayConnected={relayConnected}
        />
      )}

      {gameState.screen === 'setup' && (
        <SetupScreen onStart={handleStartGame} onBack={handleBack} />
      )}

      {gameState.screen === 'lobby' && (
        <LobbyScreen state={gameState} onStartGame={handleHostStartGame} onBack={handleBack} />
      )}

      {/* Join modal */}
      {joinModalOpen && (
        <div className="join-modal-backdrop" onClick={() => setJoinModalOpen(false)}>
          <div className="join-modal" onClick={e => e.stopPropagation()}>
            <div className="join-modal-title">&gt;_ JOIN GAME</div>
            <label className="join-modal-label">Your name</label>
            <input
              className="join-modal-input"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
            />
            <label className="join-modal-label">Session code (6 chars)</label>
            <input
              className="join-modal-input"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toLowerCase().slice(0, 6))}
              placeholder="e.g. abc123"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoinSubmit()}
            />
            {joinError && <div className="join-modal-error">{joinError}</div>}
            <div className="join-modal-actions">
              <button className="menu-btn primary" onClick={handleJoinSubmit}>JOIN</button>
              <button className="menu-btn secondary" onClick={() => setJoinModalOpen(false)}>CANCEL</button>
            </div>
          </div>
        </div>
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
          onActivateSideHustle={handleActivateSideHustle}
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
