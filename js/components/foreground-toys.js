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
    const distance = innerWidth * .62 + 160, sheet = button.firstElementChild;
    if (motion().matches) return;
    // It leaves on the right and comes home from the left, like a lap around the page.
    run = sheet.animate([{ transform: 'none' }, { transform: `translateX(${distance}px)`, offset: .46 }, { transform: `translateX(${-distance}px)`, offset: .47 }, { transform: 'none' }], { duration: 3600, easing: 'cubic-bezier(.45,0,.55,1)' });
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

function flakeArt(parent) {
  for (let angle = 0; angle < 180; angle += 60) shape('path', { d: 'M40 8V72M30 18L40 28 50 18M30 62L40 52 50 62', stroke: '#6f9bb8', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none', transform: `rotate(${angle} 40 40)` }, parent);
}

function snowCatch(host) {
  const sign = element('span', 'toy-score', host);
  sign.textContent = '接到 0 片雪花'; sign.setAttribute('role', 'status');
  const first = paperLayer(document.createElement('div'), '0 0 80 80', '', flakeArt, { paper: { ...PAPER, shadow: .1 }, eager: true }).querySelector('img');
  let score = 0;
  // CSS owns the falling, so the loop stops with the page and needs no timer of its own.
  [8, 26, 46, 66, 84].forEach((left, index) => {
    const flake = element('button', 'toy-flake', host);
    flake.type = 'button'; flake.tabIndex = -1; flake.setAttribute('aria-hidden', 'true');
    flake.style.left = `${left}%`; flake.style.animationDelay = `${-index * 1.5}s`; flake.style.animationDuration = `${6 + index % 3}s`;
    flake.append(first.cloneNode());
    flake.addEventListener('pointerdown', () => {
      if (flake.classList.contains('is-caught')) return;
      flake.classList.add('is-caught'); sign.textContent = `接到 ${++score} 片雪花`;
      sign.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.12)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 260 });
      setTimeout(() => flake.classList.remove('is-caught'), 2200);
    });
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

const TOYS = { home: sled, intro: globe, game: snowCatch, wish: wishingStar };
export function mountToy(root, kind) {
  const draw = TOYS[kind]; if (!draw) return;
  const host = element('div', `foreground-scene foreground-toy toy-${kind}`, root);
  draw(host);
  root.removeAttribute('aria-hidden'); // The scene now holds a real control.
}
