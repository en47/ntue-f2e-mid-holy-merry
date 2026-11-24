// The vending machine in Three.js (docs/VENDING-MACHINE.md): the slot machine of card from vending-papercraft.js and the
// four little things in its cells, Tripo3D's models (assets/models/vending-*-web.glb). A button picks one: it stays half
// down, its cell lights up, the lever's catch lets go. Pulled all the way down and let go (five bulbs light along its arc
// as it goes, services/vending-lever.js), the lever sets the delivery going: the cell's door comes down, the curtains light
// up from behind and the thing's shadow is let down onto the stage, the light goes out and the curtains part on the thing
// itself, the tray slides out and it turns to you. Taken out (`takeOut`), everything is put back while the coloring desk
// covers the machine. Plain HTML elements lie over the buttons, the lever (a slider: drag it, or the arrow keys) and the
// stage, so a mouse, a finger or the keyboard all work. It is drawn only when something moves; under reduced motion each
// thing goes straight to where it ends (the lever still follows a drag).
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { MACHINE, buildMachine } from './vending-papercraft.js';
import { ITEMS, VENDING } from '../data/vending.js';
import { DELIVERY, angle, bulbs as brightness, lit, next, pull } from '../services/vending-lever.js';

// The cells' light while waiting, and the stage light's strength once the thing is shown.
const IDLE = .35, SPOT = .07;
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const settle = t => 1 - (1 - t) ** 3;
const linear = t => t;
const tone = colour => new THREE.Color(colour);
const DARK = tone('#2a2023'), LIT = tone('#f6e2b4'), DIM = tone('#5a4436'), CLOTH = tone('#8f3530'), GLOWING = tone('#c65b48'), GLASS = tone('#6b5646'), BRIGHT = tone('#fff2c4'), WARM = tone('#ffc766');

export function mountMachine(stage, { onState = () => {}, sound = null } = {}) {
  const still = matchMedia('(prefers-reduced-motion: reduce)'), events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const canvas = element('canvas', 'machine-canvas', stage); canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { canvas.remove(); fail(); return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.localClippingEnabled = true;
  // The card takes its colours as they are (its materials skip tone mapping); the four models, as Tripo3D showed them, go
  // through filmic tone mapping at half exposure, each with a soft studio room as its own environment map (set on their
  // materials only: as the scene's environment it would light the card too).
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .5;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, .05, 20);
  const studio = new THREE.PMREMGenerator(renderer), room = studio.fromScene(new RoomEnvironment(), .04).texture; studio.dispose();
  // Lit as the page is: from the left, where the lamp post stands, by a light only a little warm, the night sky above and
  // the snow below for the rest, a cool rim of moonlight from behind. The key light throws the card's soft shadows.
  scene.add(new THREE.HemisphereLight('#c9d6ea', '#efe8dc', 2.1));
  const key = new THREE.DirectionalLight('#fff3e6', 2.5); key.position.set(-1.3, 1.9, 2.2); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 3; key.shadow.bias = -.0004; key.shadow.normalBias = .004;
  Object.assign(key.shadow.camera, { left: -.9, right: 1.1, top: 1.6, bottom: -.5, near: .5, far: 6 }); key.shadow.camera.updateProjectionMatrix();
  const rim = new THREE.DirectionalLight('#a9c2ee', .5); rim.position.set(2, 1.2, -1); scene.add(rim);
  // A warm light over the stage, on only while the thing is shown there.
  const spot = new THREE.SpotLight('#ffe7c4', 0, .7, .8, .6, 2); spot.position.set(0, .29, .15); spot.target.position.set(0, .1, .11); scene.add(spot, spot.target);
  // Its shadow on the snow, so it stands rather than floats; it fades out round the machine, never ending in an edge.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ color: '#2c3e55', opacity: .32 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  ground.material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vGround;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = position.xy;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vGround;').replace('opacity * ( 1.0 - getShadowMask() )', 'opacity * ( 1.0 - getShadowMask() ) * smoothstep( .9, .12, length( vGround * vec2( 1.0, 1.45 ) - vec2( .08, .1 ) ) )');
  };

  let state = 'loading', chosen = null, progress = 0, shown = 0, frame = 0, visible = true, held = false, ticking = false, until = 0, grip = null, bumping = false, sway = 0;
  const machine = buildMachine({ redraw: () => refresh() }); scene.add(machine.group);
  const { buttons, cells, marquee, stage: theatre, lever } = machine, things = new Map(), shade = new THREE.MeshBasicMaterial({ color: '#3a1d1b', toneMapped: false });
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // Each little thing as Tripo3D shows it, a little less glossy: none of the metal its texture hints at, a satin finish.
  const matte = model => { model.traverse(node => { if (node.isMesh) { Object.assign(node.material, { metalness: 0, metalnessMap: null, roughness: .72, roughnessMap: null, envMap: room, envMapIntensity: .9 }); node.castShadow = node.receiveShadow = true; node.userData.material = node.material; } }); return model; };
  const load = name => loader.loadAsync(`assets/models/${name}-web.glb`).then(({ scene: model }) => matte(model));
  // Scaled to stand MACHINE.item tall and centred in a holder, which is what moves.
  const fit = model => { const box = new THREE.Box3().setFromObject(model), height = box.getSize(new THREE.Vector3()).y; model.scale.setScalar(MACHINE.item / height); box.setFromObject(model); model.position.sub(box.getCenter(new THREE.Vector3())); const holder = new THREE.Group(); holder.add(model); return holder; };
  const home = id => cells[id].stand.clone().setY(cells[id].stand.y + MACHINE.item / 2);
  const onStage = () => new THREE.Vector3(MACHINE.stage.stand[0], MACHINE.stage.stand[1] + MACHINE.item / 2, MACHINE.stage.stand[2]);

  // The hit areas: one per button, the lever (a slider), the stage; and a soft glow over each of the crest's bulbs.
  const hits = new Map(), tray = element('button', 'machine-hit machine-tray', stage), handle = element('div', 'machine-hit machine-lever', stage);
  tray.type = 'button'; tray.disabled = true;
  handle.tabIndex = 0; handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', VENDING.lever); handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '100'); handle.setAttribute('aria-valuenow', '0');
  for (const { id, name } of ITEMS) { const hit = element('button', 'machine-hit machine-button', stage); hit.type = 'button'; hit.disabled = true; hit.dataset.item = id; hit.setAttribute('aria-label', VENDING.button(name)); hit.setAttribute('aria-pressed', 'false'); on(hit, 'click', () => select(id)); hits.set(id, hit); }
  const halos = marquee.map((_, i) => { const node = element('span', 'machine-bulb', stage); node.setAttribute('aria-hidden', 'true'); node.style.setProperty('--delay', `${(-i * .73).toFixed(2)}s`); return node; });
  const nameOf = () => ITEMS.find(({ id }) => id === chosen)?.name ?? '';
  function set(value, note = '') {
    state = value; stage.dataset.state = state;
    for (const hit of hits.values()) hit.disabled = !['idle', 'chosen'].includes(state);
    tray.disabled = state !== 'ready'; tray.setAttribute('aria-label', VENDING.tray(nameOf()));
    handle.setAttribute('aria-disabled', String(!['idle', 'chosen', 'pulling'].includes(state)));
    onState(state, chosen, note);
  }
  function fail() { stage.dataset.state = 'failed'; onState('failed', null); }

  Promise.all(ITEMS.map(({ id }) => load(`vending-${id}`))).then(models => {
    ITEMS.forEach(({ id }, i) => { const thing = fit(models[i]); thing.position.copy(home(id)); machine.group.add(thing); things.set(id, thing); });
    resize(); set('idle');
  }).catch(() => { stop(); fail(); });

  // The camera frames the machine with the lever all the way down, a little from above; the hit areas and the crest's glows
  // follow what they cover on screen, and the page learns where the machine's foot, width and tray are (for the light on
  // the snow and the desk opening).
  function resize() {
    const width = stage.clientWidth || 1, height = stage.clientHeight || 1; renderer.setSize(width, height, false); camera.aspect = width / height;
    const [x0, x1, y0, y1] = MACHINE.bounds, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = Math.max((y1 - y0) / 2, (x1 - x0) / 2 / camera.aspect) * 1.06;
    camera.position.set(cx, cy + .12, half / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + MACHINE.front); camera.lookAt(cx, cy, 0); camera.updateProjectionMatrix();
    const [bx, by] = MACHINE.buttons.gingerbread, [, below] = MACHINE.buttons.tree, [across] = MACHINE.buttons.snowman, F = MACHINE.front;
    const room = Math.min(44, Math.abs(project(0, by, F).y - project(0, below, F).y) - 2, Math.abs(project(across, by, F).x - project(bx, by, F).x) - 2);
    for (const [id, hit] of hits) place(hit, buttons.get(id), null, room);
    place(tray, null, [-.17, .055, .14, .17, .305, .2]);
    placeLever();
    marquee.forEach((point, i) => { const at = project(point.x, point.y, point.z); Object.assign(halos[i].style, { left: `${at.x}px`, top: `${at.y}px` }); });
    stage.style.setProperty('--bulb', `${(project(.02, 0, F).x - project(-.02, 0, F).x).toFixed(1)}px`);
    const foot = project(0, 0, F), left = project(-MACHINE.width / 2, 0, F), right = project(MACHINE.width / 2, 0, F), at = trayPoint();
    stage.style.setProperty('--foot-x', `${foot.x}px`); stage.style.setProperty('--foot-y', `${foot.y}px`); stage.style.setProperty('--machine-w', `${right.x - left.x}px`);
    stage.style.setProperty('--tray-x', `${at.x}px`); stage.style.setProperty('--tray-y', `${at.y}px`);
    draw();
  }
  const corners = new THREE.Box3(), point = new THREE.Vector3();
  const project = (x, y, z) => { point.set(x, y, z).project(camera); return { x: (point.x + 1) / 2 * stage.clientWidth, y: (1 - point.y) / 2 * stage.clientHeight }; };
  function place(hit, object, box, least = 0) {
    if (object) corners.setFromObject(object); else corners.set(new THREE.Vector3(box[0], box[1], box[2]), new THREE.Vector3(box[3], box[4], box[5]));
    const xs = [], ys = [];
    for (const x of [corners.min.x, corners.max.x]) for (const y of [corners.min.y, corners.max.y]) for (const z of [corners.min.z, corners.max.z]) { const at = project(x, y, z); xs.push(at.x); ys.push(at.y); }
    let left = Math.min(...xs), top = Math.min(...ys), width = Math.max(...xs) - left, height = Math.max(...ys) - top;
    if (width < least) { left -= (least - width) / 2; width = least; } if (height < least) { top -= (least - height) / 2; height = least; }
    Object.assign(hit.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  }
  // The lever's hit area covers the whole arc its knob can sweep, from its hub out.
  function placeLever() {
    const [hx, hy] = MACHINE.hub, reach = MACHINE.arm + MACHINE.knob, z = MACHINE.front + .02, xs = [], ys = [];
    for (let degrees = 20; degrees <= 160; degrees += 10) for (const r of [0, reach]) { const at = project(hx + Math.sin(degrees * Math.PI / 180) * r, hy + Math.cos(degrees * Math.PI / 180) * r, z); xs.push(at.x); ys.push(at.y); }
    const left = Math.min(...xs) - 4, top = Math.min(...ys) - 6;
    Object.assign(handle.style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(...xs) + 6 - left}px`, height: `${Math.max(...ys) + 6 - top}px` });
  }
  const hubOnScreen = () => { const box = stage.getBoundingClientRect(), at = project(MACHINE.hub[0], MACHINE.hub[1], MACHINE.front + .02); return { x: box.left + at.x, y: box.top + at.y }; };
  // Where the thing stands once the tray is out, in the stage's own pixels.
  const trayPoint = () => project(0, MACHINE.stage.floor + .06, MACHINE.stage.stand[2] + MACHINE.stage.slide);

  // Everything that moves is a tween: a step called with its eased progress from its start (after `delay`) for `length`
  // milliseconds; under reduced motion it jumps to its end. `later` runs something once, `delay` from now.
  const moves = new Set();
  function tween(length, step, { delay = 0, curve = settle } = {}) {
    const move = { start: performance.now() + (still.matches ? 0 : delay), length: still.matches ? 0 : length, step, curve };
    moves.add(move); animate(move.start + move.length + 60); return move;
  }
  const later = (delay, fn) => tween(0, () => fn(), { delay, curve: () => 1 });

  // The lever, pulled to `value` (0–1): the arm's angle and, unless they are held as they are, the five bulbs.
  function pullTo(value, { bulbs = true, audible = true } = {}) {
    progress = value; lever.arm.rotation.z = -angle(value); handle.setAttribute('aria-valuenow', String(Math.round(Math.max(0, value) * 100)));
    if (bulbs) light(Math.max(0, value), audible);
    refresh();
  }
  function bulb(k, b) { const { glass, halo } = lever.bulbs[k]; glass.color.copy(GLASS).lerp(BRIGHT, b); glass.emissive.copy(WARM).multiplyScalar(b * .55); halo.opacity = b * .85; }
  function light(level, audible) {
    brightness(level).forEach((b, k) => bulb(k, b));
    const count = lit(level);
    if (audible) for (let k = shown; k < count; k++) { sound?.play('lamp', k); const { node } = lever.bulbs[k]; tween(220, t => node.scale.setScalar(1 + Math.sin(t * Math.PI) * .25), { curve: linear }); }
    shown = count;
  }
  function latch(locked) { const pawl = lever.pawl, from = pawl.rotation.z, to = locked ? 0 : .66; if (!locked) sound?.play('ratchet'); tween(180, t => { pawl.rotation.z = from + (to - from) * t; }); }

  // A button pressed: it sinks and comes back half way, staying down while its thing is the one picked; the one picked
  // before comes up. Its cell lights up, the others dim, the thing hops and looks round. The first pick lets the lever go.
  function select(id) {
    if (!['idle', 'chosen'].includes(state) || id === chosen) return;
    const before = chosen, first = state === 'idle'; chosen = id; sound?.play('click');
    const holder = buttons.get(id), rest = holder.userData.home;
    tween(90, t => { holder.position.z = rest - .008 * t; }, { curve: linear }); tween(220, t => { holder.position.z = rest - .008 + .004 * t; }, { delay: 90 });
    if (before) { const other = buttons.get(before), from = other.position.z; tween(240, t => { other.position.z = from + (other.userData.home - from) * t; }); }
    for (const [other, hit] of hits) hit.setAttribute('aria-pressed', String(other === id));
    for (const { id: other } of ITEMS) glowTo(other, other === id ? .95 : .14);
    const thing = things.get(id), base = home(id).y;
    tween(560, t => { thing.position.y = base + Math.sin(t * Math.PI) * .012; thing.rotation.y = Math.sin(t * Math.PI * 2) * .2; }, { curve: linear });
    if (first) { latch(false); tween(420, t => pullTo(Math.sin(t * Math.PI) * .05, { bulbs: false }), { delay: 200, curve: linear }); }
    set(next(state, 'pick'));
  }
  function glowTo(id, to, { delay = 0, length = 260 } = {}) { const glow = cells[id].glow; let from = null; tween(length, t => { from ??= glow.opacity; glow.opacity = from + (to - from) * t; }, { delay }); }
  // Pulled before anything is picked: the catch holds it, it only gives a little and comes back; the buttons ripple.
  function bump() {
    if (bumping) return; bumping = true; sound?.play('thud');
    tween(300, t => pullTo(Math.sin(t * Math.PI) * .035, { bulbs: false }), { curve: linear }); later(300, () => { bumping = false; });
    ITEMS.forEach(({ id }, i) => { const holder = buttons.get(id), rest = holder.userData.home; tween(280, t => { holder.position.z = rest + Math.sin(t * Math.PI) * .006; }, { delay: i * 90, curve: linear }); });
    onState(state, chosen, 'locked');
  }
  function springBack() {
    const from = progress; sound?.play('spring');
    tween(140 + 360 * from, t => pullTo(from * (1 - t), { audible: false }));
    set(next(state, 'short'), 'short');
  }

  // Dragged: the knob follows the pointer round the hub; let go at the bottom it fires, anywhere else it springs back (a
  // tap that hardly moved just nods the lever, to show it wants pulling).
  on(handle, 'pointerdown', event => {
    event.preventDefault();
    if (state === 'idle') { bump(); return; }
    if (state !== 'chosen') return;
    handle.setPointerCapture(event.pointerId); grip = { x: event.clientX, y: event.clientY, moved: 0 }; stage.classList.add('is-pulling'); set(next(state, 'grab'));
  });
  on(handle, 'pointermove', event => {
    if (!grip) return;
    grip.moved = Math.max(grip.moved, Math.hypot(event.clientX - grip.x, event.clientY - grip.y));
    const hub = hubOnScreen(), value = pull(event.clientX - hub.x, event.clientY - hub.y, progress);
    if (value >= 1 && progress < 1) sound?.play('ratchet');
    pullTo(value);
  });
  const letGo = () => {
    if (!grip) return; const { moved } = grip; grip = null; stage.classList.remove('is-pulling');
    if (progress >= 1) { fire(); return; }
    if (moved < 5 && progress < .05) { tween(420, t => pullTo(Math.sin(t * Math.PI) * .07, { bulbs: false }), { curve: linear }); set(next(state, 'short'), 'drag'); return; }
    springBack();
  };
  on(handle, 'pointerup', letGo); on(handle, 'pointercancel', letGo); on(handle, 'lostpointercapture', letGo);
  // From the keyboard: the arrow keys move it a fifth at a time; Enter or Space lets it go at the bottom, or pulls it the
  // rest of the way down and lets go. Left part way and the lever springs back.
  on(handle, 'keydown', event => {
    const step = { ArrowDown: .2, ArrowRight: .2, ArrowUp: -.2, ArrowLeft: -.2 }[event.key];
    if (step === undefined && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (state === 'idle') { bump(); return; }
    if (!['chosen', 'pulling'].includes(state) || grip) return;
    if (state === 'chosen') set(next(state, 'grab'));
    if (step === undefined) {
      if (progress >= 1) { fire(); return; }
      const from = progress, length = 700 * (1 - from); tween(length, t => pullTo(from + (1 - from) * t), { curve: ease });
      later(length + 20, () => { if (state === 'pulling') { sound?.play('ratchet'); fire(); } });
      return;
    }
    const value = Math.min(1, Math.max(0, Math.round((progress + step) * 5) / 5)); pullTo(value);
    if (value <= 0) set(next(state, 'short'));
  });
  on(handle, 'blur', () => { if (state === 'pulling' && !grip && progress < 1) springBack(); });

  // Let go at the bottom: the delivery (services/vending-lever.js DELIVERY).
  const span = ([from, to]) => to - from;
  // The delivery's own sounds, one after another; under reduced motion it all happens at once, so only its last bell rings.
  const cue = name => { if (!still.matches) sound?.play(name); };
  function curtains(open) { for (const pivot of theatre.curtains) { pivot.scale.x = open; pivot.scale.z = 1 + (1 - open) * 1.2; } }
  function silhouette(thing, dark) { thing.traverse(node => { if (node.isMesh) node.material = dark ? shade : node.userData.material; }); }
  function fire() {
    const id = chosen, thing = things.get(id), cell = cells[id], d = DELIVERY, stand = onStage();
    set(next(state, 'full')); sound?.play('clack'); light(1, false); latch(true);
    // The lever springs back a little past its rest and settles; the machine shudders; the hub turns all the while.
    tween(span(d.back) * .75, t => pullTo(1 - 1.06 * t, { bulbs: false }));
    tween(span(d.back) * .25, t => pullTo(-.06 + .06 * t, { bulbs: false }), { delay: span(d.back) * .75 });
    tween(span(d.shudder), t => { machine.group.rotation.z = Math.sin(t * Math.PI * 6) * .005 * (1 - t); }, { delay: d.shudder[0], curve: linear });
    tween(d.ready, t => { lever.hub.rotation.z = -t * Math.PI * 3; }, { curve: ease });
    // The cell's door comes down and its light goes out; behind it, the thing is taken up above the stage as a shadow.
    later(d.door[0], () => { cell.door.visible = true; cue('creak'); });
    tween(span(d.door), t => { cell.door.position.y = cell.door.userData.open + (cell.door.userData.shut - cell.door.userData.open) * t; }, { delay: d.door[0], curve: ease });
    glowTo(id, 0, { delay: d.door[0], length: 300 });
    later(d.door[1], () => { silhouette(thing, true); theatre.tray.add(thing); thing.position.copy(stand).setY(stand.y + .2); thing.rotation.set(0, 0, 0); });
    // The curtains light up from behind and the shadow comes down onto the stage, landing with a little bob.
    later(d.glow[0], () => cue('hum'));
    tween(span(d.glow), t => { theatre.backlight.color.copy(DARK).lerp(LIT, t); theatre.cloth.color.copy(CLOTH).lerp(GLOWING, t); theatre.cloth.opacity = 1 - .42 * t; }, { delay: d.glow[0] });
    tween(span(d.lower), t => { thing.position.y = stand.y + .2 * (1 - t); }, { delay: d.lower[0], curve: ease });
    later(d.land[0], () => cue('thud'));
    tween(span(d.land), t => { thing.position.y = stand.y + Math.sin(t * Math.PI) * .008; }, { delay: d.land[0], curve: linear });
    // The light goes out, the curtains dark again, and behind them the thing is itself; then they part on it.
    later(d.dim[0], () => cue('ding'));
    tween(span(d.dim), t => { theatre.backlight.color.copy(LIT).lerp(DIM, t); theatre.cloth.color.copy(GLOWING).lerp(CLOTH, t); theatre.cloth.opacity = .58 + .42 * t; }, { delay: d.dim[0], curve: linear });
    later(d.dim[1], () => silhouette(thing, false));
    later(d.curtains[0], () => cue('whoosh'));
    tween(span(d.curtains), t => { curtains(1 - .78 * t); spot.intensity = SPOT * t; theatre.pool.opacity = .8 * t; }, { delay: d.curtains[0], curve: ease });
    // The tray slides out with it and it turns to you, with a little bell; the stage's light falls on the snow.
    later(d.tray[0], () => { stage.dataset.lit = ''; });
    tween(span(d.tray), t => { theatre.tray.position.z = MACHINE.stage.slide * t; }, { delay: d.tray[0] });
    later(d.turn[0], () => sound?.play('jingle'));
    tween(span(d.turn), t => { thing.rotation.y = Math.sin(t * Math.PI * 2) * .26 * (1 - t); thing.position.y = stand.y + Math.sin(t * Math.PI) * .01; }, { delay: d.turn[0], curve: linear });
    // The bulbs go out one by one meanwhile, the last of the pull spent.
    d.bulbs.forEach((delay, i) => tween(280, t => bulb(4 - i, 1 - t), { delay }));
    later(d.ready, () => { shown = 0; set(next(state, 'done')); waiting(); });
  }
  // While it waits on the stage, every few seconds it sways a little.
  function waiting() {
    clearTimeout(sway); if (still.matches) return;
    sway = setTimeout(() => { if (state !== 'ready') return; const thing = things.get(chosen); tween(700, t => { thing.rotation.y = Math.sin(t * Math.PI * 2) * .12 * (1 - t); }, { curve: linear }); waiting(); }, 3200);
  }
  // Taken out: everything is put back as it was while the coloring desk covers the machine (the thing on its stand again,
  // its door up, the curtains closed and dark, the tray in, the buttons up, the lever caught at its rest, the bulbs out).
  function takeOut() {
    if (state !== 'ready') return null; const id = chosen; sound?.play('pick'); clearTimeout(sway); moves.clear();
    for (const { id: each } of ITEMS) {
      const thing = things.get(each), cell = cells[each], holder = buttons.get(each);
      silhouette(thing, false); machine.group.add(thing); thing.position.copy(home(each)); thing.rotation.set(0, 0, 0);
      cell.door.visible = false; cell.door.position.y = cell.door.userData.open; cell.glow.opacity = IDLE; holder.position.z = holder.userData.home; hits.get(each).setAttribute('aria-pressed', 'false');
    }
    curtains(1); theatre.cloth.color.copy(CLOTH); theatre.cloth.opacity = 1; theatre.backlight.color.copy(DARK); theatre.pool.opacity = 0; theatre.tray.position.z = 0; spot.intensity = 0;
    machine.group.rotation.z = 0; lever.hub.rotation.z = 0; lever.pawl.rotation.z = 0; pullTo(0, { audible: false }); delete stage.dataset.lit;
    chosen = null; set(next(state, 'take'));
    return id;
  }

  function tick(now) {
    frame = 0; ticking = true;
    for (const move of [...moves]) { if (now < move.start) continue; const t = move.length ? Math.min(1, (now - move.start) / move.length) : 1; move.step(move.curve(t)); if (t >= 1) moves.delete(move); }
    ticking = false; renderer.render(scene, camera);
    if ((now < until || moves.size) && visible && !held && !document.hidden) frame = requestAnimationFrame(tick);
  }
  // Drawn once now; or kept moving until `end` (a timestamp) while something moves; `refresh` asks for one more frame.
  function draw() { if (!frame && !ticking) renderer.render(scene, camera); }
  function animate(end) { until = Math.max(until, end); if (!frame && !ticking && visible && !held) frame = requestAnimationFrame(tick); }
  const refresh = () => animate(performance.now());
  const resizing = new ResizeObserver(() => resize()); resizing.observe(stage);
  const watch = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) animate(until); }) : null; watch?.observe(stage);
  on(document, 'visibilitychange', () => { if (!document.hidden) animate(until); });
  function stop() {
    events.abort(); cancelAnimationFrame(frame); clearTimeout(sway); moves.clear(); resizing.disconnect(); watch?.disconnect(); machine.dispose(); shade.dispose();
    for (const thing of things.values()) thing.traverse(node => { if (node.isMesh) { node.geometry.dispose(); for (const value of Object.values(node.userData.material)) if (value?.isTexture) value.dispose(); node.userData.material.dispose(); } });
    ground.geometry.dispose(); ground.material.dispose(); room.dispose(); renderer.dispose(); stage.querySelectorAll('.machine-hit, .machine-canvas, .machine-bulb').forEach(node => node.remove());
  }
  return {
    select, takeOut, trayPoint, get state() { return state; },
    // While the coloring desk covers it, the machine does not draw.
    hold(covered) { held = covered; if (covered) { cancelAnimationFrame(frame); frame = 0; } else { animate(until); draw(); } },
    destroy: stop,
  };
}
