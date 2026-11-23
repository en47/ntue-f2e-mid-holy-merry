// The little room behind the bookcase, looked into from its doorway. Its things can be picked up and read: the name tags,
// the shift log and the rulebook (these three tell the secret), and the register, the stamps, the hats and the sorting
// rack. Each opens as a sheet of paper over the scene. Once the three have been read, the visitor knows (cabin-story.js),
// and the register's newest page has a blank row they may sign to volunteer (`join`, `quit`: cabin-play.js).
import { ITEM_ART } from './cabin-items.js';
import { SUBSTITUTES, workMark } from './cabin-art.js';
import { inked } from './cabin-paper.js';
import { paperLayer, shape } from './paper-art.js';
import { NOTEBOOK } from '../data/cabin-clues.js';
import { CLUES, LOG_GIVEN, MAIL, NIGHTS, SUBSTITUTES as WHO, TASKS, canSign, canStay, canWish, knowsSantas, logSolved, logWrong, mailFor, opens, points, signedUp, sortWrong } from '../services/cabin-story.js';
import { COLOUR_NAMES, DUTY, INK, JOBS, LOG, LOG_FILES, MARKS, MORNING, NAMES, NOTES, RACK, REGISTER, RULES } from '../data/cabin-secret.js';
import { VOLUNTEER_LETTERS } from '../data/cabin-letters.js';
import { polaroid } from './cabin-photo.js';
import { showOrnament } from './cabin-ornaments.js';
import { endingStamps } from './cabin-ending-stamps.js';
import { CORD, PENCIL, RECORD, STAY, WISH, WISHES } from '../data/cabin-finale.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
const COLOURS = Object.fromEntries(SUBSTITUTES);
// What the snow left of a cell of the shift log, in an 80 × 44 box: a blot of its writer's ink, running, or a pale stain
// where it washed out altogether.
function blot(ink, colour, seed) {
  const round = (cx, cy, r, sx, sy) => { let d = ''; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, rr = r * (.72 + noise(seed + i) * .5); d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr * sx).toFixed(1)} ${(cy + Math.sin(a) * rr * sy).toFixed(1)}`; } return `${d}Z`; };
  shape('path', { d: round(40, 20, 14, 1.6, .85), fill: colour, opacity: .32 }, ink);
  shape('path', { d: round(38, 20, 8, 1.5, .8), fill: colour, opacity: .38 }, ink);
  for (const [x, l] of [[30 + noise(seed) * 8, 10], [48 + noise(seed + 1) * 8, 7]]) shape('path', { d: `M${x - 1.6} 28Q${x} ${28 + l} ${x + 1.6} 28Z`, fill: colour, opacity: .35 }, ink);
}
// The cord's little lock, 120 × 130: a brass body with four dial windows (the digits are buttons laid over them) and the
// red cord through its shackle. The shackle is a piece of its own, so it can spring open.
const BRASS = { paper: { scale: .35, grain: .4, shadow: .25 }, eager: true };
function lockBody(paper) {
  shape('path', { d: 'M-6 48C20 40 40 58 60 52S100 40 126 50', fill: 'none', stroke: '#b5443c', 'stroke-width': 5, 'stroke-linecap': 'round' }, paper);
  shape('rect', { x: 14, y: 52, width: 92, height: 70, rx: 12, fill: '#c99a3c' }, paper);
  shape('rect', { x: 14, y: 52, width: 92, height: 10, rx: 5, fill: '#dcb257' }, paper);
  for (let i = 0; i < 4; i++) shape('rect', { x: 21 + i * 20.5, y: 72, width: 16, height: 30, rx: 3, fill: '#fbf3df', stroke: '#8f6a2c', 'stroke-width': 2 }, paper);
  shape('circle', { cx: 60, cy: 112, r: 3.4, fill: '#7a5a22' }, paper);
}
function lockShackle(paper) {
  shape('path', { d: 'M34 58V36C34 14 86 14 86 36V58', fill: 'none', stroke: '#9b978c', 'stroke-width': 9, 'stroke-linecap': 'round' }, paper);
  shape('path', { d: 'M37 54V37C37 19 83 19 83 37V54', fill: 'none', stroke: '#c9c5b9', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, paper);
}
// The sorting rack's pigeonholes, 100 × 76: a wooden box, dark inside, a brass plate for the name. And the envelopes, 120 × 80,
// in a few papers, each with its stamp; the postmark is ink of its own.
function pigeonhole(paper) {
  shape('rect', { x: 2, y: 2, width: 96, height: 72, rx: 5, fill: '#8f5a3c' }, paper);
  shape('rect', { x: 9, y: 8, width: 82, height: 47, rx: 3, fill: '#5e3e29' }, paper);
  shape('rect', { x: 30, y: 58, width: 40, height: 16, rx: 3, fill: '#e0b04f' }, paper); shape('rect', { x: 33, y: 60.5, width: 34, height: 11, rx: 2, fill: '#fff6dc' }, paper);
}
const ENVELOPES = [['#fffaf0', '#e4d6bf'], ['#e6eff5', '#b9c9d6'], ['#f3e3c3', '#cbb990'], ['#fde6c0', '#d9b98a']];
const envelope = ([fill, edge], fresh) => paper => {
  shape('rect', { x: 3, y: 4, width: 114, height: 72, rx: 4, fill }, paper);
  shape('path', { d: 'M5 6L60 44L115 6', fill: 'none', stroke: edge, 'stroke-width': 2 }, paper);
  shape('rect', { x: 92, y: 10, width: 18, height: 22, rx: 1, fill: fresh ? '#b5443c' : '#3f6653' }, paper); shape('rect', { x: 95, y: 13, width: 12, height: 16, fill: '#fbf3df', opacity: .5 }, paper);
};
const postmark = ink => { shape('circle', { cx: 34, cy: 42, r: 24, fill: 'none', stroke: '#3f4f5f', 'stroke-width': 1.8 }, ink); shape('circle', { cx: 34, cy: 42, r: 19, fill: 'none', stroke: '#3f4f5f', 'stroke-width': .9 }, ink); };
const PILE = ['m4', 'tomas', 'm1', 'm6', 'm3', 'aya', 'm2', 'm5'];
function stain(ink, seed) {
  shape('ellipse', { cx: 40 + noise(seed) * 4, cy: 22, rx: 30, ry: 13, fill: '#9fb3c4', opacity: .16 }, ink);
  shape('ellipse', { cx: 38, cy: 21, rx: 24, ry: 10, fill: 'none', stroke: '#9fb3c4', 'stroke-width': 1.2, opacity: .4 }, ink);
}
// Each thing: the sheet it is on, where on that sheet ([left, top, right, bottom]), and its name. The old record book comes
// after the rack: their places overlap a little from some angles, and the small book is put over the big rack (still under
// any card that opens).
const THINGS = {
  tags: ['secret-tags', [0, .15, 1, .95], '名牌板'], log: ['secret-log', undefined, '交接表'], rules: ['secret-desk', [.27, .3, .5, .46], '小冊'],
  register: ['secret-desk', [.08, .18, .27, .44], '登記簿'], stamps: ['secret-desk', [.52, .2, .83, .45], '郵戳章'],
  hats: ['secret-hats', undefined, '聖誕帽'], rack: ['secret-rack', undefined, '分揀架'], record: ['secret-desk', [.84, .2, .97, .45], '舊紀錄簿'],
};

// The end of the story starts here too (`onInvite`, `onTwist`, `onWish`, `onStay`: cabin-play.js): the register's old page,
// a wish for three stamps, the early shift to sign (and then the visitor's own tag on the board's empty hook).
export function secretGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onKnow, onShut, join, quit, onInvite, onTwist, onWish, onStay, onReplay, clue = () => {}, gift = () => false }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  // A paper thing dragged by pointer: it follows the hand and, let go over a target (`over`, a selector), `drop` gets that
  // target; anywhere else it springs back. A press without moving is still a click. A release swallowed before it reaches
  // the page (some browser extensions) still ends the drag: the pointer is let go where it last was.
  // What lies under the pointer, past the thing being dragged and whatever holds it.
  const targetAt = ([x, y], over, dragged) => document.elementsFromPoint(x, y).find(node => node.matches(over) && !node.disabled && !node.contains(dragged));
  function draggable(node, over, drop) {
    let drag = null, lit = null;
    const light = target => { if (lit === target) return; lit?.classList.remove('is-over'); lit = target; lit?.classList.add('is-over'); };
    on(node, 'click', event => { if (node.dataset.dragged) { delete node.dataset.dragged; event.stopImmediatePropagation(); } });
    on(node, 'pointerdown', event => { if (event.button > 0 || node.disabled) return; drag = { id: event.pointerId, from: [event.clientX, event.clientY], last: [event.clientX, event.clientY], moved: false }; node.setPointerCapture(event.pointerId); });
    on(node, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      drag.last = [event.clientX, event.clientY]; const dx = drag.last[0] - drag.from[0], dy = drag.last[1] - drag.from[1];
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) { drag.moved = true; node.classList.add('is-dragging'); sound.play('pick'); }
      node.style.translate = `${dx}px ${dy}px`; light(targetAt(drag.last, over, node) ?? null);
    });
    const end = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved, last } = drag; drag = null; light(null); node.classList.remove('is-dragging');
      if (!moved) return;
      node.dataset.dragged = '1'; setTimeout(() => delete node.dataset.dragged, 0);
      const target = event.type === 'pointercancel' ? null : targetAt(last, over, node);
      if (target) drop(target); else { node.style.translate = ''; sound.play('drop'); }
    };
    on(node, 'pointerup', end); on(node, 'pointercancel', end); on(node, 'lostpointercapture', end);
  }
  const story = progress.story, volunteer = progress.volunteer, finale = progress.finale, invited = () => story.told && !signedUp(volunteer);
  say(knowsSantas(story.seen) ? `小房間裡還是老樣子：名牌、班表、守則，和那一排郵戳章。${invited() ? REGISTER.hint : ''}` : '書櫃後面是一個小房間。牆上掛著東西，桌上也擺著東西。');
  const buttons = Object.entries(THINGS).map(([id, [, , name]]) => {
    const button = element('button', 'secret-thing', layer); button.type = 'button'; button.dataset.id = id; button.setAttribute('aria-label', `看看${name}`);
    on(button, 'click', () => open(id, button)); return [id, button];
  });
  let card = null;
  const closeCard = () => { card?.remove(); card = null; };
  // A choice that ends the story is asked once more: what it means, then yes or not yet (back as it was).
  function confirm(button, { sure, yes, no }, onYes, onNo = () => {}) {
    button.hidden = true; sound.play('pick');
    const note = element('p', 'secret-note signpost-sure', null, sure), row = element('div', 'signpost-actions'), ok = element('button', 'register-sign', row, yes), back = element('button', 'register-sign is-quiet', row, no);
    ok.type = back.type = 'button'; button.after(note, row);
    on(ok, 'click', onYes);
    on(back, 'click', () => { note.remove(); row.remove(); button.hidden = false; sound.play('remove'); onNo(); button.focus({ preventScroll: true }); });
    ok.focus({ preventScroll: true });
  }
  // Out of the little room and the bookcase pushed shut behind you (only once you are clear of its swing).
  const leave = element('button', 'books-enter', layer, '離開，關上書櫃 ↺'); leave.type = 'button';
  on(leave, 'click', () => { cabin.setView('inside'); setTimeout(onShut, 1300); });
  // The view can be turned a little here (to see the side walls), so the buttons follow it every frame; one out of
  // sight is put away.
  let frame = 0;
  function layout() {
    const box = stage.getBoundingClientRect();
    for (const [id, button] of buttons) {
      const [sheet, place] = THINGS[id], rect = cabin.sheetRect(sheet, place);
      const seen = rect && rect.left + rect.width / 2 > 0 && rect.left + rect.width / 2 < box.width && rect.top + rect.height / 2 > 0 && rect.top + rect.height / 2 < box.height;
      button.hidden = !seen; if (!seen) continue;
      const w = Math.max(44, rect.width), h = Math.max(44, rect.height);
      Object.assign(button.style, { left: `${rect.left + rect.width / 2 - w / 2}px`, top: `${rect.top + rect.height / 2 - h / 2}px`, width: `${w}px`, height: `${h}px` });
      button.classList.toggle('is-read', story.seen.includes(id));
    }
  }
  function open(id, from) {
    card?.remove(); sound.play('open'); say('');
    card = element('article', 'cabin-letter secret-card', layer); card.setAttribute('aria-label', THINGS[id][2]);
    // Each is its own thing: the register a ledger, the name tags on their board, the log on a clipboard, the booklet a
    // little booklet, the old record its own book, anything else an index card.
    card.dataset.thing = id === 'rack' && !signedUp(volunteer) ? 'note' : id === 'record' ? 'oldpage' : ['tags', 'log', 'rules', 'register', 'rack'].includes(id) ? id : 'note';
    // The words scroll within the page, never over the cover or the board round it.
    const page = element('div', 'secret-body', card);
    if (id === 'tags') {
      element('h3', 'secret-title', page, '名牌');
      const list = element('ul', 'secret-tags', page);
      for (const [char, colour] of SUBSTITUTES) {
        const item = element('li', '', list), mark = element('span', 'secret-initial', item, `${char}.`); mark.style.color = colour;
        const sign = element('span', 'secret-workmark', item); sign.setAttribute('role', 'img'); sign.setAttribute('aria-label', `工作記號：${MARKS[char][1]}`);
        inked(sign, '0 0 20 20', ink => workMark(ink, MARKS[char][0], 10, 10, 18, colour)); element('span', '', item, NAMES[char]);
      }
      if (finale.stayed) { const item = element('li', 'is-you', list); element('span', 'secret-initial', item, volunteer.mark ? `${volunteer.mark}.` : ''); element('span', '', item, '你'); }
      element('p', 'secret-note', page, finale.stayed ? STAY.tag : NOTES.tags);
    } else if (id === 'log') {
      element('h3', 'secret-title', page, LOG.title);
      // The log on the left and the notes it needs clipped on beside it, on the right (one under the other on a phone):
      // all of it in sight together, nothing waiting further down to be scrolled to.
      const desk = element('div', 'shift-desk', page), main = element('div', 'shift-main', desk);
      shiftLog(main, desk);
      // Under the four nights, the early shift on Christmas morning.
      const list = element('ul', 'secret-log', main);
      const morning = element('li', finale.stayed ? 'is-morning is-you' : 'is-morning', list); morning.textContent = `${MORNING.date}　${MORNING.shift}　${finale.stayed ? `${volunteer.mark || ''}${volunteer.mark ? '.' : ''}（你）` : progress.combos.includes('santa') ? MORNING.snowman : MORNING.empty}`;
      // Every job done: the early shift can be signed, and the visitor stays on.
      if (canStay(volunteer, finale)) {
        element('p', 'secret-note', page, STAY.invite);
        const sign = element('button', 'register-sign', page, STAY.sign); sign.type = 'button';
        on(sign, 'click', () => confirm(sign, STAY, () => { sound.play('thud'); onStay(); open('log', from); }));
      }
    } else if (id === 'rules') {
      // The duty rules on the first page; the pages after, stuck with snowmelt until Santa has opened them for you.
      element('h3', 'secret-title', page, DUTY.title);
      for (const line of DUTY.lines) element('p', 'secret-rule', page, line);
      element('p', 'secret-note', page, DUTY.margin);
      if (!story.told) element('p', 'secret-note', page, DUTY.stuck);
      else {
        element('h3', 'secret-title', page, RULES.title);
        for (const line of RULES.lines) element('p', 'secret-rule', page, line);
        element('p', 'secret-note', page, finale.twist ? PENCIL : RULES.margin);
      }
    } else if (id === 'register') register(page, from);
    else if (id === 'record') record(page);
    else if (id === 'rack' && signedUp(volunteer)) sorting(page);
    // On the hat rack, an old polaroid of the snowman, dressed; its back says to dress him so again.
    if (id === 'hats') {
      const picture = element('div', 'hats-polaroid', page); picture.setAttribute('role', 'img'); picture.setAttribute('aria-label', NOTES.photo);
      paperLayer(picture, '-4 -4 128 158', '', polaroid, { paper: { scale: .3, grain: .45, shadow: .3, rim: '#fbf6ea' }, eager: true });
      element('p', 'secret-note', page, NOTES.polaroid); clue('snowman-photo');
      element('p', 'secret-note', page, finale.stayed ? NOTES.hatsMine : NOTES.hats); hat(page);
    } else if (['stamps', 'rack'].includes(id) && !(id === 'rack' && signedUp(volunteer))) element('p', 'secret-note', page, NOTES[id]);
    // On the postmark tray, a brass pin (it undoes the music box's catch, cabin-musicbox.js): to the pocket.
    if (id === 'stamps' && !bag.ever('pin')) {
      element('p', 'secret-note', page, NOTES.pin);
      const pin = element('button', 'secret-pin', page); pin.type = 'button'; pin.setAttribute('aria-label', NOTES.pinTake);
      paperLayer(pin, '0 0 100 100', '', ITEM_ART.pin, { paper: { scale: .4, grain: .45, shadow: .25 }, eager: true });
      on(pin, 'click', () => { const box = stage.getBoundingClientRect(), rect = pin.getBoundingClientRect(); pin.remove(); bag.give('pin', { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }); });
    }
    const done = element('button', 'cabin-letter-close', card, id === 'record' ? CORD.close : '放回去 ✓'); done.type = 'button';
    on(done, 'click', () => close(id, from)); done.focus({ preventScroll: true });
  }
  // The smallest hat, Holly's: turned over, her welcome ornament is tucked inside, and something is stitched there too
  // small to read; the magnifier (from the pocket) reads it.
  let forgetHat = () => {};
  function hat(page) {
    const look = () => {
      if (progress.ornaments.includes('H')) showOrnament(page, 'H');
      const inside = element('button', 'register-sign hat-inside', page, progress.clues.includes('hat-2003') ? NOTES.hatsKnown : NOTES.hatInside); inside.type = 'button';
      on(inside, 'click', () => say(progress.clues.includes('hat-2003') ? NOTES.hatsKnown : NOTES.hatInside));
      forgetHat(); forgetHat = bag.target(inside, { accepts: id => id === 'magnifier' || '這個看不清楚帽子裡的字。', use: () => { clue('hat-2003'); inside.textContent = NOTES.hatsKnown; return NOTES.hatsKnown; } });
    };
    if (progress.ornaments.includes('H')) { look(); return; }
    const turn = element('button', 'register-sign', page, NOTES.hatLook); turn.type = 'button';
    on(turn, 'click', () => { turn.remove(); gift('H'); sound.play('open'); element('p', 'secret-note', page, NOTES.hatGift); look(); });
  }
  // The shift log, wet: a grid of the four nights, first and second half. A cell is chosen, then a name tag below writes
  // that initial in. A cell that still shows its writer (a blot in their colour, their work mark) dries the moment the right
  // initial goes in, and stays. Filled in, the whole is checked by the rules (cabin-story.js): put right, the ink comes back
  // and it counts as read; otherwise it says only how many cells are wrong. The notes the washed-out cells need are clipped
  // on beside it (`desk`), the ones found so far to open and read as they look, the first already open, each line in its
  // writer's ink (and its colour named, as the blots are); one not found yet is a blank slip.
  function shiftLog(page, desk = page) {
    const log = story.log, solved = () => logSolved(log);
    // Santa's slip, taped on above it.
    const pin = element('p', 'shift-pin', page), plea = element('span', '', pin, solved() ? LOG.pin.thanks : cabin.santaHome ? LOG.pin.home : LOG.pin.away);
    element('span', 'shift-pin-sign', pin, LOG.pin.sign);
    const note = element('p', 'secret-note shift-note', page, solved() ? LOG.solved : LOG.how);
    const grid = element('div', solved() ? 'shift-grid is-solved' : 'shift-grid', page); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', LOG.title);
    element('span', 'shift-head', grid); LOG.halves.forEach((half, i) => element('span', 'shift-span', element('span', 'shift-head', grid, half), LOG.spans[i]));
    let chosen = -1;
    const cells = [];
    NIGHTS.forEach(([date], night) => {
      element('span', 'shift-date', grid, LOG.night(date));
      for (const half of [0, 1]) {
        // The blot keeps the colour of whoever really wrote there.
        const index = night * 2 + half, state = INK[index], writer = NIGHTS[night][half + 1], legible = state === 'blot' || state === 'mark';
        const cell = element('button', 'shift-cell', grid); cell.type = 'button'; cell.dataset.ink = state; cells.push(cell);
        // Washed out but for a work mark: the stain, and the little mark its writer draws by their initial, its colour gone.
        inked(cell, '0 0 80 44', ink => state === 'blot' ? blot(ink, COLOURS[writer], index * 7 + 3) : state === 'washed' ? stain(ink, index * 5 + 1) : state === 'mark' ? (stain(ink, index * 5 + 1), workMark(ink, MARKS[writer][0], 60, 24, 24, '#6c7178')) : null);
        inked(cell, '0 0 80 44', ink => shape('ellipse', { cx: 40, cy: 22, rx: 34, ry: 17, fill: 'none', stroke: '#b5443c', 'stroke-width': 2, transform: 'rotate(-4 40 22)' }, ink)).classList.add('shift-ring');
        const mark = element('span', 'shift-mark', cell);
        const hint = state === 'blot' ? `暈開的${COLOUR_NAMES[writer]}色墨水` : state === 'washed' ? '整個洗掉了' : state === 'mark' ? `顏色洗掉了，只剩一個小小的${MARKS[writer][1]}記號` : '還看得清楚';
        if (state === 'blot') element('span', 'shift-ink', cell, `${COLOUR_NAMES[writer]}色`);
        const dry = () => legible && log[index] === writer;
        const show = () => { const value = log[index]; mark.textContent = value ? `${value}.` : ''; mark.style.color = value ? COLOURS[value] : ''; cell.classList.toggle('is-dry', dry()); cell.setAttribute('aria-label', `${LOG.night(date)} ${LOG.halves[half]}：${hint}${value ? `，寫著 ${value}.${dry() ? '（墨水乾了）' : ''}` : '，空著'}`); };
        show(); cell.show = show; cell.dry = dry;
        if (index === LOG_GIVEN || solved() || dry()) { cell.disabled = true; continue; }
        cell.setAttribute('aria-pressed', 'false');
        on(cell, 'click', () => { chosen = index; sound.play('pick'); cells.forEach((each, i) => each.hasAttribute('aria-pressed') && each.setAttribute('aria-pressed', String(i === index))); });
      }
    });
    if (solved()) return;
    // The name tags to write with, and an eraser.
    const picks = element('div', 'shift-picks', page);
    const write = (mark, cell = chosen) => {
      const empty = log.findIndex((value, i) => !value && i !== LOG_GIVEN), at = cell >= 0 ? cell : empty;
      if (at < 0 || cells[at].disabled) return;
      log[at] = mark; save(); cells[at].show(); sound.play(mark ? 'snap' : 'remove');
      // The right initial where the writer still shows: the ink dries there and stays.
      if (cells[at].dry()) { cells[at].disabled = true; cells[at].removeAttribute('aria-pressed'); later(250, () => sound.play('jingle')); }
      // Next, the next empty cell.
      const next = log.findIndex((value, i) => !value && i !== LOG_GIVEN);
      chosen = next; cells.forEach((each, i) => each.hasAttribute('aria-pressed') && each.setAttribute('aria-pressed', String(i === next)));
      if (next < 0) check();
    };
    for (const mark of WHO) { const pick = element('button', 'shift-pick', picks, `${mark}.`); pick.type = 'button'; pick.style.color = COLOURS[mark]; pick.setAttribute('aria-label', `寫上 ${mark}.（${NAMES[mark]}）`); draggable(pick, '.shift-cell', cell => { pick.style.translate = ''; write(mark, cells.indexOf(cell)); }); on(pick, 'click', () => write(mark)); }
    const erase = element('button', 'shift-pick shift-erase', picks, LOG.erase); erase.type = 'button';
    const side = element('aside', 'shift-side', desk); side.setAttribute('aria-label', LOG.files); desk.classList.add('has-side');
    element('p', 'shift-side-title', side, LOG.files);
    const files = element('div', 'shift-files', side), reading = element('p', 'shift-read', side); reading.hidden = true;
    const read = (file, lines, open) => {
      for (const each of files.querySelectorAll('[aria-pressed]')) each.setAttribute('aria-pressed', String(each === file && open));
      reading.hidden = !open; reading.replaceChildren();
      if (open) for (const [text, who] of lines) {
        const line = element('span', who ? 'shift-read-line' : 'shift-read-line is-plain', reading, text);
        if (who) { line.style.color = COLOURS[who]; element('span', 'shift-ink', line, `${COLOUR_NAMES[who]}色`); }
      }
    };
    let first = null;
    for (const [id, name, lines] of LOG_FILES) {
      const found = progress.clues.includes(id), file = element('button', found ? 'shift-file' : 'shift-file is-missing', files, name); file.type = 'button';
      if (!found) { file.disabled = true; element('span', 'shift-file-where', file, LOG.missing(NOTEBOOK[id].place)); continue; }
      file.setAttribute('aria-pressed', 'false'); first ??= () => read(file, lines, true);
      on(file, 'click', () => { sound.play('pick'); read(file, lines, file.getAttribute('aria-pressed') !== 'true'); });
    }
    first?.();
    on(erase, 'click', () => { if (chosen >= 0 && log[chosen]) { log[chosen] = ''; save(); cells[chosen].show(); sound.play('remove'); } });
    function check() {
      if (!logSolved(log)) { note.textContent = LOG.wrong(logWrong(log)); sound.play('nope'); grid.classList.remove('is-wrong'); void grid.offsetWidth; grid.classList.add('is-wrong'); return; }
      // Put right: the ink comes back a row at a time, and the log counts as read.
      grid.classList.add('is-solved'); picks.remove(); side.remove(); desk.classList.remove('has-side'); cells.forEach(cell => { cell.disabled = true; cell.removeAttribute('aria-pressed'); });
      note.textContent = LOG.solved; plea.textContent = LOG.pin.thanks; sound.play('cheer'); learn('log'); clue('shift-log');
    }
  }
  // The sorting rack, where the letters job starts: eight letters for six pigeonholes (N, K, H, E, O and the new
  // substitute). Pick a letter, then a pigeonhole, and it flies in; picked again, it can go elsewhere, or back to the pile.
  // All in, the rules check (cabin-story.js): the wrong ones bounce back out; right, the two new ones go to the desk, and
  // in the oldest envelope is Ola's welcome ornament.
  function sorting(page) {
    const desk = progress.desk, placed = {}, cubbies = {};
    // The letters already in their pigeonholes stay there while you look at something else (`desk.rack`, kept in the save).
    const keep = () => { desk.rack = desk.sorted ? {} : { ...placed }; save(); };
    element('h3', 'secret-title', page, RACK.title); element('p', 'secret-note rack-sign', page, RACK.sign); clue('rack-rule');
    const note = element('p', 'secret-note', page, desk.sorted ? RACK.sorted : RACK.how);
    const rack = element('div', 'rack', page), pile = element('div', 'rack-pile', page);
    let picked = null;
    const choose = node => { picked = picked === node ? null : node; for (const each of page.querySelectorAll('.rack-letter')) each.setAttribute('aria-pressed', String(each === picked)); if (picked) sound.play('pick'); };
    const move = (node, into) => {
      const before = node.getBoundingClientRect(); node.style.translate = ''; into.append(node); const after = node.getBoundingClientRect();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && after.width) node.animate([{ transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width})` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.3,1.25,.5,1)' });
    };
    for (const mark of [...WHO, 'you']) {
      const box = element('div', 'rack-box', rack), slot = element('button', 'rack-slot', box); slot.type = 'button';
      paperLayer(slot, '0 0 100 76', '', pigeonhole, BRASS);
      const name = element('span', 'rack-name', box, `${mark === 'you' ? volunteer.mark : mark}.`); name.style.color = mark === 'you' ? '#b5443c' : COLOURS[mark];
      slot.setAttribute('aria-label', mark === 'you' ? `你的格子（${volunteer.mark}.）` : `${NAMES[mark]}的格子（${mark}.）`);
      cubbies[mark] = element('span', 'rack-in', box);
      slot.dataset.mark = mark;
      on(slot, 'click', () => { if (picked && !desk.sorted) put(picked, mark); });
    }
    // Into a pigeonhole, or back to the pile; all in, the rules check.
    function put(node, mark) { placed[node.dataset.id] = mark; keep(); move(node, cubbies[mark]); sound.play('snap'); if (picked) choose(picked); if (!pile.querySelector('.rack-letter')) later(550, check); }
    function unput(node) { delete placed[node.dataset.id]; keep(); move(node, pile); sound.play('remove'); if (picked) choose(picked); }
    on(pile, 'click', event => { if (picked && !pile.contains(picked) && event.target === pile) unput(picked); });
    PILE.forEach((id, i) => {
      const mail = MAIL.find(([each]) => each === id), [date, time] = mail ? mail.slice(1) : ['12/25', '08:30'], fresh = !mail;
      const was = desk.sorted ? mailFor(id) : desk.rack[id];
      const letter = element('button', 'rack-letter', was ? cubbies[was] : pile); letter.type = 'button'; letter.dataset.id = id; letter.setAttribute('aria-pressed', 'false');
      letter.setAttribute('aria-label', `${RACK.places[id]}寄來的信，郵戳 ${date} ${time}${fresh ? `，寫著「${RACK.fresh}」` : ''}`);
      paperLayer(letter, '0 0 120 80', '', envelope(ENVELOPES[i % ENVELOPES.length], fresh), BRASS); inked(letter, '0 0 120 80', postmark);
      const text = element('span', 'rack-text', letter); element('span', 'rack-date', text, date); element('span', 'rack-time', text, time); element('span', 'rack-place', letter, fresh ? RACK.fresh : RACK.places[id]);
      if (fresh) letter.classList.add('is-fresh');
      if (desk.sorted) { letter.disabled = true; placed[id] = mailFor(id); }
      else {
        if (was) placed[id] = was;
        // Dragged onto a pigeonhole it goes in; onto the pile it comes back out (or, from the pile, just settles again).
        draggable(letter, '.rack-slot, .rack-pile', target => { if (!target.classList.contains('rack-pile')) put(letter, target.dataset.mark); else if (pile.contains(letter)) letter.style.translate = ''; else unput(letter); });
        on(letter, 'click', () => choose(letter));
      }
    });
    if (desk.sorted && progress.ornaments.includes('O')) showOrnament(page, 'O');
    function check() {
      const wrong = sortWrong(placed);
      if (wrong) {
        for (const node of [...rack.querySelectorAll('.rack-letter')]) if (placed[node.dataset.id] !== mailFor(node.dataset.id)) { delete placed[node.dataset.id]; move(node, pile); node.classList.remove('is-bounced'); void node.offsetWidth; node.classList.add('is-bounced'); }
        note.textContent = RACK.wrong(wrong); sound.play('nope'); keep(); return;
      }
      desk.sorted = true; keep(); sound.play('cheer'); note.textContent = RACK.done; say(RACK.done);
      for (const node of page.querySelectorAll('.rack-letter')) node.disabled = true;
      if (!progress.ornaments.includes('O')) later(1000, () => { gift('O'); sound.play('open'); element('p', 'secret-note', page, RACK.gift); showOrnament(page, 'O'); });
    }
  }
  // The old record book's lock: four dials to turn (a tap, or the arrow keys). Its code opens it whenever it is found.
  function lock(page) {
    element('p', 'secret-note', page, CORD.locked);
    const padlock = element('div', 'cord-lock', page);
    paperLayer(padlock, '0 0 120 130', 'lock-shackle', lockShackle, BRASS); paperLayer(padlock, '0 0 120 130', 'lock-body', lockBody, BRASS);
    const row = element('div', 'lock-dials', padlock), dials = [0, 0, 0, 0];
    dials.forEach((_, i) => {
      const dial = element('button', 'lock-dial', row, '0'); dial.type = 'button'; dial.setAttribute('aria-label', CORD.dial(i + 1, 0));
      const turn = by => {
        if (padlock.classList.contains('is-open')) return;
        dials[i] = (dials[i] + by + 10) % 10; dial.textContent = String(dials[i]); dial.setAttribute('aria-label', CORD.dial(i + 1, dials[i])); sound.play('click');
        if (!opens(dials)) return;
        // Open: the shackle springs up, the cord slides off, and the book opens.
        padlock.classList.add('is-open'); finale.unlocked = true; save(); sound.play('snap'); say(CORD.opened);
        later(1100, () => open('record', buttons.find(([each]) => each === 'record')[1]));
      };
      on(dial, 'click', () => turn(1));
      on(dial, 'keydown', event => { const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key]; if (by) { event.preventDefault(); turn(by); } });
    });
    row.querySelector('.lock-dial').focus({ preventScroll: true });
  }
  // The register's newest page: the season, then each substitute's initial, the year they joined and their stamps this
  // season, then the visitor's row, or a blank one (to sign once Santa has told you what it is for).
  // An ending pressed in the register's row of stamps: watched (cabin-play.js tells it again).
  const watch = kind => { sound.play('pick'); onReplay(kind); };
  function register(card, from) {
    element('h3', 'secret-title', card, REGISTER.title); element('p', 'register-season', card, REGISTER.season); clue('register-years');
    const list = element('ul', 'register-rows', card);
    const row = (mark, count, year, you = false) => {
      const item = element('li', you ? 'is-you' : '', list); item.dataset.hand = you ? 'you' : mark.toLowerCase();
      element('span', 'register-mark', item, `${mark}.${you ? REGISTER.you : ''}`);
      const joined = element('span', 'register-year', item, `${REGISTER.joined} ${year}`);
      if (!you && REGISTER.year - year < 5) {
        const seal = element('span', 'register-learner', joined); seal.setAttribute('aria-label', REGISTER.learner);
        inked(seal, '0 0 60 32', ink => shape('rect', { x: 3, y: 3, width: 54, height: 26, rx: 5, fill: 'none', stroke: '#b5443c', 'stroke-width': 2.4 }, ink));
        element('span', 'ink-words', seal, REGISTER.learner);
      }
      const stamps = element('span', 'register-stamps', item); stamps.setAttribute('aria-label', `${count}／${REGISTER.full} 個章`);
      // Each stamp in red ink, the places still to fill as faint rings.
      inked(stamps, `0 0 ${REGISTER.full * 25} 24`, ink => { for (let i = 0; i < REGISTER.full; i++) { const cx = 12 + i * 25; if (i < count) { shape('circle', { cx, cy: 12, r: 9.5, fill: 'none', stroke: '#b5443c', 'stroke-width': 2.2 }, ink); shape('circle', { cx, cy: 12, r: 5, fill: '#b5443c' }, ink); } else shape('circle', { cx, cy: 12, r: 9.5, fill: 'none', stroke: '#d6c6a4', 'stroke-width': 1.6 }, ink); } });
      return item;
    };
    for (const [mark, count, year] of REGISTER.rows) row(mark, count, year);
    if (!story.told) { element('li', 'register-blank', list, REGISTER.blank); return; }
    if (signedUp(volunteer)) {
      row(volunteer.mark, points(volunteer), 2026, true);
      // Tucked in the visitor's own row: the blank slip, taken once; in the pocket until it has been held to the fire
      // (cabin-hearth.js); then what it said.
      const slip = element('div', 'register-cord', card);
      if (finale.slip === 'none') {
        element('p', 'secret-note', slip, CORD.slip);
        const take = element('button', 'register-sign', slip, CORD.take); take.type = 'button';
        on(take, 'click', () => { const box = stage.getBoundingClientRect(), rect = take.getBoundingClientRect(); finale.slip = 'taken'; save(); clue('blank-slip'); bag.give('slip', { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }); open('register', from); say(CORD.took); });
      } else element('p', 'secret-note', slip, finale.slip === 'read' ? CORD.read : CORD.pocket);
      element('h4', 'register-heading', card, REGISTER.jobs);
      const jobs = element('ul', 'register-jobs', card);
      for (const task of TASKS) { const done = volunteer.tasks.includes(task), item = element('li', done ? 'is-done' : '', jobs); element('span', 'job-box', item, done ? '✓' : '').setAttribute('aria-hidden', 'true'); element('strong', '', item, JOBS[task][0]); element('span', '', item, JOBS[task][1]); }
      // A wish for three stamps; the endings seen so far.
      if (canWish(volunteer, finale)) {
        element('h4', 'register-heading', card, WISH.title); element('p', 'secret-note', card, WISH.invite);
        const choices = element('div', 'compose-choices register-wishes', card), make = element('button', 'register-sign', card, WISH.sign); make.type = 'button'; make.disabled = true;
        let chosen = null;
        for (const wish of WISHES) {
          const choice = element('button', 'compose-choice', choices, wish.name); choice.type = 'button'; choice.setAttribute('aria-pressed', 'false');
          on(choice, 'click', () => { chosen = wish.id; sound.play('pick'); for (const other of choices.children) other.setAttribute('aria-pressed', String(other === choice)); make.disabled = false; });
        }
        // Chosen, then confirmed; while it is being confirmed, the wish stays as chosen.
        on(make, 'click', () => {
          if (!chosen) return; for (const choice of choices.children) choice.disabled = true;
          confirm(make, { ...WISH, sure: WISH.sure(WISHES.find(wish => wish.id === chosen).name) }, () => { sound.play('thud'); closeCard(); onWish(chosen); }, () => { for (const choice of choices.children) choice.disabled = false; });
        });
      } else if (finale.wish) element('p', 'secret-note', card, WISH.made(WISHES.find(wish => wish.id === finale.wish).name));
      // A stamp for each ending (cabin-ending-stamps.js): press one to watch it.
      endingStamps(card, finale, watch);
      // Leaving takes a second press, and keeps the stamps.
      const leave = element('button', 'register-leave', card, REGISTER.leave); leave.type = 'button';
      on(leave, 'click', () => {
        if (!leave.dataset.sure) { leave.dataset.sure = '1'; leave.textContent = '確定離開'; say(REGISTER.sure); return; }
        quit(); sound.play('remove'); open('register', from); say(REGISTER.left);
      });
      return;
    }
    element('p', 'secret-note', card, REGISTER.invite); onInvite();
    // Not signed up (gone home, or crossed out), the endings are still here to watch once one has been reached.
    if (finale.endings.length) endingStamps(card, finale, watch);
    const grid = element('div', 'register-letters', card); grid.setAttribute('aria-label', '選一個字母當你的縮寫');
    const sign = element('button', 'register-sign', card, REGISTER.sign); sign.type = 'button'; sign.disabled = true;
    let chosen = '';
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const tile = element('button', 'register-letter', grid, char); tile.type = 'button';
      if (!canSign(char)) { tile.disabled = true; tile.title = REGISTER.taken; tile.setAttribute('aria-label', `${char}（${REGISTER.taken}）`); continue; }
      tile.setAttribute('aria-pressed', 'false');
      on(tile, 'click', () => {
        chosen = char; sound.play('pick');
        for (const other of grid.children) if (other.hasAttribute('aria-pressed')) other.setAttribute('aria-pressed', String(other === tile));
        sign.disabled = false; sign.textContent = `${REGISTER.sign}：${char}.`;
      });
    }
    on(sign, 'click', () => { if (!chosen) return; join(chosen); sound.play('thud'); open('register', from); say(REGISTER.welcome(chosen)); });
  }
  // The old record book: locked until its code is turned; open, Holly's record. Read with the secret known, it is understood
  // (the second twist, `onTwist`); read before, it is only a child's wish and a row of night shifts.
  function record(page) {
    element('h3', 'secret-title', page, CORD.title);
    if (!finale.unlocked) { lock(page); return; }
    const [date, mark, name, wish] = RECORD.entry;
    element('p', 'old-title', page, RECORD.title);
    const entry = element('div', 'old-entry', page);
    element('p', 'old-line', entry, `${date}　${mark}　${name}`); element('p', 'old-line', entry, wish);
    const fulfilled = element('span', 'old-stamp', entry); inked(fulfilled, '0 0 160 40', ink => { shape('rect', { x: 3, y: 3, width: 154, height: 34, rx: 6, fill: 'none', stroke: '#b5443c', 'stroke-width': 2.4 }, ink); shape('rect', { x: 8, y: 8, width: 144, height: 24, rx: 4, fill: 'none', stroke: '#b5443c', 'stroke-width': 1 }, ink); });
    element('span', 'ink-words', fulfilled, RECORD.stamp);
    const since = element('ul', 'old-since', page); for (const line of RECORD.since) element('li', '', since, line);
    element('p', 'old-pencil', page, RECORD.pencil);
    const note = element('div', 'old-card', page); element('p', 'old-card-en', note, RECORD.card[0]); element('p', 'old-card-zh', note, RECORD.card[1]);
    clue('old-record'); glintRecord();
    if (knowsSantas(story.seen)) { if (!finale.twist) onTwist(); }
    else later(600, () => say(RECORD.surface));
  }
  function close(id, from) {
    card?.remove(); card = null; forgetHat(); forgetHat = () => {}; sound.play('remove');
    // The name tags and the duty rules count as read once put back (the rules for substitutes too, once opened); the log
    // once it has been put right (above).
    if (id === 'tags') clue('tags');
    if (id === 'rules') { clue('duty'); if (story.told) clue('rules'); }
    if (id === 'tags' || id === 'rules') learn(id);
    layout(); from.focus({ preventScroll: true });
  }
  // A clue read. The log put right is the first discovery: more than one Santa. Told once, quietly; then Santa is heard
  // coming home.
  function learn(id) {
    const before = knowsSantas(story.seen);
    if (CLUES.includes(id) && !story.seen.includes(id)) { story.seen.push(id); save(); }
    if (!before && knowsSantas(story.seen)) { later(2400, () => { sound.play('jingle'); say(NOTES.known); onKnow(); glintRecord(); }); later(7600, () => { if (!card) say(NOTES.coming); }); }
  }
  // Opened before the secret was known and not yet understood: once Santa has spoken of it, the old record book's corner
  // lifts and catches the light, to be read again.
  function glintRecord() { buttons.find(([each]) => each === 'record')?.[1].classList.toggle('is-glinting', finale.unlocked && !finale.twist && story.told); }
  const follow = () => { layout(); frame = requestAnimationFrame(follow); };
  follow(); glintRecord();
  return () => { events.abort(); cancelAnimationFrame(frame); card?.remove(); };
}
