// The Christmas Market (docs/VENDING-MARKET.md): an old town's Christmas square in the snow at dusk, stood up in three
// dimensions the way Santa's page is: paper boards (vending-plaza-art.js) cut once into pictures and set upright where
// services/market-layout.js puts them, laid out from a picture of the square so that it is seen as the picture shows it.
// The vending machine in front (vending-machine.js, in this same scene) by its lamp and its chalkboard; the Advent House
// (vending-advent.js) on the right, turned toward it; down the lane, wooden booths standing slanted to it, where three
// elves shop on and on (one sips cocoa, one reaches for a bauble, one carries presents across); a string of bulbs and
// pennants across the lane, a string of stars across the sky from under the title's sign; the town, its clock tower, the
// mountains. It does not turn round or follow the pointer; `walk` turns the view to the machine or the house and draws
// in on it, and back. It is drawn when something moves, a little more often while the elves are in sight; under reduced
// motion nothing moves, the lights are on and the elves stand still.
import * as THREE from 'three';
import { paperFilter, rasterize, shape } from './paper-art.js';
import * as ART from './vending-plaza-art.js';
import { HIP, LEG, PUFF, SHOULDER, arm, elf } from './vending-square-art.js';
import { lens, lookOf, walkAt } from '../services/market-view.js';
import { BANKS, BUSHES as BUSHES_AT, FRAME, FRAME_TALL, CORNER as CORNER_AT, CRATE as CRATE_AT, EASEL as EASEL_AT, ELVES, FIR as FIR_AT, FOREST as FOREST_AT, GIFTS as GIFTS_AT, HOUSE as HOUSE_AT, LAMP as LAMP_AT, LEFT_TOWN as LEFT_TOWN_AT, MACHINE as MACHINE_AT, MOUNTAINS as MOUNTAINS_AT, PATCHES, RIGHT_HOUSE as RIGHT_HOUSE_AT, SKY as SKY_AT, SMALL_TREE as SMALL_TREE_AT, STALLS, STARS as STARS_AT, TOWN as TOWN_AT, VIEW, WINGS, along } from '../services/market-layout.js';

const DEG = Math.PI / 180;
// How wide the lens is: as wide as the picture the square was laid out from, and never less tall than it (a wide screen
// sees more to either side, where the square runs on; a tall one more sky and cobbles); how long turning to something
// and drawing in on it takes.
const LENS = { span: FRAME.fov, low: FRAME_TALL, high: 64 * DEG }, WALK = 1700;
const HAZE = 0xc8c3d2, PAPER = { scale: 1, grain: .45, shadow: .22, rim: '#f7efe2' }, FAR = { scale: 1, grain: .4, shadow: .16, rim: '#efe6da' };
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent.append(node); return node; };

// Cut a board: its drawing on paper (and what lies under the paper's edge), painted once into a picture `px` wide; `write`
// may letter it afterwards (given the scale and the box cut).
let cuts = 0;
export async function cut({ box, draw, under }, { paper = PAPER, px = 1024, write } = {}) {
  const svg = shape('svg', { viewBox: box.join(' ') });
  if (under) under(shape('g', {}, svg));
  draw(shape('g', paper ? { filter: paperFilter(svg, `market-${++cuts}`, paper) } : {}, svg));
  const image = rasterize(svg);
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = px; canvas.height = Math.round(px * box[3] / box[2]);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (write) await write(context, canvas.width / box[2], box);
  return canvas;
}

export function mountScene(host, front) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), sharpest = matchMedia('(pointer: fine)').matches ? 2 : 1.5;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  // The machine stands in this scene too: its card and its four little things go through filmic tone mapping at half
  // exposure (the paper boards keep their colours as they are), its lamp throws its shadow (drawn again only when it
  // moves), the curtains of its little stage clip what lies behind them.
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .5;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.localClippingEnabled = true;
  renderer.domElement.className = 'market-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true'); host.append(renderer.domElement);
  // Far enough to see the sky whichever way the view turns when it walks up to something.
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, .05, 420);
  // The far things soften into the afternoon's haze.
  scene.fog = new THREE.Fog(HAZE, 40, 160);
  let disposed = false, held = false;
  const textures = new Set(), materials = new Set(), geometries = new Set(), keep = (set, value) => { set.add(value); return value; };
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const texture = (canvas, { repeat } = {}) => {
    const map = keep(textures, new THREE.CanvasTexture(canvas)); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = anisotropy;
    if (repeat) { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(...repeat); }
    // Sent to the graphics card now, while the page settles, not on the first frame it shows in (mid-walk, a stutter).
    if (!disposed) renderer.initTexture(map);
    return map;
  };
  const glows = [];
  // The opening, as the other pages' pop-up books open: once the loader has gone, each board, lying flat behind its foot,
  // stands up (a little past upright, then back), the far ones first and the near ones last; the booths' awnings fold
  // out once they stand, the shadows come; then the strings of lights are hung and the lights come on one by one. Only
  // when the page comes in with its loader, and never under reduced motion.
  const POP = 1.05, opening = { on: !motion.matches && Boolean(document.querySelector('.site-loader')), start: Infinity, last: 0 }, rising = [];
  const after = depth => 1.25 * (1 - Math.min(1, Math.max(0, (depth - 5) / 35)));
  // (`hidden`: not there at all until its turn comes, as an awning folded against a booth still lying down)
  function pop(object, delay, from = -86 * DEG, to = object.rotation.x, hidden = false) {
    if (!opening.on) return;
    object.rotation.order = 'YXZ'; object.rotation.x = from; rising.push([object, delay, from, to, hidden]); opening.last = Math.max(opening.last, delay);
    if (hidden) object.scale.y = 1e-3;
  }
  // How far up a board is, `u` of the way through its rise: up past upright by 5°, then settling back.
  const lean = (u, from, to) => { if (u < .74) { const e = 1 - (1 - u / .74) ** 3; return from + (to + 5 * DEG - from) * e; } const v = (u - .74) / .26; return to + 5 * DEG - 5 * DEG * v * v * (3 - 2 * v); };
  // The strings of lights, hung once everything stands.
  const strings = new THREE.Group(); strings.visible = !opening.on;
  // What a drawing really covers: its box, grown to take in all that is drawn past it, with room for the paper's rim.
  const reach = new Map();
  function extent(art) {
    if (reach.has(art.draw)) return reach.get(art.draw);
    const [bx, by, bw, bh] = art.box, svg = shape('svg', { viewBox: art.box.join(' '), width: 8, height: 8, style: 'position: absolute; left: -99px; visibility: hidden' }), g = shape('g', {}, svg);
    art.draw(g); document.body.append(svg);
    let box = art.box;
    try { const { x, y, width, height } = g.getBBox(), pad = Math.max(bw, bh) * .015 + 2, x0 = Math.min(bx, x - pad), y0 = Math.min(by, y - pad); box = [x0, y0, Math.max(bx + bw, x + width + pad) - x0, Math.max(by + bh, y + height + pad) - y0]; } catch { /* as drawn */ }
    svg.remove(); reach.set(art.draw, box);
    return box;
  }

  // A drawing used for more than one board is cut once (`art.draw` names it: a board's art is a copy with a grown box).
  const pictures = new Map();
  const picture = (art, options) => {
    if (options.write) return cut(art, options).then(canvas => texture(canvas));
    const key = `${options.px}`, cuts = pictures.get(art.draw) ?? new Map(); pictures.set(art.draw, cuts);
    if (!cuts.has(key)) cuts.set(key, cut(art, options).then(canvas => texture(canvas)));
    return cuts.get(key);
  };
  // A board standing on the snow (its foot on the ground at `at`), turned `turn` about its upright, its box `width`
  // metres wide; its picture comes when it is cut. Whatever is drawn past the box (snow drifting over an edge, a leaf, a
  // bow) is cut with it: the board grows to take it in, the box staying where it was put. Its glow (if it has one) lies
  // just in front of it and adds its light. `far` boards keep their colours, out of the haze.
  function board(art, { at: [x, y, z], width, height = width * art.box[3] / art.box[2], turn = 0, paper = PAPER, px = 1024, write, glow = null, far = false, parent = scene, rise = true }) {
    const [bx, by, bw, bh] = art.box, whole = extent(art), [ex, ey, ew, eh] = whole, sx = width / bw, sy = height / bh;
    const geometry = keep(geometries, new THREE.PlaneGeometry(ew * sx, eh * sy));
    geometry.translate((ex + ew / 2 - bx - bw / 2) * sx, (by + bh - ey - eh / 2) * sy, 0);
    art = { ...art, box: whole }; px = Math.min(4096, Math.round(px * ew / bw));
    const material = keep(materials, new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .35, toneMapped: false, fog: !far }));
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.rotation.y = turn; mesh.visible = false; parent.add(mesh);
    if (rise && parent === scene) pop(mesh, after(-z));
    picture(art, { paper, px, write }).then(map => { if (disposed) return; material.map = map; material.needsUpdate = true; mesh.visible = true; wake(); }).catch(error => console.error('Market board failed', error));
    if (glow) {
      const light = keep(materials, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: .9 }));
      const halo = new THREE.Mesh(geometry, light); halo.position.set(0, 0, .02); halo.visible = false; mesh.add(halo);
      cut({ box: art.box, draw: glow }, { paper: null, px: Math.min(px, 512) }).then(canvas => { if (disposed) return; light.map = texture(canvas); light.needsUpdate = true; halo.visible = true; wake(); });
      glows.push({ material: light, phase: glows.length * 1.7 });
    }
    return mesh;
  }
  // Lying on the snow: a soft pool of warm light, a soft shadow (each `width` by `depth`, turned).
  const soft = (inner, outer) => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128; const context = canvas.getContext('2d'), gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64); gradient.addColorStop(0, inner); gradient.addColorStop(.55, outer); gradient.addColorStop(1, outer.replace(/[\d.]+\)$/, '0)')); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); return texture(canvas); };
  const lightMaterial = keep(materials, new THREE.MeshBasicMaterial({ map: soft('rgba(255, 200, 130, .42)', 'rgba(255, 205, 140, .16)'), transparent: true, depthWrite: false, toneMapped: false, fog: false, opacity: .7 }));
  const shadowMaterial = keep(materials, new THREE.MeshBasicMaterial({ map: soft('rgba(110, 112, 160, .36)', 'rgba(110, 112, 160, .14)'), transparent: true, depthWrite: false, toneMapped: false }));
  let lying = 0;
  function lay(material, [x, z], width, depth, turn = 0) {
    const mesh = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(width, depth)), material);
    mesh.rotation.order = 'YXZ'; mesh.rotation.set(-Math.PI / 2, turn, 0); mesh.position.set(x, .006 + (lying++ % 4) * .0015, z); mesh.renderOrder = -1; scene.add(mesh);
    return mesh;
  }
  const pool = (at, radius) => lay(lightMaterial, at, radius * 2, radius * 2);
  const shadow = (at, width, depth, turn = 0) => lay(shadowMaterial, at, width, depth, turn);
  // A string of lights hung from one point to another (each [x, y, z]), sagging `sag` metres in its middle: a dark cord,
  // a little bulb every `every` metres (each with its glow), and pennants hung at `pennants` (shares of the way along),
  // all square to the eye.
  function hang(from, to, { sag = .45, every = .34, pennants = [] } = {}) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), at = t => a.clone().lerp(b, t).setY(a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t));
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => at(i / 24)));
    strings.add(new THREE.Mesh(keep(geometries, new THREE.TubeGeometry(curve, 64, .011, 5)), keep(materials, new THREE.MeshBasicMaterial({ color: 0x4a4048 }))));
    const n = Math.max(2, Math.round(a.distanceTo(b) / every));
    for (let i = 1; i < n; i++) { const p = at(i / n); board(ART.BULB, { at: [p.x, p.y - .085, p.z], width: .065, px: 48, paper: null, glow: ART.BULB.glow, parent: strings }); }
    for (const t of pennants) { const p = at(t); board(ART.PENNANT, { at: [p.x, p.y - .5, p.z + .01], width: .3, px: 192, parent: strings }); }
  }

  // The square as the picture has it. The cobbles under everything; the sky, the mountains, the firs on the hills, the
  // town at the end of the lane, the houses on the left, the corner building and the house at the top right.
  const ground = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(400, 220)), keep(materials, new THREE.MeshBasicMaterial({ color: 0xc9a698, toneMapped: false })));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -100); scene.add(ground);
  cut(ART.COBBLES, { paper: { scale: .5, grain: .45, shadow: .1, rim: '#dcc0b3' }, px: 1024 }).then(canvas => { if (disposed) return; ground.material.map = texture(canvas, { repeat: [267, 147] }); ground.material.color.set(0xffffff); ground.material.needsUpdate = true; wake(); });
  const sharp = art => Math.min(4096, Math.max(256, Math.round(art.box[2] * 2)));
  // A board of the picture: standing where the layout put it (`foot` its height off the ground, if any), as wide and tall
  // as the picture shows it.
  function put(art, spot, { paper = PAPER, far = false, glow = art.glow ?? null, write, parent, rise } = {}) {
    return board(art, { at: [spot.at[0], spot.foot ?? 0, spot.at[1]], width: spot.width, height: spot.height, turn: spot.turn ?? 0, paper, px: sharp(art), glow, far, write, parent, rise });
  }
  scene.add(strings);
  put(ART.SKY, SKY_AT, { paper: { scale: 2.4, grain: .3, shadow: .03, rim: '#e8e2ea' }, far: true, rise: false });
  put(ART.MOUNTAINS, MOUNTAINS_AT, { paper: { scale: 1.4, grain: .35, shadow: .08, rim: '#eef1f8' }, far: true });
  put(ART.FOREST, FOREST_AT, { paper: FAR });
  put(ART.TOWN, TOWN_AT, { paper: FAR });
  put(ART.LEFT_TOWN, LEFT_TOWN_AT, { paper: FAR });
  put(ART.RIGHT_HOUSE, RIGHT_HOUSE_AT);
  put(ART.CORNER, CORNER_AT);
  // The stalls. The booths stand slanted to the lane: the front square to its turn, the end wall nearest the eye folded
  // back from it (its left end for a booth turned to the right, its right end for one turned to the left), the awning
  // hinged under the name board and tipped out over the counter; the one at the picture's right edge is a front alone. The little lit tree and the bushes at the end of the lane; the string of stars.
  // (snow lies along each booth's foot, where it is out of the way of feet: `drifts`, laid with the snow below)
  const STALL_ART = { gifts: ART.STALL_GIFTS }, drifts = [];
  for (const stall of STALLS) {
    if (!stall.deep) { put(STALL_ART[stall.look], stall); shadow([stall.at[0], stall.at[1] + .2], stall.width + .3, .8, stall.turn); continue; }
    const { width: w, height: h, deep: d, look } = stall, front = ART.boothFront(look, w * 100, h * 100);
    put(front, stall, { glow: front.glow });
    const end = stall.turn > 0 ? -1 : 1;
    put(ART.boothSide(look, d * 100, h * .8 * 100), { at: along(stall, end * (w / 2 - .02), -d / 2), width: d, height: h * .8, turn: stall.turn + end * Math.PI / 2 });
    const reach = .62, awning = put(ART.boothAwning(look, (w + .1) * 100, reach * 100), { at: along(stall, 0, .015), foot: h * ART.HINGE, width: w + .1, height: reach, turn: stall.turn, rise: false });
    awning.rotation.order = 'YXZ'; awning.rotation.x = 118 * DEG; awning.material.side = THREE.DoubleSide;
    // (it hangs folded down against the front until the booth stands, then folds out)
    pop(awning, after(-stall.at[1]) + .75, 178 * DEG, 118 * DEG, true);
    shadow(along(stall, 0, -d / 2 + .3), w + .6, d + .9, stall.turn);
    drifts.push([along(stall, 0, .3), w * 1.05, .6, stall.turn], [along(stall, end * (w / 2 + .1), -d / 2), .7, d * 1.1, stall.turn]);
  }
  put(ART.SMALL_TREE, SMALL_TREE_AT, { paper: FAR }); put(ART.BUSHES, BUSHES_AT, { paper: FAR });
  put(ART.STARS, STARS_AT, { parent: strings });
  // Snow lying on the cobbles, and banked here and there: a drift lies at each bank's foot, so that it meets the cobbles
  // as snow does, with no straight edge.
  const patchMaterial = keep(materials, new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .2, toneMapped: false }));
  cut(ART.PATCH, { paper: { scale: .5, grain: .4, shadow: .06, rim: '#ffffff' }, px: 384 }).then(canvas => { if (disposed) return; patchMaterial.map = texture(canvas); patchMaterial.needsUpdate = true; wake(); });
  for (const patch of PATCHES) lay(patchMaterial, patch.at, patch.size, patch.size * .6, patch.size);
  for (const [at, width, depth, turn] of drifts) lay(patchMaterial, at, width, depth, turn);
  // and along the foot of the Advent House's base
  { const [hx, hz] = along(HOUSE_AT, 0, .55); lay(patchMaterial, [hx, hz], 2.6, .7, HOUSE_AT.turn); }
  for (const spot of BANKS) {
    put(ART.bank([spot.box[0], spot.box[1], spot.box[2] - spot.box[0], spot.box[3] - spot.box[1]]), spot, { paper: { scale: .8, grain: .3, shadow: .08, rim: '#ffffff' } });
    // (as deep on the ground as it takes to show a little below the bank's foot from where the visitor stands)
    const deep = Math.max(.4, spot.depth ** 2 / 170); lay(patchMaterial, [spot.at[0], spot.at[1] + deep * .4], spot.width, deep);
  }
  // Beside the machine: the lamp, the presents, the crate and the fir; the chalkboard; the presents at the house's foot.
  put(ART.LAMP, LAMP_AT); shadow([LAMP_AT.at[0] + .1, LAMP_AT.at[1]], .5, .35);
  put(ART.GIFTS_LEFT, GIFTS_AT[0]); put(ART.GIFTS_HOUSE_LEFT, GIFTS_AT[1]); put(ART.GIFTS_HOUSE_RIGHT, GIFTS_AT[2]);
  put(ART.CRATE, CRATE_AT); put(ART.FIR, FIR_AT);
  // (each with its shadow on the cobbles, so that it stands rather than floats)
  shadow([FIR_AT.at[0] + .15, FIR_AT.at[1]], FIR_AT.width * .8, .5); shadow([CRATE_AT.at[0] + .1, CRATE_AT.at[1]], CRATE_AT.width, .4);
  for (const spot of GIFTS_AT) shadow([spot.at[0] + .08, spot.at[1]], spot.width * 1.1, spot.width * .35);
  // Past the picture's edges: a fir and presents at either side.
  for (const fir of WINGS.firs) { put(ART.FIR, fir); shadow([fir.at[0], fir.at[1] + .1], fir.width * .7, .5); }
  put(ART.GIFTS_LEFT, WINGS.gifts[0]); put(ART.GIFTS_HOUSE_RIGHT, WINGS.gifts[1]);
  put(ART.EASEL, EASEL_AT, { write: letter }); shadow([EASEL_AT.at[0], EASEL_AT.at[1] + .05], .8, .4, EASEL_AT.turn);
  const [mx, mz] = MACHINE_AT.at, [hx, hz] = HOUSE_AT.at;
  pool([mx + .4, mz + .6], 1.6); pool([hx - .6, hz + .9], 1.6); pool([LAMP_AT.at[0] + .3, LAMP_AT.at[1] + .3], 1.3);
  const steps = [];
  glows.forEach(glow => { glow.last = false; });
  // The elves, each a few pieces of paper on a little group standing on the cobbles; each `step(t)` sets where
  // its pieces are at time t (seconds). A piece turns about its `pivot` (in its drawing's units).
  const elfPaper = { scale: .25, grain: .35, shadow: .25, rim: '#fbf3e3' }, H = ELVES.height, W = H * 100 / 162, unit = H / 162;
  function piece(art, width, [pu, pv], parent, px = 256) {
    const height = width * art.box[3] / art.box[2], geometry = keep(geometries, new THREE.PlaneGeometry(width, height)), [bx, by, bw, bh] = art.box;
    geometry.translate(width * (.5 - (pu - bx) / bw), height * ((pv - by) / bh - .5), 0);
    const material = keep(materials, new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .35, toneMapped: false })), mesh = new THREE.Mesh(geometry, material); mesh.visible = false; parent.add(mesh);
    cut(art, { paper: elfPaper, px }).then(canvas => { if (disposed) return; material.map = texture(canvas); material.needsUpdate = true; mesh.visible = true; wake(); });
    return mesh;
  }
  const stand = ([x, z]) => { const group = new THREE.Group(); group.position.set(x, 0, z); scene.add(group); pop(group, after(-z)); return group; };
  const shoulder = (mesh, z = .01) => mesh.position.set((SHOULDER[0] - 50) * unit, H - SHOULDER[1] * unit, z);
  { const group = stand(ELVES.cocoa), body = piece(elf({}), W, [50, 162], group), hand = piece(arm('cup'), 22 * unit, [0, 0], group); shoulder(hand);
    shadow([ELVES.cocoa[0], ELVES.cocoa[1] + .05], .6, .25);
    const puffs = [0, 1, 2].map(() => { const puff = piece(PUFF, .1, [20, 20], group, 64); puff.material.alphaTest = .01; return puff; });
    steps.push(t => {
      const lift = Math.max(0, (Math.sin(t * .9) + 1) / 2 - .35) / .65; hand.rotation.z = 2.1 * lift + .15; body.position.y = Math.sin(t * 1.8) * .005;
      const reach = .32 * H / 1.15, cup = [hand.position.x + Math.sin(hand.rotation.z) * reach, hand.position.y - Math.cos(hand.rotation.z) * reach];
      puffs.forEach((puff, i) => { const u = (t * .35 + i / 3) % 1; puff.position.set(cup[0] + Math.sin(u * 6 + i) * .03, cup[1] + .04 + u * .3, .02); puff.scale.setScalar(.6 + u); puff.material.opacity = (1 - u) * .8 * (lift > .5 ? 1 : .35); });
    }); }
  { const group = stand(ELVES.bauble), body = piece(elf({ load: 'basket', tiptoe: true, tunic: '#a84a42', hat: '#4f7d68' }), W, [50, 162], group), hand = piece(arm('bauble', '#a84a42'), 22 * unit, [0, 0], group); shoulder(hand);
    group.rotation.y = .35; shadow([ELVES.bauble[0], ELVES.bauble[1] + .05], .6, .25);
    steps.push(t => { const reach = (Math.sin(t * .7) + 1) / 2; hand.rotation.z = Math.PI * .9 * reach; body.position.y = .04 * reach; shoulder(hand); hand.position.y += .04 * reach; group.rotation.z = -.04 * reach; }); }
  { const { z, from, to } = ELVES.walk, group = stand([from, z]), body = piece(elf({ load: 'gifts', tunic: '#4f6b7d', legs: false }), W, [50, 162], group);
    const legs = [-1, 1].map(side => { const mesh = piece(LEG, 30 * unit, [5, 0], group, 128); mesh.position.set((side * 11) * unit, H - HIP * unit, -.004 * side); return mesh; });
    steps.push(t => {
      const u = (t * .07) % 1, stride = t * 5.2; group.position.x = from + (to - from) * u;
      legs.forEach((mesh, i) => { mesh.rotation.z = Math.sin(stride + i * Math.PI) * .38; });
      group.position.y = Math.abs(Math.cos(stride)) * .025; body.rotation.z = Math.sin(stride) * .03;
    }); }
  steps.forEach(step => step(6.4));
  // The chalkboard's words in the title's own letters (Mountains of Christmas), in chalk.
  async function letter(context, scale, box) {
    const [x0, y0, x1, y1] = ART.EASEL.words.map((value, i) => (value - box[i % 2]) * scale);
    try { await document.fonts.load('700 40px StorySign', 'Coloring After Vending!'); } catch { /* the plain letters */ }
    const middle = (x0 + x1) / 2, size = (y1 - y0) * .28; context.textAlign = 'center'; context.textBaseline = 'middle'; context.font = `700 ${size}px StorySign, "Noto Sans TC", sans-serif`; context.fillStyle = '#f6efe0';
    ['Coloring', 'After', 'Vending!'].forEach((word, i) => context.fillText(word, middle, y0 + (y1 - y0) * (.2 + i * .3)));
  }
  // The snow falling in front of everything, and a soft shading round the edges (css moves them).
  element('div', 'market-vignette', front);
  const flakes = element('div', 'market-flakes', front);
  for (let i = 0; i < 7; i++) { const flake = element('i', 'market-flake', flakes); flake.style.left = `${30 + (i * 37 + 11) % 44}%`; flake.style.setProperty('--delay', `${-((i * 1.9) % 12)}s`); flake.style.setProperty('--drift', `${(i % 3 - 1) * 18}px`); }

  // The view: where the eye is, which way it looks.
  const home = () => ({ eye: [...VIEW.eye], heading: VIEW.heading, pitch: VIEW.pitch });
  const eye = new THREE.Vector3(), look = new THREE.Vector3();
  let heading = VIEW.heading, pitch = VIEW.pitch, mode = 'street', trip = null;
  eye.set(...VIEW.eye);
  function frame() {
    const width = host.clientWidth || 1, height = host.clientHeight || 1, aspect = width / height;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, sharpest)); renderer.setSize(width, height, false);
    camera.aspect = aspect; if (mode === 'street' && !trip) camera.fov = lens(aspect, LENS) / DEG; camera.updateProjectionMatrix();
  }
  function place() {
    camera.position.copy(eye);
    camera.lookAt(look.set(...lookOf(heading, pitch)).add(camera.position));
    camera.updateMatrixWorld();
  }
  frame(); place();

  // Drawn on demand: while the view turns to something or back, while something animates (an `animate` callback says it goes on), and
  // slowly for the lights and the elves while the square is in sight; not at all while something covers it (`hold`). The
  // lights come on one after another from `lit` (seconds on the clock), the tree's star last.
  const hooks = new Set(), movers = new Set();
  let ticking = 0, idle = 0, last = 0, clock = 0, visible = true, lit = motion.matches ? -10 : Infinity;
  const taps = new Set();
  function wake() { if (!ticking && !disposed && !held) ticking = requestAnimationFrame(tick); }
  function tick(now) {
    ticking = 0; clearTimeout(idle);
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now; clock += dt;
    let more = false;
    if (trip) {
      const u = Math.min(1, Math.max(0, (now - trip.start) / trip.length)), pose = walkAt(trip.from, trip.to ?? home(), u, { back: trip.back });
      eye.set(...pose.eye); heading = pose.heading; pitch = pose.pitch;
      if (trip.zoom) { const t = u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2; camera.fov = trip.zoom[0] + (trip.zoom[1] - trip.zoom[0]) * t; camera.updateProjectionMatrix(); }
      if (u < 1) more = true; else { const done = trip.done; trip = null; done(); }
    }
    for (const mover of movers) if (mover(dt, clock)) more = true; else movers.delete(mover);
    if (opening.on && clock >= opening.start) {
      const t = clock - opening.start;
      for (const [object, delay, from, to, hidden] of rising) { object.rotation.x = lean(Math.min(1, Math.max(0, (t - delay) / POP)), from, to); if (hidden) object.scale.y = t >= delay ? 1 : 1e-3; }
      shadowMaterial.opacity = Math.min(1, Math.max(0, (t - .5) / 1.6));
      renderer.shadowMap.needsUpdate = true; more = true;
      if (t > opening.last + POP) { for (const [object, , , to, hidden] of rising) { object.rotation.x = to; if (hidden) object.scale.y = 1; } opening.on = false; strings.visible = true; shadowMaterial.opacity = 1; lit = clock; }
    }
    if (!motion.matches) {
      glows.forEach((glow, i) => { const on = Math.min(1, Math.max(0, (clock - lit - (glow.last ? 1.7 : Math.min(i * .045, 1.2))) / .4)); glow.material.opacity = on * (.72 + .28 * Math.sin(clock * 1.6 + glow.phase)); });
      if (clock < lit + 2.2) more = true;
      if (visible) steps.forEach(step => step(clock));
    }
    place(); renderer.render(scene, camera);
    for (const hook of hooks) hook();
    if (more) wake();
    else if (visible && !motion.matches && !document.hidden && !held) idle = setTimeout(wake, 40); else last = 0;
  }

  // A touch on the square that did not move (the machine and the house each say whether it was theirs); with a mouse,
  // the layers shift a little as it moves.
  host.dataset.mode = mode; host.setAttribute('role', 'group'); host.setAttribute('aria-label', '聖誕市集');
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  let press = null;
  on(host, 'pointerdown', event => { if (event.pointerType === 'mouse' && event.button !== 0) return; press = { id: event.pointerId, x: event.clientX, y: event.clientY }; });
  on(host, 'pointermove', event => {
    if (press && event.pointerId === press.id && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press = null;

  });
  on(host, 'pointerup', event => { const tapped = press && event.pointerId === press.id; press = null; if (tapped) for (const tap of taps) if (tap(event)) break; });
  on(host, 'pointercancel', () => { press = null; });
  const resizing = new ResizeObserver(() => { frame(); wake(); }); resizing.observe(host);
  const watch = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); }); watch.observe(host);
  on(document, 'visibilitychange', () => { if (!document.hidden) wake(); });
  // Once the page has shown (or soon, if no loader says so): the opening, or with none, the lights one after another.
  if (opening.on) shadowMaterial.opacity = 0;
  const light = () => {
    if (opening.on && opening.start === Infinity) { opening.start = clock; host.closest('.vending')?.classList.add('is-opening'); wake(); }
    else if (!opening.on && lit === Infinity) { lit = clock; wake(); }
  };
  on(window, 'site-loader:done', light); const lateLight = setTimeout(light, 6000);

  wake();

  const point = new THREE.Vector3();
  return {
    host, scene, camera, renderer, keep: { textures, materials, geometries }, texture, wake,
    get mode() { return mode; },
    // Where a point of the square shows on the page, in px from the market's corner, and how far ahead of the eye it is.
    project([x, y, z]) {
      point.set(x, y, z).applyMatrix4(camera.matrixWorldInverse); const depth = -point.z;
      point.set(x, y, z).project(camera);
      return { x: (point.x + 1) / 2 * host.clientWidth, y: (1 - point.y) / 2 * host.clientHeight, depth };
    },
    onFrame(hook) { hooks.add(hook); return () => hooks.delete(hook); },
    // Hang a string of bulbs and pennants from one point of the square to another (the Advent House ties one end).
    hang,
    // Stand something up with the rest when the page opens (the machine, the Advent House), `depth` metres away.
    pop: (object, depth) => pop(object, after(depth)),
    // A light that breathes with the square's lights (and comes on with them).
    glow(material) { glows.splice(glows.findIndex(glow => glow.last), 0, { material, phase: glows.length * 1.7 }); },
    animate(mover) { movers.add(mover); wake(); },
    // A touch on the square: each one asked says whether it takes it (the first that does, has it).
    onTap(handler) { taps.add(handler); return () => taps.delete(handler); },
    // While something covers the square (the workshop), it is not drawn at all.
    hold(covered) { held = covered; if (covered) { cancelAnimationFrame(ticking); ticking = 0; clearTimeout(idle); last = 0; } else wake(); },
    // Up to a thing and back: the view never leaves where it stands; it turns to the thing and draws in on it, as one
    // looks closer at a picture (`look`: the thing's middle; `size`, `wide`: how tall and wide it is, to fill the view),
    // and with nothing given turns back and draws out again.
    walk(to) {
      return new Promise(done => {
        if (trip && mode === 'street') trip = null;
        const now = { eye: camera.position.toArray(), heading, pitch }, base = lens(camera.aspect, LENS) / DEG;
        let target, zoom;
        if (to?.look) {
          const [ex, ey, ez] = home().eye, [lx, ly, lz] = to.look, dx = lx - ex, dz = lz - ez, flat = Math.hypot(dx, dz), dist = Math.hypot(flat, ly - ey);
          target = { eye: [ex, ey, ez], heading: Math.atan2(dx, -dz), pitch: Math.atan2(ey - ly, flat) };
          zoom = [camera.fov, Math.max(8, Math.min(base, 2 * Math.atan(Math.max(to.size / 2, (to.wide ?? 0) / 2 / camera.aspect) / dist) / DEG))];
        } else { target = home(); zoom = [camera.fov, base]; }
        mode = to ? 'near' : 'leaving'; host.dataset.mode = mode;
        const back = !to, arrive = () => { if (back) { mode = 'street'; host.dataset.mode = mode; } done(); };
        if (motion.matches) { eye.set(...target.eye); heading = target.heading; pitch = target.pitch; camera.fov = zoom[1]; camera.updateProjectionMatrix(); trip = null; arrive(); wake(); return; }
        trip = { from: now, to: target, back: true, start: performance.now(), length: WALK, done: arrive, zoom };
        wake();
      });
    },
    destroy() {
      disposed = true; cancelAnimationFrame(ticking); clearTimeout(idle); clearTimeout(lateLight); events.abort(); resizing.disconnect(); watch.disconnect();
      textures.forEach(map => map.dispose()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
      renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove(); front.replaceChildren();
    },
  };
}
