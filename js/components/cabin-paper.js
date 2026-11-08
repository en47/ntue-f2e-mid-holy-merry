// Paper for every box of words in Santa's yard: captions, speech bubbles, tags, drawers and the letter are cut from the same
// paper as the rest of the site (paperFilter's grain and soft rim), each with a slightly uneven edge, a stitched line and a
// dropped shadow. Each box gets one whole sheet drawn at its own size, so there are no seams; when a box changes size (a new
// caption, a drawer opening) its sheet is drawn again. The page marks itself data-paper while this is running.
import { paperFilter, shape } from './paper-art.js';

// fill, the shadow under it, and an optional stitched line just inside the edge.
const PAPERS = {
  note: ['#fbf3df', '#dccaa9', '#ad3c3b'],
  tag: ['#a84a42', '#853a34', '#fff3dc'],
  pale: ['#f6efe0', '#e2d4b8', null],
  picked: ['#fbf1d6', '#e2d4b8', '#c08a3e'],
  wood: ['#a8774d', '#6b4a33', '#fbf3df'],
  letter: ['#fffdf6', '#e4d6bf', '#ad3c3b'],
};
// Which paper each box is cut from; the first match wins, so a pressed tab is a red tag and the others stay pale.
const KINDS = [
  ['.cabin-letter, .cabin-chat, .desk-letter', 'letter'],
  ['.desk-envelope', 'pale'],
  ['.feed-basket, .play-basket', 'wood'],
  ['.wardrobe-item[aria-pressed="true"]', 'picked'],
  ['.wardrobe-tabs button[aria-pressed="true"], .cabin-back, .cabin-letter-close, .wardrobe-reset, .hoist-hook, .hoist-release, .chat-fold, .chat-send, .desk-actions button, .books-tools button', 'tag'],
  ['.wardrobe-tabs button, .wardrobe-item, .cabin-explore button', 'pale'],
  ['.cabin-caption, .cabin-tip, .cabin-away, .cabin-noscript, .reindeer-bubble, .feed-meter, .wardrobe, .cabin-explore, .play-pile, .hoist-hint, .from-santa .chat-bubble', 'note'],
];
const ALL = KINDS.map(([selector]) => selector).join(', ');
const kindOf = node => KINDS.find(([selector]) => node.matches(selector))?.[1];
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
const SHADOW = 4;
let count = 0;

const image = svg => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`;
// A rounded sheet whose corners and long sides waver a little, differently for every size.
function outline(width, height, seed) {
  const jitter = i => (noise(seed + i) - .5) * 2.4, r = Math.min(14, height / 3, width / 3);
  const x0 = 2 + jitter(1), y0 = 2 + jitter(2), x1 = width - 2 + jitter(3), y1 = height - 2 - SHADOW + jitter(4), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return `M${x0 + r} ${y0}Q${mx} ${y0 - 1.6 + jitter(5) * .5} ${x1 - r} ${y0}Q${x1} ${y0} ${x1} ${y0 + r}Q${x1 + 1.4 + jitter(6) * .5} ${my} ${x1} ${y1 - r}`
    + `Q${x1} ${y1} ${x1 - r} ${y1}Q${mx} ${y1 + 1.6 + jitter(7) * .5} ${x0 + r} ${y1}Q${x0} ${y1} ${x0} ${y1 - r}Q${x0 - 1.4 + jitter(8) * .5} ${my} ${x0} ${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
}
const sheets = new Map();
function sheet(kind, width, height) {
  const key = `${kind}:${width}x${height}`;
  if (sheets.has(key)) return sheets.get(key);
  const [fill, shadow, stitch] = PAPERS[kind], svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width, height });
  const paper = shape('g', { filter: paperFilter(svg, `cabin-ui-${++count}`, { scale: .5, grain: .55, shadow: .16 }) }, svg), d = outline(width, height, width * 7 + height);
  shape('path', { d, fill: shadow, transform: `translate(0 ${SHADOW})` }, paper);
  shape('path', { d, fill }, paper);
  const inset = height < 44 ? 5 : 8;
  if (stitch && width > 40 && height > 26) shape('rect', { x: inset + 2, y: inset + 2, width: width - inset * 2 - 4, height: height - SHADOW - inset * 2 - 4, rx: Math.min(9, height / 4), fill: 'none', stroke: stitch, 'stroke-opacity': .42, 'stroke-width': 1.4, 'stroke-dasharray': '6 5' }, paper);
  const url = image(svg);
  if (sheets.size > 200) sheets.clear();
  sheets.set(key, url); return url;
}
function tail() {
  const svg = shape('svg', { viewBox: '0 0 26 20', width: 26, height: 20 });
  const paper = shape('g', { filter: paperFilter(svg, `cabin-ui-${++count}`, { scale: .4, grain: .5, shadow: .16 }) }, svg);
  for (const [fill, y] of [['#dccaa9', 3], ['#fbf3df', 0]]) shape('path', { d: 'M2 0H24L18 16C14 11 8 6 2 0Z', fill, transform: `translate(0 ${y})` }, paper);
  return image(svg);
}

export function mountCabinPaper(root) {
  if (!root) return;
  const drawn = new WeakMap();
  function paint(node) {
    const kind = kindOf(node), width = Math.round(node.offsetWidth), height = Math.round(node.offsetHeight);
    // Hidden or collapsed boxes (the keyboard list before it opens) get no paper until they have a size.
    if (!kind || width < 24 || height < 16) { node.style.backgroundImage = ''; drawn.delete(node); return; }
    const key = `${kind}:${width}x${height}`;
    if (drawn.get(node) === key) return;
    drawn.set(node, key); node.style.backgroundImage = sheet(kind, width, height);
  }
  const resize = new ResizeObserver(entries => { for (const entry of entries) paint(entry.target); });
  const watch = node => {
    if (node.nodeType !== 1) return;
    if (node.matches(ALL)) resize.observe(node);
    for (const child of node.querySelectorAll(ALL)) resize.observe(child);
  };
  // New boxes come and go with each game; a pressed tab or a worn accessory changes paper.
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') paint(record.target);
      else record.addedNodes.forEach(watch);
    }
  }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed'] });
  watch(root);
  root.style.setProperty('--paper-tail', tail());
  root.dataset.paper = '';
}
