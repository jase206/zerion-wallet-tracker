# Zerion Wallet Tracker

A command-line interface (CLI) tool for tracking cryptocurrency portfolio value, PnL (profit and loss), top fungible positions, recent transactions, and NFT holdings across multiple wallets using the [Zerion API](https://developers.zerion.io).

## Features

- 📊 **Portfolio Overview** — Total portfolio value and 24-hour changes
- 💰 **PnL Tracking** — Total, realized, and unrealized gains/losses
- 🔝 **Top Positions** — View your largest cryptocurrency holdings
- 💸 **Transaction History** — Recent transactions with fees and status
- 🖼️ **NFT Portfolio** — Track NFT holdings by chain
- 👛 **Multi-Wallet Support** — Report on one or multiple wallets
- 🔗 **Wallet Sets** — Combined reports for up to 2 wallets (1 EVM + 1 Solana)

## Setup

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn
- A Zerion API key (get one at https://dashboard.zerion.io)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jase206/zerion-wallet-tracker.git
   cd zerion-wallet-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Add your Zerion API key to `.env`:
   ```
   ZERION_API_KEY=your_api_key_here
   ```

## Usage

### Report on Default Wallets

Edit the `DEFAULT_WALLETS` array in `index.js` with your wallet addresses, then run:

```bash
node index.js
```

### Report on a Single Wallet

```bash
node index.js 0xYourWalletAddress
```

### Report on Multiple Wallets

```bash
node index.js 0xAddress1 0xAddress2 0xAddress3
```

### Combined Wallet-Set Report

Get a combined report for up to 2 wallets (1 EVM + 1 Solana):

```bash
node index.js --set 0xAddress1 0xAddress2
```

## Example Output

```
=== 0xc8dd03992d684b32da71793965872566d25f75b7 ===
Total value: $12,345.67
24h change: $234.56 (1.90%)
  By chain:
    ethereum: $10,000.00
    polygon: $2,345.67

PnL — total: $5,000.00, realized: $2,500.00, unrealized: $2,500.00

Top positions:
  ETH: $8,000.00 (qty 2.5)
  USDC: $4,345.67 (qty 4345.67)
  WETH: $0.00 (qty 0)

Recent transactions (last 3):
  Jul 8, 2026, 2:30:45 PM — swap (confirmed), fee $15.00
    hash: 0xabc123...
  Jul 7, 2026, 1:15:22 PM — transfer (confirmed)
    hash: 0xdef456...
  Jul 6, 2026, 11:45:00 AM — approval (confirmed)
    hash: 0x789ghi...

NFT portfolio value: $2,500.00
```

## API Parameters

The client supports many Zerion API parameters. Common options:

- `currency` — Display currency (default: `usd`)
- `chainIds` — Filter by specific blockchain(s)
- `positionsFilter` — Filter positions (`no_filter`, `only_simple`, etc.)
- `sort` — Sort field for positions (e.g., `-value` for descending)
- `pageSize` — Pagination size for transactions

See the code comments for full parameter documentation.

## Troubleshooting

### Missing ZERION_API_KEY

Ensure your `.env` file exists and contains a valid API key from https://dashboard.zerion.io.

### 503 Errors on Fresh Addresses

Zerion may return a 503 when indexing a newly-seen wallet address. Wait a few moments and retry.

### 202 Responses for NFT Portfolio

NFT indexing is still in progress. Try again in a few moments.

## License

MIT — See LICENSE file for details

## Support

For issues or questions:
- Check the [Zerion API docs](https://developers.zerion.io)
- Open an issue on GitHub

## Author

**Shehan Peiris** — [@jase206](https://github.com/jase206)
