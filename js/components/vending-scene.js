// The Christmas Market's square at night, cut from paper like the other pages (docs/VENDING-MARKET.md). Far off, pale snow
// hills with a fringe of firs; then a row of market chalets, their hatches and windows lit, a church spire between them,
// snowy firs at the edges; two strings of warm bulbs hung across the square. The square itself is one field of snow with
// a wooden railing at its back and two street lamps; in front, a cobbled path to the vending machine, footprints, crates
// and gifts in one corner, a signpost in the other. The craft booth (its own button, `mountCraftBooth`) stands on the
// left. Each piece that moves (the stars' twinkle, the lamps' glow, the two sets of bulbs, the booth's sign) is a layer of
// its own, moved by css/vending.css only without reduced motion.
import { holly, paperLayer, shape } from './paper-art.js';
import { church, fence, roofHouse, snowyFir, star } from './paper-props.js';

const NIGHT = { paper: { scale: .9, grain: .42, shadow: .22, rim: '#93a7bb' }, eager: true }, SNOWY = { paper: { scale: .9, grain: .45, shadow: .18, rim: '#fffdf6' }, eager: true };
const WARM = { paper: { scale: .6, grain: .45, shadow: .26 }, eager: true }, LIGHT = { paper: null, eager: true };
const SNOW = '#fbf8f1', SHADE = '#dfe7ee', WOOD = '#8a5a3c', DARK = '#6b4430', LIT = '#f4c66e';
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent.append(node); return node; };
const piece = (host, className, viewBox, draw, options = NIGHT) => paperLayer(element('div', `market-piece ${className}`, host), viewBox, '', draw, options);
const STARS = [[90, 70, 9], [230, 150, 6], [330, 50, 7], [520, 120, 10], [690, 40, 6], [840, 130, 8], [980, 60, 6], [1110, 160, 7], [1320, 110, 9], [1400, 40, 6], [160, 210, 5], [620, 220, 5]];
const TWINKLE = [[430, 80, 8], [760, 180, 7], [1220, 60, 8], [40, 160, 6]];

// The moon: a pale paper crescent with two faint rounds of light about it.
function moon(g) {
  for (const [r, opacity] of [[70, .1], [50, .16]]) shape('circle', { cx: 80, cy: 80, r, fill: '#f7e9b8', opacity }, g);
  shape('path', { d: 'M88 42A40 40 0 1 0 118 96 32 32 0 1 1 88 42Z', fill: '#f6e3a4' }, g);
}
const stars = list => g => { for (const [x, y, size] of list) star(g, x, y, size, '#f3df9e'); };
// The far hills, grey-blue, with a fringe of little firs along the nearer ridge.
function hills(g) {
  shape('path', { d: 'M0 120C170 84 330 104 500 86S800 62 990 90 1280 72 1440 96V260H0Z', fill: '#aebfcf' }, g);
  shape('path', { d: 'M0 158C210 128 420 146 650 132S1080 114 1440 140V260H0Z', fill: '#c6d3df' }, g);
  for (const [x, y, h] of [[60, 152, 30], [92, 150, 22], [210, 140, 34], [248, 138, 24], [396, 144, 28], [430, 142, 20], [560, 136, 30], [590, 134, 22], [860, 128, 32], [896, 126, 22], [1010, 124, 28], [1180, 126, 34], [1214, 128, 24], [1330, 134, 30], [1364, 136, 22]]) shape('path', { d: `M${x} ${y - h}L${x + h * .32} ${y}H${x - h * .32}Z`, fill: '#8fa3b6' }, g);
  shape('path', { d: 'M0 200C240 176 500 194 760 184S1180 170 1440 190V260H0Z', fill: '#dbe4ec' }, g);
}
// A market chalet: plank walls, a steep roof under a thick cap of snow, its hatch lit warm over a counter, a shutter
// propped above it, a garland along the eaves.
function chalet(g, x, base, width, height, { wall = '#d6bf9b', roof = '#8f3530', shutter = '#b5443c' } = {}) {
  const half = width / 2, eave = base - height, peak = eave - width * .46;
  shape('path', { d: `M${x - half} ${base}V${eave}H${x + half}V${base}Z`, fill: wall }, g);
  for (let i = 1; i < 6; i++) shape('path', { d: `M${x - half} ${eave + height * i / 6}H${x + half}`, stroke: '#5a3e30', 'stroke-opacity': .12, 'stroke-width': 2 }, g);
  const hx = x - half * .74, hw = width * .74, hy = eave + height * .24, hh = height * .44;
  shape('rect', { x: hx, y: hy, width: hw, height: hh, fill: LIT }, g);
  shape('rect', { x: hx, y: hy, width: hw, height: hh * .3, fill: '#e3a552', opacity: .6 }, g);
  for (let i = 0; i < 4; i++) shape('circle', { cx: hx + hw * (.17 + i * .22), cy: hy + hh * .62, r: hw * .055, fill: ['#b5443c', '#3f6653', '#e0b04f', '#b5443c'][i], opacity: .75 }, g);
  shape('rect', { x: hx - 5, y: hy + hh - 3, width: hw + 10, height: 9, fill: WOOD }, g);
  shape('path', { d: `M${hx - 7} ${hy}H${hx + hw + 7}L${hx + hw + 13} ${hy - 15}H${hx - 13}Z`, fill: shutter }, g);
  shape('path', { d: `M${x + half * .42} ${base}V${eave}H${x + half}V${base}Z`, fill: '#000', opacity: .07 }, g);
  shape('path', { d: `M${x - half * 1.2} ${eave + 4}L${x} ${peak}L${x + half * 1.2} ${eave + 4}Z`, fill: roof }, g);
  shape('path', { d: `M${x - half * 1.26} ${eave + 6}L${x} ${peak - 8}L${x + half * 1.26} ${eave + 6}C${x + half} ${eave} ${x + half * .7} ${eave - 12} ${x + half * .45} ${eave - 22} ${x + half * .2} ${eave - 8} ${x} ${eave - 26} ${x - half * .25} ${eave - 14} ${x - half * .55} ${eave - 4} ${x - half * .85} ${eave - 10} ${x - half * 1.26} ${eave + 6}Z`, fill: SNOW }, g);
  shape('path', { d: `M${x - half * 1.08} ${eave + 8}Q${x - half * .5} ${eave + 22} ${x} ${eave + 10}T${x + half * 1.08} ${eave + 8}`, fill: 'none', stroke: '#3f6653', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  for (const t of [.15, .5, .85]) shape('circle', { cx: x - half * 1.08 + width * 1.08 * t, cy: eave + 14 + Math.sin(t * Math.PI * 2) * 3, r: 3.4, fill: '#c63a33' }, g);
}
// The row of chalets across the back of the square, a church between them, firs at the ends.
function market(g) {
  church(g, 1012, 300);
  for (const [x, base, h, v] of [[24, 316, 210, 0], [128, 312, 150, 2], [1416, 316, 220, 1], [1310, 312, 140, 0], [606, 300, 120, 2], [880, 298, 110, 1]]) snowyFir(g, x, base, h, v, .55);
  roofHouse(g, 300, 312, 112, 86, { wall: '#e2cfae', roof: '#7d5a4c' });
  chalet(g, 452, 316, 150, 112, { wall: '#d9c19c', roof: '#7a3b33', shutter: '#3f6653' });
  chalet(g, 760, 312, 140, 104, { wall: '#cfb48e', roof: '#3f5a56', shutter: '#b5443c' });
  roofHouse(g, 1150, 312, 104, 80, { wall: '#ead9bd', roof: '#3f5a56' });
  chalet(g, 1270, 318, 136, 106, { wall: '#d6bf9b', roof: '#8f3530', shutter: '#e0b04f' });
  chalet(g, 190, 320, 128, 98, { wall: '#dcc6a4', roof: '#3f6653', shutter: '#b5443c' });
}
// The two strings of bulbs hung across the square: the wire and the sockets; the bulbs (`bulbs`) are two layers of their
// own, each lit in turn.
const STRINGS = [[[0, 52], [360, 132], [720, 58], [1080, 136], [1440, 48]], [[0, 112], [300, 176], [600, 120]], [[840, 124], [1140, 182], [1440, 110]]];
function sag(points) { let d = `M${points[0].join(' ')}`; for (let i = 1; i < points.length; i++) { const [x0, y0] = points[i - 1], [x1, y1] = points[i], dip = Math.max(y0, y1) + 44; d += `Q${(x0 + x1) / 2} ${dip} ${x1} ${y1}`; } return d; }
function along(points, step) {
  const out = [];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i], cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + 44, n = Math.round((x1 - x0) / step);
    for (let k = 1; k < n; k++) { const t = k / n; out.push([(1 - t) ** 2 * x0 + 2 * t * (1 - t) * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * t * (1 - t) * cy + t * t * y1]); }
  }
  return out;
}
function wires(g) { for (const points of STRINGS) { shape('path', { d: sag(points), fill: 'none', stroke: '#2c2a33', 'stroke-width': 2.2 }, g); for (const [x, y] of along(points, 46)) shape('rect', { x: x - 2.5, y: y - 1, width: 5, height: 5, fill: '#3e3640' }, g); } }
const bulbs = turn => g => STRINGS.flatMap(points => along(points, 46)).forEach(([x, y], i) => {
  if (i % 2 !== turn) return;
  shape('circle', { cx: x, cy: y + 10, r: 11, fill: '#ffd98a', opacity: .22 }, g);
  shape('ellipse', { cx: x, cy: y + 9, rx: 4.6, ry: 6.4, fill: i % 7 === 3 ? '#f2a08f' : '#ffe4a3' }, g);
});
// The square: a far edge in the blue of the evening, then the trodden snow.
function square(g) {
  shape('path', { d: 'M0 26C300 14 620 30 900 22S1260 14 1440 24V300H0Z', fill: '#c3d1dd' }, g);
  shape('path', { d: 'M0 46C320 34 660 50 980 40S1300 34 1440 42V300H0Z', fill: '#e6edf1' }, g);
  shape('path', { d: 'M0 118C300 102 700 124 1040 110S1330 102 1440 110V300H0Z', fill: '#f5f2ea' }, g);
}
const railing = (from, count) => g => fence(g, from, 70, count, 34);
// The street lamp: an iron post with a lantern and a bow of holly; its glow and the warm pool on the snow are their own layers.
function lampPost(g) {
  shape('path', { d: 'M92 588L96 170H110L114 588Z', fill: '#4b3f45' }, g);
  shape('path', { d: 'M78 592Q103 574 128 592Z', fill: '#4b3f45' }, g);
  shape('path', { d: 'M103 172C103 150 118 138 140 138', fill: 'none', stroke: '#4b3f45', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M126 140H170L162 150H134Z', fill: '#3c3238' }, g);
  shape('path', { d: 'M134 150H162L168 214H128Z', fill: '#f6d38a' }, g);
  shape('path', { d: 'M148 150V214M131 182H165', stroke: '#3c3238', 'stroke-width': 3 }, g);
  shape('path', { d: 'M124 214H172L166 224H130Z', fill: '#3c3238' }, g);
  shape('path', { d: 'M126 140Q148 118 170 140Z', fill: '#f4f1ea' }, g);
  holly(g, 103, 300, .8);
}
const lampGlow = g => { for (const [r, opacity] of [[150, .1], [100, .14], [56, .2]]) shape('circle', { cx: 148, cy: 184, r, fill: '#ffd98a', opacity }, g); };
const lampPool = g => { for (const [rx, ry, opacity] of [[220, 44, .16], [150, 30, .2], [80, 16, .22]]) shape('ellipse', { cx: 240, cy: 60, rx, ry, fill: '#ffd68c', opacity }, g); };
// The cobbled path to the machine, rows of stones growing nearer, snow banked along both sides, a trail of footprints.
function path(g) {
  shape('path', { d: 'M236 0H364L560 220H40Z', fill: '#c4cfd9' }, g);
  for (let r = 0; r < 8; r++) {
    const t = r / 7, y = 6 + t * t * 172 + t * 18, h = 7 + t * 17, left = 236 - t * 184, right = 364 + t * 184, n = 5 + r, step = (right - left) / n;
    for (let i = 0; i < n; i++) shape('rect', { x: left + step * i + (r % 2 ? step * .45 : step * .08), y, width: step * .8, height: h, rx: h * .45, fill: (i + r) % 3 ? '#a8b6c3' : '#97a7b6' }, g);
  }
  for (const [x, y, s] of [[318, 30, .5], [290, 62, .62], [330, 98, .74], [286, 140, .88], [336, 186, 1]]) shape('ellipse', { cx: x, cy: y, rx: 6 * s, ry: 10 * s, fill: '#7f93a6', opacity: .35, transform: `rotate(-8 ${x} ${y})` }, g);
  shape('path', { d: 'M236 0C214 44 120 140 40 220H0V0Z', fill: '#f5f2ea' }, g);
  shape('path', { d: 'M364 0C386 44 480 140 560 220H600V0Z', fill: '#f5f2ea' }, g);
}
// Crates and gifts in the near left corner, a sprig of pine over them.
function gift(g, x, base, w, h, fill, ribbon) {
  shape('rect', { x, y: base - h, width: w, height: h, fill }, g);
  shape('rect', { x: x + w / 2 - 4, y: base - h, width: 8, height: h, fill: ribbon }, g);
  shape('rect', { x: x - 3, y: base - h - 8, width: w + 6, height: 10, fill }, g);
  shape('path', { d: `M${x + w / 2} ${base - h - 8}C${x + w / 2 - 18} ${base - h - 26} ${x + w / 2 - 24} ${base - h - 6} ${x + w / 2} ${base - h - 8}C${x + w / 2 + 18} ${base - h - 26} ${x + w / 2 + 24} ${base - h - 6} ${x + w / 2} ${base - h - 8}Z`, fill: ribbon }, g);
}
function crates(g) {
  for (const [x, y, w, h] of [[20, 96, 120, 64], [56, 40, 92, 56]]) {
    shape('rect', { x, y, width: w, height: h, fill: '#a8774d' }, g);
    for (let i = 1; i < 3; i++) shape('path', { d: `M${x} ${y + h * i / 3}H${x + w}`, stroke: DARK, 'stroke-width': 3, 'stroke-opacity': .5 }, g);
    shape('path', { d: `M${x + 6} ${y + 4}L${x + w - 6} ${y + h - 4}`, stroke: DARK, 'stroke-width': 4, 'stroke-opacity': .45 }, g);
    shape('path', { d: `M${x - 4} ${y + 4}C${x + w * .3} ${y - 10} ${x + w * .7} ${y - 4} ${x + w + 4} ${y + 4}Z`, fill: SNOW }, g);
  }
  gift(g, 150, 160, 54, 44, '#b5443c', '#e0b04f');
  gift(g, 210, 160, 40, 32, '#3f6653', '#f6ecd6');
  shape('path', { d: 'M0 160C40 146 90 150 140 158S240 150 300 160V180H0Z', fill: SNOW }, g);
}
// The signpost: three arrow boards, each with a little picture of where it leads (no words: the things say it).
function signpost(g) {
  shape('path', { d: 'M92 250L96 40H106L110 250Z', fill: WOOD }, g);
  const board = (y, flip, draw) => {
    const d = flip ? `M150 ${y}H52L36 ${y + 17}L52 ${y + 34}H150Z` : `M50 ${y}H148L164 ${y + 17}L148 ${y + 34}H50Z`;
    shape('path', { d, fill: '#c48a5a' }, g); shape('path', { d, fill: 'none', stroke: DARK, 'stroke-width': 2, 'stroke-opacity': .4 }, g);
    draw(flip ? 96 : 104, y + 17);
  };
  board(48, true, (x, y) => { shape('rect', { x: x - 12, y: y - 13, width: 24, height: 26, rx: 4, fill: '#b5443c' }, g); shape('rect', { x: x - 8, y: y - 8, width: 16, height: 10, fill: '#36564c' }, g); shape('circle', { cx: x + 14, cy: y - 2, r: 3, fill: '#e0b04f' }, g); });
  board(92, false, (x, y) => { for (const [dx, fill] of [[-12, '#b5443c'], [-4, '#e0b04f'], [4, '#3f6653'], [12, '#9fbdd2']]) { shape('rect', { x: x + dx - 3, y: y - 10, width: 6, height: 20, rx: 2, fill }, g); shape('path', { d: `M${x + dx - 3} ${y - 10}L${x + dx} ${y - 16}L${x + dx + 3} ${y - 10}Z`, fill }, g); } });
  board(136, true, (x, y) => { shape('rect', { x: x - 13, y: y - 12, width: 26, height: 24, rx: 3, fill: '#f6ecd6' }, g); for (let i = 0; i < 6; i++) shape('rect', { x: x - 10 + (i % 3) * 7.4, y: y - 6 + Math.floor(i / 3) * 8, width: 5.4, height: 6, fill: ['#b5443c', '#3f6653', '#e0b04f'][i % 3] }, g); });
  shape('path', { d: 'M86 40C92 30 110 30 116 40Z', fill: SNOW }, g);
  holly(g, 101, 184, .55);
  shape('path', { d: 'M40 252C70 238 130 238 170 252Z', fill: SNOW }, g);
}
const drift = d => g => shape('path', { d, fill: SNOW }, g);

// The craft booth, 300 × 400: a little wooden workshop stall with a red and cream striped awning, its back wall lit warm,
// drawings pegged on a line, jars of crayons on a shelf, an easel and a tin of crayons on the counter, a wreath on its
// front, snow on its roof. Its sign (its own layer, it sways) and the warm light inside (brighter when pointed at) are
// laid over it; the words on the sign stay text.
function booth(g) {
  for (const x of [24, 262]) { shape('path', { d: `M${x} 112H${x + 14}L${x + 15} 392H${x - 1}Z`, fill: WOOD }, g); shape('path', { d: `M${x + 9} 112H${x + 14}L${x + 15} 392H${x + 10}Z`, fill: DARK }, g); }
  shape('rect', { x: 38, y: 128, width: 224, height: 146, fill: '#5e3d2c' }, g);
  shape('rect', { x: 46, y: 136, width: 208, height: 130, fill: '#efc27a' }, g);
  shape('rect', { x: 46, y: 136, width: 208, height: 34, fill: '#dc9e55', opacity: .55 }, g);
  shape('path', { d: 'M52 162Q150 176 248 160', fill: 'none', stroke: '#6b4430', 'stroke-width': 1.6 }, g);
  for (const [x, art] of [[78, '#3f6653'], [138, '#b5443c'], [200, '#e0b04f']]) { shape('rect', { x: x - 15, y: 166, width: 30, height: 36, fill: '#fbf3df', transform: `rotate(${(x % 3) - 1} ${x} 166)` }, g); shape('rect', { x: x - 3, y: 160, width: 6, height: 10, fill: '#a8774d' }, g); shape('path', { d: `M${x} 174L${x + 9} 194H${x - 9}Z`, fill: art }, g); }
  shape('rect', { x: 50, y: 218, width: 200, height: 6, fill: WOOD }, g);
  for (const [x, fill] of [[72, '#b5443c'], [104, '#3f6653'], [196, '#e0b04f'], [226, '#9fbdd2']]) { shape('rect', { x: x - 9, y: 196, width: 18, height: 22, rx: 3, fill: '#e8eef2', opacity: .85 }, g); for (const dx of [-5, 0, 5]) shape('rect', { x: x + dx - 1.6, y: 186 + Math.abs(dx), width: 3.2, height: 14, fill }, g); }
  shape('rect', { x: 132, y: 200, width: 36, height: 18, rx: 4, fill: '#f6ecd6' }, g);
  shape('rect', { x: 28, y: 266, width: 244, height: 14, fill: '#a8774d' }, g);
  shape('path', { d: 'M34 280H266V388H34Z', fill: '#c48a5a' }, g);
  for (let x = 62; x < 266; x += 30) shape('path', { d: `M${x} 282V386`, stroke: DARK, 'stroke-width': 2, 'stroke-opacity': .35 }, g);
  shape('circle', { cx: 150, cy: 332, r: 30, fill: 'none', stroke: '#3f6653', 'stroke-width': 12 }, g);
  for (const a of [0, 1.3, 2.6, 3.9, 5.2]) shape('circle', { cx: 150 + Math.cos(a) * 30, cy: 332 + Math.sin(a) * 30, r: 4, fill: '#c63a33' }, g);
  shape('path', { d: 'M138 302L150 312L162 302', fill: 'none', stroke: '#b5443c', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  // On the counter: an easel with a little painted tree, a tin of crayons.
  shape('path', { d: 'M206 264L222 214L238 264M222 214V264', fill: 'none', stroke: DARK, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
  shape('rect', { x: 204, y: 206, width: 36, height: 34, fill: '#fbf3df' }, g); shape('path', { d: 'M222 212L232 234H212Z', fill: '#3f6653' }, g);
  shape('rect', { x: 58, y: 250, width: 50, height: 16, rx: 3, fill: '#3f6653' }, g);
  for (const [i, fill] of ['#b5443c', '#e0b04f', '#9fbdd2', '#f6ecd6', '#a8744a'].entries()) shape('rect', { x: 62 + i * 9, y: 240, width: 6, height: 12, rx: 2, fill }, g);
  // The awning: stripes of red and cream with a scalloped hem, a roof above it under snow, a star on its peak.
  shape('path', { d: 'M6 100L150 30L294 100Z', fill: '#7a3b33' }, g);
  shape('path', { d: 'M0 98C26 84 52 90 78 78S124 52 150 26C176 52 196 70 222 78S272 84 300 98L292 102C268 92 248 94 226 86S184 64 150 40C118 64 98 80 76 86S30 92 8 104Z', fill: SNOW }, g);
  star(g, 150, 22, 12);
  const stripes = 9, width = 288 / stripes;
  for (let i = 0; i < stripes; i++) {
    const x = 6 + i * width;
    shape('path', { d: `M${x} 102H${x + width}V128Q${x + width / 2} 142 ${x} 128Z`, fill: i % 2 ? '#fbf3df' : '#b5443c' }, g);
  }
  shape('rect', { x: 6, y: 100, width: 288, height: 6, fill: '#7f2f2a' }, g);
  for (let i = 0; i < 8; i++) { const x = 22 + i * 36; shape('circle', { cx: x, cy: 112, r: 4.4, fill: '#ffe4a3' }, g); }
  shape('path', { d: 'M0 392C60 376 120 384 170 388S250 378 300 390V400H0Z', fill: SNOW }, g);
}
const boothGlow = g => { for (const [rx, ry, opacity] of [[150, 110, .18], [100, 70, .2]]) shape('ellipse', { cx: 150, cy: 206, rx, ry, fill: '#ffd98a', opacity }, g); };
// The booth's sign: a wooden board hung on two cords from the awning, a little palette painted at its left.
function boothSign(g) {
  shape('path', { d: 'M40 0L34 18M140 0L146 18', stroke: '#e9dcc2', 'stroke-width': 2.4 }, g);
  shape('rect', { x: 8, y: 16, width: 164, height: 46, rx: 10, fill: '#a8774d' }, g);
  shape('rect', { x: 14, y: 22, width: 152, height: 34, rx: 7, fill: '#c48a5a' }, g);
  shape('path', { d: 'M24 46C18 30 40 24 50 32 58 38 48 44 54 50 46 58 30 56 24 46Z', fill: '#f6ecd6' }, g);
  for (const [x, y, fill] of [[30, 36, '#b5443c'], [40, 32, '#3f6653'], [44, 42, '#e0b04f']]) shape('circle', { cx: x, cy: y, r: 3.2, fill }, g);
}

export function mountScene(back, front) {
  piece(back, 'market-stars', '0 0 1440 260', stars(STARS), { paper: null, eager: true, preserveAspectRatio: 'xMidYMin slice' });
  piece(back, 'market-twinkle', '0 0 1440 260', stars(TWINKLE), { paper: null, eager: true, preserveAspectRatio: 'xMidYMin slice' });
  piece(back, 'market-moon', '0 0 160 160', moon, { paper: { scale: .4, grain: .3, shadow: 0, rim: '#f6e9c4' }, eager: true });
  piece(back, 'market-hills', '0 0 1440 260', hills, { ...NIGHT, preserveAspectRatio: 'xMidYMax slice' });
  piece(back, 'market-row', '0 0 1440 330', market, { ...NIGHT, preserveAspectRatio: 'xMidYMax slice' });
  piece(back, 'market-wires', '0 0 1440 240', wires, { ...LIGHT, preserveAspectRatio: 'xMidYMin slice' });
  piece(back, 'market-bulbs is-a', '0 0 1440 240', bulbs(0), { ...LIGHT, preserveAspectRatio: 'xMidYMin slice' });
  piece(back, 'market-bulbs is-b', '0 0 1440 240', bulbs(1), { ...LIGHT, preserveAspectRatio: 'xMidYMin slice' });
  piece(back, 'market-square', '0 0 1440 300', square, { ...SNOWY, preserveAspectRatio: 'none' });
  piece(back, 'market-rail is-left', '0 0 420 80', railing(24, 12), SNOWY);
  piece(back, 'market-rail is-right', '0 0 420 80', railing(24, 12), SNOWY);
  for (const side of ['is-left', 'is-right']) {
    const lamp = element('div', `market-lamp ${side}`, back);
    paperLayer(lamp, '0 0 480 120', 'market-pool', lampPool, LIGHT);
    paperLayer(lamp, '0 0 300 600', 'market-glow', lampGlow, LIGHT);
    paperLayer(lamp, '0 0 300 600', 'market-post', lampPost, NIGHT);
  }
  piece(front, 'market-path', '0 0 600 220', path, SNOWY);
  piece(front, 'market-crates', '0 0 300 180', crates, WARM);
  piece(front, 'market-sign', '0 0 200 260', signpost, WARM);
  piece(front, 'market-drift is-left', '0 0 400 120', drift('M0 120V60C60 30 140 20 220 44S360 70 400 120Z'), SNOWY);
  piece(front, 'market-drift is-right', '0 0 400 120', drift('M400 120V54C330 26 250 22 170 48S40 76 0 120Z'), SNOWY);
  const flakes = element('div', 'market-flakes', front);
  for (let i = 0; i < 14; i++) { const flake = element('i', 'market-flake', flakes); flake.style.left = `${(i * 37 + 11) % 100}%`; flake.style.setProperty('--delay', `${-((i * 1.9) % 12)}s`); flake.style.setProperty('--drift', `${(i % 3 - 1) * 18}px`); }
}

// The craft booth inside its button: the stall, the warm light inside it, the sign on its cords with its words.
export function mountCraftBooth(button, label) {
  paperLayer(button, '0 0 300 400', 'craft-glow', boothGlow, LIGHT);
  paperLayer(button, '0 0 300 400', 'craft-stall', booth, WARM);
  const sign = element('span', 'craft-sign', button);
  paperLayer(sign, '0 0 180 66', '', boothSign, WARM);
  element('span', 'craft-words', sign).textContent = label;
}
