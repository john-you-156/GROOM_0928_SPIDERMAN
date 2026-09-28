const ROOTS = new Set(['today', 'quotes', 'favorites', 'settings']);

export function getRoute() {
  const raw = location.hash.replace(/^#\/?/, '') || 'today';
  const [name, id] = raw.split('/');
  if (name === 'quote' && id) return { name: 'detail', id: decodeURIComponent(id), tab: 'quotes' };
  const safe = ROOTS.has(name) ? name : 'today';
  return { name: safe, tab: safe };
}

export function startRouter(render) {
  addEventListener('hashchange', render);
  if (!location.hash) history.replaceState(null, '', '#/today');
  render();
}
