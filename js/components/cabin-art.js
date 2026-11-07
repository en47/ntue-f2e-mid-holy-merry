// Santa's Cabin as a paper cottage: closed on every side, so from the snow it is a whole house, and the only way in is
// the front door. Every board is drawn here once, then stood up in 3D by cabin-scene.js. Units: 1 = Santa's seated height.
// Light comes from the upper left. It is Christmas morning: Santa is home from the night's deliveries.
import { holly, pine, shape } from './paper-art.js';
import { church, roofHouse, snowyFir, star } from './paper-props.js';
import { headingGlyphs } from '../data/heading-glyphs.js';

export const PX = 500;
// Inner floor from x -1.6 to 1.6 and z -1.5 to 1.5, walls 1.9 high, ridge at 3: deep enough to stand inside and look round.
// The roof is thicker than the walls: its front edge reads as a band of shingles, as on the reference cottage.
export const HOUSE = { width: 3.2, depth: 3, wall: 1.9, ridge: 3, thick: .1, roof: .2, eaves: .32, overhang: .15 };
HOUSE.slope = Math.hypot(HOUSE.width / 2, HOUSE.ridge - HOUSE.wall);
export const CHAIR = { x: -.45, z: .05 };
// The house stands on its foundation slab a little above the snow, which runs out to the hills.
export const GROUND = -.14;
// The reindeer waits by the sleigh on the right, turned toward where the visitor stands; the name sign hangs from an iron bracket at the front-left corner, over the mailbox.
export const REINDEER = { x: 2.9, z: 2.3, turn: -.3, height: 1.3 };
export const SIGN = { x: -2.7, top: 1.93, z: HOUSE.depth / 2 + HOUSE.thick, arm: 1.9 };
export const LANTERN = { x: .3, z: .05 };
// The fireplace on the back wall; its chimney rises out of the right slope of the roof.
const BACK = -HOUSE.depth / 2;
export const FIRE = { x: .88, z: BACK + .25 };
// The front door, cut through both faces of the front wall. It hangs on its left post and swings out into the snow, so it
// never sweeps across the camera walking through it (cabin-scene.js).
export const DOOR = { width: .66, height: 1.5, swing: 1.75, hinge: -.33, z: HOUSE.depth / 2 + HOUSE.thick / 2 };
// Where you stand once inside: a few steps in from the door, turned toward Santa in his chair.
export const INSIDE = { eye: [.45, 1.15, .9], heading: .78, pitch: .32 };
const CREAM = '#fbf3df', SNOW = '#fbf8f1', RED = '#a84a42', GREEN = '#4f7d68', DEEP_GREEN = '#3f6653', GOLD = '#e0b04f';
const WOOD = '#8f5a3c', WOOD_LIT = '#a86b47', TIMBER = '#6b4a33', PLASTER = '#f1e4c8';
// Stable "random" numbers, so every visit cuts the same cabin.
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
const clip = (svg, id, d) => { shape('path', { d }, shape('clipPath', { id }, shape('defs', {}, svg))); return `url(#${id})`; };
// The same, with the doorway left out, so the wall's paper is cut right through there.
const cutDoor = (svg, id, outline, centre, height) => {
  const w = DOOR.width * PX, x = centre - w / 2, y = height - DOOR.height * PX;
  shape('path', { d: `${outline}M${x} ${y}H${x + w}V${height}H${x}Z`, 'clip-rule': 'evenodd' }, shape('clipPath', { id }, shape('defs', {}, svg)));
  return `url(#${id})`;
};

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

// The front wall from the snow: lime plaster and timber like the sides, one lit window by the door, a woodpile with skis
// leaning on it on the other side (the window inside the room is on the same side as this one).
export function frontOutside({ plain, paper, svg }, { width, height }) {
  const cx = width / 2, eave = height - HOUSE.wall * PX, edge = eave + HOUSE.thick * PX * (HOUSE.ridge - HOUSE.wall) / (HOUSE.width / 2), base = height - 90;
  const wall = shape('g', { 'clip-path': cutDoor(svg, 'front-out', `M0 ${height}V${edge}L${cx} 0L${width} ${edge}V${height}Z`, cx, height) }, plain);
  plaster(wall, width, height, '#f5eddd');
  stones(wall, 0, base, width, 90);
  for (const x of [0, width - 40]) beam(wall, x, 0, 40, base);
  for (const x of [cx - 250, cx + 218]) beam(wall, x, eave, 32, base - eave);
  beam(wall, 0, eave - 20, width, 36);
  brace(wall, `M${cx} 130L${cx - 300} ${eave - 20}M${cx} 130L${cx + 300} ${eave - 20}`);
  // A lit round window high in the gable.
  shape('circle', { cx, cy: eave * .56, r: 82, fill: GREEN }, paper);
  shape('circle', { cx, cy: eave * .56, r: 62, fill: '#f6d98c' }, paper);
  shape('path', { d: `M${cx} ${eave * .56 - 62}V${eave * .56 + 62}M${cx - 62} ${eave * .56}H${cx + 62}`, stroke: GREEN, 'stroke-width': 10 }, paper);
  litWindow(paper, width - 485, eave + 110, 270, 250);
  woodpile(paper, 150, base, 360);
  // The door's frame, a holly swag over it and a lantern either side.
  const w = DOOR.width * PX, x = cx - w / 2, y = height - DOOR.height * PX;
  shape('path', { d: `M${x - 34} ${height}V${y - 34}H${x + w + 34}V${height}ZM${x} ${height}V${y}H${x + w}V${height}Z`, fill: WOOD, 'fill-rule': 'evenodd' }, paper);
  garland(paper, x - 50, x + w + 50, y - 50, 8);
  for (const lx of [x - 74, x + w + 74]) wallLantern(paper, lx, y + 70);
  for (const [from, to] of [[0, x - 40], [x + w + 40, width]]) shape('path', { d: `M${from} ${height}C${from + (to - from) * .2} ${height - 60} ${from + (to - from) * .6} ${height - 30} ${to} ${height - 40}V${height}Z`, fill: SNOW }, paper);
}
// The same wall from inside: the window onto the morning on one side of the door, coat pegs with a spare red coat on the other.
export function frontInside({ plain, paper, svg }, { width, height }) {
  const cx = width / 2, eave = height - HOUSE.wall * PX, rail = height - .42 * PX;
  const wall = shape('g', { 'clip-path': cutDoor(svg, 'front-in', `M0 ${height}V${eave}L${cx} 0L${width} ${eave}V${height}Z`, cx, height) }, plain);
  plaster(wall, width, height); wainscot(wall, width, height, rail);
  beam(wall, 0, eave - 22, width, 44); beam(wall, 0, 250, width, 34);
  brace(wall, `M${cx} 268L${cx - 250} ${eave - 20}M${cx} 268L${cx + 250} ${eave - 20}`);
  for (const x of [0, width - 40]) beam(wall, x, eave, 40, rail - eave);
  const oy = 405;
  shape('circle', { cx, cy: oy, r: 76, fill: GREEN }, paper);
  shape('circle', { cx, cy: oy, r: 58, fill: '#cfe3ee' }, paper);
  shape('path', { d: `M${cx - 58} ${oy + 16}C${cx - 20} ${oy} ${cx + 20} ${oy + 14} ${cx + 58} ${oy + 6}V${oy + 60}H${cx - 58}Z`, fill: SNOW }, paper);
  shape('path', { d: `M${cx} ${oy - 58}V${oy + 58}M${cx - 58} ${oy}H${cx + 58}`, stroke: GREEN, 'stroke-width': 9 }, paper);
  morningWindow(paper, svg, 175, eave + 110, 250, 250, 'front-window');
  const w = DOOR.width * PX, x = cx - w / 2, y = height - DOOR.height * PX;
  shape('path', { d: `M${x - 30} ${height}V${y - 30}H${x + w + 30}V${height}ZM${x} ${height}V${y}H${x + w}V${height}Z`, fill: WOOD_LIT, 'fill-rule': 'evenodd' }, paper);
  for (let i = 0; i < 5; i++) holly(paper, x - 20 + i * (w + 40) / 4, y - 34, .62);
  pictureFrame(paper, 470, eave + 150, 150, 120);
  holly(paper, 545, eave + 146, .6);
  coatPegs(paper, 1070, eave + 170, 390, height - 14);
}
function litWindow(parent, x, y, width, height) {
  for (const sx of [x - 58, x + width + 14]) shape('rect', { x: sx, y: y - 6, width: 44, height: height + 12, rx: 6, fill: GREEN }, parent);
  shape('rect', { x, y, width, height, fill: '#f6d98c' }, parent);
  shape('rect', { x: x + 16, y: y + 16, width: width - 32, height: height * .42, rx: 10, fill: '#fbe7b0' }, parent);
  for (const side of [0, 1]) {
    const edge = side ? x + width : x, dir = side ? -1 : 1;
    shape('path', { d: `M${edge} ${y}h${dir * width * .32}C${edge + dir * width * .2} ${y + height * .3} ${edge + dir * 40} ${y + height * .48} ${edge} ${y + height * .62}Z`, fill: CREAM }, parent);
    shape('circle', { cx: edge + dir * 18, cy: y + height * .5, r: 9, fill: RED }, parent);
  }
  shape('path', { d: `M${x + width / 2} ${y}V${y + height}M${x} ${y + height / 2}H${x + width}`, stroke: GREEN, 'stroke-width': 14 }, parent);
  shape('rect', { x: x - 8, y: y - 8, width: width + 16, height: height + 16, fill: 'none', stroke: GREEN, 'stroke-width': 16 }, parent);
  shape('path', { d: `M${x - 18} ${y - 10}C${x + width * .3} ${y - 34} ${x + width * .7} ${y - 22} ${x + width + 18} ${y - 12}V${y - 2}H${x - 18}Z`, fill: SNOW }, parent);
  shape('rect', { x: x - 26, y: y + height + 8, width: width + 52, height: 44, rx: 8, fill: WOOD }, parent);
  for (let i = 0; i < 4; i++) holly(parent, x + 20 + i * (width - 40) / 3, y + height + 10, .6);
}
function wallLantern(parent, x, y) {
  shape('path', { d: `M${x} ${y - 40}v-20h${x > 850 ? -26 : 26}`, stroke: '#3b302a', 'stroke-width': 7, fill: 'none' }, parent);
  shape('path', { d: `M${x - 26} ${y - 34}L${x} ${y - 58} ${x + 26} ${y - 34}Z`, fill: '#3b302a' }, parent);
  shape('rect', { x: x - 22, y: y - 36, width: 44, height: 60, rx: 6, fill: '#ffe3a0', stroke: '#3b302a', 'stroke-width': 6 }, parent);
  shape('path', { d: `M${x} ${y - 20}C${x + 8} ${y - 8} ${x + 6} ${y + 4} ${x} ${y + 6}C${x - 6} ${y + 4} ${x - 8} ${y - 8} ${x} ${y - 20}Z`, fill: '#f2a541' }, parent);
}
// Split logs stacked against the wall under a snowy plank, and a pair of skis propped beside them.
function woodpile(parent, x, base, width) {
  const rows = 4, r = 30;
  for (let row = 0; row < rows; row++) for (let col = 0; col * r * 2 < width - r * (row % 2); col++) {
    const cx = x + r + col * r * 2 + (row % 2) * r, cy = base - r - row * r * 1.75;
    shape('circle', { cx, cy, r, fill: ['#b98a5a', '#a8774d', '#c39466'][(row + col) % 3] }, parent);
    shape('circle', { cx, cy, r: r * .45, fill: 'none', stroke: '#8f6340', 'stroke-width': 3 }, parent);
  }
  const top = base - rows * r * 1.75 - 18;
  shape('rect', { x: x - 20, y: top - 18, width: width + 40, height: 22, rx: 6, fill: WOOD }, parent);
  shape('path', { d: `M${x - 24} ${top - 16}C${x + width * .3} ${top - 44} ${x + width * .7} ${top - 30} ${x + width + 24} ${top - 18}V${top - 8}H${x - 24}Z`, fill: SNOW }, parent);
  for (const [dx, fill] of [[width + 40, RED], [width + 70, RED]]) shape('path', { d: `M${x + dx} ${base}L${x + dx + 30} ${top - 120}C${x + dx + 34} ${top - 140} ${x + dx + 50} ${top - 140} ${x + dx + 46} ${top - 116}L${x + dx + 18} ${base}Z`, fill }, parent);
  shape('path', { d: `M${x + width + 30} ${base}L${x + width + 64} ${top - 70}M${x + width + 96} ${base}L${x + width + 80} ${top - 70}`, stroke: '#3b302a', 'stroke-width': 6 }, parent);
}
// A peg rail by the door: a spare red coat, a hat and a scarf, boots standing underneath.
function coatPegs(parent, x, y, width, floor) {
  shape('rect', { x, y, width, height: 26, rx: 8, fill: WOOD_LIT }, parent);
  for (const px of [x + 70, x + width / 2, x + width - 70]) shape('circle', { cx: px, cy: y + 13, r: 10, fill: WOOD }, parent);
  const cx = x + 70;
  shape('path', { d: `M${cx} ${y + 20}C${cx - 60} ${y + 30} ${cx - 80} ${y + 70} ${cx - 82} ${y + 330}H${cx + 82}C${cx + 80} ${y + 70} ${cx + 60} ${y + 30} ${cx} ${y + 20}Z`, fill: RED }, parent);
  shape('rect', { x: cx - 86, y: y + 310, width: 172, height: 34, rx: 16, fill: SNOW }, parent);
  shape('rect', { x: cx - 12, y: y + 40, width: 24, height: 290, rx: 10, fill: SNOW }, parent);
  shape('rect', { x: cx - 80, y: y + 180, width: 160, height: 26, fill: '#3b2a24' }, parent);
  shape('rect', { x: cx - 18, y: y + 176, width: 36, height: 34, rx: 4, fill: 'none', stroke: GOLD, 'stroke-width': 7 }, parent);
  const hx = x + width / 2;
  shape('path', { d: `M${hx - 50} ${y + 120}C${hx - 40} ${y + 60} ${hx + 20} ${y + 20} ${hx + 70} ${y + 70}L${hx + 50} ${y + 120}Z`, fill: RED }, parent);
  shape('rect', { x: hx - 58, y: y + 112, width: 116, height: 30, rx: 14, fill: SNOW }, parent);
  shape('circle', { cx: hx + 74, cy: y + 76, r: 18, fill: SNOW }, parent);
  const sx = x + width - 70;
  for (const [dx, len] of [[-14, 230], [14, 190]]) {
    shape('rect', { x: sx + dx - 14, y: y + 18, width: 28, height: len, rx: 8, fill: GREEN }, parent);
    for (let k = 1; k < 4; k++) shape('rect', { x: sx + dx - 14, y: y + 18 + len * k / 4, width: 28, height: 10, fill: CREAM }, parent);
  }
  for (const bx of [x + 110, x + 190]) {
    shape('path', { d: `M${bx} ${floor}V${floor - 120}h50V${floor - 30}h34c14 0 18 30 0 30Z`, fill: '#2f2622' }, parent);
    shape('rect', { x: bx - 6, y: floor - 132, width: 62, height: 22, rx: 10, fill: SNOW }, parent);
  }
}
// The door's two faces, back to back on one hinge. Seen from the snow the hinge is on the left; from inside, on the right.
export function doorOutside({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 12, fill: GREEN }, paper);
  for (let i = 1; i < 4; i++) shape('path', { d: `M${width * i / 4} 10V${height - 10}`, stroke: DEEP_GREEN, 'stroke-width': 6 }, paper);
  for (const y of [height * .16, height * .8]) shape('rect', { x: 0, y, width: width * .55, height: 18, rx: 6, fill: '#3b302a' }, paper);
  wreath(paper, width / 2, height * .34, 66);
  shape('circle', { cx: width - 42, cy: height * .56, r: 13, fill: GOLD }, paper);
  shape('rect', { x: width * .2, y: height * .66, width: width * .6, height: 14, rx: 6, fill: GOLD }, paper);
}
export function doorInside({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 12, fill: WOOD_LIT }, paper);
  for (let i = 1; i < 4; i++) shape('path', { d: `M${width * i / 4} 10V${height - 10}`, stroke: WOOD, 'stroke-width': 6 }, paper);
  shape('path', { d: `M20 ${height * .22}H${width - 20}M20 ${height * .78}H${width - 20}M${width - 30} ${height * .22}L30 ${height * .78}`, stroke: WOOD, 'stroke-width': 24, 'stroke-linecap': 'round' }, paper);
  for (const y of [height * .16, height * .8]) shape('rect', { x: width * .45, y, width: width * .55, height: 18, rx: 6, fill: '#3b302a' }, paper);
  shape('rect', { x: 26, y: height * .52, width: 18, height: 70, rx: 8, fill: '#3b302a' }, paper);
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
// On the roof: rows of dark paper shingles carrying only a thin line of snow at the ridge and a few drifts, so the roof keeps
// its dark outline against the pale morning sky. Art: left is the eave, right the ridge.
export function roofOutside({ plain, paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, fill: '#3f3531' }, plain);
  for (let x = 0, row = 0; x < width; x += 62, row++) {
    for (let y = -30 + (row % 2) * 34; y < height; y += 68) shape('rect', { x, y, width: 70, height: 64, rx: 26, fill: ['#5a4d47', '#4f4440', '#62544d'][(row + Math.round(y / 68)) % 3] }, plain);
  }
  shape('path', { d: `M${width} 0V${height}H${width - 46}C${width - 70} ${height * .75} ${width - 40} ${height * .5} ${width - 64} ${height * .3}S${width - 44} ${height * .08} ${width - 58} 0Z`, fill: SNOW }, paper);
  for (let i = 0; i < 4; i++) shape('ellipse', { cx: 260 + noise(i + 40) * (width - 520), cy: 80 + noise(i + 60) * (height - 160), rx: 34 + noise(i) * 30, ry: 16 + noise(i + 2) * 12, fill: SNOW, opacity: .9 }, paper);
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

// A snowy fir board (see snowyFir in paper-props.js); the art fills the board from the bottom edge.
export function fir(variant) {
  return ({ paper }, { width, height }) => snowyFir(paper, width / 2, height - 10, height - 26, variant, width / height);
}

// Distant snowy hills, paler and bluer the further away they are. Only soft rolling crests: at this distance a forest would
// flatten into streaks, so the trees are left to the few 3D firs nearby. Level 0 is nearest.
export function hills(level) {
  const snow = ['#f1f4f2', '#e6edef', '#dce5ec'][level], shade = ['#e3eaec', '#d8e2e8', '#cfdbe4'][level];
  return ({ paper }, { width, height }) => {
    // Both ends come down to the snow: turning round, a hill's end would otherwise stand up like a cut-out.
    const count = 15, points = Array.from({ length: count }, (_, i) => [i / (count - 1) * width, height - height * (.88 - noise(i * 5 + level * 13) * .55) * Math.min(1, i / 3, (count - 1 - i) / 3)]);
    let d = `M0 ${height}V${points[0][1]}`;
    for (let i = 1; i < points.length; i++) { const [x0, y0] = points[i - 1], [x1, y1] = points[i]; d += `C${x0 + (x1 - x0) * .5} ${y0} ${x0 + (x1 - x0) * .5} ${y1} ${x1} ${y1}`; }
    shape('path', { d: `${d}V${height}Z`, fill: snow }, paper);
    // The far side of each crest falls into a little shade, away from the sun on the left.
    for (let i = 1; i < points.length - 1; i++) {
      const [x, y] = points[i], [nx, ny] = points[i + 1];
      if (y > points[i - 1][1] || y > ny) continue;
      shape('path', { d: `M${x} ${y}C${x + (nx - x) * .4} ${y} ${x + (nx - x) * .6} ${ny} ${nx} ${ny}L${nx} ${height}H${x + (nx - x) * .2}C${x + (nx - x) * .25} ${y + (height - y) * .5} ${x + (nx - x) * .1} ${y + (height - y) * .2} ${x} ${y}Z`, fill: shade, opacity: .55 }, paper);
    }
  };
}

// The cabin's name board, hung by two ropes; the letters are the same paper glyphs as every page title.
export function nameSign({ paper }, { width, height }, state = {}) {
  // The board, and below it a little paper star on a string for each corner of the yard: one lights up for every corner of the yard you discover.
  const board = { x: 14, y: 54, w: width - 28, h: height - 70 - 96 };
  shape('path', { d: `M${width * .16} 0V${board.y + 6}M${width * .84} 0V${board.y + 6}`, stroke: '#4a3a30', 'stroke-width': 6 }, paper);
  shape('rect', { x: board.x, y: board.y, width: board.w, height: board.h, rx: 24, fill: WOOD }, paper);
  shape('rect', { x: board.x + 14, y: board.y + 14, width: board.w - 28, height: board.h - 28, rx: 14, fill: '#c39466' }, paper);
  shape('path', { d: `M${board.x + 16} ${board.y + board.h / 2}H${board.x + board.w - 16}`, stroke: '#ad7e52', 'stroke-width': 4 }, paper);
  shape('rect', { x: board.x + 24, y: board.y + 24, width: board.w - 48, height: board.h - 48, rx: 10, fill: 'none', stroke: CREAM, 'stroke-width': 4, 'stroke-dasharray': '14 10', opacity: .8 }, paper);
  shape('path', { d: `M${board.x - 4} ${board.y + 14}C${board.x + board.w * .2} ${board.y - 12} ${board.x + board.w * .45} ${board.y + 6} ${board.x + board.w * .6} ${board.y - 6}S${board.x + board.w} ${board.y + 4} ${board.x + board.w + 4} ${board.y + 16}C${board.x + board.w * .6} ${board.y + 10} ${board.x + board.w * .3} ${board.y + 18} ${board.x - 4} ${board.y + 14}Z`, fill: SNOW }, paper);
  const { box, glyphs } = headingGlyphs['santas-cabin'], [, , gw, gh] = box.split(' ').map(Number);
  const scale = Math.min((board.w - 70) / gw, (board.h - 46) / gh), ox = board.x + (board.w - gw * scale) / 2, oy = board.y + (board.h - gh * scale) / 2 + 4;
  const letters = shape('g', { transform: `translate(${ox} ${oy}) scale(${scale})` }, paper);
  glyphs.forEach(({ d }, index) => shape('path', { d, fill: [RED, '#b5604a', GREEN, RED, '#c08a3e'][index % 5], stroke: CREAM, 'stroke-width': 9, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, letters));
  holly(paper, board.x + 30, board.y + 20, .55);
  const lit = state.stars ?? 0, bottom = board.y + board.h;
  for (let i = 0; i < SPOTS.length; i++) {
    const x = board.x + board.w * (.5 + (i - (SPOTS.length - 1) / 2) * .17), drop = 26 + (i % 2) * 18;
    shape('path', { d: `M${x} ${bottom}V${bottom + drop}`, stroke: '#4a3a30', 'stroke-width': 3 }, paper);
    star(paper, x, bottom + drop + 22, 22, i < lit ? GOLD : '#efe4cc');
  }
}
export function fence({ paper }, { width, height }) {
  for (const x of [20, width / 2 - 12, width - 44]) {
    shape('rect', { x, y: 30, width: 24, height: height - 30, rx: 6, fill: '#8a6a55' }, paper);
    shape('ellipse', { cx: x + 12, cy: 30, rx: 18, ry: 9, fill: SNOW }, paper);
  }
  for (const y of [height * .35, height * .65]) {
    shape('rect', { x: 0, y, width, height: 18, rx: 8, fill: '#a8845f' }, paper);
    shape('path', { d: `M4 ${y + 2}C${width * .3} ${y - 12} ${width * .6} ${y - 4} ${width - 4} ${y - 8}V${y + 4}H4Z`, fill: SNOW }, paper);
  }
}
// Flat on the snow: a frozen pond, and a reindeer's hoofprints coming in from the woods.
export function pond({ paper }, { width, height }) {
  shape('ellipse', { cx: width / 2, cy: height / 2, rx: width / 2 - 6, ry: height / 2 - 6, fill: '#f4f7f8' }, paper);
  shape('ellipse', { cx: width / 2, cy: height / 2, rx: width / 2 - 40, ry: height / 2 - 34, fill: '#c9dfea' }, paper);
  for (const [dx, dy, w] of [[-.18, -.1, .3], [.12, .12, .22], [.2, -.16, .12]]) shape('rect', { x: width * (.5 + dx), y: height * (.5 + dy), width: width * w, height: 6, rx: 3, fill: '#eef6fa', transform: `rotate(-12 ${width / 2} ${height / 2})` }, paper);
}
export function hoofprints({ paper }, { width, height }) {
  for (let i = 0; i < 14; i++) {
    const t = i / 13, x = t * width, y = height / 2 + Math.sin(t * Math.PI * 1.4) * height * .22 + (i % 2 ? 22 : -22);
    for (const dx of [-7, 7]) shape('ellipse', { cx: x + dx, cy: y, rx: 6, ry: 10, fill: '#c5d4de', transform: `rotate(${80 + Math.cos(t * 4) * 20} ${x} ${y})` }, paper);
  }
}
// A few Christmas things around the yard, spaced well apart: the reindeer's red stable, a lamp-lit path to it, a snowman, a far village.
export function stable({ paper }, { width, height }, state = {}) {
  const ground = height - 8, eave = height * .5, peak = height * .14, cx = width / 2;
  shape('path', { d: `M${width * .12} ${ground}V${eave}L${cx} ${peak + 40}L${width * .88} ${eave}V${ground}Z`, fill: RED }, paper);
  for (let x = width * .16; x < width * .86; x += 34) shape('path', { d: `M${x} ${ground}V${eave + (Math.abs(x - cx) < width * .3 ? -(width * .3 - Math.abs(x - cx)) * .6 : 0)}`, stroke: '#87302f', 'stroke-width': 3, opacity: .5 }, paper);
  shape('path', { d: `M${width * .04} ${eave + 12}L${cx} ${peak}L${width * .96} ${eave + 12}L${width * .9} ${eave + 26}L${cx} ${peak + 22}L${width * .1} ${eave + 26}Z`, fill: '#4a3f3a' }, paper);
  shape('path', { d: `M${width * .04} ${eave + 12}L${cx} ${peak}L${width * .96} ${eave + 12}C${width * .8} ${eave - 8} ${width * .65} ${peak + 30} ${cx} ${peak + 18}C${width * .35} ${peak + 30} ${width * .2} ${eave - 8} ${width * .04} ${eave + 12}Z`, fill: SNOW }, paper);
  const door = { x: cx - width * .17, y: eave + 40, w: width * .34 };
  shape('rect', { x: door.x, y: door.y, width: door.w, height: ground - door.y, fill: '#7a3430' }, paper);
  shape('path', { d: `M${door.x} ${door.y}L${door.x + door.w} ${ground}M${door.x + door.w} ${door.y}L${door.x} ${ground}`, stroke: CREAM, 'stroke-width': 10 }, paper);
  shape('rect', { x: door.x - 8, y: door.y - 8, width: door.w + 16, height: ground - door.y + 8, fill: 'none', stroke: CREAM, 'stroke-width': 12 }, paper);
  wreath(paper, cx, door.y - 30, 30);
  // The hayloft under the gable: open and dark until bales are stacked in it.
  const loft = { x: cx - 74, y: peak + 70, w: 148, h: 104 }, bales = state.hay ?? 0;
  shape('rect', { x: loft.x - 10, y: loft.y - 10, width: loft.w + 20, height: loft.h + 14, fill: CREAM }, paper);
  shape('rect', { x: loft.x, y: loft.y, width: loft.w, height: loft.h, fill: '#4a2422' }, paper);
  for (let i = 0; i < bales; i++) {
    const x = loft.x + 8 + (i % 2) * 70, y = loft.y + loft.h - 48 - Math.floor(i / 2) * 46;
    shape('rect', { x, y, width: 64, height: 42, rx: 12, fill: '#d9b36a' }, paper);
    shape('path', { d: `M${x + 6} ${y + 14}h52M${x + 6} ${y + 28}h52`, stroke: '#b98f48', 'stroke-width': 4 }, paper);
  }
}
export function snowman({ paper }, { width, height }) {
  // Only the snowman himself: what he wears is laid over him in four places by the wardrobe game (cabin-wardrobe.js).
  const cx = width / 2, ground = height - 8, ball = (cy, r) => { shape('circle', { cx, cy, r, fill: SNOW }, paper); shape('path', { d: `M${cx + r * .3} ${cy - r * .95}A${r} ${r} 0 0 1 ${cx + r * .3} ${cy + r * .95}A${r * 1.3} ${r * 1.3} 0 0 0 ${cx + r * .3} ${cy - r * .95}Z`, fill: '#d9e5ec' }, paper); };
  const r1 = width * .36, r2 = width * .27, r3 = width * .2, y1 = ground - r1, y2 = y1 - r1 - r2 * .7, y3 = y2 - r2 - r3 * .7;
  for (const side of [-1, 1]) shape('path', { d: `M${cx + side * r2 * .8} ${y2}l${side * width * .28} ${-height * .1}m${-side * width * .1} ${height * .04}l${side * width * .06} ${-height * .05}`, stroke: '#6b4a33', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, paper);
  ball(y1, r1); ball(y2, r2); ball(y3, r3);
  for (const dx of [-.35, .3]) shape('circle', { cx: cx + r3 * dx, cy: y3 - r3 * .3, r: r3 * .1, fill: '#3b2a24' }, paper);
  for (const dy of [-.45, 0, .45]) shape('circle', { cx, cy: y1 + r1 * dy - r1 * .1, r: r1 * .08, fill: '#3b2a24' }, paper);
}
export function lampPost({ paper }, { width, height }) {
  const cx = width / 2, ground = height - 6, head = 70;
  shape('rect', { x: cx - 9, y: head + 70, width: 18, height: ground - head - 70, fill: DEEP_GREEN }, paper);
  shape('path', { d: `M${cx - 30} ${ground}h60l-12-34h-36Z`, fill: DEEP_GREEN }, paper);
  shape('path', { d: `M${cx - 40} ${head + 70}L${cx - 30} ${head}H${cx + 30}L${cx + 40} ${head + 70}Z`, fill: '#ffe3a0' }, paper);
  shape('path', { d: `M${cx - 40} ${head + 70}L${cx - 30} ${head}H${cx + 30}L${cx + 40} ${head + 70}ZM${cx} ${head}V${head + 70}`, stroke: DEEP_GREEN, 'stroke-width': 7, fill: 'none' }, paper);
  shape('path', { d: `M${cx - 44} ${head}L${cx} ${head - 40}L${cx + 44} ${head}Z`, fill: DEEP_GREEN }, paper);
  shape('path', { d: `M${cx - 46} ${head - 2}C${cx - 30} ${head - 30} ${cx + 30} ${head - 30} ${cx + 46} ${head - 2}C${cx + 20} ${head - 14} ${cx - 20} ${head - 14} ${cx - 46} ${head - 2}Z`, fill: SNOW }, paper);
  for (let y = head + 110; y < ground - 60; y += 70) shape('path', { d: `M${cx - 18} ${y}C${cx} ${y - 22} ${cx + 18} ${y + 10} ${cx + 18} ${y + 30}`, stroke: GREEN, 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M${cx} ${head + 104}c-26-22-44-4-26 10 10 8 22 2 26-10zm0 0c26-22 44-4 26 10-10 8-22 2-26-10z`, fill: RED }, paper);
}
export function candyCane({ paper }, { width, height }) {
  const cx = width / 2 + 6, ground = height - 4, top = 40;
  shape('path', { d: `M${cx} ${ground}V${top + 26}C${cx} ${top - 22} ${cx - 56} ${top - 22} ${cx - 56} ${top + 18}`, stroke: CREAM, 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M${cx} ${ground}V${top + 26}C${cx} ${top - 22} ${cx - 56} ${top - 22} ${cx - 56} ${top + 18}`, stroke: RED, 'stroke-width': 22, fill: 'none', 'stroke-dasharray': '14 18' }, paper);
}
// Santa's toy workshop, long and low, every window lit: the elves are already making next year's toys.
export function workshop({ paper }, { width, height }) {
  const ground = height - 6, eave = height * .42;
  shape('rect', { x: width * .04, y: eave, width: width * .92, height: ground - eave, fill: '#b5544c' }, paper);
  shape('path', { d: `M0 ${eave + 10}L${width * .14} ${height * .12}H${width * .86}L${width} ${eave + 10}Z`, fill: '#4a3f3a' }, paper);
  shape('path', { d: `M0 ${eave + 10}L${width * .14} ${height * .12}H${width * .86}L${width} ${eave + 10}C${width * .8} ${eave - 20} ${width * .3} ${eave - 6} 0 ${eave + 10}Z`, fill: SNOW }, paper);
  for (const x of [.24, .7]) shape('rect', { x: width * x, y: height * .02, width: width * .05, height: height * .14, fill: '#8f6f5b' }, paper);
  for (let i = 0; i < 6; i++) { if (i === 3) continue; const x = width * (.1 + i * .14); shape('rect', { x, y: eave + 30, width: width * .08, height: height * .2, rx: 6, fill: '#f4cf74' }, paper); shape('path', { d: `M${x + width * .04} ${eave + 30}v${height * .2}`, stroke: '#87302f', 'stroke-width': 4 }, paper); }
  shape('path', { d: `M${width * .47} ${ground}V${eave + 40}C${width * .47} ${eave + 10} ${width * .6} ${eave + 10} ${width * .6} ${eave + 40}V${ground}Z`, fill: GREEN }, paper);
  for (const x of [.455, .615]) shape('rect', { x: width * x - 6, y: eave + 20, width: 12, height: ground - eave - 20, fill: CREAM }, paper);
  wreath(paper, width * .535, eave + 50, 26);
}
// A Christmas tree out in the snow, hung with lights and a star.
export function yardTree({ paper }, { width, height }) {
  snowyFir(paper, width / 2, height - 10, height - 60, 1, .55);
  for (let i = 0; i < 18; i++) { const t = noise(i + 3), y = 90 + t * (height - 220), half = (y - 40) / height * width * .3; shape('circle', { cx: width / 2 + (noise(i + 9) * 2 - 1) * half, cy: y, r: 8, fill: ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec'][i % 4] }, paper); }
  star(paper, width / 2, 40, 34, GOLD);
  for (const [x, w, fill] of [[.22, 70, RED], [.55, 90, GREEN], [.78, 60, '#8aa9ad']]) shape('rect', { x: width * x - w / 2, y: height - 10 - w * .7, width: w, height: w * .7, rx: 6, fill }, paper);
}
export function bench({ paper }, { width, height }) {
  shape('rect', { x: 10, y: height * .42, width: width - 20, height: 22, rx: 8, fill: WOOD_LIT }, paper);
  shape('rect', { x: 10, y: height * .22, width: width - 20, height: 18, rx: 8, fill: WOOD_LIT }, paper);
  for (const x of [40, width - 64]) shape('rect', { x, y: height * .2, width: 24, height: height * .8, fill: WOOD }, paper);
  shape('path', { d: `M14 ${height * .42}C${width * .3} ${height * .36} ${width * .7} ${height * .38} ${width - 14} ${height * .42}V${height * .46}H14Z`, fill: SNOW }, paper);
  for (const x of [width * .3, width * .44]) { shape('path', { d: `M${x} ${height * .42}v-46h30l14 46Z`, fill: CREAM }, paper); shape('path', { d: `M${x - 6} ${height * .42}h56`, stroke: '#9aa7ad', 'stroke-width': 5 }, paper); }
  shape('rect', { x: width * .7, y: height * .42 - 60, width: 40, height: 56, rx: 8, fill: '#ffe3a0', stroke: DEEP_GREEN, 'stroke-width': 6 }, paper);
}
export function birdFeeder({ paper }, { width, height }) {
  const cx = width / 2;
  shape('rect', { x: cx - 8, y: height * .3, width: 16, height: height * .7, fill: WOOD }, paper);
  shape('path', { d: `M${cx - 70} ${height * .3}L${cx} ${height * .16}L${cx + 70} ${height * .3}Z`, fill: RED }, paper);
  shape('path', { d: `M${cx - 74} ${height * .3}L${cx} ${height * .14}L${cx + 74} ${height * .3}C${cx + 30} ${height * .22} ${cx - 30} ${height * .22} ${cx - 74} ${height * .3}Z`, fill: SNOW }, paper);
  shape('rect', { x: cx - 60, y: height * .3, width: 120, height: 14, fill: WOOD_LIT }, paper);
  for (const [x, flip] of [[cx - 40, 1], [cx + 34, -1]]) {
    const y = height * .3 - 8;
    shape('ellipse', { cx: x, cy: y - 14, rx: 20, ry: 16, fill: '#8a6a55' }, paper);
    shape('ellipse', { cx: x + flip * 4, cy: y - 10, rx: 12, ry: 10, fill: '#d9614f' }, paper);
    shape('circle', { cx: x + flip * 14, cy: y - 26, r: 10, fill: '#8a6a55' }, paper);
    shape('circle', { cx: x + flip * 17, cy: y - 28, r: 2.4, fill: '#2b1d16' }, paper);
    shape('path', { d: `M${x + flip * 23} ${y - 27}l${flip * 8} 2l${-flip * 8} 3Z`, fill: GOLD }, paper);
  }
}
export function toyCrates({ paper }, { width, height }) {
  const crate = (x, y, w, h) => { shape('rect', { x, y, width: w, height: h, rx: 6, fill: '#c39466' }, paper); shape('path', { d: `M${x} ${y + h / 2}h${w}M${x + w / 2} ${y}v${h}`, stroke: '#a8774d', 'stroke-width': 6 }, paper); shape('path', { d: `M${x + 4} ${y + 4}C${x + w * .4} ${y - 8} ${x + w * .7} ${y + 2} ${x + w - 4} ${y + 2}V${y + 10}H${x + 4}Z`, fill: SNOW }, paper); };
  crate(20, height * .45, width * .36, height * .52); crate(width * .4, height * .58, width * .3, height * .4); crate(width * .1, height * .12, width * .3, height * .34);
  shape('circle', { cx: width * .78, cy: height * .62, r: height * .14, fill: '#a8774d' }, paper);
  shape('circle', { cx: width * .78, cy: height * .44, r: height * .1, fill: '#a8774d' }, paper);
  for (const side of [-1, 1]) shape('circle', { cx: width * .78 + side * height * .08, cy: height * .36, r: height * .04, fill: '#a8774d' }, paper);
  shape('rect', { x: width * .7, y: height * .8, width: width * .26, height: height * .17, rx: 4, fill: RED }, paper);
  shape('rect', { x: width * .82, y: height * .8, width: 10, height: height * .17, fill: GOLD }, paper);
}
// The North Pole Post Office, where letters to Santa arrive: sacks of mail piled at the door.
export function postOffice({ paper }, { width, height }) {
  const ground = height - 6, eave = height * .45, cx = width / 2;
  shape('rect', { x: width * .1, y: eave, width: width * .8, height: ground - eave, fill: '#e9d9b8' }, paper);
  shape('path', { d: `M${width * .02} ${eave + 8}L${cx} ${height * .08}L${width * .98} ${eave + 8}Z`, fill: '#3f6653' }, paper);
  shape('path', { d: `M${width * .02} ${eave + 8}L${cx} ${height * .08}L${width * .98} ${eave + 8}C${width * .7} ${eave - 20} ${width * .3} ${eave - 20} ${width * .02} ${eave + 8}Z`, fill: SNOW }, paper);
  shape('rect', { x: cx - width * .12, y: eave + 40, width: width * .24, height: ground - eave - 40, fill: RED }, paper);
  for (const x of [.18, .66]) shape('rect', { x: width * x, y: eave + 40, width: width * .16, height: height * .16, rx: 4, fill: '#f4cf74' }, paper);
  shape('rect', { x: cx - width * .2, y: eave + 4, width: width * .4, height: 30, rx: 6, fill: '#8f5a3c' }, paper);
  shape('path', { d: `M${cx - 28} ${eave + 10}h56v18h-56Zm0 0l28 10 28-10`, stroke: CREAM, 'stroke-width': 4, fill: 'none' }, paper);
  for (const [x, w] of [[.06, .16], [.2, .13], [.8, .15]]) { shape('path', { d: `M${width * x} ${ground}C${width * x} ${ground - width * w} ${width * (x + w)} ${ground - width * w} ${width * (x + w)} ${ground}Z`, fill: '#d9c3a0' }, paper); shape('rect', { x: width * (x + w * .35), y: ground - width * w * .7, width: width * w * .3, height: 8, fill: RED }, paper); }
}
// A distant village on the far side of the snow: a few lit cottages and a church, softened by the morning haze.
export function village({ paper }, { width, height }) {
  const ground = height - 4;
  for (const [x, w, h, roof] of [[.12, 70, 50, '#a8564c'], [.26, 60, 44, '#7a8f99'], [.62, 66, 46, '#a8564c'], [.78, 56, 40, '#8a6a55'], [.9, 62, 48, '#7a8f99']]) roofHouse(paper, width * x, ground, w, h, { wall: '#ecdcc0', roof });
  church(paper, width * .4, ground);
  shape('path', { d: `M0 ${ground}C${width * .3} ${ground - 10} ${width * .7} ${ground - 4} ${width} ${ground - 8}V${height}H0Z`, fill: SNOW }, paper);
}
// The trodden path from the yard back to the stable, a little bluer where feet have packed the snow.
export function path({ paper }, { width, height }) {
  const d = `M0 ${height * .55}C${width * .25} ${height * .3} ${width * .5} ${height * .75} ${width * .75} ${height * .45}S${width} ${height * .4} ${width} ${height * .5}`;
  shape('path', { d, stroke: '#dbe5ec', 'stroke-width': height * .5, fill: 'none', 'stroke-linecap': 'round' }, paper);
  shape('path', { d, stroke: '#cfdbe4', 'stroke-width': height * .22, fill: 'none', 'stroke-linecap': 'round', opacity: .7 }, paper);
}

// Snow drifted against the house's foundation, outside the cut.
export function drift({ paper }, { width, height }) {
  shape('path', { d: `M0 ${height}C${width * .1} ${height * .3} ${width * .6} ${height * .1} ${width} ${height * .7}V${height}Z`, fill: SNOW }, paper);
  shape('path', { d: `M${width * .55} ${height * .2}C${width * .8} ${height * .3} ${width * .95} ${height * .6} ${width} ${height * .7}V${height}H${width * .7}C${width * .75} ${height * .6} ${width * .7} ${height * .35} ${width * .55} ${height * .2}Z`, fill: '#dbe5ec' }, paper);
}
export function mailbox({ paper }, { width, height }, state = {}) {
  // The flag stands up while a letter from Santa waits inside; opening the box lowers it.
  const cx = width / 2;
  shape('rect', { x: cx - 14, y: 230, width: 28, height: height - 230, fill: WOOD }, paper);
  shape('path', { d: `M${cx - 110} 240V140C${cx - 110} 80 ${cx + 110} 80 ${cx + 110} 140V240Z`, fill: RED }, paper);
  if (state.open) {
    shape('path', { d: `M${cx - 96} 236V150C${cx - 96} 104 ${cx + 96} 104 ${cx + 96} 150V236Z`, fill: '#4a2422' }, paper);
    shape('path', { d: `M${cx - 110} 240L${cx - 150} 300H${cx + 70}L${cx + 110} 240Z`, fill: '#87302f' }, paper);
  } else shape('path', { d: `M${cx - 110} 140C${cx - 110} 80 ${cx + 110} 80 ${cx + 110} 140`, stroke: '#87302f', 'stroke-width': 10, fill: 'none' }, paper);
  shape('path', { d: `M${cx - 120} 110C${cx - 80} 60 ${cx + 80} 60 ${cx + 120} 110C${cx + 60} 96 ${cx - 60} 96 ${cx - 120} 110Z`, fill: SNOW }, paper);
  if (state.open) { shape('rect', { x: cx + 96, y: 150, width: 14, height: 80, fill: GOLD }, paper); shape('rect', { x: cx + 96, y: 210, width: 50, height: 20, fill: GOLD }, paper); }
  else { shape('rect', { x: cx + 96, y: 80, width: 14, height: 150, fill: GOLD }, paper); shape('rect', { x: cx + 96, y: 80, width: 50, height: 26, fill: GOLD }, paper); star(paper, cx, 190, 28, GOLD); }
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
  wall('back', HOUSE.width, HOUSE.ridge, [0, 0, BACK], { draw: backWall, room: true }),
  wall('left', HOUSE.depth, HOUSE.wall, [-HOUSE.width / 2, 0, 0], { turn: Math.PI / 2, draw: sideWall('left'), room: true }),
  wall('right', HOUSE.depth, HOUSE.wall, [HOUSE.width / 2, 0, 0], { turn: -Math.PI / 2, draw: sideWall('right'), room: true }),
  wall('front-in', HOUSE.width, HOUSE.ridge, [0, 0, HOUSE.depth / 2], { turn: Math.PI, draw: frontInside, room: true }),
  wall('left-out', HOUSE.depth, HOUSE.wall, [-HOUSE.width / 2 - HOUSE.thick, 0, 0], { turn: -Math.PI / 2, draw: outerWall }),
  wall('right-out', HOUSE.depth, HOUSE.wall, [HOUSE.width / 2 + HOUSE.thick, 0, 0], { turn: Math.PI / 2, draw: outerWall }),
  wall('front-out', HOUSE.width + HOUSE.thick * 2, HOUSE.ridge, [0, 0, HOUSE.depth / 2 + HOUSE.thick], { draw: frontOutside }),
  // The door's faces hang on the door rig (its hinge), not on the house.
  { id: 'door-out', w: DOOR.width, h: DOOR.height, at: [DOOR.width / 2, 0, .012], rig: 'door', kind: 'wall', draw: doorOutside },
  { id: 'door-in', w: DOOR.width, h: DOOR.height, at: [DOOR.width / 2, 0, -.012], turn: Math.PI, rig: 'door', kind: 'wall', draw: doorInside },
  { id: 'floor', w: HOUSE.width, h: HOUSE.depth, at: [0, 0, 0], flat: 'floor', draw: floor, kind: 'floor', room: true },
  { id: 'roof-in-left', roof: 'left', layer: 'inner', w: HOUSE.slope, h: HOUSE.depth, draw: roofInside, kind: 'floor', room: true },
  { id: 'roof-in-right', roof: 'right', layer: 'inner', w: HOUSE.slope, h: HOUSE.depth, draw: roofInside, kind: 'floor', room: true },
  { id: 'roof-out-left', roof: 'left', layer: 'outer', w: HOUSE.slope + HOUSE.eaves, h: HOUSE.depth + HOUSE.overhang * 2, draw: roofOutside, kind: 'floor' },
  { id: 'roof-out-right', roof: 'right', layer: 'outer', w: HOUSE.slope + HOUSE.eaves, h: HOUSE.depth + HOUSE.overhang * 2, draw: roofOutside, kind: 'floor' },
  { id: 'garland', w: HOUSE.width + HOUSE.eaves * 2.6, h: 1.42, at: [0, HOUSE.wall - .26, HOUSE.depth / 2 + HOUSE.overhang + .03], draw: roofGarland },
  { id: 'lantern', w: .3, h: .56, at: [LANTERN.x, HOUSE.ridge, LANTERN.z], hang: true, draw: lantern, room: true },
  { id: 'bookshelf', w: .55, h: 1.25, at: [-1.22, 0, BACK + .1], draw: bookshelf, room: true },
  { id: 'fireplace', w: 1.05, h: 1.14, at: [FIRE.x, 0, BACK + .08], draw: fireplace, room: true },
  { id: 'flames', w: .36, h: .28, at: [FIRE.x, .09, BACK + .12], draw: flames, flame: true, room: true },
  // Free-standing in the room, so they turn to face you wherever you stand: from the side they would be a sliver of paper.
  { id: 'tree', w: .74, h: 1.36, at: [1.25, 0, .55], draw: tree, room: true, billboard: true },
  { id: 'tree-lights', w: .74, h: 1.36, at: [1.25, 0, .55], draw: treeLights, twinkle: true, room: true, billboard: true, nudge: .01 },
  { id: 'lamp-table', w: .5, h: .9, at: [-1.18, 0, .32], draw: lampTable, room: true, billboard: true },
  { id: 'chair-back', w: .82, h: 1.12, at: [0, 0, -.3], draw: chairBack, chair: true },
  { id: 'chair-left', w: .9, h: 1.0, at: [-.38, 0, -.04], turn: -Math.PI / 2, mirror: true, draw: chairSide, chair: true },
  { id: 'chair-right', w: .9, h: 1.0, at: [.38, 0, -.04], turn: Math.PI / 2, draw: chairSide, chair: true },
  { id: 'chair-front', w: .82, h: .44, at: [0, 0, .2], draw: chairFront, chair: true },
  { id: 'hills-far', w: 150, h: 6.5, px: 14, at: [0, GROUND, -46], draw: hills(2), kind: 'scenery' },
  { id: 'hills-mid', w: 110, h: 4.4, px: 18, at: [0, GROUND, -30], draw: hills(1), kind: 'scenery' },
  { id: 'hills-near', w: 80, h: 2.8, px: 22, at: [0, GROUND, -19], draw: hills(0), kind: 'scenery' },
  // Firs: one board per variant, planted at each [x, z, height]. Each tree turns to face the camera, so its outline stays clean from any side.
  // The second half of each list stands around the fair, the wishing corner and the coast (cabin-world.js).
  { id: 'fir-a', w: 1, h: 2, draw: fir(0), copies: [[-3.9, -3.2, 3.1], [4.4, -3.6, 3.3], [-11, -11, 4.2], [-20.5, -5.5, 4.6], [-23, 7, 5], [-6.9, 10.6, 2.3], [9.6, 1.4, 3.2]] },
  { id: 'fir-b', w: 1, h: 2, draw: fir(1), copies: [[-5.1, -4.4, 2.4], [12, -14, 4.4], [-4.6, -10, 4.6], [-13.4, -4.4, 3.6], [-16.5, 13.5, 4.2], [8.4, 14.5, 3.4]] },
  { id: 'fir-c', w: 1, h: 2, draw: fir(2), copies: [[3.2, -4.9, 2.2], [-6.6, -2.2, 2], [9, -7, 3], [-7.6, -.6, 2.4], [-19.5, 15, 4.6], [6.8, 6.2, 2.4]] },
  { id: 'sign', w: 1.8, h: 1.12, at: [SIGN.x, SIGN.top, SIGN.z], hang: true, sway: true, draw: nameSign, state: { stars: 0 } },
  { id: 'mailbox', w: .5, h: .95, at: [SIGN.x, GROUND, SIGN.z + .45], draw: mailbox, state: {} },
  { id: 'sleigh', w: 1.3, h: .8, at: [3.15, GROUND, -.2], turn: -.35, draw: sleigh },
  { id: 'fence', w: 2.4, h: .7, at: [-5, GROUND, -2.5], turn: .3, draw: fence },
  { id: 'pond', w: 3.6, h: 1.8, at: [-5.6, GROUND, -4.6], flat: 'ground', draw: pond },
  { id: 'hoofprints', w: 4.4, h: 1.2, at: [4.2, GROUND, -.6], flat: 'ground', turn: .5, draw: hoofprints },
  { id: 'stable', w: 3.4, h: 2.7, at: [7.4, GROUND, -7], turn: -.45, draw: stable, state: { hay: 0 } },
  { id: 'path', w: 10, h: 1.6, at: [5.2, GROUND, -2.4], flat: 'ground', turn: -1.05, draw: path },
  { id: 'lamp-near', w: .55, h: 2.2, at: [4.1, GROUND, -1.2], turn: -.4, draw: lampPost },
  { id: 'lamp-far', w: .55, h: 2.2, at: [5.3, GROUND, -4.9], turn: -.45, draw: lampPost },
  { id: 'cane-near', w: .3, h: .95, at: [5, GROUND, -3], turn: -.4, draw: candyCane },
  { id: 'cane-far', w: .3, h: .95, at: [5.9, GROUND, -6.1], turn: -.45, draw: candyCane },
  { id: 'snowman', w: .9, h: 1.4, at: [-5.4, GROUND, -1.2], turn: .35, draw: snowman },
  { id: 'workshop', w: 5.2, h: 3.2, at: [-8.4, GROUND, -13.5], turn: .35, draw: workshop },
  { id: 'yard-tree', w: 1.4, h: 2.8, at: [-9.6, GROUND, -6.8], turn: .4, draw: yardTree },
  { id: 'bench', w: 1.4, h: .9, at: [-7.6, GROUND, -3.4], turn: .5, draw: bench },
  { id: 'bird-feeder', w: .55, h: 1.5, at: [-3.4, GROUND, -1.7], draw: birdFeeder },
  { id: 'toy-crates', w: 1.7, h: 1.1, at: [5.4, GROUND, -6.2], turn: -.4, draw: toyCrates },
  { id: 'corral', w: 2.4, h: .7, at: [9.6, GROUND, -5.4], turn: -1.15, draw: fence },
  { id: 'post-office', w: 3.6, h: 2.6, at: [11.2, GROUND, -11.5], turn: -.55, draw: postOffice },
  { id: 'village', w: 13, h: 2.4, px: 60, at: [-8, GROUND, -24], draw: village, kind: 'scenery' },
  { id: 'drift-left', w: .9, h: .34, at: [-2.05, GROUND, HOUSE.depth / 2 + .05], draw: drift },
  { id: 'drift-right', w: .9, h: .34, at: [2.05, GROUND, HOUSE.depth / 2 + .05], mirror: true, draw: drift },
];
export const SMOKE = { w: .55, h: .4, draw: smokePuff };

// The corners of the yard you can step up to. `box` is the tap target [centre, size]; `view` is where the camera goes.
export const SPOTS = [
  { id: 'mailbox', name: '郵筒', box: [[SIGN.x, .45, SIGN.z + .45], [.8, 1.1, .6]], view: { target: [SIGN.x, .75, SIGN.z + .45], distance: 3, pitch: .1, yaw: .28 } },
  { id: 'reindeer', name: '麋鹿', box: [[REINDEER.x, .55, REINDEER.z], [1.3, 1.4, 1.2]], view: { target: [REINDEER.x, .62, REINDEER.z], distance: 3.4, pitch: .1, yaw: -.12 } },
  { id: 'snowman', name: '雪人', box: [[-5.4, .55, -1.2], [1.1, 1.5, .8]], view: { target: [-5.4, .82, -1.2], distance: 3.5, pitch: .06, yaw: .32, aside: .42, tallDrop: .5, tallDistance: 5.6 } },
  { id: 'stable', name: '馴鹿小屋', box: [[7.4, 1.2, -7], [3.6, 2.8, 1.4]], view: { target: [7.2, 1.25, -6.8], distance: 6, pitch: .1, yaw: -.38 } },
];

// Things in the room that answer a tap with a line of their own. `box` is the tap target [centre, size]; the door takes you out.
export const ROOM_PROPS = [
  { id: 'santa', name: '聖誕老人', note: '聖誕老人朝你點點頭：「外面很冷吧？在火爐邊暖暖身子。」' },
  { id: 'door', name: '大門', box: [[0, DOOR.height / 2, DOOR.z], [DOOR.width, DOOR.height, .3]] },
  { id: 'back-door', name: '後門', box: [[0, .62, BACK + .05], [.5, 1.24, .12]], note: '後門通往後院的玩具工坊，明年的禮物已經開始做了。' },
  { id: 'bookshelf', name: '書架', box: [[-1.22, .62, BACK + .15], [.6, 1.25, .3]], note: '書架上排滿了一年又一年的送禮紀錄。' },
  { id: 'fireplace', name: '壁爐', box: [[FIRE.x, .57, BACK + .15], [1.05, 1.14, .3]], note: '壁爐的火劈啪作響，架上掛著三隻襪子。' },
  { id: 'tree', name: '聖誕樹', box: [[1.25, .68, .55], [.8, 1.36, .8]], note: '屋裡的聖誕樹掛著彩燈，一閃一閃。' },
  { id: 'lamp-table', name: '小桌', box: [[-1.18, .45, .32], [.6, .9, .6]], note: '小桌上還留著昨晚的餅乾和牛奶。' },
  { id: 'window', name: '窗台', box: [[-1.55, 1.12, .08], [.15, .75, .75]], note: '窗台上的降臨小屋，十二月每過一天就多亮一扇窗。' },
  { id: 'coat', name: '掛衣架', box: [[-.9, 1.05, HOUSE.depth / 2 - .08], [.85, 1, .2]], note: '門邊掛著一件紅外套、帽子和圍巾，靴子還沾著雪。' },
];
