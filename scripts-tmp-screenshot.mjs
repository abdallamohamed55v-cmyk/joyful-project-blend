import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = 'public/templates';
const slugs = fs.readdirSync(ROOT).filter(d => fs.statSync(path.join(ROOT, d)).isDirectory());
console.log(`Found ${slugs.length} templates`);

const browser = await chromium.launch({ executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });

for (const slug of slugs) {
  const htmlPath = path.resolve(ROOT, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) { console.log('skip', slug); continue; }
  const page = await ctx.newPage();
  try {
    await page.goto('file://' + htmlPath, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);
    const out = path.join(ROOT, slug, 'preview.png');
    await page.screenshot({ path: out, fullPage: false, type: 'png' });
    console.log('ok', slug);
  } catch (e) {
    console.log('FAIL', slug, e.message);
  }
  await page.close();
}
await browser.close();
