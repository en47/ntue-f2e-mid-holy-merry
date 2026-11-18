// Santa 卡住時的場景暗示（流程順暢化第三階段）的瀏覽器驗收：一分鐘沒有存檔變動、也沒開卡片，目前目標的那一樣東西
// 才自己動一下，之後每 20 秒一次，一次只動一樣，動完回到原位、不說任何話；開著線索本不動、剛收好也先等一下，減少動態時不動。用
// Playwright 的假時鐘快轉那一分鐘。院子（口袋裡有地衣：麋鹿回頭用鼻子頂餵食槽）、屋裡（快熄的爐火舔一下）、書櫃前
// （金色書脊輪流跳）、小房間（交接表在釘子上晃、登記簿最上面那頁被風掀起、舊紀錄簿左右晃）。
// 只讀寫這個瀏覽器的 localStorage，不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-nudge.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), page = await context.newPage(), errors = [], broken = [];
page.on('pageerror', e => { broken.push(String(e)); console.log('PAGE ERROR', String(e)); });
// Time runs as usual; `skip` jumps the page's clock and timers ahead, as if the visitor had sat still that long.
await page.clock.install();
const wait = ms => page.waitForTimeout(ms), skip = ms => page.clock.fastForward(ms);
let shots = 0; const shot = name => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null);
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) errors.push(label); };
const press = selector => page.evaluate(selector => document.querySelector(selector)?.click(), selector);
const view = () => page.evaluate(() => document.querySelector('#cabin-stage').dataset.view);
const caption = () => page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? '');
const spot = async (id, ms = 7000) => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(ms); };
const toRoom = async () => { for (let i = 0; i < 3 && (await view()) !== 'inside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5000); } };
// Into the little room: through the open bookcase, or pushing it open again first.
const enter = async () => { await spot('shelf'); for (let i = 0; i < 2 && (await view()) !== 'secret'; i++) { await press('.books-tools button:not([hidden])'); await wait(4800); } };
async function load(record) {
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
  // Every move as it starts: what moved (the stage carries data-beckon while it moves).
  await page.evaluate(() => { const stage = document.querySelector('#cabin-stage'); window.beckoned = []; new MutationObserver(() => { if (stage.dataset.beckon) window.beckoned.push(stage.dataset.beckon); }).observe(stage, { attributes: true, attributeFilter: ['data-beckon'] }); });
}
const moved = () => page.evaluate(() => window.beckoned);
const resting = () => page.evaluate(() => !document.querySelector('#cabin-stage').dataset.beckon);
// Sat still: nothing before the minute is up (the page has been open under twenty-five seconds when this starts), then one
// thing, the one expected, back at rest without a word; nothing more for twenty seconds, then once again. The first move
// is caught in three pictures 0.3 s apart, with time held still between them and stepped on by hand. `turn`: on a narrow
// screen the thing may be off to the right; it waits, and moves once the visitor has turned that many steps to it.
async function stuck(label, expect, turn = 0) {
  await skip(35000); await wait(2500);
  check((await moved()).length === 0, `${label}：不到一分鐘，什麼都不動`);
  const said = await caption();
  await skip(20000); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 10));
  for (let i = 0; i < 15 && !(await moved()).length; i++) await page.clock.runFor(1000);
  if (!(await moved()).length && turn) {
    check(true, `${label}：在畫面外，先不動`);
    await page.focus('.cabin-gesture'); for (let i = 0; i < turn; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < 12 && !(await moved()).length; i++) await page.clock.runFor(500);
    check((await moved()).length === 1, `${label}：轉過去看得到了，才動`);
  }
  for (let i = 1; i <= 3; i++) { await page.clock.runFor(300); await shot(`${label}-${i}`); }
  await page.clock.resume(); await wait(2600);
  const first = await moved();
  check(first.length === 1 && expect(first[0]), `${label}：一分鐘後只有一樣動：${first.join('、') || '沒有'}`);
  check(await resting(), `${label}：動完回到原位`); check((await caption()) === said, `${label}：沒有說任何話`);
  await skip(12000); await wait(1500); check((await moved()).length === 1, `${label}：二十秒內不會再動`);
  await skip(10000); await wait(2600); const again = await moved();
  check(again.length === 2 && expect(again[1]), `${label}：二十秒後再動一次：${again.join('、')}`);
  return again;
}

const yard = { held: ['key', 'matches'], used: ['lichen', 'handle'] }, inside = { bag: { held: ['magnifier', 'pin'], used: ['lichen', 'handle', 'matches', 'key'] }, hoist: { locked: true, found: true } };
const shelf = ['book-h1', null, 'book-l1', 'book-y1', null, null, null, 'book-r2', 'book-y2', 'book-m1', 'book-o1', 'book-r1', 'book-e1'];
const known = { ...inside, story: { left: true, opened: true, shut: true, seen: ['tags', 'log', 'rules'], told: true, shelf }, clues: ['care-note', 'route', 'route-note'] };

// The yard, the lichen in the pocket: at the reindeer, he turns to his trough and noses it. With the clue book open nothing
// moves; nor under reduced motion.
await load({ bag: { held: ['lichen'], used: [] }, clues: ['care-note'] });
await spot('reindeer');
await stuck('院子', id => id === 'reindeer');
await press('.notebook-button'); await wait(1500); await skip(25000); await wait(2500);
check((await moved()).length === 2, '開著線索本：什麼都不動');
await press('.notebook-close'); await wait(3000);
check((await moved()).length === 2, '剛收好線索本：先等一下，不會馬上動');
await page.emulateMedia({ reducedMotion: 'reduce' }); await skip(65000); await wait(2500);
check((await moved()).length === 2, '減少動態：什麼都不動');
await page.emulateMedia({ reducedMotion: 'no-preference' });

// In the room before Santa has gone out: the low fire licks up.
await load({ bag: yard, hoist: { locked: true, found: true }, clues: ['care-note', 'repair-tag', 'care-log', 'barn-note'] });
await spot('inside');
await stuck('屋裡', id => id === 'hearth', mobile ? 6 : 0);

// At the bookcase. Santa is back in his chair after the reload, and his books are not to be touched while he sits there: a
// shake of the snow globe and back to the middle of the room sends him out again. Then the gold books hop, one at a time,
// a different one each time.
await load({ bag: yard, hoist: { locked: true, found: true }, story: { left: true }, clues: ['care-note', 'letter-hearth', 'chair-note'] });
await spot('globe'); await page.focus('.snow-globe'); await page.keyboard.press('ArrowRight'); await wait(1500);
await toRoom(); await wait(10000);
check(await page.evaluate(() => Boolean(document.querySelector('.chair-card'))), '聖誕老人又出門了，搖椅上留著紙條');
await press('.chair-card .cabin-letter-close'); await wait(600);
await spot('shelf');
const books = await stuck('書櫃', id => ['book-o1', 'book-m1', 'book-e1', 'book-r1', 'book-r2'].includes(id));
check(books[0] !== books[1], `書櫃：輪流換一本金色書脊：${books.join('、')}`);

// Behind the bookcase: the shift log before it is put right; the register once the secret is told; the old record book
// for a substitute with two jobs done.
await load({ ...inside, story: { left: true, opened: true, shut: false, seen: [], told: false, shelf }, clues: ['care-note', 'chair-note'] });
await enter(); check((await view()) === 'secret', '走進小房間');
await stuck('交接表', id => id === 'secret-log', mobile ? 4 : 0);
await load({ ...known, volunteer: { mark: '', tasks: [] }, finale: { invited: true } });
await enter();
await stuck('登記簿', id => id === 'register');
await load({ ...known, volunteer: { mark: 'J', tasks: ['lichen', 'hay'] }, finale: { invited: true } });
await enter();
await stuck('舊紀錄簿', id => id === 'record');

check(broken.length === 0, '沒有頁面錯誤');
console.log(errors.length ? `FAILED ${errors.length}` : 'PASS');
await browser.close();
process.exit(errors.length ? 1 : 0);
