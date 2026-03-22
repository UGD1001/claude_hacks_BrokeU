"""
fetch_max_history.py
────────────────────
Pulls the maximum available free historical data for ~500 tickers.
  • Primary source : yfinance  (daily bars, back to IPO / ~1962 for old names)
  • Fallback source: Stooq    (via pandas-datareader, good for pre-2000 gaps)
  • Output         : one Parquet per ticker  →  tradata/<TICK>_monthly.parquet
  • Columns saved  : open, high, low, close, volume  (OHLCV, monthly resampled)

Run once, re-run safely (skips tickers already on disk).
Install deps:
    pip install yfinance pandas pandas-datareader pyarrow fastparquet
"""

import os
import time
import warnings
import pandas as pd
import yfinance as yf

warnings.filterwarnings("ignore")

# ── Output ────────────────────────────────────────────────────────────────────
OUTPUT_DIR   = "tradata"
MIN_YEARS    = 5          # flag tickers with less history than this
RETRY_SLEEP  = 2          # seconds between yfinance retries
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Master ticker list (~500, deduplicated) ───────────────────────────────────
TICKERS = sorted(set([
    # ETFs / broad market
    "SPY", "QQQ", "DIA", "IWM", "VXX", "GLD", "SLV", "TLT", "HYG", "LQD",
    "XLF", "XLK", "XLV", "XLE", "XLY", "XLI", "XLB", "XLP", "XLU", "XLRE",
    "VTI", "VEA", "VWO", "EFA", "EEM", "AGG", "BND", "VNQ",

    # Mega-cap tech
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "GOOG", "AVGO",
    "TSLA", "ORCL", "CRM", "ADBE", "INTC", "AMD", "QCOM", "TXN",
    "CSCO", "IBM", "ACN", "INTU", "NOW", "PLTR", "COIN", "MSTR",

    # Semis
    "ASML", "MU", "LRCX", "AMAT", "KLAC", "NXPI", "MRVL", "MCHP",
    "MPWR", "ADI", "STX", "WDC", "ARM",

    # Fintech / Finance
    "V", "MA", "JPM", "BAC", "GS", "MS", "WFC", "C", "BRK-B",
    "AXP", "COF", "DFS", "SPGI", "MCO", "BK", "STT", "TROW",
    "AMP", "SYF", "RJF", "HOOD", "SQ", "AFRM", "UPST",

    # Healthcare / Pharma
    "UNH", "LLY", "JNJ", "PFE", "ABBV", "MRK", "TMO", "ABT",
    "DHR", "BMY", "AMGN", "GILD", "REGN", "VRTX", "ISRG", "SYK",
    "BSX", "MDT", "BDX", "EW", "HCA", "ZTS", "BIIB", "ALNY", "INSM",
    "IDXX", "DXCM",

    # Consumer discretionary
    "WMT", "COST", "HD", "LOW", "TGT", "BKNG", "ABNB",
    "EXPE", "SBUX", "MCD", "YUM", "CMG", "DPZ", "NKE", "ULTA",
    "ROST", "TJX", "ORLY", "AZO", "TSCO", "BBY", "CVNA",

    # Media / Streaming
    "NFLX", "DIS", "CMCSA", "WBD", "ROKU", "SNAP", "PINS", "SPOT",
    "APP", "DASH", "UBER", "LYFT",

    # Cloud / SaaS
    "SHOP", "MELI", "CRWD", "PANW", "FTNT", "ZS", "NET", "DDOG",
    "SNOW", "TEAM", "WDAY", "ADSK", "VRSK", "DOCU", "ZM",

    # Energy
    "XOM", "CVX", "COP", "EOG", "SLB", "BKR", "VLO", "MPC",
    "PSX", "OXY", "FANG", "CEG",

    # Industrials / Materials
    "HON", "GE", "CAT", "DE", "LMT", "RTX", "GD", "UPS", "FDX",
    "UNP", "NSC", "EMR", "ETN", "PH", "ITW", "ROP", "FAST", "PAYX",
    "CPRT", "ODFL", "PCAR", "CTAS", "NUE", "STLD", "FCX", "NEM",
    "ALB", "MLM", "VMC", "DD", "DOW", "LIN", "APD", "ECL",
    "IP", "CF", "MOS", "FMC", "CTVA",

    # Telecom / Utilities
    "TMUS", "VZ", "T", "CHTR",
    "NEE", "D", "AEP", "EXC", "SRE",

    # REITs
    "PLD", "AMT", "PSA", "O", "WELL", "AVB", "EQR",

    # Insurance
    "PGR", "TRV", "ALL", "AIG", "MET", "PRU", "CB", "AJG", "AON", "MMC",

    # Consumer staples / Food
    "PG", "KO", "PEP", "PM", "MO", "KMB", "CL", "MDLZ", "KHC",
    "KDP", "MNST", "GIS", "HSY", "CPB", "CAG", "SJM", "MKC",

    # Travel / Leisure
    "MAR", "HLT", "MGM", "WYNN", "LVS", "CZR",
    "RCL", "CCL", "NCLH",
    "DAL", "UAL", "AAL", "LUV", "ALK",

    # Homebuilders
    "DHI", "LEN", "PHM", "NVR", "TOL",

    # Classic blue chips (deep history, back to 1960s on yfinance)
    "T", "GE", "F", "GM", "BA", "MMM", "CAT", "DD", "XOM",
    "CVX", "JPM", "WFC", "BAC", "C", "MRK", "PFE", "JNJ",
    "KO", "PEP", "PG", "WMT", "HD", "MCD", "DIS", "IBM",

    # High-interest / meme / crypto-adjacent
    "DKNG", "PTON", "SOFI", "PDD",
]))

# Note: yfinance uses BRK-B (dash), not BRK.B or BRK/B
# ─────────────────────────────────────────────────────────────────────────────

def resample_to_monthly(df: pd.DataFrame) -> pd.DataFrame:
    """Resample daily OHLCV bars to monthly (last trading day of month)."""
    df = df.copy()
    # yfinance MultiIndex fix: flatten if needed
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.columns = [c.lower() for c in df.columns]
    df.index = pd.to_datetime(df.index)
    monthly = df.resample("ME").agg({          # ME = month-end
        "open"  : "first",
        "high"  : "max",
        "low"   : "min",
        "close" : "last",
        "volume": "sum",
    }).dropna(subset=["close"])
    return monthly


def fetch_yfinance(ticker: str) -> pd.DataFrame | None:
    """Download full history from yfinance, return monthly df or None."""
    try:
        df = yf.download(
            ticker,
            start="1960-01-01",
            auto_adjust=True,
            progress=False,
            threads=False,
        )
        if df is None or df.empty:
            return None
        return resample_to_monthly(df)
    except Exception as e:
        print(f"  yfinance error: {e}")
        return None


def fetch_stooq(ticker: str) -> pd.DataFrame | None:
    """Fallback: pull from Stooq via pandas-datareader."""
    try:
        import pandas_datareader.data as web
        # Stooq uses uppercase tickers, US stocks get .US suffix
        stooq_sym = ticker.replace("-", ".") + ".US"
        df = web.DataReader(stooq_sym, "stooq", start="1960-01-01")
        if df is None or df.empty:
            return None
        df = df.sort_index()
        return resample_to_monthly(df)
    except Exception as e:
        print(f"  Stooq error: {e}")
        return None


# ── Main fetch loop ───────────────────────────────────────────────────────────
short_history = []   # tickers with < MIN_YEARS of data
failed        = []   # tickers with no data at all

for i, tick in enumerate(TICKERS, 1):
    safe_name = tick.replace("/", "_").replace(".", "_")
    out_path  = os.path.join(OUTPUT_DIR, f"{safe_name}_monthly.parquet")

    if os.path.exists(out_path):
        print(f"[{i:3d}/{len(TICKERS)}] {tick:10s}  SKIP")
        continue

    print(f"[{i:3d}/{len(TICKERS)}] {tick:10s}  ", end="", flush=True)

    # ── 1. Try yfinance ───────────────────────────────────────────────────────
    monthly = fetch_yfinance(tick)

    # ── 2. Fallback to Stooq if yfinance returned nothing ────────────────────
    if monthly is None or monthly.empty:
        print("yf empty → trying Stooq ...", end=" ", flush=True)
        time.sleep(RETRY_SLEEP)
        monthly = fetch_stooq(tick)

    # ── 3. Evaluate & save ────────────────────────────────────────────────────
    if monthly is None or monthly.empty:
        print("NO DATA")
        failed.append(tick)
        continue

    years = (monthly.index[-1] - monthly.index[0]).days / 365.25
    rows  = len(monthly)

    monthly.to_parquet(out_path, engine="pyarrow")

    flag = "⚠ SHORT" if years < MIN_YEARS else "OK"
    print(f"{flag:8s}  {rows:4d} months  ({monthly.index[0].year}–{monthly.index[-1].year})")

    if years < MIN_YEARS:
        short_history.append((tick, round(years, 1)))

    time.sleep(0.3)   # be polite to yfinance rate limits

# ── Summary ───────────────────────────────────────────────────────────────────
saved = len(TICKERS) - len(failed) - sum(
    1 for t, _ in short_history if t not in failed
)
print(f"\n{'─'*60}")
print(f"✓  Saved          : {len(TICKERS) - len(failed)} / {len(TICKERS)} tickers")
print(f"⚠  Short history  : {len(short_history)} tickers (< {MIN_YEARS} yrs)")
if short_history:
    for t, y in short_history:
        print(f"     {t:10s}  {y} years")
print(f"✗  No data        : {len(failed)} tickers")
if failed:
    print(f"     {failed}")