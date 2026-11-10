// Paper for every box of words in Santa's yard: captions, speech bubbles, tags, drawers and the letter are cut from the same
// paper as the rest of the site (paperFilter's grain and soft rim), each with a slightly uneven edge and a dropped shadow,
// some with a Christmas trim (snow, tape, holly). Each box gets one whole sheet drawn at its own size, so there are no
// seams; when a box changes size (a new caption, a drawer opening) its sheet is drawn again. The page marks itself
// data-paper while this is running.
import { paperFilter, shape } from './paper-art.js';

// fill, the shadow under it, and an optional trim cut for Christmas: 'snow' along the top edge (buttons), a strip of
// 'tape' holding a note up (captions), a sprig of 'holly' in a letter's corner. No sheet is stitched: a dashed line round
// every box made them all look alike.
const PAPERS = {
  note: ['#fbf3df', '#dccaa9'],
  pinned: ['#fbf3df', '#dccaa9', 'tape'],
  tag: ['#b5443c', '#7f312c', 'snow'],
  pale: ['#f6efe0', '#e2d4b8'],
  picked: ['#fde6c0', '#e2c79a'],
  wood: ['#a8774d', '#6b4a33', 'snow'],
  letter: ['#fffdf6', '#e4d6bf', 'holly'],
  plain: ['#fffdf6', '#e4d6bf'],
  holly: ['#b5443c', '#7f312c', 'snow'],
  pine: ['#3f6653', '#2c4a3b', 'snow'],
};
// Which paper each box is cut from; the first match wins, so a pressed tab is a red tag and the others stay pale.
const KINDS = [
  ['.cabin-letter:not(.secret-card)', 'letter'],
  ['.cabin-chat', 'plain'],
  ['.cabin-caption, .cabin-tip, .cabin-away', 'pinned'],
  ['.gearbox-hint, .desk-guide', 'pine'],
  ['.gearbox-actions button, .desk-actions button', 'holly'],
  ['.feed-basket, .play-basket', 'wood'],
  ['.wardrobe-item[aria-pressed="true"]', 'picked'],
  ['.wardrobe-tabs button[aria-pressed="true"], .cabin-back, .cabin-letter-close, .wardrobe-reset, .hoist-hook, .hoist-release, .chat-fold, .chat-send, .books-tools button, .books-enter', 'tag'],
  ['.wardrobe-tabs button, .wardrobe-item, .cabin-explore button', 'pale'],
  ['.cabin-noscript, .reindeer-bubble, .feed-meter, .wardrobe, .cabin-explore, .play-pile, .hoist-hint, .from-santa .chat-bubble', 'note'],
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
// A sprig of holly at (x, y): two leaves and three berries.
function holly(parent, x, y) {
  shape('path', { d: `M${x - 20} ${y + 4}C${x - 14} ${y - 8} ${x - 2} ${y - 8} ${x + 2} ${y}C${x - 4} ${y - 1} ${x - 6} ${y + 6} ${x - 11} ${y + 3}C${x - 13} ${y + 9} ${x - 19} ${y + 9} ${x - 20} ${y + 4}Z`, fill: '#3f6653' }, parent);
  shape('path', { d: `M${x + 20} ${y + 4}C${x + 14} ${y - 8} ${x + 2} ${y - 8} ${x - 2} ${y}C${x + 4} ${y - 1} ${x + 6} ${y + 6} ${x + 11} ${y + 3}C${x + 13} ${y + 9} ${x + 19} ${y + 9} ${x + 20} ${y + 4}Z`, fill: '#4f7d68' }, parent);
  for (const [dx, dy] of [[0, 2], [-4, 6], [4, 6]]) shape('circle', { cx: x + dx, cy: y + dy, r: 3.4, fill: '#c63a33' }, parent);
}
// Snow lying along a sheet's top edge: over the rounded corners, its lower edge in soft lumps with a drip or two.
function snowCap(width, height, seed) {
  const top = 1, r = Math.min(14, height / 3, width / 3), deep = Math.min(9, height * .24);
  let d = `M1 ${top + r * .9}Q1 ${top} ${r} ${top}H${width - r}Q${width - 1} ${top} ${width - 1} ${top + r * .9}`;
  const lumps = Math.max(3, Math.round(width / 16));
  for (let i = 1; i <= lumps; i++) {
    const x = width - 1 - (width - 2) * i / lumps, mid = x + (width - 2) / lumps / 2, drip = noise(seed + i) > .82 ? 5 : 0;
    d += `Q${mid.toFixed(1)} ${(top + deep + 2 + noise(seed + i * 3) * 3 + drip).toFixed(1)} ${x.toFixed(1)} ${(top + deep - 1 + noise(seed + i * 5) * 2).toFixed(1)}`;
  }
  return `${d}Z`;
}
const sheets = new Map();
function sheet(kind, width, height) {
  const key = `${kind}:${width}x${height}`;
  if (sheets.has(key)) return sheets.get(key);
  const [fill, shadow, trim] = PAPERS[kind], svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width, height });
  const paper = shape('g', { filter: paperFilter(svg, `cabin-ui-${++count}`, { scale: .5, grain: .55, shadow: .16 }) }, svg), d = outline(width, height, width * 7 + height);
  shape('path', { d, fill: shadow, transform: `translate(0 ${SHADOW})` }, paper);
  shape('path', { d, fill }, paper);
  if (trim === 'snow') shape('path', { d: snowCap(width, height, width * 3 + height), fill: '#fbf8f1' }, paper);
  if (trim === 'tape' && width > 60) shape('rect', { x: width / 2 - 24, y: 0, width: 48, height: 11, fill: '#efe2b4', opacity: .82, transform: `rotate(${((noise(width + height) - .5) * 8).toFixed(2)} ${width / 2} 5)` }, paper);
  if (trim === 'holly' && width > 120 && height > 90) holly(paper, width - 32, 22);
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
