// Game hero coaster: a wooden track in front of the far mountains, behind the tent, Santa and the wheel.
// It uses the far mountains' units (x 0–1600, their base at y 430); the box reaches 200 units higher for the sky
// and 90 lower, so the trestle feet always end behind the snow ridge.
// The train runs by itself: in from the left, up the lift hill, down behind Santa, out to the right, then a pause.
import { paperLayer, popLayer, shape } from './paper-art.js';

export const COASTER_BOX = '0 -200 1600 720';
const TOP = -200, WIDTH = 1600, HEIGHT = 720;
// Low and hidden behind the tent, the lift hill and crest in the open sky, the big drop behind Santa,
// a camelback between Santa and the wheel, then through the wheel and off the right edge.
const TRACK = [[-300, 300], [-120, 300], [60, 298], [220, 302], [380, 300], [450, 284], [520, 214], [580, 160], [630, 108], [668, 90], [704, 98],
  [744, 150], [790, 256], [846, 326], [912, 338], [980, 276], [1030, 170], [1072, 128], [1114, 136], [1170, 222], [1240, 304], [1320, 334],
  [1410, 300], [1490, 240], [1560, 236], [1660, 286], [1800, 304], [1960, 306]];
const LIFT_FROM = 450, CRUISE = 420, LIFT = 150, GRAVITY = 820, DRAG = .00012;
export const CAR_GAP = 56, CARS = 3, PAUSE = 4000;

// Uniform Catmull-Rom through the points, sampled densely enough to draw and to measure.
export function trackLine(points = TRACK, steps = 28) {
  const line = [];
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[Math.max(0, index - 1)], p1 = points[index], p2 = points[index + 1], p3 = points[Math.min(points.length - 1, index + 2)];
    for (let step = 0; step < steps; step++) {
      const t = step / steps, t2 = t * t, t3 = t2 * t;
      line.push([0, 1].map(axis => .5 * (2 * p1[axis] + (p2[axis] - p0[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2
        + (3 * p1[axis] - p0[axis] - 3 * p2[axis] + p3[axis]) * t3)));
    }
  }
  line.push(points.at(-1));
  return line;
}

// Chain-lift speed up the first hill; after the crest, speed follows the height lost (minus a little drag).
export function trainTimeline(line = trackLine()) {
  const lengths = [0];
  for (let index = 1; index < line.length; index++) lengths.push(lengths[index - 1] + Math.hypot(line[index][0] - line[index - 1][0], line[index][1] - line[index - 1][1]));
  let crest = 0;
  line.forEach(([x, y], index) => { if (x > LIFT_FROM && x < 800 && y < line[crest][1]) crest = index; });
  const speed = line.map(([x, y], index) => {
    if (x < LIFT_FROM) return CRUISE;
    if (index <= crest) return LIFT;
    const drop = y - line[crest][1], spent = (lengths[index] - lengths[crest]) * DRAG * GRAVITY * 100;
    return Math.max(LIFT, Math.sqrt(LIFT * LIFT + 2 * GRAVITY * drop - spent));
  });
  const times = [0];
  for (let index = 1; index < line.length; index++) times.push(times[index - 1] + (lengths[index] - lengths[index - 1]) * 2 / (speed[index] + speed[index - 1]));
  const at = distance => {
    const clamped = Math.min(Math.max(distance, 0), lengths.at(-1));
    let low = 0, high = lengths.length - 1;
    while (high - low > 1) { const mid = (low + high) >> 1; if (lengths[mid] <= clamped) low = mid; else high = mid; }
    const share = (clamped - lengths[low]) / ((lengths[high] - lengths[low]) || 1);
    const [x1, y1] = line[low], [x2, y2] = line[high];
    return { x: x1 + (x2 - x1) * share, y: y1 + (y2 - y1) * share, angle: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI };
  };
  const distanceAt = time => {
    let low = 0, high = times.length - 1;
    while (high - low > 1) { const mid = (low + high) >> 1; if (times[mid] <= time) low = mid; else high = mid; }
    return lengths[low] + (lengths[high] - lengths[low]) * ((time - times[low]) / ((times[high] - times[low]) || 1));
  };
  return { length: lengths.at(-1), duration: times.at(-1) * 1000, at, distanceAt };
}

// One keyframe list per car. Each car element covers the whole coaster box, so translate percentages are box units.
export function trainKeyframes({ frames = 180, pause = PAUSE } = {}) {
  // The front car follows the timeline; the others trail it by CAR_GAP. Both ends of the track lie off screen.
  const timeline = trainTimeline(), run = timeline.duration, cycle = run + pause;
  const pose = ({ x, y, angle }) => `translate(${(x / WIDTH * 100).toFixed(3)}%, ${((y - TOP) / HEIGHT * 100).toFixed(3)}%) rotate(${angle.toFixed(2)}deg)`;
  const cars = Array.from({ length: CARS }, (_, car) => {
    const keyframes = [];
    for (let frame = 0; frame <= frames; frame++) {
      const time = run * frame / frames;
      keyframes.push({ offset: time / cycle, transform: pose(timeline.at(timeline.distanceAt(time / 1000) - car * CAR_GAP)) });
    }
    keyframes.push({ offset: 1, transform: keyframes.at(-1).transform });
    return keyframes;
  });
  // Reduced motion parks the train on the lift hill, where it shows between the tent and Santa.
  const parked = Array.from({ length: CARS }, (_, car) => pose(timeline.at(nearestDistance(timeline, 560) - car * CAR_GAP)));
  return { cars, cycle, run, parked, timeline };
}

function nearestDistance(timeline, targetX) {
  let best = 0;
  for (let distance = 0; distance < timeline.length; distance += 4) if (Math.abs(timeline.at(distance).x - targetX) < Math.abs(timeline.at(best).x - targetX)) best = distance;
  return best;
}

const WOOD = '#a9845b', TIE = '#8a6a55', POST = '#c9ad8d', BRACE = '#d8c4a6', SNOW = '#fbf8f1', FOOT = 520;
function trackHeight(line, x) {
  const index = line.findIndex(point => point[0] >= x);
  if (index <= 0) return line[0][1];
  const [x1, y1] = line[index - 1], [x2, y2] = line[index];
  return y1 + (y2 - y1) * (x - x1) / ((x2 - x1) || 1);
}
function drawTrack(parent) {
  const line = trackLine(), d = `M${line.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`, base = FOOT;
  // Wooden trestle: posts every 40 units, ledgers every 60 units of height, one diagonal per bay. Their feet stand behind the snow ridge.
  const posts = [];
  for (let x = 0; x <= WIDTH; x += 40) posts.push([x, trackHeight(line, x) + 8]);
  posts.forEach(([x, top], index) => {
    shape('path', { d: `M${x} ${top}V${base}`, stroke: POST, 'stroke-width': 5, fill: 'none' }, parent);
    const next = posts[index + 1];
    if (!next) return;
    for (let level = base - 60; level > Math.max(top, next[1]) + 10; level -= 60) {
      shape('path', { d: `M${x} ${level}H${next[0]}`, stroke: BRACE, 'stroke-width': 3, fill: 'none' }, parent);
      shape('path', { d: `M${x} ${level}L${next[0]} ${Math.min(level + 60, base)}`, stroke: BRACE, 'stroke-width': 2.4, fill: 'none' }, parent);
    }
  });
  shape('path', { d, stroke: WOOD, 'stroke-width': 13, 'stroke-linejoin': 'round', fill: 'none' }, parent);
  shape('path', { d, stroke: TIE, 'stroke-width': 13, 'stroke-dasharray': '3 11', fill: 'none' }, parent);
  shape('path', { d, stroke: SNOW, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', transform: 'translate(0 -6)' }, parent);
}

// Small sleigh cars with two riders each; the art's bottom-centre sits on the rail.
const RIDER_HATS = [['#b5544c', '#fbf8f1'], ['#5f8a70', '#dcae55'], ['#4f7a65', '#fbf8f1'], ['#b5544c', '#dcae55'], ['#dcae55', '#fbf8f1'], ['#7fa3a8', '#fbf8f1']];
function car(fill, index) {
  return parent => {
    for (const [seat, cx] of [[0, 22], [1, 42]]) {
      const [hat, trim] = RIDER_HATS[(index * 2 + seat) % RIDER_HATS.length];
      shape('circle', { cx, cy: 15, r: 7, fill: '#f2c9a8' }, parent);
      shape('path', { d: `M${cx - 8} 11L${cx + 2} -3L${cx + 8} 11Z`, fill: hat }, parent);
      shape('path', { d: `M${cx - 9} 11H${cx + 9}`, stroke: trim, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, parent);
    }
    shape('path', { d: 'M4 20H58C62 20 62 36 56 38H8C4 38 2 24 4 20Z', fill }, parent);
    if (index === 0) shape('path', { d: 'M56 22C66 14 70 4 62 2 56 1 56 9 61 9', stroke: '#dcae55', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
    shape('path', { d: 'M6 22H56', stroke: '#f6ecda', 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
    for (const cx of [16, 46]) shape('circle', { cx, cy: 41, r: 5, fill: '#5a4a44' }, parent);
  };
}

export function mountCoaster(hero, { paper, delay = 3400 } = {}) {
  const layer = popLayer(hero, COASTER_BOX, 'games-coaster', drawTrack, { delay: .5, paper });
  const { cars, cycle, parked } = trainKeyframes();
  const elements = cars.map((_, index) => {
    const element = document.createElement('div');
    element.className = 'coaster-car';
    paperLayer(element, '-6 -6 76 54', 'coaster-car-art', car(['#b5544c', '#5f8a70', '#dcae55'][index], index), { paper: { scale: .5, grain: .45, shadow: .25 }, eager: true });
    layer.append(element);
    return element;
  });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [], inView = true;
  const park = () => { animations.forEach(animation => animation.cancel()); animations = []; elements.forEach((element, index) => { element.style.transform = parked[index]; }); };
  const start = () => {
    if (motion.matches) { park(); return; }
    elements.forEach(element => { element.style.transform = ''; });
    if (!animations.length) animations = elements.map((element, index) => element.animate(cars[index], { duration: cycle, delay, iterations: Infinity, fill: 'both' }));
    animations.forEach(animation => { if (inView && !document.hidden) animation.play(); else animation.pause(); });
  };
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; start(); });
  observer.observe(hero);
  motion.addEventListener('change', start);
  document.addEventListener('visibilitychange', start);
  window.addEventListener('pagehide', () => animations.forEach(animation => animation.pause()));
  window.addEventListener('pageshow', event => { if (event.persisted) start(); });
  start();
  return layer;
}
