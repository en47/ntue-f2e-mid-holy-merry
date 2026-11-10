// The old photograph from 2003, torn into five: Holly as a little girl in the smallest Santa hat, hugging her mother just
// home for Christmas, a suitcase by the door, snow at the window, a small tree with its star, "2003" written in a corner.
// It is drawn once, warm and faded like an old print, in a 240 × 180 box; each piece shows only its part of it, cut along
// the same torn lines, so the five fit back together (cabin-secret.js puts them in a frame). Where the pieces are found is
// in cabin-play.js; which ones the visitor has is kept in the save (`pieces`).
import { holly, shape } from './paper-art.js';
import { star } from './paper-props.js';
import { snowman } from './cabin-art.js';
import { PLACES as SPOTS, REMEMBERED, itemFor } from './cabin-wardrobe.js';

export const W = 240, H = 180;
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
// A torn line between two points: small jags either side of it.
function tear(from, to, seed, steps = 9) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, jag = i && i < steps ? (noise(seed + i) - .5) * 7 : 0, [x0, y0] = from, [x1, y1] = to, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    return [x0 + dx * t - dy / len * jag, y0 + dy * t + dx / len * jag];
  });
}
// The tears: one down the left third, one down the right, and one across each side column.
const LEFT = tear([92, 0], [100, H], 11), RIGHT = tear([168, 0], [162, H], 23);
const at = (line, y) => { for (let i = 1; i < line.length; i++) if (line[i][1] >= y) { const [x0, y0] = line[i - 1], [x1, y1] = line[i]; return x0 + (x1 - x0) * (y - y0) / (y1 - y0 || 1); } return line.at(-1)[0]; };
const ACROSS_L = tear([0, 96], [at(LEFT, 92), 92], 37, 6), ACROSS_R = tear([at(RIGHT, 84), 84], [W, 88], 51, 5);
const upTo = (line, y) => line.filter(([, py]) => py < y), from = (line, y) => line.filter(([, py]) => py > y);
// Each piece as a closed outline, and the clue book's name for where it was found.
export const PIECES = {
  music: [[0, 0], ...upTo(LEFT, 92), ...[...ACROSS_L].reverse()],
  wheel: [...ACROSS_L, ...from(LEFT, 92), [0, H]],
  hat: [...LEFT, ...[...RIGHT].reverse()],
  rack: [...upTo(RIGHT, 84), ...ACROSS_R, [W, 0]],
  snowman: [...[...ACROSS_R].reverse(), ...from(RIGHT, 84), [W, H]],
};
export const outline = id => `M${PIECES[id].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
export const bounds = id => { const xs = PIECES[id].map(([x]) => x), ys = PIECES[id].map(([, y]) => y); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; };

// The whole picture, in faded warm tones.
export function photo(g) {
  shape('rect', { x: 0, y: 0, width: W, height: H, fill: '#dcc7a2' }, g);
  shape('rect', { x: 0, y: 132, width: W, height: 48, fill: '#bfa37a' }, g);
  shape('path', { d: 'M0 132H240', stroke: '#a88c64', 'stroke-width': 3 }, g);
  // The window: snow outside, a sprig of holly on the sill.
  shape('rect', { x: 16, y: 18, width: 62, height: 58, rx: 3, fill: '#8c6c4c' }, g); shape('rect', { x: 21, y: 23, width: 52, height: 48, fill: '#9fb0bd' }, g);
  for (let i = 0; i < 14; i++) shape('circle', { cx: 23 + noise(i) * 48, cy: 25 + noise(i + 30) * 44, r: 1.1 + noise(i + 9), fill: '#f4ecdc' }, g);
  shape('path', { d: 'M47 23V71M21 47H73', stroke: '#8c6c4c', 'stroke-width': 3 }, g);
  shape('rect', { x: 12, y: 76, width: 70, height: 6, rx: 2, fill: '#8c6c4c' }, g); holly(g, 26, 76, .22, '#7d8a62', '#a8584a');
  // The door behind, still open from coming in; the little tree with its star.
  shape('rect', { x: 112, y: 34, width: 40, height: 98, rx: 3, fill: '#8a6a4a' }, g); shape('rect', { x: 116, y: 38, width: 32, height: 94, fill: '#efe2c4' }, g);
  shape('path', { d: 'M201 30L224 118H178Z', fill: '#6f7f5a' }, g); shape('path', { d: 'M201 50L219 118H183Z', fill: '#7d8d66' }, g);
  shape('rect', { x: 197, y: 118, width: 8, height: 10, fill: '#6b4a33' }, g); star(g, 201, 28, 7, '#e2c27a');
  for (const [x, y, c] of [[193, 80, '#a8584a'], [210, 92, '#e2c27a'], [198, 104, '#8fa3b0'], [206, 66, '#a8584a']]) shape('circle', { cx: x, cy: y, r: 3, fill: c }, g);
  // The suitcase by the door.
  shape('rect', { x: 34, y: 124, width: 40, height: 30, rx: 4, fill: '#8f6a4a' }, g); shape('path', { d: 'M46 124V118H62V124', fill: 'none', stroke: '#6b4a33', 'stroke-width': 3 }, g);
  shape('path', { d: 'M34 138H74', stroke: '#6b4a33', 'stroke-width': 2 }, g);
  // Her mother, kneeling, arms round her; Holly in her red coat and the smallest Santa hat.
  shape('path', { d: 'M84 160C82 128 88 104 104 98 118 100 126 120 126 160Z', fill: '#7d6a86' }, g);
  shape('circle', { cx: 106, cy: 86, r: 12, fill: '#e9cfb2' }, g); shape('path', { d: 'M93 86C92 70 120 68 120 84 116 78 106 76 98 80 96 88 98 96 94 98Z', fill: '#4a3a30' }, g);
  shape('path', { d: 'M96 102Q108 110 120 102V108Q108 116 96 108Z', fill: '#c9a46a' }, g);
  shape('path', { d: 'M128 160C126 136 128 118 140 114 152 118 156 136 154 160Z', fill: '#a8584a' }, g);
  shape('rect', { x: 126, y: 154, width: 30, height: 6, rx: 2, fill: '#f4ecdc' }, g);
  shape('circle', { cx: 141, cy: 104, r: 9, fill: '#efd6bb' }, g);
  shape('path', { d: 'M131 101C131 90 140 86 147 90 151 93 152 98 152 101Z', fill: '#a8584a' }, g); shape('rect', { x: 130, y: 99, width: 23, height: 4, rx: 2, fill: '#f4ecdc' }, g); shape('circle', { cx: 133, cy: 90, r: 3, fill: '#f4ecdc' }, g);
  shape('path', { d: 'M120 112C128 116 134 122 136 130', fill: 'none', stroke: '#7d6a86', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  for (const [x, y] of [[102, 86], [110, 86], [138, 104], [145, 104]]) shape('path', { d: `M${x - 2} ${y}q2 2 4 0`, fill: 'none', stroke: '#4a3a30', 'stroke-width': 1.2 }, g);
  // "2003", written on the print in white ink.
  shape('path', { d: 'M192 160c2-6 9-5 7 1-1 3-6 6-8 9h9M204 160c0 5 1 9 4 9s4-4 4-9-1-8-4-8-4 4-4 8ZM218 160c0 5 1 9 4 9s4-4 4-9-1-8-4-8-4 4-4 8ZM231 153c3-2 8-1 7 3-1 3-4 4-6 4 3 0 7 1 6 5-1 4-6 4-8 2', fill: 'none', stroke: '#fbf3df', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
}
// One piece: only its part of the picture, cut along its torn outline (the paper filter gives the torn white edge).
export function piece(id, g) {
  const clip = `photo-${id}-${Math.round(Math.random() * 1e6)}`;
  shape('clipPath', { id: clip }, g).append(shape('path', { d: outline(id) }));
  shape('path', { d: outline(id), fill: '#f6efe0' }, g);
  photo(shape('g', { 'clip-path': `url(#${clip})` }, g));
}

// The polaroid pinned to the hat rack, 120 × 150: the snowman as he was dressed one winter long ago (cabin-wardrobe.js
// REMEMBERED), his own paper and his own accessories, faded. Its back says to dress him so again.
export function polaroid(g) {
  shape('rect', { x: 0, y: 0, width: 120, height: 150, rx: 3, fill: '#fbf6ea' }, g);
  shape('rect', { x: 9, y: 9, width: 102, height: 104, fill: '#c9d6e0' }, g);
  shape('path', { d: 'M9 92Q60 84 111 92V113H9Z', fill: '#f1ece2' }, g);
  const s = .068, board = shape('g', { transform: `translate(${60 - 450 * s} ${110 - 1400 * s}) scale(${s})` }, g);
  snowman({ paper: board }, { width: 900, height: 1400 });
  for (const [place, id] of Object.entries(REMEMBERED)) {
    const { at: [x, y], size: [w, h], box } = SPOTS[place];
    itemFor(id).draw(shape('g', { transform: `translate(${450 + x * 1000 - w * 500} ${1400 - y * 1000 - h * 500}) scale(${w * 10} ${h * 1000 / box})` }, board));
  }
  shape('rect', { x: 9, y: 9, width: 102, height: 104, fill: '#e8cf9f', opacity: .22 }, g);
}

