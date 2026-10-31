// The Wish Room's night: a snowy cottage under the moon. Same paper as the other pages, darker tones.
import { popLayer, shape } from './paper-art.js';
import { cloud, pine, star } from './paper-props.js';

const SNOW = '#e6edf3', SNOW_SHADE = '#b7c8d8', PINE = '#2f5a50', PINE_FAR = '#3c6168', LIT = '#f4c668';
const PAPER = { scale: 1.2, grain: .45, shadow: .3, rim: '#d7dee4' }, SOFT = { ...PAPER, grain: .35, shadow: .16 };

function stars(parent) {
  for (const [x, y, size] of [[80, 60, 7], [190, 150, 5], [300, 44, 8], [450, 120, 5], [620, 54, 7], [760, 170, 4], [900, 70, 8], [1060, 150, 5], [1210, 46, 7], [1340, 130, 6], [1500, 64, 7], [1560, 190, 4], [120, 240, 4], [680, 250, 4], [1130, 250, 4]]) star(parent, x, y, size, '#f3df9e');
  for (const [x, y] of [[230, 90], [380, 200], [530, 40], [840, 120], [980, 210], [1280, 200], [1440, 110], [60, 170]]) shape('circle', { cx: x, cy: y, r: 2.4, fill: '#e7eef5' }, parent);
}

function moon(parent) {
  shape('circle', { cx: 110, cy: 110, r: 92, fill: '#f7e9b8', opacity: .14 }, parent);
  shape('path', { d: 'M126 40A72 72 0 1 0 178 138 58 58 0 1 1 126 40Z', fill: '#f6e3a4' }, parent);
}

function farForest(parent) {
  shape('path', { d: 'M0 190C200 130 380 170 620 140S1100 110 1600 170V300H0Z', fill: '#4a6a85' }, parent);
  for (let x = 20; x < 1600; x += 62) pine(parent, x, 190 + Math.sin(x / 170) * 16, 64 + (x % 5) * 12, PINE_FAR, '#a9bfcc');
  shape('path', { d: 'M0 220C260 190 520 232 800 206S1300 196 1600 224V300H0Z', fill: '#8fa8bd' }, parent);
}

function cottage(parent) {
  const glow = (x, y, rx, ry) => shape('ellipse', { cx: x, cy: y, rx, ry, fill: LIT, opacity: .16 }, parent);
  glow(260, 410, 230, 34);
  shape('rect', { x: 330, y: 76, width: 48, height: 96, fill: '#6d5650' }, parent);
  shape('path', { d: 'M322 82C336 62 372 62 388 82 376 92 334 92 322 82Z', fill: SNOW }, parent);
  shape('path', { d: 'M112 400V206H404V400Z', fill: '#7c6658' }, parent);
  shape('path', { d: 'M300 400V206H404V400Z', fill: '#000', opacity: .16 }, parent);
  for (const y of [240, 276, 312, 348, 384]) shape('path', { d: `M116 ${y}H400`, stroke: '#6b574b', 'stroke-width': 2, fill: 'none' }, parent);
  shape('path', { d: 'M62 214L258 66 454 214Z', fill: '#54403a' }, parent);
  shape('path', { d: 'M50 224C60 194 96 176 124 150 160 124 214 72 258 52 304 72 358 124 394 150 424 176 460 194 468 224 440 236 416 216 394 204 372 226 344 210 322 186 300 204 268 204 252 182 226 208 196 208 176 188 150 214 120 228 96 208 80 222 62 234 50 224Z', fill: SNOW }, parent);
  shape('path', { d: 'M232 400V300C232 262 288 262 288 300V400Z', fill: '#54403a' }, parent);
  shape('circle', { cx: 276, cy: 348, r: 5, fill: LIT }, parent);
  for (const x of [146, 322]) {
    glow(x + 29, 300, 62, 62);
    shape('rect', { x, y: 262, width: 58, height: 70, rx: 8, fill: LIT }, parent);
    shape('path', { d: `M${x + 29} 262v70M${x} 296h58`, stroke: '#54403a', 'stroke-width': 4, fill: 'none' }, parent);
    shape('path', { d: `M${x - 8} 264C${x + 6} 250 ${x + 52} 250 ${x + 66} 264Z`, fill: SNOW }, parent);
  }
  shape('path', { d: 'M40 410C110 382 200 398 280 392S430 382 496 410Z', fill: SNOW }, parent);
}

function snowfield(parent) {
  shape('path', { d: 'M0 70C220 30 420 84 680 58S1180 24 1600 66V300H0Z', fill: SNOW_SHADE }, parent);
  shape('path', { d: 'M0 112C260 74 520 126 820 96S1360 74 1600 108V300H0Z', fill: SNOW }, parent);
  shape('path', { d: 'M1040 300C1120 210 1280 170 1600 156V300Z', fill: '#d0dde8' }, parent);
}

function sidePines(parent) {
  pine(parent, 120, 400, 300, PINE, SNOW); pine(parent, 300, 404, 200, '#34645a', SNOW);
}

export function mountNightScene(room) {
  const sky = room.querySelector('.room-sky'), none = { preserveAspectRatio: 'none' };
  popLayer(sky, '0 0 1600 300', 'night-stars', stars, { delay: 0, paper: null, ...none });
  popLayer(sky, '0 0 220 220', 'night-moon', moon, { delay: .1, paper: SOFT });
  for (const [name, delay] of [['night-cloud-a', .2], ['night-cloud-b', .3]]) popLayer(sky, '-20 0 270 116', `night-cloud ${name}`, parent => cloud(parent, 120, 62, 1.15, '#7f97ad'), { delay, paper: SOFT });
  popLayer(sky, '0 0 1600 300', 'night-forest', farForest, { delay: .25, paper: SOFT, ...none });
  popLayer(sky, '0 0 520 440', 'night-cottage', cottage, { delay: .55, paper: PAPER });
  popLayer(sky, '0 0 1600 300', 'night-snow', snowfield, { delay: .4, paper: SOFT, ...none });
  popLayer(sky, '-60 0 480 436', 'night-pines', sidePines, { delay: .75, paper: PAPER });
  const art = [...sky.querySelectorAll('img')].map(image => image.decode().catch(() => {}));
  Promise.race([Promise.all(art), new Promise(resolve => setTimeout(resolve, 1500))]).then(() => room.classList.add('is-opening'));
}
