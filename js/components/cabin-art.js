// Santa's Cabin as a paper room: every board is drawn here once, then stood up around the camera by cabin-scene.js.
// Units: 1 = Santa's seated height. Each board's art is drawn at PX units per world unit; light comes from the upper left.
import { holly, pine, shape } from './paper-art.js';
import { roofHouse, star } from './paper-props.js';

export const PX = 500;
// The room runs from the back wall forward past the camera, so turning to look around never shows its open side.
export const BOX = { width: 3.6, back: -.9, front: 4, height: 2.3 };
BOX.depth = BOX.front - BOX.back; BOX.middle = (BOX.front + BOX.back) / 2;
export const CHAIR = { x: -.25, z: 0 };
const LOG = ['#b9875a', '#c39060', '#b07f53'], CHINK = '#dccbaa', CREAM = '#fbf3df', SNOW = '#fbf8f1';
const RED = '#a84a42', GREEN = '#4f7d68', GOLD = '#e0b04f', WOOD = '#8f5a3c', WOOD_LIT = '#a86b47';
// Stable "random" numbers, so every visit cuts the same cabin.
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };

function logs(parent, width, height, rows, seed = 1) {
  const row = height / rows;
  shape('rect', { x: 0, y: 0, width, height, fill: CHINK }, parent);
  for (let i = 0; i < rows; i++) {
    const y = i * row;
    shape('rect', { x: -40, y: y + row * .06, width: width + 80, height: row * .86, rx: row * .43, fill: LOG[(i + seed) % 3] }, parent);
    shape('path', { d: `M0 ${y + row * .24}H${width}`, stroke: '#d6a874', 'stroke-width': row * .09, opacity: .7 }, parent);
    shape('path', { d: `M0 ${y + row * .78}H${width}`, stroke: '#8f6340', 'stroke-width': row * .1, opacity: .45 }, parent);
    for (let k = 0; k < width / 260; k++) {
      const x = noise(i * 31 + k * 7 + seed) * (width - 120) + 60, length = 60 + noise(i + k * 13 + seed) * 110;
      shape('path', { d: `M${x} ${y + row * .5}c${length * .3} -${row * .08} ${length * .7} ${row * .08} ${length} 0`, stroke: '#8f6340', 'stroke-width': 3, fill: 'none', opacity: .4 }, parent);
    }
  }
}

function garland(parent, from, to, y, sag) {
  const span = to - from, swags = Math.round(span / 300), width = span / swags;
  let d = `M${from} ${y}`;
  for (let i = 0; i < swags; i++) d += `Q${from + width * (i + .5)} ${y + sag * 2} ${from + width * (i + 1)} ${y}`;
  shape('path', { d, stroke: '#3f6653', 'stroke-width': 30, fill: 'none', 'stroke-linecap': 'round' }, parent);
  shape('path', { d, stroke: '#5f8a70', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '6 14' }, parent);
  const colours = ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec'];
  for (let i = 0; i <= swags * 4; i++) {
    const t = i / 4, swag = Math.floor(t), local = t - swag, x = from + width * t;
    const curve = y + sag * 2 * 2 * local * (1 - local);
    shape('ellipse', { cx: x, cy: curve + 20, rx: 9, ry: 13, fill: colours[i % 4] }, parent);
    shape('rect', { x: x - 6, y: curve + 4, width: 12, height: 8, rx: 2, fill: '#4f6a62' }, parent);
  }
  for (let i = 0; i <= swags; i++) holly(parent, from + width * i, y - 4, .62);
}

function wreath(parent, x, y, radius) {
  shape('circle', { cx: x, cy: y, r: radius, fill: 'none', stroke: '#3f6653', 'stroke-width': radius * .5 }, parent);
  for (let i = 0; i < 14; i++) {
    const angle = i / 14 * Math.PI * 2, px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
    shape('path', { d: 'M0-22C11-16 15-4 11 8 8 16 3 20 0 24-3 20-8 16-11 8-15-4-11-16 0-22Z', fill: i % 2 ? '#5f8a70' : '#4f7d68', transform: `translate(${px} ${py}) rotate(${angle * 180 / Math.PI + 90}) scale(${radius / 60})` }, parent);
  }
  for (const [dx, dy] of [[-.5, -.62], [.62, -.4], [.7, .4], [-.68, .35], [0, .78]]) shape('circle', { cx: x + dx * radius, cy: y + dy * radius, r: radius * .1, fill: '#b4544c' }, parent);
  shape('path', { d: `M${x} ${y + radius * .7}c-${radius * .45} -${radius * .35} -${radius * .7} ${radius * .05} -${radius * .5} ${radius * .3}S${x - radius * .1} ${y + radius * .82} ${x} ${y + radius * .74}c${radius * .45} -${radius * .35} ${radius * .7} ${radius * .05} ${radius * .5} ${radius * .3}S${x + radius * .1} ${y + radius * .82} ${x} ${y + radius * .74}Z`, fill: RED }, parent);
  shape('path', { d: `M${x - 6} ${y + radius * .78}l-${radius * .22} ${radius * .55}h${radius * .16}l${radius * .1} -${radius * .3} ${radius * .1} ${radius * .3}h${radius * .16}l-${radius * .22} -${radius * .55}Z`, fill: '#87302f' }, parent);
}

function cabinWindow(parent, svg, x, y, width, height) {
  const defs = shape('defs', {}, svg), id = `cabin-window-${x}-${y}`;
  shape('rect', { x, y, width, height }, shape('clipPath', { id }, defs));
  const view = shape('g', { 'clip-path': `url(#${id})` }, parent);
  shape('rect', { x, y, width, height, fill: '#4d6f8e' }, view);
  shape('rect', { x, y: y + height * .55, width, height: height * .45, fill: '#5d7f9c' }, view);
  shape('circle', { cx: x + width * .76, cy: y + height * .22, r: height * .09, fill: '#f6e7b4' }, view);
  for (let i = 0; i < 9; i++) star(view, x + noise(i + 40) * width, y + noise(i + 70) * height * .45, 5 + noise(i) * 4, '#f3df9e');
  shape('path', { d: `M${x} ${y + height * .78}C${x + width * .25} ${y + height * .66} ${x + width * .55} ${y + height * .74} ${x + width} ${y + height * .64}V${y + height}H${x}Z`, fill: '#dce8ee' }, view);
  pine(view, x + width * .22, y + height * .8, height * .32, '#3f6653');
  pine(view, x + width * .36, y + height * .76, height * .22, '#4f7d68');
  pine(view, x + width * .82, y + height * .74, height * .26, '#3f6653');
  shape('path', { d: `M${x} ${y + height * .9}C${x + width * .3} ${y + height * .8} ${x + width * .7} ${y + height * .86} ${x + width} ${y + height * .8}V${y + height}H${x}Z`, fill: SNOW }, view);
  for (let i = 0; i < 18; i++) shape('circle', { cx: x + noise(i + 5) * width, cy: y + noise(i + 9) * height, r: 3 + noise(i + 3) * 3, fill: '#fff', opacity: .85 }, view);
  const bar = 22;
  shape('path', { d: `M${x - bar} ${y - bar}H${x + width + bar}V${y + height + bar}H${x - bar}ZM${x} ${y}V${y + height}H${x + width}V${y}Z`, fill: CREAM, 'fill-rule': 'evenodd' }, parent);
  shape('path', { d: `M${x + width / 2} ${y}V${y + height}M${x} ${y + height * .48}H${x + width}`, stroke: CREAM, 'stroke-width': bar * .8 }, parent);
  shape('rect', { x: x - bar * 2.2, y: y + height + bar * .6, width: width + bar * 4.4, height: bar * 1.5, rx: 6, fill: WOOD_LIT }, parent);
  shape('rect', { x: x - bar * 2.2, y: y + height + bar * 1.6, width: width + bar * 4.4, height: bar * .5, fill: WOOD }, parent);
  // Curtains, tied back on each side; the folds keep their shade on the right.
  for (const side of [-1, 1]) {
    const edge = side < 0 ? x - bar * 1.6 : x + width + bar * 1.6, inner = edge - side * width * .2;
    shape('path', { d: `M${edge} ${y - bar * 2}H${inner}C${inner + side * 14} ${y + height * .3} ${edge - side * 20} ${y + height * .5} ${edge - side * 26} ${y + height * .62}C${edge - side * 10} ${y + height * .8} ${edge} ${y + height} ${edge + side * 10} ${y + height + bar * .6}H${edge + side * 30}V${y - bar * 2}Z`, fill: '#b5544c' }, parent);
    shape('path', { d: `M${inner + side * 30} ${y - bar}C${inner + side * 34} ${y + height * .3} ${edge - side * 8} ${y + height * .5} ${edge - side * 14} ${y + height * .6}`, stroke: '#87302f', 'stroke-width': 6, fill: 'none', opacity: .5 }, parent);
    shape('ellipse', { cx: edge - side * 18, cy: y + height * .62, rx: 20, ry: 11, fill: GOLD }, parent);
  }
  shape('rect', { x: x - bar * 3, y: y - bar * 2.6, width: width + bar * 6, height: 18, rx: 9, fill: WOOD }, parent);
}

// The advent house on the sill: one lit window per December day so far (all lit outside December).
export function adventLit(date = new Date()) { return date.getMonth() === 11 ? Math.min(date.getDate(), 24) : date.getMonth() === 10 ? 0 : 24; }
function adventHouse(parent, x, base, lit) {
  roofHouse(parent, x, base, 150, 110, { wall: '#ecdcc0', roof: '#a8564c', chimney: true });
  for (let i = 0; i < 24; i++) {
    const column = i % 6, row = Math.floor(i / 6);
    shape('rect', { x: x - 62 + column * 21, y: base - 104 + row * 16, width: 13, height: 10, rx: 2, fill: i < lit ? '#f4cf74' : '#9a8670' }, parent);
  }
}

function pictureFrame(parent, x, y, width, height) {
  shape('rect', { x, y, width, height, rx: 8, fill: WOOD }, parent);
  shape('rect', { x: x + 14, y: y + 14, width: width - 28, height: height - 28, fill: '#dfeef3' }, parent);
  shape('path', { d: `M${x + 14} ${y + height - 40}C${x + width * .4} ${y + height - 60} ${x + width * .7} ${y + height - 46} ${x + width - 14} ${y + height - 56}V${y + height - 14}H${x + 14}Z`, fill: SNOW }, parent);
  // A reindeer silhouette, looking left.
  const rx = x + width * .55, ry = y + height - 52;
  shape('path', { d: `M${rx - 34} ${ry}V${ry - 22}C${rx - 30} ${ry - 34} ${rx + 10} ${ry - 36} ${rx + 26} ${ry - 30}L${rx + 30} ${ry}H${rx + 22}V${ry - 18}H${rx - 22}V${ry}Z M${rx - 30} ${ry - 28}L${rx - 46} ${ry - 50}L${rx - 58} ${ry - 46}L${rx - 52} ${ry - 38}Z`, fill: '#8a6a55' }, parent);
  shape('path', { d: `M${rx - 46} ${ry - 50}l-6 -18m6 18l8 -16m-8 16l-14 -8`, stroke: '#8a6a55', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

export function backWall({ plain, paper, svg }, { width, height }) {
  logs(plain, width, height, 12);
  garland(paper, 0, width, 54, 24);
  pictureFrame(paper, 130, 150, 220, 170);
  // The window sits high enough that the advent house on its sill shows above the rocking chair's back.
  cabinWindow(paper, svg, 560, 170, 420, 330);
  adventHouse(paper, 770, 513, adventLit());
  wreath(paper, 1400, 330, 92);
}

// Wall art runs along z: the left wall's art starts at the front (near the camera), the right wall's at the back.
const along = (side, z) => (side === 'left' ? BOX.front - z : z - BOX.back) * PX;
export function sideWall(side) {
  const withDoor = side === 'left';
  return ({ plain, paper, svg }, { width, height }) => {
    logs(plain, width, height, 12, withDoor ? 2 : 0);
    garland(paper, 0, width, 54, 24);
    cabinWindow(paper, svg, along(side, 3) - 190, 280, 380, 330);
    if (withDoor) {
      coatRack(paper, along(side, 2), height - 10);
      // A plank door left ajar onto the snow, beside the tree, for the reindeer to peek through later.
      const x = along(side, .8), y = 420, w = 300, h = height - y;
      shape('rect', { x: x - 26, y: y - 26, width: w + 52, height: h + 26, rx: 10, fill: WOOD }, paper);
      shape('rect', { x, y, width: w, height: h, fill: '#5d7f9c' }, paper);
      shape('path', { d: `M${x} ${y + h * .62}C${x + w * .4} ${y + h * .5} ${x + w * .7} ${y + h * .6} ${x + w} ${y + h * .54}V${y + h}H${x}Z`, fill: SNOW }, paper);
      shape('path', { d: `M${x + w * .42} ${y}H${x + w}V${y + h}H${x + w * .42}L${x + w * .34} ${y + h - 12}V${y + 12}Z`, fill: '#a8774d' }, paper);
      for (const fy of [.25, .55, .85]) shape('rect', { x: x + w * .38, y: y + h * fy - 12, width: w * .62, height: 24, fill: '#8f6340' }, paper);
      wreath(paper, x + w * .71, y + h * .18, 42);
      shape('circle', { cx: x + w * .48, cy: y + h * .55, r: 9, fill: GOLD }, paper);
    } else {
      letterDesk(paper, along(side, 1.8), height - 10);
      // Beside the fireplace: a shelf of candles and a cookie jar, with snowshoes hung below.
      const y = 470;
      shape('rect', { x: 180, y, width: 560, height: 26, rx: 6, fill: WOOD_LIT }, paper);
      shape('path', { d: `M220 ${y + 26}l40 60h-16l-40-60ZM700 ${y + 26}l-40 60h16l40-60Z`, fill: WOOD }, paper);
      for (const [cx, h] of [[250, 90], [300, 64]]) {
        shape('rect', { x: cx - 16, y: y - h, width: 32, height: h, rx: 4, fill: CREAM }, paper);
        shape('path', { d: `M${cx} ${y - h - 34}C${cx + 14} ${y - h - 18} ${cx + 10} ${y - h - 4} ${cx} ${y - h - 2}C${cx - 10} ${y - h - 4} ${cx - 14} ${y - h - 18} ${cx} ${y - h - 34}Z`, fill: '#f2a541' }, paper);
      }
      shape('path', { d: `M430 ${y}V${y - 96}C430 ${y - 120} 530 ${y - 120} 530 ${y - 96}V${y}Z`, fill: '#cfe1e7' }, paper);
      shape('rect', { x: 444, y: y - 132, width: 72, height: 22, rx: 8, fill: RED }, paper);
      for (const [cx, cy] of [[460, y - 40], [500, y - 62], [490, y - 24]]) shape('circle', { cx, cy, r: 13, fill: '#a8774d' }, paper);
      shape('rect', { x: 590, y: y - 120, width: 110, height: 120, rx: 8, fill: WOOD }, paper);
      shape('rect', { x: 602, y: y - 108, width: 86, height: 96, fill: '#f6e7b4' }, paper);
      star(paper, 645, y - 60, 26, GOLD);
      for (const sx of [330, 520]) {
        shape('ellipse', { cx: sx, cy: 760, rx: 52, ry: 110, fill: 'none', stroke: WOOD, 'stroke-width': 14 }, paper);
        shape('path', { d: `M${sx - 44} 720H${sx + 44}M${sx - 50} 780H${sx + 50}M${sx} 660V860`, stroke: '#d9c9a8', 'stroke-width': 5 }, paper);
      }
    }
  };
}

export function floor({ plain, paper }, { width, height }) {
  const plank = 112;
  shape('rect', { x: 0, y: 0, width, height, fill: '#7d5636' }, plain);
  for (let i = 0; i * plank < width; i++) {
    shape('rect', { x: i * plank + 3, y: 0, width: plank - 6, height, fill: ['#a87c53', '#9e734b', '#b08559'][i % 3] }, plain);
    for (let k = 0; k < 3; k++) { const y = noise(i * 7 + k) * height; shape('path', { d: `M${i * plank + 3} ${y}h${plank - 6}`, stroke: '#7d5636', 'stroke-width': 4 }, plain); }
  }
  // A braided rug under the rocking chair; floor art runs from the back wall (top) to the front edge (bottom).
  const cx = (CHAIR.x + BOX.width / 2) * PX, cy = (CHAIR.z - BOX.back) * PX + 40;
  [['#4f7d68', 430, 250], [CREAM, 392, 222], ['#a84a42', 352, 196], [GOLD, 300, 164], ['#a84a42', 252, 136], [CREAM, 196, 104], ['#4f7d68', 140, 72]].forEach(([fill, rx, ry]) => {
    shape('ellipse', { cx, cy, rx, ry, fill }, paper);
    shape('ellipse', { cx, cy, rx: rx - 18, ry: ry - 14, fill: 'none', stroke: '#00000022', 'stroke-width': 5, 'stroke-dasharray': '10 9' }, paper);
  });
  // A welcome mat by the door you came in through, near the bottom of the view.
  const mat = (BOX.front - BOX.back - 1.1) * PX;
  shape('rect', { x: cx - 230, y: mat, width: 460, height: 190, rx: 30, fill: '#8a6a55' }, paper);
  shape('rect', { x: cx - 200, y: mat + 26, width: 400, height: 138, rx: 20, fill: 'none', stroke: '#c9a77c', 'stroke-width': 10, 'stroke-dasharray': '18 12' }, paper);
  holly(paper, cx, mat + 95, 1.1);
}

export function ceiling({ plain, paper }, { width, height }) {
  // Planks run across the room; heavy beams cross them, and a string of lights zigzags between the beams.
  shape('rect', { x: 0, y: 0, width, height, fill: '#8f6340' }, plain);
  for (let y = 0; y < height; y += 90) shape('rect', { x: 0, y: y + 3, width, height: 84, fill: ['#a8774d', '#9c6b46', '#b07f53'][(y / 90) % 3] }, plain);
  const beams = [.12, .38, .64, .9].map(t => t * height);
  for (const y of beams) {
    shape('rect', { x: 0, y: y - 34, width, height: 68, fill: '#7d5636' }, paper);
    shape('rect', { x: 0, y: y - 34, width, height: 14, fill: '#94653f' }, paper);
  }
  for (let i = 0; i < beams.length - 1; i++) garland(paper, 60, width - 60, beams[i] + 60, 50);
}

// Santa's red coat and hat waiting on pegs, his boots below.
function coatRack(parent, x, base) {
  shape('rect', { x: x - 170, y: base - 760, width: 340, height: 40, rx: 10, fill: WOOD_LIT }, parent);
  for (const peg of [-110, 0, 110]) shape('circle', { cx: x + peg, cy: base - 740, r: 13, fill: WOOD }, parent);
  shape('path', { d: `M${x - 110} ${base - 735}C${x - 160} ${base - 690} ${x - 175} ${base - 520} ${x - 160} ${base - 420}H${x - 40}C${x - 30} ${base - 520} ${x - 50} ${base - 690} ${x - 110} ${base - 735}Z`, fill: RED }, parent);
  shape('rect', { x: x - 166, y: base - 448, width: 132, height: 34, rx: 14, fill: SNOW }, parent);
  shape('path', { d: `M${x - 110} ${base - 735}V${base - 430}`, stroke: SNOW, 'stroke-width': 22 }, parent);
  shape('path', { d: `M${x - 20} ${base - 730}C${x - 6} ${base - 800} ${x + 40} ${base - 820} ${x + 80} ${base - 790}L${x + 30} ${base - 724}Z`, fill: RED }, parent);
  shape('rect', { x: x - 34, y: base - 736, width: 74, height: 24, rx: 12, fill: SNOW }, parent);
  shape('circle', { cx: x + 82, cy: base - 790, r: 14, fill: SNOW }, parent);
  shape('path', { d: `M${x + 110} ${base - 735}C${x + 90} ${base - 640} ${x + 130} ${base - 560} ${x + 100} ${base - 470}`, stroke: GREEN, 'stroke-width': 26, fill: 'none', 'stroke-linecap': 'round' }, parent);
  for (const bx of [-70, 30]) shape('path', { d: `M${x + bx} ${base}V${base - 90}H${x + bx + 44}V${base - 34}H${x + bx + 70}C${x + bx + 84} ${base - 34} ${x + bx + 84} ${base} ${x + bx + 70} ${base}Z`, fill: '#3b2a24' }, parent);
}

// Santa's writing desk: a stack of letters, a quill and the Nice List hanging over the edge.
function letterDesk(parent, x, base) {
  shape('rect', { x: x - 200, y: base - 300, width: 400, height: 36, rx: 8, fill: WOOD_LIT }, parent);
  shape('rect', { x: x - 180, y: base - 266, width: 120, height: 266, fill: WOOD }, parent);
  shape('rect', { x: x + 130, y: base - 266, width: 30, height: 266, fill: WOOD }, parent);
  for (const dy of [-230, -150, -70]) { shape('rect', { x: x - 170, y: base + dy, width: 100, height: 62, rx: 6, fill: WOOD_LIT }, parent); shape('circle', { cx: x - 120, cy: base + dy + 31, r: 7, fill: GOLD }, parent); }
  for (let i = 0; i < 6; i++) shape('rect', { x: x - 150 + i * 6, y: base - 340 - i * 22, width: 150, height: 40, rx: 4, fill: [CREAM, '#f2e3c4', '#efe0bf'][i % 3], transform: `rotate(${(i % 2 ? 4 : -3)} ${x - 75} ${base - 320 - i * 22})` }, parent);
  shape('circle', { cx: x - 60, cy: base - 450, r: 18, fill: RED }, parent);
  shape('path', { d: `M${x + 60} ${base - 300}V${base - 340}C${x + 60} ${base - 360} ${x + 100} ${base - 360} ${x + 100} ${base - 340}V${base - 300}Z`, fill: '#3b4a5a' }, parent);
  shape('path', { d: `M${x + 84} ${base - 344}C${x + 120} ${base - 420} ${x + 150} ${base - 460} ${x + 170} ${base - 470}C${x + 150} ${base - 430} ${x + 120} ${base - 390} ${x + 88} ${base - 340}Z`, fill: SNOW }, parent);
  shape('path', { d: `M${x + 10} ${base - 304}H${x + 110}V${base - 170}C${x + 110} ${base - 150} ${x + 90} ${base - 140} ${x + 70} ${base - 150}H${x + 10}Z`, fill: '#f6ecda' }, parent);
  for (let i = 0; i < 6; i++) shape('path', { d: `M${x + 24} ${base - 284 + i * 20}h${i % 2 ? 60 : 74}`, stroke: '#b6a58a', 'stroke-width': 4, 'stroke-linecap': 'round' }, parent);
}

export function fireplace({ paper }, { width, height }) {
  const mantel = 250, opening = { x: 150, y: 400, width: 300, height: 190 };
  // Chimney breast of rounded river stones.
  shape('rect', { x: 20, y: 0, width: width - 40, height: height - 40, fill: '#b9ae9e' }, paper);
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 30 + col * 82 + (row % 2) * 40 + noise(row * 9 + col) * 12, y = 12 + row * 54;
      if (x > width - 50) continue;
      shape('rect', { x, y, width: 70 + noise(row + col * 5) * 12, height: 44, rx: 20, fill: ['#d9d1c3', '#cfc5b5', '#e3dccf'][(row + col) % 3] }, paper);
    }
  }
  shape('path', { d: `M${opening.x} ${opening.y + opening.height}V${opening.y + 50}C${opening.x} ${opening.y - 10} ${opening.x + opening.width} ${opening.y - 10} ${opening.x + opening.width} ${opening.y + 50}V${opening.y + opening.height}Z`, fill: '#3b2a24' }, paper);
  shape('path', { d: `M${opening.x + 24} ${opening.y + opening.height}V${opening.y + 60}C${opening.x + 24} ${opening.y + 14} ${opening.x + opening.width - 24} ${opening.y + 14} ${opening.x + opening.width - 24} ${opening.y + 60}V${opening.y + opening.height}Z`, fill: '#5b3a2c' }, paper);
  for (const [x, y, w] of [[200, 560, 170], [230, 540, 150]]) shape('rect', { x, y, width: w, height: 26, rx: 13, fill: ['#7d5636', '#94653f'][x % 2] }, paper);
  // Mantel beam with a garland, candles and three stockings.
  shape('rect', { x: 0, y: mantel, width, height: 42, rx: 8, fill: WOOD_LIT }, paper);
  shape('rect', { x: 0, y: mantel + 30, width, height: 12, fill: WOOD }, paper);
  garland(paper, 10, width - 10, mantel - 6, 10);
  for (const x of [190, 410]) {
    shape('rect', { x: x - 14, y: mantel - 76, width: 28, height: 70, rx: 4, fill: CREAM }, paper);
    shape('path', { d: `M${x} ${mantel - 112}C${x + 13} ${mantel - 96} ${x + 9} ${mantel - 82} ${x} ${mantel - 80}C${x - 9} ${mantel - 82} ${x - 13} ${mantel - 96} ${x} ${mantel - 112}Z`, fill: '#f2a541' }, paper);
  }
  [[86, RED], [300, GREEN], [514, '#c08a3e']].forEach(([x, fill], index) => {
    const top = mantel + 44;
    shape('path', { d: `M${x - 30} ${top}V${top + 92}C${x - 30} ${top + 120} ${x - 4} ${top + 132} ${x + 22} ${top + 130}H${x + 52}C${x + 70} ${top + 128} ${x + 72} ${top + 104} ${x + 54} ${top + 98}L${x + 24} ${top + 92}V${top}Z`, fill }, paper);
    shape('rect', { x: x - 36, y: top - 4, width: 66, height: 30, rx: 10, fill: SNOW }, paper);
    if (index === 1) star(paper, x, top + 64, 16, GOLD);
  });
  // The hearth slab sticks out past the stones.
  shape('rect', { x: 0, y: height - 52, width, height: 52, rx: 10, fill: '#c7bdad' }, paper);
  shape('rect', { x: 0, y: height - 52, width, height: 14, rx: 7, fill: '#e3dccf' }, paper);
}

export function flames({ paper }, { width, height }) {
  const cx = width / 2;
  for (const [scale, fill, dx] of [[1, '#e8673c', 0], [.78, '#f2a541', -18], [.7, '#f2a541', 30], [.5, '#ffd77a', 4]]) {
    const top = height * (1 - scale), half = width * .3 * scale;
    shape('path', { d: `M${cx + dx - half} ${height}C${cx + dx - half * 1.2} ${height - (height - top) * .5} ${cx + dx - half * .2} ${top + 40} ${cx + dx} ${top}C${cx + dx + half * .4} ${top + 50} ${cx + dx + half * 1.3} ${height - (height - top) * .45} ${cx + dx + half} ${height}Z`, fill }, paper);
  }
}

export function tree({ paper }, { width, height }) {
  const cx = width / 2, base = height - 70;
  shape('rect', { x: cx - 26, y: base - 40, width: 52, height: 60, fill: '#7d5636' }, paper);
  shape('path', { d: `M${cx - 120} ${height - 24}C${cx - 90} ${base - 10} ${cx + 90} ${base - 10} ${cx + 120} ${height - 24}Z`, fill: RED }, paper);
  const tiers = [[base - 30, 230, 210], [base - 190, 190, 190], [base - 340, 150, 170], [base - 470, 104, 150], [base - 580, 62, 130]];
  tiers.forEach(([bottom, half, tall], index) => {
    const top = bottom - tall;
    shape('path', { d: `M${cx} ${top}L${cx + half} ${bottom}C${cx + half * .5} ${bottom + 16} ${cx - half * .5} ${bottom + 16} ${cx - half} ${bottom}Z`, fill: index % 2 ? '#5f8a70' : '#4f7d68' }, paper);
    shape('path', { d: `M${cx} ${top}L${cx + half} ${bottom}C${cx + half * .7} ${bottom + 10} ${cx + half * .35} ${bottom + 14} ${cx + half * .1} ${bottom + 14}Z`, fill: '#3f6653', opacity: .6 }, paper);
    shape('path', { d: `M${cx - half * .82} ${bottom - 8}C${cx - half * .3} ${bottom + 8} ${cx + half * .3} ${bottom - 22} ${cx + half * .82} ${bottom - 4}`, stroke: GOLD, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, paper);
    for (let i = 0; i < 4 - Math.floor(index / 2); i++) {
      const t = (i + .5) / (4 - Math.floor(index / 2)), x = cx - half * .75 + half * 1.5 * t, y = bottom - 30 - noise(i + index * 5) * tall * .35;
      shape('circle', { cx: x, cy: y, r: 15, fill: [RED, GOLD, '#7cb8ec', CREAM][(i + index) % 4] }, paper);
      shape('circle', { cx: x - 5, cy: y - 5, r: 4, fill: '#fff', opacity: .7 }, paper);
    }
  });
  star(paper, cx, base - 700, 46, GOLD);
  const gift = (x, w, h, fill, ribbon) => {
    shape('rect', { x, y: height - 20 - h, width: w, height: h, rx: 6, fill }, paper);
    shape('rect', { x: x + w / 2 - 8, y: height - 20 - h, width: 16, height: h, fill: ribbon }, paper);
    shape('path', { d: `M${x + w / 2} ${height - 20 - h}c-30-34-50-6-18 2m18-2c30-34 50-6 18 2`, stroke: ribbon, 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, paper);
  };
  gift(cx - 230, 110, 80, '#8aa9ad', CREAM); gift(cx + 90, 130, 100, '#b5625a', '#efdcae'); gift(cx - 70, 80, 56, '#e9d9b8', RED);
}

// The rocking chair is four boards: a back behind Santa, two side profiles and the armrest fronts before him.
export function chairBack({ paper }, { width, height }) {
  const post = 34, left = 18, right = width - 18 - post, seat = height - 150;
  shape('path', { d: `M${left} ${height - 20}V40C${left} 10 ${left + post} 10 ${left + post} 40V${height - 20}Z`, fill: WOOD }, paper);
  shape('path', { d: `M${right} ${height - 20}V40C${right} 10 ${right + post} 10 ${right + post} 40V${height - 20}Z`, fill: WOOD }, paper);
  shape('path', { d: `M${left + 10} 70C${width * .3} 30 ${width * .7} 30 ${right + 24} 70V128C${width * .7} 92 ${width * .3} 92 ${left + 10} 128Z`, fill: WOOD_LIT }, paper);
  for (let i = 1; i <= 5; i++) { const x = left + post + (right - left - post) * i / 6 - 9; shape('rect', { x, y: 100, width: 18, height: seat - 100, rx: 9, fill: WOOD }, paper); }
  shape('rect', { x: left, y: seat - 36, width: right + post - left, height: 26, rx: 8, fill: WOOD_LIT }, paper);
  shape('rect', { x: left + 6, y: seat - 14, width: right + post - left - 12, height: 54, rx: 22, fill: '#5f8a70' }, paper);
  shape('rect', { x: left + 6, y: seat + 18, width: right + post - left - 12, height: 10, fill: CREAM, opacity: .8 }, paper);
  shape('circle', { cx: left + post / 2, cy: 30, r: 24, fill: WOOD_LIT }, paper);
  shape('circle', { cx: right + post / 2, cy: 30, r: 24, fill: WOOD_LIT }, paper);
  // Little tied cushion against the back, with a holly sprig.
  shape('rect', { x: width * .28, y: 140, width: width * .44, height: 120, rx: 40, fill: '#b5544c' }, paper);
  holly(paper, width / 2, 150, .7);
}

export function chairSide({ paper }, { width, height }) {
  // Front of the chair is on the left of this art. The rocker runner sweeps under both legs.
  const ground = height - 18, arm = height - 210, seat = height - 145;
  shape('path', { d: `M14 ${ground - 46}C${width * .3} ${ground + 18} ${width * .7} ${ground + 18} ${width - 14} ${ground - 60}L${width - 22} ${ground - 72}C${width * .7} ${ground - 8} ${width * .3} ${ground - 8} 24 ${ground - 58}Z`, fill: WOOD }, paper);
  shape('rect', { x: 70, y: arm, width: 28, height: ground - arm - 10, rx: 10, fill: WOOD }, paper);
  shape('rect', { x: width - 120, y: 40, width: 30, height: ground - 70, rx: 12, fill: WOOD }, paper);
  shape('path', { d: `M50 ${arm + 10}C50 ${arm - 20} 90 ${arm - 26} 120 ${arm - 14}L${width - 100} ${arm - 26}V${arm}L120 ${arm + 10}C96 ${arm + 22} 50 ${arm + 30} 50 ${arm + 10}Z`, fill: WOOD_LIT }, paper);
  shape('rect', { x: 84, y: seat, width: width - 190, height: 26, rx: 10, fill: WOOD_LIT }, paper);
  shape('rect', { x: 92, y: seat - 22, width: width - 210, height: 24, rx: 12, fill: '#5f8a70' }, paper);
  for (let i = 0; i < 3; i++) shape('rect', { x: 120 + i * 60, y: arm + 6, width: 14, height: seat - arm - 6, rx: 7, fill: WOOD }, paper);
}

export function chairFront({ paper }, { width, height }) {
  // Only the two front legs and armrest knobs: Santa's knees come forward between them.
  for (const x of [26, width - 60]) {
    shape('rect', { x: x + 4, y: 40, width: 30, height: height - 70, rx: 12, fill: WOOD }, paper);
    shape('ellipse', { cx: x + 19, cy: 38, rx: 30, ry: 22, fill: WOOD_LIT }, paper);
    shape('ellipse', { cx: x + 12, cy: 32, rx: 12, ry: 7, fill: '#c48a5c', opacity: .7 }, paper);
    shape('path', { d: `M${x - 14} ${height - 26}C${x + 4} ${height - 6} ${x + 34} ${height - 6} ${x + 52} ${height - 26}V${height - 12}C${x + 34} ${height + 4} ${x + 4} ${height + 4} ${x - 14} ${height - 12}Z`, fill: WOOD }, paper);
  }
}

export function sideTable({ paper }, { width, height }) {
  const cx = width / 2, top = 110;
  shape('path', { d: `M${cx - 18} ${top + 20}V${height - 40}H${cx + 18}V${top + 20}Z`, fill: WOOD }, paper);
  shape('path', { d: `M${cx - 70} ${height - 10}C${cx - 60} ${height - 40} ${cx + 60} ${height - 40} ${cx + 70} ${height - 10}Z`, fill: WOOD }, paper);
  shape('ellipse', { cx, cy: top + 14, rx: 100, ry: 20, fill: WOOD }, paper);
  shape('ellipse', { cx, cy: top + 6, rx: 100, ry: 20, fill: WOOD_LIT }, paper);
  // Milk and cookies left out for Santa.
  shape('ellipse', { cx: cx - 34, cy: top, rx: 46, ry: 11, fill: CREAM }, paper);
  for (const [x, y] of [[cx - 52, top - 10], [cx - 22, top - 14], [cx - 38, top - 26]]) {
    shape('circle', { cx: x, cy: y, r: 16, fill: '#c08a5a' }, paper);
    shape('circle', { cx: x - 4, cy: y - 3, r: 3, fill: '#5b3a2c' }, paper); shape('circle', { cx: x + 5, cy: y + 4, r: 3, fill: '#5b3a2c' }, paper);
  }
  shape('path', { d: `M${cx + 30} ${top}L${cx + 26} ${top - 74}H${cx + 66}L${cx + 62} ${top}Z`, fill: '#eef3f6' }, paper);
  shape('path', { d: `M${cx + 29} ${top - 6}L${cx + 27} ${top - 52}H${cx + 65}L${cx + 63} ${top - 6}Z`, fill: '#fffdf7' }, paper);
}

// Every board: art size in world units and where it stands. Room surfaces are cut at a lower density to save memory.
export const BOARDS = [
  { id: 'back', w: BOX.width, h: BOX.height, at: [0, 0, BOX.back], draw: backWall, kind: 'wall' },
  { id: 'left', w: BOX.depth, h: BOX.height, at: [-BOX.width / 2, 0, BOX.middle], turn: Math.PI / 2, draw: sideWall('left'), kind: 'wall' },
  { id: 'right', w: BOX.depth, h: BOX.height, at: [BOX.width / 2, 0, BOX.middle], turn: -Math.PI / 2, draw: sideWall('right'), kind: 'wall' },
  { id: 'floor', w: BOX.width, h: BOX.depth, at: [0, 0, BOX.middle], flat: 'floor', draw: floor, kind: 'floor' },
  { id: 'ceiling', w: BOX.width, h: BOX.depth, at: [0, BOX.height, BOX.middle], flat: 'ceiling', draw: ceiling, kind: 'floor' },
  { id: 'tree', w: .95, h: 1.75, at: [-1.28, 0, -.5], draw: tree },
  { id: 'fireplace', w: 1.2, h: 1.3, at: [1.02, 0, -.8], draw: fireplace },
  { id: 'flames', w: .48, h: .38, at: [1.02, .12, -.76], draw: flames, flame: true },
  { id: 'table', w: .42, h: .55, at: [.42, 0, .2], draw: sideTable },
  { id: 'chair-back', w: .82, h: 1.12, at: [0, 0, -.3], draw: chairBack, chair: true },
  { id: 'chair-left', w: .9, h: 1.0, at: [-.38, 0, -.04], turn: -Math.PI / 2, mirror: true, draw: chairSide, chair: true },
  { id: 'chair-right', w: .9, h: 1.0, at: [.38, 0, -.04], turn: Math.PI / 2, draw: chairSide, chair: true },
  { id: 'chair-front', w: .82, h: .44, at: [0, 0, .2], draw: chairFront, chair: true },
];
