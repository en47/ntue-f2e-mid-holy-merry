// Santa 第四章（替身工作）的瀏覽器驗收：從剛加入替身的存檔開始，四件工作不照登記簿的順序做（摩天輪 → 雪橇 → 餵麋鹿
// → 分信），每件都先做錯一次：雪地裡的特大齒輪撿進口袋再放回動力箱；雪橇照路線順序裝會被退回，反過來疊才對；餵食表上
// 的時間沒照順序寫，先餵最愛的地衣會被搖頭；分信後挑一封回覆就算完成。另外，空白紙條收進口袋：放進火裡、放在冷石板上
// 都會彈回，放在烘熱的石板上才浮出字。重新整理後章、雪橇、餵食表的勾、動力箱裡的齒輪都還在。手機尺寸用真的觸控事件。
// 只讀寫這個瀏覽器的 localStorage，不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-jobs.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { auditor } from './santa-audit.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), page = await context.newPage(), errors = [];
const audit = auditor(page, { mobile, width: w, script: 'jobs' });
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
const caption = () => page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? '');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const visible = selector => page.evaluate(selector => { const node = document.querySelector(selector); return Boolean(node && !node.hidden && node.getClientRects().length); }, selector);
const press = selector => page.evaluate(selector => document.querySelector(selector)?.click(), selector);
const text = selector => page.evaluate(selector => document.querySelector(selector)?.textContent ?? '', selector);
const spot = async (id, ms = 7000) => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(ms); };
const openPocket = async () => { if (await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'false')) await tap('.bag-pocket'); };
const toRoom = async () => { for (let i = 0; i < 3 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'inside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5000); } };
const toYard = async () => { for (let i = 0; i < 3 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'outside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5500); } };
const enter = async () => { if ((await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) === 'outside') await spot('inside'); await spot('shelf'); for (let i = 0; i < 2 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'secret'; i++) { await press('.books-tools button:not([hidden])'); await wait(4800); } };
const thing = async id => { await press(`.secret-thing[data-id="${id}"]`); await wait(800); };
const putBack = async () => { await press('.secret-card .cabin-letter-close'); await wait(500); };
async function load(record) {
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
}
// The big wheel, from the yard looking left: tapped where it stands until its gearbox opens.
async function openWheel() {
  await toYard(); await page.locator('.cabin-gesture').focus(); for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowLeft'); await wait(120); } await wait(3000);
  for (const [x, y] of mobile ? [[326, 297], [310, 262], [345, 330]] : [[1050, 190], [880, 160], [1000, 250], [1150, 200]]) { if (await page.$('.gearbox')) break; await page.mouse.click(x, y); await wait(2200); }
}
// Just signed up, everything before done: the yard, the room, the little room; the pocket holds the magnifier and pin.
const joined = { bag: { held: ['magnifier', 'pin'], used: ['lichen', 'handle', 'matches', 'key'] }, hoist: { locked: true, found: true }, story: { left: true, opened: true, shut: true, seen: ['tags', 'log', 'rules'], told: true, shelf: ['book-h1', null, 'book-l1', 'book-y1', null, null, null, 'book-r2', 'book-y2', 'book-m1', 'book-o1', 'book-r1', 'book-e1'] }, volunteer: { mark: 'J', tasks: [] }, finale: { invited: true }, clues: ['care-note', 'route', 'route-note'] };

await load(joined);
// The big wheel first: the big gear in the snow by the gearbox, to the pocket, into the box; then the gears and the crank.
await openWheel(); await shot('gearbox');
check(await visible('.gearbox-snow') && (await page.evaluate(() => [...document.querySelectorAll('.gearbox-piece')].filter(b => !b.hidden).length)) === 4, '動力箱旁的雪地裡有東西在發亮，特大齒輪不在工具盒裡');
await tap('.gearbox-snow'); await wait(1300); check((await saved()).bag.held.includes('gear'), '撿起特大齒輪，收進口袋');
await openPocket(); await drag('.bag-item[data-item="gear"]', '.gearbox-board'); await wait(600);
check((await saved()).bag.used.includes('gear') && (await page.evaluate(() => [...document.querySelectorAll('.gearbox-piece')].filter(b => !b.hidden).length)) === 5, '特大齒輪放進動力箱的工具盒');
const pick = name => page.evaluate(name => [...document.querySelectorAll('.gearbox-piece')].find(b => b.getAttribute('aria-label').startsWith(name)).click(), name);
const peg = i => page.evaluate(i => document.querySelectorAll('.gearbox-peg')[i].click(), i);
await pick('小齒輪'); await peg(2); await pick('特大齒輪'); await peg(1); await pick('中齒輪'); await peg(0);
for (let i = 0; i < 12 && !(await page.evaluate(() => document.querySelector('.gearbox')?.classList.contains('is-running'))); i++) { await page.evaluate(() => document.querySelector('.gearbox-crank')?.focus()); await page.keyboard.press('Enter'); await wait(160); }
await wait(3500); check((await saved()).volunteer.tasks.includes('wheel'), '排好齒輪、轉動曲柄：修好摩天輪（第一件工作）'); await shot('wheel');
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('好了'))?.click()); await wait(1500);
// The sleigh by the reindeer: in route order it comes back off; the other way round, it is loaded.
await toYard(); await spot('reindeer');
await tap('.sleigh-spot'); await wait(700); await shot('sleigh');
check((await text('.sleigh-card')).includes('最上面'), '雪橇的規則：每一站只拿得到最上面那一袋');
const load4 = async cities => { for (const city of cities) { await tap(`.sleigh-pile .sleigh-sack[data-city="${city}"]`); await wait(250); } await wait(1600); };
await load4(['台北', '東京', '雷克雅維克', '多倫多']);
check((await caption()).includes('不在最上面') && !(await saved()).volunteer.tasks.includes('hay'), `照路線順序裝：退回來 ${await caption()}`);
await load4(['多倫多', '雷克雅維克', '東京', '台北']); await wait(1600);
check((await saved()).volunteer.tasks.includes('hay'), '最後一站放最下面、第一站放最上面：裝好雪橇（第二件工作）'); await shot('sleigh-loaded');
await press('.sleigh-card .cabin-letter-close'); await wait(400);
// Feeding him by the barn's table: the favourite first is wrong; by the clock, oats, carrot, lichen.
await toYard(); await spot('stable');
check(await page.evaluate(() => { const box = document.querySelector('.feed-table').getBoundingClientRect(), stage = document.querySelector('#cabin-stage').getBoundingClientRect(); return box.width > 0 && box.left >= stage.left && box.right <= stage.right && box.top >= stage.top && box.bottom <= stage.bottom; }), '穀倉門上貼著餵食表，整張都在畫面裡'); await tap('.feed-table'); await wait(600); await shot('feed-table');
check((await text('.feed-card')).includes('06:00') && (await saved()).clues.includes('feed-table'), '餵食表：時間沒照順序寫，記進線索本'); await press('.feed-card .cabin-letter-close'); await wait(400);
await toYard(); await spot('reindeer');
check((await caption()).includes('餵食表'), `麋鹿：今天輪到你照顧 ${await caption()}`);
const tags = await page.evaluate(() => [...document.querySelectorAll('.feed-basket .feed-name')].map(tag => tag.textContent).join('/'));
check(await visible('.feed-slip') && (await text('.feed-slip')).includes('07:30') && tags === '燕麥餅/胡蘿蔔/地衣/薑餅', `讀過餵食表：籃子上方釘著餵食表，每樣食物掛著名牌（${tags}）`);
const ticks = () => page.evaluate(() => document.querySelectorAll('.feed-slip .is-ticked').length);
await tap('.feed-basket [data-kind="oats"]'); await wait(1200); const one = await ticks();
await tap('.feed-basket [data-kind="lichen"]'); await wait(1200);
check(one === 1 && (await caption()).includes('還不到吃這個的時候') && await ticks() === 0, '先餵燕麥餅打一個勾；接著就餵地衣：麋鹿搖頭，勾全部清掉，從頭再來');
for (const kind of ['oats', 'carrot', 'lichen']) { await tap(`.feed-basket [data-kind="${kind}"]`); await wait(1500); }
check(await ticks() === 3, '照時間順序餵：餵食表三格都打勾');
await wait(2400); check((await saved()).volunteer.tasks.includes('lichen'), '照時間順序餵完：照顧麋鹿（第三件工作）'); await shot('fed');
check(await page.evaluate(() => [...document.querySelectorAll('.feed-basket [data-kind]')].map(item => item.dataset.kind).join()) === 'carrot,gingerbread', '餵完：燕麥餅和地衣收回去，籃子回到平常的胡蘿蔔與薑餅');
// The letters: sorted at the rack, one reply written and sent.
await toYard(); await enter(); await thing('rack');
for (const [id, mark] of [['m1', 'E'], ['m2', 'O'], ['m3', 'N'], ['m4', 'K'], ['m5', 'H'], ['m6', 'N'], ['tomas', 'you'], ['aya', 'you']]) { await page.click(`.rack-letter[data-id="${id}"]`); await wait(100); await page.evaluate(m => document.querySelector(`.rack-slot[data-mark="${m}"]`).click(), mark); await wait(220); }
await wait(2600); check((await saved()).desk.sorted, '分揀架的信都分好了'); await putBack();
// The blank slip, from the register, to the pocket.
await thing('register'); await press('.register-cord .register-sign'); await wait(1300); await putBack();
check((await saved()).bag.held.includes('slip'), '登記簿你那一列的空白紙條收進口袋');
await press('.books-enter'); await wait(4500); await toRoom(); await spot('desk');
const desk = name => page.evaluate(name => [...document.querySelectorAll('.desk-actions button')].find(b => b.textContent === name && !b.hidden)?.click(), name);
await page.evaluate(() => document.querySelector('.desk-pick[aria-label="從信堆抽一封信"]').click()); await wait(700);
await desk('拆開信'); await wait(300); await desk('寫回信 ✎'); await wait(300); await page.locator('.compose-choice').first().click(); await desk('摺好放進信封'); await wait(800);
await page.evaluate(() => document.querySelector('.desk-seal').click()); await wait(200); await page.evaluate(() => document.querySelector('.desk-stamp').click()); await wait(300); await desk('投進郵袋'); await wait(2600);
const four = await saved(); check(four.volunteer.tasks.includes('letters') && ['wheel', 'hay', 'lichen', 'letters'].every(task => four.volunteer.tasks.includes(task)), '回覆一封就完成處理信件；四件工作照自己選的順序都做完');
// The slip: into the fire it would burn; on the warm hearthstone, the writing comes up.
await spot('hearth'); await openPocket(); await drag('.bag-item[data-item="slip"]', '.hearth-fire');
check((await caption()).includes('燒掉') && (await saved()).bag.held.includes('slip'), '紙條拖進火裡：彈回口袋');
await drag('.bag-item[data-item="slip"]', '.hearth-stone'); await wait(5200); await shot('lemon');
check((await saved()).finale.slip === 'read' && (await visible('.lemon-card')), '放在烘熱的石板上：浮出荷莉的字');
await press('.lemon-card .cabin-letter-close'); await wait(400);
// Reloaded: the stamps, the loaded sleigh, the ticked table, the big gear in its box.
const done = await saved();
await load(done);
await toYard(); await spot('stable'); check(await page.evaluate(() => document.querySelector('.feed-table').classList.contains('is-done')), '重新整理：餵食表打上勾了');
await toYard(); await spot('reindeer'); await tap('.sleigh-spot'); await wait(700);
check((await text('.sleigh-card')).includes('已經裝好') && (await page.evaluate(() => document.querySelectorAll('.sleigh-rack .sleigh-sack').length)) === 4, '重新整理：雪橇還是裝好的');
await press('.sleigh-card .cabin-letter-close'); await wait(400);
await openWheel(); check(!(await visible('.gearbox-snow')) && (await page.evaluate(() => [...document.querySelectorAll('.gearbox-piece')].some(b => !b.hidden && b.getAttribute('aria-label').startsWith('特大齒輪')))), '重新整理：特大齒輪在動力箱裡，雪地不再發亮');
// On a cold stone, before the fire is lit, the slip springs back.
await load({ ...joined, bag: { held: ['slip', 'matches'], used: ['lichen', 'handle', 'key'] }, finale: { invited: true, slip: 'taken' } });
await spot('hearth'); await openPocket(); await drag('.bag-item[data-item="slip"]', '.hearth-stone');
check((await caption()).includes('冷') && (await saved()).finale.slip === 'taken', '壁爐還沒點：石板是冷的，紙條彈回、沒有用掉');

console.log(errors.length ? `FAIL  ${errors.length} 項沒通過` : `PASS  替身工作第四章（${mobile ? '手機觸控' : '桌機滑鼠'}）`);
await browser.close(); process.exitCode = errors.length ? 1 : 0;
