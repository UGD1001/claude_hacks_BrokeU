import type { BillToastItem } from '../types'

interface BillToastProps {
  toasts: BillToastItem[]
}

export default function BillToast({ toasts }: BillToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container-bills">
      {toasts.map(t => (
        <div key={t.id} className="bill-toast">
          <span>💸</span>
          <span>{t.name}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
            -${t.amount.toLocaleString('en-US')}
          </span>
        </div>
      ))}
    </div>
  )
}
