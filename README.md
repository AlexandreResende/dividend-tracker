# Dividend Tracker

A Node.js CLI that fetches dividend data for Brazilian stocks (B3/Bovespa) and generates an HTML report with your projected earnings based on the number of shares you own.

## Features

- Fetches dividend history and current price via **Yahoo Finance**
- Filters dividends from your purchase date onward
- Calculates **total dividends to receive** and **total received in the current year** per ticker and overall
- Generates a **styled HTML report** that opens automatically in the browser
- Runs daily on a **cron schedule** (weekdays at 1pm BRT)

## Requirements

- Node.js 18+
- npm

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your tickers, quantities, and purchase date:

```env
# Comma-separated list of B3 tickers with quantity owned (TICKER:QUANTITY)
TICKERS=PETR4:100,VALE3:200,ITUB4:150

# Date you bought the stocks — only dividends from this date onward will be shown
PURCHASE_DATE=2026-06-01
```

## Usage

```bash
npm start
```

This fetches dividend data for all configured tickers and opens `report.html` in your default browser.

## Report

The generated HTML report includes:

- **Summary bar** — total dividends to receive across all tickers, and total received in the current year
- **Per-ticker cards** — quantity owned, current price, dividend yield, year total, and a full dividend history table since the purchase date

![Report screenshot placeholder](https://via.placeholder.com/960x400?text=Dividend+Tracker+Report)

## Cron Job

The project is configured to run automatically every weekday at **1pm BRT**. The cron entry uses `TZ=America/Sao_Paulo` so no UTC conversion is needed:

```
TZ=America/Sao_paulo
0 13 * * 1-5 /opt/homebrew/bin/npm start >> /path/to/dividend-tracker/cron.log 2>&1
```

To set it up on a new machine:

```bash
crontab -e
```

Then add the lines above, adjusting the path to `npm` (`which npm`) and the project directory.

Logs are written to `cron.log` in the project root.

## Project Structure

```
dividend-tracker/
├── src/
│   ├── index.js          # Entry point — reads .env, orchestrates the run, opens report
│   ├── fetchDividends.js # Fetches price and dividend history from Yahoo Finance
│   └── generateHtml.js   # Builds the styled HTML report
├── .env                  # Your local config (gitignored)
├── .env.example          # Config template
├── report.html           # Generated report (gitignored)
└── cron.log              # Cron execution log (gitignored)
```

## Data Source

Dividend and pricing data is sourced from **Yahoo Finance** via the [`yahoo-finance2`](https://github.com/gadicc/node-yahoo-finance2) package. Brazilian stocks use the `.SA` suffix internally (e.g. `PETR4` → `PETR4.SA`).
