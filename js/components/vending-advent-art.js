// The Advent House of the Christmas Market (components/vending-advent.js), cut from paper: a wooden cabinet of twenty-four
// drawers (services/advent-layout.js) under a steep gable of red boards scalloped along the eaves and gold-edged, a deep
// cap of snow on it and a gold star on top, a lit attic window with a red bow under it, a garland of pine and holly with
// little lights, the sign "Advent Calendar", a lantern hung out on each side, the cabinet on a display base skirted in
// green with a gold star, presents and a barrel at its feet in the snow. The 24th drawer is the big one, gold-framed, with
// a wreath and a bow, behind two doors.
// It is layered paper standing in the street (vending-advent.js builds it there): the front drawn flat, as it is, in two
// sheets one before the other (`back`: the cabinet and the gable; `front`: the garland, the sign, the roof's boards and
// snow), the display base a low box of its own standing out from the cabinet's foot (`plinth`, its top `plinthTop`), the
// presents and the barrel standing on the cobbles before it (`feet`), its right wall, the underside of its roof and eave
// and the snow's edge along it as boards of their own, each drawer a little box that slides out. Posts and presents keep
// a sliver of their thickness drawn on (DEPTH), as a pop-up book's do.
// Units are the house's own: u across its front (the cabinet from 60 to 940), v down from its star to the cobbles at
// FLOOR; what stands out of the front (posts, sign, base, presents) says how far, as w.
import { holly, shape } from './paper-art.js';
import { flatten } from '../services/perspective.js';
import { COLUMNS, ROWS, drawers } from '../services/advent-layout.js';
import { adventGlyphs } from '../data/advent-glyphs.js';
import { glowFill } from './vending-world-art.js';

export const FLOOR = 1460;
const C = {
  wood: '#a8774d', woodLight: '#c99a66', woodDark: '#7a5238', woodDeep: '#5b3b29', hollow: '#3f2a20', side: '#86603f',
  red: '#b5443c', redDark: '#8f3530', redDeep: '#6f2824', green: '#3f6653', greenDark: '#2f4f40', cream: '#f6ecd6', kraft: '#e3cb9f',
  gold: '#e0b04f', goldDark: '#b8862e', snow: '#fbf6ec', shade: '#e3dbd0', lit: '#f6cd78', litDeep: '#eaa951', iron: '#3c3238', ink: '#5b3d2e',
};
const f = n => (Math.round(n * 10) / 10).toString();

// The drawers' cells on the front: six columns by six rows inside the cabinet's frame, a little gap round each.
const GRID_BOX = [146, 596, 854, 1264];
export const CELLS = drawers().map(box => {
  const [left, top, right, bottom] = GRID_BOX, width = (right - left) / COLUMNS, height = (bottom - top) / ROWS, gap = 10;
  return { ...box, u0: left + box.col * width + gap / 2, v0: top + box.row * height + gap / 2, u1: left + (box.col + box.cols) * width - gap / 2, v1: top + (box.row + box.rows) * height - gap / 2 };
});

// The box every piece of the house is drawn in (lanterns, presents and its depth running back included); how far one
// unit of depth runs back on the paper, to the right and a little up; the part of it a phone keeps whole up close.
export const BOX = [-170, -190, 1340, 1680];
export const DEPTH = [.08, -.03];
export const CABINET = [20, 980];
export const viewBox = ([x, y, width, height]) => `${x} ${y} ${width} ${height}`;
const aback = (u, v, d) => [u + d * DEPTH[0], v + d * DEPTH[1]];

// A pen draws on the front, flat: polygons and lines of [u, v] corners, paths, glyphs set at a point and scaled, circles,
// and small things drawn round their own origin (holly, a bow).
export function pen(g) {
  const points = list => list.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
  const self = {
    g,
    poly: (corners, attributes) => shape('path', { d: `M${points(corners)}Z`, ...attributes }, self.g),
    line: (corners, attributes) => shape('path', { d: `M${points(corners)}`, fill: 'none', ...attributes }, self.g),
    path: (d, attributes) => shape('path', { d, ...attributes }, self.g),
    glyph: (d, [u, v], size, attributes) => shape('path', { d, transform: `translate(${f(u)} ${f(v)}) scale(${size})`, ...attributes }, self.g),
    circle: (cu, cv, r, attributes) => shape('circle', { cx: f(cu), cy: f(cv), r: f(r), ...attributes }, self.g),
    decal(u, v, _w, draw) { const group = shape('g', { transform: `translate(${f(u)} ${f(v)})` }, self.g); draw(group); return group; },
    stroke: width => f(width),
  };
  return self;
}

// A box standing out of the front from w0 to w1: its right side and top running back, then its front as it is.
function box(P, [u0, v0, w0], [u1, v1, w1], fills) {
  const d = w1 - w0;
  if (fills.right) P.poly([[u1, v0], aback(u1, v0, d), aback(u1, v1, d), [u1, v1]], { fill: fills.right });
  if (fills.top) P.poly([[u0, v0], [u1, v0], aback(u1, v0, d), aback(u0, v0, d)], { fill: fills.top });
  if (fills.front) P.poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], { fill: fills.front });
}

// Its right side, boards of their own: the wall of boards running back from the front post (x back from the front, y
// the house's v), the base's end under it, a little lit round window; the underside of the roof's right slope, boards;
// the eave's edge, snow over the red board.
export const WALL_BOX = [0, 430, 515, 1040], SOFFIT_BOX = [0, 0, 600, 770], EDGE_BOX = [0, 0, 600, 74];
export function wall(P) {
  P.poly([[0, 440], [515, 440], [515, 1300], [0, 1300]], { fill: C.side });
  for (let x = 60; x < 515; x += 64) P.line([[x, 448], [x, 1296]], { stroke: C.woodDeep, 'stroke-width': 4, 'stroke-opacity': .45 });
  P.poly([[0, 440], [515, 440], [515, 530], [0, 530]], { fill: C.hollow, opacity: .42 });
  P.circle(258, 760, 58, { fill: C.woodDark }); P.circle(258, 760, 46, { fill: C.lit }); P.path('M258 714V806M212 760H304', { stroke: C.woodDark, 'stroke-width': 6, fill: 'none' });
  P.poly([[0, 1300], [515, 1300], [515, 1338], [0, 1338]], { fill: C.woodDark });
  P.poly([[0, 1338], [515, 1338], [515, 1446], [0, 1446]], { fill: C.greenDark });
  P.line([[0, 1340], [515, 1340]], { stroke: C.gold, 'stroke-width': 4 });
  P.poly([[0, 1446], [515, 1446], [515, 1462], [0, 1462]], { fill: C.woodDeep });
  const top = [], drift = [];
  for (let i = 0; i <= 10; i++) { top.push([515 * i / 10, 1292 + Math.sin(i * 2.3) * 4]); drift.push([515 * i / 10, 1440 - (i % 3) * 6 - 6]); }
  P.poly([...top, [515, 1312], [0, 1312]], { fill: C.snow }); P.poly([[0, 1470], ...drift, [515, 1470]], { fill: C.snow });
}
export function soffit(P) {
  P.poly([[0, 0], [600, 0], [600, 770], [0, 770]], { fill: '#6e4a33' });
  for (let y = 70; y < 770; y += 70) P.line([[0, y], [600, y]], { stroke: C.woodDeep, 'stroke-width': 6, 'stroke-opacity': .55 });
}
export function edge(P) {
  P.poly([[0, 30], [600, 30], [600, 72], [0, 72]], { fill: C.redDark });
  P.line([[0, 66], [600, 66]], { stroke: C.gold, 'stroke-width': 5 });
  const top = [];
  for (let i = 0; i <= 12; i++) top.push([600 * i / 12, 6 + Math.sin(i * 1.9) * 6]);
  P.poly([...top, [600, 40], [0, 40]], { fill: C.snow });
}

// The cabinet's face: two thick posts, rails across, the dark hollow the drawers sit in and each drawer's empty slot
// (the drawers are laid over them, each a button of its own).
function cabinet(P) {
  P.poly([[60, 440], [940, 440], [940, 1300], [60, 1300]], { fill: C.wood });
  P.poly([[134, 590], [866, 590], [866, 1272], [134, 1272]], { fill: C.hollow });
  for (const cell of CELLS) P.poly([[cell.u0 - 3, cell.v0 - 3], [cell.u1 + 3, cell.v0 - 3], [cell.u1 + 3, cell.v1 + 3], [cell.u0 - 3, cell.v1 + 3]], { fill: '#2c1d16' });
  box(P, [60, 540, 0], [940, 592, 18], { front: C.woodLight });
  box(P, [60, 1268, 0], [940, 1300, 18], { front: C.woodLight });
  for (const [u0, u1] of [[54, 136], [864, 946]]) {
    box(P, [u0, 440, -6], [u1, 1300, 40], { front: C.wood, right: C.woodDark });
    P.poly([[u0 + 10, 460], [u0 + 18, 460], [u0 + 18, 1290], [u0 + 10, 1290]], { fill: C.woodLight, opacity: .7 });
    P.poly([[u1 - 16, 460], [u1 - 8, 460], [u1 - 8, 1290], [u1 - 16, 1290]], { fill: C.woodDeep, opacity: .45 });
  }
}

// A drawer's face (also each drawer of the close-up, one layer each): its paper, an inner line, a finger pull at its top,
// its number in the market's lettering, and what is printed round it.
const DIGITS = Object.fromEntries(Object.entries(adventGlyphs.digits).map(([char, glyph]) => {
  const ys = flatten(glyph.d, 4).flat().map(([, y]) => y);
  return [char, { ...glyph, top: Math.min(...ys), bottom: Math.max(...ys) }];
}));
const INK = { red: [C.red, C.gold, '#fbecc4'], green: [C.green, C.gold, '#fbecc4'], cream: [C.cream, '#c9a46a', C.red], kraft: [C.kraft, C.goldDark, C.green], crown: [C.redDark, C.gold, C.gold] };
export function number(P, text, cu, cv, height, fill, w = 4) {
  const glyphs = [...text].map(char => DIGITS[char]), top = Math.min(...glyphs.map(g => g.top)), bottom = Math.max(...glyphs.map(g => g.bottom));
  const size = height / (bottom - top), width = glyphs.reduce((sum, g) => sum + g.advance, 0) * size;
  let u = cu - width / 2;
  for (const glyph of glyphs) { P.glyph(glyph.d, [u, cv - (top + bottom) / 2 * size], size, { fill }, w); u += glyph.advance * size; }
}
function flake(P, cu, cv, r, color, w) {
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3, [dx, dy] = [Math.cos(a) * r, Math.sin(a) * r]; P.line([[cu - dx, cv - dy], [cu + dx, cv + dy]], { stroke: color, 'stroke-width': P.stroke(r * .2, cu, cv, w), 'stroke-linecap': 'round' }, w); }
  P.circle(cu, cv, r * .22, { fill: color }, w);
}
function sprig(P, cu, cv, size, side, color, w) {
  P.path(`M${f(cu)} ${f(cv + size)}Q${f(cu + side * size * .7)} ${f(cv + size * .2)} ${f(cu + side * size * .3)} ${f(cv - size)}`, { fill: 'none', stroke: color, 'stroke-width': P.stroke(size * .09, cu, cv, w), 'stroke-linecap': 'round' }, w);
  for (let i = 0; i < 4; i++) { const t = .2 + i * .22, lu = cu + side * size * (.62 - t * .5), lv = cv + size * (.8 - t * 1.5); P.path(`M${f(lu)} ${f(lv)}Q${f(lu + side * size * .3)} ${f(lv - size * .12)} ${f(lu + side * size * .34)} ${f(lv - size * .34)}Q${f(lu + side * size * .08)} ${f(lv - size * .2)} ${f(lu)} ${f(lv)}Z`, { fill: color }, w); }
}
function starAt(P, cu, cv, r, fill, w, points = 5) {
  const corners = [];
  for (let i = 0; i < points * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / points, rr = i % 2 ? r * (points === 4 ? .38 : .45) : r; corners.push([cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, w]); }
  P.poly(corners, { fill });
}
export function drawerFace(P, cell) {
  const { u0, v0, u1, v1, day, tone, motif } = cell, w = 2, [paper, line, ink] = INK[tone], cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, inset = 8;
  if (tone === 'crown') return crownFace(P, cell);
  P.poly([[u0, v0, w], [u1, v0, w], [u1, v1, w], [u0, v1, w]], { fill: paper });
  P.poly([[u0 + inset, v0 + inset, w], [u1 - inset, v0 + inset, w], [u1 - inset, v1 - inset, w], [u0 + inset, v1 - inset, w]], { fill: 'none', stroke: line, 'stroke-width': P.stroke(3.2, cu, cv, w) });
  P.path(`M${f(cu - 17)} ${f(v0 + 2)}Q${f(cu)} ${f(v0 + 30)} ${f(cu + 17)} ${f(v0 + 2)}Z`, { fill: '#2c1d16', opacity: .7 }, w);
  const tall = v1 - v0 > 160, wide = u1 - u0 > 160, under = !wide && ['laurel', 'tree', 'star', 'bell', 'holly'].includes(motif), size = Math.min(52, (v1 - v0) * (under && !tall ? .36 : .44)), at = tall ? cv - 34 : under ? cv - 10 : cv + 4;
  number(P, String(day), cu, at, size, ink, w + 1);
  const deco = tone === 'cream' || tone === 'kraft' ? C.green : C.gold;
  if (motif === 'flakes' && wide) for (const side of [-1, 1]) flake(P, cu + side * 70, at, 15, deco, w);
  if (motif === 'stars' && wide) for (const side of [-1, 1]) starAt(P, cu + side * 70, at, 13, deco, w, 4);
  if (motif === 'laurel') { if (wide) for (const side of [-1, 1]) sprig(P, cu + side * 64, at, 22, side, deco, w); else for (const side of [-1, 1]) sprig(P, cu + side * 18, at + (tall ? 70 : 36), tall ? 18 : 12, side, deco, w); }
  if (motif === 'tree') { const top = tall ? cv + 12 : v1 - 36, h = tall ? 64 : 26; P.poly([[cu, top, w], [cu + h * .42, top + h, w], [cu - h * .42, top + h, w]], { fill: deco === C.gold ? C.cream : C.green }); P.poly([[cu - 4, top + h, w], [cu + 4, top + h, w], [cu + 4, top + h + 8, w], [cu - 4, top + h + 8, w]], { fill: C.woodDark }); }
  if (motif === 'star') starAt(P, cu, tall ? cv + 50 : v1 - 24, tall ? 24 : 10, C.gold, w);
  if (motif === 'bell') { const top = cv + 16; P.path(`M${f(cu - 22)} ${f(top + 46)}Q${f(cu - 20)} ${f(top + 6)} ${f(cu)} ${f(top)}Q${f(cu + 20)} ${f(top + 6)} ${f(cu + 22)} ${f(top + 46)}Z`, { fill: C.gold }, w); P.circle(cu, top + 50, 6, { fill: C.goldDark }, w); }
  if (motif === 'holly') P.decal(cu, v1 - 26, w, g => holly(g, 0, 0, .5));
}
// The 24th: a gold frame arched at its top on deep red, a wreath round the number with a red bow on it, gold sprigs either
// side and a star under it.
function crownFace(P, { u0, v0, u1, v1 }) {
  const w = 3, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2 + 8;
  P.path(`M${f(u0)} ${f(v0 + 40)}Q${f(u0)} ${f(v0)} ${f(u0 + 46)} ${f(v0 + 4)}Q${f(cu)} ${f(v0 - 22)} ${f(u1 - 46)} ${f(v0 + 4)}Q${f(u1)} ${f(v0)} ${f(u1)} ${f(v0 + 40)}L${f(u1)} ${f(v1)}L${f(u0)} ${f(v1)}Z`, { fill: C.gold }, w);
  P.path(`M${f(u0 + 14)} ${f(v0 + 46)}Q${f(u0 + 14)} ${f(v0 + 16)} ${f(u0 + 52)} ${f(v0 + 20)}Q${f(cu)} ${f(v0 - 2)} ${f(u1 - 52)} ${f(v0 + 20)}Q${f(u1 - 14)} ${f(v0 + 16)} ${f(u1 - 14)} ${f(v0 + 46)}L${f(u1 - 14)} ${f(v1 - 14)}L${f(u0 + 14)} ${f(v1 - 14)}Z`, { fill: C.redDark }, w);
  P.path(`M${f(u0 + 26)} ${f(v0 + 54)}Q${f(u0 + 26)} ${f(v0 + 30)} ${f(u0 + 58)} ${f(v0 + 33)}Q${f(cu)} ${f(v0 + 14)} ${f(u1 - 58)} ${f(v0 + 33)}Q${f(u1 - 26)} ${f(v0 + 30)} ${f(u1 - 26)} ${f(v0 + 54)}L${f(u1 - 26)} ${f(v1 - 26)}L${f(u0 + 26)} ${f(v1 - 26)}Z`, { fill: 'none', stroke: C.gold, 'stroke-width': P.stroke(3, cu, cv, w) }, w);
  P.path(`M${f(cu - 17)} ${f(v0 - 6)}Q${f(cu)} ${f(v0 + 22)} ${f(cu + 17)} ${f(v0 - 6)}Z`, { fill: '#2c1d16', opacity: .6 }, w);
  // The wreath: a ring of pine, berries in threes, a bow at its top.
  const r = 62;
  P.circle(cu, cv, r + 15, { fill: C.greenDark }, w + 1); P.circle(cu, cv, r - 15, { fill: C.redDark }, w + 1);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; P.circle(cu + Math.cos(a) * r, cv + Math.sin(a) * r, 13, { fill: i % 2 ? C.green : '#4f7a62' }, w + 1); }
  for (const a of [.6, 2.2, 3.5, 4.9]) for (const [du, dv] of [[0, 0], [9, 5], [-3, 10]]) P.circle(cu + Math.cos(a) * r + du - 3, cv + Math.sin(a) * r + dv - 4, 5.5, { fill: '#c63a33' }, w + 2);
  P.decal(cu, cv - r - 4, w + 3, g => bow(g, 1.15));
  number(P, '24', cu, cv + 2, 56, C.gold, w + 2);
  for (const side of [-1, 1]) sprig(P, cu + side * 104, cv + 6, 34, side, C.gold, w);
  starAt(P, cu, v1 - 30, 13, C.gold, w + 1);
}
// A red bow, drawn round its knot.
function bow(g, size = 1) {
  const group = shape('g', { transform: `scale(${size})` }, g);
  shape('path', { d: 'M0 0C-14-20-44-24-44-6-44 8-20 8 0 0ZM0 0C14-20 44-24 44-6 44 8 20 8 0 0Z', fill: C.red }, group);
  shape('path', { d: 'M-4 2L-22 34-12 32-6 40 0 6ZM4 2L22 34 12 32 6 40 0 6Z', fill: C.redDark }, group);
  shape('path', { d: 'M-24-8C-18-4-10-2-4 0M24-8C18-4 10-2 4 0', fill: 'none', stroke: C.redDark, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, group);
  shape('circle', { cx: 0, cy: 0, r: 8, fill: '#c94b42' }, group);
}

// The gable: its boarded wall with the lit attic window and the bow, then the roof's red boards along both slopes (the
// scallops under them gold-edged), the snow piled on them in a deep lumpy cap hanging over in drips, the gold star.
const APEX = [500, -50], EAVE_L = [-20, 440], EAVE_R = [1020, 440];
function gable(P) {
  P.poly([[40, 440], [500, APEX[1] + 20], [960, 440]], { fill: C.kraft });
  for (let u = 116; u < 900; u += 64) { const top = slopeAt(u) + 34; if (top < 432) P.line([[u, top], [u, 438]], { stroke: '#c9a46a', 'stroke-width': P.stroke(3, u, 300) }); }
  // The attic window: lit, a pointed top, a cross of bars; the bow under it.
  P.path('M412 352L412 236L500 150L588 236L588 352Z', { fill: C.woodDark });
  P.path('M428 340L428 242L500 172L572 242L572 340Z', { fill: C.lit });
  P.path('M428 300L572 300L572 340L428 340Z', { fill: C.litDeep, opacity: .5 });
  P.path('M497 176L503 176L503 340L497 340ZM428 268L572 268L572 274L428 274Z', { fill: C.woodDark });
  P.path('M402 352L598 352L594 366L406 366Z', { fill: C.woodDark });
  P.decal(500, 386, 14, g => bow(g, 1.3));
}
const slopeAt = u => APEX[1] + Math.abs(u - APEX[0]) * (EAVE_L[1] - APEX[1]) / (APEX[0] - EAVE_L[0]);
// The top of each roof slope, as the house stands turned in the square and is seen from a little above: from the ridge
// (left) down to the eave (right), the front (top) to the back. Deep snow over it, the red boards showing along the eave
// under its lumpy edge, a little lavender shade by the ridge. `RIDGE` and `EAVE` are where it lies on the front's units.
export const ROOF_BOX = [0, 0, 400, 240], RIDGE = [APEX[0], APEX[1] - 16], EAVE = [EAVE_R[0] + 28, EAVE_R[1] + 6];
export function roofTop(g) {
  // Across: from the ridge (x 0) down to the eave (x 400); down the picture: from the front (y 0) back to the rear (y 240).
  // The red roof ends square a little before the rear; the snow on it lies in soft rolls along the slope, drips over the
  // eave and rounds over the rear edge in lumps, so that its end against the sky is snow, not a cut.
  shape('rect', { x: 0, y: 0, width: 400, height: 226, fill: C.red }, g);
  for (let k = 0; k < 7; k++) shape('rect', { x: 0, y: k * 30 + 12, width: 400, height: 3, fill: C.redDark }, g);
  const eave = [], rear = [];
  for (let j = 0; j <= 15; j++) eave.push([358 + Math.sin(j * 2.1) * 9 + (j % 3 === 1 ? 16 : 0), j * 15]);
  for (let i = 0; i <= 10; i++) rear.push([372 - i * 37.2, 224 + Math.abs(Math.sin(i * 1.7)) * 8]);
  const outline = [[0, 0], [372, 0], ...eave.slice(1, -1), [362, 226], ...rear, [0, 228]];
  shape('path', { d: `M${outline.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`, fill: C.snow }, g);
  for (let i = 0; i < 10; i++) shape('circle', { cx: (372 - i * 37.2).toFixed(1), cy: (222 + Math.abs(Math.sin(i * 1.7)) * 6).toFixed(1), r: (7 + Math.abs(Math.sin(i * 2.3)) * 4).toFixed(1), fill: C.snow }, g);
  for (const x of [110, 210, 300]) shape('path', { d: `M${x} 8Q${x + 12} 120 ${x - 4} 220`, fill: 'none', stroke: '#e6e1ec', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M0 0H120Q60 110 0 224Z', fill: '#e8e3ee', opacity: .6 }, g);
}
function roof(P) {
  const w = 70;
  // Along each slope, from the apex down to the eave: the board, then the scallops hanging under it into the gable.
  for (const [eu, ev] of [EAVE_L, EAVE_R]) {
    const side = Math.sign(eu - APEX[0]), n = 7, length = Math.hypot(eu - APEX[0], ev - APEX[1]), [du, dv] = [(eu - APEX[0]) / length, (ev - APEX[1]) / length], [nu, nv] = [-dv * side, du * side];
    const along = (s, out) => [APEX[0] + du * s + nu * out, APEX[1] + dv * s + nv * out, w];
    P.poly([along(0, -14), along(length + 20, -14), along(length + 20, 40), along(0, 40)], { fill: C.red });
    const scallop = [along(length + 14, 38)];
    for (let i = n; i > 0; i--) { const a = (i - 1) / n * length, b = i / n * length, r = (b - a) / 2; for (let k = 0; k <= 8; k++) { const t = k / 8 * Math.PI; scallop.push(along((a + b) / 2 + Math.cos(t) * r, 36 + Math.sin(t) * r * .62)); } }
    P.poly(scallop, { fill: C.red });
    P.line(scallop.slice(1), { stroke: C.gold, 'stroke-width': P.stroke(5, eu, ev, w), 'stroke-linejoin': 'round' });
    P.line([along(4, 26), along(length + 16, 26)], { stroke: C.redDark, 'stroke-width': P.stroke(4, eu, ev, w) });
    P.line([along(0, -12), along(length + 18, -12)], { stroke: C.gold, 'stroke-width': P.stroke(6, eu, ev, w) });
  }
  // The snow: a deep cap along both slopes, its top lumpy, its lower edge hanging over the boards in drips.
  const top = [], under = [];
  for (let i = 0; i <= 24; i++) {
    const u = -62 + 1124 * i / 24, edge = slopeAt(u) - 17, lump = Math.sin(i * 1.7) * 7 + Math.sin(i * .6) * 5;
    top.push([u, edge - 54 + lump, w + 10]);
    under.push([u, edge + 10 + (i % 3 === 1 ? 14 : i % 4 === 0 ? 7 : 0), w + 10]);
  }
  P.poly([...top, ...under.reverse()], { fill: C.snow });
  P.line(under, { stroke: C.shade, 'stroke-width': P.stroke(8, 500, 300, w + 10), 'stroke-linejoin': 'round' }, w + 10);
  for (const u of [36, 166, 318, 684, 836, 966]) { const v = slopeAt(u) + 2; P.path(`M${u - 12} ${f(v)}Q${u - 10} ${f(v + 30)} ${u} ${f(v + 34)}Q${u + 10} ${f(v + 30)} ${u + 12} ${f(v)}Z`, { fill: C.snow }, w + 12); }
  // The star on top.
  const sv = APEX[1] - 40;
  starAt(P, APEX[0], sv + 3, 62, C.goldDark, w + 14); starAt(P, APEX[0], sv, 56, C.gold, w + 16); starAt(P, APEX[0], sv - 1, 21, '#fbe7a6', w + 17);
}

// Under the eaves: a garland of pine swagged across the front with holly where it is hooked up, and the sign hung on it.
const HOOKS = [95, 300, 500, 700, 905];
const swag = (a, b, s, v = 452, dip = 34) => [a + (b - a) * s, v + Math.sin(s * Math.PI) * dip];
function garland(P) {
  for (let i = 0; i < HOOKS.length - 1; i++) {
    const pts = Array.from({ length: 13 }, (_, k) => swag(HOOKS[i], HOOKS[i + 1], k / 12));
    P.line(pts.map(([u, v]) => [u, v, 42]), { stroke: C.greenDark, 'stroke-width': P.stroke(30, 500, 470, 42), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, 42);
    P.line(pts.map(([u, v]) => [u, v - 4, 43]), { stroke: C.green, 'stroke-width': P.stroke(18, 500, 470, 43), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, 43);
    for (const [k, s] of [[0, .3], [1, .7]]) { const [u, v] = swag(HOOKS[i], HOOKS[i + 1], s); P.circle(u + k * 6, v + 8, 7, { fill: '#c63a33' }, 44); }
  }
  for (const u of HOOKS) P.decal(u, 452, 46, g => holly(g, 0, 0, .9));
}
const SIGN = [206, 446, 794, 552];
function sign(P) {
  const [u0, v0, u1, v1] = SIGN, w = 48, cu = (u0 + u1) / 2;
  P.path(`M${u0 + 18} ${v0}L${u1 - 18} ${v0}Q${u1} ${v0} ${u1} ${v0 + 18}L${u1} ${v1 - 18}Q${u1} ${v1} ${u1 - 18} ${v1}L${u0 + 18} ${v1}Q${u0} ${v1} ${u0} ${v1 - 18}L${u0} ${v0 + 18}Q${u0} ${v0} ${u0 + 18} ${v0}Z`, { fill: C.gold }, w);
  P.path(`M${u0 + 22} ${v0 + 8}L${u1 - 22} ${v0 + 8}Q${u1 - 8} ${v0 + 8} ${u1 - 8} ${v0 + 22}L${u1 - 8} ${v1 - 22}Q${u1 - 8} ${v1 - 8} ${u1 - 22} ${v1 - 8}L${u0 + 22} ${v1 - 8}Q${u0 + 8} ${v1 - 8} ${u0 + 8} ${v1 - 22}L${u0 + 8} ${v0 + 22}Q${u0 + 8} ${v0 + 8} ${u0 + 22} ${v0 + 8}Z`, { fill: '#6e4730' }, w);
  P.line([[u0 + 22, v0 + 20], [u1 - 22, v0 + 20]], { stroke: '#86593c', 'stroke-width': P.stroke(4, cu, v0, w) }, w);
  const [x0, y0, x1, y1] = adventGlyphs.sign.box, size = Math.min((u1 - u0 - 130) / (x1 - x0), (v1 - v0 - 34) / (y1 - y0));
  P.glyph(adventGlyphs.sign.d, [cu - (x0 + x1) / 2 * size, (v0 + v1) / 2 - (y0 + y1) / 2 * size], size, { fill: '#fbecc4' }, w + 1);
  for (const side of [-1, 1]) starAt(P, cu + side * ((u1 - u0) / 2 - 34), (v0 + v1) / 2, 14, C.gold, w + 1, 4);
}

// The display base: a low box as wide as the cabinet's posts, standing out a little from its foot: its front a wooden
// rail, a green skirt scalloped along its top with gold, a gold star in its middle; its top boards, snow along their
// front edge (PLINTH_TOP, seen from above: u across, v from the cabinet out to the front).
export const PLINTH = [54, 1290, 892, 172], PLINTH_TOP = [54, 0, 892, 60];
function base(P) {
  const w = 100, [u0, u1] = [54, 946], n = 11, step = (u1 - u0) / n;
  P.poly([[u0, 1300, w], [u1, 1300, w], [u1, 1336, w], [u0, 1336, w]], { fill: C.wood });
  P.poly([[u0, 1336, w], [u1, 1336, w], [u1, 1446, w], [u0, 1446, w]], { fill: C.green });
  const edge = [[u0, 1336, w]];
  for (let i = 0; i < n; i++) { const a = u0 + i * step; edge.push([a + step * .22, 1356, w], [a + step * .5, 1362, w], [a + step * .78, 1356, w], [a + step, 1336, w]); }
  P.poly([...edge, [u1, 1336, w]], { fill: C.greenDark });
  P.line(edge, { stroke: C.gold, 'stroke-width': P.stroke(4, 500, 1340, w), 'stroke-linejoin': 'round' }, w);
  P.poly([[u0, 1446, w], [u1, 1446, w], [u1, 1460, w], [u0, 1460, w]], { fill: C.woodDeep });
  P.circle(500, 1398, 34, { fill: C.goldDark }, w + 2); P.circle(500, 1398, 29, { fill: C.redDark }, w + 3); starAt(P, 500, 1399, 22, C.gold, w + 4);
  // Snow along its front edge, a little over it.
  const top = [], bottom = [];
  for (let i = 0; i <= 14; i++) { const u = u0 + (u1 - u0) * i / 14; top.push([u, 1294 + Math.sin(i * 2.1) * 3, w + 4]); bottom.push([u, 1310 + (i % 3 === 0 ? 9 : 2), w + 4]); }
  P.poly([...top, ...bottom.reverse()], { fill: C.snow });
}
export function plinthTop(P) {
  const [u0, , width, depth] = PLINTH_TOP;
  P.poly([[u0, 0], [u0 + width, 0], [u0 + width, depth], [u0, depth]], { fill: C.woodLight });
  for (let u = u0 + 64; u < u0 + width; u += 64) P.line([[u, 0], [u, depth]], { stroke: C.wood, 'stroke-width': 3 });
  const lumps = [];
  for (let i = 0; i <= 14; i++) lumps.push([u0 + width * i / 14, depth * (.42 + (i % 3) * .1 + Math.sin(i * 1.7) * .06)]);
  P.poly([[u0, depth], ...lumps, [u0 + width, depth]], { fill: C.snow });
}

// At its feet: a barrel and a green present on the left, a red one and a gold one on the right, snow drifted round them.
function present(P, [u0, v0, u1, v1], w0, w1, fill, ribbon) {
  const d = w1 - w0, cu = (u0 + u1) / 2;
  box(P, [u0, v0, w0], [u1, v1, w1], { right: C.redDeep, top: fill, front: fill });
  P.poly([[u0, v0], [u1, v0], aback(u1, v0, d), aback(u0, v0, d)], { fill: '#fff', opacity: .16 });
  P.poly([[u1, v0], aback(u1, v0, d), aback(u1, v1, d), [u1, v1]], { fill, opacity: .55 });
  P.poly([[cu - 7, v0], [cu + 7, v0], aback(cu + 7, v0, d), aback(cu - 7, v0, d)], { fill: ribbon });
  P.poly([[cu - 7, v0], [cu + 7, v0], [cu + 7, v1], [cu - 7, v1]], { fill: ribbon });
  const [bu, bv] = aback(cu, v0, d / 2);
  P.decal(bu, bv - 2, 0, g => { const group = shape('g', { transform: 'scale(.7)' }, g); shape('path', { d: 'M0 0C-14-20-40-22-38-6-36 6-18 6 0 0ZM0 0C14-20 40-22 38-6 36 6 18 6 0 0Z', fill: ribbon }, group); shape('circle', { cx: 0, cy: 0, r: 7, fill: ribbon }, group); });
}
export const FEET = [-170, 1262, 1180, 218];
export function feet(P) {
  // The barrel: staves and iron hoops, snow on its lid.
  const bu0 = -120, bu1 = -6, bw = 40;
  P.path(`M${bu0 + 8} 1460Q${bu0 - 6} 1370 ${bu0 + 8} 1284L${bu1 - 8} 1284Q${bu1 + 6} 1370 ${bu1 - 8} 1460Z`, { fill: C.woodDark }, bw);
  for (const v of [1306, 1372, 1438]) P.path(`M${bu0 + 2} ${v}Q${(bu0 + bu1) / 2} ${v + 10} ${bu1 - 2} ${v}`, { fill: 'none', stroke: C.iron, 'stroke-width': P.stroke(9, bu0, v, bw) }, bw);
  P.path(`M${bu0 + 2} 1288Q${bu0 + 30} 1262 ${(bu0 + bu1) / 2} 1270Q${bu1 - 20} 1262 ${bu1 - 2} 1288Q${(bu0 + bu1) / 2} 1298 ${bu0 + 2} 1288Z`, { fill: C.snow }, bw);
  present(P, [-96, 1352, 30, 1460], 150, 250, C.green, C.gold);
  present(P, [-70, 1298, 0, 1352], 175, 235, C.red, '#fbecc4');
  present(P, [800, 1350, 920, 1460], 150, 236, C.red, C.gold);
  present(P, [832, 1298, 892, 1350], 170, 222, C.gold, C.red);
  // The drift in front, low and lumpy.
  const top = [];
  for (let i = 0; i <= 22; i++) { const u = -160 + 1150 * i / 22; top.push([u, 1442 - (Math.sin(i * 1.3) * 6 + 10 + (i < 4 || i > 18 ? 12 : 0)), 160]); }
  P.poly([...top, [990, 1470, 160], [-160, 1470, 160]], { fill: C.snow });
}

// A lantern on an iron bracket out from a post, its glass lit (`side` −1 the left one): drawn as a layer of its own so it
// may sway from its hook.
export const HOOK = side => [side < 0 ? -34 : 1034, 606, 50];
export function lantern(P, side) {
  const [hu, hv, w] = HOOK(side), post = side < 0 ? 56 : 944;
  P.line([[post, 606], [hu, 606]], { stroke: C.iron, 'stroke-width': P.stroke(8, hu, hv, w), 'stroke-linecap': 'round' }, w);
  P.path(`M${post} 640Q${post - side * 46} 636 ${hu + side * 20} 606`, { fill: 'none', stroke: C.iron, 'stroke-width': P.stroke(5, hu, hv, w) }, w);
  P.line([[hu, 606], [hu, 628]], { stroke: C.iron, 'stroke-width': P.stroke(4, hu, hv, w) }, w);
  P.path(`M${hu - 30} 646L${hu} 628L${hu + 30} 646Z`, { fill: C.iron }, w);
  P.path(`M${hu - 24} 646L${hu + 24} 646L${hu + 28} 744L${hu - 28} 744Z`, { fill: C.lit }, w);
  P.path(`M${hu - 12} 660L${hu + 12} 660L${hu + 14} 728L${hu - 14} 728Z`, { fill: '#fdf0c4' }, w);
  P.path(`M${hu} 646L${hu} 744M${hu - 26} 694L${hu + 26} 694`, { fill: 'none', stroke: C.iron, 'stroke-width': P.stroke(4, hu, hv, w) }, w);
  P.path(`M${hu - 24} 646L${hu - 28} 744M${hu + 24} 646L${hu + 28} 744`, { fill: 'none', stroke: C.iron, 'stroke-width': P.stroke(5, hu, hv, w) }, w);
  P.path(`M${hu - 34} 744L${hu + 34} 744L${hu + 26} 758L${hu - 26} 758Z`, { fill: C.iron }, w);
}
export function lanternGlow(P, side) {
  const [hu, , w] = HOOK(side);
  P.circle(hu, 694, 112, { fill: glowFill(P.g, '#ffd98a', .5) }, w);
}
// The little lights along the garland, warm with a red or green one here and there.
export function lights(P) {
  const halo = glowFill(P.g, '#ffd98a', .5);
  for (let i = 0; i < HOOKS.length - 1; i++) for (const s of [.16, .38, .62, .84]) {
    const [u, v] = swag(HOOKS[i], HOOKS[i + 1], s), fill = (i * 4 + s * 10) % 7 < 1 ? '#f2a08f' : (i + s * 10) % 5 < 1 ? '#9fd0a8' : '#ffe4a3';
    P.circle(u, v + 21, 24, { fill: halo }, 44); P.circle(u, v + 20, 6.5, { fill }, 45);
  }
}
// A warm light behind the house, there when it is pointed at.
export function glow(P) { P.circle(500, 820, 620, { fill: glowFill(P.g, '#ffd98a', .3) }); }

// The inside of a drawer, seen from a little above as it comes out: the back of the box, its floor of kraft paper and its
// sides, a twist of tissue paper the little thing lies in. The 24th's is a lit niche of red behind its two doors.
export function tray(P, { u0, v0, u1, v1, tone }) {
  const h = v1 - v0, cu = (u0 + u1) / 2;
  if (tone === 'crown') {
    P.path(`M${f(u0 + 6)} ${f(v1)}L${f(u0 + 6)} ${f(v0 + 46)}Q${f(u0 + 6)} ${f(v0 + 6)} ${f(u0 + 50)} ${f(v0 + 8)}Q${f(cu)} ${f(v0 - 14)} ${f(u1 - 50)} ${f(v0 + 8)}Q${f(u1 - 6)} ${f(v0 + 6)} ${f(u1 - 6)} ${f(v0 + 46)}L${f(u1 - 6)} ${f(v1)}Z`, { fill: C.redDeep });
    P.path(`M${f(u0 + 26)} ${f(v1 - 10)}L${f(u0 + 26)} ${f(v0 + 56)}Q${f(u0 + 26)} ${f(v0 + 30)} ${f(u0 + 58)} ${f(v0 + 30)}Q${f(cu)} ${f(v0 + 12)} ${f(u1 - 58)} ${f(v0 + 30)}Q${f(u1 - 26)} ${f(v0 + 30)} ${f(u1 - 26)} ${f(v0 + 56)}L${f(u1 - 26)} ${f(v1 - 10)}Z`, { fill: 'none', stroke: C.gold, 'stroke-width': 3 });
    P.poly([[u0 + 26, v1 - 40], [u1 - 26, v1 - 40], [u1 - 6, v1], [u0 + 6, v1]], { fill: C.redDark });
    return;
  }
  P.poly([[u0 + 8, v0 + 4], [u1 - 8, v0 + 4], [u1 - 8, v0 + h * .16], [u0 + 8, v0 + h * .16]], { fill: C.woodDeep });
  P.poly([[u0 + 8, v0 + h * .16], [u1 - 8, v0 + h * .16], [u1 - 1, v0 + h * .62], [u0 + 1, v0 + h * .62]], { fill: C.kraft });
  P.poly([[u0 + 1, v0 + h * .62], [u0 + 8, v0 + h * .16], [u0 + 16, v0 + h * .16], [u0 + 11, v0 + h * .62]], { fill: C.woodLight });
  P.poly([[u1 - 1, v0 + h * .62], [u1 - 8, v0 + h * .16], [u1 - 16, v0 + h * .16], [u1 - 11, v0 + h * .62]], { fill: C.woodLight });
  P.path(`M${f(u0 + 18)} ${f(v0 + h * .5)}Q${f(cu - 30)} ${f(v0 + h * .24)} ${f(cu)} ${f(v0 + h * .36)}T${f(u1 - 18)} ${f(v0 + h * .46)}L${f(u1 - 14)} ${f(v0 + h * .6)}L${f(u0 + 14)} ${f(v0 + h * .6)}Z`, { fill: C.red, opacity: .85 });
}

// The front, as two sheets one before the other: the cabinet (its drawers' empty slots) and the gable; then the garland,
// the sign, the roof's boards and snow. The base before the cabinet's foot, what stands on the cobbles before it. All
// together, the whole front.
export function back(P) { cabinet(P); gable(P); }
export function front(P) { garland(P); sign(P); roof(P); }
export function plinth(P) { base(P); }
export function house(P) { back(P); front(P); plinth(P); feet(P); }
