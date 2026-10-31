// One interactive centrepiece per page footer. Each sheet is cut once; only compositor layers move.
import { paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';

const PAPER = { scale: .8, grain: .5, shadow: .2 };
const motion = () => matchMedia('(prefers-reduced-motion: reduce)');
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
function toyButton(host, label) { const button = element('button', 'toy-button', host); button.type = 'button'; button.setAttribute('aria-label', label); return button; }

function sled(host) {
  const button = toyButton(host, '推雪橇出發');
  paperLayer(button, '0 -10 260 160', 'toy-sled', parent => {
    shape('path', { d: 'M28 134H190C216 134 232 118 240 96', stroke: '#a9845b', 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, parent);
    shape('path', { d: 'M62 134V106M170 134V106', stroke: '#a9845b', 'stroke-width': 8, fill: 'none' }, parent);
    shape('path', { d: 'M28 80H224L206 112H46Z', fill: '#a8564c' }, parent);
    shape('path', { d: 'M28 80C60 70 190 70 224 80 220 88 34 88 28 80Z', fill: '#fbf8f1' }, parent);
    shape('rect', { x: 50, y: 22, width: 72, height: 58, rx: 5, fill: '#e9d9b8' }, parent);
    shape('rect', { x: 78, y: 22, width: 16, height: 58, fill: '#b5625a' }, parent);
    shape('rect', { x: 128, y: 42, width: 62, height: 38, rx: 5, fill: '#8aa9ad' }, parent);
    shape('rect', { x: 152, y: 42, width: 14, height: 38, fill: '#f3e7cf' }, parent);
    star(parent, 86, 16, 15);
  }, { paper: PAPER, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    if (run) return;
    if (motion().matches) return;
    const box = button.getBoundingClientRect(), sheet = button.firstElementChild;
    // Two separate trips: it never crosses the page backwards while changing sides.
    const out = innerWidth - box.left + 30, back = box.right + 30;
    run = sheet.animate([{ transform: 'none' }, { transform: `translateX(${out}px)` }], { duration: 1600, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
    await run.finished.catch(() => {});
    const trip = run; run = sheet.animate([{ transform: `translateX(${-back}px)` }, { transform: 'none' }], { duration: 1800, easing: 'cubic-bezier(.15,.5,.3,1)' });
    trip.cancel();
    await run.finished.catch(() => {}); run = null;
  });
}

function globe(host) {
  const button = toyButton(host, '轉動地球儀');
  paperLayer(button, '0 0 200 230', 'toy-globe-base', parent => {
    shape('path', { d: 'M62 226H138L122 204H78Z', fill: '#94785f' }, parent);
    shape('path', { d: 'M100 206V176', stroke: '#94785f', 'stroke-width': 10, fill: 'none' }, parent);
    shape('path', { d: 'M28 40A100 100 0 0 0 100 192', stroke: '#b98a45', 'stroke-width': 7, fill: 'none' }, parent);
    shape('circle', { cx: 112, cy: 100, r: 80, fill: '#a8c6cc' }, parent);
  }, { paper: PAPER, eager: true });
  // Two identical strips of land slide behind a round window, so a turn never shows a seam.
  const window = element('span', 'toy-globe-window', button), strip = element('span', 'toy-globe-lands', window);
  paperLayer(strip, '0 0 480 160', '', parent => {
    for (const dx of [0, 240]) {
      shape('path', { d: `M${dx + 24} 50C${dx + 56} 26 ${dx + 92} 34 ${dx + 96} 66 ${dx + 78} 92 ${dx + 42} 90 ${dx + 24} 50Z`, fill: '#6f9676' }, parent);
      shape('path', { d: `M${dx + 136} 84C${dx + 164} 74 ${dx + 192} 92 ${dx + 182} 120 ${dx + 160} 142 ${dx + 136} 124 ${dx + 136} 84Z`, fill: '#6f9676' }, parent);
      shape('path', { d: `M${dx + 150} 24C${dx + 170} 16 ${dx + 200} 22 ${dx + 204} 40 ${dx + 186} 54 ${dx + 156} 46 ${dx + 150} 24Z`, fill: '#5f8a70' }, parent);
    }
  }, { paper: { ...PAPER, shadow: 0 }, eager: true });
  const card = paperLayer(host, '0 0 110 80', 'toy-postcard', parent => {
    shape('rect', { x: 8, y: 8, width: 94, height: 64, rx: 4, fill: '#fbf4e6' }, parent);
    shape('rect', { x: 70, y: 16, width: 22, height: 26, fill: '#b5544c' }, parent);
    shape('path', { d: 'M18 26H58M18 42H58M18 58H44', stroke: '#c9b79c', 'stroke-width': 4, fill: 'none' }, parent);
  }, { paper: PAPER, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    if (run) return;
    if (motion().matches) return;
    run = strip.animate([{ transform: 'none' }, { transform: 'translateX(-50%)' }], { duration: 1100, iterations: 2, easing: 'linear' });
    card.animate([{ opacity: 0, transform: 'translate(-50%, 40%) rotate(0) scale(.3)' }, { opacity: 1, offset: .25 }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(70%, -170%) rotate(14deg) scale(1)' }], { duration: 2200, easing: 'ease-out' });
    await run.finished.catch(() => {}); run = null;
  });
}

const PRIZES = [
  parent => star(parent, 100, 60, 34),
  parent => {
    shape('path', { d: 'M100 26C80 28 76 48 74 64 72 74 66 80 64 86H136C134 80 128 74 126 64 124 48 120 28 100 26Z', fill: '#d9a441' }, parent);
    shape('circle', { cx: 100, cy: 94, r: 9, fill: '#a84a42' }, parent);
  },
  parent => {
    shape('circle', { cx: 100, cy: 74, r: 26, fill: '#fbf8f1' }, parent);
    shape('circle', { cx: 100, cy: 38, r: 18, fill: '#fbf8f1' }, parent);
    for (const x of [93, 107]) shape('circle', { cx: x, cy: 34, r: 2.8, fill: '#3b2a22' }, parent);
    shape('path', { d: 'M100 40L116 44 100 46Z', fill: '#d9823f' }, parent);
  },
];
const CONFETTI = ['#a84a42', '#4f7d68', '#d9a441', '#7fa3a8', '#efdcae'];

// Each scrap keeps its sideways speed while gravity bends its path into a parabola.
function throwScrap(host, index) {
  const scrap = element('i', 'toy-scrap', host);
  scrap.style.background = CONFETTI[index % CONFETTI.length];
  const side = (index - 7.5) / 7.5, speed = 90 + Math.random() * 70, spin = 360 + Math.random() * 500;
  const frames = Array.from({ length: 9 }, (_, step) => {
    const t = step / 8, x = side * 150 * t, y = -speed * 2 * t + speed * 2.5 * t * t;
    return { transform: `translate(${x}px, ${y}px) rotate(${spin * t}deg)`, opacity: t > .85 ? 0 : 1 };
  });
  scrap.animate(frames, { duration: 1500, easing: 'linear' }).finished.catch(() => {}).finally(() => scrap.remove());
}

function surpriseBox(host) {
  const button = toyButton(host, '打開驚喜禮物盒'), paper = { paper: PAPER, eager: true };
  const prizes = PRIZES.map(draw => paperLayer(button, '0 0 200 190', 'toy-prize', draw, paper));
  paperLayer(button, '0 0 200 190', 'toy-box', parent => {
    shape('rect', { x: 34, y: 92, width: 132, height: 92, rx: 5, fill: '#a84a42' }, parent);
    shape('rect', { x: 88, y: 92, width: 24, height: 92, fill: '#efdcae' }, parent);
  }, paper);
  const lid = paperLayer(button, '0 0 200 190', 'toy-lid', parent => {
    shape('rect', { x: 24, y: 68, width: 152, height: 30, rx: 5, fill: '#b5604a' }, parent);
    shape('rect', { x: 88, y: 68, width: 24, height: 30, fill: '#efdcae' }, parent);
    shape('path', { d: 'M100 68C66 36 48 62 100 68C152 62 134 36 100 68Z', fill: '#efdcae' }, parent);
  }, paper);
  let busy = false, last = -1;
  button.addEventListener('click', async () => {
    if (busy || motion().matches) return;
    busy = true; host.classList.add('is-open');
    let index = Math.floor(Math.random() * prizes.length);
    if (index === last) index = (index + 1) % prizes.length;
    last = index;
    for (let scrap = 0; scrap < 16; scrap++) throwScrap(host, scrap);
    const up = lid.animate([{ transform: 'none' }, { transform: 'translate(24%, -62%) rotate(26deg)', offset: .22 }, { transform: 'translate(24%, -62%) rotate(26deg)', offset: .8 }, { transform: 'none' }], { duration: 1900, easing: 'ease-in-out' });
    prizes[index].animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'translateY(-44%) scale(1.08)', offset: .22 }, { opacity: 1, transform: 'translateY(-36%)', offset: .34 }, { opacity: 1, transform: 'translateY(-36%)', offset: .72 }, { opacity: 0, transform: 'translateY(40%)' }], { duration: 1900, easing: 'ease-out' });
    await up.finished.catch(() => {});
    host.classList.remove('is-open'); busy = false;
  });
}

function wishingStar(host) {
  const sky = element('span', 'toy-sky', host);
  paperLayer(sky, '0 0 300 120', '', parent => { for (const [x, y, size] of [[30, 60, 7], [84, 22, 5], [214, 28, 6], [272, 70, 7], [150, 12, 4]]) star(parent, x, y, size, '#f3df9e'); }, { paper: null, eager: true });
  const button = toyButton(host, '對星星許個願');
  paperLayer(button, '0 0 100 100', 'toy-star', parent => star(parent, 50, 52, 42, '#f4cf74'), { paper: { ...PAPER, rim: '#fff3cf', shadow: 0 }, eager: true });
  const streak = paperLayer(host, '0 0 220 70', 'toy-meteor', parent => {
    shape('path', { d: 'M8 12C70 24 130 40 190 54L188 62C130 50 70 34 8 12Z', fill: '#f7e9b8' }, parent);
    star(parent, 194, 56, 13, '#fff3cf');
  }, { paper: null, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    host.classList.remove('is-wishing'); void host.offsetWidth; host.classList.add('is-wishing');
    if (run || motion().matches) return;
    run = streak.animate([{ opacity: 0, transform: 'translate(-120%, -120%) rotate(-4deg)' }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(120%, 120%) rotate(-4deg)' }], { duration: 1500, easing: 'ease-in' });
    await run.finished.catch(() => {}); run = null;
  });
}

const TOYS = { home: sled, intro: globe, game: surpriseBox, wish: wishingStar };
export function mountToy(root, kind) {
  const draw = TOYS[kind]; if (!draw) return;
  const host = element('div', `foreground-scene foreground-toy toy-${kind}`, root);
  draw(host);
  root.removeAttribute('aria-hidden'); // The scene now holds a real control.
}
