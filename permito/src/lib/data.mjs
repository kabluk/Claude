import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRADES, classifyPermit } from './trades.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CITIES_DIR = join(ROOT, 'data', 'cities');
const COPY_PATH = join(ROOT, 'content', 'copy.json');

export function loadCopy() {
  return JSON.parse(readFileSync(COPY_PATH, 'utf8'));
}

let citiesCache = null;

// Снапшоты городов читаются один раз за сборку; каждому пермиту
// присваиваются trade-слаги классификатором.
export function loadCities() {
  if (citiesCache) return citiesCache;
  if (!existsSync(CITIES_DIR)) return (citiesCache = []);
  const files = readdirSync(CITIES_DIR).filter((f) => f.endsWith('.json'));
  citiesCache = files
    .map((f) => {
      const c = JSON.parse(readFileSync(join(CITIES_DIR, f), 'utf8'));
      c.permits = (c.permits || []).map((p) => ({ ...p, trades: classifyPermit(p) }));
      return c;
    })
    .sort((a, b) => b.permits.length - a.permits.length);
  return citiesCache;
}

export function cityStats(city) {
  const now = new Date(city.fetchedAt || Date.now());
  const cutoff30 = new Date(now.getTime() - 30 * 864e5);
  const last30 = city.permits.filter((p) => p.issuedDate && new Date(p.issuedDate) >= cutoff30);
  const valuations = city.permits.map((p) => p.valuation).filter((v) => typeof v === 'number' && v > 0);
  const totalValuation = valuations.reduce((s, v) => s + v, 0);
  const byTrade = {};
  for (const t of TRADES) byTrade[t.slug] = 0;
  for (const p of city.permits) for (const t of p.trades) byTrade[t]++;
  const contractors = {};
  for (const p of city.permits) {
    if (p.contractor) contractors[p.contractor] = (contractors[p.contractor] || 0) + 1;
  }
  const topContractors = Object.entries(contractors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  return {
    total: city.permits.length,
    last30: last30.length,
    totalValuation,
    medianValuation: valuations.length
      ? valuations.sort((a, b) => a - b)[Math.floor(valuations.length / 2)]
      : null,
    byTrade,
    topContractors,
    newestDate: city.permits[0]?.issuedDate || null,
  };
}

export function tradePermits(city, tradeSlug) {
  return city.permits.filter((p) => p.trades.includes(tradeSlug));
}

// Пары «трейд × город» с ≥3 пермитами — порог против thin-content страниц.
export function tradeCityPairs(minCount = 3) {
  const pairs = [];
  for (const city of loadCities()) {
    for (const trade of TRADES) {
      const permits = tradePermits(city, trade.slug);
      if (permits.length >= minCount) pairs.push({ city, trade, count: permits.length });
    }
  }
  return pairs;
}

export function fmtMoney(n) {
  if (typeof n !== 'number' || !(n > 0)) return '—';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3).toLocaleString('en-US')}K`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export { TRADES };
