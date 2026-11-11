// Santa 第三章（書櫃後的小房間）的瀏覽器驗收：從書櫃剛打開的存檔開始。一進門看得到的東西都沒有「替身」兩個字；名牌有
// 工作記號；小冊只讀得到值班須知（後面黏住）；登記簿有頁首與加入年份、最後一列空白；交接表要看顏色與記號、對照別處的紀錄、
// 照值班須知排除才補得對。補對就是第一次反轉，聖誕老人回來說明並翻開守則，之後才能在登記簿加入。舊紀錄簿隨時轉得開（不必
// 先做工作），開啟和理解分開，設計文件 6.4 節的四種順序都走一遍：
//   一、先補交接表、再開舊紀錄：讀完就理解。
//   二、先開舊紀錄（只讀得懂表面）、再補交接表：聖誕老人提醒、書角發光，再翻一次才理解。
//   三、補好交接表但一直不開舊紀錄：主線照常，可以加入。
//   四、加入前就開過，加入後拿到空白紙條烤出字：字幕說你已經知道了。
// 也檢查最小那頂帽子隨時翻得開、用放大鏡讀出 H. 2003。手機尺寸用真的觸控事件。只讀寫這個瀏覽器的 localStorage，不連雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-secret.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
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
async function tap(selector) { const [x, y] = await centre(selector); if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await wait(300); }
async function drag(from, to) {
  const [x0, y0] = await centre(from), [x1, y1] = await centre(to), points = Array.from({ length: 13 }, (_, i) => [x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12]);
  if (mobile) {
    const touch = (type, [x, y] = []) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', points[0]); for (const point of points.slice(1)) { await touch('touchMove', point); await wait(16); } await touch('touchEnd');
  } else { await page.mouse.move(...points[0]); await page.mouse.down(); for (const point of points.slice(1)) await page.mouse.move(...point); await page.mouse.up(); }
  await wait(900);
}
const caption = () => page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? '');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const visible = selector => page.evaluate(selector => { const node = document.querySelector(selector); return Boolean(node && !node.hidden && node.getClientRects().length); }, selector);
const press = selector => page.evaluate(selector => document.querySelector(selector)?.click(), selector);
const text = selector => page.evaluate(selector => document.querySelector(selector)?.textContent ?? '', selector);
const thing = async id => { await press(`.secret-thing[data-id="${id}"]`); await wait(800); };
const putBack = async () => { await press('.secret-card .cabin-letter-close'); await wait(500); };
const spot = async (id, ms = 7000) => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(ms); };
const toRoom = async () => { for (let i = 0; i < 3 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'inside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5000); } };
// Into the little room: through the open bookcase, or pushing it open again first (it shuts behind you on leaving).
const enter = async () => { await spot('shelf'); for (let i = 0; i < 2 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'secret'; i++) { await press('.books-tools button:not([hidden])'); await wait(4800); } };
const openPocket = async () => { if (await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'false')) await tap('.bag-pocket'); };
const leave = async () => { await press('.books-enter'); await wait(4500); await toRoom(); };
// The room's own words while open: every card's text and the caption.
const everything = () => page.evaluate(() => [...document.querySelectorAll('.secret-card, .cabin-caption')].map(node => node.textContent).join(''));
async function turnDials(code) { for (const [i, digit] of [...code].entries()) for (let k = 0; k < Number(digit); k++) { await press(`.lock-dial:nth-child(${i + 1})`); await wait(60); } await wait(2400); }
async function fillLog() { for (const mark of ['E', 'O', 'K', 'H', 'N', 'K', 'H']) { await page.evaluate(m => [...document.querySelectorAll('.shift-pick')].find(b => b.textContent === `${m}.`).click(), mark); await wait(160); } await wait(1500); }
async function load(record) {
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
}
// The bookcase just opened, Santa out with the reindeer; the yard and the room done.
const opened = { bag: { held: ['magnifier', 'pin'], used: ['lichen', 'handle', 'matches', 'key'] }, hoist: { locked: true, found: true }, story: { left: true, opened: true, shut: false, seen: [], told: false, shelf: ['book-h1', null, 'book-l1', 'book-y1', null, null, null, 'book-r2', 'book-y2', 'book-m1', 'book-o1', 'book-r1', 'book-e1'] }, clues: ['care-note', 'repair-tag', 'care-log', 'barn-note', 'letter-hearth', 'blotter', 'music-bookmarks', 'globe-village', 'globe-base', 'chair-note', 'route-note'] };

// Order two: the old record first (only its surface), then the log; Santa's word, the corner's glint, read again.
await load(opened);
await enter(); await shot('room');
check((await caption()).includes('小房間') && !(await caption()).includes('替身'), `一進門：${await caption()}`);
await thing('tags'); const tags = await page.evaluate(() => document.querySelectorAll('.secret-tags .secret-workmark').length); check(tags === 5, '名牌板：五個名牌各有工作記號'); await shot('tags'); let words = await everything(); await putBack();
await thing('rules'); check((await text('.secret-card')).includes('值班須知') && (await text('.secret-card')).includes('黏在一起') && !(await text('.secret-card')).includes('替身守則'), '小冊：只讀得到值班須知，後面黏住'); words += await everything(); await shot('duty'); await putBack();
await thing('register'); const register = await text('.secret-card'); check(register.includes('2026 年聖誕季') && register.includes('2003') && register.includes('2015') && register.includes('（空白）') && !(await visible('.register-sign')), '登記簿：頁首、加入年份、空白的一列，還不能簽'); words += await everything(); await shot('register'); await putBack();
for (const id of ['stamps', 'hats', 'log']) { await thing(id); words += await everything(); await putBack(); }
await thing('record'); check(await visible('.lock-dial'), '舊紀錄簿：紅繩、四位數小鎖，不必先做工作');
words += await everything(); check(!words.includes('替身'), '一進門看得到的東西，都沒有「替身」兩個字');
await turnDials('2003'); await shot('record-early');
check((await saved()).finale.unlocked && !(await saved()).finale.twist, '轉到 2003 就打開；還沒補交接表，不算理解');
check((await caption()).includes('夜班是什麼'), `只讀得懂表面：${await caption()}`); await putBack();
await thing('log'); await fillLog(); await shot('log-solved');
check((await saved()).story.seen.includes('log') && (await text('.secret-card')).includes('兩個人接力'), '交接表補對：每一晚都是兩個人接力'); await putBack(); await wait(2500);
check((await caption()).includes('不只一位'), `第一次反轉：${await caption()}`);
await leave(); await wait(16000);
const told = await saved(); check(told.story.told, '聖誕老人回來，說明了秘密'); await shot('santa-back');
await enter();
check(await page.evaluate(() => document.querySelector('.secret-thing[data-id="record"]').classList.contains('is-glinting')), '舊紀錄簿的書角在發光');
await thing('rules'); check((await text('.secret-card')).includes('替身守則'), '小冊黏住的後半本翻開了：替身守則'); await putBack();
await thing('record'); await wait(800); check((await saved()).finale.twist, '再翻一次舊紀錄簿：理解第二次反轉'); await shot('twist'); await putBack();
// The smallest hat, turned over whenever; its stitching read with the magnifier.
await thing('hats'); await press('.secret-card .register-sign'); await wait(900);
check((await saved()).ornaments.includes('H'), '最小的帽子翻過來：荷莉的見面禮（不必先讀舊紀錄）');
await openPocket(); await drag('.bag-item[data-item="magnifier"]', '.hat-inside'); await wait(600);
check((await saved()).clues.includes('hat-2003') && (await text('.hat-inside')).includes('H. 2003'), '放大鏡讀出帽子裡的「H. 2003」'); await shot('hat'); await putBack();

// Order one: the log, then the old record: understood on reading it.
await load(opened); await enter();
await thing('log'); await fillLog(); await putBack(); await wait(2500);
await thing('record'); await turnDials('2003'); await wait(800);
check((await saved()).finale.twist, '先補交接表、再開舊紀錄：讀完就理解'); await putBack();

// Order three: the log put right, the record never opened: Santa tells you, and the register can be signed.
await load(opened); await enter();
await thing('log'); await fillLog(); await putBack(); await wait(2500);
await thing('register'); check(!(await visible('.register-letter')), 'Santa 還沒說明以前，登記簿還不能簽'); await putBack();
await leave(); await wait(16000);
await enter(); await thing('register');
check(await visible('.register-letter'), '聖誕老人說明以後，登記簿最下面一格可以簽');
await page.evaluate(() => [...document.querySelectorAll('.register-letter')].find(b => b.textContent === 'J').click()); await wait(200); await press('.register-sign'); await wait(800);
const signed = await saved(); check(signed.volunteer.mark === 'J' && !signed.finale.unlocked, '沒開舊紀錄也能加入，主線照常');
check((await text('.secret-card')).includes('檸檬'), '加入以後，你那一列夾著空白紙條'); await shot('signed'); await putBack();

// Order four: the record opened before joining; then joined, the slip held to the fire says you know the year already.
await load({ ...opened, story: { ...opened.story, seen: ['log'], told: true }, finale: { unlocked: true, twist: true }, volunteer: { mark: 'J', tasks: [] } });
await enter(); await thing('register'); await press('.register-cord .register-sign'); await wait(600); await putBack();
check((await saved()).finale.slip === 'taken', '拿起空白紙條');
await leave(); await spot('hearth'); for (let i = 0; i < 2; i++) { await page.evaluate(i => document.querySelectorAll('.hearth-log')[i].click(), i); await wait(400); }
await press('.hearth-slip'); await wait(4800); await press('.lemon-card .cabin-letter-close'); await wait(400);
check((await caption()).includes('你已經知道了'), `加入前就開過舊紀錄，紙條烤出字時：${await caption()}`);

console.log(errors.length ? `FAIL  ${errors.length} 項沒通過` : `PASS  小房間第三章（${mobile ? '手機觸控' : '桌機滑鼠'}）`);
await browser.close(); process.exitCode = errors.length ? 1 : 0;
