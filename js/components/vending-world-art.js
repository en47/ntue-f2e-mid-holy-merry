// The Christmas Market's paper boards (components/vending-scene.js stands them up in the square; the sky, the old town and
// the elves are in vending-square-art.js): each drawn flat, as it is, in centimetres, and cut from paper like the rest of
// the site. The square's own perspective comes from where the boards stand, not from the drawings. `under` is drawn
// without the paper's edge (a ground colour, a light).
import { holly, shape } from './paper-art.js';
import { snowyFir, star } from './paper-props.js';

export const SNOW = '#fbf6ec', WOOD = '#a8774d', DARK = '#7a5238', DEEP = '#5b3b29', LIT = '#f6cd78', AMBER = '#eaa951';
export const PINE = '#3f6653', RED = '#b5443c', GOLD = '#e0b04f', CREAM = '#f6ecd6', IRON = '#3c3238';
const f = n => (Math.round(n * 10) / 10).toString();
const noise = i => { const value = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return value - Math.floor(value); };
const poly = points => `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
const rect = (g, x, y, width, height, fill, extra = {}) => shape('rect', { x: f(x), y: f(y), width: f(width), height: f(height), fill, ...extra }, g);
// A row of scallops hanging under a line, every other one in the second colour.
function scallops(g, x0, x1, y, depth, colours, count) {
  const width = (x1 - x0) / count;
  for (let i = 0; i < count; i++) { const a = x0 + i * width; shape('path', { d: `M${f(a)} ${f(y)}H${f(a + width)}V${f(y + depth * .45)}Q${f(a + width / 2)} ${f(y + depth * 1.25)} ${f(a)} ${f(y + depth * .45)}Z`, fill: colours[i % colours.length] }, g); }
}
// A lumpy cap of snow along the top of something from x0 to x1 at y, `deep` thick, hanging over in a drip or two.
function snowCap(g, x0, x1, y, deep, seed = 1) {
  const top = [], low = [], n = Math.max(4, Math.round((x1 - x0) / 30));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; top.push([x, y - deep * (.55 + noise(seed + i * 1.7) * .45)]); low.push([x, y + deep * (.25 + (i % 3 === 1 ? .4 : 0))]); }
  shape('path', { d: poly([[x0 - 6, y], ...top, [x1 + 6, y], ...low.reverse()]), fill: SNOW }, g);
}
// A light's glow: warm at its heart and fading to nothing, with no edge to it (one gradient; each circle filled with it
// fades within itself).
let softs = 0;
export function glowFill(g, colour = '#ffd98a', opacity = .45) {
  const id = `market-soft-${++softs}`, gradient = shape('radialGradient', { id }, shape('defs', {}, g));
  for (const [offset, share] of [[0, 1], [.35, .55], [.7, .16], [1, 0]]) shape('stop', { offset, 'stop-color': colour, 'stop-opacity': f(opacity * share * 100) / 100 }, gradient);
  return `url(#${id})`;
}
const gift = (g, x, base, width, height, fill, ribbon) => { rect(g, x, base - height, width, height, fill); rect(g, x + width / 2 - width * .07, base - height, width * .14, height, ribbon); rect(g, x - 2, base - height - 6, width + 4, 8, fill); };

// A stall on the square: plaster or boards between timbers, a lit window full of things under a striped awning, a door,
// little lit windows above, snow along the eave; now a gable, now a hanging sign or a wreath.
export function facade({ width = 500, height = 420, wall = '#d9c3a2', awning = [RED, CREAM], gable = false, sign = null, wreath = false, seed = 1 } = {}) {
  const top = gable ? 70 : 20, box = [0, -10, width, height + 10];
  const draw = g => {
    const base = height;
    if (gable) shape('path', { d: poly([[0, top + 4], [width / 2, -6], [width, top + 4]]), fill: '#73413a' }, g);
    rect(g, 0, top, width, base - top, wall);
    if (gable) { shape('path', { d: poly([[18, top + 2], [width / 2, 8], [width - 18, top + 2]]), fill: wall }, g); rect(g, width / 2 - 26, 34, 52, 30, LIT); shape('path', { d: `M${width / 2} 34V64M${width / 2 - 26} 49H${width / 2 + 26}`, stroke: DEEP, 'stroke-width': 4 }, g); }
    for (const x of [0, width - 22]) rect(g, x, top, 22, base - top, DARK);
    rect(g, 0, base - 250, width, 14, DARK);
    for (const [i, x] of [width * .22, width * .62].entries()) { rect(g, x - 34, top + 50 + (i ? 10 : 0), 68, 58, DEEP); rect(g, x - 28, top + 56 + (i ? 10 : 0), 56, 46, LIT); shape('path', { d: `M${f(x)} ${f(top + 56 + (i ? 10 : 0))}V${f(top + 102 + (i ? 10 : 0))}`, stroke: DEEP, 'stroke-width': 4 }, g); }
    const [w0, w1] = [width * .08, width * .66];
    rect(g, w0, base - 190, w1 - w0, 150, DEEP); rect(g, w0 + 8, base - 182, w1 - w0 - 16, 134, LIT); rect(g, w0 + 8, base - 182, w1 - w0 - 16, 30, AMBER, { opacity: .5 });
    rect(g, w0 + 8, base - 96, w1 - w0 - 16, 6, WOOD);
    for (let k = 0; k < 4; k++) gift(g, w0 + 24 + k * (w1 - w0 - 60) / 4, base - 96, 22 + noise(seed + k) * 16, 18 + noise(seed + k * 2) * 22, [RED, PINE, GOLD, CREAM][(k + seed) % 4], [GOLD, CREAM, RED, RED][(k + seed) % 4]);
    for (let k = 0; k < 3; k++) gift(g, w0 + 40 + k * (w1 - w0 - 80) / 3, base - 52, 26 + noise(seed + k * 3) * 14, 22 + noise(seed + k * 5) * 18, [PINE, RED, GOLD][(k + seed) % 3], [CREAM, GOLD, RED][(k + seed) % 3]);
    const door = [width * .74, width * .9];
    rect(g, door[0], base - 190, door[1] - door[0], 190, WOOD); rect(g, door[0] + 8, base - 180, door[1] - door[0] - 16, 60, LIT, { opacity: .85 });
    if (wreath) { const cx = (door[0] + door[1]) / 2; shape('circle', { cx: f(cx), cy: base - 96, r: 22, fill: 'none', stroke: PINE, 'stroke-width': 11 }, g); for (let k = 0; k < 6; k++) shape('circle', { cx: f(cx + Math.cos(k) * 22), cy: f(base - 96 + Math.sin(k) * 22), r: 3.6, fill: '#c63a33' }, g); }
    if (awning) {
      const y = base - 236, count = Math.round((w1 - w0 + 40) / 34);
      rect(g, w0 - 20, y - 10, w1 - w0 + 40, 10, WOOD);
      for (let k = 0; k < count; k++) { const a = w0 - 20 + k * (w1 - w0 + 40) / count; rect(g, a, y, (w1 - w0 + 40) / count, 36, awning[k % 2]); }
      scallops(g, w0 - 20, w1 + 20, y + 36, 16, awning, count);
      snowCap(g, w0 - 24, w1 + 24, y - 10, 10, seed);
    }
    rect(g, -6, top - 12, width + 12, 14, DEEP);
    if (!gable) snowCap(g, -8, width + 8, top - 12, 16, seed + 3);
    else { shape('path', { d: poly([[-8, top + 6], [width / 2, -12], [width + 8, top + 6], [width / 2, 0]]), fill: SNOW }, g); }
    if (sign) {
      const x = width - 40, y = base - 300;
      shape('path', { d: `M${x} ${y}H${x - 70}M${x - 14} ${y}L${x} ${y + 16}`, stroke: IRON, 'stroke-width': 5, fill: 'none' }, g);
      rect(g, x - 76, y + 10, 60, 48, sign, { rx: 8 }); star(g, x - 46, y + 34, 13, sign === GOLD ? RED : GOLD);
    }
    const drift = [];
    for (let k = 0; k <= 10; k++) drift.push([width * k / 10, base - 10 - noise(seed + k * 2.2) * 12]);
    shape('path', { d: poly([[-4, base + 2], ...drift, [width + 4, base + 2]]), fill: '#efe7db' }, g);
  };
  // The warm light of its windows on the night, soft round each (it breathes with the street's bulbs).
  const glow = g => {
    const fill = glowFill(g, '#ffd98a', .38), [w0, w1] = [width * .08, width * .66];
    shape('ellipse', { cx: f((w0 + w1) / 2), cy: f(height - 115), rx: f((w1 - w0) * .62), ry: 105, fill }, g);
    for (const [i, x] of [width * .22, width * .62].entries()) shape('ellipse', { cx: f(x), cy: f(top + 79 + (i ? 10 : 0)), rx: 58, ry: 48, fill }, g);
  };
  return { box, draw, glow };
}

// The big tree in the square, lit, a gold star on top; its bulbs' light a board of its own.
export const TREE = { box: [0, 0, 300, 440], draw: g => {
  snowyFir(g, 150, 438, 400, 1, .5);
  star(g, 150, 40, 22, GOLD);
  for (let i = 0; i < 22; i++) { const t = .14 + i / 26, spread = 125 * t; shape('circle', { cx: f(150 + (noise(i * 3) - .5) * spread * 1.6), cy: f(60 + t * 340), r: 4.2, fill: i % 3 ? '#ffe4a3' : '#f2a08f' }, g); }
}, glow: g => { const fill = glowFill(g, '#ffd98a', .5); for (let i = 0; i < 22; i++) { const t = .14 + i / 26, spread = 125 * t; shape('circle', { cx: f(150 + (noise(i * 3) - .5) * spread * 1.6), cy: f(60 + t * 340), r: 20, fill }, g); } shape('circle', { cx: 150, cy: 40, r: 78, fill: glowFill(g, '#ffd98a', .4) }, g); } };

// A hot cocoa stall behind the square: posts, a green and cream roof scalloped and under snow, a counter with mugs and a
// kettle, its back lit, a garland of pine with bulbs, a lantern.
export const COCOA = { box: [0, -20, 380, 420], draw: g => {
  for (const x of [20, 344]) rect(g, x, 90, 16, 310, DARK);
  rect(g, 36, 120, 308, 160, LIT); rect(g, 36, 120, 308, 40, AMBER, { opacity: .45 });
  // A shelf behind the counter: jars of cocoa and marshmallows, and mugs stacked in twos.
  rect(g, 36, 166, 308, 8, DARK);
  for (const [i, x] of [58, 106, 154, 202, 250, 298].entries()) {
    if (i % 2) for (const [y, fill] of [[148, CREAM], [130, RED]]) { rect(g, x, y, 24, 18, fill, { rx: 3 }); shape('path', { d: `M${x + 24} ${y + 4}Q${x + 32} ${y + 9} ${x + 24} ${y + 14}`, fill: 'none', stroke: fill, 'stroke-width': 3 }, g); }
    else { rect(g, x, 130, 26, 36, CREAM, { rx: 5 }); rect(g, x - 2, 125, 30, 7, i % 4 ? PINE : RED, { rx: 2 }); rect(g, x + 5, 141, 16, 11, GOLD); }
  }
  for (let k = 0; k < 9; k++) rect(g, 6 + k * 40.9, 40, 40.9, 52, k % 2 ? CREAM : PINE);
  scallops(g, 6, 374, 92, 18, [PINE, CREAM], 9);
  shape('path', { d: poly([[0, 40], [190, -4], [380, 40]]), fill: '#73413a' }, g);
  shape('path', { d: poly([[-6, 42], [190, -14], [386, 42], [190, 2]]), fill: SNOW }, g);
  rect(g, 10, 270, 360, 26, WOOD); rect(g, 10, 296, 360, 104, '#8a5f3c');
  for (let x = 30; x < 370; x += 34) shape('path', { d: `M${x} 300V396`, stroke: DEEP, 'stroke-width': 2, opacity: .5 }, g);
  for (const x of [70, 120, 170, 270]) { rect(g, x, 244, 30, 26, CREAM, { rx: 4 }); rect(g, x, 252, 30, 6, RED); shape('path', { d: `M${x + 30} 250Q${x + 42} 256 ${x + 30} 264`, fill: 'none', stroke: CREAM, 'stroke-width': 4 }, g); }
  shape('path', { d: 'M206 270L210 236Q228 226 246 236L250 270Z', fill: IRON }, g); shape('path', { d: 'M246 242L262 232', stroke: IRON, 'stroke-width': 5 }, g);
  shape('path', { d: 'M24 104Q112 132 190 108T356 104', fill: 'none', stroke: PINE, 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
  for (const x of [70, 140, 230, 300]) holly(g, x, 112, .45);
  snowCap(g, 6, 374, 270, 8, 21);
  const drift = [];
  for (let k = 0; k <= 10; k++) drift.push([380 * k / 10, 386 - noise(k * 3.3) * 14]);
  shape('path', { d: poly([[-4, 402], ...drift, [384, 402]]), fill: '#efe7db' }, g);
} };

// The machine's lamp post, its lantern on a bracket.
export const LAMP = { box: [0, 0, 160, 560], draw: g => {
  shape('path', { d: 'M30 556V70H44V556Z', fill: IRON }, g); shape('path', { d: 'M22 556H52L48 520H26Z', fill: IRON }, g);
  shape('path', { d: 'M37 90H134M37 120C60 120 80 100 92 90', fill: 'none', stroke: IRON, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M37 64C37 50 50 44 58 52', fill: 'none', stroke: IRON, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M126 90V104', stroke: IRON, 'stroke-width': 3 }, g);
  shape('path', { d: 'M106 118L126 102L146 118Z', fill: IRON }, g); shape('path', { d: 'M110 118H142L146 182H106Z', fill: LIT }, g); shape('path', { d: 'M118 126H134L136 174H116Z', fill: '#fdf0c4' }, g);
  shape('path', { d: 'M126 118V182M108 150H144', stroke: IRON, 'stroke-width': 2.6 }, g); shape('path', { d: 'M102 182H150L142 192H110Z', fill: IRON }, g);
  holly(g, 40, 300, .6);
  shape('path', { d: 'M14 556C24 544 56 544 66 556Z', fill: SNOW }, g);
}, glow: g => shape('circle', { cx: 126, cy: 150, r: 118, fill: glowFill(g, '#ffd98a', .55) }, g) };
