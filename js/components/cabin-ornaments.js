// The welcome gifts. Each of the five substitutes cut a paper ornament in their own colour, their initial on it, and hid
// it where they like to be, for whoever comes to help next: N in the drawer of the music box he made for K, O in the
// sorting rack, E in the snowman's scarf, K behind the big wheel's gearbox door, H in the smallest hat, the one she wore
// the year her wish came true. Each found is kept in the save (`ornaments`); with all five, they hang on the cabin's tree,
// and a sixth, red, with the visitor's own initial, is already there at the top (cabin-play.js shows it).
import { paperLayer, holly, shape } from './paper-art.js';
import { star } from './paper-props.js';
import { SUBSTITUTES, letter } from './cabin-art.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const COLOURS = Object.fromEntries(SUBSTITUTES), CREAM = '#fffaf0', GOLD = '#e0b04f';
export const ORNAMENTS = {
  N: { name: '尼爾斯', where: '音樂盒底的抽屜', note: '歡迎你！這個音樂盒，是我做給 K 的。—— N.', hand: 'n' },
  O: { name: '歐拉', where: '分揀架', note: '分信辛苦了！郵戳章我帶出門了，別找啦。—— O.', hand: 'o' },
  E: { name: '艾洛', where: '雪人的圍巾', note: '你也喜歡替雪人打扮嗎？我也是。—— E.', hand: 'e' },
  K: { name: '克莉絲', where: '摩天輪的動力箱', note: '摩天輪交給你了。下次，換你帶新人來修。—— K.', hand: 'k' },
  H: { name: '荷莉', where: '最小的那頂聖誕帽', note: '這頂帽子，是我第一次來的那年戴的。歡迎你。—— H.', hand: 'h' },
};
// Each ornament's shape, in a 100 × 130 box hung from a loop at the top: a star, a heart, a bauble, a snowflake, a bell.
const SHAPES = {
  N: (g, c) => { star(g, 50, 74, 40, c); star(g, 50, 74, 28, '#a8564c'); },
  O: (g, c) => shape('path', { d: 'M50 112C24 92 10 76 12 58 14 42 32 36 50 52 68 36 86 42 88 58 90 76 76 92 50 112Z', fill: c }, g),
  E: (g, c) => { shape('circle', { cx: 50, cy: 74, r: 36, fill: c }, g); for (const y of [60, 88]) shape('path', { d: `M${50 - Math.sqrt(36 ** 2 - (y - 74) ** 2)} ${y}Q50 ${y + 5} ${50 + Math.sqrt(36 ** 2 - (y - 74) ** 2)} ${y}`, fill: 'none', stroke: CREAM, 'stroke-width': 3.4, opacity: .85 }, g); },
  K: (g, c) => { for (let i = 0; i < 6; i++) { const arm = shape('g', { transform: `rotate(${i * 60} 50 74)` }, g); shape('path', { d: 'M46 74V36Q50 31 54 36V74Z', fill: c }, arm); shape('path', { d: 'M50 50L40 42 43 39 50 45 57 39 60 42Z', fill: c }, arm); } shape('circle', { cx: 50, cy: 74, r: 18, fill: c }, g); },
  H: (g, c) => { shape('path', { d: 'M50 36C32 36 28 54 28 74 28 90 20 96 18 102H82C80 96 72 90 72 74 72 54 68 36 50 36Z', fill: c }, g); shape('circle', { cx: 50, cy: 106, r: 7, fill: GOLD }, g); holly(g, 50, 38, .3); },
};
export function ornament(mark, g) {
  shape('path', { d: 'M50 0V24', stroke: '#8f6a4c', 'stroke-width': 1.6 }, g);
  shape('rect', { x: 42, y: 22, width: 16, height: 10, rx: 2, fill: GOLD }, g);
  SHAPES[mark](g, COLOURS[mark]);
  letter(g, mark, 50, mark === 'O' ? 70 : mark === 'H' ? 76 : 75, 30, 34, { fill: CREAM, stroke: '#00000022', 'stroke-width': 1 });
}
const PAPER = { paper: { scale: .3, grain: .45, shadow: .3, rim: '#fbf6ea' }, eager: true };
// An ornament just found, with the line its maker wrote on the little tag tied to it.
export function showOrnament(parent, mark, before = null) {
  const found = element('div', 'ornament-found'); paperLayer(found, '-6 -4 112 140', '', g => ornament(mark, g), PAPER);
  const note = element('p', 'ornament-note', null, ORNAMENTS[mark].note); note.dataset.hand = ORNAMENTS[mark].hand;
  parent.insertBefore(found, before); parent.insertBefore(note, before);
  return found;
}
// The cabin's little tree with all five hung on it, and at the top a red one with the visitor's initial (any letter, so
// it is written over the paper, not cut).
const SPOTS = { N: [70, 92], K: [130, 104], H: [94, 140], E: [150, 152], O: [58, 158] };
export function treeCard(parent, mark) {
  const card = element('div', 'ornament-tree');
  paperLayer(card, '0 0 200 240', '', g => {
    shape('rect', { x: 92, y: 200, width: 16, height: 26, fill: '#6b4a33' }, g);
    for (const [top, half, base, fill] of [[30, 46, 104, '#3f6653'], [70, 64, 158, '#4f7d68'], [112, 84, 206, '#3f6653']]) shape('path', { d: `M100 ${top}L${100 + half} ${base}Q100 ${base + 10} ${100 - half} ${base}Z`, fill }, g);
    star(g, 100, 26, 16, GOLD);
  }, PAPER);
  for (const [who, [x, y]] of Object.entries(SPOTS)) { const hung = element('span', 'ornament-hung', card); Object.assign(hung.style, { left: `${(x - 13) / 2}%`, top: `${(y - 6) / 2.4}%` }); paperLayer(hung, '-6 -4 112 140', '', g => ornament(who, g), PAPER); }
  const mine = element('span', 'ornament-hung is-mine', card); Object.assign(mine.style, { left: '43.5%', top: '17%' });
  paperLayer(mine, '-6 -4 112 140', '', g => { shape('path', { d: 'M50 0V24', stroke: '#8f6a4c', 'stroke-width': 1.6 }, g); shape('rect', { x: 42, y: 22, width: 16, height: 10, rx: 2, fill: GOLD }, g); shape('circle', { cx: 50, cy: 74, r: 36, fill: '#b5443c' }, g); star(g, 72, 50, 8, GOLD); }, PAPER);
  element('span', 'ornament-mine', mine, mark ? `${mark}.` : '★');
  parent.append(card);
  return card;
}
