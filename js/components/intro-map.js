// The Christmas map: traced from the hand-drawn original, recut as layered paper. Coordinates stay 1728×947.
import { NS, paperLayer, shape } from './paper-art.js';
import { SNOW, airmailLetter, holly, pine, star } from './paper-props.js';
import { MAP_BOX, mapLand } from '../data/intro-map-shapes.js';
import { introCultures } from '../data/intro-cultures.js';

const SEA = '#7fa9bd', SEA_LIGHT = '#a9c8d6', LAND = '#c3d4a6', LAND_DEEP = '#a9c08c';
const land = mapLand.join('');

function compass(parent, x, y, size) {
  const group = shape('g', { transform: `translate(${x} ${y}) scale(${size})` }, parent);
  shape('circle', { r: 44, fill: 'none', stroke: '#fbf3e3', 'stroke-width': 3, 'stroke-dasharray': '6 7' }, group);
  for (const angle of [0, 90, 180, 270]) shape('path', { d: 'M0-60L11-11 0 0Z', fill: '#fbf3e3', transform: `rotate(${angle})` }, group);
  for (const angle of [0, 90, 180, 270]) shape('path', { d: 'M0-60L-11-11 0 0Z', fill: '#d9b36a', transform: `rotate(${angle})` }, group);
  for (const angle of [45, 135, 225, 315]) shape('path', { d: 'M0-36L7-8-7-8Z', fill: '#a84a42', transform: `rotate(${angle})` }, group);
}

function sea(parent) {
  shape('rect', { x: 6, y: 6, width: 1716, height: 935, rx: 10, fill: SEA }, parent);
  for (const [x, y, width] of [[640, 640, 120], [1000, 500, 150], [960, 800, 130], [300, 860, 150], [1090, 150, 110], [560, 80, 130], [40, 640, 100]]) {
    shape('path', { d: `M${x} ${y}q${width / 4} -16 ${width / 2} 0t${width / 2} 0`, fill: 'none', stroke: SEA_LIGHT, 'stroke-width': 5, 'stroke-linecap': 'round' }, parent);
    shape('path', { d: `M${x + 24} ${y + 20}q${width / 5} -12 ${width * .4} 0t${width * .4} 0`, fill: 'none', stroke: SEA_LIGHT, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-opacity': .7 }, parent);
  }
  compass(parent, 1020, 800, 1);
  holly(parent, 62, 64, 1); holly(parent, 1668, 884, 1);
  for (const [x, y, size] of [[620, 300, 9], [960, 300, 8], [980, 640, 10], [1540, 760, 9], [120, 800, 8]]) star(parent, x, y, size, '#efd08a');
}

function landmass(parent) {
  const clip = shape('clipPath', { id: 'map-land' }, parent);
  shape('path', { d: land, 'clip-rule': 'evenodd' }, clip);
  shape('path', { d: land, fill: LAND, 'fill-rule': 'evenodd' }, parent);
  const inside = shape('g', { 'clip-path': 'url(#map-land)' }, parent);
  // Soft darker hills, then the snowy north across the top of the map.
  for (const [cx, cy, rx, ry] of [[480, 330, 150, 60], [300, 640, 80, 120], [1230, 400, 110, 70], [1420, 720, 70, 130], [760, 700, 70, 40], [620, 420, 90, 44]]) shape('ellipse', { cx, cy, rx, ry, fill: LAND_DEEP }, inside);
  shape('path', { d: 'M0 0H1728V190C1560 236 1460 176 1330 214S1110 196 960 224 740 170 600 216 360 186 230 232 90 210 0 240Z', fill: SNOW }, inside);
}

function dressing(parent) {
  for (const [x, y, size] of [[430, 300, 56], [486, 316, 42], [560, 300, 48], [1210, 330, 54], [1262, 348, 40], [1160, 352, 38], [300, 660, 42], [1410, 640, 44]]) pine(parent, x, y, size, '#5f8a70');
}

function sleighArt(parent) {
  shape('path', { d: 'M16 62H104C118 62 126 52 130 42', stroke: '#6d4f3a', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('path', { d: 'M22 26H88L82 54H30Z', fill: '#a84a42' }, parent);
  shape('rect', { x: 36, y: 12, width: 26, height: 16, rx: 3, fill: '#e0b04f' }, parent);
}

export function mountMapArt(canvas) {
  const options = { eager: true };
  paperLayer(canvas, MAP_BOX, 'map-sea', sea, { ...options, paper: { scale: 1.6, grain: .35, shadow: 0 } });
  paperLayer(canvas, MAP_BOX, 'map-land', landmass, { ...options, paper: { scale: 1.3, grain: .5, shadow: .3, rim: '#f6ecda' } });
  paperLayer(canvas, MAP_BOX, 'map-dressing', dressing, { ...options, paper: { scale: 1, grain: .4, shadow: .24 } });
  const points = id => { const { x, y } = introCultures.find(item => item.id === id); return [x * 17.28, y * 9.47]; };
  const stops = ['iceland', 'taiwan', 'japan', 'newzealand', 'brazil', 'canada'].map(points);
  const route = stops.reduce((d, [x, y], index) => {
    if (!index) return `M${x} ${y}`;
    const [px, py] = stops[index - 1];
    return `${d}Q${(px + x) / 2} ${(py + y) / 2 - Math.abs(x - px) * .22 - 30} ${x} ${y}`;
  }, '');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', MAP_BOX); svg.classList.add('map-route'); svg.setAttribute('aria-hidden', 'true');
  shape('path', { d: route, fill: 'none', stroke: '#fbf3e3', 'stroke-width': 4, 'stroke-dasharray': '3 13', 'stroke-linecap': 'round' }, svg);
  const holder = document.createElement('div');
  const sleigh = paperLayer(holder, '0 0 140 76', '', sleighArt, { ...options, paper: { scale: .6, grain: .4, shadow: .2 } }).querySelector('img');
  const image = shape('image', { href: sleigh.src, x: -70, y: -60, width: 140, height: 76 }, svg);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) shape('animateMotion', { dur: '36s', repeatCount: 'indefinite', path: route }, image);
  canvas.append(svg);
  return svg;
}

function roller(parent) {
  shape('rect', { x: 18, y: 26, width: 44, height: 548, rx: 10, fill: '#a98a62' }, parent);
  shape('rect', { x: 30, y: 26, width: 13, height: 548, fill: '#d9c196' }, parent);
  for (const y of [8, 566]) shape('rect', { x: 8, y, width: 64, height: 26, rx: 8, fill: '#d9b36a' }, parent);
}

export function mountScrollArt(root) {
  const paper = { paper: { scale: .7, grain: .45, shadow: .24 }, eager: true, preserveAspectRatio: 'none' };
  root.querySelectorAll('.intro-roller').forEach(button => paperLayer(button, '0 0 80 600', 'roller-art', roller, paper));
  paperLayer(root.querySelector('.intro-letter'), '0 0 380 300', 'letter-art', airmailLetter('#a84a42', '#4f7d68'), { ...paper, paper: { scale: .8, grain: .35, shadow: .24 } });
}
