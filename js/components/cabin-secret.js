// The little room behind the bookcase, looked into from its doorway. Its things can be picked up and read: the name tags,
// the shift log and the rulebook (these three tell the secret), and the register, the stamps, the hats and the sorting
// rack. Each opens as a sheet of paper over the scene. Once the three have been read, the visitor knows (cabin-story.js),
// and the register's newest page has a blank row they may sign to volunteer (`join`, `quit`: cabin-play.js).
import { SUBSTITUTES } from './cabin-art.js';
import { inked } from './cabin-paper.js';
import { paperLayer, shape } from './paper-art.js';
import { CLUES, LOG_GIVEN, NIGHTS, SUBSTITUTES as WHO, TASKS, canSign, canStay, canUntie, canWish, knowsSantas, logSolved, logWrong, opens, points, signedUp } from '../services/cabin-story.js';
import { COLOUR_NAMES, INK, JOBS, LOG, MORNING, NAMES, NOTES, REGISTER, RULES } from '../data/cabin-secret.js';
import { CORD, OLD_PAGE, PENCIL, SEEN, STAY, WISH, WISHES } from '../data/cabin-finale.js';

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
function stain(ink, seed) {
  shape('ellipse', { cx: 40 + noise(seed) * 4, cy: 22, rx: 30, ry: 13, fill: '#9fb3c4', opacity: .16 }, ink);
  shape('ellipse', { cx: 38, cy: 21, rx: 24, ry: 10, fill: 'none', stroke: '#9fb3c4', 'stroke-width': 1.2, opacity: .4 }, ink);
}
// Each thing: the sheet it is on, where on that sheet ([left, top, right, bottom]), and its name.
const THINGS = {
  tags: ['secret-tags', [0, .15, 1, .95], '名牌板'], log: ['secret-log', undefined, '班表'], rules: ['secret-desk', [.27, .3, .5, .46], '守則小冊'],
  register: ['secret-desk', [.08, .18, .27, .44], '登記簿'], stamps: ['secret-desk', [.52, .2, .9, .45], '郵戳章'], hats: ['secret-hats', undefined, '聖誕帽'], rack: ['secret-rack', undefined, '分揀架'],
};

// The end of the story starts here too (`onInvite`, `onTwist`, `onWish`, `onStay`: cabin-play.js): the register's old page,
// a wish for three stamps, the early shift to sign (and then the visitor's own tag on the board's empty hook).
export function secretGame({ layer, stage, cabin, say, later, sound, progress, save, onKnow, onShut, join, quit, onInvite, onTwist, onWish, onStay, onReplay, clue = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const story = progress.story, volunteer = progress.volunteer, finale = progress.finale, invited = () => knowsSantas(story.seen) && !signedUp(volunteer);
  say(knowsSantas(story.seen) ? `小房間裡還是老樣子：名牌、班表、守則，和那一排郵戳章。${invited() ? REGISTER.hint : ''}` : '書櫃後面是一個小房間。牆上掛著東西，桌上也擺著東西。');
  const buttons = Object.entries(THINGS).map(([id, [, , name]]) => {
    const button = element('button', 'secret-thing', layer); button.type = 'button'; button.dataset.id = id; button.setAttribute('aria-label', `看看${name}`);
    on(button, 'click', () => open(id, button)); return [id, button];
  });
  let card = null;
  const closeCard = () => { card?.remove(); card = null; };
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
    card = element('article', 'cabin-letter secret-card', layer); card.setAttribute('aria-label', THINGS[id]?.[2] ?? '登記簿的舊頁');
    // Each is its own thing: the register a ledger, the name tags on their board, the log on a clipboard, the rules a
    // little booklet, anything else an index card.
    card.dataset.thing = id === 'register' ? (knowsSantas(story.seen) ? 'register' : 'note') : ['tags', 'log', 'rules', 'oldpage'].includes(id) ? id : 'note';
    // The words scroll within the page, never over the cover or the board round it.
    const page = element('div', 'secret-body', card);
    if (id === 'tags') {
      element('h3', 'secret-title', page, '名牌');
      const list = element('ul', 'secret-tags', page);
      for (const [char, colour] of SUBSTITUTES) { const item = element('li', '', list); const mark = element('span', 'secret-initial', item, `${char}.`); mark.style.color = colour; element('span', '', item, NAMES[char]); }
      if (finale.stayed) { const item = element('li', 'is-you', list); element('span', 'secret-initial', item, volunteer.mark ? `${volunteer.mark}.` : ''); element('span', '', item, '你'); }
      element('p', 'secret-note', page, finale.stayed ? STAY.tag : '最右邊還有一個空掛勾。');
    } else if (id === 'log') {
      element('h3', 'secret-title', page, LOG.title);
      shiftLog(page);
      // Under the four nights, the early shift on Christmas morning.
      const list = element('ul', 'secret-log', page);
      const morning = element('li', finale.stayed ? 'is-morning is-you' : 'is-morning', list); morning.textContent = `${MORNING.date}　${MORNING.shift}　${finale.stayed ? `${volunteer.mark || ''}${volunteer.mark ? '.' : ''}（你）` : progress.combos.includes('santa') ? MORNING.snowman : MORNING.empty}`;
      // Every job done: the early shift can be signed, and the visitor stays on.
      if (canStay(volunteer, finale)) {
        element('p', 'secret-note', page, STAY.invite);
        const sign = element('button', 'register-sign', page, STAY.sign); sign.type = 'button';
        on(sign, 'click', () => { sound.play('thud'); onStay(); open('log', from); });
      }
    } else if (id === 'rules') {
      element('h3', 'secret-title', page, RULES.title);
      for (const line of RULES.lines) element('p', 'secret-rule', page, line);
      element('p', 'secret-note', page, finale.twist ? PENCIL : RULES.margin);
    } else if (id === 'register' && knowsSantas(story.seen)) register(page, from);
    else if (id === 'oldpage') oldPage(page);
    else element('p', 'secret-note', page, id === 'hats' && finale.twist ? NOTES.hatsKnown : NOTES[id]);
    const done = element('button', 'cabin-letter-close', card, id === 'oldpage' ? CORD.back : '放回去 ✓'); done.type = 'button';
    on(done, 'click', () => id === 'oldpage' ? open('register', from) : close(id, from)); done.focus({ preventScroll: true });
  }
  // The shift log, wet: a grid of the four nights, first and second half. A cell is chosen, then a name tag below writes
  // that initial in. Filled in, it is checked by the rules (cabin-story.js): put right, the ink comes back and it counts as
  // read; otherwise it says only how many cells are wrong.
  function shiftLog(page) {
    const log = story.log, solved = () => logSolved(log);
    const note = element('p', 'secret-note shift-note', page, solved() ? LOG.solved : `${LOG.wet}${LOG.how}`);
    const grid = element('div', solved() ? 'shift-grid is-solved' : 'shift-grid', page); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', LOG.title);
    element('span', 'shift-head', grid); for (const half of LOG.halves) element('span', 'shift-head', grid, half);
    let chosen = -1;
    const cells = [];
    NIGHTS.forEach(([date], night) => {
      element('span', 'shift-date', grid, date);
      for (const half of [0, 1]) {
        // The blot keeps the colour of whoever really wrote there.
        const index = night * 2 + half, state = INK[index], writer = NIGHTS[night][half + 1];
        const cell = element('button', 'shift-cell', grid); cell.type = 'button'; cell.dataset.ink = state; cells.push(cell);
        inked(cell, '0 0 80 44', ink => state === 'blot' ? blot(ink, COLOURS[writer], index * 7 + 3) : state === 'washed' ? stain(ink, index * 5 + 1) : null);
        const mark = element('span', 'shift-mark', cell);
        const hint = state === 'blot' ? `暈開的${COLOUR_NAMES[writer]}色墨水` : state === 'washed' ? '整個洗掉了' : '還看得清楚';
        if (state === 'blot') element('span', 'shift-ink', cell, `${COLOUR_NAMES[writer]}色`);
        const show = () => { const value = log[index]; mark.textContent = value ? `${value}.` : ''; mark.style.color = value ? COLOURS[value] : ''; cell.setAttribute('aria-label', `${date} ${LOG.halves[half]}：${hint}${value ? `，寫著 ${value}.` : '，空著'}`); };
        show(); cell.show = show;
        if (index === LOG_GIVEN || solved()) { cell.disabled = true; continue; }
        cell.setAttribute('aria-pressed', 'false');
        on(cell, 'click', () => { chosen = index; sound.play('pick'); cells.forEach((each, i) => each.hasAttribute('aria-pressed') && each.setAttribute('aria-pressed', String(i === index))); });
      }
    });
    if (solved()) return;
    // The name tags to write with, and an eraser.
    const picks = element('div', 'shift-picks', page);
    const write = mark => {
      const empty = log.findIndex((value, i) => !value && i !== LOG_GIVEN), at = chosen >= 0 ? chosen : empty;
      if (at < 0) return;
      log[at] = mark; save(); cells[at].show(); sound.play(mark ? 'snap' : 'remove');
      // Next, the next empty cell.
      const next = log.findIndex((value, i) => !value && i !== LOG_GIVEN);
      chosen = next; cells.forEach((each, i) => each.hasAttribute('aria-pressed') && each.setAttribute('aria-pressed', String(i === next)));
      if (next < 0) check();
    };
    for (const mark of WHO) { const pick = element('button', 'shift-pick', picks, `${mark}.`); pick.type = 'button'; pick.style.color = COLOURS[mark]; pick.setAttribute('aria-label', `寫上 ${mark}.（${NAMES[mark]}）`); on(pick, 'click', () => write(mark)); }
    const erase = element('button', 'shift-pick shift-erase', picks, LOG.erase); erase.type = 'button';
    on(erase, 'click', () => { if (chosen >= 0 && log[chosen]) { log[chosen] = ''; save(); cells[chosen].show(); sound.play('remove'); } });
    function check() {
      if (!logSolved(log)) { note.textContent = LOG.wrong(logWrong(log)); sound.play('nope'); grid.classList.remove('is-wrong'); void grid.offsetWidth; grid.classList.add('is-wrong'); return; }
      // Put right: the ink comes back a row at a time, and the log counts as read.
      grid.classList.add('is-solved'); picks.remove(); cells.forEach(cell => { cell.disabled = true; cell.removeAttribute('aria-pressed'); });
      note.textContent = LOG.solved; sound.play('cheer'); learn('log');
    }
  }
  // The cord, loose but locked: four dials to turn (a tap, or the arrow keys), and the blank slip tucked under it.
  function lock(cord, from) {
    element('p', 'secret-note', cord, CORD.locked);
    const padlock = element('div', 'cord-lock', cord);
    paperLayer(padlock, '0 0 120 130', 'lock-shackle', lockShackle, BRASS); paperLayer(padlock, '0 0 120 130', 'lock-body', lockBody, BRASS);
    const row = element('div', 'lock-dials', padlock), dials = [0, 0, 0, 0];
    dials.forEach((_, i) => {
      const dial = element('button', 'lock-dial', row, '0'); dial.type = 'button'; dial.setAttribute('aria-label', CORD.dial(i + 1, 0));
      const turn = by => {
        if (padlock.classList.contains('is-open')) return;
        dials[i] = (dials[i] + by + 10) % 10; dial.textContent = String(dials[i]); dial.setAttribute('aria-label', CORD.dial(i + 1, dials[i])); sound.play('click');
        if (!opens(dials)) return;
        // Open: the shackle springs up, the cord slides off; the register opens again with the way to the old page.
        padlock.classList.add('is-open'); finale.unlocked = true; save(); sound.play('snap'); say(CORD.opened);
        later(1100, () => { open('register', from); say(CORD.opened); });
      };
      on(dial, 'click', () => turn(1));
      on(dial, 'keydown', event => { const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key]; if (by) { event.preventDefault(); turn(by); } });
    });
    // The slip: taken once; in the pocket until it has been held to the fire (cabin-hearth.js); then what it said.
    if (finale.slip === 'none') {
      element('p', 'secret-note', cord, CORD.slip);
      const take = element('button', 'register-sign', cord, CORD.take); take.type = 'button';
      on(take, 'click', () => { finale.slip = 'taken'; save(); sound.play('pick'); clue('blank-slip'); open('register', from); say(CORD.took); });
    } else element('p', 'secret-note', cord, finale.slip === 'read' ? CORD.read : CORD.pocket);
  }
  // The register's newest page: each substitute's stamps this season, then the visitor's row, or a blank one to sign.
  function register(card, from) {
    element('h3', 'secret-title', card, REGISTER.title);
    const list = element('ul', 'register-rows', card);
    const row = (mark, count, you = false) => {
      const item = element('li', you ? 'is-you' : '', list); item.dataset.hand = you ? 'you' : mark.toLowerCase();
      element('span', 'register-mark', item, `${mark}.${you ? REGISTER.you : ''}`);
      const stamps = element('span', 'register-stamps', item); stamps.setAttribute('aria-label', `${count}／${REGISTER.full} 個章`);
      // Each stamp in red ink, the places still to fill as faint rings.
      inked(stamps, `0 0 ${REGISTER.full * 25} 24`, ink => { for (let i = 0; i < REGISTER.full; i++) { const cx = 12 + i * 25; if (i < count) { shape('circle', { cx, cy: 12, r: 9.5, fill: 'none', stroke: '#b5443c', 'stroke-width': 2.2 }, ink); shape('circle', { cx, cy: 12, r: 5, fill: '#b5443c' }, ink); } else shape('circle', { cx, cy: 12, r: 9.5, fill: 'none', stroke: '#d6c6a4', 'stroke-width': 1.6 }, ink); } });
    };
    for (const [mark, count] of REGISTER.rows) row(mark, count);
    if (signedUp(volunteer)) {
      row(volunteer.mark, points(volunteer), true);
      element('h4', 'register-heading', card, REGISTER.jobs);
      const jobs = element('ul', 'register-jobs', card);
      for (const task of TASKS) { const done = volunteer.tasks.includes(task), item = element('li', done ? 'is-done' : '', jobs); element('span', 'job-box', item, done ? '✓' : '').setAttribute('aria-hidden', 'true'); element('strong', '', item, JOBS[task][0]); element('span', '', item, JOBS[task][1]); }
      // The old pages, tied with red cord (two jobs untie them); a wish for three stamps; the endings seen so far.
      const cord = element('div', 'register-cord', card);
      if (finale.twist || finale.unlocked) { const untie = element('button', 'register-sign', cord, finale.twist ? CORD.again : CORD.untie); untie.type = 'button'; on(untie, 'click', () => { sound.play('remove'); open('oldpage', from); }); }
      else if (canUntie(volunteer)) lock(cord, from);
      else element('p', 'secret-note', cord, `${CORD.tied}${CORD.soon}`);
      if (canWish(volunteer, finale)) {
        element('h4', 'register-heading', card, WISH.title); element('p', 'secret-note', card, WISH.invite);
        const choices = element('div', 'compose-choices register-wishes', card), make = element('button', 'register-sign', card, WISH.sign); make.type = 'button'; make.disabled = true;
        let chosen = null;
        for (const wish of WISHES) {
          const choice = element('button', 'compose-choice', choices, wish.name); choice.type = 'button'; choice.setAttribute('aria-pressed', 'false');
          on(choice, 'click', () => { chosen = wish.id; sound.play('pick'); for (const other of choices.children) other.setAttribute('aria-pressed', String(other === choice)); make.disabled = false; });
        }
        on(make, 'click', () => { if (!chosen) return; sound.play('thud'); closeCard(); onWish(chosen); });
      } else if (finale.wish) element('p', 'secret-note', card, WISH.made(WISHES.find(wish => wish.id === finale.wish).name));
      const seen = element('p', 'register-endings', card); element('span', '', seen, `${SEEN}：`);
      // A stamp for each ending seen: press it to watch that ending again.
      for (const ending of ['A', 'B', 'C', 'D']) {
        const got = finale.endings.includes(ending), mark = element(got ? 'button' : 'span', got ? 'is-seen' : '', seen); mark.setAttribute('aria-label', got ? `再看一次結局 ${ending}` : `結局 ${ending}，還沒看過`);
        if (got) { mark.type = 'button'; on(mark, 'click', () => { sound.play('pick'); onReplay(ending); }); }
        inked(mark, '0 0 30 30', ink => shape('circle', got ? { cx: 15, cy: 15, r: 13, fill: '#b5443c' } : { cx: 15, cy: 15, r: 12, fill: 'none', stroke: '#d6c6a4', 'stroke-width': 1.8 }, ink)); element('span', 'ending-letter', mark, ending);
      }
      // Leaving takes a second press, and keeps the stamps.
      const leave = element('button', 'register-leave', card, REGISTER.leave); leave.type = 'button';
      on(leave, 'click', () => {
        if (!leave.dataset.sure) { leave.dataset.sure = '1'; leave.textContent = '確定離開'; say(REGISTER.sure); return; }
        quit(); sound.play('remove'); open('register', from); say(REGISTER.left);
      });
      return;
    }
    element('p', 'secret-note', card, REGISTER.invite); onInvite();
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
    on(sign, 'click', () => { if (!chosen) return; join(chosen); sound.play('thud'); open('register', from); say(REGISTER.joined(chosen)); });
  }
  // The old page under the red cord: Holly's wish in 2003, stamped fulfilled, and her on the night shift every year since.
  function oldPage(page) {
    const [year, mark, name, wish] = OLD_PAGE.entry;
    element('h3', 'secret-title', page, OLD_PAGE.title);
    const entry = element('div', 'old-entry', page);
    element('p', 'old-line', entry, `${year}　${mark}　${name}`); element('p', 'old-line', entry, wish);
    const fulfilled = element('span', 'old-stamp', entry); inked(fulfilled, '0 0 160 40', ink => { shape('rect', { x: 3, y: 3, width: 154, height: 34, rx: 6, fill: 'none', stroke: '#b5443c', 'stroke-width': 2.4 }, ink); shape('rect', { x: 8, y: 8, width: 144, height: 24, rx: 4, fill: 'none', stroke: '#b5443c', 'stroke-width': 1.2 }, ink); }); element('span', 'ink-words', fulfilled, OLD_PAGE.stamp);
    const since = element('ul', 'old-since', page); for (const line of OLD_PAGE.since) element('li', '', since, line);
    element('p', 'old-pencil', page, OLD_PAGE.pencil);
    if (!finale.twist) onTwist();
  }
  function close(id, from) {
    card?.remove(); card = null; sound.play('remove');
    // The name tags and the rules count as read once put back; the log once it has been put right (above).
    if (id === 'tags' || id === 'rules') { clue(id); learn(id); }
    layout(); from.focus({ preventScroll: true });
  }
  // A clue read. The first discovery, once all three are: more than one Santa. Told once, quietly.
  function learn(id) {
    const before = knowsSantas(story.seen);
    if (CLUES.includes(id) && !story.seen.includes(id)) { story.seen.push(id); save(); }
    if (!before && knowsSantas(story.seen)) { later(id === 'log' ? 2400 : 400, () => { sound.play('jingle'); say(NOTES.known); onKnow(); }); later(6600, () => { if (!card && invited()) say(REGISTER.hint); }); }
  }
  const follow = () => { layout(); frame = requestAnimationFrame(follow); };
  follow();
  return () => { events.abort(); cancelAnimationFrame(frame); card?.remove(); };
}
