import type { AchievementToastItem } from '../types'

export default function AchievementToast({ toasts }: { toasts: AchievementToastItem[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container-achievements">
      {toasts.map(t => (
        <div key={t.id} className="achievement-toast">{t.text.toUpperCase()}</div>
      ))}
    </div>
  )
}
