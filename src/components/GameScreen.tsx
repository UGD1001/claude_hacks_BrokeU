import type { GameState, IncomeSourceId } from '../types'
import type { EventChoice } from '../types'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import BillToast from './BillToast'
import AchievementToast from './AchievementToast'

interface GameScreenProps {
  state: GameState
  onToggleSource: (id: IncomeSourceId) => void
  onPurchaseSource: (id: IncomeSourceId) => void
  onInvest: (id: IncomeSourceId, amount: number) => void
  onEventChoice: (choice: EventChoice) => void
}

export default function GameScreen({
  state,
  onToggleSource,
  onPurchaseSource,
  onInvest,
  onEventChoice,
}: GameScreenProps) {
  const investTotal = Object.values(state.investments).reduce((a, b) => a + b, 0)
  const netWorth = state.cash + investTotal - state.debt

  return (
    <div className="game-screen">
      <LeftPanel state={state} />
      <RightPanel
        state={state}
        onToggleSource={onToggleSource}
        onPurchaseSource={onPurchaseSource}
        onInvest={onInvest}
        onEventChoice={onEventChoice}
        netWorth={netWorth}
      />
      <BillToast toasts={state.billToasts} />
      <AchievementToast toasts={state.achievementToasts} />
    </div>
  )
}
