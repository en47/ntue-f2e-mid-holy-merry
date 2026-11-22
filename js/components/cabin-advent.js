// The advent house on the window sill, up close (data/cabin-advent.js, services/cabin-advent.js): walking up to it, it
// pops up like a page in a pop-up book into an advent calendar box. Inside a red paper box, under a night sky with the
// moon, stands a paper house in the snow, presents in front of it and drawers in the box's foot; its twenty-four doors
// are all sorts and sizes, numbered out of order as on a real calendar: three baubles hanging in the sky, windows in the
// gable and on both floors, a little iron door in the chimney, the big front door (24), presents whose fronts fall open,
// drawers whose fronts drop down. Today's and the days before can be opened: the door turns on its own hinge and the
// picture inside shows, its line written beside the box. A day still to come only rattles. Before December it says when
// it opens; from Christmas on every door opens. Doors once opened stay open (the save's `advent`), until 全部關上 under
// the lid's line shuts them all again, so the days can be opened over.
// The box is in layers set one in front of another (sky, house, snow, box), each cut once from paper; it leans a little
// toward the pointer, so the layers part. Beside it stands its lid with the day's little paper scene in a window, which
// plays when tapped, and the day's line (see `lidTall` below). A door opened before is tapped again (or the picture
// behind it) to see its day once more. Under reduced motion nothing pops, leans, swings, twinkles or falls.
import { paperLayer, shape } from './paper-art.js';
import { adventPicture } from './cabin-clue-art.js';
import { ADVENT_SCENES, coverScene } from './cabin-advent-scenes.js';
import { ADVENT, WINDOWS } from '../data/cabin-advent.js';
import { introCultures } from '../data/intro-cultures.js';
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
// The front door stops this far above its slot's foot, just under the snow drift's line (front()): shut, the snow hides
// what is left of its slot; open, the door would otherwise hang down through the snow.
const ARCH_FOOT = 14;
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
    const foot = h - ARCH_FOOT;
    shape('path', { d: `M0 ${foot}V${w / 2}A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2}V${foot}Z`, fill: colour }, g);
    for (let i = 1; i < 4; i++) line(`M${w * i / 4} ${i === 2 ? 8 : 18}V${foot - 4}`, '#00000022', g, 2);
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
// A door's back, plain kraft in its own shape; and the gold paper star stuck by today's door. The front door's is its
// inside, a darker red: planks, the hinges' straps from the hinge (on the right, seen from behind) and a ring to pull it
// to by, near its free edge.
function back(g, kind, w, h) {
  if (ROUND.has(kind)) shape('circle', { cx: w / 2, cy: h / 2, r: w / 2, fill: '#e6d3ad' }, g);
  else if (kind === 'arch') {
    const foot = h - ARCH_FOOT;
    shape('path', { d: `M0 ${foot}V${w / 2}A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2}V${foot}Z`, fill: RED_DARK }, g);
    for (let i = 1; i < 4; i++) line(`M${w * i / 4} ${i === 2 ? 8 : 18}V${foot - 4}`, '#00000026', g, 2);
    for (const y of [h * .38, h * .82]) line(`M${w * .7} ${y}H${w - 2}`, GOLD_DARK, g, 5);
    shape('circle', { cx: w * .2, cy: h * .62, r: 6, fill: 'none', stroke: GOLD, 'stroke-width': 2.4 }, g);
  } else shape('rect', { x: 0, y: 0, width: w, height: h, rx: 4, fill: '#e6d3ad' }, g);
}
const todayStar = g => shape('path', { d: 'M20 2L25 14 38 15 28 23 31 36 20 29 9 36 12 23 2 15 15 14Z', fill: GOLD, stroke: CREAM, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
const LAYERS = [['sky', sky], ['house', house], ['front', front], ['frame', frame]];

// Beside the box stands its lid, its inside turned out: kraft board inside a muted red rim (the box's own red would be
// too much beside it), a sprig of holly in each top corner, the title along its top. Under the title an arched window
// holds the day's little scene (cabin-advent-scenes.js), cut in paper layers, which stands up like a pop-up page when
// its day is shown and plays once; a tap plays it again or on a step. Under the window a cream sheet is taped on, with a
// tear-off calendar page for the day (it flips over when another day is shown) beside the day's line, the way to Intro as
// a red tag under them when there is one, and along its foot how many doors are open and a kraft button that shuts them
// all. Tall beside the box on a wide screen (320 × 560). On a phone, or held sideways, the lid is a strip under (or beside)
// the box (360 × 168) with the title, the page, the line and its foot, and the window rises from it on a card of its own
// when a door is opened or an open one tapped again, until it is put away (收好).
const RIM = '#9e5047', BOARD = '#dcc6a2', BOARD_SHADE = '#c9ae86';
function holly(g, x, y, flip = 1) {
  for (const turn of [-30, 40]) shape('path', { d: 'M0 0C8-8 21-6 27 0 21 6 8 8 0 0Z', fill: GREEN, transform: `translate(${x} ${y}) scale(${flip} 1) rotate(${turn})` }, g);
  for (const [dx, dy] of [[3, 3], [9, 1.5], [6, 8]]) shape('circle', { cx: x + dx * flip, cy: y + dy, r: 3.6, fill: '#c63a33' }, g);
}
const tape = (g, x, y, turn) => shape('rect', { x: -15, y: -5.5, width: 30, height: 11, rx: 1, fill: '#e9cf8f', opacity: .9, transform: `translate(${x} ${y}) rotate(${turn})` }, g);
function board(g, w, h, round = 12) {
  shape('rect', { x: 0, y: 0, width: w, height: h, rx: round, fill: RIM }, g);
  shape('rect', { x: 11, y: 11, width: w - 22, height: h - 22, rx: round * .6, fill: BOARD }, g);
  shape('path', { d: `M11 18Q11 11 18 11H${w - 18}Q${w - 11} 11 ${w - 11} 18V24H11Z`, fill: BOARD_SHADE }, g);
}
function lidTall(g) {
  board(g, 320, 560);
  shape('rect', { x: 24, y: 318, width: 272, height: 218, rx: 3, fill: CREAM }, g);
  tape(g, 36, 322, -30); tape(g, 284, 322, 30);
  holly(g, 26, 28); holly(g, 294, 28, -1);
}
function lidWide(g) {
  shape('rect', { x: 0, y: 0, width: 360, height: 168, rx: 10, fill: RIM }, g);
  shape('rect', { x: 8, y: 8, width: 344, height: 152, rx: 6, fill: BOARD }, g);
  shape('rect', { x: 18, y: 18, width: 324, height: 136, rx: 3, fill: CREAM }, g);
  tape(g, 26, 22, -26); tape(g, 334, 22, 26);
}
// The card the window rises on, on a phone: the same board, the line on a cream sheet under the window.
function cardBoard(g) {
  board(g, 360, 480);
  shape('rect', { x: 22, y: 330, width: 316, height: 132, rx: 3, fill: CREAM }, g);
  tape(g, 34, 334, -28); tape(g, 326, 334, 28);
  holly(g, 24, 26); holly(g, 336, 26, -1);
}
// Held sideways, the card lies wide: the window on the left, the line on a cream sheet on the right.
function cardWide(g) {
  board(g, 560, 300);
  shape('rect', { x: 344, y: 26, width: 194, height: 248, rx: 3, fill: CREAM }, g);
  tape(g, 356, 30, -28); tape(g, 526, 30, 28);
}
// The window's frame: cream, arched like the house's doors (the same curve the scene is cut to), on a sill of wood
// with snow along it. Drawn over the scene, so the scene's edges go in under it.
const FRAME = '-14 -14 308 284';
function windowFrame(g) {
  shape('path', { d: 'M-12 240V52.8A152 66 0 0 1 292 52.8V240ZM0 240V52.8A140 52.8 0 0 1 280 52.8V240Z', fill: '#f3e6cc', 'fill-rule': 'evenodd' }, g);
  shape('path', { d: 'M0 240V52.8A140 52.8 0 0 1 280 52.8V240', fill: 'none', stroke: '#d9c39a', 'stroke-width': 3 }, g);
  shape('rect', { x: -14, y: 236, width: 308, height: 20, rx: 4, fill: WOOD }, g);
  shape('rect', { x: -10, y: 254, width: 300, height: 8, rx: 3, fill: WOOD_DARK }, g);
  shape('path', { d: 'M-14 240Q-14 230-4 230H284Q294 230 294 240Q280 236 270 242 262 248 256 240 240 236 220 242 210 246 196 240 170 236 150 242 140 246 126 240 100 236 80 242 70 246 60 240 36 236 20 242 6 246-14 240Z', fill: SNOW }, g);
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
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, compact = matchMedia('(max-width: 700px), (max-height: 560px)');
  const timers = new Set(), later = (ms, task) => { const id = setTimeout(() => { timers.delete(id); task(); }, ms); timers.add(id); };
  const scene = element('div', 'advent-scene', layer), box = element('section', 'advent-box', scene); box.setAttribute('aria-label', ADVENT.name);
  const tilt = element('div', 'advent-tilt', box);
  // The doors' numbers (and today's star) are full size on a box 400px across or more; a smaller one (a phone's, a short
  // phone's) shrinks them with it, down to 60%.
  const sized = new ResizeObserver(([entry]) => box.style.setProperty('--num-scale', String(Math.max(.6, Math.min(1, entry.contentRect.width / 400)))));
  sized.observe(box);
  for (const [name, draw] of LAYERS) paperLayer(element('div', `advent-layer is-${name}`, tilt), `0 0 ${W} ${H}`, '', draw, PAPER);
  const side = element('aside', 'advent-side', scene); side.setAttribute('aria-label', ADVENT.name);
  paperLayer(side, '0 0 320 560', 'advent-lid is-tall', lidTall, PAPER); paperLayer(side, '0 0 360 168', 'advent-lid is-wide', lidWide, PAPER);
  const title = element('h3', 'advent-title', side, ADVENT.title); title.lang = 'en';
  // The words on the cream sheet, laid out on it with the same margin all round (on the strip the title joins them).
  const paper = element('div', 'advent-paper', side), page = element('div', 'advent-page', paper);
  paperLayer(page, '0 0 80 92', '', calendarPage, PAPER); element('span', 'advent-month', page, '12 月'); const shownDay = element('span', 'advent-date', page);
  const note = element('p', 'advent-note', paper); note.setAttribute('aria-live', 'polite');
  const foot = element('div', 'advent-foot', paper), link = element('a', 'advent-link', foot); link.href = 'intro.html'; link.hidden = true;
  const tally = element('div', 'advent-tally', paper), count = element('p', 'advent-count', tally);
  element('span', 'advent-count-lead', count, `${ADVENT.countLead} `); const tallied = count.appendChild(document.createTextNode(''));
  const shut = element('button', 'advent-shut', tally, ADVENT.shut); shut.type = 'button'; shut.setAttribute('aria-label', ADVENT.shutLabel);
  // The window and its scenes. On a phone it sits on a card of its own that rises over the box, with the line again and
  // the way to Intro (the strip under the box is hidden while the card is up).
  const pane = element('div', 'advent-stage'), view = element('div', 'advent-view', pane);
  paperLayer(pane, FRAME, 'advent-frame', windowFrame, PAPER);
  const tap = element('button', 'advent-play', pane); tap.type = 'button';
  const card = element('section', 'advent-card', scene); card.setAttribute('aria-label', ADVENT.name);
  paperLayer(card, '0 0 360 480', 'advent-card-board is-tall', cardBoard, { ...PAPER, preserveAspectRatio: 'none' }); paperLayer(card, '0 0 560 300', 'advent-card-board is-wide', cardWide, { ...PAPER, preserveAspectRatio: 'none' });
  const cardNote = element('p', 'advent-card-note', card), fold = element('button', 'advent-fold', card, ADVENT.close); fold.type = 'button';
  const cardPage = element('div', 'advent-page is-small', card); paperLayer(cardPage, '0 0 80 92', '', calendarPage, PAPER); element('span', 'advent-month', cardPage, '12 月'); const cardDay = element('span', 'advent-date', cardPage);
  const seat = () => {
    if (compact.matches) { paper.prepend(title); card.insertBefore(pane, cardNote); card.append(foot); }
    else { side.insertBefore(title, paper); side.insertBefore(pane, paper); paper.insertBefore(foot, tally); }
  };
  seat(); on(compact, 'change', seat);
  const opened = new Set(progress.advent);
  const counted = () => { tallied.data = ADVENT.count(opened.size); shut.hidden = !opened.size; };
  // The calendar page shows the day; another day, and the old page flips up over its rings and away.
  let showing = 0;
  function turnTo(day) {
    if (day === showing) return;
    if (showing && !still) { const sheet = element('div', 'advent-sheet', page); paperLayer(sheet, '0 0 80 92', '', calendarPage, PAPER); element('span', 'advent-month', sheet, '12 月'); element('span', 'advent-date', sheet, String(showing)); later(900, () => sheet.remove()); }
    showing = day; shownDay.textContent = String(day); cardDay.textContent = String(day);
  }
  // The day's scene in the window (the cover while no window's day is shown), cut the first time it is shown and kept.
  // Shown, its pieces stand up one after another over the scene that was there (which stays until the new backdrop has
  // faded in over it, so the window never stands empty), and once they stand it plays; each tap then plays on a step.
  // On a phone's card put away, the scene that was there goes at once (`fresh`): the card rises with the new day's.
  // The day already shown, chosen again (`again`), replays: its pieces stand up once more over its backdrop, and it plays.
  const scenes = new Map();
  let staged = null, rounds = 0, stacked = 0;
  function stageScene(day, { delay = 0, quiet = false, fresh = false, again = false } = {}) {
    if (!scenes.has(day)) { const host = element('div', 'advent-cut-scene', view); scenes.set(day, { host, ...(day ? ADVENT_SCENES[day - 1] : coverScene)(host) }); }
    const next = scenes.get(day);
    tap.setAttribute('aria-label', day ? WINDOWS[day - 1].play : ADVENT.cover);
    if (staged === next && !again) return;
    const replay = staged === next; staged = next; rounds = 0;
    const others = () => { for (const other of scenes.values()) if (other !== staged) { other.host.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); other.host.classList.remove('is-shown'); } };
    next.reset(); next.host.style.zIndex = String(++stacked);
    const pieces = [...next.host.children].filter(piece => piece.style.opacity !== '0').slice(replay ? 1 : 0);
    if (still) { others(); next.host.classList.add('is-shown'); next.play(0, quiet ? null : sound); return; }
    pieces.forEach(piece => { piece.style.visibility = 'hidden'; }); next.host.classList.add('is-shown'); if (fresh) others();
    Promise.all([...next.host.querySelectorAll('img')].map(image => image.decode().catch(() => {}))).then(() => later(delay, () => {
      if (staged !== next) return;
      pieces.forEach((piece, i) => {
        piece.style.visibility = '';
        piece.animate(i || replay ? [{ opacity: 0, transform: 'perspective(600px) rotateX(78deg)', transformOrigin: '50% 100%' }, { opacity: 1, transform: 'none', transformOrigin: '50% 100%' }] : [{ opacity: 0 }, { opacity: 1 }], { duration: i || replay ? 650 : 400, delay: i * 110, easing: 'cubic-bezier(.2,.9,.3,1.12)', fill: 'backwards' });
      });
      later(420, () => { if (staged === next) others(); });
      later(pieces.length * 110 + 650, () => { if (staged === next) next.play(0, quiet ? null : sound); });
    }));
  }
  on(tap, 'click', () => { if (!staged) return; rounds = (rounds + 1) % staged.steps; if (!rounds && staged.steps > 1) staged.reset(); staged.play(rounds, sound); });
  // On a phone the card rises when a door is opened or an open one is tapped again, and is put away again with 收好.
  const raise = () => { if (!compact.matches) return; card.classList.add('is-up'); };
  on(fold, 'click', () => { card.classList.remove('is-up'); (tilt.querySelector(`.advent-slot[data-day="${showing}"] .advent-door`) ?? tilt.querySelector('.advent-door')).focus({ preventScroll: true }); });
  function tell(text, intro = '', day = showing || 1) {
    note.textContent = text; cardNote.textContent = text;
    const country = introCultures.find(culture => culture.id === intro);
    link.hidden = !country; if (country) { link.textContent = ADVENT.intro(country.name); link.href = `intro.html#${country.id}`; }
    turnTo(day);
  }
  const slots = new Map(), doors = new Map();
  const showDay = day => { tell(WINDOWS[day - 1].text, WINDOWS[day - 1].intro, day); for (const [each, place] of slots) place.classList.toggle('is-shown', each === day); };
  const until = () => Math.max(1, Math.ceil((new Date(date.getFullYear(), 11, 1) - date) / 86400000));
  // The doors in the order of their days (so the keyboard goes 1, 2, 3 …), each placed where it is cut in the box.
  for (const slot of [...SLOTS].sort((a, b) => a.day - b.day)) {
    const { day, kind, x, y, w, h, hinge, colour } = slot, entry = WINDOWS[day - 1];
    const place = element('div', `advent-slot is-${slot.layer}`, tilt); Object.assign(place.dataset, { day, kind, hinge }); slots.set(day, place);
    Object.assign(place.style, { left: `${x / W * 100}%`, top: `${y / H * 100}%`, width: `${w / W * 100}%`, height: `${h / H * 100}%` });
    const picture = element('span', `advent-pic${entry.move ? ` is-${entry.move}` : ''}`, place); picture.setAttribute('aria-hidden', 'true');
    const door = element('button', 'advent-door', place); door.type = 'button';
    paperLayer(door, `0 0 ${w} ${h}`, 'advent-face', g => FACES[kind](g, w, h, colour), PAPER);
    paperLayer(door, `0 0 ${w} ${h}`, 'advent-back', g => back(g, kind, w, h), PAPER); element('span', 'advent-num', door, String(day));
    const state = () => opened.has(day) ? 'open' : day <= open ? 'ready' : 'later';
    const paint = () => {
      if (opened.has(day)) picture.style.backgroundImage = adventPicture(entry.art);
      place.dataset.state = state(); door.setAttribute('aria-label', `12 月 ${day} 日的${{ open: '窗（打開了，再看一次）', ready: '窗：可以打開', later: '窗：還沒到' }[state()]}`);
    };
    if (december && day === date.getDate()) { place.classList.add('is-today'); paperLayer(place, '0 0 40 40', 'advent-star', todayStar, PAPER); }
    paint(); doors.set(day, { place, paint, y });
    // A door opened before is looked at again by tapping it or the picture behind it: its day comes back in the lid (the
    // day already there plays over again).
    const look = () => {
      if (day > open) {
        place.classList.remove('is-shaking'); void place.offsetWidth; place.classList.add('is-shaking'); sound.play('nope');
        tell(open ? ADVENT.locked : ADVENT.before(until()), '', showing); return;
      }
      const first = !opened.has(day);
      if (first) { opened.add(day); progress.advent = [...opened].sort((a, b) => a - b); save(); sound.play('open'); paint(); counted(); }
      // On a phone the scene waits to stand up until its card has risen (after the door has turned, the first time).
      const lift = compact.matches && !still;
      const up = card.classList.contains('is-up'), again = !first && showing === day;
      showDay(day); stageScene(day, { delay: (first ? 450 : 0) + (lift && !up ? (first ? 700 : 450) : 0), fresh: lift && !up, again });
      if (compact.matches) { if (first && !still) later(700, raise); else raise(); }
    };
    on(door, 'click', look); on(picture, 'click', () => { if (opened.has(day)) look(); });
  }
  counted();
  // The lid as it stands until a door is chosen: today's scene if its door is open, else the cover, with what day it is
  // (or when the first door opens). The first scene stands up as the lid slides in beside the box.
  const rest = options => {
    if (!open) { tell(ADVENT.before(until()), '', 1); stageScene(0, options); }
    else if (december) { if (opened.has(date.getDate())) { showDay(date.getDate()); stageScene(date.getDate(), options); } else { tell(ADVENT.today(date.getDate()), '', date.getDate()); stageScene(0, options); } }
    else { tell(ADVENT.after, '', 25); stageScene(0, options); }
  };
  rest({ quiet: true, delay: 1000 });
  const home = () => (tilt.querySelector('.is-today .advent-door') ?? tilt.querySelector('[data-state="ready"] .advent-door') ?? tilt.querySelector('.advent-door')).focus({ preventScroll: true });
  // 全部關上: the open doors swing shut in one sweep from the top of the box down to its drawers, smoothly (no bounce), each
  // picture holding still until its door is over it (with a creak, and a click as the last one shuts); the save forgets
  // them and the lid goes back to the cover, so every day can be opened again.
  on(shut, 'click', () => {
    const closing = [...opened].map(day => ({ day, at: still ? 0 : doors.get(day).y / H * 600 })), swing = still ? 0 : 760;
    const end = Math.max(0, ...closing.map(({ at }) => at)) + swing;
    opened.clear(); progress.advent = []; save(); counted();
    card.classList.remove('is-up'); box.classList.add('is-shutting');
    for (const { day, at } of closing) later(at, () => { const { place, paint } = doors.get(day); place.classList.add('is-closing'); paint(); later(swing, () => place.classList.remove('is-closing', 'is-shown')); });
    sound.play(still ? 'click' : 'creak'); if (!still) later(end - 80, () => sound.play('click'));
    later(end, () => { box.classList.remove('is-shutting'); slots.forEach(place => place.classList.remove('is-shown')); });
    rest({ quiet: true, delay: 300 }); home();
  });
  // Opening: the room grows dusky, then (every picture cut and ready, so nothing comes in piece by piece) the little house
  // on the sill rises and unfolds into the box, as a page of a pop-up book stands up, and the lid slides in beside it.
  // Closing (when leaving), the walk there undone: the lid slides away and the box folds back down into the little house on
  // the sill while the room's dusk lifts, the eye still where it stood (cabin-scene.js waits for it), and only then does
  // the eye back away to the middle of the room.
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
    Promise.all([...box.querySelectorAll('img'), ...side.querySelectorAll('img')].map(image => image.decode().catch(() => {}))).then(() => {
      if (gone) return;
      place(); scene.classList.remove('is-entering'); box.classList.add('is-popping'); side.classList.add('is-sliding');
    });
  }
  // Leaning toward the pointer (a mouse; never under reduced motion), so the layers part a little. The lean eases after the
  // pointer (.advent-tilt's transition), so the pop is taken off once it has stood up: kept at its end, it would make each
  // move of the mouse a jump.
  on(box, 'animationend', event => { if (event.animationName === 'advent-pop') box.classList.remove('is-popping'); });
  if (!still && matchMedia('(pointer: fine)').matches) {
    on(stage, 'pointermove', event => {
      const rect = box.getBoundingClientRect(), dx = (event.clientX - rect.left) / rect.width - .5, dy = (event.clientY - rect.top) / rect.height - .5;
      box.style.setProperty('--lean-x', `${Math.max(-1, Math.min(1, dx * 2)) * 5}deg`); box.style.setProperty('--lean-y', `${Math.max(-1, Math.min(1, dy * 2)) * -4}deg`);
    });
  }
  home();
  return () => {
    gone = true; events.abort(); sized.disconnect(); timers.forEach(clearTimeout); timers.clear(); card.classList.remove('is-up');
    if (still) { scene.remove(); return; }
    place(); stage.append(scene); scene.classList.add('is-leaving'); setTimeout(() => scene.remove(), 950);
  };
}
