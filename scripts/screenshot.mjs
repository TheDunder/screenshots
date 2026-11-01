// Takes full-page screenshots of the site for visual review.
// Usage: node scripts/screenshot.mjs <url> [outdir]  (needs the playwright package)
// SECTIONS (env, optional): a CSS selector. On the desktop shots, each visible match is also saved as
// sections/<name>-<shot>.png, named after the element's id, its aria-labelledby, or its position.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2];
if (!url) { console.error('Usage: node scripts/screenshot.mjs <url> [outdir]'); process.exit(2); }
const out = process.argv[3] || 'screenshots';
const sections = (process.env.SECTIONS || '').trim();
await mkdir(out, { recursive: true });
if (sections) await mkdir(`${out}/sections`, { recursive: true });

const shots = [
  { name: 'desktop-light', width: 1280, scheme: 'light' },
  { name: 'desktop-dark', width: 1280, scheme: 'dark' },
  { name: 'tablet-dark', width: 820, scheme: 'dark' },
  { name: 'mobile-light', width: 390, scheme: 'light', mobile: true },
];

const browser = await chromium.launch();
let problems = 0;
for (const s of shots) {
  const page = await browser.newPage({
    viewport: { width: s.width, height: 900 },
    colorScheme: s.scheme,
    deviceScaleFactor: s.mobile ? 2 : 1,
    isMobile: !!s.mobile,
    hasTouch: !!s.mobile,
  });
  page.on('pageerror', e => { problems++; console.log(`${s.name} page error: ${e.message}`); });
  page.on('console', m => { if (m.type() === 'error') { problems++; console.log(`${s.name} console error: ${m.text()}`); } });
  // cache-busting query; URL keeps a #hash after it so links like #jamfor-alla still work
  const target = new URL(url);
  target.searchParams.set('shot', Date.now());
  await page.goto(target.href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const overflow = await page.evaluate(w => document.documentElement.scrollWidth - w, s.width);
  if (overflow > 0) { problems++; console.log(`${s.name} horizontal overflow: ${overflow}px`); }
  await page.screenshot({ path: `${out}/${s.name}.png`, fullPage: true });
  await page.screenshot({ path: `${out}/${s.name}-top.png` });
  if (sections && s.name.startsWith('desktop')) {
    const els = await page.locator(sections).all();
    let i = 0, saved = 0;
    for (const el of els) {
      i++;
      if (!(await el.isVisible())) continue;
      const raw = (await el.getAttribute('id')) || (await el.getAttribute('aria-labelledby')) || `section-${i}`;
      const name = raw.replace(/-title$/, '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60);
      try { await el.screenshot({ path: `${out}/sections/${name}-${s.name}.png` }); saved++; }
      catch (e) { console.log(`${s.name} section ${name} not saved: ${e.message.split('\n')[0]}`); }
    }
    console.log(`${s.name}: ${saved} section image(s) for ${JSON.stringify(sections)}`);
  }
  // mid: one screen further down (on tvval: follow its menu link the way a visitor would)
  await page.evaluate(() => { const a = document.querySelector('#toc a[href="#modeller"]'); if (a) a.click(); else window.scrollTo(0, innerHeight); });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${s.name}-mid.png` });
  console.log(`saved ${s.name}`);
  await page.close();
}
await browser.close();
console.log(`${problems} problem(s)`);
