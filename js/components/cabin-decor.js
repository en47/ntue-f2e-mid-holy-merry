// The room's wall decorations, each cut as a sheet of its own (cabin-art.js DECOR places them on the walls): drawn here
// as paper the way everything else is, and cut finer than the walls they hang on, so they stay crisp up close while the
// plaster around them stays light. What moves is a layer of its own, moved in the scene (cabin-scene.js): the snow falling
// past each window (between its view and its frame), the garland bulbs twinkling, the candle flames flickering, the wreath,
// the calendar and the paper snowflakes swaying on their strings, and the advent house's windows lit for the day.
import { holly, pine, shape } from './paper-art.js';
import { star } from './paper-props.js';

const CREAM = '#fbf3df', SNOW = '#fbf8f1', RED = '#a84a42', DEEP_RED = '#87302f', GREEN = '#4f7d68', DEEP_GREEN = '#3f6653', GOLD = '#e0b04f', WOOD = '#8f5a3c', WOOD_LIT = '#a86b47';
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
// A small six-armed paper star of snow, each arm with two twigs.
function flake(parent, x, y, r, fill = SNOW) {
  const g = shape('g', { transform: `translate(${x} ${y})` }, parent);
  for (let i = 0; i < 6; i++) {
    const arm = shape('g', { transform: `rotate(${i * 60})` }, g);
    shape('path', { d: `M-${r * .09} 0V-${r}H${r * .09}V0Z`, fill }, arm);
    shape('path', { d: `M0 -${r * .55}l-${r * .3} -${r * .26}M0 -${r * .55}l${r * .3} -${r * .26}`, stroke: fill, 'stroke-width': r * .14, 'stroke-linecap': 'round' }, arm);
  }
  shape('circle', { cx: 0, cy: 0, r: r * .22, fill }, g);
}

// A window's view, the glass's whole size: Christmas morning over the snow, in flat paper layers from the far sky to the
// drift under the sill: a pale band of dawn, the low sun, far hills, a fir wood, a little village with lit windows and a
// fence half buried.
export function windowView({ paper }, { width: w, height: h }) {
  shape('rect', { x: 0, y: 0, width: w, height: h, fill: '#bcd6e6' }, paper);
  shape('rect', { x: 0, y: h * .22, width: w, height: h * .3, fill: '#cfe3ee' }, paper);
  shape('rect', { x: 0, y: h * .4, width: w, height: h * .16, fill: '#f6e2d4' }, paper);
  shape('circle', { cx: w * .7, cy: h * .46, r: h * .11, fill: '#fbe7b0' }, paper); shape('circle', { cx: w * .7, cy: h * .46, r: h * .15, fill: 'none', stroke: '#fbe7b0', 'stroke-width': h * .012, opacity: .6 }, paper);
  shape('path', { d: `M0 ${h * .56}C${w * .22} ${h * .44} ${w * .45} ${h * .5} ${w * .62} ${h * .46}S${w * .9} ${h * .5} ${w} ${h * .48}V${h}H0Z`, fill: '#dde7ee' }, paper);
  for (const [x, size, fill] of [[.08, .2, DEEP_GREEN], [.18, .26, GREEN], [.3, .18, DEEP_GREEN], [.86, .24, GREEN], [.95, .17, DEEP_GREEN]]) pine(paper, w * x, h * .66, h * size, fill);
  // The village far off: three gables, each window lit.
  for (const [x, wide, tall, roof] of [[.44, .1, .07, '#a8564c'], [.55, .08, .06, DEEP_GREEN], [.64, .09, .065, '#8f5a3c']]) {
    shape('rect', { x: w * x, y: h * (.64 - tall), width: w * wide, height: h * tall, fill: '#efe2c4' }, paper);
    shape('path', { d: `M${w * (x - .012)} ${h * (.64 - tall)}L${w * (x + wide / 2)} ${h * (.6 - tall)}L${w * (x + wide + .012)} ${h * (.64 - tall)}Z`, fill: roof }, paper);
    shape('rect', { x: w * (x + wide * .38), y: h * (.64 - tall * .66), width: w * wide * .24, height: h * tall * .36, fill: '#f4cf74' }, paper);
  }
  shape('path', { d: `M0 ${h * .7}C${w * .3} ${h * .62} ${w * .62} ${h * .7} ${w} ${h * .64}V${h}H0Z`, fill: '#e6eef2' }, paper);
  for (let i = 0; i < 7; i++) shape('rect', { x: w * (.06 + i * .14), y: h * (.74 + (i % 2) * .02), width: w * .022, height: h * .12, rx: 2, fill: '#a8774d' }, paper);
  shape('path', { d: `M0 ${h * .8}H${w}`, stroke: '#a8774d', 'stroke-width': h * .012 }, paper);
  shape('path', { d: `M0 ${h * .84}C${w * .4} ${h * .76} ${w * .7} ${h * .86} ${w} ${h * .8}V${h}H0Z`, fill: SNOW }, paper);
}
// Its frame, over the view: the panes are left empty (the view and the snow show through). A deep green frame with a lighter
// lip, the cross bars, a wooden sill, red and white curtains tied back, and a garland of fir with holly and a red bow across
// the top; `glass` is where the glass is, as fractions of the sheet.
export const windowFrame = ({ glass: [gx0, gy0, gx1, gy1] }) => ({ paper }, { width: w, height: h }) => {
  const x0 = w * gx0, y0 = h * gy0, x1 = w * gx1, y1 = h * gy1, bar = (x1 - x0) * .07;
  shape('path', { d: `M${x0 - bar} ${y0 - bar}H${x1 + bar}V${y1 + bar}H${x0 - bar}ZM${x0} ${y0}V${y1}H${x1}V${y0}Z`, fill: DEEP_GREEN, 'fill-rule': 'evenodd' }, paper);
  shape('path', { d: `M${x0 - bar * .45} ${y0 - bar * .45}H${x1 + bar * .45}V${y1 + bar * .45}H${x0 - bar * .45}ZM${x0} ${y0}V${y1}H${x1}V${y0}Z`, fill: GREEN, 'fill-rule': 'evenodd' }, paper);
  shape('path', { d: `M${(x0 + x1) / 2} ${y0}V${y1}M${x0} ${(y0 + y1) / 2}H${x1}`, stroke: GREEN, 'stroke-width': bar * .6 }, paper);
  shape('path', { d: `M${(x0 + x1) / 2} ${y0}V${y1}M${x0} ${(y0 + y1) / 2}H${x1}`, stroke: DEEP_GREEN, 'stroke-width': bar * .18, opacity: .5 }, paper);
  // The sill, and a little snow caught in the bottom corners of the panes.
  shape('rect', { x: x0 - bar * 2, y: y1 + bar * .7, width: x1 - x0 + bar * 4, height: bar * 1.3, rx: bar * .3, fill: WOOD_LIT }, paper);
  shape('rect', { x: x0 - bar * 2, y: y1 + bar * 1.75, width: x1 - x0 + bar * 4, height: bar * .3, fill: WOOD }, paper);
  for (const [cx, side] of [[x0, 1], [(x0 + x1) / 2, -1], [(x0 + x1) / 2, 1], [x1, -1]]) shape('path', { d: `M${cx} ${y1}q${side * bar * .9} -${bar * .5} ${side * bar * 1.6} 0Z`, fill: SNOW, opacity: .9 }, paper);
  // Curtains, gathered and tied at each side.
  for (const side of [-1, 1]) {
    const edge = side < 0 ? x0 - bar * 1.6 : x1 + bar * 1.6, inward = -side, tie = y0 + (y1 - y0) * .55;
    shape('path', { d: `M${edge} ${y0 - bar}h${inward * bar * 2.6}C${edge + inward * bar * 1.8} ${tie - (y1 - y0) * .2} ${edge + inward * bar * .6} ${tie} ${edge + inward * bar * .5} ${tie}C${edge + inward * bar * 1.2} ${tie + (y1 - y0) * .2} ${edge + inward * bar * 2.2} ${y1} ${edge + inward * bar * 2.6} ${y1 + bar * .6}H${edge}Z`, fill: CREAM }, paper);
    for (let i = 1; i < 4; i++) shape('path', { d: `M${edge + inward * bar * .6 * i} ${y0 - bar}V${y1 + bar * .5}`, stroke: '#d9614f', 'stroke-width': bar * .22, opacity: .55 }, paper);
    shape('path', { d: `M${edge} ${tie - bar * .5}h${inward * bar * 1.1}v${bar}h${-inward * bar * 1.1}Z`, fill: RED }, paper);
  }
  // The garland across the top: two greens of fir in tufts, holly at the ends and a red bow in the middle.
  const top = y0 - bar * 1.2;
  for (let i = 0; i <= 26; i++) {
    const x = x0 - bar * 2 + (x1 - x0 + bar * 4) * i / 26, y = top + Math.sin(Math.PI * i / 26) * bar * .9;
    shape('path', { d: 'M0-14C8-10 10-2 7 6 4 12 1 14 0 16-1 14-4 12-7 6-10-2-8-10 0-14Z', fill: i % 2 ? GREEN : DEEP_GREEN, transform: `translate(${x} ${y}) rotate(${(noise(i) - .5) * 120}) scale(${bar / 14})` }, paper);
  }
  for (const x of [x0 - bar * 1.6, x1 + bar * 1.6]) holly(paper, x, top + bar * .2, bar / 34);
  const bx = (x0 + x1) / 2, by = top + bar * .9;
  for (const side of [-1, 1]) shape('path', { d: `M${bx} ${by}c${side * bar * 1.2} -${bar * .9} ${side * bar * 1.6} ${bar * .3} ${side * bar * 1.2} ${bar * .6}c-${side * bar * .4} ${bar * .2} -${side * bar * .8} -${bar * .1} -${side * bar * 1.2} -${bar * .6}Z`, fill: RED }, paper);
  for (const side of [-1, 1]) shape('path', { d: `M${bx} ${by}l${side * bar * .7} ${bar * 1.6}l${side * bar * .2} -${bar * .3}l${side * bar * .2} ${bar * .2}Z`, fill: DEEP_RED }, paper);
  shape('circle', { cx: bx, cy: by, r: bar * .32, fill: DEEP_RED }, paper);
};
// The garland's bulbs, a layer of their own (they twinkle): one every so often along the top of the frame. Glass, not
// paper: drawn without the paper's cut rim, which on bulbs this small reads as a blurred halo.
export const windowLights = ({ glass: [gx0, gy0, gx1] }) => ({ plain: paper }, { width: w, height: h }) => {
  const x0 = w * gx0, x1 = w * gx1, bar = (x1 - x0) * .07, top = h * gy0 - bar * 1.2, colours = ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec'];
  for (let i = 1; i < 12; i++) {
    const x = x0 - bar * 2 + (x1 - x0 + bar * 4) * i / 12, y = top + Math.sin(Math.PI * i / 12) * bar * .9 + bar * .55;
    shape('rect', { x: x - bar * .16, y: y - bar * .1, width: bar * .32, height: bar * .26, rx: bar * .06, fill: '#4f6a62' }, paper);
    shape('ellipse', { cx: x, cy: y + bar * .42, rx: bar * .22, ry: bar * .32, fill: colours[i % 4] }, paper);
    shape('ellipse', { cx: x - bar * .07, cy: y + bar * .32, rx: bar * .06, ry: bar * .1, fill: '#fffaf0', opacity: .7 }, paper);
  }
};

// The advent house on the window sill: snow on its roof, a chimney, a door with a tiny wreath, and twenty-four little
// windows (dark here: those lit for the day are a layer laid over it in the scene, ADVENT_WINDOWS).
export const ADVENT_WINDOWS = ({ width: w, height: h }) => Array.from({ length: 24 }, (_, i) => { const column = i % 6, row = Math.floor(i / 6); return [w * (.16 + column * .118), h * (.47 + row * .1), w * .08, h * .066]; });
export function adventHouse({ paper }, { width: w, height: h }) {
  shape('rect', { x: w * .82, y: h * .08, width: w * .08, height: h * .24, fill: '#8f5a3c' }, paper);
  shape('rect', { x: w * .8, y: h * .06, width: w * .12, height: h * .05, rx: 3, fill: '#6b4430' }, paper);
  shape('rect', { x: w * .1, y: h * .38, width: w * .8, height: h * .58, fill: '#ecdcc0' }, paper);
  for (let i = 0; i < 6; i++) shape('path', { d: `M${w * .1} ${h * (.44 + i * .09)}H${w * .9}`, stroke: '#dcc8a6', 'stroke-width': 1.5 }, paper);
  shape('path', { d: `M${w * .02} ${h * .42}L${w * .5} ${h * .1}L${w * .98} ${h * .42}Z`, fill: '#a8564c' }, paper);
  shape('path', { d: `M${w * .02} ${h * .42}L${w * .5} ${h * .1}L${w * .98} ${h * .42}L${w * .9} ${h * .44}Q${w * .7} ${h * .36} ${w * .5} ${h * .22}Q${w * .3} ${h * .36} ${w * .1} ${h * .44}Z`, fill: SNOW }, paper);
  for (const [x, y, w2, h2] of ADVENT_WINDOWS({ width: w, height: h })) shape('rect', { x, y, width: w2, height: h2, rx: 2, fill: '#9a8670' }, paper);
  shape('path', { d: `M${w * .45} ${h * .96}V${h * .86}a${w * .05} ${w * .05} 0 0 1 ${w * .1} 0V${h * .96}Z`, fill: '#6b4430' }, paper);
  shape('circle', { cx: w * .5, cy: h * .86, r: w * .022, fill: 'none', stroke: GREEN, 'stroke-width': 2.5 }, paper);
  shape('rect', { x: 0, y: h * .95, width: w, height: h * .05, rx: 3, fill: SNOW }, paper);
}

// A picture in a carved frame on the back wall: a reindeer on a hill under the moon and the first stars, a fir either side.
// Hung from a nail on a red cord; a sprig of holly tucked in its corner.
export function framedReindeer({ paper }, { width: w, height: h }) {
  const top = h * .14;
  shape('path', { d: `M${w * .5} ${h * .02}L${w * .2} ${top + 4}M${w * .5} ${h * .02}L${w * .8} ${top + 4}`, stroke: RED, 'stroke-width': 3 }, paper);
  shape('circle', { cx: w * .5, cy: h * .02 + 3, r: 4, fill: '#6b4430' }, paper);
  shape('rect', { x: 0, y: top, width: w, height: h - top, rx: 10, fill: WOOD }, paper);
  shape('rect', { x: w * .035, y: top + h * .03, width: w * .93, height: h - top - h * .06, rx: 7, fill: WOOD_LIT }, paper);
  for (const [cx, cy] of [[.05, top / h + .04], [.95, top / h + .04], [.05, .95], [.95, .95]]) shape('circle', { cx: w * cx, cy: h * cy, r: w * .025, fill: GOLD }, paper);
  const ix = w * .09, iy = top + h * .08, iw = w * .82, ih = h - top - h * .16;
  shape('rect', { x: ix - 6, y: iy - 6, width: iw + 12, height: ih + 12, fill: CREAM }, paper);
  shape('rect', { x: ix, y: iy, width: iw, height: ih, fill: '#2f3e5a' }, paper);
  shape('rect', { x: ix, y: iy + ih * .45, width: iw, height: ih * .25, fill: '#3f5577' }, paper);
  shape('circle', { cx: ix + iw * .78, cy: iy + ih * .22, r: ih * .1, fill: '#fbf3df' }, paper); shape('circle', { cx: ix + iw * .81, cy: iy + ih * .2, r: ih * .085, fill: '#2f3e5a' }, paper);
  for (let i = 0; i < 6; i++) star(paper, ix + iw * (.08 + noise(i + 2) * .6), iy + ih * (.08 + noise(i + 7) * .3), ih * .025, '#fbf3df');
  pine(paper, ix + iw * .12, iy + ih * .82, ih * .4, DEEP_GREEN); pine(paper, ix + iw * .9, iy + ih * .84, ih * .34, GREEN);
  shape('path', { d: `M${ix} ${iy + ih * .78}C${ix + iw * .3} ${iy + ih * .62} ${ix + iw * .66} ${iy + ih * .66} ${ix + iw} ${iy + ih * .74}V${iy + ih}H${ix}Z`, fill: SNOW }, paper);
  // The reindeer standing on the brow of the hill, its antlers up.
  const rx = ix + iw * .5, ry = iy + ih * .68, s = ih / 120;
  const deer = shape('g', { transform: `translate(${rx} ${ry}) scale(${s})` }, paper);
  shape('path', { d: 'M-26 0V-18C-24-27 4-29 18-25L24-31 30-29 26-20 24 0H18V-14H-18V0Z', fill: '#8a6a55' }, deer);
  shape('path', { d: 'M24-31L22-44 16-50M22-44L30-52M27-30L33-46 40-52M33-46L28-56', stroke: '#8a6a55', 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none' }, deer);
  shape('circle', { cx: 30, cy: -27, r: 2.2, fill: '#c63a33' }, deer);
  holly(paper, w * .9, top + h * .06, w / 180);
}
// A small oval photograph by the door: a sleigh flying across a full moon over snowy roofs. A sprig of holly over it.
export function framedSleigh({ paper }, { width: w, height: h }) {
  shape('ellipse', { cx: w / 2, cy: h * .56, rx: w * .5, ry: h * .44, fill: WOOD }, paper);
  shape('ellipse', { cx: w / 2, cy: h * .56, rx: w * .44, ry: h * .38, fill: CREAM }, paper);
  shape('ellipse', { cx: w / 2, cy: h * .56, rx: w * .4, ry: h * .34, fill: '#3d5272' }, paper);
  shape('circle', { cx: w * .56, cy: h * .46, r: h * .17, fill: '#fbf3df' }, paper);
  shape('path', { d: `M${w * .14} ${h * .74}L${w * .26} ${h * .64}L${w * .38} ${h * .74}L${w * .48} ${h * .66}L${w * .6} ${h * .76}L${w * .72} ${h * .66}L${w * .86} ${h * .76}V${h * .9}H${w * .14}Z`, fill: '#2c3b55' }, paper);
  for (const x of [.24, .48, .7]) shape('rect', { x: w * x, y: h * .72, width: w * .035, height: h * .035, fill: '#f4cf74' }, paper);
  const sx = w * .52, sy = h * .47, k = h / 160;
  const sleigh = shape('g', { transform: `translate(${sx} ${sy}) scale(${k})` }, paper);
  shape('path', { d: 'M-30 4H6Q14 4 14-4M-26 0V-10H-2L4 0Z', fill: '#2a1a14' }, sleigh);
  for (let i = 0; i < 2; i++) shape('path', { d: `M${18 + i * 16} -2V-10L${24 + i * 16} -14 ${30 + i * 16} -10V-2Z`, fill: '#2a1a14' }, sleigh);
  shape('path', { d: 'M4-6H46', stroke: '#2a1a14', 'stroke-width': 1.4 }, sleigh);
  holly(paper, w * .5, h * .1, w / 150);
}
// The wreath on the arched door: a full ring of fir in two greens, pine cones, clusters of red berries and two gold bells,
// a red velvet bow with long tails, hung from a loop of ribbon (it sways on it).
export function doorWreath({ paper }, { width: w, height: h }) {
  const cx = w / 2, cy = h * .56, r = w * .34;
  shape('path', { d: `M${cx} 0V${cy - r * .8}`, stroke: RED, 'stroke-width': w * .03 }, paper);
  shape('circle', { cx, cy, r, fill: 'none', stroke: DEEP_GREEN, 'stroke-width': r * .55 }, paper);
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * Math.PI * 2, rr = r * (i % 2 ? 1.12 : .88), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    shape('path', { d: 'M0-20C9-15 13-4 10 7 7 15 3 19 0 22-3 19-7 15-10 7-13-4-9-15 0-20Z', fill: [GREEN, '#5f8a70', DEEP_GREEN][i % 3], transform: `translate(${x} ${y}) rotate(${a * 180 / Math.PI + 90 + (noise(i) - .5) * 40}) scale(${r / 58})` }, paper);
  }
  for (const a of [.3, 2.2, 3.9]) { const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; shape('ellipse', { cx: x, cy: y, rx: r * .1, ry: r * .15, fill: '#8f5a3c', transform: `rotate(${a * 57} ${x} ${y})` }, paper); for (let k = 0; k < 3; k++) shape('path', { d: `M${x - r * .08} ${y - r * .06 + k * r * .06}h${r * .16}`, stroke: '#6b4430', 'stroke-width': 2, transform: `rotate(${a * 57} ${x} ${y})` }, paper); }
  for (const a of [1.1, 2.9, 4.6, 5.6]) for (const [dx, dy] of [[0, 0], [r * .08, r * .05], [-r * .06, r * .07]]) shape('circle', { cx: cx + Math.cos(a) * r + dx, cy: cy + Math.sin(a) * r + dy, r: r * .065, fill: '#c63a33' }, paper);
  for (const side of [-1, 1]) { const x = cx + side * r * .3, y = cy + r * 1.02; shape('path', { d: `M${x - r * .1} ${y}Q${x} ${y - r * .2} ${x + r * .1} ${y}Z`, fill: GOLD }, paper); shape('circle', { cx: x, cy: y + r * .02, r: r * .03, fill: '#a87a2a' }, paper); }
  const by = cy - r * .95;
  for (const side of [-1, 1]) shape('path', { d: `M${cx} ${by}c${side * r * .5} -${r * .4} ${side * r * .75} ${r * .1} ${side * r * .55} ${r * .3}c-${side * r * .2} ${r * .1} -${side * r * .4} -${r * .05} -${side * r * .55} -${r * .3}Z`, fill: RED }, paper);
  for (const side of [-1, 1]) shape('path', { d: `M${cx} ${by}l${side * r * .3} ${r * .75}l${side * r * .08} -${r * .12}l${side * r * .08} ${r * .08}Z`, fill: DEEP_RED }, paper);
  shape('circle', { cx, cy: by, r: r * .11, fill: DEEP_RED }, paper);
}
// Two pillar candles on the candle shelf, wax run down their sides, in a ring of holly (their flames are CANDLE_FLAME).
export const CANDLES = [[.3, .95, .82], [.68, .95, .58]];
export function candles({ paper }, { width: w, height: h }) {
  for (const [cx, base, tall] of CANDLES) {
    const x = w * cx, top = h * (base - tall * .8), half = w * .14;
    shape('rect', { x: x - half, y: top, width: half * 2, height: h * base - top, rx: 6, fill: CREAM }, paper);
    shape('path', { d: `M${x - half} ${top + 6}q${half * .3} ${h * .1} ${half * .5} 0q${half * .2} ${h * .16} ${half * .45} 0q${half * .4} ${h * .07} ${half * .6} -2V${top}H${x - half}Z`, fill: '#fffaf0' }, paper);
    shape('rect', { x: x - half * .2, y: top - h * .03, width: half * .08, height: h * .03, fill: '#3b2a24' }, paper);
    shape('path', { d: `M${x + half * .55} ${top + h * .1}V${h * base - 4}`, stroke: '#efe2c4', 'stroke-width': 3 }, paper);
  }
  shape('rect', { x: w * .04, y: h * .93, width: w * .92, height: h * .07, rx: 4, fill: GOLD }, paper);
  for (let i = 0; i < 7; i++) holly(paper, w * (.08 + i * .14), h * .94, w / 420);
}
// A candle's flame, its own little sheet (it flickers): a warm yellow drop with an orange heart and a pale halo.
export function candleFlame({ paper }, { width: w, height: h }) {
  shape('ellipse', { cx: w / 2, cy: h * .62, rx: w * .48, ry: h * .36, fill: '#ffe8a4', opacity: .35 }, paper);
  shape('path', { d: `M${w / 2} ${h * .04}C${w * .78} ${h * .38} ${w * .8} ${h * .7} ${w / 2} ${h * .92}C${w * .2} ${h * .7} ${w * .22} ${h * .38} ${w / 2} ${h * .04}Z`, fill: '#f4c668' }, paper);
  shape('path', { d: `M${w / 2} ${h * .34}C${w * .64} ${h * .52} ${w * .64} ${h * .74} ${w / 2} ${h * .86}C${w * .36} ${h * .74} ${w * .36} ${h * .52} ${w / 2} ${h * .34}Z`, fill: '#ef8a3c' }, paper);
}
// The cookie jar on the candle shelf: glass, a red lid with a gingham cloth tied on with string and a tag, and paper
// cookies inside (a gingerbread man, a star, two round ones).
export function cookieJar({ paper }, { width: w, height: h }) {
  shape('path', { d: `M${w * .14} ${h * .3}Q${w * .08} ${h * .3} ${w * .08} ${h * .42}V${h * .92}Q${w * .08} ${h} ${w * .2} ${h}H${w * .8}Q${w * .92} ${h} ${w * .92} ${h * .92}V${h * .42}Q${w * .92} ${h * .3} ${w * .86} ${h * .3}Z`, fill: '#d6e7ee' }, paper);
  for (const [x, y, r, fill] of [[.3, .82, .14, '#b97a4a'], [.68, .8, .15, '#c08a5a'], [.52, .62, .13, '#a8774d']]) { shape('circle', { cx: w * x, cy: h * y, r: w * r, fill }, paper); for (let k = 0; k < 4; k++) shape('circle', { cx: w * (x + (noise(k + x * 10) - .5) * r), cy: h * (y + (noise(k + y * 10) - .5) * r), r: w * .018, fill: '#5b3a2c' }, paper); }
  star(paper, w * .34, h * .56, w * .12, '#e0b04f');
  const gx = w * .7, gy = h * .52, k = w / 160, man = shape('g', { transform: `translate(${gx} ${gy}) scale(${k})` }, paper);
  shape('path', { d: 'M0-24C8-24 10-16 7-12 14-12 20-10 20-6 20-2 14-2 9-3L12 16C12 21 6 22 4 18L0 10-4 18C-6 22-12 21-12 16L-9-3C-14-2-20-2-20-6-20-10-14-12-7-12-10-16-8-24 0-24Z', fill: '#b97a4a' }, man);
  for (const [cx, cy] of [[-3, -18], [3, -18], [0, -6], [0, 2]]) shape('circle', { cx, cy, r: 1.6, fill: '#fbf3df' }, man);
  shape('path', { d: `M${w * .16} ${h * .4}V${h * .9}`, stroke: '#fffaf0', 'stroke-width': w * .03, opacity: .7 }, paper);
  shape('rect', { x: w * .12, y: h * .2, width: w * .76, height: h * .12, rx: 6, fill: RED }, paper);
  shape('path', { d: `M${w * .06} ${h * .24}Q${w * .5} ${h * .08} ${w * .94} ${h * .24}L${w * .9} ${h * .36}Q${w * .5} ${h * .3} ${w * .1} ${h * .36}Z`, fill: '#fbf3df' }, paper);
  for (let i = 0; i < 6; i++) shape('path', { d: `M${w * (.12 + i * .14)} ${h * .2}V${h * .34}`, stroke: '#d9614f', 'stroke-width': w * .03, opacity: .6 }, paper);
  shape('path', { d: `M${w * .08} ${h * .3}Q${w * .5} ${h * .38} ${w * .92} ${h * .3}`, fill: 'none', stroke: '#a8774d', 'stroke-width': 3 }, paper);
  shape('path', { d: `M${w * .82} ${h * .32}l${w * .06} ${h * .1}h${w * .1}v${h * .1}h-${w * .14}Z`, fill: CREAM }, paper);
}
// A calendar hung on a nail: a red band with holly at the top, a little picture of the sleigh, and December in rows of
// days, the twenty-fourth ringed in red ink. It sways a little on its string.
export function calendar({ paper }, { width: w, height: h }) {
  shape('path', { d: `M${w / 2} 0L${w * .2} ${h * .12}M${w / 2} 0L${w * .8} ${h * .12}`, stroke: '#8f5a3c', 'stroke-width': 2.5 }, paper);
  shape('circle', { cx: w / 2, cy: 3, r: 4, fill: '#6b4430' }, paper);
  shape('rect', { x: 0, y: h * .1, width: w, height: h * .9, rx: 6, fill: '#fffaf0' }, paper);
  shape('rect', { x: 0, y: h * .1, width: w, height: h * .12, rx: 6, fill: RED }, paper);
  holly(paper, w * .14, h * .16, w / 260);
  for (let i = 0; i < 4; i++) shape('circle', { cx: w * (.42 + i * .14), cy: h * .16, r: w * .03, fill: '#fbf3df' }, paper);
  shape('rect', { x: w * .1, y: h * .26, width: w * .8, height: h * .24, fill: '#cfe3ee' }, paper);
  shape('path', { d: `M${w * .1} ${h * .44}C${w * .4} ${h * .38} ${w * .6} ${h * .44} ${w * .9} ${h * .4}V${h * .5}H${w * .1}Z`, fill: SNOW }, paper);
  const sleigh = shape('g', { transform: `translate(${w * .5} ${h * .36}) scale(${w / 220})` }, paper);
  shape('path', { d: 'M-24 6H8Q16 6 16-2M-20 2V-8H0L6 2Z', fill: RED }, sleigh);
  for (let i = 0; i < 2; i++) shape('path', { d: `M${20 + i * 14} 0V-8L${25 + i * 14} -12 ${30 + i * 14} -8V0Z`, fill: '#8a6a55' }, sleigh);
  for (let day = 0; day < 35; day++) {
    const col = day % 7, row = Math.floor(day / 7), x = w * (.08 + col * .124), y = h * (.55 + row * .085), real = day - 1;
    if (real < 0 || real >= 31) continue;
    shape('rect', { x, y, width: w * .1, height: h * .06, rx: 2, fill: real < 24 ? '#efe2c4' : '#f6ecda' }, paper);
    if (real === 23) shape('ellipse', { cx: x + w * .05, cy: y + h * .03, rx: w * .08, ry: h * .045, fill: 'none', stroke: '#c63a33', 'stroke-width': 3 }, paper);
    if (real === 24) star(paper, x + w * .05, y + h * .03, w * .03, GOLD);
  }
}
// Paper snowflakes on a string across the wall, cut white and pale blue, with red beads between (they sway together).
export function snowflakeBunting({ paper }, { width: w, height: h }) {
  const sag = h * .32, count = 7, at = i => [w * (.04 + i * .92 / (count - 1)), h * .1 + Math.sin(Math.PI * i / (count - 1)) * sag];
  let d = `M0 ${h * .06}`; for (let i = 0; i <= 20; i++) d += `L${w * i / 20} ${h * .08 + Math.sin(Math.PI * i / 20) * sag}`;
  shape('path', { d, fill: 'none', stroke: '#a8774d', 'stroke-width': 2.5 }, paper);
  for (let i = 0; i < count; i++) {
    const [x, y] = at(i), r = h * (.22 + (i % 2) * .05);
    shape('path', { d: `M${x} ${y}V${y + h * .08}`, stroke: '#a8774d', 'stroke-width': 1.8 }, paper);
    flake(paper, x, y + h * .08 + r, r, i % 2 ? '#dbeaf3' : SNOW);
    if (i < count - 1) { const [nx, ny] = at(i + .5); shape('circle', { cx: nx, cy: ny + 2, r: h * .035, fill: '#c63a33' }, paper); }
  }
}
