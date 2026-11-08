// The bookcase up close. While Santa is home the books stay put (he is right there); once he has gone out to the reindeer
// they can be taken down: drag a book (it follows the hand, lifted off the shelf) and let it go over a place, or tap a book
// and then a place. A book goes into an empty place or swaps with the one there. When the four places left of the SANTA
// picture book spell MORE (cabin-story.js decides, not the AI), the gold letters flash and the bookcase swings open.
import { homeShelf, moveBook, solved } from '../services/cabin-story.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const HINTS = ['燙金的那幾本書，好像特別重要。', 'SANTA 繪本左邊，正好空著四個位置。', '把燙金的四本排成一個英文字，放在 SANTA 前面。'];

export function booksGame({ layer, stage, cabin, say, later, sound, progress, save, onOpen }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const story = progress.story;
  if (story.opened) { say('書櫃已經轉開了，後面有一個小房間。'); return () => events.abort(); }
  // A slip tucked in at the end of the shelf, in someone's hand.
  const slip = element('p', 'books-slip', layer, "There's always room for more."); slip.setAttribute('lang', 'en');
  const places = Array.from({ length: 13 }, (_, place) => { const button = element('button', 'books-place', layer); button.type = 'button'; button.dataset.place = place; return button; });
  const tools = element('div', 'books-tools', layer), reset = element('button', '', tools, '全部放回 ↺'), hint = element('button', '', tools, '需要提示嗎？');
  reset.type = hint.type = 'button'; hint.hidden = true;
  let shelf = story.shelf, picked = -1, moves = 0, hints = 0, done = false;
  const home = cabin.santaHome;
  say(home ? '書背上的字拼出 HOLY MERRY……聖誕老人就坐在旁邊，不好意思亂動他的書。' : '聖誕老人出門了。書櫃上的書，好像可以抽出來。');
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
    const first = rects[9];
    Object.assign(slip.style, { left: `${first.left - 6}px`, top: `${first.top + first.height + 6}px` });
  }
  function settle() {
    cabin.placeBooks(shelf); story.shelf = shelf; save(); layout();
    if (!solved(shelf)) { if (++moves >= 8 && hints < HINTS.length) hint.hidden = false; return; }
    // MORE SANTA: a flash of gold, a wooden click and a shudder, and the case swings open.
    done = true; tools.hidden = true; slip.hidden = true; for (const button of places) button.hidden = true; sound.play('click'); cabin.glintBooks(); say('');
    later(700, () => { sound.play('thud'); say('喀——書櫃裡傳來木頭機關的聲音。'); });
    later(1500, () => { sound.play('creak'); cabin.openBookcase(true); story.opened = true; save(); onOpen(); });
    later(4200, () => say('書櫃慢慢轉開了，後面還有一個小房間。'));
  }
  function move(from, to) { const next = moveBook(shelf, from, to); if (next === shelf) return; shelf = next; sound.play('snap'); settle(); }
  places.forEach((button, place) => {
    let drag = null, dragged = false;
    on(button, 'pointerdown', event => {
      if (event.button > 0 || button.disabled || !shelf[place]) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); dragged = false;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    });
    on(button, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
      if (!drag.moved) { drag.moved = true; sound.play('pick'); picked = -1; }
      cabin.holdBook(shelf[place], event.clientX, event.clientY);
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved } = drag; drag = null; if (!moved) return;
      dragged = true;
      const to = cabin.dropBook(shelf[place]);
      if (to >= 0 && to !== place) move(place, to); else { cabin.placeBooks(shelf); sound.play('drop'); }
    };
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop);
    // A tap (or Enter) picks a book; a second tap on a place puts it there.
    on(button, 'click', () => {
      if (dragged) { dragged = false; return; }
      if (picked < 0) { if (!shelf[place]) return; picked = place; sound.play('pick'); say('拿起來了，再點一個位置放下（按 Esc 放回原位）。'); layout(); return; }
      const from = picked; picked = -1;
      if (from === place) { layout(); say(''); return; }
      move(from, place); say('');
    });
    on(button, 'keydown', event => { if (event.key === 'Escape' && picked >= 0) { event.preventDefault(); picked = -1; layout(); say(''); } });
  });
  on(reset, 'click', () => { shelf = homeShelf(); picked = -1; sound.play('remove'); settle(); say('書都放回原來的位置了。'); });
  // Hints come one at a time, and the answer only when asked for twice.
  on(hint, 'click', () => {
    if (hints < HINTS.length) { say(HINTS[hints++]); return; }
    if (hint.dataset.sure) { say('完整解法：依序把 M、O、R、E 放在 SANTA 前面。'); hint.hidden = true; return; }
    hint.dataset.sure = '1'; hint.textContent = '真的要看答案嗎？'; say('再按一次就會看到完整解法。');
  });
  later(45000, () => { if (!done && !home) hint.hidden = false; });

  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); if (!done) cabin.placeBooks(shelf); };
}
