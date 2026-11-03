// Tap the frozen pond: the ice opens, a paper snowman rises, waves, and sinks back. Phones only ripple the ice.
// Only transform and opacity animate.
import { paperLayer, shape } from './paper-art.js';

const PAPER = { scale: 1, grain: .45, shadow: .22 }, POND = '0 0 540 170', BODY = '0 0 140 220';
const SNOW = '#fbf7ee', SNOW_SHADE = '#d9e5ea', INK = '#4b3d38', SHOW_MS = 2600;
// The hole sits where pond.svg is deepest; its rim is the pond's own outline scaled down.
export const HOLE = { x: 270, y: 92, rx: 74, ry: 22 };

export function insideIce(u, v) {
  const dx = (u * 540 - 270) / 230, dy = (v * 170 - 90) / 52;
  return dx * dx + dy * dy <= 1;
}

function hole(parent) {
  shape('ellipse', { cx: HOLE.x, cy: HOLE.y, rx: HOLE.rx + 8, ry: HOLE.ry + 5, fill: '#e5f0f3' }, parent);
  shape('ellipse', { cx: HOLE.x, cy: HOLE.y, rx: HOLE.rx, ry: HOLE.ry, fill: '#5f8798' }, parent);
  shape('ellipse', { cx: HOLE.x, cy: HOLE.y + 4, rx: HOLE.rx * .8, ry: HOLE.ry * .6, fill: '#4c7385' }, parent);
}
// Only the near half of the rim is drawn in front, so the snowman reads as rising out of the water.
function lip(parent) {
  const { x, y, rx, ry } = HOLE;
  shape('path', { d: `M${x - rx - 8} ${y}A${rx + 8} ${ry + 5} 0 0 0 ${x + rx + 8} ${y}L${x + rx} ${y}A${rx} ${ry} 0 0 1 ${x - rx} ${y}Z`, fill: '#e5f0f3' }, parent);
  shape('path', { d: `M${x - rx * .6} ${y + ry * .95}C${x - 20} ${y + ry * 1.25} ${x + 30} ${y + ry * 1.2} ${x + rx * .55} ${y + ry * .95}`, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

function body(parent) {
  const ball = (cy, r) => {
    shape('circle', { cx: 70, cy, r, fill: SNOW }, parent);
    shape('path', { d: `M${70 + r * .35} ${cy - r * .92}A${r} ${r} 0 0 1 ${70 + r * .35} ${cy + r * .92}A${r * 1.3} ${r * 1.3} 0 0 0 ${70 + r * .35} ${cy - r * .92}Z`, fill: SNOW_SHADE }, parent);
  };
  shape('path', { d: 'M44 112L10 92M22 99L12 84M22 99L6 102', stroke: '#7a5a43', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
  ball(178, 42); ball(112, 30); ball(66, 23);
  shape('path', { d: 'M42 86C60 96 80 96 98 86L98 96C80 106 60 106 42 96Z', fill: '#b5544c' }, parent);
  shape('path', { d: 'M82 94L94 126L78 124Z', fill: '#a34a43' }, parent);
  shape('path', { d: 'M48 46H92M56 46L58 14H82L84 46Z', fill: '#5a4a44', stroke: '#5a4a44', 'stroke-width': 6, 'stroke-linejoin': 'round' }, parent);
  shape('path', { d: 'M57 38H83', stroke: '#b5544c', 'stroke-width': 6 }, parent);
  shape('path', { d: 'M70 64L98 70L70 74Z', fill: '#d98a4e' }, parent);
  for (const [cx, cy, r] of [[61, 58, 3.4], [79, 58, 3.4], [70, 112, 3.6], [70, 130, 3.6], [70, 158, 3.6]]) shape('circle', { cx, cy, r, fill: INK }, parent);
  shape('path', { d: 'M60 78Q70 85 80 78', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none' }, parent);
  for (const cx of [54, 86]) shape('circle', { cx, cy: 72, r: 4, fill: '#e8a093', opacity: .7 }, parent);
}
function arm(parent) {
  shape('path', { d: 'M96 110L130 84M120 92L126 76M120 92L136 94', stroke: '#7a5a43', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

export function mountPondSurprise(stage, announce) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), phone = matchMedia('(max-width: 700px)');
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'pond-surprise';
  button.setAttribute('aria-label', '點冰湖，看看誰冒出來');
  paperLayer(button, POND, 'pond-hole', hole, { paper: PAPER, eager: true });
  for (const delay of [0, 1]) { const ring = document.createElement('i'); ring.className = 'pond-ripple'; ring.style.setProperty('--ring', delay); button.append(ring); }
  const rise = document.createElement('span'), snowman = document.createElement('span');
  rise.className = 'pond-rise'; snowman.className = 'pond-snowman';
  paperLayer(snowman, BODY, 'pond-body', body, { paper: PAPER, eager: true });
  paperLayer(snowman, BODY, 'pond-arm', arm, { paper: PAPER, eager: true, origin: [96, 110] });
  rise.append(snowman); button.append(rise);
  paperLayer(button, POND, 'pond-lip', lip, { paper: PAPER, eager: true });
  stage.append(button);

  let timer = 0;
  const finish = () => { clearTimeout(timer); timer = 0; button.classList.remove('is-rising', 'is-shown', 'is-rippling'); };
  function surprise() {
    if (['is-rising', 'is-shown', 'is-rippling'].some(name => button.classList.contains(name))) return;
    if (phone.matches) { if (!motion.matches) button.classList.add('is-rippling'); return; }
    announce?.('冰湖裡冒出一個雪人，向你揮揮手！');
    if (motion.matches) { button.classList.add('is-shown'); timer = setTimeout(finish, SHOW_MS); return; }
    button.classList.add('is-rising');
  }
  const onEnd = event => { if (event.animationName === 'pond-rise') finish(); };
  const onRipple = event => { if (event.animationName === 'pond-ripple' && event.target === lastRing) finish(); };
  // A tap that lands on a character's empty stage, over the ice, still reaches the pond.
  const onPass = event => {
    const box = button.getBoundingClientRect();
    if (!box.width || !insideIce((event.detail.x - box.left) / box.width, (event.detail.y - box.top) / box.height)) return;
    event.preventDefault(); surprise();
  };
  const onHide = () => finish();
  button.addEventListener('click', surprise);
  snowman.addEventListener('animationend', onEnd);
  const lastRing = button.querySelectorAll('.pond-ripple')[1];
  button.addEventListener('animationend', onRipple);
  stage.addEventListener('character:pass-through', onPass);
  window.addEventListener('pagehide', onHide);
  return { surprise, destroy() {
    button.removeEventListener('animationend', onRipple); finish(); button.remove(); stage.removeEventListener('character:pass-through', onPass); window.removeEventListener('pagehide', onHide); } };
}
