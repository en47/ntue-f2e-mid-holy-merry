// Home pop-up book: a village under faceted snow peaks. Sun at upper left; every building meets the snow.
import { paperLayer, popLayer, shape } from './paper-art.js';
import { SHADE, SNOW, berryBush, church, cloud, fence, holly, lamp, pine, roofHouse, star } from './paper-props.js';
import { TITLE_BOX, titleGlyphs } from '../data/title-glyphs.js';

const GREEN = '#5f8a70', DEEP = '#4f7a65', ICE = '#c7dbe6', SKY = '#92b6d0', DUSK = '#6b95b6', CREAM = '#f7f0e3';

function sun(parent) {
  for (let index = 0; index < 12; index++) shape('path', { d: 'M110 16L120 46H100Z', fill: '#f3dca6', transform: `rotate(${index * 30} 110 110)` }, parent);
  shape('circle', { cx: 110, cy: 110, r: 54, fill: '#f2cf86' }, parent);
}

const poly = (parent, fill, points) => shape('path', { d: `M${points.map(point => point.join(' ')).join('L')}Z`, fill }, parent);

// Facets as [fill, [across, down]…]: across runs -1 (left foot) to 1 (right foot), down 0 (summit) to 1 (base).
const FACETS = [
  [SKY, [-.84, 1], [-.64, .66], [-.46, 1]], [ICE, [-.62, 1], [-.44, .52], [-.26, 1]],
  [DUSK, [-.52, 1], [-.4, .76], [-.3, 1]], [SKY, [-.36, 1], [-.2, .44], [-.05, .84], [.02, 1]],
  [ICE, [-.27, .64], [-.13, .28], [-.03, .58]], [DUSK, [-.18, 1], [-.08, .68], [.02, 1]],
  [SKY, [.02, 0], [.1, .2], [-.05, .42], [.14, .66], [.04, 1], [1, 1], [.72, .68], [.46, .36], [.34, .3]],
  [DUSK, [.1, .2], [.34, .62], [.14, .66], [-.05, .42]], [DUSK, [.14, .66], [.4, .46], [.62, 1], [.04, 1]],
  [DUSK, [.5, .62], [.6, .52], [.84, 1], [.62, 1]], [ICE, [.46, 1], [.66, .72], [.88, 1]],
  [ICE, [.2, 1], [.3, .8], [.42, 1]], [CREAM, [.16, .44], [.3, .4], [.22, .74]], [CREAM, [.5, .46], [.6, .52], [.55, .8]],
  [CREAM, [0, 0], [.34, .3], [.2, .25], [.15, .37], [.05, .24], [-.04, .35], [-.13, .26], [-.22, .2]],
];

// One faceted peak: sunlit left face, blue shaded right face, snow cap on top.
function peak(parent, x, top, base, left, right) {
  const at = ([across, down]) => [x + across * (across < 0 ? left : right), top + (base - top) * down];
  poly(parent, CREAM, [[-1, 1], [-.66, .55], [-.5, .5], [-.22, .2], [0, 0], [.34, .3], [.46, .36], [.72, .68], [1, 1]].map(at));
  for (const [fill, ...points] of FACETS) poly(parent, fill, points.map(at));
}

function wisp(parent, x, y, width) {
  shape('path', { d: `M${x} ${y}C${x + width * .3} ${y - 9} ${x + width * .66} ${y - 12} ${x + width} ${y - 2}C${x + width * .7} ${y + 5} ${x + width * .34} ${y + 13} ${x} ${y}Z`, fill: CREAM }, parent);
}

function mountains(parent) {
  peak(parent, 470, 120, 420, 230, 250);
  peak(parent, 1180, 110, 420, 250, 240);
  peak(parent, 150, 200, 420, 190, 210);
  peak(parent, 1460, 190, 420, 200, 180);
  peak(parent, 810, 30, 420, 330, 320);
  wisp(parent, 196, 214, 250); wisp(parent, 604, 136, 300); wisp(parent, 1010, 176, 230); wisp(parent, 1300, 250, 210);
}

function leftVillage(parent) {
  pine(parent, 116, 306, 214, DEEP); pine(parent, 226, 300, 150, GREEN);
  roofHouse(parent, 350, 306, 136, 88, { roof: '#8f6a55' });
  pine(parent, 472, 300, 116, DEEP);
  roofHouse(parent, 568, 312, 104, 70, { roof: '#6f8f86', wall: '#ead9bb' });
  fence(parent, 230, 334, 5);
  shape('path', { d: 'M20 356C80 318 210 322 380 316S600 306 660 356Z', fill: SNOW }, parent);
}

function rightVillage(parent) {
  pine(parent, 104, 330, 160, GREEN);
  roofHouse(parent, 216, 330, 128, 84, { roof: '#6f8f86', wall: '#ead9bb' });
  church(parent, 392, 322);
  roofHouse(parent, 620, 332, 128, 82, { roof: '#a8564c' });
  pine(parent, 720, 336, 176, DEEP);
  shape('path', { d: 'M24 376C110 336 300 346 460 334S760 326 816 376Z', fill: SNOW }, parent);
}

function ground(parent) {
  shape('path', { d: 'M0 74C200 30 420 100 640 66S1060 18 1280 64 1500 88 1600 52V460H0Z', fill: '#f8f3e8' }, parent);
  shape('path', { d: 'M760 460C840 330 1010 250 1240 190 1330 170 1500 170 1600 130V460Z', fill: '#e4edf0' }, parent);
  shape('path', { d: 'M0 280C150 240 300 270 420 320S520 420 560 460H0Z', fill: '#e9eff0' }, parent);
  shape('path', { d: 'M0 176C210 138 400 176 600 160S980 120 1180 152 1480 180 1600 150V206C1420 226 1260 196 1040 206S640 214 420 224 150 204 0 232Z', fill: '#f2eee4' }, parent);
}

function midGround(parent) {
  pine(parent, 86, 196, 104, GREEN); pine(parent, 148, 204, 72, DEEP);
  // Sled on the snow: runners touch the base line, gifts sit on the deck.
  shape('path', { d: 'M226 208H372C392 208 404 196 410 184', stroke: '#a9845b', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('path', { d: 'M250 208V188M348 208V188', stroke: '#a9845b', 'stroke-width': 6, fill: 'none' }, parent);
  shape('path', { d: 'M232 172H384L372 192H244Z', fill: '#a8564c' }, parent);
  shape('rect', { x: 254, y: 136, width: 50, height: 38, rx: 4, fill: '#e9d9b8' }, parent);
  shape('rect', { x: 272, y: 136, width: 12, height: 38, fill: '#b5625a' }, parent);
  shape('rect', { x: 310, y: 148, width: 44, height: 26, rx: 4, fill: '#8aa9ad' }, parent);
  shape('rect', { x: 326, y: 148, width: 10, height: 26, fill: '#f3e7cf' }, parent);
}

function pond(parent) {
  shape('path', { d: 'M40 90C70 40 190 26 300 38S490 54 500 92 390 142 260 142 20 130 40 90Z', fill: '#b9d3dc' }, parent);
  shape('path', { d: 'M120 70C170 56 240 54 300 60M180 104C240 112 310 110 380 96', stroke: '#e5f0f3', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

// A soft blue hollow in a snow drift, the shading the hand-painted banks had.
function hollow(parent, x, y, width, height, fill = ICE) {
  shape('path', { d: `M${x - width} ${y}C${x - width * .6} ${y - height} ${x - width * .1} ${y - height * 1.1} ${x + width * .3} ${y - height * .5}S${x + width * .8} ${y - height * .2} ${x + width} ${y}C${x + width * .5} ${y + height * .3} ${x - width * .5} ${y + height * .3} ${x - width} ${y}Z`, fill }, parent);
}

function nearLeft(parent) {
  pine(parent, 196, 400, 340, DEEP); pine(parent, 366, 416, 190, GREEN);
  fence(parent, 432, 424, 4, 26); berryBush(parent, 300, 432);
}

function nearRight(parent) {
  lamp(parent, 86, 420); pine(parent, 312, 398, 320, DEEP); pine(parent, 176, 420, 150, GREEN);
}

// The stage's front lip: two low drifts just overlap Santa's and the reindeer's boots.
const BANK = 'M10 196C44 160 74 104 134 88 194 72 232 118 272 114 322 108 362 52 424 46 486 44 536 136 562 196 390 206 186 206 10 196Z';
function stageBank(parent) {
  shape('path', { d: BANK, fill: SNOW }, parent);
  hollow(parent, 170, 164, 100, 42); hollow(parent, 410, 150, 112, 58); hollow(parent, 300, 186, 74, 24);
  hollow(parent, 176, 170, 58, 20, '#afcbdd'); hollow(parent, 424, 160, 62, 28, '#afcbdd');
}
const mirrored = draw => parent => draw(shape('g', { transform: 'translate(572 0) scale(-1 1)' }, parent));

function frontBank(parent) {
  const edge = 'M0 120C60 70 130 40 230 64 300 82 340 120 420 118 520 116 560 70 650 66 720 64 770 110 830 112 900 114 960 60 1060 52 1150 46 1230 90 1300 96 1380 102 1450 60 1530 48 1560 44 1580 46 1600 50V270H0Z';
  shape('path', { d: edge, fill: SHADE, transform: 'translate(0 10)' }, parent);
  shape('path', { d: edge, fill: '#fbf7ee' }, parent);
  for (const [x, y, width, height] of [[210, 170, 170, 76], [640, 150, 120, 56], [1050, 150, 160, 70], [1500, 170, 130, 70]]) hollow(parent, x, y, width, height);
  for (const [x, y, width, height] of [[230, 186, 92, 34], [1076, 170, 88, 32], [1510, 186, 66, 28]]) hollow(parent, x, y, width, height, '#afcbdd');
}

function mountTitle(host) {
  const paper = { scale: 2.3, rim: '#fbf3e3', shadow: .24, grain: .5 };
  const palette = ['#a84a42', '#b5604a', '#4f7d68', '#a84a42', '#c08a3e'];
  paperLayer(host, TITLE_BOX, '', parent => { holly(parent, 66, 82, 1.1); star(parent, 690, 72, 22); star(parent, 42, 300, 13); }, { paper, eager: true });
  titleGlyphs.forEach(({ d, pivot }, index) => {
    const letter = paperLayer(host, TITLE_BOX, 'title-letter', parent => shape('path', { d, fill: palette[index % palette.length] }, parent), { paper, origin: pivot, eager: true });
    letter.style.animationDelay = `${-(index * 1.37) % 3.4}s`;
  });
}

export function mountHomeScene(root) {
  const stage = root.querySelector('#story-stage');
  mountTitle(root.querySelector('[data-title-art]'));
  const paper = { scale: 1.3, grain: .6 }, wide = { ...paper, grain: .4, shadow: .16 }, none = { preserveAspectRatio: 'none' };
  popLayer(stage, '-6 -6 232 232', 'home-sun', sun, { delay: 0, paper });
  popLayer(stage, '-20 0 270 116', 'home-cloud home-cloud-a', parent => cloud(parent, 120, 62, 1.15), { delay: .1, paper });
  popLayer(stage, '-20 0 270 116', 'home-cloud home-cloud-b', parent => cloud(parent, 120, 62, 1.15), { delay: .3, paper });
  popLayer(stage, '-20 0 270 116', 'home-cloud home-cloud-c', parent => cloud(parent, 120, 62, 1.15), { delay: .45, paper });
  popLayer(stage, '0 0 1600 420', 'home-far', mountains, { delay: .25, paper: wide });
  popLayer(stage, '0 0 680 366', 'home-village-left', leftVillage, { delay: .75, paper });
  popLayer(stage, '0 0 840 386', 'home-village-right', rightVillage, { delay: .95, paper });
  popLayer(stage, '0 0 1600 460', 'home-ground', ground, { delay: .5, paper: wide, ...none });
  popLayer(stage, '0 0 540 170', 'home-pond', pond, { delay: 1.1, paper: { ...paper, grain: .35, shadow: .08 } });
  popLayer(stage, '0 0 440 230', 'home-mid', midGround, { delay: 1.25, paper });
  popLayer(stage, '0 0 572 452', 'home-near-left', nearLeft, { delay: 1.45, paper });
  popLayer(stage, '0 0 520 452', 'home-near-right', nearRight, { delay: 1.6, paper });
  popLayer(stage, '0 0 572 224', 'home-bank home-bank-left', stageBank, { delay: 1.7, paper });
  popLayer(stage, '0 0 572 224', 'home-bank home-bank-right', mirrored(stageBank), { delay: 1.75, paper });
  popLayer(stage, '0 0 1600 270', 'home-front', frontBank, { delay: 1.85, paper: wide, ...none });
  const images = [...root.querySelectorAll('.pop img, .title-motion img')].map(image => image.decode().catch(() => {}));
  return Promise.race([Promise.all(images), new Promise(resolve => setTimeout(resolve, 1500))]);
}
