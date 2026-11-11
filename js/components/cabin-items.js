// The things in the visitor's pocket, cut from paper, each in a 100 × 100 box (the rules are in services/cabin-bag.js,
// the words in data/cabin-items.js): a pouch of lichen, a little key, a wooden crank handle, a box of matches, a
// magnifier, a brass pin, a blank slip and a big wooden gear. Also the pocket itself and the mitten that points at it once.
import { holly, shape } from './paper-art.js';

const ring = (cx, cy, r, hole) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0ZM${cx - hole} ${cy}a${hole} ${hole} 0 1 1 ${hole * 2} 0a${hole} ${hole} 0 1 1 ${-hole * 2} 0Z`;
function cog(cx, cy, outer, inner, teeth) {
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2, w = Math.PI / teeth * .55;
    for (const [angle, r] of [[a - w * 1.25, inner], [a - w * .7, outer], [a + w * .7, outer], [a + w * 1.25, inner]]) d += `${d ? 'L' : 'M'}${(cx + Math.cos(angle) * r).toFixed(1)} ${(cy + Math.sin(angle) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}
export const ITEM_ART = {
  lichen(g) {
    for (const [x, y, r] of [[40, 28, 9], [51, 23, 10], [61, 29, 8]]) shape('circle', { cx: x, cy: y, r, fill: '#b9cfa8' }, g);
    for (const [x, y] of [[42, 25], [53, 19], [60, 26]]) shape('circle', { cx: x, cy: y, r: 3, fill: '#e3edd8' }, g);
    shape('path', { d: 'M27 42Q24 84 31 89H69Q76 84 73 42Z', fill: '#c9a46a' }, g);
    shape('path', { d: 'M29 43L36 31H64L71 43Z', fill: '#b8925a' }, g);
    shape('path', { d: 'M27 43Q50 50 73 43', fill: 'none', stroke: '#8f5a3c', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    shape('path', { d: 'M50 47C42 40 38 50 50 48 62 50 58 40 50 47Z', fill: '#a8774d' }, g);
    shape('rect', { x: 39, y: 58, width: 22, height: 15, rx: 2, fill: '#fbf3df', transform: 'rotate(-6 50 65)' }, g);
    shape('path', { d: 'M50 70C45 66 43 63 45 61 47 59 49 60 50 62 51 60 53 59 55 61 57 63 55 66 50 70Z', fill: '#b5443c', transform: 'rotate(-6 50 65)' }, g);
  },
  key(g) {
    shape('path', { d: 'M20 36C10 28 13 15 24 17', fill: 'none', stroke: '#b5443c', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    shape('path', { d: ring(31, 50, 17, 7), fill: '#d9a441', 'fill-rule': 'evenodd' }, g);
    shape('rect', { x: 45, y: 46, width: 42, height: 8, rx: 3, fill: '#d9a441' }, g);
    shape('path', { d: 'M71 53V65H77V59H81V67H87V53Z', fill: '#c48f32' }, g);
    shape('path', { d: 'M21 43Q25 37 32 37', fill: 'none', stroke: '#f4d58a', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
  },
  handle(g) {
    shape('rect', { x: 10, y: 26, width: 18, height: 18, rx: 3, fill: '#6b4a33' }, g);
    shape('rect', { x: 15, y: 31, width: 8, height: 8, fill: '#3b2a24' }, g);
    shape('rect', { x: 24, y: 30, width: 52, height: 11, rx: 4, fill: '#a8774d' }, g);
    shape('path', { d: 'M30 35H66', stroke: '#8f5a3c', 'stroke-width': 1.6, opacity: .6 }, g);
    shape('rect', { x: 63, y: 35, width: 17, height: 48, rx: 8, fill: '#c08a5a' }, g);
    shape('path', { d: 'M71.5 44V74', stroke: '#a8774d', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .7 }, g);
    shape('ellipse', { cx: 71.5, cy: 84, rx: 9.5, ry: 4, fill: '#8f5a3c' }, g);
  },
  matches(g) {
    shape('rect', { x: 57, y: 18, width: 5, height: 26, rx: 2, fill: '#e9cf9a', transform: 'rotate(14 60 31)' }, g);
    shape('ellipse', { cx: 63, cy: 18, rx: 4.5, ry: 5.8, fill: '#a84a42', transform: 'rotate(14 63 18)' }, g);
    shape('rect', { x: 16, y: 38, width: 68, height: 42, rx: 3, fill: '#b5443c' }, g);
    shape('rect', { x: 16, y: 38, width: 68, height: 7, rx: 2, fill: '#6b4a33' }, g);
    shape('rect', { x: 29, y: 51, width: 42, height: 22, rx: 2, fill: '#fbf3df' }, g);
    shape('path', { d: 'M50 54L52.6 59.4 58.5 60 54 64 55.3 69.8 50 66.8 44.7 69.8 46 64 41.5 60 47.4 59.4Z', fill: '#e0b04f' }, g);
  },
  magnifier(g) {
    shape('rect', { x: 55, y: 50, width: 13, height: 40, rx: 6, fill: '#8f5a3c', transform: 'rotate(-45 61 70)' }, g);
    shape('rect', { x: 54, y: 47, width: 12, height: 10, rx: 2, fill: '#b38a3a', transform: 'rotate(-45 60 52)' }, g);
    shape('path', { d: ring(40, 40, 25, 18), fill: '#c9a14a', 'fill-rule': 'evenodd' }, g);
    shape('circle', { cx: 40, cy: 40, r: 18, fill: '#cfe3ec' }, g);
    shape('path', { d: 'M28 36Q31 27 41 25', fill: 'none', stroke: '#fbfdff', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
  },
  pin(g) {
    shape('path', { d: 'M27 75L76 26', stroke: '#c9a14a', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    shape('path', { d: 'M75 27L85 17', stroke: '#e0c070', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
    shape('path', { d: ring(21, 81, 10, 4.5), fill: '#c9a14a', 'fill-rule': 'evenodd' }, g);
    shape('path', { d: 'M14 88Q8 94 13 98', fill: 'none', stroke: '#b5443c', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
  },
  slip(g) {
    const turn = { transform: 'rotate(-5 50 50)' };
    shape('path', { d: 'M22 24H66L78 36V78H22Z', fill: '#fff3d9', ...turn }, g);
    shape('path', { d: 'M66 24V36H78Z', fill: '#efdcb6', ...turn }, g);
  },
  gear(g) {
    shape('path', { d: cog(50, 50, 42, 33, 12), fill: '#a8774d' }, g);
    shape('circle', { cx: 50, cy: 50, r: 25, fill: '#b98d5c' }, g);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; shape('circle', { cx: 50 + Math.cos(a) * 16, cy: 50 + Math.sin(a) * 16, r: 5.5, fill: '#6b4a33' }, g); }
    shape('circle', { cx: 50, cy: 50, r: 8, fill: '#c9a14a' }, g);
    shape('circle', { cx: 50, cy: 50, r: 3, fill: '#6b4a33' }, g);
  },
};
// The pocket: a kraft back, the pocket's front with a curved lip, a red button and a sprig of holly (64 × 66).
export function pocket(g) {
  shape('rect', { x: 7, y: 12, width: 50, height: 46, rx: 6, fill: '#a8865a' }, g);
  shape('path', { d: 'M4 26H60V55Q60 62 53 62H11Q4 62 4 55Z', fill: '#c9a46a' }, g);
  shape('path', { d: 'M4 26Q32 40 60 26', fill: 'none', stroke: '#a8774d', 'stroke-width': 2.2 }, g);
  shape('circle', { cx: 32, cy: 34, r: 4, fill: '#b5443c' }, g);
  holly(g, 51, 19, .26);
}
// A red knitted mitten with a cream cuff, tipped to point up and right (60 × 60).
export function mitten(g) {
  const hand = shape('g', { transform: 'rotate(40 30 32)' }, g);
  shape('path', { d: 'M19 48V25C19 11 41 11 41 25V48Z', fill: '#b5443c' }, hand);
  shape('path', { d: 'M19 38C10 38 8 29 12 25 15 22 19 25 19 29Z', fill: '#a84a42' }, hand);
  shape('rect', { x: 16, y: 45, width: 28, height: 11, rx: 3, fill: '#fbf3df' }, hand);
  shape('path', { d: 'M30 34C26 31 25 28 27 27 28.5 26 30 27 30 28.5 30 27 31.5 26 33 27 35 28 34 31 30 34Z', fill: '#fbf3df' }, hand);
}
