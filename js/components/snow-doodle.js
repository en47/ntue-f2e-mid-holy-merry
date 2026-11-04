// Wish 頁信紙下方的雪地：滑鼠經過留下小靴印，按住拖曳用樹枝在雪上劃線，幾秒後被雪蓋平。
// 只在有滑鼠的電腦、而且信紙下方真的空出一片雪地時出現（例如全螢幕這類較高的視窗）。
import { paperLayer, pauseOffscreen, shape } from './paper-art.js';
import { tagArt } from './paper-props.js';

const MIN_GAP = 100, STRIDE = 22, PRINT_LIFE = 2200, LINE_LIFE = 5200, FILL = 2400, MAX_LINES = 14;
const SNOW = '#fbfdff', PRESSED = '#bfd0dc', GROOVE = '#a9bdcc';
const SOLE = 'M0-12C5-12 6-6 5 0 4 4 2 5 0 5-2 5-4 4-5 0-6-6-5-12 0-12Z';

// The next boot lands once the mouse has moved a stride, on alternate sides of its path, toe pointing the way it went.
export function footstep(from, to, side) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  if (Math.hypot(dx, dy) < STRIDE) return null;
  const angle = Math.atan2(dy, dx);
  return { x: to[0] - Math.sin(angle) * 6 * side, y: to[1] + Math.cos(angle) * 6 * side, angle: angle * 180 / Math.PI + 90 };
}

// A twig stuck in a snow drift; its side branch holds the hint tag's string.
function twig(parent) {
  shape('path', { d: 'M2 84C10 72 30 68 46 72 60 66 78 72 86 84Z', fill: '#fbf8f1' }, parent);
  for (const [d, width] of [['M40 80C42 58 41 36 46 8', 5], ['M45 18L36 6', 3], ['M46 12L52 3', 2.5], ['M43 40C60 34 78 28 98 26', 3.5], ['M70 31L76 20', 2.5]]) {
    shape('path', { d, stroke: '#8a6a55', 'stroke-width': width, 'stroke-linecap': 'round', fill: 'none' }, parent);
  }
  shape('path', { d: 'M56 33C62 26 74 24 84 26 78 30 66 32 56 33Z', fill: '#fbf8f1' }, parent);
  shape('path', { d: 'M92 27V40', stroke: '#d9c3a5', 'stroke-width': 1.6 }, parent);
}

export function mountSnowDoodle(room) {
  const form = room.querySelector('#wish-form'), station = room.querySelector('#stocking-station'), edge = room.querySelector('.room-edge');
  const field = document.createElement('div');
  field.className = 'snow-doodle'; field.hidden = true; field.setAttribute('aria-hidden', 'true');
  const marks = shape('svg', { class: 'snow-marks' }, field);
  const hint = document.createElement('div'), tag = document.createElement('span');
  hint.className = 'snow-hint'; tag.className = 'snow-tag'; tag.textContent = '在雪地上畫畫看';
  paperLayer(hint, '0 0 150 86', 'snow-twig', twig, { paper: { scale: .5, grain: .45, shadow: .28 }, eager: true });
  paperLayer(tag, '0 0 240 90', 'snow-tag-art', tagArt('#a84a42', '#853a34'), { paper: { scale: .7, grain: .45, shadow: .24 }, eager: true, preserveAspectRatio: 'none' });
  hint.append(tag); field.append(hint);
  station.before(field);
  pauseOffscreen([tag]);

  const mouse = matchMedia('(hover: hover) and (pointer: fine)'), timers = new Set();
  let size = '', last, side = 1, line, path = '';
  const later = (delay, run) => { const id = setTimeout(() => { timers.delete(id); run(); }, delay); timers.add(id); };
  // Fresh snow covers a mark: it fades (no motion), then leaves the DOM.
  const settle = (node, life) => later(life, () => { node.classList.add('is-filling'); later(FILL, () => node.remove()); });
  const clear = () => { timers.forEach(clearTimeout); timers.clear(); marks.replaceChildren(); line = last = undefined; };
  const local = event => { const box = field.getBoundingClientRect(); return [event.clientX - box.left, event.clientY - box.top]; };

  function stamp({ x, y, angle }) {
    const boot = shape('g', { class: 'snow-print', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, marks);
    // Light comes from the upper left, so each pressed sole shows a bright lower rim, as on every paper piece here.
    for (const [fill, lift] of [[SNOW, 1.6], [PRESSED, 0]]) {
      const sole = shape('g', { transform: `translate(0 ${lift}) rotate(${angle.toFixed(1)})` }, boot);
      shape('path', { d: SOLE, fill }, sole);
      shape('ellipse', { cx: 0, cy: 10, rx: 4, ry: 4.6, fill }, sole);
    }
    settle(boot, PRINT_LIFE);
  }
  function groove(d) { for (const stroke of line.children) stroke.setAttribute('d', d); }

  field.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const point = local(event);
    if (line) {
      if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 3) return;
      path += `L${point[0].toFixed(1)} ${point[1].toFixed(1)}`; last = point; groove(path);
      return;
    }
    if (!last) { last = point; return; }
    const step = footstep(last, point, side);
    if (!step) return;
    side = -side; last = point; stamp(step);
  });
  field.addEventListener('pointerleave', () => { if (!line) last = undefined; });
  field.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault(); field.setPointerCapture(event.pointerId);
    last = local(event); path = `M${last[0].toFixed(1)} ${last[1].toFixed(1)}l0 0`;
    // A groove: bright lower lip, pressed snow, and a darker inner edge on top.
    line = shape('g', { class: 'snow-line' }, marks);
    for (const [stroke, width, lift] of [[SNOW, 5, 2.2], [PRESSED, 7, 0], [GROOVE, 2.5, -1.4]]) {
      shape('path', { stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', transform: `translate(0 ${lift})` }, line);
    }
    groove(path);
    const grooves = marks.querySelectorAll('.snow-line');
    if (grooves.length > MAX_LINES) grooves[0].remove();
  });
  const lift = () => { if (!line) return; settle(line, LINE_LIFE); line = last = undefined; };
  field.addEventListener('pointerup', lift);
  field.addEventListener('lostpointercapture', lift);

  // The field spans the snow between the letter's bottom edge, the stocking post and the room's lower edge.
  // Layout offsets, not on-screen boxes: the letter's opening animation moves it with transforms for a moment.
  function place() {
    const letterBottom = form.offsetTop + form.offsetHeight, roomHeight = room.clientHeight;
    const usable = mouse.matches && getComputedStyle(form).position === 'absolute' && roomHeight - letterBottom >= MIN_GAP;
    const left = Math.max(6, form.offsetLeft - 16), right = station.offsetLeft + station.offsetWidth * .08;
    // Stay on the bright front snow: on tall screens the band right under the letter is the darker far slope.
    const ground = room.querySelector('.night-snow'), front = ground ? ground.offsetParent.offsetTop + ground.offsetTop + ground.offsetHeight * .36 : 0;
    const top = Math.max(letterBottom + 8, front), bottom = roomHeight - edge.getBoundingClientRect().height * .5;
    if (!usable || right - left < 220 || bottom - top < 70) { field.hidden = true; clear(); return; }
    const next = `${Math.round(right - left)}x${Math.round(bottom - top)}`;
    Object.assign(field.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
    field.style.setProperty('--hint-scale', Math.min(1, (bottom - top - 6) / 86).toFixed(3));
    // Marks keep their pixel spots when a status line nudges the letter; they are only wiped when the field hides.
    if (next !== size) { size = next; marks.setAttribute('viewBox', `0 0 ${Math.round(right - left)} ${Math.round(bottom - top)}`); }
    field.hidden = false;
  }
  const observer = new ResizeObserver(place);
  // Border boxes: a status line under the letter grows its padding, not its content box.
  const watch = () => { observer.observe(room, { box: 'border-box' }); observer.observe(form, { box: 'border-box' }); };
  watch();
  mouse.addEventListener('change', place);
  window.addEventListener('pagehide', () => { observer.disconnect(); clear(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { watch(); place(); } });
}
