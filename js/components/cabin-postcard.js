// The postcard after an ending: a paper card to keep. Its picture is cut from paper like everything else (the paper is
// drawn as SVG through the paper filter and laid on a canvas), and its words are written over it in the site's own hand,
// so what is shown is exactly what is saved: a PNG, downloaded as a file. A true telling of B or C gets the deeper words
// ("Dear Christmas Traveler…"). From the card: save it, go back to the Home page, or stay in the village.
import { holly, rasterize, shape, paperFilter } from './paper-art.js';
import { POSTCARD } from '../data/cabin-finale.js';

const W = 1200, H = 800;
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
// A stamp's perforated edge, as one path.
function perforated(x, y, w, h, r = 7) {
  let d = `M${x} ${y}`;
  for (let i = 0; i < Math.round(w / (r * 2.4)); i++) d += `h${r * .4}a${r} ${r} 0 0 0 ${r * 2} 0`;
  d += `H${x + w}`;
  for (let i = 0; i < Math.round(h / (r * 2.4)); i++) d += `v${r * .4}a${r} ${r} 0 0 0 0 ${r * 2}`;
  return `${d}V${y + h}H${x}Z`;
}
// The card: cream paper, a red and green border, holly in one corner, the stamp (a little cabin with a lit window) with a
// postmark over its corner, the line down the middle and the address lines; on the left, the village at evening (lit
// windows for every telling, and for a true one a garland of six lit name tags over it).
function card(truth) {
  const svg = shape('svg', { viewBox: `0 0 ${W} ${H}` }), paper = shape('g', { filter: paperFilter(svg, 'postcard-paper', { scale: 1.4, grain: .55, shadow: .25 }) }, svg);
  shape('rect', { x: 18, y: 18, width: W - 36, height: H - 36, rx: 18, fill: '#fbf3df' }, paper);
  shape('rect', { x: 40, y: 40, width: W - 80, height: H - 80, rx: 10, fill: 'none', stroke: '#b5443c', 'stroke-width': 6 }, paper);
  shape('rect', { x: 52, y: 52, width: W - 104, height: H - 104, rx: 8, fill: 'none', stroke: '#3f6653', 'stroke-width': 2.4 }, paper);
  holly(paper, 86, 86, 1.1);
  // The picture: an evening village under snow.
  shape('rect', { x: 90, y: 300, width: 470, height: 380, rx: 14, fill: truth ? '#2f3e5a' : '#9fb6cc' }, paper);
  shape('path', { d: 'M90 560Q240 528 390 548T560 536V680H90Z', fill: '#eef2f5' }, paper);
  for (const [x, w, h, roof] of [[150, 90, 70, '#a8564c'], [270, 120, 96, '#87302f'], [420, 96, 74, '#3f6653']]) {
    shape('rect', { x, y: 560 - h, width: w, height: h, fill: '#efe2c4' }, paper);
    shape('path', { d: `M${x - 10} ${560 - h}L${x + w / 2} ${520 - h}L${x + w + 10} ${560 - h}Z`, fill: roof }, paper);
    shape('rect', { x: x + w * .3, y: 560 - h * .7, width: w * .22, height: h * .3, fill: '#f4cf74' }, paper);
  }
  if (truth) {
    shape('path', { d: 'M100 340Q325 400 550 340', fill: 'none', stroke: '#3f6653', 'stroke-width': 6 }, paper);
    ['#8f3b36', '#3f5a7a', '#3f6653', '#6e4a6b', '#b98a3c', '#b5443c'].forEach((fill, i) => { const x = 140 + i * 74, y = 352 + Math.sin(Math.PI * (i + .5) / 6) * 26; shape('circle', { cx: x, cy: y + 22, r: 22, fill: '#f4cf74', opacity: .35 }, paper); shape('rect', { x: x - 14, y, width: 28, height: 40, rx: 5, fill: '#fffaf0' }, paper); shape('rect', { x: x - 14, y, width: 28, height: 9, rx: 4, fill }, paper); });
  } else for (const [x, y] of [[140, 340], [250, 330], [480, 350], [380, 320]]) shape('circle', { cx: x, cy: y, r: 3, fill: '#fff' }, paper);
  // The stamp and its postmark.
  shape('path', { d: perforated(W - 230, 80, 140, 170), fill: '#fffaf0' }, paper);
  shape('rect', { x: W - 216, y: 94, width: 112, height: 142, rx: 4, fill: '#cfdeea', stroke: '#b5443c', 'stroke-width': 4 }, paper);
  shape('path', { d: `M${W - 196} 210L${W - 160} 168L${W - 124} 210Z`, fill: '#fbf8f1' }, paper);
  shape('rect', { x: W - 188, y: 192, width: 56, height: 36, fill: '#a84a42' }, paper); shape('rect', { x: W - 168, y: 200, width: 14, height: 14, fill: '#f4cf74' }, paper);
  shape('path', { d: 'M610 140V700', stroke: '#d8c49c', 'stroke-width': 3 }, paper);
  for (const y of [596, 666]) shape('path', { d: `M660 ${y}H1110`, stroke: '#d8c49c', 'stroke-width': 3 }, paper);
  const ink = shape('g', { opacity: .55 }, svg);
  shape('circle', { cx: W - 250, cy: 220, r: 56, fill: 'none', stroke: '#b5443c', 'stroke-width': 4 }, ink);
  shape('circle', { cx: W - 250, cy: 220, r: 44, fill: 'none', stroke: '#b5443c', 'stroke-width': 2 }, ink);
  for (const y of [196, 214, 232, 250]) shape('path', { d: `M${W - 200} ${y}q14 -8 28 0t28 0t28 0`, fill: 'none', stroke: '#b5443c', 'stroke-width': 3 }, ink);
  return svg;
}
// The postcard as a PNG data URL: the paper card, then the words in the site's hand.
async function render({ kind, truth, mark }) {
  const image = rasterize(card(truth)); await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const pen = canvas.getContext('2d'); pen.drawImage(image, 0, 0, W, H);
  // The hand is only fetched for characters a page shows: ask for these words before writing them on the canvas.
  const hand = getComputedStyle(document.documentElement).getPropertyValue('--font-hand').trim() || 'sans-serif';
  const words = ['Holy Merry!', POSTCARD.from, ...(truth ? POSTCARD.truth : POSTCARD.lines[kind]), POSTCARD.sign.truth, POSTCARD.sign[kind], `To: ${mark}.你`, POSTCARD.date].join('');
  await document.fonts?.load(`32px ${hand}`, words).catch(() => {}); await document.fonts?.ready;
  // Each line in the hand, made smaller where it would run past the right-hand column (650–1110).
  const write = (text, x, y, size, colour = '#3b2a24', align = 'left', room = 450) => {
    pen.font = `${size}px ${hand}`; const fit = Math.min(size, Math.floor(size * room / pen.measureText(text).width));
    pen.font = `${fit}px ${hand}`; pen.fillStyle = colour; pen.textAlign = align; pen.fillText(text, x, y);
  };
  write('Holy Merry!', 92, 210, 64, '#b5443c');
  write(POSTCARD.from, 96, 262, 30, '#3f6653');
  // The message under the stamp and its postmark, signed; the address and the date on the lines below.
  const lines = truth ? POSTCARD.truth : POSTCARD.lines[kind];
  lines.forEach((line, i) => write(line, 660, 340 + i * 54, i === 0 && truth ? 36 : 32, i === 0 && truth ? '#3f5a7a' : '#3b2a24'));
  write(truth ? POSTCARD.sign.truth : POSTCARD.sign[kind], 1110, 340 + lines.length * 54 + 6, 30, '#8f3b36', 'right');
  write(`To: ${mark ? `${mark}.` : '你'}`, 670, 586, 32);
  write(POSTCARD.date, 670, 656, 28, '#7d5636');
  return canvas.toDataURL('image/png');
}

export function postcard({ host, kind, truth = false, mark = '', sound, onClose = () => {} }) {
  const sheet = element('article', 'cabin-letter postcard-card', host); sheet.setAttribute('aria-label', POSTCARD.title);
  element('h3', 'chair-title', sheet, POSTCARD.title);
  const picture = element('img', 'postcard-image', sheet); picture.alt = [...(truth ? POSTCARD.truth : POSTCARD.lines[kind]), truth ? POSTCARD.sign.truth : POSTCARD.sign[kind]].join(' ');
  const actions = element('div', 'postcard-actions', sheet);
  const save = element('button', 'register-sign', actions, POSTCARD.save); save.type = 'button'; save.disabled = true;
  const home = element('a', 'register-sign postcard-home', actions, POSTCARD.home); home.href = 'index.html';
  const stay = element('button', 'cabin-letter-close', sheet, POSTCARD.stay); stay.type = 'button';
  let url = '';
  render({ kind, truth, mark }).then(data => { url = data; picture.src = data; save.disabled = false; }).catch(error => { console.error('Postcard failed', error); save.hidden = true; });
  // Saved as a file: the browser downloads the very picture shown.
  save.addEventListener('click', () => { if (!url) return; const link = document.createElement('a'); link.href = url; link.download = POSTCARD.file(kind); link.click(); sound.play('pick'); });
  stay.addEventListener('click', () => { sheet.remove(); sound.play('remove'); onClose(); });
  sound.play('open'); stay.focus({ preventScroll: true });
  return { close: () => sheet.remove() };
}
