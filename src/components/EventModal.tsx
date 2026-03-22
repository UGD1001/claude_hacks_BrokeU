import type { GameEvent, EventChoice } from '../types'

interface Props {
  event: GameEvent
  onChoice: (choice: EventChoice) => void
}

export default function EventModal({ event, onChoice }: Props) {
  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-header">
          <span className="event-icon">{event.icon}</span>
          <div className="event-title">{event.title.toUpperCase()}</div>
        </div>

        {event.desc && <p className="event-desc">{event.desc}</p>}

        <div className="event-choices">
          {event.choices.map(choice => (
            <button
              key={choice.key}
              className={`choice-btn ${choice.outcomeClass}`}
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
