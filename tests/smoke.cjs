const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.locator('.quote-hero').waitFor();
  if (!(await page.locator('.quote-text').innerText()).trim()) throw new Error('오늘의 명언이 비어 있습니다.');

  await page.locator('[data-action="favorite"]').first().click();
  await page.locator('a[data-route="favorites"]').click();
  await page.locator('.quote-card').waitFor();

  await page.locator('a[data-route="quotes"]').click();
  await page.locator('#quote-search').fill('용기');
  const count = Number((await page.locator('.result-count').innerText()).match(/\d+/)?.[0]);
  if (!count) throw new Error('검색 결과가 없습니다.');

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/mobile-preview.png', fullPage: false });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.search-panel').waitFor();
  await page.context().setOffline(false);
  if (errors.length) throw new Error(`브라우저 오류: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ today: true, favorite: true, searchResults: count, offlineReload: true, screenshot: 'tests/mobile-preview.png' }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
