// Santa's Cabin as a paper dollhouse: its front is cut away so the room shows, like a pop-up book page.
// Every board is drawn here once, then stood up in 3D by cabin-scene.js. Units: 1 = Santa's seated height.
// Light comes from the upper left. It is Christmas morning: Santa is home from the night's deliveries.
import { holly, pine, shape } from './paper-art.js';
import { roofHouse, star } from './paper-props.js';

export const PX = 500;
// Inner floor from x -1.6 to 1.6 and z -1 to 1, walls 1.9 high, ridge at 3. The front is open.
export const HOUSE = { width: 3.2, depth: 2, wall: 1.9, ridge: 3, thick: .1, eaves: .32, overhang: .15 };
HOUSE.slope = Math.hypot(HOUSE.width / 2, HOUSE.ridge - HOUSE.wall);
export const CHAIR = { x: -.45, z: .05 };
// The snowy base the house stands on, the reindeer waiting outside, and the lantern hung from the ridge.
export const PLATFORM = { rx: 3.9, rz: 2.5, top: -.12, height: .42 };
export const REINDEER = { x: -2.6, z: .8, turn: .8, height: 1.3 };
export const LANTERN = { x: .3, z: .05 };
// The fireplace on the back wall; its chimney rises out of the right slope of the roof.
export const FIRE = { x: .88 };
const CREAM = '#fbf3df', SNOW = '#fbf8f1', RED = '#a84a42', GREEN = '#4f7d68', DEEP_GREEN = '#3f6653', GOLD = '#e0b04f';
const WOOD = '#8f5a3c', WOOD_LIT = '#a86b47', TIMBER = '#6b4a33', PLASTER = '#f1e4c8';
// Stable "random" numbers, so every visit cuts the same cabin.
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
const clip = (svg, id, d) => { shape('path', { d }, shape('clipPath', { id }, shape('defs', {}, svg))); return `url(#${id})`; };

// Walls are cream plaster under a dark timber frame, with a wood wainscot along the bottom: wood is the outline, not the whole wall.
function plaster(parent, width, height, fill = PLASTER) {
  shape('rect', { x: 0, y: 0, width, height, fill }, parent);
  for (let i = 0; i < width * height / 9000; i++) shape('circle', { cx: noise(i) * width, cy: noise(i + 999) * height, r: 1.5 + noise(i + 3) * 2.5, fill: '#e2d0ad', opacity: .45 }, parent);
}
function wainscot(parent, width, height, top) {
  shape('rect', { x: 0, y: top, width, height: height - top, fill: '#a8774d' }, parent);
  for (let x = 20; x < width - 40; x += 190) shape('rect', { x, y: top + 34, width: 160, height: height - top - 60, rx: 6, fill: '#b98a5a', stroke: '#8f6340', 'stroke-width': 5 }, parent);
  shape('rect', { x: 0, y: top - 6, width, height: 26, fill: TIMBER }, parent);
}
const beam = (parent, x, y, width, height) => shape('rect', { x, y, width, height, fill: TIMBER }, parent);
const brace = (parent, d) => shape('path', { d, stroke: TIMBER, 'stroke-width': 30, 'stroke-linecap': 'square', fill: 'none' }, parent);

function stones(parent, x, y, width, height) {
  shape('rect', { x, y, width, height, fill: '#b9ae9e' }, parent);
  for (let row = 0; row * 50 < height; row++) {
    for (let col = -1; col * 70 < width; col++) {
      const sx = x + col * 70 + (row % 2) * 35 + noise(row * 9 + col) * 8;
      shape('rect', { x: sx, y: y + row * 50 + 4, width: 62, height: 42, rx: 18, fill: ['#d9d1c3', '#cfc5b5', '#e3dccf'][(row + col + 3) % 3] }, parent);
    }
  }
}

// A green-framed window onto the snowy morning; `id` keeps the clip unique inside one board.
function morningWindow(parent, svg, x, y, width, height, id) {
  const view = shape('g', { 'clip-path': clip(svg, id, `M${x} ${y}H${x + width}V${y + height}H${x}Z`) }, parent);
  shape('rect', { x, y, width, height, fill: '#cfe3ee' }, view);
  shape('rect', { x, y: y + height * .42, width, height: height * .2, fill: '#f6e2d4' }, view);
  shape('circle', { cx: x + width * .7, cy: y + height * .5, r: height * .13, fill: '#fbe7b0' }, view);
  shape('path', { d: `M${x} ${y + height * .62}C${x + width * .3} ${y + height * .5} ${x + width * .6} ${y + height * .6} ${x + width} ${y + height * .52}V${y + height}H${x}Z`, fill: '#e6eef2' }, view);
  pine(view, x + width * .24, y + height * .78, height * .3, DEEP_GREEN);
  pine(view, x + width * .82, y + height * .72, height * .24, GREEN);
  shape('path', { d: `M${x} ${y + height * .84}C${x + width * .4} ${y + height * .76} ${x + width * .7} ${y + height * .84} ${x + width} ${y + height * .78}V${y + height}H${x}Z`, fill: SNOW }, view);
  for (let i = 0; i < 12; i++) shape('circle', { cx: x + noise(i + x) * width, cy: y + noise(i + y) * height * .7, r: 3 + noise(i) * 3, fill: '#fff', opacity: .9 }, view);
  const bar = 20;
  shape('path', { d: `M${x - bar} ${y - bar}H${x + width + bar}V${y + height + bar}H${x - bar}ZM${x} ${y}V${y + height}H${x + width}V${y}Z`, fill: GREEN, 'fill-rule': 'evenodd' }, parent);
  shape('path', { d: `M${x + width / 2} ${y}V${y + height}M${x} ${y + height * .5}H${x + width}`, stroke: GREEN, 'stroke-width': bar * .7 }, parent);
  shape('rect', { x: x - bar * 2, y: y + height + bar * .6, width: width + bar * 4, height: bar * 1.4, rx: 6, fill: WOOD_LIT }, parent);
  garland(parent, x - bar, x + width + bar, y - bar - 6, 10);
}

function archedDoor(parent, x, top, width, bottom) {
  const r = width / 2;
  shape('path', { d: `M${x - 22} ${bottom}V${top + r}A${r + 22} ${r + 22} 0 0 1 ${x + width + 22} ${top + r}V${bottom}Z`, fill: WOOD }, parent);
  shape('path', { d: `M${x} ${bottom}V${top + r}A${r} ${r} 0 0 1 ${x + width} ${top + r}V${bottom}Z`, fill: GREEN }, parent);
  for (let i = 1; i < 4; i++) shape('path', { d: `M${x + width * i / 4} ${top + (i === 2 ? 0 : r * .3)}V${bottom}`, stroke: DEEP_GREEN, 'stroke-width': 6 }, parent);
  shape('path', { d: `M${x + width * .12} ${bottom - 60}H${x + width * .88}`, stroke: DEEP_GREEN, 'stroke-width': 10 }, parent);
  wreath(parent, x + r, top + r + 70, 62);
  shape('circle', { cx: x + width - 34, cy: top + (bottom - top) * .58, r: 11, fill: GOLD }, parent);
}

export function backWall({ plain, paper, svg }, { width, height }) {
  const eave = height - HOUSE.wall * PX, rail = height - .42 * PX;
  const wall = shape('g', { 'clip-path': clip(svg, 'gable', `M0 ${height}V${eave}L${width / 2} 0L${width} ${eave}V${height}Z`) }, plain);
  plaster(wall, width, height);
  // The fireplace stands in front at x = .88; its stone chimney climbs on up through the gable.
  stones(wall, 1155, 0, 170, 880);
  wainscot(wall, width, height, rail);
  beam(wall, 0, eave - 22, width, 44);
  beam(wall, 0, 250, width, 34);
  brace(wall, `M${width / 2} 268L${width / 2 - 250} ${eave - 20}M${width / 2} 268L${width / 2 + 250} ${eave - 20}`);
  for (const x of [0, 628, 948, width - 40]) beam(wall, x, eave, x === 0 || x === width - 40 ? 40 : 32, (x === 628 || x === 948 ? height : rail) - eave);
  // A round window high in the gable, and a gold star above the collar beam.
  const ox = width / 2, oy = 405;
  shape('circle', { cx: ox, cy: oy, r: 86, fill: GREEN }, paper);
  shape('circle', { cx: ox, cy: oy, r: 66, fill: '#cfe3ee' }, paper);
  shape('path', { d: `M${ox - 66} ${oy + 18}C${ox - 20} ${oy} ${ox + 20} ${oy + 16} ${ox + 66} ${oy + 6}V${oy + 70}H${ox - 66}Z`, fill: SNOW }, paper);
  shape('path', { d: `M${ox} ${oy - 66}V${oy + 66}M${ox - 66} ${oy}H${ox + 66}`, stroke: GREEN, 'stroke-width': 10 }, paper);
  star(paper, ox, 150, 34, GOLD);
  pictureFrame(paper, 70, 610, 200, 150);
  archedDoor(paper, 690, 880, 228, height);
}

export function sideWall(side) {
  return ({ plain, paper, svg }, { width, height }) => {
    const rail = height - .42 * PX;
    plaster(plain, width, height); wainscot(plain, width, height, rail);
    for (const x of [0, width / 2 - 16, width - 36]) beam(plain, x, 0, x ? 32 : 36, rail);
    beam(plain, 0, 0, width, 30);
    if (side === 'left') {
      // Texture left is the front of the room. The window holds the advent house on its sill.
      morningWindow(paper, svg, 560, 210, 300, 300, 'left-window');
      adventHouse(paper, 710, 551, adventLit());
      for (const [x, y, w, h, fill] of [[120, 300, 140, 110, RED], [150, 250, 80, 50, GOLD]]) shape('rect', { x, y, width: w, height: h, rx: 10, fill }, paper);
    } else {
      // Texture left is the back. A window by the fireplace, a shelf of candles toward the front.
      morningWindow(paper, svg, 150, 230, 260, 260, 'right-window');
      const y = 470;
      shape('rect', { x: 560, y, width: 360, height: 24, rx: 6, fill: WOOD_LIT }, paper);
      for (const [cx, h] of [[610, 90], [660, 64]]) {
        shape('rect', { x: cx - 16, y: y - h, width: 32, height: h, rx: 4, fill: CREAM }, paper);
        shape('path', { d: `M${cx} ${y - h - 34}C${cx + 14} ${y - h - 18} ${cx + 10} ${y - h - 4} ${cx} ${y - h - 2}C${cx - 10} ${y - h - 4} ${cx - 14} ${y - h - 18} ${cx} ${y - h - 34}Z`, fill: '#f2a541' }, paper);
      }
      shape('path', { d: `M760 ${y}V${y - 96}C760 ${y - 120} 860 ${y - 120} 860 ${y - 96}V${y}Z`, fill: '#cfe1e7' }, paper);
      shape('rect', { x: 774, y: y - 132, width: 72, height: 22, rx: 8, fill: RED }, paper);
      for (const [cx, cy] of [[790, y - 40], [830, y - 62], [820, y - 24]]) shape('circle', { cx, cy, r: 13, fill: '#a8774d' }, paper);
    }
  };
}

// The outside of a side wall: whiter plaster, timber braces, a shuttered window with a holly box, snow drifted at the foot.
export function outerWall({ plain, paper }, { width, height }) {
  plaster(plain, width, height, '#f5eddd');
  for (const x of [0, width / 2 - 16, width - 36]) beam(plain, x, 0, 34, height);
  beam(plain, 0, 0, width, 34); beam(plain, 0, height * .52, width, 28);
  brace(plain, `M40 ${height * .52}L${width / 2 - 20} 40M${width - 40} ${height * .52}L${width / 2 + 20} 40`);
  const x = width / 2 - 130, y = height * .58;
  shape('rect', { x, y, width: 260, height: 220, fill: '#f6d98c' }, paper);
  shape('path', { d: `M${x + 130} ${y}V${y + 220}M${x} ${y + 110}H${x + 260}`, stroke: GREEN, 'stroke-width': 14 }, paper);
  for (const sx of [x - 90, x + 268]) shape('rect', { x: sx, y: y - 6, width: 82, height: 232, rx: 6, fill: GREEN }, paper);
  shape('rect', { x: x - 20, y: y + 226, width: 300, height: 50, rx: 8, fill: WOOD }, paper);
  for (let i = 0; i < 4; i++) holly(paper, x + 30 + i * 66, y + 226, .6);
  shape('path', { d: `M0 ${height}C${width * .2} ${height - 70} ${width * .5} ${height - 40} ${width * .7} ${height - 80}S${width} ${height - 50} ${width} ${height - 60}V${height}Z`, fill: SNOW }, paper);
}

export function floor({ plain, paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, fill: '#7d5636' }, plain);
  for (let i = 0; i * 160 < width; i++) {
    shape('rect', { x: i * 160 + 3, y: 0, width: 154, height, fill: ['#b08559', '#a87c53', '#b98d60'][i % 3] }, plain);
    for (let k = 0; k < 2; k++) { const y = noise(i * 7 + k) * height; shape('path', { d: `M${i * 160 + 3} ${y}h154`, stroke: '#7d5636', 'stroke-width': 4 }, plain); }
  }
  // A cream rug with a red border and paper poinsettias; floor art runs from the back wall (top) to the open front (bottom).
  const cx = (CHAIR.x + .25 + HOUSE.width / 2) * PX, cy = (CHAIR.z + .3 + HOUSE.depth / 2) * PX, w = 1000, h = 540;
  shape('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 22, fill: RED }, paper);
  shape('rect', { x: cx - w / 2 + 34, y: cy - h / 2 + 34, width: w - 68, height: h - 68, rx: 14, fill: CREAM }, paper);
  shape('rect', { x: cx - w / 2 + 56, y: cy - h / 2 + 56, width: w - 112, height: h - 112, rx: 10, fill: 'none', stroke: GREEN, 'stroke-width': 8, 'stroke-dasharray': '20 12' }, paper);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) poinsettia(paper, cx - w * .33 + col * w * .22, cy - h * .18 + row * h * .36, 50);
}
function poinsettia(parent, x, y, size) {
  for (let i = 0; i < 4; i++) shape('path', { d: 'M0 0C-12-18-6-44 0-56 6-44 12-18 0 0Z', fill: GREEN, transform: `translate(${x} ${y}) rotate(${45 + i * 90}) scale(${size / 56})` }, parent);
  for (let i = 0; i < 6; i++) shape('path', { d: 'M0 0C-14-16-10-40 0-50 10-40 14-16 0 0Z', fill: RED, transform: `translate(${x} ${y}) rotate(${i * 60}) scale(${size / 56})` }, parent);
  shape('circle', { cx: x, cy: y, r: size * .16, fill: GOLD }, parent);
}

// Under the roof: boards run with the ridge, rafters run down the slope. Art: left is the eave, right the ridge.
export function roofInside({ plain }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, fill: '#c9955f' }, plain);
  for (let x = 80; x < width; x += 80) shape('path', { d: `M${x} 0V${height}`, stroke: '#b07f53', 'stroke-width': 4 }, plain);
  for (let y = 60; y < height; y += 240) shape('rect', { x: 0, y, width, height: 40, fill: TIMBER }, plain);
}
// On the roof: rows of paper shingles, snow along the ridge and the eave. Art: left is the eave, right the ridge.
export function roofOutside({ plain, paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, fill: '#3f3531' }, plain);
  for (let x = 0, row = 0; x < width; x += 62, row++) {
    for (let y = -30 + (row % 2) * 34; y < height; y += 68) shape('rect', { x, y, width: 70, height: 64, rx: 26, fill: ['#5a4d47', '#4f4440', '#62544d'][(row + Math.round(y / 68)) % 3] }, plain);
  }
  shape('path', { d: `M${width} 0V${height}H${width - 150}C${width - 210} ${height * .8} ${width - 130} ${height * .6} ${width - 200} ${height * .4}S${width - 140} ${height * .1} ${width - 190} 0Z`, fill: SNOW }, paper);
  shape('path', { d: `M0 0V${height}H40C70 ${height * .85} 30 ${height * .6} 60 ${height * .45}S30 ${height * .15} 50 0Z`, fill: SNOW }, paper);
  for (let i = 0; i < 6; i++) shape('ellipse', { cx: 300 + noise(i + 40) * (width - 600), cy: noise(i + 60) * height, rx: 60 + noise(i) * 70, ry: 30 + noise(i + 2) * 30, fill: SNOW }, paper);
}

// Garland draped along the front edge of the roof, with bows and pinecones, like the reference cottage.
export function roofGarland({ paper }, { width, height }) {
  const peak = [width / 2, 46], left = [40, height - 50], right = [width - 40, height - 50];
  for (const [from, to] of [[left, peak], [peak, right]]) {
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI * 5) * 10;
      for (let k = 0; k < 3; k++) shape('path', { d: 'M0-24C11-17 15-4 11 8 8 16 3 20 0 24-3 20-8 16-11 8-15-4-11-17 0-24Z', fill: [DEEP_GREEN, GREEN, '#5f8a70'][k], transform: `translate(${x + (k - 1) * 14} ${y + (k % 2) * 10}) rotate(${noise(i * 3 + k) * 360}) scale(.9)` }, paper);
      if (i % 4 === 2) { shape('circle', { cx: x, cy: y + 16, r: 9, fill: '#b4544c' }, paper); shape('circle', { cx: x + 12, cy: y + 10, r: 8, fill: '#b4544c' }, paper); }
      if (i % 7 === 5) shape('ellipse', { cx: x - 8, cy: y + 24, rx: 12, ry: 18, fill: '#8a6248' }, paper);
    }
  }
  for (const [x, y] of [left, peak, right]) {
    shape('path', { d: `M${x} ${y}c-34-30-60-6-36 12 14 10 30 4 36-12zm0 0c34-30 60-6 36 12-14 10-30 4-36-12z`, fill: RED }, paper);
    shape('path', { d: `M${x - 4} ${y + 2}l-20 46h14l10-24 10 24h14l-20-46z`, fill: '#87302f' }, paper);
    shape('circle', { cx: x, cy: y, r: 9, fill: '#87302f' }, paper);
  }
}

export function lantern({ paper }, { width, height }) {
  const cx = width / 2;
  shape('path', { d: `M${cx} 0V120`, stroke: '#3b2a24', 'stroke-width': 5, 'stroke-dasharray': '10 6' }, paper);
  shape('path', { d: `M${cx - 50} 150L${cx} 112 ${cx + 50} 150Z`, fill: '#3b2a24' }, paper);
  shape('rect', { x: cx - 46, y: 150, width: 92, height: 110, rx: 8, fill: '#ffe3a0' }, paper);
  shape('path', { d: `M${cx - 46} 150V260M${cx + 46} 150V260M${cx} 150V260`, stroke: '#3b2a24', 'stroke-width': 6 }, paper);
  shape('rect', { x: cx - 10, y: 200, width: 20, height: 40, rx: 4, fill: CREAM }, paper);
  shape('path', { d: `M${cx} 172C${cx + 9} 184 ${cx + 6} 196 ${cx} 198C${cx - 6} 196 ${cx - 9} 184 ${cx} 172Z`, fill: '#f2a541' }, paper);
  shape('rect', { x: cx - 52, y: 258, width: 104, height: 16, rx: 6, fill: '#3b2a24' }, paper);
}

export function bookshelf({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 8, fill: WOOD }, paper);
  shape('rect', { x: 16, y: 16, width: width - 32, height: height - 32, fill: '#6b4a33' }, paper);
  const shelves = 4, gap = (height - 32) / shelves, colours = [RED, GREEN, GOLD, '#7cb8ec', CREAM, '#b5625a', DEEP_GREEN];
  for (let s = 0; s < shelves; s++) {
    const base = 16 + gap * (s + 1);
    shape('rect', { x: 10, y: base - 10, width: width - 20, height: 16, fill: WOOD_LIT }, paper);
    let x = 26;
    while (x < width - 60) {
      const w = 18 + noise(s * 17 + x) * 18, h = gap * (.55 + noise(x + s) * .3);
      if (s === 1 && x > width * .55) { shape('rect', { x, y: base - 10 - 46, width: 50, height: 46, rx: 8, fill: '#b5625a' }, paper); holly(paper, x + 25, base - 60, .5); break; }
      shape('rect', { x, y: base - 10 - h, width: w, height: h, rx: 3, fill: colours[Math.floor(noise(x * 3 + s) * colours.length)] }, paper);
      x += w + 4;
    }
  }
}

export function lampTable({ paper }, { width, height }) {
  const cx = width / 2, top = height - 230;
  shape('rect', { x: cx - 16, y: top + 18, width: 32, height: 200, fill: WOOD }, paper);
  shape('path', { d: `M${cx - 70} ${height - 6}C${cx - 60} ${height - 36} ${cx + 60} ${height - 36} ${cx + 70} ${height - 6}Z`, fill: WOOD }, paper);
  shape('ellipse', { cx, cy: top + 12, rx: 110, ry: 20, fill: WOOD }, paper);
  shape('ellipse', { cx, cy: top + 4, rx: 110, ry: 20, fill: WOOD_LIT }, paper);
  // Lamp with a cream shade (its glow is a separate sprite), and the cookies and milk left out last night.
  shape('rect', { x: cx + 18, y: top - 120, width: 14, height: 120, fill: GOLD }, paper);
  shape('ellipse', { cx: cx + 25, cy: top - 4, rx: 30, ry: 9, fill: GOLD }, paper);
  shape('path', { d: `M${cx - 22} ${top - 120}L${cx + 2} ${top - 200}H${cx + 48}L${cx + 72} ${top - 120}Z`, fill: '#fbe9c2' }, paper);
  shape('ellipse', { cx: cx - 50, cy: top - 2, rx: 40, ry: 10, fill: CREAM }, paper);
  for (const [x, y] of [[cx - 64, top - 12], [cx - 36, top - 14]]) { shape('circle', { cx: x, cy: y, r: 14, fill: '#c08a5a' }, paper); shape('circle', { cx: x - 3, cy: y - 3, r: 3, fill: '#5b3a2c' }, paper); }
  shape('path', { d: `M${cx - 98} ${top}L${cx - 101} ${top - 60}H${cx - 69}L${cx - 72} ${top}Z`, fill: '#fffdf7' }, paper);
}

export function treeLights({ paper }, { width, height }) {
  // Only the bulbs, drawn over the tree so they can twinkle on their own layer.
  for (let i = 0; i < 26; i++) {
    const t = noise(i + 7), y = 140 + t * (height - 280), half = (y - 80) / (height - 200) * width * .42;
    shape('circle', { cx: width / 2 + (noise(i + 31) * 2 - 1) * half, cy: y, r: 7, fill: ['#ffd77a', '#ef6f5e', '#7fce9a', '#7cb8ec'][i % 4] }, paper);
  }
}

// Outside: drifts along the front of the snowy base, pines, the mailbox and the sleigh.
export function drifts({ paper }, { width, height }) {
  for (let i = 0; i < 9; i++) {
    const x = i / 8 * width, w = 300 + noise(i + 3) * 220, h = 120 + noise(i + 5) * 120;
    shape('path', { d: `M${x - w / 2} ${height}C${x - w * .3} ${height - h} ${x + w * .3} ${height - h} ${x + w / 2} ${height}Z`, fill: SNOW }, paper);
    shape('path', { d: `M${x + w * .1} ${height - h * .7}C${x + w * .35} ${height - h * .5} ${x + w * .45} ${height - h * .2} ${x + w / 2} ${height}H${x + w * .25}C${x + w * .3} ${height - h * .3} ${x + w * .25} ${height - h * .55} ${x + w * .1} ${height - h * .7}Z`, fill: '#e2ebef' }, paper);
    if (i % 3 === 1) holly(paper, x, height - h * .7, .7);
  }
}
export function pineBoard({ paper }, { width, height }) { pine(paper, width / 2, height - 10, height - 20, '#5f8a70'); }
export function mailbox({ paper }, { width, height }) {
  const cx = width / 2;
  shape('rect', { x: cx - 14, y: 230, width: 28, height: height - 230, fill: WOOD }, paper);
  shape('path', { d: `M${cx - 110} 240V140C${cx - 110} 80 ${cx + 110} 80 ${cx + 110} 140V240Z`, fill: RED }, paper);
  shape('path', { d: `M${cx - 110} 140C${cx - 110} 80 ${cx + 110} 80 ${cx + 110} 140`, stroke: '#87302f', 'stroke-width': 10, fill: 'none' }, paper);
  shape('path', { d: `M${cx - 120} 110C${cx - 80} 60 ${cx + 80} 60 ${cx + 120} 110C${cx + 60} 96 ${cx - 60} 96 ${cx - 120} 110Z`, fill: SNOW }, paper);
  shape('rect', { x: cx + 96, y: 150, width: 14, height: 80, fill: GOLD }, paper);
  shape('rect', { x: cx + 96, y: 210, width: 50, height: 20, fill: GOLD }, paper);
  star(paper, cx, 190, 28, GOLD);
}
export function sleigh({ paper }, { width, height }) {
  const ground = height - 16;
  shape('path', { d: `M30 ${ground - 20}H${width - 120}C${width - 60} ${ground - 20} ${width - 30} ${ground - 60} ${width - 30} ${ground - 110}`, stroke: '#a9845b', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M90 ${ground - 20}V${ground - 70}M${width - 180} ${ground - 20}V${ground - 70}`, stroke: '#a9845b', 'stroke-width': 12 }, paper);
  shape('path', { d: `M40 ${ground - 70}H${width - 90}L${width - 130} ${ground - 170}H${width * .35}C${width * .2} ${ground - 200} 80 ${ground - 170} 40 ${ground - 70}Z`, fill: RED }, paper);
  shape('path', { d: `M40 ${ground - 70}H${width - 90}`, stroke: GOLD, 'stroke-width': 10 }, paper);
  shape('path', { d: `M${width * .42} ${ground - 160}C${width * .4} ${ground - 300} ${width * .7} ${ground - 300} ${width * .68} ${ground - 160}Z`, fill: '#e9d9b8' }, paper);
  shape('path', { d: `M${width * .5} ${ground - 268}l-20-34m40 34l20-34`, stroke: RED, 'stroke-width': 10, 'stroke-linecap': 'round' }, paper);
}
export function smokePuff({ paper }, { width, height }) {
  shape('path', { d: `M${width * .2} ${height * .8}C${width * .05} ${height * .8} ${width * .05} ${height * .45} ${width * .25} ${height * .45}C${width * .25} ${height * .15} ${width * .6} ${height * .1} ${width * .65} ${height * .35}C${width * .9} ${height * .3} ${width * .98} ${height * .7} ${width * .8} ${height * .8}Z`, fill: '#f4f1ec' }, paper);
}

function garland(parent, from, to, y, sag) {
  const span = to - from, swags = Math.round(span / 300), width = span / swags;
  let d = `M${from} ${y}`;
  for (let i = 0; i < swags; i++) d += `Q${from + width * (i + .5)} ${y + sag * 2} ${from + width * (i + 1)} ${y}`;
  shape('path', { d, stroke: '#3f6653', 'stroke-width': 30, fill: 'none', 'stroke-linecap': 'round' }, parent);
  shape('path', { d, stroke: '#5f8a70', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '6 14' }, parent);
  const colours = ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec'];
  for (let i = 0; i <= swags * 4; i++) {
    const t = i / 4, swag = Math.floor(t), local = t - swag, x = from + width * t;
    const curve = y + sag * 2 * 2 * local * (1 - local);
    shape('ellipse', { cx: x, cy: curve + 20, rx: 9, ry: 13, fill: colours[i % 4] }, parent);
    shape('rect', { x: x - 6, y: curve + 4, width: 12, height: 8, rx: 2, fill: '#4f6a62' }, parent);
  }
  for (let i = 0; i <= swags; i++) holly(parent, from + width * i, y - 4, .62);
}

function wreath(parent, x, y, radius) {
  shape('circle', { cx: x, cy: y, r: radius, fill: 'none', stroke: '#3f6653', 'stroke-width': radius * .5 }, parent);
  for (let i = 0; i < 14; i++) {
    const angle = i / 14 * Math.PI * 2, px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
    shape('path', { d: 'M0-22C11-16 15-4 11 8 8 16 3 20 0 24-3 20-8 16-11 8-15-4-11-16 0-22Z', fill: i % 2 ? '#5f8a70' : '#4f7d68', transform: `translate(${px} ${py}) rotate(${angle * 180 / Math.PI + 90}) scale(${radius / 60})` }, parent);
  }
  for (const [dx, dy] of [[-.5, -.62], [.62, -.4], [.7, .4], [-.68, .35], [0, .78]]) shape('circle', { cx: x + dx * radius, cy: y + dy * radius, r: radius * .1, fill: '#b4544c' }, parent);
  shape('path', { d: `M${x} ${y + radius * .7}c-${radius * .45} -${radius * .35} -${radius * .7} ${radius * .05} -${radius * .5} ${radius * .3}S${x - radius * .1} ${y + radius * .82} ${x} ${y + radius * .74}c${radius * .45} -${radius * .35} ${radius * .7} ${radius * .05} ${radius * .5} ${radius * .3}S${x + radius * .1} ${y + radius * .82} ${x} ${y + radius * .74}Z`, fill: RED }, parent);
  shape('path', { d: `M${x - 6} ${y + radius * .78}l-${radius * .22} ${radius * .55}h${radius * .16}l${radius * .1} -${radius * .3} ${radius * .1} ${radius * .3}h${radius * .16}l-${radius * .22} -${radius * .55}Z`, fill: '#87302f' }, parent);
}

function pictureFrame(parent, x, y, width, height) {
  shape('rect', { x, y, width, height, rx: 8, fill: WOOD }, parent);
  shape('rect', { x: x + 14, y: y + 14, width: width - 28, height: height - 28, fill: '#dfeef3' }, parent);
  shape('path', { d: `M${x + 14} ${y + height - 40}C${x + width * .4} ${y + height - 60} ${x + width * .7} ${y + height - 46} ${x + width - 14} ${y + height - 56}V${y + height - 14}H${x + 14}Z`, fill: SNOW }, parent);
  // A reindeer silhouette, looking left.
  const rx = x + width * .55, ry = y + height - 52;
  shape('path', { d: `M${rx - 34} ${ry}V${ry - 22}C${rx - 30} ${ry - 34} ${rx + 10} ${ry - 36} ${rx + 26} ${ry - 30}L${rx + 30} ${ry}H${rx + 22}V${ry - 18}H${rx - 22}V${ry}Z M${rx - 30} ${ry - 28}L${rx - 46} ${ry - 50}L${rx - 58} ${ry - 46}L${rx - 52} ${ry - 38}Z`, fill: '#8a6a55' }, parent);
  shape('path', { d: `M${rx - 46} ${ry - 50}l-6 -18m6 18l8 -16m-8 16l-14 -8`, stroke: '#8a6a55', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

export function fireplace({ paper: sheet }, size) {
  const width = 600, height = 650, paper = shape('g', { transform: `scale(${size.width / width} ${size.height / height})` }, sheet);
  const mantel = 250, opening = { x: 150, y: 400, width: 300, height: 190 };
  // Chimney breast of rounded river stones.
  shape('rect', { x: 20, y: 0, width: width - 40, height: height - 40, fill: '#b9ae9e' }, paper);
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 30 + col * 82 + (row % 2) * 40 + noise(row * 9 + col) * 12, y = 12 + row * 54;
      if (x > width - 50) continue;
      shape('rect', { x, y, width: 70 + noise(row + col * 5) * 12, height: 44, rx: 20, fill: ['#d9d1c3', '#cfc5b5', '#e3dccf'][(row + col) % 3] }, paper);
    }
  }
  shape('path', { d: `M${opening.x} ${opening.y + opening.height}V${opening.y + 50}C${opening.x} ${opening.y - 10} ${opening.x + opening.width} ${opening.y - 10} ${opening.x + opening.width} ${opening.y + 50}V${opening.y + opening.height}Z`, fill: '#3b2a24' }, paper);
  shape('path', { d: `M${opening.x + 24} ${opening.y + opening.height}V${opening.y + 60}C${opening.x + 24} ${opening.y + 14} ${opening.x + opening.width - 24} ${opening.y + 14} ${opening.x + opening.width - 24} ${opening.y + 60}V${opening.y + opening.height}Z`, fill: '#5b3a2c' }, paper);
  for (const [x, y, w] of [[200, 560, 170], [230, 540, 150]]) shape('rect', { x, y, width: w, height: 26, rx: 13, fill: ['#7d5636', '#94653f'][x % 2] }, paper);
  // Mantel beam with a garland, candles and three stockings.
  shape('rect', { x: 0, y: mantel, width, height: 42, rx: 8, fill: WOOD_LIT }, paper);
  shape('rect', { x: 0, y: mantel + 30, width, height: 12, fill: WOOD }, paper);
  garland(paper, 10, width - 10, mantel - 6, 10);
  for (const x of [190, 410]) {
    shape('rect', { x: x - 14, y: mantel - 76, width: 28, height: 70, rx: 4, fill: CREAM }, paper);
    shape('path', { d: `M${x} ${mantel - 112}C${x + 13} ${mantel - 96} ${x + 9} ${mantel - 82} ${x} ${mantel - 80}C${x - 9} ${mantel - 82} ${x - 13} ${mantel - 96} ${x} ${mantel - 112}Z`, fill: '#f2a541' }, paper);
  }
  [[86, RED], [300, GREEN], [514, '#c08a3e']].forEach(([x, fill], index) => {
    const top = mantel + 44;
    shape('path', { d: `M${x - 30} ${top}V${top + 92}C${x - 30} ${top + 120} ${x - 4} ${top + 132} ${x + 22} ${top + 130}H${x + 52}C${x + 70} ${top + 128} ${x + 72} ${top + 104} ${x + 54} ${top + 98}L${x + 24} ${top + 92}V${top}Z`, fill }, paper);
    shape('rect', { x: x - 36, y: top - 4, width: 66, height: 30, rx: 10, fill: SNOW }, paper);
    if (index === 1) star(paper, x, top + 64, 16, GOLD);
  });
  // The hearth slab sticks out past the stones.
  shape('rect', { x: 0, y: height - 52, width, height: 52, rx: 10, fill: '#c7bdad' }, paper);
  shape('rect', { x: 0, y: height - 52, width, height: 14, rx: 7, fill: '#e3dccf' }, paper);
}

export function flames({ paper }, { width, height }) {
  const cx = width / 2;
  for (const [scale, fill, dx] of [[1, '#e8673c', 0], [.78, '#f2a541', -18], [.7, '#f2a541', 30], [.5, '#ffd77a', 4]]) {
    const top = height * (1 - scale), half = width * .3 * scale;
    shape('path', { d: `M${cx + dx - half} ${height}C${cx + dx - half * 1.2} ${height - (height - top) * .5} ${cx + dx - half * .2} ${top + 40} ${cx + dx} ${top}C${cx + dx + half * .4} ${top + 50} ${cx + dx + half * 1.3} ${height - (height - top) * .45} ${cx + dx + half} ${height}Z`, fill }, paper);
  }
}

export function tree({ paper: sheet }, size) {
  const width = 475, height = 875, paper = shape('g', { transform: `scale(${size.width / width} ${size.height / height})` }, sheet);
  const cx = width / 2, base = height - 70;
  shape('rect', { x: cx - 26, y: base - 40, width: 52, height: 60, fill: '#7d5636' }, paper);
  shape('path', { d: `M${cx - 120} ${height - 24}C${cx - 90} ${base - 10} ${cx + 90} ${base - 10} ${cx + 120} ${height - 24}Z`, fill: RED }, paper);
  const tiers = [[base - 30, 230, 210], [base - 190, 190, 190], [base - 340, 150, 170], [base - 470, 104, 150], [base - 580, 62, 130]];
  tiers.forEach(([bottom, half, tall], index) => {
    const top = bottom - tall;
    shape('path', { d: `M${cx} ${top}L${cx + half} ${bottom}C${cx + half * .5} ${bottom + 16} ${cx - half * .5} ${bottom + 16} ${cx - half} ${bottom}Z`, fill: index % 2 ? '#5f8a70' : '#4f7d68' }, paper);
    shape('path', { d: `M${cx} ${top}L${cx + half} ${bottom}C${cx + half * .7} ${bottom + 10} ${cx + half * .35} ${bottom + 14} ${cx + half * .1} ${bottom + 14}Z`, fill: '#3f6653', opacity: .6 }, paper);
    shape('path', { d: `M${cx - half * .82} ${bottom - 8}C${cx - half * .3} ${bottom + 8} ${cx + half * .3} ${bottom - 22} ${cx + half * .82} ${bottom - 4}`, stroke: GOLD, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, paper);
    for (let i = 0; i < 4 - Math.floor(index / 2); i++) {
      const t = (i + .5) / (4 - Math.floor(index / 2)), x = cx - half * .75 + half * 1.5 * t, y = bottom - 30 - noise(i + index * 5) * tall * .35;
      shape('circle', { cx: x, cy: y, r: 15, fill: [RED, GOLD, '#7cb8ec', CREAM][(i + index) % 4] }, paper);
      shape('circle', { cx: x - 5, cy: y - 5, r: 4, fill: '#fff', opacity: .7 }, paper);
    }
  });
  star(paper, cx, base - 700, 46, GOLD);
  const gift = (x, w, h, fill, ribbon) => {
    shape('rect', { x, y: height - 20 - h, width: w, height: h, rx: 6, fill }, paper);
    shape('rect', { x: x + w / 2 - 8, y: height - 20 - h, width: 16, height: h, fill: ribbon }, paper);
    shape('path', { d: `M${x + w / 2} ${height - 20 - h}c-30-34-50-6-18 2m18-2c30-34 50-6 18 2`, stroke: ribbon, 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, paper);
  };
  gift(cx - 230, 110, 80, '#8aa9ad', CREAM); gift(cx + 90, 130, 100, '#b5625a', '#efdcae'); gift(cx - 70, 80, 56, '#e9d9b8', RED);
}

export function chairBack({ paper }, { width, height }) {
  const post = 34, left = 18, right = width - 18 - post, seat = height - 150;
  shape('path', { d: `M${left} ${height - 20}V40C${left} 10 ${left + post} 10 ${left + post} 40V${height - 20}Z`, fill: WOOD }, paper);
  shape('path', { d: `M${right} ${height - 20}V40C${right} 10 ${right + post} 10 ${right + post} 40V${height - 20}Z`, fill: WOOD }, paper);
  shape('path', { d: `M${left + 10} 70C${width * .3} 30 ${width * .7} 30 ${right + 24} 70V128C${width * .7} 92 ${width * .3} 92 ${left + 10} 128Z`, fill: WOOD_LIT }, paper);
  for (let i = 1; i <= 5; i++) { const x = left + post + (right - left - post) * i / 6 - 9; shape('rect', { x, y: 100, width: 18, height: seat - 100, rx: 9, fill: WOOD }, paper); }
  shape('rect', { x: left, y: seat - 36, width: right + post - left, height: 26, rx: 8, fill: WOOD_LIT }, paper);
  shape('rect', { x: left + 6, y: seat - 14, width: right + post - left - 12, height: 54, rx: 22, fill: '#5f8a70' }, paper);
  shape('rect', { x: left + 6, y: seat + 18, width: right + post - left - 12, height: 10, fill: CREAM, opacity: .8 }, paper);
  shape('circle', { cx: left + post / 2, cy: 30, r: 24, fill: WOOD_LIT }, paper);
  shape('circle', { cx: right + post / 2, cy: 30, r: 24, fill: WOOD_LIT }, paper);
  // Little tied cushion against the back, with a holly sprig.
  shape('rect', { x: width * .28, y: 140, width: width * .44, height: 120, rx: 40, fill: '#b5544c' }, paper);
  holly(paper, width / 2, 150, .7);
}

export function chairSide({ paper }, { width, height }) {
  // Front of the chair is on the left of this art. The rocker runner sweeps under both legs.
  const ground = height - 18, arm = height - 210, seat = height - 145;
  shape('path', { d: `M14 ${ground - 46}C${width * .3} ${ground + 18} ${width * .7} ${ground + 18} ${width - 14} ${ground - 60}L${width - 22} ${ground - 72}C${width * .7} ${ground - 8} ${width * .3} ${ground - 8} 24 ${ground - 58}Z`, fill: WOOD }, paper);
  shape('rect', { x: 70, y: arm, width: 28, height: ground - arm - 10, rx: 10, fill: WOOD }, paper);
  shape('rect', { x: width - 120, y: 40, width: 30, height: ground - 70, rx: 12, fill: WOOD }, paper);
  shape('path', { d: `M50 ${arm + 10}C50 ${arm - 20} 90 ${arm - 26} 120 ${arm - 14}L${width - 100} ${arm - 26}V${arm}L120 ${arm + 10}C96 ${arm + 22} 50 ${arm + 30} 50 ${arm + 10}Z`, fill: WOOD_LIT }, paper);
  shape('rect', { x: 84, y: seat, width: width - 190, height: 26, rx: 10, fill: WOOD_LIT }, paper);
  shape('rect', { x: 92, y: seat - 22, width: width - 210, height: 24, rx: 12, fill: '#5f8a70' }, paper);
  for (let i = 0; i < 3; i++) shape('rect', { x: 120 + i * 60, y: arm + 6, width: 14, height: seat - arm - 6, rx: 7, fill: WOOD }, paper);
}

export function chairFront({ paper }, { width, height }) {
  // Only the two front legs and armrest knobs: Santa's knees come forward between them.
  for (const x of [26, width - 60]) {
    shape('rect', { x: x + 4, y: 40, width: 30, height: height - 70, rx: 12, fill: WOOD }, paper);
    shape('ellipse', { cx: x + 19, cy: 38, rx: 30, ry: 22, fill: WOOD_LIT }, paper);
    shape('ellipse', { cx: x + 12, cy: 32, rx: 12, ry: 7, fill: '#c48a5c', opacity: .7 }, paper);
    shape('path', { d: `M${x - 14} ${height - 26}C${x + 4} ${height - 6} ${x + 34} ${height - 6} ${x + 52} ${height - 26}V${height - 12}C${x + 34} ${height + 4} ${x + 4} ${height + 4} ${x - 14} ${height - 12}Z`, fill: WOOD }, paper);
  }
}

// The advent house on the window sill: one lit window per December day so far (all lit outside December).
export function adventLit(date = new Date()) { return date.getMonth() === 11 ? Math.min(date.getDate(), 24) : date.getMonth() === 10 ? 0 : 24; }
function adventHouse(parent, x, base, lit) {
  roofHouse(parent, x, base, 150, 110, { wall: '#ecdcc0', roof: '#a8564c', chimney: true });
  for (let i = 0; i < 24; i++) {
    const column = i % 6, row = Math.floor(i / 6);
    shape('rect', { x: x - 62 + column * 21, y: base - 104 + row * 16, width: 13, height: 10, rx: 2, fill: i < lit ? '#f4cf74' : '#9a8670' }, parent);
  }
}

const wall = (id, w, h, at, extra) => ({ id, w, h, at, kind: 'wall', ...extra });
// Every board: art size in world units and where it stands. `kind` marks room surfaces (cut at a lower density, no paper edge).
export const BOARDS = [
  wall('back', HOUSE.width, HOUSE.ridge, [0, 0, -HOUSE.depth / 2], { draw: backWall }),
  wall('left', HOUSE.depth, HOUSE.wall, [-HOUSE.width / 2, 0, 0], { turn: Math.PI / 2, draw: sideWall('left') }),
  wall('right', HOUSE.depth, HOUSE.wall, [HOUSE.width / 2, 0, 0], { turn: -Math.PI / 2, draw: sideWall('right') }),
  wall('left-out', HOUSE.depth, HOUSE.wall, [-HOUSE.width / 2 - HOUSE.thick, 0, 0], { turn: -Math.PI / 2, draw: outerWall }),
  wall('right-out', HOUSE.depth, HOUSE.wall, [HOUSE.width / 2 + HOUSE.thick, 0, 0], { turn: Math.PI / 2, draw: outerWall }),
  { id: 'floor', w: HOUSE.width, h: HOUSE.depth, at: [0, 0, 0], flat: 'floor', draw: floor, kind: 'floor' },
  { id: 'roof-in-left', roof: 'left', layer: 'inner', w: HOUSE.slope, h: HOUSE.depth, draw: roofInside, kind: 'floor' },
  { id: 'roof-in-right', roof: 'right', layer: 'inner', w: HOUSE.slope, h: HOUSE.depth, draw: roofInside, kind: 'floor' },
  { id: 'roof-out-left', roof: 'left', layer: 'outer', w: HOUSE.slope + HOUSE.eaves, h: HOUSE.depth + HOUSE.overhang * 2, draw: roofOutside, kind: 'floor' },
  { id: 'roof-out-right', roof: 'right', layer: 'outer', w: HOUSE.slope + HOUSE.eaves, h: HOUSE.depth + HOUSE.overhang * 2, draw: roofOutside, kind: 'floor' },
  { id: 'garland', w: HOUSE.width + HOUSE.eaves * 2.6, h: 1.42, at: [0, HOUSE.wall - .26, HOUSE.depth / 2 + HOUSE.overhang + .03], draw: roofGarland },
  { id: 'lantern', w: .3, h: .56, at: [LANTERN.x, HOUSE.ridge, LANTERN.z], hang: true, draw: lantern },
  { id: 'bookshelf', w: .55, h: 1.25, at: [-1.22, 0, -.9], draw: bookshelf },
  { id: 'fireplace', w: 1.05, h: 1.14, at: [FIRE.x, 0, -.92], draw: fireplace },
  { id: 'flames', w: .36, h: .28, at: [FIRE.x, .09, -.88], draw: flames, flame: true },
  { id: 'tree', w: .74, h: 1.36, at: [1.3, 0, .7], draw: tree },
  { id: 'tree-lights', w: .74, h: 1.36, at: [1.3, 0, .71], draw: treeLights, twinkle: true },
  { id: 'lamp-table', w: .5, h: .9, at: [-1.18, 0, .32], draw: lampTable },
  { id: 'chair-back', w: .82, h: 1.12, at: [0, 0, -.3], draw: chairBack, chair: true },
  { id: 'chair-left', w: .9, h: 1.0, at: [-.38, 0, -.04], turn: -Math.PI / 2, mirror: true, draw: chairSide, chair: true },
  { id: 'chair-right', w: .9, h: 1.0, at: [.38, 0, -.04], turn: Math.PI / 2, draw: chairSide, chair: true },
  { id: 'chair-front', w: .82, h: .44, at: [0, 0, .2], draw: chairFront, chair: true },
  { id: 'drifts', w: PLATFORM.rx * 2, h: .62, at: [0, PLATFORM.top - .26, PLATFORM.rz - .12], draw: drifts },
  { id: 'pine-left', w: 1.3, h: 2.3, at: [-2.75, PLATFORM.top, -1.35], draw: pineBoard },
  { id: 'pine-left-small', w: .9, h: 1.5, at: [-3.25, PLATFORM.top, -.5], draw: pineBoard },
  { id: 'pine-right', w: 1.2, h: 2.1, at: [2.8, PLATFORM.top, -1.25], draw: pineBoard },
  { id: 'mailbox', w: .55, h: 1.05, at: [2.35, PLATFORM.top, 1.15], draw: mailbox },
  { id: 'sleigh', w: 1.3, h: .8, at: [2.75, PLATFORM.top, -.05], turn: -.35, draw: sleigh },
];
export const SMOKE = { w: .55, h: .4, draw: smokePuff };
