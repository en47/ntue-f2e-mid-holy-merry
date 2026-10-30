// 以 Playwright 對本機伺服器截圖，供人工視覺檢查；不屬於 npm test。
// 先啟動：python3 -m http.server 5500 --bind 127.0.0.1
// 執行：node scripts/screenshot-pages.mjs [--probe]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(project, 'screenshots');
const base = 'http://127.0.0.1:5500';
const viewports = [{ name: '375', width: 375, height: 812 }, { name: '768', width: 768, height: 1024 }, { name: '1440', width: 1440, height: 900 }];
const pages = ['index.html', 'intro.html', 'game.html', 'wish.html'];
const probe = process.argv.includes('--probe');

// 捲到底再回頂，讓 IntersectionObserver 的 [data-reveal] 真的顯示出來。
async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  });
  await page.waitForFunction(() => {
    const slot = document.querySelector('.games-hero-santa');
    return !slot || slot.dataset.state !== 'loading';
  }, null, { timeout: 30000 }).catch(() => {});
  // 量測前逐一帶入視野，否則未 reveal 的區塊仍帶著進場位移，量到的會是動畫中繼值。
  for (const el of await page.$$('[data-reveal], .page-foreground')) { await el.scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(250); }
  await page.waitForFunction(() => document.querySelector('.page-foreground')?.classList.contains('is-visible'), null, { timeout: 20000 }).catch(() => console.error('page-foreground never revealed'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(900);
}

async function metrics(page) {
  return page.evaluate(() => {
    const rect = sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1), left: +r.left.toFixed(1) }; };
    const frames = [...document.querySelectorAll('.game-frame')].map(el => rect('#' + el.id));
    const out = {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hero: rect('.games-hero'), heroSanta: rect('.games-hero-santa'), heroCanvas: rect('.games-hero-santa canvas'),
      heroSnow: rect('.games-hero-snow'), titleSign: rect('.games-hero-title-sign'), navSign: rect('.games-hero-navigation'),
      santaState: document.querySelector('.games-hero-santa')?.dataset.state ?? null,
      panels: frames, flyIframe: rect('#flying-game'), matchIframe: rect('#matching-frame'),
      panelContentHeight: getComputedStyle(document.querySelector('.games-page') ?? document.body).getPropertyValue('--game-panel-content-height').trim() || null,
      slots: [...document.querySelectorAll('.game-illustration-slot')].map(el => { const r = el.getBoundingClientRect(); return { slot: el.dataset.illustrationSlot, w: +r.width.toFixed(1), h: +r.height.toFixed(1), ratio: +(r.width / r.height).toFixed(3) }; }),
    };
    if (out.panels.length === 2) {
      out.equalPanels = Math.abs(out.panels[0].w - out.panels[1].w) < .5 && Math.abs(out.panels[0].h - out.panels[1].h) < .5;
      out.flySlackPx = out.flyIframe && out.panels[0] ? +(out.panels[0].h - out.flyIframe.h).toFixed(1) : null;
      out.matchSlackPx = out.matchIframe && out.panels[1] ? +(out.panels[1].h - out.matchIframe.h).toFixed(1) : null;
    }
    return out;
  });
}

// 量測用：隱藏 Hero 其他圖層、底色填純洋紅，單獨拍出 3D 角色輪廓。
const PROBE_CSS = `.games-hero { background: #ff00ff !important; }
.games-hero-scenery, .games-hero-snow, .games-hero-title-sign, .games-hero-navigation, .games-hero-model-status { visibility: hidden !important; }`;

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = {};
for (const view of viewports) {
  const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 160)));
  for (const name of pages) {
    const slug = name.replace('.html', '');
    await page.goto(`${base}/${name}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.screenshot({ path: path.join(outDir, `${slug}-${view.name}.png`), fullPage: true });
    await page.screenshot({ path: path.join(outDir, `${slug}-${view.name}-fold.png`) });
    const data = await metrics(page);
    report[`${slug}-${view.name}`] = { ...data, consoleErrors: errors.splice(0) };
    // Hero 特寫，方便近距離看構圖。
    const hero = await page.$(name === 'game.html' ? '.games-hero' : '.storybook');
    if (hero) await hero.screenshot({ path: path.join(outDir, `${slug}-${view.name}-hero.png`) });
    if (probe && name === 'game.html') {
      await page.addStyleTag({ content: PROBE_CSS });
      await page.waitForTimeout(500);
      // 只拍角色圖層：透明畫布疊在洋紅底上，邊框不會混進量測範圍。
      const probeSlot = await page.$('.games-hero-santa');
      if (probeSlot) await probeSlot.screenshot({ path: path.join(outDir, `probe-santa-${view.name}.png`) });
      report[`${slug}-${view.name}`].probeSlotRect = await page.evaluate(() => {
        const s = document.querySelector('.games-hero-santa').getBoundingClientRect();
        const h = document.querySelector('.games-hero').getBoundingClientRect();
        return { slotTopInHeroPct: +((s.top - h.top) / h.height * 100).toFixed(1), slotHeightPct: +(s.height / h.height * 100).toFixed(1), heroH: +h.height.toFixed(1) };
      });
    }
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
console.log('screenshots + metrics.json ->', outDir);
