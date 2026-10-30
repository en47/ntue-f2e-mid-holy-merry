// 不需要套件；選用測試：node --experimental-vm-modules tests/smoke.mjs
// 以可控制的 DOM / 時間替身驗證狀態轉換，不取代真實瀏覽器視覺檢查。
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!vm.SourceTextModule) throw new Error('請使用 node --experimental-vm-modules tests/smoke.mjs');
// 本機引用檢查前先去掉 ?v= 快取破壞參數與 #fragment；外部協定、protocol-relative 與純片段一律跳過。
const localRef = value => {
  const file = value.split(/[?#]/)[0];
  return !file || /^(?:[a-z][a-z0-9+.-]*:|\/\/|%23)/i.test(file) ? null : file;
};

class Element {
  constructor() {
    this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {};
    this.disabled = false; this.hidden = false; this.textContent = ''; this.style = {};
    const classes = this.classes = new Set();
    this.classList = { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: name => classes.has(name) };
  }
  set className(value) { this.classes.clear(); value.split(' ').filter(Boolean).forEach(n => this.classList.add(n)); }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  removeEventListener(type, callback) { this.listeners[type] = (this.listeners[type] ?? []).filter(cb => cb !== callback); }
  dispatchEvent(event) { (this.events ??= []).push(event); this.dispatch(event.type, event); }
  dispatch(type, event = {}) { if (type === 'click' && this.disabled) return; for (const cb of this.listeners[type] ?? []) cb({ preventDefault() {}, ...event }); }
  click() { this.dispatch('click'); }
  focus() { this.focused = true; }
  remove() { this.removed = true; }
  contains(target) { return target === this || this.children.includes(target); }
  querySelector(selector) {
    if (selector === 'button') return this.children[0];
    if (selector === '.card') return this.children.find(c => c.classList.contains('card'));
    if (selector.startsWith('.match-card')) return this.children.find(c => !c.classList.contains('is-matched') && !c.classList.contains('is-flipped'));
    return null;
  }
  setPointerCapture() {}
}
export function environment(overrides = {}) {
  let next = 0;
  const intervals = new Map(), timeouts = new Map(), frames = new Map();
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  const document = new Element(); document.querySelector = element; document.createElement = () => new Element();
  element('.storybook').querySelector = element;
  const window = new Element(); window.matchMedia = () => Object.assign(new Element(), {matches:false});
  const sandbox = {
    document, window, console, Intl, Date, Math, URL, TextDecoder, TextEncoder, ArrayBuffer, AbortController,
    CustomEvent: class { constructor(type, options) { this.type = type; Object.assign(this, options); } },
    setInterval: callback => { const id = ++next; intervals.set(id, callback); return id; }, clearInterval: id => intervals.delete(id),
    setTimeout: (callback, delay) => { const id = ++next; callback.delay = delay; timeouts.set(id, callback); return id; }, clearTimeout: id => timeouts.delete(id),
    performance: { now: () => 0 },
    requestAnimationFrame: callback => { const id = ++next; frames.set(id, callback); return id; }, cancelAnimationFrame: id => frames.delete(id),
  };
  const context = vm.createContext(sandbox);
  const modules = new Map();
  async function load(relative) {
    const filename = path.isAbsolute(relative) ? relative : path.join(project, relative);
    if (modules.has(filename)) return modules.get(filename);
    if (overrides[filename]) {
      const exports = overrides[filename];
      const mod = new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
      modules.set(filename, mod); await mod.link(() => {}); return mod;
    }
    const mod = new vm.SourceTextModule(await fs.readFile(filename, 'utf8'), { context, identifier: filename, initializeImportMeta: meta => { meta.url = pathToFileURL(filename).href; } });
    modules.set(filename, mod);
    await mod.link(specifier => load(specifier === 'three' ? path.join(project, 'vendor/three/build/three.module.js') : path.resolve(path.dirname(filename), specifier)));
    return mod;
  }
  async function evaluate(relative) { const mod = await load(relative); await mod.evaluate(); return mod.namespace; }
  return { sandbox, element, document, window, intervals, timeouts, frames, evaluate };
}
const results = [];
async function test(name, run) { await run(); results.push(name); console.log(`PASS ${name}`); }

await test('全部模組語法、HTML 本機資源及四頁導覽', async () => {
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const filename = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(filename);
      else if (filename.endsWith('.js')) new vm.SourceTextModule(await fs.readFile(filename, 'utf8'));
    }
  }
  await walk(path.join(project, 'js'));
  for (const page of ['index.html', 'intro.html', 'game.html', 'wish.html']) {
    const html = await fs.readFile(path.join(project, page), 'utf8');
    for (const target of ['index.html', 'intro.html', 'game.html', 'wish.html']) assert.ok(html.includes(`href="${target}"`));
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const file = localRef(match[1]);
      if (file) await fs.access(path.resolve(project, file));
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
  }
});
await test('倒數：跨日、台灣時區、聖誕日與下一年度', async () => {
  const env = environment();
  const { getChristmasCountdown: countdown } = await env.evaluate('js/home.js');
  const before = countdown(new Date('2026-12-24T23:59:59+08:00'));
  assert.equal(before.seconds, 1); assert.equal(before.days, 0); assert.equal(before.isChristmas, false);
  const midnight = countdown(new Date('2026-12-24T16:00:00Z'));
  assert.equal(midnight.isChristmas, true); assert.equal(midnight.seconds, 0);
  assert.equal(countdown(new Date('2026-12-25T23:59:59+08:00')).isChristmas, true);
  assert.equal(countdown(new Date('2026-12-26T00:00:00+08:00')).year, 2027);
  env.window.dispatch('pagehide'); assert.equal(env.intervals.size, 0);
  env.window.dispatch('pageshow', { persisted: true }); assert.equal(env.intervals.size, 1);
  const santa = env.element('#santa-dialogue'); const old = santa.textContent;
  env.element('.storybook').dispatch('character:speak',{detail:{character:'santa'}}); assert.notEqual(santa.textContent, old);
});
await test('願望：持久儲存、損壞資料、額滿與權限失敗', async () => {
  const env = environment(); let raw = null, blocked = false;
  env.sandbox.localStorage = { getItem: () => raw, setItem: (_key, value) => { if (blocked) throw new Error('QuotaExceededError'); raw = value; } };
  const storage = await env.evaluate('js/services/wish-storage.js');
  assert.equal(storage.readWishes().length, 0);
  const wish = { id: 'test', nickname: '測試', content: '<script>alert(1)</script>', createdAt: '2026-10-28T06:00:00Z' };
  storage.saveWishes([wish]); assert.equal(storage.readWishes()[0].content, wish.content);
  const saved = raw; blocked = true; assert.throws(() => storage.saveWishes([])); assert.equal(raw, saved);
  blocked = false; raw = '{broken'; assert.throws(() => storage.readWishes());
  raw = JSON.stringify({version:1,wishes:[{...wish,content:12}]}); assert.throws(() => storage.readWishes());
  assert.throws(() => storage.saveWishes(Array(61).fill(wish)));
});
await test('舊單關原型（保留檔）：開始、鎖定、重玩及完成', async () => {
  const env = environment();
  const root = new Element(); root.querySelector = env.element;
  const { initMatchingGame } = await env.evaluate('js/games/matching.js'); initMatchingGame(root);
  const board = env.element('#matching-board');
  assert.equal(board.children.length, 12); assert.ok(board.children.every(c => c.disabled));
  env.element('#match-start').dispatch('click'); assert.equal(root.dataset.state, 'playing');
  const first = board.children[0], other = board.children.find(c => c.dataset.gift !== first.dataset.gift);
  first.dispatch('click'); first.dispatch('click'); assert.equal(env.element('#flip-count').textContent, '1');
  other.dispatch('click'); assert.equal(env.timeouts.size, 1);
  board.children.find(c => c !== first && c !== other).dispatch('click'); assert.equal(env.element('#flip-count').textContent, '2');
  env.element('#match-restart').dispatch('click'); assert.equal(env.timeouts.size, 0); assert.equal(env.intervals.size, 0);
  assert.equal(env.element('#flip-count').textContent, '0');
  const grouped = new Map();
  board.children.forEach(card => { const group = grouped.get(card.dataset.gift) ?? []; group.push(card); grouped.set(card.dataset.gift, group); });
  for (const cards of grouped.values()) { cards[0].dispatch('click'); cards[1].dispatch('click'); }
  assert.equal(env.element('#match-count').textContent, '6'); assert.equal(env.element('#flip-count').textContent, '12');
  assert.equal(root.dataset.state, 'complete'); assert.equal(env.intervals.size, 0); assert.ok(board.children.every(c => c.disabled));
  assert.match(env.element('#match-status').textContent, /全部配對成功/);
  env.window.dispatch('pagehide'); env.window.dispatch('pageshow', {persisted:true}); assert.equal(root.dataset.state, 'ready');
});
await test('雪橇：鍵盤移動、暫停恢復、碰撞、重玩與焦點離開', async () => {
  const env = environment(), root = new Element(); root.querySelector = env.element;
  const canvas = env.element('#sleigh-canvas'); canvas.width = 1000; canvas.height = 360;
  const context = { clearRect(){}, fillRect(x,y,w,h){ if (w===110 && h===44) this.playerY=y; }, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fillText(){} };
  canvas.getContext = () => context;
  const { initSleighGame } = await env.evaluate('js/games/sleigh.js'); initSleighGame(root);
  let time = 0;
  function frames(count) { for (let i=0; i<count; i++) { time+=20; const callbacks=[...env.frames.values()]; env.frames.clear(); callbacks.forEach(cb=>cb(time)); } }
  assert.equal(root.dataset.state,'ready'); env.element('#sleigh-start').dispatch('click'); assert.equal(root.dataset.state,'playing');
  root.dispatch('keydown',{key:'ArrowUp'}); frames(15); assert.ok(context.playerY < 158);
  env.document.dispatch('keyup',{key:'ArrowUp'});
  root.dispatch('keydown',{key:'Escape'}); assert.equal(root.dataset.state,'paused'); assert.equal(env.frames.size,0);
  env.element('#sleigh-start').dispatch('click'); assert.equal(root.dataset.state,'playing');
  env.element('#sleigh-restart').dispatch('click'); assert.equal(env.element('#sleigh-score').textContent,'0');
  root.dispatch('focusout',{relatedTarget:null}); assert.equal(root.dataset.state,'paused');
  env.element('#sleigh-start').dispatch('click');
  // 固定中心路徑生成障礙，驗證實際碰撞終止。
  const oldRandom = Math.random; Math.random=()=>.5;
  try { for (let i=0; i<1000 && root.dataset.state==='playing'; i++) frames(1); } finally { Math.random=oldRandom; }
  assert.equal(root.dataset.state,'over'); assert.equal(env.frames.size,0); assert.match(env.element('#sleigh-status').textContent,/碰到障礙物/);
  env.element('#sleigh-start').dispatch('click'); assert.equal(root.dataset.state,'playing');
  env.window.dispatch('pagehide'); assert.equal(root.dataset.state,'paused'); assert.equal(env.frames.size,0);
});
await test('game2：原始副本雜湊、22 張圖片與正式載入入口', async () => {
  const source = JSON.parse(await fs.readFile(path.join(project, 'docs/GAME2-UPSTREAM.json'), 'utf8'));
  assert.equal(source.files.length, 26);
  assert.equal(source.files.filter(f => f.path.startsWith('images/')).length, 22);
  for (const file of source.files) {
    const data = await fs.readFile(path.join(project, source.pristineDirectory, file.path));
    assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256, file.path);
  }
  const host = await fs.readFile(path.join(project, 'game.html'), 'utf8');
  assert.match(host, /<iframe[^>]+src="games\/christmas-matching\.html"/);
  assert.ok(!host.includes('matching-start-shortcut'));
  const script = await fs.readFile(path.join(project, 'js/game.js'), 'utf8');
  assert.ok(!script.includes('initChristmasMatchingGame')); 
  const css = await fs.readFile(path.join(project, 'css/game2-matching.css'), 'utf8');
  for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    const file = localRef(match[1]);
    if (file) await fs.access(path.resolve(project, 'css', file));
  }
});

async function game2Environment() {
  const env = environment();
  const root = new Element(); root.querySelector = env.element;
  root.parentElement = new Element(); root.parentElement.querySelector = env.element;
  const { initChristmasMatchingGame, levelConfig } = await env.evaluate('js/games/game2-matching.js');
  const game = initChristmasMatchingGame(root);
  function flush(delay) {
    for (const [id, callback] of [...env.timeouts]) {
      if (callback.delay === delay) { env.timeouts.delete(id); callback(); }
    }
  }
  function solve() {
    const groups = new Map();
    env.element('#card-grid').children.forEach(card => {
      const group = groups.get(card.dataset.id) ?? []; group.push(card); groups.set(card.dataset.id, group);
    });
    for (const cards of groups.values()) { cards[0].dispatch('click'); cards[1].dispatch('click'); }
  }
  return { ...env, root, game, levelConfig, flush, solve, initChristmasMatchingGame };
}

await test('game2：五關牌數、秒數、雙卡翻牌計數、錯配鎖定與通關', async () => {
  const env = await game2Environment();
  assert.equal(env.root.dataset.state, 'ready');
  env.element('#start-btn').dispatch('click');
  const expected = [[4,25],[6,40],[8,55],[10,70],[12,85]];
  for (let index = 0; index < expected.length; index++) {
    const [pairs, seconds] = expected[index];
    assert.equal(env.game.getState().level, index + 1);
    assert.equal(env.game.getState().remainingTime, seconds);
    const board = env.element('#card-grid');
    assert.equal(board.children.length, pairs * 2);
    const first = board.children[0], other = board.children.find(c => c.dataset.id !== first.dataset.id);
    first.dispatch('click'); first.dispatch('click'); assert.equal(env.game.getState().flipCount, 0);
    other.dispatch('click'); assert.equal(env.game.getState().flipCount, 1);
    const third = board.children.find(c => c !== first && c !== other);
    third.dispatch('click'); assert.equal(third.classList.contains('flipped'), false);
    assert.ok([...env.timeouts.values()].some(callback => callback.delay === 700));
    env.flush(700); assert.ok(!first.classList.contains('flipped'));
    env.solve();
    assert.equal(env.game.getState().pairs, pairs);
    assert.equal(env.game.getState().flipCount, pairs + 1);
    assert.equal(env.intervals.size, 0);
    assert.equal(env.root.dataset.state, 'level-completing');
    env.flush(500);
    assert.equal(env.root.dataset.state, index === 4 ? 'complete' : 'level-complete');
    assert.ok(env.element('#modal-banner').src.endsWith(index === 4 ? '/win.PNG' : '/next.PNG'));
    if (index < 4) env.element('#modal-btn').dispatch('click');
  }
  assert.equal(env.root.events.filter(e => e.type === 'matching:complete').length, 1);
  env.element('#modal-btn').dispatch('click'); assert.equal(env.game.getState().level, 1);
  env.game.destroy(); assert.equal(env.intervals.size, 0); assert.equal(env.timeouts.size, 0);
});

await test('game2：逾時重玩當關、Restart 回第一關與延遲回呼清理', async () => {
  const env = await game2Environment();
  env.element('#start-btn').dispatch('click'); env.solve(); env.flush(500); env.element('#modal-btn').dispatch('click');
  assert.equal(env.game.getState().level, 2);
  for (let i = 0; i < 40; i++) [...env.intervals.values()].forEach(callback => callback());
  assert.equal(env.root.dataset.state, 'timeout'); assert.equal(env.game.getState().remainingTime, 0);
  assert.ok(env.element('#modal-banner').src.endsWith('/timeout.PNG'));
  env.element('#modal-btn').dispatch('click'); assert.equal(env.game.getState().level, 2); assert.equal(env.game.getState().remainingTime, 40);
  env.element('#restart-btn').dispatch('click'); assert.equal(env.game.getState().level, 1); assert.equal(env.game.getState().remainingTime, 25);
  const board = env.element('#card-grid'); const first = board.children[0];
  first.dispatch('click'); board.children.find(c => c.dataset.id !== first.dataset.id).dispatch('click');
  const staleMismatch = [...env.timeouts.values()][0];
  env.element('#restart-btn').dispatch('click'); assert.equal(env.timeouts.size, 0);
  const fresh = board.children[0]; fresh.dispatch('click'); staleMismatch();
  assert.equal(fresh.classList.contains('flipped'), true);
  board.children.find(c => c !== fresh && c.dataset.id === fresh.dataset.id).dispatch('click');
  assert.equal(env.game.getState().pairs, 1);
  env.element('#restart-btn').dispatch('click'); env.solve();
  const staleWin = [...env.timeouts.values()][0];
  env.element('#restart-btn').dispatch('click'); staleWin();
  assert.equal(env.root.dataset.state, 'playing'); assert.ok(env.element('#modal-overlay').classList.contains('hidden'));
  env.game.destroy();
  assert.equal(env.element('#start-btn').listeners.click.length, 0);
  const restored = env.initChristmasMatchingGame(env.root);
  assert.equal(env.root.dataset.state, 'ready'); assert.equal(env.element('#start-btn').listeners.click.length, 1);
  restored.destroy();
});
await test('兩份 GLB、七張原畫完整性、內嵌材質與 Three.js 依賴', async () => {
  for (const [name, clip] of [['santa-new', 'dance_02'], ['santa-dance', 'dance_02'], ['reindeer', 'preset:quadruped:walk']]) {
    const metadata = JSON.parse(await fs.readFile(path.join(project, `assets/models/${name}.json`), 'utf8'));
    const glb = await fs.readFile(path.join(project, `assets/models/${name}.glb`));
    assert.equal(createHash('sha256').update(glb).digest('hex'), metadata.sha256);
    assert.equal(glb.toString('ascii', 0, 4), 'glTF'); assert.equal(glb.readUInt32LE(4), 2); assert.equal(glb.readUInt32LE(8), glb.length);
    const data = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim());
    assert.ok(data.animations.some(animation => animation.name === clip));
    assert.ok(data.images.every(image => typeof image.bufferView === 'number' && !image.uri));
    assert.ok(data.buffers.every(buffer => !buffer.uri));
  }
  const upstream = JSON.parse(await fs.readFile(path.join(project, 'vendor/three/UPSTREAM.json'), 'utf8'));
  for (const [file, hash] of Object.entries(upstream.files)) assert.equal(createHash('sha256').update(await fs.readFile(path.join(project, 'vendor/three', file))).digest('hex'), hash);
  const html = await fs.readFile(path.join(project, 'index.html'), 'utf8');
  assert.ok(html.includes('"three":"./vendor/three/build/three.module.js"'));
  assert.ok(!html.includes('<model-viewer')); assert.ok(!html.includes('CHARACTER PLACEHOLDER'));
  const source = await fs.readFile(path.join(project, 'js/components/characters-scene.js'), 'utf8');
  assert.equal((source.match(/new THREE.WebGLRenderer/g) ?? []).length, 1);
  assert.ok(source.includes('assets/models/santa-new.glb')); assert.ok(!source.includes('assets/models/santa-claus.glb')); assert.ok(!source.includes('assets/models/santa-dance.glb'));
  const art = JSON.parse(await fs.readFile(path.join(project,'docs/STORYBOOK-ASSETS.json'),'utf8'));
  assert.equal(Object.keys(art.artwork).length,7);
  for (const asset of Object.values(art.artwork)) assert.equal(createHash('sha256').update(await fs.readFile(path.join(project,asset.path))).digest('hex'),asset.sha256);
});
await test('旋轉、觸控捲動、回正、動畫選擇與全角度視野', async () => {
  const env = environment(); const motion = await env.evaluate('js/components/character-motion.js');
  assert.equal(motion.chooseAnimation([{name:'walk'}, {name:'idle'}]).name, 'idle');
  assert.equal(motion.chooseAnimation([{name:'preset:quadruped:walk'}]).name, 'preset:quadruped:walk');
  assert.equal(motion.chooseAnimation([]), null);
  assert.equal(motion.gestureIntent(2,3,'touch'), 'pending');
  assert.equal(motion.gestureIntent(2,40,'touch'), 'scroll');
  assert.equal(motion.gestureIntent(40,2,'touch'), 'rotate');
  assert.equal(motion.gestureIntent(2,40,'mouse'), 'rotate');
  assert.ok(Math.abs(motion.wrapAngle(Math.PI*7) - Math.PI) < 1e-10);
  assert.equal(motion.returnAngle(2, .1, true), 0);
  let angle = 2; for (let i = 0; i < 240; i++) angle = motion.returnAngle(angle, 1/60);
  assert.equal(angle, 0);
  for (const aspect of [.6, 1, 1.1, 1.5]) {
    const h = motion.fitViewHeight(2.15, 1.4, aspect);
    assert.ok(2*1.4 <= h*aspect*.88 + 1e-10);
    assert.ok(2.15*Math.cos(.075)+2*1.4*Math.sin(.075) <= h*.79 + 1e-10);
  }
});
await test('真實 GLB 骨架解析及完整動畫姿勢包絡（貼圖解碼以替身隔離）', async () => {
  const env = environment(); env.sandbox.setTimeout = setTimeout;
  const THREE = await env.evaluate('vendor/three/build/three.module.js');
  const { GLTFLoader } = await env.evaluate('vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const { animationBounds, disposeModel } = await env.evaluate('js/components/characters-scene.js');
  const loader = new GLTFLoader();
  loader.register(() => ({name:'TEST_TEXTURES', loadTexture: () => Promise.resolve(new THREE.Texture())}));
  for (const [name, clipName] of [['santa-dance', 'dance_02'], ['reindeer', 'preset:quadruped:walk']]) {
    const data = await fs.readFile(path.join(project, `assets/models/${name}.glb`));
    env.sandbox.ArrayBuffer = data.buffer.constructor;
    const gltf = await loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset+data.byteLength), '');
    assert.equal(gltf.animations[0].name, clipName);
    const mixer = new THREE.AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations[0]).setLoop(THREE.LoopRepeat, Infinity).play();
    const bounds = await animationBounds(gltf.scene, mixer, gltf.animations[0]);
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok([size.x, size.y, size.z].every(n => Number.isFinite(n) && n > .1 && n < 3));
    mixer.update(.5);
    assert.ok(mixer.time > 0);
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene); disposeModel(gltf.scene);
  }
});

await test('舊 Santa 元件（保留檔）操作：載入／錯誤／重試、待機播放、減少動態、輕點與拖曳分離', async () => {
  const env = environment(); const root = new Element(); root.querySelector = env.element;
  const viewer = env.element('#santa-model'); viewer.setAttribute('src', 'assets/models/santa-claus.glb');
  viewer.availableAnimations = ['idle']; viewer.paused = true;
  viewer.pause = () => { viewer.paused = true; }; viewer.play = () => { viewer.paused = false; }; viewer.jumpCameraToGoal = () => { viewer.reset = true; };
  const motion = new Element(); motion.matches = false; env.window.matchMedia = () => motion;
  env.document.baseURI = 'http://localhost:5500/index.html';
  env.element('#santa-model-progress').querySelector = () => env.element('#progress-fill');
  env.element('.model-poster').querySelector = () => env.element('.model-poster strong');
  let talkCount = 0; env.element('#santa-character').addEventListener('click', () => talkCount++);
  const { mountCharacterModel } = await env.evaluate('js/components/character-model.js');
  const component = mountCharacterModel(root, { loadViewer: async () => {} });
  await Promise.resolve();
  viewer.dispatch('load'); assert.equal(env.element('[data-model-slot="santa"]').dataset.state, 'ready');
  assert.equal(env.element('#santa-animation').disabled, false); assert.equal(viewer.paused, true);
  viewer.dispatch('progress', { detail: { totalProgress: .5 } }); assert.equal(env.element('#progress-fill').style.width, '50%');
  env.element('#santa-animation').click(); assert.equal(viewer.paused, false);
  motion.matches = true; motion.dispatch('change'); assert.equal(viewer.paused, true); assert.equal(viewer.interpolationDecay, 0);
  env.element('#santa-reset').click(); assert.equal(viewer.reset, true);
  const pointer = {button:0,isPrimary:true,pointerId:1,clientX:10,clientY:10};
  viewer.dispatch('pointerdown', pointer); viewer.dispatch('pointerup', pointer); assert.equal(talkCount, 1);
  viewer.dispatch('pointerdown', pointer); viewer.dispatch('pointermove', {...pointer,clientX:80}); viewer.dispatch('pointerup', pointer); assert.equal(talkCount, 1);
  env.document.hidden = true; viewer.paused = false; env.document.dispatch('visibilitychange'); assert.equal(viewer.paused, true);
  viewer.dispatch('error'); assert.equal(env.element('[data-model-slot="santa"]').dataset.state, 'error'); assert.equal(env.element('#santa-model-download').hidden, false);
  env.element('#santa-model-retry').click(); await Promise.resolve(); assert.match(viewer.src, /retry=1/);
  viewer.dispatch('load'); assert.equal(env.element('[data-model-slot="santa"]').dataset.state, 'ready');
  component.destroy(); assert.equal(viewer.listeners.load.length, 0);
  mountCharacterModel(root, { loadViewer: async () => { throw new Error('Module unavailable'); } });
  await new Promise(resolve => setImmediate(resolve)); assert.equal(env.element('[data-model-slot="santa"]').dataset.state, 'error');
});
await test('雙角色目前控制器：單 Renderer、拖曳／捲動分流、動畫暫停、回正及釋放', async () => {
  const real = environment(); const THREE = await real.evaluate('vendor/three/build/three.module.js');
  const renderers = [], disposed = {geometry:0, material:0};
  class Renderer {
    constructor() { renderers.push(this); this.domElement = new Element(); this.shadowMap = {}; this.renders = []; }
    setClearColor() {} setPixelRatio(n) { this.dpr = n; } getPixelRatio() { return this.dpr; }
    setSize() {} setScissorTest() {} clear() {} setViewport() {} setScissor() {}
    render(scene) { this.renders.push(scene); } dispose() { this.disposed = true; } forceContextLoss() { this.lost = true; }
  }
  class PMREM { fromScene() { return {texture:new THREE.Texture(), dispose() {}}; } dispose() {} }
  let santaLoads = 0;
  class Loader {
    setMeshoptDecoder() { return this; }
    async loadAsync(src) {
      const scene = new THREE.Group();
      const geometry = new THREE.BoxGeometry(.5,1,.5), material = new THREE.MeshStandardMaterial();
      geometry.addEventListener('dispose', () => disposed.geometry++); material.addEventListener('dispose', () => disposed.material++);
      scene.add(new THREE.Mesh(geometry, material));
      const shortSanta = !src.includes('reindeer') && ++santaLoads === 1;
      const clip = new THREE.AnimationClip(src.includes('reindeer') ? 'walk' : 'dance_02', shortSanta ? .5 : 5, [new THREE.NumberKeyframeTrack('.rotation[y]', [0,5], [0,.1])]);
      return {scene, animations:[clip]};
    }
  }
  const env = environment({
    [path.join(project, 'vendor/three/build/three.module.js')]: {...THREE, WebGLRenderer:Renderer, PMREMGenerator:PMREM},
    [path.join(project, 'vendor/three/examples/jsm/loaders/GLTFLoader.js')]: {GLTFLoader:Loader},
    [path.join(project, 'vendor/three/examples/jsm/libs/meshopt_decoder.module.js')]: {MeshoptDecoder:{}},
  });
  let now = 0; env.sandbox.performance.now = () => now;
  env.sandbox.setTimeout = callback => { queueMicrotask(callback); return 0; };
  Object.assign(env.window, {innerWidth:1200, innerHeight:900, devicePixelRatio:2});
  const motion = new Element(); motion.matches = false; env.window.matchMedia = () => motion;
  const root = new Element(); root.prepend = child => root.children.unshift(child);
  root.getBoundingClientRect = () => ({left:0, top:0, width:1200,height:900});
  const cards = ['santa','reindeer'].map((id, i) => {
    const card = new Element(), nodes = new Map();
    card.querySelector = selector => { if (!nodes.has(selector)) nodes.set(selector, new Element()); return nodes.get(selector); };
    const slot = card.querySelector('[data-model-slot]'); slot.clientWidth = 400;
    slot.getBoundingClientRect = () => ({left:i*500, right:i*500+400, top:100,bottom:500,width:400,height:400});
    let captured = false; slot.hasPointerCapture = () => captured; slot.setPointerCapture = () => {captured=true;}; slot.releasePointerCapture = () => {captured=false;};
    return card;
  });
  root.querySelector = selector => cards[selector === '#santa-card' ? 0 : 1];
  const {mountCharacters} = await env.evaluate('js/components/characters-scene.js');
  const controller = mountCharacters(root); assert.equal(mountCharacters(root), controller);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(renderers.length, 1); assert.equal(root.children.length, 1);
  assert.equal(cards[0].querySelector('[data-model-slot]').dataset.state,'error');
  assert.equal(cards[0].querySelector('.model-fallback').hidden,true);
  assert.match(cards[0].querySelector('.model-status').textContent,/缺少涵蓋第 1–4 秒/);
  assert.equal(cards[1].querySelector('[data-model-slot]').dataset.state,'ready');
  cards[0].querySelector('[data-model-action="retry"]').click();
  assert.equal(cards[0].querySelector('[role="progressbar"]').value,0);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(renderers.length,1); assert.equal(santaLoads,2);
  for (const card of cards) assert.equal(card.querySelector('[data-model-slot]').dataset.state, 'ready');
  function frame(delta = 17) { now += delta; const callbacks = [...env.frames.values()]; env.frames.clear(); callbacks.forEach(cb => cb(now)); }
  frame(); assert.equal(renderers[0].renders.length, 2); assert.equal(renderers[0].dpr, 1.5);
  const slot = cards[0].querySelector('[data-model-slot]'); let talks = 0;
  slot.addEventListener('character:speak', () => talks++);
  const pointer = {button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:100,clientY:100,cancelable:true};
  slot.dispatch('pointerdown',pointer); slot.dispatch('pointermove',{...pointer,clientY:160}); slot.dispatch('pointerup',pointer);
  assert.equal(talks,0); assert.equal(slot.hasPointerCapture(),false);
  slot.dispatch('pointerdown',pointer); slot.dispatch('pointerup',pointer); slot.dispatch('click',{detail:1}); assert.equal(talks,1);
  slot.dispatch('keydown',{key:'Enter',repeat:false}); slot.dispatch('click',{detail:0}); assert.equal(talks,2);
  slot.dispatch('keydown',{key:'Enter',repeat:true}); assert.equal(talks,2);
  slot.dispatch('pointerdown',pointer); slot.dispatch('pointermove',{...pointer,clientX:300}); frame();
  const scene = renderers[0].renders.at(-2); const turn = scene.children.find(node => node.isGroup);
  assert.ok(Math.abs(turn.rotation.y) > 2); assert.equal(slot.hasPointerCapture(),true);
  slot.dispatch('pointerup',pointer); slot.dispatch('click',{detail:1}); assert.equal(talks,2); for (let i=0;i<240;i++) frame(); assert.equal(turn.rotation.y,0);
  slot.dispatch('keydown',{key:'p',repeat:false}); assert.equal(slot.dataset.animation,'paused');
  slot.dispatch('keydown',{key:'p',code:'KeyP',metaKey:true,repeat:false}); assert.equal(slot.dataset.animation,'paused');
  slot.dispatch('keydown',{key:'ㄣ',code:'KeyP',repeat:false}); assert.equal(slot.dataset.animation,'playing');
  slot.dispatch('keydown',{key:'p',repeat:false}); assert.equal(slot.dataset.animation,'paused');
  assert.equal(cards[1].querySelector('[data-model-slot]').dataset.animation,'playing');
  motion.matches = true; motion.dispatch('change'); assert.equal(cards[1].querySelector('[data-model-slot]').dataset.animation,'paused');
  env.document.hidden = true; env.document.dispatch('visibilitychange'); assert.equal(env.frames.size,0);
  controller.destroy(); controller.destroy();
  assert.equal(renderers[0].disposed,true); assert.equal(renderers[0].lost,true);
  assert.equal(disposed.geometry,3); assert.equal(disposed.material,3); assert.equal(slot.listeners.pointerdown.length,0);
});
await test('首頁 3D 初始化失敗：可見錯誤／重試、避免重複掛載與離頁取消', async () => {
  const env = environment();
  env.document.querySelector = selector => selector === '#characters' ? null : env.element(selector);
  const {mountCharacterScene} = await env.evaluate('js/santa-model.js');
  const root = new Element(), slots=[new Element(),new Element()], fallbacks=[new Element(),new Element()], statuses=[new Element(),new Element()], retries=[new Element(),new Element()];
  const selectors={'[data-model-slot]':slots,'.model-fallback':fallbacks,'.model-status':statuses,'[data-model-action="retry"]':retries};
  root.querySelectorAll = selector => selectors[selector];
  let attempts=0, mounts=0, destroyed=0; const waiting=[];
  const entry = mountCharacterScene(root,{loadScene:async()=>{
    attempts++; if(attempts===1) throw new Error('Module fetch failed');
    return new Promise(resolve=>waiting.push(resolve));
  }});
  const flush=()=>new Promise(resolve=>setImmediate(resolve)); await flush();
  assert.ok(slots.every(slot=>slot.dataset.state==='error' && slot.getAttribute('aria-busy')==='false'));
  assert.ok(fallbacks.every(f=>f.hidden)); assert.ok(retries.every(button=>!button.hidden && !button.disabled));
  const click=()=>root.dispatch('click',{target:{closest:()=>retries[0]}});
  click(); click(); assert.equal(attempts,2);
  waiting.shift()({mountCharacters:()=>{throw new Error('WebGL unavailable');}}); await flush();
  assert.ok(statuses.every(status=>status.textContent.includes('WebGL 2')));
  assert.ok(retries.every(button=>!button.hidden && !button.disabled));
  const module={mountCharacters:()=>{mounts++; return{destroy(){destroyed++;}};}};
  click(); waiting.shift()(module); await flush(); assert.equal(mounts,1);
  click(); assert.equal(attempts,3);
  env.window.dispatch('pagehide'); assert.equal(destroyed,1);
  env.window.dispatch('pageshow',{persisted:true}); assert.equal(attempts,4);
  env.window.dispatch('pagehide'); waiting.shift()(module); await flush(); assert.equal(mounts,1);
  env.window.dispatch('pageshow',{persisted:true}); waiting.shift()(module); await flush(); assert.equal(mounts,2);
  entry.destroy(); entry.destroy(); assert.equal(destroyed,2); assert.equal(root.listeners.click.length,0);
  assert.equal(env.window.listeners.pageshow.length,0);
});
await test('繪本對話：隨機不連續重複、互斥、五秒收起、手動關閉及生命週期', async () => {
  const env = environment(); env.sandbox.Math = Object.assign(Object.create(Math), {random:() => 0});
  await env.evaluate('js/home.js');
  const root = env.element('.storybook');
  const speak = character => root.dispatch('character:speak',{detail:{character}});
  const santa = env.element('#santa-letter'), reindeer = env.element('#reindeer-letter');
  speak('santa');
  const first = env.element('#santa-dialogue').textContent; assert.equal(santa.hidden,false);
  speak('santa'); assert.notEqual(env.element('#santa-dialogue').textContent,first);
  speak('reindeer'); assert.equal(santa.hidden,true); assert.equal(reindeer.hidden,false);
  assert.equal(env.timeouts.size,1);
  const expire = [...env.timeouts.values()][0]; assert.equal(expire.delay,5000);
  env.timeouts.clear(); expire();
  const exit = [...env.timeouts.values()][0]; env.timeouts.clear(); exit(); assert.equal(reindeer.hidden,true);
  speak('santa'); santa.click();
  const manualExit = [...env.timeouts.values()].at(-1); env.timeouts.clear(); manualExit(); assert.equal(santa.hidden,true);
  speak('santa'); env.document.activeElement = santa; env.document.dispatch('keydown',{key:'Escape'});
  assert.equal(env.element('[data-model-slot="santa"]').getAttribute('aria-expanded'),'false');
  assert.equal(env.element('[data-model-slot="santa"]').focused,true);
  env.element('#replay-story').click(); assert.equal(reindeer.hidden,true);
  speak('santa'); env.window.dispatch('pagehide'); assert.equal(env.timeouts.size,0); assert.equal(santa.hidden,true);
  assert.equal(root.listeners['character:speak'].length,0);
  env.window.dispatch('pageshow',{persisted:true}); assert.equal(root.listeners['character:speak'].length,1);
});
await test('真實動畫：Santa 精確 1–4 秒、麋鹿原地舞步與後腳固定', async () => {
  const env = environment(); const THREE = await env.evaluate('vendor/three/build/three.module.js');
  const {GLTFLoader} = await env.evaluate('vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const {sliceSantaDance,createReindeerDance,softenSantaLoop} = await env.evaluate('js/components/character-animation.js');
  const loader = new GLTFLoader(); loader.register(() => ({name:'TEST_TEXTURES',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
  async function model(name) {
    const raw = await fs.readFile(path.join(project,`assets/models/${name}.glb`)); env.sandbox.ArrayBuffer = raw.buffer.constructor;
    return loader.parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
  }
  const santa = await model('santa-dance'); const source = santa.animations[0], clip = sliceSantaDance(santa.animations);
  assert.equal(clip.duration,3); assert.equal(clip.userData.sourceFPS,24);
  assert.equal(clip.userData.startFrame,24); assert.equal(clip.userData.endFrame,96);
  assert.equal(clip.tracks.length,source.tracks.length);
  for (let i=0;i<clip.tracks.length;i++) {
    const track = clip.tracks[i], original = source.tracks[i];
    assert.equal(track.times[0],0); assert.equal(track.times.at(-1),3);
    assert.equal(track.getInterpolation(),original.getInterpolation());
    const a = track.createInterpolant(), b = original.createInterpolant();
    for (const t of [0,.123,1,1.5,2.72,3]) {
      const actual = Array.from(a.evaluate(t)), expected = Array.from(b.evaluate(t+1));
      assert.ok(actual.every((value,j)=>Math.abs(value-expected[j])<.00002),`${track.name} at ${t}`);
    }
  }
  assert.throws(()=>sliceSantaDance([]));
  const mixer = new THREE.AnimationMixer(santa.scene); const action = mixer.clipAction(clip).setLoop(THREE.LoopRepeat,Infinity).play();
  for (let i=0;i<1000;i++) { mixer.update(.016); assert.ok(action.time >= 0 && action.time < 3); }
  mixer.stopAllAction(); mixer.uncacheRoot(santa.scene);
  const target = new THREE.Object3D();
  const edgeClip = new THREE.AnimationClip('edge',3,[new THREE.NumberKeyframeTrack('.position[x]',[0,3],[1,4])]);
  const edgeMixer = new THREE.AnimationMixer(target), edgeAction=edgeMixer.clipAction(edgeClip).setLoop(THREE.LoopRepeat,Infinity).play();
  const loop = softenSantaLoop(edgeMixer,edgeAction,edgeClip);
  let previous=1, maxJump=0;
  for (let i=0;i<600;i++) {
    loop.update(.02); maxJump=Math.max(maxJump,Math.abs(target.position.x-previous)); previous=target.position.x;
    assert.ok(target.position.x >= 1 && target.position.x <=4); assert.ok(edgeAction.time>=0 && edgeAction.time<3);
  }
  assert.ok(maxJump<.55,`seam jump ${maxJump}`); assert.equal(edgeClip.duration,3);
  loop.destroy(); edgeMixer.stopAllAction(); edgeMixer.uncacheRoot(target);
  const deer = await model('reindeer'); const dance = createReindeerDance(deer.scene);
  assert.equal(dance.clip.name,'storybook:reindeer-dance'); assert.ok(!dance.clip.tracks.some(track=>track.name.endsWith('.scale')));
  assert.equal(deer.animations[0].name,'preset:quadruped:walk');
  for (const track of dance.clip.tracks) {
    const n=track.getValueSize(); assert.deepEqual(Array.from(track.values.slice(0,n)),Array.from(track.values.slice(-n)));
  }
  const dm = new THREE.AnimationMixer(deer.scene); dm.clipAction(dance.clip).setLoop(THREE.LoopRepeat,Infinity).play();
  const feet = dance.clip.userData.hindFeet.map(name=>deer.scene.getObjectByName(name));
  const front = deer.scene.getObjectByName('tripo0_Left_Limb_3');
  dm.setTime(0); deer.scene.updateMatrixWorld(true);
  const rest = feet.map(b=>b.getWorldPosition(new THREE.Vector3()));
  const start = front.getWorldPosition(new THREE.Vector3()); let lift = 0;
  const spine = deer.scene.getObjectByName('tripoSpine_1'); const xs = [];
  const frontFeet = ['Left','Right'].map(side=>deer.scene.getObjectByName(`tripo0_${side}_Limb_3`));
  const frontRest = frontFeet.map(b=>b.getWorldPosition(new THREE.Vector3()));
  for (let t=0;t<=3.1;t+=.05) {
    dm.setTime(t); deer.scene.updateMatrixWorld(true);
    feet.forEach((foot,i)=>assert.ok(foot.getWorldPosition(new THREE.Vector3()).distanceTo(rest[i])<.000001));
    lift = Math.max(lift,front.getWorldPosition(new THREE.Vector3()).y-start.y);
    xs.push(spine.getWorldPosition(new THREE.Vector3()).x);
    frontFeet.forEach((foot,i)=>{const p=foot.getWorldPosition(new THREE.Vector3());assert.ok(p.y>=frontRest[i].y-.00001,`hoof below ground ${p.y-frontRest[i].y}`);assert.ok(Math.abs(p.x-frontRest[i].x)<.002,`stance sliding ${p.x-frontRest[i].x}`);});
  }
  assert.ok(lift>.008 && lift<.04,`front hoof lift ${lift}`);
  assert.ok(Math.max(...xs)-Math.min(...xs)>.035,`body sway ${Math.max(...xs)-Math.min(...xs)}`);
  assert.equal(dance.clip.userData.swayRadians,.075);
  dm.setTime(3.55); deer.scene.updateMatrixWorld(true);
  const bounce = feet[0].getWorldPosition(new THREE.Vector3()).y-rest[0].y; assert.ok(bounce>.006 && bounce<.009);
  dm.stopAllAction(); dm.uncacheRoot(deer.scene);
  const {disposeModel}=await env.evaluate('js/components/characters-scene.js'); disposeModel(santa.scene); disposeModel(deer.scene);
});
await test('V5：遮罩對位與本機 SVG 資源、原生角色按鈕、移除舊控制列', async () => {
  const html=await fs.readFile(path.join(project,'index.html'),'utf8');
  const css=await fs.readFile(path.join(project,'css/home.css'),'utf8');
  assert.ok(!html.includes('id="santa-character"')); assert.ok(!html.includes('id="reindeer-character"'));
  assert.ok(!html.includes('data-model-action="play"')); assert.ok(!html.includes('data-model-action="reset"'));
  assert.equal((html.match(/<button[^>]*data-model-slot=/g)??[]).length,2);
  assert.equal((html.match(/class="christmas-letter /g)??[]).length,2);
  assert.ok(html.includes('href="intro.html">Explore the Story')); assert.ok(html.includes('href="wish.html">Make a Wish'));
  assert.ok(!css.includes('.speech-bubble'));
  for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    const file = localRef(match[1]);
    if (file) await fs.access(path.resolve(project,'css',file));
  }
  const masks=JSON.parse(await fs.readFile(path.join(project,'docs/STORYBOOK-MASKS.json'),'utf8'));
  assert.equal(Object.keys(masks).length,6);
  for(const [name,item] of Object.entries(masks)) {
    const png=await fs.readFile(path.join(project,'assets/illustrations/storybook',`${name}.png`));
    assert.equal(png.readUInt32BE(16),item.size[0]); assert.equal(png.readUInt32BE(20),item.size[1]);
    const svg=await fs.readFile(path.join(project,item.mask),'utf8');
    assert.ok(svg.includes(`viewBox="0 0 ${item.size[0]} ${item.size[1]}"`));
    assert.ok(svg.includes(`preserveAspectRatio="${item.preserveAspectRatio}"`),'Mask must match the image object-fit and object-position');
    assert.equal(item.preserveAspectRatio,name==='03_pine_trees'?'xMidYMax meet':name==='06_clouds'?'xMidYMid meet':'none');
    for(const polygon of [...item.polygons,...(item.holes??[])]) for(const [x,y] of polygon) assert.ok(x>=0&&x<=item.size[0]&&y>=0&&y<=item.size[1]);
    await fs.access(path.join(project,item.mask));
  }
});
await test('最終紙雕清理：新素材完整性、單一村落、三種樹尺寸及來源殘片遮罩', async () => {
  const html=await fs.readFile(path.join(project,'index.html'),'utf8');
  const css=await fs.readFile(path.join(project,'css/home.css'),'utf8');
  const assets=JSON.parse(await fs.readFile(path.join(project,'docs/STORYBOOK-CLEAN-ASSETS.json'),'utf8'));
  for (const item of Object.values(assets)) {
    const bytes=await fs.readFile(path.join(project,item.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
    assert.equal(bytes.length,item.bytes);
  }
  // 首頁與 Game 頁的紙雕改為 SVG；原始 PNG 只留作素材，頁面不再載入。
  const gameHtml=await fs.readFile(path.join(project,'game.html'),'utf8');
  const homeScene=await fs.readFile(path.join(project,'js/components/home-scene.js'),'utf8');
  const gameScene=await fs.readFile(path.join(project,'js/components/game-scene.js'),'utf8');
  for (const page of [html,gameHtml]) assert.ok(!/assets\/illustrations\/(storybook|games\/hero)\//.test(page),'Paper scenes must not load raster art');
  assert.ok(html.includes('data-title-art')); assert.ok(html.includes('js/home-scene.js'));
  assert.ok(!/mountain/i.test(homeScene)); assert.ok(!/mountain/i.test(gameScene));
  const homeLayers=[...homeScene.matchAll(/popLayer\(stage, '[^']+', '([^']+)'/g)].map(match=>match[1].split(' ')[0]);
  const gameLayers=[...gameScene.matchAll(/popLayer\(hero, '[^']+', '([^']+)'/g)].map(match=>match[1].split(' ')[0]);
  assert.ok(homeLayers.length>=9); assert.ok(gameLayers.length>=8);
  for (const layer of new Set(homeLayers)) assert.ok(css.includes(`.${layer}`),layer);
  assert.ok(homeScene.includes('home-near-left')&&homeScene.includes('home-village-left'),'Left side carries its own village and near scenery');
  assert.ok(css.includes('.storybook.is-opening .pop { animation: pop-up'));
  assert.ok((await fs.readFile(path.join(project,'css/shared.css'),'utf8')).includes('@keyframes pop-up'));
  const masks=JSON.parse(await fs.readFile(path.join(project,'docs/STORYBOOK-MASKS.json'),'utf8'));
  const inside=(polygon,x,y)=>polygon.reduce((hit,[ax,ay],i)=>{
    const [bx,by]=polygon[(i+1)%polygon.length];
    return ((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax)?!hit:hit;
  },false);
  const keeps=(name,x,y)=>{
    const item=masks[name];
    return item.polygons.some(p=>inside(p,x,y))&&!(item.holes??[]).some(p=>inside(p,x,y));
  };
  assert.equal(keeps('07_small_snowbanks',40,60),false,'Remove the cut neighbouring berry fragment');
  assert.equal(keeps('07_small_snowbanks',151,30),true,'Preserve the snowbank and cream border');
});
await test('Wish：提供的 GLB／PNG 副本完整、樹旋轉外框與四尺寸視野', async () => {
  const manifest=JSON.parse(await fs.readFile(path.join(project,'docs/WISH-ASSETS.json'),'utf8'));
  for (const entry of manifest.assets) {
    const data=await fs.readFile(path.join(project,entry.file));
    assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);
  }
  const env=environment();
  const THREE=await env.evaluate('vendor/three/build/three.module.js');
  const {GLTFLoader}=await env.evaluate('vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const {treeFit}=await env.evaluate('js/components/wish-layout.js');
  const loader=new GLTFLoader();loader.register(()=>({name:'TEST_TEXTURES',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
  const data=await fs.readFile(path.join(project,'assets/models/wish-tree.glb'));env.sandbox.ArrayBuffer=data.buffer.constructor;
  const tree=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  assert.equal(tree.animations.length,0);
  const box=new THREE.Box3().setFromObject(tree.scene),center=box.getCenter(new THREE.Vector3());
  let radius=0;const vertices=[];tree.scene.updateMatrixWorld(true);
  tree.scene.traverse(n=>{if(n.isMesh){for(let i=0;i<n.geometry.attributes.position.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(n.geometry.attributes.position,i).applyMatrix4(n.matrixWorld).sub(center);
    radius=Math.max(radius,Math.hypot(v.x,v.z));vertices.push(v);
  }}});
  const h=box.max.y-box.min.y;assert.ok(h>.97&&h<.99);assert.ok(radius>.3&&radius<.5);
  for (const zone of [{left:530,width:840,height:690},{left:390,width:580,height:710},{left:300,width:430,height:685},{left:16,width:350,height:520}]) {
    const fit=treeFit(zone,{height:h,radius});
    assert.ok(fit.height<=zone.height);assert.ok(radius*2*fit.scale*100<=zone.width);
    for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.7])for(const v of vertices.filter((_,i)=>i%32===0)){
      const x=(v.x*Math.cos(angle)+v.z*Math.sin(angle))*fit.scale*100;
      assert.ok(Math.abs(x)<zone.width/2,'Any rotation must fit without cropping');
    }
  }
});
await test('Wish：精靈真實走路與舞蹈、原地化保留垂直運動、巡邏停止與手勢分流', async () => {
  const env=environment();const THREE=await env.evaluate('vendor/three/build/three.module.js');
  const {GLTFLoader}=await env.evaluate('vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const {inPlaceClip,horizontalIntent}=await env.evaluate('js/components/wish-layout.js');
  const loader=new GLTFLoader();loader.register(()=>({name:'TEST_TEXTURES',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
  const data=await fs.readFile(path.join(project,'assets/models/wish-elf.glb'));env.sandbox.ArrayBuffer=data.buffer.constructor;
  const elf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  let bones=0;elf.scene.traverse(n=>{if(n.isBone)bones++;});assert.ok(bones>=60);
  for(const name of ['walk','dance_03','dance_04','dance_05']){
    const source=elf.animations.find(c=>c.name===name);assert.ok(source);
    const before=source.tracks.map(t=>Array.from(t.values));const clip=inPlaceClip(source);
    const root=clip.tracks.find(t=>/Hips\.position$/.test(t.name));assert.ok(root);
    for(let i=0;i<root.values.length;i+=3){assert.equal(root.values[i],root.values[0]);assert.equal(root.values[i+2],root.values[2]);}
    const original=source.tracks.find(t=>t.name===root.name);
    for(let i=1;i<root.values.length;i+=3)assert.equal(root.values[i],original.values[i]);
    source.tracks.forEach((t,i)=>assert.deepEqual(Array.from(t.values),before[i],'Do not mutate original clip'));
    const mixer=new THREE.AnimationMixer(elf.scene);mixer.clipAction(clip).play();
    for(const t of [0,.5,1,2]){mixer.setTime(t);elf.scene.updateMatrixWorld(true);elf.scene.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingBox();}});const b=new THREE.Box3().setFromObject(elf.scene);assert.ok(Number.isFinite(b.min.y));assert.ok(b.max.y-b.min.y<1.3);}
    mixer.stopAllAction();mixer.uncacheRoot(elf.scene);
  }
  assert.equal(horizontalIntent(30,3),'rotate');assert.equal(horizontalIntent(3,30),'scroll');assert.equal(horizontalIntent(2,1),'pending');
});
await test('Wish 投遞：真實襪口 contain 座標與連續弧線端點',async()=>{
  const env=environment();const {stockingMouth,deliveryPath}=await env.evaluate('js/components/wish-delivery-path.js');
  for(const rect of [{left:60,top:500,width:400,height:200},{left:20,top:610,width:230,height:173},{left:100,top:600,width:180,height:250}]){
    const m=stockingMouth(rect),s=Math.min(rect.width/360,rect.height/247);
    assert.equal(m.x,m.left+208*s);assert.equal(m.y,m.top+80*s);
    assert.ok(m.x>=rect.left&&m.x<=rect.left+rect.width);assert.ok(m.y>=rect.top&&m.y<=rect.top+rect.height);
    const start={x:rect.left+120,y:rect.top-240},frames=deliveryPath(start,m);
    assert.equal(frames[0].transform,'translate3d(0px,0px,0) rotate(0deg) scale(1)');
    const end=frames.at(-1).transform.match(/translate3d\(([^p]+)px,([^p]+)px,0\)/);
    assert.ok(Math.abs(Number(end[1])-(m.x-start.x))<1e-9);assert.ok(Math.abs(Number(end[2])-(m.y-start.y))<1e-9);
    assert.ok(frames.every(f=>!f.transform.includes('NaN')));assert.equal(frames.at(-1).offset,1);
    assert.ok(frames.every(f=>f.opacity===undefined),'Never fade away before the envelope reaches the cuff');
  }
});
async function deliveryFixture(reduced=false){
  const env=environment(),queue=[],observers=[];let n=0;
  const decorate=node=>{
    node.style.setProperty=(key,value)=>{node.style[key]=value;};
    node.removeAttribute=key=>{delete node.attributes[key];};
    node.decode=()=>Promise.resolve();
    node.querySelectorAll=()=>[];
    node.animate=(frames,options)=>{
      let resolve,reject;const a={node,frames,options,pending:true,finished:new Promise((yes,no)=>{resolve=yes;reject=no;}),finish(){if(a.pending){a.pending=false;resolve();}},cancel(){if(a.pending){a.pending=false;reject(new env.sandbox.DOMException('cancelled','AbortError'));}}};queue.push(a);return a;
    };return node;
  };
  const make=()=>decorate(env.element(`delivery-node-${n++}`));env.sandbox.document.createElement=make;
  env.sandbox.DOMException=class extends Error{constructor(message,name){super(message);this.name=name;}};env.sandbox.getComputedStyle=()=>({padding:'16px'});env.sandbox.innerHeight=900;
  env.sandbox.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
  const media=make();media.matches=reduced;env.sandbox.window.matchMedia=()=>media;
  const root=make();root.clientLeft=root.clientTop=6;root.getBoundingClientRect=()=>({left:20,top:80,width:1400,height:790});
  const ids=new Map();const get=s=>{if(!ids.has(s))ids.set(s,make());return ids.get(s);};root.querySelector=get;
  const form=get('#wish-form'),image=get('.stocking-station img'),receipt=get('#delivery-receipt');
  form.offsetWidth=400;form.offsetHeight=430;form.getBoundingClientRect=()=>({left:70,top:160,width:400,height:430});
  image.rect={left:100,top:620,width:300,height:200,bottom:820};image.getBoundingClientRect=()=>image.rect;
  const fields=[get('#nickname'),get('#wish-content')];fields[0].value='小雪';fields[1].value='平安的聖誕節';
  const button=make();form.querySelectorAll=s=>s==='input,textarea'?fields:s==='input,textarea,button'?[...fields,button]:[];
  form.cloneNode=()=>{const copy=make(),inputs=[make(),make()];copy.querySelectorAll=s=>s==='input,textarea'?inputs:[];return copy;};
  form.reset=()=>fields.forEach(field=>field.value='');receipt.hidden=true;
  const {createWishDelivery}=await env.evaluate('js/components/wish-delivery.js');const controller=createWishDelivery(root);
  const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
  return {env,root,form,fields,button,image,receipt,controller,queue,observers,get,flush,finish:()=>queue.filter(a=>a.pending).forEach(a=>a.finish())};
}
await test('Wish 投遞：折信→飛行→真實儲存順序、重複送出鎖與成功後再寫',async()=>{
  const f=await deliveryFixture();let commits=0,confirm;const save=new Promise(resolve=>{confirm=resolve;});
  const pending=f.controller.run(()=>{commits++;return save;});await f.flush();
  assert.equal(f.root.dataset.deliveryState,'folding');assert.ok(f.form.inert);assert.equal(commits,0);
  assert.equal(await f.controller.run(()=>{throw Error('duplicate');}),null);
  assert.ok(f.queue.some(a=>a.frames.some(k=>/rotateX\(180deg\)/.test(k.transform??''))),'Bottom has a real hinge');
  assert.ok(f.queue.some(a=>a.frames.some(k=>/rotateY/.test(k.transform??''))),'Sides have real hinges');
  f.finish();await f.flush();assert.equal(f.root.dataset.deliveryState,'flying');assert.equal(commits,0);
  f.finish();await f.flush();assert.equal(f.root.dataset.deliveryState,'saving');assert.equal(commits,1);assert.equal(f.receipt.hidden,true);
  assert.equal(f.get('#delivery-snowflake').hidden,false);assert.equal(f.button.disabled,true);
  confirm({id:'real-save'});assert.equal((await pending).id,'real-save');
  assert.equal(f.root.dataset.deliveryState,'success');assert.equal(f.receipt.hidden,false);assert.equal(f.form.inert,false);assert.equal(f.button.disabled,false);
  assert.ok(f.get('#receipt-title').focused);assert.ok(f.queue.every(a=>!a.pending));
  f.get('#wish-again').click();assert.equal(f.root.dataset.deliveryState,'idle');assert.equal(f.receipt.hidden,true);assert.equal(f.fields[0].value,'');
  f.controller.destroy();
});
await test('Wish 投遞：儲存失敗、減少動態、尺寸改變及離頁取消保留輸入',async()=>{
  const broken=await deliveryFixture();let imageWrites=0;const create=broken.env.sandbox.document.createElement;
  broken.env.sandbox.document.createElement=(...args)=>{const node=create(...args);node.decode=()=>Promise.reject(Error('image decode'));return node;};
  await assert.rejects(broken.controller.run(()=>{imageWrites++;}),/image decode/);
  assert.equal(imageWrites,0);assert.equal(broken.form.inert,false);assert.equal(broken.controller.busy,false);assert.equal(broken.fields[1].value,'平安的聖誕節');broken.controller.destroy();
  const reduced=await deliveryFixture(true);let committed=0;
  await assert.rejects(reduced.controller.run(()=>{throw Error('quota');}),/quota/);
  assert.equal(reduced.queue.length,0);assert.equal(reduced.root.dataset.deliveryState,'error');assert.equal(reduced.receipt.hidden,true);assert.equal(reduced.fields[1].value,'平安的聖誕節');
  await reduced.controller.run(()=>{committed++;return {id:'local'};});assert.equal(committed,1);assert.equal(reduced.receipt.hidden,false);reduced.controller.destroy();
  const f=await deliveryFixture();let writes=0;const pending=f.controller.run(()=>{writes++;});await f.flush();
  f.image.rect={...f.image.rect,left:120};f.observers[0].callback();await assert.rejects(pending,e=>e.name==='AbortError');
  assert.equal(writes,0);assert.equal(f.form.inert,false);assert.equal(f.fields[1].value,'平安的聖誕節');assert.equal(f.receipt.hidden,true);assert.ok(f.observers[0].disconnected);
  const second=f.controller.run(()=>{writes++;});await f.flush();f.controller.destroy();await assert.rejects(second,e=>e.name==='AbortError');assert.equal(writes,0);
});
await test('Santa 新模型與頭部追蹤：頭頸骨存在、角度上限、平滑、觸控與減少動態不追蹤', async () => {
  const glb = await fs.readFile(path.join(project, 'assets/models/santa-new.glb'));
  const data = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim());
  const joints = data.skins[0].joints.map(index => data.nodes[index].name);
  assert.ok(joints.includes('mixamorig:Head') && joints.includes('mixamorig:Neck'));
  assert.ok(glb.length < 2_000_000, 'compressed Santa stays under 2MB');
  const env = environment();
  const THREE = await env.evaluate('vendor/three/build/three.module.js');
  const { createHeadTracker } = await env.evaluate('js/components/santa-head.js');
  function rig(pointerFine = true, reduced = false) {
    const listeners = {};
    Object.assign(env.window, { innerWidth: 1200, innerHeight: 800,
      addEventListener: (type, callback) => { listeners[type] = callback; }, removeEventListener: type => { delete listeners[type]; },
      matchMedia: query => ({ matches: query.includes('reduced') ? reduced : pointerFine, addEventListener() {}, removeEventListener() {} }) });
    const model = new THREE.Group(), neck = new THREE.Bone(), head = new THREE.Bone();
    neck.name = 'mixamorigNeck'; head.name = 'mixamorigHead'; neck.add(head); model.add(neck);
    const anchor = { getBoundingClientRect: () => ({ left: 500, top: 100, width: 200, height: 300 }) };
    const tracker = createHeadTracker(model, anchor);
    const frame = delta => { neck.quaternion.identity(); head.quaternion.identity(); model.updateMatrixWorld(true); return tracker.update(delta); };
    return { listeners, neck, head, tracker, frame };
  }
  const mouse = rig();
  mouse.listeners.pointermove({ pointerType: 'mouse', clientX: -5000, clientY: 5000 });
  assert.equal(mouse.frame(1 / 60), true); const early = mouse.head.quaternion.angleTo(new THREE.Quaternion());
  for (let i = 0; i < 240; i++) mouse.frame(1 / 60);
  const settled = mouse.head.quaternion.angleTo(new THREE.Quaternion()) + mouse.neck.quaternion.angleTo(new THREE.Quaternion());
  assert.ok(early < settled / 4, 'head eases toward the target'); assert.ok(settled > .3 && settled < .5, `total turn ${settled}`);
  assert.equal(mouse.frame(1 / 60), false); mouse.tracker.destroy(); assert.equal(mouse.listeners.pointermove, undefined);
  for (const [fine, reduced, pointerType] of [[true, false, 'touch'], [false, false, 'mouse'], [true, true, 'mouse']]) {
    const still = rig(fine, reduced);
    still.listeners.pointermove({ pointerType, clientX: -5000, clientY: 5000 });
    for (let i = 0; i < 60; i++) still.frame(1 / 60);
    assert.equal(still.head.quaternion.angleTo(new THREE.Quaternion()), 0);
    still.tracker.destroy();
  }
});

console.log(`\n${results.length} test groups passed.`);
