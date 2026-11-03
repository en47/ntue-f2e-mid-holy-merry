// Game hero stage: a snowy funfair instead of Home's village. Same paper, same light direction.
import { paperLayer, popLayer, shape } from './paper-art.js';
import { SHADE, SNOW, cloud, facetedPeak, fence, pine, star } from './paper-props.js';

const GREEN = '#5f8a70', DEEP = '#4f7a65', RED = '#b5544c', CREAM = '#f6ecda', GOLD = '#dcae55', TEAL = '#7fa3a8';

function bunting(parent) {
  const flags = [RED, CREAM, GREEN, GOLD, TEAL];
  shape('path', { d: 'M-10 18C260 92 520 92 800 40S1340 16 1610 70', stroke: '#a9845b', 'stroke-width': 4, fill: 'none' }, parent);
  for (let index = 0; index < 22; index++) {
    const t = (index + .5) / 22, x = t * 1600;
    const y = 18 + Math.sin(t * Math.PI) * 58 - Math.sin(t * Math.PI * 2) * 24;
    shape('path', { d: `M${x - 26} ${y}L${x + 26} ${y + 2}L${x} ${y + 62}Z`, fill: flags[index % flags.length] }, parent);
  }
}

// Same cut as Home's peaks, in cooler tones: a twin summit that frames Santa, with low shoulders.
const PEAK_TONES = { cream: '#f4f2ea', ice: '#cfe0df', sky: '#9fbfc0', dusk: '#7fa3a8' };
function mountains(parent) {
  shape('path', { d: 'M0 430V330C200 300 420 320 640 300S1140 290 1600 330V430Z', fill: '#d9e6e6' }, parent);
  facetedPeak(parent, 150, 210, 430, 230, 250, PEAK_TONES);
  facetedPeak(parent, 1460, 190, 430, 250, 220, PEAK_TONES);
  facetedPeak(parent, 1120, 120, 430, 300, 290, PEAK_TONES);
  facetedPeak(parent, 500, 90, 430, 310, 320, PEAK_TONES);
  facetedPeak(parent, 810, 170, 430, 240, 250, PEAK_TONES);
}

function carousel(parent) {
  shape('path', { d: 'M56 450V204H404V450Z', fill: '#efe0c4' }, parent);
  for (let index = 0; index < 6; index++) {
    const x = 56 + index * 58;
    shape('path', { d: `M${x} 204L230 40L${x + 58} 204Z`, fill: index % 2 ? CREAM : RED }, parent);
    shape('path', { d: `M${x} 204C${x + 14} 238 ${x + 44} 238 ${x + 58} 204Z`, fill: index % 2 ? RED : CREAM }, parent);
  }
  shape('path', { d: 'M230 40V8', stroke: '#8a6a55', 'stroke-width': 6, fill: 'none' }, parent);
  star(parent, 230, 12, 18, GOLD);
  for (const x of [120, 230, 340]) shape('path', { d: `M${x} 232V450`, stroke: GOLD, 'stroke-width': 7, fill: 'none' }, parent);
  // The walls run down behind the snow ridge, so the tent stands in the snow instead of on a floating base.
}

function ferrisStand(parent) {
  shape('path', { d: 'M260 260L128 514H152L260 300L368 514H392Z', fill: '#a98c6f' }, parent);
}

const WHEEL_BOX = '0 0 520 520';
function ferrisWheel(parent) {
  shape('circle', { cx: 260, cy: 260, r: 206, stroke: '#b68f6a', 'stroke-width': 14, fill: 'none' }, parent);
  shape('circle', { cx: 260, cy: 260, r: 146, stroke: '#c9ad8d', 'stroke-width': 7, fill: 'none' }, parent);
  for (let index = 0; index < 8; index++) shape('path', { d: 'M260 260V54', stroke: '#b68f6a', 'stroke-width': 7, transform: `rotate(${index * 45} 260 260)` }, parent);
  shape('circle', { cx: 260, cy: 260, r: 22, fill: GOLD }, parent);
}

function gondola(fill) {
  return parent => {
    shape('path', { d: 'M40 12V30', stroke: '#8a6a55', 'stroke-width': 5, fill: 'none' }, parent);
    shape('path', { d: 'M12 30H68L60 70C50 78 30 78 20 70Z', fill }, parent);
    shape('path', { d: 'M8 32C20 16 60 16 72 32Z', fill: CREAM }, parent);
  };
}

function balloon(parent) {
  shape('path', { d: 'M100 14C40 14 8 62 18 110 26 146 70 178 84 196H116C130 178 174 146 182 110 192 62 160 14 100 14Z', fill: RED }, parent);
  shape('path', { d: 'M100 14C74 14 56 62 62 110 66 146 84 178 92 196H108C116 178 134 146 138 110 144 62 126 14 100 14Z', fill: CREAM }, parent);
  shape('path', { d: 'M100 14C92 30 88 70 92 110 94 146 98 178 100 196 102 178 106 146 108 110 112 70 108 30 100 14Z', fill: GOLD }, parent);
  shape('path', { d: 'M86 196L84 226M114 196L116 226', stroke: '#8a6a55', 'stroke-width': 3, fill: 'none' }, parent);
  shape('rect', { x: 78, y: 226, width: 44, height: 30, rx: 5, fill: '#a98c6f' }, parent);
}

// An elf rides in the basket. The basket is drawn again over the elf, so it sits inside rather than on top.
function rider(parent) {
  shape('path', { d: 'M88 206C88 192 112 192 112 206V226H88Z', fill: '#f2c9a8' }, parent);
  shape('path', { d: 'M86 202L104 162L114 204Z', fill: GREEN }, parent);
  shape('path', { d: 'M84 200C94 196 106 196 116 200L116 206C106 202 94 202 84 206Z', fill: '#fbf8f1' }, parent);
  shape('circle', { cx: 104, cy: 160, r: 5, fill: RED }, parent);
  shape('path', { d: 'M88 210L80 204L88 216ZM112 210L120 204L112 216Z', fill: '#e8b896' }, parent);
  for (const cx of [95, 105]) shape('circle', { cx, cy: 212, r: 1.8, fill: '#4b3d38' }, parent);
  shape('path', { d: 'M96 218Q100 222 104 218', stroke: '#4b3d38', 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }, parent);
  for (const cx of [91, 109]) shape('circle', { cx, cy: 216, r: 2.4, fill: '#e8a093', opacity: .7 }, parent);
  shape('rect', { x: 78, y: 226, width: 44, height: 30, rx: 5, fill: '#a98c6f' }, parent);
  shape('path', { d: 'M80 236H120', stroke: '#8a6a55', 'stroke-width': 2 }, parent);
}
function riderArm(parent) {
  shape('path', { d: 'M112 224L126 206', stroke: GREEN, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('circle', { cx: 127, cy: 204, r: 4, fill: '#f2c9a8' }, parent);
}

function edgePines(parent) {
  pine(parent, 150, 318, 220, DEEP); pine(parent, 300, 324, 140, GREEN);
  fence(parent, 400, 330, 6);
  pine(parent, 1320, 326, 150, GREEN); pine(parent, 1470, 318, 240, DEEP);
  fence(parent, 1060, 334, 7);
  shape('path', { d: 'M0 340C300 318 620 344 900 326S1400 322 1600 338V340Z', fill: SNOW }, parent);
}

function ridge(parent) {
  shape('path', { d: 'M0 52C210 18 420 66 700 40S1190 12 1600 54V300H0Z', fill: '#f1f3ee' }, parent);
  shape('path', { d: 'M900 300C1000 190 1240 120 1600 104V300Z', fill: '#e3edf0' }, parent);
}

const hillPath = 'M0 92C120 40 250 104 390 84 460 36 620 30 700 76 760 28 900 24 980 74 1090 40 1240 96 1340 72 1440 44 1540 92 1600 62V230H0Z';
function hill(parent) {
  shape('path', { d: hillPath, fill: SHADE, transform: 'translate(0 12)' }, parent);
  shape('path', { d: hillPath, fill: '#faf6ec' }, parent);
  shape('path', { d: 'M820 230C900 150 1060 120 1200 124S1500 120 1600 96V230Z', fill: '#e2ecf0' }, parent);
  shape('path', { d: 'M0 150C130 118 280 138 400 176S520 214 560 230H0Z', fill: '#ebf0f0' }, parent);
}

const frontPath = 'M0 84C140 34 300 104 470 78S760 26 960 76 1330 100 1600 46V170H0Z';
function front(parent) {
  shape('path', { d: frontPath, fill: SHADE, transform: 'translate(0 10)' }, parent);
  shape('path', { d: frontPath, fill: '#fcf8ef' }, parent);
  shape('path', { d: 'M640 170C760 110 960 96 1130 104S1460 96 1600 66V170Z', fill: '#e6eef1' }, parent);
}

// Tap the balloon: it lifts clear of the peaks so the elf in the basket can wave, then drifts back down and bobs again.
function mountBalloonRide(flight, paper) {
  paperLayer(flight, '0 0 200 270', 'balloon-rider', rider, { paper, eager: true });
  paperLayer(flight, '0 0 200 270', 'balloon-arm', riderArm, { paper, eager: true, origin: [112, 224] });
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'balloon-tap'; button.setAttribute('aria-label', '點熱氣球，看看誰坐在籃子裡');
  flight.append(button);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;
  const land = () => { clearTimeout(timer); timer = 0; flight.classList.remove('is-flying', 'is-up'); };
  button.addEventListener('click', () => {
    if (flight.classList.contains('is-flying') || flight.classList.contains('is-up')) return;
    if (motion.matches) { flight.classList.add('is-up'); timer = setTimeout(land, 3000); return; }
    flight.classList.add('is-flying');
  });
  flight.addEventListener('animationend', event => { if (event.animationName === 'balloon-ride' && event.target === flight) land(); });
  window.addEventListener('pagehide', land);
}

export function mountGameScene(hero) {
  const paper = { scale: 1.3, grain: .6 }, wide = { ...paper, grain: .4, shadow: .16 }, none = { preserveAspectRatio: 'none' };
  popLayer(hero, '0 0 1600 170', 'games-bunting', bunting, { delay: .15, paper });
  popLayer(hero, '-20 0 270 116', 'games-cloud games-cloud-a', parent => cloud(parent, 120, 62, 1.15), { delay: .1, paper });
  popLayer(hero, '-20 0 270 116', 'games-cloud games-cloud-b', parent => cloud(parent, 120, 62, 1.15), { delay: .3, paper });
  const flight = popLayer(hero, '0 0 200 270', 'games-balloon', balloon, { delay: .4, paper });
  flight.dataset.float = '';
  mountBalloonRide(flight, paper);
  popLayer(hero, '0 0 1600 430', 'games-far', mountains, { delay: .2, paper: wide });
  popLayer(hero, '0 -14 460 464', 'games-carousel', carousel, { delay: .55, paper });
  const ride = popLayer(hero, '0 0 520 540', 'games-ferris', ferrisStand, { delay: .7, paper });
  const spin = document.createElement('div');
  spin.className = 'games-wheel';
  ride.prepend(spin);
  popLayer(spin, WHEEL_BOX, 'games-wheel-art', ferrisWheel, { paper });
  const colours = [RED, TEAL, GOLD, GREEN];
  for (let index = 0; index < 8; index++) {
    const seat = document.createElement('div'), angle = index * Math.PI / 4;
    seat.className = 'games-seat';
    seat.style.left = `${50 + Math.sin(angle) * 39.6}%`; seat.style.top = `${50 - Math.cos(angle) * 39.6}%`;
    popLayer(seat, '0 0 80 90', 'games-seat-art', gondola(colours[index % 4]), { paper: { scale: .8, grain: .5 } });
    spin.append(seat);
  }
  popLayer(hero, '0 0 1600 300', 'games-ridge', ridge, { delay: .8, paper: wide, ...none });
  popLayer(hero, '0 0 1600 340', 'games-mid', edgePines, { delay: .9, paper: { ...paper, scale: 1.2 } });
  popLayer(hero, '0 0 1600 230', 'games-hero-hill', hill, { delay: 1, paper: wide, ...none });
  popLayer(hero, '0 0 1600 170', 'games-hero-front', front, { delay: 1.5, paper: wide, ...none });
}
