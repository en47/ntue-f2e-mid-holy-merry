// Flat paper Santa shown until the GLB is ready; it costs no 3D and never blocks the page.
import { paperLayer, shape } from './paper-art.js';

function draw(parent) {
  shape('path', { d: 'M92 118C96 62 146 28 196 44 222 52 236 74 240 104L92 124Z', fill: '#c6443b' }, parent);
  shape('path', { d: 'M108 74C82 74 62 92 56 116', stroke: '#c6443b', 'stroke-width': 26, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('circle', { cx: 52, cy: 126, r: 18, fill: '#f7efe0' }, parent);
  shape('circle', { cx: 168, cy: 140, r: 42, fill: '#f2c9a8' }, parent);
  shape('path', { d: 'M104 150C106 214 140 250 168 254 196 250 232 214 232 150 216 170 200 166 186 158 174 168 162 168 150 158 136 166 120 170 104 150Z', fill: '#f7efe0' }, parent);
  shape('path', { d: 'M84 120C124 92 212 90 252 114 258 128 248 138 236 134 192 118 140 118 100 140 86 142 78 130 84 120Z', fill: '#f7efe0' }, parent);
  shape('circle', { cx: 150, cy: 138, r: 4, fill: '#3b2a22' }, parent);
  shape('circle', { cx: 186, cy: 138, r: 4, fill: '#3b2a22' }, parent);
  shape('circle', { cx: 168, cy: 152, r: 9, fill: '#e29a84' }, parent);
}

export function mountSantaPlaceholders() {
  for (const host of document.querySelectorAll('[data-santa-placeholder]')) paperLayer(host, '0 0 300 270', 'santa-placeholder', draw);
}
