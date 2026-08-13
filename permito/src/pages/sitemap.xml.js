import { loadCities, TRADES, tradeCityPairs } from '../lib/data.mjs';

// Полная карта pSEO-страниц; собирается из тех же данных, что и getStaticPaths.
export function GET(context) {
  const site = context.site?.href?.replace(/\/$/, '') || '';
  const urls = ['/', '/permits/', '/leads/'];
  for (const c of loadCities()) urls.push(`/permits/${c.city}/`);
  for (const t of TRADES) urls.push(`/leads/${t.slug}/`);
  for (const { city, trade } of tradeCityPairs(3)) urls.push(`/leads/${trade.slug}/${city.city}/`);

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
