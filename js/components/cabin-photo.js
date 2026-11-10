// The old polaroid pinned to the little room's hat rack: the snowman as he was dressed one winter long ago, faded. Its back
// says to dress him so again (cabin-snowman.js).
import { shape } from './paper-art.js';
import { snowman } from './cabin-art.js';
import { PLACES as SPOTS, REMEMBERED, itemFor } from './cabin-wardrobe.js';

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

