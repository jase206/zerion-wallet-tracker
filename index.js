#!/usr/bin/env node
/**
 * Zerion Wallet Tracker — single-file version
 * --------------------------------------------
 * Reports portfolio value, PnL, top fungible positions, recent transactions,
 * and NFT holdings for one or more wallet addresses using the Zerion API.
 *
 * Setup:
 *   1. npm install dotenv
 *   2. Get an API key from https://dashboard.zerion.io
 *   3. Create a .env file in the same folder with:
 *        ZERION_API_KEY=your_key_here
 *
 * Usage:
 *   node index.js                        # report on the default wallets below
 *   node index.js 0xYourAddress          # report on a single address
 *   node index.js 0xAddr1 0xAddr2        # report on multiple addresses
 *   node index.js --set 0xAddr1 0xAddr2  # combined wallet-set report (max 1 EVM + 1 Solana)
 */

import 'dotenv/config';

const API_BASE = 'https://api.zerion.io/v1';
const API_KEY = process.env.ZERION_API_KEY;

if (!API_KEY) {
  console.error('Missing ZERION_API_KEY. Create a .env file with ZERION_API_KEY=your_key_here');
  process.exit(1);
}

// Edit these, or pass address(es) on the command line.
const DEFAULT_WALLETS = [
  '0xc8dd03992d684b32da71793965872566d25f75b7', // Base Account
  '0xc8c3af949c54908e008eef2e06a3f28d8aee5690', // Secondary wallet
];

// ---------------------------------------------------------------------------
// Zerion API client
// ---------------------------------------------------------------------------

function buildAuthHeader(apiKey) {
  return 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
}

class ZerionClient {
  constructor(apiKey) {
    if (!apiKey) throw new Error('ZerionClient requires an API key');
    this.authHeader = buildAuthHeader(apiKey);
  }

  async _get(path, params = {}, headers = {}) {
    const url = new URL(`${API_BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value);
    }

    const res = await fetch(url, {
      headers: { Authorization: this.authHeader, ...headers },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`Zerion API error ${res.status} for ${url}: ${body}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  // ---------- Wallets ----------

  /** GET /v1/wallets/{address}/portfolio */
  getPortfolio(address, { currency = 'usd', positionsFilter = 'no_filter', sync = false } = {}) {
    return this._get(`/wallets/${address}/portfolio`, {
      currency,
      'filter[positions]': positionsFilter,
      sync,
    });
  }

  /** GET /v1/wallets/{address}/pnl */
  getPnl(address, { currency = 'usd', chainIds, since, till } = {}) {
    return this._get(`/wallets/${address}/pnl`, {
      currency,
      'filter[chain_ids]': chainIds,
      since,
      till,
    });
  }

  /** GET /v1/wallets/{address}/charts/{period} */
  getBalanceChart(address, period = 'month', { currency = 'usd', positionsFilter = 'only_simple', chainIds } = {}) {
    return this._get(`/wallets/${address}/charts/${period}`, {
      currency,
      'filter[positions]': positionsFilter,
      'filter[chain_ids]': chainIds,
    });
  }

  /** GET /v1/wallets/{address}/positions/ */
  getFungiblePositions(address, {
    currency = 'usd',
    positionsFilter = 'no_filter',
    chainIds,
    positionTypes,
    trash = 'only_non_trash',
    sort = 'value',
  } = {}) {
    return this._get(`/wallets/${address}/positions/`, {
      currency,
      'filter[positions]': positionsFilter,
      'filter[chain_ids]': chainIds,
      'filter[position_types]': positionTypes,
      'filter[trash]': trash,
      sort,
    });
  }

  /** GET /v1/wallets/{address}/nft-positions/ */
  getNftPositions(address, { currency = 'usd', chainIds, sort, testnet = false } = {}) {
    return this._get(
      `/wallets/${address}/nft-positions/`,
      { currency, 'filter[chain_ids]': chainIds, sort },
      testnet ? { 'X-Env': 'testnet' } : {},
    );
  }

  /** GET /v1/wallets/{address}/nft-collections/ */
  getNftCollections(address, { currency = 'usd', chainIds, sort, testnet = false } = {}) {
    return this._get(
      `/wallets/${address}/nft-collections/`,
      { currency, 'filter[chain_ids]': chainIds, sort },
      testnet ? { 'X-Env': 'testnet' } : {},
    );
  }

  /** GET /v1/wallets/{address}/nft-portfolio */
  getNftPortfolio(address, { currency = 'usd', testnet = false } = {}) {
    return this._get(
      `/wallets/${address}/nft-portfolio`,
      { currency },
      testnet ? { 'X-Env': 'testnet' } : {},
    );
  }

  /** GET /v1/wallets/{address}/transactions/ */
  getTransactions(address, {
    currency = 'usd',
    chainIds,
    trash = 'only_non_trash',
    operationTypes,
    assetTypes,
    minedAtStart,
    minedAtEnd,
    pageSize,
    pageAfter,
    testnet = false,
  } = {}) {
    return this._get(
      `/wallets/${address}/transactions/`,
      {
        currency,
        'filter[chain_ids]': chainIds,
        'filter[trash]': trash,
        'filter[operation_types]': operationTypes,
        'filter[asset_types]': assetTypes,
        'filter[min_mined_at]': minedAtStart,
        'filter[max_mined_at]': minedAtEnd,
        'page[size]': pageSize,
        'page[after]': pageAfter,
      },
      testnet ? { 'X-Env': 'testnet' } : {},
    );
  }

  // ---------- Wallet sets (up to one EVM + one Solana address together) ----------

  /** GET /v1/wallet-sets/charts/{period} */
  getWalletSetBalanceChart(addresses, period = 'month', { currency = 'usd', positionsFilter = 'only_simple', chainIds } = {}) {
    return this._get(`/wallet-sets/charts/${period}`, {
      addresses,
      currency,
      'filter[positions]': positionsFilter,
      'filter[chain_ids]': chainIds,
    });
  }

  /** GET /v1/wallet-sets/positions/ */
  getWalletSetFungiblePositions(addresses, {
    currency = 'usd',
    positionsFilter = 'no_filter',
    chainIds,
    positionTypes,
    trash = 'only_non_trash',
    sort = 'value',
  } = {}) {
    return this._get(`/wallet-sets/positions/`, {
      addresses,
      currency,
      'filter[positions]': positionsFilter,
      'filter[chain_ids]': chainIds,
      'filter[position_types]': positionTypes,
      'filter[trash]': trash,
      sort,
    });
  }

  // ---------- Fungibles ----------

  /** GET /v1/fungibles/{fungible_id} */
  getFungible(fungibleId, { currency = 'usd' } = {}) {
    return this._get(`/fungibles/${fungibleId}`, { currency });
  }

  /** GET /v1/fungibles/ */
  searchFungibles(query, { currency = 'usd' } = {}) {
    return this._get(`/fungibles/`, { currency, 'filter[search_query]': query });
  }
}

const zerion = new ZerionClient(API_KEY);

// ---------------------------------------------------------------------------
// CLI report helpers
// ---------------------------------------------------------------------------

function formatUsd(n) {
  if (typeof n !== 'number') return 'n/a';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatTxTime(minedAt) {
  if (!minedAt) return 'unknown time';
  return new Date(minedAt).toLocaleString('en-US');
}

function printChainBreakdown(byChain = {}) {
  const chains = Object.entries(byChain).sort((a, b) => b[1] - a[1]);
  if (!chains.length) {
    console.log('  By chain: (no balances found)');
    return;
  }
  console.log('  By chain:');
  for (const [chain, value] of chains) {
    console.log(`    ${chain}: ${formatUsd(value)}`);
  }
}

async function reportPortfolio(address) {
  try {
    const { data } = await zerion.getPortfolio(address);
    const a = data.attributes;
    console.log(`Total value: ${formatUsd(a.total?.positions)}`);
    console.log(`24h change: ${formatUsd(a.changes?.absolute_1d)} (${a.changes?.percent_1d?.toFixed(2)}%)`);
    printChainBreakdown(a.positions_distribution_by_chain);
  } catch (err) {
    console.error(`  Portfolio fetch failed: ${err.message}`);
  }
}

async function reportPnl(address) {
  try {
    const { data } = await zerion.getPnl(address);
    const p = data.attributes;
    console.log(
      `\nPnL — total: ${formatUsd(p.total_gain)}, realized: ${formatUsd(p.realized_gain)}, unrealized: ${formatUsd(p.unrealized_gain)}`,
    );
  } catch (err) {
    // A 503 on the very first request for a fresh address is expected — retry later.
    console.error(`  PnL fetch failed: ${err.message}`);
  }
}

async function reportTopPositions(address, limit = 5) {
  try {
    const { data } = await zerion.getFungiblePositions(address, { sort: '-value' });
    if (!data.length) {
      console.log('\nTop positions: (none found)');
      return;
    }
    console.log('\nTop positions:');
    for (const pos of data.slice(0, limit)) {
      const a = pos.attributes;
      const symbol = a.fungible_info?.symbol || '?';
      console.log(`  ${symbol}: ${formatUsd(a.value)} (qty ${a.quantity?.numeric ?? '?'})`);
    }
  } catch (err) {
    console.error(`  Positions fetch failed: ${err.message}`);
  }
}

async function reportTransactions(address, limit = 3) {
  try {
    const { data } = await zerion.getTransactions(address, { pageSize: limit });
    if (!data.length) {
      console.log('\nRecent transactions: (none found)');
      return;
    }
    console.log(`\nRecent transactions (last ${Math.min(limit, data.length)})`);
    for (const tx of data.slice(0, limit)) {
      const a = tx.attributes;
      const type = a.operation_type || a.type || 'transaction';
      const status = a.status || '';
      const fee = a.fee?.value != null ? `, fee ${formatUsd(a.fee.value)}` : '';
      console.log(`  ${formatTxTime(a.mined_at)} — ${type} (${status})${fee}`);
      console.log(`    hash: ${a.hash || 'n/a'}`);
    }
  } catch (err) {
    console.error(`  Transactions fetch failed: ${err.message}`);
  }
}

async function reportNfts(address) {
  try {
    const { data } = await zerion.getNftPortfolio(address);
    const byChain = data.attributes.positions_distribution_by_chain || {};
    const total = Object.values(byChain).reduce((sum, v) => sum + v, 0);
    console.log(`\nNFT portfolio value: ${formatUsd(total)}`);
  } catch (err) {
    if (err.status === 202) {
      console.log('\nNFT portfolio: still indexing this address, try again shortly.');
    } else {
      console.error(`  NFT portfolio fetch failed: ${err.message}`);
    }
  }
}

async function reportWallet(address) {
  console.log(`\n=== ${address} ===`);
  await reportPortfolio(address);
  await reportPnl(address);
  await reportTopPositions(address);
  await reportTransactions(address, 3);
  await reportNfts(address);
}

async function reportWalletSet(addresses) {
  console.log(`\n=== Wallet set: ${addresses.join(', ')} ===`);
  try {
    const { data } = await zerion.getWalletSetBalanceChart(addresses, 'month');
    const points = data.attributes.points || [];
    const latest = points[points.length - 1];
    console.log(`Latest balance point: ${latest ? formatUsd(latest[1]) : 'n/a'}`);
  } catch (err) {
    console.error(`  Balance chart fetch failed: ${err.message}`);
  }

  try {
    const { data } = await zerion.getWalletSetFungiblePositions(addresses, { sort: '-value' });
    console.log(`Combined positions: ${data.length}`);
    for (const pos of data.slice(0, 5)) {
      const a = pos.attributes;
      console.log(`  ${a.fungible_info?.symbol || '?'}: ${formatUsd(a.value)}`);
    }
  } catch (err) {
    console.error(`  Positions fetch failed: ${err.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--set') {
    const addresses = args.slice(1);
    if (!addresses.length) {
      console.error('Usage: node index.js --set 0xAddr1 [0xAddr2]');
      process.exit(1);
    }
    await reportWalletSet(addresses);
    return;
  }

  const wallets = args.length ? args : DEFAULT_WALLETS;
  for (const address of wallets) {
    await reportWallet(address);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
