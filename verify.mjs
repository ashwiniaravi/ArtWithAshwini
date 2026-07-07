import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const base = 'file:///D:/Projects/ArtWithAshwini/';
const pages = [
  { name: 'Home',              url: base + 'index.html' },
  { name: 'Classes',           url: base + 'classes.html' },
  { name: 'About',             url: base + 'about.html' },
  { name: 'Shakthicircle',     url: base + 'shakthi-circle.html' },
  { name: 'Flyer Art Classes', url: base + 'flyer-art-classes.html' },
  { name: 'Flyer Summer',      url: base + 'flyer-summer-combined.html' },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const results = [];

for (const p of pages) {
  console.log(`\n=== Checking: ${p.name} ===`);
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  const title = await page.title();

  // Screenshot full page
  const ssPath = `D:/Projects/ArtWithAshwini/verify-${p.name.replace(/\s+/g, '-').toLowerCase()}.png`;
  await page.screenshot({ path: ssPath, fullPage: true });

  // Check for broken images
  const brokenImgs = await page.evaluate(() => {
    return Array.from(document.images)
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src);
  });

  // Check nav links resolve (not broken hrefs)
  const navLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('nav a, header a'))
      .map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
  });

  // Check scrollability
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const clientHeight = await page.evaluate(() => window.innerHeight);
  const scrollable = scrollHeight > clientHeight;

  // Check key content for duplicates between home & classes
  let offerSection = null;
  if (p.name === 'Home' || p.name === 'Classes') {
    offerSection = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'))
        .map(h => h.textContent.trim())
        .filter(t => /three ways|what i offer|classes|registration/i.test(t));
      return headings;
    });
  }

  // Check background colors of header/hero
  const heroColor = await page.evaluate(() => {
    const hero = document.querySelector('section, .top-band, header');
    if (!hero) return null;
    return window.getComputedStyle(hero).backgroundColor;
  });

  // Check flyer-specific: tagline text
  let flyerTagline = null;
  if (p.name.startsWith('Flyer')) {
    flyerTagline = await page.evaluate(() => {
      const el = document.querySelector('.tagline');
      return el ? el.textContent.trim() : null;
    });
  }

  const result = { name: p.name, title, scrollable, scrollHeight, brokenImgs, navLinks, offerSection, heroColor, flyerTagline, consoleErrors, ssPath };
  results.push(result);
  console.log(`  Title: ${title}`);
  console.log(`  Scrollable: ${scrollable} (scrollHeight: ${scrollHeight}px)`);
  console.log(`  Broken images: ${brokenImgs.length > 0 ? brokenImgs.join(', ') : 'none'}`);
  console.log(`  Console errors: ${consoleErrors.length > 0 ? consoleErrors.join('; ') : 'none'}`);
  if (offerSection) console.log(`  Offer headings: ${JSON.stringify(offerSection)}`);
  if (flyerTagline) console.log(`  Flyer tagline: "${flyerTagline}"`);

  await page.close();
}

await browser.close();

// Summary
console.log('\n\n════════ SUMMARY ════════');
for (const r of results) {
  const issues = [];
  if (r.brokenImgs.length) issues.push(`${r.brokenImgs.length} broken image(s)`);
  if (r.consoleErrors.length) issues.push(`${r.consoleErrors.length} console error(s)`);
  if (!r.scrollable && (r.name.startsWith('Flyer'))) issues.push('not scrollable');
  console.log(`${r.name}: ${issues.length === 0 ? '✅ OK' : '⚠️  ' + issues.join(' | ')}`);
  if (r.flyerTagline) console.log(`  Tagline → "${r.flyerTagline}"`);
  if (r.offerSection?.length) console.log(`  Offer headings → ${JSON.stringify(r.offerSection)}`);
}

console.log('\nScreenshots saved to D:/Projects/ArtWithAshwini/verify-*.png');
