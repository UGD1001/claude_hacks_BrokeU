"""
parquet_to_json.py
──────────────────
Reads all *_monthly.parquet files from tradata/ and produces a single
historicalData.json shaped as:

    {
      "1962-01": { "AAPL": null, "KO": 2.14, "IBM": 8.33, ... },
      "1962-02": { "AAPL": null, "KO": 2.20, "IBM": 8.41, ... },
      ...
      "2024-12": { "AAPL": 254.49, "KO": 61.20, "IBM": 204.11, ... }
    }

Rules:
  - close price only, rounded to 2 decimal places
  - fill-forward within each ticker (carry last known price forward)
  - if a ticker has no data yet for that month → null
  - output written to src/data/historicalData.json (create dir if needed)

Run:
    python parquet_to_json.py
"""

import os
import json
import pandas as pd
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
INPUT_DIR   = "tradata"
OUTPUT_PATH = os.path.join("fixedata", "historicalData.json")

# ── Load all parquet files ────────────────────────────────────────────────────
input_path = Path(INPUT_DIR)
parquet_files = sorted(input_path.glob("*_monthly.parquet"))

if not parquet_files:
    print(f"No parquet files found in '{INPUT_DIR}'. Run fetch_max_history.py first.")
    exit(1)

print(f"Found {len(parquet_files)} parquet files. Loading...")

frames = {}
for fpath in parquet_files:
    # Extract ticker name from filename: "AAPL_monthly.parquet" → "AAPL"
    tick = fpath.stem.replace("_monthly", "")
    try:
        df = pd.read_parquet(fpath, engine="pyarrow", columns=["close"])
        df.index = pd.to_datetime(df.index)

        # ── FIX: strip timezone first, then normalize to month-start ─────────
        if df.index.tz is not None:
            df.index = df.index.tz_localize(None)
        df.index = df.index.to_period("M").to_timestamp()   # first day of month
        # ─────────────────────────────────────────────────────────────────────

        df = df[~df.index.duplicated(keep="last")]
        frames[tick] = df["close"].rename(tick)
    except Exception as e:
        print(f"  ⚠ Skipping {tick}: {e}")

print(f"Loaded {len(frames)} tickers successfully.")

# ── Build a single combined DataFrame ─────────────────────────────────────────
# Rows = every month from the earliest date across all tickers to latest
combined = pd.concat(frames.values(), axis=1)  # aligns on index automatically

# Full monthly date range (fill any gaps in the index itself)
full_range = pd.date_range(
    start=combined.index.min(),
    end=combined.index.max(),
    freq="MS"  # Month Start
)
combined = combined.reindex(full_range)

# Sort columns alphabetically for consistent output
combined = combined.sort_index(axis=1)

# ── Fill forward within each ticker ──────────────────────────────────────────
# ffill carries the last known price forward month by month
# NaN before a ticker's IPO stays NaN (→ null in JSON)
combined = combined.ffill()

print(f"Date range : {combined.index[0].strftime('%Y-%m')} → {combined.index[-1].strftime('%Y-%m')}")
print(f"Months     : {len(combined)}")
print(f"Tickers    : {len(combined.columns)}")

# ── Convert to nested dict keyed by "YYYY-MM" ─────────────────────────────────
print("Building JSON structure...")

output = {}
for dt, row in combined.iterrows():
    key = dt.strftime("%Y-%m")
    # Round to 2dp; convert NaN → None (→ null in JSON)
    output[key] = {
        ticker: (round(float(val), 2) if pd.notna(val) else None)
        for ticker, val in row.items()
    }

# ── Write output ──────────────────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

print(f"Writing to {OUTPUT_PATH} ...")
with open(OUTPUT_PATH, "w") as f:
    json.dump(output, f, separators=(",", ":"))  # compact, no whitespace

size_mb = os.path.getsize(OUTPUT_PATH) / 1_000_000
print(f"\n✓ Done!")
print(f"  File     : {OUTPUT_PATH}")
print(f"  Size     : {size_mb:.2f} MB")
print(f"  Months   : {len(output)}")
print(f"  Tickers  : {len(combined.columns)}")
print(f"  First key: {next(iter(output))}")
print(f"  Last key : {list(output.keys())[-1]}")
print(f"\nSample (last month):")
last = list(output.values())[-1]
sample = {k: v for k, v in list(last.items())[:8]}
print(f"  {sample}")