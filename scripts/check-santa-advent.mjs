// Santa 降臨小屋的瀏覽器驗收：從清單走到窗台前，小屋彈出成立體的倒數日曆盒。11 月：每扇都還沒到，點了只會抖一下，說
// 12/1 開放；12/5：前 5 扇能開、今天那扇貼著金星，打開第 5 扇看到小圖和那天的一句話、記進存檔，第 6 扇只會抖；重新整
// 理後打開過的還開著；聖誕節後：24 扇都能開。盒子在舞台裡，每扇門都夠大可以點。用 Playwright 的假時鐘換日子。只讀寫這個瀏覽器的 localStorage，不連任何雲端。
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
// A fresh browser on the given day: the page, the yard done (so nothing else calls), into the room by the list's button.
async function visit(day, record = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
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
check((await note()).includes('12/1 開放') && (await note()).includes('6 天'), `11 月：說 12/1 開放，還要等幾天：${await note()}`);
await press(door(1)); await wait(300);
check(await page.evaluate(() => document.querySelector('.advent-slot[data-day="1"]').classList.contains('is-shaking')) && (await doors())[0] === 'later', '11 月：點第一扇只會抖一下');
await shot('november'); await context.close();

// December 5: the first five open, today's gilt; the sixth only rattles. Opened, the fifth shows its picture and line, and is kept.
context = await visit('2026-12-05T10:00:00');
const fifth = await doors();
check(fifth.slice(0, 5).every(state => state === 'ready') && fifth.slice(5).every(state => state === 'later'), `12/5：前 5 扇能開，其餘還沒到：${fifth.join(',')}`);
check(await page.evaluate(() => Boolean(document.querySelector('.advent-slot[data-day="5"].is-today .advent-star'))) && (await note()).includes('12 月 5 日'), '12/5：今天那扇貼著金星，說今天可以開第 5 扇');
await shot('closed');
await press(door(5)); await wait(1400); await shot('opened');
check((await doors())[4] === 'open' && await page.evaluate(() => getComputedStyle(document.querySelector('.advent-slot[data-day="5"] .advent-pic')).backgroundImage.startsWith('url(')), '12/5：第 5 扇打開，後面有小圖');
check(await page.evaluate(() => document.querySelector('.advent-date').textContent === '5') && (await note()).includes('尼爾斯'), `12/5：月曆翻到 5，寫著那天的一句話：${await note()}`);
check(await page.evaluate(() => document.querySelector('.advent-count').textContent.includes('1／24') && getComputedStyle(document.querySelector('.advent-art')).backgroundImage.startsWith('url(')), '12/5：寫著開了 1／24 扇，紙上放著那天的小圖');
check(JSON.stringify((await saved()).advent) === '[5]', '12/5：打開的窗記進存檔');
await press(door(6)); await wait(300);
check((await doors())[5] === 'later' && (await note()).includes('還沒到'), '12/5：第 6 扇只會抖，說還沒到');
await press(door(1)); await wait(900);
check(await page.evaluate(() => !document.querySelector('.advent-link').hidden && document.querySelector('.advent-link').getAttribute('href') === 'intro.html'), '12/1 那扇（德國）連到 Intro');
const fits = await page.evaluate(() => { const box = document.querySelector('.advent-box').getBoundingClientRect(), side = document.querySelector('.advent-side').getBoundingClientRect(), stage = document.querySelector('#cabin-stage').getBoundingClientRect(), sizes = [...document.querySelectorAll('.advent-slot[data-state="later"] .advent-door, .advent-slot[data-state="ready"] .advent-door')].map(node => { const r = node.getBoundingClientRect(); return Math.min(r.width, r.height); }); return { inside: [box, side].every(r => r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1 && r.left >= stage.left - 1 && r.right <= stage.right + 1), door: Math.round(Math.min(...sizes)) }; });
check(fits.inside, '盒子和說明都在舞台裡'); check(fits.door >= 40, `最小的門 ${fits.door}px（至少 40px）`);
await page.reload();
await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(2500);
await press('.cabin-explore [data-spot="advent"]'); await wait(10000);
check((await doors())[4] === 'open' && (await doors())[0] === 'open' && await page.evaluate(() => document.querySelector('.advent-count').textContent.includes('2／24')), '重新整理後，打開過的第 1、5 扇還開著');
await press('.cabin-back:not([hidden])'); await wait(4000);
check(await page.evaluate(() => !document.querySelector('.advent-box') && document.querySelector('#cabin-stage').dataset.view === 'inside'), '回到房間，盒子收起來');
await context.close();

// After Christmas: every door opens.
context = await visit('2026-12-28T10:00:00');
check((await doors()).every(state => state === 'ready') && (await note()).includes('聖誕快樂'), '聖誕節後：24 扇都能開');
await press(door(24)); await wait(1400); await shot('christmas');
check((await doors())[23] === 'open', '聖誕節後：第 24 扇打開');
await context.close();

check(broken.length === 0, '沒有頁面錯誤');
console.log(errors.length ? `FAILED ${errors.length}` : 'PASS');
await browser.close();
process.exit(errors.length ? 1 : 0);
