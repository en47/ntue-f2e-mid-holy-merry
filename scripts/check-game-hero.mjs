// Game Hero 動態檢查（需先啟動本機伺服器）：進場連拍、搖擺、花圈 Hover、按鈕捲動與減少動態。
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');
const url = 'http://127.0.0.1:5500/game.html';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('.games-hero-santa').dataset.state === 'ready', null, { timeout: 90000 });
// 暫停後跳到指定時間點，連拍不受軟體渲染速度影響。
await page.waitForFunction(() => document.querySelector('.games-hero').classList.contains('is-opening'));
for (const at of [100, 700, 1300, 1800, 2500, 3400]) {
  await page.evaluate(time => document.querySelector('.games-hero').getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = time; }), at);
  await page.screenshot({ path: path.join(outDir, `opening-${String(at).padStart(4, '0')}.png`) });
}
await page.evaluate(() => document.querySelector('.games-hero').getAnimations({ subtree: true }).forEach(animation => animation.play()));
await page.waitForTimeout(3600);
const sample = () => page.evaluate(() => ({ sign: getComputedStyle(document.querySelector('.sign-board-title')).transform, top: getComputedStyle(document.querySelector('.sign-board-top')).transform, bottom: getComputedStyle(document.querySelector('.sign-board-bottom')).transform }));
const clip = await page.locator('.games-hero-santa').boundingBox();
const a = await sample(), shotA = await page.screenshot({ clip }); await page.waitForTimeout(1300);
const b = await sample(), shotB = await page.screenshot({ clip });
console.log('sign transforms move', a.sign !== b.sign, a.top !== b.top, a.bottom !== b.bottom, '| santa frames differ', !shotA.equals(shotB));
for (const [name, target] of [['Santa Flying', '#sleigh-game'], ['Christmas Matching', '#matching-game']]) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const button = await page.getByRole('button', { name }).boundingBox();
  const point = [button.x + button.width / 2, button.y + button.height / 2];
  console.log(name, 'hit target', await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent, point));
  await page.mouse.click(...point);
  await page.waitForTimeout(1500);
  const box = await page.locator(target).boundingBox();
  console.log(name, 'panel top', Math.round(box.y), 'bottom', Math.round(box.y + box.height), 'viewport 900');
}
const sleigh = page.locator('[data-illustration-slot="santa-flying"]');
await sleigh.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
await sleigh.screenshot({ path: path.join(outDir, 'sleigh-idle.png') });
await sleigh.hover(); await page.waitForTimeout(900);
await sleigh.screenshot({ path: path.join(outDir, 'sleigh-hover.png') });
console.log('sleigh hover', await page.evaluate(() => getComputedStyle(document.querySelector('.game-sleigh')).transform));
await page.mouse.move(0, 0);
const wreath = page.locator('[data-illustration-slot="christmas-matching"]');
await wreath.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
await wreath.screenshot({ path: path.join(outDir, 'wreath-idle.png') });
await wreath.hover(); await page.waitForTimeout(900);
await wreath.screenshot({ path: path.join(outDir, 'wreath-hover.png') });
console.log('wreath hover', await page.evaluate(() => getComputedStyle(document.querySelector('.game-wreath')).transform));
await page.mouse.move(0, 0);
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(700);
console.log('foreground paused at top', await page.evaluate(() => document.querySelector('.matching-foreground').classList.contains('is-paused')));
await page.locator('.matching-foreground').scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
console.log('foreground running loops', await page.evaluate(() => document.querySelector('.matching-foreground').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length));
const reduced = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
await reduced.goto(url, { waitUntil: 'networkidle' });
await reduced.waitForTimeout(1800);
console.log('reduced', await reduced.evaluate(() => ({ paper: getComputedStyle(document.querySelector('.games-hero-hill')).animationName, opacity: getComputedStyle(document.querySelector('.games-hero-hill')).opacity, board: getComputedStyle(document.querySelector('.sign-board-title')).animationName, wreath: getComputedStyle(document.querySelector('.wreath-swing')).animationName })));
await browser.close();
