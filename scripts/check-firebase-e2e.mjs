// 全部在本機模擬器上操作網站的 Firebase 功能；任何連往正式 Firebase 的請求都會被攔下並回報。
// 先啟動：npx firebase emulators:start --only auth,firestore --project demo-holy-merry
//         python3 -m http.server 5511 --bind 127.0.0.1
// 執行：BASE=http://127.0.0.1:5511 node scripts/check-firebase-e2e.mjs
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5511', PROJECT = 'demo-holy-merry', OUT = 'screenshots/firebase';
const AUTH = 'http://127.0.0.1:9099', STORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OWNER = { Authorization: 'Bearer owner' };
const report = [], blocked = [], consoleErrors = [];
const note = (name, ok, detail = '') => { report.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const json = async (url, options = {}) => { const r = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); return { status: r.status, body: await r.json().catch(() => null) }; };

async function resetEmulators() {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE', headers: OWNER });
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
}
async function account(email, password) {
  const { body } = await json(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x`, { method: 'POST', body: JSON.stringify(email ? { email, password, returnSecureToken: true } : { returnSecureToken: true }) });
  return { uid: body.localId, token: body.idToken, email, password };
}
async function grantAdmin(uid) {
  await json(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, { method: 'POST', headers: OWNER, body: JSON.stringify({ localId: uid, customAttributes: '{"admin":true}' }) });
}
async function signIn(email, password) {
  const { body } = await json(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x`, { method: 'POST', body: JSON.stringify({ email, password, returnSecureToken: true }) });
  return body.idToken;
}
const wishesInStore = async () => { const { body } = await json(`${STORE}:runQuery`, { method: 'POST', headers: OWNER, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'wishes', allDescendants: true }] } }) }); return (body ?? []).filter(row => row.document).map(row => row.document); };
const publicInStore = async () => (await json(`${STORE}/publicWishes`, { headers: OWNER })).body.documents ?? [];
const str = (doc, key) => doc.fields?.[key]?.stringValue;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function open(label, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...options });
  // 只比對主機名稱：Auth 模擬器的路徑裡也有 googleapis.com，但主機是 127.0.0.1。
  await context.route(url => /(googleapis\.com|firebaseio\.com|firebaseapp\.com|firebase\.google\.com|web\.app)$/.test(url.hostname), route => { blocked.push(route.request().url()); return route.abort(); });
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`[${label}] ${message.text().slice(0, 220)}`); });
  page.on('pageerror', error => consoleErrors.push(`[${label}] pageerror ${String(error).slice(0, 220)}`));
  return { context, page };
}
let shot = 0;
const snap = (page, name) => page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, '0')}-${name}.png` });
const cloudText = page => page.locator('#cloud-status').textContent();
async function openWish(page) {
  await page.goto(`${BASE}/wish.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => { const t = document.querySelector('#cloud-status')?.textContent ?? ''; return t.startsWith('已連接') || t.includes('尚未連接') || t.includes('暫時無法'); }, null, { timeout: 40000 });
}
async function sendWish(page, nickname, content, makePublic) {
  await page.locator('#nickname').fill(nickname); await page.locator('#wish-content').fill(content);
  await page.locator('#wish-public').setChecked(makePublic, { force: true });
  await page.waitForFunction(() => !document.querySelector('#wish-form button[type="submit"]').disabled, null, { timeout: 30000 });
  await page.locator('#wish-form button[type="submit"]').click({ force: true });
  await page.waitForFunction(() => (document.querySelector('#receipt-message')?.textContent ?? '').includes('雲端已確認') || (document.querySelector('#wish-status')?.textContent ?? '').length > 0, null, { timeout: 60000 });
  return { receipt: await page.locator('#receipt-message').textContent(), status: await page.locator('#wish-status').textContent() };
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
await resetEmulators();
const adminUser = await account('moderator@example.test', 'admin-pass-123'), plainUser = await account('someone@example.test', 'plain-pass-123');
await grantAdmin(adminUser.uid);

// 1. 訪客：匿名登入與寄信
const first = await open('訪客A', { reducedMotion: 'reduce' });
await openWish(first.page);
note('Wish：頁面連上模擬器並匿名登入', (await cloudText(first.page)).startsWith('已連接'), await cloudText(first.page));
const projectSeen = await first.page.evaluate(async () => { const { getVisitor } = await import('/js/services/firebase-client.js'); const c = await getVisitor(); return { project: c.app.options.projectId, anonymous: c.auth.currentUser.isAnonymous, uid: c.auth.currentUser.uid, emulator: c.auth.emulatorConfig?.port }; });
note('瀏覽器使用 demo 專案與 Auth 模擬器', projectSeen.project === PROJECT && projectSeen.emulator === 9099 && projectSeen.anonymous, JSON.stringify(projectSeen));
await snap(first.page, 'wish-connected');
const sent = await sendWish(first.page, '小明', '希望今年下雪', true);
note('Wish：公開願望寄出，畫面顯示雲端確認', sent.receipt.includes('雲端已確認'), sent.receipt || sent.status);
await snap(first.page, 'wish-public-sent');
let stored = await wishesInStore();
const publicDoc = stored.find(d => str(d, 'nickname') === '小明');
note('模擬器：公開願望寫入 users/{uid}/wishes，狀態 pending', publicDoc && publicDoc.name.includes(`/users/${projectSeen.uid}/wishes/`) && str(publicDoc, 'status') === 'pending' && str(publicDoc, 'visibility') === 'public', publicDoc?.name.split('documents/')[1]);
note('模擬器：審核前不會出現在 publicWishes', (await publicInStore()).length === 0);
const count = await first.page.locator('#cloud-wish-total').textContent();
note('Wish：自己的信封出現（1 封）', count === '1 封', count);
await first.page.locator('details:has(#cloud-envelope-list) summary').click();
await first.page.locator('#cloud-envelope-list button').first().click();
await first.page.waitForTimeout(400);
note('Wish：可開啟自己的信', (await first.page.locator('#wish-dialog-content').textContent()) === '希望今年下雪');
await snap(first.page, 'wish-own-letter');
await first.page.keyboard.press('Escape');
await first.page.reload({ waitUntil: 'domcontentloaded' });
await first.page.waitForFunction(() => (document.querySelector('#cloud-status')?.textContent ?? '').startsWith('已連接'), null, { timeout: 40000 });
const uidAgain = await first.page.evaluate(async () => (await (await import('/js/services/firebase-client.js')).getVisitor()).auth.currentUser.uid);
note('Wish：重新整理後仍是同一位訪客，讀得到自己的信', uidAgain === projectSeen.uid && (await first.page.locator('#cloud-wish-total').textContent()) === '1 封');

// 2. 第二位訪客寄私人信
const second = await open('訪客B', { reducedMotion: 'reduce' });
await openWish(second.page);
const privateSent = await sendWish(second.page, '小華', '這是我的祕密願望', false);
note('Wish：私人願望寄出', privateSent.receipt.includes('私人'), privateSent.receipt || privateSent.status);
await snap(second.page, 'wish-private-sent');
const third = await open('訪客C', { reducedMotion: 'reduce' });
await openWish(third.page);
const rejectSent = await sendWish(third.page, '小美', '這封會被拒絕', true);
note('Wish：第三封（待拒絕）寄出', rejectSent.receipt.includes('雲端已確認'), rejectSent.status);
stored = await wishesInStore();
note('模擬器：三封信都在，狀態皆 pending', stored.length === 3 && stored.every(d => str(d, 'status') === 'pending'), `${stored.length} 封`);

// 3. 輸入檢查（瀏覽器端）
const blank = await open('訪客D', { reducedMotion: 'reduce' });
await openWish(blank.page);
await blank.page.locator('#nickname').fill('   '); await blank.page.locator('#wish-content').fill('內容');
await blank.page.locator('#wish-form button[type="submit"]').click({ force: true }); await blank.page.waitForTimeout(500);
note('Wish：空白暱稱被擋下，沒有寫入', (await wishesInStore()).length === 3, await blank.page.locator('#nickname').evaluate(n => n.validationMessage));
const limits = await blank.page.evaluate(() => ({ nick: document.querySelector('#nickname').maxLength, content: document.querySelector('#wish-content').maxLength }));
note('Wish：輸入框長度上限 20 / 300', limits.nick === 20 && limits.content === 300, JSON.stringify(limits));
await blank.context.close();

// 4. 模擬器連不上時的畫面與重試
const offline = await open('離線訪客', { reducedMotion: 'reduce' });
await offline.context.route(/127\.0\.0\.1:(9099|8080)/, route => route.abort());
await openWish(offline.page);
const offlineText = await cloudText(offline.page);
note('Wish：連不上時顯示提示，不假裝成功', offlineText.includes('尚未連接') && await offline.page.locator('#cloud-retry').isVisible(), offlineText);
await snap(offline.page, 'wish-offline');
await offline.context.unroute(/127\.0\.0\.1:(9099|8080)/);
await offline.page.locator('#cloud-retry').click({ force: true });
await offline.page.waitForFunction(() => (document.querySelector('#cloud-status')?.textContent ?? '').startsWith('已連接'), null, { timeout: 30000 }).catch(() => {});
note('Wish：恢復連線後按重試可連上', (await cloudText(offline.page)).startsWith('已連接'), await cloudText(offline.page));
await offline.context.close();

// 4b. 完整動畫的寄信流程（不開減少動態）
const animated = await open('動畫訪客');
await openWish(animated.page);
await animated.page.waitForFunction(() => !document.querySelector('#wish-form button[type="submit"]').disabled, null, { timeout: 30000 });
const animatedSent = await sendWish(animated.page, '動畫測試', '完整動畫也要寄得出去', false);
note('Wish：完整動畫下也能寄出', animatedSent.receipt.includes('雲端已確認'), animatedSent.receipt.slice(0, 24) || animatedSent.status);
await snap(animated.page, 'wish-animated-sent');
await animated.context.close();

// 4c. 寄送途中斷線：內容要保留，重試不能變兩封
const flaky = await open('斷線訪客', { reducedMotion: 'reduce' });
await openWish(flaky.page);
const before = (await wishesInStore()).length;
const cut = /127\.0\.0\.1:8080/;
await flaky.context.route(cut, route => route.abort());
await flaky.page.evaluate(() => { document.querySelector('#nickname').value = ''; });
const failedSend = await sendWish(flaky.page, '斷線', '重試不能變兩封', false);
note('Wish：斷線時不假裝寄出，內容保留', failedSend.status.includes('尚未確認') && (await flaky.page.locator('#wish-content').inputValue()) === '重試不能變兩封', failedSend.status.slice(0, 26));
await snap(flaky.page, 'wish-send-failed');
await flaky.context.unroute(cut);
await flaky.page.evaluate(() => { document.querySelector('#wish-status').textContent = ''; });
await flaky.page.locator('#wish-form button[type="submit"]').click({ force: true });
await flaky.page.waitForFunction(() => (document.querySelector('#receipt-message')?.textContent ?? '').includes('雲端已確認') || (document.querySelector('#wish-status')?.textContent ?? '').length > 0, null, { timeout: 30000 });
await flaky.page.waitForTimeout(500);
const afterRetry = (await wishesInStore()).filter(d => str(d, 'nickname') === '斷線').length;
note('Wish：恢復後重試只寫入一封', afterRetry === 1, `${afterRetry} 封，共 ${(await wishesInStore()).length - before} 封新增`);
await flaky.context.close();

// 4d. localhost 網址與連線檢查工具頁
const named = await open('localhost');
await named.page.goto(`${BASE.replace('127.0.0.1', 'localhost')}/tests/firebase-connection.html`);
await named.page.click('#check');
await named.page.waitForFunction(() => /以上沒有寫入|連線未完成/.test(document.querySelector('#result').textContent), null, { timeout: 30000 }).catch(() => {});
const toolText = await named.page.locator('#result').textContent();
note('localhost 網址同樣連到模擬器（連線檢查頁）', toolText.includes(PROJECT) && toolText.includes('匿名登入成功'), toolText.split('\n')[0]);
await snap(named.page, 'connection-tool');
await named.context.close();
for (const name of ['動畫測試', '斷線']) for (const doc of (await wishesInStore()).filter(d => str(d, 'nickname') === name)) await fetch(`http://127.0.0.1:8080/v1/${doc.name}`, { method: 'DELETE', headers: OWNER });

// 5. 管理員頁
const admin = await open('管理員');
await admin.page.goto(`${BASE}/admin.html`);
const login = async (email, password) => { await admin.page.waitForFunction(() => !document.querySelector('#admin-login button').disabled, null, { timeout: 20000 }); await admin.page.fill('#admin-email', email); await admin.page.fill('#admin-password', password); await admin.page.click('#admin-login button'); };
const adminStatus = () => admin.page.locator('#admin-status').textContent();
await login('moderator@example.test', 'wrong-password');
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent.includes('登入失敗'), null, { timeout: 15000 }).catch(() => {});
note('Admin：密碼錯誤被拒絕', (await adminStatus()).includes('登入失敗') && await admin.page.locator('#admin-panel').isHidden(), await adminStatus());
await snap(admin.page, 'admin-wrong-password');
await login('someone@example.test', 'plain-pass-123');
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent.includes('尚未授予'), null, { timeout: 15000 }).catch(() => {});
note('Admin：沒有 admin claim 的帳號進不去', (await adminStatus()).includes('尚未授予') && await admin.page.locator('#admin-panel').isHidden(), (await adminStatus()).slice(0, 30));
await snap(admin.page, 'admin-not-authorised');
await login('moderator@example.test', 'admin-pass-123');
await admin.page.waitForFunction(() => /已讀取|沒有待審|資料庫|索引|未完成/.test(document.querySelector('#admin-status').textContent), null, { timeout: 15000 }).catch(() => {});
note('Admin：管理員登入並讀到 3 封待審', (await adminStatus()) === '已讀取 3 封待審信件。', await adminStatus());
await snap(admin.page, 'admin-queue');
const item = name => admin.page.locator('#admin-wishes li', { hasText: name });
note('Admin：私人信的「核准公開」按鈕停用', await item('小華').getByRole('button', { name: '核准公開' }).isDisabled());
await item('小明').getByRole('button', { name: '核准公開' }).click();
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '已讀取 2 封待審信件。', null, { timeout: 15000 }).catch(() => {});
note('Admin：核准後佇列剩 2 封', (await adminStatus()) === '已讀取 2 封待審信件。', await adminStatus());
await item('小美').getByRole('button', { name: '拒絕' }).click();
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '已讀取 1 封待審信件。', null, { timeout: 15000 }).catch(() => {});
await item('小華').getByRole('button', { name: '拒絕' }).click();
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '目前沒有待審信件。', null, { timeout: 15000 }).catch(() => {});
note('Admin：拒絕後佇列清空', (await adminStatus()) === '目前沒有待審信件。', await adminStatus());
await snap(admin.page, 'admin-queue-empty');
stored = await wishesInStore();
const byName = name => stored.find(d => str(d, 'nickname') === name);
note('模擬器：審核狀態與審核者寫入', str(byName('小明'), 'status') === 'approved' && str(byName('小美'), 'status') === 'rejected' && str(byName('小明'), 'reviewedBy') === adminUser.uid);
const published = await publicInStore();
note('模擬器：只有核准的公開信進 publicWishes', published.length === 1 && str(published[0], 'nickname') === '小明' && str(published[0], 'ownerUid') === projectSeen.uid, `${published.length} 封`);
await admin.page.reload(); await admin.page.waitForTimeout(1500);
note('Admin：重新整理後維持登入（同分頁工作階段）', await admin.page.locator('#admin-panel').isVisible());
await admin.page.click('#admin-signout'); await admin.page.waitForTimeout(500);
note('Admin：登出後回到登入表單', (await adminStatus()) === '已登出。' && await admin.page.locator('#admin-login').isVisible(), await adminStatus());
await snap(admin.page, 'admin-signed-out');
await admin.page.reload(); await admin.page.waitForTimeout(1500);
note('Admin：登出後重新整理不會自動登入', await admin.page.locator('#admin-panel').isHidden());

// 5b. 全部願望：已公開／已拒絕分頁，撤回與重新同意都要真的進出隨機庫
await login('moderator@example.test', 'admin-pass-123');
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '目前沒有待審信件。', null, { timeout: 15000 }).catch(() => {});
const tab = async (name, text) => { await admin.page.locator('.admin-tabs').getByRole('button', { name }).click(); await admin.page.waitForFunction(text => document.querySelector('#admin-status').textContent === text, text, { timeout: 15000 }).catch(() => {}); };
await tab('已公開', '已讀取 1 封已公開願望。');
note('Admin：已公開分頁列出 1 封', (await admin.page.locator('#admin-wishes li').count()) === 1, await adminStatus());
await snap(admin.page, 'admin-published');
admin.page.once('dialog', dialog => dialog.dismiss());
await admin.page.getByRole('button', { name: '撤回公開' }).click();
await admin.page.waitForTimeout(400);
note('Admin：取消確認就不會撤回', (await publicInStore()).length === 1);
await openWish(second.page);
const beforeWithdraw = await second.page.locator('#cloud-envelope-list button').allTextContents();
note('Wish：其他訪客看得到核准信，自己的私人信也在', beforeWithdraw.includes('小明') && beforeWithdraw.includes('自己的最新願望'), JSON.stringify(beforeWithdraw));
await snap(second.page, 'wish-approved-visible');
note('Wish：被拒絕的信不會公開給別人', !beforeWithdraw.includes('小美'));
const fresh = await open('訪客E', { reducedMotion: 'reduce' });
await openWish(fresh.page);
const freshLabels = async () => { await openWish(fresh.page); return (await fresh.page.locator('#cloud-envelope-list button').allTextContents()).sort(); };
note('Wish：新訪客只看到已核准的 1 封', JSON.stringify(await freshLabels()) === '["小明"]');
admin.page.once('dialog', dialog => dialog.accept());
await admin.page.getByRole('button', { name: '撤回公開' }).click();
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '目前沒有已公開願望。', null, { timeout: 15000 }).catch(() => {});
stored = await wishesInStore();
note('模擬器：撤回後公開副本刪除、原信保留並改為 rejected', (await publicInStore()).length === 0 && str(byName('小明'), 'status') === 'rejected' && str(byName('小明'), 'content') === '希望今年下雪');
note('Wish：撤回後訪客看不到那封信', (await freshLabels()).length === 0);
await openWish(first.page);
await first.page.locator('details:has(#cloud-envelope-list) summary').click();
await first.page.locator('#cloud-envelope-list button').first().click();
await first.page.waitForTimeout(300);
const ownerNotice = await first.page.locator('#wish-dialog-privacy').textContent();
note('Wish：本人仍看得到自己的信，並被告知未公開', ownerNotice.includes('未通過'), ownerNotice);
await first.page.keyboard.press('Escape');
await tab('已拒絕', '已讀取 3 封已拒絕願望。');
note('Admin：已拒絕分頁列出全部 3 封', (await admin.page.locator('#admin-wishes li').count()) === 3, await adminStatus());
await snap(admin.page, 'admin-rejected');
note('Admin：私人信不能重新同意', await item('小華').getByRole('button', { name: '重新同意' }).isDisabled());
await item('小美').getByRole('button', { name: '重新同意' }).click();
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '已讀取 2 封已拒絕願望。', null, { timeout: 15000 }).catch(() => {});
await item('小明').getByRole('button', { name: '重新同意' }).click();
await admin.page.waitForFunction(() => document.querySelector('#admin-status').textContent === '已讀取 1 封已拒絕願望。', null, { timeout: 15000 }).catch(() => {});
stored = await wishesInStore();
note('模擬器：重新同意後回到 approved 並進入隨機庫', (await publicInStore()).length === 2 && str(byName('小美'), 'status') === 'approved' && str(byName('小明'), 'status') === 'approved', `${(await publicInStore()).length} 封`);
note('Wish：重新同意的信回到樹上（撤回過也可以）', JSON.stringify(await freshLabels()) === '["小明","小美"]');
await tab('已公開', '已讀取 2 封已公開願望。');
await snap(admin.page, 'admin-republished');
await fresh.context.close();
await admin.page.click('#admin-signout'); await admin.page.waitForTimeout(400);
stored = await wishesInStore();

// 7. 權限規則：實際嘗試，並確認該通過的確實通過
const visitor = await account(), stranger = await account();
const plainToken = await signIn('someone@example.test', 'plain-pass-123'), adminToken = await signIn('moderator@example.test', 'admin-pass-123');
// 先授權再換發，token 才帶得到 admin claim。
// 分頁讀取用的查詢形狀也要受 limit 50 保護。
const anonymousSignUp = (await json(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x`, { method: 'POST', body: '{"returnSecureToken":true}' })).body;
await grantAdmin(anonymousSignUp.localId);
const anonymousAdminToken = (await json(`${AUTH}/securetoken.googleapis.com/v1/token?key=x`, { method: 'POST', body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: anonymousSignUp.refreshToken }) })).body.id_token;
const bearer = token => token ? { Authorization: `Bearer ${token}` } : {};
const value = v => typeof v === 'string' ? { stringValue: v } : typeof v === 'number' ? { doubleValue: v } : v;
const fieldsOf = data => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, value(v)]));
const NAME = `projects/${PROJECT}/databases/(default)/documents`;
const commit = (token, writes) => json(`${STORE}:commit`, { method: 'POST', headers: bearer(token), body: JSON.stringify({ writes }) });
const letter = (path, data, stamp = true) => ({ update: { name: `${NAME}/${path}`, fields: fieldsOf(data) }, ...(stamp ? { updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }] } : {}), currentDocument: { exists: false } });
const good = { nickname: '測試', content: '規則測試', visibility: 'public', status: 'pending' };
const expect = async (name, promise, allowed) => { const { status } = await promise; const passed = allowed ? status === 200 : status === 403; note(`規則：${name}`, passed, `HTTP ${status}`); };
const mine = `users/${visitor.uid}/wishes`;
await expect('本人匿名建立願望（應允許）', commit(visitor.token, [letter(`${mine}/w1`, good)]), true);
await expect('本人讀自己的信（應允許）', json(`${STORE}/${mine}/w1`, { headers: bearer(visitor.token) }), true);
await expect('未登入讀別人的信', json(`${STORE}/${mine}/w1`), false);
await expect('別的訪客讀別人的信', json(`${STORE}/${mine}/w1`, { headers: bearer(stranger.token) }), false);
await expect('別的訪客替人建立信', commit(stranger.token, [letter(`${mine}/w2`, good)]), false);
await expect('建立時自填 status=approved', commit(visitor.token, [letter(`${mine}/w3`, { ...good, status: 'approved' })]), false);
await expect('建立時多帶欄位', commit(visitor.token, [letter(`${mine}/w4`, { ...good, randomKey: .5 })]), false);
await expect('暱稱全空白', commit(visitor.token, [letter(`${mine}/w5`, { ...good, nickname: '   ' })]), false);
await expect('暱稱超過 20 字', commit(visitor.token, [letter(`${mine}/w6`, { ...good, nickname: '字'.repeat(21) })]), false);
await expect('內容超過 300 字', commit(visitor.token, [letter(`${mine}/w7`, { ...good, content: '字'.repeat(301) })]), false);
await expect('visibility 非法值', commit(visitor.token, [letter(`${mine}/w8`, { ...good, visibility: 'everyone' })]), false);
await expect('createdAt 用假時間', commit(visitor.token, [letter(`${mine}/w9`, { ...good, createdAt: { timestampValue: '2020-01-01T00:00:00Z' } }, false)]), false);
await expect('Email 帳號（非匿名）寄信', commit(plainToken, [letter(`users/${plainUser.uid}/wishes/w1`, good)]), false);
await expect('本人自己核准', commit(visitor.token, [{ update: { name: `${NAME}/${mine}/w1`, fields: fieldsOf({ status: 'approved' }) }, updateMask: { fieldPaths: ['status'] } }]), false);
await expect('本人刪除自己的信', commit(visitor.token, [{ delete: `${NAME}/${mine}/w1` }]), false);
await expect('管理員也不能刪信', commit(adminToken, [{ delete: `${NAME}/${mine}/w1` }]), false);
await expect('訪客直接寫 publicWishes', commit(visitor.token, [{ update: { name: `${NAME}/publicWishes/fake`, fields: fieldsOf({ ownerUid: visitor.uid, nickname: 'x', content: 'y', randomKey: .5 }) } }]), false);
const groupQuery = limit => ({ structuredQuery: { from: [{ collectionId: 'wishes', allDescendants: true }], ...(limit ? { limit } : {}) } });
await expect('訪客用 collection group 讀全部信', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(visitor.token), body: JSON.stringify(groupQuery(10)) }), false);
await expect('Email 非管理員讀全部信', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(plainToken), body: JSON.stringify(groupQuery(10)) }), false);
await expect('管理員讀全部信，limit 50（應允許）', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(adminToken), body: JSON.stringify(groupQuery(50)) }), true);
await expect('管理員查詢無 limit', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(adminToken), body: JSON.stringify(groupQuery(0)) }), false);
await expect('管理員查詢 limit 51', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(adminToken), body: JSON.stringify(groupQuery(51)) }), false);
const publicQuery = limit => ({ structuredQuery: { from: [{ collectionId: 'publicWishes' }], ...(limit ? { limit } : {}) } });
await expect('訪客讀公開信 limit 30（應允許）', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(visitor.token), body: JSON.stringify(publicQuery(30)) }), true);
await expect('訪客讀公開信無 limit', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(visitor.token), body: JSON.stringify(publicQuery(0)) }), false);
await expect('未登入讀公開信', json(`${STORE}:runQuery`, { method: 'POST', body: JSON.stringify(publicQuery(30)) }), false);
await expect('未授權路徑寫入', commit(visitor.token, [{ update: { name: `${NAME}/secrets/x`, fields: fieldsOf({ a: 'b' }) } }]), false);
const review = (path, status, reviewer) => ({ update: { name: `${NAME}/${path}`, fields: fieldsOf({ status, reviewedBy: reviewer }) }, updateMask: { fieldPaths: ['status', 'reviewedBy'] }, updateTransforms: [{ fieldPath: 'reviewedAt', setToServerValue: 'REQUEST_TIME' }] });
await expect('管理員核准但沒有同步建立公開副本', commit(adminToken, [review(`${mine}/w1`, 'approved', adminUser.uid)]), false);
await expect('管理員冒用別人的 reviewedBy', commit(adminToken, [review(`${mine}/w1`, 'rejected', 'someone-else')]), false);
await expect('管理員假造不對應原件的公開信', commit(adminToken, [{ update: { name: `${NAME}/publicWishes/forged`, fields: fieldsOf({ ownerUid: visitor.uid, nickname: 'x', content: 'y', createdAt: { timestampValue: '2026-01-01T00:00:00Z' }, randomKey: .5 }) }, updateTransforms: [{ fieldPath: 'publishedAt', setToServerValue: 'REQUEST_TIME' }] }]), false);
await expect('匿名帳號即使有 admin claim 也不算管理員', json(`${STORE}:runQuery`, { method: 'POST', headers: bearer(anonymousAdminToken), body: JSON.stringify(groupQuery(10)) }), false);
note('上一項的 token 確實帶 admin claim（測試本身有效）', JSON.parse(Buffer.from(anonymousAdminToken.split('.')[1], 'base64url')).admin === true);

// 8. 其他頁面不該碰 Firebase
const other = await open('其他頁', { reducedMotion: 'reduce' });
for (const name of ['index.html', 'intro.html', 'game.html']) {
  const calls = []; const listen = request => { if (/127\.0\.0\.1:(9099|8080)/.test(request.url())) calls.push(request.url()); };
  other.page.on('request', listen);
  await other.page.goto(`${BASE}/${name}`, { waitUntil: 'load' }); await other.page.waitForTimeout(1500);
  other.page.off('request', listen);
  note(`${name}：不連 Firebase`, calls.length === 0, `${calls.length} 個請求`);
}

note('沒有任何請求送往正式 Firebase', blocked.length === 0, `${blocked.length} 個被攔下`);
await browser.close();
const failed = report.filter(item => !item.ok);
await fs.writeFile(`${OUT}/report.json`, JSON.stringify({ report, blocked, consoleErrors }, null, 2));
console.log(`\n${report.length - failed.length}/${report.length} passed`);
console.log('console errors', consoleErrors.length); for (const line of [...new Set(consoleErrors)].slice(0, 20)) console.log('  ', line);
console.log('blocked', [...new Set(blocked)].slice(0, 10));
