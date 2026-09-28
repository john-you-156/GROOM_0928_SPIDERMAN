import { loadUserData, saveUserData, resetUserData, storageAvailable } from './storage.js';
import { loadQuotes, getDailyQuote, quoteById } from './quotes.js';
import { getRoute, startRouter } from './router.js';
import { exportBackup, parseBackup } from './backup.js';
import { shareQuote, downloadQuoteCard } from './share.js';
import { renderToday, renderLibrary, renderFavorites, renderDetail, renderSettings, renderError } from './ui.js';

const main = document.querySelector('#app-main');
const toast = document.querySelector('#toast');
const fileInput = document.querySelector('#backup-file');
let payload = null;
let userData = loadUserData();
let listState = { query: '', theme: 'all' };
let toastTimer;

applyTheme();
document.querySelector('#theme-quick').addEventListener('click', quickTheme);
main.addEventListener('click', onClick);
main.addEventListener('input', onInput);
fileInput.addEventListener('change', importFile);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => userData.theme === 'system' && applyTheme());

async function init() {
  try { payload = await loadQuotes(); startRouter(render); registerServiceWorker(); scheduleMidnightRefresh(); }
  catch (error) { console.error(error); main.innerHTML = renderError(error.message); }
}

function render() {
  if (!payload) return;
  const route = getRoute();
  const quotes = payload.quotes;
  let html;
  if (route.name === 'today') {
    const daily = getDailyQuote(quotes, userData); if (daily.changed) userData = saveUserData(userData);
    html = renderToday(daily.quote, userData.favorites.includes(daily.quote.id));
  } else if (route.name === 'quotes') html = renderLibrary(quotes, userData, listState);
  else if (route.name === 'favorites') html = renderFavorites(quotes, userData);
  else if (route.name === 'settings') html = renderSettings(userData, storageAvailable(), payload.collectionTitle);
  else {
    const quote = quoteById(quotes, route.id);
    if (!quote) { showToast('존재하지 않는 명언이에요.'); location.hash = '#/quotes'; return; }
    html = renderDetail(quote, userData.favorites.includes(quote.id));
  }
  main.innerHTML = html;
  document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.toggle('active', a.dataset.route === route.tab));
  const badge = document.querySelector('#favorite-badge'); badge.textContent = userData.favorites.length; badge.hidden = !userData.favorites.length;
  scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

async function onClick(event) {
  const button = event.target.closest('[data-action]');
  const themeButton = event.target.closest('[data-theme]');
  if (themeButton && !button) { listState.theme = themeButton.dataset.theme; render(); return; }
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'favorite') toggleFavorite(button.dataset.id);
  if (action === 'back') history.length > 1 ? history.back() : location.hash = '#/quotes';
  if (action === 'retry') { main.innerHTML = '<div class="loading-state"><span class="spinner"></span><p>다시 불러오는 중이에요</p></div>'; try { payload = await loadQuotes(); render(); } catch (e) { main.innerHTML = renderError(e.message); } }
  if (action === 'share') { const status = await shareQuote(quoteById(payload.quotes, button.dataset.id)); if (status === 'copied') showToast('공유 문구를 복사했어요.'); }
  if (action === 'download-card') { await downloadQuoteCard(quoteById(payload.quotes, button.dataset.id)); showToast('하와이 이미지 카드를 저장했어요.'); }
  if (action === 'theme') { userData.theme = button.dataset.themeValue; userData = saveUserData(userData); applyTheme(); render(); }
  if (action === 'export') { exportBackup(userData); showToast('백업 파일을 만들었어요.'); }
  if (action === 'import') fileInput.click();
  if (action === 'reset' && confirm('즐겨찾기와 테마 설정을 모두 삭제할까요?')) { userData = resetUserData(); applyTheme(); render(); showToast('사용자 데이터를 삭제했어요.'); }
}

function onInput(event) { if (event.target.id === 'quote-search') { listState.query = event.target.value; const pos = event.target.selectionStart; render(); const next = document.querySelector('#quote-search'); next?.focus(); next?.setSelectionRange(pos, pos); } }
function toggleFavorite(id) { const set = new Set(userData.favorites); const adding = !set.has(id); adding ? set.add(id) : set.delete(id); userData.favorites = [...set]; userData = saveUserData(userData); render(); showToast(adding ? '즐겨찾기에 저장했어요.' : '즐겨찾기에서 뺐어요.'); }
async function importFile() { const file = fileInput.files?.[0]; fileInput.value = ''; if (!file) return; try { const incoming = await parseBackup(file, new Set(payload.quotes.map(q => q.id))); const current = new Set(userData.favorites); const duplicates = incoming.favorites.filter(id => current.has(id)).length; const additions = incoming.favorites.filter(id => !current.has(id)); if (!confirm(`${additions.length}개를 추가하고, 중복 ${duplicates}개는 건너뜁니다. 계속할까요?`)) return; userData.favorites = [...current, ...additions]; if (incoming.theme) userData.theme = incoming.theme; userData = saveUserData(userData); applyTheme(); render(); showToast('백업을 가져왔어요.'); } catch (error) { showToast(`가져오기 실패: ${error.message}`); } }
function applyTheme() { const dark = userData.theme === 'dark' || (userData.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.querySelector('#theme-quick').textContent = dark ? '☀' : '☾'; }
function quickTheme() { userData.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; userData = saveUserData(userData); applyTheme(); if (payload) render(); }
function showToast(message) { clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('show'); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
function scheduleMidnightRefresh() { const now = new Date(); const next = new Date(now); next.setHours(24,0,2,0); setTimeout(() => { if (getRoute().name === 'today') render(); scheduleMidnightRefresh(); }, next - now); }
function registerServiceWorker() { if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('서비스 워커 등록 실패', error)); }
init();
