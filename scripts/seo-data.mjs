#!/usr/bin/env node
// DataForSEO helper for niche research.
// Auth comes from env: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD.
//
// Usage:
//   node scripts/seo-data.mjs balance
//   node scripts/seo-data.mjs volume --keywords research/keywords-gpsr.json --location US
//   node scripts/seo-data.mjs volume --keywords research/keywords-epr.json --location DE --out research/volumes-epr-de.json
//   node scripts/seo-data.mjs serp --query "gpsr responsible person" --location US
//
// Locations map to Google Ads geo codes; language defaults to English
// (German for DE, Spanish for ES) unless --lang is given.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const API = 'https://api.dataforseo.com/v3';

const LOCATIONS = {
  US: { code: 2840, lang: 'en' },
  UK: { code: 2826, lang: 'en' },
  DE: { code: 2276, lang: 'de' },
  ES: { code: 2724, lang: 'es' },
  FR: { code: 2250, lang: 'fr' },
  IT: { code: 2380, lang: 'it' },
  NL: { code: 2528, lang: 'en' },
  PL: { code: 2616, lang: 'pl' },
};

function auth() {
  const { DATAFORSEO_LOGIN: login, DATAFORSEO_PASSWORD: password } = process.env;
  if (!login || !password) {
    console.error('Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.');
    process.exit(1);
  }
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

// Uses curl so requests respect HTTPS_PROXY (Node's fetch ignores proxy env vars).
async function call(path, body) {
  const cliArgs = ['-sS', '-H', `Authorization: ${auth()}`, '-H', 'Content-Type: application/json'];
  if (body) cliArgs.push('-X', 'POST', '--data-binary', JSON.stringify(body));
  cliArgs.push(`${API}${path}`);
  const out = execFileSync('curl', cliArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let json;
  try {
    json = JSON.parse(out);
  } catch {
    throw new Error(`Non-JSON response: ${out.slice(0, 300)}`);
  }
  if (json.status_code !== 20000) {
    throw new Error(`API error ${json.status_code}: ${json.status_message}`);
  }
  return json;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[++i];
    else args._.push(argv[i]);
  }
  return args;
}

function loc(args) {
  const key = (args.location || 'US').toUpperCase();
  const entry = LOCATIONS[key];
  if (!entry) {
    console.error(`Unknown location "${key}". Known: ${Object.keys(LOCATIONS).join(', ')}`);
    process.exit(1);
  }
  return { ...entry, lang: args.lang || entry.lang, key };
}

function save(args, data, fallbackName) {
  const out = args.out || fallbackName;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(data, null, 2));
  console.error(`Saved: ${out}`);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];

if (cmd === 'balance') {
  const json = await call('/appendix/user_data');
  const info = json.tasks?.[0]?.result?.[0];
  console.log(JSON.stringify({
    balance: info?.money?.balance,
    total_spent: info?.money?.total,
    limits: info?.rates,
  }, null, 2));
} else if (cmd === 'volume') {
  if (!args.keywords) {
    console.error('Pass --keywords <file.json> (JSON array of keyword strings).');
    process.exit(1);
  }
  const keywords = JSON.parse(readFileSync(args.keywords, 'utf8'));
  const { code, lang, key } = loc(args);
  const json = await call('/keywords_data/google_ads/search_volume/live', [{
    keywords,
    location_code: code,
    language_code: lang,
  }]);
  const rows = (json.tasks?.[0]?.result || [])
    .map(r => ({
      keyword: r.keyword,
      volume: r.search_volume,
      cpc: r.cpc,
      competition: r.competition,
      monthly: r.monthly_searches?.slice(0, 12),
    }))
    .sort((a, b) => (b.volume || 0) - (a.volume || 0));
  save(args, { location: key, language: lang, fetched_for: keywords.length, rows },
    `research/volumes-${key.toLowerCase()}.json`);
  console.log(JSON.stringify(rows.slice(0, 30), null, 2));
} else if (cmd === 'serp') {
  if (!args.query) {
    console.error('Pass --query "<search query>".');
    process.exit(1);
  }
  const { code, lang, key } = loc(args);
  const json = await call('/serp/google/organic/live/regular', [{
    keyword: args.query,
    location_code: code,
    language_code: lang,
    depth: 10,
  }]);
  const items = (json.tasks?.[0]?.result?.[0]?.items || [])
    .filter(i => i.type === 'organic')
    .map(i => ({ pos: i.rank_absolute, domain: i.domain, title: i.title, url: i.url }));
  save(args, { query: args.query, location: key, items },
    `research/serp-${key.toLowerCase()}.json`);
  console.log(JSON.stringify(items, null, 2));
} else {
  console.error('Commands: balance | volume --keywords <file> --location <US|UK|DE|ES|FR|IT|NL|PL> | serp --query "<q>" --location <...>');
  process.exit(1);
}
