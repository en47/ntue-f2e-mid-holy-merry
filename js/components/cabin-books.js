// The bookcase up close. While Santa is home the books stay put (he is right there); once he has gone out to the reindeer
// they can be taken down: drag a book (it follows the hand, lifted off the shelf) and let it go over a place, or tap a book
// and then a place. A book goes into an empty place or swaps with the one there. When the four places left of the SANTA
// picture book spell MORE (cabin-story.js decides, not the AI), the gold letters flash and the bookcase swings open.
import { homeShelf, moveBook, solved } from '../services/cabin-story.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const HINTS = ['燙金的那幾本書，好像特別重要。', 'SANTA 繪本左邊，正好空著四個位置。', '把燙金的四本排成一個英文字，放在 SANTA 前面。'];

export function booksGame({ layer, stage, cabin, say, later, sound, progress, save, onOpen, toggle, restart }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const story = progress.story;
  // Standing open: the way in is behind it, or it can be pushed shut (and then played again).
  if (story.opened && !story.shut) {
    say('書櫃轉開了，後面是那個小房間。');
    const tools = element('div', 'books-tools', layer), enter = element('button', '', tools, '走進小房間 →'), shut = element('button', '', tools, '關上書櫃 ↺');
    enter.type = shut.type = 'button';
    on(enter, 'click', () => cabin.setView('secret'));
    on(shut, 'click', () => { tools.hidden = true; toggle(false); later(2800, restart); });
    enter.focus({ preventScroll: true });
    return () => events.abort();
  }
  // Shut again after it was solved, it can be played again: the books come down whether Santa is home or not (he knows you
  // know), MORE opens it once more, and while the books still spell it, it can simply be pushed open.
  const replay = story.opened;
  const places = Array.from({ length: 13 }, (_, place) => { const button = element('button', 'books-place', layer); button.type = 'button'; button.dataset.place = place; return button; });
  const tools = element('div', 'books-tools', layer), push = element('button', '', tools, '推開書櫃 →'), reset = element('button', '', tools, '全部放回 ↺'), hint = element('button', '', tools, '需要提示嗎？');
  push.type = reset.type = hint.type = 'button'; hint.hidden = true;
  let shelf = story.shelf, picked = -1, moves = 0, hints = 0, done = false;
  const home = cabin.santaHome && !replay;
  say(replay ? (solved(shelf) ? '書還排著 MORE SANTA，可以直接推開；想再玩一次，就全部放回重拼。' : '書櫃關上了。把書重新排好，再拼一次看看。') : home ? '書背上的字拼出 HOLY MERRY……聖誕老人就坐在旁邊，不好意思亂動他的書。' : '聖誕老人出門了。書櫃上的書，好像可以抽出來。');
  tools.hidden = home;

  function layout() {
    const rects = cabin.bookRects(shelf);
    rects.forEach((rect, place) => {
      const button = places[place], w = Math.max(28, rect.width), h = Math.max(44, rect.height);
      Object.assign(button.style, { left: `${rect.left + rect.width / 2 - w / 2}px`, top: `${rect.top + rect.height - h}px`, width: `${w}px`, height: `${h}px` });
      button.classList.toggle('is-empty', !rect.id); button.classList.toggle('is-picked', place === picked);
      button.disabled = home || done;
      button.setAttribute('aria-label', rect.id ? `書：${rect.id.at(5).toUpperCase()}${place > 8 ? '（在 SANTA 旁邊）' : ''}` : `空位 ${place - 8}`);
    });
  }
  // Pushed open as it stands, when the books still spell MORE.
  const showPush = () => { push.hidden = !replay || done || !solved(shelf); };
  on(push, 'click', () => { done = true; tools.hidden = true; for (const button of places) button.hidden = true; toggle(true); later(2800, restart); });
  function settle() {
    cabin.placeBooks(shelf); story.shelf = shelf; save(); layout(); showPush();
    if (!solved(shelf)) { if (++moves >= 8 && hints < HINTS.length) hint.hidden = false; return; }
    // MORE SANTA: a flash of gold, a wooden click and a shudder, and the case swings open.
    done = true; tools.hidden = true; for (const button of places) button.hidden = true; sound.play('click'); cabin.glintBooks(); say('');
    later(700, () => { sound.play('thud'); say('喀——書櫃裡傳來木頭機關的聲音。'); });
    later(1500, () => { sound.play('creak'); cabin.openBookcase(true); story.opened = true; story.shut = false; save(); onOpen(); });
    later(4200, () => {
      say('書櫃慢慢轉開了，後面還有一個小房間。');
      const enter = element('button', 'books-enter', layer, '走進書櫃後的小房間 →'); enter.type = 'button';
      on(enter, 'click', () => cabin.setView('secret')); enter.focus({ preventScroll: true });
    });
  }
  function move(from, to) { const next = moveBook(shelf, from, to); if (next === shelf) return; shelf = next; sound.play('snap'); settle(); }
  // One book in hand at a time, and the drag remembers which. It is followed on the window (capture phase), so the book is
  // let go wherever the release lands. A release swallowed before it reaches the page (some browser extensions do that)
  // still ends the drag: the browser takes the pointer back from the button, and the book is let go where it was held. A
  // book somehow still in hand when the next one is taken goes back to its place first.
  let drag = null, dragEnded = -Infinity;
  const follow = (type, handler) => window.addEventListener(type, handler, { capture: true, signal: events.signal });
  function letGo(event) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const { moved, id } = drag; drag = null; if (!moved) return;
    dragEnded = performance.now();
    const to = cabin.dropBook(id), from = shelf.indexOf(id);
    if (event.type !== 'pointercancel' && to >= 0 && from >= 0 && to !== from) move(from, to); else { cabin.placeBooks(shelf); sound.play('drop'); }
  }
  follow('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    if (!drag.moved) { drag.moved = true; sound.play('pick'); picked = -1; layout(); }
    cabin.holdBook(drag.id, event.clientX, event.clientY);
  });
  follow('pointerup', letGo); follow('pointercancel', letGo);
  places.forEach((button, place) => {
    on(button, 'pointerdown', event => {
      if (event.button > 0 || button.disabled || !shelf[place]) return;
      if (drag) letGo({ type: 'pointercancel', pointerId: drag.pointer });
      event.preventDefault(); try { button.setPointerCapture(event.pointerId); } catch {}
      drag = { pointer: event.pointerId, id: shelf[place], x: event.clientX, y: event.clientY, moved: false };
    });
    on(button, 'lostpointercapture', letGo);
    // A tap (or Enter) picks a book; a second tap on a place puts it there. The click that ends a drag is not a tap.
    on(button, 'click', () => {
      if (performance.now() - dragEnded < 350) return;
      if (picked < 0) { if (!shelf[place]) return; picked = place; sound.play('pick'); say('拿起來了，再點一個位置放下（按 Esc 放回原位）。'); layout(); return; }
      const from = picked; picked = -1;
      if (from === place) { layout(); say(''); return; }
      move(from, place); say('');
    });
  });
  // Esc puts a picked book back, wherever focus is (a book taken by mouse or finger never has it), before the page takes
  // Esc to step back out of the close-up.
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && picked >= 0) { event.preventDefault(); picked = -1; layout(); say(''); } }, { capture: true, signal: events.signal });
  on(reset, 'click', () => { shelf = homeShelf(); picked = -1; sound.play('remove'); settle(); say('書都放回原來的位置了。'); });
  // Hints come one at a time, and the answer only when asked for twice.
  on(hint, 'click', () => {
    if (hints < HINTS.length) { say(HINTS[hints++]); return; }
    if (hint.dataset.sure) { say('完整解法：依序把 M、O、R、E 放在 SANTA 前面。'); hint.hidden = true; return; }
    hint.dataset.sure = '1'; hint.textContent = '真的要看答案嗎？'; say('再按一次就會看到完整解法。');
  });
  later(45000, () => { if (!done && !home) hint.hidden = false; });

  showPush(); layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); if (!done) cabin.placeBooks(shelf); };
}
