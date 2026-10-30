// Home pop-up book: a village on snowy hills. Sun at upper left; every building meets the snow.
import { paperLayer, popLayer, shape } from './paper-art.js';
import { SHADE, SNOW, berryBush, church, cloud, fence, holly, lamp, pine, roofHouse, star } from './paper-props.js';
import { TITLE_BOX, titleGlyphs } from '../data/title-glyphs.js';

const GREEN = '#5f8a70', DEEP = '#4f7a65', FAR = '#9dbab8';

function sun(parent) {
  for (let index = 0; index < 12; index++) shape('path', { d: 'M110 16L120 46H100Z', fill: '#f3dca6', transform: `rotate(${index * 30} 110 110)` }, parent);
  shape('circle', { cx: 110, cy: 110, r: 54, fill: '#f2cf86' }, parent);
}

function farHills(parent) {
  shape('path', { d: 'M0 150C180 84 330 150 520 118S820 60 1040 110 1400 150 1600 90V300H0Z', fill: '#bfd5de' }, parent);
  for (let x = 40; x < 1600; x += 58) pine(parent, x + (x % 7) * 3, 150 + Math.sin(x / 190) * 22, 40 + (x % 5) * 6, FAR, '#eef3f3');
  shape('path', { d: 'M0 214C220 164 420 226 700 188S1200 160 1600 200V300H0Z', fill: '#dce8ea' }, parent);
}

function leftVillage(parent) {
  pine(parent, 86, 306, 214, DEEP); pine(parent, 196, 300, 150, GREEN);
  roofHouse(parent, 330, 306, 136, 88, { roof: '#8f6a55' });
  pine(parent, 452, 300, 116, DEEP);
  roofHouse(parent, 538, 312, 104, 70, { roof: '#6f8f86', wall: '#ead9bb' });
  fence(parent, 200, 334, 5);
  shape('path', { d: 'M0 360V312C110 296 250 322 380 312S560 300 640 322V360Z', fill: SNOW }, parent);
}

function rightVillage(parent) {
  pine(parent, 70, 330, 160, GREEN);
  roofHouse(parent, 186, 330, 128, 84, { roof: '#6f8f86', wall: '#ead9bb' });
  church(parent, 362, 322);
  roofHouse(parent, 590, 332, 128, 82, { roof: '#a8564c' });
  pine(parent, 690, 336, 176, DEEP);
  shape('path', { d: 'M0 380V340C150 318 300 344 460 330S680 322 760 340V380Z', fill: SNOW }, parent);
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

function nearLeft(parent) {
  pine(parent, 136, 392, 340, DEEP); pine(parent, 306, 408, 190, GREEN);
  fence(parent, 372, 416, 5, 26); berryBush(parent, 236, 424);
  shape('path', { d: 'M0 440V372C110 356 250 392 360 402S480 410 520 440Z', fill: SNOW }, parent);
}

function nearRight(parent) {
  lamp(parent, 86, 408); pine(parent, 312, 386, 320, DEEP); pine(parent, 176, 410, 150, GREEN);
  shape('path', { d: 'M460 440V360C340 352 200 392 90 402S20 416 0 440Z', fill: SNOW }, parent);
}

function frontBank(parent) {
  shape('path', { d: 'M0 96C160 44 330 110 520 84S830 40 1040 86 1400 110 1600 58V170H0Z', fill: SHADE, transform: 'translate(0 12)' }, parent);
  shape('path', { d: 'M0 96C160 44 330 110 520 84S830 40 1040 86 1400 110 1600 58V170H0Z', fill: '#fbf7ee' }, parent);
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
  popLayer(stage, '0 0 220 220', 'home-sun', sun, { delay: 0, paper });
  popLayer(stage, '0 0 240 110', 'home-cloud home-cloud-a', parent => cloud(parent, 120, 62, 1.15), { delay: .1, paper });
  popLayer(stage, '0 0 240 110', 'home-cloud home-cloud-b', parent => cloud(parent, 120, 62, 1.15), { delay: .3, paper });
  popLayer(stage, '0 0 240 110', 'home-cloud home-cloud-c', parent => cloud(parent, 120, 62, 1.15), { delay: .45, paper });
  popLayer(stage, '0 0 1600 300', 'home-far', farHills, { delay: .25, paper: wide, ...none });
  popLayer(stage, '0 0 640 360', 'home-village-left', leftVillage, { delay: .75, paper });
  popLayer(stage, '0 0 760 380', 'home-village-right', rightVillage, { delay: .95, paper });
  popLayer(stage, '0 0 1600 460', 'home-ground', ground, { delay: .5, paper: wide, ...none });
  popLayer(stage, '0 0 540 150', 'home-pond', pond, { delay: 1.1, paper: { ...paper, grain: .35, shadow: .08 } });
  popLayer(stage, '0 0 440 220', 'home-mid', midGround, { delay: 1.25, paper });
  popLayer(stage, '0 0 520 440', 'home-near-left', nearLeft, { delay: 1.45, paper });
  popLayer(stage, '0 0 460 440', 'home-near-right', nearRight, { delay: 1.6, paper });
  popLayer(stage, '0 0 1600 170', 'home-front', frontBank, { delay: 1.8, paper: wide, ...none });
  const images = [...root.querySelectorAll('.pop img, .title-motion img')].map(image => image.decode().catch(() => {}));
  return Promise.race([Promise.all(images), new Promise(resolve => setTimeout(resolve, 1500))]);
}
