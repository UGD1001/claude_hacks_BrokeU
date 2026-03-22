import type { StockId, CryptoId, GameEvent, GameState } from './types'

export const TOTAL_YEARS = 20
export const YEAR_SEC    = 60
export const CAR_GOAL    = 25000

export const STOCK_IDS:  StockId[]  = ['AAPL','TSLA','MSFT','AMZN','NVDA','GOOG']
export const CRYPTO_IDS: CryptoId[] = ['BTC','ETH','SOL','DOGE']

export const COMP_SALARY   = 50000
export const COMP_RENT     = 1200
export const COMP_EXPENSES = 800
export const COMP_TUITION  = 15000

export const STOCK_META: Record<StockId, { name: string; price: number; chg: number }> = {
  AAPL: { name:'Apple',     price:174,   chg: 2.1  },
  TSLA: { name:'Tesla',     price:248,   chg:-8.4  },
  MSFT: { name:'Microsoft', price:412,   chg: 1.3  },
  AMZN: { name:'Amazon',    price:186,   chg:-3.2  },
  NVDA: { name:'Nvidia',    price:892,   chg: 5.7  },
  GOOG: { name:'Alphabet',  price:138,   chg: 0.8  },
}

export const CRYPTO_META: Record<CryptoId, { name: string; price: number; chg: number }> = {
  BTC:  { name:'Bitcoin',  price:62000, chg: 4.2  },
  ETH:  { name:'Ethereum', price:3200,  chg:-2.1  },
  SOL:  { name:'Solana',   price:142,   chg: 9.1  },
  DOGE: { name:'Dogecoin', price:0.14,  chg:-12.0 },
}

export const MARKET_PARAMS = {
  bank:       { base:0.015, variance:0.005 },
  index:      { base:0.07,  variance:0.025 },
  stocks:     { base:0.09,  variance:0.18  },
  realEstate: { base:0.06,  variance:0.03  },
  cryptoPool: { base:0.22,  variance:0.50  },
  crypto:     { base:0.20,  variance:0.55  },
}

function genSparkline(price: number, variance: number): number[] {
  const pts: number[] = []
  let p = price * (0.75 + Math.random() * 0.5)
  for (let i = 0; i < 8; i++) {
    p = Math.max(0.001, p * (1 + (Math.random() - 0.5) * variance))
    pts.push(p)
  }
  return pts
}

export function makeInitialMarketData() {
  const stockPrices     = {} as Record<StockId,  number>
  const stockSparklines = {} as Record<StockId,  number[]>
  const cryptoPrices    = {} as Record<CryptoId, number>
  const cryptoSparklines= {} as Record<CryptoId, number[]>

  for (const id of STOCK_IDS) {
    stockPrices[id]     = STOCK_META[id].price
    stockSparklines[id] = genSparkline(STOCK_META[id].price, 0.20)
  }
  for (const id of CRYPTO_IDS) {
    cryptoPrices[id]     = CRYPTO_META[id].price
    cryptoSparklines[id] = genSparkline(CRYPTO_META[id].price, 0.50)
  }

  return { stockPrices, stockSparklines, cryptoPrices, cryptoSparklines }
}

export const SIDE_HUSTLES = [
  { id:'freelance' as const, name:'Freelancing',     icon:'💻', cost:0,    annualIncome:3000, availableFromYear:1 },
  { id:'store'     as const, name:'Online Store',    icon:'🛒', cost:200,  annualIncome:4000, availableFromYear:3 },
  { id:'content'   as const, name:'Content Creator', icon:'🎥', cost:0,    annualIncome:2000, availableFromYear:1, growthYears:3 },
  { id:'digital'   as const, name:'Digital Product', icon:'📝', cost:5000, annualIncome:2400, availableFromYear:1 },
  { id:'rental'    as const, name:'Room Rental',     icon:'🏠', cost:500,  annualIncome:6000, availableFromYear:1, requiresRealEstate:true },
] as const

export const LIFE_EVENTS: GameEvent[] = [
  {
    id:'car_breakdown', icon:'🚗',
    title:'Car breaks down — $3,200 repair',
    desc:'Your car needs urgent repairs. Emergency fund? Loan? Sell investments?',
    choices:[
      { key:'A', label:'Pay from savings',        cashChange:-3200,  outcomeClass:'neutral', outcome:'Expensive but done' },
      { key:'B', label:'Take a loan (18% APR)',   addDebt:3200,      outcomeClass:'bad',     outcome:'+$3,200 debt · interest drains' },
      { key:'C', label:'Sell index fund shares',  sellIndexAmount:3200, outcomeClass:'neutral', outcome:'Investments sold · back on track' },
    ],
  },
  {
    id:'medical_emergency', icon:'🏥',
    title:'Hospital bill — $8,000',
    desc:'Nothing life-threatening. The bill, however, very much is.',
    choices:[
      { key:'A', label:'Pay out of pocket',          cashChange:-8000,          outcomeClass:'bad',     outcome:'Ouch. Debt-free though.' },
      { key:'B', label:'Payment plan (18% APR)',     addDebt:8000,              outcomeClass:'bad',     outcome:'+$8,000 debt at 18% APR' },
      { key:'C', label:'Liquidate portfolio',        sellAllInvestments:true,   outcomeClass:'bad',     outcome:'Sold investments to cover it' },
    ],
  },
  {
    id:'market_crash', icon:'📉',
    title:'Market crashes — down 20%!',
    desc:'Your portfolio just dropped. What do you do?',
    choices:[
      { key:'A', label:'Panic sell!',             sellAllInvestments:true,     outcomeClass:'bad',     outcome:'Locked in losses' },
      { key:'B', label:'Hold steady',             outcomeClass:'neutral',                               outcome:'Market will recover' },
      { key:'C', label:'Buy the dip! ($2,000)',   cashChange:-2000, investInIndex:2000, outcomeClass:'good', outcome:'Smart move · buying low' },
    ],
  },
  {
    id:'market_boom', icon:'🚀',
    title:'Bull run — market up 15%!',
    desc:'Everything is green. The market is surging.',
    choices:[
      { key:'A', label:'Take profits',            sellAllInvestments:true,     outcomeClass:'neutral', outcome:'Cashed out at the top' },
      { key:'B', label:'Stay invested',           outcomeClass:'good',                                  outcome:'Riding the wave' },
      { key:'C', label:'Double down! ($5,000)',   cashChange:-5000, investInIndex:5000, outcomeClass:'neutral', outcome:'More exposure, more upside' },
    ],
  },
  {
    id:'job_layoff', icon:'📋',
    title:'Laid off — 6 months no income!',
    desc:'Restructuring. Your role has been eliminated.',
    choices:[
      { key:'A', label:'Live off savings',                   loseHalfYearIncome:true,                                outcomeClass:'bad', outcome:'Lost 6 months of income' },
      { key:'B', label:'Liquidate to cover expenses',        sellAllInvestments:true, loseHalfYearIncome:true,        outcomeClass:'bad', outcome:'Sold investments + lost income' },
    ],
  },
  {
    id:'pay_raise', icon:'📈',
    title:'Promotion — salary +15%!',
    desc:'Your boss finally noticed. Well done.',
    choices:[
      { key:'A', label:'Accept the raise',   salaryMultiplier:1.15, outcomeClass:'good',    outcome:'Salary increased by 15%!' },
      { key:'B', label:'Negotiate harder',   salaryMultiplier:1.25, outcomeClass:'good',    outcome:'+25% — but they resent you now' },
    ],
  },
  {
    id:'unexpected_bonus', icon:'💰',
    title:'Work bonus — $5,000!',
    desc:"You actually hit your targets this year. Here's your reward.",
    choices:[
      { key:'A', label:'Invest in index fund', cashChange:5000, investInIndex:5000, outcomeClass:'good',    outcome:'Into the index it goes!' },
      { key:'B', label:'Add to savings',       cashChange:5000,                     outcomeClass:'good',    outcome:'Cash cushion grows' },
      { key:'C', label:'Treat yourself (half)',cashChange:2500,                     outcomeClass:'neutral', outcome:'Half saved, half enjoyed' },
    ],
  },
  {
    id:'inheritance', icon:'🏛️',
    title:'Unexpected inheritance — $20,000!',
    desc:'A distant relative left you money. Life is unpredictable.',
    choices:[
      { key:'A', label:'Invest everything',    cashChange:20000, investInIndex:20000, outcomeClass:'good', outcome:'All into index fund' },
      { key:'B', label:'Keep as cash buffer',  cashChange:20000,                     outcomeClass:'good', outcome:'Strong emergency fund' },
      { key:'C', label:'Split 50/50',          cashChange:20000, investInIndex:10000, outcomeClass:'good', outcome:'$10k invested, $10k cash' },
    ],
  },
  {
    id:'tax_refund', icon:'📊',
    title:'Tax refund — $2,400!',
    desc:'The government sent money back. Use it wisely.',
    choices:[
      { key:'A', label:'Invest it all',    cashChange:2400, investInIndex:2400, outcomeClass:'good',    outcome:'Boosted your portfolio!' },
      { key:'B', label:'Add to savings',   cashChange:2400,                     outcomeClass:'good',    outcome:'Cash cushion grows' },
      { key:'C', label:'Treat yourself',   cashChange:1200,                     outcomeClass:'neutral', outcome:'Half saved, half enjoyed' },
    ],
  },
  {
    id:'friend_loan', icon:'💸',
    title:'Friend needs $10,000 loan (3 yrs)',
    desc:"Your buddy is in a tight spot. They'll return it in 3 years.",
    choices:[
      { key:'A', label:'Lend it!',              lend:10000, outcomeClass:'neutral', outcome:'Money locked for 3 years' },
      { key:'B', label:'Offer $2,000 instead',  lend:2000,  outcomeClass:'neutral', outcome:'Less exposure, still friendly' },
      { key:'C', label:'Decline politely',       outcomeClass:'neutral',             outcome:'Kept your money' },
    ],
  },
  {
    id:'hot_tip', icon:'🎰',
    title:'"This crypto will 10x!" — $10,000?',
    desc:"Your cousin swears this is legitimate. The odds are not in your favor.",
    choices:[
      { key:'A', label:'GO ALL IN 🎲',          gamble:10000, outcomeClass:'bad',     outcome:'30% win 10×, 70% lose 80%' },
      { key:'B', label:'Small bet ($2k)',        gamble:2000,  outcomeClass:'neutral', outcome:'30% win 10×, 70% lose 80%' },
      { key:'C', label:'Pass — sounds sketchy',  outcomeClass:'good',                 outcome:'Smart move' },
    ],
  },
  {
    id:'new_baby', icon:'👶',
    title:'New baby — +$800/mo expenses!',
    desc:'Congratulations? Your monthly expenses just jumped.',
    choices:[
      { key:'A', label:'Adjust budget, stay course', expenseAddMonthly:800, outcomeClass:'neutral', outcome:'+$800/mo expenses permanently' },
      { key:'B', label:'Start a side hustle',        expenseAddMonthly:800, outcomeClass:'neutral', outcome:'+$800/mo — consider a side hustle' },
    ],
  },
  {
    id:'rent_hike', icon:'🏘️',
    title:'Landlord raises rent — +$300/mo!',
    desc:'Notice arrived. Effective next month.',
    choices:[
      { key:'A', label:'Accept the hike',               rentHikeMonthly:300, outcomeClass:'bad',     outcome:'+$300/mo rent permanently' },
      { key:'B', label:'Get a roommate (+$150 only)',   rentHikeMonthly:150, outcomeClass:'neutral', outcome:'+$150/mo (roommate splits)' },
      { key:'C', label:'Move (one-time $1,500 cost)',   cashChange:-1500,    outcomeClass:'neutral', outcome:'Moving costs but no rent hike' },
    ],
  },
  {
    id:'crypto_surge', icon:'🪙',
    title:'Crypto surges 60% this year!',
    desc:'The market went wild. Your crypto is printing.',
    choices:[
      { key:'A', label:'Take profits (sell all)', sellAllInvestments:true, outcomeClass:'good',    outcome:'Locked in gains' },
      { key:'B', label:'Hold for more',           outcomeClass:'neutral',                           outcome:'Riding the wave' },
    ],
  },
  {
    id:'crypto_unlock', icon:'🔓',
    title:'Crypto market now accessible!',
    desc:'Year 10 milestone: Bitcoin, Ethereum, Solana, and Dogecoin are now available.',
    choices:[
      { key:'A', label:"Let's go!", outcomeClass:'good', outcome:'Crypto section unlocked' },
    ],
  },
]

export const ACHIEVEMENTS = [
  { id:'first5k',   threshold:5000,    text:'💰 First $5,000 net worth!' },
  { id:'ten',       threshold:10000,   text:'🔥 $10k milestone!' },
  { id:'twenty',    threshold:20000,   text:'📈 $20k net worth!' },
  { id:'fifty',     threshold:50000,   text:'🚀 $50k club!' },
  { id:'hundred',   threshold:100000,  text:'💎 Six figures!' },
  { id:'twofifty',  threshold:250000,  text:'🌟 Quarter million!' },
  { id:'million',   threshold:1000000, text:'🏆 Millionaire!' },
]

export const CODEX_ENTRIES = [
  { id:'compound_interest', title:'Compound Interest',   explanation:'Earning interest on your interest. The longer you invest, the more powerful it becomes.', gameTip:'Start investing in Year 1. Even $1,000 at 7% becomes $3,870 after 20 years.', defaultUnlocked:true  },
  { id:'net_worth',         title:'Net Worth Formula',   explanation:'Cash + Investments + Assets − Debts. This is the real score.', gameTip:'Watch your net worth trend, not just your cash. Investments compound silently.', defaultUnlocked:true  },
  { id:'emergency_fund',    title:'Emergency Fund',      explanation:'3–6 months of living expenses kept liquid for unexpected costs.', gameTip:'Keep $3k+ in cash. Without it, one event card can spiral into debt.', defaultUnlocked:true  },
  { id:'budget',            title:'Budget: 50/30/20',    explanation:'50% needs, 30% wants, 20% savings. A practical starting framework.', gameTip:'Your monthly net flow tells you exactly how much you can invest each year.', defaultUnlocked:true  },
  { id:'index_fund',        title:'Index Funds',         explanation:'Diversified funds tracking market indices. Low cost, historically 7–10%/year returns.', gameTip:"The computer opponent puts everything into index funds — and it works.", defaultUnlocked:false },
  { id:'debt_interest',     title:'Debt Interest (APR)', explanation:'18% APR means your debt doubles every 4 years if unpaid.', gameTip:'Pay off high-interest debt before investing. The math always favors this.', defaultUnlocked:false },
  { id:'diversification',   title:'Diversification',     explanation:'Spreading investments across asset classes to reduce risk.', gameTip:"Don't put everything in crypto. Index + real estate + some stocks is resilient.", defaultUnlocked:false },
  { id:'dollar_cost_avg',   title:'Dollar-Cost Averaging', explanation:'Investing fixed amounts regularly regardless of market price.', gameTip:'Invest every year regardless of market events — it smooths out volatility.', defaultUnlocked:false },
  { id:'liquidity',         title:'Liquidity',           explanation:'How quickly an asset can convert to cash. Stocks: instant. Real estate: months.', gameTip:'Keep liquid assets to handle emergencies without selling at a loss.', defaultUnlocked:false },
  { id:'real_estate',       title:'Real Estate',         explanation:'Property generates rental income and appreciates over time. Less liquid than stocks.', gameTip:'Unlocks at year 7. Steady 6%/year with low variance — great long-term hold.', defaultUnlocked:false },
  { id:'stock_market',      title:'Individual Stocks',   explanation:'Shares of specific companies. High variance — can soar or crash 30%+ in a year.', gameTip:'Diversify across multiple stocks. Single stock bets are lottery tickets.', defaultUnlocked:false },
  { id:'crypto',            title:'Cryptocurrency',      explanation:'Digital assets with extreme volatility. High risk, high potential reward.', gameTip:'Only invest what you can afford to lose entirely. Crypto can go to zero.', defaultUnlocked:false },
  { id:'inflation',         title:'Inflation',           explanation:'Your cash loses ~3–7% purchasing power per year. Invest to stay ahead.', gameTip:'Holding large cash balances long-term is a slow loss. Invest the surplus.', defaultUnlocked:false },
  { id:'opportunity_cost',  title:'Opportunity Cost',    explanation:"Every choice has an implicit cost: the best alternative you didn't take.", gameTip:'Cash sitting idle could be compounding in an index fund.', defaultUnlocked:false },
  { id:'risk_reward',       title:'Risk vs Reward',      explanation:'Higher returns always come with higher risk. There is no free lunch.', gameTip:'Match your risk to your time horizon. More years = can afford more risk.', defaultUnlocked:false },
  { id:'passive_income',    title:'Passive Income',      explanation:'Income earned with minimal active work — dividends, rent, interest.', gameTip:'Side hustles and investments create income streams that compound.', defaultUnlocked:false },
  { id:'debt_snowball',     title:'Debt Snowball',        explanation:'Pay smallest debts first for psychological momentum.', gameTip:'Mathematically, pay highest-interest debt first. Always pay loans before investing.', defaultUnlocked:false },
  { id:'asset_allocation',  title:'Asset Allocation',    explanation:'The mix of stocks, bonds, real estate, and cash in your portfolio.', gameTip:'Younger players can take more risk. Adjust as you approach year 20.', defaultUnlocked:false },
  { id:'market_timing',     title:'Market Timing',       explanation:'Trying to predict when to buy/sell. Almost always fails.', gameTip:'Time in the market beats timing the market. Stay invested.', defaultUnlocked:false },
  { id:'salary_nego',       title:'Salary Negotiation',  explanation:'Your starting salary compounds through raises. Negotiating up front is powerful.', gameTip:'A $10k salary difference grows to $500k+ over a career.', defaultUnlocked:false },
  { id:'lifestyle_creep',   title:'Lifestyle Creep',     explanation:'Spending more as you earn more, preventing wealth building.', gameTip:'When income rises, invest the difference. Don\'t upgrade your lifestyle.', defaultUnlocked:false },
  { id:'side_hustle',       title:'Side Hustles',        explanation:'Extra income streams outside your main job. Scalable, often passive over time.', gameTip:'Content creator income grows 3× over 3 years. Start early.', defaultUnlocked:false },
  { id:'car_depreciation',  title:'Depreciation',        explanation:'Cars lose 10–15% of value per year. They\'re expenses, not investments.', gameTip:'The computer only buys a car when it has to. Keep investing instead.', defaultUnlocked:false },
  { id:'fin_literacy',      title:'Financial Literacy',  explanation:'Understanding money concepts is the foundation of building wealth.', gameTip:"You just played Broke U. You're already ahead of most people.", defaultUnlocked:false },
]

export function calcNetWorth(s: GameState): number {
  const stockValue  = STOCK_IDS.reduce( (sum,id) => sum + s.stockHeld[id]  * s.stockPrices[id],  0)
  const cryptoValue = CRYPTO_IDS.reduce((sum,id) => sum + s.cryptoHeld[id] * s.cryptoPrices[id], 0)
  const investments = s.bankValue + s.indexValue + s.realEstateValue + s.cryptoPoolValue + stockValue + cryptoValue
  const assets      = s.carOwned ? s.carValue : 0
  const debts       = s.loanDebt + s.tuitionRemaining
  return s.cash + investments + assets - debts
}

export function calcCompNetWorth(s: GameState): number {
  return s.compCash + s.compIndexValue + (s.compCarOwned ? s.compCarValue : 0) - Math.max(0, s.compTuitionRemaining)
}

export function getSideHustleAnnualIncome(s: GameState): number {
  let total = 0
  for (const h of SIDE_HUSTLES) {
    if (!s.activeSideHustles.includes(h.id)) continue
    const yearsActive = s.sideHustleYearsActive[h.id] ?? 0
    if ('growthYears' in h && h.growthYears) {
      total += h.annualIncome * Math.min(4, 1 + yearsActive)
    } else {
      total += h.annualIncome
    }
  }
  return total
}

export function getMonthlyFlow(s: GameState) {
  const effectiveSalary = s.salary * s.salaryMultiplier
  const incomeMo      = effectiveSalary / 12
  const hustleMo      = getSideHustleAnnualIncome(s) / 12
  const rentMo        = s.rent + s.rentExtra
  const expensesMo    = s.monthlyExpenses + s.expensesExtra
  const tuitionMo     = s.tuitionRemaining > 0 ? Math.min(s.tuitionRemaining, 1000) / 12 : 0
  const loanInterestMo= s.loanDebt > 0 ? (s.loanDebt * 0.18) / 12 : 0
  const netMo         = incomeMo + hustleMo - rentMo - expensesMo - tuitionMo - loanInterestMo
  return { incomeMo, hustleMo, rentMo, expensesMo, tuitionMo, loanInterestMo, netMo }
}
