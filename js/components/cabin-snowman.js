// The snowman's dress-up game. A paper wardrobe opens beside him with four drawers (head, neck, face, hand): tap an
// accessory and it flies onto him; tap it again, or tap it on him, to take it off; or start over. Every change is kept
// (cabin-progress.js), so he is still dressed the next time you come by.
import { paperLayer } from './paper-art.js';
import { COMBOS, PLACES, REMEMBERED, WARDROBE, itemFor } from './cabin-wardrobe.js';
import { showOrnament } from './cabin-ornaments.js';
import { DEFAULT_OUTFIT, dressed } from '../services/cabin-progress.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .2 }, eager: true };
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
// The picture in the drawer: most accessories show their own drawing; a pair of mittens has a tidier icon of its own.
const picture = item => item.icon ?? [item.thumb, item.draw];

export function snowmanGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, confetti, clue = () => {}, gift = () => false }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const outfit = progress.outfit, local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  let drawer = 'head';
  say('點衣櫃裡的配件，就會穿到雪人身上；再點一次，或點雪人身上的配件，就能拿下來。');

  const tray = element('div', 'wardrobe', layer); tray.setAttribute('role', 'group'); tray.setAttribute('aria-label', '雪人的衣櫃');
  const tabs = element('div', 'wardrobe-tabs', tray), shelf = element('div', 'wardrobe-items', tray);
  for (const [place, { name }] of Object.entries(PLACES)) {
    const tab = element('button', '', tabs); tab.type = 'button'; tab.dataset.place = place; tab.textContent = name;
    on(tab, 'click', () => { drawer = place; stock(); });
  }
  const reset = element('button', 'wardrobe-reset', tray); reset.type = 'button'; reset.textContent = '恢復原樣 ↺';
  // Over each place on the snowman, a button that takes off what he wears there.
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
  // The open drawer: one paper picture per accessory. A tap (or Enter) puts it on, or takes it off if he already wears it.
  function stock() {
    shelf.replaceChildren();
    for (const item of WARDROBE.filter(entry => entry.place === drawer)) {
      const button = element('button', 'wardrobe-item', shelf), [view, draw] = picture(item);
      button.type = 'button'; button.dataset.id = item.id; button.setAttribute('aria-label', item.name); button.title = item.name;
      paperLayer(button, view, '', parent => draw(parent), PAPER);
      on(button, 'click', () => { if (outfit[item.place] === item.id) remove(item.place); else { fly(button, item); wear(item); } });
    }
    mark();
  }
  // A paper copy hops from the drawer to its place on him, so you can see where it went.
  function fly(button, item) {
    const from = local(button.getBoundingClientRect()), target = cabin.placeRect(item.place), [view, draw] = picture(item);
    if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const size = from.width, ghost = element('div', 'wardrobe-ghost', layer), move = point => { ghost.style.translate = `${point.x - size / 2}px ${point.y - size / 2}px`; };
    ghost.style.width = ghost.style.height = `${size}px`;
    paperLayer(ghost, view, '', parent => draw(parent), PAPER);
    move(centre(from));
    requestAnimationFrame(() => requestAnimationFrame(() => { ghost.classList.add('is-flying', 'is-settled'); move(centre(target)); }));
    later(380, () => ghost.remove());
  }

  function wear(item) {
    const before = { ...outfit };
    outfit[item.place] = item.id; save(); cabin.dress(item.place, item.id); cabin.wave('snowman'); sound.play('snap'); mark();
    react(before, `穿上${item.name}了！`);
  }
  function remove(place) {
    const item = itemFor(outfit[place]); if (!item) return;
    outfit[place] = null; save(); cabin.dress(place, null); sound.play('remove'); mark();
    say(`拿下${item.name}了。`);
  }
  // All dressed for the first time: he spins and paper confetti flies. Some outfits make him play a part.
  function react(before, line) {
    const matches = (combo, look) => Object.entries(combo.needs).every(([place, id]) => look[place] === id);
    // Dressed just as in the polaroid on the hat rack (once it has been seen): he remembers, and something falls from his scarf.
    const remembers = look => matches({ needs: REMEMBERED }, look);
    if (remembers(outfit) && !remembers(before) && progress.clues.includes('snowman-photo') && !progress.ornaments.includes('E')) { say('雪人愣了一下，歪著頭……好像想起了什麼。'); later(1300, recall); return; }
    const combo = COMBOS.find(entry => matches(entry, outfit) && !matches(entry, before)), finished = dressed(outfit) && !dressed(before);
    if (finished) { cabin.snowmanAct('spin'); confetti(cabin.rect('snowman')); later(120, () => sound.play('cheer')); onFound('snowman'); }
    if (combo) {
      if (!progress.combos.includes(combo.id)) { progress.combos.push(combo.id); save(); }
      later(finished ? 1500 : 200, () => { cabin.snowmanAct(combo.act); sound.play('jingle'); });
      say(combo.line); return;
    }
    say(finished ? '雪人從頭到腳都打扮好了！他開心地轉了一圈。' : line);
  }
  // He remembers: from his scarf falls Elo's welcome ornament.
  function recall() {
    cabin.snowmanAct('hop'); sound.play('jingle'); gift('E');
    const card = element('article', 'cabin-letter piece-card', layer); card.setAttribute('aria-label', '雪人圍巾裡掉出來的東西');
    const words = element('p', 'piece-words', card); words.textContent = '雪人的圍巾裡，掉出一個紫色的紙圓球吊飾，綁著一張小卡片——是艾洛留給新替身的見面禮。';
    const done = element('button', 'cabin-letter-close', card); done.type = 'button'; done.textContent = '收好 ✓';
    showOrnament(card, 'E', done);
    done.addEventListener('click', () => { card.remove(); sound.play('remove'); say('吊飾收好了。'); });
    done.focus({ preventScroll: true });
  }
  on(reset, 'click', () => {
    Object.assign(outfit, DEFAULT_OUTFIT); save();
    for (const place of Object.keys(PLACES)) cabin.dress(place, outfit[place]);
    sound.play('remove'); mark(); say('雪人換回剛堆好的樣子，只有胡蘿蔔鼻子。');
  });

  stock(); layout();
  // The camera may still be settling when the game opens, and the stage can change size: keep the buttons on him.
  later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); };
}
