// Santa 第五章（最終選擇）的瀏覽器驗收：走出小屋不會觸發任何結局；院子的世界路標（點場景裡的路標，或鍵盤用探索清單）
// 選「踏上回家的路」再確認才是 A，「再逛逛」什麼都不發生；已加入的人看到路標上的小卡，還不知道秘密的人只看到說明。
// 登記簿許願、交接表簽明年的夜班都要再確認一次；四件工作都做完，聖誕老人只問一次。每個選擇只播一段結局，理解第二次反轉後
// 是真相版（第二幕），演完有紀念明信片（存成 PNG、回到 Home、留在村子），重看不給明信片。走到過一個結局，其他結局也能從線索本或登記簿直接看。結局 C 名牌與帽子掛上第六鉤；
// 舊存檔的結局 D 換成真相金星。最後從線索本「從頭再玩一次」（先問一次），只清聖誕村的進度。手機尺寸用真的觸控事件。只讀寫這個瀏覽器的 localStorage，不連任何雲端。
// 先啟動：python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-santa-endings.mjs（WIDTH=390 HEIGHT=844 是手機；SHOTS=資料夾 會存截圖）
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { auditor } from './santa-audit.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', w = Number(process.env.WIDTH ?? 1440), h = Number(process.env.HEIGHT ?? 900), mobile = w < 800, SHOTS = process.env.SHOTS;
if (SHOTS) await fs.mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, acceptDownloads: true }), page = await context.newPage(), errors = [];
const audit = auditor(page, { mobile, width: w, script: 'endings' });
page.on('pageerror', e => { errors.push(String(e)); console.log('PAGE ERROR', String(e)); });
const wait = ms => page.waitForTimeout(ms);
let shots = 0; const shot = name => audit(name).then(() => (SHOTS ? page.screenshot({ path: `${SHOTS}/${String(++shots).padStart(2, '0')}-${name}-${w}.png` }) : null));
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) errors.push(label); };
const centre = async selector => { const box = await page.locator(selector).first().boundingBox(); return [box.x + box.width / 2, box.y + box.height / 2]; };
async function tap(selector) { const [x, y] = await centre(selector); if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await wait(400); }
const caption = () => page.evaluate(() => document.querySelector('.cabin-caption')?.textContent ?? '');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('holy-merry:cabin:v1') || '{}'));
const exists = selector => page.evaluate(selector => Boolean(document.querySelector(selector)), selector);
const text = selector => page.evaluate(selector => document.querySelector(selector)?.textContent ?? '', selector);
const press = selector => page.evaluate(selector => document.querySelector(selector)?.click(), selector);
// A button by its words, pressed for real (mouse or finger) once it is on screen.
const button = async (words, scope = 'button, a') => {
  const index = await page.evaluate(([words, scope]) => [...document.querySelectorAll(scope)].findIndex(b => b.textContent.trim().startsWith(words) && !b.hidden && !b.disabled && b.getClientRects().length), [words, scope]);
  if (index < 0) return false;
  const node = page.locator(scope).nth(index); await node.scrollIntoViewIfNeeded(); const box = await node.boundingBox();
  if (mobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await wait(500); return true;
};
const must = async (words, scope) => { if (!(await button(words, scope))) throw new Error(`no button: ${words}`); };
const view = () => page.evaluate(() => document.querySelector('#cabin-stage').dataset.view);
const spot = async (id, ms = 7000) => { await page.evaluate(id => document.querySelector(`.cabin-explore [data-spot="${id}"]`).click(), id); await wait(ms); };
const toRoom = async () => { for (let i = 0; i < 3 && (await view()) !== 'inside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5000); } };
const toYard = async () => { for (let i = 0; i < 3 && (await view()) !== 'outside'; i++) { await press('.cabin-back:not([hidden])'); await wait(5500); } };
const enter = async () => { if ((await view()) === 'outside') await spot('inside'); await spot('shelf'); for (let i = 0; i < 2 && (await view()) !== 'secret'; i++) { await press('.books-tools button:not([hidden])'); await wait(4800); } };
const thing = async id => { await press(`.secret-thing[data-id="${id}"]`); await wait(800); };
const putBack = async () => { await press('.secret-card .cabin-letter-close'); await wait(500); };
// Wholly on screen and inside the stage: a card, a button.
const onStage = selector => page.evaluate(selector => { const box = document.querySelector(selector)?.getBoundingClientRect(), stage = document.querySelector('#cabin-stage').getBoundingClientRect(); return Boolean(box && box.width && box.left >= stage.left - 1 && box.right <= stage.right + 1 && box.top >= Math.max(stage.top, 0) - 1 && box.bottom <= Math.min(stage.bottom, innerHeight) + 1); }, selector);
async function load(record) {
  await page.goto(`${BASE}/santa.html`);
  await page.evaluate(record => { localStorage.clear(); localStorage.setItem('holy-merry:cabin:v1', JSON.stringify(record)); }, record); await page.reload();
  await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
  await page.evaluate(() => document.querySelector('.cabin').scrollIntoView()); await wait(2500);
}
// The world signpost in the yard, tapped where it stands (turned to face the coast), or from the explore list.
const SIGN = mobile ? [[155, 412], [155, 428], [151, 396]] : [[470, 470], [470, 520], [458, 440]];
async function tapSign() {
  await toYard(); await page.locator('.cabin-gesture').focus(); for (let i = 0; i < 16; i++) { await page.keyboard.press('ArrowRight'); await wait(120); } await wait(3500);
  for (const [x, y] of SIGN) { if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await wait(900); if (await exists('.signpost-card') || (await caption()).includes('路標')) return true; }
  return false;
}
const listSign = async () => { const out = (await view()) === 'outside'; await page.evaluate(() => document.querySelector('.cabin-explore [data-touch="world-sign"]').click()); await wait(out ? 900 : 7500); };
// An ending: it opens, is skipped to its end; then whether it was told true, and its way out.
async function ending() {
  await page.waitForSelector('.ending-theatre[open]', { timeout: 30000 }); await wait(1800);
  const kind = await page.evaluate(() => document.querySelector('.ending-theatre').dataset.ending), kicker = await text('.theatre-kicker');
  await shot(`ending-${kind}`); await press('.theatre-skip'); await wait(1200);
  const truth = await exists('.ending-theatre .theatre-act'); if (truth) await shot(`ending-${kind}-truth`);
  await press('.theatre-close'); await wait(1500);
  return { kind, kicker, truth, again: await exists('.ending-theatre') };
}
// The postcard after it: its picture drawn, saved as a PNG, a way Home; then back to the village.
async function postcard(kind, truth) {
  check(await exists('.postcard-card'), `結局 ${kind} 演完：紀念明信片`);
  await page.waitForFunction(() => document.querySelector('.postcard-image')?.src.startsWith('data:image/png'), null, { timeout: 15000 }); await wait(400); await shot(`postcard-${kind}`);
  check(await onStage('.postcard-card .postcard-actions') && await onStage('.postcard-card > .cabin-letter-close'), '明信片的按鈕都在畫面裡');
  const alt = await page.evaluate(() => document.querySelector('.postcard-image').alt);
  check(truth ? alt.includes('Dear Christmas Traveler') : !alt.includes('Dear Christmas Traveler'), `明信片的字：${truth ? '真相版（Dear Christmas Traveler…）' : '一般版'}`);
  const [file] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), button('存成圖片')]);
  const bytes = await fs.readFile(await file.path());
  check(file.suggestedFilename() === `holy-merry-postcard-${kind.toLowerCase()}.png` && bytes.subarray(1, 4).toString() === 'PNG' && bytes.length > 50000, `存成圖片：下載 ${file.suggestedFilename()}（${Math.round(bytes.length / 1024)} KB）`);
  check((await page.evaluate(() => document.querySelector('.postcard-home').getAttribute('href'))) === 'index.html', '「回到 Home」連到首頁');
  await must('留在村子'); await wait(800); check(!(await exists('.postcard-card')), '留在村子：明信片收起來，村子照常可以逛');
}
const base = { bag: { held: ['magnifier', 'pin'], used: ['lichen', 'handle', 'matches', 'key'] }, hoist: { locked: true, found: true }, story: { left: true, opened: true, shut: true, seen: ['tags', 'log', 'rules'], told: true, shelf: ['book-h1', null, 'book-l1', 'book-y1', null, null, null, 'book-r2', 'book-y2', 'book-m1', 'book-o1', 'book-r1', 'book-e1'] }, clues: ['care-note', 'route', 'route-note'] };
const visitor = { ...base, volunteer: { mark: '', tasks: [] }, finale: { invited: true } };

// A visitor who knows the secret: walking out of the house tells nothing; the signpost is the way home, confirmed.
await load(visitor);
await spot('inside'); await toYard(); await wait(2500);
check(!(await exists('.ending-theatre')) && !(await saved()).finale?.endings?.length, '走進小屋再走出門：不會觸發任何結局');
check(await tapSign(), '點院子裡的世界路標'); await shot('signpost');
check(await exists('.signpost-card') && await onStage('.signpost-card'), '知道秘密、沒有加入：路標上有「踏上回家的路」');
await must('踏上回家的路'); check((await text('.signpost-card')).includes('要離開聖誕村'), '先問一次：要離開聖誕村了嗎？'); await shot('signpost-sure');
await must('再逛逛'); check(!(await exists('.signpost-card')) && !(await exists('.ending-theatre')) && !(await saved()).finale?.endings?.length, '選「再逛逛」：什麼都沒發生');
await listSign(); await must('踏上回家的路'); await must('確定回家');
const a = await ending(); check(a.kind === 'A' && !a.truth && !a.again && (await saved()).finale.endings.join() === 'A', `確定回家：只播結局 A（${a.kicker}）`);
await postcard('A', false);
await load(await saved()); await listSign();
check((await saved()).finale.endings.join() === 'A' && await exists('.signpost-card') && (await text('.signpost-card')).includes('踏上回家的路'), '重新整理：A 記住了，路標還是回家的路');
await must('好'); await wait(300);
// One ending reached opens the other two: the clue book's first page has the row of endings, and B, not reached, plays
// when pressed as a replay (nothing reached, no postcard); a visitor not signed up finds the row in the register too.
await press('.notebook-button'); await wait(2500);
const row = await page.evaluate(() => [...document.querySelectorAll('.book-page .register-endings > :is(span, button):not(:first-child)')].map(mark => `${mark.tagName}:${mark.className}`));
check(row.length === 4 && /^BUTTON:is-seen/.test(row[0]) && /^BUTTON:is-open/.test(row[1]) && /^BUTTON:is-open/.test(row[2]) && /^SPAN/.test(row[3]), `看過 A：線索本「現在」那頁的結局章，B、C 也能按，真相還沒有（${row.join(' ')}）`);
await shot('book-endings'); await tap('.book-page .register-endings button.is-open');
const watched = await ending(); check(watched.kind === 'B' && !watched.truth && (await saved()).finale.endings.join() === 'A' && !(await exists('.postcard-card')), '點線索本的 B：播結局 B，不算走到、沒有明信片');
await enter(); await thing('register');
check((await page.evaluate(() => [...document.querySelectorAll('.secret-card .register-endings button')].map(b => b.querySelector('.ending-letter')?.textContent).join())) === 'A,B,C', '沒有加入的人，登記簿下方也有結局章（A、B、C 都能按）'); await putBack();
// Anyone else at the signpost: a volunteer reads the card hung on it; before the secret, only what it says.
await load({ ...base, volunteer: { mark: 'J', tasks: ['wheel'] }, finale: { invited: true } }); await listSign();
check((await text('.signpost-card')).includes('劃掉縮寫') && !(await exists('.signpost-card .register-sign')), '已加入：路標上掛著「替身要先劃掉縮寫」的小卡，不觸發結局'); await must('好');
await load({ ...base, story: { ...base.story, told: false, seen: ['tags'] }, volunteer: { mark: '', tasks: [] }, finale: {} }); await listSign();
check(!(await exists('.signpost-card')) && (await caption()).includes('路標指向'), '還不知道秘密：只看到路標原本的說明');

// Three stamps: the wish chosen, then confirmed ("再想想" goes back); B, told plain.
await load({ ...base, volunteer: { mark: 'J', tasks: ['wheel', 'hay', 'lichen'] }, finale: { invited: true } });
await enter(); await thing('register');
await page.evaluate(() => [...document.querySelectorAll('.register-wishes .compose-choice')].find(b => b.textContent.includes('禮物')).click()); await wait(300);
await must('蓋章許願'); check((await text('.secret-card')).includes('確定要用三個章'), '蓋章許願：先問一次'); await shot('wish-sure');
await must('再想想'); check(await exists('.register-wishes .compose-choice[aria-pressed="true"]:not(:disabled)') && !(await saved()).finale.wish, '再想想：回到選願望，還沒許願');
await must('蓋章許願'); await must('確定許願'); await wait(900); await tap('.wish-gift'); await wait(2600); await must('好 ✓'); await wait(800);
const b = await ending(); check(b.kind === 'B' && !b.truth && !b.kicker.includes('真相') && !b.again, `確定許願：只播結局 B，一般版（${b.kicker}）`);
await postcard('B', false);
check((await saved()).finale.endings.join() === 'B' && (await saved()).finale.truth === false, '存檔：B，沒有真相');

// All four jobs and the second twist understood: Santa asks once; next season's night shift confirmed; C told true.
const four = { ...base, volunteer: { mark: 'J', tasks: ['wheel', 'hay', 'lichen', 'letters'] }, desk: { sorted: true }, finale: { invited: true, unlocked: true, twist: true } };
await load(four); await spot('inside'); await wait(1500);
check(await exists('.cabin-chat:not(.is-folded)') && (await text('.chat-log')).includes('今天的收尾工作，你都做完了') && (await text('.chat-asks')).includes('自願留下'), '四件工作都做完：回到房間中間，聖誕老人在對話框問一次，回答是禮物吊牌'); await shot('ask');
await must('自願留下'); check((await text('.chat-log')).includes('明年的夜班') && (await saved()).finale.asked && !(await saved()).finale.endings?.length, '選「自願留下」：只說去交接表簽名，不直接結束');
await load(await saved()); await spot('inside'); await wait(1800); check(!(await exists('.cabin-chat:not(.is-folded)')), '重新整理後再回房間：不再問');
await enter(); await thing('log');
await must('簽下明年的夜班'); check((await text('.secret-card')).includes('確定要留下來嗎'), '簽下明年的夜班：先問一次');
await must('再想想'); check(!(await saved()).finale.stayed, '再想想：還沒簽');
await must('簽下明年的夜班'); await must('確定簽名'); await wait(600);
const c = await ending(); check(c.kind === 'C' && c.truth && c.kicker.includes('＋真相') && !c.again, `確定簽名：只播結局 C，真相版接第二幕（${c.kicker}）`);
await postcard('C', true);
const after = (await saved()).finale; check(after.stayed && after.truth && after.endings.join() === 'C', '存檔：C 與真相');
await putBack(); await thing('tags'); check(await exists('.secret-tags .is-you'), '名牌板第六個掛勾：你的名牌'); await putBack();
await thing('hats'); check((await text('.secret-card')).includes('第六個掛鉤上，是你的帽子'), '帽架第六個掛鉤：你的帽子'); await putBack(); await shot('room-mine');
await thing('register');
check(await page.evaluate(() => { const marks = [...document.querySelectorAll('.register-endings > :not(:first-child)')]; return marks.length === 4 && marks.map(m => m.textContent).join() === 'A,B,C,真相' && marks.filter(m => m.matches('button.is-seen')).map(m => m.textContent).join() === 'C,真相'; }), '登記簿：A、B、C 三個章和一顆真相金星，看過的才能按'); await page.evaluate(() => document.querySelector('.register-endings').scrollIntoView({ block: 'center' })); await wait(300); await shot('register-endings');
await press('.register-endings .ending-truth'); const replay = await ending();
check(replay.truth && !(await exists('.postcard-card')), '按真相金星重看：真相版，重看不給明信片');
// Reloaded: the tag and the hat still hang there.
await load(await saved()); await enter(); await thing('hats'); check((await text('.secret-card')).includes('是你的帽子'), '重新整理：帽子還掛在第六鉤'); await putBack();

// An older record that saw ending D: B or C was told true.
await load({ ...base, volunteer: { mark: 'J', tasks: ['wheel', 'hay', 'lichen'] }, finale: { invited: true, unlocked: true, twist: true, wish: 'snow', endings: ['A', 'B', 'D'] } });
await enter(); await thing('register');
check(await page.evaluate(() => [...document.querySelectorAll('.register-endings button.is-seen')].map(m => m.textContent).join()) === 'A,B,真相', '舊存檔的結局 D：換成真相金星，A、B 照算');
// Starting over, from the bottom of the clue book: asked once more ("再想想" keeps everything); then the village is
// forgotten and the page opens from the first chapter. What the Wish page keeps is left alone.
await page.evaluate(() => localStorage.setItem('holy-merry:wishes:v1', '["kept"]'));
await press('.notebook-button'); await wait(700);
await press('.notebook-restart'); await wait(300); check((await text('.notebook-card')).includes('確定嗎'), '從頭再玩一次：先問一次');
await must('再想想'); check(Boolean((await saved()).finale) && await exists('.notebook-restart:not([hidden])'), '再想想：進度都還在');
await press('.notebook-restart'); await wait(300); await shot('restart');
await Promise.all([page.waitForNavigation({ timeout: 30000 }), must('確定重新開始')]);
await page.waitForFunction(() => !document.querySelector('.site-loader') && document.querySelector('#cabin-stage').dataset.state === 'ready', null, { timeout: 120000 });
check(await page.evaluate(() => !localStorage.getItem('holy-merry:cabin:v1') && !localStorage.getItem('holy-merry:cabin:found') && localStorage.getItem('holy-merry:wishes:v1') === '["kept"]'), '確定重新開始：聖誕村的進度清空，Wish 的資料不動');
check(await page.evaluate(() => document.querySelector('.notebook-button').hidden && !document.querySelector('.cabin-bag:not([hidden]) .bag-item')), '重新開始後回到第一章：線索本和口袋都還沒出現');
console.log(errors.length ? `FAIL  ${errors.length} 項` : 'PASS  第五章：路標回家、確認步驟、只問一次、每個選擇只播一段、真相版、明信片、帽子、舊存檔'); await browser.close(); process.exitCode = errors.length ? 1 : 0;
