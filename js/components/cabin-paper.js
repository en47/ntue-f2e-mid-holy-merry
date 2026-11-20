// Paper for every box of words in Santa's yard, and the paper things laid over it: captions, speech bubbles, buttons,
// drawers and letters are cut from the same paper as the rest of the site (paperFilter's grain and soft rim), each with a
// slightly uneven edge and a dropped shadow. Things that are more than a box are drawn whole the same way (`OBJECTS`): the
// little room's name board and its tags, the clipboard, the ledger and the booklet; the desk's papers, envelopes, postage
// stamps and wax; the gearbox's wooden case. Each gets one whole sheet drawn at its own size, so there are no seams; when
// it changes size (a new caption, a drawer opening) or kind (another letter) its sheet is drawn again. The page marks
// itself data-paper while this is running.
import { paperFilter, paperLayer, shape } from './paper-art.js';

// Ink stamped onto paper (a postmark, a register's stamps, WISH FULFILLED): the same grain and wavering edge, but no rim
// and no shadow, since ink lies in the paper rather than on it. The words stay text, over it.
const INK = { paper: { scale: .25, grain: .6, shadow: 0, rim: '#ffffff00' }, eager: true };
export const inked = (host, viewBox, draw) => paperLayer(host, viewBox, 'ink-layer', draw, INK);

// fill, the shadow under it, and an optional trim: a strip of 'tape' holding a caption up, a sprig of 'holly' in the corner
// of Santa's letter. Buttons stay plain paper (only the replies to Santa are gift tags): no stitched lines, no snow,
// nothing to tire the eye.
const PAPERS = {
  note: ['#fbf3df', '#dccaa9'],
  pinned: ['#fbf3df', '#dccaa9', 'tape'],
  tag: ['#b5443c', '#7f312c'],
  pale: ['#f6efe0', '#e2d4b8'],
  picked: ['#fde6c0', '#e2c79a'],
  wood: ['#a8774d', '#6b4a33'],
  letter: ['#fffdf6', '#e4d6bf', 'holly'],
  plain: ['#fffdf6', '#e4d6bf'],
  pine: ['#3f6653', '#2c4a3b'],
  slip: ['#fff3d9', '#e2d4b8'],
  kraft: ['#e6d3ad', '#bfa274'],
  slate: ['#7b95a6', '#58707f'],
  gold: ['#e0b04f', '#b98a3c'],
};
// How many leaves' edges a board of the clue book can show.
const LEAVES = [0, 1, 2, 3];
// Which paper each box is cut from; the first match wins, so a pressed tab is a red tag and the others stay pale.
const KINDS = [
  ['.secret-card[data-thing="tags"] .secret-tags li', 'label'],
  ['.wish-card', 'stationery'],
  ['.secret-card[data-thing="oldpage"]', 'oldpage'],
  ['.secret-card[data-thing="tags"], .gearbox', 'board'],
  ['.secret-card[data-thing="log"]', 'clipboard'],
  ['.secret-card[data-thing="register"]', 'ledger'],
  ['.secret-card[data-thing="rules"]', 'booklet'],
  ['.secret-card[data-thing="note"]', 'index'],
  ['.secret-card[data-thing="rack"]', 'kraft'],
  ['.desk-letter[data-paper="kid"] .letter-face', 'lined'],
  ['.desk-letter[data-paper="pad"] .letter-face', 'squared'],
  ['.desk-letter[data-paper="santa"] .letter-face, .desk-compose', 'stationery'],
  ['.desk-envelope[data-kind="out"] .envelope-flap', 'flapOut'],
  ['.envelope-flap', 'flapIn'],
  ['.desk-envelope[data-kind="out"]', 'airmail'],
  ['.desk-envelope', 'kidmail'],
  ['.envelope-stamp', 'stamp'],
  ['.envelope-wax', 'wax'],
  ['.compose-choice[aria-pressed="true"], .register-letter[aria-pressed="true"]', 'chosen'],
  ['.compose-choice, .lemon-card', 'slip'],
  ['.register-jobs .is-done .job-box, .notebook-jobs .is-done .job-box', 'tag'],
  ['.job-box', 'kraft'],
  ['.register-letter, .sack-count, .register-sign.is-quiet', 'pale'],
  ['.cabin-letter:not(.secret-card)', 'letter'],
  ['.chat-card', 'chatcard'],
  ['.chat-head', 'chathead'],
  ['.from-santa .chat-bubble', 'saysSanta'],
  ['.from-me .chat-bubble', 'saysYou'],
  ['.chat-ask', 'gifttag'],
  ['.feed-name', 'hangtag'],
  ['.feed-slip', 'pinned'],
  ['.advent-link', 'tag'],
  ['.feed-slip-box', 'kraft'],
  ['.cabin-caption, .cabin-tip, .cabin-away, .books-found, .shift-pin, .shift-file, .notebook-next', 'pinned'],
  ['.gearbox-hint, .desk-guide', 'pine'],
  ['.feed-basket, .play-basket', 'wood'],
  ['.wardrobe-item[aria-pressed="true"], .bag-item[aria-pressed="true"]', 'picked'],
  ['.inspect-card', 'frame'],
  ['.wardrobe-tabs button[aria-pressed="true"], .cabin-back, .cabin-letter-close, .wardrobe-reset, .hoist-hook, .hoist-release, .chat-close, .chat-send, .books-tools button, .books-enter, .gearbox-actions button, .desk-actions button, .register-sign, .theatre-close, .notebook-close, .inspect-close', 'tag'],
  ['.wardrobe-tabs button, .wardrobe-item, .cabin-explore button, .theatre-again, .theatre-skip, .notebook-hint, .shift-pick, .bag-item, .bag-look, .inspect-flip, .chair-flip', 'pale'],
  // The clue book's boards, with the edges of the leaves lying on each (`data-kind` of them, up to three); the inside of
  // its cover is a board like the left (upper) one.
  ...LEAVES.flatMap(n => [
    [`.notebook-card[data-layout="stacked"] :is(.board-half:first-child, .cover-lining)[data-kind="${n}"]`, `boardTop${n}`],
    [`.notebook-card[data-layout="stacked"] .board-half:last-child[data-kind="${n}"]`, `boardBottom${n}`],
    [`:is(.board-half:first-child, .cover-lining)[data-kind="${n}"]`, `boardLeft${n}`],
    [`.board-half:last-child[data-kind="${n}"]`, `boardRight${n}`],
  ]),
  ['.notebook-card[data-layout="stacked"] .cover-face', 'coverTop'],
  ['.cover-face', 'coverLeft'],
  ['.notebook-card[data-layout="stacked"] .book-band', 'bandAcross'],
  ['.book-band', 'band'],
  ['.notebook-card[data-layout="stacked"] :is(.book-page[data-slot="a"], .leaf-back, .cover-page)', 'pageTop'],
  ['.notebook-card[data-layout="stacked"] :is(.book-page[data-slot="b"], .book-leaf .leaf-front)', 'pageBottom'],
  ['.notebook-card :is(.book-page[data-slot="a"], .leaf-back, .cover-page)', 'pageLeft'],
  ['.notebook-card :is(.book-page[data-slot="b"], .book-leaf .leaf-front)', 'pageRight'],
  ['.book-tab[data-section="now"]', 'tag'],
  ['.book-tab[data-section="yard"]', 'pine'],
  ['.book-tab[data-section="house"]', 'kraft'],
  ['.book-tab[data-section="room"]', 'slate'],
  ['.book-tab[data-section="gifts"]', 'gold'],
  ['.is-fresh > .clue-sticker', 'picked'],
  ['.clue-sticker', 'slip'],
  ['.book-turn, .book-count', 'pale'],
  ['.cabin-noscript, .theatre-words, .reindeer-bubble, .feed-meter, .wardrobe, .cabin-explore, .play-pile, .hoist-hint, .bag-empty, .parcel-note, .shift-read', 'note'],
];
const ALL = KINDS.map(([selector]) => selector).join(', ');
const kindOf = node => KINDS.find(([selector]) => node.matches(selector))?.[1];
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
const SHADOW = 4;
let count = 0;

const image = svg => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`;
// A rounded sheet whose corners and long sides waver a little, differently for every size; `rounded` cuts one between
// any two corners (a page inside a cover, a clip).
function rounded(x0, y0, x1, y1, seed, r = Math.min(14, (y1 - y0) / 3, (x1 - x0) / 3)) {
  const jitter = i => (noise(seed + i) - .5) * 2.4;
  x0 += jitter(1); y0 += jitter(2); x1 += jitter(3); y1 += jitter(4);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return `M${x0 + r} ${y0}Q${mx} ${y0 - 1.6 + jitter(5) * .5} ${x1 - r} ${y0}Q${x1} ${y0} ${x1} ${y0 + r}Q${x1 + 1.4 + jitter(6) * .5} ${my} ${x1} ${y1 - r}`
    + `Q${x1} ${y1} ${x1 - r} ${y1}Q${mx} ${y1 + 1.6 + jitter(7) * .5} ${x0 + r} ${y1}Q${x0} ${y1} ${x0} ${y1 - r}Q${x0 - 1.4 + jitter(8) * .5} ${my} ${x0} ${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
}
const outline = (width, height, seed) => rounded(2, 2, width - 2, height - 2 - SHADOW, seed);
// A postage stamp's edge: straight sides with a half-round bite every `step` (clockwise, so the bites go inward).
export function perforated(x0, y0, x1, y1, step = 10, bite = 2.6) {
  let d = `M${x0} ${y0}`;
  const edge = (ax, ay, bx, by) => {
    const length = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(length / step)), ux = (bx - ax) / length, uy = (by - ay) / length;
    for (let i = 0; i < n; i++) { const a = (i + .5) * length / n - bite, b = a + bite * 2; d += `L${(ax + ux * a).toFixed(1)} ${(ay + uy * a).toFixed(1)}A${bite} ${bite} 0 0 0 ${(ax + ux * b).toFixed(1)} ${(ay + uy * b).toFixed(1)}`; }
    d += `L${bx} ${by}`;
  };
  edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
  return `${d}Z`;
}
// A sprig of holly at (x, y): two leaves and three berries.
function holly(parent, x, y) {
  shape('path', { d: `M${x - 20} ${y + 4}C${x - 14} ${y - 8} ${x - 2} ${y - 8} ${x + 2} ${y}C${x - 4} ${y - 1} ${x - 6} ${y + 6} ${x - 11} ${y + 3}C${x - 13} ${y + 9} ${x - 19} ${y + 9} ${x - 20} ${y + 4}Z`, fill: '#3f6653' }, parent);
  shape('path', { d: `M${x + 20} ${y + 4}C${x + 14} ${y - 8} ${x + 2} ${y - 8} ${x - 2} ${y}C${x + 4} ${y - 1} ${x + 6} ${y + 6} ${x + 11} ${y + 3}C${x + 13} ${y + 9} ${x + 19} ${y + 9} ${x + 20} ${y + 4}Z`, fill: '#4f7d68' }, parent);
  for (const [dx, dy] of [[0, 2], [-4, 6], [4, 6]]) shape('circle', { cx: x + dx, cy: y + dy, r: 3.4, fill: '#c63a33' }, parent);
}
// A red ribbon bow at (x, y), about 40 wide at `size` 1: two loops, the knot and two notched tails.
export function bow(parent, x, y, size = 1) {
  const group = shape('g', { transform: `translate(${x} ${y}) scale(${size})` }, parent);
  shape('path', { d: 'M-2 2L-11 20-6 18-4 23 2 3ZM2 2L11 20 6 18 4 23-2 3Z', fill: '#9a3a33' }, group);
  shape('path', { d: 'M-2 0C-9-13-22-11-21-1-20 8-9 7-2 2ZM2 0C9-13 22-11 21-1 20 8 9 7 2 2Z', fill: '#c0473f' }, group);
  shape('path', { d: 'M-4-1C-9-6-15-6-16-1M4-1C9-6 15-6 16-1', fill: 'none', stroke: '#9a3a33', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, group);
  shape('circle', { cx: 0, cy: 1, r: 4.4, fill: '#a8423b' }, group);
}
// A glass bauble hung by a thread `drop` long from (x, y): its gold cap, the ball and a gleam.
function bauble(parent, x, y, drop, r, fill) {
  shape('path', { d: `M${x} ${y}V${y + drop}`, stroke: '#8a6a45', 'stroke-width': 1.2, fill: 'none' }, parent);
  shape('rect', { x: x - r * .42, y: y + drop, width: r * .84, height: r * .55, rx: 1, fill: '#b98a3c' }, parent);
  const cy = y + drop + r * .45 + r;
  shape('circle', { cx: x, cy, r, fill }, parent);
  shape('path', { d: `M${x - r * .6} ${cy - r * .05}A${r * .6} ${r * .6} 0 0 1 ${x - r * .1} ${cy - r * .6}`, fill: 'none', stroke: '#fffaf0', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: .8 }, parent);
}
// A pine garland swagged across the top of a sheet: tied at both ends and in the middle (with a bow), dipping between,
// berries along it and baubles hanging from it.
function garland(paper, width, seed) {
  const top = 9, at = x => top + 10 * Math.abs(Math.sin(x / width * Math.PI * 2));
  let d = '';
  for (let x = 5; x <= width - 5; x += 6) d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${at(x).toFixed(1)}`;
  shape('path', { d, fill: 'none', stroke: '#2f5240', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, paper);
  for (let x = 7, i = 0; x < width - 6; x += 4.5, i++) {
    const y = at(x), lean = (noise(seed + i) - .5) * 4;
    shape('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)}l${(lean - 3).toFixed(1)} -7M${x.toFixed(1)} ${y.toFixed(1)}l${(lean + 3).toFixed(1)} 7`, stroke: i % 3 ? '#3f6653' : '#5f8a70', 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none' }, paper);
  }
  for (let x = 16, i = 0; x < width - 12; x += 21, i++) shape('circle', { cx: x + noise(seed + i * 3) * 6, cy: at(x) + (noise(seed + i * 5) - .5) * 6, r: 2.3, fill: '#c63a33' }, paper);
  for (const [f, drop, r, fill] of [[.13, 5, 4.6, '#9dbfd0'], [.25, 2, 6, '#c63a33'], [.37, 6, 4.6, '#e0b04f'], [.63, 6, 4.6, '#9dbfd0'], [.75, 2, 6, '#e0b04f'], [.87, 5, 4.6, '#c63a33']]) bauble(paper, width * f, at(width * f) + 4, drop, r, fill);
  bow(paper, width / 2, top, .72);
}
// A paper snowflake, six arms with a pair of twigs on each.
function snowflake(paper, x, y, r) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + .26, ux = Math.cos(a), uy = Math.sin(a), bx = x + ux * r * .55, by = y + uy * r * .55;
    d += `M${x} ${y}L${(x + ux * r).toFixed(1)} ${(y + uy * r).toFixed(1)}`;
    for (const turn of [-.75, .75]) d += `M${bx.toFixed(1)} ${by.toFixed(1)}l${(Math.cos(a + turn) * r * .32).toFixed(1)} ${(Math.sin(a + turn) * r * .32).toFixed(1)}`;
  }
  shape('path', { d, stroke: '#cfdfe8', 'stroke-width': 1.8, 'stroke-linecap': 'round', fill: 'none' }, paper);
}
// A speech bubble cut together with its tail, which points down from its left foot (Santa's) or its right (yours).
function speech(paper, width, height, seed, left, fill, shadow) {
  const bottom = height - SHADOW - 2, body = left ? rounded(12, 2, width - 2, bottom, seed) : rounded(2, 2, width - 12, bottom, seed);
  const x = left ? 0 : width, s = left ? 1 : -1, tail = `M${x + s * 24} ${bottom - 16}L${x + s * 2} ${bottom + 1}Q${x + s * 15} ${bottom} ${x + s * 28} ${bottom - 5}Z`;
  for (const d of [body, tail]) shape('path', { d, fill: shadow, transform: `translate(0 ${SHADOW})` }, paper);
  for (const d of [body, tail]) shape('path', { d, fill }, paper);
}
// Things drawn whole from the same paper, at their own size: each draws into the paper group, given the size and a seed.
const ink = (d, colour, parent, width = 1.4, opacity = 1) => shape('path', { d, fill: 'none', stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round', opacity }, parent);
const cut = (parent, d, fill, shadow) => { shape('path', { d, fill: shadow, transform: `translate(0 ${SHADOW})` }, parent); shape('path', { d, fill }, parent); };
const flap = (fill, shadow) => (paper, width, height, seed) => { const j = i => (noise(seed + i) - .5) * 2; cut(paper, `M${2 + j(1)} ${2 + j(2)}H${width - 2 + j(3)}L${width / 2 + j(4)} ${height - SHADOW}Z`, fill, shadow); };
// One of the clue book's two kraft boards, darker where it meets the other at the spine (its `spine` side), with the
// edges of `leaves` leaves lying on it showing past the top page towards the fore-edge (and a little below it). The page
// lies inset from the board as css/santa.css sets it: 14px, 14px at the fore-edge and 20px below on a wide screen, 16px
// above and below and 12px at the sides when the pages are stacked; flush at the spine.
const bookBoard = (spine, leaves = 0) => (paper, width, height, seed) => {
  cut(paper, outline(width, height, seed), '#c9a46a', '#a8865a');
  const bottom = height - SHADOW;
  shape('rect', { ...{ left: { x: 2, y: 3, width: 12, height: bottom - 6 }, right: { x: width - 14, y: 3, width: 12, height: bottom - 6 }, top: { x: 3, y: 2, width: width - 6, height: 12 }, bottom: { x: 3, y: bottom - 14, width: width - 6, height: 12 } }[spine], rx: 4, fill: '#a8774d' }, paper);
  const page = { left: [0, 14, width - 14, height - 20], right: [14, 14, width, height - 20], top: [12, 0, width - 12, height - 16], bottom: [12, 16, width - 12, height] }[spine];
  const out = { left: [1, 0], right: [-1, 0], top: [0, 1], bottom: [0, -1] }[spine], drop = spine === 'left' || spine === 'right' ? .6 : 0;
  for (let k = leaves; k >= 1; k--) {
    const dx = out[0] * k * 2.2, dy = out[1] * k * 2.2 + k * drop;
    shape('path', { d: rounded(page[0] + dx, page[1] + dy, page[2] + dx, page[3] + dy, seed + k, 4), fill: k % 2 ? '#f6eedd' : '#efe4cc', stroke: '#d6c3a0', 'stroke-width': .8 }, paper);
  }
};
// A page of the clue book: cream paper, ruled faintly, shaded a little towards the spine on its `spine` side.
const bookPage = spine => (paper, width, height, seed) => {
  shape('path', { d: rounded(1, 1, width - 1, height - 1, seed, 4), fill: '#fffaf0' }, paper);
  for (let y = 58; y < height - 16; y += 30) ink(`M18 ${y}H${width - 18}`, '#f0e5ce', paper, 1);
  for (let i = 1; i <= 4; i++) {
    const t = i * 6;
    shape('rect', { ...{ left: { x: 0, y: 0, width: t, height }, right: { x: width - t, y: 0, width: t, height }, top: { x: 0, y: 0, width, height: t }, bottom: { x: 0, y: height - t, width, height: t } }[spine], fill: '#b08d5c', opacity: .05 }, paper);
  }
};
// The clue book's cover: kraft board darker along its hinge (on its left, or along its top when the pages are stacked),
// a cream label for its name (written over it in the page) with a sprig of holly at its corner. Its elastic band is a
// strip of its own (`band`), since it slips off before the cover opens.
const bookCover = hinge => (paper, width, height, seed) => {
  cut(paper, outline(width, height, seed), '#c9a46a', '#a8865a');
  const bottom = height - SHADOW, left = hinge === 'left';
  shape('rect', left ? { x: 3, y: 3, width: 16, height: bottom - 6, rx: 4, fill: '#a8774d' } : { x: 3, y: 3, width: width - 6, height: 16, rx: 4, fill: '#a8774d' }, paper);
  shape('path', { d: rounded(width * .25, bottom * .26, width * .75, bottom * .46, seed + 4, 6), fill: '#fffaf0' }, paper);
  ink(`M${(width * .3).toFixed(1)} ${(bottom * .43).toFixed(1)}H${(width * .7).toFixed(1)}`, '#b5443c', paper, 2);
  holly(paper, width * .75 - 4, bottom * .26 + 2);
};
const OBJECTS = {
  // The name board and the gearbox's case: planks with their grain and seams, a nail in each corner.
  board(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#9b6a45', '#5f4030');
    for (let y = 44; y < height - 16; y += 44) ink(`M6 ${y}H${width - 6}`, '#74492f', paper, 2, .75);
    for (let i = 0, n = Math.round(height / 13); i < n; i++) {
      const y = 9 + i * 13 + noise(seed + i) * 5, x = 8 + noise(seed + i * 3) * width * .45, length = width * (.2 + noise(seed + i * 7) * .35);
      ink(`M${x.toFixed(1)} ${y.toFixed(1)}q${(length / 2).toFixed(1)} ${((noise(seed + i * 11) - .5) * 4).toFixed(1)} ${length.toFixed(1)} 0`, '#85593b', paper, 1.3, .6);
    }
    for (const [x, y] of [[13, 14], [width - 13, 14], [13, height - SHADOW - 14], [width - 13, height - SHADOW - 14]]) { shape('circle', { cx: x, cy: y, r: 3.2, fill: '#5a4232' }, paper); shape('circle', { cx: x - .8, cy: y - .8, r: 1.1, fill: '#c2a98e' }, paper); }
  },
  // A name tag: a shipping label with its corners cut, an eyelet and the end of its string.
  label(paper, width, height, seed) {
    const c = Math.min(15, width * .15), j = i => (noise(seed + i) - .5) * 1.6, bottom = height - SHADOW - 2;
    cut(paper, `M${c + j(1)} ${2 + j(2)}H${width - c + j(3)}L${width - 2} ${c + 2}V${bottom}H2V${c + 2}Z`, '#f6ead2', '#b8996c');
    shape('circle', { cx: width / 2, cy: c * .7 + 4, r: 5.5, fill: '#e3cfa6' }, paper); shape('circle', { cx: width / 2, cy: c * .7 + 4, r: 2.6, fill: '#7a5236' }, paper);
    ink(`M${width / 2} ${c * .7 + 1.5}Q${width / 2 - 7} ${c * .35} ${width / 2 - 3} 0`, '#b08a5c', paper, 1.5);
  },
  // The shift log: a board, a sheet held to it, and the metal clip.
  clipboard(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#b98d5c', '#7a5636');
    const page = rounded(14, 26, width - 14, height - SHADOW - 52, seed + 9, 4);
    shape('path', { d: page, fill: '#d8c6a6', transform: 'translate(1 3)' }, paper); shape('path', { d: page, fill: '#fffdf6' }, paper);
    for (let y = 74; y < height - SHADOW - 62; y += 30) ink(`M26 ${y}H${width - 26}`, '#ebe0c9', paper, 1);
    const clip = Math.min(110, width * .32), x = width / 2 - clip / 2;
    shape('path', { d: rounded(x, 8, x + clip, 36, seed + 3, 8), fill: '#8b97a0' }, paper);
    shape('path', { d: rounded(x + 6, 12, x + clip - 6, 22, seed + 5, 4), fill: '#d3dbe1' }, paper);
    for (const cx of [x + 12, x + clip - 12]) shape('circle', { cx, cy: 29, r: 2.4, fill: '#5f6b74' }, paper);
  },
  // The register: a leather cover with a gold line, a plain page (its rows are ruled as they scroll), and the end of a red
  // ribbon over the top edge of the cover, clear of the words.
  ledger(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#6b3f2a', '#3f2618');
    for (let i = 0; i < 40; i++) shape('circle', { cx: noise(seed + i) * width, cy: noise(seed + i * 5) * height, r: 1.1, fill: '#5a3423', opacity: .6 }, paper);
    shape('path', { d: rounded(8, 8, width - 8, height - SHADOW - 8, seed + 2, 9), fill: 'none', stroke: '#c9a14a', 'stroke-width': 1.6 }, paper);
    shape('path', { d: rounded(13, 13, width - 13, height - SHADOW - 13, seed + 4, 6), fill: '#fbf3e2' }, paper);
    const x = width - 62, long = 26;
    shape('path', { d: `M${x} 0H${x + 16}V${long}L${x + 8} ${long - 9}L${x} ${long}Z`, fill: '#b5443c' }, paper);
  },
  // The rulebook: a page bound with red cloth down its spine.
  booklet(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#fffaf0', '#d8c8a8');
    const bottom = height - SHADOW - 3;
    shape('path', { d: `M3 7Q3 3 8 3H30V${bottom}H8Q3 ${bottom} 3 ${bottom - 4}Z`, fill: '#a84a42' }, paper);
    ink(`M30 4V${bottom}`, '#7f312c', paper, 2.2);
    for (const f of [.18, .5, .82]) ink(`M7 ${(bottom * f).toFixed(1)}H26`, '#8f3b36', paper, 1.6);
  },
  // An index card: a red line under its head, pale blue rules.
  index(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#fffdf6', '#dccaa9');
    ink(`M10 42H${width - 10}`, '#e8a3a0', paper, 1.8);
    for (let y = 70; y < height - SHADOW - 10; y += 29) ink(`M10 ${y}H${width - 10}`, '#d3e2ee', paper, 1);
  },
  // A child's page torn from a spiral notebook: the holes along its top, blue rules (one line of writing each), a red margin.
  lined(paper, width, height) {
    const step = 27, bite = 5, top = 3, bottom = height - SHADOW - 2;
    let d = `M2 ${top}`;
    for (let x = 14; x + bite < width - 6; x += step) d += `H${x - bite}A${bite} ${bite} 0 0 0 ${x + bite} ${top}`;
    cut(paper, `${d}H${width - 2}V${bottom}H2Z`, '#fffef8', '#d9cdb5');
    for (let y = 37.6; y < bottom - 6; y += 28.8) ink(`M4 ${y.toFixed(1)}H${width - 4}`, '#c3d7e6', paper, 1);
    ink(`M37 ${top + 2}V${bottom - 2}`, '#e8a3a0', paper, 1.3);
  },
  // A page from the squared work pad, taped up.
  squared(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#fff8d8', '#dfd09b');
    for (let x = 16; x < width - 4; x += 16) ink(`M${x} 6V${height - SHADOW - 6}`, '#ece0b0', paper, .8);
    for (let y = 16; y < height - SHADOW - 4; y += 16) ink(`M5 ${y}H${width - 5}`, '#ece0b0', paper, .8);
    shape('rect', { x: width / 2 - 34, y: 0, width: 68, height: 15, fill: '#efe2b4', opacity: .85, transform: `rotate(-3 ${width / 2} 7)` }, paper);
  },
  // Santa's own paper: a red line and a green one inside its edge (the holly is drawn on the letter).
  stationery(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#fffcf3', '#e4d6bf');
    shape('path', { d: rounded(9, 9, width - 9, height - SHADOW - 9, seed + 2, 4), fill: 'none', stroke: '#b5443c', 'stroke-width': 2 }, paper);
    shape('path', { d: rounded(14, 14, width - 14, height - SHADOW - 14, seed + 6, 3), fill: 'none', stroke: '#3f6653', 'stroke-width': 1.1 }, paper);
  },
  // An airmail envelope: red and blue stripes all round its edge, the folds of its back faint across the face.
  airmail(paper, width, height, seed) {
    const d = outline(width, height, seed);
    shape('path', { d, fill: '#c9b48f', transform: `translate(0 ${SHADOW})` }, paper);
    shape('clipPath', { id: 'edge' }, paper).append(shape('path', { d }));
    const stripes = shape('g', { 'clip-path': 'url(#edge)' }, paper);
    shape('path', { d, fill: '#fffaf0' }, stripes);
    for (let x = -height, i = 0; x < width + height; x += 20, i++) shape('path', { d: `M${x} 0h11l${-height} ${height}h-11Z`, fill: i % 2 ? '#3f5a7a' : '#b5443c' }, stripes);
    shape('path', { d: rounded(10, 10, width - 10, height - SHADOW - 10, seed + 3, 3), fill: '#f6ecd8' }, paper);
    ink(`M12 12L${width / 2} ${((height - SHADOW) * .52).toFixed(1)}L${width - 12} 12`, '#e6d6b4', paper, 1.4);
  },
  // A child's envelope, pale blue.
  kidmail(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#e6eff5', '#b9c9d6');
    ink(`M10 10L${width / 2} ${((height - SHADOW) * .52).toFixed(1)}L${width - 10} 10`, '#d2dfe9', paper, 1.4);
  },
  flapIn: flap('#d6e3ec', '#aebfcc'),
  flapOut: flap('#ecdfc2', '#cbb990'),
  // A postage stamp: perforated edge, a red frame round a little fir and its star.
  stamp(paper, width, height) {
    const bottom = height - SHADOW;
    cut(paper, perforated(2, 2, width - 2, bottom - 1, 7, 1.8), '#fffaf0', '#c9b48f');
    shape('rect', { x: 6, y: 6, width: width - 12, height: bottom - 13, fill: '#b5443c' }, paper);
    shape('path', { d: `M${width / 2} ${bottom * .26}L${width * .76} ${bottom * .7}H${width * .24}Z`, fill: '#4f7d68' }, paper);
    shape('rect', { x: width / 2 - 2, y: bottom * .7, width: 4, height: bottom * .1, fill: '#6b4a33' }, paper);
    shape('circle', { cx: width / 2, cy: bottom * .24, r: 2.4, fill: '#e0b04f' }, paper);
  },
  // A drop of sealing wax, pressed round: an uneven edge and the ring of the seal.
  wax(paper, width, height, seed) {
    const cx = width / 2, cy = (height - SHADOW) / 2, r = Math.min(cx, cy) - 2;
    let d = '';
    for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2, rr = r * (.88 + noise(seed + i % 18) * .14); d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }
    cut(paper, `${d}Z`, '#a8423b', '#6e2c28');
    shape('circle', { cx, cy, r: r * .64, fill: 'none', stroke: '#c9665c', 'stroke-width': 1.6 }, paper);
  },
  ...Object.fromEntries(LEAVES.flatMap(n => [[`boardLeft${n}`, bookBoard('right', n)], [`boardRight${n}`, bookBoard('left', n)], [`boardTop${n}`, bookBoard('bottom', n)], [`boardBottom${n}`, bookBoard('top', n)]])),
  pageLeft: bookPage('right'), pageRight: bookPage('left'), pageTop: bookPage('bottom'), pageBottom: bookPage('top'),
  coverLeft: bookCover('left'), coverTop: bookCover('top'),
  // The elastic band round the shut clue book: red, a thread of a darker red down it, darker where it bends round the
  // edges of the cover; down near the fore-edge, or across it when the pages are stacked.
  band(paper, width, height) {
    const x = width / 2 - 4.5, bottom = height - SHADOW;
    cut(paper, `M${x} 1H${x + 9}V${bottom}H${x}Z`, '#b5443c', '#7f312c');
    for (const y of [1, bottom - 5]) shape('rect', { x, y, width: 9, height: 5, fill: '#8f3530' }, paper);
    ink(`M${width / 2} 7V${bottom - 7}`, '#9a3a33', paper, 1);
  },
  bandAcross(paper, width, height) {
    const y = (height - SHADOW) / 2 - 4.5;
    cut(paper, `M1 ${y}H${width - 1}V${y + 9}H1Z`, '#b5443c', '#7f312c');
    for (const x of [1, width - 6]) shape('rect', { x, y, width: 5, height: 9, fill: '#8f3530' }, paper);
    ink(`M7 ${y + 4.5}H${width - 7}`, '#9a3a33', paper, 1);
  },
  // Looking closely: a kraft mount round a cream card, with a darker paper corner holding each corner of the card.
  frame(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#c9a46a', '#a8865a');
    shape('path', { d: rounded(12, 12, width - 12, height - SHADOW - 12, seed + 5, 6), fill: '#fffaf0' }, paper);
    const bottom = height - SHADOW - 12;
    for (const [x, y, dx, dy] of [[12, 12, 1, 1], [width - 12, 12, -1, 1], [12, bottom, 1, -1], [width - 12, bottom, -1, -1]]) shape('path', { d: `M${x} ${y}h${dx * 26}L${x} ${y + dy * 26}Z`, fill: '#a8774d' }, paper);
  },
  // The register's old page: yellowed, foxed here and there, and the red cord that tied it lying loose along its edge.
  oldpage(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#f1e2bd', '#c9b07c');
    for (let i = 0; i < 14; i++) shape('circle', { cx: noise(seed + i) * width, cy: noise(seed + i * 5) * height, r: 2 + noise(seed + i * 9) * 6, fill: '#e2c98f', opacity: .45 }, paper);
    ink(`M4 20Q22 34 12 56Q4 76 22 92Q34 104 18 122`, '#b5443c', paper, 3);
  },
  // Talking with Santa: the card is his stationery (a red line and a green one inside its edge) with a pine garland swagged
  // across the top and a few paper snowflakes low behind the words; its head has a string of little lights along its foot.
  chatcard(paper, width, height, seed) {
    OBJECTS.stationery(paper, width, height, seed);
    for (const [x, y, r] of [[30, height - 42, 10], [56, height - 24, 6.5], [width * .5, height - 22, 5]]) snowflake(paper, x, y, r);
    garland(paper, width, seed);
  },
  chathead(paper, width, height, seed) {
    const wire = height - 17, at = x => wire + 4 * Math.sin(x / width * Math.PI * 3) ** 2;
    let d = '';
    for (let x = 2; x <= width - 2; x += 6) d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${at(x).toFixed(1)}`;
    ink(d, '#6b5a4c', paper, 1.3);
    for (let x = 14, i = 0; x < width - 8; x += 26, i++) {
      const bulb = shape('g', { transform: `translate(${x.toFixed(1)} ${at(x).toFixed(1)}) rotate(${((noise(seed + i) - .5) * 36).toFixed(1)})` }, paper);
      shape('rect', { x: -2.2, y: 0, width: 4.4, height: 3.4, fill: '#7d8790' }, bulb);
      shape('path', { d: 'M0 3C-4.6 5-5 11 0 14.5 5 11 4.6 5 0 3Z', fill: ['#c63a33', '#e0b04f', '#4f7d68', '#7b95a6'][i % 4] }, bulb);
      shape('path', { d: 'M-1.7 6.6Q-2 9.2-.7 11', stroke: '#fffaf0', 'stroke-width': 1, fill: 'none', opacity: .75 }, bulb);
    }
  },
  saysSanta(paper, width, height, seed) {
    speech(paper, width, height, seed, true, '#fbf3df', '#dccaa9');
    if (width > 100) holly(shape('g', { transform: `translate(${width - 17} 7) scale(.5)` }, paper), 0, 0);
  },
  saysYou: (paper, width, height, seed) => speech(paper, width, height, seed, false, '#e4eedc', '#bccdb2'),
  // A reply to give him: a gift tag, its end cut to a point with an eyelet, and the two loose ends of a red string tied
  // through it.
  gifttag(paper, width, height, seed) {
    const bottom = height - SHADOW - 2, mid = bottom / 2 + 1, end = 14 + Math.min(12, bottom / 2), j = i => (noise(seed + i) - .5) * 1.4;
    cut(paper, `M${end} ${2 + j(1)}H${width - 2 + j(2)}V${bottom + j(3)}H${end}L14 ${mid}Z`, '#f3e3c3', '#c9ae80');
    shape('circle', { cx: end + 5, cy: mid, r: 4.6, fill: '#e2cc9f' }, paper); shape('circle', { cx: end + 5, cy: mid, r: 2.1, fill: '#7a5236' }, paper);
    ink(`M${end + 5} ${mid}C${end - 4} ${mid - 9} 9 ${mid - 9} 2 ${mid - 4}M${end + 5} ${mid}C${end - 6} ${mid + 5} 10 ${mid + 9} 3 ${mid + 8}`, '#b5443c', paper, 1.8);
  },
  // A name tag hung under a food in the basket: a little card with its top corners cut, an eyelet, and its red thread.
  hangtag(paper, width, height, seed) {
    const top = 8, c = 5, bottom = height - SHADOW - 2, j = i => (noise(seed + i) - .5) * 1.2;
    cut(paper, `M${2 + c} ${top + j(1)}H${width - 2 - c}L${width - 2} ${top + c}V${bottom + j(2)}H2V${top + c}Z`, '#f3e3c3', '#c9ae80');
    shape('circle', { cx: width / 2, cy: top + 5, r: 2.3, fill: '#7a5236' }, paper);
    ink(`M${width / 2} ${top + 5}V0`, '#b5443c', paper, 1.4);
  },
  // A chosen slip or letter: warmer paper with a red line round it.
  chosen(paper, width, height, seed) {
    cut(paper, outline(width, height, seed), '#fde3bd', '#d9b98a');
    shape('path', { d: rounded(4, 4, width - 4, height - SHADOW - 4, seed + 1, 6), fill: 'none', stroke: '#b5443c', 'stroke-width': 1.8 }, paper);
  },
};
const sheets = new Map();
function sheet(kind, width, height) {
  const key = `${kind}:${width}x${height}`;
  if (sheets.has(key)) return sheets.get(key);
  const svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width, height }), seed = width * 7 + height;
  const paper = shape('g', { filter: paperFilter(svg, `cabin-ui-${++count}`, { scale: .5, grain: .55, shadow: .16 }) }, svg);
  if (OBJECTS[kind]) OBJECTS[kind](paper, width, height, seed);
  else { const [fill, shadow] = PAPERS[kind]; cut(paper, outline(width, height, seed), fill, shadow); }
  const trim = PAPERS[kind]?.[2];
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
    if (!kind || width < 16 || height < 16) { node.style.backgroundImage = ''; drawn.delete(node); return; }
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
  // New boxes come and go with each game.
  new MutationObserver(records => {
    for (const record of records) {
      // A pressed tab, another letter on the desk, an envelope going out: the box, and what is inside it, may change kind.
      if (record.type === 'attributes') { watch(record.target); paint(record.target); record.target.querySelectorAll(ALL).forEach(paint); }
      else record.addedNodes.forEach(watch);
    }
  }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'data-paper', 'data-kind', 'data-thing'] });
  watch(root);
  root.style.setProperty('--paper-tail', tail());
  root.dataset.paper = '';
}
