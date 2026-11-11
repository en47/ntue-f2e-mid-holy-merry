// Santa 口袋（第一階段）的瀏覽器驗收：在 tests/bag-preview.html 撿起三樣東西、檢查並翻面、拖到錯的地方彈回、拖到對的地方
// 用掉或裝上、點選再點目標、重新整理後口袋還在；再在真正的 santa.html 放一個道具進存檔，確認口袋出現、檢查卡可以打開，
// 而且原本的場景照常載入。手機尺寸用真的觸控事件。只讀寫這個瀏覽器的 localStorage（預覽頁用自己的 key），不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-bag.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), page = await context.newPage(), errors = [];
page.on('pageerror', e => { errors.push(String(e)); console.log('PAGE ERROR', String(e)); });
const cdp = await context.newCDPSession(page);
const wait = ms => page.waitForTimeout(ms);
let shots = 0; const shot = name => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null);
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) errors.push(label); };
const centre = async selector => { const box = await page.locator(selector).first().boundingBox(); return [box.x + box.width / 2, box.y + box.height / 2]; };
// A tap and a drag, by touch on a phone and by mouse on a desktop.
async function tap(selector) { const [x, y] = await centre(selector); if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await wait(250); }
async function drag(from, to) {
  const [x0, y0] = await centre(from), [x1, y1] = await centre(to), steps = 12;
  if (mobile) {
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', x0, y0); for (let i = 1; i <= steps; i++) { await touch('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await wait(16); } await touch('touchEnd');
  } else { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x1, y1, { steps }); await page.mouse.up(); }
  await wait(900);
}
const said = () => page.evaluate(() => document.querySelector('#said').textContent);
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:bag-preview') || '{}').bag);
const held = () => page.evaluate(() => [...document.querySelectorAll('.bag-item')].map(item => item.dataset.item));

await page.goto(`${BASE}/tests/bag-preview.html`);
await page.evaluate(() => localStorage.removeItem('holy-merry:cabin:bag-preview')); await page.reload(); await wait(800);
check(await page.evaluate(() => document.querySelector('.cabin-bag').hidden), '口袋在撿到東西以前是藏起來的');
await tap('[aria-label="撿起 key"]'); await wait(900);
check(JSON.stringify(await held()) === '["key"]', '撿起鑰匙，口袋多一格');
check((await said()).includes('收進口袋'), `撿起時有字幕：${await said()}`);
await wait(1400); check((await said()).includes('拖到要用的地方'), '第一次撿到東西時說明怎麼用'); await shot('picked');
// Look at it closely: the card, turned over, put away with Esc.
await tap('.bag-item[data-item="key"]'); check(await page.evaluate(() => document.querySelector('.bag-item[data-item="key"]').getAttribute('aria-pressed')) === 'true', '點一下：拿在手上');
await tap('.bag-look'); await wait(600);
check(await page.evaluate(() => Boolean(document.querySelector('.inspect-card'))), '檢查卡打開了');
check(await page.evaluate(() => document.querySelector('.inspect-card').style.backgroundImage.startsWith('url(')), '檢查卡是紙張');
await drag('.inspect-object', '.inspect-title'); await shot('inspect-tilt');
await tap('.inspect-flip'); await wait(700);
check((await page.evaluate(() => document.querySelector('.inspect-words').textContent)).includes('冬青葉'), '翻面看到背面的字'); await shot('inspect-back');
await page.keyboard.press('Escape'); await wait(400);
check(await page.evaluate(() => !document.querySelector('.inspect-card')), 'Esc 收好檢查卡');
// The wrong place shakes its head; the right one takes it.
await drag('.bag-item[data-item="key"]', '[aria-label="冷冷的小火爐"]');
check(JSON.stringify(await held()) === '["key"]' && (await said()) === '鑰匙放不進火爐裡。', `用錯：彈回口袋、說明原因（${await said()}）`);
await drag('.bag-item[data-item="key"]', '#said');
check(JSON.stringify(await held()) === '["key"]', '放在沒有目標的地方：回到口袋');
await drag('.bag-item[data-item="key"]', '[aria-label="上鎖的小盒子"]');
check(JSON.stringify(await held()) === '[]' && (await said()).includes('盒子開了'), '用對：鑰匙裝上、離開口袋'); await shot('fitted');
// Tap, then tap the place: the magnifier is kept, the matches are used up.
await tap('[aria-label="撿起 matches"]'); await wait(900); await tap('[aria-label="撿起 magnifier"]'); await wait(900);
await tap('.bag-item[data-item="magnifier"]'); await tap('[aria-label="小字的紙條"]'); await wait(1400);
check(JSON.stringify(await held()) === '["matches","magnifier"]' && (await said()).includes('Look within'), '點選再點目標：放大鏡用完還在');
await tap('.bag-item[data-item="matches"]'); await tap('[aria-label="上鎖的小盒子"]');
check(JSON.stringify(await held()) === '["matches","magnifier"]', '點選再點錯的地方：還在口袋');
await tap('.bag-item[data-item="matches"]'); await tap('[aria-label="冷冷的小火爐"]'); await wait(1200);
check(JSON.stringify(await held()) === '["magnifier"]', '火柴用掉了'); await shot('spent');
// Keyboard: Enter on the slot, Enter on the place.
await page.focus('.bag-item[data-item="magnifier"]'); await page.keyboard.press('Enter'); await page.focus('[aria-label="小字的紙條"]'); await page.keyboard.press('Enter'); await wait(1300);
check(JSON.stringify(await held()) === '["magnifier"]' && (await said()).includes('Look within'), '鍵盤也能用');
check(JSON.stringify(await stored()) === JSON.stringify({ held: ['magnifier'], used: ['key', 'matches'] }), '存檔記得口袋');
await page.reload(); await wait(900);
check(JSON.stringify(await held()) === '["magnifier"]' && await page.evaluate(() => !document.querySelector('.try-thing')), '重新整理後口袋還在，撿過的東西不會再出現');
if (mobile) { check(await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'false'), '手機上口袋先收起來'); await tap('.bag-pocket'); check(await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'true'), '點口袋展開'); }
await shot('reloaded');

// The real page: a save from before the pocket loads as before; one with something in the pocket shows it.
await page.goto(`${BASE}/santa.html`);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify({ story: { left: true }, ornaments: ['N'], clues: ['chair-note'] })); });
await page.reload();
await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1200);
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1')));
check(before.ornaments?.join() === 'N' && await page.evaluate(() => document.querySelector('.cabin-bag').hidden), '舊存檔照常讀進來，口袋藏著');
await page.evaluate(() => { const saved = JSON.parse(localStorage.getItem('holy-merry:cabin:v1')); saved.bag = { held: ['magnifier', 'gear'], used: [] }; localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(saved)); });
await page.reload();
await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
if (mobile) await tap('.bag-pocket');
check(JSON.stringify(await held()) === '["magnifier","gear"]', '真正的 Santa 頁：口袋裡有存檔的東西'); await shot('santa-bag');
await page.locator('.bag-item[data-item="gear"]').dblclick(); await wait(700);
check(await page.evaluate(() => document.querySelector('.inspect-card')?.textContent.includes('特大齒輪')), '真正的 Santa 頁：雙擊打開檢查卡'); await shot('santa-inspect');
await page.keyboard.press('Escape'); await wait(300);
check(await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view === 'outside'), 'Esc 只收檢查卡，沒有離開場景');
await browser.close();
console.log(errors.length ? `FAIL (${errors.length})` : 'PASS'); process.exit(errors.length ? 1 : 0);
