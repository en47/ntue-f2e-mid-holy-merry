// Paper-cut scenery shared by the Home and Game scenes. Light comes from the upper left,
// so every prop keeps its shaded side on the right and sits on its own base line.
import { holly, pine, shape } from './paper-art.js';

export const SNOW = '#fbf8f1', SHADE = '#d6e3e9', WOOD = '#9c7f64', LIT = '#efbe62';

export function cloud(parent, x, y, scale = 1, fill = '#fbf7ef') {
  const group = shape('g', { transform: `translate(${x} ${y}) scale(${scale})` }, parent);
  shape('path', { d: 'M-90 22C-104 22-110 4-94 -2-94-22-66-30-52-16-42-44 0-48 14-22 30-40 62-32 62-8 82-10 92 16 76 22Z', fill: SHADE, transform: 'translate(0 7)' }, group);
  shape('path', { d: 'M-90 22C-104 22-110 4-94 -2-94-22-66-30-52-16-42-44 0-48 14-22 30-40 62-32 62-8 82-10 92 16 76 22Z', fill }, group);
}

export function roofHouse(parent, x, base, width, height, { wall = '#e4d0b0', roof = '#a8564c', door = '#8a6248', chimney = true } = {}) {
  const half = width / 2, eave = base - height, peak = eave - width * .46;
  if (chimney) shape('path', { d: `M${x + half * .38} ${eave - width * .1}V${peak + 2}H${x + half * .66}V${eave - width * .02}Z`, fill: '#8f6f5b' }, parent);
  shape('path', { d: `M${x - half} ${base}V${eave}H${x + half}V${base}Z`, fill: wall }, parent);
  shape('path', { d: `M${x + half * .3} ${base}V${eave}H${x + half}V${base}Z`, fill: '#000', opacity: .06 }, parent);
  shape('path', { d: `M${x - half * 1.24} ${eave + 3}L${x} ${peak}L${x + half * 1.24} ${eave + 3}Z`, fill: roof }, parent);
  const drip = width * .12;
  shape('path', { d: `M${x - half * 1.3} ${eave + 5}L${x} ${peak - 7}L${x + half * 1.3} ${eave + 5}C${x + half} ${eave + 4 - drip} ${x + half * .66} ${eave - drip * 1.4} ${x + half * .4} ${eave - drip * 2.2} ${x + half * .2} ${eave - drip} ${x} ${eave - drip * 2.8} ${x - half * .2} ${eave - drip * 1.7} ${x - half * .5} ${eave - drip * .6} ${x - half * .8} ${eave - drip * 1.1} ${x - half * 1.3} ${eave + 5}Z`, fill: SNOW }, parent);
  const pane = width * .2;
  for (const offset of [-.56, .2]) {
    shape('rect', { x: x + half * offset, y: eave + height * .2, width: pane, height: pane, rx: 2, fill: LIT }, parent);
    shape('path', { d: `M${x + half * offset + pane / 2} ${eave + height * .2}v${pane}M${x + half * offset} ${eave + height * .2 + pane / 2}h${pane}`, stroke: '#94785f', 'stroke-width': 2, fill: 'none' }, parent);
  }
  shape('path', { d: `M${x - half * .18} ${base}V${base - height * .42}C${x - half * .18} ${base - height * .58} ${x + half * .18} ${base - height * .58} ${x + half * .18} ${base - height * .42}V${base}Z`, fill: door }, parent);
}

export function church(parent, x, base) {
  roofHouse(parent, x + 56, base, 118, 76, { wall: '#ecdcc0', roof: '#a8564c', chimney: false });
  shape('path', { d: `M${x - 34} ${base}V${base - 150}H${x + 30}V${base}Z`, fill: '#efe2c8' }, parent);
  shape('path', { d: `M${x + 8} ${base}V${base - 150}H${x + 30}V${base}Z`, fill: '#000', opacity: .06 }, parent);
  shape('path', { d: `M${x - 44} ${base - 148}L${x - 2} ${base - 256}L${x + 40} ${base - 148}Z`, fill: '#b5624f' }, parent);
  shape('path', { d: `M${x - 48} ${base - 146}C${x - 30} ${base - 160} ${x - 24} ${base - 184} ${x - 16} ${base - 204} ${x - 8} ${base - 176} ${x + 8} ${base - 170} ${x + 12} ${base - 182} ${x + 22} ${base - 166} ${x + 32} ${base - 158} ${x + 44} ${base - 146}Z`, fill: SNOW }, parent);
  shape('path', { d: `M${x - 2} ${base - 256}v-30M${x - 11} ${base - 276}h18`, stroke: '#7c5f49', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('path', { d: `M${x - 16} ${base - 92}V${base - 116}C${x - 16} ${base - 136} ${x + 14} ${base - 136} ${x + 14} ${base - 116}V${base - 92}Z`, fill: LIT }, parent);
  shape('path', { d: `M${x - 13} ${base}V${base - 34}C${x - 13} ${base - 52} ${x + 11} ${base - 52} ${x + 11} ${base - 34}V${base}Z`, fill: '#8a6248' }, parent);
}

export function fence(parent, x, base, count, gap = 30) {
  shape('path', { d: `M${x - 10} ${base - 34}H${x + (count - 1) * gap + 10}V${base - 26}H${x - 10}ZM${x - 10} ${base - 16}H${x + (count - 1) * gap + 10}V${base - 8}H${x - 10}Z`, fill: '#ad9076' }, parent);
  for (let index = 0; index < count; index++) {
    const px = x + index * gap;
    shape('path', { d: `M${px - 6} ${base}V${base - 44}L${px} ${base - 52}L${px + 6} ${base - 44}V${base}Z`, fill: WOOD }, parent);
    shape('ellipse', { cx: px, cy: base - 50, rx: 10, ry: 5, fill: SNOW }, parent);
  }
}

export function lamp(parent, x, base) {
  shape('path', { d: `M${x - 5} ${base}L${x - 3} ${base - 120}H${x + 3}L${x + 5} ${base}Z`, fill: '#6d5a50' }, parent);
  shape('path', { d: `M${x - 15} ${base - 122}L${x - 10} ${base - 152}H${x + 10}L${x + 15} ${base - 122}Z`, fill: LIT }, parent);
  shape('path', { d: `M${x - 19} ${base - 152}L${x} ${base - 170}L${x + 19} ${base - 152}Z`, fill: '#6d5a50' }, parent);
  shape('ellipse', { cx: x, cy: base - 160, rx: 22, ry: 7, fill: SNOW }, parent);
}

export function berryBush(parent, x, base) {
  shape('path', { d: `M${x} ${base}C${x - 2} ${base - 34} ${x - 30} ${base - 50} ${x - 50} ${base - 74}M${x} ${base - 26}C${x + 8} ${base - 50} ${x + 26} ${base - 66} ${x + 46} ${base - 78}M${x} ${base - 34}C${x - 4} ${base - 60} ${x} ${base - 80} ${x + 2} ${base - 96}M${x - 22} ${base - 44}C${x - 40} ${base - 48} ${x - 54} ${base - 44} ${x - 64} ${base - 40}M${x + 18} ${base - 52}C${x + 36} ${base - 50} ${x + 50} ${base - 44} ${x + 60} ${base - 38}`, stroke: '#8a6a55', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, parent);
  for (const [dx, dy] of [[-50, -74], [46, -78], [2, -96], [-64, -40], [60, -38], [-34, -62], [26, -70], [-14, -84], [38, -52], [-44, -52], [14, -92]]) shape('circle', { cx: x + dx, cy: base + dy, r: 7, fill: '#b5544c' }, parent);
}

export function star(parent, x, y, size, fill = '#e0b04f') {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = Math.PI * index / 5 - Math.PI / 2, radius = index % 2 ? size * .45 : size;
    return `${(x + Math.cos(angle) * radius).toFixed(1)} ${(y + Math.sin(angle) * radius).toFixed(1)}`;
  });
  shape('path', { d: `M${points.join('L')}Z`, fill }, parent);
}

// A deckled airmail sheet: striped edge, holly, stamp and wax seal.
export function airmailLetter(first, second) {
  return parent => {
    shape('path', { d: 'M20 20C120 15 260 16 360 20 365 110 364 200 360 280 260 285 120 284 20 280 15 200 16 110 20 20Z', fill: '#fdf6e6' }, parent);
    for (const [stroke, offset] of [[first, 0], [second, 16]]) shape('rect', { x: 34, y: 34, width: 312, height: 232, rx: 6, fill: 'none', stroke, 'stroke-width': 5, 'stroke-dasharray': '16 16', 'stroke-dashoffset': offset }, parent);
    shape('path', { d: 'M18 22C90 14 190 14 262 20 258 32 240 36 230 30 222 42 200 42 192 32 180 44 158 42 150 32 138 42 116 40 110 30 96 44 66 38 58 32 44 46 26 40 18 22Z', fill: SNOW, transform: 'translate(0 8)' }, parent);
    shape('path', { d: 'M56 262C70 244 92 236 116 232', stroke: '#8a6a55', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, parent);
    for (const [x, y, angle] of [[74, 240, -40], [90, 232, -60], [104, 228, -74], [80, 256, 50], [98, 246, 34], [114, 240, 20]]) shape('path', { d: 'M0 0C4-6 4-14 0-20-4-14-4-6 0 0Z', fill: second === '#c08a3e' ? '#5f8a70' : first === '#a84a42' ? '#5f8a70' : '#4f7a65', transform: `translate(${x} ${y}) rotate(${angle})` }, parent);
    shape('circle', { cx: 120, cy: 232, r: 5, fill: '#b4544c' }, parent);
    holly(parent, 66, 62, .66);
    shape('rect', { x: 292, y: 48, width: 40, height: 50, rx: 2, fill: '#f6e4bd', stroke: '#fffdf6', 'stroke-width': 3, 'stroke-dasharray': '3 3' }, parent);
    star(parent, 312, 73, 12);
    shape('path', { d: 'M318 216C332 208 350 216 352 232 356 246 342 262 326 258 308 260 294 244 298 230 300 222 310 218 318 216Z', fill: '#a84a42' }, parent);
    shape('circle', { cx: 325, cy: 236, r: 14, fill: 'none', stroke: '#c9756b', 'stroke-width': 2 }, parent);
    star(parent, 325, 236, 8, '#e3b7a4');
  };
}

// Facets as [tone, [across, down]…]: across runs -1 (left foot) to 1 (right foot), down 0 (summit) to 1 (base).
const FACETS = [
  ['sky', [-.84, 1], [-.64, .66], [-.46, 1]], ['ice', [-.62, 1], [-.44, .52], [-.26, 1]],
  ['dusk', [-.52, 1], [-.4, .76], [-.3, 1]], ['sky', [-.36, 1], [-.2, .44], [-.05, .84], [.02, 1]],
  ['ice', [-.27, .64], [-.13, .28], [-.03, .58]], ['dusk', [-.18, 1], [-.08, .68], [.02, 1]],
  ['sky', [.02, 0], [.1, .2], [-.05, .42], [.14, .66], [.04, 1], [1, 1], [.72, .68], [.46, .36], [.34, .3]],
  ['dusk', [.1, .2], [.34, .62], [.14, .66], [-.05, .42]], ['dusk', [.14, .66], [.4, .46], [.62, 1], [.04, 1]],
  ['dusk', [.5, .62], [.6, .52], [.84, 1], [.62, 1]], ['ice', [.46, 1], [.66, .72], [.88, 1]],
  ['ice', [.2, 1], [.3, .8], [.42, 1]], ['cream', [.16, .44], [.3, .4], [.22, .74]], ['cream', [.5, .46], [.6, .52], [.55, .8]],
  ['cream', [0, 0], [.34, .3], [.2, .25], [.15, .37], [.05, .24], [-.04, .35], [-.13, .26], [-.22, .2]],
];
const OUTLINE = [[-1, 1], [-.66, .55], [-.5, .5], [-.22, .2], [0, 0], [.34, .3], [.46, .36], [.72, .68], [1, 1]];

// One faceted peak: sunlit left face, shaded right face, snow cap on top. Home and Game pass their own tones.
export function facetedPeak(parent, x, top, base, left, right, tones = { cream: '#f7f0e3', ice: '#c7dbe6', sky: '#92b6d0', dusk: '#6b95b6' }) {
  const at = ([across, down]) => `${x + across * (across < 0 ? left : right)} ${top + (base - top) * down}`;
  const facet = (fill, points) => shape('path', { d: `M${points.map(at).join('L')}Z`, fill }, parent);
  facet(tones.cream, OUTLINE);
  for (const [tone, ...points] of FACETS) facet(tones[tone], points);
}

export { holly, pine };
