// The craft booth's workshop, drawn in paper (vending-coloring.js lays the tools over it): a wall of warm planks under a
// beam, a string of bulbs along it, a window onto the market at night with a wreath on it, the shelf the finished works
// stand on, the table, and on the table's corners a spool of ribbon, pine cones and a cup of pencils. The desk lamp, the
// crayon tin, the frames, the stickers and the little stand a finished sheet is shown on are drawn here too.
import { holly, shape } from './paper-art.js';
import { roofHouse, star } from './paper-props.js';

const WOOD = '#8a5a3c', DARK = '#6b4430', SNOW = '#fbf8f1';

// The wall, 1440 × 470 (shown cropped to fit): warm planks under a beam, a rail along it, the window onto the market.
// The cord the bulbs hang from: three swags along the beam, each sagging between the hooks it hangs from; and how high it
// is at x, so that a bulb hangs from it and never in the air beside it.
const HOOKS = [[0, 68], [480, 72], [960, 72], [1440, 68]], SAG = 118;
const CORD = `M${HOOKS[0].join(' ')}${HOOKS.slice(1).map(([x, y], i) => `Q${(HOOKS[i][0] + x) / 2} ${SAG} ${x} ${y}`).join('')}`;
const cordAt = x => { const k = Math.min(2, Math.floor(x / 480)), [[x0, y0], [x1, y1]] = [HOOKS[k], HOOKS[k + 1]], t = (x - x0) / (x1 - x0); return (1 - t) ** 2 * y0 + 2 * (1 - t) * t * SAG + t * t * y1; };
export function wall(g) {
  for (let x = 0; x < 1440; x += 60) shape('rect', { x, y: 0, width: 60, height: 470, fill: (x / 60) % 2 ? '#8f5f3f' : '#986846' }, g);
  for (let x = 60; x < 1440; x += 60) shape('path', { d: `M${x} 0V470`, stroke: '#5e3d2c', 'stroke-width': 3, 'stroke-opacity': .45 }, g);
  shape('rect', { x: 0, y: 0, width: 1440, height: 44, fill: DARK }, g);
  shape('rect', { x: 0, y: 330, width: 1440, height: 16, fill: '#7a5238' }, g);
  shape('path', { d: CORD, fill: 'none', stroke: '#2c2a33', 'stroke-width': 2.4 }, g);
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
  // A holly garland swagged along the rail on the right
  // (ending short of the tools on the right, so that it never runs behind them)
  shape('path', { d: 'M980 330Q1060 368 1140 334T1250 326', fill: 'none', stroke: '#3f6653', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
  for (const x of [1020, 1100, 1180]) shape('circle', { cx: x, cy: 346 + (x % 160 ? 4 : 0), r: 5, fill: '#c63a33' }, g);
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
// The bulbs along the beam (their own layer, softly lit in turn), each hung right on the cord.
export function roomBulbs(g) {
  for (let i = 1; i < 18; i++) {
    const x = i * 80, y = cordAt(x);
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

// The tools as things on the workshop's wall and table (each drawn in a 100 × 100 box unless said): a round wooden token
// with a cream arrow round it (`turn` 1: back, -1: forward again), an eraser in its blue sleeve, a red wax seal with a
// star pressed in it, and (140 × 86) a wooden door sign on a red thread with an arrow, holly at its corner.
const P = (g, d, fill, extra = {}) => shape('path', { d, fill, ...extra }, g);
export const token = turn => g => {
  shape('circle', { cx: 50, cy: 52, r: 44, fill: DARK }, g);
  shape('circle', { cx: 50, cy: 49, r: 41, fill: '#c0905f' }, g);
  for (const r of [29, 17]) shape('circle', { cx: 50, cy: 49, r, fill: 'none', stroke: '#a8774d', 'stroke-width': 2.5, opacity: .7 }, g);
  P(g, `M${50 + turn * 20} 61A22 22 0 1 ${turn > 0 ? 0 : 1} ${50 - turn * 16} 35`, 'none', { stroke: '#fbf3df', 'stroke-width': 8, 'stroke-linecap': 'round' });
  P(g, `M${50 - turn * 30} 31L${50 - turn * 12} 27L${50 - turn * 18} 45Z`, '#fbf3df');
};
export function eraser(g) {
  P(g, 'M10 58L52 20L92 44L50 84Z', '#e8a7a0');
  P(g, 'M34 37L74 62L50 84L10 58Z', '#6f9fb0');
  P(g, 'M10 58L50 84L50 92L10 66Z', '#5b8796');
  P(g, 'M74 62L92 44L92 52L50 92L50 84Z', '#c98a84');
  P(g, 'M52 20L92 44L74 62L34 37Z', '#f2c2bb', { opacity: .55 });
  for (const [x, y] of [[66, 90], [78, 84], [72, 96]]) shape('circle', { cx: x, cy: y, r: 2.6, fill: '#e8a7a0' }, g);
}
export function seal(g) {
  const points = Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2, r = i % 2 ? 40 : 46; return `${(50 + Math.cos(a) * r).toFixed(1)} ${(52 + Math.sin(a) * r).toFixed(1)}`; });
  P(g, `M${points.join('L')}Z`, '#a33a33');
  P(g, 'M28 88Q30 98 36 96Q40 92 38 86ZM70 90Q72 99 78 96Q80 90 76 86Z', '#a33a33');
  shape('circle', { cx: 50, cy: 52, r: 30, fill: '#b5443c' }, g);
  shape('circle', { cx: 50, cy: 52, r: 25, fill: 'none', stroke: '#8f2f2a', 'stroke-width': 3 }, g);
  star(g, 50, 52, 15, '#8f2f2a');
  P(g, 'M32 36Q40 28 52 30', 'none', { stroke: '#d9726a', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .8 });
}
export function doorSign(g) {
  P(g, 'M70 6L44 34M70 6L96 34', 'none', { stroke: '#b5443c', 'stroke-width': 3 });
  shape('circle', { cx: 70, cy: 6, r: 4, fill: '#7b5440' }, g);
  P(g, 'M8 34H132Q138 34 138 40V76Q138 82 132 82H8Q2 82 2 76V40Q2 34 8 34Z', '#a8774d');
  for (const y of [48, 62]) P(g, `M8 ${y}H132`, 'none', { stroke: WOOD, 'stroke-width': 2, opacity: .6 });
  P(g, 'M14 58L30 46V54H44V62H30V70Z', '#fbf3df');
  holly(g, 126, 38, .5);
}
// A wooden clothes peg (40 × 40) for a swatch card on its string.
export function peg(g) {
  P(g, 'M14 0H26V40H14Z', '#c0905f');
  P(g, 'M20 0V40', 'none', { stroke: WOOD, 'stroke-width': 1.5 });
  shape('circle', { cx: 20, cy: 18, r: 4, fill: '#8a8f96' }, g);
}
// The sticker sheet (196 × 102): white, a corner peeling, pale rings where the stickers sit.
export function stickerSheet(g) {
  P(g, 'M6 4H186Q192 4 192 10V82L176 98H10Q4 98 4 92V10Q4 4 6 4Z', '#fffdf6');
  P(g, 'M176 98L192 82H180Q176 82 176 86Z', '#e4d6bf');
  for (const x of [40, 98, 156]) shape('circle', { cx: x, cy: 58, r: 22, fill: '#f3ead8' }, g);
}
// A paper snowflake hung from the ceiling.
export function paperFlake(g) {
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
    P(g, `M50 50L${(50 + c * 40).toFixed(1)} ${(50 + s * 40).toFixed(1)}`, 'none', { stroke: SNOW, 'stroke-width': 7, 'stroke-linecap': 'round' });
    for (const t of [.55, .8]) { const x = 50 + c * 40 * t, y = 50 + s * 40 * t; for (const side of [-1, 1]) { const b = a + side * .7; P(g, `M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(b) * 10).toFixed(1)} ${(Math.sin(b) * 10).toFixed(1)}`, 'none', { stroke: SNOW, 'stroke-width': 5, 'stroke-linecap': 'round' }); } }
  }
  shape('circle', { cx: 50, cy: 50, r: 8, fill: SNOW }, g);
}
// The corkboard on the wall (260 × 170): pinned to it, a snowman the elves coloured in and a card of the day's three
// colours, and a blank slip.
export function corkboard(g) {
  P(g, 'M0 0H260V170H0Z', '#7b5440');
  P(g, 'M10 10H250V160H10Z', '#c79a6b');
  for (let i = 0; i < 90; i++) shape('circle', { cx: 20 + (i * 53) % 220, cy: 18 + (i * 37) % 136, r: 1.6, fill: '#a87b52', opacity: .6 }, g);
  const card = shape('g', { transform: 'rotate(-4 73 84)' }, g);
  P(card, 'M26 22H120V146H26Z', '#fffdf6');
  shape('circle', { cx: 73, cy: 112, r: 22, fill: '#f7f4ee', stroke: '#5a3e30', 'stroke-width': 2.4 }, card);
  shape('circle', { cx: 73, cy: 76, r: 16, fill: '#f7f4ee', stroke: '#5a3e30', 'stroke-width': 2.4 }, card);
  P(card, 'M58 58H88V62H58ZM63 38H83V58H63Z', '#3c3238');
  P(card, 'M58 90Q73 98 88 90V96Q73 104 58 96Z', '#b5443c');
  P(card, 'M73 78L86 81L73 83Z', '#d9823f');
  const swatch = shape('g', { transform: 'rotate(5 188 63)' }, g);
  P(swatch, 'M142 30H234V96H142Z', '#fffdf6');
  ['#b5443c', '#4f7d68', '#e0b04f'].forEach((fill, i) => P(swatch, `M${152 + i * 26} 42H${172 + i * 26}V82H${152 + i * 26}Z`, fill));
  P(g, 'M160 112H236V150H160Z', '#f6dfa8', { transform: 'rotate(-3 198 131)' });
  for (const [x, y, fill] of [[73, 26, '#b5443c'], [188, 32, '#4f7d68'], [200, 116, '#e0b04f']]) shape('circle', { cx: x, cy: y, r: 6, fill }, g);
}
