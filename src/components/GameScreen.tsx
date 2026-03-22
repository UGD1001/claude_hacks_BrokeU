import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice, SideHustleId, HouseOption, MortgageTerm } from '../types'
import LeftPanel from './LeftPanel'
import CenterPanel from './CenterPanel'
import AchievementToast from './AchievementToast'
import HouseModal from './HouseModal'
import HouseMoveModal from './HouseMoveModal'

interface Props {
  state: GameState
  onEventChoice: (c: EventChoice) => void
  onCarBuy: () => void
  onCarSkip: () => void
  onInvestCore: (type: CoreInvestmentId, amount: number) => void
  onBuyStock: (id: StockId, shares: number) => void
  onSellStock: (id: StockId, shares: number) => void
  onBuyCrypto: (id: CryptoId, units: number) => void
  onSellCrypto: (id: CryptoId, units: number) => void
  onActivateHustle: (id: SideHustleId, cost: number) => void
  onPurchaseHouse: (option: HouseOption, downPct: number, term: MortgageTerm) => void
  onDeclineHouse: () => void
  onMoveIn: () => void
  onRentOut: () => void
}

export default function GameScreen({
  state,
  onEventChoice, onCarBuy, onCarSkip,
  onInvestCore, onBuyStock, onSellStock, onBuyCrypto, onSellCrypto,
  onActivateHustle,
  onPurchaseHouse, onDeclineHouse, onMoveIn, onRentOut,
}: Props) {
  // Effective monthly apartment rent (before any modifiers applied to state)
  const currentRent = state.rent + state.rentExtra

  return (
    <div className="game-screen">
      <LeftPanel state={state} onActivateHustle={onActivateHustle} />
      <CenterPanel
        state={state}
        onEventChoice={onEventChoice}
        onCarBuy={onCarBuy}
        onCarSkip={onCarSkip}
        onInvestCore={onInvestCore}
        onBuyStock={onBuyStock}
        onSellStock={onSellStock}
        onBuyCrypto={onBuyCrypto}
        onSellCrypto={onSellCrypto}
      />
      <AchievementToast toasts={state.achievementToasts} />

      {/* House offer modal — fires when "found a property" event triggers */}
      {state.showHouseOffer && state.houseOptions && (
        <HouseModal
          options={state.houseOptions}
          playerCash={state.cash}
          onPurchase={onPurchaseHouse}
          onDecline={onDeclineHouse}
        />
      )}

      {/* House move modal — fires immediately after purchase */}
      {state.showHouseMoveModal && state.house && (
        <HouseMoveModal
          house={state.house}
          currentRent={currentRent}
          onMoveIn={onMoveIn}
          onRentOut={onRentOut}
        />
      )}
    </div>
  )
}
