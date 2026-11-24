// The Christmas Market at night (docs/VENDING-MARKET.md): a street of market shops under a wooden arcade, cut from paper
// like the other pages. A great arch of timber reaches in from both sides and over the top, garlanded, two banners hung
// from it; under it the street runs away from you, its cobbles growing smaller, shops lit along both sides, arch after
// arch of timber over it with a string of bulbs under each, and at its far end a lit tree. On the left the nearest shop,
// its striped awning over a window full of presents and a lantern on a bracket. All of it is drawn in one perspective
// (one vanishing point, VP) on a 1440 × 800 frame, so the layers line up however the frame is cropped. In front, a
// barrel with a lantern, a little easel (a sign of the colouring to come), a rope railing and a snowy bush in the
// corners. Each piece that moves (the bulbs, the windows' light, the lantern, the banners, the snow) is a layer of its
// own, moved by css/vending.css only without reduced motion.
import { holly, paperLayer, shape } from './paper-art.js';
import { snowyFir, star } from './paper-props.js';

const FRAME = '0 0 1440 800', WOODEN = { paper: { scale: .9, grain: .45, shadow: .26, rim: '#e9d8bc' }, eager: true, preserveAspectRatio: 'xMidYMid slice' };
const DUSK = { paper: { scale: .9, grain: .4, shadow: .18, rim: '#b9a58f' }, eager: true, preserveAspectRatio: 'xMidYMid slice' }, LIGHT = { paper: null, eager: true, preserveAspectRatio: 'xMidYMid slice' };
const PROP = { paper: { scale: .5, grain: .45, shadow: .28 }, eager: true };
const SNOW = '#fbf6ec', WOOD = '#8a5a3c', DARK = '#5e3d2c', DEEP = '#3f2a20', LIT = '#f6cd78', PINE = '#3f6653', RED = '#b5443c', GOLD = '#e0b04f', CREAM = '#fbf3df';
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent.append(node); return node; };
const piece = (host, className, draw, options = WOODEN, viewBox = FRAME) => paperLayer(element('div', `market-piece ${className}`, host), viewBox, '', draw, options);
const noise = i => { const value = Math.sin(i * 12.9898) * 43758.5453; return value - Math.floor(value); };
const f = n => n.toFixed(1);
const poly = points => `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;

// The street's perspective: depth t runs from 0 (the bottom of the frame) to 1 (the vanishing point). Its walls meet the
// ground at NEAR (x, off the frame) at t 0; heights are given in near units and shrink with depth.
const VP = [860, 440], NEAR = [-300, 1800];
const groundY = t => 800 - (800 - VP[1]) * t;
const wallX = (side, t) => side < 0 ? NEAR[0] + (VP[0] - NEAR[0]) * t : NEAR[1] - (NEAR[1] - VP[0]) * t;
const onFloor = (u, t) => { const left = wallX(-1, t), right = wallX(1, t); return [left + (right - left) * u, groundY(t)]; };
const onWall = (side, t, h) => [wallX(side, t), groundY(t) - h * (1 - t)];
// A patch of a side wall between depths t0 and t1, heights h0 to h1.
const patch = (side, t0, t1, h0, h1) => poly([onWall(side, t0, h0), onWall(side, t0, h1), onWall(side, t1, h1), onWall(side, t1, h0)]);
// A point at height h above the street floor at (u, t).
const above = (u, t, h) => { const [x, y] = onFloor(u, t); return [x, y - h * (1 - t)]; };

const stars = g => { for (const [x, y, size] of [[560, 120, 5], [700, 196, 4], [930, 150, 6], [1040, 240, 4], [800, 290, 3.5], [640, 300, 3], [1110, 140, 4.5], [480, 220, 3.5]]) star(g, x, y, size, '#f3df9e'); };

// The far end of the street: a row of little chalets in the dusk across it, their roofs dark under a thin line of snow,
// their windows lit, and a lit tree standing before them.
function far(g) {
  const t = .94, [left, base] = onFloor(0, t), [right] = onFloor(1, t), houses = 5, width = (right - left + 90) / houses;
  for (let i = 0; i < houses; i++) {
    const x = left - 45 + i * width, top = base - 42 - (i % 2) * 12, roof = ['#6e4a46', '#4f5a52', '#6a5248', '#56505a', '#6e4a46'][i];
    shape('rect', { x: f(x + 2), y: f(top), width: f(width - 4), height: f(base - top), fill: ['#8a7a70', '#7d7272', '#91806f', '#7a7076', '#867668'][i] }, g);
    shape('path', { d: `M${f(x - 3)} ${f(top + 2)}L${f(x + width / 2)} ${f(top - width * .42)}L${f(x + width + 3)} ${f(top + 2)}Z`, fill: roof }, g);
    shape('path', { d: `M${f(x - 3)} ${f(top + 2)}L${f(x + width / 2)} ${f(top - width * .42)}L${f(x + width + 3)} ${f(top + 2)}L${f(x + width / 2)} ${f(top - width * .42 + 4)}Z`, fill: '#e9e4dc' }, g);
    shape('rect', { x: f(x + width * .32), y: f(base - 26), width: f(width * .36), height: 14, fill: '#f0c477', opacity: .9 }, g);
  }
  const tx = VP[0] - 6;
  snowyFir(g, tx, base + 4, 120, 1, .52);
  for (let i = 0; i < 12; i++) shape('circle', { cx: f(tx + (noise(i) - .5) * 44 * (.4 + i / 14)), cy: f(base - 96 + i * 7.5), r: 2.4, fill: i % 3 ? '#ffe4a3' : '#f2a08f' }, g);
  star(g, tx, base - 122, 9, GOLD);
}
// The cobbled street: rows of stones growing smaller toward the far end, snow banked along both walls and caught in a
// few joints, the warm light of the windows and lanterns lying on it.
function street(g) {
  shape('path', { d: `M0 ${VP[1]}H1440V800H0Z`, fill: '#5f544f' }, g);
  const rows = [];
  for (let k = 0; k < 19; k++) rows.push(1 - .84 ** k);
  const tones = ['#9a8b80', '#8c7e75', '#a69689', '#93857b'];
  for (let k = 0; k < rows.length - 1; k++) {
    const [t0, t1] = [rows[k], rows[k + 1]], gap = (t1 - t0) * .1, shift = k % 2 ? .5 : 0, across = 15;
    for (let i = -1; i < across; i++) {
      const u0 = Math.max(0, (i + shift) / across + .004), u1 = Math.min(1, (i + 1 + shift) / across - .004);
      if (u1 <= u0) continue;
      const points = [onFloor(u0, t0 + gap), onFloor(u1, t0 + gap), onFloor(u1, t1 - gap), onFloor(u0, t1 - gap)];
      shape('path', { d: poly(points), fill: tones[(i * 7 + k * 3 + 40) % 4], stroke: tones[(i * 7 + k * 3 + 40) % 4], 'stroke-width': f(Math.max(.6, 7 * (1 - t0))), 'stroke-linejoin': 'round' }, g);
      if (noise(i * 31 + k * 7) > .86) { const [x, y] = onFloor(u1, t1 - gap); shape('ellipse', { cx: f(x), cy: f(y), rx: f(10 * (1 - t0)), ry: f(3.4 * (1 - t0)), fill: SNOW, opacity: .9 }, g); }
    }
  }
  // Snow banked along both walls, its inner edge wavering.
  for (const side of [-1, 1]) {
    const inner = [], outer = [];
    for (let t = 0; t <= .93; t += .02) { const reach = .045 + noise(t * 90 + side) * .03; inner.push(onFloor(side < 0 ? reach : 1 - reach, t)); outer.push(onFloor(side < 0 ? -.02 : 1.02, t)); }
    shape('path', { d: poly([...outer, ...inner.reverse()]), fill: '#efe9df' }, g);
  }
  for (const [u, t, w, opacity] of [[.24, .2, 260, .2], [.5, .62, 140, .16], [.7, .34, 220, .14], [.5, .9, 60, .2]]) { const [x, y] = onFloor(u, t); shape('ellipse', { cx: f(x), cy: f(y), rx: f(w), ry: f(w * .22), fill: '#ffcf80', opacity }, g); }
}
// The shops along one side of the street, receding: each its own front of plaster or boards, its ground floor open on a
// lit counter under a striped awning, upper windows lit, snow along its roof, and a sign hung out over the street.
const SHOPS = {
  [-1]: [[.5, .66, '#d9c3a2', [RED, CREAM]], [.66, .78, '#b98a5a', [PINE, CREAM]], [.78, .87, '#d2b48e', [RED, CREAM]], [.87, .935, '#a8774d', [GOLD, CREAM]]],
  [1]: [[.42, .6, '#cfb48e', [PINE, CREAM]], [.6, .74, '#d9c3a2', [RED, CREAM]], [.74, .85, '#a8774d', [RED, GOLD]], [.85, .935, '#c9ad88', [PINE, CREAM]]],
};
const shops = side => g => {
  for (const [i, [t0, t1, wall, awning]] of SHOPS[side].entries()) {
    const tall = 880 - (i % 2) * 90, span = t1 - t0;
    shape('path', { d: patch(side, t0, t1, 0, tall), fill: wall }, g);
    shape('path', { d: patch(side, t0 + span * .02, t1 - span * .02, tall * .96, tall), fill: SNOW }, g);
    for (let k = 1; k < 4; k++) shape('path', { d: patch(side, t0, t1, tall * (.42 + k * .14), tall * (.42 + k * .14) + 6), fill: DARK, opacity: .3 }, g);
    shape('path', { d: patch(side, t0 + span * .12, t1 - span * .1, 60, 330), fill: LIT }, g);
    shape('path', { d: patch(side, t0 + span * .12, t1 - span * .1, 250, 330), fill: '#e3a552', opacity: .55 }, g);
    shape('path', { d: patch(side, t0 + span * .1, t1 - span * .08, 50, 76), fill: WOOD }, g);
    const stripes = 6;
    for (let s = 0; s < stripes; s++) { const a = t0 + span * (.08 + .86 * s / stripes), b = t0 + span * (.08 + .86 * (s + 1) / stripes); shape('path', { d: patch(side, a, b, 340, 410), fill: awning[s % 2] }, g); }
    for (const at of [.3, .7]) shape('path', { d: patch(side, t0 + span * (at - .1), t0 + span * (at + .1), tall * .62, tall * .8), fill: LIT, opacity: .92 }, g);
    const [sx, sy] = onWall(side, t0 + span * .05, tall * .5), scale = 1 - t0;
    shape('path', { d: `M${f(sx)} ${f(sy)}H${f(sx - side * 70 * scale)}`, stroke: DEEP, 'stroke-width': f(4 * scale) }, g);
    shape('rect', { x: f(side < 0 ? sx + 14 * scale : sx - 70 * scale), y: f(sy + 6 * scale), width: f(56 * scale), height: f(44 * scale), rx: f(6 * scale), fill: [RED, PINE, GOLD, RED][i] }, g);
    star(g, sx - side * 42 * scale, sy + 28 * scale, 10 * scale, i === 2 ? RED : GOLD);
  }
};
// The arches of timber over the street, one behind another, each a pair of posts and a curved beam with a garland; the
// nearest has two red banners, the farthest a wreath at its crown.
const ARCHES = [.42, .62, .79, .9];
function archAt(g, t, { banners = false, wreath = false } = {}) {
  const scale = 1 - t, post = 40 * scale, rise = 560, crown = 870, [lx] = onFloor(.015, t), [rx] = onFloor(.985, t), base = groundY(t);
  const top = base - rise * scale, peak = base - crown * scale, beam = 36 * scale;
  for (const x of [lx, rx - post]) { shape('rect', { x: f(x), y: f(top), width: f(post), height: f(base - top), fill: WOOD }, g); shape('rect', { x: f(x + post * .62), y: f(top), width: f(post * .38), height: f(base - top), fill: DARK }, g); }
  const arc = (lift, inset) => `M${f(lx + inset)} ${f(top + lift)}Q${f((lx + rx) / 2)} ${f(peak * 2 - top + lift)} ${f(rx - inset)} ${f(top + lift)}`;
  const mid = (lx + rx) / 2, bow = peak * 2 - top;
  shape('path', { d: `M${f(lx)} ${f(top)}Q${f(mid)} ${f(bow)} ${f(rx)} ${f(top)}L${f(rx - post)} ${f(top + beam)}Q${f(mid)} ${f(bow + beam)} ${f(lx + post)} ${f(top + beam)}Z`, fill: '#a8774d' }, g);
  shape('path', { d: arc(beam * .2, 0), fill: 'none', stroke: '#c99a6a', 'stroke-width': f(beam * .25) }, g);
  shape('path', { d: arc(beam * 1.05, post * .6), fill: 'none', stroke: PINE, 'stroke-width': f(18 * scale), 'stroke-linecap': 'round' }, g);
  for (let i = 1; i < 8; i++) { const s = i / 8, x = (1 - s) ** 2 * (lx + post * .6) + 2 * s * (1 - s) * ((lx + rx) / 2) + s * s * (rx - post * .6), y = (1 - s) ** 2 * (top + beam * 1.05) + 2 * s * (1 - s) * (peak * 2 - top + beam * 1.05) + s * s * (top + beam * 1.05); shape('circle', { cx: f(x), cy: f(y + 4 * scale), r: f(5 * scale), fill: '#c63a33' }, g); }
  if (banners) for (const x of [lx + post * .5, rx - post * .5]) {
    const y = top + beam * 1.6, w = 64 * scale, h = 150 * scale;
    shape('path', { d: `M${f(x - w / 2)} ${f(y)}H${f(x + w / 2)}V${f(y + h)}L${f(x)} ${f(y + h - 26 * scale)}L${f(x - w / 2)} ${f(y + h)}Z`, fill: RED }, g);
    shape('path', { d: `M${f(x)} ${f(y + 30 * scale)}L${f(x + 18 * scale)} ${f(y + 74 * scale)}H${f(x - 18 * scale)}Z`, fill: CREAM }, g);
  }
  if (wreath) { const cx = (lx + rx) / 2, cy = peak * 2 - top + beam * 2.2, r = 34 * scale; shape('circle', { cx: f(cx), cy: f(cy), r: f(r), fill: 'none', stroke: PINE, 'stroke-width': f(13 * scale) }, g); for (let i = 0; i < 6; i++) shape('circle', { cx: f(cx + Math.cos(i) * r), cy: f(cy + Math.sin(i) * r), r: f(4 * scale), fill: '#c63a33' }, g); shape('path', { d: `M${f(cx - 12 * scale)} ${f(cy - r - 8 * scale)}L${f(cx)} ${f(cy - r + 2 * scale)}L${f(cx + 12 * scale)} ${f(cy - r - 8 * scale)}`, fill: 'none', stroke: RED, 'stroke-width': f(7 * scale), 'stroke-linecap': 'round' }, g); }
}
const arches = (list, options) => g => { for (const t of list) archAt(g, t, options(t)); };
// The strings of bulbs, one hung under each arch's beam; two layers, lit in turn.
function strings() {
  return ARCHES.map(t => {
    const scale = 1 - t, [lx] = onFloor(.05, t), [rx] = onFloor(.95, t), base = groundY(t), y = base - 520 * scale, dip = 90 * scale, n = 11;
    return Array.from({ length: n + 1 }, (_, i) => { const s = i / n; return [lx + (rx - lx) * s, y + Math.sin(s * Math.PI) * dip, scale]; });
  });
}
function wires(g) { for (const line of strings()) shape('path', { d: `M${line.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`, fill: 'none', stroke: '#2c2a33', 'stroke-width': 1.8 }, g); }
const bulbs = turn => g => strings().forEach(line => line.forEach(([x, y, scale], i) => {
  if (i % 2 !== turn || i === 0 || i === line.length - 1) return;
  shape('circle', { cx: f(x), cy: f(y + 9 * scale), r: f(14 * scale), fill: '#ffd98a', opacity: .24 }, g);
  shape('ellipse', { cx: f(x), cy: f(y + 8 * scale), rx: f(4.6 * scale + .8), ry: f(6.4 * scale + 1), fill: i % 5 === 2 ? '#f2a08f' : '#ffe4a3' }, g);
}));
// The nearest shop, on the left, facing you: plaster and timbers, a striped awning under snow over a window of presents,
// a planter of holly below it, a lantern on an iron bracket.
function shopfront(g) {
  shape('path', { d: 'M-20 150H330V720H-20Z', fill: '#e6d3b4' }, g);
  for (const x of [-20, 110, 240, 312]) shape('rect', { x, y: 150, width: 18, height: 190, fill: DARK }, g);
  shape('path', { d: 'M-20 150H330M-20 246H330', stroke: DARK, 'stroke-width': 14 }, g);
  shape('path', { d: 'M128 164L240 238M240 164L128 238', stroke: DARK, 'stroke-width': 10 }, g);
  shape('rect', { x: 20, y: 178, width: 72, height: 52, fill: LIT }, g); shape('path', { d: 'M56 178V230M20 204H92', stroke: DARK, 'stroke-width': 5 }, g);
  shape('path', { d: 'M-30 336H344L330 352H-16Z', fill: WOOD }, g);
  const stripes = 8, w = 360 / stripes;
  for (let i = 0; i < stripes; i++) { const x = -20 + i * w; shape('path', { d: `M${f(x)} 346H${f(x + w)}V404Q${f(x + w / 2)} 422 ${f(x)} 404Z`, fill: i % 2 ? CREAM : RED }, g); }
  shape('path', { d: 'M-24 348C30 330 70 340 120 332S220 324 260 334 320 330 346 342L342 352C300 344 250 350 200 342S100 350 40 346 0 352-24 356Z', fill: SNOW }, g);
  shape('rect', { x: 10, y: 428, width: 300, height: 220, fill: '#5e3d2c' }, g);
  shape('rect', { x: 20, y: 438, width: 280, height: 200, fill: LIT }, g);
  shape('rect', { x: 20, y: 438, width: 280, height: 46, fill: '#e3a552', opacity: .5 }, g);
  shape('path', { d: 'M24 450Q160 476 296 450', fill: 'none', stroke: PINE, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
  for (const x of [60, 120, 180, 240]) shape('circle', { cx: x, cy: 461, r: 4, fill: '#c63a33' }, g);
  shape('rect', { x: 20, y: 548, width: 280, height: 7, fill: WOOD }, g);
  const box = (x, base, w, h, fill, ribbon) => { shape('rect', { x, y: base - h, width: w, height: h, fill }, g); shape('rect', { x: x + w / 2 - 3, y: base - h, width: 6, height: h, fill: ribbon }, g); shape('rect', { x: x - 2, y: base - h - 6, width: w + 4, height: 8, fill }, g); };
  box(40, 548, 50, 40, RED, GOLD); box(104, 548, 36, 54, PINE, CREAM); box(214, 548, 58, 34, GOLD, RED);
  box(56, 630, 64, 50, '#e6d3ad', RED); box(196, 630, 44, 62, RED, CREAM); box(252, 630, 34, 30, PINE, GOLD);
  snowyFir(g, 160, 634, 76, 0, .55);
  shape('path', { d: 'M160 438V638M20 548H300', stroke: '#5e3d2c', 'stroke-width': 6, opacity: .7 }, g);
  shape('rect', { x: 0, y: 652, width: 320, height: 56, fill: '#7a5238' }, g);
  for (let x = 16; x < 320; x += 34) holly(g, x, 652, .34);
  shape('path', { d: 'M-10 656C40 640 90 650 140 642S240 640 330 652V664H-10Z', fill: SNOW }, g);
  shape('path', { d: 'M318 300H384M346 300V318', stroke: '#3c3238', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M366 318H402L396 330H372Z', fill: '#3c3238' }, g); shape('path', { d: 'M372 330H396L400 380H368Z', fill: '#f6d38a' }, g); shape('path', { d: 'M366 380H402L396 390H372Z', fill: '#3c3238' }, g);
  shape('path', { d: 'M384 330V380M370 355H398', stroke: '#3c3238', 'stroke-width': 2.4 }, g);
}
// The windows' light and the near lantern's glow, a layer of their own that breathes.
function windows(g) {
  for (const side of [-1, 1]) for (const [t0, t1] of SHOPS[side].map(shop => shop.slice(0, 2))) { const [x, y] = onWall(side, (t0 + t1) / 2, 200); shape('ellipse', { cx: f(x), cy: f(y), rx: f(90 * (1 - t0)), ry: f(70 * (1 - t0)), fill: '#ffd98a', opacity: .16 }, g); }
  shape('ellipse', { cx: 160, cy: 540, rx: 190, ry: 130, fill: '#ffd98a', opacity: .14 }, g);
  for (const [r, opacity] of [[80, .14], [46, .22]]) shape('circle', { cx: 384, cy: 355, r, fill: '#ffd98a', opacity }, g);
  shape('circle', { cx: VP[0] - 6, cy: VP[1] - 40, r: 70, fill: '#ffd98a', opacity: .12 }, g);
}
// The arcade, nearest of all: timber filling the top corners, a great arch of boards garlanded along its inner edge.
function arcade(g) {
  const cx = 720, cy = 560, outer = [760, 560], inner = [700, 500];
  const ring = ([rx, ry]) => `M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  shape('path', { d: `M-20 -20H1460V${cy}H${cx + outer[0]}A${outer[0]} ${outer[1]} 0 0 0 ${cx - outer[0]} ${cy}H-20Z`, fill: DEEP }, g);
  for (let x = 20; x < 1440; x += 70) { const across = (x - cx) / outer[0], edge = Math.abs(across) < 1 ? cy - outer[1] * Math.sqrt(1 - across * across) : cy; if (edge > -10) shape('path', { d: `M${x} -20V${f(edge)}`, stroke: '#2e1f18', 'stroke-width': 4, opacity: .5 }, g); }
  shape('path', { d: `${ring(outer)}V820H${cx + inner[0]}V${cy}A${inner[0]} ${inner[1]} 0 0 0 ${cx - inner[0]} ${cy}V820H${cx - outer[0]}Z`, fill: WOOD }, g);
  shape('path', { d: ring([outer[0] - 16, outer[1] - 16]), fill: 'none', stroke: '#a8774d', 'stroke-width': 12 }, g);
  for (let i = 1; i < 18; i++) { const a = Math.PI - i / 18 * Math.PI, c = Math.cos(a), sn = Math.sin(a); shape('path', { d: `M${f(cx + c * inner[0])} ${f(cy - sn * inner[1])}L${f(cx + c * outer[0])} ${f(cy - sn * outer[1])}`, stroke: DARK, 'stroke-width': 3, opacity: .55 }, g); }
  shape('path', { d: ring([inner[0] + 4, inner[1] + 4]), fill: 'none', stroke: GOLD, 'stroke-width': 4 }, g);
  shape('path', { d: ring([inner[0] - 8, inner[1] - 10]), fill: 'none', stroke: PINE, 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
  for (let i = 1; i < 22; i++) { const a = Math.PI - i / 22 * Math.PI, x = cx + Math.cos(a) * (inner[0] - 8), y = cy - Math.sin(a) * (inner[1] - 10); if (y > 600) continue; shape('circle', { cx: f(x), cy: f(y + 6), r: 5.2, fill: '#c63a33' }, g); }
  for (const x of [-20, 1420]) shape('rect', { x, y: cy - 40, width: 40, height: 880 - cy, fill: DARK }, g);
}
// The gold star with a red bow hung at the arcade's crown (its own layer: it sways a little, and the phone leaves it out).
function crown(g) {
  shape('path', { d: 'M720 58V96', stroke: '#3c3238', 'stroke-width': 3 }, g);
  shape('path', { d: 'M702 106C684 92 686 114 710 108ZM738 106C756 92 754 114 730 108Z', fill: RED }, g);
  star(g, 720, 130, 30, '#c99a3c'); star(g, 720, 128, 28, GOLD); star(g, 720, 128, 12, CREAM);
}
// The two banners hung inside the arcade (their own layers, they sway a little).
const banner = x => g => {
  shape('path', { d: `M${x} 200V232`, stroke: '#3c3238', 'stroke-width': 3 }, g);
  shape('rect', { x: x - 44, y: 228, width: 88, height: 12, rx: 4, fill: WOOD }, g);
  shape('path', { d: `M${x - 38} 238H${x + 38}V392L${x} 368L${x - 38} 392Z`, fill: RED }, g);
  shape('path', { d: `M${x - 38} 238H${x + 38}V252H${x - 38}Z`, fill: GOLD }, g);
  for (let i = 0; i < 6; i++) { const arm = shape('g', { transform: `translate(${x} 306) rotate(${i * 60})` }, g); shape('path', { d: 'M0 0V-24M0-14L-7-21M0-14L7-21', fill: 'none', stroke: CREAM, 'stroke-width': 4, 'stroke-linecap': 'round' }, arm); }
};
// The cobbles laid flat, for the phone's long street under the machine: rows of rounded stones seen from a little above
// (wide and low, a little larger row by row toward you), snow along both sides.
function cobbles(g) {
  shape('rect', { x: 0, y: 0, width: 400, height: 600, fill: '#5f544f' }, g);
  const tones = ['#9a8b80', '#8c7e75', '#a69689', '#93857b'];
  for (let row = 0, y = 2; y < 600; row++) {
    const h = 18 + row * 1.1, w = 66 + row * 2.2;
    for (let i = -1; i < 400 / w + 1; i++) shape('rect', { x: f(i * w + (row % 2) * w / 2 + 3), y: f(y), width: f(w - 6), height: f(h), rx: f(h * .45), fill: tones[(i * 7 + row * 3 + 40) % 4] }, g);
    y += h + 5;
  }
  for (const side of [0, 1]) { const d = side ? 'M400 0C380 80 392 200 376 320S390 520 380 600H400Z' : 'M0 0C20 80 8 200 24 320S10 520 20 600H0Z'; shape('path', { d, fill: '#efe9df' }, g); }
}
// The things in front: a barrel with a lantern on it; the easel, its sheet showing a tree drawn in, crayons on its ledge
// and a gold star; a rope railing strung with bulbs; a snowy bush.
function barrel(g) {
  shape('path', { d: 'M30 250C20 200 20 120 34 80H166C180 120 180 200 170 250Z', fill: '#8a5a3c' }, g);
  for (const y of [100, 160, 222]) shape('path', { d: `M28 ${y}Q100 ${y + 12} 172 ${y}`, fill: 'none', stroke: '#4b3f45', 'stroke-width': 10 }, g);
  for (const x of [62, 100, 138]) shape('path', { d: `M${x} 84V248`, stroke: DARK, 'stroke-width': 2.5, opacity: .5 }, g);
  shape('ellipse', { cx: 100, cy: 80, rx: 68, ry: 16, fill: '#a8774d' }, g);
  shape('path', { d: 'M30 82C50 66 90 74 110 64S160 70 172 82C150 92 60 94 30 82Z', fill: SNOW }, g);
  shape('path', { d: 'M82 66H118L114 56H86Z', fill: '#3c3238' }, g); shape('path', { d: 'M86 56H114L118 10H82Z', fill: '#f6d38a' }, g); shape('path', { d: 'M80 10H120L110 0H90Z', fill: '#3c3238' }, g); shape('path', { d: 'M100 10V56M84 33H116', stroke: '#3c3238', 'stroke-width': 2 }, g);
  shape('path', { d: 'M10 256C40 240 160 240 190 256Z', fill: SNOW }, g);
}
const barrelGlow = g => { for (const [r, opacity] of [[80, .14], [44, .22]]) shape('circle', { cx: 100, cy: 34, r, fill: '#ffd98a', opacity }, g); };
function easel(g) {
  shape('path', { d: 'M40 196L70 30L100 196M70 30L70 186M48 150H92', fill: 'none', stroke: WOOD, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
  shape('rect', { x: 26, y: 40, width: 88, height: 96, rx: 3, fill: CREAM }, g);
  shape('path', { d: 'M70 54L94 116H46Z', fill: 'none', stroke: '#5b3d2e', 'stroke-width': 3.4, 'stroke-linejoin': 'round' }, g);
  shape('path', { d: 'M70 66L84 102H56Z', fill: '#9db59a' }, g); shape('rect', { x: 64, y: 116, width: 12, height: 10, fill: '#b97c4a' }, g);
  star(g, 100, 46, 10, GOLD);
  for (const [i, fill] of [RED, PINE, GOLD, '#9fbdd2'].entries()) shape('rect', { x: 40 + i * 16, y: 138, width: 10, height: 12, rx: 2, fill }, g);
  shape('rect', { x: 30, y: 148, width: 80, height: 6, rx: 2, fill: DARK }, g);
  shape('path', { d: 'M20 198C50 186 90 186 120 198Z', fill: SNOW }, g);
}
function railing(g) {
  for (const x of [60, 300, 540]) { shape('rect', { x: x - 14, y: 40, width: 28, height: 160, fill: WOOD }, g); shape('rect', { x: x + 4, y: 40, width: 10, height: 160, fill: DARK }, g); shape('path', { d: `M${x - 20} 44C${x - 10} 24 ${x + 10} 24 ${x + 20} 44Z`, fill: SNOW }, g); }
  for (const [a, b] of [[60, 300], [300, 540]]) {
    shape('path', { d: `M${a} 70Q${(a + b) / 2} 120 ${b} 70`, fill: 'none', stroke: '#c9a46a', 'stroke-width': 7 }, g);
    for (let i = 1; i < 6; i++) { const s = i / 6, x = a + (b - a) * s, y = 70 + Math.sin(s * Math.PI) * 25; shape('circle', { cx: f(x), cy: f(y + 12), r: 13, fill: '#ffd98a', opacity: .25 }, g); shape('ellipse', { cx: f(x), cy: f(y + 11), rx: 6, ry: 8, fill: '#ffe4a3' }, g); }
  }
  holly(g, 560, 168, .9);
  shape('path', { d: 'M0 200C80 170 200 176 300 186S480 168 600 182V200Z', fill: SNOW }, g);
}
function bush(g) {
  for (const [x, y, s] of [[90, 150, 1.3], [190, 130, 1.1], [290, 156, .9]]) holly(g, x, y, s);
  shape('rect', { x: 330, y: 50, width: 26, height: 130, fill: WOOD }, g); shape('path', { d: 'M324 54C334 36 352 36 362 54Z', fill: SNOW }, g);
  shape('path', { d: 'M0 180C60 150 160 160 240 166S380 154 460 170V180Z', fill: SNOW }, g);
  shape('path', { d: 'M20 128C60 108 120 116 150 104S240 100 280 118C220 124 120 132 20 128Z', fill: SNOW, opacity: .9 }, g);
}

export function mountScene(back, front) {
  piece(back, 'market-stars', stars, LIGHT);
  piece(back, 'market-far', far, DUSK);
  piece(back, 'market-street', street, { ...DUSK, paper: { scale: .9, grain: .5, shadow: .12, rim: '#8c7e75' } });
  piece(back, 'market-shops is-right', shops(1), DUSK);
  piece(back, 'market-shops is-left', shops(-1), DUSK);
  piece(back, 'market-arches is-far', arches(ARCHES.slice(1), t => ({ wreath: t === ARCHES[2] })), DUSK);
  piece(back, 'market-wires', wires, LIGHT);
  piece(back, 'market-bulbs is-a', bulbs(0), LIGHT);
  piece(back, 'market-bulbs is-b', bulbs(1), LIGHT);
  piece(back, 'market-arches is-near', arches([ARCHES[0]], () => ({ banners: true })), WOODEN);
  piece(back, 'market-windows', windows, LIGHT);
  piece(back, 'market-shopfront', shopfront, WOODEN);
  piece(back, 'market-arcade', arcade, WOODEN);
  piece(back, 'market-crown', crown, WOODEN);
  piece(back, 'market-banner is-left', banner(150), WOODEN);
  piece(back, 'market-banner is-right', banner(1290), WOODEN);
  piece(back, 'market-cobbles', cobbles, { paper: { scale: .4, grain: .5, shadow: .1, rim: '#8c7e75' }, eager: true, preserveAspectRatio: 'xMidYMin slice' }, '0 0 400 600');
  const lamp = element('div', 'market-barrel', front);
  paperLayer(lamp, '0 0 200 260', 'market-barrel-glow', barrelGlow, { paper: null, eager: true });
  paperLayer(lamp, '0 0 200 260', 'market-barrel-art', barrel, PROP);
  piece(front, 'market-easel', easel, PROP, '0 0 140 200');
  piece(front, 'market-rail', railing, PROP, '0 0 600 200');
  piece(front, 'market-bush', bush, PROP, '0 0 460 180');
  element('div', 'market-vignette', front);
  const flakes = element('div', 'market-flakes', front);
  for (let i = 0; i < 7; i++) { const flake = element('i', 'market-flake', flakes); flake.style.left = `${30 + (i * 37 + 11) % 44}%`; flake.style.setProperty('--delay', `${-((i * 1.9) % 12)}s`); flake.style.setProperty('--drift', `${(i % 3 - 1) * 18}px`); }
}
