// Looking at something closely: it rises out of the scene onto a paper card, where it can be tilted by dragging (or with
// the arrow keys) and turned over to its other side. The pocket uses it for what is in it; later, things in the scene
// (a blotter, a letter) can too. Only transform and opacity move; with reduced motion it simply appears. Esc, the close
// button or a tap beside the card puts it away.
import { paperLayer, shape } from './paper-art.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAPER = { paper: { scale: .5, grain: .45, shadow: .25 }, eager: true };
const TILT = { x: 22, y: 38 }, clamp = (value, most) => Math.max(-most, Math.min(most, value));
// The back of a paper cut-out: the same outline, mirrored, in the plain paper it was cut from.
export function reverse(draw) {
  return g => {
    const back = shape('g', { transform: 'translate(100 0) scale(-1 1)' }, g); draw(back);
    for (const node of back.querySelectorAll('*')) {
      if (node.getAttribute('fill') && node.getAttribute('fill') !== 'none') node.setAttribute('fill', '#eadcbf');
      if (node.getAttribute('stroke')) node.setAttribute('stroke', '#dccaa6');
    }
  };
}

// `from`: where it was on the stage (a rect), so it rises from there. `back`: { words, draw?, mirror? } (draw defaults to
// the cut-out's reverse; `mirror`, writing soaked in backwards, is written over it in the site's hand, the wrong way
// round). `words`: what is seen on its face. `onTurn` hears each time it is turned over to its back. Returns { close }.
export function inspect({ host, sound, title, draw, words, back = null, from = null, turn = '', flip = '翻面', done = '收好 ✓', onClose = () => {}, onTurn = () => {} }) {
  const opener = document.activeElement, events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const veil = element('div', 'inspect-veil', host), card = element('article', 'inspect-card', veil);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', title);
  element('h3', 'inspect-title', card, title);
  const view = element('div', 'inspect-view', card), object = element('div', 'inspect-object', view);
  object.tabIndex = 0; object.setAttribute('role', 'img'); object.setAttribute('aria-label', `${title}。${turn}`);
  paperLayer(element('div', 'inspect-face is-front', object), '0 0 100 100', '', draw, PAPER);
  if (back) { const face = element('div', 'inspect-face is-back', object); paperLayer(face, '0 0 100 100', '', back.draw ?? reverse(draw), PAPER); if (back.mirror) element('p', 'inspect-mirror', face, back.mirror); }
  const said = element('p', 'inspect-words', card, words); said.setAttribute('aria-live', 'polite');
  const actions = element('div', 'inspect-actions', card);
  const turnOver = back && element('button', 'inspect-flip', actions, flip), close = element('button', 'inspect-close', actions, done);
  if (turnOver) { turnOver.type = 'button'; turnOver.setAttribute('aria-pressed', 'false'); }
  close.type = 'button';
  let tilt = { x: 0, y: 0 }, over = false, drag = null, settle = 0;
  const pose = () => { object.style.transform = `rotateX(${tilt.x}deg) rotateY(${tilt.y + (over ? 180 : 0)}deg)`; };
  // Let go, it sways back to face you.
  const rest = (ms = 0) => { clearTimeout(settle); settle = setTimeout(() => { tilt = { x: 0, y: 0 }; pose(); }, ms); };
  on(object, 'pointerdown', event => { if (event.button > 0) return; event.preventDefault(); object.setPointerCapture(event.pointerId); drag = { id: event.pointerId, x: event.clientX, y: event.clientY, from: { ...tilt } }; object.classList.add('is-turning'); clearTimeout(settle); });
  on(object, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    tilt = { x: clamp(drag.from.x - (event.clientY - drag.y) * .3, TILT.x), y: clamp(drag.from.y + (event.clientX - drag.x) * .35, TILT.y) }; pose();
  });
  const end = event => { if (!drag || event.pointerId !== drag.id) return; drag = null; object.classList.remove('is-turning'); rest(250); };
  on(object, 'pointerup', end); on(object, 'pointercancel', end); on(object, 'lostpointercapture', end);
  // The arrow keys tilt it from anywhere on the card (its buttons do not use them).
  on(card, 'keydown', event => {
    const step = { ArrowLeft: [0, -12], ArrowRight: [0, 12], ArrowUp: [10, 0], ArrowDown: [-10, 0] }[event.key];
    if (step) { event.preventDefault(); tilt = { x: clamp(tilt.x + step[0], TILT.x), y: clamp(tilt.y + step[1], TILT.y) }; pose(); rest(900); }
  });
  function turnAround() { over = !over; turnOver.setAttribute('aria-pressed', String(over)); said.textContent = over ? back.words : words; sound?.play('pick'); pose(); if (over) onTurn(); }
  if (turnOver) on(turnOver, 'click', turnAround);
  function shut() {
    if (!veil.isConnected) return;
    events.abort(); clearTimeout(settle); veil.remove(); sound?.play('remove'); onClose();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  on(close, 'click', shut);
  on(veil, 'pointerdown', event => { if (event.target === veil) shut(); });
  // Esc puts the card away and stops there, so the room behind keeps its own Esc.
  on(card, 'keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); shut(); } });
  pose(); sound?.play('open');
  // It rises from where it was in the scene to the middle of the card.
  if (from && !still()) {
    const box = host.getBoundingClientRect(), at = view.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (at.left - box.left + at.width / 2), dy = from.top + from.height / 2 - (at.top - box.top + at.height / 2), scale = Math.max(.15, Math.min(1, from.width / at.width));
    view.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2, .8, .3, 1)' });
  }
  close.focus({ preventScroll: true });
  return { close: shut, card };
}
