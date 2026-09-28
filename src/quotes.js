export async function loadQuotes() {
  const response = await fetch('./data/quotes.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.quotes)) throw new Error('quotes 배열이 없습니다.');
  const seen = new Set();
  const quotes = payload.quotes.filter(q => {
    const valid = q && typeof q.id === 'string' && !seen.has(q.id) && typeof q.text === 'string' && q.text.trim()
      && q.enabled === true && ['approved', 'approved-original'].includes(q.rightsStatus);
    if (valid) seen.add(q.id); else console.warn('표시에서 제외된 명언:', q?.id ?? q);
    return valid;
  });
  if (!quotes.length) throw new Error('표시 가능한 명언이 없습니다.');
  return { ...payload, quotes };
}

export function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function getDailyQuote(quotes, userData) {
  const key = localDateKey();
  const assigned = quotes.find(q => q.id === userData.dailyAssignments[key]);
  if (assigned) return { quote: assigned, changed: false };
  let hash = 2166136261;
  for (const char of key) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  const quote = quotes[Math.abs(hash >>> 0) % quotes.length];
  userData.dailyAssignments[key] = quote.id;
  return { quote, changed: true };
}

export function searchQuotes(quotes, query, theme = 'all') {
  const needle = query.trim().toLocaleLowerCase('ko');
  return quotes.filter(q => {
    if (theme !== 'all' && q.theme !== theme) return false;
    if (!needle) return true;
    const haystack = [q.text, q.speaker, q.workTitle, q.theme, q.inspiredBy, ...(q.tags || [])].filter(Boolean).join(' ').toLocaleLowerCase('ko');
    return haystack.includes(needle);
  });
}

export const quoteById = (quotes, id) => quotes.find(q => q.id === id);
export const themesFrom = quotes => [...new Set(quotes.map(q => q.theme).filter(Boolean))];
