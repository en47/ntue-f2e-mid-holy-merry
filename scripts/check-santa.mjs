// Santa 模型檢查（需先啟動本機伺服器）：舞姿連拍、滑鼠追蹤、觸控與減少動態。
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');
const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args });
const ready = page => page.waitForFunction(selector => document.querySelector(selector)?.dataset.state === 'ready', page.santa, { timeout: 90000 });
async function open(file, selector, options = {}) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })).newPage();
  page.santa = selector;
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.errors = errors;
  await page.goto(`http://127.0.0.1:5500/${file}`, { waitUntil: 'domcontentloaded' });
  await ready(page); await page.waitForTimeout(4000);
  return page;
}
const home = await open('index.html', '[data-model-slot="santa"]');
const stage = await home.locator('#santa-card').boundingBox();
for (const i of [0, 1, 2, 3]) { await home.screenshot({ path: path.join(outDir, `santa-dance-${i}.png`), clip: stage }); await home.waitForTimeout(700); }
for (const [name, x] of [['left', 60], ['right', 1380]]) {
  await home.mouse.move(x, 300); await home.waitForTimeout(1600);
  await home.screenshot({ path: path.join(outDir, `santa-home-look-${name}.png`), clip: stage });
}
const game = await open('game.html', '.games-hero-santa');
const box = await game.locator('.games-hero-santa').boundingBox();
for (const [name, x, y] of [['left', 40, 300], ['right', 1400, 300], ['down', 720, 880], ['up', 720, 120]]) {
  await game.mouse.move(x, y); await game.waitForTimeout(1600);
  await game.screenshot({ path: path.join(outDir, `santa-game-look-${name}.png`), clip: box });
}
const touch = await open('game.html', '.games-hero-santa', { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
await touch.touchscreen.tap(50, 300); await touch.waitForTimeout(800);
await touch.screenshot({ path: path.join(outDir, 'santa-touch.png') });
const still = await open('game.html', '.games-hero-santa', { reducedMotion: 'reduce' });
const clip = await still.locator('.games-hero-santa').boundingBox();
const a = await still.screenshot({ clip }); await still.mouse.move(40, 300); await still.waitForTimeout(1500); const b = await still.screenshot({ clip });
console.log('reduced motion unchanged', a.equals(b));
console.log('errors', home.errors, game.errors, touch.errors, still.errors);
await browser.close();
