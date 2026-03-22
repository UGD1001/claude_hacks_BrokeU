import { useState, useEffect, useCallback } from 'react'

interface TutorialSlide {
  visual: React.ReactNode
  text: string
}

interface Props {
  onComplete: () => void
}

const SLIDES: TutorialSlide[] = [
  {
    visual: (
      <div className="tut-visual-card">
        <div className="tut-year-display">
          <span className="tut-year-label">YEAR</span>
          <span className="tut-year-num">1</span>
          <span className="tut-year-of">OF 20</span>
        </div>
        <div className="tut-progress-bar">
          <div className="tut-progress-fill" style={{ width: '5%' }} />
        </div>
      </div>
    ),
    text: "You have 20 years to build your wealth. Each year lasts 60 seconds in real time."
  },
  {
    visual: (
      <div className="tut-visual-card">
        <div className="tut-cash-display">
          <span className="tut-cash-label">STARTING CASH</span>
          <span className="tut-cash-amount">$500</span>
        </div>
      </div>
    ),
    text: "This is your pocket cash. Use it to invest and grow your money."
  },
  {
    visual: (
      <div className="tut-visual-card">
        <div className="tut-flow-display">
          <div className="tut-flow-row pos">
            <span>Salary</span>
            <span>+$4,166</span>
          </div>
          <div className="tut-flow-row neg">
            <span>Rent</span>
            <span>-$1,200</span>
          </div>
          <div className="tut-flow-row neg">
            <span>Expenses</span>
            <span>-$800</span>
          </div>
          <div className="tut-flow-divider" />
          <div className="tut-flow-row net">
            <span>Net/mo</span>
            <span>+$2,166</span>
          </div>
        </div>
      </div>
    ),
    text: "Every year, you earn salary and pay bills. The difference is yours to invest."
  },
  {
    visual: (
      <div className="tut-visual-card">
        <div className="tut-invest-icons">
          <div className="tut-invest-icon">
            <span className="tut-icon-emoji">🏦</span>
            <span className="tut-icon-label">Bank</span>
          </div>
          <div className="tut-invest-icon">
            <span className="tut-icon-emoji">📈</span>
            <span className="tut-icon-label">Index</span>
          </div>
          <div className="tut-invest-icon">
            <span className="tut-icon-emoji">📊</span>
            <span className="tut-icon-label">Stocks</span>
          </div>
          <div className="tut-invest-icon">
            <span className="tut-icon-emoji">🪙</span>
            <span className="tut-icon-label">Crypto</span>
          </div>
        </div>
      </div>
    ),
    text: "Put your cash into savings, index funds, stocks, or crypto. Higher risk = higher reward."
  },
  {
    visual: (
      <div className="tut-visual-card tut-event-preview">
        <div className="tut-event-header">
          <span className="tut-event-icon">⚠️</span>
          <span className="tut-event-title">RANDOM EVENT</span>
        </div>
        <div className="tut-event-choices">
          <div className="tut-event-choice">A) Pay from savings</div>
          <div className="tut-event-choice">B) Take a loan</div>
        </div>
      </div>
    ),
    text: "Random events will happen. Choose wisely - they can help or hurt your finances."
  },
  {
    visual: (
      <div className="tut-visual-card">
        <div className="tut-trophy">
          <span className="tut-trophy-icon">🏆</span>
          <span className="tut-trophy-text">BEAT THE COMPUTER</span>
        </div>
      </div>
    ),
    text: "Beat the computer's net worth by Year 20 to win. Good luck!"
  }
]

const TYPING_SPEED = 40 // ms per character

export default function TutorialOverlay({ onComplete }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const slide = SLIDES[currentSlide]
  const isLastSlide = currentSlide === SLIDES.length - 1

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)

    let index = 0
    const text = slide.text

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, TYPING_SPEED)

    return () => clearInterval(interval)
  }, [currentSlide, slide.text])

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete()
    } else {
      setCurrentSlide(prev => prev + 1)
    }
  }, [isLastSlide, onComplete])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  const handleDotClick = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  // Skip typing animation on click
  const handleTextClick = useCallback(() => {
    if (isTyping) {
      setDisplayedText(slide.text)
      setIsTyping(false)
    }
  }, [isTyping, slide.text])

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        {/* Skip button */}
        <button className="tutorial-skip" onClick={handleSkip}>
          SKIP ▸
        </button>

        {/* Visual card */}
        <div className="tutorial-visual">
          {slide.visual}
        </div>

        {/* Typewriter text */}
        <div className="tutorial-text" onClick={handleTextClick}>
          {displayedText}
          {isTyping && <span className="tutorial-cursor">_</span>}
        </div>

        {/* Dot pagination */}
        <div className="tutorial-dots">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              className={`tutorial-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Next / Start button */}
        <button className="tutorial-next" onClick={handleNext}>
          {isLastSlide ? 'START GAME' : 'NEXT'} ▸
        </button>
      </div>
    </div>
  )
}
