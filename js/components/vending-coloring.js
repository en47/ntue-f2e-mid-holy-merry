// The craft booth's workshop, Santa's Little Art Workshop (docs/VENDING-MARKET.md): a little thing from the vending
// machine as a line drawing on a thick cream sheet on the workshop table, coloured part by part with crayons from an old
// tin (a part tapped, or reached with Tab and Enter, fills with the crayon's grain, flecks of the paper showing through).
// Swatch cards colour the whole sheet at once; stickers (a star, a snowflake, holly) are picked up and pressed on; undo
// and redo go a step at a time, 重新上色 starts the sheet over (and can be undone too). Each thing's sheet is kept in this
// browser (services/vending-works.js), so it is there again next time, and the shelf on the wall shows all four as they
// stand; a frame tapped opens that one. 完成 folds the tools away, sets the sheet on a little stand under the lamp, turns
// it to the light and presses a stamp in its corner, then a card offers to save it as a picture, to go on, or to go back
// to the market. Every line wavers a little like a hand's (an SVG displacement) and is drawn twice, faintly offset.
import { NS, paperLayer, shape } from './paper-art.js';
import { titleGlyphs } from '../data/title-glyphs.js';
import { CRAYONS, ITEMS, VENDING } from '../data/vending.js';
import { BLANK, MOST, STICKERS, presetFills, readWorks, touched, writeWorks } from '../services/vending-works.js';
import { STICKER_ART, crayon, frame, lamp, lampGlow, roomBulbs, stand, table, tinBack, tinFront, wall } from './vending-workshop-art.js';

// The sheet is 340 × 440: the drawing's own 300 × 360 box sits 20 in from the top and the sides, the stamp in the margin
// below it.
const SHEET = [340, 440], AT = 20, INK = '#5b3d2e';
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const star = (cx, cy, outer, inner) => `M${Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? inner : outer; return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; }).join('L')}Z`;
// Each drawing: its parts to colour, bottom to top, and its ink lines (not coloured: eyes, smiles, icing, twigs).
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
// The drawings in the crayons' own colours, for the classic swatch card: each of ICONS' colours traded for its crayon.
const NEAREST = { '#b5443c': '#b03f37', '#a8423b': '#b03f37', '#fbf3df': '#f4ead3', '#fbf8f1': '#fbfaf5', '#e0b04f': '#e2b65a', '#3f6653': '#3f6653', '#4f7d68': '#9db59a', '#8a5a3c': '#7a5238', '#9fbdd2': '#9fbdd2', '#c0864f': '#b97c4a', '#e9b6b0': '#e2aaa3', '#3b3438': '#4a4245', '#d9844d': '#b97c4a' };
const classic = id => ICONS[id].map(fill => NEAREST[fill] ?? fill);
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
}
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
  const works = readWorks(storage, Object.fromEntries(ITEMS.map(each => [each.id, DRAWINGS[each.id].parts.length])));
  const small = { paper: { scale: .3, grain: .5, shadow: .3 }, eager: true };
  if (walls) {
    paperLayer(walls, '0 0 1440 470', 'shop-wall', wall, { paper: { scale: .9, grain: .45, shadow: .2 }, eager: true, preserveAspectRatio: 'xMidYMax slice' });
    paperLayer(walls, '0 0 1440 470', 'shop-bulbs', roomBulbs, { paper: null, eager: true, preserveAspectRatio: 'xMidYMax slice' });
    paperLayer(walls, '0 0 1440 330', 'shop-table', table, { paper: { scale: .9, grain: .45, shadow: .2 }, eager: true, preserveAspectRatio: 'xMidYMin slice' });
  }
  const status = element('p', 'sr-only', host); status.setAttribute('role', 'status');

  // The shelf: four frames, each thing as it stands (a gold ribbon once it is finished); one tapped opens it.
  const shelf = element('div', 'shop-shelf', host); shelf.setAttribute('role', 'group'); shelf.setAttribute('aria-label', VENDING.shelf);
  element('p', 'shop-shelf-name', shelf, VENDING.shelf).setAttribute('aria-hidden', 'true');
  const frames = new Map(ITEMS.map(({ id: each, name }) => {
    const button = element('button', 'shop-frame', shelf); button.type = 'button'; button.dataset.item = each;
    paperLayer(button, '0 0 100 124', 'shop-frame-wood', frame, small);
    const mini = svg('svg', { viewBox: '0 0 300 360', class: 'shop-mini', 'aria-hidden': 'true' }, button);
    on(button, 'click', () => { if (item?.id !== each) open(each, { quick: true }); });
    return [each, { button, mini, name }];
  }));
  function miniature(each) {
    const { button, mini, name } = frames.get(each), drawing = DRAWINGS[each], work = works[each];
    mini.replaceChildren();
    drawing.parts.forEach((d, i) => svg('path', { d, fill: work?.fills[i] ?? BLANK }, mini));
    const lines = svg('g', { fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mini);
    for (const d of [...drawing.parts, ...drawing.ink]) svg('path', { d, ...(d.endsWith('Z') && drawing.ink.includes(d) ? { fill: INK } : {}) }, lines);
    for (const [kind, x, y, turn] of work?.stickers ?? []) STICKER_ART[kind](svg('g', { transform: `translate(${x} ${y}) rotate(${turn}) scale(1.3)` }, mini));
    if (work?.finished) STICKER_ART.star(svg('g', { transform: 'translate(262 324) scale(1.9)' }, mini));
    button.classList.toggle('is-done', Boolean(work?.finished)); button.classList.toggle('is-blank', !touched(work));
    button.setAttribute('aria-label', VENDING.frame(name, work)); button.setAttribute('aria-current', String(each === item?.id));
  }

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
  const undo = tool(`↶ ${VENDING.undo}`), redo = tool(`↷ ${VENDING.redo}`), reset = tool(VENDING.reset), finish = tool(`${VENDING.finish} ✓`, 'color-tool is-main'), back = tool(`← ${VENDING.back}`, 'color-tool is-back');
  const stickerBox = element('div', 'shop-stickers', right); stickerBox.setAttribute('role', 'group'); stickerBox.setAttribute('aria-label', VENDING.stickers);
  element('p', 'shop-stickers-name', stickerBox, VENDING.stickers).setAttribute('aria-hidden', 'true');
  const pegs = new Map(STICKERS.map(kind => {
    const button = element('button', 'shop-sticker', stickerBox); button.type = 'button'; button.dataset.kind = kind; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', VENDING.stick(VENDING.sticker[kind]));
    paperLayer(button, '-24 -24 48 48', '', STICKER_ART[kind], { paper: { scale: .2, grain: .4, shadow: .3 }, eager: true });
    on(button, 'click', () => hold(holding === kind ? null : kind));
    return [kind, button];
  }));

  // The card once it is done: save it, go on with it, or go back to the market.
  const card = element('div', 'shop-card', host); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-labelledby', `${id}-done`);
  const title = element('p', 'shop-card-title', card, VENDING.doneTitle); title.id = `${id}-done`;
  const line = element('p', 'shop-card-line', card), choices = element('div', 'shop-card-actions', card);
  const save = tool(VENDING.save, 'color-tool', choices), again = tool(VENDING.again, 'color-tool', choices), leave = tool(`← ${VENDING.back}`, 'color-tool is-main', choices);

  let tidy = 0, colour = CRAYONS[0][0], item = null, parts = [], hover = null, stickers = null, lines = null, state = { fills: [], stickers: [] }, done = [], undone = [], finished = false, holding = null;
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
    sheet.classList.toggle('is-placing', Boolean(kind)); if (kind) { sound?.play('pick'); status.textContent = VENDING.holding(VENDING.sticker[kind]); }
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
  // Kept in this browser after every change, and the shelf's frame drawn again.
  function keep() {
    if (!item) return;
    works[item.id] = { ...snapshot(), finished, at: Date.now() }; writeWorks(storage, works); miniature(item.id);
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
    note.textContent = words; status.textContent = words; note.classList.add('is-shown'); sheet.classList.remove('is-nudged'); void sheet.offsetWidth; sheet.classList.add('is-nudged');
    later(2600, () => note.classList.remove('is-shown'));
  }
  const pointIn = event => { const point = art.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; const local = point.matrixTransform(drawn.getScreenCTM().inverse()); return [Math.min(300, Math.max(0, local.x)), Math.min(360, Math.max(0, local.y))]; };
  on(art, 'click', event => {
    if (!item) return;
    const stuck = event.target.closest('.color-sticker');
    if (holding) { const [x, y] = pointIn(event); place(x, y); return; }
    if (stuck) { const at = +stuck.dataset.index; commit({ fills: state.fills, stickers: state.stickers.filter((_, i) => i !== at) }); sound?.play('remove'); return; }
    const index = parts.indexOf(event.target.closest('.color-part')); if (index >= 0) paint(index);
  });
  // A part pointed at is outlined in gold, so it is clear which one a tap will fill.
  on(art, 'pointerover', event => { const part = event.target.closest('.color-part'); if (part && hover) { hover.setAttribute('d', part.getAttribute('d')); hover.classList.add('is-on'); } });
  on(art, 'pointerout', event => { if (!event.relatedTarget?.closest?.('.color-part') && hover) hover.classList.remove('is-on'); });

  // A new sheet: `drawing`'s parts (each a button), the lines over them, the stickers over those.
  function build(drawing) {
    drawn.replaceChildren(); parts = [];
    const fills = svg('g', { class: 'color-parts', filter: `url(#${id}-grain)` }, drawn);
    parts = drawing.parts.map((d, i) => {
      const part = svg('path', { d, fill: BLANK, class: 'color-part', tabindex: 0, role: 'button', 'aria-label': VENDING.region(item.name, i + 1) }, fills);
      on(part, 'keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault();
        if (holding) { const box = part.getBBox(); place(box.x + box.width / 2, box.y + box.height / 2); } else paint(i);
      });
      return part;
    });
    hover = svg('path', { class: 'color-hover', fill: 'none', 'pointer-events': 'none' }, drawn);
    // The lines over the colours: each part's edge and the drawing's details, then the same again, thin and a little off.
    lines = svg('g', { class: 'color-lines', fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none', filter: `url(#${id}-hand)` }, drawn);
    for (const [width, opacity, shift] of [[3, 1, 0], [1.3, .5, .9]]) {
      const pass = svg('g', { 'stroke-width': width, opacity, transform: `translate(${shift} ${shift * .6})` }, lines);
      for (const d of drawing.parts) svg('path', { d, pathLength: 1 }, pass);
      for (const d of drawing.ink) svg('path', { d, pathLength: 1, ...(d.endsWith('Z') ? { fill: INK } : {}) }, pass);
    }
    stickers = svg('g', { class: 'color-stickers' }, drawn);
    art.removeAttribute('aria-hidden'); art.setAttribute('role', 'group'); art.setAttribute('aria-label', item.name);
  }
  // Opens a thing's sheet (`next`, or the one last worked on, or the first): as it was left, or blank. The way in from the
  // market plays the table's little show (`quick` skips it, as when a frame is tapped).
  function open(next = null, { quick = false } = {}) {
    clearTimeout(tidy); hold(null); card.hidden = true; host.classList.remove('is-done');
    const last = Object.entries(works).sort((a, b) => b[1].at - a[1].at)[0]?.[0];
    item = ITEMS.find(each => each.id === (next ?? last ?? ITEMS[0].id)) ?? ITEMS[0];
    const drawing = DRAWINGS[item.id], work = works[item.id];
    state = work ? { fills: [...work.fills], stickers: work.stickers.map(each => [...each]) } : { fills: drawing.parts.map(() => BLANK), stickers: [] };
    finished = work?.finished ?? false; done = []; undone = [];
    build(drawing); render(); sheet.dataset.item = item.id;
    for (const each of frames.keys()) miniature(each);
    sheet.classList.remove('is-new'); void sheet.offsetWidth; sheet.classList.add('is-new');
    if (!quick) { host.classList.remove('is-arriving'); void host.offsetWidth; host.classList.add('is-arriving'); later(1700, () => host.classList.remove('is-arriving')); }
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
    later(1500, () => { line.textContent = VENDING.doneLine(item.name); card.hidden = false; save.focus({ preventScroll: true }); });
  });
  on(again, 'click', () => { card.hidden = true; host.classList.remove('is-done'); (parts[0] ?? crayons[0]).focus({ preventScroll: true }); });
  on(back, 'click', () => onBack());
  on(leave, 'click', () => onBack());
  on(host, 'keydown', event => { if (event.key === 'Escape' && holding) { event.preventDefault(); event.stopPropagation(); hold(null); } });
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
  choose(0, true);
  for (const each of frames.keys()) miniature(each);
  return {
    open, get item() { return item?.id ?? null; },
    // Closed: it is left just as it is while the workshop folds away (it would jump back to the table and fade in again
    // on the way out), and put back to rights once it is out of sight.
    close() { hold(null); clearTimeout(tidy); tidy = setTimeout(() => { card.hidden = true; host.classList.remove('is-done', 'is-arriving'); }, still.matches ? 0 : 700); },
    focus: () => (parts[0] ?? crayons[0]).focus({ preventScroll: true }),
    destroy() { events.abort(); clearTimeout(tidy); timers.forEach(clearTimeout); host.replaceChildren(); walls?.replaceChildren(); },
  };
}
