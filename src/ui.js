import { localDateKey, searchQuotes, themesFrom } from './quotes.js';

const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

export function quoteMeta(q) { return q.attribution || [q.speaker, q.workTitle].filter(Boolean).join(' · ') || '비공식 창작 문장'; }

export function renderToday(q, isFavorite) {
  const date = new Intl.DateTimeFormat('ko-KR', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
  return `<section class="screen hero" aria-labelledby="today-title">
    <p class="eyebrow">오늘의 이웃</p><span class="date-chip">${esc(date)}</span>
    <article class="quote-hero"><h1 class="quote-text" id="today-title">${esc(q.text)}</h1><p class="quote-meta">${esc(quoteMeta(q))}</p><span class="theme-pill">${esc(q.theme)}</span>
      <div class="action-row"><button class="button primary" data-action="favorite" data-id="${esc(q.id)}" aria-pressed="${isFavorite}">${isFavorite ? '♥ 저장됨' : '♡ 즐겨찾기'}</button><button class="button" data-action="share" data-id="${esc(q.id)}">↗ 공유</button></div>
    </article><p class="tiny-note">호놀룰루의 노을처럼, 오늘도 천천히 빛나세요.<br>같은 날짜에는 같은 문장이 머뭅니다.</p>
  </section>`;
}

export function renderLibrary(quotes, userData, state) {
  const themes = themesFrom(quotes);
  const results = searchQuotes(quotes, state.query, state.theme);
  return `<section class="screen"><p class="eyebrow">30 ORIGINAL THOUGHTS</p><h1 class="screen-heading">명언집</h1><p class="screen-subtitle">마음에 걸리는 한 문장을 찾아보세요.</p>
    <div class="search-panel"><label class="search-wrap"><span aria-hidden="true">⌕</span><span class="sr-only"></span><input class="search-input" id="quote-search" type="search" value="${esc(state.query)}" placeholder="문장, 주제, 태그 검색" aria-label="명언 검색"></label>
      <div class="filter-chips" aria-label="주제 필터"><button class="filter-chip" data-theme="all" aria-pressed="${state.theme === 'all'}">전체</button>${themes.map(t => `<button class="filter-chip" data-theme="${esc(t)}" aria-pressed="${state.theme === t}">${esc(t)}</button>`).join('')}</div></div>
    <p class="result-count" aria-live="polite">${results.length}개의 문장</p><div class="quote-list">${results.length ? results.map(q => quoteCard(q, userData.favorites.includes(q.id))).join('') : emptyInline('검색 결과가 없어요', '다른 검색어나 주제를 골라보세요.')}</div>
  </section>`;
}

export function renderFavorites(quotes, userData) {
  const favorites = userData.favorites.map(id => quotes.find(q => q.id === id)).filter(Boolean);
  return `<section class="screen"><p class="eyebrow">YOUR CONSTELLATION</p><h1 class="screen-heading">즐겨찾기</h1><p class="screen-subtitle">${favorites.length}개의 문장을 간직하고 있어요.</p>
    ${favorites.length ? `<div class="quote-list">${favorites.map(q => quoteCard(q, true)).join('')}</div>` : `<div class="empty-state"><span class="empty-icon">♡</span><h2>아직 저장한 문장이 없어요</h2><p>명언집에서 마음에 드는 문장을 찾아보세요.</p><a class="button primary" href="#/quotes">명언집 둘러보기</a></div>`}</section>`;
}

export function renderDetail(q, isFavorite) {
  return `<section class="screen"><button class="button detail-back" data-action="back">← 돌아가기</button><article class="detail-card"><p class="eyebrow">${esc(q.theme)}</p><h1 class="quote-text">${esc(q.text)}</h1><dl class="details-grid"><dt>표기</dt><dd>${esc(quoteMeta(q))}</dd><dt>영감</dt><dd>${esc(q.inspiredBy || '—')}</dd><dt>태그</dt><dd>${esc((q.tags || []).join(' · '))}</dd><dt>권리</dt><dd>배포 승인된 비공식 창작</dd></dl>
    <div class="action-row"><button class="button primary" data-action="favorite" data-id="${esc(q.id)}" aria-pressed="${isFavorite}">${isFavorite ? '♥ 저장됨' : '♡ 즐겨찾기'}</button><button class="button" data-action="share" data-id="${esc(q.id)}">↗ 공유</button></div><button class="button" data-action="download-card" data-id="${esc(q.id)}" style="width:100%;margin-top:10px">▣ 하와이 이미지 카드 저장</button></article></section>`;
}

export function renderSettings(userData, storageOk, collectionTitle) {
  return `<section class="screen"><p class="eyebrow">YOUR SPACE</p><h1 class="screen-heading">설정</h1><p class="screen-subtitle">내 기기 안에서 편안하게 관리하세요.</p><div class="settings-list">
    <article class="settings-card"><h2>화면 테마</h2><p>기기 설정을 따르거나 원하는 분위기를 선택하세요.</p><div class="segmented" aria-label="테마 선택">${[['system','기기'],['light','밝게'],['dark','어둡게']].map(([v,l]) => `<button data-action="theme" data-theme-value="${v}" aria-pressed="${userData.theme === v}">${l}</button>`).join('')}</div></article>
    <article class="settings-card"><h2>내 데이터</h2><p>즐겨찾기는 서버가 아닌 이 브라우저에만 저장됩니다.${storageOk ? '' : ' 현재 저장소 접근이 제한되어 임시로만 유지됩니다.'}</p><div class="settings-actions"><button class="button" data-action="export">↓ 내보내기</button><button class="button" data-action="import">↑ 가져오기</button><button class="button danger" data-action="reset">전체 삭제</button></div></article>
    <article class="settings-card"><h2>이 앱에 관하여</h2><p>${esc(collectionTitle)}</p><p class="legal">비공식 팬 프로젝트이며 Marvel 또는 Sony와 관련이 없습니다. 모든 문장은 실제 영화·코믹스·게임 대사가 아닌 비공식 창작 문장입니다. 배경 이미지는 이 앱을 위해 새로 제작한 오리지널 이미지입니다.</p><p>버전 1.0.0 · 정적 PWA</p></article>
  </div></section>`;
}

export function renderError(message) { return `<section class="error-state"><span class="empty-icon">!</span><h1>명언을 불러오지 못했어요</h1><p>${esc(message)}</p><button class="button primary" data-action="retry">다시 시도</button></section>`; }
function quoteCard(q, favorite) { return `<article class="quote-card-wrap"><a class="quote-card" href="#/quote/${encodeURIComponent(q.id)}"><blockquote>${esc(q.text)}</blockquote><footer>${esc(q.theme)} · ${esc(quoteMeta(q))}</footer></a><button class="card-favorite" data-action="favorite" data-id="${esc(q.id)}" aria-label="${favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}" aria-pressed="${favorite}">${favorite ? '♥' : '♡'}</button></article>`; }
function emptyInline(title, text) { return `<div class="empty-state"><span class="empty-icon">⌕</span><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`; }
