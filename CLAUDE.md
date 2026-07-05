# StockExchange-Dashboard — Live Trading Dashboard

## Overview
React 19 + Vite 5 SPA. Real-time monitoring dashboard for the Antigravity AI trading system. Shows live telemetry, stock database, missed movers, trade history, and Angel One brokerage integration.

## Connection
- **Backend**: StockExchange-AI API at `http://localhost:3000` (from `VITE_API_URL` in `.env`)
- **Port**: `5173` (dev)
- **WebSocket**: Socket.IO to backend for real-time log streaming

## Tech Stack
- React 19, Vite 5, Tailwind CSS 3, React Router 7, Recharts 3, Lucide React, Socket.IO Client, Framer Motion, date-fns

## Pages & Routes
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Live feed — real-time pipeline status + terminal log viewer |
| `/stocks` | Stocks | Searchable stock database with scores, prices, volume |
| `/stocks/:symbol` | StockDetail | Deep-dive: scores, chart, filings, news, trade overlays |
| `/movers` | Movers | Missed movers (continuation scoring) + early movers scans |
| `/alerts` | Alpha Performance Hub | Historical alerts with max gain tracking |
| `/simulation` | Alpha Simulator | Rewind to past trading days |
| `/trades` | Trade History | P&L summaries, MFE tracking, exit reasons |
| `/angel-one` | AngelOne | Brokerage connection, credentials, orders, positions |

## Key Source Files
```
src/lib/api.js          # API helper with JWT auth
src/App.jsx             # Root: auth gating, WebSocket, sidebar, routing
src/pages/Home.jsx      # Live telemetry dashboard
src/pages/Stocks.jsx    # Stock database browser
src/pages/StockDetail.jsx # Stock detail page (613 lines)
src/pages/Movers.jsx    # Missed + early movers (739 lines)
src/pages/Alerts.jsx    # Performance hub
src/pages/Trades.jsx    # Trade history
src/pages/AngelOne.jsx  # Angel One integration (561 lines)
src/components/DataTable.jsx   # Reusable table with search/pagination
src/components/LiveMonitor.jsx # Real-time log viewer
src/components/StockPriceChart.jsx # Recharts price chart with trade overlays
```

## API Endpoints Consumed
- `GET /api/stocks`, `GET /api/stocks/:symbol`, `GET /api/stocks/:symbol/chart`
- `GET /api/early-movers`
- `GET /api/movers/candidates`, `GET /api/movers/candidates/summary`
- `GET /api/performance/top-alerts`, `GET /api/performance/simulation`
- `GET /api/trades`
- `GET /api/angelone/status`, `/credentials`, `/connect`, `/budget`, `/strategies`, `/orders`, `/positions`, `/trades`
