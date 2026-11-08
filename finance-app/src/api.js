import { FINNHUB_API_KEY } from './config.js';
export async function fetchQuote(sym) {
  if (!FINNHUB_API_KEY) throw new Error('NO_KEY');
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  if (!d.c) throw new Error('NO_DATA');
  return { price: d.c, change: d.dp };
}

