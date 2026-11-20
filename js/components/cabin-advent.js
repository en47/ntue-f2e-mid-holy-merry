// The advent house on the window sill, up close (data/cabin-advent.js, services/cabin-advent.js): walking up to it, it
// pops up like a page in a pop-up book into an advent calendar box. Inside a red paper box, under a night sky with the
// moon, stands a paper house in the snow, presents in front of it and drawers in the box's foot; its twenty-four doors
// are all sorts and sizes, numbered out of order as on a real calendar: three baubles hanging in the sky, windows in the
// gable and on both floors, a little iron door in the chimney, the big front door (24), presents whose fronts fall open,
// drawers whose fronts drop down. Today's and the days before can be opened: the door turns on its own hinge and the
// picture inside shows, its line written beside the box. A day still to come only rattles. Before December it says when
// it opens; from Christmas on every door opens. Doors once opened stay open (the save's `advent`).
// The box is in layers set one in front of another (sky, house, snow, box), each cut once from paper; it leans a little
// toward the pointer, so the layers part. Beside it a card says the day (see `card` below). Under reduced motion nothing
// pops, leans, swings, twinkles or falls.
import { paperLayer, shape } from './paper-art.js';
import { adventPicture } from './cabin-clue-art.js';
import { ADVENT, WINDOWS } from '../data/cabin-advent.js';
import { daysOpen, today } from '../services/cabin-advent.js';

const W = 600, H = 860, PAPER = { paper: { scale: .55, grain: .45, shadow: .28 }, eager: true };
const RED = '#b5443c', RED_DARK = '#8f3530', GREEN = '#3f6653', GREEN_DARK = '#2f5240', GOLD = '#e0b04f', GOLD_DARK = '#b98a3c', CREAM = '#fbf3df', SNOW = '#fbf8f1';
const WALL = '#ecdcc0', TIMBER = '#7a5236', NIGHT = '#22324a', INSIDE = '#4a3428', SLATE = '#7b95a6', WOOD = '#a8774d', WOOD_DARK = '#6b4a33', IRON = '#4b3f3a';
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const line = (d, stroke, g, width = 3) => shape('path', { d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);

// The twenty-four doors on a 600 × 860 box: [day, kind, x, y, w, h, layer, hinge, colour]. `hinge`: which way it opens
// (on its left or right side, or falling forward from its foot). The front door is Christmas Eve's.
export const SLOTS = [
  [1, 'bauble', 170, 46, 72, 72, 'sky', 'left', RED], [7, 'bauble', 46, 198, 70, 70, 'sky', 'left', GREEN], [17, 'bauble', 492, 44, 76, 76, 'sky', 'right', GOLD],
  [23, 'chimney', 407, 124, 66, 70, 'house', 'left', IRON],
  [18, 'round', 254, 176, 92, 92, 'house', 'left', RED], [6, 'window', 162, 270, 74, 68, 'house', 'left', GREEN], [11, 'window', 364, 270, 74, 68, 'house', 'right', RED],
  [2, 'window', 112, 354, 72, 104, 'house', 'left', RED], [14, 'window', 204, 364, 72, 72, 'house', 'left', GREEN], [9, 'round', 326, 364, 72, 72, 'house', 'right', GREEN], [20, 'window', 416, 354, 72, 104, 'house', 'right', RED],
  [4, 'window', 112, 496, 100, 82, 'house', 'left', GREEN], [24, 'arch', 250, 472, 100, 168, 'house', 'left', RED], [16, 'window', 388, 496, 100, 82, 'house', 'right', GREEN],
  [12, 'present', 34, 604, 90, 82, 'front', 'down', RED], [3, 'present', 132, 622, 76, 66, 'front', 'down', SLATE], [21, 'present', 396, 622, 76, 66, 'front', 'down', GOLD], [8, 'present', 480, 600, 88, 86, 'front', 'down', GREEN],
  [13, 'drawer', 32, 718, 84, 116, 'frame', 'down', WOOD], [5, 'drawer', 124, 718, 84, 116, 'frame', 'down', WOOD], [19, 'drawer', 216, 718, 84, 116, 'frame', 'down', WOOD],
  [10, 'drawer', 308, 718, 84, 116, 'frame', 'down', WOOD], [22, 'drawer', 400, 718, 84, 116, 'frame', 'down', WOOD], [15, 'drawer', 492, 718, 84, 116, 'frame', 'down', WOOD],
].map(([day, kind, x, y, w, h, layer, hinge, colour]) => ({ day, kind, x, y, w, h, layer, hinge, colour }));
const ROUND = new Set(['bauble', 'round']);
// Where a door's opening is cut: dark inside, a little lighter at the foot.
function hole(g, { kind, x, y, w, h }) {
  if (ROUND.has(kind)) { shape('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2, fill: INSIDE }, g); shape('path', { d: `M${x + w * .12} ${y + h * .62}A${w / 2} ${h / 2} 0 0 0 ${x + w * .88} ${y + h * .62}Z`, fill: '#5e4434' }, g); return; }
  const top = kind === 'arch' ? `M${x} ${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}` : `M${x} ${y + 4}Q${x} ${y} ${x + 4} ${y}H${x + w - 4}Q${x + w} ${y} ${x + w} ${y + 4}`;
  shape('path', { d: `${top}V${y + h}H${x}Z`, fill: INSIDE }, g);
  shape('rect', { x, y: y + h * .7, width: w, height: h * .3, fill: '#5e4434' }, g);
}

// The night sky inside the box: the moon, stars, a few snowflakes, and the cords the baubles hang on.
function sky(g) {
  shape('rect', { x: 28, y: 28, width: 544, height: 672, rx: 8, fill: NIGHT }, g);
  shape('path', { d: 'M28 500Q300 450 572 500V700H28Z', fill: '#2c4060' }, g);
  shape('path', { d: 'M100 66A40 40 0 1 0 142 132A32 32 0 1 1 100 66Z', fill: '#f3e6b8' }, g);
  for (const [x, y, r] of [[262, 52, 5], [330, 70, 3.5], [420, 54, 4], [470, 160, 3], [530, 250, 4.5], [70, 300, 3.5], [130, 170, 3], [240, 150, 2.6], [372, 98, 2.6], [548, 380, 3], [40, 420, 2.6], [560, 150, 2.4]]) {
    shape('path', { d: `M${x} ${y - r * 2.2}L${x + r * .5} ${y - r * .5}L${x + r * 2.2} ${y}L${x + r * .5} ${y + r * .5}L${x} ${y + r * 2.2}L${x - r * .5} ${y + r * .5}L${x - r * 2.2} ${y}L${x - r * .5} ${y - r * .5}Z`, fill: r > 3.5 ? GOLD : CREAM }, g);
  }
  for (const slot of SLOTS.filter(each => each.layer === 'sky')) {
    line(`M${slot.x + slot.w / 2} 28V${slot.y + 4}`, '#d9c79f', g, 2);
    hole(g, slot);
    shape('rect', { x: slot.x + slot.w / 2 - 9, y: slot.y - 6, width: 18, height: 12, rx: 3, fill: GOLD_DARK }, g);
  }
}

// The house: chimney, gable wall and its window, eaves heavy with snow and strung with lights, the timbered walls, every
// window framed in cream with a sill, a window box under each ground-floor window, the front door's step.
function house(g) {
  shape('rect', { x: 396, y: 112, width: 88, height: 168, fill: '#9c5a44' }, g);
  for (let row = 0; row < 8; row++) line(`M396 ${124 + row * 20}H484`, '#7f4636', g, 1.5);
  shape('rect', { x: 389, y: 100, width: 102, height: 18, rx: 8, fill: SNOW }, g);
  shape('path', { d: 'M92 334L300 122 508 334Z', fill: WALL }, g);
  shape('rect', { x: 92, y: 330, width: 416, height: 312, fill: WALL }, g);
  for (const d of ['M92 342H508', 'M92 474H508', 'M92 330V642', 'M508 330V642', 'M300 132V176', 'M240 642L240 474', 'M360 642L360 474']) line(d, TIMBER, g, 7);
  line('M92 474L150 342M508 474L450 342', TIMBER, g, 5);
  shape('path', { d: 'M44 346L300 86 556 346H520L300 124 80 346Z', fill: RED }, g);
  shape('path', { d: 'M44 346L300 86 556 346H536Q470 270 300 104Q130 270 64 346Z', fill: SNOW }, g);
  for (let i = 0; i < 9; i++) shape('path', { d: `M${78 + i * 26} ${336 - i * 25.5}l4 13 4-13Z`, fill: SNOW }, g);
  const bulbs = [RED, GOLD, GREEN, '#9fc3d8'];
  for (let i = 0; i < 15; i++) { const t = (i + .5) / 15, x = 70 + t * 460, y = t < .5 ? 336 - t * 2 * 220 : 116 + (t - .5) * 2 * 220; shape('circle', { cx: x, cy: y + 14, r: 5, fill: bulbs[i % 4] }, g); }
  line('M70 350Q185 238 300 128Q415 238 530 350', GREEN_DARK, g, 2);
  for (const slot of SLOTS.filter(each => each.layer === 'house')) {
    const { kind, x, y, w, h } = slot;
    if (kind === 'chimney') { shape('rect', { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: 4, fill: '#6b3a2c' }, g); hole(g, slot); continue; }
    if (ROUND.has(kind)) shape('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2 + 9, fill: CREAM }, g);
    else if (kind === 'arch') shape('path', { d: `M${x - 10} ${y + h}V${y + w / 2}A${w / 2 + 10} ${w / 2 + 10} 0 0 1 ${x + w + 10} ${y + w / 2}V${y + h}Z`, fill: TIMBER }, g);
    else shape('rect', { x: x - 8, y: y - 8, width: w + 16, height: h + 16, rx: 5, fill: CREAM }, g);
    hole(g, slot);
    if (kind === 'window') shape('rect', { x: x - 12, y: y + h + 6, width: w + 24, height: 9, rx: 4, fill: '#d9c39a' }, g);
    if (kind === 'window' && y > 480) { shape('rect', { x: x - 4, y: y + h + 15, width: w + 8, height: 16, rx: 3, fill: WOOD }, g); for (let i = 0; i < 5; i++) shape('circle', { cx: x + 6 + i * (w - 12) / 4, cy: y + h + 15, r: 6, fill: i % 2 ? RED : GREEN }, g); }
  }
  shape('rect', { x: 236, y: 640, width: 128, height: 12, rx: 4, fill: '#c9b48e' }, g);
}

// The snow in front of the house, a path to the door, two little firs; each present's inside and its lid and bow, over the
// front that falls open.
function front(g) {
  shape('path', { d: 'M28 616Q110 594 200 612T360 610Q450 592 572 612V700H28Z', fill: SNOW }, g);
  for (let i = 0; i < 5; i++) shape('ellipse', { cx: 288 + (i % 2) * 24, cy: 664 + i * 7, rx: 6, ry: 3.4, fill: '#dfe7ee' }, g);
  for (const [x, size] of [[214, 1], [380, .8]]) { shape('path', { d: `M${x} ${560 - 70 * size}L${x + 30 * size} ${620}H${x - 30 * size}Z`, fill: GREEN }, g); shape('path', { d: `M${x} ${560 - 70 * size}L${x + 16 * size} ${590 - 40 * size}H${x - 16 * size}Z`, fill: SNOW }, g); }
  for (const slot of SLOTS.filter(each => each.layer === 'front')) {
    const { x, y, w, colour } = slot;
    hole(g, slot);
    shape('rect', { x: x - 5, y: y - 16, width: w + 10, height: 18, rx: 3, fill: colour === GOLD ? GOLD_DARK : colour }, g);
    shape('rect', { x: x + w / 2 - 6, y: y - 16, width: 12, height: 18, fill: colour === RED ? GOLD : RED }, g);
    shape('path', { d: `M${x + w / 2} ${y - 16}C${x + w / 2 - 22} ${y - 40} ${x + w / 2 - 26} ${y - 10} ${x + w / 2} ${y - 16}C${x + w / 2 + 22} ${y - 40} ${x + w / 2 + 26} ${y - 10} ${x + w / 2} ${y - 16}Z`, fill: colour === RED ? GOLD : RED }, g);
  }
}

// The box itself: a red paper frame with a gold edge round the night inside, holly in its top corners, and in its foot a
// row of drawers.
function frame(g) {
  shape('path', { d: `M0 10Q0 0 10 0H${W - 10}Q${W} 0 ${W} 10V${H - 10}Q${W} ${H} ${W - 10} ${H}H10Q0 ${H} 0 ${H - 10}ZM28 36Q28 28 36 28H564Q572 28 572 36V692Q572 700 564 700H36Q28 700 28 692Z`, fill: RED, 'fill-rule': 'evenodd' }, g);
  shape('path', { d: 'M28 36Q28 28 36 28H564Q572 28 572 36V692Q572 700 564 700H36Q28 700 28 692Z', fill: 'none', stroke: GOLD, 'stroke-width': 5 }, g);
  shape('rect', { x: 14, y: 706, width: W - 28, height: 140, rx: 8, fill: RED_DARK }, g);
  line(`M20 712H${W - 20}`, GOLD, g, 3);
  for (const [x, flip] of [[24, 1], [W - 24, -1]]) {
    for (const turn of [-30, 40]) shape('path', { d: 'M0 0C10-10 26-8 34 0 26 8 10 10 0 0Z', fill: GREEN, transform: `translate(${x} 24) scale(${flip} 1) rotate(${turn})` }, g);
    for (const [dx, dy] of [[4, 4], [11, 2], [7, 10]]) shape('circle', { cx: x + dx * flip, cy: 24 + dy, r: 4.5, fill: '#c63a33' }, g);
  }
  for (const slot of SLOTS.filter(each => each.layer === 'frame')) { shape('rect', { x: slot.x - 4, y: slot.y - 4, width: slot.w + 8, height: slot.h + 8, rx: 6, fill: '#6f2a25' }, g); hole(g, slot); }
}

// Each door's face, drawn for its own size: a shutter with a heart cut in it, a round porthole, the arched front door
// with its wreath, the chimney's iron door, a present's front with its ribbon, a drawer's front, a glass bauble.
const FACES = {
  window(g, w, h, colour) {
    shape('rect', { x: 0, y: 0, width: w, height: h, rx: 4, fill: colour }, g);
    for (let i = 1; i < 4; i++) line(`M${w * i / 4} 6V${h - 6}`, '#00000022', g, 2);
    shape('path', { d: `M${w / 2} ${h * .36}c-${w * .14}-${w * .1}-${w * .16} ${w * .05} 0 ${w * .13}c${w * .16}-${w * .08} ${w * .14}-${w * .23} 0-${w * .13}Z`, fill: '#3b2a2466' }, g);
  },
  round(g, w, h, colour) {
    shape('circle', { cx: w / 2, cy: h / 2, r: w / 2, fill: colour }, g);
    shape('circle', { cx: w / 2, cy: h / 2, r: w / 2 - 5, fill: 'none', stroke: GOLD, 'stroke-width': 3 }, g);
  },
  arch(g, w, h, colour) {
    shape('path', { d: `M0 ${h}V${w / 2}A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2}V${h}Z`, fill: colour }, g);
    for (let i = 1; i < 4; i++) line(`M${w * i / 4} ${i === 2 ? 8 : 18}V${h - 4}`, '#00000022', g, 2);
    for (const y of [h * .38, h * .82]) line(`M2 ${y}H${w * .3}`, GOLD_DARK, g, 5);
    shape('circle', { cx: w * .82, cy: h * .62, r: 4.5, fill: GOLD }, g);
    shape('circle', { cx: w / 2, cy: h * .3, r: w * .2, fill: 'none', stroke: GREEN, 'stroke-width': w * .1 }, g);
    for (const [dx, dy] of [[-.14, -.1], [.12, -.12], [-.04, .17]]) shape('circle', { cx: w / 2 + w * dx, cy: h * .3 + w * dy, r: 3.2, fill: '#c63a33' }, g);
  },
  chimney(g, w, h, colour) {
    shape('rect', { x: 0, y: 0, width: w, height: h, rx: 5, fill: colour }, g);
    for (const [x, y] of [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]) shape('circle', { cx: x, cy: y, r: 2.6, fill: '#8a7a70' }, g);
    shape('circle', { cx: w * .8, cy: h * .52, r: 4, fill: '#c9b8a8' }, g);
  },
  present(g, w, h, colour) {
    shape('rect', { x: 0, y: 0, width: w, height: h, rx: 3, fill: colour }, g);
    shape('rect', { x: w / 2 - 6, y: 0, width: 12, height: h, fill: colour === RED ? GOLD : RED }, g);
    shape('path', { d: `M${w * .54} ${h * .46}h${w * .42}v${h * .4}h-${w * .42}Z`, fill: CREAM }, g);
  },
  drawer(g, w, h, colour) {
    shape('rect', { x: 0, y: 0, width: w, height: h, rx: 5, fill: colour }, g);
    shape('rect', { x: 6, y: 6, width: w - 12, height: h - 12, rx: 3, fill: 'none', stroke: WOOD_DARK, 'stroke-width': 2 }, g);
    shape('rect', { x: w * .2, y: h * .16, width: w * .6, height: h * .3, rx: 3, fill: CREAM }, g);
    shape('path', { d: `M${w * .3} ${h * .72}Q${w / 2} ${h * .86} ${w * .7} ${h * .72}`, fill: 'none', stroke: GOLD_DARK, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  },
  bauble(g, w, h, colour) {
    shape('circle', { cx: w / 2, cy: h / 2, r: w / 2, fill: colour }, g);
    shape('path', { d: `M${w * .06} ${h * .44}Q${w / 2} ${h * .6} ${w * .94} ${h * .44}`, fill: 'none', stroke: colour === GOLD ? RED : GOLD, 'stroke-width': 4 }, g);
    shape('ellipse', { cx: w * .32, cy: h * .28, rx: w * .1, ry: w * .06, fill: '#ffffff88', transform: `rotate(-35 ${w * .32} ${h * .28})` }, g);
  },
};
// A door's back, plain kraft in its own shape; and the gold paper star stuck by today's door.
function back(g, kind, w, h) {
  if (ROUND.has(kind)) shape('circle', { cx: w / 2, cy: h / 2, r: w / 2, fill: '#e6d3ad' }, g);
  else if (kind === 'arch') shape('path', { d: `M0 ${h}V${w / 2}A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2}V${h}Z`, fill: '#e6d3ad' }, g);
  else shape('rect', { x: 0, y: 0, width: w, height: h, rx: 4, fill: '#e6d3ad' }, g);
}
const todayStar = g => shape('path', { d: 'M20 2L25 14 38 15 28 23 31 36 20 29 9 36 12 23 2 15 15 14Z', fill: GOLD, stroke: CREAM, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
const LAYERS = [['sky', sky], ['house', house], ['front', front], ['frame', frame]];

// Beside the box stands its lid, its inside turned out, kept plain: kraft board as the inside of a box lid is, inside a
// muted red rim (the box's own red would be too much beside it), a sprig of holly in each top corner, the title along
// its top, and a cream sheet taped inside with a tear-off calendar page for the day (it flips over when another day is
// shown), the day's line, its picture, the way to Intro as a red tag when there is one, and how many doors are open.
// Tall beside the box on a wide screen (320 × 560), wide under it (or beside it, held sideways) otherwise (360 × 168):
// both are cut, the layout shows one.
const RIM = '#9e5047', BOARD = '#dcc6a2', BOARD_SHADE = '#c9ae86';
function holly(g, x, y, flip = 1) {
  for (const turn of [-30, 40]) shape('path', { d: 'M0 0C8-8 21-6 27 0 21 6 8 8 0 0Z', fill: GREEN, transform: `translate(${x} ${y}) scale(${flip} 1) rotate(${turn})` }, g);
  for (const [dx, dy] of [[3, 3], [9, 1.5], [6, 8]]) shape('circle', { cx: x + dx * flip, cy: y + dy, r: 3.6, fill: '#c63a33' }, g);
}
const tape = (g, x, y, turn) => shape('rect', { x: -15, y: -5.5, width: 30, height: 11, rx: 1, fill: '#e9cf8f', opacity: .9, transform: `translate(${x} ${y}) rotate(${turn})` }, g);
function lidTall(g) {
  shape('rect', { x: 0, y: 0, width: 320, height: 560, rx: 12, fill: RIM }, g);
  shape('rect', { x: 11, y: 11, width: 298, height: 538, rx: 7, fill: BOARD }, g);
  shape('path', { d: 'M11 18Q11 11 18 11H302Q309 11 309 18V24H11Z', fill: BOARD_SHADE }, g);
  shape('rect', { x: 32, y: 70, width: 256, height: 452, rx: 3, fill: CREAM }, g);
  tape(g, 42, 74, -30); tape(g, 278, 74, 30);
  holly(g, 26, 28); holly(g, 294, 28, -1);
}
function lidWide(g) {
  shape('rect', { x: 0, y: 0, width: 360, height: 168, rx: 10, fill: RIM }, g);
  shape('rect', { x: 8, y: 8, width: 344, height: 152, rx: 6, fill: BOARD }, g);
  shape('rect', { x: 18, y: 18, width: 324, height: 136, rx: 3, fill: CREAM }, g);
  tape(g, 26, 22, -26); tape(g, 334, 22, 26);
}
function calendarPage(g) {
  shape('rect', { x: 8, y: 12, width: 70, height: 78, rx: 5, fill: '#e2d4b8' }, g); shape('rect', { x: 4, y: 9, width: 70, height: 78, rx: 5, fill: '#efe4cc' }, g);
  shape('rect', { x: 0, y: 6, width: 70, height: 78, rx: 5, fill: '#fffdf6' }, g);
  shape('path', { d: 'M0 11Q0 6 5 6H65Q70 6 70 11V26H0Z', fill: RED }, g);
  for (const x of [20, 50]) { shape('circle', { cx: x, cy: 8, r: 4, fill: '#3b2a24' }, g); shape('rect', { x: x - 2, y: 0, width: 4, height: 10, rx: 2, fill: '#8a7a70' }, g); }
  shape('path', { d: 'M52 70c4-6 12-6 14-2-4 2-10 6-14 2Zm0 0c-6-2-8 4-6 8 2-2 6-6 6-8Z', fill: GREEN }, g); shape('circle', { cx: 54, cy: 71, r: 2.6, fill: '#c63a33' }, g);
}
export function adventGame({ layer, stage, cabin, sound, progress, save }) {
  const date = today(), open = daysOpen(date), december = date.getMonth() === 11 && date.getDate() <= WINDOWS.length;
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = element('div', 'advent-scene', layer), box = element('section', 'advent-box', scene); box.setAttribute('aria-label', ADVENT.title);
  const tilt = element('div', 'advent-tilt', box);
  for (const [name, draw] of LAYERS) paperLayer(element('div', `advent-layer is-${name}`, tilt), `0 0 ${W} ${H}`, '', draw, PAPER);
  const side = element('aside', 'advent-side', scene); side.setAttribute('aria-label', ADVENT.title);
  paperLayer(side, '0 0 320 560', 'advent-lid is-tall', lidTall, PAPER); paperLayer(side, '0 0 360 168', 'advent-lid is-wide', lidWide, PAPER);
  element('h3', 'advent-title', side, ADVENT.title);
  const page = element('div', 'advent-page', side);
  paperLayer(page, '0 0 80 92', '', calendarPage, PAPER); element('span', 'advent-month', page, '12 月'); const shownDay = element('span', 'advent-date', page);
  const note = element('p', 'advent-note', side); note.setAttribute('aria-live', 'polite');
  const art = element('span', 'advent-art', side); art.setAttribute('aria-hidden', 'true');
  const foot = element('div', 'advent-foot', side), link = element('a', 'advent-link', foot); link.href = 'intro.html'; link.hidden = true;
  const count = element('p', 'advent-count', side);
  const opened = new Set(progress.advent);
  const counted = () => { count.textContent = ADVENT.count(opened.size); };
  // The calendar page shows the day; another day, and the old page flips up over its rings and away.
  let showing = 0;
  function turnTo(day) {
    if (day === showing) return;
    if (showing && !still) { const sheet = element('div', 'advent-sheet', page); paperLayer(sheet, '0 0 80 92', '', calendarPage, PAPER); element('span', 'advent-month', sheet, '12 月'); element('span', 'advent-date', sheet, String(showing)); setTimeout(() => sheet.remove(), 900); }
    showing = day; shownDay.textContent = String(day);
  }
  // The day's picture, large on the sheet under its line (the advent house itself while no door's line is shown).
  let pictured = '';
  function picture(name) {
    if (name === pictured) return;
    pictured = name; art.style.backgroundImage = adventPicture(name); art.classList.remove('is-new'); void art.offsetWidth; art.classList.add('is-new');
  }
  function tell(text, intro = '', day = showing || 1, name = pictured || 'room') { note.textContent = text; link.hidden = !intro; if (intro) link.textContent = ADVENT.intro(intro); turnTo(day); picture(name); }
  const show = day => tell(WINDOWS[day - 1].text, WINDOWS[day - 1].intro, day, WINDOWS[day - 1].art);
  const until = () => Math.max(1, Math.ceil((new Date(date.getFullYear(), 11, 1) - date) / 86400000));
  // The doors in the order of their days (so the keyboard goes 1, 2, 3 …), each placed where it is cut in the box.
  for (const slot of [...SLOTS].sort((a, b) => a.day - b.day)) {
    const { day, kind, x, y, w, h, hinge, colour } = slot, entry = WINDOWS[day - 1];
    const place = element('div', `advent-slot is-${slot.layer}`, tilt); Object.assign(place.dataset, { day, kind, hinge });
    Object.assign(place.style, { left: `${x / W * 100}%`, top: `${y / H * 100}%`, width: `${w / W * 100}%`, height: `${h / H * 100}%` });
    const picture = element('span', `advent-pic${entry.move ? ` is-${entry.move}` : ''}`, place); picture.setAttribute('aria-hidden', 'true');
    const door = element('button', 'advent-door', place); door.type = 'button';
    paperLayer(door, `0 0 ${w} ${h}`, 'advent-face', g => FACES[kind](g, w, h, colour), PAPER);
    paperLayer(door, `0 0 ${w} ${h}`, 'advent-back', g => back(g, kind, w, h), PAPER); element('span', 'advent-num', door, String(day));
    const state = () => opened.has(day) ? 'open' : day <= open ? 'ready' : 'later';
    const paint = () => {
      if (opened.has(day)) picture.style.backgroundImage = adventPicture(entry.art);
      place.dataset.state = state(); door.setAttribute('aria-label', `12 月 ${day} 日的${{ open: '窗（打開了）', ready: '窗：可以打開', later: '窗：還沒到' }[state()]}`);
    };
    if (december && day === date.getDate()) { place.classList.add('is-today'); paperLayer(place, '0 0 40 40', 'advent-star', todayStar, PAPER); }
    paint();
    on(door, 'click', () => {
      if (day > open) {
        place.classList.remove('is-shaking'); void place.offsetWidth; place.classList.add('is-shaking'); sound.play('nope');
        tell(open ? ADVENT.locked : ADVENT.before(until()), '', showing); return;
      }
      if (!opened.has(day)) { opened.add(day); progress.advent = [...opened].sort((a, b) => a - b); save(); sound.play('open'); paint(); counted(); }
      show(day);
    });
  }
  counted();
  if (!open) tell(ADVENT.before(until()), '', 1);
  else if (december) { if (opened.has(date.getDate())) show(date.getDate()); else tell(ADVENT.today(date.getDate()), '', date.getDate()); }
  else tell(ADVENT.after, '', 25);
  // Opening: the room grows dusky, then (every picture cut and ready, so nothing comes in piece by piece) the little house
  // on the sill rises and unfolds into the box, as a page of a pop-up book stands up, and the lid slides in beside it.
  // Closing (when leaving), the box folds back down into the little house as the room goes dark for a moment, long enough
  // for the eye to walk back to the middle of the room unseen (past Santa's chair), and then clears.
  const place = () => {
    const small = cabin.sheetRect('decor-advent'), shown = box.getBoundingClientRect(), base = stage.getBoundingClientRect();
    if (!small || !shown.width) return;
    box.style.setProperty('--from-x', `${small.left + small.width / 2 - (shown.left - base.left + shown.width / 2)}px`);
    box.style.setProperty('--from-y', `${small.top + small.height - (shown.top - base.top + shown.height)}px`);
    box.style.setProperty('--from-scale', String(Math.max(.08, small.width / shown.width)));
  };
  let gone = false;
  if (!still) {
    scene.classList.add('is-entering');
    Promise.all([...scene.querySelectorAll('img')].map(image => image.decode().catch(() => {}))).then(() => {
      if (gone) return;
      place(); scene.classList.remove('is-entering'); box.classList.add('is-popping'); side.classList.add('is-sliding');
    });
  }
  // Leaning toward the pointer (a mouse; never under reduced motion), so the layers part a little.
  if (!still && matchMedia('(pointer: fine)').matches) {
    on(stage, 'pointermove', event => {
      const rect = box.getBoundingClientRect(), dx = (event.clientX - rect.left) / rect.width - .5, dy = (event.clientY - rect.top) / rect.height - .5;
      box.style.setProperty('--lean-x', `${Math.max(-1, Math.min(1, dx * 2)) * 5}deg`); box.style.setProperty('--lean-y', `${Math.max(-1, Math.min(1, dy * 2)) * -4}deg`);
    });
  }
  (tilt.querySelector('.is-today .advent-door') ?? tilt.querySelector('[data-state="ready"] .advent-door') ?? tilt.querySelector('.advent-door')).focus({ preventScroll: true });
  return () => {
    gone = true; events.abort();
    if (still) { scene.remove(); return; }
    place(); stage.append(scene); scene.classList.add('is-leaving'); setTimeout(() => scene.remove(), 1900);
  };
}
