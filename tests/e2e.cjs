const { chromium } = require('playwright');

const URL = 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => consoleErrors.push(error.message));

  await page.goto(`${URL}/#/today`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const firstQuote = (await page.locator('.quote-text').innerText()).trim();
  await page.reload({ waitUntil: 'networkidle' });
  const reloadedQuote = (await page.locator('.quote-text').innerText()).trim();
  check(firstQuote === reloadedQuote, '같은 날짜의 명언이 새로고침 후 바뀌었습니다.');

  await page.locator('[data-action="favorite"]').first().click();
  await page.reload({ waitUntil: 'networkidle' });
  check(await page.locator('[data-action="favorite"]').first().getAttribute('aria-pressed') === 'true', '즐겨찾기가 유지되지 않았습니다.');

  await page.locator('a[data-route="quotes"]').click();
  await page.locator('#quote-search').fill('용기');
  const searchCount = numberFrom(await page.locator('.result-count').innerText());
  check(searchCount > 0, '검색 결과가 없습니다.');
  await page.locator('.filter-chip', { hasText: '용기' }).click();
  const filteredCount = numberFrom(await page.locator('.result-count').innerText());
  check(filteredCount > 0 && filteredCount <= searchCount, '검색과 주제 필터 조합이 잘못되었습니다.');

  await page.locator('.quote-card').first().click();
  await page.locator('.detail-card').waitFor();
  check((await page.locator('.detail-card .quote-text').innerText()).trim().length > 10, '상세 명언이 비어 있습니다.');
  const cardDownload = page.waitForEvent('download');
  await page.locator('[data-action="download-card"]').click();
  const card = await cardDownload;
  check((await card.suggestedFilename()).endsWith('.png'), '이미지 카드가 PNG가 아닙니다.');

  await page.locator('a[data-route="settings"]').click();
  await page.locator('[data-action="theme"][data-theme-value="dark"]').click();
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', '다크 테마가 적용되지 않았습니다.');
  await page.reload({ waitUntil: 'networkidle' });
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', '테마 설정이 유지되지 않았습니다.');

  const backupDownload = page.waitForEvent('download');
  await page.locator('[data-action="export"]').click();
  const backup = await backupDownload;
  check((await backup.suggestedFilename()).endsWith('.json'), '백업 파일이 JSON이 아닙니다.');

  await page.goto(`${URL}/#/quote/not-found`, { waitUntil: 'networkidle' });
  await page.waitForURL(/#\/quotes$/);
  check(page.url().endsWith('#/quotes'), '잘못된 명언 주소가 목록으로 안내되지 않았습니다.');

  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.search-panel').waitFor();
  await context.setOffline(false);

  const unnamedButtons = await page.locator('button').evaluateAll(buttons => buttons.filter(button => !(button.innerText.trim() || button.getAttribute('aria-label'))).length);
  check(unnamedButtons === 0, '이름 없는 버튼이 있습니다.');
  check(consoleErrors.length === 0, `브라우저 오류: ${consoleErrors.join(' | ')}`);

  const result = {
    todayStable: true,
    favoritePersists: true,
    searchCount,
    filteredCount,
    detail: true,
    imageCardPng: true,
    themePersists: true,
    backupJson: true,
    invalidRouteHandled: true,
    offlineReload: true,
    accessibleButtons: true
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

function numberFrom(text) { return Number(text.match(/\d+/)?.[0] || 0); }
function check(condition, message) { if (!condition) throw new Error(message); }
