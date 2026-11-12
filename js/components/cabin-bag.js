// The visitor's pocket: a kraft pocket in the corner of the scene and a row of paper slots for what is in it (the rules are
// in services/cabin-bag.js, the words in data/cabin-items.js). Something found flies into it along an arc (`give`). From
// it a thing is dragged onto where it should be used, or tapped and then the place tapped (or Enter on each, by keyboard);
// it can be looked at closely on a card (cabin-inspect.js). The games say which places take what (`target`): over one, a
// red ring is drawn round it; a place that does not take it shakes its head and the thing springs back, costing nothing.
// The pocket is hidden until it has held something.
import { paperLayer, shape } from './paper-art.js';
import { inspect } from './cabin-inspect.js';
import { ITEM_ART, mitten, pocket } from './cabin-items.js';
import { ever, holds, spend, take } from '../services/cabin-bag.js';
import { BAG, ITEM_TEXT } from '../data/cabin-items.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAPER = { paper: { scale: .4, grain: .45, shadow: .25 }, eager: true };
const INK = { paper: { scale: .25, grain: .6, shadow: 0, rim: '#ffffff00' }, eager: true, preserveAspectRatio: 'none' };
const GHOST = 64;
const inside = ([x, y], rect, pad = 0) => x >= rect.left - pad && x <= rect.left + rect.width + pad && y >= rect.top - pad && y <= rect.top + rect.height + pad;
const centre = rect => [rect.left + rect.width / 2, rect.top + rect.height / 2];

export function mountBag(stage, { progress, save, sound, say = () => {} }) {
  const bag = progress.bag, events = new AbortController(), on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal: events.signal });
  const timers = new Set(), later = (ms, run) => { const id = setTimeout(() => { timers.delete(id); run(); }, ms); timers.add(id); };
  const box = element('div', 'cabin-bag', stage), mouth = element('button', 'bag-pocket', box); mouth.type = 'button';
  paperLayer(mouth, '0 0 64 66', 'bag-icon', pocket, PAPER);
  const row = element('ul', 'bag-slots', box); row.setAttribute('aria-label', BAG.label);
  const look = element('button', 'bag-look', box, BAG.look); look.type = 'button';
  // The pencil ring round a place a thing is held over, drawn once and stretched to fit.
  const ring = element('div', 'bag-ring', stage); ring.setAttribute('aria-hidden', 'true'); ring.hidden = true;
  paperLayer(ring, '0 0 120 80', '', g => shape('path', { d: 'M14 46C6 22 40 6 70 8 100 10 118 26 112 46 106 66 70 76 44 72 20 68 8 56 12 40', fill: 'none', stroke: '#b5443c', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g), INK);
  const targets = new Map();
  let open = !matchMedia('(max-width: 700px)').matches, picked = null, aimed = null, card = null, cursor = null, holding = '';
  // The line said on picking a thing up goes when it is put down, unless something has been said since.
  const speak = text => { holding = ''; say(text); };
  const local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  const point = event => { const box = stage.getBoundingClientRect(); return [event.clientX - box.left, event.clientY - box.top]; };
  const slotOf = id => row.querySelector(`[data-item="${id}"]`);
  // Where a thing goes back to: its slot, or the pocket while the row is folded away.
  const home = id => centre(local((open && slotOf(id) || mouth).getBoundingClientRect()));

  function render() {
    box.hidden = !bag.held.length && !bag.used.length;
    box.dataset.open = String(open); mouth.setAttribute('aria-expanded', String(open)); mouth.setAttribute('aria-label', `${BAG.label}（${bag.held.length} 樣東西）`);
    row.replaceChildren();
    for (const id of bag.held) {
      const slot = element('li', 'bag-slot', row), item = element('button', 'bag-item', slot); item.type = 'button'; item.dataset.item = id;
      item.setAttribute('aria-pressed', String(picked === id)); item.setAttribute('aria-label', `${ITEM_TEXT[id].name}：${BAG.how}`);
      paperLayer(item, '0 0 100 100', '', ITEM_ART[id], PAPER); bind(item, id);
    }
    if (!bag.held.length) element('li', 'bag-empty', row, BAG.empty);
    look.hidden = !picked || !open;
  }
  function choose(id) {
    picked = id && holds(bag, id) ? id : null; aim(null); cursor?.remove(); cursor = null;
    for (const item of row.querySelectorAll('.bag-item')) item.setAttribute('aria-pressed', String(item.dataset.item === picked));
    look.hidden = !picked || !open;
    if (picked) { sound.play('pick'); say(holding = BAG.picked(ITEM_TEXT[picked].name)); }
    else if (holding) { holding = ''; say(''); }
  }
  // The place under a point (the smallest, if one lies inside another); places gone from the page are forgotten. A finger
  // hides what it is over, so a touch may land a little further off (`pad`), when nothing is right under it.
  function placeAt(at, pad = 8) {
    // Places right under the point first; only when there are none, the ones just beside it.
    let best = null, area = Infinity, near = null, nearArea = Infinity;
    for (const node of targets.keys()) {
      if (!node.isConnected) { targets.delete(node); continue; }
      const rect = local(node.getBoundingClientRect()), size = rect.width * rect.height;
      if (!rect.width) continue;
      if (inside(at, rect) && size < area) { best = node; area = size; }
      else if (inside(at, rect, pad) && size < nearArea) { near = node; nearArea = size; }
    }
    return best ?? near;
  }
  const placeOf = node => { for (let at = node; at && at !== stage; at = at.parentElement) if (targets.has(at)) return at; return null; };
  function aim(node) {
    if (aimed === node) return;
    aimed?.classList.remove('is-aimed'); aimed = node; ring.hidden = !node; ring.classList.remove('is-on');
    if (!node) return;
    node.classList.add('is-aimed');
    const rect = local(node.getBoundingClientRect()), pad = Math.max(10, Math.min(rect.width, rect.height) * .18);
    Object.assign(ring.style, { left: `${rect.left - pad}px`, top: `${rect.top - pad}px`, width: `${rect.width + pad * 2}px`, height: `${rect.height + pad * 2}px` });
    void ring.offsetWidth; ring.classList.add('is-on');
  }
  // A paper copy of a thing, moved over the stage by its centre.
  function ghost(id, [x, y]) { const copy = element('span', 'bag-ghost', stage); copy.setAttribute('aria-hidden', 'true'); paperLayer(copy, '0 0 100 100', '', ITEM_ART[id], PAPER); place(copy, [x, y]); return copy; }
  const where = new WeakMap(), pose = ([x, y], extra = '') => `translate(${x - GHOST / 2}px, ${y - GHOST / 2}px) ${extra}`;
  const place = (copy, at, extra = '') => { where.set(copy, at); copy.style.transform = pose(at, extra); };
  // Glides a copy from where it is to `to` (lifted along an arc on the way when `arc`), then runs `then`.
  function glide(copy, to, { arc = 0, ms = 420, end = '', then = () => {} } = {}) {
    const from = copy.style.transform, [x, y] = where.get(copy) ?? to, last = pose(to, end);
    where.set(copy, to); copy.style.transform = last;
    if (still()) { then(); return; }
    const lifted = { transform: pose([(x + to[0]) / 2, Math.min(y, to[1]) - arc], 'rotate(-10deg)'), offset: .45 };
    copy.animate(arc ? [{ transform: from }, lifted, { transform: last }] : [{ transform: from }, { transform: last }], { duration: ms, easing: 'cubic-bezier(.3, .7, .3, 1)' }).finished.then(then, then);
  }
  // A place that does not take it shakes its head, once.
  const shake = node => { if (!still()) node.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px) rotate(-2deg)' }, { transform: 'translateX(6px) rotate(1.5deg)' }, { transform: 'translateX(0)' }], { duration: 380, composite: 'add' }); };
  const hop = () => { mouth.classList.remove('is-new'); void mouth.offsetWidth; mouth.classList.add('is-new'); };
  // A thing used up goes to paper scraps where it was used.
  function scraps([x, y]) {
    if (still()) return;
    for (let i = 0; i < 6; i++) {
      const bit = element('span', 'bag-scrap', stage); bit.setAttribute('aria-hidden', 'true');
      paperLayer(bit, '0 0 20 20', '', g => shape('path', { d: ['M3 4L16 2 18 14 6 17Z', 'M2 8L12 3 18 12 8 18Z', 'M4 3L17 6 13 17 3 13Z'][i % 3], fill: ['#c9a46a', '#fbf3df', '#e6d3ad'][i % 3] }, g), PAPER);
      const dx = (i - 2.5) * 16 + (i % 2 ? 6 : -6), dy = 30 + (i % 3) * 14;
      bit.animate([{ transform: `translate(${x - 8}px, ${y - 8}px)`, opacity: 1 }, { transform: `translate(${x - 8 + dx}px, ${y - 8 + dy}px) rotate(${(i - 3) * 70}deg)`, opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2, .6, .4, 1)', fill: 'forwards' });
      later(950, () => bit.remove());
    }
  }

  // Using a thing on a place (`copy`: the thing as it was let go there, or none when tapped): the place says whether it
  // takes it (true, or why not); taken, the game does its part, and the thing is kept, used up or left in place.
  function attempt(id, node, copy = null) {
    const spec = targets.get(node); aim(null);
    const at = centre(local(node.getBoundingClientRect())), verdict = spec?.accepts(id);
    if (verdict !== true) {
      shake(node); sound.play('nope'); speak(typeof verdict === 'string' ? verdict : BAG.wrong);
      if (copy) glide(copy, home(id), { then: () => { copy.remove(); slotOf(id)?.classList.remove('is-out'); } });
      choose(null); return false;
    }
    const kind = spend(bag, id); save(); choose(null);
    const line = spec.use(id, kind); if (typeof line === 'string') speak(line);
    const thing = copy ?? ghost(id, home(id));
    if (kind === 'tool') glide(thing, at, { ms: copy ? 160 : 380, then: () => { sound.play('pick'); glide(thing, home(id), { arc: 30, then: () => { thing.remove(); render(); } }); } });
    else if (kind === 'fitted') glide(thing, at, { ms: copy ? 180 : 380, end: 'scale(.7)', then: () => { sound.play('snap'); thing.classList.add('is-fitted'); later(500, () => thing.remove()); } });
    else glide(thing, at, { ms: copy ? 120 : 360, then: () => { sound.play('remove'); scraps(at); thing.remove(); } });
    if (kind !== 'tool') render();
    return true;
  }
  // A slot's thing: dragged out over the stage, or clicked to hold it (and clicked again to put it back).
  function bind(item, id) {
    let drag = null;
    on(item, 'pointerdown', event => { if (event.button > 0) return; event.preventDefault(); item.setPointerCapture(event.pointerId); drag = { pointer: event.pointerId, from: point(event), last: point(event), copy: null, pad: event.pointerType === 'mouse' ? 8 : 16 }; });
    on(item, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.pointer) return;
      drag.last = point(event);
      if (!drag.copy && Math.hypot(drag.last[0] - drag.from[0], drag.last[1] - drag.from[1]) < 6) return;
      if (!drag.copy) { choose(null); drag.copy = ghost(id, drag.last); drag.copy.classList.add('is-held'); item.classList.add('is-out'); sound.play('pick'); }
      place(drag.copy, drag.last, 'rotate(-6deg) scale(1.08)'); aim(placeAt(drag.last, drag.pad));
    });
    const end = event => {
      if (!drag || event.pointerId !== drag.pointer) return;
      const { copy, last, pad } = drag; drag = null;
      if (!copy) return;
      item.dataset.dragged = '1'; setTimeout(() => delete item.dataset.dragged, 0);
      copy.classList.remove('is-held');
      const node = event.type === 'pointercancel' ? null : placeAt(last, pad);
      if (node) attempt(id, node, copy);
      else { aim(null); sound.play('drop'); glide(copy, home(id), { ms: 300, then: () => { copy.remove(); item.classList.remove('is-out'); } }); }
    };
    on(item, 'pointerup', end); on(item, 'pointercancel', end); on(item, 'lostpointercapture', end);
    on(item, 'click', event => { if (item.dataset.dragged) { event.stopImmediatePropagation(); return; } choose(picked === id ? null : id); });
    on(item, 'dblclick', () => lookAt(id));
  }
  function lookAt(id) {
    if (!holds(bag, id) || card) return;
    const text = ITEM_TEXT[id], slot = slotOf(id); choose(null);
    card = inspect({ host: stage, sound, title: text.name, draw: ITEM_ART[id], words: text.look, back: { words: text.back }, from: slot && local(slot.getBoundingClientRect()), turn: BAG.turn(true), flip: BAG.flip, done: BAG.close, onClose: () => { card = null; } });
  }
  on(look, 'click', () => picked && lookAt(picked));
  on(mouth, 'click', () => { open = !open; sound.play(open ? 'open' : 'remove'); if (!open) choose(null); render(); });
  // Holding a thing: a place tapped (or Enter on it) gets it, instead of doing what it does when tapped empty-handed.
  on(stage, 'pointerdown', event => { if (picked && placeOf(event.target)) { event.preventDefault(); event.stopPropagation(); } }, { capture: true });
  on(stage, 'click', event => { const node = picked && placeOf(event.target); if (!node) return; event.preventDefault(); event.stopPropagation(); attempt(picked, node); }, { capture: true });
  on(stage, 'focusin', event => { if (picked) aim(placeOf(event.target)); });
  // With a mouse, the thing held follows the pointer as a small shadow, and the ring shows where it would go.
  on(stage, 'pointermove', event => {
    if (!picked || event.pointerType !== 'mouse' || box.contains(event.target)) { cursor?.remove(); cursor = null; return; }
    const at = point(event);
    if (!cursor) { cursor = element('span', 'bag-cursor', stage); cursor.setAttribute('aria-hidden', 'true'); paperLayer(cursor, '0 0 100 100', '', ITEM_ART[picked], PAPER); }
    cursor.style.transform = `translate(${at[0] + 12}px, ${at[1] + 10}px)`; aim(placeAt(at));
  });
  // Esc puts down what is held before it steps out of anything.
  on(document, 'keydown', event => { if (event.key === 'Escape' && picked && !card) { event.preventDefault(); event.stopPropagation(); choose(null); } }, { capture: true });
  render();
  return {
    // Picked up from `from` (a rect on the stage, or an element): it flies into the pocket. False if it was had before.
    give(id, from = null) {
      if (!take(bag, id)) return false;
      save(); const first = bag.held.length + bag.used.length === 1; open = true; render();
      const slot = slotOf(id), rect = from instanceof Element ? local(from.getBoundingClientRect()) : from;
      speak(BAG.got(ITEM_TEXT[id].name));
      if (rect && slot) {
        slot.classList.add('is-out'); const copy = ghost(id, centre(rect));
        glide(copy, home(id), { arc: 90, ms: 720, then: () => { copy.remove(); slot.classList.remove('is-out'); sound.play('pick'); hop(); } });
      } else hop();
      if (first) later(1600, () => {
        speak(BAG.tip);
        const hand = element('span', 'bag-finger', box); hand.setAttribute('aria-hidden', 'true'); paperLayer(hand, '0 0 60 60', '', mitten, PAPER);
        later(3600, () => hand.remove());
      });
      return true;
    },
    // A place in an open game that may take things: `accepts(id)` is true, or a line saying why not; `use(id, kind)` does
    // the game's part (and may return a line). Returns a function that forgets it.
    target(node, spec) { targets.set(node, spec); return () => { targets.delete(node); if (aimed === node) aim(null); }; },
    // Leaving a game: its places are forgotten and nothing stays held.
    clear() { targets.clear(); choose(null); },
    holds: id => holds(bag, id), ever: id => ever(bag, id),
    look: lookAt,
    destroy() { events.abort(); timers.forEach(clearTimeout); card?.close(); box.remove(); ring.remove(); cursor?.remove(); stage.querySelectorAll('.bag-ghost, .bag-scrap').forEach(node => node.remove()); },
  };
}
