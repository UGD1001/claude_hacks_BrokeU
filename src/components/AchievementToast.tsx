import type { AchievementToastItem } from '../types'

interface AchievementToastProps {
  toasts: AchievementToastItem[]
}

export default function AchievementToast({ toasts }: AchievementToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container-achievements">
      {toasts.map(t => (
        <div key={t.id} className="achievement-toast">
          {t.text}
        </div>
      ))}
    </div>
  )
}
