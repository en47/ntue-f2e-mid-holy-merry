// The vending machine as a 1930s Christmas slot machine, built in Three.js out of layered card (docs/VENDING-MACHINE.md).
// Top to bottom: a round crest, a sunburst of cream strips behind a stepped wine plaque that says CHRISTMAS VENDING in
// paper letters, eleven little bulbs round its gold rim, snow on its shoulders, holly and a star; four arched cells, each
// with a cream stand, a warm light and a door that slides down; a cream keypad with four round paper buttons, each with its
// thing drawn on it; a little theatre with a gold proscenium, red paper curtains, a paper behind them that can be lit and a
// tray that slides out; two green steps underneath. On the right the lever swings in front of a half-round green plate with
// five bulbs along its arc. Every sheet is matte card with a fine grain, its face and its cut edge two shades; the layers
// throw soft shadows on one another (vending-machine.js lights them and moves the parts).
// Sizes are in the scene's units: the machine is 0.5 wide, its foot at y 0, the face of its front board at z MACHINE.front.
import * as THREE from 'three';
import { marqueeGlyphs } from '../data/marquee-glyphs.js';
import { LEVER } from '../services/vending-lever.js';
import { drawingSvg } from './vending-coloring.js';

export const MACHINE = {
  width: .5, front: .105, item: .13,
  // Where the crest's half circle is centred (its radius is half the width); the outline with the lever all the way down.
  arch: .91, bounds: [-.29, .49, 0, 1.27],
  // Each cell's foot (its middle), a cell's width and height, and how high its stand's top is above its foot.
  cells: { gingerbread: [-.0975, .7175], snowman: [.0975, .7175], tree: [-.0975, .5325], stocking: [.0975, .5325] }, cell: [.18, .17], stand: .0175,
  // The buttons sit as their cells do; the radius of the face that is pressed.
  buttons: { gingerbread: [-.05, .4675], snowman: [.05, .4675], tree: [-.05, .3975], stocking: [.05, .3975] }, button: .024,
  // The lever: its hub, the arm to the middle of the knob, the knob, the plate, and the arc the bulbs stand on.
  hub: [.285, .6], arm: .17, knob: .026, plate: .135, ring: .105,
  // The stage: its floor, the back wall, how far the tray slides out, and where the thing stands on the tray.
  stage: { floor: .08, back: -.045, slide: .04, stand: [0, .08, .1] },
};
const C = {
  red: '#b5443c', redEdge: '#7a2f2a', wine: '#7f2f2a', wineEdge: '#5a201d', gold: '#e0b04f', goldEdge: '#a8803a', goldDeep: '#c99a3c',
  cream: '#fbf3df', creamEdge: '#d8c8a8', pale: '#f1ddb0', pine: '#3f6653', pineEdge: '#2c4a3d', liner: '#243b34', cell: '#36564c',
  snow: '#fbf8f1', snowEdge: '#d7e0e6', hollyLight: '#5f8a70', berry: '#b5443c', berryEdge: '#7f312c', curtain: '#8f3530',
  stage: '#251c21', woodEdge: '#8f6342', glass: '#6b5646', door: '#efe1c2',
};

const noise = i => { const value = Math.sin(i * 12.9898) * 43758.5453; return value - Math.floor(value); };
const v2 = (x, y) => new THREE.Vector2(x, y);
// A rounded rectangle traced in short steps, each nudged a hair in or out, like card cut by hand (no wobble: die-cut).
function rounded(x, y, width, height, radius, seed = 0, wobble = .0006) {
  const points = [];
  const add = (px, py, nx, ny) => { const k = (noise(seed + points.length * 1.7) * 2 - 1) * wobble; points.push(v2(px + nx * k, py + ny * k)); };
  const line = (x0, y0, x1, y1, nx, ny) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / .012)); for (let i = 0; i < n; i++) add(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, nx, ny); };
  const arc = (cx, cy, from) => { for (let i = 0; i < 6; i++) { const a = from + i / 6 * Math.PI / 2; add(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, Math.cos(a), Math.sin(a)); } };
  line(x + radius, y, x + width - radius, y, 0, -1); arc(x + width - radius, y + radius, -Math.PI / 2);
  line(x + width, y + radius, x + width, y + height - radius, 1, 0); arc(x + width - radius, y + height - radius, 0);
  line(x + width - radius, y + height, x + radius, y + height, 0, 1); arc(x + radius, y + height - radius, Math.PI / 2);
  line(x, y + height - radius, x, y + radius, -1, 0); arc(x + radius, y + radius, Math.PI);
  return points;
}
// A rectangle whose top is a shallow arch, `rise` higher in the middle than at its sides.
function arched(x, y, width, height, rise) {
  const r = (width * width / 4 + rise * rise) / (2 * rise), cx = x + width / 2, cy = y + height - r, from = Math.atan2(r - rise, width / 2), points = [v2(x, y), v2(x + width, y)];
  for (let i = 0; i <= 18; i++) { const a = from + (Math.PI - 2 * from) * i / 18; points.push(v2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  return points;
}
const circle = (cx, cy, r, steps = 40) => Array.from({ length: steps }, (_, i) => v2(cx + Math.cos(i / steps * Math.PI * 2) * r, cy + Math.sin(i / steps * Math.PI * 2) * r));
// Part of a ring between two radii, from angle a0 to a1 (radians, anticlockwise from the right).
function band(cx, cy, inner, outer, a0, a1, steps = 56) {
  const points = [];
  for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; points.push(v2(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer)); }
  for (let i = steps; i >= 0; i--) { const a = a0 + (a1 - a0) * i / steps; points.push(v2(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)); }
  return points;
}
const star = (cx, cy, outer, inner) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? inner : outer; return v2(cx + Math.cos(a) * r, cy + Math.sin(a) * r); });
// A holly leaf: a narrow oval with a few points along each side, its stem at the origin.
const leaf = (length, width) => Array.from({ length: 24 }, (_, i) => { const t = i / 24 * Math.PI * 2, spike = i % 4 === 2 ? 1.28 : 1; return v2(Math.cos(t) * length / 2 + length / 2, Math.sin(t) * width / 2 * spike); });
// Snow over the crest from a0 to a1 (degrees): a cap over its edge, hanging down in drips between the bulbs.
function snowCap(a0, a1, drips) {
  const R = MACHINE.width / 2, top = [], bottom = [];
  for (let a = a0; a <= a1 + 1e-6; a += 1.5) {
    const k = Math.min(1, Math.min(a - a0, a1 - a) / 6), t = a * Math.PI / 180;
    const drop = Math.max(0, ...drips.map(([at, depth, width]) => depth * Math.max(0, 1 - ((a - at) / width) ** 2) ** .7));
    top.push([R + .0125 * k + Math.sin(a * .9) * .0017, t]); bottom.push([R - .004 * k - drop, t]);
  }
  return [...top, ...bottom.reverse()].map(([r, t]) => v2(Math.cos(t) * r, MACHINE.arch + Math.sin(t) * r));
}
// A letter's outline (font units, y down) as Three.js shapes; its biggest outline is its outside, whichever way it winds.
function glyphShapes(d) {
  const path = new THREE.ShapePath(), parts = d.match(/[MLQCZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0; const n = () => +parts[i++];
  while (i < parts.length) {
    const command = parts[i++];
    if (command === 'M') path.moveTo(n(), -n()); else if (command === 'L') path.lineTo(n(), -n());
    else if (command === 'Q') path.quadraticCurveTo(n(), -n(), n(), -n()); else if (command === 'C') path.bezierCurveTo(n(), -n(), n(), -n(), n(), -n());
  }
  const biggest = path.subPaths.map(sub => sub.getPoints()).reduce((a, b) => Math.abs(THREE.ShapeUtils.area(a)) >= Math.abs(THREE.ShapeUtils.area(b)) ? a : b);
  return path.toShapes(!THREE.ShapeUtils.isClockWise(biggest));
}

const canvas = (width, height = width) => { const node = document.createElement('canvas'); node.width = width; node.height = height; return node; };
const texture = (node, repeat = 1) => { const map = new THREE.CanvasTexture(node); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; if (repeat !== 1) { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(repeat, repeat); } return map; };
// The paper's grain: faint short fibres every which way and a dusting of specks, on white, repeating without a seam.
function grainTexture() {
  const size = 256, node = canvas(size), g = node.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 700; i++) {
    const x = noise(i * 3 + 1) * size, y = noise(i * 3 + 2) * size, a = noise(i * 3 + 3) * Math.PI, length = 2 + noise(i + 900) * 7;
    g.strokeStyle = `rgba(110, 92, 70, ${(.04 + noise(i + 1800) * .05).toFixed(3)})`; g.lineWidth = .6 + noise(i + 2700) * .7;
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * length, y + dy + Math.sin(a) * length); g.stroke(); }
  }
  for (let i = 0; i < 2200; i++) { g.fillStyle = noise(i + 9000) > .5 ? 'rgba(0, 0, 0, .035)' : 'rgba(255, 255, 255, .5)'; g.fillRect(noise(i + 5000) * size, noise(i + 7000) * size, 1, 1); }
  return texture(node, 9);
}
// A soft round light, white in the middle and clear at its edge; `top` lifts its middle, for a cell lit from above.
function glowTexture(top = .5) {
  const node = canvas(128), g = node.getContext('2d'), light = g.createRadialGradient(64, 128 * (1 - top), 0, 64, 128 * (1 - top), 76);
  light.addColorStop(0, 'rgba(255, 255, 255, 1)'); light.addColorStop(.45, 'rgba(255, 255, 255, .38)'); light.addColorStop(1, 'rgba(255, 255, 255, 0)');
  g.fillStyle = light; g.fillRect(0, 0, 128, 128);
  return texture(node);
}
// A cell's door: cream card with gold rays rising from a half sun along a gold foot.
function doorTexture() {
  const node = canvas(256), g = node.getContext('2d'); g.fillStyle = C.door; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#d9b866'; g.lineWidth = 3;
  for (const x of [4, 50, 96, 160, 206, 252]) { g.beginPath(); g.moveTo(128, 236); g.lineTo(x, -4); g.stroke(); }
  g.fillStyle = C.gold; g.beginPath(); g.arc(128, 226, 36, Math.PI, 0); g.fill(); g.fillRect(0, 226, 256, 30);
  return texture(node);
}
// The stage's boards: warm planks running across.
function woodTexture() {
  const node = canvas(256, 128), g = node.getContext('2d');
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#b98a5a' : '#ad7f52'; g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(90, 58, 34, .45)'; g.fillRect(0, i * 32 + 30, 256, 2); }
  return texture(node);
}
// A button's face: cream paper with its thing drawn on it (vending-coloring.js), laid over the disc (whose UVs run from
// -radius to radius).
function iconTexture(id, redraw) {
  const node = canvas(256), g = node.getContext('2d'); g.fillStyle = C.cream; g.fillRect(0, 0, 256, 256);
  const map = texture(node), scale = 1 / (2 * MACHINE.button); map.repeat.set(scale, scale); map.offset.set(.5, .5);
  const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(drawingSvg(id))}`;
  image.decode().then(() => { g.drawImage(image, 51, 36, 154, 184); map.needsUpdate = true; redraw(); }).catch(() => {});
  return map;
}

// Builds the machine; `redraw` is called when something drawn later (a button's picture) is ready.
export function buildMachine({ redraw = () => {} } = {}) {
  const F = MACHINE.front, R = MACHINE.width / 2, A = MACHINE.arch, [cw, ch] = MACHINE.cell, group = new THREE.Group();
  const geometries = [], materials = new Set(), textures = [], cache = new Map();
  const own = material => { materials.add(material); return material; }, keep = map => { textures.push(map); return map; };
  const grain = keep(grainTexture()), round = keep(glowTexture()), above = keep(glowTexture(.82)), wood = keep(woodTexture()), doorFace = keep(doorTexture());
  const paper = (color, { map = grain, side = THREE.FrontSide } = {}) => { const key = `${color}${map?.uuid ?? ''}${side}`; if (!cache.has(key)) cache.set(key, own(new THREE.MeshLambertMaterial({ color, map, side, toneMapped: false }))); return cache.get(key); };
  const card = (face, edge) => [paper(face), paper(edge)];
  // Six faces of a box: its sides, top, bottom, front, back.
  const faces = (side, top, bottom, front, back = side) => [paper(side), paper(side), paper(top), paper(bottom), paper(front), paper(back)];
  const mesh = (geometry, material, parent = group, x = 0, y = 0, z = 0) => { geometries.push(geometry); const node = new THREE.Mesh(geometry, material); node.position.set(x, y, z); node.castShadow = node.receiveShadow = true; parent.add(node); return node; };
  const sheet = (outline, depth, segments = 8) => new THREE.ExtrudeGeometry(outline instanceof THREE.Shape || Array.isArray(outline[0]?.curves) ? outline : new THREE.Shape(outline), { depth, bevelEnabled: false, curveSegments: segments });
  const cut = (outline, holes = []) => { const shape = new THREE.Shape(outline); shape.holes.push(...holes.map(hole => new THREE.Path(hole))); return shape; };
  // A sheet of card on the front, its back at z, `thick` thick.
  const layer = (outline, thick, [face, edge], z, parent = group) => mesh(sheet(outline, thick), card(face, edge), parent, 0, 0, z);
  // A disc standing out of the front (a cylinder turned to face +z), its face and rim two colours.
  const disc = (radius, thick, face, edge, parent, x, y, z) => { const node = mesh(new THREE.CylinderGeometry(radius, radius, thick, 32), [paper(edge), paper(face), paper(face)], parent, x, y, z); node.rotation.x = Math.PI / 2; return node; };
  const flat = node => { node.castShadow = node.receiveShadow = false; return node; };

  // The plinth: two green steps, a gold line along each, snow drifted against the corners.
  for (const [width, y, depth] of [[.56, 0, .27], [.53, .025, .25]]) {
    mesh(new THREE.BoxGeometry(width, .025, depth), faces(C.pineEdge, C.pine, C.pineEdge, C.pine), group, 0, y + .0125, .0125);
    mesh(new THREE.BoxGeometry(width + .002, .0035, .004), paper(C.gold), group, 0, y + .0228, .0125 + depth / 2 + .001);
  }
  const drift = Array.from({ length: 17 }, (_, i) => v2(-.045 + i / 16 * .09, Math.sin(i / 16 * Math.PI) ** .8 * (.017 + noise(i + 3) * .006)));
  for (const x of [-.262, .262]) layer(drift, .06, [C.snow, C.snowEdge], .095).position.x = x;

  // The cabinet, open at the front (the cells and the stage reach into it), and over it the front board: red card cut to the
  // machine's outline with its round crest, the display and the stage cut through it.
  const none = own(new THREE.MeshBasicMaterial({ visible: false }));
  mesh(new THREE.BoxGeometry(.49, A - .05, .15), [paper(C.redEdge), paper(C.redEdge), paper(C.redEdge), paper(C.redEdge), none, paper(C.redEdge)], group, 0, (A + .05) / 2, F - .135);
  const outline = [v2(-R, .05), v2(R, .05)];
  for (let i = 1; i < 30; i++) outline.push(v2(R + (noise(i + 40) - .5) * .0012, .05 + (A - .05) * i / 30));
  for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI, r = R + (noise(i + 7) - .5) * .0012; outline.push(v2(Math.cos(a) * r, A + Math.sin(a) * r)); }
  for (let i = 29; i > 0; i--) outline.push(v2(-R + (noise(i + 90) - .5) * .0012, .05 + (A - .05) * i / 30));
  const display = rounded(-.1935, .5265, .387, .367, .0125, 0, 0), opening = arched(-.155, .08, .31, .22, .035);
  layer(cut(outline, [display, opening]), .06, [C.red, C.redEdge], F - .06);

  // The crest: a sunburst of cream and pale gold strips, a fine gold line round it, a gold rim with eleven little bulbs.
  for (let i = 0; i < 13; i++) {
    const a0 = Math.PI - i * Math.PI / 13 - .004, a1 = a0 - Math.PI / 13 + .008, points = [v2(0, A)];
    for (let j = 0; j <= 8; j++) { const a = a0 + (a1 - a0) * j / 8; points.push(v2(Math.cos(a) * .21, A + Math.sin(a) * .21)); }
    layer(points, .003, [i % 2 ? C.pale : C.cream, C.creamEdge], F);
  }
  layer(band(0, A, .2162, .22, 0, Math.PI), .003, [C.gold, C.goldEdge], F);
  layer(band(0, A, .2325, .25, 0, Math.PI, 72), .007, [C.gold, C.goldEdge], F);
  const glassGeometry = new THREE.SphereGeometry(.0068, 16, 12), marquee = [], shining = own(new THREE.MeshLambertMaterial({ color: '#fff2c6', emissive: '#ffcf70', emissiveIntensity: .55, toneMapped: false }));
  geometries.push(glassGeometry);
  for (let i = 0; i < 11; i++) {
    const a = (170 - i * 16) * Math.PI / 180, x = Math.cos(a) * .24125, y = A + Math.sin(a) * .24125;
    disc(.009, .007, C.goldEdge, C.goldEdge, group, x, y, F + .0105); mesh(glassGeometry, shining, group, x, y, F + .017).castShadow = false;
    marquee.push(new THREE.Vector3(x, y, F + .017));
  }
  // The plaque: stepped like a 1930s sign, deep wine card with a fine gold line inside; on it the letters in card.
  const plaque = [[-.17, .955], [.17, .955], [.17, .9825], [.185, .9825], [.185, 1.0425], [.17, 1.0425], [.17, 1.07], [.075, 1.07], [.075, 1.0875], [-.075, 1.0875], [-.075, 1.07], [-.17, 1.07], [-.17, 1.0425], [-.185, 1.0425], [-.185, .9825], [-.17, .9825]].map(([x, y]) => v2(x, y));
  layer(plaque, .008, [C.wine, C.wineEdge], F + .003);
  layer(cut(rounded(-.161, .9635, .322, .098, .004, 0, 0), [rounded(-.1587, .9658, .3174, .0934, .003, 0, 0)]), .0015, [C.gold, C.goldEdge], F + .011);
  // CHRISTMAS VENDING in the title font's own outlines (data/marquee-glyphs.js), cut from card and stood on the plaque.
  const letters = (glyphs, width, baseline, spacing, colours) => {
    const advance = glyphs.reduce((sum, glyph) => sum + glyph.advance, 0), size = (width - spacing * (glyphs.length - 1)) / advance;
    let x = -width / 2;
    for (const glyph of glyphs) { const node = mesh(sheet(glyphShapes(glyph.d), .005, 3), card(...colours), group, x, baseline, F + .011); node.scale.set(size, size, 1); x += glyph.advance * size + spacing; }
  };
  letters(marqueeGlyphs[0], .29, 1.0025, .002, [C.cream, C.creamEdge]);
  letters(marqueeGlyphs[1], .17, .9655, .011, [C.gold, C.goldEdge]);
  // Snow over the crest's shoulders and on the star's step; holly on the left shoulder; the star on top.
  for (const [a0, a1, drips] of [[124, 165, [[162, .01, 3.5], [146.5, .0175, 4.5], [130.5, .0125, 4]]], [15, 56, [[49.5, .0125, 4], [34, .0175, 4.5], [18.5, .01, 3.5]]]]) layer(snowCap(a0, a1, drips), .074, [C.snow, C.snowEdge], F - .066);
  mesh(new THREE.BoxGeometry(.06, .0175, .05), faces(C.goldEdge, C.gold, C.goldEdge, C.gold), group, 0, A + R + .00875, F - .03);
  mesh(new THREE.BoxGeometry(.035, .0175, .04), faces(C.goldEdge, C.gold, C.goldEdge, C.gold), group, 0, A + R + .02625, F - .03);
  layer(Array.from({ length: 13 }, (_, i) => v2(-.031 + i / 12 * .062, A + R + .0175 + Math.sin(i / 12 * Math.PI) ** .7 * .007)), .052, [C.snow, C.snowEdge], F - .056);
  layer(star(0, 1.222, .035, .015), .008, [C.gold, C.goldEdge], F - .034);
  layer(star(0, 1.2225, .016, .007), .003, [C.cream, C.creamEdge], F - .026);
  for (const [turn, colour] of [[2.75, C.pine], [.5, C.hollyLight]]) { const node = layer(leaf(.042, .017), .003, [colour, C.pineEdge], F + .009); node.position.set(-.2225, 1.0575, F + .009); node.rotation.z = turn; }
  for (const [x, y] of [[-.2225, 1.06], [-.2325, 1.052], [-.2125, 1.052]]) disc(.0075, .006, C.berry, C.berryEdge, group, x, y, F + .017);

  // The display: a gold frame, and in it dark green card with four arched windows; behind each a cell lined in green card,
  // with a cream stand, a warm light on its back wall, and a door that comes down from above (clipped at the window's top).
  const cells = {};
  layer(cut(rounded(-.2065, .5135, .413, .393, .025, 5), [display]), .008, [C.gold, C.goldEdge], F);
  const windows = Object.values(MACHINE.cells).map(([x, y]) => arched(x - cw / 2, y, cw, ch, .025));
  layer(cut(display, windows), .004, [C.liner, C.pineEdge], F);
  for (const [id, [x, y]] of Object.entries(MACHINE.cells)) {
    layer(cut(arched(x - cw / 2 - .0045, y - .0045, cw + .009, ch + .009, .026), [arched(x - cw / 2, y, cw, ch, .025)]), .003, [C.gold, C.goldEdge], F + .004);
    mesh(new THREE.BoxGeometry(cw, ch + .002, .1), paper(C.cell, { side: THREE.BackSide }), group, x, y + ch / 2, F - .05);
    const glow = own(new THREE.MeshBasicMaterial({ color: '#ffd98a', map: above, transparent: true, opacity: .35, depthWrite: false, toneMapped: false }));
    flat(mesh(new THREE.PlaneGeometry(cw - .004, ch - .002), glow, group, x, y + ch / 2, F - .0985));
    mesh(new THREE.CylinderGeometry(.0525, .0525, .011, 40), [paper(C.creamEdge), paper(C.cream), paper(C.creamEdge)], group, x, y + MACHINE.stand - .0055, F - .05);
    const clip = [new THREE.Plane(new THREE.Vector3(0, -1, 0), y + ch)], door = new THREE.Group(), edge = own(new THREE.MeshLambertMaterial({ color: C.creamEdge, map: grain, toneMapped: false, clippingPlanes: clip }));
    mesh(new THREE.BoxGeometry(cw, ch + .004, .003), [edge, edge, edge, edge, own(new THREE.MeshLambertMaterial({ map: doorFace, toneMapped: false, clippingPlanes: clip })), edge], door);
    door.userData = { shut: y + ch / 2, open: y + ch * 1.5 + .006 }; door.position.set(x, door.userData.open, F - .0055); door.visible = false; group.add(door);
    cells[id] = { stand: new THREE.Vector3(x, y + MACHINE.stand, F - .05), door, glow };
  }

  // The keypad: cream card in a raised gold border with a fine gold line inside, three gold lines either side, and the four
  // buttons where their cells are: a wine collar, a gold ring, and the face that is pressed, its thing drawn on it, in a
  // holder of its own so it can sink straight in and come back.
  layer(rounded(-.11, .355, .22, .155, .02, 21), .008, [C.cream, C.creamEdge], F);
  layer(cut(rounded(-.115, .35, .23, .165, .023, 23), [rounded(-.11, .355, .22, .155, .02, 0, 0)]), .011, [C.gold, C.goldEdge], F);
  layer(cut(rounded(-.1, .365, .2, .135, .014, 0, 0), [rounded(-.098, .367, .196, .131, .012, 0, 0)]), .0015, [C.gold, C.goldEdge], F + .008);
  for (const y of [.4475, .4325, .4175]) for (const x of [-.165, .165]) mesh(new THREE.BoxGeometry(.08, .0035, .003), paper(C.gold), group, x, y, F + .0015);
  const buttons = new Map();
  for (const [id, [x, y]] of Object.entries(MACHINE.buttons)) {
    disc(.032, .006, C.wine, C.wineEdge, group, x, y, F + .011);
    layer(cut(circle(x, y, .03, 48), [circle(x, y, .0245, 48)]), .008, [C.gold, C.goldEdge], F + .014);
    const holder = new THREE.Group(); holder.position.set(x, y, F + .016); group.add(holder);
    mesh(sheet(circle(0, 0, MACHINE.button, 48), .012), [own(new THREE.MeshLambertMaterial({ map: keep(iconTexture(id, redraw)), toneMapped: false })), paper(C.creamEdge)], holder);
    holder.userData.home = holder.position.z; buttons.set(id, holder);
  }
  layer(star(0, .3375, .0155, .0065), .005, [C.gold, C.goldEdge], F);

  // The stage: a box standing out of the front, red at its sides and gold on its face, dark inside; a wooden floor and a
  // tray (gold at its lip) that slides out with the thing on it and a warm light round its feet; at the back a paper that
  // can be lit; red paper curtains, pleated and a little see-through, so a light behind shows through them; a scalloped
  // wine valance over a gold one.
  const outer = arched(-.17, .06, .34, .255, .04), { floor, back } = MACHINE.stage;
  layer(cut(outer, [opening]), .036, [C.red, C.red], F);
  layer(cut(outer, [opening]), .006, [C.gold, C.goldEdge], F + .036);
  mesh(new THREE.BoxGeometry(.31, .224, F + .036 - back), paper(C.stage, { side: THREE.BackSide }), group, 0, floor + .112, (back + F + .036) / 2);
  const board = paper('#ffffff', { map: wood });
  mesh(new THREE.BoxGeometry(.31, .01, .105), [paper(C.woodEdge), paper(C.woodEdge), board, paper(C.woodEdge), paper(C.woodEdge), paper(C.woodEdge)], group, 0, floor - .005, back + .0525);
  const tray = new THREE.Group(); group.add(tray);
  mesh(new THREE.BoxGeometry(.31, .02, .087), [paper(C.woodEdge), paper(C.woodEdge), board, paper(C.woodEdge), paper(C.gold), paper(C.woodEdge)], tray, 0, floor - .01, .1035);
  mesh(new THREE.BoxGeometry(.33, .024, .004), faces(C.goldEdge, C.gold, C.goldEdge, C.gold), tray, 0, floor - .012, .149);
  const pool = own(new THREE.MeshBasicMaterial({ color: '#ffd98a', map: round, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  flat(mesh(new THREE.PlaneGeometry(.24, .12), pool, tray, 0, floor + .0008, .1)).rotation.x = -Math.PI / 2;
  const backlight = own(new THREE.MeshBasicMaterial({ color: '#2a2023', toneMapped: false }));
  flat(mesh(new THREE.PlaneGeometry(.31, .224), backlight, group, 0, floor + .112, back + .002));
  const cloth = own(new THREE.MeshLambertMaterial({ color: C.curtain, map: grain, transparent: true, toneMapped: false }));
  const curtains = [-1, 1].map(side => {
    const geometry = new THREE.PlaneGeometry(.158, .19, 56, 1), at = geometry.attributes.position;
    for (let i = 0; i < at.count; i++) { const u = (at.getX(i) + .079) / .158, fold = Math.abs((u * 7) % 1 * 2 - 1); at.setZ(i, fold * .011); if (at.getY(i) < 0) at.setY(i, at.getY(i) - fold * .005); }
    geometry.translate(-side * .079, 0, 0); geometry.computeVertexNormals();
    const pivot = new THREE.Group(); pivot.position.set(side * .155, floor + .095, .122); group.add(pivot);
    const node = mesh(geometry, cloth, pivot); node.castShadow = node.receiveShadow = false;
    return pivot;
  });
  const valance = (dip, grow) => {
    const r = .3607 + grow, cy = .3 - .3607, from = Math.acos(.16 / r), points = [v2(-.16, .2575 - grow)];
    for (let i = 0; i <= 24; i++) { const a = Math.PI - from - (Math.PI - 2 * from) * i / 24; points.push(v2(Math.cos(a) * r, cy + Math.sin(a) * r)); }
    points.push(v2(.16, .2575 - grow));
    for (let s = 0; s < 6; s++) for (let j = 1; j <= 8; j++) { const x0 = .16 - s * .32 / 6, t = j / 8; points.push(v2(x0 - t * .32 / 6, .2575 - grow - dip * Math.sin(t * Math.PI))); }
    return points;
  };
  layer(valance(.0145, .0035), .004, [C.gold, C.goldEdge], .131);
  layer(valance(.012, 0), .006, [C.wine, C.wineEdge], .135);

  // The lever: a wine bracket off the right side holds a half-round green plate, a gold one just behind it showing as its
  // rim; five cream rays and five bulbs along the arc the knob sweeps; a toothed gold hub (it turns while the machine runs),
  // a catch that holds it until something is picked, a peg where the lever rests and a stop where it ends; and the arm, a
  // gold rod with a deep red knob, turning on the hub in front of it all.
  const [hx, hy] = MACHINE.hub, P = MACHINE.plate, face = F - .008, clock = (degrees, r) => [hx + Math.sin(degrees * Math.PI / 180) * r, hy + Math.cos(degrees * Math.PI / 180) * r];
  mesh(new THREE.BoxGeometry(.04, .05, .06), faces(C.wineEdge, C.wine, C.wineEdge, C.wine), group, R + .015, hy, F - .035);
  const half = r => Array.from({ length: 41 }, (_, i) => { const a = Math.PI / 2 - i / 40 * Math.PI; return v2(hx + Math.cos(a) * r, hy + Math.sin(a) * r); });
  layer(half(P + .0075), .01, [C.gold, C.goldEdge], F - .024);
  layer(half(P), .012, [C.pine, C.pineEdge], F - .02);
  const bulbGeometry = new THREE.SphereGeometry(.0098, 20, 14), haloGeometry = new THREE.PlaneGeometry(.075, .075), bulbs = [];
  geometries.push(bulbGeometry, haloGeometry);
  for (let k = 0; k < LEVER.bulbs; k++) {
    const degrees = LEVER.rest + LEVER.sweep * (k + 1) / LEVER.bulbs, [x0, y0] = clock(degrees, .04), [x1, y1] = clock(degrees, .088), [x, y] = clock(degrees, MACHINE.ring);
    mesh(new THREE.BoxGeometry(Math.hypot(x1 - x0, y1 - y0), .0025, .0015), paper(C.cream), group, (x0 + x1) / 2, (y0 + y1) / 2, face + .00075).rotation.z = Math.PI / 2 - degrees * Math.PI / 180;
    disc(.0118, .012, C.goldEdge, C.goldEdge, group, x, y, face + .006);
    const glass = own(new THREE.MeshLambertMaterial({ color: C.glass, emissive: '#000000', toneMapped: false })), node = mesh(bulbGeometry, glass, group, x, y, face + .015);
    const halo = own(new THREE.MeshBasicMaterial({ color: '#ffd98a', map: round, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    flat(mesh(haloGeometry, halo, group, x, y, face + .021));
    bulbs.push({ glass, halo, node });
  }
  for (const [degrees, colour] of [[LEVER.rest - 7, C.gold], [LEVER.rest + LEVER.sweep + 7, C.wine]]) { const [x, y] = clock(degrees, .124); disc(.0085, .012, colour, C.goldEdge, group, x, y, face + .006); }
  const hub = new THREE.Group(); hub.position.set(hx, hy, face); group.add(hub);
  mesh(sheet(Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2, r = i % 4 < 2 ? .035 : .029; return v2(Math.cos(a) * r, Math.sin(a) * r); }), .008), card(C.goldDeep, C.goldEdge), hub);
  mesh(sheet(circle(0, 0, .026), .004), card(C.gold, C.goldEdge), hub, 0, 0, .008);
  mesh(new THREE.BoxGeometry(.032, .003, .002), paper(C.goldEdge), hub, 0, 0, .0125);
  const pawl = new THREE.Group(); pawl.position.set(hx - .0175, hy + .0375, face + .012); group.add(pawl);
  mesh(sheet([v2(0, 0), v2(.035, -.01375), v2(.03, -.0225), v2(-.00375, -.0075)], .004), card(C.gold, C.goldEdge), pawl);
  disc(.005, .006, C.wine, C.wineEdge, pawl, 0, 0, .006);
  const arm = new THREE.Group(); arm.position.set(hx, hy, face + .03); group.add(arm);
  mesh(new THREE.CylinderGeometry(.0068, .0068, .15, 16), paper(C.gold), arm, 0, .075, 0);
  mesh(new THREE.CylinderGeometry(.0095, .0095, .012, 20), paper(C.goldEdge), arm, 0, .143, 0);
  mesh(new THREE.SphereGeometry(MACHINE.knob, 32, 24), paper(C.curtain), arm, 0, MACHINE.arm, .008);
  disc(.0115, .006, C.wine, C.wineEdge, arm, 0, 0, .004);
  arm.rotation.z = -LEVER.rest * Math.PI / 180;

  return {
    group, buttons, cells, marquee,
    stage: { tray, curtains, cloth, backlight, pool },
    lever: { arm, hub, pawl, bulbs },
    dispose() { geometries.forEach(each => each.dispose()); materials.forEach(each => each.dispose()); textures.forEach(each => each.dispose()); },
  };
}
