// The craft booth's workshop, Santa's Little Art Workshop (docs/VENDING-MARKET.md): a little thing from the vending
// machine as a coloring page (data/coloring-pages.js: the thing in a little scene) on a thick cream sheet on the workshop
// table, coloured part by part with crayons from an old tin (a part tapped, or reached with Tab and Enter, fills with the
// crayon's grain, flecks of the paper showing through). Swatch cards colour the whole sheet at once; stickers (a star, a
// snowflake, holly) are picked up and pressed on; undo and redo go a step at a time, 重新上色 starts the sheet over (and
// can be undone too). Every thing from the machine is a new sheet, kept in this browser as a work of its own once
// anything is on it (services/vending-works.js), so the same thing may be coloured as often as one likes. On the wall a
// little shelf shows works in frames, two the elves made and the newest of one's own; it opens the album of every work
// kept here, to go on with one, to let one go, or to begin a new sheet. 完成 folds the tools away, sets the sheet on a
// little stand under the lamp, turns it to the light and presses a stamp in its corner, then a card offers to save it as
// a picture, to go on, or to go back to the market. Every line wavers a little like a hand's (an SVG displacement) and is
// drawn twice, faintly offset; each part's edge is drawn with it, so a thing in front hides the edges of what is behind.
import { NS, paperLayer, shape } from './paper-art.js';
import { titleGlyphs } from '../data/title-glyphs.js';
import { CRAYONS, ITEMS, VENDING } from '../data/vending.js';
import { PAGES } from '../data/coloring-pages.js';
import { BLANK, MOST, STICKERS, dropWork, keepWork, newKey, presetFills, readWorks, touched, writeWorks } from '../services/vending-works.js';
import { STICKER_ART, goBack, keepIt, rosette, albumPage, albumRibbon, albumSpread, bookmark, cross, emptyAlbum, pencil, photoCorners, query, washi, corkboard, crayon, doorSign, eraser, frame, lamp, lampGlow, paperFlake, peg, roomBulbs, seal, stand, stickerSheet, table, tinBack, tinFront, token, wall } from './vending-workshop-art.js';
import { elf } from './vending-square-art.js';

// The sheet is 340 × 440: the drawing's own 300 × 360 box sits 20 in from the top and the sides, the stamp in the margin
// below it.
const SHEET = [340, 440], AT = 20, INK = '#5b3d2e';
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const star = (cx, cy, outer, inner) => `M${Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? inner : outer; return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; }).join('L')}Z`;
// The machine's own little pictures of the four things (its round buttons, vending-papercraft.js): each its parts, bottom
// to top, and its ink lines (not coloured: eyes, smiles, icing, twigs). The workshop's pages are data/coloring-pages.js.
export const DRAWINGS = {
  stocking: {
    parts: [
      'M88 100H212V232C246 238 270 252 272 282C274 314 246 330 214 330H150C112 330 88 304 88 268Z',
      'M88 252C88 300 110 326 146 330C130 312 122 290 122 266C122 254 110 248 88 252Z',
      'M214 330C246 330 274 314 272 282C270 266 262 256 250 248C244 276 236 306 214 330Z',
      star(150, 176, 36, 15),
      'M82 40H218Q226 40 226 48V92Q226 100 218 100H82Q74 100 74 92V48Q74 40 82 40Z',
      'M140 12H160Q166 12 166 18V40H134V18Q134 12 140 12Z',
    ],
    ink: ['M96 70Q120 62 144 70T192 70T212 66'],
  },
  tree: {
    parts: [
      'M150 176L258 284H42Z', 'M150 110L234 206H66Z', 'M150 58L208 136H92Z',
      'M134 284H166V310H134Z', 'M108 310H192L184 346H116Z', star(150, 44, 26, 11),
      circle(130, 118, 8), circle(172, 128, 8), circle(112, 186, 10), circle(188, 176, 9), circle(100, 262, 11), circle(150, 236, 10), circle(200, 266, 11),
    ],
    ink: ['M96 162Q150 184 204 160', 'M66 244Q150 274 234 244'],
  },
  gingerbread: {
    parts: [
      'M150 30C178 30 196 52 196 78C196 96 188 110 176 118C196 120 222 124 244 132C262 138 264 166 244 170C222 174 202 168 186 166L190 214C204 240 222 270 232 296C240 318 216 332 202 316C186 296 170 270 150 252C130 270 114 296 98 316C84 332 60 318 68 296C78 270 96 240 110 214L114 166C98 168 78 174 56 170C36 166 38 138 56 132C78 124 104 120 124 118C112 110 104 96 104 78C104 52 122 30 150 30Z',
      circle(128, 90, 8), circle(172, 90, 8),
      'M150 140L124 126V154Z', 'M150 140L176 126V154Z', circle(150, 140, 7),
      circle(150, 178, 8), circle(150, 206, 8), circle(150, 234, 8),
    ],
    ink: [circle(134, 72, 4.5), circle(166, 72, 4.5), 'M134 96Q150 110 166 96', 'M58 150l7-8 7 8 7-8', 'M222 150l7-8 7 8 7-8', 'M84 306l7-8 7 8', 'M202 306l7-8 7 8'],
  },
  snowman: {
    parts: [
      circle(150, 272, 78), circle(150, 150, 52),
      'M100 190C128 206 172 206 200 190L202 210C172 226 128 226 98 210Z', 'M168 210L188 262L170 268L152 216Z',
      'M116 50H184V108H116Z', 'M116 90H184V106H116Z', 'M96 106H204Q210 106 210 112V116Q210 122 204 122H96Q90 122 90 116V112Q90 106 96 106Z',
      'M150 158L196 168L150 176Z', circle(150, 248, 7), circle(150, 276, 7), circle(150, 304, 7),
    ],
    ink: [circle(134, 142, 4.5), circle(166, 142, 4.5), 'M76 238L30 206M46 216L38 198', 'M224 238L270 206M254 216L262 198'],
  },
};
// Each drawing coloured in, for the vending machine's round buttons (vending-papercraft.js): a colour for every part, in order.
export const ICONS = {
  stocking: ['#b5443c', '#fbf3df', '#fbf3df', '#e0b04f', '#fbf3df', '#3f6653'],
  tree: ['#3f6653', '#4f7d68', '#3f6653', '#8a5a3c', '#b5443c', '#e0b04f', '#b5443c', '#e0b04f', '#9fbdd2', '#b5443c', '#e0b04f', '#9fbdd2', '#b5443c'],
  gingerbread: ['#c0864f', '#e9b6b0', '#e9b6b0', '#b5443c', '#b5443c', '#a8423b', '#fbf3df', '#fbf3df', '#fbf3df'],
  snowman: ['#fbf8f1', '#fbf8f1', '#b5443c', '#a8423b', '#3b3438', '#b5443c', '#3b3438', '#d9844d', '#3b3438', '#3b3438', '#3b3438'],
};
// Each page in the crayons' own colours, for the classic swatch card.
const classic = id => PAGES[id].colours;
const SWATCH = ['#b03f37', '#3f6653', '#e2b65a', '#f4ead3'];
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const svg = (name, attributes, parent) => { const node = document.createElementNS(NS, name); for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value); parent?.append(node); return node; };
let count = 0;

// The paper: a cream sheet with a soft rim and shadow, two strips of tape holding it to the desk.
function sheetPaper(g) {
  shape('rect', { x: 6, y: 6, width: 328, height: 428, rx: 3, fill: BLANK }, g);
  shape('path', { d: 'M24 -4L92 2 88 26 20 20Z', fill: '#d8c19a', opacity: .78 }, g);
  shape('path', { d: 'M250 2L318 -6 322 18 254 26Z', fill: '#c9a3a0', opacity: .72 }, g);
}
// The two filters every drawing is seen through: the hand's waver (the same noise for fills and lines, so they stay
// together) and, over the fills, the crayon's grain: flecks the colour of the paper where the wax did not catch.
function filters(art, id) {
  const defs = svg('defs', {}, art);
  const hand = svg('filter', { id: `${id}-hand`, x: '-3%', y: '-3%', width: '106%', height: '106%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '.045', numOctaves: 2, seed: 7, result: 'wobble' }, hand);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'wobble', scale: 3, xChannelSelector: 'R', yChannelSelector: 'G' }, hand);
  const grain = svg('filter', { id: `${id}-grain`, x: '-3%', y: '-3%', width: '106%', height: '106%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '.045', numOctaves: 2, seed: 7, result: 'wobble' }, grain);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'wobble', scale: 3, xChannelSelector: 'R', yChannelSelector: 'G', result: 'drawn' }, grain);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '.9 .55', numOctaves: 3, seed: 11, result: 'noise' }, grain);
  svg('feColorMatrix', { in: 'noise', type: 'matrix', values: '0 0 0 0 .98  0 0 0 0 .95  0 0 0 0 .88  0 0 0 -3.4 1.62', result: 'flecks' }, grain);
  svg('feComposite', { in: 'flecks', in2: 'drawn', operator: 'in', result: 'paper' }, grain);
  const merge = svg('feMerge', {}, grain); svg('feMergeNode', { in: 'drawn' }, merge); svg('feMergeNode', { in: 'paper' }, merge);
  // (and the grain alone, for a part under the hand's waver already)
  const flecks = svg('filter', { id: `${id}-flecks`, x: '-3%', y: '-3%', width: '106%', height: '106%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '.9 .55', numOctaves: 3, seed: 11, result: 'noise' }, flecks);
  svg('feColorMatrix', { in: 'noise', type: 'matrix', values: '0 0 0 0 .98  0 0 0 0 .95  0 0 0 0 .88  0 0 0 -3.4 1.62', result: 'specks' }, flecks);
  svg('feComposite', { in: 'specks', in2: 'SourceGraphic', operator: 'in', result: 'paper' }, flecks);
  const over = svg('feMerge', {}, flecks); svg('feMergeNode', { in: 'SourceGraphic' }, over); svg('feMergeNode', { in: 'paper' }, over);
}
// A work in little (on the shelf, in the album): each part filled and edged in turn, the ink over them, its stickers, a
// gold star once it is finished.
function miniature(mini, page, work) {
  mini.replaceChildren();
  const edges = { fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  page.parts.forEach((d, i) => { svg('path', { d, fill: work?.fills[i] ?? BLANK }, mini); svg('path', { d, ...edges }, mini); });
  const ink = svg('g', edges, mini);
  for (const d of page.ink) svg('path', { d, ...(d.endsWith('Z') ? { fill: INK } : {}) }, ink);
  for (const [kind, x, y, turn] of work?.stickers ?? []) STICKER_ART[kind](svg('g', { transform: `translate(${x} ${y}) rotate(${turn}) scale(1.3)` }, mini));
  if (work?.finished) STICKER_ART.star(svg('g', { transform: 'translate(262 324) scale(1.9)' }, mini));
}
const day = at => { const date = new Date(at); return `${date.getMonth() + 1}/${date.getDate()}`; };
// The ink stamp pressed when the work is done: a little postmark-like frame with "Merry Christmas" in the Home title's
// letters (paths, so a saved picture needs no font), a few stars, in red ink that took unevenly.
function stamp(art, id) {
  const group = svg('g', { class: 'color-stamp', transform: 'translate(262 404) rotate(-9)', filter: `url(#${id}-grain)` }, art);
  svg('rect', { x: -58, y: -26, width: 116, height: 52, rx: 9, fill: 'none', stroke: '#b5443c', 'stroke-width': 2.6, opacity: .86 }, group);
  svg('rect', { x: -53, y: -21, width: 106, height: 42, rx: 6, fill: 'none', stroke: '#b5443c', 'stroke-width': 1, opacity: .6 }, group);
  const words = svg('g', { transform: 'translate(-47 -20) scale(.124)', fill: '#b5443c', opacity: .88 }, group);
  for (const { d } of titleGlyphs) svg('path', { d }, words);
  return group;
}
// A drawing coloured in (ICONS), with the same hand-drawn lines and crayon grain as on the desk, as SVG source.
export function drawingSvg(id) {
  const art = svg('svg', { xmlns: NS, viewBox: '0 0 300 360', width: 300, height: 360 }), key = `icon-${id}`, drawing = DRAWINGS[id];
  filters(art, key);
  const fills = svg('g', { filter: `url(#${key}-grain)` }, art);
  drawing.parts.forEach((d, i) => svg('path', { d, fill: ICONS[id][i] ?? BLANK }, fills));
  const lines = svg('g', { fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: `url(#${key}-hand)` }, art);
  for (const d of [...drawing.parts, ...drawing.ink]) svg('path', { d, ...(d.endsWith('Z') && drawing.ink.includes(d) ? { fill: INK } : {}) }, lines);
  return new XMLSerializer().serializeToString(art);
}


export function mountWorkshop(host, { room: walls = null, onBack = () => {}, sound = null } = {}) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal }), id = `color-${++count}`, still = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set(), later = (ms, fn) => { const timer = setTimeout(() => { timers.delete(timer); fn(); }, still.matches ? 0 : ms); timers.add(timer); };
  const storage = (() => { try { return globalThis.localStorage ?? null; } catch { return null; } })();
  let works = readWorks(storage, Object.fromEntries(ITEMS.map(each => [each.id, PAGES[each.id].parts.length])));
  const small = { paper: { scale: .3, grain: .5, shadow: .3 }, eager: true };
  if (walls) {
    paperLayer(walls, '0 0 1440 470', 'shop-wall', wall, { paper: { scale: .9, grain: .45, shadow: .2 }, eager: true, preserveAspectRatio: 'xMidYMax slice' });
    paperLayer(walls, '0 0 1440 470', 'shop-bulbs', roomBulbs, { paper: null, eager: true, preserveAspectRatio: 'xMidYMax slice' });
    paperLayer(walls, '0 0 1440 330', 'shop-table', table, { paper: { scale: .9, grain: .45, shadow: .2 }, eager: true, preserveAspectRatio: 'xMidYMin slice' });
  }
  const status = element('p', 'sr-only', host); status.setAttribute('role', 'status');
  // Focus moved for the visitor shows its ring only when they are using the keyboard (a click leaves no box round anything).
  let byKeys = false;
  on(document, 'keydown', () => { byKeys = true; }); on(document, 'pointerdown', () => { byKeys = false; });
  const quiet = (node, scroll = false) => node?.focus({ preventScroll: !scroll, focusVisible: byKeys });
  // On the wall, under everything: paper snowflakes hung from the ceiling, the corkboard (a snowman the elves coloured in,
  // the day's colours), and an elf on the table by the sheet (who hops when a work is done).
  const decor = element('div', 'shop-decor', host); decor.setAttribute('aria-hidden', 'true');
  [[26.5, 2.4], [30.5, 5.2], [67.5, 3.4], [86.5, 7.2]].forEach(([left, drop], i) => {
    const flake = element('span', 'shop-flake', decor); flake.style.left = `${left}%`; flake.style.top = `${11 + drop}%`; flake.style.setProperty('--thread', `${drop * 1.6 + 1.5}rem`); flake.style.animationDelay = `${-i * 1.3}s`;
    paperLayer(flake, '0 0 100 100', '', paperFlake, { paper: { scale: .3, grain: .4, shadow: .25, rim: '#ffffff' }, eager: true });
  });
  paperLayer(element('span', 'shop-cork', decor), '0 0 260 170', '', corkboard, { paper: { scale: .45, grain: .45, shadow: .3, rim: '#f7efe2' }, eager: true });
  paperLayer(element('span', 'shop-elf', decor), '0 0 100 162', '', elf({ tunic: '#4f7d68' }).draw, { paper: { scale: .25, grain: .35, shadow: .25, rim: '#fbf3e3' }, eager: true });

  // The shelf on the wall: three works in frames, two the elves made (in the classic colours) and the newest of one's own
  // (or a third of the elves', before there is one); a tap on it opens the album.
  const shelf = element('button', 'shop-shelf', host); shelf.type = 'button';
  element('span', 'shop-shelf-name', shelf).setAttribute('aria-hidden', 'true');
  const SAMPLES = ['tree', 'gingerbread', 'snowman'];
  const showcase = SAMPLES.map(() => { const spot = element('span', 'shop-frame', shelf); paperLayer(spot, '0 0 100 124', 'shop-frame-wood', frame, small); const mini = svg('svg', { viewBox: '0 0 300 360', class: 'shop-mini', 'aria-hidden': 'true' }, spot); const tag = element('span', 'shop-frame-mark', spot); paperLayer(tag, '0 0 20 44', '', bookmark, small); return { spot, mini, tag }; });
  function show() {
    const mine = works.find(work => work.finished) ?? works[0] ?? null;
    showcase.forEach(({ spot, mini, tag }, i) => {
      const own = i === 2 && mine, each = own ? mine.item : SAMPLES[i];
      miniature(mini, PAGES[each], own ? mine : { fills: PAGES[each].colours, stickers: [], finished: true });
      spot.classList.toggle('is-mine', Boolean(own));
    });
    shelf.querySelector('.shop-shelf-name').textContent = VENDING.album;
    shelf.setAttribute('aria-label', VENDING.albumOpen(works.length));
  }
  on(shelf, 'click', () => album(true));

  // The album, an open scrapbook: its name on a red ribbon; on the left page four blank sheets taped in (a tap begins a new
  // one), on the right every work kept here, newest first, as a snapshot in photo corners with the day under it, a gold
  // star once finished, a red bookmark on the one being coloured; a pencil goes on with it, a cross lets it go (asked
  // twice). Nothing in it yet: an empty frame and a pencil. All the words are for screen readers.
  const book = element('div', 'shop-album', host); book.hidden = true; book.setAttribute('role', 'dialog'); book.setAttribute('aria-modal', 'true'); book.setAttribute('aria-labelledby', `${id}-album`);
  paperLayer(element('span', 'shop-album-spread', book), '0 0 1000 640', '', albumSpread, { paper: { scale: .7, grain: .45, shadow: .25, rim: '#f7efe2' }, eager: true, preserveAspectRatio: 'none' });
  paperLayer(element('span', 'shop-album-spread is-single', book), '0 0 600 1000', '', albumPage, { paper: { scale: .7, grain: .45, shadow: .25, rim: '#f7efe2' }, eager: true, preserveAspectRatio: 'none' });
  const ribbon = element('div', 'shop-album-ribbon', book); paperLayer(ribbon, '0 0 320 70', '', albumRibbon, small);
  const bookTitle = element('p', 'shop-album-title', ribbon, VENDING.album); bookTitle.id = `${id}-album`; bookTitle.lang = 'en';
  const shut = element('button', 'shop-album-shut', book, '✕'); shut.type = 'button'; shut.setAttribute('aria-label', VENDING.albumClose);
  const fresh = element('div', 'shop-album-new', book); fresh.setAttribute('role', 'group'); fresh.setAttribute('aria-label', VENDING.albumNew);
  const TAPES = ['#e2aaa3', '#9db59a', '#9fbdd2', '#e2b65a'];
  ITEMS.forEach(({ id: each, name }, i) => {
    const button = element('button', 'shop-album-blank', fresh); button.type = 'button'; button.setAttribute('aria-label', VENDING.albumBlank(name));
    miniature(svg('svg', { viewBox: '0 0 300 360', class: 'shop-album-mini', 'aria-hidden': 'true' }, button), PAGES[each], null);
    paperLayer(element('span', 'shop-album-tape', button), '0 0 60 18', '', washi(TAPES[i]), small);
    on(button, 'click', () => { album(false); open(each, { quick: true }); });
  });
  const grid = element('ul', 'shop-album-grid', book);
  const empty = element('div', 'shop-album-empty', book); paperLayer(empty, '0 0 200 160', '', emptyAlbum, small); element('p', 'sr-only', empty, VENDING.albumEmpty);
  const icon = (parent, draw, label, className = '') => { const button = element('button', `shop-album-icon ${className}`.trim(), parent); button.type = 'button'; button.setAttribute('aria-label', label); button.title = label; paperLayer(button, '0 0 40 40', '', draw, small); return button; };
  let asked = null;
  function fill() {
    grid.replaceChildren(); empty.hidden = works.length > 0; asked = null;
    for (const work of works) {
      const { name } = ITEMS.find(each => each.id === work.item), card = element('li', 'shop-album-card', grid), here = work.key === current?.key;
      card.setAttribute('aria-label', `${name}，${work.finished ? VENDING.albumDone : VENDING.albumHalf}，${day(work.at)}${here ? `，${VENDING.albumHere}` : ''}`);
      const photo = element('div', 'shop-album-photo', card);
      miniature(svg('svg', { viewBox: '0 0 300 360', class: 'shop-album-mini', 'aria-hidden': 'true' }, photo), PAGES[work.item], work);
      paperLayer(element('span', 'shop-album-corners', photo), '0 0 100 120', '', photoCorners, small);
      if (here) paperLayer(element('span', 'shop-album-mark', photo), '0 0 20 44', '', bookmark, small);
      element('p', 'shop-album-when', card, day(work.at)).setAttribute('aria-hidden', 'true');
      const actions = element('div', 'shop-album-actions', card);
      const go = icon(actions, pencil, `${VENDING.albumGo}：${name}`), drop = icon(actions, cross, `${VENDING.albumDrop}：${name}`, 'is-drop');
      on(go, 'click', () => { album(false); if (!here) open(work.item, { quick: true, key: work.key }); });
      on(drop, 'click', () => {
        if (asked !== work.key) { asked = work.key; drop.replaceChildren(); paperLayer(drop, '0 0 40 40', '', query, small); drop.classList.add('is-asking'); drop.setAttribute('aria-label', `${VENDING.albumSure}（${name}）`); drop.title = VENDING.albumSure; return; }
        works = dropWork(works, work.key); writeWorks(storage, works); if (current?.key === work.key) current = { key: null };
        sound?.play('remove'); fill(); show(); quiet(grid.querySelector('button') ?? shut);
      });
    }
  }
  function album(on_) {
    // (on a phone the shelf is at the foot of the workshop: the album is brought into view, and the shelf again after)
    if (on_) { fill(); book.hidden = false; host.classList.add('is-browsing'); if (innerWidth <= 760) book.scrollIntoView({ block: 'start', behavior: still.matches ? 'auto' : 'smooth' }); quiet(shut); sound?.play('pick'); }
    else if (!book.hidden) { book.hidden = true; host.classList.remove('is-browsing'); quiet(shelf, true); }
  }
  on(shut, 'click', () => album(false));

  // On the left: the tin of crayons (the one picked stands up out of it, its name on a slip below) and the swatch cards.
  const left = element('div', 'shop-left', host);
  const tinBox = element('div', 'color-crayons', left); tinBox.setAttribute('role', 'radiogroup'); tinBox.setAttribute('aria-label', VENDING.crayons);
  paperLayer(tinBox, '0 0 300 190', 'color-tin', tinBack, { paper: { scale: .4, grain: .45, shadow: .3 }, eager: true });
  const row = element('div', 'color-row', tinBox);
  const crayons = CRAYONS.map(([fill, name], i) => {
    const button = element('button', 'color-crayon', row); button.type = 'button'; button.setAttribute('role', 'radio'); button.setAttribute('aria-label', VENDING.crayon(name)); button.style.setProperty('--crayon', fill); button.style.setProperty('--i', i);
    paperLayer(button, '0 0 32 100', '', crayon(fill), small);
    on(button, 'click', () => choose(i));
    return button;
  });
  paperLayer(tinBox, '0 0 300 190', 'color-tin-front', tinFront, { paper: { scale: .4, grain: .45, shadow: .2 }, eager: true });
  const named = element('p', 'color-name', left); named.setAttribute('aria-hidden', 'true');
  const cards = element('div', 'shop-presets', left); cards.setAttribute('role', 'group'); cards.setAttribute('aria-label', VENDING.presets);
  for (const [key, name] of VENDING.cards) {
    const card = element('button', 'shop-preset', cards); card.type = 'button'; card.dataset.preset = key; card.setAttribute('aria-label', VENDING.preset(name));
    const chips = presetFills(SWATCH, key);
    paperLayer(element('span', 'shop-dots', card), '0 0 104 28', '', g => chips.forEach((fill, i) => shape('rect', { x: 4 + i * 25, y: 4, width: 21, height: 20, rx: 4, fill }, g)), { paper: { scale: .2, grain: .45, shadow: .25 }, eager: true });
    element('span', 'shop-preset-name', card, name);
    paperLayer(element('span', 'shop-peg', card), '0 0 40 40', '', peg, small);
    on(card, 'click', () => { if (!item) return; commit({ fills: presetFills(classic(item.id), key), stickers: state.stickers }); sound?.play('snap'); });
  }

  // In the middle: the lamp, the stand a finished sheet is shown on, the sheet with the drawing, a pencilled note for a
  // gentle word, and a few paper stars for the moment it is done.
  const center = element('div', 'shop-center', host);
  paperLayer(center, '0 0 200 260', 'shop-glow', lampGlow, { paper: null, eager: true });
  paperLayer(center, '0 0 200 260', 'shop-lamp', lamp, { paper: { scale: .4, grain: .45, shadow: .3 }, eager: true });
  paperLayer(center, '0 0 400 100', 'shop-stand', stand, { paper: { scale: .4, grain: .45, shadow: .3 }, eager: true });
  const sheet = element('div', 'color-sheet', center), paper = paperLayer(sheet, `0 0 ${SHEET.join(' ')}`, 'color-paper', sheetPaper, { paper: { scale: .6, grain: .5, shadow: .26 }, eager: true });
  const art = svg('svg', { viewBox: `0 0 ${SHEET.join(' ')}`, class: 'color-drawing', 'aria-hidden': 'true' }, sheet);
  filters(art, id);
  const drawn = svg('g', { transform: `translate(${AT} ${AT})` }, art), mark = stamp(art, id);
  const note = element('p', 'shop-note', center); note.setAttribute('aria-hidden', 'true');
  const sparks = element('div', 'shop-sparks', center); sparks.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 7; i++) { const spark = element('i', '', sparks); spark.style.setProperty('--i', i); paperLayer(spark, '-20 -20 40 40', '', i % 2 ? STICKER_ART.flake : STICKER_ART.star, { paper: { scale: .15, grain: .4, shadow: .2 }, eager: true }); }

  // On the right: the tags (undo, redo, start over, done, back to the market) and the stickers.
  const right = element('div', 'shop-right', host), tools = element('div', 'color-tools', right);
  const tool = (text, className = 'color-tool', parent = tools) => { const button = element('button', className, parent, text); button.type = 'button'; return button; };
  // The desk's tools are things: wooden tokens to go back and forward again, an eraser to start over, a wax seal to finish,
  // a door sign back to the market; each with its name under it (or on it).
  const thing = (text, draw, box = '0 0 100 100', className = '') => {
    const button = element('button', `color-tool is-thing ${className}`.trim(), tools); button.type = 'button';
    paperLayer(element('span', 'tool-art', button), box, '', draw, { paper: { scale: .45, grain: .45, shadow: .3, rim: '#f7efe2' }, eager: true });
    element('span', 'tool-name', button, text); return button;
  };
  const undo = thing(VENDING.undo, token(1)), redo = thing(VENDING.redo, token(-1)), reset = thing(VENDING.reset, eraser), finish = thing(VENDING.finish, seal, '0 0 100 100', 'is-main'), back = thing(VENDING.back, doorSign, '0 0 140 86', 'is-back');
  const stickerBox = element('div', 'shop-stickers', right); stickerBox.setAttribute('role', 'group'); stickerBox.setAttribute('aria-label', VENDING.stickers);
  paperLayer(element('span', 'shop-sticker-sheet', stickerBox), '0 0 196 102', '', stickerSheet, { paper: { scale: .4, grain: .3, shadow: .22 }, eager: true });
  element('p', 'shop-stickers-name', stickerBox, VENDING.stickers).setAttribute('aria-hidden', 'true');
  const pegs = new Map(STICKERS.map(kind => {
    const button = element('button', 'shop-sticker', stickerBox); button.type = 'button'; button.dataset.kind = kind; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', VENDING.stick(VENDING.sticker[kind]));
    paperLayer(button, '-24 -24 48 48', '', STICKER_ART[kind], { paper: { scale: .2, grain: .4, shadow: .3 }, eager: true });
    on(button, 'click', () => hold(holding === kind ? null : kind));
    return [kind, button];
  }));

  // The card once it is done: save it, go on with it, or go back to the market.
  const card = element('div', 'shop-card', host); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-labelledby', `${id}-done`);
  // (a red paper rosette pinned at its top, paper tape at two corners; a picture on each of its buttons)
  paperLayer(element('span', 'shop-card-rosette', card), '0 0 120 150', '', rosette, { paper: { scale: .4, grain: .45, shadow: .3, rim: '#f7efe2' }, eager: true });
  for (const [side, fill] of [['left', '#9fbdd2'], ['right', '#e2aaa3']]) paperLayer(element('span', `shop-card-tape is-${side}`, card), '0 0 60 18', '', washi(fill), small);
  const title = element('p', 'shop-card-title', card, VENDING.doneTitle); title.id = `${id}-done`;
  const line = element('p', 'shop-card-line', card), choices = element('div', 'shop-card-actions', card);
  const save = tool(VENDING.save, 'color-tool', choices), again = tool(VENDING.again, 'color-tool', choices), leave = tool(VENDING.back, 'color-tool is-main', choices);
  for (const [button, draw] of [[save, keepIt], [again, pencil], [leave, goBack]]) paperLayer(element('span', 'shop-card-icon', button), '0 0 40 40', '', draw, small);

  let current = { key: null }, tidy = 0, colour = CRAYONS[0][0], item = null, parts = [], hover = null, stickers = null, lines = null, state = { fills: [], stickers: [] }, done = [], undone = [], finished = false, holding = null;
  function choose(i, quiet = false) {
    colour = CRAYONS[i][0]; crayons.forEach((button, j) => { button.setAttribute('aria-checked', String(i === j)); button.tabIndex = i === j ? 0 : -1; });
    named.replaceChildren(); element('span', '', named, CRAYONS[i][1]); element('span', 'color-name-en', named, CRAYONS[i][2]).lang = 'en';
    named.style.setProperty('--crayon', colour); if (!quiet) { sound?.play('pick'); hold(null); }
  }
  on(tinBox, 'keydown', event => {
    const at = crayons.indexOf(document.activeElement), step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (at < 0 || !step) return; event.preventDefault(); const next = (at + step + crayons.length) % crayons.length; choose(next); crayons[next].focus();
  });
  function hold(kind) {
    holding = kind; for (const [each, button] of pegs) button.setAttribute('aria-pressed', String(each === kind));
    sheet.classList.toggle('is-placing', Boolean(kind));
    // (held, the note by the sheet says what to do with it until it is put down)
    if (kind) { sound?.play('pick'); status.textContent = VENDING.holding(VENDING.sticker[kind]); tell(VENDING.holding(VENDING.sticker[kind]), 0); } else if (note.dataset.held) tell('', -1);
  }

  const snapshot = () => ({ fills: [...state.fills], stickers: state.stickers.map(each => [...each]) });
  const settle = () => { undo.disabled = !done.length; redo.disabled = !undone.length; reset.disabled = !touched(state); mark.style.display = finished ? '' : 'none'; };
  // The sheet as `state` says: each part's colour, the stickers on it.
  function render() {
    parts.forEach((part, i) => part.setAttribute('fill', state.fills[i]));
    stickers.replaceChildren();
    state.stickers.forEach(([kind, x, y, turn], i) => {
      const group = svg('g', { class: 'color-sticker', transform: `translate(${x} ${y}) rotate(${turn}) scale(1.3)`, 'data-index': i }, stickers);
      STICKER_ART[kind](group);
    });
    settle();
  }
  // Kept in this browser after every change (a new sheet only once anything is on it), and the shelf drawn again.
  function keep() {
    if (!item || (!current.key && !touched(state))) return;
    current = { ...snapshot(), key: current.key ?? newKey(), item: item.id, finished, at: Date.now() };
    works = keepWork(works, current); writeWorks(storage, works); show();
  }
  function commit(next) { done.push(snapshot()); undone = []; state = next; finished = false; render(); keep(); }
  function paint(index) {
    if (state.fills[index] === colour) return;
    const fills = [...state.fills]; fills[index] = colour; commit({ fills, stickers: state.stickers }); sound?.play('snap');
    const part = parts[index]; part.classList.remove('is-filled'); void part.getBoundingClientRect(); part.classList.add('is-filled');
  }
  function place(x, y) {
    if (state.stickers.length >= MOST) { hint(VENDING.full); return; }
    const turn = Math.round((Math.random() * 2 - 1) * 18);
    commit({ fills: state.fills, stickers: [...state.stickers, [holding, Math.round(x), Math.round(y), turn]] }); sound?.play('pick');
  }
  // A word pencilled by the sheet for a moment (and read out), the sheet giving a little shake.
  function hint(words) {
    tell(words, 2600); status.textContent = words; sheet.classList.remove('is-nudged'); void sheet.offsetWidth; sheet.classList.add('is-nudged');
  }
  // The pencilled note by the sheet: `ms` long, until put away (0), or put away now (-1).
  let noteTimer = 0;
  function tell(words, ms) {
    clearTimeout(noteTimer); delete note.dataset.held;
    if (ms < 0) { note.classList.remove('is-shown'); return; }
    note.textContent = words; note.classList.add('is-shown');
    if (ms) noteTimer = setTimeout(() => note.classList.remove('is-shown'), still.matches ? ms + 1500 : ms); else note.dataset.held = '';
  }
  const pointIn = event => { const point = art.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; const local = point.matrixTransform(drawn.getScreenCTM().inverse()); return [Math.min(300, Math.max(0, local.x)), Math.min(360, Math.max(0, local.y))]; };
  on(art, 'click', event => {
    if (!item) return;
    const stuck = event.target.closest('.color-sticker');
    if (holding) { const [x, y] = pointIn(event); place(x, y); return; }
    if (stuck) { const at = +stuck.dataset.index; commit({ fills: state.fills, stickers: state.stickers.filter((_, i) => i !== at) }); sound?.play('remove'); return; }
    const index = parts.indexOf(event.target.closest('.color-part')); if (index >= 0) paint(index);
  });
  // Pointed at with a mouse, a part shows faintly in the crayon's colour (what a click would do), its edge lit.
  on(art, 'pointerover', event => { if (event.pointerType === 'touch') return; const part = event.target.closest('.color-part'); if (part && hover) { hover.setAttribute('d', part.getAttribute('d')); hover.setAttribute('fill', holding ? 'none' : colour); hover.classList.add('is-on'); } });
  on(art, 'pointerout', event => { if (!event.relatedTarget?.closest?.('.color-part') && hover) hover.classList.remove('is-on'); });

  // A new sheet: the page's parts (each a button), each with its edge, bottom to top, all of it wavering like a hand's
  // line; the ink over them; the stickers over that.
  function build(page) {
    drawn.replaceChildren(); parts = [];
    const sheetArt = svg('g', { class: 'color-parts', filter: `url(#${id}-hand)` }, drawn);
    const edge = d => { for (const [width, opacity, shift] of [[3, 1, 0], [1.3, .5, .9]]) svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': width, opacity, transform: `translate(${shift} ${shift * .6})`, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, sheetArt); };
    parts = page.parts.map((d, i) => {
      const part = svg('path', { d, fill: BLANK, class: 'color-part', filter: `url(#${id}-flecks)`, tabindex: 0, role: 'button', 'aria-label': VENDING.region(item.name, i + 1) }, sheetArt);
      on(part, 'keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault();
        if (holding) { const box = part.getBBox(); place(box.x + box.width / 2, box.y + box.height / 2); } else paint(i);
      });
      edge(d);
      return part;
    });
    hover = svg('path', { class: 'color-hover', fill: 'none', 'pointer-events': 'none' }, drawn);
    lines = svg('g', { class: 'color-lines', fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none', filter: `url(#${id}-hand)` }, drawn);
    for (const [width, opacity, shift] of [[3, 1, 0], [1.3, .5, .9]]) {
      const pass = svg('g', { 'stroke-width': width, opacity, transform: `translate(${shift} ${shift * .6})` }, lines);
      for (const d of page.ink) svg('path', { d, ...(d.endsWith('Z') ? { fill: INK } : {}) }, pass);
    }
    stickers = svg('g', { class: 'color-stickers' }, drawn);
    art.removeAttribute('aria-hidden'); art.setAttribute('role', 'group'); art.setAttribute('aria-label', item.name);
  }
  // Opens a sheet: a new one of `next` (as everything from the machine is), or the work called `key` as it was left. The
  // way in from the market plays the table's little show (`quick` skips it, as from the album).
  function open(next = null, { quick = false, key = null } = {}) {
    clearTimeout(tidy); hold(null); album(false); card.hidden = true; host.classList.remove('is-done');
    const work = key ? works.find(each => each.key === key) : null;
    item = ITEMS.find(each => each.id === (work?.item ?? next)) ?? ITEMS[0];
    const page = PAGES[item.id];
    current = work ? { ...work } : { key: null };
    state = work ? { fills: [...work.fills], stickers: work.stickers.map(each => [...each]) } : { fills: page.parts.map(() => BLANK), stickers: [] };
    finished = work?.finished ?? false; done = []; undone = [];
    build(page); render(); sheet.dataset.item = item.id; show();
    sheet.classList.remove('is-new'); void sheet.offsetWidth; sheet.classList.add('is-new');
    if (!quick) { host.classList.remove('is-arriving'); void host.offsetWidth; host.classList.add('is-arriving'); later(1700, () => host.classList.remove('is-arriving')); }
    // A sheet not yet touched: how it is done, pencilled by it once it has settled.
    if (touched(state)) tell('', -1); else later(quick ? 300 : 1300, () => { if (!touched(state)) tell(VENDING.howTo, 4200); });
    status.textContent = VENDING.desk(item.name);
    return item.id;
  }
  on(undo, 'click', () => { if (!done.length) return; undone.push(snapshot()); state = done.pop(); finished = false; render(); keep(); sound?.play('remove'); });
  on(redo, 'click', () => { if (!undone.length) return; done.push(snapshot()); state = undone.pop(); finished = false; render(); keep(); sound?.play('snap'); });
  on(reset, 'click', () => { if (!touched(state)) return; commit({ fills: state.fills.map(() => BLANK), stickers: [] }); sound?.play('remove'); });
  // Done: the tools fold away, the sheet goes up on its stand under the lamp, turns to the light, is stamped; then the card.
  on(finish, 'click', () => {
    if (!item) return;
    if (!touched(state)) { hint(VENDING.empty); return; }
    hold(null); finished = true; keep(); settle(); sound?.play('cheer'); status.textContent = VENDING.finished(item.name);
    host.classList.remove('is-done'); void host.offsetWidth; host.classList.add('is-done');
    later(1500, () => { line.textContent = VENDING.doneLine(item.name); card.hidden = false; quiet(save); });
  });
  on(again, 'click', () => { card.hidden = true; host.classList.remove('is-done'); quiet(parts[0] ?? crayons[0]); });
  on(back, 'click', () => onBack());
  on(leave, 'click', () => onBack());
  on(host, 'keydown', event => {
    if (event.key === 'Escape' && !book.hidden) { event.preventDefault(); event.stopPropagation(); album(false); return; }
    if (event.key === 'Escape' && holding) { event.preventDefault(); event.stopPropagation(); hold(null); }
  });
  // Saved as it looks: the paper (its own picture, grain and rim), then the drawing, stickers and stamp over it, three
  // times the sheet's size.
  on(save, 'click', async () => {
    if (!item) return;
    const scale = 3, canvas = document.createElement('canvas'); canvas.width = SHEET[0] * scale; canvas.height = SHEET[1] * scale;
    const context = canvas.getContext('2d'), under = paper.querySelector('img'), copy = art.cloneNode(true);
    copy.querySelector('.color-hover')?.remove(); copy.setAttribute('xmlns', NS); copy.setAttribute('width', canvas.width); copy.setAttribute('height', canvas.height);
    const over = new Image(); over.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    await Promise.all([under.decode(), over.decode()]);
    context.fillStyle = BLANK; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(under, 0, 0, canvas.width, canvas.height); context.drawImage(over, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = VENDING.file(item.id); link.click(); sound?.play('jingle');
  });
  choose(0, true); show();
  return {
    open, get item() { return item?.id ?? null; },
    // Closed: it is left just as it is while the workshop folds away (it would jump back to the table and fade in again
    // on the way out), and put back to rights once it is out of sight.
    close() { hold(null); album(false); clearTimeout(tidy); tidy = setTimeout(() => { card.hidden = true; host.classList.remove('is-done', 'is-arriving'); }, still.matches ? 0 : 700); },
    focus: () => quiet(parts[0] ?? crayons[0]),
    destroy() { events.abort(); clearTimeout(tidy); clearTimeout(noteTimer); timers.forEach(clearTimeout); host.replaceChildren(); walls?.replaceChildren(); },
  };
}
