// Game hero stage: a snowy funfair instead of Home's village. Same paper, same light direction.
import { paperLayer, popLayer, shape } from './paper-art.js';
import { SHADE, SNOW, cloud, facetedPeak, fence, pine, star } from './paper-props.js';
import { mountCoaster, trackLine as smoothLine } from './game-coaster.js';

const GREEN = '#5f8a70', DEEP = '#4f7a65', RED = '#b5544c', CREAM = '#f6ecda', GOLD = '#dcae55', TEAL = '#7fa3a8';

// The cord dips where the scene is low (over the balloon and tent, and at the right edge) and stays high over the
// coaster crest and the wheel, so full-size pennants clear them. Each pennant hangs from the cord itself, a little
// different in size, spacing and swing, like a hand-strung paper garland.
const CORD = [[-20, 22], [160, 48], [360, 74], [520, 52], [640, 16], [800, 16], [920, 30], [1040, 28], [1180, 16], [1300, 15], [1440, 32], [1620, 58]];
const jitter = (index, salt) => { const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453; return value - Math.floor(value); };
function bunting(parent) {
  const flags = [RED, CREAM, GREEN, GOLD, TEAL], cord = smoothLine(CORD, 16);
  const cordY = x => {
    const index = Math.max(1, cord.findIndex(point => point[0] >= x)), [x1, y1] = cord[index - 1], [x2, y2] = cord[index];
    return y1 + (y2 - y1) * (x - x1) / ((x2 - x1) || 1);
  };
  shape('path', { d: `M${cord.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`, stroke: '#a9845b', 'stroke-width': 4, fill: 'none' }, parent);
  for (let index = 0; index < 22; index++) {
    const size = .9 + jitter(index, 2) * .2, half = 26 * size, drop = 62 * size, swing = (jitter(index, 3) - .5) * .24;
    const x = (index + .5) / 22 * 1600 + (jitter(index, 1) - .5) * 16, y1 = cordY(x - half), y2 = cordY(x + half);
    // Both top corners sit on the cord; the tip hangs square to that edge, then swings a few degrees.
    const run = Math.hypot(half * 2, y2 - y1), downX = -(y2 - y1) / run, downY = half * 2 / run;
    const tipX = x + (downX * Math.cos(swing) - downY * Math.sin(swing)) * drop, tipY = (y1 + y2) / 2 + (downX * Math.sin(swing) + downY * Math.cos(swing)) * drop;
    shape('path', { d: `M${(x - half).toFixed(1)} ${y1.toFixed(1)}L${(x + half).toFixed(1)} ${y2.toFixed(1)}L${tipX.toFixed(1)} ${tipY.toFixed(1)}Z`, fill: flags[index % flags.length] }, parent);
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

// Riders take turns in the basket. Each is drawn down to the basket rim; the basket front is a separate sheet on top.
const SKIN = '#f2c9a8', INK = '#4b3d38', CHEEK = '#e8a093';
const face = (parent, cx, cy, eye = INK) => {
  for (const dx of [-5, 5]) shape('circle', { cx: cx + dx, cy, r: 1.8, fill: eye }, parent);
  shape('path', { d: `M${cx - 4} ${cy + 6}Q${cx} ${cy + 10} ${cx + 4} ${cy + 6}`, stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }, parent);
};
const RIDERS = [
  ['小精靈', parent => {
    shape('path', { d: 'M88 206C88 192 112 192 112 206V230H88Z', fill: SKIN }, parent);
    shape('path', { d: 'M86 202L104 162L114 204Z', fill: GREEN }, parent);
    shape('path', { d: 'M84 200C94 196 106 196 116 200L116 206C106 202 94 202 84 206Z', fill: '#fbf8f1' }, parent);
    shape('circle', { cx: 104, cy: 160, r: 5, fill: RED }, parent);
    shape('path', { d: 'M88 210L80 204L88 216ZM112 210L120 204L112 216Z', fill: '#e8b896' }, parent);
    face(parent, 100, 212);
  }],
  ['雪人', parent => {
    shape('circle', { cx: 100, cy: 210, r: 15, fill: '#fbf7ee' }, parent);
    shape('path', { d: 'M86 190H114M91 190L92 168H108L109 190Z', fill: '#5a4a44', stroke: '#5a4a44', 'stroke-width': 4, 'stroke-linejoin': 'round' }, parent);
    shape('path', { d: 'M100 211L114 214L100 216Z', fill: '#d98a4e' }, parent);
    face(parent, 100, 206);
    shape('path', { d: 'M86 224C94 228 106 228 114 224V230H86Z', fill: RED }, parent);
  }],
  ['麋鹿', parent => {
    shape('path', { d: 'M90 194L80 174M84 182L74 180M110 194L120 174M116 182L126 180', stroke: '#8a6a55', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
    shape('path', { d: 'M86 200L74 194L86 206ZM114 200L126 194L114 206Z', fill: '#b98a5a' }, parent);
    shape('path', { d: 'M86 210C86 192 114 192 114 210V230H86Z', fill: '#c99a68' }, parent);
    shape('ellipse', { cx: 100, cy: 218, rx: 9, ry: 7, fill: '#e9cfae' }, parent);
    face(parent, 100, 206);
    shape('circle', { cx: 100, cy: 216, r: 4, fill: '#c7473f' }, parent);
  }],
  ['企鵝', parent => {
    shape('path', { d: 'M84 214C84 188 116 188 116 214V230H84Z', fill: '#34404c' }, parent);
    shape('path', { d: 'M90 216C90 200 110 200 110 216V230H90Z', fill: '#fbf8f1' }, parent);
    face(parent, 100, 208);
    shape('path', { d: 'M96 213L104 213L100 219Z', fill: '#e0a040' }, parent);
    shape('path', { d: 'M86 196C92 180 108 180 114 196Z', fill: RED }, parent);
    shape('path', { d: 'M84 196H116', stroke: '#fbf8f1', 'stroke-width': 5, 'stroke-linecap': 'round' }, parent);
    shape('circle', { cx: 118, cy: 186, r: 4, fill: '#fbf8f1' }, parent);
  }],
  ['薑餅人', parent => {
    shape('circle', { cx: 100, cy: 208, r: 15, fill: '#b9783f' }, parent);
    shape('path', { d: 'M88 230C88 222 112 222 112 230Z', fill: '#b9783f' }, parent);
    face(parent, 100, 205, '#fbf8f1');
    shape('path', { d: 'M88 199Q100 192 112 199', stroke: '#fbf8f1', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none', 'stroke-dasharray': '3 3' }, parent);
    for (const cx of [93, 107]) shape('circle', { cx, cy: 213, r: 2.2, fill: CHEEK }, parent);
  }],
];
function basketFront(parent) {
  shape('rect', { x: 78, y: 226, width: 44, height: 30, rx: 5, fill: '#a98c6f' }, parent);
  shape('path', { d: 'M80 236H120', stroke: '#8a6a55', 'stroke-width': 2 }, parent);
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

// Tap the balloon: it rises until the basket clears the peaks, a different rider waves, then it sinks back behind the mountain.
// Only an inner wrapper moves: the outer sheet keeps its opening pop, which would replay if its own animation were swapped.
function mountBalloonRide(flight, paper) {
  const wrap = document.createElement('div'); wrap.className = 'balloon-flight';
  wrap.append(...flight.childNodes); flight.append(wrap);
  const riders = RIDERS.map(([name, draw]) => {
    const layer = paperLayer(wrap, '0 0 200 270', 'balloon-rider', draw, { paper, eager: true, origin: [100, 230] });
    layer.dataset.name = name; return layer;
  });
  paperLayer(wrap, '0 0 200 270', 'balloon-basket', basketFront, { paper, eager: true });
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'balloon-tap'; button.setAttribute('aria-label', '點熱氣球，看看這次誰坐在籃子裡');
  wrap.append(button);
  const live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('role', 'status'); flight.after(live);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let turn = Math.floor(Math.random() * riders.length), timer = 0;
  const land = () => { clearTimeout(timer); timer = 0; wrap.classList.remove('is-flying', 'is-up'); };
  button.addEventListener('click', () => {
    if (wrap.classList.contains('is-flying') || wrap.classList.contains('is-up')) return;
    // The swap happens while the basket is still behind the mountain, so nobody sees the riders change seats.
    turn = (turn + 1) % riders.length;
    riders.forEach((rider, index) => rider.classList.toggle('is-riding', index === turn));
    live.textContent = `熱氣球載著${riders[turn].dataset.name}飛起來了！`;
    if (motion.matches) { wrap.classList.add('is-up'); timer = setTimeout(land, 3000); return; }
    wrap.classList.add('is-flying');
  });
  wrap.addEventListener('animationend', event => { if (event.animationName === 'balloon-ride' && event.target === wrap) land(); });
  window.addEventListener('pagehide', land);
}

// Tap the Ferris wheel: it speeds up for about one turn and eases back. The seats share the wheel's timing,
// so changing every playback rate together keeps them hanging upright the whole time.
function mountWheelBoost(ride, spin) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'wheel-tap'; button.setAttribute('aria-label', '點摩天輪，讓它轉快一圈');
  ride.append(button);
  const live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('role', 'status'); ride.after(live);
  const PEAK = 18, UP = 700, HOLD = 1300, DOWN = 1500;
  let frame = 0;
  const spins = () => [spin, ...spin.querySelectorAll('.games-seat')].flatMap(node => node.getAnimations()).filter(a => a.animationName === 'wheel-spin');
  const rate = elapsed => {
    if (elapsed < UP) return 1 + (PEAK - 1) * Math.sin(elapsed / UP * Math.PI / 2);
    if (elapsed < UP + HOLD) return PEAK;
    const t = Math.min(1, (elapsed - UP - HOLD) / DOWN);
    return 1 + (PEAK - 1) * (1 - t) * (1 - t);
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; spins().forEach(a => { a.playbackRate = 1; }); ride.classList.remove('is-whirling'); };
  button.addEventListener('click', () => {
    if (frame) return;
    live.textContent = '摩天輪呼地轉了一大圈！';
    const animations = spins();
    if (!animations.length) return; // Reduced motion keeps the wheel still.
    ride.classList.add('is-whirling');
    const start = performance.now();
    const step = now => {
      const elapsed = now - start, value = rate(elapsed);
      animations.forEach(a => { a.playbackRate = value; });
      if (elapsed < UP + HOLD + DOWN) frame = requestAnimationFrame(step); else stop();
    };
    frame = requestAnimationFrame(step);
  });
  window.addEventListener('pagehide', stop);
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
  mountCoaster(hero, { paper });
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
  mountWheelBoost(ride, spin);
  popLayer(hero, '0 0 1600 300', 'games-ridge', ridge, { delay: .8, paper: wide, ...none });
  popLayer(hero, '0 0 1600 340', 'games-mid', edgePines, { delay: .9, paper: { ...paper, scale: 1.2 } });
  popLayer(hero, '0 0 1600 230', 'games-hero-hill', hill, { delay: 1, paper: wide, ...none });
  popLayer(hero, '0 0 1600 170', 'games-hero-front', front, { delay: 1.5, paper: wide, ...none });
}
