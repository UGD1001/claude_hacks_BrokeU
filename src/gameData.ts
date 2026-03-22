import type { Goal, IncomeSource, Bill, GameEvent } from './types'

export const GOALS: Goal[] = [
  { id: 'car',      icon: '🚗', name: 'Buy a car',            amount: 25000,  duration: 480,  difficulty: 'easy'   },
  { id: 'loans',    icon: '🎓', name: 'Pay off student loans', amount: 38000,  duration: 720,  difficulty: 'medium' },
  { id: 'business', icon: '🚀', name: 'Launch a business',     amount: 50000,  duration: 600,  difficulty: 'medium' },
  { id: 'house',    icon: '🏠', name: 'House down payment',    amount: 100000, duration: 900,  difficulty: 'hard'   },
  { id: 'retire',   icon: '🌴', name: 'Early retirement fund', amount: 500000, duration: 1200, difficulty: 'expert' },
]

export const INCOME_SOURCES: IncomeSource[] = [
  { id: 'dayjob',   icon: '💼', name: 'Day Job',            ratePerSec: 40,  variance: 0,  riskLevel: 'safe',    unlockNetWorth: 0,     setupCost: 0,     isInvestment: false },
  { id: 'hustle',   icon: '📱', name: 'Side Hustle',        ratePerSec: 22,  variance: 12, riskLevel: 'medium',  unlockNetWorth: 0,     setupCost: 0,     isInvestment: false },
  { id: 'hysa',     icon: '🏦', name: 'High-Yield Savings', ratePerSec: 0,   variance: 0,  riskLevel: 'safe',    unlockNetWorth: 0,     setupCost: 500,   isInvestment: true,  investRatePerMin: 0.008 },
  { id: 'index',    icon: '📈', name: 'Index Fund',         ratePerSec: 0,   variance: 0,  riskLevel: 'medium',  unlockNetWorth: 3000,  setupCost: 1000,  isInvestment: true,  investRatePerMin: 0.012 },
  { id: 'dividend', icon: '📊', name: 'Dividend Stocks',    ratePerSec: 0,   variance: 0,  riskLevel: 'medium',  unlockNetWorth: 5000,  setupCost: 1000,  isInvestment: true,  investRatePerMin: 0.009 },
  { id: 'digital',  icon: '📝', name: 'Digital Product',    ratePerSec: 15,  variance: 0,  riskLevel: 'medium',  unlockNetWorth: 8000,  setupCost: 5000,  isInvestment: false },
  { id: 'crypto',   icon: '🪙', name: 'Crypto',             ratePerSec: 0,   variance: 0,  riskLevel: 'extreme', unlockNetWorth: 10000, setupCost: 500,   isInvestment: true,  investRatePerMin: 0 },
  { id: 'biz',      icon: '🏢', name: 'Business',           ratePerSec: 55,  variance: 20, riskLevel: 'high',    unlockNetWorth: 20000, setupCost: 15000, isInvestment: false },
  { id: 'rental',   icon: '🏠', name: 'Rental Property',    ratePerSec: 28,  variance: 0,  riskLevel: 'medium',  unlockNetWorth: 40000, setupCost: 40000, isInvestment: false },
]

export const BILLS: Bill[] = [
  { id: 'rent',  name: 'Rent',          amount: 700, intervalSec: 60 },
  { id: 'food',  name: 'Groceries',     amount: 180, intervalSec: 30 },
  { id: 'phone', name: 'Phone/Subs',    amount: 60,  intervalSec: 45 },
  { id: 'misc',  name: 'Misc expenses', amount: 90,  intervalSec: 50 },
]

export const LIFE_EVENTS: GameEvent[] = [
  {
    id: 'car_repair',
    icon: '🚗',
    title: 'Car breaks down — $3,200 repair!',
    desc: 'Your only car. You need it for work. Emergency fund? Loan? Sell investments?',
    choices: [
      { key: 'A', label: 'Pay cash',                    cost: -3200,    stressChange: +5,  outcomeClass: 'neutral', outcome: 'Expensive but done' },
      { key: 'B', label: 'Take a loan (18% APR)',        debt: 3200,     stressChange: +20, outcomeClass: 'bad',     outcome: '+$3,200 debt · interest drains' },
      { key: 'C', label: 'Sell index fund shares',       sellInvestment: 'index', sellAmount: 3200, stressChange: +10, outcomeClass: 'neutral', outcome: 'Investments sold · back on track' },
    ],
  },
  {
    id: 'market_dip',
    icon: '📉',
    title: 'Market crashes — down 20%!',
    desc: 'Your portfolio just dropped. What do you do?',
    choices: [
      { key: 'A', label: 'Panic sell!',         sellAll: true,    stressChange: +15, outcomeClass: 'bad',     outcome: 'Locked in losses' },
      { key: 'B', label: 'Hold steady',          nothing: true,    stressChange: +5,  outcomeClass: 'neutral', outcome: 'Market will recover' },
      { key: 'C', label: 'Buy the dip! ($2k)',   cost: -2000, buyDip: true, stressChange: -5, outcomeClass: 'good', outcome: 'Great move · buying low' },
    ],
  },
  {
    id: 'job_offer',
    icon: '💼',
    title: 'New job offer: +$25/s but 60s transition period',
    desc: 'A recruiter reached out. Better pay, but you lose income during transition.',
    choices: [
      { key: 'A', label: 'Accept — worth the wait', upgradeJob: true, stressChange: -10, outcomeClass: 'good',    outcome: '+$25/s permanently' },
      { key: 'B', label: 'Decline — too risky now',  nothing: true,   stressChange: 0,   outcomeClass: 'neutral', outcome: 'Staying put' },
    ],
  },
  {
    id: 'friend_loan',
    icon: '💸',
    title: 'Friend asks to borrow $5,000 (returned in 90s)',
    desc: 'Your buddy needs cash quick. You\'ll get it back... probably.',
    choices: [
      { key: 'A', label: 'Lend it!',  lend: 5000,   stressChange: +5,  outcomeClass: 'neutral', outcome: 'Money locked for 90s' },
      { key: 'B', label: 'Decline',   nothing: true, stressChange: 0,   outcomeClass: 'neutral', outcome: 'Kept your money' },
    ],
  },
  {
    id: 'hot_tip',
    icon: '🎰',
    title: '"This crypto will 10x!" — invest $10,000?',
    desc: 'Your cousin swears this is legit. The odds are... not great.',
    choices: [
      { key: 'A', label: 'GO ALL IN 🎲',           gamble: 10000, stressChange: +25, outcomeClass: 'bad',     outcome: '30% win, 70% lose 80%' },
      { key: 'B', label: 'Small bet $2k',           gamble: 2000,  stressChange: +10, outcomeClass: 'neutral', outcome: '30% win, 70% lose 80%' },
      { key: 'C', label: 'Pass — sounds sketchy',   nothing: true, stressChange: -5,  outcomeClass: 'good',    outcome: 'Smart move' },
    ],
  },
  {
    id: 'tax_refund',
    icon: '💰',
    title: 'Tax refund arrived! +$1,800 bonus',
    desc: 'The IRS sent you money back. What do you do with it?',
    choices: [
      { key: 'A', label: 'Invest it all',   bonus: 1800, investBonus: true, stressChange: -5,  outcomeClass: 'good',    outcome: 'Boosted your portfolio!' },
      { key: 'B', label: 'Add to savings',  bonus: 1800,                    stressChange: -5,  outcomeClass: 'good',    outcome: 'Cash cushion grows' },
      { key: 'C', label: 'Treat yourself',  bonus: 900,                     stressChange: -15, outcomeClass: 'neutral', outcome: 'Half saved, half enjoyed' },
    ],
  },
  {
    id: 'medical',
    icon: '🏥',
    title: 'Unexpected medical bill — $2,400',
    desc: 'Nothing serious, but the bill sure is.',
    choices: [
      { key: 'A', label: 'Pay now',                        cost: -2400, stressChange: +10, outcomeClass: 'neutral', outcome: 'Ouch. Done.' },
      { key: 'B', label: 'Payment plan (3 installments)',  cost: -900,  futureDebt: 1500, stressChange: +5, outcomeClass: 'neutral', outcome: 'Spread the pain' },
    ],
  },
  {
    id: 'side_hustle_viral',
    icon: '🔥',
    title: 'Side hustle went VIRAL! Doubled income for 60s',
    desc: 'Your content blew up overnight. Capitalize on the moment?',
    choices: [
      { key: 'A', label: 'Capitalize — work hard!', boostHustle: 2.0, duration: 60, stressChange: +10, outcomeClass: 'good',    outcome: 'Double hustle income for 60s!' },
      { key: 'B', label: 'Meh, keep pace',           nothing: true,                  stressChange: 0,   outcomeClass: 'neutral', outcome: 'Missed opportunity' },
    ],
  },
]

export const INVEST_AMOUNTS = [500, 2000, 5000]

export const ACHIEVEMENTS = [
  { id: 'first5k',    threshold: 5000,   text: '💰 First $5,000!' },
  { id: 'ten',        threshold: 10000,  text: '🔥 $10k Net Worth!' },
  { id: 'twenty',     threshold: 20000,  text: '📈 $20k Milestone!' },
  { id: 'fifty',      threshold: 50000,  text: '🚀 $50k Club!' },
  { id: 'hundred',    threshold: 100000, text: '💎 Six Figures!' },
]
