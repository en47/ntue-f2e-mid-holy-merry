// Santa 第二章（小屋）的瀏覽器驗收：從院子已經做完的存檔開始（口袋裡有小鑰匙和火柴）。壁爐只剩小火苗、木柴點不著，
// 火柴點燃後火一直燒著，火光照出石板的 R、書櫃的金色書脊反光；書桌抽屜鎖著，鑰匙開了以後拿到放大鏡，吸墨器翻過來是
// 反寫的英文；音樂盒升起四枚空白書籤，盒底抽屜被卡榫卡住；雪花球要用放大鏡才看得清舊村子與底座。玩過兩樣聖誕老人
// 出門，搖椅上是英文紙條；用另一本 R 拼出 MORE 也能打開書櫃。用錯的東西一律彈回，字幕從不說出答案。重新整理後火還燒著、
// 抽屜還開著；最後用一份舊存檔（音樂盒抽屜打開過、書櫃也開過）確認讀得進來。手機尺寸用真的觸控事件。
// 只讀寫這個瀏覽器的 localStorage，不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-room.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { auditor } from './santa-audit.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), page = await context.newPage(), errors = [];
const audit = auditor(page, { mobile, width: w, script: 'room' });
page.on('pageerror', e => { errors.push(String(e)); console.log('PAGE ERROR', String(e)); });
const cdp = await context.newCDPSession(page);
const wait = ms => page.waitForTimeout(ms);
let shots = 0; const shot = name => audit(name).then(() => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null));
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
// Every caption said along the way, to check none gives the answer away.
const heard = new Set();
const caption = async () => { const text = await page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? ''); heard.add(text); return text; };
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const visible = selector => page.evaluate(selector => { const node = document.querySelector(selector); return Boolean(node && !node.hidden && node.getClientRects().length); }, selector);
const press = selector => page.evaluate(selector => document.querySelector(selector)?.click(), selector);
const spot = async id => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(7000); };
const openPocket = async () => { if (await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'false')) await tap('.bag-pocket'); };
const toRoom = async () => { for (let i = 0; i < 3 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'inside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5000); } };
async function load(record) {
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
}

// The yard done: the little key and the matches in the pocket.
await load({ bag: { held: ['key', 'matches'], used: ['lichen', 'handle'] }, hoist: { locked: true, found: true }, clues: ['care-note', 'repair-tag', 'care-log', 'barn-note'] });
// The hearth: a dying flicker that will not catch a log; a match lights it for good.
await spot('hearth'); await shot('hearth-weak');
check((await caption()).includes('快熄'), `壁爐只剩小火苗：${await caption()}`);
await tap('.hearth-log'); check((await caption()).includes('點不著'), '火太弱，木柴點不著');
await openPocket(); await drag('.bag-item[data-item="key"]', '.hearth-fire');
check((await saved()).bag.held.includes('key'), '鑰匙拖到火裡：彈回口袋');
await drag('.bag-item[data-item="matches"]', '.hearth-fire'); await wait(3200);
check((await saved()).bag.used.includes('matches') && (await caption()).includes('R'), `火柴點燃，石板浮出 R：${await caption()}`);
await wait(3400); check((await caption()).includes('金光'), `書櫃上的金色書脊在火光裡反光：${await caption()}`); await shot('hearth-lit');
// The desk: locked, holly round the keyhole; the key opens it and stays; a magnifier, and the blotter's line backwards.
await spot('desk'); await tap('.desk-drawer');
check((await caption()).includes('冬青葉'), '抽屜鎖著，鑰匙孔兩邊刻著冬青葉');
await openPocket(); await drag('.bag-item[data-item="key"]', '.desk-drawer'); await wait(600);
check((await saved()).bag.used.includes('key'), '小鑰匙打開抽屜，留在鎖上');
await tap('.desk-drawer'); await wait(1000); await shot('drawer');
await tap('.drawer-thing[aria-label="黃銅框的放大鏡"]'); await wait(1300);
check((await saved()).bag.held.includes('magnifier'), '抽屜裡的放大鏡收進口袋');
await tap('.drawer-thing[aria-label^="搖擺式吸墨器"]'); await wait(900); await tap('.inspect-flip'); await wait(900); await shot('blotter');
const mirror = await page.evaluate(() => { const node = document.querySelector('.inspect-mirror'); return node && { text: node.textContent, flipped: getComputedStyle(node).transform }; });
check(mirror?.text.replace('\n', ' ') === 'Look within our name.' && mirror.flipped.startsWith('matrix(-1'), `吸墨器翻過來：反寫的「${mirror?.text}」`);
check((await saved()).clues.includes('blotter'), '吸墨器記進線索本');
await press('.inspect-close'); await wait(400); await press('.drawer-card .cabin-letter-close'); await wait(400);
// The music box: four blank bookmarks rise; its drawer is caught, and the magnifier does not undo it.
await spot('musicbox'); for (let i = 0; i < 8; i++) { await page.focus('.musicbox-knob'); await page.keyboard.press('Enter'); await wait(120); }
await wait(3800); check((await caption()).includes('四枚金色的書籤') && await visible('.musicbox-letter.is-up'), `音樂盒升起四枚空白書籤：${await caption()}`); await shot('bookmarks');
await tap('.musicbox-drawer'); check((await caption()).includes('卡榫'), '盒底抽屜被黃銅卡榫卡住');
await openPocket(); await drag('.bag-item[data-item="magnifier"]', '.musicbox-drawer');
check((await caption()).includes('孔太小') && (await saved()).bag.held.includes('magnifier'), '放大鏡伸不進卡榫的小孔，彈回');
// The snow globe: the old village, read only with the magnifier.
await spot('globe'); await page.focus('.snow-globe'); for (let i = 0; i < 4; i++) { await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await wait(150); }
await page.waitForFunction(() => document.querySelector('.cabin-caption').textContent.includes('落定'), null, { timeout: 30000 });
check((await caption()).includes('看不清'), `沒有放大鏡看不清：${await caption()}`);
await openPocket(); await drag('.bag-item[data-item="magnifier"]', '.snow-globe'); await wait(900); await shot('lens');
check(await visible('.lens-card') && (await page.evaluate(() => document.querySelector('.lens-base').textContent)) === 'H. · 2003', '放大鏡下：舊小屋左後方的小房間、底座 H. · 2003');
const lensed = await saved(); check(lensed.clues.includes('globe-village') && lensed.clues.includes('globe-base') && lensed.bag.held.includes('magnifier'), '兩條線索記進線索本，放大鏡還在口袋');
await press('.lens-card .cabin-letter-close'); await wait(400);
// Back in the middle of the room: Santa goes out, and on his chair, one line in English.
await toRoom(); await wait(10000); await shot('chair');
check((await page.evaluate(() => document.querySelector('.chair-card .chair-line')?.textContent)) === "There's always room for more.", '聖誕老人出門，搖椅上的英文紙條');
await press('.chair-card .cabin-letter-close'); await wait(400);
// The bookcase, spelled with the other R book.
await spot('shelf'); check(!(await visible('.books-found')), '書櫃前沒有「找到的字母」紙片');
for (const [from, to] of [[4, 9], [1, 10], [7, 11], [5, 12]]) { await tap(`.books-place[data-place="${from}"]`); await wait(150); await tap(`.books-place[data-place="${to}"]`); await wait(700); }
await wait(4800); await shot('opened');
check((await saved()).story.opened, '用另一本 R 拼出 MORE，書櫃也打開了');
check(![...heard].some(text => /MORE|M、O、R、E/.test(text)), '一路上的字幕都沒有說出答案');
// Reloaded: the fire still burns, the drawer still open.
const done = await saved();
await load(done); await spot('hearth');
check(!(await caption()).includes('快熄'), `重新整理：火還燒著 ${await caption()}`);
await spot('desk'); await tap('.desk-drawer'); await wait(900); check(await visible('.drawer-card'), '重新整理：抽屜不用再開鎖');
// An older record: the music box drawer opened before it had a catch, the bookcase open.
await load({ ornaments: ['N'], story: { left: true, opened: true, shut: true, seen: ['tags', 'log', 'rules'] }, clues: ['letter-desk', 'letter-globe', 'music-drawer'] });
await spot('musicbox'); await tap('.musicbox-drawer'); await wait(800);
check(await visible('.comb-card'), '舊存檔：開過的音樂盒抽屜不必再撥卡榫');

console.log(errors.length ? `FAIL  ${errors.length} 項沒通過` : `PASS  小屋第二章（${mobile ? '手機觸控' : '桌機滑鼠'}）`);
await browser.close(); process.exitCode = errors.length ? 1 : 0;
