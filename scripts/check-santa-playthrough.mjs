// Santa 頁從空白存檔整套玩一遍：院子（郵筒包裹、餵食槽鑰匙、雪堆把手、絞盤與抽屜）、屋裡（火柴點火、鑰匙開抽屜拿放大鏡、吸墨器、音樂盒書籤、放大鏡看雪花球）、書櫃、弄濕的交接表、聖誕老人回來說明、加入、四件替身工作（餵食表、裝雪橇、分信回一封、雪地的齒輪）、空白紙條放在熱石板上、紅繩舊紀錄簿、
// 五位替身的見面禮與聖誕樹，最後走到結局 B＋真相、C＋真相（都要再確認），走出小屋不觸發，到世界路標確認回家才是 A；每個結局後有紀念明信片。每一步都按頁面上的按鈕或拖曳，不改存檔。只讀寫這個瀏覽器的
// localStorage，不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-playthrough.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖；
// RELOAD=1 會在每一章結束時重新整理頁面，從存檔接著玩，檢查存檔恢復）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { auditor } from './santa-audit.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile })).newPage(), errors = [], log = { push: line => console.log(line) };
const audit = auditor(page, { mobile, width: w, script: 'playthrough' });
page.on('pageerror', e => { errors.push(String(e)); console.log('PAGE ERROR', String(e)); });
const wait = ms => page.waitForTimeout(ms);
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const caption = () => page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? '');
const note = async label => log.push(`${label}: ${(await caption()).slice(0, 70)}`);
const button = (text, scope = 'button') => page.evaluate(([text, scope]) => { const b = [...document.querySelectorAll(scope)].find(b => b.textContent.trim().startsWith(text) && !b.hidden && !b.disabled && b.getClientRects().length); b?.click(); return Boolean(b); }, [text, scope]);
const must = async (text, scope) => { if (!(await button(text, scope))) throw new Error(`no button: ${text}`); };
const spot = async (id, ms = 6500) => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(ms); };
const shot = name => audit(name).then(() => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null)); let shots = 0;
const thing = async id => { await page.evaluate(id => document.querySelector(`.secret-thing[data-id="${id}"]`).click(), id); await wait(800); };
const putBack = async () => { await page.evaluate(() => document.querySelector('.secret-card .cabin-letter-close')?.click()); await wait(500); };
const closeCard = async sel => { await page.evaluate(sel => document.querySelector(`${sel} .cabin-letter-close`)?.click(), sel); await wait(500); };
const toRoom = async () => { for (let i = 0; i < 3 && (await page.evaluate(() => document.querySelector('#cabin-stage').dataset.view)) !== 'inside'; i++) { await page.evaluate(() => document.querySelector('.cabin-back:not([hidden])')?.click()); await wait(5000); } };
const theatre = async () => { await page.waitForSelector('.ending-theatre[open]', { timeout: 20000 }); const kind = await page.evaluate(() => document.querySelector('.ending-theatre').dataset.ending); await wait(1500); await shot(`ending-${kind}`); await page.evaluate(() => document.querySelector('.theatre-skip')?.click()); await wait(800); return kind; };
// Into the little room: through the open bookcase, or pushing it open again first.
const enterSecret = async () => { await spot('shelf', 7000); if (!(await button('走進小房間'))) { await must('推開書櫃'); await wait(6500); if (!(await button('走進小房間'))) await must('走進書櫃後的小房間'); } await wait(3800); };
// RELOAD=1: the page is reloaded where a chapter ends; the save must come back as it was, and play goes on from it (from
// the yard, where a reload always lands; `resume` walks back to where play left off, as a player would).
const RELOAD = Boolean(process.env.RELOAD), ready = () => page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
async function checkpoint(name, resume = async () => {}) {
  if (!RELOAD) return;
  const before = await save(); await page.reload(); await ready(); await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(2500);
  const after = await save(), changed = Object.keys({ ...before, ...after }).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  log.push(`reload after ${name}: ${changed.length ? `changed ${changed}` : 'save kept'}`); if (changed.length) errors.push(`reload after ${name}: ${changed}`);
  await resume();
}
const leaveTheatre = async () => { await page.evaluate(() => [...document.querySelectorAll('.theatre-close')].at(-1)?.click()); await wait(1200); };

await page.goto(`${BASE}/santa.html`);
await page.evaluate(() => localStorage.clear()); await page.reload();
await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(1500);
log.push(`notebook at start hidden: ${await page.evaluate(() => document.querySelector('.notebook-button').hidden)}`);

// The yard: the mailbox's parcel (lichen), the trough (the key, the care log), the snowman's drift (the handle), the barn's
// winch (the matches and the note in the drawer). Pocket things are used by tapping them, then the place.
const use = async (id, place) => { if (await page.evaluate(() => document.querySelector('.cabin-bag').dataset.open === 'false')) await page.click('.bag-pocket'); await page.click(`.bag-item[data-item="${id}"]`); await wait(200); await page.click(place); };
const crank = async () => { for (let i = 0; i < 8 && !(await page.isVisible('.hoist-hook')); i++) { await page.focus('.hoist-crank'); await page.keyboard.press('Enter'); await wait(150); } };
await spot('mailbox'); await page.click('.play-target'); await wait(800); await page.click('.play-parcel'); await wait(600); await page.click('.parcel-pouch'); await wait(1200); await closeCard('.parcel-card'); await note('parcel');
await spot('reindeer'); await use('lichen', '.feed-trough'); await wait(4000); await page.click('.feed-trough'); await wait(3500); await note('trough');
await spot('snowman'); await page.click('.snow-pile'); await wait(1200);
await spot('stable'); await use('handle', '.hoist-winch'); await wait(900); await crank(); await page.click('.hoist-hook'); await wait(600);
await page.click('.hoist-drawer'); await wait(900); await page.click('.drawer-matches'); await wait(1200); await page.click('.drawer-note'); await wait(800); await shot('barn-note'); await closeCard('.cabin-note'); await note('hoist');
log.push(`pocket after the yard: ${JSON.stringify((await save()).bag)}`);
await checkpoint('the yard');
// Into the house: the hearth lit with a match (R, the gold spines), the desk's drawer opened with the little key (the
// magnifier, the blotter turned over), and the letters' backs; back in the middle, Santa goes out.
await spot('hearth', 7000); await use('matches', '.hearth-fire'); await wait(4000); for (let i = 0; i < 2; i++) { await page.evaluate(i => document.querySelectorAll('.hearth-log')[i].click(), i); await wait(400); } await note('hearth');
await spot('desk'); await use('key', '.desk-drawer'); await wait(900); await page.click('.desk-drawer'); await wait(1100);
await page.click('.drawer-thing[aria-label="黃銅框的放大鏡"]'); await wait(1300); await page.click('.drawer-thing[aria-label^="搖擺式吸墨器"]'); await wait(800); await page.click('.inspect-flip'); await wait(700); await shot('blotter'); await page.click('.inspect-close'); await wait(400); await closeCard('.drawer-card'); await note('blotter');
await page.evaluate(() => document.querySelector('.desk-pick[aria-label="從信堆抽一封信"]').click()); await wait(700); await button('拆開信'); await wait(400); await button('翻到背面'); await wait(400); await button('放回');  await wait(600);
await toRoom(); await wait(9000); log.push(`chair card: ${await page.evaluate(() => Boolean(document.querySelector('.chair-card')))}`); await shot('chair-note'); await closeCard('.chair-card');
await spot('musicbox'); for (let i = 0; i < 8; i++) { await page.focus('.musicbox-knob'); await page.keyboard.press('Enter'); await wait(120); } await wait(3600); await note('music box');
await spot('globe'); await page.focus('.snow-globe'); for (let i = 0; i < 4; i++) { await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await wait(150); }
await page.waitForFunction(() => document.querySelector('.cabin-caption').textContent.includes('落定'), null, { timeout: 30000 }); await note('globe');
await use('magnifier', '.snow-globe'); await wait(1300); await shot('lens'); await closeCard('.lens-card');
log.push(`room clues: ${(await save()).clues.filter(id => ['letter-hearth', 'blotter', 'music-bookmarks', 'globe-village', 'globe-base', 'chair-note'].includes(id))}`);
await checkpoint('the room', async () => { await spot('hearth', 7000); await page.evaluate(() => document.querySelector('.hearth-log')?.click()); await wait(600); await toRoom(); await wait(9000); log.push(`santa out again: ${await page.evaluate(() => Boolean(document.querySelector('.chair-card')))}`); await closeCard('.chair-card'); });
// The bookcase: MORE, and in.
await spot('shelf', 7000); await shot('shelf-strip');
for (const [from, to] of [[4, 9], [1, 10], [6, 11], [5, 12]]) { await page.click(`.books-place[data-place="${from}"]`); await wait(150); await page.click(`.books-place[data-place="${to}"]`); await wait(700); }
await wait(4800); await must('走進書櫃後的小房間'); await wait(4000); await note('secret room');
await checkpoint('the bookcase', enterSecret);
// The secret: the name tags, the rules, the wet log put right.
await thing('tags'); await putBack(); await thing('rules'); await putBack();
await thing('log'); for (const mark of ['E', 'O', 'K', 'H', 'N', 'K', 'H']) { await page.evaluate(m => [...document.querySelectorAll('.shift-pick')].find(b => b.textContent === `${m}.`).click(), mark); await wait(150); }
await wait(1500); await shot('log-solved'); await putBack(); await wait(2600); await note('known');
await thing('hats'); await putBack();
// Back in the middle of the room, Santa comes home and tells you the secret; then the register can be signed.
// His lines come one at a time in the chat card, each moved on by a reply; the last asks whether you will help.
const hear = async choice => { for (let i = 0; i < 40; i++) { if (await button(choice, '.chat-ask')) return true; await wait((await button('', '.chat-ask')) ? 300 : 500); } return false; };
await must('離開，關上書櫃'); await wait(4500); await toRoom(); await hear('我想幫忙'); await wait(600); log.push(`told: ${(await save()).story.told}`);
await enterSecret();
// Volunteer: J.
await thing('register'); await page.evaluate(() => [...document.querySelectorAll('.register-letter')].find(b => b.textContent === 'J').click()); await wait(200); await must('蓋章加入'); await wait(800); await putBack();
log.push(`signed: ${(await save()).volunteer.mark}`);
await must('離開，關上書櫃'); await wait(4500); await toRoom(); await wait(2500);
// Jobs: lichen, hay, the rack and the desk's letters, the wheel.
await page.evaluate(() => document.querySelector('.cabin-back:not([hidden])')?.click()); await wait(6000);
await checkpoint('signing up');
// Jobs: the reindeer fed by the barn's table (by the clock: oats, carrot, lichen); the sleigh loaded, first stop on top.
await spot('reindeer'); for (const kind of ['oats', 'carrot', 'lichen']) { await page.click(`.feed-basket [data-kind="${kind}"]`); await wait(1600); } await wait(2600);
await page.click('.sleigh-spot'); await wait(700); for (const city of ['多倫多', '雷克雅維克', '東京', '台北']) { await page.click(`.sleigh-pile .sleigh-sack[data-city="${city}"]`); await wait(250); } await wait(2400); await shot('sleigh'); await closeCard('.sleigh-card');
log.push(`jobs after yard: ${(await save()).volunteer.tasks}`);
await enterSecret();
await thing('rack');
for (const [id, mark] of [['m1', 'E'], ['m2', 'O'], ['m3', 'N'], ['m4', 'K'], ['m5', 'H'], ['m6', 'N'], ['tomas', 'you'], ['aya', 'you']]) { await page.click(`.rack-letter[data-id="${id}"]`); await wait(100); await page.evaluate(m => document.querySelector(`.rack-slot[data-mark="${m}"]`).click(), mark); await wait(220); }
await wait(2600); await shot('rack-done'); await putBack();
// The brass pin on the postmark tray, for the music box's catch.
await thing('stamps'); await page.click('.secret-pin'); await wait(1300); await putBack();
// The cord: the slip, and the lock (it opens with the hearth's help later).
await thing('register'); await shot('register-cord'); await button('拿起紙條', '.register-sign'); await wait(800); await putBack();
await must('離開，關上書櫃'); await wait(4500); await toRoom();
const press = name => page.evaluate(name => [...document.querySelectorAll('.desk-actions button')].find(b => b.textContent === name && !b.hidden)?.click(), name);
await spot('desk', 7000);
// One of the two new letters answered and sent does the job.
for (let n = 0; n < 1; n++) {
  await page.evaluate(() => document.querySelector('.desk-pick[aria-label="從信堆抽一封信"]').click()); await wait(700);
  await press('拆開信'); await wait(300); await press('寫回信 ✎'); await wait(300); await page.locator('.compose-choice').first().click(); await press('摺好放進信封'); await wait(800);
  await page.evaluate(() => document.querySelector('.desk-seal').click()); await wait(200); await page.evaluate(() => document.querySelector('.desk-stamp').click()); await wait(300); await press('投進郵袋'); await wait(2500);
}
log.push(`jobs after desk: ${(await save()).volunteer.tasks}`);
await spot('hearth', 7000); for (let i = 0; i < 2; i++) { await page.evaluate(i => document.querySelectorAll('.hearth-log')[i].click(), i); await wait(400); }
await use('slip', '.hearth-stone'); await wait(5200); await shot('lemon'); await closeCard('.lemon-card'); log.push(`slip: ${(await save()).finale.slip}`);
await checkpoint('three jobs');
// The wheel, from out in the yard.
await toRoom(); await page.evaluate(() => document.querySelector('.cabin-back:not([hidden])')?.click()); await wait(7000);
await page.locator('.cabin-gesture').focus(); for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowLeft'); await wait(120); } await wait(3000);
for (const [x, y] of mobile ? [[326, 297], [310, 262], [345, 330]] : [[1050, 190], [880, 160], [1000, 250], [1150, 200]]) { if (await page.$('.gearbox')) break; await page.mouse.click(x, y); await wait(2200); }
const pick = name => page.evaluate(name => [...document.querySelectorAll('.gearbox-piece')].find(b => b.getAttribute('aria-label').startsWith(name)).click(), name);
const peg = i => page.evaluate(i => document.querySelectorAll('.gearbox-peg')[i].click(), i);
await page.click('.gearbox-snow'); await wait(1300); await use('gear', '.gearbox-board'); await wait(700);
await pick('小齒輪'); await peg(2); await pick('特大齒輪'); await peg(1); await pick('中齒輪'); await peg(0);
for (let i = 0; i < 12 && !(await page.evaluate(() => document.querySelector('.gearbox')?.classList.contains('is-running'))); i++) { await page.evaluate(() => document.querySelector('.gearbox-crank')?.focus()); await page.keyboard.press('Enter'); await wait(160); }
await wait(3500); await shot('wheel-mended'); await button('好了'); await wait(1500);
log.push(`jobs: ${(await save()).volunteer.tasks} | ornaments ${(await save()).ornaments}`);
// The snowman, as in the polaroid (E).
await spot('snowman');
for (const [tab, item] of [['頭部', '耳罩'], ['頸部', '格紋圍巾'], ['臉部', '圓框眼鏡'], ['手持', '提燈']]) { await page.evaluate(tab => [...document.querySelectorAll('.wardrobe-tabs button')].find(b => b.textContent.includes(tab))?.click(), tab); await wait(250); await page.evaluate(item => [...document.querySelectorAll('.wardrobe-item')].find(b => (b.getAttribute('aria-label') || '').includes(item))?.click(), item); await wait(400); }
await wait(2600); await shot('snowman-gift'); await closeCard('.piece-card');
// Back in: the music box's drawer (N), the cord's lock and the old page, the smallest hat (H).
await page.evaluate(() => document.querySelector('.cabin-back:not([hidden])')?.click()); await wait(6000);
// All four jobs done, back in the middle of the room: Santa asks, once, what comes next.
await spot('inside', 7000); log.push(`asked: ${await page.evaluate(() => document.querySelector('.ask-card')?.textContent.slice(0, 30) ?? 'no')}`); await must('繼續探索'); await wait(500); await note('explore');
await spot('musicbox');
await use('pin', '.musicbox-drawer'); await wait(1900);
for (const m of ['E', 'O', 'N', 'K', 'H']) { await page.evaluate(m => [...document.querySelectorAll('.comb-tine')].find(b => b.textContent === `${m}.`).click(), m); await wait(260); }
await wait(2000); await shot('comb-open'); await closeCard('.comb-card');
await enterSecret();
await thing('record'); for (const [i, n] of [[0, 2], [3, 3]]) for (let k = 0; k < n; k++) { await page.evaluate(i => document.querySelectorAll('.lock-dial')[i].click(), i); await wait(80); }
await wait(2200); await shot('old-record'); await putBack();
await thing('hats'); await button('把最小的那頂帽子翻過來看看', '.register-sign'); await wait(1400); await shot('hat-gift'); await putBack();
log.push(`twist ${(await save()).finale.twist} | ornaments ${(await save()).ornaments}`);
// Out of the little room: back in the middle, the tree.
await must('離開，關上書櫃'); await wait(4500); await toRoom(); await wait(2500);
log.push(`tree card: ${await page.evaluate(() => Boolean(document.querySelector('.tree-card')))}`); await shot('tree'); await page.evaluate(() => document.querySelector('.tree-card .cabin-letter-close')?.click()); await wait(500);
await checkpoint('the tree');
// The endings, each confirmed and told once, then its postcard: a wish (B, told true), staying on (C, told true), and,
// signed off, going home at the world signpost (A); walking out of the house tells nothing.
const told = async () => { const kind = await theatre(), truth = await page.evaluate(() => Boolean(document.querySelector('.ending-theatre .theatre-act'))); await leaveTheatre(); const card = await page.evaluate(() => Boolean(document.querySelector('.postcard-card'))); await page.waitForFunction(() => document.querySelector('.postcard-image')?.src.startsWith('data:image/png'), null, { timeout: 15000 }); await shot(`postcard-${kind}`); await must('留在村子'); await wait(1500); return `${kind}${truth ? '＋真相' : ''}${card ? '（明信片）' : ''}${await page.evaluate(() => document.querySelector('.ending-theatre') ? '，又接了一段' : '')}`; };
await enterSecret();
await thing('register'); await page.evaluate(() => [...document.querySelectorAll('.register-wishes .compose-choice')].find(b => b.textContent.includes('禮物')).click()); await must('蓋章許願'); await wait(400); await must('確定許願'); await wait(900);
await page.click('.wish-gift'); await wait(2600); await must('好 ✓'); await wait(800);
log.push(`ending: ${await told()}`);
await thing('log'); await must('簽上早班'); await wait(400); await must('確定簽名'); await wait(900); log.push(`ending: ${await told()}`); await putBack();
await thing('register'); await must('離開替身工作'); await wait(300); await must('確定離開'); await wait(800); await putBack();
await must('離開，關上書櫃'); await wait(4500); await toRoom(); await page.evaluate(() => document.querySelector('.cabin-back:not([hidden])')?.click()); await wait(8000);
log.push(`walked out: ${await page.evaluate(() => document.querySelector('.ending-theatre') ? 'an ending (wrong)' : 'nothing told')}`);
await page.evaluate(() => document.querySelector('.cabin-explore [data-touch="world-sign"]').click()); await wait(800); await must('踏上回家的路'); await wait(300); await must('確定回家'); await wait(900);
log.push(`ending: ${await told()}`);
const end = await save();
log.push(`finale ${JSON.stringify(end.finale)} | ornaments ${end.ornaments} tree ${end.tree} | clues ${end.clues.length}`);
await page.evaluate(() => document.querySelector('.notebook-button').click()); await wait(600); await shot('notebook-end');
log.push(`goal: ${await page.evaluate(() => document.querySelector('.notebook-goal:last-of-type')?.textContent)}`);
// Everything reached: the three endings and the truth, five gifts on the tree, no page errors.
const whole = ['A', 'B', 'C'].every(kind => end.finale.endings.includes(kind)) && end.finale.truth && end.finale.asked && end.ornaments.length === 5 && end.tree && ['lichen', 'key', 'handle', 'matches', 'magnifier', 'pin', 'slip', 'gear'].every(id => [...end.bag.held, ...end.bag.used].includes(id)) && ['blotter', 'music-bookmarks', 'globe-village'].every(id => end.clues.includes(id)) && !errors.length;
console.log(whole ? 'PASS  從空白存檔玩到院子四樣東西、屋裡的放大鏡與線索、撥針、三個結局與真相版、五個見面禮、聖誕樹，沒有頁面錯誤' : `FAIL  ${JSON.stringify({ endings: end.finale.endings, ornaments: end.ornaments, tree: end.tree, bag: end.bag, errors })}`);
await browser.close(); process.exitCode = whole ? 0 : 1;
