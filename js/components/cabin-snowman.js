// The snowman's dress-up game. A paper wardrobe opens beside him with four drawers (head, neck, face, hand): drag an
// accessory onto him and it settles into place once it comes close, tap what he wears to take it off, or start over.
// Every change is kept (cabin-progress.js), so he is still dressed the next time you come by.
import { paperLayer } from './paper-art.js';
import { COMBOS, PLACES, WARDROBE, itemFor } from './cabin-wardrobe.js';
import { DEFAULT_OUTFIT, dressed } from '../services/cabin-progress.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .2 }, eager: true };
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

export function snowmanGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, confetti }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const outfit = progress.outfit, local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  let drawer = 'head';
  say('把配件拖到雪人身上，靠近就會自己戴好；點雪人身上的配件可以拿下來。');

  const tray = element('div', 'wardrobe', layer); tray.setAttribute('role', 'group'); tray.setAttribute('aria-label', '雪人的衣櫃');
  const tabs = element('div', 'wardrobe-tabs', tray), shelf = element('div', 'wardrobe-items', tray);
  for (const [place, { name }] of Object.entries(PLACES)) {
    const tab = element('button', '', tabs); tab.type = 'button'; tab.dataset.place = place; tab.textContent = name;
    on(tab, 'click', () => { drawer = place; stock(); });
  }
  const reset = element('button', 'wardrobe-reset', tray); reset.type = 'button'; reset.textContent = '恢復原樣 ↺';
  // A drop target over each place on the snowman; a filled place is also a button that takes its accessory off.
  const spots = {};
  for (const place of Object.keys(PLACES)) {
    const spot = element('button', 'wardrobe-place', layer); spot.type = 'button'; spot.dataset.place = place; spots[place] = spot;
    on(spot, 'click', () => remove(place));
  }
  function layout() {
    for (const [place, spot] of Object.entries(spots)) {
      const rect = cabin.placeRect(place); if (!rect) continue;
      Object.assign(spot.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    }
  }
  function mark() {
    for (const [place, spot] of Object.entries(spots)) {
      const item = itemFor(outfit[place]);
      spot.disabled = !item; spot.classList.toggle('is-filled', Boolean(item));
      spot.setAttribute('aria-label', item ? `拿下雪人的${item.name}` : `雪人的${PLACES[place].name}`);
    }
    for (const tab of tabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.place === drawer));
    for (const button of shelf.children) button.setAttribute('aria-pressed', String(outfit[drawer] === button.dataset.id));
  }
  // The open drawer: one button per accessory, each a paper picture you can drag (or press) onto him.
  function stock() {
    shelf.replaceChildren();
    for (const item of WARDROBE.filter(entry => entry.place === drawer)) {
      const button = element('button', 'wardrobe-item', shelf); button.type = 'button'; button.dataset.id = item.id;
      button.setAttribute('aria-label', item.name); button.title = item.name;
      paperLayer(button, item.thumb, '', parent => item.draw(parent), PAPER);
      grab(button, item);
    }
    mark();
  }
  // Which place a pointer is over (a little generously); the closest one wins.
  function nearest(point) {
    let best = null, distance = Infinity;
    for (const place of Object.keys(PLACES)) {
      const rect = cabin.placeRect(place); if (!rect) continue;
      const pad = 26, hit = point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;
      const middle = centre(rect), gap = Math.hypot(middle.x - point.x, middle.y - point.y);
      if (hit && gap < distance) { best = place; distance = gap; }
    }
    return best;
  }
  const at = event => { const box = stage.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  // While dragged, a paper copy follows the pointer; it then flies into place, or back to its drawer.
  function lift(button, item) {
    const rect = local(button.getBoundingClientRect()), size = rect.width * 1.25, ghost = element('div', 'wardrobe-ghost', layer);
    ghost.style.width = ghost.style.height = `${size}px`; ghost.dataset.size = size;
    paperLayer(ghost, item.thumb, '', parent => item.draw(parent), PAPER);
    return ghost;
  }
  const move = (ghost, point) => { const half = Number(ghost.dataset.size) / 2; ghost.style.translate = `${point.x - half}px ${point.y - half}px`; };
  function fly(ghost, point, settle) {
    ghost.classList.add('is-flying'); move(ghost, point); if (settle) ghost.classList.add('is-settled');
    later(300, () => ghost.remove());
  }
  function grab(button, item) {
    let drag = null, dragged = false;
    on(button, 'pointerdown', event => {
      if (event.button > 0) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); dragged = false;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ghost: null };
    });
    on(button, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.ghost) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
        drag.ghost = lift(button, item); layer.dataset.dragging = item.place; button.classList.add('is-lifted'); layout(); sound.play('pick');
      }
      const point = at(event), near = nearest(point);
      move(drag.ghost, point);
      for (const [name, spot] of Object.entries(spots)) spot.classList.toggle('is-near', name === near);
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { ghost } = drag; drag = null;
      delete layer.dataset.dragging; button.classList.remove('is-lifted');
      for (const spot of Object.values(spots)) spot.classList.remove('is-near');
      if (!ghost) return;
      dragged = true;
      const point = at(event), near = event.type === 'pointerup' ? nearest(point) : null;
      if (near === item.place) { fly(ghost, centre(cabin.placeRect(near)), true); wear(item); return; }
      // Wrong place, or let go in the snow: it floats gently back to its drawer.
      if (near) { sound.play('nope'); say(`${item.name}是戴在${PLACES[item.place].name}的喔。`); } else sound.play('drop');
      fly(ghost, centre(local(button.getBoundingClientRect())), false);
    };
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop);
    // A tap or Enter tries it on at once, or takes it off if he is already wearing it.
    on(button, 'click', () => { if (dragged) { dragged = false; return; } if (outfit[item.place] === item.id) remove(item.place); else wear(item); });
  }

  function wear(item) {
    const before = { ...outfit };
    outfit[item.place] = item.id; save(); cabin.dress(item.place, item.id); cabin.wave('snowman'); sound.play('snap'); mark();
    react(before, `戴上${item.name}了！`);
  }
  function remove(place) {
    const item = itemFor(outfit[place]); if (!item) return;
    outfit[place] = null; save(); cabin.dress(place, null); sound.play('remove'); mark();
    say(`拿下${item.name}了。`);
  }
  // All dressed for the first time: he spins and paper confetti flies. Some outfits make him play a part.
  function react(before, line) {
    const matches = (combo, look) => Object.entries(combo.needs).every(([place, id]) => look[place] === id);
    const combo = COMBOS.find(entry => matches(entry, outfit) && !matches(entry, before)), finished = dressed(outfit) && !dressed(before);
    if (finished) { cabin.snowmanAct('spin'); confetti(cabin.rect('snowman')); later(120, () => sound.play('cheer')); onFound('snowman'); }
    if (combo) {
      if (!progress.combos.includes(combo.id)) { progress.combos.push(combo.id); save(); }
      later(finished ? 1500 : 200, () => { cabin.snowmanAct(combo.act); sound.play('jingle'); });
      say(combo.line); return;
    }
    say(finished ? '雪人從頭到腳都打扮好了！他開心地轉了一圈。' : line);
  }
  on(reset, 'click', () => {
    Object.assign(outfit, DEFAULT_OUTFIT); save();
    for (const place of Object.keys(PLACES)) cabin.dress(place, outfit[place]);
    sound.play('remove'); mark(); say('雪人換回剛堆好的樣子，只有胡蘿蔔鼻子。');
  });

  stock(); layout();
  // The camera may still be settling when the game opens, and the stage can change size: keep the targets on him.
  later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); };
}
