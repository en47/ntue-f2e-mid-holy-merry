// Santa's Cabin as a paper cottage: closed on every side, so from the snow it is a whole house, and the only way in is
// the front door. Every board is drawn here once, then stood up in 3D by cabin-scene.js. Units: 1 = Santa's seated height.
// Light comes from the upper left. It is Christmas morning: Santa is home from the night's deliveries.
import { holly, pine, shape } from './paper-art.js';
import { ADVENT_WINDOWS, adventHouse as adventHouseSheet, swag, calendar, candleFlame, candles, cookieJar, doorWreath, framedReindeer, framedSleigh, snowflakeBunting, windowFrame, windowLights, windowView } from './cabin-decor.js';
import { church, roofHouse, snowyFir, star } from './paper-props.js';
import { headingGlyphs } from '../data/heading-glyphs.js';
import { cabinGlyphs } from '../data/cabin-glyphs.js';

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
export const SIGN = { x: -2.8, top: 2.13, z: HOUSE.depth / 2 + HOUSE.thick, arm: 2.2 };
export const LANTERN = { x: .3, z: .05 };
// The fireplace on the back wall; its chimney rises out of the right slope of the roof.
const BACK = -HOUSE.depth / 2;
export const FIRE = { x: .88, z: BACK + .25 };
// The front door, cut through both faces of the front wall. It hangs on its left post and swings out into the snow, so it
// never sweeps across the camera walking through it (cabin-scene.js).
export const DOOR = { width: .66, height: 1.5, swing: 1.75, hinge: -.33, z: HOUSE.depth / 2 + HOUSE.thick / 2 };
// Where you stand once inside: a few steps in from the door, turned toward Santa in his chair. On a wide screen the view
// turns a little right of him, so he sits on the left and the letter-paper chat (santa.html) has the right; on a tall
// phone he is centred and looked down on a little, above the chat sheet along the bottom.
export const INSIDE = { eye: [.45, 1.15, .9], heading: .44, tallHeading: .78, pitch: .27, tallPitch: .46 };
// The bookcase on the back wall, left of the back door: `left` is its hinge edge (it can swing open on it), `z` its painted
// back. Books stand on wooden shelves whose tops are at `shelves` (metres up from the floor).
export const BOOKCASE = { left: -1.47, width: .95, height: 1.4, depth: .26, z: -HOUSE.depth / 2 + .02, shelves: [.05, .39, .73, 1.07] };
// The writing desk against the left wall, facing the room (see desk()). `x` is its front edge, `z` its middle: toward the
// door from the rocking chair, so it can be looked at straight on, with the window and its advent house over its far end.
export const DESK = { x: -1.15, z: .82, w: .95, h: 1.25, top: .76, items: { outbox: [.04, .27, .2, .4], stamp: [.22, .28, .32, .4], stack: [.34, .3, .54, .4], seal: [.56, .29, .64, .4], cup: [.66, .3, .8, .4], lamp: [.82, .08, .97, .4], drawer: [.33, .409, .67, .449] } };
// The small room behind the bookcase, reached once it has swung aside: its doorway in the back wall (`left`, `width`,
// `height`, hidden by the closed bookcase), how far back it goes, and how thick its walls and ceiling are (`wall`: they
// stand just inside the doorway, cabin-scene.js).
export const SECRET = { left: -1.4, width: .76, height: 1.28, depth: 1.15, wall: .02 };
// Things in the room that move about a pivot of their own: the bellows hang beside the fire, nozzle down toward it.
// The music box stands on the candle shelf of the right wall, facing the room; its little scene turns on a rig of its own.
export const MUSICBOX = { x: 1.49, y: .96, z: -.02, body: [.26, .14] };
// The two drawers that really slide out (cabin-scene.js): the desk's over the kneehole and the little one at the foot of
// the music box. Each is a box of paper pieces (its front, its floor seen from above, its sides and back) set into a slot
// drawn dark on its furniture's sheet: `slot` is where on that sheet ([left, top, right, bottom]), `size` the sheet's,
// `depth` how deep the box goes in and `slide` how far it comes out.
export const DRAWERS = {
  desk: { sheet: 'desk', size: [DESK.w, DESK.h], slot: DESK.items.drawer, depth: .2, slide: .15, wood: '#7d4f33' },
  musicbox: { sheet: 'musicbox-body', size: MUSICBOX.body, slot: [.1, .7, .9, .93], depth: .062, slide: .042, wood: '#6e2a26' },
  // In the barn's wall at the foot of the hay hoist, well inside the wall and behind the bale while it rests on the snow.
  barn: { sheet: 'stable', size: [3.4, 2.7], slot: [.1735, .9037, .2618, .9778], depth: .3, slide: .2, wood: '#5e3e29' },
};
// A drawer's pieces, in scene units: the front, the floor and a side (the back is a side's width across).
export function drawerPieces(id) {
  const { size: [w, h], slot: [x0, y0, x1, y1], depth } = DRAWERS[id], front = [(x1 - x0) * w, (y1 - y0) * h];
  return { front, floor: [front[0] * .94, depth], side: [depth, front[1] * .86] };
}
// The snow globe stands on the mantel, at its left end.
export const GLOBE = { x: .52, y: .72, z: -HOUSE.depth / 2 + .17, w: .15, h: .18 };
export const ROOM_RIGS = {
  bookcase: { at: [BOOKCASE.left, 0, BOOKCASE.z] }, bellows: { at: [1.27, .12, -HOUSE.depth / 2 + .2], tilt: -.25 },
  musicbox: { at: [MUSICBOX.x, MUSICBOX.y, MUSICBOX.z], turn: -Math.PI / 2 }, turntable: { at: [MUSICBOX.x + .02, MUSICBOX.y + .135, MUSICBOX.z] },
};
const CREAM = '#fbf3df', SNOW = '#fbf8f1', RED = '#a84a42', GREEN = '#4f7d68', DEEP_GREEN = '#3f6653', GOLD = '#e0b04f';
const WOOD = '#8f5a3c', WOOD_LIT = '#a86b47', TIMBER = '#6b4a33', PLASTER = '#f1e4c8';
// Stable "random" numbers, so every visit cuts the same cabin.
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
const clip = (svg, id, d, rule) => { shape('path', rule ? { d, 'clip-rule': rule } : { d }, shape('clipPath', { id }, shape('defs', {}, svg))); return `url(#${id})`; };
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


function archedDoor(parent, x, top, width, bottom) {
  const r = width / 2;
  shape('path', { d: `M${x - 22} ${bottom}V${top + r}A${r + 22} ${r + 22} 0 0 1 ${x + width + 22} ${top + r}V${bottom}Z`, fill: WOOD }, parent);
  shape('path', { d: `M${x} ${bottom}V${top + r}A${r} ${r} 0 0 1 ${x + width} ${top + r}V${bottom}Z`, fill: GREEN }, parent);
  for (let i = 1; i < 4; i++) shape('path', { d: `M${x + width * i / 4} ${top + (i === 2 ? 0 : r * .3)}V${bottom}`, stroke: DEEP_GREEN, 'stroke-width': 6 }, parent);
  shape('path', { d: `M${x + width * .12} ${bottom - 60}H${x + width * .88}`, stroke: DEEP_GREEN, 'stroke-width': 10 }, parent);
  shape('circle', { cx: x + width - 34, cy: top + (bottom - top) * .58, r: 11, fill: GOLD }, parent);
}

export function backWall({ plain, paper, svg }, { width, height }, state = {}) {
  const eave = height - HOUSE.wall * PX, rail = height - .42 * PX;
  // Once the bookcase has swung aside, the wall behind it is a doorway into a small room (SECRET).
  const hole = state.secret ? `M${(SECRET.left + HOUSE.width / 2) * PX} ${height}V${height - SECRET.height * PX}H${(SECRET.left + SECRET.width + HOUSE.width / 2) * PX}V${height}Z` : '';
  const wall = shape('g', { 'clip-path': clip(svg, 'gable', `M0 ${height}V${eave}L${width / 2} 0L${width} ${eave}V${height}Z${hole}`, hole ? 'evenodd' : undefined) }, plain);
  plaster(wall, width, height);
  // The fireplace stands in front at x = .88; its stone chimney climbs on up through the gable.
  stones(wall, 1155, 0, 170, 880);
  wainscot(wall, width, height, rail);
  beam(wall, 0, eave - 22, width, 44);
  beam(wall, 0, 250, width, 34);
  brace(wall, `M${width / 2} 268L${width / 2 - 250} ${eave - 20}M${width / 2} 268L${width / 2 + 250} ${eave - 20}`);
  for (const x of [0, 628, 948, width - 40]) beam(wall, x, eave, x === 0 || x === width - 40 ? 40 : 32, (x === 628 || x === 948 ? height : rail) - eave);
  // The round window high in the gable with the gold star over it, and the arched door, are sheets of their own (DECOR).
}

export function sideWall(side) {
  return ({ plain, paper, svg }, { width, height }) => {
    const rail = height - .42 * PX;
    plaster(plain, width, height); wainscot(plain, width, height, rail);
    // The posts: at each corner and one between. On the left wall the one between stands past the window (a window is set
    // between posts, not over one).
    for (const x of [0, side === 'left' ? 960 : width / 2 - 16, width - 36]) beam(plain, x, 0, x ? 32 : 36, rail);
    beam(plain, 0, 0, width, 30);
    if (side === 'left') {
      // Texture left is the front of the room. Its window (with the advent house on the sill), the calendar and the paper
      // snowflakes hang on it as sheets of their own (DECOR).
    } else {
      // Texture left is the back. A window by the fireplace and, toward the front, the shelf the music box stands on (its
      // window, candles and cookie jar are sheets of their own, DECOR).
      shape('rect', { x: 560, y: 470, width: 360, height: 24, rx: 6, fill: WOOD_LIT }, paper);
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
export function frontInside({ plain, svg }, { width, height }) {
  const cx = width / 2, eave = height - HOUSE.wall * PX, rail = height - .42 * PX;
  const wall = shape('g', { 'clip-path': cutDoor(svg, 'front-in', `M0 ${height}V${eave}L${cx} 0L${width} ${eave}V${height}Z`, cx, height) }, plain);
  plaster(wall, width, height); wainscot(wall, width, height, rail);
  beam(wall, 0, eave - 22, width, 44); beam(wall, 0, 250, width, 34);
  brace(wall, `M${cx} 268L${cx - 250} ${eave - 20}M${cx} 268L${cx + 250} ${eave - 20}`);
  for (const x of [0, width - 40]) beam(wall, x, eave, 40, rail - eave);
  // Its round gable window, the door's frame with a garland over it, and the coat pegs are sheets of their own (DECOR).
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
function coatPegs(parent, x, y, width, floor, coat = true) {
  shape('rect', { x, y, width, height: 26, rx: 8, fill: WOOD_LIT }, parent);
  for (const px of [x + 70, x + width / 2, x + width - 70]) shape('circle', { cx: px, cy: y + 13, r: 10, fill: WOOD }, parent);
  const cx = x + 70;
  // The red coat hangs on the first peg while Santa is at home; he takes it when he goes out.
  if (coat) {
  shape('path', { d: `M${cx} ${y + 20}C${cx - 60} ${y + 30} ${cx - 80} ${y + 70} ${cx - 82} ${y + 330}H${cx + 82}C${cx + 80} ${y + 70} ${cx + 60} ${y + 30} ${cx} ${y + 20}Z`, fill: RED }, parent);
  shape('rect', { x: cx - 86, y: y + 310, width: 172, height: 34, rx: 16, fill: SNOW }, parent);
  shape('rect', { x: cx - 12, y: y + 40, width: 24, height: 290, rx: 10, fill: SNOW }, parent);
  shape('rect', { x: cx - 80, y: y + 180, width: 160, height: 26, fill: '#3b2a24' }, parent);
  shape('rect', { x: cx - 18, y: y + 176, width: 36, height: 34, rx: 4, fill: 'none', stroke: GOLD, 'stroke-width': 7 }, parent);
  // A loop of cord over the peg, a fur collar, two pockets trimmed with fur, and the fur at the hem in soft tufts.
  shape('path', { d: `M${cx - 10} ${y + 24}Q${cx} ${y + 6} ${cx + 10} ${y + 24}`, fill: 'none', stroke: '#3b2a24', 'stroke-width': 3 }, parent);
  shape('path', { d: `M${cx - 48} ${y + 46}Q${cx} ${y + 70} ${cx + 48} ${y + 46}Q${cx + 30} ${y + 92} ${cx} ${y + 96}Q${cx - 30} ${y + 92} ${cx - 48} ${y + 46}Z`, fill: SNOW }, parent);
  for (const side of [-1, 1]) { shape('rect', { x: cx + side * 50 - 22, y: y + 232, width: 44, height: 46, rx: 6, fill: '#7e2f2a' }, parent); shape('rect', { x: cx + side * 50 - 23, y: y + 226, width: 46, height: 13, rx: 6, fill: SNOW }, parent); }
  for (let i = 0; i < 9; i++) shape('circle', { cx: cx - 80 + i * 20, cy: y + 345, r: 9, fill: SNOW }, parent);
  }
  const hx = x + width / 2;
  shape('path', { d: `M${hx - 50} ${y + 120}C${hx - 40} ${y + 60} ${hx + 20} ${y + 20} ${hx + 70} ${y + 70}L${hx + 50} ${y + 120}Z`, fill: RED }, parent);
  shape('rect', { x: hx - 58, y: y + 112, width: 116, height: 30, rx: 14, fill: SNOW }, parent);
  shape('circle', { cx: hx + 74, cy: y + 76, r: 18, fill: SNOW }, parent);
  const sx = x + width - 70;
  for (const [dx, len] of [[-14, 230], [14, 190]]) {
    shape('rect', { x: sx + dx - 14, y: y + 18, width: 28, height: len, rx: 8, fill: GREEN }, parent);
    for (let k = 1; k < 4; k++) shape('rect', { x: sx + dx - 14, y: y + 18 + len * k / 4, width: 28, height: 10, fill: CREAM }, parent);
    for (let f = 0; f < 4; f++) shape('path', { d: `M${sx + dx - 11 + f * 7.3} ${y + 18 + len}v14`, stroke: GREEN, 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
  }
  for (const bx of [x + 110, x + 190]) {
    shape('path', { d: `M${bx} ${floor}V${floor - 120}h50V${floor - 30}h34c14 0 18 30 0 30Z`, fill: '#2f2622' }, parent);
    shape('rect', { x: bx - 6, y: floor - 132, width: 62, height: 22, rx: 10, fill: SNOW }, parent);
    shape('path', { d: `M${bx} ${floor - 6}H${bx + 92}`, stroke: '#1e1714', 'stroke-width': 5 }, parent);
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

// A letter from the display face (scripts/build-title-glyphs.mjs), centred on (cx, cy) and fitted into a box.
export function letter(parent, char, cx, cy, width, height, style) {
  const { d, box: [x1, y1, x2, y2] } = cabinGlyphs[char], scale = Math.min(width / (x2 - x1), height / (y2 - y1));
  return shape('path', { d, transform: `translate(${cx - scale * (x1 + x2) / 2} ${cy - scale * (y1 + y2) / 2}) scale(${scale})`, ...style }, parent);
}
const shade = (parent, x, y, width, height, opacity, fill = '#000') => shape('rect', { x, y, width, height, fill, opacity }, parent);

// A gold silk bookmark ribbon hanging from (x, y), `w` wide and `h` long, its end cut in a swallowtail. The bookcase's four
// empty places each have one, and the music box raises four just like them (musicBookmarks).
export function ribbon(parent, x, y, w, h) {
  const notch = w * .7;
  shape('path', { d: `M${x - w / 2} ${y}H${x + w / 2}V${y + h}L${x} ${y + h - notch}L${x - w / 2} ${y + h}Z`, fill: '#c9a24f' }, parent);
  shape('path', { d: `M${x - w * .12} ${y}V${y + h - notch * .9}`, stroke: '#ead08a', 'stroke-width': w * .16, opacity: .8 }, parent);
}
// The bookcase's painted back: wood planks, a shadow under each shelf, and on the second shelf four paler marks in the
// dust where books once stood, a gold bookmark ribbon hanging into each from the shelf above. The shelves, sides and books
// in front of it are solid (cabin-scene.js).
export function bookcaseBack({ paper }, { width, height }) {
  const unit = width / BOOKCASE.width;
  shape('rect', { x: 0, y: 0, width, height, rx: 10, fill: '#7a5236' }, paper);
  for (let i = 1; i < 5; i++) shape('rect', { x: i * width / 5 - 2, y: 0, width: 4, height, fill: '#5e3e29', opacity: .5 }, paper);
  for (let i = 0; i < 9; i++) {
    const y = 60 + i * height / 9 + noise(i) * 30;
    shape('path', { d: `M${10 + noise(i + 3) * 40} ${y}C${width * .3} ${y - 14} ${width * .6} ${y + 16} ${width - 20} ${y - 4}`, fill: 'none', stroke: '#8f6444', 'stroke-width': 3, opacity: .55 }, paper);
  }
  for (const shelf of BOOKCASE.shelves.slice(1)) shade(paper, 0, height - shelf * unit, width, 34, .22);
  shade(paper, 0, 0, width, 46, .25);
  const base = height - BOOKCASE.shelves[1] * unit;
  for (const x of SHELF_LAYOUT.slots) shape('rect', { x: (x - .036) * unit, y: base - .25 * unit, width: .072 * unit, height: .25 * unit, rx: 6, fill: '#a07752', opacity: .55 }, paper);
  const top = height - (BOOKCASE.shelves[2] - .012) * unit;
  for (const x of SHELF_LAYOUT.slots) ribbon(paper, x * unit, top, .024 * unit, .15 * unit);
}
// A book's spine: cloth of its colour, two pairs of bands, and its letter in the middle. A gold book has dull gold bands
// and a dull gold-stamped letter (it gleams only in the firelight, cabin-scene.js); the others are printed in cream.
export function letterSpine({ letter: char, colour, gold }) {
  return ({ paper }, { width, height }) => {
    shape('rect', { x: 0, y: 0, width, height, rx: 8, fill: colour }, paper);
    shade(paper, 0, 0, width * .3, height, .1, '#fff');
    shade(paper, width * .82, 0, width * .18, height, .14);
    const band = gold ? '#b89a5a' : '#f6ecd6', bandOpacity = gold ? .9 : .55;
    for (const y of [.07, .11, .87, .91]) shape('rect', { x: 0, y: height * y, width, height: height * .018, fill: band, opacity: bandOpacity }, paper);
    letter(paper, char, width / 2, height * .45, width * .7, height * .24, gold ? { fill: '#c9a75e', stroke: '#6b5226', 'stroke-width': 1.4 } : { fill: '#f6ecd6', opacity: .9 });
    for (const [y, w] of [[.66, .5], [.7, .34]]) shape('rect', { x: width * (1 - w) / 2, y: height * y, width: width * w, height: height * .012, rx: 2, fill: band, opacity: bandOpacity * .8 }, paper);
  };
}
// Ordinary books: four plain spines, used again and again at different sizes.
const PLAIN = ['#3f5a7a', '#7d5636', '#3f6653', '#8f3b36'];
export function plainSpine(variant) {
  return ({ paper }, { width, height }) => {
    shape('rect', { x: 0, y: 0, width, height, rx: 8, fill: PLAIN[variant] }, paper);
    shade(paper, 0, 0, width * .3, height, .1, '#fff');
    shade(paper, width * .82, 0, width * .18, height, .14);
    const bands = [[.08, .14], [.1, .2, .8], [.5], [.12, .88]][variant];
    for (const y of bands) shape('rect', { x: 0, y: height * y, width, height: height * .025, fill: '#f6ecd6', opacity: .45 }, paper);
    shape('rect', { x: width * .3, y: height * .32, width: width * .4, height: height * .16, rx: 4, fill: '#f6ecd6', opacity: .35 }, paper);
  };
}
// The SANTA picture book, stood face out: a night over snowy roofs, the sleigh crossing the moon, its title in gold.
export function santaCover({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 14, fill: '#8f3b36' }, paper);
  shade(paper, 0, 0, width * .08, height, .2);
  const inset = width * .09, sky = { x: inset, y: height * .3, width: width - inset * 2, height: height * .58 };
  shape('rect', { ...sky, rx: 10, fill: '#2f4a6b' }, paper);
  shape('circle', { cx: sky.x + sky.width * .68, cy: sky.y + sky.height * .3, r: sky.width * .17, fill: '#f6ecd6' }, paper);
  for (let i = 0; i < 9; i++) shape('circle', { cx: sky.x + sky.width * noise(i * 3 + 1), cy: sky.y + sky.height * .5 * noise(i * 5 + 2), r: 2.4, fill: '#e0b04f' }, paper);
  // The sleigh and two reindeer, cut from one dark sheet, against the moon.
  const sy = sky.y + sky.height * .32, sx = sky.x + sky.width * .5;
  shape('path', { d: `M${sx - 40} ${sy}C${sx - 36} ${sy + 18} ${sx + 10} ${sy + 20} ${sx + 22} ${sy + 6}L${sx + 30} ${sy - 4}H${sx + 18}L${sx + 10} ${sy + 2}H${sx - 30}L${sx - 34} ${sy - 12}Z`, fill: '#1f2f45' }, paper);
  for (const dx of [46, 84]) shape('path', { d: `M${sx + dx} ${sy - 6}l10-4 8-12 4 4-6 10 12 2 4 10-6 2-4-6-12 2-4 8-6-2 4-10Z`, fill: '#1f2f45' }, paper);
  shape('path', { d: `M${sx + 22} ${sy}L${sx + 90} ${sy - 8}`, stroke: '#1f2f45', 'stroke-width': 2 }, paper);
  // Snowy roofs along the bottom, one chimney smoking.
  const roofs = sky.y + sky.height;
  shape('path', { d: `M${sky.x} ${roofs}V${roofs - 46}L${sky.x + 50} ${roofs - 80}L${sky.x + 100} ${roofs - 46}L${sky.x + 150} ${roofs - 70}L${sky.x + 200} ${roofs - 40}L${sky.x + sky.width} ${roofs - 62}V${roofs}Z`, fill: '#fbf8f1' }, paper);
  shape('rect', { x: sky.x + 120, y: roofs - 98, width: 16, height: 30, fill: '#b5625a' }, paper);
  for (const [x, y, w, h] of [[sky.x + 30, roofs - 34, 16, 20], [sky.x + 74, roofs - 30, 16, 18], [sky.x + 168, roofs - 26, 18, 16]]) shape('rect', { x, y, width: w, height: h, rx: 2, fill: '#f4cf74' }, paper);
  shape('rect', { x: inset, y: inset * .7, width: width - inset * 2, height: height * .2, rx: 10, fill: 'none', stroke: '#e0b04f', 'stroke-width': 4 }, paper);
  [...'SANTA'].forEach((char, i) => letter(paper, char, inset + (width - inset * 2) * (i + .5) / 5, inset * .7 + height * .1, (width - inset * 2) / 5 * .86, height * .14, { fill: '#f0cf7e', stroke: '#8f6a2c', 'stroke-width': 1.4 }));
  shape('rect', { x: inset, y: height - inset * .75, width: width - inset * 2, height: 5, rx: 2, fill: '#e0b04f' }, paper);
}

// Where everything sits on the bookcase, in metres from its hinge edge: HOLY MERRY along the third shelf (a little gap
// between the words), and on the second the four empty places and the SANTA picture book at the right. M, O, E and both
// R books (two volumes of one set, bound alike) have gold spines.
const SPINE = { red: '#8f3b36', green: '#3f6653', navy: '#3f5a7a', plum: '#6e4a6b', teal: '#4a7d80', brown: '#7d5636', mustard: '#b98a3c', olive: '#5f6b3c' };
export const LETTER_BOOKS = [
  ['H', SPINE.green, .064, .25], ['O', SPINE.olive, .074, .27, true], ['L', SPINE.navy, .058, .23], ['Y', SPINE.brown, .066, .26],
  ['M', SPINE.plum, .076, .28, true], ['E', SPINE.teal, .07, .255, true], ['R', SPINE.red, .072, .27, true], ['R', SPINE.red, .072, .27, true], ['Y', SPINE.mustard, .066, .26],
].map(([char, colour, w, h, gold = false], index, all) => ({ id: `book-${char.toLowerCase()}${all.slice(0, index).filter(([other]) => other === char).length + 1}`, letter: char, colour, w, h, gold }));
export const SHELF_LAYOUT = (() => {
  const gap = .006, word = .05, total = LETTER_BOOKS.reduce((sum, book) => sum + book.w + gap, -gap) + word;
  let x = (BOOKCASE.width - total) / 2;
  const letters = LETTER_BOOKS.map((book, index) => { const at = x + book.w / 2; x += book.w + gap + (index === 3 ? word : 0); return at; });
  return { letters, slots: [.31, .388, .466, .544], santa: .76 };
})();
// Ordinary books on the other shelves: [shelf, variant, width, height], packed from the left.
export const PLAIN_BOOKS = (() => {
  const rows = { 0: { from: .06, to: .9, tall: [.26, .31], wide: [.06, .08] }, 1: { from: .05, to: .2, tall: [.22, .26], wide: [.05, .062] }, 3: { from: .06, to: .62, tall: [.18, .24], wide: [.045, .06] } };
  const books = [];
  for (const [shelf, { from, to, tall, wide }] of Object.entries(rows)) {
    let x = from, i = 0;
    while (true) {
      const w = wide[0] + (wide[1] - wide[0]) * noise(shelf * 31 + i * 7), h = tall[0] + (tall[1] - tall[0]) * noise(shelf * 17 + i * 3 + 1);
      if (x + w > to) break;
      books.push({ shelf: Number(shelf), variant: Math.floor(noise(shelf * 5 + i * 11 + 2) * 4), x: x + w / 2, w, h }); x += w + .004; i++;
    }
  }
  return books;
})();
// The sheets the book spines are cut from: one per letter book, four plain ones, and the picture book's cover.
export const BOOK_SHEETS = [
  ...LETTER_BOOKS.map(book => ({ id: book.id, w: book.w, h: book.h, px: 1600, draw: letterSpine(book) })),
  ...PLAIN.map((colour, variant) => ({ id: `book-plain-${variant}`, w: .06, h: .25, px: 1000, draw: plainSpine(variant) })),
  { id: 'santa-book', w: .24, h: .3, px: 1600, draw: santaCover },
];

// A wicker basket of firewood beside the hearth.
export function logBasket({ paper }, { width, height }) {
  for (const [x, tilt] of [[.28, -.2], [.5, .08], [.72, .26]]) {
    const cx = width * x, top = height * .08;
    shape('rect', { x: cx - 18, y: top, width: 36, height: height * .45, rx: 10, fill: '#7d5636', transform: `rotate(${tilt * 57} ${cx} ${top + 60})` }, paper);
    shape('ellipse', { cx: cx + tilt * 30, cy: top + 6, rx: 19, ry: 16, fill: '#c99a6a' }, paper);
    shape('ellipse', { cx: cx + tilt * 30, cy: top + 6, rx: 10, ry: 8, fill: 'none', stroke: '#a8774d', 'stroke-width': 3 }, paper);
  }
  const top = height * .36;
  shape('path', { d: `M${width * .04} ${top}H${width * .96}L${width * .86} ${height}H${width * .14}Z`, fill: '#b98a52' }, paper);
  for (let y = top + 16; y < height - 8; y += 18) shape('path', { d: `M${width * .06 + (y - top) * .12} ${y}H${width * .94 - (y - top) * .12}`, stroke: '#a8774d', 'stroke-width': 7, opacity: .8 }, paper);
  for (let i = 1; i < 8; i++) shape('path', { d: `M${width * (.04 + i * .115)} ${top}L${width * (.14 + i * .09)} ${height}`, stroke: '#8f6444', 'stroke-width': 3, opacity: .7 }, paper);
  shape('rect', { x: width * .02, y: top - 8, width: width * .96, height: 18, rx: 9, fill: '#8f5a3c' }, paper);
}
// One split log, seen from the side, its cut end turned toward the room.
export function hearthLog({ paper }, { width, height }) {
  shape('rect', { x: 0, y: height * .08, width: width * .88, height: height * .84, rx: height * .4, fill: '#7d5636' }, paper);
  for (let i = 0; i < 4; i++) shape('path', { d: `M${width * (.08 + i * .2)} ${height * .3}c${width * .06} ${height * .1} ${width * .1} -${height * .05} ${width * .16} ${height * .06}`, fill: 'none', stroke: '#5e3e29', 'stroke-width': 4 }, paper);
  shape('ellipse', { cx: width * .86, cy: height / 2, rx: width * .1, ry: height * .46, fill: '#c99a6a' }, paper);
  for (const r of [.3, .62]) shape('ellipse', { cx: width * .86, cy: height / 2, rx: width * .1 * r, ry: height * .46 * r, fill: 'none', stroke: '#a8774d', 'stroke-width': 3 }, paper);
  shape('ellipse', { cx: width * .3, cy: height * .8, rx: width * .14, ry: height * .14, fill: '#3b2a24', opacity: .5 }, paper);
}
// The bellows: two wooden boards hinged at the brass nozzle (the bottom of each sheet), and the pleated leather between.
export function bellowsPaddle({ paper }, { width, height }) {
  const cx = width / 2;
  shape('path', { d: `M${cx - 14} ${height}L${width * .1} ${height * .42}C${width * .02} ${height * .24} ${width * .2} ${height * .14} ${cx} ${height * .14}C${width * .8} ${height * .14} ${width * .98} ${height * .24} ${width * .9} ${height * .42}L${cx + 14} ${height}Z`, fill: '#a86b47' }, paper);
  shape('path', { d: `M${cx - 6} ${height * .9}L${width * .2} ${height * .44}C${width * .14} ${height * .3} ${width * .28} ${height * .22} ${cx} ${height * .22}C${width * .72} ${height * .22} ${width * .86} ${height * .3} ${width * .8} ${height * .44}L${cx + 6} ${height * .9}Z`, fill: '#8f5a3c' }, paper);
  shape('rect', { x: cx - 12, y: 0, width: 24, height: height * .18, rx: 10, fill: '#a86b47' }, paper);
  shape('circle', { cx, cy: height * .06, r: 7, fill: '#6b4a33' }, paper);
  for (const y of [.3, .5, .7]) shape('circle', { cx, cy: height * y, r: 5, fill: '#e0b04f' }, paper);
}
export function bellowsLeather({ paper }, { width, height }) {
  const cx = width / 2, mouth = height * .8;
  shape('path', { d: `M${width * .04} 0H${width * .96}L${cx + 10} ${mouth}H${cx - 10}Z`, fill: '#5b3a2c' }, paper);
  for (let i = 1; i < 6; i++) shape('path', { d: `M${width * (.04 + i * .07)} 0L${cx - 6 + i * 2} ${mouth}M${width * (.96 - i * .07)} 0L${cx + 6 - i * 2} ${mouth}`, stroke: '#3b2a24', 'stroke-width': 3, opacity: .6 }, paper);
  shape('rect', { x: cx - 9, y: mouth - 6, width: 18, height: height - mouth + 6, rx: 4, fill: '#e0b04f' }, paper);
}

// The music box: a red lacquered box with gold corners, its lid standing open behind it (engraved inside: someone's
// initials for someone else), a little paper scene on the turntable (a fir, the sleigh and a reindeer, cut as one) and a
// gold butterfly key on its front.
export function musicBoxBody({ paper }, { width, height }) {
  shape('rect', { x: 0, y: height * .12, width, height: height * .88, rx: 10, fill: '#8f3b36' }, paper);
  shape('rect', { x: 0, y: 0, width, height: height * .16, rx: 8, fill: '#a84a42' }, paper);
  shape('rect', { x: width * .06, y: height * .24, width: width * .88, height: height * .38, rx: 8, fill: 'none', stroke: GOLD, 'stroke-width': 5 }, paper);
  for (const x of [.04, .96]) for (const y of [.18, .94]) shape('circle', { cx: width * x, cy: height * y, r: 9, fill: GOLD }, paper);
  for (let i = 0; i < 5; i++) shape('path', { d: `M${width * (.2 + i * .1)} ${height * .5}l${width * .02} -${height * .1} ${width * .02} ${height * .1}Z`, fill: GOLD, opacity: .8 }, paper);
  // The opening at its foot, dark inside, for the little drawer (a box of its own) to slide out of; a gold rim round it.
  const [x0, y0, x1, y1] = DRAWERS.musicbox.slot;
  shape('rect', { x: width * x0 - 4, y: height * y0 - 4, width: width * (x1 - x0) + 8, height: height * (y1 - y0) + 8, rx: 5, fill: GOLD }, paper);
  shape('rect', { x: width * x0, y: height * y0, width: width * (x1 - x0), height: height * (y1 - y0), rx: 3, fill: '#2a1412' }, paper);
}
export function musicBoxLid({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 10, fill: '#a84a42' }, paper);
  shape('rect', { x: width * .05, y: height * .08, width: width * .9, height: height * .84, rx: 8, fill: '#f3e6c8' }, paper);
  shape('rect', { x: width * .05, y: height * .08, width: width * .9, height: height * .84, rx: 8, fill: 'none', stroke: GOLD, 'stroke-width': 4 }, paper);
  // The engraving: a small heart and two pairs of initials, worn soft.
  shape('path', { d: `M${width / 2} ${height * .62}c-${width * .06} -${height * .08} -${width * .1} -${height * .22} 0 -${height * .2}c${width * .1} -${height * .02} ${width * .06} ${height * .12} 0 ${height * .2}Z`, fill: '#c9a77f' }, paper);
  for (const [char, x] of [['N', .26], ['K', .74]]) letter(paper, char, width * x, height * .44, width * .14, height * .26, { fill: '#b98a5a' });
}
export function musicBoxScene({ paper }, { width, height }) {
  shape('ellipse', { cx: width / 2, cy: height * .94, rx: width * .46, ry: height * .06, fill: '#e3d6bf' }, paper);
  shape('path', { d: `M${width * .3} ${height * .9}L${width * .42} ${height * .05}L${width * .54} ${height * .9}Z`, fill: GREEN }, paper);
  for (const y of [.35, .6]) shape('path', { d: `M${width * .34} ${height * y}H${width * .5}`, stroke: SNOW, 'stroke-width': 6 }, paper);
  shape('circle', { cx: width * .42, cy: height * .06, r: 8, fill: GOLD }, paper);
  shape('path', { d: `M${width * .58} ${height * .86}C${width * .6} ${height * .7} ${width * .76} ${height * .66} ${width * .9} ${height * .7}L${width * .94} ${height * .58}H${width * .98}L${width * .96} ${height * .78}C${width * .9} ${height * .9} ${width * .7} ${height * .92} ${width * .58} ${height * .86}Z`, fill: RED }, paper);
  shape('path', { d: `M${width * .06} ${height * .62}l${width * .06} -${height * .1} ${width * .1} 0 ${width * .06} -${height * .14} ${width * .04} ${height * .04} -${width * .04} ${height * .12} ${width * .06} ${height * .2} -${width * .05} 0 -${width * .04} -${height * .1} -${width * .1} 0 -${width * .02} ${height * .1}Z`, fill: '#a8774d' }, paper);
}
// The music box's four gold bookmarks, cut like the bookcase's four ribbons: two on each side of its turning scene, hung
// from the crossbar of a little brass post inside the box. While it plays they rise up out of it and sway (cabin-scene.js),
// still blank; `x` is how far each pair stands from the middle, clear of the scene as it turns.
export const BOOKMARKS = { w: .052, h: .12, x: .092, z: -.03, rest: .015, rise: .09 };
export function musicBookmarks({ paper }, { width, height }) {
  const g = shape('g', { transform: `scale(${width / 100})` }, paper), h = 100 * height / width;
  shape('rect', { x: 46, y: 6, width: 8, height: h - 6, rx: 3, fill: '#8f6a2c' }, g);
  shape('rect', { x: 8, y: 4, width: 84, height: 8, rx: 4, fill: '#c9a24f' }, g);
  shape('circle', { cx: 50, cy: 5, r: 6, fill: GOLD }, g);
  for (const x of [28, 72]) ribbon(g, x, 11, 26, h * .6);
}
export function musicBoxKey({ paper }, { width, height }) {
  const cx = width / 2, cy = height / 2;
  for (const side of [-1, 1]) shape('path', { d: `M${cx} ${cy}C${cx + side * width * .2} ${cy - height * .42} ${cx + side * width * .5} ${cy - height * .3} ${cx + side * width * .46} ${cy}C${cx + side * width * .5} ${cy + height * .3} ${cx + side * width * .2} ${cy + height * .42} ${cx} ${cy}Z`, fill: GOLD }, paper);
  shape('circle', { cx, cy, r: Math.min(width, height) * .12, fill: '#c08a3e' }, paper);
}
// The snow globe as it stands on the mantel: a glass dome over a little red house and a fir, snow lying at its foot,
// on a turned wooden base. Up close it is replaced by one that can be shaken (cabin-globe.js).
export function snowGlobe({ paper }, { width, height }) {
  // The village as it was in 2003: the old cabin with a little room built on at its back left (one lit window), a fir.
  const r = width * .46, cx = width / 2, cy = r + 4;
  shape('circle', { cx, cy, r, fill: '#dbeaf2', opacity: .75 }, paper);
  shape('path', { d: `M${cx - r * .92} ${cy + r * .4}Q${cx} ${cy + r * .2} ${cx + r * .92} ${cy + r * .4}A${r} ${r} 0 0 1 ${cx - r * .92} ${cy + r * .4}Z`, fill: SNOW }, paper);
  shape('rect', { x: cx - r * .62, y: cy + r * .02, width: r * .22, height: r * .26, fill: '#87302f' }, paper);
  shape('rect', { x: cx - r * .56, y: cy + r * .08, width: r * .08, height: r * .08, fill: '#f4cf74' }, paper);
  shape('rect', { x: cx - r * .42, y: cy - r * .02, width: r * .5, height: r * .4, fill: RED }, paper);
  shape('path', { d: `M${cx - r * .5} ${cy}L${cx - r * .17} ${cy - r * .32}L${cx + r * .16} ${cy}Z`, fill: SNOW }, paper);
  shape('path', { d: `M${cx + r * .22} ${cy + r * .36}L${cx + r * .4} ${cy - r * .3}L${cx + r * .58} ${cy + r * .36}Z`, fill: GREEN }, paper);
  shape('path', { d: `M${cx - r * .62} ${cy - r * .56}A${r * .8} ${r * .8} 0 0 1 ${cx - r * .1} ${cy - r * .84}`, fill: 'none', stroke: '#fff', 'stroke-width': 6, opacity: .7 }, paper);
  shape('path', { d: `M${cx - r * .9} ${height}L${cx - r * .78} ${cy + r * .82}H${cx + r * .78}L${cx + r * .9} ${height}Z`, fill: WOOD }, paper);
  shape('rect', { x: cx - r * .8, y: cy + r * .8, width: r * 1.6, height: 10, rx: 4, fill: GOLD }, paper);
}

// The note Santa leaves on his chair when he goes out to the reindeer: a few lines in his hand and his initial.
export function chairNote({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 6, fill: '#fffdf6', transform: `rotate(-4 ${width / 2} ${height / 2})` }, paper);
  for (const [y, w] of [[.26, .7], [.44, .58], [.62, .66]]) shape('path', { d: `M${width * .12} ${height * y}c${width * w * .3} -6 ${width * w * .6} 6 ${width * w} 0`, fill: 'none', stroke: '#8f3b36', 'stroke-width': 4, 'stroke-linecap': 'round' }, paper);
  letter(paper, 'S', width * .78, height * .8, width * .16, height * .2, { fill: '#8f3b36' });
}

// The little room behind the bookcase, where the substitutes keep their things. Its walls are solid (cabin-scene.js);
// these sheets hang on them. Initials are drawn letters; full names and words are read up close (cabin-secret.js).
export const SUBSTITUTES = [['N', '#8f3b36'], ['K', '#3f5a7a'], ['H', '#3f6653'], ['E', '#6e4a6b'], ['O', '#b98a3c']];
// `mine`: the visitor has signed the early shift, and their tag hangs on the sixth hook (a red band and a gold star: the
// board's letters are cut from a fixed set, so their initial is on the card, cabin-secret.js).
// A substitute's work mark, centred on (cx, cy) and `size` across, in their colour: a spanner, a sleigh, a star, a
// snowflake or an envelope (data/cabin-secret.js MARKS). On their name tag, and by their initial in the shift log.
export function workMark(parent, kind, cx, cy, size, fill) {
  const s = size / 20, at = `translate(${cx - 10 * s} ${cy - 10 * s}) scale(${s})`, g = shape('g', { transform: at }, parent);
  const line = (d, width = 2.6) => shape('path', { d, fill: 'none', stroke: fill, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  if (kind === 'spanner') { line('M5 15L13 7', 3.2); shape('path', { d: 'M12 3a5 5 0 1 0 5 5l-3 1-2-2z', fill }, g); }
  if (kind === 'sleigh') { line('M3 15H15Q18 15 18 12'); line('M5 12V8H13L15 12Z'); }
  if (kind === 'star') shape('path', { d: 'M10 2L12.4 7.6 18.4 8 13.8 11.8 15.2 17.6 10 14.4 4.8 17.6 6.2 11.8 1.6 8 7.6 7.6Z', fill }, g);
  if (kind === 'snowflake') for (let i = 0; i < 3; i++) line(`M${10 + Math.cos(i * Math.PI / 3) * 8} ${10 + Math.sin(i * Math.PI / 3) * 8}L${10 - Math.cos(i * Math.PI / 3) * 8} ${10 - Math.sin(i * Math.PI / 3) * 8}`, 2.2);
  if (kind === 'envelope') { shape('rect', { x: 3, y: 5, width: 14, height: 10, rx: 1.5, fill }, g); line('M3.6 5.6L10 10.4 16.4 5.6', 1.6).setAttribute('stroke', '#fffdf6'); }
}
const MARK_OF = { N: 'spanner', K: 'sleigh', H: 'star', E: 'snowflake', O: 'envelope' };
export function nameTags({ paper }, { width, height }, state = {}) {
  shape('rect', { x: 0, y: height * .18, width, height: height * .1, rx: 8, fill: WOOD_LIT }, paper);
  const step = width / 6.4;
  SUBSTITUTES.forEach(([char, colour], i) => {
    const cx = step * (i + .9), top = height * .23;
    shape('circle', { cx, cy: top, r: 9, fill: WOOD }, paper);
    shape('path', { d: `M${cx} ${top}L${cx - step * .3} ${top + height * .2}M${cx} ${top}L${cx + step * .3} ${top + height * .2}`, stroke: '#c9a77f', 'stroke-width': 3 }, paper);
    shape('rect', { x: cx - step * .38, y: top + height * .2, width: step * .76, height: height * .44, rx: 10, fill: '#fffdf6', transform: `rotate(${(i % 2 ? 1 : -1) * 4} ${cx} ${top})` }, paper);
    shape('rect', { x: cx - step * .38, y: top + height * .2, width: step * .76, height: height * .1, rx: 8, fill: colour, transform: `rotate(${(i % 2 ? 1 : -1) * 4} ${cx} ${top})` }, paper);
    const tilt = shape('g', { transform: `rotate(${(i % 2 ? 1 : -1) * 4} ${cx} ${top})` }, paper);
    letter(tilt, char, cx, top + height * .43, step * .4, height * .17, { fill: colour });
    workMark(tilt, MARK_OF[char], cx, top + height * .57, step * .3, colour);
  });
  // The sixth hook, empty until the visitor stays on.
  const cx = step * 5.9, top = height * .23;
  shape('circle', { cx, cy: top, r: 9, fill: WOOD }, paper);
  if (!state.mine) return;
  shape('path', { d: `M${cx} ${top}L${cx - step * .3} ${top + height * .2}M${cx} ${top}L${cx + step * .3} ${top + height * .2}`, stroke: '#c9a77f', 'stroke-width': 3 }, paper);
  shape('rect', { x: cx - step * .38, y: top + height * .2, width: step * .76, height: height * .44, rx: 10, fill: '#fffdf6', transform: `rotate(-4 ${cx} ${top})` }, paper);
  shape('rect', { x: cx - step * .38, y: top + height * .2, width: step * .76, height: height * .1, rx: 8, fill: RED, transform: `rotate(-4 ${cx} ${top})` }, paper);
  const y = top + height * .47, r = step * .2;
  shape('path', { d: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .45 : r; return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * d).toFixed(1)} ${(y + Math.sin(a) * d).toFixed(1)}`; }).join('') + 'Z', fill: GOLD }, paper);
}
export function shiftLog({ paper }, { width, height }) {
  shape('rect', { x: 0, y: height * .04, width, height: height * .96, rx: 10, fill: WOOD_LIT }, paper);
  shape('rect', { x: width * .07, y: height * .12, width: width * .86, height: height * .82, rx: 4, fill: '#fffdf6' }, paper);
  shape('rect', { x: width * .3, y: 0, width: width * .4, height: height * .1, rx: 6, fill: '#9a9a9a' }, paper);
  ['#8f3b36', '#3f5a7a', '#3f6653', '#3f5a7a', '#8f3b36', '#6e4a6b'].forEach((ink, i) => shape('path', { d: `M${width * .14} ${height * (.24 + i * .12)}c${width * .2} -8 ${width * .4} 8 ${width * .62} 0`, fill: 'none', stroke: ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, paper));
}
export function secretDesk({ paper }, { width, height }) {
  const top = height * .42;
  shape('rect', { x: width * .04, y: top, width: width * .92, height: 24, rx: 6, fill: WOOD_LIT }, paper);
  for (const x of [.08, .86]) shape('rect', { x: width * x, y: top + 20, width: width * .06, height: height - top - 20, fill: WOOD }, paper);
  // The register on its lectern, open at its newest page.
  shape('path', { d: `M${width * .1} ${top}L${width * .16} ${top - height * .2}H${width * .46}L${width * .5} ${top}Z`, fill: WOOD }, paper);
  shape('path', { d: `M${width * .14} ${top - height * .18}Q${width * .22} ${top - height * .24} ${width * .3} ${top - height * .19}Q${width * .38} ${top - height * .24} ${width * .46} ${top - height * .18}L${width * .44} ${top - height * .04}H${width * .16}Z`, fill: '#fffdf6' }, paper);
  // A row of postmark stamps, each with its own initial, and the little rulebook.
  SUBSTITUTES.slice(0, 4).forEach(([char, colour], i) => {
    const cx = width * (.56 + i * .085);
    shape('rect', { x: cx - 12, y: top - 60, width: 24, height: 40, rx: 6, fill: WOOD }, paper);
    shape('circle', { cx, cy: top - 64, r: 13, fill: WOOD_LIT }, paper);
    shape('rect', { x: cx - 20, y: top - 22, width: 40, height: 20, rx: 4, fill: colour }, paper);
  });
  shape('rect', { x: width * .3, y: top - 26, width: width * .16, height: 24, rx: 4, fill: '#3f6653', transform: `rotate(-6 ${width * .38} ${top})` }, paper);
  // At the far end, the old record book standing up: dark red cloth, tied round with red cord, a little brass lock.
  const bx = width * .855, bw = width * .085, bh = height * .2;
  shape('rect', { x: bx, y: top - bh, width: bw, height: bh, rx: 4, fill: '#6b2a2a' }, paper);
  shape('rect', { x: bx + bw * .08, y: top - bh + 4, width: bw * .12, height: bh - 8, fill: '#8f3b36' }, paper);
  shape('path', { d: `M${bx - 3} ${top - bh * .45}H${bx + bw + 3}`, stroke: '#c63a33', 'stroke-width': 5 }, paper);
  shape('rect', { x: bx + bw * .3, y: top - bh * .45 - 10, width: bw * .4, height: 20, rx: 4, fill: '#c99a3c' }, paper);
}
export function sortingRack({ paper }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, rx: 8, fill: WOOD }, paper);
  const cols = 4, rows = 3, cw = (width - 30) / cols, rh = (height - 30) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = 15 + c * cw, y = 15 + r * rh;
    shape('rect', { x: x + 4, y: y + 4, width: cw - 8, height: rh - 8, fill: '#5e3e29' }, paper);
    for (let k = 0; k < 1 + (r * 3 + c) % 3; k++) shape('rect', { x: x + 12 + k * 6, y: y + rh * .3 - k * 4, width: cw - 28, height: rh * .6, rx: 3, fill: ['#fffdf6', '#f3e6c8', '#eadcc0'][k], transform: `rotate(${(k - 1) * 4} ${x + cw / 2} ${y + rh})` }, paper);
  }
}
// Six pegs: a hat on each of the first five, one for each substitute in the name tags' order, Holly's the smallest (the
// one she wore the year she first came); the sixth is empty. `mine`: the visitor has signed the early shift, and their hat
// hangs on the sixth (with a gold star on its band, like their name tag).
export const HAT_SIZES = { N: 1, K: .9, H: .46, E: .82, O: .78, mine: .86 };
export function hatPegs({ paper }, { width, height }, state = {}) {
  shape('rect', { x: 0, y: height * .12, width, height: height * .1, rx: 6, fill: WOOD_LIT }, paper);
  for (let i = 0; i < 6; i++) {
    const cx = width * (.09 + i * .164), top = height * .2;
    shape('circle', { cx, cy: top, r: 7, fill: WOOD }, paper);
    const char = SUBSTITUTES[i]?.[0] ?? (state.mine ? 'mine' : null); if (!char) continue;
    const size = HAT_SIZES[char], h = height * .7 * size, w = width * .15 * size;
    shape('path', { d: `M${cx - w / 2} ${top + h}C${cx - w * .4} ${top + h * .3} ${cx + w * .2} ${top} ${cx + w * .55} ${top + h * .35}L${cx + w / 2} ${top + h}Z`, fill: RED }, paper);
    shape('rect', { x: cx - w * .58, y: top + h - h * .16, width: w * 1.16, height: h * .2, rx: h * .1, fill: SNOW }, paper);
    shape('circle', { cx: cx + w * .56, cy: top + h * .38, r: Math.max(5, w * .12), fill: SNOW }, paper);
    if (char !== 'mine') continue;
    const y = top + h - h * .06, r = h * .13;
    shape('path', { d: Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, d = k % 2 ? r * .45 : r; return `${k ? 'L' : 'M'}${(cx + Math.cos(a) * d).toFixed(1)} ${(y + Math.sin(a) * d).toFixed(1)}`; }).join('') + 'Z', fill: GOLD }, paper);
  }
}

// The writing desk under the left window, turned to face the room. On top, from the door end: the rack with the reply
// waiting to go, the postmark stamp on its ink pad, the bundle of letters, the wax seal, tea and the last of last night's
// cookies, and the lamp. `DESK.items` are where they are on the sheet ([left, top, right, bottom] as fractions of its
// width and height), so the desk's game can lay its buttons over them.
export function desk({ paper }, { width, height }) {
  const top = height * (1 - DESK.top / DESK.h), box = name => DESK.items[name].map((value, i) => value * (i % 2 ? height : width));
  // The desk: its top seen a little from above, a drawer each side, the kneehole between.
  shape('path', { d: `M${width * .015} ${top}L${width * .05} ${top - 46}H${width * .95}L${width * .985} ${top}Z`, fill: WOOD_LIT }, paper);
  shape('rect', { x: 0, y: top, width, height: 30, rx: 6, fill: WOOD }, paper);
  for (const [x, w] of [[.03, .3], [.67, .3]]) {
    shape('rect', { x: width * x, y: top + 30, width: width * w, height: height - top - 30, fill: WOOD_LIT }, paper);
    for (let i = 0; i < 3; i++) {
      const y = top + 50 + i * (height - top - 70) / 3;
      shape('rect', { x: width * (x + .02), y, width: width * (w - .04), height: (height - top - 90) / 3, rx: 8, fill: '#9a6343' }, paper);
      shape('circle', { cx: width * (x + w / 2), cy: y + (height - top - 90) / 6, r: 9, fill: GOLD }, paper);
    }
  }
  // The drawer's opening over the kneehole, dark inside: the drawer itself is a box of its own that slides out of it.
  shape('rect', { x: width * .33, y: top + 30, width: width * .34, height: 70, fill: '#2b1d16' }, paper);
  shape('rect', { x: width * .33, y: top + 30, width: width * .34, height: 12, fill: '#1e140f' }, paper);
  // The kneehole's back panel, solid: a see-through shadow let the wall show through speckled with the paper's grain.
  shape('rect', { x: width * .33, y: top + 100, width: width * .34, height: height - top - 100, fill: TIMBER }, paper);
  shade(paper, width * .33, top + 100, width * .34, height - top - 100, .22);
  // The reply waiting in its letter rack: a back board, the envelope standing in the slot (only just leaning), a front
  // board with a scalloped top that hides the envelope's foot, and the rack's base on the desk.
  const [ox, oy, ox2, oy2] = box('outbox'), ocx = (ox + ox2) / 2, foot = oy2 - 30, lean = `rotate(-3 ${ocx} ${foot})`;
  shape('rect', { x: ox + 6, y: oy + 62, width: ox2 - ox - 12, height: oy2 - oy - 74, rx: 6, fill: '#7d4f33' }, paper);
  shape('rect', { x: ox + 14, y: oy + 30, width: ox2 - ox - 28, height: foot - oy - 30, rx: 5, fill: '#fffdf6', transform: lean }, paper);
  shape('path', { d: `M${ox + 14} ${oy + 36}L${ocx} ${oy + 74}L${ox2 - 14} ${oy + 36}`, fill: 'none', stroke: '#d9c9a8', 'stroke-width': 4, 'stroke-linejoin': 'round', transform: lean }, paper);
  shape('circle', { cx: ocx, cy: oy + 76, r: 9, fill: RED, transform: lean }, paper);
  shape('path', { d: `M${ox + 2} ${oy2 - 12}V${oy2 - 54}Q${ox + (ox2 - ox) * .25} ${oy2 - 66} ${ocx} ${oy2 - 58}Q${ox + (ox2 - ox) * .75} ${oy2 - 66} ${ox2 - 2} ${oy2 - 54}V${oy2 - 12}Z`, fill: WOOD }, paper);
  shape('rect', { x: ox - 4, y: oy2 - 14, width: ox2 - ox + 8, height: 14, rx: 4, fill: '#6b4430' }, paper);
  // The postmark stamp standing on its ink pad.
  const [sx, sy, sx2, sy2] = box('stamp'), scx = (sx + sx2) / 2;
  shape('rect', { x: sx, y: sy2 - 20, width: sx2 - sx, height: 20, rx: 5, fill: '#3b2a24' }, paper);
  shape('rect', { x: scx - 30, y: sy2 - 46, width: 60, height: 26, rx: 4, fill: '#8f3b36' }, paper);
  shape('rect', { x: scx - 10, y: sy + 30, width: 20, height: sy2 - sy - 76, fill: WOOD_LIT }, paper);
  shape('circle', { cx: scx, cy: sy + 26, r: 24, fill: WOOD }, paper);
  // The bundle of letters, tied with red string.
  const [lx, ly, lx2, ly2] = box('stack');
  for (let i = 0; i < 6; i++) shape('rect', { x: lx + (i % 2) * 10, y: ly2 - 16 - i * 13, width: lx2 - lx - 14, height: 16, rx: 3, fill: ['#fffdf6', '#f3e6c8', '#eadcc0'][i % 3], transform: `rotate(${(i % 3 - 1) * 2} ${(lx + lx2) / 2} ${ly2})` }, paper);
  shape('path', { d: `M${(lx + lx2) / 2 - 4} ${ly2 - 96}V${ly2}M${lx} ${ly2 - 44}H${lx2 - 8}`, stroke: RED, 'stroke-width': 5 }, paper);
  // The wax seal and a stick of red wax.
  const [wx, wy, wx2, wy2] = box('seal'), wcx = (wx + wx2) / 2;
  shape('rect', { x: wx, y: wy2 - 12, width: wx2 - wx, height: 12, rx: 6, fill: RED }, paper);
  shape('rect', { x: wcx - 12, y: wy + 30, width: 24, height: wy2 - wy - 46, rx: 10, fill: WOOD }, paper);
  shape('circle', { cx: wcx, cy: wy + 28, r: 16, fill: WOOD_LIT }, paper);
  shape('rect', { x: wcx - 18, y: wy2 - 26, width: 36, height: 16, rx: 5, fill: GOLD }, paper);
  // Tea in a red cup on its saucer, and two cookies left on a plate.
  const [cx, cy, cx2, cy2] = box('cup'), ccx = (cx + cx2) / 2;
  shape('ellipse', { cx: ccx, cy: cy2 - 6, rx: (cx2 - cx) / 2, ry: 10, fill: CREAM }, paper);
  shape('path', { d: `M${ccx - 34} ${cy + 40}H${ccx + 34}L${ccx + 26} ${cy2 - 10}H${ccx - 26}Z`, fill: RED }, paper);
  shape('path', { d: `M${ccx + 32} ${cy + 52}c22 0 22 30 0 30`, fill: 'none', stroke: RED, 'stroke-width': 8 }, paper);
  for (const dx of [-26, 4]) { shape('circle', { cx: ccx + dx - 70, cy: cy2 - 12, r: 15, fill: '#c08a5a' }, paper); shape('circle', { cx: ccx + dx - 73, cy: cy2 - 15, r: 3, fill: '#5b3a2c' }, paper); }
  for (const [x, h] of [[-10, 40], [8, 52]]) shape('path', { d: `M${ccx + x} ${cy + 30}c-8-${h / 3} 8-${h / 2} 0-${h}`, fill: 'none', stroke: '#fffdf6', 'stroke-width': 4, opacity: .6 }, paper);
  // The lamp with its cream shade (its glow is a sprite of the scene's).
  const [px, py, px2, py2] = box('lamp'), pcx = (px + px2) / 2;
  shape('ellipse', { cx: pcx, cy: py2 - 6, rx: (px2 - px) * .32, ry: 10, fill: GOLD }, paper);
  shape('rect', { x: pcx - 7, y: py + (py2 - py) * .42, width: 14, height: (py2 - py) * .58 - 8, fill: GOLD }, paper);
  shape('path', { d: `M${px} ${py + (py2 - py) * .45}L${px + (px2 - px) * .22} ${py}H${px2 - (px2 - px) * .22}L${px2} ${py + (py2 - py) * .45}Z`, fill: '#fbe9c2' }, paper);
}

// The desk drawer's pieces. Its front, in 200 units across: wood, a panel, holly carved either side of a brass keyhole
// plate; `key`: the little key stands in the keyhole once it has turned.
export function deskDrawerFront({ paper }, { width, height }, state = {}) {
  const g = shape('g', { transform: `scale(${width / 200})` }, paper), h = 200 * height / width;
  shape('rect', { x: 0, y: 0, width: 200, height: h, rx: 4, fill: '#9a6343' }, g);
  shape('rect', { x: 6, y: 5, width: 188, height: h - 10, rx: 3, fill: '#a86b47' }, g);
  shape('path', { d: `M7 6H193`, stroke: '#c08a5a', 'stroke-width': 1.4, opacity: .7 }, g);
  // The same holly sprig as on the little key's bow (cabin-items.js).
  for (const side of [-1, 1]) holly(g, 100 + side * 30, h / 2 + 2, .22, '#7d4f33', '#8f3b36');
  shape('rect', { x: 93, y: h / 2 - 8, width: 14, height: 16, rx: 3, fill: GOLD }, g);
  shape('path', { d: `M100 ${h / 2 - 4}a2 2 0 1 1 0 4l1 4h-2l1-4`, fill: '#3b2a24' }, g);
  if (!state.key) return;
  shape('rect', { x: 98.8, y: h / 2 - 11, width: 2.4, height: 9, fill: '#c48f32' }, g);
  shape('circle', { cx: 100, cy: h / 2 - 13, r: 4.2, fill: 'none', stroke: '#d9a441', 'stroke-width': 2.2 }, g);
}
// Its floor, seen from above (the front edge at the bottom): bare boards, darker toward the back, the brass-rimmed
// magnifier on the left (until it is taken: `taken`) and the rocker blotter on the right, both near the front so they show
// as it slides out.
export function deskDrawerInside({ paper }, { width, height }, state = {}) {
  const g = shape('g', { transform: `scale(${width / 100})` }, paper), h = 100 * height / width;
  shape('rect', { x: 0, y: 0, width: 100, height: h, fill: '#6b4430' }, g);
  shape('rect', { x: 0, y: 0, width: 100, height: h * .3, fill: '#553524' }, g);
  for (const x of [25, 50, 75]) shape('path', { d: `M${x} 0V${h}`, stroke: '#553524', 'stroke-width': .8 }, g);
  shape('path', { d: `M60 ${h * .62}Q74 ${h * .54} 88 ${h * .62}V${h * .74}Q74 ${h * .66} 60 ${h * .74}Z`, fill: '#8f5a3c' }, g);
  shape('rect', { x: 71, y: h * .6, width: 6, height: h * .06, rx: 2, fill: '#6b4430' }, g); shape('circle', { cx: 74, cy: h * .6, r: 3.4, fill: GOLD }, g);
  if (state.taken) return;
  shape('rect', { x: 30, y: h * .7, width: 22, height: 4, rx: 2, fill: '#8f5a3c', transform: `rotate(24 30 ${h * .7})` }, g);
  shape('circle', { cx: 26, cy: h * .66, r: 9, fill: '#cfe3ec', stroke: '#c48f32', 'stroke-width': 2.6 }, g);
  shape('path', { d: `M21 ${h * .63}q4 -4 9 -2`, fill: 'none', stroke: '#fffdf6', 'stroke-width': 1.6, opacity: .8 }, g);
}
// The music box drawer's front, in 200 units across: red lacquer, an engraved gold line, a gold pull; until the brass pin
// undoes it (`undone`), the catch lies across its edge with the pinhole beside it; undone, the catch hangs down.
export function musicDrawerFront({ paper }, { width, height }, state = {}) {
  const g = shape('g', { transform: `scale(${width / 200})` }, paper), h = 200 * height / width;
  shape('rect', { x: 0, y: 0, width: 200, height: h, rx: 4, fill: '#8a3530' }, g);
  shape('rect', { x: 8, y: 5, width: 184, height: h - 10, rx: 3, fill: '#a8423b' }, g);
  shape('path', { d: `M24 ${h / 2}H80M120 ${h / 2}H176`, stroke: GOLD, 'stroke-width': 1.4, opacity: .7 }, g);
  shape('rect', { x: 88, y: h / 2 - 5, width: 24, height: 10, rx: 5, fill: GOLD }, g);
  shape('circle', { cx: 186, cy: h / 2 + 4, r: 2.6, fill: '#2a1a14' }, g); shape('circle', { cx: 186, cy: h / 2 + 4, r: 4.4, fill: 'none', stroke: '#c9a24f', 'stroke-width': 1.4 }, g);
  if (state.undone) shape('rect', { x: 166, y: h - 9, width: 14, height: 7, rx: 2, fill: '#c9a24f', transform: `rotate(12 166 ${h - 9})` }, g);
  else { shape('rect', { x: 168, y: 0, width: 9, height: h * .78, rx: 2, fill: '#c9a24f' }, g); shape('circle', { cx: 172.5, cy: h * .6, r: 1.8, fill: '#6b5226' }, g); }
}
// Its floor, lined with dark red velvet: the brass comb and its pinned drum across it, and Nils's red paper star in front
// (until it is found: `empty`).
export function musicDrawerInside({ paper }, { width, height }, state = {}) {
  const g = shape('g', { transform: `scale(${width / 100})` }, paper), h = 100 * height / width;
  shape('rect', { x: 0, y: 0, width: 100, height: h, fill: '#6b2a2a' }, g);
  shape('rect', { x: 0, y: 0, width: 100, height: h * .3, fill: '#4f1d1d' }, g);
  shape('rect', { x: 12, y: h * .36, width: 52, height: h * .14, rx: 2, fill: '#c9a24f' }, g);
  for (let i = 0; i < 5; i++) shape('rect', { x: 16 + i * 9.5, y: h * .5, width: 4, height: h * .22, rx: 1, fill: '#e0b04f' }, g);
  if (state.empty) return;
  const cx = 80, cy = h * .66, r = Math.min(9, h * .26);
  shape('path', { d: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .45 : r; return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)}`; }).join('') + 'Z', fill: '#c63a33' }, g);
  shape('path', { d: `M${cx} ${cy - r}q-6 -2 -10 -${h * .1}`, fill: 'none', stroke: '#e0b04f', 'stroke-width': 1 }, g);
}
// The barn drawer's front, in 200 units across: weathered planks and an iron ring to pull it by.
export function barnDrawerFront({ paper }, { width, height }) {
  const g = shape('g', { transform: `scale(${width / 200})` }, paper), h = 200 * height / width;
  shape('rect', { x: 0, y: 0, width: 200, height: h, rx: 4, fill: '#a8774d' }, g);
  for (const y of [h * .34, h * .67]) shape('path', { d: `M4 ${y}H196`, stroke: '#8a5f3d', 'stroke-width': 2.4 }, g);
  for (const [x, y] of [[14, h * .2], [186, h * .2], [14, h * .82], [186, h * .82]]) shape('circle', { cx: x, cy: y, r: 3, fill: '#4a3a30' }, g);
  shape('circle', { cx: 100, cy: h * .42, r: 6, fill: '#3b302a' }, g);
  shape('circle', { cx: 100, cy: h * .62, r: 15, fill: 'none', stroke: '#3b302a', 'stroke-width': 5 }, g);
}
// Its floor from above: rough boards, a red and cream box of matches (until it is taken: `taken`), a folded note.
export function barnDrawerInside({ paper }, { width, height }, state = {}) {
  const g = shape('g', { transform: `scale(${width / 100})` }, paper), h = 100 * height / width;
  shape('rect', { x: 0, y: 0, width: 100, height: h, fill: '#5e3e29' }, g);
  shape('rect', { x: 0, y: 0, width: 100, height: h * .3, fill: '#4a2f20' }, g);
  for (const x of [33, 66]) shape('path', { d: `M${x} 0V${h}`, stroke: '#4a2f20', 'stroke-width': .8 }, g);
  shape('rect', { x: 56, y: h * .6, width: 28, height: h * .22, rx: 2, fill: '#fffdf6', transform: `rotate(-8 70 ${h * .7})` }, g);
  shape('path', { d: `M60 ${h * .66}h18M60 ${h * .72}h12`, stroke: '#3f5a7a', 'stroke-width': 1.2, transform: `rotate(-8 70 ${h * .7})` }, g);
  if (state.taken) return;
  shape('rect', { x: 14, y: h * .6, width: 30, height: h * .2, rx: 2, fill: '#b5443c', transform: `rotate(6 29 ${h * .7})` }, g);
  shape('rect', { x: 19, y: h * .64, width: 20, height: h * .11, rx: 1.5, fill: '#fbf3df', transform: `rotate(6 29 ${h * .7})` }, g);
}
// A drawer's side or back: plain wood of its colour, a lighter top edge.
export const drawerSide = colour => ({ paper }, { width, height }) => {
  shape('rect', { x: 0, y: 0, width, height, fill: colour }, paper);
  shape('rect', { x: 0, y: 0, width, height: Math.max(3, height * .12), fill: '#c08a5a', opacity: .5 }, paper);
};

export function treeLights({ plain }, { width, height }) {
  // Only the bulbs, drawn over the tree so they can twinkle on their own layer: glass bulbs on a little green cap, each with
  // a glint. They are glass, not paper, so they are drawn without the paper's cut rim (on so small a bulb the rim would
  // read as a blurred halo).
  for (let i = 0; i < 26; i++) {
    const t = noise(i + 7), y = 140 + t * (height - 280), half = (y - 80) / (height - 200) * width * .42, x = width / 2 + (noise(i + 31) * 2 - 1) * half;
    shape('rect', { x: x - 3.5, y: y - 13, width: 7, height: 5, rx: 1.5, fill: '#3f6653' }, plain);
    shape('ellipse', { cx: x, cy: y, rx: 6.5, ry: 9, fill: ['#ffd77a', '#ef6f5e', '#7fce9a', '#7cb8ec'][i % 4] }, plain);
    shape('ellipse', { cx: x - 2, cy: y - 3, rx: 1.8, ry: 3, fill: '#fffaf0', opacity: .75 }, plain);
  }
}

// A snowy fir board (see snowyFir in paper-props.js); the art fills the board from the bottom edge.
export function fir(variant) {
  return ({ paper }, { width, height }) => snowyFir(paper, width / 2, height - 10, height - 26, variant, width / height);
}

// Snowy foothills, paler and bluer the further away they are. Only soft rolling crests: at this distance a forest would
// flatten into streaks, so the trees are left to the few 3D firs nearby. Level 0 is nearest. They are drawn already hazy
// (their boards skip the fog): fogged, they turned the warm colour of the morning haze and read as a beige wall.
export function hills(level) {
  const snow = ['#f4f6f6', '#ecf1f3', '#e4ebef'][level], shade = ['#dfe8ee', '#d6e0e7', '#ccd8e2'][level];
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
export function stable({ paper }, { width, height }) {
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
  // The hayloft under the gable, with a few bales already stored.
  const loft = { x: cx - 74, y: peak + 70, w: 148, h: 104 };
  shape('rect', { x: loft.x - 10, y: loft.y - 10, width: loft.w + 20, height: loft.h + 14, fill: CREAM }, paper);
  shape('rect', { x: loft.x, y: loft.y, width: loft.w, height: loft.h, fill: '#4a2422' }, paper);
  for (const [x, y] of [[8, 56], [78, 56], [42, 12]]) {
    shape('rect', { x: loft.x + x, y: loft.y + y, width: 64, height: 42, rx: 12, fill: '#d9b36a' }, paper);
    shape('path', { d: `M${loft.x + x + 6} ${loft.y + y + 14}h52M${loft.x + x + 6} ${loft.y + y + 28}h52`, stroke: '#b98f48', 'stroke-width': 4 }, paper);
  }
  // The little drawer's opening in the wall at the hoist's foot (the drawer itself is a box that slides out of it).
  const [sx0, sy0, sx1, sy1] = DRAWERS.barn.slot;
  shape('rect', { x: width * sx0 - 8, y: height * sy0 - 8, width: width * (sx1 - sx0) + 16, height: height * (sy1 - sy0) + 12, rx: 4, fill: TIMBER }, paper);
  shape('rect', { x: width * sx0, y: height * sy0, width: width * (sx1 - sx0), height: height * (sy1 - sy0), fill: '#1e140f' }, paper);
}
// The hay hoist on the barn's face, left of the door (stable-board units: x from the board's middle, y up from the snow).
// A single pulley under the eave: one rope runs down to a bale, the other to a winch on the wall, so the bale rises
// exactly as far as the winch's spool winds in. At rest the bale sits on the snow, hiding a little drawer set in the wall.
export const HOIST = { x: -.9, wheel: 1.55, radius: .14, lift: .9, bale: [.5, .42] };
// The winch, under the pulley's other side: its spool's middle, the spool's radius (the rope winds on it, so the crank
// turns lift / spool radians from bottom to top), its plate, and the crank (hub to knob `arm`) that fits on its square
// hub. The crank is missing when the visitor first comes; a repair tag hangs below the plate (`tag`: size, then where).
export const WINCH = { x: HOIST.x + HOIST.radius + .07, y: .7, spool: .07, plate: [.3, .3], arm: .17, crank: [.08, .25], tag: [.17, .15], tagAt: [-.79, .57] };
export function hoistBracket({ paper }, { width, height }) {
  shape('rect', { x: width * .1, y: height * .2, width: width * .8, height: height * .22, rx: 6, fill: TIMBER }, paper);
  shape('path', { d: `M${width * .82} ${height * .42}V${height * .9}L${width * .3} ${height * .42}`, stroke: '#3b302a', 'stroke-width': 9, fill: 'none', 'stroke-linejoin': 'round' }, paper);
  shape('rect', { x: width * .44, y: height * .42, width: width * .12, height: height * .26, fill: '#3b302a' }, paper);
  shape('path', { d: `M${width * .08} ${height * .22}C${width * .3} ${height * .08} ${width * .7} ${height * .14} ${width * .92} ${height * .2}V${height * .26}H${width * .08}Z`, fill: SNOW }, paper);
}
export function hoistWheel({ paper }, { width, height }) {
  const c = width / 2, r = width * .44;
  shape('circle', { cx: c, cy: c, r, fill: '#a86b47' }, paper);
  shape('circle', { cx: c, cy: c, r: r * .78, fill: '#c39466' }, paper);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; shape('path', { d: `M${c} ${c}L${c + Math.cos(a) * r * .74} ${c + Math.sin(a) * r * .74}`, stroke: TIMBER, 'stroke-width': 8 }, paper); }
  shape('circle', { cx: c, cy: c, r: r * .2, fill: '#3b302a' }, paper);
  shape('circle', { cx: c + r * .4, cy: c - r * .3, r: r * .08, fill: GOLD }, paper);
}
export function hayBale({ paper }, { width, height }) {
  shape('rect', { x: 6, y: height * .18, width: width - 12, height: height * .8, rx: 26, fill: '#d9b36a' }, paper);
  for (let i = 0; i < 9; i++) { const x = 20 + noise(i + 70) * (width - 40); shape('path', { d: `M${x} ${height * .24}l${(noise(i + 4) - .5) * 30} ${height * .7}`, stroke: '#c49a52', 'stroke-width': 4, opacity: .7 }, paper); }
  for (const x of [.3, .7]) shape('rect', { x: width * x - 6, y: height * .18, width: 12, height: height * .8, fill: '#a8774d' }, paper);
  shape('path', { d: `M${width * .3} ${height * .2}L${width / 2} 6L${width * .7} ${height * .2}`, stroke: '#7d5636', 'stroke-width': 6, fill: 'none' }, paper);
  shape('circle', { cx: width / 2, cy: 10, r: 8, fill: 'none', stroke: '#3b302a', 'stroke-width': 5 }, paper);
  shape('path', { d: `M14 ${height * .24}C${width * .3} ${height * .12} ${width * .7} ${height * .16} ${width - 14} ${height * .26}V${height * .32}H14Z`, fill: SNOW }, paper);
}
// The winch: a bolted plate, an iron ratchet wheel with its pawl, the wooden spool with the rope wound on it, and in the
// middle the square hub the crank fits on (an empty socket until it is fitted).
export function hoistWinch({ paper }, { width, height }) {
  const c = width / 2;
  shape('rect', { x: width * .05, y: height * .05, width: width * .9, height: height * .9, rx: width * .12, fill: TIMBER }, paper);
  for (const [x, y] of [[.16, .16], [.84, .16], [.16, .84], [.84, .84]]) shape('circle', { cx: width * x, cy: height * y, r: width * .035, fill: '#3b302a' }, paper);
  let teeth = '';
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, b = (i + .55) / 14 * Math.PI * 2; teeth += `${i ? 'L' : 'M'}${c + Math.cos(a) * width * .3} ${c + Math.sin(a) * width * .3}L${c + Math.cos(b) * width * .37} ${c + Math.sin(b) * width * .37}`; }
  shape('path', { d: `${teeth}Z`, fill: '#5d554f' }, paper);
  shape('path', { d: `M${width * .93} ${height * .14}L${width * .7} ${height * .2}L${width * .78} ${height * .3}Z`, fill: '#3b302a' }, paper);
  shape('circle', { cx: c, cy: c, r: width * .27, fill: '#c39466' }, paper);
  for (const r of [.235, .2, .165]) shape('circle', { cx: c, cy: c, r: width * r, fill: 'none', stroke: '#b98a52', 'stroke-width': width * .028 }, paper);
  shape('circle', { cx: c, cy: c, r: width * .11, fill: '#8f5a3c' }, paper);
  // The socket: a square hole with a pale rim, so its shape shows from across the yard.
  shape('rect', { x: c - width * .075, y: c - width * .075, width: width * .15, height: width * .15, rx: width * .012, fill: '#e3c08a' }, paper);
  shape('rect', { x: c - width * .05, y: c - width * .05, width: width * .1, height: width * .1, fill: '#241a16' }, paper);
}
// The winch's crank, the wooden handle found in the snow, seen from the front as it turns: the block with its square
// tenon over the hub (at the top of the sheet), the arm, and the grip seen end on (at the bottom).
export function hoistCrank({ paper }, { width, height }) {
  const c = width / 2, hub = width / 2, knob = height - width / 2;
  shape('rect', { x: c - width * .2, y: hub, width: width * .4, height: knob - hub, rx: width * .14, fill: '#a8774d' }, paper);
  shape('path', { d: `M${c} ${hub + width * .3}V${knob - width * .3}`, stroke: '#8f5a3c', 'stroke-width': width * .06, opacity: .6 }, paper);
  shape('rect', { x: c - width * .36, y: hub - width * .36, width: width * .72, height: width * .72, rx: width * .1, fill: '#6b4a33' }, paper);
  shape('rect', { x: c - width * .14, y: hub - width * .14, width: width * .28, height: width * .28, fill: '#3b2a24' }, paper);
  shape('circle', { cx: c, cy: knob, r: width * .44, fill: '#c08a5a' }, paper);
  shape('circle', { cx: c, cy: knob, r: width * .3, fill: '#8f5a3c' }, paper);
}
// The repair tag on a loop of string from the winch's plate: a manila tag with a few lines in pencil and a little
// drawing of the crank (it says the crank is to be put back before the winch is used: cabin-pulley.js reads it out).
export function hoistTag({ paper }, { width, height }) {
  shape('path', { d: `M${width * .06} ${height * .02}C${width * .1} ${height * .2} ${width * .16} ${height * .3} ${width * .22} ${height * .42}`, fill: 'none', stroke: '#9c8a6e', 'stroke-width': width * .025, 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M${width * .28} ${height * .22}L${width * .95} ${height * .26}L${width * .93} ${height * .96}L${width * .26} ${height * .92}L${width * .08} ${height * .58}Z`, fill: '#e6cf9c' }, paper);
  shape('circle', { cx: width * .22, cy: height * .58, r: height * .05, fill: '#8f7556' }, paper);
  for (const [y, w] of [[.42, .55], [.56, .6], [.7, .34]]) shape('path', { d: `M${width * .34} ${height * y}q${width * w * .25} ${-height * .03} ${width * w * .5} 0t${width * w * .5} 0`, fill: 'none', stroke: '#6f5a48', 'stroke-width': height * .035, 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M${width * .72} ${height * .76}h${width * .12}v${height * .1}`, fill: 'none', stroke: '#b5443c', 'stroke-width': height * .035, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, paper);
  shape('circle', { cx: width * .84, cy: height * .87, r: height * .035, fill: '#b5443c' }, paper);
}
// The drawer behind the bale, set in the barn wall. Shut, its front and a knob; pulled out (`state.open`), its inside
// shows: a folded note, and the matchbox beside it until it has been taken (`state.matches`).
export function snowman({ paper }, { width, height }) {
  // Only the snowman himself: what he wears is laid over him in four places by the wardrobe game (cabin-wardrobe.js).
  const cx = width / 2, ground = height - 8, ball = (cy, r) => { shape('circle', { cx, cy, r, fill: SNOW }, paper); shape('path', { d: `M${cx + r * .3} ${cy - r * .95}A${r} ${r} 0 0 1 ${cx + r * .3} ${cy + r * .95}A${r * 1.3} ${r * 1.3} 0 0 0 ${cx + r * .3} ${cy - r * .95}Z`, fill: '#d9e5ec' }, paper); };
  const r1 = width * .36, r2 = width * .27, r3 = width * .2, y1 = ground - r1, y2 = y1 - r1 - r2 * .7, y3 = y2 - r2 - r3 * .7;
  for (const side of [-1, 1]) shape('path', { d: `M${cx + side * r2 * .8} ${y2}l${side * width * .28} ${-height * .1}m${-side * width * .1} ${height * .04}l${side * width * .06} ${-height * .05}`, stroke: '#6b4a33', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, paper);
  ball(y1, r1); ball(y2, r2); ball(y3, r3);
  for (const dx of [-.35, .3]) shape('circle', { cx: cx + r3 * dx, cy: y3 - r3 * .3, r: r3 * .1, fill: '#3b2a24' }, paper);
  for (const dy of [-.45, 0, .45]) shape('circle', { cx, cy: y1 + r1 * dy - r1 * .1, r: r1 * .08, fill: '#3b2a24' }, paper);
}
// The reindeer's feeding trough, just behind him on his right: a plank box on crossed legs, heaped with hay. Fed
// (`state.eaten`), the hay is pushed about, and at the end he stood over a little gold shows in it until it is taken
// (`state.taken`). The care log hangs on a twig in the hay all along (cabin-feed.js reads it).
export const TROUGH = { x: REINDEER.x - .42, z: REINDEER.z - .42, w: .95, h: .46, turn: -.3 };
// Where the care log hangs on the trough, as parts of the sheet [left, top, right, bottom] (cabin-feed.js taps it there).
export const CARE_LOG = [.25, .03, .47, .37];
// The care log: a slip on a red string from a twig stuck in the hay, a pencilled heading and today's line, and an older
// line in O.'s gold with an O. after it, then two more in pencil.
function careLog(paper, [left, top, right, bottom]) {
  const w = right - left, h = bottom - top, at = (x, y) => `${left + w * x} ${top + h * y}`, gold = SUBSTITUTES.find(([mark]) => mark === 'O')[1];
  shape('path', { d: `M${at(.52, 1.25)}L${at(.56, .02)}`, stroke: '#8a6a45', 'stroke-width': 8, 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M${at(.04, .2)}L${at(.97, .25)} ${at(.94, .98)} ${at(0, .92)}Z`, fill: '#fbf3df' }, paper);
  shape('path', { d: `M${at(.1, .24)}L${at(.56, .05)} ${at(.9, .28)}`, stroke: '#ad3c3b', 'stroke-width': 3.5, fill: 'none', 'stroke-linejoin': 'round' }, paper);
  for (const [x, y] of [[.1, .24], [.9, .28]]) shape('circle', { cx: left + w * x, cy: top + h * y, r: 4, fill: '#ad3c3b' }, paper);
  const line = (x0, x1, y, colour, thick) => shape('path', { d: `M${at(x0, y)}Q${at((x0 + x1) / 2, y - .05)} ${at(x1, y + .01)}`, stroke: colour, 'stroke-width': thick, fill: 'none', 'stroke-linecap': 'round' }, paper);
  line(.3, .7, .38, '#6c7178', 4.5); line(.12, .62, .54, gold, 5); line(.12, .86, .7, '#6c7178', 3.5); line(.12, .6, .84, '#6c7178', 3.5);
  shape('path', { d: `M${at(.78, .49)}c-6 -8 -16 0 -10 8s14 2 10 -8M${at(.88, .57)}h0`, stroke: gold, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, paper);
}
export function trough({ paper }, { width, height }, state = {}) {
  const rim = height * .36, bottom = height * .74, straw = (x, y, length, lean) => shape('path', { d: `M${x} ${y}l${lean} ${-length}`, stroke: '#c49a52', 'stroke-width': 4, 'stroke-linecap': 'round' }, paper);
  for (const x of [.15, .85]) shape('path', { d: `M${width * (x - .07)} ${height - 4}L${width * (x + .05)} ${bottom - 6}M${width * (x + .07)} ${height - 4}L${width * (x - .05)} ${bottom - 6}`, stroke: TIMBER, 'stroke-width': 13, 'stroke-linecap': 'round' }, paper);
  if (!state.eaten) {
    shape('path', { d: `M${width * .05} ${rim + 10}C${width * .1} ${height * .02} ${width * .3} ${height * .06} ${width * .42} ${height * .1}C${width * .55} ${-4} ${width * .8} ${height * .04} ${width * .95} ${rim + 10}Z`, fill: '#d9b36a' }, paper);
    careLog(paper, CARE_LOG.map((at, i) => at * (i % 2 ? height : width)));
    for (let i = 0; i < 14; i++) straw(width * (.1 + noise(i + 40) * .8), rim + 4, 24 + noise(i + 41) * 40, (noise(i + 42) - .5) * 40);
  } else {
    shape('path', { d: `M${width * .05} ${rim + 10}C${width * .08} ${height * .12} ${width * .25} ${height * .1} ${width * .4} ${height * .2}C${width * .5} ${height * .26} ${width * .58} ${rim - 2} ${width * .66} ${rim + 10}Z`, fill: '#d9b36a' }, paper);
    shape('path', { d: `M${width * .86} ${rim + 10}C${width * .88} ${rim - 22} ${width * .93} ${rim - 18} ${width * .95} ${rim + 10}Z`, fill: '#d9b36a' }, paper);
    careLog(paper, CARE_LOG.map((at, i) => at * (i % 2 ? height : width)));
    for (let i = 0; i < 8; i++) straw(width * (.1 + noise(i + 50) * .5), rim + 4, 14 + noise(i + 51) * 26, (noise(i + 52) - .5) * 40);
    for (const [x, y, r] of [[.7, rim - 3, 5], [.76, rim - 1, 4], [.63, rim - 5, 3.5]]) shape('circle', { cx: width * x, cy: y, r, fill: '#b9cfa8' }, paper);
    if (!state.taken) {
      const kx = width * .8, ky = rim - 26;
      shape('path', { d: `M${kx + 12} ${ky + 14}L${kx + 40} ${rim + 6}`, stroke: '#c48f32', 'stroke-width': 10, 'stroke-linecap': 'round' }, paper);
      shape('circle', { cx: kx, cy: ky, r: 18, fill: 'none', stroke: '#d9a441', 'stroke-width': 10 }, paper);
      shape('path', { d: `M${kx - 13} ${ky - 6}a14 14 0 0 1 12 -8`, fill: 'none', stroke: '#f4d58a', 'stroke-width': 4, 'stroke-linecap': 'round' }, paper);
    }
    for (let i = 0; i < 5; i++) straw(width * (.7 + noise(i + 60) * .22), rim + 4, 10 + noise(i + 61) * 14, (noise(i + 62) - .5) * 30);
  }
  shape('path', { d: `M${width * .02} ${rim}H${width * .98}L${width * .92} ${bottom}H${width * .08}Z`, fill: WOOD_LIT }, paper);
  shape('path', { d: `M${width * .05} ${(rim + bottom) / 2}H${width * .95}`, stroke: WOOD, 'stroke-width': 4, opacity: .7 }, paper);
  for (const x of [.2, .8]) shape('rect', { x: width * x - 5, y: rim, width: 10, height: bottom - rim, fill: '#5d554f' }, paper);
  shape('path', { d: `M${width * .02} ${rim + 2}C${width * .2} ${rim - 10} ${width * .5} ${rim - 4} ${width * .7} ${rim - 8}C${width * .85} ${rim - 10} ${width * .95} ${rim - 4} ${width * .98} ${rim + 2}V${rim + 9}H${width * .02}Z`, fill: SNOW }, paper);
}
// A drift at the snowman's feet, a little too round, with the end of a wooden handle sticking out of it (the winch's
// crank, cabin-pulley.js). Dug (`state.dug`), it is a scuffed hollow with the snow thrown aside.
export const PILE = { x: -4.82, z: -1.5, w: .62, h: .3, turn: .35 };
export function snowPile({ paper }, { width, height }, state = {}) {
  const ground = height - 4;
  if (state.dug) {
    shape('ellipse', { cx: width * .5, cy: ground - 10, rx: width * .3, ry: 12, fill: '#cfdbe4' }, paper);
    for (const [x, w, h] of [[.12, .2, .32], [.78, .22, .4], [.62, .1, .2], [.3, .08, .16]]) shape('path', { d: `M${width * (x - w / 2)} ${ground}C${width * (x - w / 3)} ${ground - height * h} ${width * (x + w / 3)} ${ground - height * h} ${width * (x + w / 2)} ${ground}Z`, fill: SNOW }, paper);
    return;
  }
  shape('path', { d: `M${width * .56} ${height * .62}L${width * .74} ${height * .2}`, stroke: '#a8774d', 'stroke-width': 16, 'stroke-linecap': 'round' }, paper);
  shape('ellipse', { cx: width * .76, cy: height * .17, rx: 12, ry: 6.5, fill: '#8f5a3c', transform: `rotate(-66 ${width * .76} ${height * .17})` }, paper);
  shape('path', { d: `M${width * .02} ${ground}C${width * .12} ${height * .5} ${width * .38} ${height * .44} ${width * .55} ${height * .52}C${width * .75} ${height * .6} ${width * .92} ${height * .7} ${width * .98} ${ground}Z`, fill: SNOW }, paper);
  shape('path', { d: `M${width * .5} ${height * .54}C${width * .72} ${height * .6} ${width * .9} ${height * .72} ${width * .98} ${ground}H${width * .72}C${width * .74} ${height * .8} ${width * .66} ${height * .64} ${width * .5} ${height * .54}Z`, fill: '#dbe5ec' }, paper);
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
// The mailbox. While a letter from Santa waits inside, its flag stands up: a piece of its own (`mailboxFlag`, waved in the
// scene) so the box is drawn here without it. `open`: the door down and the flag lowered; `read`: shut again, the flag
// still lowered.
export function mailbox({ paper }, { width, height }, state = {}) {
  const cx = width / 2;
  shape('rect', { x: cx - 14, y: 230, width: 28, height: height - 230, fill: WOOD }, paper);
  shape('path', { d: `M${cx - 110} 240V140C${cx - 110} 80 ${cx + 110} 80 ${cx + 110} 140V240Z`, fill: RED }, paper);
  if (state.open) {
    shape('path', { d: `M${cx - 96} 236V150C${cx - 96} 104 ${cx + 96} 104 ${cx + 96} 150V236Z`, fill: '#4a2422' }, paper);
    shape('path', { d: `M${cx - 110} 240L${cx - 150} 300H${cx + 70}L${cx + 110} 240Z`, fill: '#87302f' }, paper);
  } else shape('path', { d: `M${cx - 110} 140C${cx - 110} 80 ${cx + 110} 80 ${cx + 110} 140`, stroke: '#87302f', 'stroke-width': 10, fill: 'none' }, paper);
  shape('path', { d: `M${cx - 120} 110C${cx - 80} 60 ${cx + 80} 60 ${cx + 120} 110C${cx + 60} 96 ${cx - 60} 96 ${cx - 120} 110Z`, fill: SNOW }, paper);
  if (state.open) { shape('rect', { x: cx + 96, y: 150, width: 14, height: 80, fill: GOLD }, paper); shape('rect', { x: cx + 96, y: 210, width: 50, height: 20, fill: GOLD }, paper); }
  else if (state.read) { shape('rect', { x: cx + 96, y: 150, width: 14, height: 80, fill: GOLD }, paper); shape('rect', { x: cx + 96, y: 210, width: 50, height: 20, fill: GOLD }, paper); star(paper, cx, 190, 28, GOLD); }
  else star(paper, cx, 190, 28, GOLD);
}
// The mailbox's flag, raised, 60 × 158 art units: its pole and the gold flag at the top (the pole's foot is the pivot).
export const MAIL_FLAG = { w: .12, h: .316, pivot: 13 / 60, at: [.206, .49, .006] };
export function mailboxFlag({ paper }, { width, height }) {
  const g = shape('g', { transform: `scale(${width / 60})` }, paper), h = 60 * height / width;
  shape('rect', { x: 6, y: 6, width: 14, height: h - 6, fill: GOLD }, g);
  shape('rect', { x: 6, y: 6, width: 50, height: 26, rx: 2, fill: GOLD }, g);
  shape('path', { d: 'M8 10H54', stroke: '#f4d58a', 'stroke-width': 3, opacity: .7 }, g);
}
// The sleigh beside the reindeer; loaded (`state.loaded`, the volunteer job done), four sacks of presents stand on its
// rack one on another, the first stop's on top.
export function sleigh({ paper }, { width, height }, state = {}) {
  const ground = height - 16;
  if (state.loaded) {
    // Behind the seat, from the bottom up: Toronto, Reykjavík, Tokyo, Taipei (cabin-sleigh.js SACKS colours).
    [['#b98a3c', .52, 186], ['#3f5a7a', .56, 238], ['#3f6653', .52, 288], ['#b5443c', .56, 336]].forEach(([tag, x, lift]) => {
      const cx = width * x, top = ground - lift;
      shape('path', { d: `M${cx - 58} ${top + 52}Q${cx - 66} ${top + 18} ${cx - 40} ${top + 8}H${cx + 40}Q${cx + 66} ${top + 18} ${cx + 58} ${top + 52}Z`, fill: '#c9a46a' }, paper);
      shape('path', { d: `M${cx - 30} ${top + 12}Q${cx} ${top + 20} ${cx + 30} ${top + 12}`, fill: 'none', stroke: RED, 'stroke-width': 5, 'stroke-linecap': 'round' }, paper);
      shape('rect', { x: cx - 18, y: top + 24, width: 36, height: 18, rx: 3, fill: tag }, paper);
    });
  }
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

// The seat, seen from above (its top edge against the chair's back): a wooden frame round the same green cushion as the
// back and sides, piped in cream and buttoned, a little shaded where it meets the back. Shown only while Santa is out
// (cabin-scene.js): the empty chair had nothing between its back and front legs.
export function chairSeat({ paper }, { width, height }) {
  shape('rect', { x: 4, y: 4, width: width - 8, height: height - 8, rx: 26, fill: WOOD_LIT }, paper);
  shape('rect', { x: 26, y: 18, width: width - 52, height: height - 44, rx: 34, fill: '#5f8a70' }, paper);
  shape('rect', { x: 40, y: 32, width: width - 80, height: height - 72, rx: 26, fill: 'none', stroke: CREAM, 'stroke-width': 5, opacity: .75 }, paper);
  for (const [x, y] of [[.33, .4], [.67, .4], [.5, .62]]) shape('circle', { cx: width * x, cy: height * y, r: 7, fill: '#4a6f5a' }, paper);
  shade(paper, 26, 18, width - 52, 34, .18);
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

const wall = (id, w, h, at, extra) => ({ id, w, h, at, kind: 'wall', ...extra });
// A piece drawn in its wall's own art units (as it was drawn on the wall), cut out as a sheet of its own: `box` is its place.
const fromWall = ([x0, y0], draw) => ({ paper }, size, state = {}) => draw(shape('g', { transform: `translate(${-x0} ${-y0})` }, paper), state);
// A round window high in a gable: a green frame, the morning sky and snow, its cross bars.
function gableWindow(parent, ox, oy, r) {
  const glass = r * .77;
  shape('circle', { cx: ox, cy: oy, r, fill: GREEN }, parent);
  shape('circle', { cx: ox, cy: oy, r: r * .88, fill: 'none', stroke: DEEP_GREEN, 'stroke-width': 3, opacity: .6 }, parent);
  shape('circle', { cx: ox, cy: oy, r: glass, fill: '#cfe3ee' }, parent);
  shape('path', { d: `M${ox - glass * .96} ${oy + glass * .27}C${ox - glass * .3} ${oy} ${ox + glass * .3} ${oy + glass * .24} ${ox + glass * .99} ${oy + glass * .1}A${glass} ${glass} 0 0 1 ${ox - glass * .96} ${oy + glass * .27}Z`, fill: SNOW }, parent);
  shape('path', { d: `M${ox} ${oy - glass}V${oy + glass}M${ox - glass} ${oy}H${ox + glass}`, stroke: GREEN, 'stroke-width': r * .12 }, parent);
}
// The front door's frame inside, with a garland of fir, lights and holly draped over its top (as over the door outside).
function doorFrame(parent) {
  const width = HOUSE.width * PX, height = HOUSE.ridge * PX, w = DOOR.width * PX, x = width / 2 - w / 2, y = height - DOOR.height * PX;
  shape('path', { d: `M${x - 30} ${height}V${y - 30}H${x + w + 30}V${height}ZM${x} ${height}V${y}H${x + w}V${height}Z`, fill: WOOD_LIT, 'fill-rule': 'evenodd' }, parent);
  shape('path', { d: `M${x - 30} ${y - 30}H${x + w + 30}`, stroke: WOOD, 'stroke-width': 6 }, parent);
  swag(parent, x - 50, x + w + 50, y - 34, 18);
}
// A sheet hung on a room wall: `box` is where it is drawn on that wall's own picture ([left, top, right, bottom], in the
// wall's art units), `out` how far it stands off the wall. Centred on its box, or hung from its top (`hang`: it can sway),
// or standing on its bottom edge (`stand`: on a shelf).
const WALLS = { back: [HOUSE.width, HOUSE.ridge], 'front-in': [HOUSE.width, HOUSE.ridge], left: [HOUSE.depth, HOUSE.wall], right: [HOUSE.depth, HOUSE.wall] };
// `pad`: a margin (art units) left round the drawing, so the paper's rim and shadow are never cut off at the sheet's edge
// (none along the bottom of what stands on a shelf or the floor: `stand`, `floor`).
function onWall(side, box, { out = .012, hang = false, stand = false, floor = false, pad = 0, ...extra } = {}) {
  const below = stand || floor ? 0 : pad, [x0, y0, x1, y1] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + below];
  const [width, height] = WALLS[side], u = (x0 + x1) / 2 / PX - width / 2, v = height - (hang ? y0 : stand ? y1 : (y0 + y1) / 2) / PX;
  const at = { back: [u, v, BACK + out], 'front-in': [-u, v, HOUSE.depth / 2 - out], left: [-HOUSE.width / 2 + out, v, -u], right: [HOUSE.width / 2 - out, v, u] }[side];
  const turn = { back: 0, 'front-in': Math.PI, left: Math.PI / 2, right: -Math.PI / 2 }[side];
  return { w: (x1 - x0) / PX, h: (y1 - y0) / PX, at, turn, room: true, decor: true, margin: [pad, below], ...(hang ? { hang: true } : stand ? {} : { center: true }), ...extra };
}
// A drawing made for its box, laid inside its sheet's margin.
const inMargin = ({ draw, margin: [pad, below] }) => !pad ? draw : ({ plain, paper, svg }, { width, height }, state) => {
  const shift = { transform: `translate(${pad} ${pad})` };
  return draw({ plain: shape('g', shift, plain), paper: shape('g', shift, paper), svg }, { width: width - pad * 2, height: height - pad - below }, state);
};
// A window on a wall: its view (with the snow falling past it, cabin-scene.js), its frame and garland over that, and the
// garland's bulbs, which twinkle. `glass` is the pane's place on the wall, `box` the whole frame's.
function wallWindow(side, glass, box) {
  const [x0, y0, x1, y1] = box, frame = { glass: [(glass[0] - x0) / (x1 - x0), (glass[1] - y0) / (y1 - y0), (glass[2] - x0) / (x1 - x0), (glass[3] - y0) / (y1 - y0)] };
  return [
    { id: `decor-${side}-view`, ...onWall(side, glass, { out: .008 }), detail: 1.8, snowfall: true, draw: windowView },
    { id: `decor-${side}-frame`, ...onWall(side, box, { out: .016, pad: 30 }), detail: 2, draw: windowFrame(frame) },
    { id: `decor-${side}-lights`, ...onWall(side, box, { out: .019, pad: 30 }), detail: 1.4, twinkle: true, draw: windowLights(frame) },
  ];
}
// The room's wall decorations (cabin-decor.js), each cut finer than its wall so it stays crisp up close. The advent house's
// windows lit for the day are laid over it in the scene (`advent`); the candle flames flicker (`candle`).
export const DECOR = ([
  ...wallWindow('left', [560, 210, 860, 510], [505, 150, 915, 560]),
  ...wallWindow('right', [150, 230, 410, 490], [100, 160, 460, 535]),
  ...wallWindow('front-in', [175, 660, 425, 910], [125, 595, 475, 950]),
  { id: 'decor-advent', ...onWall('left', [630, 372, 790, 527], { out: .028, stand: true, pad: 14 }), detail: 3, advent: ADVENT_WINDOWS, draw: adventHouseSheet },
  { id: 'decor-calendar', ...onWall('left', [120, 290, 260, 500], { hang: true, sway: true, pad: 14 }), detail: 3, draw: calendar },
  { id: 'decor-bunting', ...onWall('left', [60, 130, 500, 250], { hang: true, sway: true, pad: 16 }), detail: 2, draw: snowflakeBunting },
  { id: 'decor-picture', ...onWall('back', [70, 570, 290, 780], { out: .014, pad: 16 }), detail: 2.6, draw: framedReindeer },
  { id: 'decor-wreath', ...onWall('back', [713, 920, 895, 1166], { out: .016, hang: true, sway: true, pad: 22 }), detail: 2.6, draw: doorWreath },
  // Over the coat pegs, clear of the door's frame and the window.
  { id: 'decor-photo', ...onWall('front-in', [1185, 585, 1325, 700], { out: .014, pad: 14 }), detail: 2.6, draw: framedSleigh },
  // The gables' round windows (the back one under a gold star), the back wall's arched door (its wreath hangs on it), the
  // front door's frame and garland, and the coat pegs by it (the red coat gone while Santa is out: `coat: false`).
  { id: 'decor-gable-back', ...onWall('back', [700, 105, 900, 500], { out: .006, pad: 10 }), detail: 1.6, draw: fromWall([700, 105], parent => { gableWindow(parent, 800, 405, 86); star(parent, 800, 150, 34, GOLD); }) },
  { id: 'decor-gable-front', ...onWall('front-in', [714, 320, 886, 490], { out: .006, pad: 10 }), detail: 1.6, draw: fromWall([714, 320], parent => gableWindow(parent, 800, 405, 76)) },
  { id: 'decor-arched-door', ...onWall('back', [660, 850, 950, 1500], { out: .006, floor: true, pad: 10 }), detail: 1.4, draw: fromWall([660, 850], parent => archedDoor(parent, 690, 880, 228, 1500)) },
  { id: 'decor-door', ...onWall('front-in', [590, 640, 1010, 1500], { out: .008, floor: true, pad: 30 }), detail: 1.6, draw: fromWall([590, 640], doorFrame) },
  { id: 'decor-coat', ...onWall('front-in', [1040, 700, 1475, 1500], { out: .01, floor: true, pad: 10 }), detail: 1.7, state: {}, draw: fromWall([1040, 700], (parent, state) => coatPegs(parent, 1070, 720, 390, 1486, state.coat !== false)) },
  { id: 'decor-candles', ...onWall('right', [575, 360, 700, 470], { out: .05, stand: true, pad: 12 }), detail: 3, draw: candles },
  { id: 'decor-flame-a', ...onWall('right', [598, 352, 626, 394], { out: .052, stand: true, pad: 8 }), detail: 3, candle: true, draw: candleFlame },
  { id: 'decor-flame-b', ...onWall('right', [646, 373, 674, 415], { out: .052, stand: true, pad: 8 }), detail: 3, candle: true, draw: candleFlame },
  { id: 'decor-jar', ...onWall('right', [755, 340, 865, 470], { out: .05, stand: true, pad: 14 }), detail: 3, draw: cookieJar },
]).map(board => ({ ...board, draw: inMargin(board) }));
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
  // Its inside face is seen close up from the room: cut finer than the walls.
  { id: 'door-in', w: DOOR.width, h: DOOR.height, at: [DOOR.width / 2, 0, -.012], turn: Math.PI, rig: 'door', kind: 'wall', detail: 1.8, draw: doorInside },
  { id: 'floor', w: HOUSE.width, h: HOUSE.depth, at: [0, 0, 0], flat: 'floor', draw: floor, kind: 'floor', room: true },
  { id: 'roof-in-left', roof: 'left', layer: 'inner', w: HOUSE.slope, h: HOUSE.depth, draw: roofInside, kind: 'floor', room: true },
  { id: 'roof-in-right', roof: 'right', layer: 'inner', w: HOUSE.slope, h: HOUSE.depth, draw: roofInside, kind: 'floor', room: true },
  { id: 'roof-out-left', roof: 'left', layer: 'outer', w: HOUSE.slope + HOUSE.eaves, h: HOUSE.depth + HOUSE.overhang * 2, draw: roofOutside, kind: 'floor' },
  { id: 'roof-out-right', roof: 'right', layer: 'outer', w: HOUSE.slope + HOUSE.eaves, h: HOUSE.depth + HOUSE.overhang * 2, draw: roofOutside, kind: 'floor' },
  { id: 'garland', w: HOUSE.width + HOUSE.eaves * 2.6, h: 1.42, at: [0, HOUSE.wall - .26, HOUSE.depth / 2 + HOUSE.overhang + .03], draw: roofGarland },
  { id: 'lantern', w: .3, h: .56, at: [LANTERN.x, HOUSE.ridge, LANTERN.z], hang: true, draw: lantern, room: true },
  // The bookcase's painted back hangs on its hinge; the fireplace and its flames are cut finer, as they are seen up close.
  { id: 'bookshelf', w: BOOKCASE.width, h: BOOKCASE.height, px: 900, at: [BOOKCASE.width / 2, 0, 0], rig: 'bookcase', draw: bookcaseBack, room: true },
  { id: 'fireplace', w: 1.05, h: 1.14, at: [FIRE.x, 0, BACK + .08], detail: 2, draw: fireplace, room: true },
  { id: 'flames', w: .36, h: .28, at: [FIRE.x, .09, BACK + .12], detail: 2, draw: flames, flame: true, room: true },
  // The hearth's own things: firewood in a basket, up to three logs burning on the grate (placed by the scene as the fire
  // is fed), and the bellows on their hinge.
  { id: 'log-basket', w: .34, h: .27, px: 900, at: [.47, 0, BACK + .42], draw: logBasket, room: true },
  { id: 'hearth-log', w: .24, h: .075, px: 1200, at: [FIRE.x, .1, BACK + .14], clones: 3, draw: hearthLog, room: true },
  { id: 'bellows-leather', w: .2, h: .32, px: 1100, at: [0, 0, 0], rig: 'bellows', draw: bellowsLeather, room: true },
  { id: 'bellows-left', w: .13, h: .4, px: 1100, at: [0, 0, .004], rig: 'bellows', draw: bellowsPaddle, room: true },
  { id: 'bellows-right', w: .13, h: .4, px: 1100, at: [0, 0, .008], rig: 'bellows', mirror: true, draw: bellowsPaddle, room: true },
  // Free-standing in the room, so they turn to face you wherever you stand: from the side they would be a sliver of paper.
  // The tree is seen up close: cut finer than the room, and like the wall decorations only fetched on the way in.
  { id: 'tree', w: .74, h: 1.36, at: [1.25, 0, .55], draw: tree, room: true, billboard: true, detail: 2.2, decor: true },
  { id: 'tree-lights', w: .74, h: 1.36, at: [1.25, 0, .55], draw: treeLights, twinkle: true, room: true, billboard: true, nudge: .01, detail: 2.2, decor: true },
  { id: 'desk', w: DESK.w, h: DESK.h, px: 1400, at: [DESK.x, 0, DESK.z], turn: Math.PI / 2, draw: desk, room: true },
  // The music box on its rigs (the box, its lid and key; the turning scene), and the snow globe on the mantel.
  { id: 'musicbox-lid', w: .25, h: .15, px: 1800, at: [0, .1, -.075], rig: 'musicbox', draw: musicBoxLid, room: true },
  { id: 'musicbox-body', w: MUSICBOX.body[0], h: MUSICBOX.body[1], px: 1800, at: [0, 0, 0], rig: 'musicbox', draw: musicBoxBody, room: true },
  { id: 'musicbox-key', w: .07, h: .05, px: 1800, at: [.095, .07, .008], rig: 'musicbox', center: true, draw: musicBoxKey, room: true },
  { id: 'musicbox-scene', w: .13, h: .11, px: 1800, at: [0, 0, 0], rig: 'turntable', clones: 2, draw: musicBoxScene, room: true },
  { id: 'musicbox-bookmarks', w: BOOKMARKS.w, h: BOOKMARKS.h, px: 1800, at: [0, BOOKMARKS.rest, BOOKMARKS.z], rig: 'musicbox', clones: 2, draw: musicBookmarks, room: true },
  { id: 'snowglobe', w: GLOBE.w, h: GLOBE.h, px: 1800, at: [GLOBE.x, GLOBE.y, GLOBE.z], draw: snowGlobe, room: true },
  { id: 'chair-back', w: .82, h: 1.12, at: [0, 0, -.3], draw: chairBack, chair: true },
  { id: 'chair-left', w: .9, h: 1.0, at: [-.38, 0, -.04], turn: -Math.PI / 2, mirror: true, draw: chairSide, chair: true },
  { id: 'chair-right', w: .9, h: 1.0, at: [.38, 0, -.04], turn: Math.PI / 2, draw: chairSide, chair: true },
  { id: 'chair-front', w: .82, h: .44, at: [0, 0, .2], draw: chairFront, chair: true },
  { id: 'chair-seat', w: .74, h: .5, at: [0, .335, -.04], flat: 'seat', draw: chairSeat, chair: true },
  // The little room behind the bookcase (`secret`: drawn only once it is open): name tags on its left wall, the shift
  // log and hats on its right, the substitutes' table at the back, a sorting rack low on the right. Each stands 3 cm off
  // its wall: its paper edge, 1.2 cm behind it, would otherwise lie in the wall's plane and flicker.
  { id: 'secret-tags', w: .66, h: .42, px: 1200, at: [SECRET.left + SECRET.wall + .03, .6, -HOUSE.depth / 2 - .55], turn: Math.PI / 2, draw: nameTags, room: true, secret: true },
  { id: 'secret-desk', w: .7, h: .62, px: 1200, at: [SECRET.left + SECRET.width / 2, 0, -HOUSE.depth / 2 - SECRET.depth + .05], draw: secretDesk, room: true, secret: true },
  { id: 'secret-log', w: .26, h: .34, px: 1300, at: [SECRET.left + SECRET.width - SECRET.wall - .03, .62, -HOUSE.depth / 2 - .42], turn: -Math.PI / 2, draw: shiftLog, room: true, secret: true },
  { id: 'secret-hats', w: .5, h: .3, px: 1100, at: [SECRET.left + SECRET.width - SECRET.wall - .03, .9, -HOUSE.depth / 2 - .9], turn: -Math.PI / 2, draw: hatPegs, room: true, secret: true },
  { id: 'secret-rack', w: .5, h: .44, px: 1100, at: [SECRET.left + SECRET.width - SECRET.wall - .03, .08, -HOUSE.depth / 2 - .85], turn: -Math.PI / 2, draw: sortingRack, room: true, secret: true },
  // Shown only while Santa is out (cabin-scene.js), standing on the seat against the chair's back.
  { id: 'chair-note', w: .18, h: .13, px: 1400, at: [0, .34, -.24], draw: chairNote, chair: true },
  // One low ridge of snowy foothills; the far mountain ranges behind it are in cabin-world.js.
  { id: 'hills-near', w: 80, h: 2.8, px: 22, at: [0, GROUND, -19], draw: hills(0), kind: 'scenery', fog: false },
  // Firs: one board per variant, planted at each [x, z, height]. Each tree turns to face the camera, so its outline stays clean from any side.
  // The second half of each list stands around the fair, the wishing corner and the coast (cabin-world.js).
  { id: 'fir-a', w: 1, h: 2, draw: fir(0), copies: [[-3.9, -3.2, 3.1], [4.4, -3.6, 3.3], [-11, -11, 4.2], [-20.5, -5.5, 4.6], [-23, 7, 5], [-6.9, 10.6, 2.3], [9.6, 1.4, 3.2], [-17.5, 22, 4.6]] },
  { id: 'fir-b', w: 1, h: 2, draw: fir(1), copies: [[-5.1, -4.4, 2.4], [12, -14, 4.4], [-4.6, -10, 4.6], [-13.4, -4.4, 3.6], [-25, 2, 4.4], [7.6, 16.8, 3.4], [-10.4, 19.4, 3.2]] },
  { id: 'fir-c', w: 1, h: 2, draw: fir(2), copies: [[3.2, -4.9, 2.2], [-6.6, -2.2, 2], [9, -7, 3], [-7.6, -.6, 2.4], [-12.5, 19.5, 4.2], [6.8, 6.2, 2.4]] },
  { id: 'sign', w: 2.1, h: 1.3, at: [SIGN.x, SIGN.top, SIGN.z], hang: true, sway: true, draw: nameSign, state: { stars: 0 } },
  { id: 'mailbox', w: .5, h: .95, at: [SIGN.x, GROUND, SIGN.z + .45], draw: mailbox, state: {} },
  { id: 'sleigh', w: 1.3, h: .8, at: [3.15, GROUND, -.2], turn: -.35, draw: sleigh },
  { id: 'fence', w: 2.4, h: .7, at: [-5, GROUND, -2.5], turn: .3, draw: fence },
  { id: 'pond', w: 3.6, h: 1.8, at: [-5.6, GROUND, -4.6], flat: 'ground', draw: pond },
  { id: 'hoofprints', w: 4.4, h: 1.2, at: [4.2, GROUND, -.6], flat: 'ground', turn: .5, draw: hoofprints },
  { id: 'stable', w: 3.4, h: 2.7, at: [7.4, GROUND, -7], turn: -.45, draw: stable },
  { id: 'path', w: 10, h: 1.6, at: [5.2, GROUND, -2.4], flat: 'ground', turn: -1.05, draw: path },
  { id: 'lamp-near', w: .55, h: 2.2, at: [4.1, GROUND, -1.2], turn: -.4, draw: lampPost },
  { id: 'lamp-far', w: .55, h: 2.2, at: [5.3, GROUND, -4.9], turn: -.45, draw: lampPost },
  { id: 'cane-near', w: .3, h: .95, at: [5, GROUND, -3], turn: -.4, draw: candyCane },
  { id: 'cane-far', w: .3, h: .95, at: [5.9, GROUND, -6.1], turn: -.45, draw: candyCane },
  { id: 'snowman', w: .9, h: 1.4, at: [-5.4, GROUND, -1.2], turn: .35, draw: snowman },
  { id: 'snow-pile', w: PILE.w, h: PILE.h, px: 900, at: [PILE.x, GROUND, PILE.z], turn: PILE.turn, draw: snowPile, state: {} },
  { id: 'trough', w: TROUGH.w, h: TROUGH.h, px: 900, at: [TROUGH.x, GROUND, TROUGH.z], turn: TROUGH.turn, draw: trough, state: {} },
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
  // The room's wall decorations (above).
  ...DECOR,
];
export const SMOKE = { w: .55, h: .4, draw: smokePuff };

// The corners of the yard you can step up to. `box` is the tap target [centre, size]; `view` is where the camera goes.
export const SPOTS = [
  { id: 'mailbox', name: '郵筒', box: [[SIGN.x, .45, SIGN.z + .45], [.8, 1.1, .6]], view: { target: [SIGN.x, .75, SIGN.z + .45], distance: 3, pitch: .1, yaw: .28 } },
  { id: 'reindeer', name: '麋鹿', box: [[REINDEER.x, .55, REINDEER.z], [1.3, 1.4, 1.2]], view: { target: [REINDEER.x, .62, REINDEER.z], distance: 3.4, pitch: .1, yaw: -.12 } },
  { id: 'snowman', name: '雪人', box: [[-5.4, .55, -1.2], [1.1, 1.5, .8]], view: { target: [-5.4, .82, -1.2], distance: 3.5, pitch: .06, yaw: .32, aside: .42, tallDrop: .62, tallDistance: 6.9 } },
  { id: 'stable', name: '馴鹿小屋', box: [[7.4, 1.2, -7], [3.6, 2.8, 1.4]], view: { target: [7.05, .95, -7.05], distance: 4.4, pitch: .08, yaw: -.05, tallDistance: 6.4 } },
];

// Places in the room the camera steps up to, for things to do there with your own hands (cabin-play.js). The hearth's
// target stops below the mantel, so the snow globe on it can be tapped on its own. `fov`/`tallFov`
// and `distance`/`tallDistance` are for a wide and a tall screen; a negative `tallDrop` looks higher on a tall one. The
// bookcase is looked at from close in: the rocking chair, turned toward the visitor, has its side across the floor behind.
export const ROOM_SPOTS = [
  { id: 'hearth', name: '壁爐', box: [[FIRE.x + .1, .34, BACK + .25], [1.3, .68, .5]], view: { target: [FIRE.x + .02, .36, BACK + .25], distance: 1.4, pitch: .2, yaw: -.06, tallDistance: 1.75, tallFov: 74, tallDrop: -.2 } },
  { id: 'desk', name: '書桌', box: [[DESK.x - .22, .7, DESK.z], [.5, 1.1, DESK.w]], view: { target: [DESK.x - .12, .82, DESK.z], distance: 1.05, pitch: .42, yaw: 1.33, tallDistance: 1.35, tallFov: 70 } },
  { id: 'musicbox', name: '音樂盒', box: [[MUSICBOX.x - .02, MUSICBOX.y + .12, MUSICBOX.z], [.26, .34, .4]], view: { target: [MUSICBOX.x, MUSICBOX.y + .1, MUSICBOX.z], distance: .78, pitch: .28, yaw: -Math.PI / 2, tallDistance: .82, tallFov: 54 } },
  { id: 'globe', name: '雪花球', box: [[GLOBE.x, GLOBE.y + GLOBE.h / 2, GLOBE.z], [.22, .26, .2]], view: { target: [GLOBE.x, GLOBE.y + .09, GLOBE.z], distance: .62, pitch: .1, yaw: 0, tallDistance: .8, tallFov: 56 } },
  { id: 'secret', name: '書櫃後的小房間', box: [[SECRET.left + SECRET.width / 2, SECRET.height / 2, -HOUSE.depth / 2 - .05], [SECRET.width, SECRET.height, .2]], view: { target: [SECRET.left + SECRET.width / 2, .6, -HOUSE.depth / 2 - .85], distance: .95, pitch: .22, yaw: .02, fov: 62, tallDistance: .95, tallFov: 84, turn: .6, tilt: .2 } },
  { id: 'shelf', name: '書櫃', box: [[BOOKCASE.left + BOOKCASE.width / 2, .7, BACK + .15], [BOOKCASE.width, BOOKCASE.height, .3]], view: { target: [BOOKCASE.left + BOOKCASE.width / 2, .66, BOOKCASE.z + .2], distance: 1.05, pitch: .1, yaw: .06, fov: 40, tallDistance: 1.05, tallFov: 78, open: { target: [SECRET.left + SECRET.width * .62, .7, BOOKCASE.z + .15], yaw: .55 } } },
];

// Things in the room that answer a tap with a line of their own. `box` is the tap target [centre, size]; the door takes you out.
export const ROOM_PROPS = [
  { id: 'santa', name: '聖誕老人', note: '聖誕老人朝你點點頭：「外面很冷吧？在火爐邊暖暖身子。」' },
  { id: 'door', name: '大門', box: [[0, DOOR.height / 2, DOOR.z], [DOOR.width, DOOR.height, .3]] },
  { id: 'back-door', name: '後門', box: [[0, .62, BACK + .05], [.5, 1.24, .12]], note: '後門通往後院的玩具工坊，明年的禮物已經開始做了。' },
  { id: 'tree', name: '聖誕樹', box: [[1.3, .68, .62], [.56, 1.36, .4]], note: '屋裡的聖誕樹掛著彩燈，一閃一閃。' },
  { id: 'window', name: '窗台', box: [[-1.55, 1.12, .08], [.15, .75, .75]], note: '窗台上的降臨小屋，十二月每過一天就多亮一扇窗。' },
  { id: 'coat', name: '掛衣架', box: [[-.9, 1.05, HOUSE.depth / 2 - .08], [.85, 1, .2]], note: '門邊掛著一件紅外套、帽子和圍巾，靴子還沾著雪。' },
];
