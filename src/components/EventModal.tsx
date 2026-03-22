import type { GameEvent, EventChoice } from '../types'

interface EventModalProps {
  event: GameEvent
  countdown: number
  maxCountdown: number
  onChoice: (choice: EventChoice) => void
}

export default function EventModal({ event, countdown, maxCountdown, onChoice }: EventModalProps) {
  const pct = (countdown / maxCountdown) * 100

  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-countdown-track">
          <div
            className="event-countdown-fill"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="event-timer-label">
          ⚡ DECIDE IN {Math.ceil(countdown)}s
        </div>

        <div className="event-header">
          <span className="event-icon">{event.icon}</span>
          <div className="event-title">{event.title}</div>
        </div>

        {event.desc && (
          <p className="event-desc">{event.desc}</p>
        )}

        <div className="event-choices">
          {event.choices.map(choice => (
            <button
              key={choice.key}
              className="choice-btn"
              onClick={() => onChoice(choice)}
            >
              <span className="choice-key">{choice.key}</span>
              <div>
                <div className="choice-label">{choice.label}</div>
                <div className="choice-outcome">{choice.outcome}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
