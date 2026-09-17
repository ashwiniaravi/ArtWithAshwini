import { chromium } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await context.newPage();
await page.goto('file:///D:/Projects/ArtWithAshwini/index.html', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'D:/Projects/ArtWithAshwini/verify-home-current.png', fullPage: true });
console.log('done');
await browser.close();
