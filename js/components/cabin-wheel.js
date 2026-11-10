// The broken big wheel, mended up close. It stands too far off to walk up to, so its hub is laid over the yard as a sheet
// of paper: the gear that fell into the snow goes back on the axle (drag it there, or press it), then the crank beside it
// is turned clockwise (drag round it, or press the arrow keys or Enter) until the wheel catches and turns by itself.
import { paperLayer, shape } from './paper-art.js';

const PAPER = { paper: { scale: .5, grain: .4, shadow: .2 }, eager: true };
const WOOD = '#8f5a3c', RIM = '#c9a77f', STEEL = '#8d97a1';
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
// Two turns of the crank set the wheel going.
const TURNS = 2;

// The sheet in a 160 × 120 box: snow, the stand's legs and the crank's box behind; the rim and spokes turn about the hub
// (80, 40); the hub's housing in front of them.
function back(parent) {
  shape('path', { d: 'M80 40L50 106M80 40L110 106', stroke: WOOD, 'stroke-width': 7, 'stroke-linecap': 'round' }, parent);
  shape('path', { d: 'M0 100Q40 93 80 98T160 95V120H0Z', fill: '#fbf8f1' }, parent);
  shape('rect', { x: 118, y: 76, width: 28, height: 26, rx: 4, fill: WOOD }, parent);
  shape('rect', { x: 118, y: 92, width: 28, height: 4, fill: '#e0b04f' }, parent);
}
function spokes(parent) {
  shape('circle', { cx: 80, cy: 40, r: 56, fill: 'none', stroke: RIM, 'stroke-width': 4 }, parent);
  shape('circle', { cx: 80, cy: 40, r: 30, fill: 'none', stroke: RIM, 'stroke-width': 2 }, parent);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; shape('path', { d: `M80 40L${80 + Math.cos(a) * 56} ${40 + Math.sin(a) * 56}`, stroke: RIM, 'stroke-width': 2.5 }, parent); }
}
function hub(parent) {
  shape('circle', { cx: 80, cy: 40, r: 13, fill: '#6b4a33' }, parent);
  shape('circle', { cx: 80, cy: 40, r: 5, fill: '#3b2a24' }, parent);
}
function gear(parent) {
  for (let i = 0; i < 8; i++) shape('rect', { x: 43, y: 6, width: 14, height: 20, rx: 3, fill: '#77818b', transform: `rotate(${i * 45} 50 50)` }, parent);
  shape('circle', { cx: 50, cy: 50, r: 32, fill: STEEL }, parent);
  shape('circle', { cx: 50, cy: 50, r: 11, fill: '#3b2a24' }, parent);
}
function crank(parent) {
  shape('rect', { x: 44, y: 12, width: 12, height: 40, rx: 6, fill: '#6b4a33' }, parent);
  shape('circle', { cx: 50, cy: 50, r: 9, fill: '#e0b04f' }, parent);
  shape('circle', { cx: 50, cy: 14, r: 11, fill: '#a84a42' }, parent);
}

export function wheelGame({ layer, stage, cabin, say, later, sound, onMended, onClose }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  say('摩天輪停住了。走近一看，輪軸上的齒輪掉進雪地裡了。');
  const card = element('article', 'cabin-letter wheel-card', layer); card.setAttribute('aria-label', '摩天輪的輪軸');
  element('h3', 'secret-title', card, '摩天輪的輪軸');
  const guide = element('p', 'wheel-guide', card, '把雪地裡的齒輪拖回輪軸上（或直接點它）。');
  const sheet = element('div', 'wheel-sheet', card);
  paperLayer(element('span', 'wheel-art', sheet), '0 0 160 120', '', back, PAPER);
  const rim = element('span', 'wheel-art wheel-spokes', sheet); paperLayer(rim, '0 0 160 120', '', spokes, PAPER);
  paperLayer(element('span', 'wheel-art', sheet), '0 0 160 120', '', hub, PAPER);
  const slot = element('span', 'wheel-slot', sheet); slot.setAttribute('aria-hidden', 'true');
  const cog = element('button', 'wheel-gear', sheet); cog.type = 'button'; cog.setAttribute('aria-label', '掉在雪地裡的齒輪：拖回輪軸上，或按 Enter 裝回去');
  paperLayer(cog, '0 0 100 100', '', gear, PAPER);
  const handle = element('button', 'wheel-crank', sheet); handle.type = 'button'; handle.disabled = true;
  handle.setAttribute('aria-label', '曲柄：繞著它順時針拖曳，或按方向鍵右、Enter 轉四分之一圈');
  paperLayer(handle, '0 0 100 100', '', crank, PAPER);
  const actions = element('div', 'desk-actions', card), quit = element('button', '', actions, '先不修了'); quit.type = 'button';
  on(quit, 'click', () => onClose());
  // Esc puts it down too (outside, the page has no step back to take).
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }, { capture: true, signal: events.signal });

  let placed = false, turned = 0, mended = false, ticks = 0;
  const box = () => sheet.getBoundingClientRect();
  const hubAt = () => { const rect = box(); return { x: rect.left + rect.width * .5, y: rect.top + rect.height / 3 }; };
  function place() {
    placed = true; cog.classList.add('is-placed'); cog.style.translate = ''; slot.hidden = true; handle.disabled = false; sound.play('snap');
    cog.setAttribute('aria-label', '齒輪裝回輪軸了'); cog.disabled = true;
    guide.textContent = '齒輪卡回去了。順時針轉右邊的曲柄，讓摩天輪動起來。'; say(''); handle.focus({ preventScroll: true });
  }
  // The gear: dragged near the axle it snaps on; anywhere else it drops back into the snow.
  let drag = null, dragged = false;
  on(cog, 'pointerdown', event => {
    if (event.button > 0 || placed) return;
    event.preventDefault(); try { cog.setPointerCapture(event.pointerId); } catch {} dragged = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, point: null };
  });
  on(cog, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.point && Math.hypot(dx, dy) < 6) return;
    if (!drag.point) { sound.play('pick'); cog.classList.add('is-dragging'); }
    drag.point = { x: event.clientX, y: event.clientY }; cog.style.translate = `${dx}px ${dy}px`;
    slot.classList.toggle('is-open', Math.hypot(event.clientX - hubAt().x, event.clientY - hubAt().y) < box().width * .12);
  });
  // A release swallowed before it reaches the page (some browser extensions do that) still ends the drag (lostpointercapture).
  const drop = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const { point } = drag; drag = null; cog.classList.remove('is-dragging'); slot.classList.remove('is-open');
    if (!point) return;
    dragged = true;
    const at = event.type === 'lostpointercapture' ? point : { x: event.clientX, y: event.clientY };
    if (event.type !== 'pointercancel' && Math.hypot(at.x - hubAt().x, at.y - hubAt().y) < box().width * .12) place();
    else { cog.style.translate = ''; sound.play('drop'); }
  };
  on(cog, 'pointerup', drop); on(cog, 'pointercancel', drop); on(cog, 'lostpointercapture', drop);
  on(cog, 'click', () => { if (dragged) { dragged = false; return; } if (!placed) place(); });

  // The crank: only clockwise counts (the other way it holds); the spokes and the gear turn with it.
  function wind(angle) {
    if (mended || !placed) return;
    turned = Math.min(TURNS * Math.PI * 2, turned + angle);
    handle.style.rotate = `${turned}rad`; rim.style.rotate = cog.style.rotate = `${turned * .35}rad`;
    const clicks = Math.floor(turned / (Math.PI / 6)); for (; ticks < clicks; ticks++) sound.tick();
    if (turned >= TURNS * Math.PI * 2) mend();
    else if (turned > Math.PI * 2) guide.textContent = '再轉一圈……';
  }
  function mend() {
    mended = true; handle.disabled = true; sound.play('jingle'); onMended();
    if (!still()) { rim.classList.add('is-turning'); cog.classList.add('is-turning'); }
    guide.textContent = '喀啦一聲，摩天輪又慢慢轉起來了！'; say('摩天輪修好了，又慢慢地轉了起來。');
    quit.textContent = '好了 ✓'; quit.focus({ preventScroll: true });
  }
  let turn = null;
  on(handle, 'pointerdown', event => {
    if (event.button > 0 || handle.disabled) return;
    event.preventDefault(); try { handle.setPointerCapture(event.pointerId); } catch {}
    const rect = handle.getBoundingClientRect(); turn = { id: event.pointerId, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
    turn.last = Math.atan2(event.clientY - turn.cy, event.clientX - turn.cx); handle.classList.add('is-winding');
  });
  on(handle, 'pointermove', event => {
    if (!turn || event.pointerId !== turn.id) return;
    const angle = Math.atan2(event.clientY - turn.cy, event.clientX - turn.cx), delta = wrap(angle - turn.last); turn.last = angle;
    // Clockwise on screen is a growing angle (y points down).
    if (delta > 0) wind(delta);
    else if (delta < -.05) { handle.classList.remove('is-resisting'); void handle.offsetWidth; handle.classList.add('is-resisting'); }
  });
  const letGo = event => { if (!turn || event.pointerId !== turn.id) return; turn = null; handle.classList.remove('is-winding'); };
  on(handle, 'pointerup', letGo); on(handle, 'pointercancel', letGo); on(handle, 'lostpointercapture', letGo);
  on(handle, 'keydown', event => { if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); wind(Math.PI / 2); } });
  cog.focus({ preventScroll: true });
  return () => events.abort();
}
