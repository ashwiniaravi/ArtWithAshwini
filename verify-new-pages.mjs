import { chromium } from 'playwright';

const base = 'file:///D:/Projects/ArtWithAshwini/';
const pages = [
  { name: 'About',    url: base + 'about.html' },
  { name: 'Teaching', url: base + 'teaching.html' },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });

for (const p of pages) {
  console.log(`\n=== Checking: ${p.name} ===`);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(String(e)));

  await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);

  const title = await page.title();
  const ssPath = `D:/Projects/ArtWithAshwini/verify-${p.name.toLowerCase()}-new.png`;
  await page.screenshot({ path: ssPath, fullPage: true });

  const brokenImgs = await page.evaluate(() =>
    Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)
  );

  console.log('Title:', title);
  console.log('Screenshot:', ssPath);
  console.log('Console errors:', consoleErrors.length ? consoleErrors : 'none');
  console.log('Broken images:', brokenImgs.length ? brokenImgs : 'none');
  await page.close();
}

await browser.close();
