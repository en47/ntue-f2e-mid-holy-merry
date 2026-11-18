// Santa 第一章（院子）的瀏覽器驗收：從空白存檔先去穀倉，看到絞盤少了把手、乾草擋著抽屜；再只靠場景裡的東西拿到地衣、
// 小鑰匙、木把手、火柴盒與 12/24 的交接紙條。地衣先拖到麋鹿嘴邊會被推回（牠回頭看餵食槽），放進餵食槽才吃；吃完鑰匙不會自己
// 跑進口袋，要點乾草才撿到。鑰匙拖到絞盤會彈回，把手才裝得上；把手要真的繞著轉才捲得上去。重新整理後口袋與場景照舊；
// 最後用一份沒有口袋的舊存檔（穀倉吊好過）確認把手算裝好了。手機尺寸用真的觸控事件。只讀寫這個瀏覽器的 localStorage，
// 不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-yard.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { auditor } from './santa-audit.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), page = await context.newPage(), errors = [];
const audit = auditor(page, { mobile, width: w, script: 'yard' });
page.on('pageerror', e => { errors.push(String(e)); console.log('PAGE ERROR', String(e)); });
const cdp = await context.newCDPSession(page);
const wait = ms => page.waitForTimeout(ms);
let shots = 0; const shot = name => audit(name).then(() => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null));
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) errors.push(label); };
const centre = async selector => { const box = await page.locator(selector).first().boundingBox(); return [box.x + box.width / 2, box.y + box.height / 2]; };
// A tap and a drag (or a drag along points), by touch on a phone and by mouse on a desktop.
async function tap(selector) { const [x, y] = await centre(selector); if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await wait(300); }
async function along(points) {
  if (mobile) {
    const touch = (type, [x, y] = []) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', points[0]); for (const point of points.slice(1)) { await touch('touchMove', point); await wait(16); } await touch('touchEnd');
  } else { await page.mouse.move(...points[0]); await page.mouse.down(); for (const point of points.slice(1)) await page.mouse.move(...point); await page.mouse.up(); }
  await wait(900);
}
async function drag(from, to) { const [x0, y0] = await centre(from), [x1, y1] = await centre(to); await along(Array.from({ length: 13 }, (_, i) => [x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12])); }
const caption = () => page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? '');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const visible = selector => page.evaluate(selector => { const node = document.querySelector(selector); return Boolean(node && !node.hidden && node.getClientRects().length); }, selector);
const spot = async id => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(6500); };
const openPocket = async () => { if (await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'false')) await tap('.bag-pocket'); };
async function load(record) {
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); if (record) localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
}

await load(null);
check(await page.evaluate(() => document.querySelector('.cabin-bag').hidden), '空白存檔：口袋還藏著');
// The barn first: the winch has lost its crank, and the bale hides the drawer.
await spot('stable');
check(!(await visible('.hoist-crank')) && !(await visible('.hoist-drawer')), '先去穀倉：絞盤沒有把手可轉，抽屜被乾草擋著');
await tap('.hoist-winch'); check((await caption()).includes('少了什麼'), `點絞盤：${await caption()}`);
await tap('.hoist-tag'); check((await caption()).includes('記得把把手裝回去'), '維修標籤寫著把手要裝回去'); await shot('barn-first');
// The mailbox: the parcel's note and the lichen.
await spot('mailbox'); await tap('.play-target'); await wait(600);
await tap('.play-parcel'); await wait(500);
check((await page.evaluate(() => document.querySelector('.parcel-note').textContent)).includes('上次輪到你'), '包裹裡的照顧便條'); await shot('parcel');
await tap('.parcel-pouch'); await wait(1400);
check((await saved()).bag.held.includes('lichen'), '點了「給麋鹿的點心」才收進口袋');
await page.evaluate(() => document.querySelector('.parcel-card .cabin-letter-close').click()); await wait(400);
// The reindeer: at his mouth he only looks round at the trough; in the trough he eats, steps aside, and gold shows.
await spot('reindeer'); check(await visible('.feed-log'), '乾草上掛著照顧紀錄的紙條，一開始就點得到'); await openPocket();
await drag('.bag-item[data-item="lichen"]', '.feed-mouth-spot');
check((await saved()).bag.held.includes('lichen') && (await caption()).includes('餵食槽'), `拖到嘴邊：地衣彈回口袋，${await caption()}`);
await drag('.bag-item[data-item="lichen"]', '.feed-trough'); await wait(3400);
const fed = await saved();
check(fed.bag.used.includes('lichen') && !fed.bag.held.includes('key'), '放進餵食槽：地衣用掉，鑰匙還沒有自己跑進口袋');
check((await caption()).includes('金色') && await visible('.feed-glint'), `吃完挪開，乾草裡有一點金色：${await caption()}`); await shot('trough');
await tap('.feed-trough'); await wait(1200);
check((await saved()).bag.held.includes('key'), '撥開乾草，撿到小鑰匙');
check(!(await saved()).clues.includes('care-log'), '撿到鑰匙不會自己讀照顧紀錄');
await tap('.feed-log'); await wait(600);
const log = await page.evaluate(() => [...document.querySelectorAll('.care-log-card .note-line')].map(line => line.textContent));
check(log.some(line => line.includes('12/21 後半夜') && line.includes('O.')) && log.some(line => line.includes('地衣來了')) && (await saved()).clues.includes('care-log'), `點乾草上的紙條讀照顧紀錄，記進線索本：${log.join('／')}`); await shot('care-log');
await tap('.care-log-card .cabin-letter-close'); await wait(300);
// The snowman's drift.
await spot('snowman');
check(await visible('.snow-pile'), '雪人腳邊的雪堆看得到、點得到'); await shot('snowman');
await tap('.snow-pile'); await wait(1200);
check((await saved()).bag.held.includes('handle'), '撥開雪堆，撿到木把手');
// The barn: the key does not fit the winch; the handle does; turned round, it winds the bale up.
await spot('stable'); await openPocket();
await drag('.bag-item[data-item="key"]', '.hoist-winch');
check((await saved()).bag.held.includes('key') && (await caption()).includes('裝不上'), `鑰匙拖到絞盤：彈回，${await caption()}`);
await drag('.bag-item[data-item="handle"]', '.hoist-winch'); await wait(500);
check((await saved()).bag.used.includes('handle') && await visible('.hoist-crank'), '把手裝上絞盤，可以轉了'); await shot('fitted');
const box = await page.locator('.hoist-crank').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = box.width * .38;
await along(Array.from({ length: 30 }, (_, i) => [cx - Math.sin(i / 14 * Math.PI) * r, cy + Math.cos(i / 14 * Math.PI) * r]));
check(!(await visible('.hoist-hook')), '只轉一圈：乾草還沒到頂');
await along(Array.from({ length: 70 }, (_, i) => [cx - Math.sin(i / 14 * Math.PI) * r, cy + Math.cos(i / 14 * Math.PI) * r]));
check(await visible('.hoist-hook'), `繞著轉到頂：${await caption()}`);
await tap('.hoist-hook'); await wait(700);
check((await saved()).hoist.locked && await visible('.hoist-drawer'), '扣上卡榫，乾草後面露出抽屜');
await tap('.hoist-drawer'); await wait(900); await shot('drawer');
await tap('.drawer-matches'); await wait(1400);
check((await saved()).bag.held.includes('matches'), '抽屜裡的火柴盒收進口袋');
await tap('.drawer-note'); await wait(600);
const note = await page.evaluate(() => [...document.querySelectorAll('.cabin-note .note-line')].map(line => line.textContent).join('|'));
check(note.includes('12/24 夜班') && note.includes('收到'), `兩種筆跡的交接紙條：${note}`); await shot('note');
await page.evaluate(() => document.querySelector('.cabin-note .cabin-letter-close').click()); await wait(500);
const done = await saved();
check(JSON.stringify(done.bag) === JSON.stringify({ held: ['key', 'matches'], used: ['lichen', 'handle'] }) && done.hoist.found, `院子四樣東西都拿到：${JSON.stringify(done.bag)}`);
check(['care-note', 'repair-tag', 'care-log', 'barn-note'].every(id => done.clues.includes(id)), '便條、維修標籤、照顧紀錄、交接紙條都記進線索本');
// Reloaded: the pocket and the barn as they were.
await load(done);
check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.bag-item')].map(item => item.dataset.item))) === '["key","matches"]', '重新整理：口袋裡還是鑰匙和火柴');
await spot('stable'); check(await visible('.hoist-drawer') && await visible('.hoist-release'), '重新整理：乾草還吊著，抽屜還在');
// A record from before the pocket: the barn hoisted then keeps its crank fitted, the rest of the yard waits.
await load({ hoist: { locked: true, found: true }, outfit: { head: null, neck: null, face: 'carrot', hand: null } });
// (The record is read as converted; it is written back the first time something is saved: here, letting the bale down.)
await spot('stable'); await tap('.hoist-release'); await wait(2500);
const old = await saved();
check(JSON.stringify(old.bag) === JSON.stringify({ held: [], used: ['handle'] }), `舊存檔：吊好過的穀倉，把手算裝好了 ${JSON.stringify(old.bag)}`);
check(await visible('.hoist-crank'), '舊存檔：鬆開以後把手還在，可以再轉');

console.log(errors.length ? `FAIL  ${errors.length} 項沒通過` : `PASS  院子第一章（${mobile ? '手機觸控' : '桌機滑鼠'}）`);
await browser.close(); process.exitCode = errors.length ? 1 : 0;
