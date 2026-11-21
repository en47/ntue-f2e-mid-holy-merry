// Santa 降臨小屋的瀏覽器驗收：從清單走到窗台前，小屋彈出成立體的倒數日曆盒，盒蓋標題是英文。11 月：每扇都還沒到，點了
// 只會抖一下，說 12/1 開放，盒蓋的小窗是封面場景；12/5：前 5 扇能開、今天那扇貼著金星，打開第 5 扇看到小圖、那天的一句話，
// 盒蓋小窗換成那天的紙雕場景，點了會動（手機是升起一張卡片，收好再放下），記進存檔，第 6 扇只會抖；第 3 扇（芬蘭）有連到
// Intro 的吊牌、第 1 扇（德國，地圖上沒有）沒有；再點開過的第 5 扇的小圖，那天又回到盒蓋上；盒蓋的字都在米色紙裡；重新整理後
// 打開過的還開著；按「全部關上」全部關回去、存檔清空，又能一扇一扇重開；聖誕節後：24 扇都能開，順著第 3 扇的吊牌走到 Intro，
// 地圖展開、芬蘭的明信片打開。盒子在舞台裡，每扇門都夠大可以點，門上的號碼都在門裡。手機另外用矮一點的螢幕（瀏覽器的網址列
// 佔掉一截，390×664）看一次：盒子縮小，下面的蓋子整條看得到，號碼仍在門裡，「全部關上」點得到。
// 用 Playwright 的假時鐘換日子。只讀寫這個瀏覽器的 localStorage，不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-advent.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const errors = [], broken = [];
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) errors.push(label); };
let page, shots = 0;
const wait = ms => page.waitForTimeout(ms), press = selector => page.evaluate(selector => document.querySelector(selector)?.click(), selector);
const shot = name => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null);
const doors = () => page.evaluate(() => Array.from({ length: 24 }, (_, i) => document.querySelector(`.advent-slot[data-day="${i + 1}"]`)?.dataset.state));
const door = n => `.advent-slot[data-day="${n}"] .advent-door`;
const note = () => page.evaluate(() => document.querySelector('.advent-note')?.textContent ?? '');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const scene = () => page.evaluate(() => ({ label: document.querySelector('.advent-play')?.getAttribute('aria-label'), pieces: document.querySelectorAll('.advent-cut-scene.is-shown img').length, card: document.querySelector('.advent-card')?.classList.contains('is-up') ?? false, inCard: Boolean(document.querySelector('.advent-card .advent-stage')) }));
// A real pointer (or finger) at the middle of something, so what lies in front of it in the box's 3D layers counts.
const realTap = async selector => { const [x, y] = await page.evaluate(selector => { const r = document.querySelector(selector).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, selector); if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
// On a phone the window is on its card: up after a door is opened (once the door has turned), put away with 收好.
const putAway = async () => { if (mobile) { await press('.advent-fold'); await wait(800); } };
// Numbers on doors still shut that stick out of their doors (none should, however small the box).
const numbersOut = () => page.evaluate(() => [...document.querySelectorAll('.advent-slot:not([data-state="open"]) .advent-num')].filter(num => {
  const door = num.closest('.advent-door').getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(num); const r = range.getBoundingClientRect();
  return r.left < door.left - 1 || r.right > door.right + 1 || r.top < door.top - 1 || r.bottom > door.bottom + 1;
}).map(num => num.textContent));
// The words on the lid's cream sheet: inside its margins, the line clear of the foot (the count and 全部關上).
const sheetFits = () => page.evaluate(() => {
  const paper = document.querySelector('.advent-paper'), r = paper.getBoundingClientRect(), cs = getComputedStyle(paper);
  const inner = { left: r.left + parseFloat(cs.paddingLeft) - 1, right: r.right - parseFloat(cs.paddingRight) + 1, bottom: r.bottom - parseFloat(cs.paddingBottom) + 1 };
  const parts = [...paper.querySelectorAll('.advent-page, .advent-note, .advent-foot, .advent-tally, .advent-title')].map(node => node.getBoundingClientRect()).filter(b => b.width);
  const range = document.createRange(); range.selectNodeContents(paper.querySelector('.advent-note'));
  const words = range.getBoundingClientRect(), link = paper.querySelector('.advent-link:not([hidden])')?.getBoundingClientRect(), foot = paper.querySelector('.advent-tally').getBoundingClientRect();
  return parts.every(b => b.left >= inner.left && b.right <= inner.right && b.bottom <= inner.bottom) && words.bottom <= foot.top && (!link || link.bottom <= foot.top);
});
// A fresh browser on the given day: the page, the yard done (so nothing else calls), into the room by the list's button.
async function visit(day, record = {}, height = h) {
  const context = await browser.newContext({ viewport: { width: w, height }, isMobile: mobile, hasTouch: mobile });
  page = await context.newPage(); page.on('pageerror', e => { broken.push(String(e)); console.log('PAGE ERROR', String(e)); });
  await page.clock.install({ time: new Date(day) });
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(2500);
  await press('.cabin-explore [data-spot="advent"]'); await wait(10000);
  check(await page.evaluate(() => Boolean(document.querySelector('.advent-box')) && document.querySelector('#cabin-stage').dataset.view === 'advent'), `${day.slice(0, 10)}：從清單走到窗台前，降臨小屋彈出成倒數日曆盒`);
  return context;
}

// November: nothing open yet; a door only rattles, and it says when it opens.
let context = await visit('2026-11-25T10:00:00');
check((await doors()).every(state => state === 'later'), '11 月：24 扇都還沒到');
check(await page.evaluate(() => { const title = document.querySelector('.advent-title'); return title.textContent === 'Advent Calendar' && title.lang === 'en'; }), '盒蓋標題是英文 Advent Calendar');
check((await scene()).label === '讓雪下大一點' && (await scene()).pieces >= 3, `11 月：盒蓋小窗是封面場景（${(await scene()).pieces} 片紙）`);
check((await note()).includes('12/1 開放') && (await note()).includes('6 天'), `11 月：說 12/1 開放，還要等幾天：${await note()}`);
await press(door(1)); await wait(300);
check(await page.evaluate(() => document.querySelector('.advent-slot[data-day="1"]').classList.contains('is-shaking')) && (await doors())[0] === 'later', '11 月：點第一扇只會抖一下');
await shot('november'); await context.close();

// December 5: the first five open, today's gilt; the sixth only rattles. Opened, the fifth shows its picture and line, and is kept.
context = await visit('2026-12-05T10:00:00');
const fifth = await doors();
check(fifth.slice(0, 5).every(state => state === 'ready') && fifth.slice(5).every(state => state === 'later'), `12/5：前 5 扇能開，其餘還沒到：${fifth.join(',')}`);
check(await page.evaluate(() => Boolean(document.querySelector('.advent-slot[data-day="5"].is-today .advent-star'))) && (await note()).includes('12 月 5 日'), '12/5：今天那扇貼著金星，說今天可以開第 5 扇');
check((await numbersOut()).length === 0, `門上的號碼都在門裡${(await numbersOut()).join('、')}`);
await shot('closed');
await press(door(5)); await wait(2600); await shot('opened');
check((await doors())[4] === 'open' && await page.evaluate(() => getComputedStyle(document.querySelector('.advent-slot[data-day="5"] .advent-pic')).backgroundImage.startsWith('url(')), '12/5：第 5 扇打開，後面有小圖');
check(await page.evaluate(() => document.querySelector('.advent-date').textContent === '5') && (await note()).includes('尼爾斯'), `12/5：月曆翻到 5，寫著那天的一句話：${await note()}`);
const fifthScene = await scene();
check(fifthScene.label === '轉音樂盒的發條' && fifthScene.pieces >= 4 && (!mobile || (fifthScene.card && fifthScene.inCard)), `12/5：盒蓋小窗換成第 5 天的紙雕場景${mobile ? '，手機升起卡片' : ''}（${fifthScene.pieces} 片紙）`);
await press('.advent-play'); await wait(300);
check(await page.evaluate(() => document.querySelector('.advent-cut-scene.is-shown').getAnimations({ subtree: true }).length > 0), '12/5：點小窗，場景動起來');
check(await page.evaluate(() => document.querySelector('.advent-count').textContent.includes('1／24')), '12/5：寫著開了 1／24 扇');
check(JSON.stringify((await saved()).advent) === '[5]', '12/5：打開的窗記進存檔');
await putAway();
if (mobile) check(!(await scene()).card, '手機：按收好，卡片放下');
await press(door(6)); await wait(300);
check((await doors())[5] === 'later' && (await note()).includes('還沒到'), '12/5：第 6 扇只會抖，說還沒到');
await press(door(3)); await wait(2600);
check(await page.evaluate(() => { const link = document.querySelector('.advent-link'); return !link.hidden && link.getAttribute('href') === 'intro.html#finland' && link.textContent.includes('芬蘭') && link.getBoundingClientRect().width > 0; }), '12/3 那扇（芬蘭）有吊牌，連到 Intro 的芬蘭');
await putAway();
await press(door(1)); await wait(2600);
check(await page.evaluate(() => document.querySelector('.advent-link').hidden) && (await note()).includes('德國'), '12/1 那扇（德國，地圖上沒有）不連到 Intro');
await putAway();
// An open door is seen again by tapping the picture behind it (a real tap); tapped again, its day plays over.
await realTap('.advent-slot[data-day="5"] .advent-pic'); await wait(1200);
const again = await scene();
check(await page.evaluate(() => document.querySelector('.advent-date').textContent === '5' && document.querySelector('.advent-slot[data-day="5"]').classList.contains('is-shown')) && (await note()).includes('尼爾斯') && again.label === '轉音樂盒的發條' && (!mobile || again.card), '真的點開過的第 5 扇的小圖：那天的月曆、一句話和場景回到盒蓋上');
await shot('again');
await putAway();
await wait(2500); await realTap('.advent-slot[data-day="5"] .advent-pic'); await wait(600);
check(await page.evaluate(() => document.querySelector('.advent-date').textContent === '5' && document.querySelector('.advent-cut-scene.is-shown').getAnimations({ subtree: true }).length > 0), '再點一次同一天：場景重新立起來、從頭播');
await putAway();
await realTap('.advent-slot[data-day="1"] .advent-pic'); await wait(1200);
check(await page.evaluate(() => document.querySelector('.advent-date').textContent === '1') && (await note()).includes('德國') && (await scene()).label === '打開小日曆的下一扇窗', '今天 12/5，點 12/1 的小圖：看到 12/1 的結果');
check(await sheetFits(), '最長的一句（12/1）也在米色紙的四邊留白裡，沒有碰到底下開了幾扇和「全部關上」');
await putAway();
const fits = await page.evaluate(() => { const box = document.querySelector('.advent-box').getBoundingClientRect(), side = document.querySelector('.advent-side').getBoundingClientRect(), stage = document.querySelector('#cabin-stage').getBoundingClientRect(), sizes = [...document.querySelectorAll('.advent-slot[data-state="later"] .advent-door, .advent-slot[data-state="ready"] .advent-door')].map(node => { const r = node.getBoundingClientRect(); return Math.min(r.width, r.height); }); return { inside: [box, side].every(r => r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1 && r.left >= stage.left - 1 && r.right <= stage.right + 1), door: Math.round(Math.min(...sizes)) }; });
check(fits.inside, '盒子和說明都在舞台裡'); check(fits.door >= 40, `最小的門 ${fits.door}px（至少 40px）`);
await page.reload();
await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(2500);
await press('.cabin-explore [data-spot="advent"]'); await wait(10000);
check((await doors())[4] === 'open' && (await doors())[2] === 'open' && (await doors())[0] === 'open' && await page.evaluate(() => document.querySelector('.advent-count').textContent.includes('3／24')), '重新整理後，打開過的第 1、3、5 扇還開著');
// 全部關上 (a real click or tap): the open doors shut again, the count goes back to 0 and the button goes away, the save
// forgets them and the lid shows the cover and today's line; then the fifth opens again and is counted once more.
await realTap('.advent-shut'); await wait(2200);
const shutAll = await page.evaluate(() => ({ doors: [1, 3, 5].map(day => document.querySelector(`.advent-slot[data-day="${day}"]`).dataset.state), count: document.querySelector('.advent-count').textContent, hidden: document.querySelector('.advent-shut').hidden }));
check(shutAll.doors.every(state => state === 'ready') && shutAll.count.includes('0／24') && shutAll.hidden && JSON.stringify((await saved()).advent) === '[]' && (await scene()).label === '讓雪下大一點' && (await note()).includes('12 月 5 日'), `真的點「全部關上」：第 1、3、5 扇關回去、${shutAll.count}、存檔清空，盒蓋回到封面`);
await realTap(door(5)); await wait(2600);
check((await doors())[4] === 'open' && await page.evaluate(() => document.querySelector('.advent-count').textContent.includes('1／24') && !document.querySelector('.advent-shut').hidden) && JSON.stringify((await saved()).advent) === '[5]', '關上以後再開：第 5 扇又打開，開了 1／24 扇，按鈕回來');
await putAway();
await press('.cabin-back:not([hidden])'); await wait(4000);
check(await page.evaluate(() => !document.querySelector('.advent-box') && document.querySelector('#cabin-stage').dataset.view === 'inside'), '回到房間，盒子收起來');
await context.close();

// After Christmas: every door opens.
context = await visit('2026-12-28T10:00:00');
check((await doors()).every(state => state === 'ready') && (await note()).includes('聖誕快樂'), '聖誕節後：24 扇都能開');
await press(door(24)); await wait(2600); await shot('christmas');
check((await doors())[23] === 'open' && (await scene()).label === '目送雪橇飛過月亮', '聖誕節後：第 24 扇打開，小窗是平安夜的雪橇');
if (mobile) check(await page.evaluate(() => { const card = document.querySelector('.advent-card.is-up')?.getBoundingClientRect(), stage = document.querySelector('#cabin-stage').getBoundingClientRect(); return card && card.top >= stage.top - 1 && card.bottom <= stage.bottom + 1 && card.left >= stage.left - 1 && card.right <= stage.right + 1; }), '手機：升起的卡片在舞台裡');
await putAway();
// Following Finland's tag to Intro: the map unrolls and Finland's postcard opens.
await press(door(3)); await wait(2600);
await Promise.all([page.waitForURL(/intro\.html#finland$/), press('.advent-link')]);
await page.waitForFunction(() => document.querySelector('#culture-dialog')?.open, null, { timeout: 60000 });
check(await page.evaluate(() => document.querySelector('[data-post="country"]').textContent === '芬蘭' && document.querySelector('[data-scroll="stage"]').dataset.state === 'open'), '順著吊牌到 Intro：地圖展開，芬蘭的明信片打開');
await shot('intro');
await context.close();

// A phone's browser bars take a strip off the screen (390 × 664 here, as on an iPhone): the box gets smaller so the lid
// under it shows whole, the numbers stay on their doors, and 全部關上 can be tapped.
if (mobile) {
  context = await visit('2026-12-05T10:00:00', { advent: [1, 2, 3, 4, 5] }, 664);
  const short = await page.evaluate(() => { const side = document.querySelector('.advent-side').getBoundingClientRect(), stage = document.querySelector('#cabin-stage').getBoundingClientRect(); return { inside: side.top >= stage.top - 1 && side.bottom <= stage.bottom + 1, box: Math.round(document.querySelector('.advent-box').getBoundingClientRect().width) }; });
  check(short.inside && await sheetFits(), `矮一點的手機（${w}×664）：盒子縮小到 ${short.box}px 寬，下面的蓋子整條看得到，字都在米色紙裡`);
  check((await numbersOut()).length === 0, `矮一點的手機：門上的號碼都在門裡${(await numbersOut()).join('、')}`);
  await shot('short');
  await realTap('.advent-shut'); await wait(2200);
  check(await page.evaluate(() => document.querySelector('.advent-count').textContent.includes('0／24')) && (await doors()).slice(0, 5).every(state => state === 'ready'), '矮一點的手機：真的點得到「全部關上」，五扇都關回去');
  await context.close();
}

check(broken.length === 0, '沒有頁面錯誤');
console.log(errors.length ? `FAILED ${errors.length}` : 'PASS');
await browser.close();
process.exit(errors.length ? 1 : 0);
