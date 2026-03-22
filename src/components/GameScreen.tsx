import type { GameState, StockId, CryptoId, CoreInvestmentId, EventChoice, SideHustleId } from '../types'
import LeftPanel from './LeftPanel'
import CenterPanel from './CenterPanel'
import AchievementToast from './AchievementToast'

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
}

export default function GameScreen({
  state, onEventChoice, onCarBuy, onCarSkip,
  onInvestCore, onBuyStock, onSellStock, onBuyCrypto, onSellCrypto,
  onActivateHustle,
}: Props) {
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
    </div>
  )
}
