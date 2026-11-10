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

await test('全部模組語法、HTML 本機資源及五頁導覽', async () => {
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const filename = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(filename);
      else if (filename.endsWith('.js')) new vm.SourceTextModule(await fs.readFile(filename, 'utf8'));
    }
  }
  await walk(path.join(project, 'js'));
  for (const page of ['index.html', 'intro.html', 'game.html', 'wish.html', 'santa.html']) {
    const html = await fs.readFile(path.join(project, page), 'utf8');
    for (const target of ['index.html', 'intro.html', 'game.html', 'wish.html', 'santa.html']) assert.ok(html.includes(`href="${target}"`));
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const file = localRef(match[1]);
      if (file) await fs.access(path.resolve(project, file));
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
  }
});
await test('快取版本：每頁的 CSS、入口與內部模組版本都對應目前檔案內容', async () => {
  const { PAGES, stamp } = await import(pathToFileURL(path.join(project, 'scripts/stamp-modules.mjs')).href);
  for (const page of PAGES) {
    const html = await fs.readFile(path.join(project, page), 'utf8');
    assert.equal(html, await stamp(html, page), `${page} 的版本過期，請執行 node scripts/stamp-modules.mjs`);
  }
  const home = await fs.readFile(path.join(project, 'index.html'), 'utf8');
  const { imports } = JSON.parse(home.match(/<script type="importmap">(.*)<\/script>/)[1]);
  for (const file of ['home-scene', 'paper-art', 'flip-counter', 'characters-scene']) assert.match(imports[`./js/components/${file}.js`], /\?v=[0-9a-f]{10}$/);
  const adminMap = JSON.parse((await fs.readFile(path.join(project, 'admin.html'), 'utf8')).match(/<script type="importmap">(.*)<\/script>/)[1]).imports;
  for (const file of ['firebase-client', 'firebase-client-core', 'wish-repository-core']) assert.match(adminMap[`./js/services/${file}.js`], /\?v=[0-9a-f]{10}$/);
  // The matching game is its own document inside an iframe, so it needs its own versions or phones keep the old game.
  const matching = await fs.readFile(path.join(project, 'games/christmas-matching.html'), 'utf8');
  assert.ok(PAGES.includes('games/christmas-matching.html'));
  assert.match(JSON.parse(matching.match(/<script type="importmap">(.*)<\/script>/)[1]).imports['../js/games/game2-matching.js'], /\?v=[0-9a-f]{10}$/);
  assert.match(matching, /src="\.\.\/js\/games\/game2-embed\.js\?v=[0-9a-f]{10}"/);
  // Both games are iframes; their URLs and the flying game's own files change with their content.
  const host = await fs.readFile(path.join(project, 'game.html'), 'utf8');
  for (const frame of ['vendor/game1-frameless/index.html', 'games/christmas-matching.html']) assert.match(host, new RegExp(`src="${frame.replaceAll('.', '\\.')}\\?v=[0-9a-f]{10}"`), frame);
  const flying = await fs.readFile(path.join(project, 'vendor/game1-frameless/index.html'), 'utf8');
  for (const file of ['style.css', 'rules.js', 'game.js']) assert.match(flying, new RegExp(`="${file.replace('.', '\\.')}\\?v=[0-9a-f]{10}"`), file);
});
await test('Firebase 模擬器：只有本機主機名稱啟用，且一定換成 demo 專案', async () => {
  const { localEmulatorTarget, createFirebaseClients } = await import(pathToFileURL(path.join(project, 'js/services/firebase-client-core.js')).href);
  for (const host of ['localhost', '127.0.0.1']) { const target = localEmulatorTarget(host); assert.match(target.config.projectId, /^demo-/); assert.equal(target.emulator.firestorePort, 8080); assert.equal(target.emulator.authPort, 9099); assert.doesNotThrow(() => createFirebaseClients({}, target.config, '(default)', target.emulator)); }
  for (const host of ['holymerry.web.app', 'holymerry.firebaseapp.com', 'me666good.github.io', 'localhost.example.com', '127.0.0.1.example.com', '', undefined]) assert.equal(localEmulatorTarget(host), null, String(host));
  assert.throws(() => createFirebaseClients({}, { projectId: 'holymerry' }, '(default)', { host: '127.0.0.1' }), /demo project/);
});
await test('Wish 壓縮模型：網頁載入壓縮檔、雜湊正確、原始 GLB 保留', async () => {
  const scene = await fs.readFile(path.join(project, 'js/components/wish-scene.js'), 'utf8');
  assert.ok(scene.includes('`wish-${id}-web.glb`') && scene.includes('setMeshoptDecoder'));
  for (const [name, limit] of [['wish-tree-web', 3e6], ['wish-elf-web', 2e6]]) {
    const bytes = await fs.readFile(path.join(project, `assets/models/${name}.glb`)), meta = JSON.parse(await fs.readFile(path.join(project, `assets/models/${name}.json`), 'utf8'));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), meta.sha256); assert.ok(bytes.length < limit, name);
  }
  for (const name of ['wish-tree', 'wish-elf-original']) await fs.access(path.join(project, `assets/models/${name}.glb`));
  const elf = await fs.readFile(path.join(project, 'assets/models/wish-elf-web.glb')), data = JSON.parse(elf.toString('utf8', 20, 20 + elf.readUInt32LE(12)).trim());
  assert.equal(data.skins[0].joints.length, 65); assert.equal(data.animations.length, 1);
});
await test('Santa 小屋：壓縮坐姿模型、封閉紙雕小屋與聖誕村、屋外環視與走進屋內 360°、排隊 Loading 跟著真實進度', async () => {
  const gltf = async name => { const glb = await fs.readFile(path.join(project, `assets/models/${name}.glb`)); return { bytes: glb, data: JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim()) }; };
  const source = await gltf('santa-seated'), web = await gltf('santa-seated-web'), meta = JSON.parse(await fs.readFile(path.join(project, 'assets/models/santa-seated-web.json'), 'utf8'));
  assert.equal(createHash('sha256').update(web.bytes).digest('hex'), meta.sha256); assert.ok(web.bytes.length < 2e6 && web.bytes.length < source.bytes.length / 5);
  assert.deepEqual(web.data.skins[0].joints.map(index => web.data.nodes[index].name), source.data.skins[0].joints.map(index => source.data.nodes[index].name), 'The skeleton the code turns must survive compression');
  const scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), art = await fs.readFile(path.join(project, 'js/components/cabin-art.js'), 'utf8'), entry = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8');
  assert.ok(scene.includes('santa-seated-web.glb') && !scene.includes("santa-seated.glb'") && scene.includes('setMeshoptDecoder'));
  assert.ok(scene.includes('maxYaw: .24') && scene.includes('maxPitch: .1'), 'Head turns stay small: larger angles crease the beard');
  assert.ok(scene.includes('prefers-reduced-motion') && scene.includes('forceContextLoss') && scene.includes('IntersectionObserver') && !scene.includes('innerHTML'));
  assert.ok(entry.includes("'pagehide'") && entry.includes('event.persisted') && entry.includes('dataset.progress'));
  assert.ok(art.includes('export const BOARDS') && art.includes('paper-props.js') && !art.includes('innerHTML'));
  const html = await fs.readFile(path.join(project, 'santa.html'), 'utf8'), loader = await fs.readFile(path.join(project, 'js/site-loader.js'), 'utf8');
  assert.ok(html.includes(">Santa's Cabin</h1>") && html.includes('class="cabin-gesture" type="button" aria-label=') && html.includes('data-santa-placeholder'));
  assert.ok(html.includes('id="cabin-back"') && html.includes('class="cabin-explore"') && scene.includes("setView('inside')") && scene.includes('setView(spot)') && scene.includes('reindeer-web.glb'), 'Every corner of the yard can be reached by tapping it or from the keyboard list');
  const play = await fs.readFile(path.join(project, 'js/components/cabin-play.js'), 'utf8');
  assert.equal((art.match(/\{ id: '(mailbox|reindeer|snowman|stable)', name:/g) ?? []).length, 4, 'Four corners to explore');
  assert.ok(!/\bELF\b|flyElf|id: 'elf'/.test(art + scene + play) && !html.includes('data-spot="elf"'), 'The Santa page has no elf; the Wish elf is untouched');
  assert.ok(play.includes('onFound') && play.includes("event.detail === 0") && !play.includes('innerHTML'), 'Every game can also be played with Enter, and never writes HTML');
  const { WARDROBE, PLACES: WARDROBE_PLACES, COMBOS } = await import(pathToFileURL(path.join(project, 'js/components/cabin-wardrobe.js')).href);
  assert.equal(WARDROBE.length, 21, 'Twenty-one accessories'); assert.deepEqual(Object.keys(WARDROBE_PLACES), ['head', 'neck', 'face', 'hand']);
  assert.ok(WARDROBE.every(item => WARDROBE_PLACES[item.place] && (item.thumb || item.icon) && typeof item.draw === 'function') && COMBOS.every(combo => Object.entries(combo.needs).every(([place, id]) => WARDROBE.some(item => item.id === id && item.place === place))), 'Every accessory has a place and a picture; every party piece uses real accessories');
  const dressing = await fs.readFile(path.join(project, 'js/components/cabin-snowman.js'), 'utf8'), sounds = await fs.readFile(path.join(project, 'js/components/cabin-sound.js'), 'utf8');
  assert.ok(!dressing.includes('setPointerCapture') && dressing.includes("'click'") && dressing.includes('ResizeObserver') && dressing.includes('events.abort()') && !dressing.includes('innerHTML'), 'Dress-up is a tap (or Enter) on an accessory, keeps its buttons on the snowman and lets go of every listener');
  assert.ok(sounds.includes("dataset.music === 'playing'") && !sounds.includes('.mp3'), 'Yard sounds are made on the spot and stay silent while the music is off');
  const feeding = await fs.readFile(path.join(project, 'js/components/cabin-feed.js'), 'utf8');
  assert.ok(feeding.includes('cabin.mouthRect()') && feeding.includes("'refuse'") && feeding.includes('full(progress)') && feeding.includes('events.abort()') && !feeding.includes('innerHTML') && scene.includes('const MOUTH') && !scene.includes("kind === 'sleep'"), 'Food goes to his mouth, gingerbread is refused, five meals fill him until tomorrow; he never droops off to sleep');
  const santaCss = await fs.readFile(path.join(project, 'css/santa.css'), 'utf8'), paperUi = await fs.readFile(path.join(project, 'js/components/cabin-paper.js'), 'utf8');
  assert.ok(entry.includes('mountCabinPaper(') && paperUi.includes('paperFilter') && paperUi.includes('ResizeObserver') && ['note', 'tag', 'letter', 'wood'].every(name => paperUi.includes(`${name}: [`)) && !santaCss.includes('border-image') && santaCss.includes('.cabin[data-paper] :where('), 'Every box of words in the yard is one whole sheet of paper drawn at its own size (no sliced seams), with a plain fallback until the paper is ready');
  const hoisting = await fs.readFile(path.join(project, 'js/components/cabin-pulley.js'), 'utf8');
  assert.ok(hoisting.includes('setPointerCapture') && hoisting.includes('ArrowDown:') && hoisting.includes('12/24 — 夜班交接') && hoisting.includes('state.locked') && hoisting.includes('events.abort()') && !hoisting.includes('innerHTML') && scene.includes('rise / HOIST.radius') && scene.includes('placeHoist'), 'The hoist is pulled by hand (or arrow keys), the wheel turns by the rope it pays out, and the note waits behind the bale');
  const { WORLD } = await import(pathToFileURL(path.join(project, 'js/components/cabin-world.js')).href), adrift = WORLD.filter(board => !board.at && !board.rig && !board.texture).map(board => board.id);
  assert.deepEqual(adrift, [], 'Every village board starts somewhere: one without a place waits at the origin, inside the cabin');
  assert.ok(scene.includes("sheets.get('balloon-green')"), 'The single green balloon is moved too, not left behind');
  const chat = await fs.readFile(path.join(project, 'js/components/cabin-chat.js'), 'utf8'), backdrop = await fs.readFile(path.join(project, 'js/components/cabin-backdrop.js'), 'utf8');
  assert.ok(entry.includes('mountCabinChat(stage)') && chat.includes('input.disabled = true') && chat.includes("'from-santa'".slice(1, -1)) && !chat.includes('innerHTML') && santaCss.includes('.cabin-stage[data-view="inside"]:not(.is-walking) .cabin-chat'), 'A letter-paper chat waits in the room, its writing line off until the AI reply exists');
  assert.ok(!backdrop.includes('cabin-sun') && !scene.includes('--cabin-turn') && scene.includes('sprite.position.set(-27.5'), 'The sun rises behind the far mountains in the 3D scene instead of sliding on the page behind it');
  const village = await fs.readFile(path.join(project, 'js/components/cabin-world.js'), 'utf8');
  for (const id of ['wish-post', 'wheel', 'horse', 'lighthouse', 'world-sign', 'ski-mountain', 'game-sign']) assert.ok(village.includes(`id: '${id}'`), `The village has its ${id}`);
  assert.ok(!village.includes('innerHTML') && !village.includes("from 'three'"), 'The village is paper art only; the scene builds it');
  assert.ok(art.includes("wall('front-out'") && art.includes("wall('front-in'") && art.includes("rig: 'door'") && art.includes('export const ROOM_PROPS'), 'The house is closed, with a door that opens and things to tap inside');
  assert.ok(scene.includes('turn: Infinity') && scene.includes('function walk(') && scene.includes('world.visible') && scene.includes('away.heading'), 'Inside turns all the way round; walking out faces the way you came in');
  assert.ok(scene.includes("walk('fly'") && entry.includes("'site-loader:done'") && entry.includes('mountCabin(false)'), 'The first visit flies down over the village once the loader is gone; a page from the cache does not');
  const cottage = await fs.readFile(path.join(project, 'js/components/wish-cottage.js'), 'utf8');
  assert.ok(cottage.includes("invite.href = 'santa.html'"), 'The Wish cottage is the same house: whoever answers asks you in');
  const loaderCss = await fs.readFile(path.join(project, 'css/loader.css'), 'utf8'), trek = loaderCss.slice(loaderCss.indexOf('.loader-trek'), loaderCss.indexOf('@media (max-width: 480px)'));
  assert.ok(loader.includes("'#cabin-stage'") && loader.includes('dataset.progress') && loader.includes('trek-step'), 'The footprints fill in with the real download');
  const frames = [...trek.matchAll(/@keyframes trek-[\w-]+ \{(.*)\}$/gm)].map(match => match[1]), properties = frames.flatMap(body => [...body.matchAll(/([\w-]+):/g)].map(match => match[1]));
  assert.ok(frames.length >= 6 && properties.every(name => name === 'transform' || name === 'opacity') && loaderCss.includes('prefers-reduced-motion: reduce) { .site-loader * { animation: none'), 'The walk only animates transform and opacity, so it keeps moving while the page is busy; reduced motion stills it');
  assert.ok((await fs.readFile(path.join(project, 'js/data/heading-glyphs.js'), 'utf8')).includes('santas-cabin'));
});
await test('Santa 紙板預先畫成 WebP：圖片對應目前畫法、手機用小套、只有大螢幕飛行、看不到的稍後才載', async () => {
  const { cabinCuts, SETS } = await import(pathToFileURL(path.join(project, 'scripts/build-cabin-boards.mjs')).href);
  const manifest = JSON.parse(await fs.readFile(path.join(project, 'docs/CABIN-BOARDS.json'), 'utf8')), cuts = await cabinCuts();
  assert.deepEqual(manifest.sets, SETS);
  for (const cut of cuts) {
    const entry = manifest.files[cut.file];
    assert.ok(entry, `少了 images/cabin/${cut.file}，請執行 node scripts/build-cabin-boards.mjs`);
    assert.equal(entry.fingerprint, cut.fingerprint, `images/cabin/${cut.file} 的畫法已變更，請執行 node scripts/build-cabin-boards.mjs`);
    assert.equal(createHash('sha256').update(await fs.readFile(path.join(project, 'images/cabin', cut.file))).digest('hex'), entry.sha256, `images/cabin/${cut.file} 與清單雜湊不符`);
  }
  const files = (await Promise.all(Object.keys(SETS).map(async set => (await fs.readdir(path.join(project, 'images/cabin', set))).map(name => `${set}/${name}`)))).flat();
  assert.deepEqual(files.sort(), cuts.map(cut => cut.file).sort(), 'images/cabin 只放清單上的圖片');
  assert.deepEqual(Object.keys(manifest.files).sort(), cuts.map(cut => cut.file).sort());
  const { CUTS } = await import(pathToFileURL(path.join(project, 'js/data/cabin-cuts.js')).href), names = [...new Set(cuts.map(cut => cut.name))];
  assert.deepEqual(CUTS.sets, SETS); assert.deepEqual(Object.keys(CUTS.sheets).sort(), names.sort());
  for (const name of names) assert.equal(CUTS.sheets[name], createHash('sha256').update(Object.keys(SETS).map(set => manifest.files[`${set}/${name}.webp`].sha256).join()).digest('hex').slice(0, 10), `${name} 的網址版本過期`);
  for (const name of ['sign--stars-4', 'mailbox--open-true', 'hoist-hatch--open-true', 'smoke', 'hoist-bale', 'outfit-red-scarf']) assert.ok(names.includes(name), `${name} 也事先畫好`);
  assert.ok(names.filter(name => name.startsWith('outfit-')).length === 21, 'Every accessory has its picture');
  const scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), paint = await fs.readFile(path.join(project, 'js/components/cabin-paint.js'), 'utf8'), entry = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8');
  assert.ok(!scene.includes('paperFilter') && !scene.includes('XMLSerializer') && scene.includes('cutBoard(') && paint.includes('return paintBoard(board, CUTS.sets[set], state)'), 'The scene only loads pictures; a missing or broken one is cut in the browser instead');
  assert.ok(paint.includes("quality >= .9 ? 'hi' : quality > .6 ? 'large' : 'small'") && scene.includes('cutSet('), 'Retina and large screens get the finest set, phones the smallest');
  assert.ok(Object.values(manifest.files).every(entry => entry.width <= 4096 && entry.height <= 4096), 'No picture is wider or taller than 4096 pixels');
  const peaks = manifest.files['hi/peaks-back.webp'], sign = manifest.files['hi/sign.webp'];
  assert.ok(peaks.width >= 4000 && sign.width === 1050, 'Far scenery is cut as fine as it shows on a large screen; the house keeps its own fineness');
  assert.ok(scene.includes("matchMedia('(pointer: fine)').matches ? 2 : 1.5") && scene.includes('Math.min(devicePixelRatio || 1, sharpest)'), 'A desktop draws the scene at up to 2×, phones at 1.5×');
  assert.ok(entry.includes("(min-width: 1100px) and (min-height: 650px) and (hover: hover) and (pointer: fine)") && entry.includes('fly: fly && roomy.matches'), 'The arrival flight is only for a large desktop window');
  assert.ok(scene.indexOf('const santaReady = loadSanta()') > scene.indexOf('ready = true; frameView();') && scene.includes('boardInSight(board, sweep)') && scene.includes('!roomIn'), 'Santa, the room and what the first view cannot see come after the page opens; walking in waits for the room');
  assert.ok(entry.includes('result.santa.then('), 'The note on the empty chair waits until Santa is known not to come');
});
await test('Santa 手機版：觸控按鈕至少 44px、橫拿手機改右側窄欄、看不到的模型不畫、面板讓開音樂按鈕', async () => {
  const css = await fs.readFile(path.join(project, 'css/santa.css'), 'utf8'), scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), entry = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8');
  const block = query => { const start = css.indexOf(`@media ${query} {`); assert.ok(start >= 0, `少了 @media ${query}`); return css.slice(start, css.indexOf('\n}', start)); };
  const coarse = block('(pointer: coarse)');
  for (const selector of ['.cabin-back', '.wardrobe-tabs button', '.wardrobe-reset', '.hoist-hook', '.hoist-release', '.cabin-letter-close', '.chat-fold', '.chat-send']) assert.ok(coarse.includes(selector), `${selector} 在觸控螢幕上至少 44px`);
  assert.ok(coarse.includes('min-width: 44px; min-height: 44px'));
  const sideways = block('(orientation: landscape) and (max-height: 500px)');
  assert.ok(sideways.includes('.cabin { height: 100svh; }') && sideways.includes('.feed-basket { flex-direction: column; }') && sideways.includes('.wardrobe {') && sideways.includes('.cabin-chat {'), 'A phone held sideways gets the whole screen and the trays down the right side');
  assert.ok(entry.includes("matchMedia('(orientation: landscape) and (max-height: 500px)')") && entry.includes('fitSideways()'), 'Opening a corner sideways scrolls the cabin fully into view');
  assert.ok(/\.wardrobe \{[^}]*bottom: 5\.4rem/.test(css) && css.includes('.wardrobe-reset { margin-right: 3.8rem; }'), 'The wardrobe stays clear of the music button');
  assert.ok(scene.includes("chair.visible = indoorView(view) || trip?.direction === 'in' || trip?.direction === 'out'") && scene.includes("const indoorView = name => name === 'inside' || VIEWS[name]?.room === true") && scene.includes('reindeerHolder.visible = frustum.intersectsSphere(reindeerBounds)'), 'Santa is drawn only around the room and the reindeer only while in view');
});
await test('Santa 屋內：近看壁爐（添柴、風箱、火勢）、HOLY MERRY 書櫃與燙金書脊隨火光發亮', async () => {
  const { BOOKCASE, LETTER_BOOKS, SHELF_LAYOUT, BOOK_SHEETS, ROOM_SPOTS, ROOM_PROPS } = await import(pathToFileURL(path.join(project, 'js/components/cabin-art.js')).href);
  assert.equal(LETTER_BOOKS.map(book => book.letter).join(''), 'HOLYMERRY', 'The books spell the site name');
  assert.deepEqual(LETTER_BOOKS.filter(book => book.gold).map(book => book.letter), ['O', 'M', 'E', 'R'], 'Four gold letters, all taken from HOLY MERRY itself');
  assert.equal(SHELF_LAYOUT.slots.length, 4); assert.ok(SHELF_LAYOUT.slots.every(x => x > 0 && x < SHELF_LAYOUT.santa && SHELF_LAYOUT.santa < BOOKCASE.width), 'Four empty places left of the SANTA picture book, inside the bookcase');
  assert.ok(BOOK_SHEETS.some(sheet => sheet.id === 'santa-book') && LETTER_BOOKS.every(book => BOOK_SHEETS.some(sheet => sheet.id === book.id)), 'Every book spine is a cut picture');
  assert.ok(['hearth', 'shelf'].every(id => ROOM_SPOTS.some(spot => spot.id === id))); assert.ok(!ROOM_PROPS.some(prop => prop.id === 'fireplace' || prop.id === 'bookshelf'), 'The hearth and the bookcase are places to step up to, not just a caption');
  const { cabinGlyphs } = await import(pathToFileURL(path.join(project, 'js/data/cabin-glyphs.js')).href);
  assert.ok([...'HOLYMERSANT'].every(char => cabinGlyphs[char]?.d), 'Every letter on the books comes from the display face');
  const scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), hearth = await fs.readFile(path.join(project, 'js/components/cabin-hearth.js'), 'utf8'), entry = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8'), html = await fs.readFile(path.join(project, 'santa.html'), 'utf8');
  assert.ok(scene.includes('hearthAdd()') && scene.includes('blow()') && scene.includes('sheen.opacity = .14 + warmth') && scene.includes('fire.intensity = 2.2 + flicker * .4 + warmth'), 'One fire level drives the flames, the firelight and the gold glint');
  assert.ok(scene.includes('roomAway') && scene.includes('function back()') && scene.includes("event.preventDefault(); back();"), 'Stepping back from the hearth faces the room as before, one step at a time');
  assert.ok(hearth.includes('setPointerCapture') && hearth.includes("event.key !== 'Enter'") && hearth.includes('events.abort()') && hearth.includes('cabin.bellows(0)') && !hearth.includes('innerHTML'), 'Logs and bellows work by pointer and keyboard and let go of everything on leaving');
  assert.ok(/ROOMS = \[[^\]]*'hearth'[^\]]*'shelf'/.test(entry) && entry.includes("'← 回到房間'") && entry.includes('cabin?.back()') && entry.includes('!event.defaultPrevented'), 'The back button and Escape step back from the hearth to the room');
  assert.ok(html.includes('data-spot="hearth"') && html.includes('data-spot="shelf"'), 'The hearth and the bookcase can be reached from the keyboard list');
});
await test('Santa 屋內：書桌抽信、開信、翻面、蓋郵戳、火漆封回信，信件全為虛構', async () => {
  const { DESK, ROOM_SPOTS, BOARDS } = await import(pathToFileURL(path.join(project, 'js/components/cabin-art.js')).href);
  const { DESK_LETTERS, REPLY } = await import(pathToFileURL(path.join(project, 'js/data/cabin-letters.js')).href);
  assert.ok(ROOM_SPOTS.some(spot => spot.id === 'desk') && BOARDS.some(board => board.id === 'desk') && !BOARDS.some(board => board.id === 'lamp-table'), 'The side table became the writing desk');
  assert.deepEqual(Object.keys(DESK.items), ['outbox', 'stamp', 'stack', 'seal', 'cup', 'lamp']);
  assert.ok(Object.values(DESK.items).every(([x0, y0, x1, y1]) => x0 >= 0 && x1 <= 1 && x0 < x1 && y0 >= 0 && y1 <= 1 && y0 < y1), 'Every place on the desk lies on its sheet');
  assert.ok(DESK_LETTERS.length >= 4 && DESK_LETTERS.every(letter => letter.id && letter.body && letter.back?.sign && ['n', 'k', 'h'].includes(letter.back.hand)) && REPLY.body, 'Each letter has a back signed in one of several hands');
  assert.ok(new Set(DESK_LETTERS.map(letter => letter.back.sign)).size >= 3, 'More than one person signs for the letters');
  const desk = await fs.readFile(path.join(project, 'js/components/cabin-desk.js'), 'utf8'), data = await fs.readFile(path.join(project, 'js/data/cabin-letters.js'), 'utf8');
  assert.ok(!/firebase|wish-repository|publicWishes|localStorage/.test(desk + data), 'The desk never reads the Wish page or anyone’s real letters');
  assert.ok(desk.includes('setPointerCapture') && desk.includes('desk.sealed.push(id)') && desk.includes('desk.marked.push(id)') && desk.includes('desk.sent.push(entry.id)') && desk.includes('events.abort()') && !desk.includes('innerHTML'), 'A reply is sealed and postmarked by dragging or Enter, then sent; all kept in the progress record, every listener let go');
  const entry = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8'), html = await fs.readFile(path.join(project, 'santa.html'), 'utf8');
  assert.ok(/ROOMS = \[[^\]]*'desk'/.test(entry) && html.includes('data-spot="desk"'));
});
await test('Santa 屋內：音樂盒上發條（棘輪、越轉越慢、原創旋律只在網站音樂關著時響）與雪花球搖晃沉澱', async () => {
  const { ROOM_SPOTS, BOARDS, ROOM_RIGS } = await import(pathToFileURL(path.join(project, 'js/components/cabin-art.js')).href);
  assert.ok(['musicbox', 'globe'].every(id => ROOM_SPOTS.some(spot => spot.id === id)) && ROOM_RIGS.turntable && BOARDS.some(board => board.id === 'musicbox-scene' && board.clones === 2), 'The music box turns two crossed cut-outs on a rig of its own');
  const scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), box = await fs.readFile(path.join(project, 'js/components/cabin-musicbox.js'), 'utf8'), globe = await fs.readFile(path.join(project, 'js/components/cabin-globe.js'), 'utf8'), sounds = await fs.readFile(path.join(project, 'js/components/cabin-sound.js'), 'utf8');
  assert.ok(scene.includes('musicbox.energy - delta / 26') && scene.includes('!musicbox.held') && scene.includes('Math.PI * 6'), 'Three turns wind it fully; it runs down over time, not while a hand holds the key');
  assert.ok(box.includes('if (delta > 0) wind(delta)') && box.includes('is-resisting') && box.includes("'ArrowRight'") && box.includes('events.abort()'), 'Only clockwise winds it (the ratchet holds the other way), arrow keys and Enter work too');
  assert.ok(sounds.includes('const boxReady = () => !on()') && sounds.includes("const TUNE = [") && !/\.mp3|\.ogg|jingle bells|silent night/i.test(sounds), 'The tune is written here and plays only while the site music is off');
  assert.ok(globe.includes('cabin.showGlobe(false)') && globe.includes('cabin.showGlobe(true)') && globe.includes('now - stirred > 100') && globe.includes('ground(flake.x)') && globe.includes('cancelAnimationFrame(frame)'), 'The shaken globe stands in for the one on the mantel and gives it back; snow is stirred in measure and settles on the mound');
  const entry = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8'), html = await fs.readFile(path.join(project, 'santa.html'), 'utf8');
  assert.ok(entry.includes("'musicbox', 'globe'") && html.includes('data-spot="musicbox"') && html.includes('data-spot="globe"'));
});
await test('Santa 隱藏故事 P4：聖誕老人出門（固定規則）、MORE SANTA 書櫃解謎與轉開', async () => {
  const play = await fs.readFile(path.join(project, 'js/components/cabin-play.js'), 'utf8'), books = await fs.readFile(path.join(project, 'js/components/cabin-books.js'), 'utf8'), scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), chat = await fs.readFile(path.join(project, 'js/components/cabin-chat.js'), 'utf8');
  assert.ok(play.includes('santaGoes({ used: used.size') && play.includes("onUse: () => used.add('hearth')") && play.includes("onUse: () => used.add('desk')"), 'Santa goes out by a fixed rule after things are used in the room, never by the chat');
  assert.ok(!/santaGoes|solved\(|moveBook/.test(chat), 'The chat cannot move the story');
  assert.ok(books.includes('const home = cabin.santaHome') && books.includes('button.disabled = home || done') && books.includes('solved(shelf)') && books.includes("'需要提示嗎？'") && books.includes('真的要看答案嗎？'), 'Books stay put while Santa is home; MORE is checked by the rules; hints come one at a time and the answer only when asked twice');
  assert.ok(books.includes('setPointerCapture') && books.includes("event.key === 'Escape' && picked >= 0") && books.includes('events.abort()') && !books.includes('innerHTML'), 'Drag or tap-then-place, Escape puts a picked book back, every listener let go');
  assert.ok(scene.includes("restyle('front-in', { coat: false })") && scene.includes('story.scripted = true') && scene.includes('if (!santaModel || story.away) return false') && scene.includes('storyTimers.forEach(clearTimeout)'), 'Going out: the coat leaves its peg, the controls wait for the little scene, an empty chair cannot be talked to, timers go with the page');
  assert.ok(scene.includes("restyle('back', open ? { secret: true } : undefined)") && scene.includes('secret.visible = story.open > 0 && indoorView(view)'), 'The back wall opens behind the bookcase, and the little room is drawn only from indoors');
  const { SECRET, BOOKCASE } = await import(pathToFileURL(path.join(project, 'js/components/cabin-art.js')).href);
  assert.ok(SECRET.left >= BOOKCASE.left && SECRET.left + SECRET.width <= BOOKCASE.left + BOOKCASE.width, 'The doorway is hidden behind the closed bookcase');
  const paint = await fs.readFile(path.join(project, 'js/components/cabin-paint.js'), 'utf8');
  assert.ok(paint.includes("'front-in': [{ coat: false }]") && paint.includes('back: [{ secret: true }]'), 'The coatless wall and the opened wall are cut ahead');
});
await test('Santa 隱藏故事 P5：書櫃後的小房間、第一次反轉、聖誕老人回來，與前後呼應的線索', async () => {
  const { BOARDS, ROOM_SPOTS, SUBSTITUTES } = await import(pathToFileURL(path.join(project, 'js/components/cabin-art.js')).href);
  const { NAMES, SHIFTS, RULES, NOTES } = await import(pathToFileURL(path.join(project, 'js/data/cabin-secret.js')).href);
  const { DESK_LETTERS } = await import(pathToFileURL(path.join(project, 'js/data/cabin-letters.js')).href);
  assert.ok(ROOM_SPOTS.some(spot => spot.id === 'secret' && spot.view.turn > 0) && BOARDS.filter(board => board.secret).length === 5, 'The little room is a place to look round, with five things on its walls');
  assert.ok(SUBSTITUTES.every(([char]) => NAMES[char]) && DESK_LETTERS.every(letter => NAMES[letter.back.sign[0]]), 'Every initial on the desk has a name tag behind the bookcase');
  assert.ok(SHIFTS.some(([date, , , handover]) => date === '12/24' && handover.includes('完成')), 'The night of 12/24 matches the note in the barn');
  assert.ok(NOTES.known.includes('原來，聖誕老人不只一位') && !Object.values(NOTES).join('').includes('從來不只是一個人') && !RULES.lines.join('').includes('實現了'), 'The first discovery is told; the deeper one is kept for later');
  const secret = await fs.readFile(path.join(project, 'js/components/cabin-secret.js'), 'utf8'), play = await fs.readFile(path.join(project, 'js/components/cabin-play.js'), 'utf8'), scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8');
  assert.ok(secret.includes('knowsSantas(story.seen)') && secret.includes('cancelAnimationFrame(frame)') && !secret.includes('innerHTML'), 'The secret is known by the rules once the three clues are read; the buttons follow the view and let go');
  assert.ok(play.includes('santaReturns({ home: cabin.santaHome') && scene.includes('santaReturn()') && scene.includes('restyled.delete(board.id)'), 'Santa comes home once the secret is known; a look set before a board arrives is applied when it does');
  const wardrobe = await fs.readFile(path.join(project, 'js/components/cabin-wardrobe.js'), 'utf8'), feed = await fs.readFile(path.join(project, 'js/components/cabin-feed.js'), 'utf8'), world = await fs.readFile(path.join(project, 'js/components/cabin-world.js'), 'utf8');
  assert.ok(wardrobe.includes('今天怎麼又多了一位聖誕老人') && feed.includes('今天的聖誕老人記得帶地衣來了') && feed.includes('上次那位總是記錯牠喜歡什麼') && world.includes('謝謝昨晚幫忙修好摩天輪的人'), 'Small clues outside, in words only');
});
await test('Santa 屋內修正：每個家具都點得到、小房間的紙不貼牆、彩燈跟著樹動、書桌逐步提示', async () => {
  const { ROOM_SPOTS, ROOM_PROPS, INSIDE, BOARDS, SECRET } = await import(pathToFileURL(path.join(project, 'js/components/cabin-art.js')).href);
  // From the middle of the room, a line to each place's centre must meet that place's own tap target first.
  const boxes = [...ROOM_SPOTS.map(spot => [spot.id, spot.box]), ...ROOM_PROPS.filter(prop => prop.box).map(prop => [prop.id, prop.box])];
  const enter = (o, d, [[cx, cy, cz], [w, h, z]]) => { let t0 = 0, t1 = Infinity; for (const [oi, di, c, s] of [[o[0], d[0], cx, w], [o[1], d[1], cy, h], [o[2], d[2], cz, z]]) { const lo = c - s / 2, hi = c + s / 2; if (Math.abs(di) < 1e-9) { if (oi < lo || oi > hi) return null; continue; } let a = (lo - oi) / di, b = (hi - oi) / di; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return null; } return t0; };
  for (const spot of ROOM_SPOTS.filter(spot => !['secret', 'shelf'].includes(spot.id))) {
    const direction = spot.box[0].map((value, i) => value - INSIDE.eye[i]);
    const first = boxes.map(([id, box]) => [id, enter(INSIDE.eye, direction, box)]).filter(([, t]) => t !== null).sort((a, b) => a[1] - b[1])[0]?.[0];
    assert.equal(first, spot.id, `From the middle of the room, tapping the ${spot.id} reaches it`);
  }
  // A sheet's paper edge lies 1.2 cm behind it: sheets on the little room's walls stand further off than that from the
  // walls' inner face (the walls stand inside the doorway, `SECRET.wall` thick, so they do not line up with the back wall).
  const shell = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8');
  assert.ok(SECRET.wall > 0 && shell.includes('new THREE.Vector3(mid, height - wall / 2, BACK_WALL - depth / 2)') && shell.includes('for (const x of [left + wall / 2, left + width - wall / 2])'), 'The little room\'s ceiling and walls stand inside the doorway, not in line with the back wall');
  for (const board of BOARDS.filter(board => board.secret && board.turn)) {
    const gap = board.turn > 0 ? board.at[0] - SECRET.left - SECRET.wall : SECRET.left + SECRET.width - SECRET.wall - board.at[0];
    assert.ok(gap >= .025, `${board.id} stands clear of its wall, so its edge does not flicker against it`);
  }
  const scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), desk = await fs.readFile(path.join(project, 'js/components/cabin-desk.js'), 'utf8');
  assert.ok(scene.includes("const COMPANIONS = { tree: ['tree-lights'] }") && scene.includes('together(id, sheet => { sheet.holder.rotation.z'), 'The tree lights sway and lift with the tree');
  assert.ok(desk.includes("element('p', 'desk-guide', work)") && desk.includes("tools.stamp.classList.toggle('is-ready'") && desk.includes("tools.seal.classList.toggle('is-ready'"), 'The desk says what can be done next and lights up the tool that can be used');
});
await test('Santa 書櫃解開後可以手動開關：點書櫃走過去近看、在近看時關上或推開、離開小房間時可順手關上', async () => {
  const scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8'), play = await fs.readFile(path.join(project, 'js/components/cabin-play.js'), 'utf8'), books = await fs.readFile(path.join(project, 'js/components/cabin-books.js'), 'utf8'), secret = await fs.readFile(path.join(project, 'js/components/cabin-secret.js'), 'utf8');
  assert.ok(scene.includes("caseTarget.userData = { bookcase: true }; rigs.get('bookcase').add(caseTarget)") && scene.includes("else if (hit?.bookcase) setView('shelf')") && scene.includes("data.spot === 'secret' ? open : data.spot !== 'shelf'"), 'The bookcase can be tapped wherever it stands, open or shut, and that steps up to it');
  assert.ok(scene.includes("story.mend = setTimeout(") && scene.includes('story.open < .01'), 'Shutting, the wall behind is mended only once the case covers the doorway');
  assert.ok(scene.includes('raycaster.intersectObject(santaModel, true)'), 'Only a tap on Santa himself counts as one: the bookcase behind him can be tapped');
  assert.ok(play.includes('story.shut = !open; save(); cabin.openBookcase(open)') && play.includes('cabin.openBookcase(!progress.story.shut, false)'), 'Open or shut is kept, and comes back so');
  assert.ok(books.includes("'推開書櫃 →'") && secret.includes("'離開，關上書櫃 ↺'") && secret.includes('setTimeout(onShut, 1300)'), 'From the keyboard too: push it open from the shelf; leave the little room and shut it once clear of its swing');
});
await test('Santa 書櫃可以再玩一次：開著時近看可進小房間或關上，關上後書能重排、重新拼出 MORE 會再轉開一次', async () => {
  const play = await fs.readFile(path.join(project, 'js/components/cabin-play.js'), 'utf8'), books = await fs.readFile(path.join(project, 'js/components/cabin-books.js'), 'utf8'), page = await fs.readFile(path.join(project, 'js/santa.js'), 'utf8');
  assert.ok(books.includes('if (story.opened && !story.shut)') && books.includes("'走進小房間 →'") && books.includes("'關上書櫃 ↺'") && books.includes('toggle(false); later(2800, restart)'), 'Standing open, up close: go in, or shut it and the shelf is played again');
  assert.ok(books.includes('const replay = story.opened') && books.includes('const home = cabin.santaHome && !replay'), 'Shut again, the books come down whether Santa is home or not');
  assert.ok(books.includes("push.hidden = !replay || done || !solved(shelf)") && books.includes('toggle(true); later(2800, restart)'), 'It can simply be pushed open only while the books still spell MORE');
  assert.ok(books.includes('story.opened = true; story.shut = false; save(); onOpen()'), 'Spelling MORE again opens it again, with the same flash and creak');
  assert.ok(play.includes("restart: () => start('shelf')") && play.includes('enter: start') && !play.includes('swing: () => swing()'), 'The shelf game restarts in place; the bookcase is no longer worked from afar');
  assert.ok(page.includes("onTouch: (id, note) => { if (id === 'wheel' && play?.wheelOpen) play.enter('wheel'); else if (note) play?.note(note); }") && page.includes('cabin?.setView(button.dataset.spot); back.focus()'), 'The page sends 看看書櫃 to the bookcase itself, open or shut');
});
await test('Santa 拖曳不會卡住：放開被攔下時（例如瀏覽器擴充功能）仍會結束拖曳，書一次只拿一本、Esc 只放回書', async () => {
  const dir = path.join(project, 'js/components'), files = (await fs.readdir(dir)).filter(name => name.startsWith('cabin-') && name.endsWith('.js'));
  for (const name of files) {
    const source = await fs.readFile(path.join(dir, name), 'utf8');
    if (source.includes('setPointerCapture')) assert.ok(source.includes('lostpointercapture'), `${name}: a drag that captures the pointer also ends when the capture is lost`);
  }
  const books = await fs.readFile(path.join(dir, 'cabin-books.js'), 'utf8'), scene = await fs.readFile(path.join(dir, 'cabin-scene.js'), 'utf8');
  assert.ok(books.includes("window.addEventListener(type, handler, { capture: true, signal: events.signal })") && books.includes('cabin.dropBook(id)') && books.includes("if (drag) letGo({ type: 'pointercancel', pointerId: drag.pointer })"), 'A book drag is followed on the window, remembers its book, and a book still in hand goes back first');
  assert.ok(scene.includes('if (other !== mesh && other.userData.held)') && scene.includes('mesh.userData.held = false; mesh.rotation.z = 0; } });'), 'Only one book is ever held; laying out the shelf leaves none in hand');
  assert.ok(books.includes("document.addEventListener('keydown', event => { if (event.key === 'Escape' && picked >= 0)") && books.includes('capture: true, signal: events.signal });'), 'Esc puts a picked book back before the page takes it as stepping out');
});
await test('Santa 空搖椅有座面：聖誕老人出門時才出現，紙條立在座面上', async () => {
  const art = await fs.readFile(path.join(project, 'js/components/cabin-art.js'), 'utf8'), scene = await fs.readFile(path.join(project, 'js/components/cabin-scene.js'), 'utf8');
  assert.ok(art.includes("{ id: 'chair-seat', w: .74, h: .5, at: [0, .335, -.04], flat: 'seat', draw: chairSeat, chair: true }") && art.includes("at: [0, .34, -.24], draw: chairNote"), 'A level seat between the chair back and front legs, the note standing on it');
  assert.ok(scene.includes("if (board.flat === 'seat') holder.rotation.x = -Math.PI / 2;") && scene.includes("for (const id of ['chair-note', 'chair-seat'])") && scene.includes('holder.visible = story.away'), 'Laid level, and shown only while Santa is out (his thighs dip below its front edge)');
});
await test('Santa 替身工作：登記簿簽縮寫加入，四件工作各在第一次完成時蓋章，摩天輪壞了要修', async () => {
  const read = name => fs.readFile(path.join(project, name), 'utf8');
  const [secret, play, feed, pulley, desk, wheel, scene, art, page] = await Promise.all(['js/components/cabin-secret.js', 'js/components/cabin-play.js', 'js/components/cabin-feed.js', 'js/components/cabin-pulley.js', 'js/components/cabin-desk.js', 'js/components/cabin-wheel.js', 'js/components/cabin-scene.js', 'js/components/cabin-art.js', 'js/santa.js'].map(read));
  const { JOBS, REGISTER } = await import(pathToFileURL(path.join(project, 'js/data/cabin-secret.js')).href), { VOLUNTEER_LETTERS } = await import(pathToFileURL(path.join(project, 'js/data/cabin-letters.js')).href), { TASKS } = await import(pathToFileURL(path.join(project, 'js/services/cabin-story.js')).href);
  assert.deepEqual(Object.keys(JOBS), TASKS); assert.equal(VOLUNTEER_LETTERS.length, 2); assert.ok(VOLUNTEER_LETTERS.every(entry => !entry.back.sign && entry.back.hand === 'you'), 'The new letters are signed with the visitor\'s own initial');
  assert.ok(REGISTER.rows.some(([mark, count]) => mark === 'H' && count === REGISTER.full), 'Holly\'s row is already full, and she is still on the shift log');
  assert.ok(secret.includes("else if (id === 'register' && knowsSantas(story.seen)) register(page, from);") && secret.includes('if (!canSign(char)) { tile.disabled = true;') && secret.includes("if (!leave.dataset.sure)"), 'The register is signed once the secret is known; taken initials cannot be chosen; leaving takes a second press');
  assert.ok(play.includes("if (!record(progress.volunteer, id)) return;") && play.includes("onTask: () => task('lichen')") && play.includes("onTask: () => task('hay')") && play.includes("onTask: () => task('letters')") && play.includes("onMended: () => { task('wheel'); cabin.wheelBroken(false); }"), 'Each of the four jobs reports to one place, where the rule decides');
  assert.ok(feed.includes("const lichenOnly = full(progress) && wants();") && pulley.includes("settle(); onTask();") && desk.includes('if (VOLUNTEER_LETTERS.every(each => desk.sent.includes(`reply-${each.id}`))) onTask();'), 'Lichen even when he is full, the hay hooked, both new letters answered and sent');
  assert.ok(scene.includes('fair.speed += ((fair.broken ? 0 : 1) - fair.speed)') && scene.includes('wheelBroken(broken, animate = true)') && page.includes("if (id === 'wheel' && play?.wheelOpen) play.enter('wheel');"), 'Signed up, the big wheel slows to a stop, and a tap on it opens it to be mended');
  assert.ok(wheel.includes("import { CRANK, PEGS, PIECES, WHEEL, drive, link, radius } from '../services/cabin-gears.js';") && wheel.includes("on(piece.node, 'lostpointercapture', drop)") && wheel.includes("['ArrowRight', 'ArrowDown', 'Enter', ' ']") && wheel.includes('if (run.stop === \'jam\')'), 'The wheel is mended in its gearbox, by pointer or keyboard, with the rules in cabin-gears.js');
  assert.ok(art.includes('open: { target: [SECRET.left + SECRET.width * .62, .7, BOOKCASE.z + .15], yaw: .55 }') && scene.includes("if (view === 'shelf') aim('shelf');"), 'Standing open, the bookcase is looked at from the side, into the doorway');
  assert.ok(scene.includes('settings = settingsOf(name);') && scene.includes('const home = () => { const settings = settingsOf(view);'), 'The aim and the turning limit read the same settings, so a resize or a drag does not swing the view back and forth');
  assert.ok(wheel.includes("place(wheel, WHEEL.at, 90); paperLayer(wheel, '0 0 180 180', '', spokes, PAPER)"), 'The wheel\'s spokes are drawn whole round its hub, so no gap turns into view');
  const paper = await read('js/components/cabin-paper.js');
  assert.ok(paper.includes(".gearbox-actions button, .desk-actions button, .register-sign', 'tag']") && wheel.includes("paperLayer(banner, '0 0 300 72', '', ribbon, PAPER)") && wheel.includes('function door(parent)') && play.includes("paperLayer(stamp, '0 0 120 144', '', postage, STAMP)"), 'The gearbox has a ribbon banner, a paper door and plain paper buttons; a job done lands as a postage stamp');
});
await test('Santa 回信桌：收到的信換紙讀、翻面；回信摺進航空信封、封口、蓋郵戳、投進郵袋；替身挑一句回覆', async () => {
  const desk = await fs.readFile(path.join(project, 'js/components/cabin-desk.js'), 'utf8'), paper = await fs.readFile(path.join(project, 'js/components/cabin-paper.js'), 'utf8');
  const { DESK_LETTERS, VOLUNTEER_LETTERS } = await import(pathToFileURL(path.join(project, 'js/data/cabin-letters.js')).href);
  assert.ok([...DESK_LETTERS, ...VOLUNTEER_LETTERS].every(entry => ['kid', 'pad'].includes(entry.paper)) && VOLUNTEER_LETTERS.every(entry => entry.name && entry.answers.length === 3), 'Each letter has its own paper; each new letter has three things a volunteer may answer');
  assert.ok(desk.includes("if (kind === 'stamp' && sealed && !desk.marked.includes(id)) return postage;") && desk.includes("if (!current || current.kind !== 'out' || current.step !== 'envelope') return null;"), 'Only a reply in its envelope takes the seal, then the postmark: letters that came in are never stamped');
  assert.ok(desk.includes('desk.answers[answered.id] = current.choice;') && desk.includes('desk.sealed = desk.sealed.filter(id => id !== reply.id); desk.marked = desk.marked.filter(id => id !== reply.id); save();') && desk.includes("buttons.fold.disabled = step === 'compose' && current.choice === undefined;"), 'A volunteer\'s answer counts once the reply is folded in');
  assert.ok(paper.includes("['.desk-letter[data-paper=\"kid\"] .letter-face', 'lined']") && paper.includes("['.desk-envelope[data-kind=\"out\"]', 'airmail']") && paper.includes("['.envelope-wax', 'wax']") && paper.includes("attributeFilter: ['aria-pressed', 'data-paper', 'data-kind', 'data-thing']"), 'The desk\'s papers, envelopes, stamps and wax are drawn as paper, and drawn again when the letter or envelope changes');
});
await test('Santa 紙片不再一律信紙加虛線：按鈕是素紙、字幕貼膠帶、信角冬青，小房間的東西各畫成自己的樣子', async () => {
  const css = await fs.readFile(path.join(project, 'css/santa.css'), 'utf8'), paper = await fs.readFile(path.join(project, 'js/components/cabin-paper.js'), 'utf8'), secret = await fs.readFile(path.join(project, 'js/components/cabin-secret.js'), 'utf8');
  assert.ok(!css.includes('dashed') && !paper.includes('stroke-dasharray'), 'No dashed lines round the boxes and buttons');
  assert.ok(paper.includes("tag: ['#b5443c', '#7f312c'],") && paper.includes("pinned: ['#fbf3df', '#dccaa9', 'tape']") && paper.includes("letter: ['#fffdf6', '#e4d6bf', 'holly']"), 'Buttons are plain paper (nothing to tire the eye), captions taped up, Santa\'s letter has holly');
  assert.ok(["['.secret-card[data-thing=\"tags\"] .secret-tags li', 'label']", "['.secret-card[data-thing=\"tags\"], .gearbox', 'board']", "['.secret-card[data-thing=\"log\"]', 'clipboard']", "['.secret-card[data-thing=\"register\"]', 'ledger']", "['.secret-card[data-thing=\"rules\"]', 'booklet']"].every(kind => paper.includes(kind)) && css.includes('.cabin[data-paper] :is(.secret-card,'), 'The name board and its tags, the clipboard, the ledger and the booklet are drawn as paper, not flat boxes');
  assert.ok(secret.includes("card.dataset.thing = id === 'register'") && ['register', 'tags', 'log', 'rules', 'note'].every(thing => css.includes(`.secret-card[data-thing="${thing}"]`)), 'The ledger, the name board, the clipboard, the booklet and index cards each look like themselves');
});
await test('Santa 替身工作都能重玩：只有第一次蓋章（摩天輪的動力箱、書桌的回信）', async () => {
  const read = name => fs.readFile(path.join(project, name), 'utf8');
  const [play, desk, wheel] = await Promise.all(['js/components/cabin-play.js', 'js/components/cabin-desk.js', 'js/components/cabin-wheel.js'].map(read));
  assert.ok(play.includes("get wheelOpen() { return pending(progress.volunteer, 'wheel') || progress.volunteer.tasks.includes('wheel'); }") && play.includes("again: !pending(progress.volunteer, 'wheel')") && wheel.includes('again = false'), 'Once mended, the wheel\'s gearbox opens again to be played');
  assert.ok(desk.includes("signedUp(volunteer) && !pending(volunteer, 'letters') ? VOLUNTEER_LETTERS.filter(entry => !answered(entry))") && desk.includes('if (entry.letter) { delete desk.answers[entry.letter];'), 'Once the letters are answered, they come round in the bundle and can be answered again, with a fresh envelope');
  assert.ok(play.includes('if (!record(progress.volunteer, id)) return;'), 'Only the first time counts: record() stamps a job once');
});
await test('Santa 卡片的字只在內頁裡捲，不會跑到封面或木框上；帳本內頁沒有不跟著捲的線', async () => {
  const read = name => fs.readFile(path.join(project, name), 'utf8');
  const [secret, wheel, paper, css] = await Promise.all(['js/components/cabin-secret.js', 'js/components/cabin-wheel.js', 'js/components/cabin-paper.js', 'css/santa.css'].map(read));
  assert.ok(secret.includes("const page = element('div', 'secret-body', card);") && wheel.includes("const inside = element('div', 'gearbox-body', box);"), 'The words go in a page of their own inside the card and the case');
  assert.ok(css.includes('.cabin .secret-card { display: flex; flex-direction: column; overflow: hidden; }') && css.includes('.secret-body { min-height: 0; overflow: auto;') && css.includes('.gearbox-body { min-height: 0; overflow: auto;'), 'The card and the case stand still; only their page scrolls');
  const ledger = paper.slice(paper.indexOf('ledger(paper, width, height, seed)'), paper.indexOf('booklet(paper'));
  assert.ok(!ledger.includes('#e8a3a0') && !ledger.includes('#e5d8bc') && ledger.includes('long = 26'), 'The ledger page has no margin line or rules standing still under scrolling words; its ribbon stays on the cover');
});
await test('Santa 故事結尾：紅繩舊頁（第二次反轉）、三個章許願、四件工作留下、結局 A～D', async () => {
  const read = name => fs.readFile(path.join(project, name), 'utf8');
  const [play, secret, finaleUi, paint, paper] = await Promise.all(['js/components/cabin-play.js', 'js/components/cabin-secret.js', 'js/components/cabin-finale.js', 'js/components/cabin-paint.js', 'js/components/cabin-paper.js'].map(read));
  const { WISHES, ENDINGS, OLD_PAGE } = await import(pathToFileURL(path.join(project, 'js/data/cabin-finale.js')).href);
  assert.deepEqual(WISHES.map(wish => wish.id), ['sleigh', 'snow', 'gift', 'blessing']); assert.deepEqual(Object.keys(ENDINGS), ['A', 'B', 'C', 'D']);
  assert.ok(OLD_PAGE.entry.includes('2003') && OLD_PAGE.entry.includes('H.'), 'Holly\'s old page matches the snow globe (H. · 2003)');
  assert.ok(secret.includes('if (finale.twist || canUntie(volunteer))') && secret.includes('if (canWish(volunteer, finale))') && secret.includes('if (canStay(volunteer, finale))') && secret.includes('if (!finale.twist) onTwist();'), 'The register unties the old page, offers a wish, the log offers the early shift, each by the rules');
  assert.ok(play.includes("if ((kind === 'B' || kind === 'C') && trueMiracle(finale)) ending('D');") && play.includes('if (visited && goesHome(progress))') && play.includes("cabin.repaint('secret-tags', { mine: true })"), 'D follows B or C once the old page is known; A only after a visit; the visitor\'s tag hangs on the board');
  assert.ok(finaleUi.includes('export function wishScene') && finaleUi.includes('export function endingCard') && !finaleUi.includes('innerHTML'), 'Wish scenes and ending cards, text only through textContent');
  assert.ok(paint.includes("'secret-tags': [{ mine: true }]") && paper.includes("['.finale-card', 'certificate']") && paper.includes("['.secret-card[data-thing=\"oldpage\"]', 'oldpage']"), 'The board with the visitor\'s tag is drawn ahead; the ending cards and the old page are drawn as paper');
});
await test('Wish 夜景：紙雕場景、滑鼠點亮聖誕燈、收藏區已移除', async () => {
  const html = await fs.readFile(path.join(project, 'wish.html'), 'utf8'), lights = await fs.readFile(path.join(project, 'js/components/wish-lights.js'), 'utf8'), css = await fs.readFile(path.join(project, 'css/wish.css'), 'utf8');
  assert.ok(!html.includes('wish-keepsakes') && !html.includes('envelope-list" id="envelope-list"'));
  assert.ok(lights.includes('pointermove') && lights.includes('LINGER') && css.includes('.wish-lights i.is-lit'));
  assert.ok((await fs.readFile(path.join(project, 'js/wish.js'), 'utf8')).includes('mountNightScene(room)'));
});
await test('Admin：三種狀態分頁、撤回與重新同意都有入口，規則沒有放寬', async () => {
  const js = await fs.readFile(path.join(project, 'js/admin.js'), 'utf8'), repo = await fs.readFile(path.join(project, 'js/services/wish-repository-core.js'), 'utf8'), html = await fs.readFile(path.join(project, 'admin.html'), 'utf8');
  for (const status of ['pending', 'approved', 'rejected']) assert.ok(html.includes(`data-status="${status}"`), status);
  assert.ok(js.includes('撤回公開') && js.includes('重新同意') && js.includes('confirm('));
  assert.ok(/wishesByStatus[\s\S]*?sdk\.limit\(50\)/.test(repo), 'Every page stays within the rules limit');
  assert.ok(js.includes('textContent=wish.content') && !js.includes('innerHTML'), 'Visitor text is never parsed as HTML');
});
await test('Wish 小屋與郵票：白煙、開門人物、郵票只留本機、訪客不用管連線', async () => {
  const html = await fs.readFile(path.join(project, 'wish.html'), 'utf8'), js = await fs.readFile(path.join(project, 'js/wish.js'), 'utf8'), cottage = await fs.readFile(path.join(project, 'js/components/wish-cottage.js'), 'utf8'), css = await fs.readFile(path.join(project, 'css/wish.css'), 'utf8'), repo = await fs.readFile(path.join(project, 'js/services/wish-repository-core.js'), 'utf8');
  assert.ok(!html.includes('cloud-retry') && html.includes('data-tone="night"') && html.includes('name="stamp"'));
  assert.ok(cottage.includes("'cottage-door'") && (cottage.match(/^  \['/gm) ?? []).length === 5 && cottage.includes('guest.classList.remove') && cottage.includes("classList.remove('door-open')"));
  assert.ok(css.includes('@keyframes smoke-rise') && css.includes('@keyframes sock-hover'));
  assert.ok(js.includes('setTimeout(connectCloud,retryDelay)'));
  assert.ok(!/\bstamp\b/.test(repo), 'Stored letter fields must stay exactly what the rules allow');
});
await test('頁尾互動主角：五頁各一個，遵守減少動態，全頁只留一個重點', async () => {
  const toys = await fs.readFile(path.join(project, 'js/components/foreground-toys.js'), 'utf8'), css = await fs.readFile(path.join(project, 'css/shared.css'), 'utf8');
  assert.ok(/const TOYS = \{ home: sled, intro: globe, game: surpriseBox, wish: wishingStar, santa: jingleBell \}/.test(toys));
  assert.ok((toys.match(/motion\(\)\.matches/g) ?? []).length >= 3); assert.ok(css.includes('.toy-button:focus-visible'));
  for (const page of ['index', 'intro', 'game', 'wish', 'santa']) assert.ok((await fs.readFile(path.join(project, `${page}.html`), 'utf8')).includes('data-foreground='), page);
});
await test('導覽燈串：五頁共用、等 Loading 結束才跑光、沒有 JS 時仍是一般連結', async () => {
  const shared = await fs.readFile(path.join(project, 'js/shared.js'), 'utf8'), lights = await fs.readFile(path.join(project, 'js/components/nav-lights.js'), 'utf8');
  const loader = await fs.readFile(path.join(project, 'js/site-loader.js'), 'utf8'), css = await fs.readFile(path.join(project, 'css/shared.css'), 'utf8');
  assert.ok(shared.includes('mountNavLights(nav)') && shared.includes("'pagehide'") && shared.includes('event.persisted'));
  assert.ok(loader.includes('site-loader:done') && lights.includes('site-loader:done') && lights.includes('prefers-reduced-motion'));
  assert.ok(css.includes('.site-nav.is-strung a') && !lights.includes('innerHTML'), 'The pills stay until JS builds the tags');
  assert.ok(!(await fs.readFile(path.join(project, 'index.html'), 'utf8')).includes('nav-tag'), 'Tags are decoration added by JS, not markup');
});
await test('首頁壓縮模型：骨架與動畫和原檔一致，體積明顯較小，頁面載入的是壓縮版', async () => {
  const gltf = async name => { const glb = await fs.readFile(path.join(project, `assets/models/${name}.glb`)); return { bytes: glb.length, data: JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim()) }; };
  for (const name of ['santa-dance', 'reindeer']) {
    const source = await gltf(name), web = await gltf(`${name}-web`);
    assert.ok(web.bytes < 2e6 && web.bytes < source.bytes / 5, name);
    assert.deepEqual(web.data.nodes.map(node => node.name), source.data.nodes.map(node => node.name));
    assert.equal(web.data.skins[0].joints.length, source.data.skins[0].joints.length);
    assert.deepEqual(web.data.animations.map(clip => [clip.name, clip.channels.length]), source.data.animations.map(clip => [clip.name, clip.channels.length]));
  }
  const scene = await fs.readFile(path.join(project, 'js/components/characters-scene.js'), 'utf8');
  assert.ok(scene.includes('santa-dance-web.glb') && scene.includes('reindeer-web.glb') && scene.includes('setMeshoptDecoder'));
});
await test('背景音樂：五頁選單一致、不寫死 autoplay、壓縮音檔與清單相符、原檔保留', async () => {
  const blocks = []; for (const page of ['index', 'intro', 'game', 'wish', 'santa']) { const html = await fs.readFile(path.join(project, `${page}.html`), 'utf8'); blocks.push(html.match(/<div class="music-widget">[\s\S]*?<\/audio>\s*<\/div>/)[0]); assert.ok(!html.includes('music-file') && !/<audio[^>]*autoplay/.test(html), page); }
  assert.equal(new Set(blocks).size, 1, 'The widget markup must stay identical on every page');
  const manifest = JSON.parse(await fs.readFile(path.join(project, 'docs/AUDIO-ASSETS.json'), 'utf8'));
  assert.equal(manifest.tracks.length, 5);
  for (const track of manifest.tracks) {
    const bytes = await fs.readFile(path.join(project, 'assets/audio', track.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), track.sha256); assert.ok(bytes.length < 2.1e6 && bytes.length < track.sourceBytes * .6, track.file);
    await fs.access(path.join(project, 'assets', track.source));
  }
  const shared = await fs.readFile(path.join(project, 'js/shared.js'), 'utf8');
  for (const call of ['mountMusic()', 'mountNavLights(nav)', "mountForeground(document.querySelector('.page-foreground'))", 'mountSantaPlaceholders()']) assert.ok(shared.includes(call), call);
  const player = await fs.readFile(path.join(project, 'js/components/music-player.js'), 'utf8');
  assert.ok(player.includes('NotAllowedError') && player.includes('waitForGesture') && !player.includes('innerHTML'));
  assert.ok((await fs.readFile(path.join(project, 'css/shared.css'), 'utf8')).includes('prefers-reduced-motion'));
});
await test('設計規格：三種字型、三級字級，全部走設計變數', async () => {
  const tokens = await fs.readFile(path.join(project, 'css/tokens.css'), 'utf8'), families = new Set();
  for (const name of ['--fs-title', '--fs-body', '--fs-small', '--font-body', '--font-display', '--font-hand']) assert.ok(tokens.includes(name), name);
  for (const file of (await fs.readdir(path.join(project, 'css'))).filter(name => !name.startsWith('game2-') && name !== 'loader.css')) {
    const css = await fs.readFile(path.join(project, 'css', file), 'utf8');
    for (const [, value] of css.matchAll(/font-size:\s*([^;}]+)/g)) assert.match(value.trim(), /^(var\(--fs-(title|body|small)\)|inherit)$/, `${file}: ${value}`);
    for (const [, name] of css.matchAll(/@font-face\s*\{\s*font-family:\s*([^;]+);/g)) families.add(name);
  }
  assert.ok(families.size <= 2, 'Only the title and handwriting faces are downloaded; body text uses the system font');
  assert.ok(!/--font-(display|hand):[^;]*\bserif\b(?<!sans-serif)/.test(tokens), 'Chinese must not fall back to a serif face');
});
await test('頁面大標題：SVG 逐字紙片、共用晃動動畫、HTML 保留文字', async () => {
  const shared = await fs.readFile(path.join(project, 'css/shared.css'), 'utf8'), art = await fs.readFile(path.join(project, 'js/components/title-art.js'), 'utf8');
  assert.ok(shared.includes('@keyframes letter-wobble') && art.includes("'title-letter'") && art.includes('sr-only') && !art.includes('innerHTML'));
  const wish = await fs.readFile(path.join(project, 'wish.html'), 'utf8'), glyphs = await fs.readFile(path.join(project, 'js/data/heading-glyphs.js'), 'utf8');
  assert.ok(wish.includes('>The Wish Room</h1>'), 'Titles stay readable without JavaScript');
  assert.ok(glyphs.includes('christmas-games') && glyphs.includes('the-wish-room') && !glyphs.includes('santa-flying'), 'Only page titles are drawn; section headings stay text');
});
await test('讀信：信封開啟動畫、同款信紙、保留原生對話框與文字欄位', async () => {
  const html = await fs.readFile(path.join(project, 'wish.html'), 'utf8'), reader = await fs.readFile(path.join(project, 'js/components/wish-reader.js'), 'utf8'), css = await fs.readFile(path.join(project, 'css/wish-delivery.css'), 'utf8');
  assert.ok(html.includes('<dialog id="wish-dialog"') && !/id="wish-dialog"[\s\S]*?data-close-dialog[\s\S]*?<\/dialog>/.test(html.match(/<dialog id="wish-dialog"[\s\S]*?<\/dialog>/)[0]), 'Closing goes through the folding animation');
  for (const id of ['wish-dialog-title', 'wish-dialog-date', 'wish-dialog-content', 'wish-dialog-privacy', 'wish-dialog-stamp']) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(reader.includes("'cancel'") && reader.includes('prefers-reduced-motion') && reader.includes('airmailLetter') && !reader.includes('innerHTML'));
  assert.ok(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*\.is-opening/.test(css), 'The letter must stay readable without animation');
});
await test('Loading：五頁各自主題、有時間上限、頁面動畫等它結束、畫面不依賴下載', async () => {
  const js = await fs.readFile(path.join(project, 'js/site-loader.js'), 'utf8'), css = await fs.readFile(path.join(project, 'css/loader.css'), 'utf8');
  for (const [page, kind] of [['index', 'home'], ['intro', 'intro'], ['game', 'game'], ['wish', 'wish'], ['santa', 'santa']]) {
    const html = await fs.readFile(path.join(project, `${page}.html`), 'utf8');
    assert.ok(html.includes(`data-loader="${kind}"`), page); assert.match(html, /<body[^>]*>\s*<script src="js\/site-loader\.js/, 'Runs before the page paints');
    assert.ok(new RegExp(`\\b${kind}: (function|')`).test(js), kind);
  }
  assert.ok(js.includes('MAX_WAIT') && css.includes('animation-play-state: paused') && css.includes('prefers-reduced-motion'));
  assert.ok(js.includes('room.cloud !== undefined') && js.includes('room.envelopes'), 'Wish waits for the letters as well as the tree');
  const wishHtml = await fs.readFile(path.join(project, 'wish.html'), 'utf8'), sdk = await fs.readFile(path.join(project, 'js/services/firebase-sdk.js'), 'utf8');
  const sdkVersion = sdk.match(/firebasejs\/([\d.]+)\//)[1]; assert.equal(wishHtml.match(/rel="modulepreload" href="[^"]*firebasejs\/[\d.]+/g).length, 3); assert.ok(!wishHtml.match(/firebasejs\/[\d.]+/g).some(item => !item.endsWith(sdkVersion)), 'Preloads must match the SDK version');
  const wishJs = await fs.readFile(path.join(project, 'js/wish.js'), 'utf8'); assert.ok(wishJs.indexOf('\nconnectCloud();') < wishJs.indexOf('\nstartScene();') && (wishJs.match(/room\.dataset\.cloud=/g) ?? []).length === 2, 'A failed mailbox must still release the loader');
  assert.ok(!(await fs.readFile(path.join(project, 'admin.html'), 'utf8')).includes('site-loader'));
  assert.ok(!js.includes('.png') && !js.includes('<img') && !css.includes('url('), 'The loader must paint without waiting for any download');
});
await test('翻頁倒數：只翻變動的數字、減少動態不翻、天數位數改變時重建', async () => {
  const env = environment();
  const { mountFlipCounter } = await env.evaluate('js/components/flip-counter.js');
  const faces = card => card.children.map(face => face.children[0].textContent);
  const host = new (env.element('x').constructor)();
  const counter = mountFlipCounter(host);
  counter.set('54'); assert.equal(host.children.length, 2); assert.deepEqual(faces(host.children[1]), ['4', '4', '4', '4']);
  const [tens, ones] = host.children;
  counter.set('53');
  assert.equal(host.children[0], tens); assert.equal(tens.classList.contains('is-flipping'), false);
  assert.equal(ones.classList.contains('is-flipping'), true); assert.deepEqual(faces(ones), ['3', '4', '4', '3']);
  ones.children[3].dispatch('animationend');
  assert.equal(ones.classList.contains('is-flipping'), false); assert.equal(faces(ones)[1], '3');
  counter.set('100'); assert.equal(host.children.length, 3); assert.notEqual(host.children[0], tens);
  env.window.matchMedia = () => ({ matches: true });
  const still = new (env.element('x').constructor)(), calm = mountFlipCounter(still);
  calm.set('10'); calm.set('09');
  assert.equal(still.children[1].classList.contains('is-flipping'), false); assert.deepEqual(faces(still.children[1]), ['9', '9', '9', '9']);
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
  assert.match(host, /<iframe[^>]+src="games\/christmas-matching\.html\?v=[0-9a-f]{10}"/);
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

await test('game2：開始時焦點放在卡片區而不是卡片，任何裝置都不會出現焦點框', async () => {
  for (const input of ['pointerdown', 'keydown']) {
    const env = await game2Environment();
    env.root.dispatch(input); env.element('#start-btn').dispatch('click');
    assert.ok(env.element('#card-grid').focused, `${input}：卡片區取得焦點`);
    assert.ok(!env.element('#card-grid').children.some(card => card.focused), `${input}：沒有卡片被程式選取`);
    env.game.destroy();
  }
  const html = await fs.readFile(path.join(project, 'games/christmas-matching.html'), 'utf8'), css = await fs.readFile(path.join(project, 'css/game2-matching.css'), 'utf8');
  assert.match(html, /id="card-grid"[^>]*tabindex="-1"/); assert.match(css, /\.card-grid:focus \{ outline: none; \}/);
});

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
  for (const [name, clip] of [['santa-new', 'dance_02'], ['santa-dance', 'dance_02'], ['reindeer', 'preset:quadruped:walk'], ['santa-dance-web', 'dance_02'], ['reindeer-web', 'preset:quadruped:walk']]) {
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
  assert.ok(source.includes('assets/models/santa-dance-web.glb')); assert.ok(!source.includes('assets/models/santa-dance.glb')); assert.ok(!source.includes('assets/models/santa-claus.glb')); assert.ok(!source.includes('assets/models/santa-new.glb'));
  const heroSource = await fs.readFile(path.join(project, 'js/game-hero.js'), 'utf8');
  assert.ok(heroSource.includes('assets/models/santa-new.glb')); assert.ok(!heroSource.includes('assets/models/santa-dance.glb'));
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
  // A tap far outside the model is handed to the scenery behind it; nobody claims it here, so the character still speaks.
  let passed = 0; slot.addEventListener('character:pass-through', () => passed++);
  slot.dispatch('pointerdown',pointer); slot.dispatch('pointerup',pointer); slot.dispatch('click',{detail:1,clientX:-9999,clientY:-9999}); assert.equal(passed,1); assert.equal(talks,3);
  slot.dispatch('keydown',{key:'Enter',repeat:false}); slot.dispatch('click',{detail:0}); assert.equal(talks,4);
  slot.dispatch('keydown',{key:'Enter',repeat:true}); assert.equal(talks,4);
  slot.dispatch('pointerdown',pointer); slot.dispatch('pointermove',{...pointer,clientX:300}); frame();
  const scene = renderers[0].renders.at(-2); const turn = scene.children.find(node => node.isGroup);
  assert.ok(Math.abs(turn.rotation.y) > 2); assert.equal(slot.hasPointerCapture(),true);
  slot.dispatch('pointerup',pointer); slot.dispatch('click',{detail:1}); assert.equal(talks,4); for (let i=0;i<240;i++) frame(); assert.equal(turn.rotation.y,0);
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
    const png=await fs.readFile(path.join(project,'images/storybook',`${name}.png`));
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
  for (const page of [html,gameHtml]) assert.ok(!/images\/(storybook|games\/hero)\//.test(page),'Paper scenes must not load raster art');
  assert.ok(html.includes('data-title-art')); assert.ok(html.includes('js/home-scene.js'));
  // 兩頁都是無樹的切面雪山，但 Game 用自己的配色與排列，背景不重複。
  const peaks=homeScene.match(/function mountains\(parent\) \{[\s\S]*?\n\}/)?.[0];
  const gamePeaks=gameScene.match(/function mountains\(parent\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(peaks?.includes('facetedPeak(parent')&&gamePeaks?.includes('PEAK_TONES')); assert.ok(!peaks.includes('pine(')&&!gamePeaks.includes('pine('));
  const peakAt=source=>[...source.matchAll(/facetedPeak\(parent, (\d+)/g)].map(match=>match[1]).join(); assert.notEqual(peakAt(peaks),peakAt(gamePeaks));
  // 按鈕與信紙的紙雕只是底圖：連結與文字仍是真實 HTML，底圖不可攔截點擊所需的語意。
  assert.ok(/<a class="paper-button" href="intro\.html">Explore the Story/.test(html)); assert.ok(/<a class="paper-button cream" href="wish\.html">Make a Wish/.test(html));
  assert.ok(html.includes('聖誕老人的小信')&&html.includes('麋鹿的小信')); assert.ok(homeScene.includes('buttonArt(')&&homeScene.includes('airmailLetter('));
  assert.ok(css.includes('.paper-button:hover')&&css.includes('.paper-button:active')&&css.includes('.paper-button:focus-visible'));
  for (const page of ['index.html', 'intro.html', 'game.html', 'wish.html', 'santa.html']) { const text = (await fs.readFile(path.join(project, page), 'utf8')); assert.ok(text.includes("Holy Moly! It's Christmas!"), page); assert.ok(!/HANDMADE/.test(text), page); }
  assert.ok(homeScene.includes('mountTagline(') && html.includes('data-tagline-art'));
  // 遊戲框只是外圍裝飾：不擋點擊，也不能改動面板內距。
  const gameCss=await fs.readFile(path.join(project,'css/game.css'),'utf8');
  assert.ok(/\.game-frame > \.art-layer \{[^}]*pointer-events: none/.test(gameCss)); assert.ok((await fs.readFile(path.join(project,'js/game.js'),'utf8')).includes('mountGameFrames(...frames)'));
  // 舞台雪堆要蓋在 3D 畫布前方，才有角色站在雪堆後的層次。
  assert.ok(+css.match(/\.home-bank \{ z-index: (\d+)/)[1]>+css.match(/\.characters-canvas \{[^}]*?z-index: (\d+)/)[1]);
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
    const m=stockingMouth(rect),s=Math.min(rect.width/240,rect.height/340);
    assert.equal(m.x,m.left+151*s);assert.equal(m.y,m.top+100*s);
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
  assert.ok(f.queue.some(a=>a.frames.some(k=>/rotateX\(-180deg\)/.test(k.transform??''))),'Top third folds down over it');
  f.finish();await f.flush();assert.equal(f.root.dataset.deliveryState,'flying');assert.equal(commits,0);
  f.finish();await f.flush();assert.equal(f.root.dataset.deliveryState,'saving');assert.equal(commits,1);assert.ok(f.get('.stocking-station').classList.contains('is-catching'),'The stocking swings as the letter lands');assert.equal(f.receipt.hidden,true);
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
await test('Santa 分頁模型與頭部追蹤：兩份模型頭頸骨都存在、角度上限、平滑、觸控與減少動態不追蹤', async () => {
  for (const name of ['santa-new', 'santa-dance']) {
    const glb = await fs.readFile(path.join(project, `assets/models/${name}.glb`));
    const data = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim());
    const joints = data.skins[0].joints.map(index => data.nodes[index].name);
    assert.ok(joints.includes('mixamorig:Head') && joints.includes('mixamorig:Neck'), name);
    if (name === 'santa-new') assert.ok(glb.length < 2_000_000, 'compressed Santa stays under 2MB');
  }
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
  const deerScene = await fs.readFile(path.join(project, 'js/components/characters-scene.js'), 'utf8');
  const deerData = JSON.parse((await fs.readFile(path.join(project, 'assets/models/reindeer-web.glb'))).toString('utf8', 20, 20 + (await fs.readFile(path.join(project, 'assets/models/reindeer-web.glb'))).readUInt32LE(12)).trim());
  assert.ok(deerScene.includes("neckBone: 'tripoHead_1'") && deerScene.includes("headBone: 'tripoHead_2'"), 'The reindeer follows the mouse too');
  for (const bone of ['tripo::Head_1', 'tripo::Head_2']) assert.ok(deerData.nodes.some(node => node.name === bone), bone);
  const deerRig = new THREE.Group(), deerNeck = new THREE.Bone(), deerHead = new THREE.Bone(); deerNeck.name = 'tripoHead_1'; deerHead.name = 'tripoHead_2'; deerNeck.add(deerHead); deerRig.add(deerNeck);
  env.window.addEventListener = (type, callback) => { if (type === 'pointermove') env.window.deerMove = callback; };
  env.window.matchMedia = query => ({ matches: !query.includes('reduced'), addEventListener() {}, removeEventListener() {} });
  const deerTracker = createHeadTracker(deerRig, { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }, { neckBone: 'tripoHead_1', headBone: 'tripoHead_2', maxYaw: .34, maxPitch: .12, unanimated: true });
  env.window.deerMove({ pointerType: 'mouse', clientX: -5000, clientY: 0 });
  for (let i = 0; i < 600; i++) deerTracker.update(1 / 60);
  const deerTurn = deerHead.quaternion.angleTo(new THREE.Quaternion()) + deerNeck.quaternion.angleTo(new THREE.Quaternion());
  assert.ok(deerTurn > .25 && deerTurn < .4, `Bones without animation must not pile up the turn: ${deerTurn}`);
  deerTracker.destroy();
});

console.log(`\n${results.length} test groups passed.`);
