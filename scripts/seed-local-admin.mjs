// 在本機模擬器建立測試管理員。模擬器關閉後帳號就消失，每次開模擬器都要重跑。
// 先啟動：npx firebase emulators:start --only auth,firestore --project demo-holy-merry
// 執行：npm run admin:local
const AUTH = 'http://127.0.0.1:9099', PROJECT = 'demo-holy-merry', OWNER = { 'Content-Type': 'application/json', Authorization: 'Bearer owner' };
const email = 'admin@local.test', password = 'holy-merry-local';
const call = (path, body) => fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/${path}`, { method: 'POST', headers: OWNER, body: JSON.stringify(body) }).then(response => response.json());
try { await fetch(AUTH); } catch { console.error('模擬器沒有開，請先執行 npx firebase emulators:start --only auth,firestore --project demo-holy-merry'); process.exit(1); }
let account = await call('accounts:signUp?key=local', { email, password, returnSecureToken: true });
if (account.error) account = await call('accounts:signInWithPassword?key=local', { email, password, returnSecureToken: true });
if (!account.localId) { console.error('建立帳號失敗', account.error?.message); process.exit(1); }
await call(`projects/${PROJECT}/accounts:update`, { localId: account.localId, customAttributes: '{"admin":true}' });
console.log(`本機管理員已就緒（只存在模擬器）\nEmail：${email}\n密碼：${password}`);
