import { useState, useCallback, useEffect, useRef } from 'react'
import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice, SideHustleId } from './types'
import { makeInitialMarketData, STOCK_IDS, CRYPTO_IDS, COMP_TUITION } from './gameData'
import { useGameLoop, applyEventChoice } from './hooks/useGameLoop'
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
  name: string; salary: number; rent: number; expenses: number; tuitionDebt: number
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 8)
}

function makeInitialState(setup: SetupConfig, mpRole: GameState['mpRole'], mpSessionId: string, mpPlayerId: string, mpSessionSeed: number): GameState {
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
    mpRole,
    mpSessionId,
    mpPlayerId,
    mpSessionSeed,
    remotePlayers: [],
  }
}

function makeMenuState(): GameState {
  return {
    screen: 'menu',
    playerName: '',
    salary: 50000,
    rent: 1200,
    monthlyExpenses: 800,
    tuitionDebt: 0,
    year: 1,
    timeToNextYear: 60,
    gameTick: 0,
    isPaused: false,
    cash: 500,
    loanDebt: 0,
    tuitionRemaining: 0,
    bankValue: 0,
    indexValue: 0,
    realEstateValue: 0,
    cryptoPoolValue: 0,
    stockHeld: {} as Record<StockId, number>,
    stockPrices: {} as Record<StockId, number>,
    stockSparklines: {} as Record<StockId, number[]>,
    cryptoHeld: {} as Record<CryptoId, number>,
    cryptoPrices: {} as Record<CryptoId, number>,
    cryptoSparklines: {} as Record<CryptoId, number[]>,
    carOwned: false,
    carValue: 0,
    phase: 'car',
    showCarModal: false,
    carModalShown: false,
    activeSideHustles: [],
    sideHustleYearsActive: {},
    salaryMultiplier: 1,
    rentExtra: 0,
    expensesExtra: 0,
    lentMoney: 0,
    lentReturnYear: 0,
    compCash: 500,
    compIndexValue: 0,
    compCarOwned: false,
    compCarValue: 0,
    compTuitionRemaining: COMP_TUITION,
    snapshots: [],
    activeEvent: null,
    nextEventYear: 3,
    achievementToasts: [],
    achievementsUnlocked: [],
    codexUnlocked: [],
    gameOverReason: '',
    playerWon: false,
    mpRole: 'solo',
    mpSessionId: '',
    mpPlayerId: '',
    mpSessionSeed: 0,
    remotePlayers: [],
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(makeMenuState)
  const [showTutorial, setShowTutorial] = useState(false)
  const [pendingSetup, setPendingSetup] = useState<SetupConfig | null>(null)
  // Pending setup config saved while waiting in lobby
  const pendingSetupRef = useRef<SetupConfig | null>(null)
  // Game start callback used by clients when they receive GAME_START from host
  const handleClientGameStart = useCallback((seed: number) => {
    setGameState(prev => {
      // Use saved setup if the client went through setup, otherwise use median defaults
      const setup = pendingSetupRef.current ?? {
        name: prev.playerName,
        salary: 50000,
        rent: 1200,
        expenses: 800,
        tuitionDebt: 15000,
      }
      return {
        ...makeInitialState(setup, 'client', prev.mpSessionId, prev.mpPlayerId, seed),
        remotePlayers: prev.remotePlayers,
      }
    })
  }, [])

  useGameLoop(gameState, setGameState)
  const { broadcastGameStart, joinSession, relayConnected, activeSessions } =
    useMultiplayer(gameState, setGameState, handleClientGameStart)

  // Join modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinError, setJoinError] = useState('')

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNewGame = useCallback(() => {
    setGameState(prev => ({ ...prev, screen: 'setup', mpRole: 'solo', mpSessionId: '', mpPlayerId: '' }))
  }, [])

  const handleHostGame = useCallback(() => {
    const sessionId = generateId()
    const playerId = generateId()
    setGameState(prev => ({
      ...prev,
      screen: 'setup',
      mpRole: 'host',
      mpSessionId: sessionId,
      mpPlayerId: playerId,
      remotePlayers: [],
    }))
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
    if (!matchId) { setJoinError('No lobby with that code. Check the code and try again.'); return }
    const playerId = generateId()
    setJoinModalOpen(false)
    setGameState(prev => ({
      ...prev,
      playerName: name,
      screen: 'lobby',
      mpRole: 'client',
      mpSessionId: matchId,
      mpPlayerId: playerId,
      remotePlayers: [],
    }))
  }, [joinCode, joinName, activeSessions])

  const handleSetupDone = useCallback((setup: SetupConfig) => {
    if (gameState.mpRole === 'solo') {
      // Solo: show tutorial first
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

  // Client: join the session once they enter the lobby screen
  const joinedRef = useRef(false)
  useEffect(() => {
    if (gameState.screen !== 'lobby' || gameState.mpRole !== 'client' || joinedRef.current) return
    joinedRef.current = true
    joinSession(gameState.mpSessionId, gameState.mpPlayerId, gameState.playerName)
  }, [gameState.screen, gameState.mpRole, gameState.mpSessionId, gameState.mpPlayerId, gameState.playerName, joinSession])

  // Reset join flag when leaving lobby
  useEffect(() => {
    if (gameState.screen !== 'lobby') joinedRef.current = false
  }, [gameState.screen])

  // Host: start the game for everyone
  const handleHostStartGame = useCallback(() => {
    const setup = pendingSetupRef.current
    if (!setup) return
    const seed = (Math.random() * 0xFFFFFFFF) >>> 0
    broadcastGameStart(seed)
    setGameState(prev => ({
      ...makeInitialState(setup, 'host', prev.mpSessionId, prev.mpPlayerId, seed),
      remotePlayers: prev.remotePlayers,
    }))
  }, [broadcastGameStart])

  const handleBack = useCallback(() => {
    setGameState(makeMenuState())
  }, [])

  // ── Game actions ────────────────────────────────────────────────────────────

  const handleEventChoice = useCallback((choice: EventChoice) => {
    setGameState(prev => applyEventChoice(prev, choice))
  }, [])

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
    setGameState(prev => ({ ...prev, showCarModal: false, isPaused: false, phase: 'networth' }))
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
    setGameState({ ...makeMenuState(), screen: 'setup', mpRole: 'solo' })
  }, [])

  const handleMenu = useCallback(() => {
    setShowTutorial(false)
    setPendingSetup(null)
    setGameState(makeMenuState())
  }, [])

  const handleQuit = useCallback(() => setGameState(prev => ({ ...prev, screen: 'setup' })), [])

  return (
    <>
      <Nav state={gameState} onBack={gameState.screen === 'setup' || gameState.screen === 'lobby' ? handleBack : undefined} />

      {gameState.screen === 'menu' && (
        <MenuScreen
          onNewGame={handleNewGame}
          onHostGame={handleHostGame}
          onJoinGame={handleJoinGame}
          sessionCount={activeSessions.size}
          relayConnected={relayConnected}
        />
      )}

      {joinModalOpen && (
        <div className="join-modal-backdrop" onClick={() => setJoinModalOpen(false)}>
          <div className="join-modal" onClick={e => e.stopPropagation()}>
            <div className="join-modal-title">JOIN A LOBBY</div>

            <div className="join-modal-field">
              <label className="join-modal-label">YOUR NAME</label>
              <input
                className="join-modal-input"
                type="text"
                placeholder="Alex"
                maxLength={20}
                autoFocus
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinSubmit()}
              />
            </div>

            <div className="join-modal-field">
              <label className="join-modal-label">SESSION CODE</label>
              <input
                className="join-modal-input join-modal-code"
                type="text"
                placeholder="ABC123"
                maxLength={6}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoinSubmit()}
              />
            </div>

            {joinError && <div className="join-modal-error">{joinError}</div>}

            <div className="join-modal-hint">
              {activeSessions.size > 0
                ? `${activeSessions.size} active lobby${activeSessions.size !== 1 ? 'ies' : ''} found`
                : 'No active lobbies detected yet'}
            </div>

            <button className="menu-btn primary join-modal-btn" onClick={handleJoinSubmit}>
              <span className="menu-btn-prompt">→</span>
              Join Game
            </button>
            <button className="menu-btn secondary join-modal-btn" onClick={() => setJoinModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {gameState.screen === 'setup' && (
        <SetupScreen onStart={handleSetupDone} onBack={handleBack} />
      )}

      {gameState.screen === 'lobby' && (
        <LobbyScreen
          state={gameState}
          onStartGame={handleHostStartGame}
          onBack={handleBack}
        />
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
