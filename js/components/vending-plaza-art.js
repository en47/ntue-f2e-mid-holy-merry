// The Christmas Market's paper (components/vending-scene.js, docs/VENDING-MARKET.md): each piece drawn where it stands
// in the picture the square was laid out from, in that picture's own pixels (its box is its place in the picture), so
// that stood up by services/market-layout.js it shows where the picture has it. The booths, the pennants and the bulbs
// are drawn square on, in centimetres, and the scene stands them up in three dimensions. A piece may be drawn a little
// past its box (a drift of snow, a leaf): the scene grows the board to take all of it in.
import { holly, shape } from './paper-art.js';
import { glowFill } from './vending-world-art.js';

const f = n => (Math.round(n * 10) / 10).toString();
const noise = i => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
const smooth = points => { let d = `M${f(points[0][0])} ${f(points[0][1])}`; for (let i = 1; i < points.length; i++) { const [x0, y0] = points[i - 1], [x1, y1] = points[i]; d += `Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`; } return `${d}L${f(points.at(-1)[0])} ${f(points.at(-1)[1])}`; };
const rect = (g, x, y, w, h, fill, extra = {}) => shape('rect', { x: f(x), y: f(y), width: f(w), height: f(h), fill, ...extra }, g);
const P = (g, d, fill, extra = {}) => shape('path', { d, fill, ...extra }, g);
const C = { snow: '#fbf7f2', snowShade: '#e4e0e8', red: '#c95a4c', redDark: '#a8473c', cream: '#f4e6cf', wood: '#a7754f', woodLight: '#c08a5f', woodDark: '#7b5440', glow: '#eec488', glowDeep: '#e2a866', pine: '#5f7a64', pineDark: '#4f6a56', green: '#3f6b55', gold: '#e2b354', slate: '#7d7f92', ink: '#3c3238', lit: '#f7d58e' };
// A lumpy cap of snow along a line from (x0, y0) to (x1, y1), `deep` thick, drooping over the edge.
export function snowLine(g, x0, y0, x1, y1, deep, seed = 1) {
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 18)), top = [], low = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; top.push([x, y - deep * (.5 + noise(seed + i * 1.3) * .5)]); low.push([x, y + deep * (i % 3 === 1 ? .95 : .3)]); }
  P(g, `${path([[x0 - 5, y0 + deep * .3], ...top, [x1 + 5, y1 + deep * .3], ...low.reverse()])}Z`, C.snow);
}
const star = (g, x, y, r, fill = C.gold, extra = {}) => { const pts = []; for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * .45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } P(g, `${path(pts)}Z`, fill, extra); };
const bow = (g, x, y, s = 1, fill = C.red) => {
  P(g, `M${x} ${y}C${x - 30 * s} ${y - 26 * s} ${x - 40 * s} ${y + 10 * s} ${x - 4 * s} ${y + 4 * s}Z`, fill); P(g, `M${x} ${y}C${x + 30 * s} ${y - 26 * s} ${x + 40 * s} ${y + 10 * s} ${x + 4 * s} ${y + 4 * s}Z`, fill);
  P(g, `M${x - 4 * s} ${y + 2 * s}L${x - 16 * s} ${y + 34 * s}L${x - 8 * s} ${y + 30 * s}L${x - 2 * s} ${y + 6 * s}ZM${x + 4 * s} ${y + 2 * s}L${x + 16 * s} ${y + 34 * s}L${x + 8 * s} ${y + 30 * s}L${x + 2 * s} ${y + 6 * s}Z`, C.redDark);
  shape('circle', { cx: x, cy: y + 2 * s, r: 6 * s, fill: C.redDark }, g);
};
const ribbonBox = (g, x, y, w, h, fill, ribbon, { lid = true, snow = true } = {}) => {
  rect(g, x, y, w, h, fill); rect(g, x + w * .44, y, w * .12, h, ribbon); rect(g, x + w - w * .12, y, w * .12, h, '#00000014');
  if (lid) { rect(g, x - 3, y - 2, w + 6, h * .16, fill); rect(g, x + w * .44, y - 2, w * .12, h * .16, ribbon); }
  bow(g, x + w / 2, y - 3, w / 110, ribbon); if (snow) snowLine(g, x - 3, y - 1, x + w + 3, y - 1, 6, x);
};

// The sky: a muted dusk blue, paler and warmer toward the hills.
export const SKY = { box: [-700, -260, 2800, 730], draw: g => {
  // (as wide and tall as the widest screen, a phone's tall view, and the turn to either side ever show)
  const bands = [[90, '#8f9ab9'], [190, '#97a0bd'], [260, '#a1a8c3'], [320, '#adb1c9'], [370, '#bdbbce'], [420, '#cfc6d2'], [470, '#e1d2d1']];
  rect(g, -700, -260, 2800, 730, '#e1d2d1');
  for (let i = bands.length - 2; i >= 0; i--) { const pts = []; for (let x = -700; x <= 2100; x += 60) pts.push([x, bands[i + 1][0] - 30 + Math.sin(x / 140 + i) * 6]); P(g, `M-700 -260${pts.map(([x, y]) => `L${f(x)} ${f(y)}`).join('')}L2100 -260Z`, bands[i][1]); }
  for (const [x, y, s] of [[90, 200, 1], [1180, 120, .8], [380, 120, .7], [-380, 160, .9], [1760, 170, .9], [620, -60, 1], [1500, -120, .8]]) for (const [dx, dy, r] of [[0, 0, 30], [28, -10, 24], [52, 2, 26], [22, 8, 26]]) shape('circle', { cx: f(x + dx * s), cy: f(y + dy * s), r: f(r * s), fill: '#a9b0c8', opacity: .5 }, g);
} };
// The mountains behind the town: one tall snowy peak, a lower one beside it.
export const MOUNTAINS = { box: [560, 226, 450, 222], draw: g => {
  P(g, 'M560 448L560 330L640 296L700 268L740 250L772 236L800 250L836 272L862 262L900 282L960 300L1010 318L1010 448Z', '#bcc3d8');
  P(g, 'M740 250L772 236L800 250L818 262L796 268L782 258L770 272L752 262L730 270Z', '#eef0f6');
  P(g, 'M836 272L862 262L884 274L868 280L852 274Z', '#eef0f6');
  P(g, 'M772 236L800 250L836 272L900 282L960 300L1010 318L1010 448L860 448Z', '#aeb6cf', { opacity: .6 });
} };
// The pines on the hills: snowy firs, darker toward the front, rising on the right; snow at their feet.
function pine(g, x, base, h, fill = C.pine, snow = C.snow) {
  const w = h * .62;
  for (const [k, top, bottom, width] of [[0, 0, .42, .55], [1, .22, .68, .78], [2, .44, .94, 1]]) {
    const y0 = base - h + h * top, y1 = base - h + h * bottom, half = w * width / 2;
    P(g, `M${f(x)} ${f(y0)}L${f(x + half)} ${f(y1)}Q${f(x)} ${f(y1 + h * .05)} ${f(x - half)} ${f(y1)}Z`, k === 1 ? (fill === C.pine ? C.pineDark : fill) : fill);
    P(g, `M${f(x)} ${f(y0)}L${f(x + half * .5)} ${f(y0 + (y1 - y0) * .42)}Q${f(x + half * .1)} ${f(y0 + (y1 - y0) * .36)} ${f(x)} ${f(y0 + (y1 - y0) * .5)}Q${f(x - half * .1)} ${f(y0 + (y1 - y0) * .36)} ${f(x - half * .5)} ${f(y0 + (y1 - y0) * .42)}Z`, snow);
    P(g, `M${f(x - half)} ${f(y1)}Q${f(x)} ${f(y1 + h * .05)} ${f(x + half)} ${f(y1)}Q${f(x + half * .5)} ${f(y1 - h * .05)} ${f(x)} ${f(y1 - h * .02)}Q${f(x - half * .5)} ${f(y1 - h * .05)} ${f(x - half)} ${f(y1)}Z`, snow);
  }
}
// The snowy hills behind the town, from one side of the widest view to the other: two rolls of snow, the nearer a little
// bluer at its foot, and on their crests a few clumps of firs standing in the snow (each fir's foot in a drift, so that
// it stands on the hill rather than floats).
const crest = (x, far) => far ? 352 - Math.sin(x / 260) * 14 - Math.sin(x / 97) * 5 : 386 - Math.sin(x / 210 + 1) * 16 - Math.sin(x / 83) * 4;
export const FOREST = { box: [-500, 300, 2500, 180], draw: g => {
  for (const far of [true, false]) {
    const top = []; for (let x = -500; x <= 2000; x += 25) top.push([x, crest(x, far)]);
    P(g, `${smooth(top)}L2000 480L-500 480Z`, far ? '#e9e8f0' : '#f1f0f5');
    P(g, `${smooth(top.map(([x, y]) => [x, y + 3]))}L2000 ${far ? 362 : 396}L-500 ${far ? 362 : 396}Z`, 'none', { stroke: far ? '#d6d6e3' : '#dcdbe6', 'stroke-width': 3, opacity: .8 });
  }
  for (const [x0, far, sizes] of [[-380, false, [58, 44]], [560, true, [52, 40, 30]], [1010, true, [60, 46]], [1250, false, [70, 52, 40]], [1700, false, [64, 48]]]) {
    sizes.forEach((h, k) => { const x = x0 + k * h * .55, base = crest(x, far) + 4; pine(g, x, base, h, far ? '#93a49f' : '#86998f', '#f4f2f7'); shape('ellipse', { cx: f(x), cy: f(base), rx: f(h * .38), ry: f(h * .08), fill: far ? '#e9e8f0' : '#f1f0f5' }, g); });
  }
} };
// The town round the end of the lane: the clock tower, a house either side of it with lit windows, snow on every roof.
export const TOWN = { box: [748, 200, 264, 280], draw: g => {
  rect(g, 748, 420, 264, 60, '#e9e5ea');
  // the house on the left of the tower
  P(g, 'M760 336L802 300L846 336Z', '#8a6555'); rect(g, 764, 334, 80, 96, '#d9ab84'); snowLine(g, 758, 336, 802, 300, 7, 2); snowLine(g, 802, 300, 848, 336, 7, 3);
  for (const x of [774, 812]) rect(g, x, 356, 20, 26, C.lit); rect(g, 774, 396, 20, 24, C.lit);
  // the clock tower
  rect(g, 850, 290, 62, 140, '#cdae97'); rect(g, 900, 290, 12, 140, '#b8988a');
  P(g, 'M840 292L881 214L922 292Z', C.slate); snowLine(g, 838, 292, 924, 292, 9, 5); snowLine(g, 862, 254, 881, 216, 4, 6);
  shape('circle', { cx: 881, cy: 330, r: 21, fill: '#f3e6c9', stroke: '#a9805a', 'stroke-width': 4 }, g);
  P(g, 'M881 330V316M881 330H893', 'none', { stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round' });
  rect(g, 870, 372, 22, 30, C.lit, { rx: 10 }); star(g, 881, 210, 6);
  // the house on the right of the tower, its big lit windows
  P(g, 'M904 330L958 290L1012 330Z', '#7f5b4c'); rect(g, 910, 328, 100, 102, '#d6a47c'); snowLine(g, 902, 330, 958, 290, 8, 7); snowLine(g, 958, 290, 1014, 330, 8, 8);
  for (const [x, y] of [[922, 346], [962, 346], [922, 388], [962, 388]]) rect(g, x, y, 30, 30, C.lit);
}, glow: g => { const fill = glowFill(g, '#ffd98a', .4); for (const [x, y] of [[795, 380], [960, 380], [881, 386]]) shape('ellipse', { cx: x, cy: y, rx: 60, ry: 50, fill }, g); } };
// The houses on the left behind the stalls: a gable under deep snow, a house with lit windows.
export const LEFT_TOWN = { box: [378, 128, 272, 404], draw: g => {
  P(g, 'M392 236L452 150L512 236Z', '#7b5a4b'); rect(g, 398, 234, 108, 298, '#d8b18c'); snowLine(g, 386, 238, 452, 150, 10, 2); snowLine(g, 452, 150, 518, 238, 10, 3);
  rect(g, 430, 260, 40, 50, C.lit); rect(g, 448, 260, 4, 50, C.woodDark);
  P(g, 'M470 258L548 206L626 258Z', '#82604f'); rect(g, 476, 256, 146, 276, '#e2bf97'); snowLine(g, 464, 260, 548, 204, 10, 4); snowLine(g, 548, 204, 632, 260, 10, 5);
  for (const [x, y] of [[494, 282], [560, 282], [494, 340], [560, 340]]) { rect(g, x, y, 46, 40, C.lit); rect(g, x + 21, y, 4, 40, C.woodDark); }
}, glow: g => { const fill = glowFill(g, '#ffd98a', .45); for (const [x, y] of [[540, 330], [450, 285]]) shape('ellipse', { cx: x, cy: y, rx: 90, ry: 80, fill }, g); } };
// The corner building at the top left: deep snow on its eaves, dark timbers, a lit window, a post going down.
export const CORNER = { box: [-480, 100, 810, 500], draw: g => {
  // (it runs on to the left past what the widest screen shows)
  rect(g, -480, 150, 810, 450, '#b98d6b');
  for (let x = -480; x < 330; x += 110) rect(g, x, 150, 16, 450, '#5f4134');
  rect(g, -480, 250, 810, 14, '#5f4134');
  for (let x = -450; x < 300; x += 110) { if (x > -40 && x < 0) continue; rect(g, x + 20, 170, 60, 64, C.lit); rect(g, x + 48, 170, 4, 64, '#5f4134'); rect(g, x + 20, 200, 60, 4, '#5f4134'); }
  P(g, 'M-480 150L-300 112L-120 128L120 104L280 128L330 150Z', '#6a4c40');
  snowLine(g, -482, 148, -300, 114, 22, 11); snowLine(g, -300, 114, -120, 130, 22, 12); snowLine(g, -120, 130, 120, 108, 22, 9); snowLine(g, 120, 108, 332, 152, 22, 10);
}, glow: g => { const fill = glowFill(g, '#ffd98a', .3); for (let x = -450; x < 300; x += 110) shape('ellipse', { cx: x + 50, cy: 202, rx: 50, ry: 45, fill }, g); } };
// The house at the top right edge: a snowy roof sloping down, a lit window.
// The houses on the right, behind the stalls there, running on past what the widest screen or the turn to the house
// shows: gables under snow, timbers, lit windows, a garland along the eaves.
export const RIGHT_HOUSE = { box: [1250, 190, 760, 410], draw: g => {
  for (const [x0, w, ridge, wall, roof] of [[1250, 230, 228, '#c9a08a', '#7b5a4b'], [1470, 250, 200, '#d8b18c', '#6f5244'], [1710, 300, 236, '#c7a491', '#7b5a4b']]) {
    const eave = ridge + w * .36, mid = x0 + w / 2;
    rect(g, x0 + 6, eave - 4, w - 12, 600 - eave + 4, wall);
    for (const x of [x0 + 6, x0 + w - 22]) rect(g, x, eave, 16, 600 - eave, '#5f4134', { opacity: .85 });
    P(g, `M${x0 - 10} ${f(eave + 6)}L${f(mid)} ${ridge}L${x0 + w + 10} ${f(eave + 6)}Z`, roof);
    snowLine(g, x0 - 12, eave + 4, mid, ridge, 14, x0); snowLine(g, mid, ridge, x0 + w + 12, eave + 4, 14, x0 + 3);
    for (const dx of [.22, .58]) { rect(g, x0 + w * dx, eave + 40, w * .2, w * .22, C.lit); rect(g, x0 + w * dx + w * .1 - 2, eave + 40, 4, w * .22, '#5f4134'); }
    P(g, `M${x0} ${f(eave + 18)}Q${f(mid)} ${f(eave + 34)} ${x0 + w} ${f(eave + 18)}`, 'none', { stroke: C.green, 'stroke-width': 7, 'stroke-linecap': 'round' });
  }
}, glow: g => { const fill = glowFill(g, '#ffd98a', .4); for (const x of [1365, 1595, 1860]) shape('ellipse', { cx: x, cy: 330, rx: 90, ry: 60, fill }, g); } };
function counter(g, x, y, w, h) { rect(g, x, y, w, h, C.woodLight); for (let k = x + 14; k < x + w; k += 26) rect(g, k, y, 3, h, C.woodDark, { opacity: .6 }); rect(g, x, y, w, 6, C.woodDark); snowLine(g, x - 2, y + 1, x + w + 2, y + 1, 6, x); }
function scallops(g, x, y, w, depth, n, colours) { const step = w / n; for (let k = 0; k < n; k++) { const a = x + k * step; P(g, `M${f(a)} ${f(y)}H${f(a + step)}V${f(y + depth * .4)}Q${f(a + step / 2)} ${f(y + depth * 1.2)} ${f(a)} ${f(y + depth * .4)}Z`, colours[k % colours.length]); } }
function stripes(g, x, y, w, h, n, colours, slope = 0) { const step = w / n; for (let k = 0; k < n; k++) { const a = x + k * step; P(g, `M${f(a)} ${f(y + slope * k)}H${f(a + step)}L${f(a + step)} ${f(y + h)}Q${f(a + step / 2)} ${f(y + h + step * .45)} ${f(a)} ${f(y + h)}Z`, colours[k % colours.length]); } }
const wares = (g, x, y, w, rows, kind, seed) => {
  const colours = { ornaments: [C.red, C.gold, '#4f7d68', '#d8e1ea', '#b3584b'], toys: [C.red, '#4f6b7d', C.gold, C.cream, C.green], gifts: [C.red, C.green, C.gold, C.cream, '#c97a5a'], sign: [C.red, C.gold, C.green] }[kind];
  for (let r = 0; r < rows; r++) { rect(g, x, y + r * 30 + 22, w, 4, C.woodDark); let k = 0; for (let px = x + 4; px < x + w - 12; px += 16 + (noise(seed + k) * 8 | 0)) { const c = colours[(k + r + seed) % colours.length]; if (kind === 'ornaments') { shape('circle', { cx: f(px + 6), cy: f(y + r * 30 + 14), r: 6, fill: c }, g); } else rect(g, px, y + r * 30 + 6, 12, 16, c); k++; } }
};
export const STALL_SIGN = { box: [10, 298, 295, 347], draw: g => {
  rect(g, 18, 340, 280, 300, '#b98a62'); rect(g, 30, 400, 250, 90, C.glow); wares(g, 36, 404, 236, 2, 'sign', 2); for (const x of [60, 92, 230, 262]) rect(g, x, 340, 18, 300, C.woodDark);
  rect(g, 10, 316, 295, 18, C.woodDark); scallops(g, 10, 330, 295, 58, 6, [C.red, C.cream]);
  snowLine(g, 6, 318, 309, 316, 18, 4);
} , glow: g => shape('ellipse', { cx: 160, cy: 470, rx: 160, ry: 140, fill: glowFill(g, '#ffd98a', .35) }, g) };
export const STALL_ORNAMENTS = { box: [505, 298, 207, 294], draw: g => {
  P(g, 'M512 330L608 300L706 330Z', C.woodDark); snowLine(g, 506, 332, 608, 300, 14, 2); snowLine(g, 608, 300, 712, 332, 14, 3);
  rect(g, 515, 332, 190, 70, '#e9cfa8'); for (let x = 522; x < 700; x += 22) rect(g, x, 340, 12, 12, [C.red, C.green, C.gold][(x / 22 | 0) % 3], { rx: 6 });
  P(g, 'M512 362Q560 380 608 366Q656 380 708 362', 'none', { stroke: C.green, 'stroke-width': 8, 'stroke-linecap': 'round' });
  for (let k = 0; k < 8; k++) shape('circle', { cx: 520 + k * 25, cy: 372 + Math.sin(k) * 4, r: 3.4, fill: '#fff1c4' }, g);
  rect(g, 515, 445, 190, 90, C.glow); wares(g, 522, 448, 176, 2, 'ornaments', 1);
  stripes(g, 508, 396, 202, 40, 7, [C.red, C.cream]);
  for (const x of [512, 694]) rect(g, x, 396, 12, 196, C.woodDark);
  counter(g, 508, 530, 202, 62);
}, glow: g => shape('ellipse', { cx: 610, cy: 490, rx: 110, ry: 70, fill: glowFill(g, '#ffd98a', .35) }, g) };
export const STALL_TOYS = { box: [716, 392, 152, 158], draw: g => {
  rect(g, 722, 410, 142, 10, C.woodDark); snowLine(g, 716, 410, 868, 408, 12, 6);
  rect(g, 724, 450, 138, 56, C.glow); wares(g, 728, 452, 130, 1, 'toys', 3); shape('circle', { cx: 810, cy: 488, r: 10, fill: C.red }, g); star(g, 760, 486, 8);
  scallops(g, 720, 420, 146, 32, 6, [C.red, C.cream]);
  for (const x of [722, 852]) rect(g, x, 420, 9, 130, C.woodDark);
  counter(g, 720, 502, 146, 48);
}, glow: g => shape('ellipse', { cx: 792, cy: 476, rx: 80, ry: 46, fill: glowFill(g, '#ffd98a', .32) }, g) };
export const STALL_GIFTS = { box: [1256, 382, 224, 322], draw: g => {
  rect(g, 1262, 404, 214, 14, C.woodDark); snowLine(g, 1256, 404, 1480, 400, 18, 8);
  rect(g, 1266, 480, 210, 100, C.glow);
  ribbonBox(g, 1326, 520, 44, 40, C.green, C.gold, { snow: false }); ribbonBox(g, 1380, 506, 50, 54, C.red, C.gold, { snow: false }); shape('circle', { cx: 1300, cy: 540, r: 14, fill: C.red }, g); shape('circle', { cx: 1450, cy: 536, r: 12, fill: C.gold }, g);
  scallops(g, 1258, 418, 222, 70, 4, [C.red, C.cream]);
  rect(g, 1262, 418, 12, 286, C.woodDark);
  counter(g, 1258, 578, 222, 126);
}, glow: g => shape('ellipse', { cx: 1370, cy: 530, rx: 120, ry: 80, fill: glowFill(g, '#ffd98a', .35) }, g) };

// The stalls behind the machine as little wooden booths standing slanted to the lane: a front (drawn square on,
// in centimetres), an end wall and an awning, each its own board; the scene stands them up.
// Along a roof's edge from `a` to `b`: a board `wide` across, its top on the line; a cap of snow `deep` on it, even but for
// a gentle swell, rounding over at `b`'s end and hanging a few short drips.
function fascia(g, [ax, ay], [bx, by], wide) { P(g, `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}L${f(bx)} ${f(by + wide)}L${f(ax)} ${f(ay + wide)}Z`, C.woodDark); }
function cap(g, [ax, ay], [bx, by], deep, seed = 1) {
  const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / 22)), top = [], low = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, swell = .8 + .2 * Math.sin(t * 5 + seed); top.push([x, y - deep * swell]); low.push([x, y + (i % 4 === 2 && i < n ? deep * .45 : deep * .12)]); }
  const dx = Math.sign(bx - ax) || 1;
  P(g, `${smooth([...top, [bx + dx * deep * .55, by - deep * .3], [bx + dx * deep * .45, by + deep * .35], ...low.reverse()])}Z`, C.snow);
}
const BOOTH = {
  ornaments: { roof: 'gable', paint: '#e9d2ac', sign: C.green, awning: [C.red, C.cream], wares: 'ornaments', seed: 1 },
  toys: { roof: 'flat', paint: '#cfe0d6', sign: C.red, awning: ['#4f7d68', C.cream], wares: 'toys', seed: 3 },
  sign: { roof: 'flat', paint: '#ead6b8', sign: C.gold, awning: [C.red, C.cream], wares: 'sign', seed: 2 },
  cocoa: { roof: 'gable', paint: '#f0dcc0', sign: C.red, awning: ['#8a5a3c', C.cream], wares: 'cocoa', seed: 5 },
  gifts: { roof: 'flat', paint: '#e4cfb2', sign: C.green, awning: [C.green, C.cream], wares: 'sign', seed: 4 },
};
export const HINGE = .64; // how high the awning hangs, as a share of the front's height
export function boothFront(kind, w, h) {
  const b = BOOTH[kind], top = b.roof === 'gable' ? h * .2 : h * .1, hinge = h * (1 - HINGE), counterTop = h * .72;
  return { box: [0, 0, w, h], draw: g => {
    // the back wall lit warm, shelves of wares; posts either side; the counter of planks with snow along it
    rect(g, 8, hinge, w - 16, counterTop - hinge + 4, C.glow); rect(g, 8, hinge, w - 16, 10, C.glowDeep, { opacity: .7 });
    for (let r = 0; r < 2; r++) { const y = hinge + 28 + r * (counterTop - hinge - 30) / 2; rect(g, 14, y + 24, w - 28, 4, C.woodDark); let k = 0;
      for (let x = 20; x < w - 30; x += (b.wares === 'toys' ? 32 : 22) + (noise(b.seed * 7 + k) * 10 | 0)) { const c = [C.red, C.gold, C.green, C.cream, '#4f6b7d'][(k + r + b.seed) % 5];
        if (b.wares === 'ornaments') { P(g, `M${f(x + 8)} ${f(y)}V${f(y + 8)}`, 'none', { stroke: C.woodDark, 'stroke-width': 1.5 }); shape('circle', { cx: f(x + 8), cy: f(y + 15), r: 8, fill: c }, g); }
        else if (b.wares === 'toys') { rect(g, x, y + 4, 16, 20, c, { rx: 2 }); shape('circle', { cx: f(x + 8), cy: f(y + 2), r: 5, fill: C.cream }, g); }
        else if (b.wares === 'cocoa') { rect(g, x + 2, y + 6, 14, 17, [C.cream, C.red, C.green][k % 3], { rx: 3 }); P(g, `M${f(x + 16)} ${f(y + 10)}q7 2 0 9`, 'none', { stroke: [C.cream, C.red, C.green][k % 3], 'stroke-width': 3 }); }
        else ribbonBox(g, x, y + 6, 18, 18, c, c === C.gold ? C.red : C.gold, { lid: false, snow: false }); k++; } }
    rect(g, 0, top, w, hinge - top, b.paint); for (let x = 18; x < w; x += 30) rect(g, x, top, 2, hinge - top, C.woodDark, { opacity: .18 });
    // its name board: a painted panel with a garland and little bulbs under it
    const sw = Math.min(w * .5, 150), sx = (w - sw) / 2, sy = top + (hinge - top) * .18, sh = (hinge - top) * .5;
    rect(g, sx, sy, sw, sh, b.sign, { rx: 6 }); rect(g, sx + 6, sy + 6, sw - 12, sh - 12, 'none', { stroke: C.gold, 'stroke-width': 3, rx: 4 }); star(g, w / 2, sy + sh / 2, sh * .26, C.gold);
    P(g, `M4 ${f(hinge - 10)}Q${f(w / 4)} ${f(hinge + 4)} ${f(w / 2)} ${f(hinge - 8)}Q${f(w * .75)} ${f(hinge + 4)} ${f(w - 4)} ${f(hinge - 10)}`, 'none', { stroke: C.green, 'stroke-width': 9, 'stroke-linecap': 'round' });
    for (let k = 0; k < 9; k++) shape('circle', { cx: f(12 + k * (w - 24) / 8), cy: f(hinge - 4 + Math.sin(k * 1.3) * 3), r: 3.6, fill: '#fff1c4' }, g);
    if (b.roof === 'gable') {
      // the gable: its face, a fascia of even width along either slope running a little past the walls, a cap of snow
      // laid evenly along it that rounds over at the eaves; a wreath under the ridge
      const apex = [w / 2, 12], eaves = [[-12, top + 10], [w + 12, top + 10]];
      P(g, `M0 ${f(top + 4)}L${f(w / 2)} ${f(apex[1] + 12)}L${w} ${f(top + 4)}Z`, b.paint);
      for (const [ex, ey] of eaves) { fascia(g, apex, [ex, ey], 12); cap(g, apex, [ex, ey], 13, b.seed + ex); }
      shape('circle', { cx: f(w / 2), cy: f(top * .62), r: top * .2, fill: 'none', stroke: C.green, 'stroke-width': 8 }, g); bow(g, w / 2, top * .62 + top * .2, .5);
    } else { rect(g, -6, top - 12, w + 12, 16, C.woodDark); cap(g, [-8, top - 12], [w + 8, top - 12], 16, b.seed); }
    for (const x of [0, w - 12]) rect(g, x, top, 12, h - top, C.woodDark);
    rect(g, 4, counterTop, w - 8, h - counterTop, C.woodLight); for (let x = 22; x < w - 8; x += 26) rect(g, x, counterTop, 3, h - counterTop, C.woodDark, { opacity: .55 }); rect(g, 4, counterTop, w - 8, 7, C.woodDark);
    snowLine(g, 0, counterTop + 2, w, counterTop + 2, 9, b.seed + 5);
    P(g, `M0 ${h}Q${f(w * .2)} ${f(h - 20)} ${f(w * .4)} ${h - 8}Q${f(w * .7)} ${f(h - 24)} ${w} ${h}Z`, C.snow);
  }, glow: g => shape('ellipse', { cx: w / 2, cy: (hinge + counterTop) / 2, rx: w * .55, ry: (counterTop - hinge) * .9, fill: glowFill(g, '#ffd98a', .38) }, g) };
}
export function boothSide(kind, d, h) {
  const b = BOOTH[kind];
  return { box: [0, 0, d, h], draw: g => {
    rect(g, 0, 12, d, h - 12, C.wood); for (let x = 16; x < d; x += 24) rect(g, x, 12, 3, h - 12, C.woodDark, { opacity: .45 });
    rect(g, 0, 12, d, 10, C.woodDark); rect(g, 0, h * .55, d, 6, C.woodDark, { opacity: .6 });
    for (const x of [0, d - 12]) rect(g, x, 12, 12, h - 12, C.woodDark);
    snowLine(g, -6, 16, d + 6, 14, 20, b.seed + 8);
    P(g, `M0 ${h}Q${f(d * .3)} ${f(h - 26)} ${f(d * .6)} ${h - 10}Q${f(d * .85)} ${f(h - 18)} ${d} ${h}Z`, C.snow);
  } };
}
export function boothAwning(kind, w, d) {
  const b = BOOTH[kind], n = Math.max(5, Math.round(w / 34)), step = w / n;
  return { box: [0, 0, w, d], draw: g => {
    // the scalloped edge outermost (at the top of the drawing), the stripes running back to the front
    for (let k = 0; k < n; k++) { const a = k * step; P(g, `M${f(a)} ${d}V${f(d * .25)}Q${f(a + step / 2)} ${f(-d * .02)} ${f(a + step)} ${f(d * .25)}V${d}Z`, b.awning[k % 2]); }
    rect(g, 0, d - 8, w, 8, C.woodDark, { opacity: .5 });
  } };
}

// The lamp: its lantern on top lit warm under a cap of snow, a red bow tied round the post with snow on it.
export const LAMP = { box: [158, 338, 100, 430], draw: g => {
  rect(g, 200, 470, 17, 298, '#4c403b'); P(g, 'M190 768H228L222 740H196Z', '#4c403b');
  P(g, 'M186 472H232L226 484H192Z', '#4c403b'); P(g, 'M180 388H236L244 472H172Z', '#4c403b');
  P(g, 'M186 394H230L236 466H180Z', C.lit); P(g, 'M196 400H220L224 460H192Z', '#fff4cf'); P(g, 'M207 394V466M182 430H234', 'none', { stroke: '#4c403b', 'stroke-width': 3 });
  P(g, 'M170 390L208 350L246 390Z', '#4c403b'); snowLine(g, 168, 386, 248, 386, 10, 2); shape('circle', { cx: 208, cy: 346, r: 7, fill: '#4c403b' }, g);
  bow(g, 208, 506, 1.25); snowLine(g, 174, 492, 242, 492, 6, 3);
}, glow: g => shape('circle', { cx: 208, cy: 430, r: 80, fill: glowFill(g, '#ffd98a', .65) }, g) };
// The presents at the machine's foot: a red one with a gold ribbon behind, a cream one with a red ribbon in front.
export const GIFTS_LEFT = { box: [142, 650, 162, 152], draw: g => { ribbonBox(g, 196, 670, 104, 110, C.green, C.gold); ribbonBox(g, 146, 712, 100, 86, '#f2e3c6', C.red); } };
export const GIFTS_HOUSE_LEFT = { box: [936, 586, 82, 62], draw: g => { ribbonBox(g, 940, 604, 46, 42, '#f2e3c6', C.red); ribbonBox(g, 980, 614, 34, 32, C.green, C.gold); } };
export const GIFTS_HOUSE_RIGHT = { box: [1210, 610, 90, 84], draw: g => { ribbonBox(g, 1214, 630, 58, 62, C.gold, C.cream); ribbonBox(g, 1264, 650, 32, 42, C.green, C.red); } };
// A wooden crate at the corner, deep snow heaped on it.
export const CRATE = { box: [14, 668, 146, 166], draw: g => {
  rect(g, 18, 690, 138, 144, '#9a6b4c'); for (let y = 712; y < 834; y += 30) rect(g, 18, y, 138, 4, '#7b5440'); rect(g, 18, 690, 10, 144, '#7b5440'); rect(g, 146, 690, 10, 144, '#7b5440');
  snowLine(g, 14, 696, 160, 692, 26, 5);
} };
// The fir at the left, heavy with snow: tiers of dark olive branches under deep round pads of snow.
export const FIR = { box: [14, 382, 156, 340], draw: g => {
  const tiers = [[392, 470, 52], [440, 540, 66], [500, 620, 76], [580, 710, 80]];
  for (const [k, [top, bottom, half]] of tiers.entries()) { P(g, `M92 ${top}L${92 + half} ${bottom}Q92 ${bottom + 14} ${92 - half} ${bottom}Z`, k % 2 ? '#6c7656' : '#5e6a4d');
    for (const dx of [-half * .7, -half * .2, half * .3, half * .75]) shape('ellipse', { cx: f(92 + dx), cy: f(bottom - 8 - Math.abs(dx) * .12), rx: f(half * .32), ry: f(half * .16), fill: C.snow }, g);
    shape('ellipse', { cx: 92, cy: f(top + 24), rx: f(half * .4), ry: f(half * .2), fill: C.snow }, g); }
} };
// The chalkboard on its easel: a dark board in a wooden frame on legs, a red bow on top with snow, little gold stars;
// its words are written on by the page.
export const EASEL = { box: [526, 570, 173, 184], words: [552, 616, 674, 712], draw: g => {
  P(g, 'M548 752L572 600H584L562 752ZM676 752L652 600H640L664 752Z', '#946b58'); rect(g, 550, 722, 126, 12, '#946b58');
  rect(g, 538, 586, 150, 140, '#946b58', { rx: 6 }); rect(g, 547, 595, 132, 122, '#38423e', { rx: 3 });
  snowLine(g, 536, 590, 690, 590, 8, 6); bow(g, 612, 584, 1.05);
  for (const [x, y] of [[558, 607], [668, 610], [664, 706], [560, 704]]) star(g, x, y, 5);
  snowLine(g, 546, 726, 680, 726, 6, 7);
} };
// The little lit tree at the end of the lane; snowy bushes beside it.
export const SMALL_TREE = { box: [846, 383, 54, 141], draw: g => { pine(g, 873, 520, 134, '#4f6f5a'); star(g, 873, 388, 6); for (let k = 0; k < 14; k++) shape('circle', { cx: f(873 + (noise(k * 3) - .5) * (10 + k * 3.2)), cy: f(400 + k * 8.5), r: 2.4, fill: '#ffe4a3' }, g); }, glow: g => { const fill = glowFill(g, '#ffd98a', .5); for (let k = 0; k < 14; k++) shape('circle', { cx: f(873 + (noise(k * 3) - .5) * (10 + k * 3.2)), cy: f(400 + k * 8.5), r: 12, fill }, g); } };
export const BUSHES = { box: [900, 462, 92, 80], draw: g => { for (const [x, y, r] of [[922, 520, 22], [952, 506, 28], [978, 522, 20]]) { shape('circle', { cx: x, cy: y, r, fill: '#5d7a62' }, g); shape('ellipse', { cx: x, cy: y - r * .45, rx: r * .9, ry: r * .45, fill: C.snow }, g); } } };
// The string of star lights from behind the sign across the sky: a cord with snow along it, paper stars hung from it.
// (running on past the picture's right edge, beyond what the widest screen shows)
const STAR_POINTS = [[535, 195], [628, 185], [720, 165], [800, 148], [903, 172], [988, 185], [1072, 188], [1163, 188], [1248, 178], [1343, 160], [1440, 178], [1535, 190], [1630, 176], [1725, 186], [1820, 170], [1915, 182]];
const cordAt = x => { let best = STAR_POINTS[0]; for (const p of STAR_POINTS) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p; const i = STAR_POINTS.indexOf(best), next = STAR_POINTS[Math.min(STAR_POINTS.length - 1, i + (x > best[0] ? 1 : 0))], prev = STAR_POINTS[Math.max(0, i - (x > best[0] ? 0 : 1))]; const t = next[0] === prev[0] ? 0 : (x - prev[0]) / (next[0] - prev[0]); return prev[1] + (next[1] - prev[1]) * t - 30; };
export const STARS = { box: [362, 128, 1608, 90], draw: g => {
  // (from under the title's sign, whose right edge is at x 372, SIGN in market-layout.js)
  const cord = []; for (let x = 364; x <= 1965; x += 12) cord.push([x, cordAt(Math.max(535, x)) + (x < 535 ? (535 - x) * .1 : 0)]);
  P(g, smooth(cord), 'none', { stroke: '#4a4048', 'stroke-width': 3 });
  for (let k = 1; k < cord.length; k += 3) shape('ellipse', { cx: f(cord[k][0]), cy: f(cord[k][1] - 3), rx: 9, ry: 4, fill: C.snow }, g);
  for (const [x, y] of STAR_POINTS) { P(g, `M${x} ${cordAt(x)}V${y - 14}`, 'none', { stroke: '#4a4048', 'stroke-width': 2 }); star(g, x, y, 17, '#f8d673', { stroke: '#e2ae45', 'stroke-width': 2 }); }
}, glow: g => { const fill = glowFill(g, '#ffe39a', .6); for (const [x, y] of STAR_POINTS) shape('circle', { cx: x, cy: y, r: 34, fill }, g); } };
// The string of bulbs across the lane (hung in three dimensions by the scene): a bulb, and a pine-green pennant with a
// little cream tree on it, both in centimetres, hung from their top.
export const BULB = { box: [-5, 0, 10, 14], draw: g => { rect(g, -2, 0, 4, 3, '#6b5a50'); shape('ellipse', { cx: 0, cy: 8, rx: 4.2, ry: 5.6, fill: '#ffe4a3' }, g); }, glow: g => shape('circle', { cx: 0, cy: 8, r: 5, fill: glowFill(g, '#ffd98a', .7) }, g) };
export const PENNANT = { box: [-27, 0, 54, 86], draw: g => {
  P(g, 'M-25 2H25V84L0 68L-25 84Z', C.green); rect(g, -25, 0, 50, 6, '#e8d9a8');
  P(g, 'M0 16L13 52H-13Z', '#e8d9a8'); rect(g, -3, 52, 6, 7, '#e8d9a8');
} };
// Snow banked on the cobbles, seen from the front.
export const bank = ([x0, y0, w, h]) => ({ box: [x0, y0, w, h], draw: g => { P(g, `M${x0} ${y0 + h}C${x0 + w * .08} ${y0 + h * .3} ${x0 + w * .3} ${y0} ${x0 + w * .5} ${y0 + h * .1}S${x0 + w * .9} ${y0 + h * .4} ${x0 + w} ${y0 + h}Z`, C.snow); P(g, `M${x0 + w * .55} ${y0 + h}C${x0 + w * .7} ${y0 + h * .7} ${x0 + w * .85} ${y0 + h * .55} ${x0 + w} ${y0 + h}Z`, C.snowShade); } });
// The cobbles, from above: a tile of oblong pavers in rows, warm pinkish greys; it repeats either way.
const STONES = ['#cfae9f', '#c9a698', '#d4b3a4', '#c5a294', '#d1ad9c', '#cba899'];
export const COBBLES = { box: [0, 0, 400, 400], under: g => rect(g, 0, 0, 400, 400, '#b8968a'), draw: g => {
  for (let row = 0; row < 8; row++) { let x = row % 2 ? -36 : 0; const y = row * 50; let k = 0;
    while (x < 400) { const w = 64 + noise(row * 13 + k) * 30; for (const dx of [0, -400, 400]) rect(g, x + dx + 3, y + 3, w - 6, 44, STONES[(row * 3 + k) % STONES.length], { rx: 6 }); x += w; k++; } }
} };
// Snow lying on the cobbles, from above.
export const PATCH = { box: [0, 0, 300, 180], draw: g => {
  for (const [cx, cy, rx, ry, k] of [[120, 90, 100, 48, 1], [230, 120, 50, 28, 2], [52, 136, 32, 18, 3]]) {
    const edge = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, wob = .8 + noise(k * 7 + i * 1.3) * .28; edge.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]); }
    P(g, `${path(edge)}Z`, C.snow);
  }
} };
// The title's wooden sign (in the page, under the title's letters): planks in a darker frame, snow along its top,
// holly and berries at its lower left.
// The title's sign: a cream board in a wooden frame (its letters, coloured, go on it), snow along its top, holly at its
// foot; 500 by 220, drawn a little past that (SIGN_VIEW takes all of it in).
export const SIGN_VIEW = [-40, -24, 580, 290];
export function signBoard(g) {
  P(g, 'M14 6H486Q500 6 500 20V200Q500 214 486 214H14Q0 214 0 200V20Q0 6 14 6Z', '#6f4e3a');
  P(g, 'M14 20H486V200H14Z', '#f6ead2'); P(g, 'M26 32H474V188H26Z', 'none', { stroke: '#d9b36a', 'stroke-width': 3 });
  snowLine(g, -4, 10, 504, 8, 20, 4); holly(g, 30, 202, 1.5); holly(g, 68, 212, 1.1);
}
