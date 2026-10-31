// Home pop-up book: a village under faceted snow peaks. Sun at upper left; every building meets the snow.
import { paperLayer, popLayer, shape } from './paper-art.js';
import { SHADE, SNOW, airmailLetter, berryBush, church, cloud, fence, holly, lamp, pine, roofHouse, star } from './paper-props.js';
import { TITLE_BOX, titleGlyphs } from '../data/title-glyphs.js';
import { taglinePath } from '../data/tagline-glyphs.js';

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

// One unbroken snowfield behind the villages, so no peak shows through under a building.
function snowfield(parent) {
  shape('path', { d: 'M0 34C180 14 340 40 560 28S980 12 1200 30 1460 40 1600 22V400H0Z', fill: '#f8f3e8' }, parent);
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
  hollow(parent, 170, 168, 104, 52, '#bcd5e4'); hollow(parent, 412, 156, 118, 72, '#bcd5e4'); hollow(parent, 298, 190, 78, 26, '#bcd5e4');
  hollow(parent, 176, 176, 62, 26, '#9fc0d6'); hollow(parent, 426, 168, 68, 38, '#9fc0d6');
}
const mirrored = draw => parent => draw(shape('g', { transform: 'translate(572 0) scale(-1 1)' }, parent));

function frontBank(parent) {
  const edge = 'M0 120C60 70 130 40 230 64 300 82 340 120 420 118 520 116 560 70 650 66 720 64 770 110 830 112 900 114 960 60 1060 52 1150 46 1230 90 1300 96 1380 102 1450 60 1530 48 1560 44 1580 46 1600 50V270H0Z';
  shape('path', { d: edge, fill: SHADE, transform: 'translate(0 10)' }, parent);
  shape('path', { d: edge, fill: '#fbf7ee' }, parent);
  for (const [x, y, width, height] of [[210, 170, 170, 76], [640, 150, 120, 56], [1050, 150, 160, 70], [1500, 170, 130, 70]]) hollow(parent, x, y, width, height);
  for (const [x, y, width, height] of [[230, 186, 92, 34], [1076, 170, 88, 32], [1510, 186, 66, 28]]) hollow(parent, x, y, width, height, '#afcbdd');
}

function bookIcon(parent) {
  shape('path', { d: 'M38 52C50 44 62 46 68 52 74 46 86 44 98 52V84C86 76 74 78 68 84 62 78 50 76 38 84Z', fill: '#fbf3e3' }, parent);
  shape('path', { d: 'M68 52V84', stroke: '#b98a55', 'stroke-width': 3, fill: 'none' }, parent);
  shape('path', { d: 'M46 58C52 55 58 56 62 59M46 66C52 63 58 64 62 67M74 59C78 56 84 55 90 58M74 67C78 64 84 63 90 66', stroke: '#c9b18c', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

function envelopeIcon(parent) {
  shape('rect', { x: 38, y: 50, width: 60, height: 40, rx: 4, fill: '#fbf3e3' }, parent);
  shape('path', { d: 'M38 53L68 74 98 53', stroke: '#c9b18c', 'stroke-width': 3, 'stroke-linejoin': 'round', fill: 'none' }, parent);
  shape('path', { d: 'M68 84C56 74 58 66 63 66 66 66 68 69 68 69S70 66 73 66C78 66 80 74 68 84Z', fill: '#c0574d' }, parent);
}

function buttonArt(fill, edge, icon) {
  const body = 'M34 28C110 22 250 22 326 28 338 29 344 36 343 46 341 58 341 68 343 78 344 88 338 95 326 96 250 100 110 100 34 96 22 95 16 88 17 78 19 68 19 58 17 46 16 36 22 29 34 28Z';
  return parent => {
    shape('path', { d: body, fill: edge, transform: 'translate(0 6)' }, parent);
    shape('path', { d: body, fill }, parent);
    shape('rect', { x: 28, y: 37, width: 304, height: 52, rx: 15, fill: 'none', stroke: '#fff3dc', 'stroke-opacity': .6, 'stroke-width': 2, 'stroke-dasharray': '9 7' }, parent);
    icon(parent);
    shape('path', { d: 'M24 34C60 20 120 20 176 25 172 34 158 37 150 32 142 42 124 42 118 33 106 41 90 40 84 33 70 41 44 42 24 34Z', fill: SNOW }, parent);
    holly(parent, 322, 30, .44);
  };
}

// A little wooden board hung from the top of the stage on two ribbons, capped with snow.
function calendarArt(parent) {
  shape('path', { d: 'M108 0V44M268 0V44', stroke: '#a84a42', 'stroke-width': 4, fill: 'none' }, parent);
  const board = 'M20 40C120 35 260 35 360 40 368 41 372 47 372 54 370 90 370 130 372 164 372 172 366 177 358 177 260 181 120 181 22 177 12 177 8 171 8 164 10 130 10 90 8 54 8 47 12 41 20 40Z';
  shape('path', { d: board, fill: '#856a50', transform: 'translate(0 5)' }, parent);
  shape('path', { d: board, fill: '#b08f6c' }, parent);
  shape('rect', { x: 19, y: 50, width: 342, height: 118, rx: 8, fill: '#fbf3e3' }, parent);
  shape('rect', { x: 23, y: 54, width: 334, height: 110, rx: 6, fill: 'none', stroke: '#d9c5a2', 'stroke-width': 1.6, 'stroke-dasharray': '7 6' }, parent);
  shape('path', { d: 'M8 46C100 28 280 28 372 46 372 56 356 60 346 54 334 66 312 62 304 52 288 62 262 60 252 50 232 58 208 56 198 48 176 58 150 58 138 50 122 62 96 60 86 50 72 62 48 60 40 52 28 60 10 58 8 46Z', fill: SNOW }, parent);
  shape('path', { d: 'M188 40C170 22 146 26 150 42 152 54 174 50 188 42 202 50 224 54 226 42 230 26 206 22 188 40Z', fill: '#a84a42' }, parent);
  shape('path', { d: 'M184 46L170 70 182 66 188 74 192 66 206 70 192 46Z', fill: '#8f3e37' }, parent);
  shape('circle', { cx: 188, cy: 42, r: 8, fill: '#c0574d' }, parent);
  holly(parent, 42, 44, .52); holly(parent, 338, 44, .46);
}

// A paper ribbon under the title: folded tails behind, stitched band in front, words cut from cream paper.
function ribbon(parent) {
  for (const flip of [1, -1]) {
    const tail = shape('g', { transform: flip < 0 ? 'translate(820 0) scale(-1 1)' : '' }, parent);
    shape('path', { d: 'M86 58H22L44 92 18 126H112V94Z', fill: '#853a34' }, tail);
    shape('path', { d: 'M86 94H112V112Z', fill: '#5f2a26' }, tail);
  }
  shape('path', { d: 'M82 24C220 14 600 14 738 24 744 46 744 78 738 100 600 110 220 110 82 100 76 78 76 46 82 24Z', fill: '#a84a42' }, parent);
  shape('path', { d: 'M92 34C230 25 590 25 728 34M92 90C230 99 590 99 728 90', stroke: '#fff3dc', 'stroke-opacity': .6, 'stroke-width': 2.5, 'stroke-dasharray': '10 8', fill: 'none' }, parent);
  shape('path', { d: 'M54 24C100 12 150 14 196 19 192 28 178 31 170 26 160 36 142 34 136 27 124 35 108 33 102 27 88 34 66 34 54 24Z', fill: SNOW }, parent);
  holly(parent, 738, 28, .5); star(parent, 96, 62, 11); star(parent, 724, 62, 11);
}

function mountDecor(root) {
  const flat = { scale: .8, grain: .5, shadow: .28 };
  const [explore, wish] = root.querySelectorAll('.paper-button');
  paperLayer(explore, '0 0 360 116', 'button-art', buttonArt('#4a7560', '#3a5e4d', bookIcon), { paper: flat, eager: true, preserveAspectRatio: 'none' });
  paperLayer(wish, '0 0 360 116', 'button-art', buttonArt('#a84a42', '#853a34', envelopeIcon), { paper: flat, eager: true, preserveAspectRatio: 'none' });
  paperLayer(root.querySelector('.countdown'), '0 0 380 206', 'calendar-art', calendarArt, { paper: { scale: .8, grain: .5, shadow: .26 }, eager: true, preserveAspectRatio: 'none' });
  const letter = { paper: { scale: .8, grain: .35, shadow: .24 }, eager: true, preserveAspectRatio: 'none' };
  paperLayer(root.querySelector('#santa-letter .letter-body'), '0 0 380 300', 'letter-art', airmailLetter('#a84a42', '#4f7d68'), letter);
  paperLayer(root.querySelector('#reindeer-letter .letter-body'), '0 0 380 300', 'letter-art', airmailLetter('#4f7d68', '#c08a3e'), letter);
}

function mountTagline(host) {
  paperLayer(host, '0 0 820 150', '', ribbon, { paper: { scale: .9, grain: .45, shadow: .24 }, eager: true });
  paperLayer(host, '0 0 820 150', 'tagline-words', parent => shape('path', { d: taglinePath, fill: '#fff9ec', transform: 'translate(50 -4)' }, parent), { paper: null, eager: true });
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
  mountTagline(root.querySelector('[data-tagline-art]'));
  mountDecor(root);
  const paper = { scale: 1.3, grain: .6 }, wide = { ...paper, grain: .4, shadow: .16 }, none = { preserveAspectRatio: 'none' };
  popLayer(stage, '-6 -6 232 232', 'home-sun', sun, { delay: 0, paper });
  popLayer(stage, '-20 0 270 116', 'home-cloud home-cloud-a', parent => cloud(parent, 120, 62, 1.15), { delay: .1, paper });
  popLayer(stage, '-20 0 270 116', 'home-cloud home-cloud-b', parent => cloud(parent, 120, 62, 1.15), { delay: .3, paper });
  popLayer(stage, '-20 0 270 116', 'home-cloud home-cloud-c', parent => cloud(parent, 120, 62, 1.15), { delay: .45, paper });
  popLayer(stage, '0 0 1600 420', 'home-far', mountains, { delay: .25, paper: wide });
  popLayer(stage, '0 0 1600 400', 'home-snowfield', snowfield, { delay: .4, paper: wide, ...none });
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
