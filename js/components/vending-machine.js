// The vending machine in Three.js: Tripo3D's machine (assets/models/vending-*-web.glb), the four little things in its
// window and a round button for each on its panel, lit to look as it did where it was made. A button pressed sinks in,
// the machine gives a little shudder as it runs, and the thing tips off its shelf and drops into the tray at its foot,
// where it hops now and then until it is taken out (`takeOut`); then a new one stands on the shelf again. The buttons
// glow softly while they wait. Each button and the tray have a plain HTML button laid over them (`.machine-hit`), so a
// mouse, a finger or the keyboard all work the same; under reduced motion things only appear where they end.
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { ITEMS, VENDING } from '../data/vending.js';

// Where things are on the machine, in its own units (foot at y 0, 0.98 tall, its front face at z FRONT): measured off a
// straight-on picture of it (docs/VENDING-MODELS.md). Window and buttons both read gingerbread, snowman / tree, stocking.
const FRONT = .172, TRAY = [-.03, .142];
const BUTTONS = { gingerbread: [.181, .406], snowman: [.267, .406], tree: [.181, .31], stocking: [.267, .31] };
const SHELVES = { gingerbread: [-.156, .6], snowman: [.015, .6], tree: [-.156, .382], stocking: [.015, .382] };
const ITEM_HEIGHT = .15, BUTTON_SIZE = .088, DROP = 1500;
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export function mountMachine(stage, { onState = () => {}, sound = null } = {}) {
  const still = matchMedia('(prefers-reduced-motion: reduce)'), events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const canvas = element('canvas', 'machine-canvas', stage); canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { canvas.remove(); fail(); return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .5; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, .05, 20);
  // Lit the way it looked in Tripo3D's viewer, where it was made: a soft, even studio light all round (a neutral room as
  // its environment), a white key from the front, filmic tone mapping (ACES) at half exposure, so its matte red, cream,
  // butter yellow and olive green match that view (measured against the user's screenshot of it); a little moonlight from
  // behind. Warm lamps and no environment had made it dark, glossy and yellow.
  const studio = new THREE.PMREMGenerator(renderer); scene.environment = studio.fromScene(new RoomEnvironment(), .04).texture; studio.dispose();
  const key = new THREE.DirectionalLight('#ffffff', 1.7); key.position.set(-.8, 2, 2.6); scene.add(key);
  const rim = new THREE.DirectionalLight('#a9c2ee', .4); rim.position.set(2, 1.2, -1); scene.add(rim);
  const machine = new THREE.Group(); scene.add(machine);
  const things = new Map(), buttons = new Map(), loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // Every model as Tripo3D shows it, clay-like and matte: none of the metal its texture hints at, an even satin finish.
  const matte = model => { model.traverse(node => { if (node.isMesh) Object.assign(node.material, { metalness: 0, metalnessMap: null, roughness: .72, roughnessMap: null }); }); return model; };
  const load = name => loader.loadAsync(`assets/models/${name}-web.glb`).then(({ scene: model }) => matte(model));
  // Scaled to a height (or a width, for the buttons) and centred in a holder, which is what moves.
  const fit = (model, size, by = 'y') => { const box = new THREE.Box3().setFromObject(model), dims = box.getSize(new THREE.Vector3()); model.scale.setScalar(size / dims[by]); box.setFromObject(model); model.position.sub(box.getCenter(new THREE.Vector3())); const holder = new THREE.Group(); holder.add(model); return holder; };
  let state = 'loading', drop = null, chosen = null, frame = 0, visible = true, held = false;
  const hits = new Map(), tray = element('button', 'machine-hit machine-tray', stage); tray.type = 'button'; tray.disabled = true;
  const name = () => ITEMS.find(({ id }) => id === chosen)?.name ?? '';
  const set = next => {
    state = next; stage.dataset.state = next; for (const hit of hits.values()) hit.disabled = next !== 'idle'; tray.disabled = next !== 'ready';
    tray.setAttribute('aria-label', VENDING.tray(name())); onState(next, chosen);
  };
  function fail() { stage.dataset.state = 'failed'; onState('failed', null); }

  Promise.all([load('vending-machine'), ...ITEMS.flatMap(({ id }) => [load(`vending-${id}`), load(`vending-${id}-button`)])]).then(([body, ...rest]) => {
    machine.add(body);
    ITEMS.forEach(({ id, name: label }, i) => {
      const thing = fit(rest[i * 2], ITEM_HEIGHT), [x, y] = SHELVES[id]; thing.position.set(x, y, FRONT + .03); thing.userData.home = thing.position.clone(); machine.add(thing); things.set(id, thing);
      const button = fit(rest[i * 2 + 1], BUTTON_SIZE, 'x'), [bx, by] = BUTTONS[id]; button.position.set(bx, by, FRONT + .012); button.userData.home = button.position.clone(); machine.add(button); buttons.set(id, button);
      button.traverse(node => { if (node.isMesh) { node.material = node.material.clone(); node.material.emissive = new THREE.Color('#fff3dc'); node.material.emissiveIntensity = 0; } });
      const hit = element('button', 'machine-hit machine-button', stage); hit.type = 'button'; hit.disabled = true; hit.dataset.item = id; hit.setAttribute('aria-label', VENDING.button(label));
      on(hit, 'click', () => select(id)); hits.set(id, hit);
    });
    resize(); set('idle'); start();
  }).catch(() => { renderer.dispose(); canvas.remove(); fail(); });

  // The camera frames the whole machine with a little snow round it; the hit areas follow what they cover on screen, and
  // the page learns where the machine's foot, width and tray are (for the warm light on the snow and the desk opening).
  function resize() {
    const width = stage.clientWidth || 1, height = stage.clientHeight || 1; renderer.setSize(width, height, false);
    camera.aspect = width / height; const fill = Math.max(1, .82 / camera.aspect);
    camera.position.set(0, .52, 2.55 * fill); camera.lookAt(0, .47, 0); camera.updateProjectionMatrix();
    for (const [id, hit] of hits) place(hit, buttons.get(id));
    place(tray, null, [TRAY[0] - .16, TRAY[1] - .05, FRONT, TRAY[0] + .16, TRAY[1] + .05, FRONT]);
    const foot = project(0, 0, 0), left = project(-.36, 0, FRONT), right = project(.36, 0, FRONT), mouth = trayPoint();
    stage.style.setProperty('--foot-y', `${foot.y}px`); stage.style.setProperty('--machine-w', `${right.x - left.x}px`);
    stage.style.setProperty('--tray-x', `${mouth.x}px`); stage.style.setProperty('--tray-y', `${mouth.y}px`);
    draw();
  }
  const corners = new THREE.Box3(), point = new THREE.Vector3();
  const project = (x, y, z) => { point.set(x, y, z).project(camera); return { x: (point.x + 1) / 2 * stage.clientWidth, y: (1 - point.y) / 2 * stage.clientHeight }; };
  function place(hit, object, box) {
    if (object) corners.setFromObject(object); else corners.set(new THREE.Vector3(box[0], box[1], box[2]), new THREE.Vector3(box[3], box[4], box[5]));
    const xs = [], ys = [];
    for (const x of [corners.min.x, corners.max.x]) for (const y of [corners.min.y, corners.max.y]) for (const z of [corners.min.z, corners.max.z]) { const at = project(x, y, z); xs.push(at.x); ys.push(at.y); }
    Object.assign(hit.style, { left: `${Math.min(...xs)}px`, top: `${Math.min(...ys)}px`, width: `${Math.max(...xs) - Math.min(...xs)}px`, height: `${Math.max(...ys) - Math.min(...ys)}px` });
  }
  // Where the tray's mouth is on screen, in the stage's own pixels.
  const trayPoint = () => project(TRAY[0], TRAY[1], FRONT);

  // A button pressed: it sinks, the machine shudders and hums, the thing tips forward off its shelf and drops.
  function select(id) {
    if (state !== 'idle') return; chosen = id; set('dropping'); sound?.play('click');
    const thing = things.get(id), button = buttons.get(id), from = thing.userData.home.clone(), to = new THREE.Vector3(TRAY[0], TRAY[1] + .01, FRONT + .05);
    drop = { thing, button, from, to, start: performance.now(), length: still.matches ? 0 : DROP };
    later(still.matches ? 0 : 260, () => sound?.play('creak')); later(still.matches ? 0 : DROP * .78, () => sound?.play('thud'));
  }
  function takeOut() {
    if (state !== 'ready') return null; const id = chosen, thing = things.get(id);
    thing.visible = false; sound?.play('pick'); set('idle');
    // A new one stands on its shelf again a moment later.
    later(still.matches ? 0 : 700, () => { thing.position.copy(thing.userData.home); thing.rotation.set(0, 0, 0); thing.scale.setScalar(1); thing.visible = true; draw(); });
    return id;
  }
  const timers = new Set(), later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

  function tick(now) {
    frame = 0;
    const t = now / 1000, waiting = state === 'idle', moving = !still.matches;
    // The things on their shelves turn a little to and fro; not the one dropping, nor the one waiting in the tray.
    const away = drop?.thing ?? (state === 'ready' ? things.get(chosen) : null);
    for (const [id, thing] of things) if (thing !== away) thing.rotation.y = moving ? Math.sin(t * .8 + id.length) * .28 : 0;
    for (const [id, button] of buttons) button.traverse(node => { if (node.isMesh) node.material.emissiveIntensity = waiting ? (moving ? .06 + Math.sin(t * 2.2 + id.length) * .04 : .06) : 0; });
    machine.rotation.z = 0; machine.position.y = 0;
    if (drop) {
      const u = drop.length ? Math.min(1, (now - drop.start) / drop.length) : 1, { thing, button, from, to } = drop;
      // The button sinks in and comes back; the machine shudders while it runs; the thing tips off, drops and bounces.
      button.position.z = button.userData.home.z - (u < .2 ? Math.sin(u / .2 * Math.PI) * .012 : 0);
      if (u > .12 && u < .4) { const s = (u - .12) / .28; machine.rotation.z = Math.sin(s * Math.PI * 6) * .006 * (1 - s); machine.position.y = Math.abs(Math.sin(s * Math.PI * 6)) * .002; }
      const fall = Math.max(0, (u - .3) / .7), out = Math.min(1, fall / .25), down = ease(Math.min(1, fall / .78)), bounce = fall > .78 ? Math.sin((fall - .78) / .22 * Math.PI) * .03 : 0;
      thing.position.set(from.x + (to.x - from.x) * down, from.y + (to.y - from.y) * down + bounce, from.z + (to.z - from.z) * out);
      thing.rotation.x = Math.sin(down * Math.PI) * .6; thing.scale.setScalar(1 - down * .25);
      if (u >= 1) { drop = null; set('ready'); }
    } else if (state === 'ready' && moving) {
      // Waiting in the tray, it gives a little hop every couple of seconds.
      const thing = things.get(chosen), hop = (t % 2.4) / .5;
      thing.position.y = TRAY[1] + .01 + (hop < 1 ? Math.sin(hop * Math.PI) * .018 : 0);
    }
    renderer.render(scene, camera);
    if (visible && !held && !document.hidden) frame = requestAnimationFrame(tick);
  }
  const draw = () => renderer.render(scene, camera);
  const start = () => { if (!frame && visible && !held && state !== 'loading') frame = requestAnimationFrame(tick); };
  const resizing = new ResizeObserver(() => resize()); resizing.observe(stage);
  const watch = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); }) : null; watch?.observe(stage);
  on(document, 'visibilitychange', start);
  return {
    select, takeOut, trayPoint, get state() { return state; },
    // While the coloring desk covers it, the machine stops drawing.
    hold(on) { held = on; if (!on) start(); else { cancelAnimationFrame(frame); frame = 0; } },
    destroy() {
      events.abort(); cancelAnimationFrame(frame); timers.forEach(clearTimeout); resizing.disconnect(); watch?.disconnect();
      scene.traverse(node => { if (node.isMesh) { node.geometry.dispose(); for (const material of [].concat(node.material)) { for (const value of Object.values(material)) if (value?.isTexture) value.dispose(); material.dispose(); } } });
      scene.environment?.dispose(); renderer.dispose(); stage.querySelectorAll('.machine-hit, .machine-canvas').forEach(node => node.remove());
    },
  };
}
