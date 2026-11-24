// The craft booth's workshop, drawn in paper (vending-coloring.js lays the tools over it): a wall of warm planks under a
// beam, a string of bulbs along it, a window onto the market at night with a wreath on it, the shelf the finished works
// stand on, the table, and on the table's corners a spool of ribbon, pine cones and a cup of pencils. The desk lamp, the
// crayon tin, the frames, the stickers and the little stand a finished sheet is shown on are drawn here too.
import { holly, shape } from './paper-art.js';
import { roofHouse, star } from './paper-props.js';

const WOOD = '#8a5a3c', DARK = '#6b4430', SNOW = '#fbf8f1';

// The wall, 1440 × 470 (shown cropped to fit): warm planks under a beam, a rail along it, the window onto the market.
export function wall(g) {
  for (let x = 0; x < 1440; x += 60) shape('rect', { x, y: 0, width: 60, height: 470, fill: (x / 60) % 2 ? '#8f5f3f' : '#986846' }, g);
  for (let x = 60; x < 1440; x += 60) shape('path', { d: `M${x} 0V470`, stroke: '#5e3d2c', 'stroke-width': 3, 'stroke-opacity': .45 }, g);
  shape('rect', { x: 0, y: 0, width: 1440, height: 44, fill: DARK }, g);
  shape('rect', { x: 0, y: 330, width: 1440, height: 16, fill: '#7a5238' }, g);
  shape('path', { d: 'M0 68Q240 118 480 72T960 72T1440 68', fill: 'none', stroke: '#2c2a33', 'stroke-width': 2.4 }, g);
  // The window onto the market: night blue, chalets with lit windows, snow, a few stars; a wreath hung on its frame.
  shape('rect', { x: 70, y: 96, width: 260, height: 196, rx: 6, fill: '#5e3d2c' }, g);
  shape('rect', { x: 84, y: 110, width: 232, height: 168, fill: '#2b3d58' }, g);
  for (const [x, y, size] of [[110, 132, 5], [178, 124, 4], [282, 140, 6], [246, 120, 3.5]]) star(g, x, y, size, '#f3df9e');
  shape('path', { d: 'M84 236C130 222 170 230 214 224S284 216 316 226V278H84Z', fill: '#c6d3df' }, g);
  roofHouse(g, 138, 252, 56, 40, { wall: '#e2cfae', roof: '#8f3530' }); roofHouse(g, 232, 256, 64, 46, { wall: '#d9c19c', roof: '#3f5a56' });
  shape('path', { d: 'M84 262C140 248 200 258 250 252S300 248 316 254V278H84Z', fill: '#eef2f4' }, g);
  shape('path', { d: 'M200 110V278M84 194H316', stroke: '#5e3d2c', 'stroke-width': 8 }, g);
  shape('rect', { x: 62, y: 286, width: 276, height: 14, rx: 3, fill: '#a8774d' }, g);
  shape('circle', { cx: 200, cy: 194, r: 34, fill: 'none', stroke: '#3f6653', 'stroke-width': 13 }, g);
  for (const a of [.4, 1.6, 2.8, 4, 5.2]) shape('circle', { cx: 200 + Math.cos(a) * 34, cy: 194 + Math.sin(a) * 34, r: 4.2, fill: '#c63a33' }, g);
  shape('path', { d: 'M188 160L200 170L212 160', fill: 'none', stroke: '#b5443c', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  // A holly garland swagged along the rail on the right.
  shape('path', { d: 'M1000 330Q1100 372 1200 334T1400 330', fill: 'none', stroke: '#3f6653', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
  for (const x of [1050, 1150, 1250, 1350]) shape('circle', { cx: x, cy: 346 + (x % 200 ? 6 : 0), r: 5, fill: '#c63a33' }, g);
}
// The table, 1440 × 330 (shown cropped to fit): planks running across, its front edge darker, and on its corners a spool
// of red ribbon, pine cones and a cup of pencils.
export function table(g) {
  shape('rect', { x: 0, y: 0, width: 1440, height: 330, fill: '#b98a5a' }, g);
  for (let y = 48; y < 310; y += 56) shape('path', { d: `M0 ${y}H1440`, stroke: '#8f6342', 'stroke-width': 3, 'stroke-opacity': .5 }, g);
  shape('path', { d: 'M0 2H1440', stroke: '#f0d3a6', 'stroke-width': 4, 'stroke-opacity': .5 }, g);
  shape('rect', { x: 0, y: 300, width: 1440, height: 30, fill: WOOD }, g);
  shape('ellipse', { cx: 96, cy: 250, rx: 52, ry: 18, fill: DARK }, g); shape('rect', { x: 44, y: 206, width: 104, height: 44, fill: '#b5443c' }, g);
  shape('ellipse', { cx: 96, cy: 206, rx: 52, ry: 18, fill: '#c9564d' }, g); shape('ellipse', { cx: 96, cy: 206, rx: 16, ry: 6, fill: '#e6d3ad' }, g);
  shape('path', { d: 'M146 236C186 246 206 274 256 280', fill: 'none', stroke: '#b5443c', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
  for (const [x, y, turn] of [[1310, 254, -30], [1366, 266, 20]]) {
    const cone = shape('g', { transform: `translate(${x} ${y}) rotate(${turn})` }, g);
    shape('ellipse', { cx: 0, cy: 0, rx: 22, ry: 34, fill: '#7a5238' }, cone);
    for (let i = 0; i < 4; i++) shape('path', { d: `M-18 ${-20 + i * 12}Q0 ${-12 + i * 12} 18 ${-20 + i * 12}`, fill: 'none', stroke: '#5e3d2c', 'stroke-width': 3 }, cone);
  }
  shape('rect', { x: 1206, y: 210, width: 48, height: 64, rx: 6, fill: '#3f6653' }, g);
  for (const [dx, fill] of [[-12, '#b5443c'], [-2, '#e0b04f'], [8, '#9fbdd2'], [16, '#f6ecd6']]) shape('rect', { x: 1228 + dx, y: 166 + Math.abs(dx), width: 6, height: 50, rx: 2, fill, transform: `rotate(${dx / 2} ${1230 + dx} 216)` }, g);
}
// The bulbs along the beam (their own layer, softly lit in turn).
export function roomBulbs(g) {
  for (let i = 1; i < 18; i++) {
    const x = i * 80, y = 68 + Math.sin((i * 80 / 480) * Math.PI) ** 2 * 34 * (i * 80 % 960 < 480 ? 1 : 1);
    shape('circle', { cx: x, cy: y + 12, r: 16, fill: '#ffd98a', opacity: .2 }, g);
    shape('rect', { x: x - 3, y: y - 1, width: 6, height: 6, fill: '#3e3640' }, g);
    shape('ellipse', { cx: x, cy: y + 12, rx: 6, ry: 8.5, fill: i % 5 === 2 ? '#f2a08f' : '#ffe4a3' }, g);
  }
}
// The desk lamp, 200 × 260: a weighted brass foot, a jointed arm, a pine green shade, its bulb lit.
export function lamp(g) {
  shape('ellipse', { cx: 150, cy: 246, rx: 40, ry: 11, fill: '#7a5a2e' }, g); shape('ellipse', { cx: 150, cy: 240, rx: 36, ry: 9, fill: '#c99a3c' }, g);
  shape('path', { d: 'M150 238L120 150L64 96', fill: 'none', stroke: '#a8803a', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  shape('circle', { cx: 120, cy: 150, r: 7, fill: '#e0b04f' }, g);
  shape('path', { d: 'M20 96L62 54L108 100Z', fill: '#3f6653' }, g); shape('path', { d: 'M62 54L108 100L96 104Z', fill: '#2c4a3d' }, g);
  shape('ellipse', { cx: 62, cy: 104, rx: 12, ry: 8, fill: '#fff3cf', transform: 'rotate(45 62 104)' }, g);
}
export const lampGlow = g => { shape('path', { d: 'M40 104L-60 400H300L84 104Z', fill: '#ffe2a0', opacity: .16 }, g); for (const [r, opacity] of [[46, .22], [26, .3]]) shape('circle', { cx: 62, cy: 104, r, fill: '#ffe7b0', opacity }, g); };
// The crayon tin, 300 × 190: its lid swung open behind and the inside of the box (`tinBack`); the box's front, laid over
// the crayons standing in it (`tinFront`).
export function tinBack(g) {
  shape('path', { d: 'M18 8H282L290 86H10Z', fill: '#36564c' }, g); shape('path', { d: 'M26 16H274L280 78H20Z', fill: '#3f6653' }, g);
  shape('path', { d: 'M40 30H260', stroke: '#e0b04f', 'stroke-width': 3 }, g); holly(g, 150, 52, .42);
  shape('rect', { x: 6, y: 92, width: 288, height: 92, rx: 8, fill: '#243b34' }, g);
}
export function tinFront(g) {
  shape('rect', { x: 6, y: 122, width: 288, height: 62, rx: 8, fill: '#3f6653' }, g);
  shape('rect', { x: 14, y: 130, width: 272, height: 46, rx: 5, fill: 'none', stroke: '#e0b04f', 'stroke-width': 2.4 }, g);
  for (const x of [40, 260]) star(g, x, 153, 9, '#e0b04f');
}
// A crayon: its paper wrapper with two stripes, the coloured wax, a sharpened tip.
export const crayon = fill => g => {
  shape('path', { d: 'M8 26L16 4 24 26Z', fill }, g);
  shape('rect', { x: 6, y: 24, width: 20, height: 74, rx: 3, fill }, g);
  shape('rect', { x: 6, y: 40, width: 20, height: 34, fill: '#f6ecd6', opacity: .9 }, g);
  shape('path', { d: 'M9 46H23M9 68H23', stroke: fill, 'stroke-width': 2.4 }, g);
};
// A frame for the shelf, 100 × 124: a wooden moulding round a cream mat.
export function frame(g) {
  shape('rect', { x: 4, y: 4, width: 92, height: 116, rx: 4, fill: '#7a5238' }, g);
  shape('rect', { x: 10, y: 10, width: 80, height: 104, rx: 2, fill: '#a8774d' }, g);
  shape('rect', { x: 15, y: 15, width: 70, height: 94, fill: '#fbf3e1' }, g);
}
// The stickers: a gold star, a snowflake, a sprig of holly; each 40 × 40 around its middle.
export const STICKER_ART = {
  star: g => { star(g, 0, 1, 17, '#c99a3c'); star(g, 0, 0, 16, '#e0b04f'); star(g, 0, 0, 7, '#fbf3df'); },
  flake: g => { for (let i = 0; i < 6; i++) { const arm = shape('g', { transform: `rotate(${i * 60})` }, g); shape('path', { d: 'M0 0V-17M0-10L-5-15M0-10L5-15', fill: 'none', stroke: '#7fa3bd', 'stroke-width': 5.4, 'stroke-linecap': 'round' }, arm); shape('path', { d: 'M0 0V-17M0-10L-5-15M0-10L5-15', fill: 'none', stroke: SNOW, 'stroke-width': 3, 'stroke-linecap': 'round' }, arm); } },
  holly: g => { for (const [turn, fill] of [[-35, '#3f6653'], [35, '#5f8a70']]) shape('path', { d: 'M0 2C-6-4-6-14 0-20 2-16 5-15 8-17 7-12 9-9 12-8 8-4 4-1 0 2Z', fill, transform: `rotate(${turn}) translate(0 -2)` }, g); for (const [x, y] of [[-4, 4], [4, 4], [0, -1]]) shape('circle', { cx: x, cy: y, r: 3.6, fill: '#c63a33' }, g); },
};
// The little stand a finished sheet is shown on: a step of wood with a gold edge.
export function stand(g) {
  shape('path', { d: 'M20 40H380L360 70H40Z', fill: '#a8774d' }, g);
  shape('rect', { x: 14, y: 30, width: 372, height: 12, rx: 4, fill: '#c48a5a' }, g);
  shape('path', { d: 'M20 31H380', stroke: '#e0b04f', 'stroke-width': 3 }, g);
  shape('path', { d: 'M60 70H340L330 96H70Z', fill: WOOD }, g);
}
