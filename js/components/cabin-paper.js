// Paper for every box of words in Santa's yard: captions, speech bubbles, tags, drawers and the letter are cut from the same
// paper as the rest of the site (paperFilter's grain and soft rim), each with a torn edge and a dropped shadow. Every kind is
// drawn once as a nine-slice frame and handed to CSS as a border image (css/santa.css), so a box of any size keeps its
// paper corners instead of being stretched; the page marks itself data-paper once they are ready.
import { paperFilter, shape } from './paper-art.js';

// fill, the shadow under it, and an optional stitched line just inside the edge.
const FRAMES = {
  note: ['#fbf3df', '#dccaa9', '#ad3c3b'],
  tag: ['#a84a42', '#853a34', '#fff3dc'],
  pale: ['#f6efe0', '#e2d4b8', null],
  picked: ['#fbf1d6', '#e2d4b8', '#c08a3e'],
  wood: ['#a8774d', '#6b4a33', '#fbf3df'],
  letter: ['#fffdf6', '#e4d6bf', '#ad3c3b'],
};
// The torn outline: corners rounded unevenly and the long sides gently wavering, inside a 120-unit square sliced at 30.
const EDGE = 'M11 7C36 4 62 6 86 5 98 4 108 5 112 8 116 12 116 20 115 32 114 52 116 70 115 88 115 100 116 108 112 112 106 116 92 114 70 115 48 116 28 114 12 113 6 112 4 106 5 96 6 78 4 58 5 38 5 24 4 14 6 10S8 8 11 7Z';
const TAIL = 'M2 0H24L18 16C14 11 8 6 2 0Z';
let count = 0;

function image(svg) { return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`; }
function frame([fill, shadow, stitch]) {
  const svg = shape('svg', { viewBox: '0 0 120 120', width: 120, height: 120 });
  const paper = shape('g', { filter: paperFilter(svg, `cabin-ui-${++count}`, { scale: .5, grain: .55, shadow: .16 }) }, svg);
  shape('path', { d: EDGE, fill: shadow, transform: 'translate(0 4)' }, paper);
  shape('path', { d: EDGE, fill }, paper);
  if (stitch) shape('rect', { x: 12, y: 12, width: 96, height: 94, rx: 9, fill: 'none', stroke: stitch, 'stroke-opacity': .42, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }, paper);
  return image(svg);
}
function tail() {
  const svg = shape('svg', { viewBox: '0 0 26 20', width: 26, height: 20 });
  const paper = shape('g', { filter: paperFilter(svg, `cabin-ui-${++count}`, { scale: .4, grain: .5, shadow: .16 }) }, svg);
  shape('path', { d: TAIL, fill: '#dccaa9', transform: 'translate(0 3)' }, paper);
  shape('path', { d: TAIL, fill: '#fbf3df' }, paper);
  return image(svg);
}

export function mountCabinPaper(root) {
  if (!root) return;
  for (const [name, colours] of Object.entries(FRAMES)) root.style.setProperty(`--paper-${name}`, frame(colours));
  root.style.setProperty('--paper-tail', tail());
  root.dataset.paper = '';
}
