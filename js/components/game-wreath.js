// Decorative paper-cut wreath for Game 02; every part is an SVG shape, so no image asset.
import { leaf as paperLeaf, paperLayer, shape } from './paper-art.js';

const GREENS = ['#2f6650', '#3c7a5a', '#568f66', '#7ba56e'];

// Fixed sequence: the wreath looks hand-placed but identical on every visit.
function sequence(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
}

function leaf(parent, angle, radius, size, fill, tilt) {
  paperLeaf(parent, `rotate(${angle} 200 214) translate(200 ${214 - radius}) rotate(${tilt}) scale(${size})`, fill);
}

function ring(parent, count, radius, size, shades, random) {
  for (let index = 0; index < count; index++) {
    const angle = index * 360 / count + random() * 7;
    leaf(parent, angle, radius + (random() - .5) * 13, size * (.86 + random() * .3), shades[Math.floor(random() * shades.length)], -60 + random() * 120);
  }
}

function berries(parent, random) {
  for (let index = 0; index < 11; index++) {
    const angle = (index * 360 / 11 + random() * 14) * Math.PI / 180, distance = 104 + random() * 18;
    const x = 200 + Math.sin(angle) * distance, y = 214 - Math.cos(angle) * distance;
    if (y < 120 && Math.abs(x - 200) < 55) continue;
    for (const [dx, dy] of [[0, 0], [11, 5], [3, 11]]) {
      shape('circle', { cx: x + dx, cy: y + dy, r: 7.5, fill: '#b9352f' }, parent);
      shape('circle', { cx: x + dx - 2.2, cy: y + dy - 2.4, r: 2, fill: '#f1b9a3' }, parent);
    }
  }
}

const BOX = '0 0 400 400';

function tails(parent) {
  shape('path', { d: 'M192 104C168 126 150 146 136 170L160 166 168 186C178 154 194 130 206 108Z', fill: '#b5322e' }, parent);
  shape('path', { d: 'M208 104C232 126 250 146 264 170L240 166 232 186C222 154 206 130 194 108Z', fill: '#a62b2a' }, parent);
}

function bow(parent) {
  shape('path', { d: 'M196 92C164 60 118 58 114 86 111 112 158 122 196 104Z', fill: '#c03b34' }, parent);
  shape('path', { d: 'M204 92C236 60 282 58 286 86 289 112 242 122 204 104Z', fill: '#b5322e' }, parent);
  shape('path', { d: 'M184 104C150 104 138 88 132 84M216 104C250 104 262 88 268 84', stroke: '#7f211f', 'stroke-width': 2.4, 'stroke-opacity': .5, fill: 'none' }, parent);
  shape('rect', { x: 184, y: 84, width: 32, height: 30, rx: 11, fill: '#d04a3e' }, parent);
}

function bell(parent) {
  shape('path', { d: 'M200 112V212', stroke: '#b98f4a', 'stroke-width': 2.4, fill: 'none' }, parent);
  shape('path', { d: 'M200 208C183 208 181 226 179 240 177 250 171 252 171 257H229C229 252 223 250 221 240 219 226 217 208 200 208Z', fill: '#d8a341' }, parent);
  shape('circle', { cx: 200, cy: 262, r: 7, fill: '#a9772e' }, parent);
}

export function mountWreath(slot) {
  if (!slot) return;
  const random = sequence(4217);
  const root = document.createElement('div');
  root.className = 'game-wreath';
  const swing = document.createElement('div');
  swing.className = 'art-layer wreath-swing';
  root.append(swing);
  paperLayer(swing, BOX, '', parent => shape('path', { d: 'M200 0V64', stroke: '#a9845b', 'stroke-width': 3, fill: 'none' }, parent), { paper: null });
  paperLayer(swing, BOX, 'wreath-ring', parent => {
    ring(parent, 22, 132, 1.5, GREENS.slice(0, 2), random);
    ring(parent, 20, 104, 1.45, GREENS.slice(1), random);
    ring(parent, 15, 118, 1, GREENS.slice(2), random);
    berries(parent, random);
  });
  paperLayer(swing, BOX, 'wreath-bell', bell, { origin: [200, 112] });
  paperLayer(swing, BOX, 'wreath-tail', tails, { origin: [200, 92] });
  paperLayer(swing, BOX, 'wreath-bow', bow);
  slot.append(root);
}
