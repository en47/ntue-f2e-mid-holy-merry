// The coloring desk: the little thing taken out of the vending machine, as a line drawing on a thick sheet of cream paper
// taped to a wooden desk, and a tin of crayons. A crayon picked, a part tapped (or reached with Tab and Enter): it is
// coloured in with a crayon's grain, flecks of the paper showing through. Undo and redo go a stroke at a time, 重設 starts
// the sheet over (and can be undone too), 完成作品 presses a little ink stamp in the sheet's corner, and 存成圖片 saves the
// sheet just as it looks, paper, grain and stamp, as a PNG. Every line wavers a little like a hand's (an SVG displacement)
// and is drawn twice, faintly offset, so it is never one even width.
import { NS, paperLayer, shape } from './paper-art.js';
import { titleGlyphs } from '../data/title-glyphs.js';
import { CRAYONS, ITEMS, VENDING } from '../data/vending.js';

// The sheet is 340 × 440: the drawing's own 300 × 360 box sits 20 in from the top and the sides, the stamp in the margin
// below it.
const SHEET = [340, 440], AT = 20, BLANK = '#fbf3e1', INK = '#5b3d2e';
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
// A crayon for the tin: its paper wrapper, the coloured wax, a sharpened tip.
const crayon = fill => g => {
  shape('path', { d: 'M8 26L16 4 24 26Z', fill }, g);
  shape('rect', { x: 6, y: 24, width: 20, height: 74, rx: 3, fill }, g);
  shape('rect', { x: 6, y: 40, width: 20, height: 34, fill: '#f6ecd6', opacity: .9 }, g);
  shape('path', { d: 'M9 46H23M9 68H23', stroke: fill, 'stroke-width': 2.4 }, g);
};

export function mountColoring(host, { onBack = () => {}, sound = null } = {}) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal }), id = `color-${++count}`;
  const sheet = element('div', 'color-sheet', host), paper = paperLayer(sheet, `0 0 ${SHEET.join(' ')}`, 'color-paper', sheetPaper, { paper: { scale: .6, grain: .5, shadow: .26 }, eager: true });
  const art = svg('svg', { viewBox: `0 0 ${SHEET.join(' ')}`, class: 'color-drawing', 'aria-hidden': 'true' }, sheet);
  filters(art, id);
  const drawn = svg('g', { transform: `translate(${AT} ${AT})` }, art), mark = stamp(art, id);
  const status = element('p', 'sr-only', host); status.setAttribute('role', 'status');
  const tin = element('div', 'color-crayons', host); tin.setAttribute('role', 'radiogroup'); tin.setAttribute('aria-label', VENDING.crayons);
  const tools = element('div', 'color-tools', host);
  const tool = (text, className = 'color-tool') => { const button = element('button', className, tools, text); button.type = 'button'; return button; };
  const undo = tool(`↶ ${VENDING.undo}`), redo = tool(`↷ ${VENDING.redo}`), reset = tool(VENDING.reset), finish = tool(`${VENDING.finish} ✓`, 'color-tool is-main'), save = tool(VENDING.save), back = tool(`← ${VENDING.back}`, 'color-tool is-back');
  let colour = CRAYONS[0][0], item = null, parts = [], done = [], undone = [], finished = false;
  const crayons = CRAYONS.map(([fill, name], i) => {
    const button = element('button', 'color-crayon', tin); button.type = 'button'; button.setAttribute('role', 'radio'); button.setAttribute('aria-label', VENDING.crayon(name)); button.style.setProperty('--crayon', fill);
    paperLayer(button, '0 0 32 100', '', crayon(fill), { paper: { scale: .3, grain: .5, shadow: .3 }, eager: true });
    on(button, 'click', () => choose(i));
    return button;
  });
  function choose(i, quiet = false) { colour = CRAYONS[i][0]; crayons.forEach((button, j) => { button.setAttribute('aria-checked', String(i === j)); button.tabIndex = i === j ? 0 : -1; }); if (!quiet) sound?.play('pick'); }
  on(tin, 'keydown', event => {
    const at = crayons.indexOf(document.activeElement), step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (at < 0 || !step) return; event.preventDefault(); const next = (at + step + crayons.length) % crayons.length; choose(next); crayons[next].focus();
  });
  const painted = () => parts.some(part => part.getAttribute('fill') !== BLANK);
  const settle = () => { undo.disabled = !done.length; redo.disabled = !undone.length; reset.disabled = !painted(); finish.disabled = !painted() || finished; save.disabled = !item; mark.style.display = finished ? '' : 'none'; };
  // A stroke is a list of [part, colour before, colour after]; undoing puts the befores back, redoing the afters.
  function apply(stroke, side) { for (const change of stroke) change[0].setAttribute('fill', change[side]); finished = false; settle(); }
  function paint(part) {
    const before = part.getAttribute('fill'); if (before === colour) return;
    done.push([[part, before, colour]]); undone = []; apply(done.at(-1), 2); sound?.play('snap');
  }
  // A new sheet: the drawing of `id`, every part blank.
  function show(itemId) {
    item = ITEMS.find(each => each.id === itemId) ?? null; done = []; undone = []; finished = false; drawn.replaceChildren(); parts = [];
    sheet.dataset.item = item?.id ?? '';
    if (!item) { settle(); return; }
    const drawing = DRAWINGS[item.id], fills = svg('g', { class: 'color-parts', filter: `url(#${id}-grain)` }, drawn);
    parts = drawing.parts.map((d, i) => {
      const part = svg('path', { d, fill: BLANK, class: 'color-part', tabindex: 0, role: 'button', 'aria-label': VENDING.region(item.name, i + 1) }, fills);
      on(part, 'click', () => paint(part));
      on(part, 'keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); paint(part); } });
      return part;
    });
    // The lines over the colours: each part's edge and the drawing's details, then the same again, thin and a little off.
    const lines = svg('g', { fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none', filter: `url(#${id}-hand)` }, drawn);
    for (const [width, opacity, shift] of [[3, 1, 0], [1.3, .5, .9]]) {
      const pass = svg('g', { 'stroke-width': width, opacity, transform: `translate(${shift} ${shift * .6})` }, lines);
      for (const d of drawing.parts) svg('path', { d }, pass);
      for (const d of drawing.ink) svg('path', { d, ...(d.endsWith('Z') ? { fill: INK } : {}) }, pass);
    }
    art.removeAttribute('aria-hidden'); art.setAttribute('role', 'group'); art.setAttribute('aria-label', item.name);
    sheet.classList.remove('is-new'); void sheet.offsetWidth; sheet.classList.add('is-new');
    status.textContent = VENDING.desk(item.name); settle();
  }
  on(undo, 'click', () => { const stroke = done.pop(); if (!stroke) return; undone.push(stroke); apply(stroke, 1); sound?.play('remove'); });
  on(redo, 'click', () => { const stroke = undone.pop(); if (!stroke) return; done.push(stroke); apply(stroke, 2); sound?.play('snap'); });
  on(reset, 'click', () => { const stroke = parts.filter(part => part.getAttribute('fill') !== BLANK).map(part => [part, part.getAttribute('fill'), BLANK]); if (!stroke.length) return; done.push(stroke); undone = []; apply(stroke, 2); sound?.play('remove'); });
  on(finish, 'click', () => { finished = true; settle(); sound?.play('cheer'); status.textContent = VENDING.finished; });
  on(back, 'click', () => onBack());
  // Saved as it looks: the paper (its own picture, grain and rim), then the drawing and the stamp over it, three times
  // the sheet's size.
  on(save, 'click', async () => {
    if (!item) return;
    const scale = 3, canvas = document.createElement('canvas'); canvas.width = SHEET[0] * scale; canvas.height = SHEET[1] * scale;
    const context = canvas.getContext('2d'), under = paper.querySelector('img'), copy = art.cloneNode(true);
    copy.setAttribute('xmlns', NS); copy.setAttribute('width', canvas.width); copy.setAttribute('height', canvas.height);
    const over = new Image(); over.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    await Promise.all([under.decode(), over.decode()]);
    context.fillStyle = BLANK; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(under, 0, 0, canvas.width, canvas.height); context.drawImage(over, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = VENDING.file(item.id); link.click(); sound?.play('jingle');
  });
  choose(0, true); show(null);
  return { show, get item() { return item?.id ?? null; }, focus: () => (parts[0] ?? crayons[0]).focus({ preventScroll: true }), destroy() { events.abort(); host.replaceChildren(); } };
}
