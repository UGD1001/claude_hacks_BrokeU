import { GOALS } from '../gameData'
import type { Goal } from '../types'

interface GoalSelectScreenProps {
  onSelectGoal: (goal: Goal) => void
  onBack: () => void
}

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s > 0 ? s + 's' : ''}`
}

export default function GoalSelectScreen({ onSelectGoal, onBack }: GoalSelectScreenProps) {
  return (
    <div className="goal-select-screen" style={{ paddingTop: 80 }}>
      <button className="btn-back" onClick={onBack}>← Back to Menu</button>

      <div className="goal-select-header">
        <div className="goal-select-eyebrow">· Choose Your Mission ·</div>
        <h2 className="goal-select-title">SELECT YOUR GOAL</h2>
        <p className="goal-select-subtitle">
          Pick wisely. Each goal has a time limit. Miss it and you're done.
        </p>
      </div>

      <div className="goals-grid">
        {GOALS.map(goal => (
          <div
            key={goal.id}
            className={`goal-card ${goal.difficulty}`}
            onClick={() => onSelectGoal(goal)}
          >
            <span className="goal-icon">{goal.icon}</span>
            <div className="goal-name">{goal.name}</div>
            <div className="goal-amt">${goal.amount.toLocaleString('en-US')}</div>
            <div className="goal-time">⏱ {fmtTime(goal.duration)}</div>
            <div className={`goal-diff-badge diff-${goal.difficulty}`}>
              {goal.difficulty}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
