// The vending machine in Three.js (docs/VENDING-MACHINE.md): the slot machine of card from vending-papercraft.js and the
// four little things in its cells, Tripo3D's models (assets/models/vending-*-web.glb), standing in the market street
// itself (vending-scene.js): as tall as a big vending machine is, standing in its own wooden booth, its back a hand's
// width off the booth's back boards (services/market-layout.js), lit from the upper left where its lamp stands; its
// shadow falls on the cobbles and on the boards behind it. A button picks one: it stays half down, its cell lights up, the lever's catch lets go. Pulled all the
// way down and let go (five bulbs light along its arc as it goes, services/vending-lever.js), the lever sets the delivery
// going: the cell's door comes down, the curtains light up from behind and the thing's shadow is let down onto the stage,
// the light goes out and the curtains part on the thing itself, the tray slides out and it turns to you, the stage's
// light spilling onto the cobbles. Taken out (`takeOut`), everything is put back while the coloring desk covers the
// machine. Plain HTML elements lie over the buttons, the lever (a slider: drag it, or the arrow keys) and the stage
// wherever the street's view shows them, so a mouse, a finger or the keyboard all work. The street is drawn only when
// something moves; under reduced motion each thing goes straight to where it ends (the lever still follows a drag).
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { MACHINE, buildMachine } from './vending-papercraft.js';
import { ITEMS, VENDING } from '../data/vending.js';
import { DELIVERY, angle, bulbs as brightness, lit, next, pull } from '../services/vending-lever.js';

// The cells' light while waiting, the stage light's strength once the thing is shown, how much bigger the thing is on the
// stage than in its cell, and where the lever's ratchet catches as it is pulled down.
const IDLE = .35, SPOT = .07, SHOW = 1.15, NOTCHES = [.2, .4, .6, .8];
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const settle = t => 1 - (1 - t) ** 3;
const linear = t => t;
// A spring let go: from 1 back through its rest, a little past it and back again, settling at 0 (t 0–1).
const spring = t => Math.exp(-5 * t) * Math.cos(t * Math.PI * 3.2) * (1 - t ** 8);
const tone = colour => new THREE.Color(colour);
const GOLD = tone('#e0b04f'), FLASH = tone('#fff1b8'), DARK = tone('#2a2023'), LIT = tone('#f6e2b4'), DIM = tone('#5a4436'), CLOTH = tone('#8f3530'), GLOWING = tone('#c65b48'), GLASS = tone('#6b5646'), BRIGHT = tone('#fff2c4'), WARM = tone('#ffc766');
// A shadow that fades out round where it falls, never ending in an edge: `fade` is the shader's falloff over the plane.
function fading(material, fade) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPlane;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPlane = position.xy;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPlane;').replace('opacity * ( 1.0 - getShadowMask() )', `opacity * ( 1.0 - getShadowMask() ) * ${fade}`);
  };
  return material;
}

export function mountMachine(stage, { world, place, onState = () => {}, sound = null } = {}) {
  const still = matchMedia('(prefers-reduced-motion: reduce)'), events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const renderer = world.renderer, scale = place.height / MACHINE.bounds[3];
  // Everything below is in the machine's own units (vending-papercraft.js): its place in the square, `rig`, is scaled up
  // to its height there, set where it stands and turned as it stands.
  const rig = new THREE.Group(); rig.position.set(place.at[0], 0, place.at[1]); rig.rotation.y = place.turn; rig.scale.setScalar(scale); world.scene.add(rig);
  // (it stands up with the rest of the square when the page opens)
  world.pop?.(rig, -place.at[1]);
  // The card takes its colours as they are (its materials skip tone mapping); the four models, as Tripo3D showed them, go
  // through filmic tone mapping at half exposure (the street's renderer does), each with a soft studio room as its own
  // environment map (set on their materials only: as the scene's environment it would light the card too).
  const studio = new THREE.PMREMGenerator(renderer), room = studio.fromScene(new RoomEnvironment(), .04).texture; studio.dispose();
  // Lit as the street is round it: from the upper left, where its lamp stands, by a light only a little warm, the night sky
  // above and the snow below for the rest (in the street itself, so that up is up), a cool rim of moonlight from behind.
  // The key light throws the card's soft shadows; its reach is the machine's (all the way back), in the street's metres.
  const sky = new THREE.HemisphereLight('#c9d6ea', '#efe8dc', 2.1); world.scene.add(sky);
  const key = new THREE.DirectionalLight('#fff3e6', 2.5); key.position.set(-1.3, 1.9, 2.2); rig.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 3; key.shadow.bias = -.0004; key.shadow.normalBias = .004 * scale;
  Object.assign(key.shadow.camera, { left: -1.4 * scale, right: 1.5 * scale, top: 2.1 * scale, bottom: -1 * scale, near: .5 * scale, far: 7 * scale }); key.shadow.camera.updateProjectionMatrix();
  const rim = new THREE.DirectionalLight('#a9c2ee', .5); rim.position.set(2, 1.2, -1); rig.add(rim, rim.target);
  // A warm light over the stage, on only while the thing is shown there (as strong, at the machine's size, as it was made).
  const spot = new THREE.SpotLight('#ffe7c4', 0, .7 * scale, .8, .6, 2); spot.position.set(0, .29, .15); spot.target.position.set(0, .1, .11); rig.add(spot, spot.target);
  const glare = SPOT * scale * scale;
  // Its shadow on the snow, lavender as shadows on snow are, so it stands rather than floats; it fades out round the
  // machine. The stage's light, when it is lit, spills onto the cobbles in front.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), fading(new THREE.ShadowMaterial({ color: '#5d5794', opacity: .2 }), 'smoothstep( .9, .12, length( vPlane * vec2( 1.0, 1.45 ) - vec2( .08, .1 ) ) )')); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; rig.add(ground);
  // (It hides nothing behind it, and is laid on after the square's paper.)
  ground.material.depthWrite = false; ground.renderOrder = 1;
  const warmth = document.createElement('canvas'); warmth.width = warmth.height = 128;
  { const context = warmth.getContext('2d'), gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64); gradient.addColorStop(0, 'rgba(255, 214, 140, .7)'); gradient.addColorStop(.5, 'rgba(255, 214, 140, .25)'); gradient.addColorStop(1, 'rgba(255, 214, 140, 0)'); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); }
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshBasicMaterial({ map: world.texture(warmth), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, .004, .42); rig.add(spill);

  let state = 'loading', chosen = null, progress = 0, target = 0, pending = null, before = 0, shown = 0, held = false, stepping = false, until = 0, grip = null, bumping = false, sway = 0;
  const machine = buildMachine({ redraw: () => refresh() }); rig.add(machine.group);
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
  const halos = marquee.map((_, i) => { const node = element('span', 'machine-bulb', stage); node.setAttribute('aria-hidden', 'true'); node.style.setProperty('--delay', `${(-i * .73).toFixed(2)}s`); node.style.setProperty('--k', i); return node; });
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
    draw(); set('idle');
  }).catch(() => { stop(); fail(); });

  // Wherever the street's view shows the machine, the hit areas and the crest's glows follow what they cover on the page
  // (worked out again each time the street is drawn; written only when they move).
  const corners = new THREE.Box3(), point = new THREE.Vector3(), placed = new Map();
  const project = (x, y, z) => { point.set(x, y, z); rig.localToWorld(point); return world.project(point.toArray()); };
  const put = (node, styles) => { const key = Object.values(styles).join(' '); if (placed.get(node) === key) return; placed.set(node, key); Object.assign(node.style, styles); };
  function layout() {
    const [bx, by] = MACHINE.buttons.gingerbread, [, below] = MACHINE.buttons.tree, [across] = MACHINE.buttons.snowman, F = MACHINE.front;
    const least = Math.min(44, Math.abs(project(0, by, F).y - project(0, below, F).y) - 2, Math.abs(project(across, by, F).x - project(bx, by, F).x) - 2);
    for (const [id, hit] of hits) cover(hit, buttons.get(id), null, least);
    cover(tray, null, [-.17, .055, .14, .17, .305, .2]);
    placeLever();
    marquee.forEach((bulb, i) => { const at = project(bulb.x, bulb.y, bulb.z); put(halos[i], { left: `${at.x.toFixed(1)}px`, top: `${at.y.toFixed(1)}px` }); });
    const size = `${(project(.02, 0, F).x - project(-.02, 0, F).x).toFixed(1)}px`; if (stage.style.getPropertyValue('--bulb') !== size) stage.style.setProperty('--bulb', size);
  }
  function cover(hit, object, box, least = 0) {
    const xs = [], ys = [];
    if (object) { corners.setFromObject(object); for (const x of [corners.min.x, corners.max.x]) for (const y of [corners.min.y, corners.max.y]) for (const z of [corners.min.z, corners.max.z]) { const at = world.project([x, y, z]); xs.push(at.x); ys.push(at.y); } }
    else for (const x of [box[0], box[3]]) for (const y of [box[1], box[4]]) for (const z of [box[2], box[5]]) { const at = project(x, y, z); xs.push(at.x); ys.push(at.y); }
    let left = Math.min(...xs), top = Math.min(...ys), width = Math.max(...xs) - left, height = Math.max(...ys) - top;
    if (width < least) { left -= (least - width) / 2; width = least; } if (height < least) { top -= (least - height) / 2; height = least; }
    put(hit, { left: `${left.toFixed(1)}px`, top: `${top.toFixed(1)}px`, width: `${width.toFixed(1)}px`, height: `${height.toFixed(1)}px` });
  }
  // The lever's hit area covers the whole arc its knob can sweep, from its hub out.
  function placeLever() {
    const [hx, hy] = MACHINE.hub, reach = MACHINE.arm + MACHINE.knob, z = MACHINE.front + .02, xs = [], ys = [];
    for (let degrees = 20; degrees <= 160; degrees += 10) for (const r of [0, reach]) { const at = project(hx + Math.sin(degrees * Math.PI / 180) * r, hy + Math.cos(degrees * Math.PI / 180) * r, z); xs.push(at.x); ys.push(at.y); }
    const left = Math.min(...xs) - 4, top = Math.min(...ys) - 6;
    put(handle, { left: `${left.toFixed(1)}px`, top: `${top.toFixed(1)}px`, width: `${(Math.max(...xs) + 6 - left).toFixed(1)}px`, height: `${(Math.max(...ys) + 6 - top).toFixed(1)}px` });
  }
  const offFrame = world.onFrame(layout);
  // Where the machine is on the page (a touch on it from the street walks up to it), and its middle in the street.
  function frame() {
    const [x0, x1, y0, y1] = MACHINE.bounds, xs = [], ys = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [-.12, MACHINE.front]) { const at = project(x, y, z); xs.push(at.x); ys.push(at.y); }
    return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  const middle = () => { const [x0, x1, y0, y1] = MACHINE.bounds; return rig.localToWorld(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 0)).toArray(); };
  const hubOnScreen = () => { const box = stage.getBoundingClientRect(), at = project(MACHINE.hub[0], MACHINE.hub[1], MACHINE.front + .02); return { x: box.left + at.x, y: box.top + at.y }; };
  // Where the thing stands once the tray is out, in the street's pixels (the stage's layer covers the street).
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
    // The hub's gear turns with the lever while it is worked (once the machine starts, it runs on by itself).
    if (['chosen', 'pulling'].includes(state)) lever.hub.rotation.z = -value * 2.4;
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
    const ring = holder.userData.ring; tween(360, t => { ring.color.copy(GOLD).lerp(FLASH, Math.sin(t * Math.PI)); }, { curve: linear });
    for (const { id: other } of ITEMS) if (other !== id) glowTo(other, .14);
    const glow = cells[id].glow; tween(340, t => { glow.opacity = .95 * (t < .3 ? t / .3 * .78 : t < .45 ? .78 - (t - .3) / .15 * .4 : .38 + (t - .45) / .55 * .62); }, { curve: linear });
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
    const from = progress; target = 0; sound?.play('spring');
    tween(650, t => pullTo(from * spring(t), { audible: false }), { curve: linear });
    set(next(state, 'short'), 'short');
  }

  // Dragged: the knob follows the pointer round the hub; let go at the bottom it fires, anywhere else it springs back (a
  // tap that hardly moved just nods the lever, to show it wants pulling).
  on(handle, 'pointerdown', event => {
    event.preventDefault();
    if (state === 'idle') { bump(); return; }
    if (state !== 'chosen') return;
    handle.setPointerCapture(event.pointerId); grip = { x: event.clientX, y: event.clientY, moved: 0 }; target = progress; stage.classList.add('is-pulling'); set(next(state, 'grab'));
  });
  on(handle, 'pointermove', event => {
    if (!grip) return;
    grip.moved = Math.max(grip.moved, Math.hypot(event.clientX - grip.x, event.clientY - grip.y));
    // The hand sets where the lever is wanted; the lever follows a moment behind (in `tick`), and pulled down it catches at
    // each notch of its ratchet until the hand is a little past it, then catches up.
    const hub = hubOnScreen(), wanted = pull(event.clientX - hub.x, event.clientY - hub.y, target), notch = NOTCHES.find(at => progress < at && wanted > at && wanted < at + .045);
    if (wanted >= 1 && target < 1) sound?.play('ratchet');
    target = notch === undefined ? wanted : notch - .004; animate(performance.now() + 160);
  });
  const letGo = () => {
    if (!grip) return; const { moved } = grip; grip = null; stage.classList.remove('is-pulling');
    if (target >= 1) { pullTo(1); fire(); return; }
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
    tween(span(d.back) + 240, t => pullTo(spring(t), { bulbs: false }), { curve: linear });
    tween(span(d.shudder), t => { machine.group.rotation.z = Math.sin(t * Math.PI * 6) * .005 * (1 - t); }, { delay: d.shudder[0], curve: linear });
    const turned = lever.hub.rotation.z; tween(d.ready, t => { lever.hub.rotation.z = turned - t * Math.PI * 3; }, { curve: ease });
    // The cell's door comes down and its light goes out; behind it, the thing is taken up above the stage as a shadow.
    later(d.door[0], () => { cell.door.visible = true; cue('creak'); });
    const sunk = home(id).y; tween(span(d.door), t => { cell.door.position.y = cell.door.userData.open + (cell.door.userData.shut - cell.door.userData.open) * t; thing.position.y = sunk - .02 * t; }, { delay: d.door[0], curve: ease });
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
    tween(span(d.curtains), t => { curtains(1 - .78 * t); spot.intensity = glare * t; theatre.pool.opacity = .8 * t; theatre.beam.opacity = .5 * t; }, { delay: d.curtains[0], curve: ease });
    theatre.confetti.forEach((star, i) => {
      const x = -.1 + i * .04 + (i % 2 ? .008 : -.006), z = .09 + (i % 3) * .012;
      later(d.curtains[0] + 80 + i * 90, () => { star.visible = true; });
      tween(1500 + i * 110, t => { star.position.set(x + Math.sin(t * Math.PI * 2 + i) * .012, .3 - (.3 - MACHINE.stage.floor - .004) * ease(t), z); star.rotation.set(-Math.PI / 2 * t ** 3, 0, t * (3 + i)); }, { delay: d.curtains[0] + 80 + i * 90, curve: linear });
    });
    // The tray slides out with it and it turns to you, with a little bell; the stage's light falls on the snow.
    tween(span(d.tray), t => { spill.material.opacity = .9 * t; }, { delay: d.tray[0] });
    const lift = (SHOW - 1) * MACHINE.item / 2;
    tween(span(d.tray), t => { theatre.tray.position.z = MACHINE.stage.slide * t; thing.scale.setScalar(1 + (SHOW - 1) * t); thing.position.y = stand.y + lift * t; }, { delay: d.tray[0] });
    later(d.turn[0], () => { sound?.play('jingle'); stage.dataset.show = ''; });
    later(d.turn[0] + 1700, () => { delete stage.dataset.show; });
    tween(span(d.turn), t => { thing.rotation.y = Math.sin(t * Math.PI * 2) * .26 * (1 - t); thing.position.y = stand.y + lift + Math.sin(t * Math.PI) * .01; }, { delay: d.turn[0], curve: linear });
    // The bulbs go out one by one meanwhile, the last of the pull spent.
    d.bulbs.forEach((delay, i) => tween(280, t => bulb(4 - i, 1 - t), { delay }));
    later(d.ready, () => { shown = 0; set(next(state, 'done')); waiting(); });
  }
  // While it waits on the stage, every few seconds it sways a little.
  function waiting() {
    clearTimeout(sway); if (still.matches) return;
    sway = setTimeout(() => { if (state !== 'ready') return; const thing = things.get(chosen); tween(700, t => { thing.rotation.y = Math.sin(t * Math.PI * 2) * .12 * (1 - t); }, { curve: linear }); waiting(); }, 3200);
  }
  // Taken off the stage: it pops up a little in the hand; everything is put back once the workshop covers the machine.
  function takeOut() {
    if (state !== 'ready') return null; const id = chosen, thing = things.get(id); sound?.play('pick'); clearTimeout(sway); moves.clear();
    tween(240, t => thing.scale.setScalar(SHOW * (1 + Math.sin(t * Math.PI) * .16)), { curve: linear });
    pending = id; set('taken');
    return id;
  }
  // Back as it was: the thing on its stand again, its door up, the curtains closed and dark, the tray in, the stars and the
  // beam gone, the buttons up, the lever caught at its rest, the bulbs out.
  function putBack() {
    moves.clear();
    for (const { id: each } of ITEMS) {
      const thing = things.get(each), cell = cells[each], holder = buttons.get(each);
      silhouette(thing, false); machine.group.add(thing); thing.position.copy(home(each)); thing.rotation.set(0, 0, 0); thing.scale.setScalar(1);
      cell.door.visible = false; cell.door.position.y = cell.door.userData.open; cell.glow.opacity = IDLE; holder.position.z = holder.userData.home; holder.userData.ring.color.copy(GOLD); hits.get(each).setAttribute('aria-pressed', 'false');
    }
    curtains(1); theatre.cloth.color.copy(CLOTH); theatre.cloth.opacity = 1; theatre.backlight.color.copy(DARK); theatre.pool.opacity = 0; theatre.beam.opacity = 0; theatre.tray.position.z = 0; spot.intensity = 0;
    for (const star of theatre.confetti) star.visible = false;
    machine.group.rotation.z = 0; lever.hub.rotation.z = 0; lever.pawl.rotation.z = 0; target = 0; pullTo(0, { audible: false }); spill.material.opacity = 0; delete stage.dataset.show;
    pending = null; chosen = null; set(next('ready', 'take'));
  }

  // Each frame the street draws while something moves: the lever follows the hand a moment behind, the tweens step on,
  // and the key light's shadow is drawn again.
  function step() {
    const now = performance.now(), dt = Math.min(64, now - (before || now)); before = now;
    if (grip && Math.abs(target - progress) > .0005) pullTo(progress + (target - progress) * (1 - Math.exp(-dt / 45)));
    for (const move of [...moves]) { if (now < move.start) continue; const t = move.length ? Math.min(1, (now - move.start) / move.length) : 1; move.step(move.curve(t)); if (t >= 1) moves.delete(move); }
    renderer.shadowMap.needsUpdate = true;
    if ((now < until || moves.size) && !held) return true;
    stepping = false; before = 0; return false;
  }
  // Drawn once more now; or kept moving until `end` (a timestamp) while something moves; `refresh` asks for one more frame.
  function draw() { renderer.shadowMap.needsUpdate = true; world.wake(); }
  function animate(end) { until = Math.max(until, end); if (!stepping && !held) { stepping = true; world.animate(step); } }
  const refresh = () => animate(performance.now());
  function stop() {
    events.abort(); clearTimeout(sway); moves.clear(); held = true; offFrame(); world.scene.remove(rig, sky); machine.dispose(); shade.dispose();
    for (const thing of things.values()) thing.traverse(node => { if (node.isMesh) { node.geometry.dispose(); for (const value of Object.values(node.userData.material)) if (value?.isTexture) value.dispose(); node.userData.material.dispose(); } });
    for (const mesh of [ground, spill]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    key.shadow.dispose(); room.dispose(); stage.querySelectorAll('.machine-hit, .machine-bulb').forEach(node => node.remove());
  }
  return {
    select, takeOut, trayPoint, frame, middle, get state() { return state; },
    // While the coloring desk covers it, the machine does not move (the street is not drawn either).
    hold(covered) { held = covered; if (pending) putBack(); if (!covered) { animate(until); draw(); } },
    destroy: stop,
  };
}
