// Usage: node shot.mjs <url-path> <out-name> [width] [height] [fullPage=1] [actions-json]
import { chromium } from 'playwright-core';
import path from 'node:path';

const [, , urlPath = '/', name = 'shot', width = '1440', height = '900', full = '1', actionsJson = '[]'] = process.argv;
const outDir = process.env.SHOT_DIR || path.resolve('.');
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: Number(width), height: Number(height) }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

await page.goto(base + urlPath, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500);
for (const a of JSON.parse(actionsJson)) {
  if (a.click) await page.click(a.click);
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.scroll) await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView(), a.scroll);
  if (typeof a.y === 'number') await page.evaluate((y) => window.scrollTo(0, y), a.y);
  if (a.shot) {
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(outDir, `${name}-${a.shot}.png`) });
  }
  if (a.type) await page.keyboard.type(a.type);
  if (a.press) await page.keyboard.press(a.press);
}
await page.waitForTimeout(400);
const file = path.join(outDir, `${name}.png`);
await page.screenshot({ path: file, fullPage: full === '1' });
console.log('saved', file);
if (errors.length) console.log(errors.slice(0, 20).join('\n'));
await browser.close();
