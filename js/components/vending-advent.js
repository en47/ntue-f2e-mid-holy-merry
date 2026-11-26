// The Advent House on the right of the market square (vending-advent-art.js draws it), built into the square in paper
// (vending-scene.js): its front in two sheets one before the other, its right wall, the underside of its eave and the
// snow along it, the two slopes of its roof under snow, two lanterns that sway, the little lights of its garland
// breathing; each of its twenty-four drawers a little box that slides out, the 24th behind two doors. Standing on the
// right of the square, turned toward the machine, it shows its right side and its roof. A touch on it (or Enter) walks the view up to it the way Santa's page
// does, nearer first and then turning to face it; there any drawer may be pulled out (this page keeps no story date),
// one at a time: it slides out, the inside of the box shows and the little thing in it comes up; touched, the little
// thing brings up that day's card with its paper scene (cabin-advent-scenes.js; a tap plays it on a step) and one line.
// Esc, ✕ or a touch beside the house goes back one step at a time: the card, the drawer, then back into the square.
// Days opened are marked with a gold star in this browser. The buttons lie over what they open, wherever the view
// shows it.
import * as THREE from 'three';
import { star } from './paper-props.js';
import { adventPicture } from './cabin-clue-art.js';
import { ADVENT_SCENES } from './cabin-advent-scenes.js';
import { cut } from './vending-scene.js';
import { BOX, CELLS, EAVE, EDGE_BOX, FEET, FLOOR, HOOK, PLINTH, PLINTH_TOP, RIDGE, ROOF_BOX, SOFFIT_BOX, WALL_BOX, back, drawerFace, edge, feet, front, glow, lantern, lanternGlow, lights, pen, plinth, plinthTop, roofTop, soffit, tray, wall } from './vending-advent-art.js';
import { HOUSE as PLACE, PENNANT_FROM } from '../services/market-layout.js';
import { ADVENT } from '../data/vending.js';

const KEY = 'holy-merry:vending:advent', DAYS = 24, DEG = Math.PI / 180;
// Where the house stands (on the right of the square, services/market-layout.js) and how it is turned, its front
// toward the square; how many metres one unit of its drawing is, how deep it runs back; how far a drawer comes out and how
// deep its box is; what of it the view takes in up close (the gable under the star down to the cobbles, the drawers across
// with a little to spare).
export const HOUSE = { at: [PLACE.at[0], 0, PLACE.at[1]], turn: PLACE.turn };
// (Its drawing stands 1612 of its units from the cobbles to the top of its star; everything that moves or lies by it is
// sized against that, K the house's size against the first one made.)
const UNIT = PLACE.height / 1612, K = UNIT / .00175, DEEP = WALL_BOX[2] * UNIT, PULL = .26 * K, BOX_DEPTH = .24 * K, NEAR = { top: -20, bottom: FLOOR + 10, across: 780 };
const PAPER = { scale: 1.6, grain: .45, shadow: .26 }, SMALL = { scale: .5, grain: .45, shadow: .3 };
// The house's outline on its front (for a touch on it): the gable, the cabinet and its base, what stands at its feet.
const OUTLINE = [[500, -160], [1070, 440], [1000, 470], [990, 1470], [-170, 1470], [-130, 1280], [0, 470], [-70, 440]];
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const read = () => { try { const days = JSON.parse(localStorage.getItem(KEY)); return new Set(Array.isArray(days) ? days.filter(day => Number.isInteger(day) && day >= 1 && day <= DAYS) : []); } catch { return new Set(); } };
const write = days => { try { localStorage.setItem(KEY, JSON.stringify([...days].sort((a, b) => a - b))); } catch { /* open for this visit */ } };
const local = (u, v, w = 0) => new THREE.Vector3((u - 500) * UNIT, (FLOOR - v) * UNIT, w * UNIT);
const ease = t => { const u = Math.min(Math.max(t, 0), 1); return u * u * (3 - 2 * u); };
const inside = (x, y, corners) => { let hit = false; for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) { const [xi, yi] = corners[i], [xj, yj] = corners[j]; if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit; } return hit; };

export function mountAdvent(layer, { world, sound = null, onLift = () => {} } = {}) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal }), still = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set(), later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const { textures, materials, geometries } = world.keep, keep = (set, value) => { set.add(value); return value; };
  // Focus moved for the visitor shows its ring only when they are using the keyboard (a touch or a click leaves no box).
  let byKeys = false;
  on(document, 'keydown', () => { byKeys = true; }); on(document, 'pointerdown', () => { byKeys = false; });
  const settle = node => node?.focus({ preventScroll: true, focusVisible: byKeys });
  const house = new THREE.Group(); house.position.set(...HOUSE.at); house.rotation.y = HOUSE.turn; world.scene.add(house); world.pop?.(house, -HOUSE.at[2]);
  let gone = false;
  // A flat sheet `width` by `height` metres, its picture coming when cut; light adds itself (and never hides what is behind).
  function sheet(width, height, { light = false, double = false } = {}) {
    const material = keep(materials, new THREE.MeshBasicMaterial(light ? { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false } : { transparent: true, alphaTest: .35, toneMapped: false, side: double ? THREE.DoubleSide : THREE.FrontSide }));
    const mesh = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(width, height)), material); mesh.visible = false;
    return mesh;
  }
  const dress = (mesh, map) => { if (gone) return; mesh.material.map = map; mesh.material.needsUpdate = true; mesh.visible = true; world.wake(); };
  const paint = (mesh, art, box, options) => cut({ box, draw: g => art(pen(g)) }, options).then(canvas => dress(mesh, world.texture(canvas))).catch(error => console.error('Advent House piece failed', error));
  // A sheet of the front standing `w` units out of it, drawn in the box [u, v, width, height] of the house's units.
  function face(art, box, { w = 0, px = 1600, paper = PAPER, light = false } = {}) {
    const [u, v, width, height] = box, mesh = sheet(width * UNIT, height * UNIT, { light });
    mesh.position.copy(local(u + width / 2, v + height / 2, w)); house.add(mesh); paint(mesh, art, box, { px, paper: light ? null : paper });
    return mesh;
  }

  // The front, in two sheets; the display base standing out from the cabinet's foot (its front, and its top seen from
  // above), the presents on the cobbles before it; the right wall (flush with the front sheet, the base's end in it), the
  // eave's underside and the snow along its edge (each ending where the roof does); a shadow on the cobbles.
  face(back, BOX, { w: 0 });
  face(front, BOX, { w: 58 });
  face(plinth, PLINTH, { w: 60, px: 1024 });
  const top = sheet(PLINTH_TOP[2] * UNIT, PLINTH_TOP[3] * UNIT); top.rotation.x = -Math.PI / 2; top.position.copy(local(PLINTH_TOP[0] + PLINTH_TOP[2] / 2, 1300, PLINTH_TOP[3] / 2)); house.add(top); paint(top, plinthTop, PLINTH_TOP, { px: 768, paper: SMALL });
  face(feet, FEET, { w: 150, px: 1024 });
  const side = sheet(DEEP, WALL_BOX[3] * UNIT); side.rotation.y = Math.PI / 2; side.position.copy(local(946, WALL_BOX[1] + WALL_BOX[3] / 2)).setZ(.1 - DEEP / 2); house.add(side); paint(side, wall, WALL_BOX, { px: 512, paper: PAPER });
  const under = sheet((1040 - 946) * UNIT, DEEP + .09, { double: true }); under.rotation.x = Math.PI / 2; under.position.copy(local(993, 445)).setZ(.11 - (DEEP + .09) / 2); house.add(under); paint(under, soffit, SOFFIT_BOX, { px: 256, paper: SMALL });
  const rim = sheet(DEEP + .1, EDGE_BOX[3] * UNIT * 1.6); rim.rotation.y = Math.PI / 2; rim.position.copy(local(1040, 425)).setZ(.12 - (DEEP + .1) / 2); house.add(rim); paint(rim, edge, EDGE_BOX, { px: 512, paper: SMALL });
  // The roof's two slopes running back from the front's gable over the house, snow on them, so that turned in the square
  // and seen from a little above it is a whole little house, not a front alone.
  { const front = 52 * UNIT, rear = .1 - DEEP - .08, ridge = local(...RIDGE), material = keep(materials, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false, transparent: true, alphaTest: .35 }));
    cut({ box: ROOF_BOX, draw: roofTop }, { px: 512, paper: SMALL }).then(canvas => { if (gone) return; material.map = world.texture(canvas); material.needsUpdate = true; world.wake(); }).catch(error => console.error('Advent House roof failed', error));
    for (const u of [EAVE[0], 1000 - EAVE[0]]) {
      const eave = local(u, EAVE[1]), geometry = keep(geometries, new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([ridge.x, ridge.y, front, eave.x, eave.y, front, eave.x, eave.y, rear, ridge.x, ridge.y, rear], 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2)); geometry.setIndex([0, 1, 2, 0, 2, 3]);
      house.add(new THREE.Mesh(geometry, material));
    } }
  { const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128; const context = canvas.getContext('2d'), gradient = context.createRadialGradient(128, 128, 8, 128, 128, 124); gradient.addColorStop(0, 'rgba(36, 25, 26, .5)'); gradient.addColorStop(1, 'rgba(36, 25, 26, 0)'); context.setTransform(1, 0, 0, .5, 0, 0); context.fillStyle = gradient; context.fillRect(0, 0, 256, 256);
    const shade = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(3.4 * K, 1.9 * K)), keep(materials, new THREE.MeshBasicMaterial({ map: world.texture(canvas), transparent: true, depthWrite: false, toneMapped: false })));
    shade.rotation.x = -Math.PI / 2; shade.position.set(.1 * K, .006, -.25 * K); house.add(shade); }
  // The lanterns' light on the cobbles before it.
  { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128; const context = canvas.getContext('2d'), gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64); gradient.addColorStop(0, 'rgba(255, 214, 140, .6)'); gradient.addColorStop(.55, 'rgba(255, 214, 140, .22)'); gradient.addColorStop(1, 'rgba(255, 214, 140, 0)'); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
    const warmth = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(3.2 * K, 1.8 * K)), keep(materials, new THREE.MeshBasicMaterial({ map: world.texture(canvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: .45 })));
    warmth.rotation.x = -Math.PI / 2; warmth.position.set(0, .008, .95 * K); house.add(warmth); }
  // The lanterns, each hung from its hook (they sway a little, slowly); their light; the garland's little lights breathing;
  // a warm glow round the house when it is pointed at.
  const swings = [-1, 1].map(sideOf => {
    const [hu, hv] = HOOK(sideOf), pivot = new THREE.Group(); pivot.position.copy(local(hu, hv, 60)); house.add(pivot);
    const box = sideOf < 0 ? [-80, 596, 150, 170] : [930, 596, 150, 170], art = sheet(box[2] * UNIT, box[3] * UNIT);
    art.position.copy(local(box[0] + box[2] / 2, box[1] + box[3] / 2)).sub(local(hu, hv)); pivot.add(art); paint(art, P => lantern(P, sideOf), box, { px: 256, paper: SMALL });
    world.glow(face(P => lanternGlow(P, sideOf), [hu - 116, 578, 232, 232], { w: 62, px: 256, light: true }).material);
    return { pivot, phase: sideOf * 1.4 };
  });
  world.glow(face(lights, [60, 430, 880, 130], { w: 60, px: 512, light: true }).material);
  // The string of bulbs and pennants across the lane, tied to the bracket of its left lantern.
  house.updateMatrixWorld(true); world.hang?.(PENNANT_FROM, house.localToWorld(local(HOOK(-1)[0], HOOK(-1)[1] - 8, HOOK(-1)[2] + 4)).toArray(), { sag: .32, pennants: [.34, .68] });
  const warm = face(glow, [-70, 250, 1140, 1140], { w: -10, px: 256, light: true }); warm.material.opacity = 0;
  world.onFrame(() => { if (still.matches) return; const t = performance.now() / 1000; for (const { pivot, phase } of swings) pivot.rotation.z = Math.sin(t * .9 + phase) * .028; });

  // The drawers: each a little box in its slot, its face toward you, the little thing lying in it; the 24th, two doors
  // before a lit niche. A gold star on the face once its day has been opened.
  const kraft = document.createElement('canvas'); kraft.width = kraft.height = 64;
  { const context = kraft.getContext('2d'); context.fillStyle = '#e3cb9f'; context.fillRect(0, 0, 64, 64); for (let i = 0; i < 160; i++) { context.fillStyle = `rgba(120, 84, 50, ${.05 + (i % 5) * .02})`; context.fillRect((i * 37) % 64, (i * 23) % 64, 2, 2); } }
  const kraftMaterial = keep(materials, new THREE.MeshBasicMaterial({ map: world.texture(kraft), toneMapped: false, side: THREE.DoubleSide }));
  const opened = read(), drawers = new Map(), pad = 4;
  // A warm round light behind the little thing once it is up; the shadow a drawer that is out casts on the ones under it.
  const halo = document.createElement('canvas'); halo.width = halo.height = 128;
  { const context = halo.getContext('2d'), gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64); gradient.addColorStop(0, 'rgba(255, 222, 150, .75)'); gradient.addColorStop(.55, 'rgba(255, 214, 140, .28)'); gradient.addColorStop(1, 'rgba(255, 214, 140, 0)'); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); }
  const dusk = document.createElement('canvas'); dusk.width = 8; dusk.height = 64;
  { const context = dusk.getContext('2d'), gradient = context.createLinearGradient(0, 0, 0, 64); gradient.addColorStop(0, 'rgba(30, 18, 14, .75)'); gradient.addColorStop(1, 'rgba(30, 18, 14, 0)'); context.fillStyle = gradient; context.fillRect(0, 0, 8, 64); }
  const haloMap = world.texture(halo), duskMap = world.texture(dusk);
  const starCut = cut({ box: [0, 0, 40, 40], draw: g => { star(g, 20, 21, 17, '#b8862e'); star(g, 20, 20, 15, '#e0b04f'); } }, { px: 96, paper: { scale: .3, grain: .4, shadow: .3 } });
  for (const cell of CELLS) {
    const { u0, v0, u1, v1, day } = cell, crown = cell.tone === 'crown', w = (u1 - u0) * UNIT, h = (v1 - v0) * UNIT, rim = pad * UNIT;
    const box = [u0 - pad, v0 - pad, u1 - u0 + pad * 2, v1 - v0 + pad * 2], drawer = new THREE.Group();
    drawer.position.copy(local((u0 + u1) / 2, (v0 + v1) / 2, 2)); house.add(drawer);
    const parts = { cell, drawer, home: drawer.position.z, t: 0, goal: 0, peek: false, wings: [], w, h };
    if (crown) {
      // The niche (lit red, arched) at the back; the little thing before it; the two doors closed over both.
      const niche = sheet(w + rim * 2, h + rim * 2); drawer.add(niche); paint(niche, P => tray(P, cell), box, { px: 384, paper: SMALL });
      const leaves = [-1, 1].map(sideOf => {
        const pivot = new THREE.Group(); pivot.position.set(sideOf * (w / 2 + rim), 0, .008); drawer.add(pivot);
        const leaf = sheet(w / 2 + rim, h + rim * 2, { double: true }); leaf.position.x = -sideOf * (w / 4 + rim / 2); pivot.add(leaf);
        parts.wings.push({ pivot, sideOf });
        return { leaf, sideOf };
      });
      cut({ box, draw: g => drawerFace(pen(g), cell) }, { px: 512, paper: SMALL }).then(canvas => {
        for (const { leaf, sideOf } of leaves) { const map = world.texture(canvas); map.repeat.set(.5, 1); map.offset.set(sideOf < 0 ? 0 : .5, 0); dress(leaf, map); }
      });
    } else {
      // The face; behind it the box: its floor, back and sides of kraft paper, out of sight in its slot until pulled.
      const front = sheet(w + rim * 2, h + rim * 2); drawer.add(front); paint(front, P => drawerFace(P, cell), box, { px: Math.round(Math.max(192, (u1 - u0) * 1.8)), paper: SMALL });
      const floor = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(w * .94, BOX_DEPTH)), kraftMaterial); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -h / 2 + .01, -BOX_DEPTH / 2); drawer.add(floor);
      const backing = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(w * .94, h * .8)), kraftMaterial); backing.position.set(0, -h * .08, -BOX_DEPTH); drawer.add(backing);
      for (const sideOf of [-1, 1]) { const wallOf = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(BOX_DEPTH, h * .8)), kraftMaterial); wallOf.rotation.y = Math.PI / 2; wallOf.position.set(sideOf * w * .47, -h * .08, -BOX_DEPTH / 2); drawer.add(wallOf); }
    }
    // The little thing, lying in the box (in the niche) until the drawer comes out; its light; the drawer's shadow.
    const size = crown ? Math.min(w, h) * .74 : Math.min(Math.max(w, h) * 1.05, .26 * K), gift = sheet(size, size, { double: true });
    gift.position.set(0, crown ? 0 : -h / 2 + size * .45, crown ? .004 : -BOX_DEPTH * .5); drawer.add(gift);
    const light = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(size * 1.9, size * 1.9)), keep(materials, new THREE.MeshBasicMaterial({ map: haloMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 })));
    light.position.z = -.004; light.renderOrder = 1; gift.add(light); gift.renderOrder = 2;
    const shadow = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(w * 1.04, h * .7)), keep(materials, new THREE.MeshBasicMaterial({ map: duskMap, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })));
    shadow.position.set(0, -h / 2 - h * .35 - rim, .001); if (!crown) drawer.add(shadow);
    const picture = new Image(); picture.decoding = 'async'; picture.src = adventPicture(ADVENT.art[day - 1]).slice(5, -2);
    picture.decode().then(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256; canvas.getContext('2d').drawImage(picture, 0, 0, 256, 256); dress(gift, world.texture(canvas)); }).catch(() => {});
    const mark = sheet(.055 * K, .055 * K); mark.position.set(w / 2 - .016 * K, h / 2 - .016 * K, crown ? .012 : .006); drawer.add(mark);
    starCut.then(canvas => { dress(mark, world.texture(canvas)); mark.visible = opened.has(day); });
    Object.assign(parts, { gift, size, mark, light, shadow });
    drawers.set(day, parts);
  }
  // Each drawer eases toward where it is going: out, the box slides out, the little thing in it comes up out of it and
  // then forward, before the drawer, a light behind it (on the way back in it goes back down first); the 24th's doors
  // swing open toward you. Pointed at, a drawer stands out a finger's width.
  function pose(parts) {
    const { drawer, home, t, wings, gift, h, size, cell, mark, light, shadow } = parts, out = ease(t), rise = ease((t - .28) / .42), forth = ease((t - .7) / .3);
    light.material.opacity = forth;
    if (cell.tone === 'crown') {
      for (const { pivot, sideOf } of wings) pivot.rotation.y = sideOf * 104 * DEG * out;
      gift.position.z = .004 + .09 * forth; gift.scale.setScalar(.8 + .25 * forth); mark.visible = opened.has(cell.day) && t < .2;
    } else {
      drawer.position.z = home + PULL * out; shadow.position.z = .001 - PULL * out; shadow.material.opacity = .6 * out;
      const low = -h / 2 + size * .45, high = h / 2 + size * .46;
      gift.position.y = low + (high - low) * rise; gift.position.z = -BOX_DEPTH * .5 + (BOX_DEPTH * .5 - .02) * rise + .07 * forth; gift.scale.setScalar(.8 + .38 * forth);
    }
  }
  let moving = false;
  function nudge() {
    if (moving) return; moving = true;
    world.animate(dt => {
      let more = false;
      for (const parts of drawers.values()) {
        const goal = parts.goal || (parts.peek ? .2 : 0);
        if (parts.t === goal) continue;
        const step = still.matches ? 1 : dt / (goal > parts.t ? .55 : .4);
        parts.t = goal > parts.t ? Math.min(goal, parts.t + step) : Math.max(goal, parts.t - step); pose(parts);
        if (parts.t !== goal) more = true;
      }
      moving = more; return more;
    });
  }

  // The buttons lie over what they open, wherever the view shows it: the house itself from the street (for the keys; a
  // touch is found on its outline), each drawer's face and the little thing in a drawer that is out from up close; ✕ by
  // the house's top corner.
  const lift = element('button', 'cal-lift', layer); lift.type = 'button'; lift.setAttribute('aria-label', ADVENT.lift);
  const shut = element('button', 'cal-shut', layer, '✕'); shut.type = 'button'; shut.setAttribute('aria-label', ADVENT.back); shut.hidden = true;
  const grid = element('div', 'cal-doors', layer); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', ADVENT.title); grid.inert = true;
  for (const [day, parts] of drawers) {
    const door = element('button', 'cal-door', grid), button = element('button', 'cal-gift', grid);
    door.type = button.type = 'button'; door.dataset.day = button.dataset.day = day; door.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', ADVENT.gift(day)); button.hidden = true;
    const label = () => { door.setAttribute('aria-label', opened.has(day) ? ADVENT.opened(day) : ADVENT.door(day)); door.toggleAttribute('data-read', opened.has(day)); }; label();
    Object.assign(parts, { door, button, label });
    on(door, 'click', () => (out === day ? push(day) : pull(day)));
    on(door, 'pointerenter', () => { parts.peek = true; nudge(); }); on(door, 'pointerleave', () => { parts.peek = false; nudge(); });
    on(button, 'click', () => { sound?.play('pick'); show(day, button); });
  }
  const corner = new THREE.Vector3();
  function boxOf(object, points) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const [x, y, z] of points) { corner.set(x, y, z); object.localToWorld(corner); const at = world.project(corner.toArray()); left = Math.min(left, at.x); right = Math.max(right, at.x); top = Math.min(top, at.y); bottom = Math.max(bottom, at.y); }
    return { left, top, width: right - left, height: bottom - top };
  }
  const placed = new Map();
  const setBox = (node, { left, top, width, height }) => {
    const key = `${left.toFixed(1)} ${top.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`;
    if (placed.get(node) === key) return; placed.set(node, key);
    Object.assign(node.style, { left: `${left.toFixed(1)}px`, top: `${top.toFixed(1)}px`, width: `${width.toFixed(1)}px`, height: `${height.toFixed(1)}px` });
  };
  const square = (w, h) => [[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0]];
  const [bx, by, bw, bh] = BOX, whole = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]].map(([u, v]) => local(u, v).toArray());
  const outline = OUTLINE.map(([u, v]) => local(u, v).toArray()), flank = [[946, 430, 10], [946, 430, -515], [946, 1470, -515], [946, 1470, 10]].map(([u, v, w]) => local(u, v, w).toArray());
  // Where the house is on the page: its outline on the front, and its side.
  const shapes = () => [outline, flank].map(points => points.map(([x, y, z]) => { corner.set(x, y, z); house.localToWorld(corner); const at = world.project(corner.toArray()); return [at.x, at.y]; }));
  const onHouse = event => { const box = world.host.getBoundingClientRect(), x = event.clientX - box.left, y = event.clientY - box.top; return shapes().some(points => inside(x, y, points)); };
  function overlay() {
    if (gone) return;
    const all = boxOf(house, whole);
    if (!near) { setBox(lift, all); return; }
    Object.assign(shut.style, { left: `${Math.min(all.left + all.width * .8, layer.clientWidth - 60).toFixed(1)}px`, top: `${Math.max(all.top + all.height * .08, 12).toFixed(1)}px` });
    for (const { w, h, drawer, door, button, size, gift } of drawers.values()) {
      setBox(door, boxOf(drawer, square(w, h)));
      if (!button.hidden) setBox(button, boxOf(gift, square(size, size)));
    }
  }
  world.onFrame(overlay);

  // One drawer out at a time: another one asked for, the one out goes back in first.
  let out = 0, near = false, leaving = false;
  function pull(day) {
    const go = () => {
      const parts = drawers.get(day), first = !opened.has(day);
      out = day; parts.goal = 1; parts.door.setAttribute('aria-expanded', 'true'); sound?.play('open'); nudge();
      later(still.matches ? 0 : 420, () => { if (out === day) { parts.button.hidden = false; world.wake(); } });
      if (first) { opened.add(day); write(opened); parts.label(); if (parts.cell.tone !== 'crown') parts.mark.visible = true; }
    };
    if (out) { push(out); later(still.matches ? 0 : 380, go); } else go();
  }
  function push(day = out) {
    if (!day) return;
    const parts = drawers.get(day); parts.goal = 0; parts.button.hidden = true; parts.door.setAttribute('aria-expanded', 'false'); if (out === day) out = 0; sound?.play('remove'); nudge();
  }
  // Closer to the house (the view turns to it and draws in); back into the square.
  function liftDown() {
    if (near || leaving || world.mode !== 'street') return; near = true; lift.hidden = true; shut.hidden = false; onLift(true); sound?.play('whoosh'); warm.material.opacity = 0; world.host.classList.remove('is-pointing');
    const middle = house.localToWorld(local(500, (NEAR.top + NEAR.bottom) / 2));
    world.walk({ look: middle.toArray(), size: (NEAR.bottom - NEAR.top) * UNIT / .94, wide: NEAR.across * UNIT / .94 }).then(() => {
      if (!near) return; grid.inert = false; world.wake();
      settle(grid.querySelector('.cal-door:not([data-read])') ?? grid.querySelector('.cal-door'));
    });
  }
  function hangBack() {
    if (!near) return; push(); near = false; leaving = true; grid.inert = true; shut.hidden = true; world.host.classList.remove('is-over'); onLift(false); sound?.play('whoosh');
    world.walk(null).then(() => { leaving = false; if (near) return; lift.hidden = false; world.wake(); settle(lift); });
  }
  const step = () => { if (out) { const { door } = drawers.get(out); push(); settle(door); } else hangBack(); };
  on(lift, 'click', liftDown); on(shut, 'click', step);
  on(lift, 'focus', () => { if (lift.matches(':focus-visible')) point(true); }); on(lift, 'blur', () => point(false));
  const point = lit => { if (warm.material.opacity !== +lit) { warm.material.opacity = +lit; world.wake(); } world.host.classList.toggle('is-pointing', lit); };
  on(lift, 'focus', () => point(true)); on(lift, 'blur', () => point(false));
  // Pointed at from the street, the house glows a little and takes a touch; up close, a touch beside it goes back.
  on(world.host, 'pointermove', event => {
    if (event.pointerType === 'touch' || leaving) return;
    if (near) world.host.classList.toggle('is-over', onHouse(event)); else point(world.mode === 'street' && onHouse(event));
  });
  on(world.host, 'pointerleave', () => { world.host.classList.remove('is-over'); if (!near) point(false); });
  on(document, 'keydown', event => { if (event.key === 'Escape' && near && !note.open) { event.preventDefault(); step(); } });
  // A touch on the house from the street walks up to it; up close, a touch beside it is one step back.
  // (It says whether the touch was its: the machine across the lane may want it otherwise.)
  world.onTap(event => {
    if (note.open || leaving) return near || leaving;
    if (near) { if (!onHouse(event) || out) step(); return true; }
    if (world.mode === 'street' && onHouse(event)) { liftDown(); return true; }
    return false;
  });

  // The card: the date, the day's little scene (a tap plays it on), its line, and 收好.
  const note = element('dialog', 'cal-note', layer); note.setAttribute('aria-labelledby', 'cal-date');
  const date = element('p', 'cal-date', note); date.id = 'cal-date';
  const view = element('button', 'cal-scene', note); view.type = 'button';
  const line = element('p', 'cal-line', note), close = element('button', 'cal-close', note, ADVENT.close); close.type = 'button';
  const scenes = new Map();
  let staged = null, rounds = 0, from = null;
  function show(day, button) {
    from = button; date.textContent = ADVENT.date(day); line.textContent = ADVENT.days[day - 1].text; view.setAttribute('aria-label', ADVENT.days[day - 1].play);
    if (!scenes.has(day)) { const host = element('div', 'cal-cut', view); scenes.set(day, { host, ...ADVENT_SCENES[day - 1](host) }); }
    for (const [each, scene] of scenes) scene.host.hidden = each !== day;
    staged = scenes.get(day); rounds = 0; staged.reset();
    if (!note.open) note.showModal();
    settle(close);
    // Its pieces stand up one after another, like a pop-up page, then it plays once.
    const pieces = [...staged.host.children].filter(piece => piece.style.opacity !== '0');
    if (still.matches) { staged.play(0, sound); return; }
    pieces.forEach((piece, i) => piece.animate(i ? [{ opacity: 0, transform: 'perspective(600px) rotateX(78deg)', transformOrigin: '50% 100%' }, { opacity: 1, transform: 'none', transformOrigin: '50% 100%' }] : [{ opacity: 0 }, { opacity: 1 }], { duration: i ? 650 : 400, delay: i * 110, easing: 'cubic-bezier(.2,.8,.3,1.1)', fill: 'backwards' }));
    const current = staged; later(pieces.length * 110 + 650, () => { if (staged === current && note.open) current.play(0, sound); });
  }
  on(view, 'click', () => { if (!staged) return; rounds = (rounds + 1) % staged.steps; if (!rounds && staged.steps > 1) staged.reset(); staged.play(rounds, sound); });
  on(close, 'click', () => note.close());
  on(note, 'close', () => { sound?.play('remove'); settle(from); });
  world.wake();
  return {
    // One step back, like Esc.
    close: step,
    get near() { return near; },
    destroy() { gone = true; events.abort(); timers.forEach(clearTimeout); if (note.open) note.close(); for (const { host } of scenes.values()) host.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); world.scene.remove(house); world.host.classList.remove('is-pointing', 'is-over'); layer.replaceChildren(); },
  };
}
