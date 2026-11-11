// The barn's hay hoist. The rope over the pulley runs down to a winch on the wall, and the winch has lost its crank: a
// repair tag hangs on it, and turned by hand it will not budge. The wooden handle from the snowman's snow fits its square
// hub (from the pocket, cabin-bag.js). Turned round (dragged about the hub, or arrow keys), it winds the bale up as far
// as the rope goes; at the top a catch holds it. Up there the bale no longer hides the drawer in the wall: pulled out, it
// holds a box of matches and a note in two hands. Hooked and read stay kept (cabin-progress.js); the crank stays fitted.
// Pinned on the barn door: the reindeer's feeding table for Christmas morning (a volunteer job, cabin-feed.js),
// ticked once he has been fed by it.
import { paperLayer, shape } from './paper-art.js';
import { HOIST, WINCH } from './cabin-art.js';
import { FEED } from '../data/cabin-jobs.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
// One full turn of the crank winds in this much of the way up.
const PER_TURN = Math.PI * 2 * WINCH.spool / HOIST.lift;
// The feeding table as pinned up: a sheet with a red pin, lines of writing, a small reindeer in the corner; and the red
// ticks once the job is done (a layer of its own).
function notice(parent) {
  shape('path', { d: 'M8 10L92 6 94 92 6 94Z', fill: '#fffaf0' }, parent);
  shape('rect', { x: 14, y: 14, width: 52, height: 7, rx: 3, fill: '#b5443c', opacity: .8 }, parent);
  for (const y of [34, 50, 66]) shape('path', { d: `M14 ${y}h10M30 ${y}q12 -3 24 0t24 0`, fill: 'none', stroke: '#6f5a48', 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
  shape('path', { d: 'M70 84q4-10 12-8 6 2 4 8M74 78l-3-8m6 8l2-8', fill: 'none', stroke: '#8f5a3c', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, parent);
  shape('circle', { cx: 50, cy: 8, r: 5, fill: '#c63a33' }, parent);
}
const ticks = parent => { for (const y of [34, 50, 66]) shape('path', { d: `M84 ${y - 2}l4 5 8-11`, fill: 'none', stroke: '#b5443c', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent); };

export function pulleyGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onFound, fed = () => false, clue = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const state = progress.hoist, still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fitted = () => bag.ever('handle') && !bag.holds('handle');
  let pull = state.locked ? 1 : 0, turn = pull / PER_TURN * Math.PI * 2, notch = 0, fall = 0, drawerOpen = false;
  const winch = element('button', 'play-target hoist-winch', layer); winch.type = 'button'; winch.setAttribute('aria-label', '絞盤');
  const tag = element('button', 'play-target hoist-tag', layer); tag.type = 'button'; tag.setAttribute('aria-label', '絞盤上的維修標籤');
  const crank = element('button', 'hoist-crank', layer); crank.type = 'button'; crank.setAttribute('aria-label', '絞盤的把手：繞著轉，把乾草捲上去（也可以按方向鍵）');
  const hint = element('span', 'hoist-hint', layer); hint.textContent = '繞著轉 ↻'; hint.setAttribute('aria-hidden', 'true');
  const hook = element('button', 'hoist-hook', layer); hook.type = 'button'; hook.textContent = '扣上卡榫固定'; hook.hidden = true;
  const drawer = element('button', 'play-target hoist-drawer', layer); drawer.type = 'button'; drawer.setAttribute('aria-label', '乾草後面的抽屜'); drawer.hidden = true;
  const matches = element('button', 'play-target drawer-matches', layer); matches.type = 'button'; matches.setAttribute('aria-label', '抽屜裡的火柴盒'); matches.hidden = true;
  const paper = element('button', 'play-target drawer-note', layer); paper.type = 'button'; paper.setAttribute('aria-label', '抽屜裡摺起來的紙條'); paper.hidden = true;
  const loosen = element('button', 'hoist-release', layer); loosen.type = 'button'; loosen.textContent = '鬆開卡榫 ↺'; loosen.hidden = true;
  const table = element('button', 'play-target feed-table', layer); table.type = 'button'; table.setAttribute('aria-label', FEED.title);
  paperLayer(table, '0 0 100 100', '', notice, { paper: { scale: .3, grain: .45, shadow: .3 }, eager: true }); paperLayer(table, '0 0 100 100', 'feed-ticks', ticks, { paper: { scale: .2, grain: .5, shadow: 0, rim: '#ffffff00' }, eager: true });
  table.classList.toggle('is-done', fed());

  const place = (node, rect, pad = 0) => Object.assign(node.style, { left: `${rect.left - pad}px`, top: `${rect.top - pad}px`, width: `${rect.width + pad * 2}px`, height: `${rect.height + pad * 2}px` });
  // Part of a rect, as fractions of it: where the matchbox and the note lie in the open drawer.
  const part = (rect, [x0, y0, x1, y1]) => ({ left: rect.left + rect.width * x0, top: rect.top + rect.height * y0, width: rect.width * (x1 - x0), height: rect.height * (y1 - y0) });
  function layout() {
    const rects = cabin.hoistRects(); if (!rects) return;
    place(winch, rects.winch, 4); place(tag, rects.tag, 6); place(crank, rects.crank); place(drawer, rects.drawer, 6);
    // Pinned on the barn door's left leaf: in sight on a phone too, where the view shows only the barn's left half.
    const pinned = cabin.sheetRect('stable', [.375, .5, .485, .66]); if (pinned) place(table, pinned);
    place(matches, part(rects.drawer, [.12, .2, .48, .55])); place(paper, part(rects.drawer, [.5, .18, .86, .55]));
    const right = rects.crank.left + rects.crank.width + 10;
    Object.assign(hint.style, { left: `${right}px`, top: `${rects.crank.top + rects.crank.height * .3}px` });
    Object.assign(hook.style, { left: `${right}px`, top: `${rects.crank.top + rects.crank.height / 2}px` });
    Object.assign(loosen.style, { left: `${rects.wheel.left + rects.wheel.width + 12}px`, top: `${rects.wheel.top}px` });
  }
  // Every change goes through here: the scene follows, the ratchet clicks at each notch.
  function set(value) {
    pull = Math.max(0, Math.min(1, value)); cabin.hoist(pull, turn);
    const step = Math.floor(pull * 10); if (step !== notch) { notch = step; sound.play('click'); }
  }
  function settle() {
    const up = state.locked, ready = fitted() && !up;
    crank.hidden = !ready; hint.hidden = !ready || pull > .05; hook.hidden = !(ready && pull >= 1);
    winch.hidden = up; drawer.hidden = !up || drawerOpen; loosen.hidden = !up;
    matches.hidden = paper.hidden = !(up && drawerOpen); if (bag.ever('matches')) matches.hidden = true;
  }
  // Tried with no crank: it will not turn, and the tag on it swings.
  function stuck() { sound.play('nope'); cabin.swingTag(); say('絞盤卡卡的，轉不動。中間的方孔空著，好像少了什麼。'); }
  function wind(by) {
    if (state.locked || pull >= 1) return;
    turn += by; set(pull + Math.abs(by) / (Math.PI * 2) * PER_TURN);
    if (pull >= 1) atTop();
  }
  function atTop() { say('捲到頂了！乾草吊在半空中，把卡榫扣上就不會滑下來。'); settle(); hook.focus({ preventScroll: true }); }

  const forget = bag.target(winch, {
    accepts: id => id === 'handle' || '這個裝不上絞盤。',
    use: () => { cabin.fitCrank(true); later(400, () => { settle(); layout(); crank.focus({ preventScroll: true }); }); return '把手的方榫剛好插進絞盤中間的方孔。抓住把手繞著轉轉看。'; },
  });
  on(winch, 'click', () => { if (!fitted()) stuck(); });
  // The feeding table, read up close: its lines as pinned, by the clock but not in that order.
  let sheet = null;
  on(table, 'click', () => {
    sheet?.remove(); sound.play('open'); clue('feed-table');
    sheet = element('article', 'cabin-letter feed-card', layer); sheet.setAttribute('aria-label', FEED.title);
    element('h3', 'chair-title', sheet, FEED.title);
    const list = element('ul', 'feed-lines', sheet);
    for (const [time, food] of FEED.lines) { const item = element('li', fed() ? 'is-done' : '', list); element('span', 'feed-time', item, time); element('span', '', item, food); }
    element('p', 'feed-never', sheet, FEED.never); element('p', 'secret-note', sheet, fed() ? FEED.checked : FEED.note);
    const done = element('button', 'cabin-letter-close', sheet, '貼回去 ✓'); done.type = 'button';
    on(done, 'click', () => { sheet.remove(); sheet = null; sound.play('remove'); table.focus({ preventScroll: true }); });
    done.focus({ preventScroll: true });
  });
  on(tag, 'click', () => { cabin.swingTag(); sound.play('pick'); clue('repair-tag'); say('維修標籤：「下次使用前，記得把把手裝回去。」'); });

  // Turning the crank: the drag's angle about the hub, every bit of turn either way winds the rope in.
  let drag = null;
  const angle = event => { const box = crank.getBoundingClientRect(); return Math.atan2(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2)); };
  on(crank, 'pointerdown', event => {
    if (state.locked || event.button > 0) return;
    event.preventDefault(); crank.setPointerCapture(event.pointerId); cancelAnimationFrame(fall);
    drag = { id: event.pointerId, at: angle(event) }; crank.classList.add('is-turning'); sound.play('pick');
  });
  on(crank, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const now = angle(event), by = wrap(now - drag.at); drag.at = now;
    if (Math.abs(by) < 1.2) wind(by);
  });
  const letGo = event => { if (!drag || event.pointerId !== drag.id) return; drag = null; crank.classList.remove('is-turning'); };
  on(crank, 'pointerup', letGo); on(crank, 'pointercancel', letGo); on(crank, 'lostpointercapture', letGo);
  on(crank, 'keydown', event => {
    // Each press, half a turn.
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Enter', ' '].includes(event.key) || state.locked) return;
    event.preventDefault(); wind(Math.PI);
  });
  on(hook, 'click', () => {
    state.locked = true; save(); set(1); sound.play('snap'); settle();
    say('卡榫扣上了，乾草穩穩吊在半空中。牆腳原本被擋住的地方，露出一個小抽屜。'); drawer.focus({ preventScroll: true });
  });
  function openDrawer() {
    drawerOpen = true; cabin.openDrawer({ open: true, matches: !bag.ever('matches') }); sound.play('open'); settle();
    say(bag.ever('matches') ? '抽屜裡還放著那張摺起來的紙條。' : '拉開抽屜：裡面有一盒火柴，和一張摺起來的紙條。');
    (matches.hidden ? paper : matches).focus({ preventScroll: true });
  }
  on(drawer, 'click', openDrawer);
  on(matches, 'click', () => {
    if (!bag.give('matches', matches)) return;
    cabin.openDrawer({ open: true, matches: false }); settle(); paper.focus({ preventScroll: true });
  });
  // The note in two hands: one wrote the night's handover, someone else answered it.
  on(paper, 'click', () => {
    sound.play('open'); say('');
    const note = element('article', 'cabin-letter cabin-note', layer); note.setAttribute('aria-label', '抽屜裡的紙條');
    const first = element('p', 'note-line note-first', note); first.textContent = '12/24 夜班：禮物已分類。壁爐記得添柴。下一位辛苦了！';
    const second = element('p', 'note-line note-second', note); second.textContent = '收到';
    const mark = shape('svg', { viewBox: '0 0 90 34', class: 'note-mark', 'aria-hidden': 'true' }, second);
    shape('path', { d: 'M4 18L12 27 30 5', fill: 'none', stroke: 'currentColor', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mark);
    shape('path', { d: 'M40 24C44 10 50 8 52 16S56 30 60 18 66 6 70 18C72 24 78 26 86 14', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, mark);
    const close = element('button', 'cabin-letter-close', note); close.type = 'button'; close.textContent = '收好紙條 ✓'; clue('barn-note');
    on(close, 'click', () => {
      note.remove(); state.found = true; save(); onFound('stable'); sound.play('remove');
      say('紙條放回抽屜了。上面有兩種不同顏色的筆跡……'); paper.focus({ preventScroll: true });
    });
    close.focus({ preventScroll: true });
  });
  // Let down: the drawer is pushed shut first, then the bale's weight takes it back down, the crank spinning back.
  on(loosen, 'click', () => {
    state.locked = false; save(); drawerOpen = false; cabin.openDrawer({}); settle();
    say('卡榫鬆開了，乾草慢慢降回地上。'); drop(); (fitted() ? crank : winch).focus({ preventScroll: true });
  });
  function drop() {
    cancelAnimationFrame(fall);
    if (still()) { turn = 0; set(0); sound.play('thud'); settle(); return; }
    let before = performance.now();
    const step = now => {
      const delta = Math.min(.05, (now - before) / 1000); before = now;
      const by = Math.min(pull, delta * .8); turn -= by / PER_TURN * Math.PI * 2; set(pull - by);
      if (pull > 0) fall = requestAnimationFrame(step); else { sound.play('thud'); settle(); }
    };
    fall = requestAnimationFrame(step);
  }

  say(state.locked ? (state.found ? '乾草還吊著，牆腳的抽屜收著那張紙條。想再吊一次，就先鬆開卡榫。' : '乾草吊在半空中，牆腳露出一個小抽屜。') : fitted() ? '抓住絞盤的把手繞著轉，乾草就會升起來。' : '乾草堆在穀倉牆邊，繩子從滑輪垂下來，接到牆上的絞盤。');
  set(pull); settle(); layout();
  later(600, layout); later(1300, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => {
    events.abort(); watch.disconnect(); cancelAnimationFrame(fall); forget(); sheet?.remove();
    // Leaving with the catch undone lets the bale back down to the snow; the drawer is pushed shut behind it.
    if (!state.locked && pull > 0) cabin.hoist(0);
    if (drawerOpen) cabin.openDrawer({});
  };
}
