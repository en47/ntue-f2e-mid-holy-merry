// The harbour behind the map. Wind blows left to right, light comes from the upper left, and
// everything afloat sits behind a wave deep enough that bobbing never lifts it out of the water.
import { paperLayer, pauseOffscreen, pine, popLayer, shape } from './paper-art.js';
import { SNOW, cloud } from './paper-props.js';

const WATER = { paper: { scale: 1.3, grain: .4, shadow: .12, rim: '#e8f1f3' }, preserveAspectRatio: 'none' };
const PAPER = { paper: { scale: 1, grain: .5, shadow: .24 } };

// Rounded crests: nearer water has taller, longer swells.
function swell(fill, top, height, length, foam = []) {
  return parent => {
    let d = `M0 ${top}`;
    for (let x = 0; x < 2000; x += length) d += `q${length / 2} ${-height} ${length} 0`;
    shape('path', { d: `${d}V800H0Z`, fill }, parent);
    for (const [x, y, width] of foam) shape('path', { d: `M${x} ${y}q${width / 4} -14 ${width / 2} 0t${width / 2} 0`, stroke: '#a9cbd9', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, parent);
  };
}

function farSea(parent) {
  shape('rect', { x: 0, y: 60, width: 2000, height: 740, fill: '#bcd6e0' }, parent);
  // A pale far shore: the distance fades it toward the sky, and it rests level on the horizon.
  shape('path', { d: 'M1240 60C1300 30 1370 44 1430 28S1560 8 1640 34 1800 30 1880 60Z', fill: '#d3e2e8' }, parent);
  for (const [x, y, width] of [[300, 96, 120], [820, 84, 90], [1320, 110, 140], [1680, 90, 80]]) shape('path', { d: `M${x} ${y}h${width}`, stroke: '#dcebf0', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

const stripe = (parent, top, bottom, fill) => {
  const left = y => 72 + (342 - y) * .0813, right = y => 176 - (342 - y) * .0813;
  shape('path', { d: `M${left(bottom)} ${bottom}L${left(top)} ${top}H${right(top)}L${right(bottom)} ${bottom}Z`, fill }, parent);
};

function headland(parent) {
  shape('path', { d: 'M0 560V340C36 318 92 322 130 344 176 334 226 368 256 404 306 414 356 462 408 494 452 520 492 540 520 560Z', fill: '#8d8a88' }, parent);
  // Faces turned away from the upper-left light are darker.
  shape('path', { d: 'M130 344C176 334 226 368 256 404 306 414 356 462 408 494 452 520 492 540 520 560H190C170 500 150 420 130 344Z', fill: '#737272' }, parent);
  shape('path', { d: 'M60 560L92 470 130 560ZM220 560L262 480 304 560Z', fill: '#646466' }, parent);
  pine(parent, 34, 346, 96, '#4f7a65');
  stripe(parent, 96, 342, '#f6ecda'); stripe(parent, 170, 216, '#a84a42'); stripe(parent, 262, 308, '#a84a42');
  shape('path', { d: 'M126 342V96H156L176 342Z', fill: '#000', opacity: .1 }, parent);
  shape('path', { d: 'M108 342V304C108 288 140 288 140 304V342Z', fill: '#6d4f3a' }, parent);
  shape('rect', { x: 114, y: 222, width: 20, height: 26, rx: 9, fill: '#efbe62' }, parent);
  shape('rect', { x: 80, y: 86, width: 88, height: 12, rx: 3, fill: '#5a4a44' }, parent);
  shape('rect', { x: 100, y: 44, width: 48, height: 44, fill: '#efbe62' }, parent);
  for (const x of [100, 124, 144]) shape('rect', { x, y: 44, width: 4, height: 44, fill: '#5a4a44' }, parent);
  shape('path', { d: 'M90 46L124 12 158 46Z', fill: '#a84a42' }, parent);
  // Snow only rests on what faces up: the roof, the gallery and the tops of the rocks.
  shape('path', { d: 'M86 48C100 34 112 22 124 8 132 20 146 34 162 48 146 44 140 52 130 44 118 54 104 42 86 48Z', fill: SNOW }, parent);
  shape('path', { d: 'M76 88C96 78 150 78 172 88 150 94 96 94 76 88Z', fill: SNOW }, parent);
  shape('path', { d: 'M0 346C40 320 92 322 130 344 176 334 226 368 256 404 306 414 340 442 372 468 340 448 312 438 280 436 262 430 244 412 214 398 186 384 170 382 150 376 110 362 60 356 0 372Z', fill: SNOW }, parent);
}

function lanternGlow(parent) {
  shape('circle', { cx: 124, cy: 66, r: 62, fill: '#f7dfa4', opacity: .45 }, parent);
  shape('circle', { cx: 124, cy: 66, r: 38, fill: '#fbeec6', opacity: .7 }, parent);
}

function boat(parent) {
  shape('rect', { x: 164, y: 30, width: 6, height: 182, fill: '#6d4f3a' }, parent);
  // The wind comes from the left, so both sails belly right and the pennant streams right.
  shape('path', { d: 'M164 36C146 92 108 152 62 198C100 212 140 208 164 198Z', fill: '#f6ecda' }, parent);
  shape('path', { d: 'M130 92L164 96M104 140L164 146', stroke: '#d9c5a2', 'stroke-width': 3, fill: 'none' }, parent);
  shape('path', { d: 'M172 50C214 88 238 146 240 198 214 208 190 206 172 198Z', fill: '#a84a42' }, parent);
  shape('path', { d: 'M170 26L212 36 170 46Z', fill: '#d9b36a' }, parent);
  shape('rect', { x: 92, y: 180, width: 30, height: 26, rx: 2, fill: '#4f7d68' }, parent);
  shape('rect', { x: 102, y: 180, width: 8, height: 26, fill: '#efd08a' }, parent);
  // The hull runs far below the waterline; the wave in front hides everything under it.
  shape('path', { d: 'M34 204H268C262 250 244 300 214 340H90C60 300 42 250 34 204Z', fill: '#7c563f' }, parent);
  shape('path', { d: 'M34 204H268L264 222H40Z', fill: '#f6ecda' }, parent);
}

function iceFloe(parent) {
  // Most of a floe rides under water, so its top stays low and its sides run down behind the wave.
  shape('path', { d: 'M26 150C62 132 120 126 192 128 262 128 314 138 338 156L346 300H16Z', fill: '#bcd8e4' }, parent);
  shape('path', { d: 'M190 128C262 128 314 138 338 156L346 300H226Z', fill: '#a3c7d8' }, parent);
  shape('path', { d: 'M20 152C60 128 120 122 192 124 264 124 318 134 344 158 310 154 296 170 262 160 232 172 204 158 170 164 134 172 110 156 76 164 56 166 40 158 20 152Z', fill: SNOW }, parent);
  // A harbour seal, hauled out with its head up.
  shape('path', { d: 'M92 150C86 118 112 92 146 92 186 90 232 116 270 136 286 144 296 150 300 158 262 164 150 166 92 150Z', fill: '#8b8f96' }, parent);
  shape('path', { d: 'M262 138C282 128 298 128 308 134 298 142 300 152 306 160 288 160 272 150 262 138Z', fill: '#74787f' }, parent);
  shape('path', { d: 'M150 142C160 156 178 160 190 156 178 150 166 140 158 134Z', fill: '#74787f' }, parent);
  shape('path', { d: 'M98 122C96 96 112 76 134 76 156 76 170 96 166 118 160 136 106 140 98 122Z', fill: '#9a9ea5' }, parent);
  shape('ellipse', { cx: 126, cy: 114, rx: 15, ry: 11, fill: '#c9ccd1' }, parent);
  shape('circle', { cx: 126, cy: 109, r: 4, fill: '#2f2a26' }, parent);
  for (const x of [114, 140]) shape('circle', { cx: x, cy: 96, r: 4.5, fill: '#2f2a26' }, parent);
  shape('path', { d: 'M112 116L92 112M112 120L92 122M140 116L160 112M140 120L160 122', stroke: '#f6ecda', 'stroke-width': 1.6, fill: 'none' }, parent);
}

function gull(parent) {
  shape('path', { d: 'M4 26C20 8 34 10 45 28 56 10 70 8 86 26 68 20 56 24 45 36 34 24 22 20 4 26Z', fill: '#5f7a8c' }, parent);
}

export function mountHarbor(section) {
  const host = section.querySelector('.intro-harbor'), sea = host.querySelector('.harbor-sea');
  const start = () => {
    popLayer(host, '-20 0 270 116', 'harbor-cloud harbor-cloud-a', parent => cloud(parent, 120, 62, 1.15), { delay: .1, paper: { scale: 1.2, grain: .4, shadow: .14 } });
    popLayer(host, '-20 0 270 116', 'harbor-cloud harbor-cloud-b', parent => cloud(parent, 120, 62, 1.15), { delay: .2, paper: { scale: 1.2, grain: .4, shadow: .14 } });
    for (const [name, delay] of [['harbor-gull-a', .7], ['harbor-gull-b', .8]]) popLayer(host, '0 0 90 46', `harbor-gull ${name}`, gull, { delay, paper: { scale: .6, grain: .3, shadow: .1 } });
    popLayer(sea, '0 0 2000 800', 'harbor-far', farSea, { delay: 0, ...WATER });
    popLayer(sea, '0 0 2000 800', 'harbor-wave harbor-wave-back', swell('#9fc3d3', 40, 12, 170), { delay: .15, ...WATER });
    const ship = popLayer(sea, '0 0 300 340', 'harbor-boat', boat, { delay: .55, ...PAPER });
    ship.style.transformOrigin = '50% 70%';
    popLayer(sea, '0 0 2000 800', 'harbor-wave harbor-wave-mid', swell('#7fadc3', 40, 20, 240), { delay: .3, ...WATER });
    popLayer(sea, '0 0 520 560', 'harbor-land', headland, { delay: .4, ...PAPER });
    paperLayer(sea.querySelector('.harbor-land'), '0 0 520 560', 'harbor-glow', lanternGlow, { paper: null, eager: true });
    popLayer(sea, '0 0 360 300', 'harbor-floe', iceFloe, { delay: .65, ...PAPER });
    popLayer(sea, '0 0 2000 800', 'harbor-wave harbor-wave-front', swell('#6795b0', 40, 30, 330, [[150, 150, 210], [620, 110, 170], [1010, 190, 240], [1460, 120, 190], [1760, 210, 170], [360, 280, 200], [1280, 300, 220]]), { delay: .45, ...WATER });
    const art = [...host.querySelectorAll('img')].map(image => image.decode().catch(() => {}));
    return Promise.race([Promise.all(art), new Promise(resolve => setTimeout(resolve, 1500))]);
  };
  let cut;
  // Cut the paper shortly before it scrolls in, and open the scene once it is really on screen.
  const near = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { near.disconnect(); cut = start(); pauseOffscreen([host]); } }, { rootMargin: '400px' });
  const seen = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { seen.disconnect(); (cut ?? Promise.resolve()).then(() => section.classList.add('is-opening')); } }, { threshold: .2 });
  near.observe(section); seen.observe(section);
  return { destroy() { near.disconnect(); seen.disconnect(); } };
}
