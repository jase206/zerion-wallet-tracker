# coinbase-coin-dashboard

A Coinbase coin price dashboard and price-history collector.

Features
- Polls Coinbase public spot prices (BTC-USD, ETH-USD) and stores history in SQLite
- Flask REST API for current & historical prices, portfolio, and alerts
- Minimal React dashboard to view the latest price and history
- Docker + docker-compose for local deployment
- MIT license (copyright © 2026 jase206)

Quickstart (Docker)
1. Copy `.env.example` -> `.env` and edit if needed.
2. docker-compose up --build
3. Backend API: http://localhost:5000/api/
4. Frontend: http://localhost:3000

Quickstart (dev)
Backend:
1. python -m venv .venv
2. source .venv/bin/activate
3. pip install -r requirements.txt
4. export FLASK_APP=backend.app
5. flask init-db
6. flask run

Frontend:
1. cd frontend
2. npm install
3. npm start

Notes
- Do not commit secrets. For authenticated Coinbase features add keys to environment and never push them.
