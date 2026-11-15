// The visitor's clue book, a little kraft notebook in the corner of the scene: whatever is noticed around the village that
// may matter later is written in it the moment it is seen (`add`), and it keeps a hint for whatever the story is waiting
// on now (`goal`, cabin-story.js), a little plainer each time one is asked for. It shows itself once there is something
// in it, and hops when something new goes in, a job is ticked or the goal moves on.
// Opened, it is a book turned a leaf at a time, as the Intro's storybook is: on a wide screen two pages lie side by side
// and the leaf turns about an upright spine; at 700px and narrower the spread is laid out top and bottom with the spine
// across the middle, and a finger sliding up or down turns the page, once that page's words have been scrolled to their
// end. Paper index tabs stick out of its edge: now (the goal, the clues it turns on, the jobs once signed up, the hints),
// then the clues found in the yard, the house and the little room, then the gifts. A clue is a sticker naming where it
// was seen; tapped, what it said opens under it. Cut from the same paper as everything else (cabin-paper.js).
import { paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';
import { ornament } from './cabin-ornaments.js';
import { GIFTS, TASKS, goal, knowsSantas, points, signedUp } from '../services/cabin-story.js';
import { CLUE_PLACES, GIFT_HINTS, GIFT_ORDER, GOALS, GOAL_CLUES, NOTEBOOK, RESTART } from '../data/cabin-clues.js';
import { JOBS } from '../data/cabin-secret.js';
import { resetProgress } from '../services/cabin-progress.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const PAPER = { paper: { scale: .25, grain: .4, shadow: .3 }, eager: true }, GIFT_PAPER = { paper: { scale: .3, grain: .45, shadow: .25, rim: '#fbf6ea' }, eager: true };
// Between the parts of a page: a wavering pencil line with a little star in the middle.
const RULE = { paper: { scale: .2, grain: .6, shadow: 0, rim: '#ffffff00' }, eager: true };
const divider = parent => paperLayer(element('div', 'notebook-rule', parent), '0 0 240 14', '', g => { shape('path', { d: 'M4 7C40 4 70 10 104 7M136 7C170 4 200 10 236 7', fill: 'none', stroke: '#d8c49c', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g); star(g, 120, 7, 5.5); }, RULE);
// A gift not yet found: a pale paper ornament with a question mark.
function unfound(g) {
  shape('path', { d: 'M50 0V24', stroke: '#cdbb98', 'stroke-width': 1.6 }, g); shape('rect', { x: 42, y: 22, width: 16, height: 10, rx: 2, fill: '#e2d4b8' }, g);
  shape('circle', { cx: 50, cy: 74, r: 34, fill: '#f1e6cf' }, g);
  shape('path', { d: 'M40 64C40 52 60 52 60 64 60 72 50 72 50 82M50 92V93', fill: 'none', stroke: '#cdbb98', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
}
// The notebook: kraft cover, darker spine, the cream pages showing at its edge, a red elastic band and a gold star.
function cover(paper) {
  shape('rect', { x: 9, y: 5, width: 34, height: 45, rx: 3, fill: '#fffaf0' }, paper);
  shape('rect', { x: 4, y: 3, width: 35, height: 48, rx: 4, fill: '#c9a46a' }, paper);
  shape('rect', { x: 4, y: 3, width: 8, height: 48, rx: 3, fill: '#a8774d' }, paper);
  shape('rect', { x: 16, y: 13, width: 16, height: 10, rx: 2, fill: '#fffaf0' }, paper);
  shape('path', { d: 'M19 18.5H29', stroke: '#b5443c', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, paper);
  star(paper, 24, 37, 5.2);
  shape('rect', { x: 33, y: 3, width: 3.4, height: 48, fill: '#b5443c' }, paper);
}
// The tabs, in the book's order; the clue stickers a page holds, tall beside an upright spine or short above or below it.
const SECTIONS = { now: '現在', yard: '院子', house: '小屋', room: '小房間', gifts: '見面禮' };
const PER_PAGE = { spread: 6, stacked: 4 };
const narrow = () => Boolean(globalThis.matchMedia?.('(max-width: 700px)').matches);
const calm = () => Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
// A leaf lies over the right (or lower) page and turns about the spine to lie over the other one.
const flipped = () => (narrow() ? 180 : -180);

export function mountNotebook(stage, { progress, save, sound }) {
  const button = element('button', 'notebook-button', stage); button.type = 'button'; button.setAttribute('aria-label', '線索本');
  paperLayer(button, '0 0 48 56', 'notebook-icon', cover, PAPER);
  const dot = element('span', 'notebook-new', button); dot.hidden = true;
  paperLayer(dot, '0 0 20 20', '', paper => shape('circle', { cx: 10, cy: 10, r: 7, fill: '#b5443c' }, paper), { paper: { scale: .15, grain: .3, shadow: .3 }, eager: true });
  let card = null, book = null, fresh = new Set(), ticked = new Set();
  const show = () => { button.hidden = !(progress.clues.length || progress.story.left); };
  // When the goal moves on, the book only hops and shows its red dot: nothing is said (what to do now is written inside).
  let goalNow = goal(progress);
  function check() {
    const now = goal(progress); if (now === goalNow) return;
    goalNow = now; show(); dot.hidden = false;
    button.classList.remove('is-new'); void button.offsetWidth; button.classList.add('is-new');
  }
  // Something new in the book: written down, and the book hops. Returns whether it was new.
  function add(id) {
    if (!NOTEBOOK[id] || progress.clues.includes(id)) return false;
    progress.clues.push(id); save(); fresh.add(id); show(); dot.hidden = false;
    button.classList.remove('is-new'); void button.offsetWidth; button.classList.add('is-new');
    sound.play('pick'); if (card) render();
    return true;
  }
  // A job done: its box is ticked in the book (stamped in as the book next opens), and the book hops.
  function tick(task) {
    ticked.add(task); dot.hidden = false;
    button.classList.remove('is-new'); void button.offsetWidth; button.classList.add('is-new');
    if (card) render();
  }

  // A clue as a sticker: its name, and where it was seen; tapped, what it said opens under it (one just found is open
  // already).
  function sticker(list, id) {
    const item = element('li', fresh.has(id) ? 'clue-item is-fresh' : 'clue-item', list);
    const tag = element('button', 'clue-sticker', item); tag.type = 'button';
    const words = element('span', 'clue-words', tag); element('span', 'notebook-place', words, NOTEBOOK[id].name); element('span', 'clue-where', words, NOTEBOOK[id].place);
    const text = element('p', 'clue-text', item, NOTEBOOK[id].text); text.hidden = !fresh.has(id);
    tag.setAttribute('aria-expanded', String(!text.hidden));
    tag.addEventListener('click', () => { text.hidden = !text.hidden; tag.setAttribute('aria-expanded', String(!text.hidden)); sound.play(text.hidden ? 'remove' : 'pick'); });
  }
  const stickers = (parent, ids) => { const list = element('ul', 'notebook-clues', parent); for (const id of ids) sticker(list, id); };
  // The clues found among `ids`, in the order they were found.
  const found = ids => progress.clues.filter(id => ids.includes(id));
  // The substitute's jobs (the register's list): a box for each, ticked once it is done and stamped.
  function jobs(page) {
    const work = element('section', 'notebook-work', page), { tasks } = progress.volunteer;
    element('h4', 'notebook-goal', work, `替身工作：完成 ${points(progress.volunteer)}／${TASKS.length}`);
    const list = element('ul', 'notebook-jobs', work);
    for (const task of TASKS) {
      const done = tasks.includes(task), item = element('li', done ? `is-done${ticked.has(task) ? ' is-fresh' : ''}` : '', list);
      element('span', 'job-box', item, done ? '✓' : '').setAttribute('aria-hidden', 'true'); element('span', 'sr-only', item, done ? '已完成：' : '還沒做：');
      element('strong', '', item, JOBS[task][0]); element('span', '', item, JOBS[task][1]);
    }
  }
  // A hint for what the story is waiting on: one more line each time it is asked for.
  function hints(page, now) {
    const lines = GOALS[now].hints, shown = progress.hints[now] ?? 0;
    const help = element('section', 'notebook-hints', page); help.setAttribute('aria-live', 'polite');
    element('h4', 'book-label', help, '卡住了嗎？');
    lines.slice(0, shown).forEach((hint, i) => element('p', 'notebook-hint-line', help, `${i + 1}. ${hint}`));
    if (shown < lines.length) {
      const ask = element('button', 'notebook-hint', help, shown ? '再給一點提示' : '卡住了？給我一點提示'); ask.type = 'button';
      ask.addEventListener('click', () => { progress.hints[now] = shown + 1; save(); sound.play('pick'); render(); card?.querySelector('.book-page .notebook-hint, .notebook-close')?.focus({ preventScroll: true }); });
    }
  }
  // The welcome gifts, once the secret is known: a place for each substitute's ornament, cut out in colour once found,
  // faint until then; and a hint about the next one not yet found, each time one is asked for.
  function gifts(page) {
    const box = element('section', 'notebook-gifts', page), have = progress.ornaments;
    element('h4', 'notebook-goal', box, `見面禮：找到 ${have.length}／${GIFTS.length}`);
    element('p', 'notebook-hint-line', box, have.length === GIFTS.length ? '五個都找齊了，掛在小屋的聖誕樹上。' : '五位替身各藏了一個吊飾，留給新來的替身。');
    const row = element('div', 'gift-row', box);
    for (const mark of GIFTS) {
      const slot = element('span', have.includes(mark) ? 'gift-slot is-found' : 'gift-slot', row); slot.setAttribute('role', 'img'); slot.setAttribute('aria-label', have.includes(mark) ? `${mark}. 的吊飾，找到了` : '還沒找到的吊飾');
      paperLayer(slot, '-6 -4 112 140', '', g => (have.includes(mark) ? ornament(mark, g) : unfound(g)), GIFT_PAPER);
    }
    const missing = GIFT_ORDER.filter(mark => !have.includes(mark)), asked = Math.min(progress.hints.gifts ?? 0, missing.length);
    missing.slice(0, asked).forEach(mark => element('p', 'notebook-hint-line', box, `・${GIFT_HINTS[mark]}`));
    if (asked < missing.length) {
      const ask = element('button', 'notebook-hint', box, asked ? '還有哪裡？' : '去哪裡找？'); ask.type = 'button';
      ask.addEventListener('click', () => { progress.hints.gifts = asked + 1; save(); sound.play('pick'); render(); });
    }
  }
  // The book's pages, two to a spread. Now: the goal and the clues it turns on, then the jobs (once signed up) and the
  // hints. Then each place's clues, a place starting on a left page so its tab opens on it, and the gifts. A page left
  // over is a quiet one with a star on it.
  function pages() {
    const list = [], per = PER_PAGE[narrow() ? 'stacked' : 'spread'];
    const spare = () => { if (list.length % 2) list.push({ section: list[list.length - 1].section, draw: page => paperLayer(element('div', 'book-doodle', page), '0 0 100 100', '', g => star(g, 50, 50, 26), PAPER) }); };
    const now = goal(progress), { title } = GOALS[now];
    list.push({ section: 'now', draw: page => {
      const help = element('section', 'notebook-now', page);
      element('h3', 'notebook-title', help, '線索本'); element('h4', 'notebook-goal', help, `現在：${title}`);
      element('p', 'notebook-task', help, GOALS[now].task);
      const near = found(GOAL_CLUES[now] ?? []);
      if (near.length) { element('p', 'book-label', help, '用得上的線索'); stickers(help, near); }
    } });
    list.push({ section: 'now', draw: page => { if (signedUp(progress.volunteer)) { jobs(page); divider(page); } hints(page, now); } });
    for (const [id, name, ids] of CLUE_PLACES) {
      const here = found(ids); if (!here.length) continue;
      spare();
      for (let i = 0; i < here.length; i += per) list.push({ section: id, draw: page => { element('h3', 'book-heading', page, name); stickers(page, here.slice(i, i + per)); } });
    }
    if (knowsSantas(progress.story.seen) || progress.ornaments.length) {
      spare();
      const notes = found(GIFTS.map(mark => `gift-${mark}`));
      list.push({ section: 'gifts', draw: gifts }, { section: 'gifts', draw: page => { element('h3', 'book-heading', page, '吊飾上的小卡片'); if (notes.length) stickers(page, notes); else element('p', 'notebook-empty', page, '還沒找到任何吊飾。'); } });
    }
    spare();
    return list;
  }

  // The open book (`book`): its two pages, the leaf that turns, the cover, the tabs and the way along.
  const fill = (page, { section, draw }) => { page.replaceChildren(); page.scrollTop = 0; page.dataset.section = section; draw(page); };
  // Everything in it drawn again for the story as it stands, open at the same spread (put off until a leaf has landed).
  function render() {
    const b = book; if (!b) return;
    if (b.turning) { b.dirty = true; return; }
    card.dataset.layout = narrow() ? 'stacked' : 'spread';
    b.pages = pages(); b.spread = Math.min(b.spread, b.pages.length / 2 - 1);
    b.slots.forEach((page, i) => fill(page, b.pages[2 * b.spread + i]));
    fill(b.lid.lastElementChild, b.pages[2 * b.spread]);
    b.tabs.replaceChildren();
    for (const [id, name] of Object.entries(SECTIONS)) {
      const first = b.pages.findIndex(page => page.section === id); if (first < 0) continue;
      const tab = element('button', 'book-tab', b.tabs, name); tab.type = 'button'; tab.dataset.section = id;
      tab.addEventListener('click', () => turnTo(Math.floor(first / 2)));
    }
    nav();
  }
  function nav() {
    const b = book; if (!b) return;
    const spreads = b.pages.length / 2, section = b.pages[2 * b.spread].section;
    b.back.disabled = b.busy || b.spread === 0; b.ahead.disabled = b.busy || b.spread === spreads - 1;
    b.count.textContent = `${SECTIONS[section]}　${b.spread + 1}／${spreads}`;
    for (const tab of b.tabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.section === section));
  }
  // A leaf (or the cover) turning about the spine. iOS Safari does not reliably hide a sheet's back, so the faces swap
  // while it stands on edge; with less motion it is simply laid down on the other side.
  async function hinge(node, from, to, duration = 760) {
    const axis = narrow() ? 'rotateX' : 'rotateY', side = angle => (Math.abs(angle) > 90 ? 'back' : 'front');
    const set = angle => { node.style.transform = `translateZ(2px) ${axis}(${angle}deg)`; };
    set(from); node.dataset.side = side(from); node.classList.add('is-turning');
    if (calm() || !node.animate) { set(to); node.dataset.side = side(to); return; }
    const middle = (from + to) / 2, frame = angle => ({ transform: `translateZ(2px) ${axis}(${angle}deg)` });
    for (const [a, z, easing] of [[from, middle, 'cubic-bezier(.5,.05,.85,.55)'], [middle, to, 'cubic-bezier(.15,.45,.4,1)']]) {
      const run = node.animate([frame(a), frame(z)], { duration: duration / 2, easing, fill: 'forwards' });
      await run.finished.catch(() => {}); set(z); node.dataset.side = side(to); run.cancel();
    }
  }
  // Turning to another spread: the leaf lifts one page and lays the next down on the other side, and the page under it
  // is the new one already.
  async function turnTo(target) {
    const b = book; if (!b || b.busy || target === b.spread || target < 0 || target >= b.pages.length / 2) return;
    b.busy = b.turning = true; nav(); sound.play('pick');
    const forward = target > b.spread, [left, right] = b.slots, [front, rear] = b.leaf.children;
    fill(front, b.pages[2 * (forward ? b.spread : target) + 1]); fill(rear, b.pages[2 * (forward ? target : b.spread)]);
    if (forward) fill(right, b.pages[2 * target + 1]); else fill(left, b.pages[2 * target]);
    await hinge(b.leaf, forward ? 0 : flipped(), forward ? flipped() : 0);
    if (book !== b) return;
    if (forward) fill(left, b.pages[2 * target]); else fill(right, b.pages[2 * target + 1]);
    b.leaf.classList.remove('is-turning'); b.spread = target; b.busy = b.turning = false;
    if (b.dirty) { b.dirty = false; render(); } else { fill(b.lid.lastElementChild, b.pages[2 * target]); nav(); }
  }
  function open() {
    card = element('article', 'notebook-card', stage); card.setAttribute('aria-label', '線索本');
    const events = new AbortController(), on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal: events.signal });
    const shell = element('div', 'book', card), tabs = element('div', 'book-tabs', shell), board = element('div', 'book-board', shell);
    element('div', 'board-half', board); element('div', 'board-half', board);
    tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '分頁');
    const sheets = element('div', 'book-pages', shell), slots = ['a', 'b'].map(slot => { const page = element('section', 'book-page', sheets); page.dataset.slot = slot; return page; });
    // The leaf that turns and the cover: a front over the right (or lower) page, a back that lands over the other.
    const sheet = className => { const node = element('div', className, shell); node.setAttribute('aria-hidden', 'true'); node.inert = true; element('div', 'leaf-face leaf-front', node); element('div', 'leaf-face leaf-back', node); return node; };
    const leaf = sheet('book-leaf'), lid = sheet('book-cover'), face = lid.firstElementChild;
    face.classList.add('cover-face'); element('p', 'cover-title', face, '線索本');
    paperLayer(element('span', 'cover-star', face), '0 0 40 40', '', g => star(g, 20, 20, 15), PAPER);
    const foot = element('div', 'book-foot', card);
    const back = element('button', 'book-turn', foot, '‹ 上一頁'), count = element('p', 'book-count', foot), ahead = element('button', 'book-turn', foot, '下一頁 ›');
    const done = element('button', 'notebook-close', foot, '收好 ✓');
    back.type = ahead.type = done.type = 'button'; count.setAttribute('aria-live', 'polite');
    on(done, 'click', close); on(back, 'click', () => turnTo(book.spread - 1)); on(ahead, 'click', () => turnTo(book.spread + 1));
    // At the very bottom, starting over: asked once more, then this browser's record of the village is cleared and the page
    // opens from the first chapter.
    const again = element('button', 'notebook-restart', card, RESTART.ask); again.type = 'button';
    again.addEventListener('click', () => {
      again.hidden = true; sound.play('pick');
      const sure = element('p', 'notebook-hint-line notebook-sure', null, RESTART.sure), row = element('div', 'signpost-actions notebook-sure-row');
      const yes = element('button', 'register-sign', row, RESTART.yes), no = element('button', 'register-sign is-quiet', row, RESTART.no);
      yes.type = no.type = 'button'; again.after(sure, row);
      yes.addEventListener('click', () => { resetProgress(); location.reload(); });
      no.addEventListener('click', () => { sure.remove(); row.remove(); again.hidden = false; sound.play('remove'); again.focus({ preventScroll: true }); });
      no.focus({ preventScroll: true });
    });
    // Esc closes the book and stops there, so the room behind keeps its own Esc; the arrow keys turn its pages.
    card.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } });
    on(card, 'keydown', event => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault(); turnTo(book.spread + step);
    });
    // A finger sliding the spine's way turns the page: up or down when stacked (once the page under it has been scrolled
    // to that end), sideways on a wide touch screen.
    let swipe = null;
    on(shell, 'touchstart', event => { swipe = book && !book.busy && event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }, { passive: true });
    on(shell, 'touchmove', event => {
      if (!swipe) return;
      const stacked = narrow(), dx = event.touches[0].clientX - swipe.x, dy = event.touches[0].clientY - swipe.y, along = stacked ? dy : dx, across = stacked ? dx : dy;
      if (swipe.turn === undefined) {
        if (Math.hypot(dx, dy) < 10) return;
        const ahead = along < 0, target = book.spread + (ahead ? 1 : -1), page = event.target.closest?.('.book-page');
        const room = stacked && page && (ahead ? page.scrollTop + page.clientHeight < page.scrollHeight - 2 : page.scrollTop > 2);
        swipe.turn = Math.abs(along) > Math.abs(across) && target >= 0 && target < book.pages.length / 2 && !room ? target : false;
      }
      if (swipe.turn === false) return;
      swipe.moved = Math.abs(along); if (event.cancelable) event.preventDefault();
    }, { passive: false });
    on(shell, 'touchend', () => { if (swipe?.turn !== undefined && swipe.turn !== false && swipe.moved >= 48) turnTo(swipe.turn); swipe = null; });
    on(shell, 'touchcancel', () => { swipe = null; });
    // Across 700px (a phone turned, a window narrowed) the spread is laid out again, at the start of what it was showing.
    const media = globalThis.matchMedia?.('(max-width: 700px)');
    if (media) on(media, 'change', () => {
      const b = book; if (!b || b.turning) return;
      const section = b.pages[2 * b.spread].section; b.spread = 0; render();
      b.spread = Math.max(0, Math.floor(b.pages.findIndex(page => page.section === section) / 2)); render();
    });
    book = { slots, tabs, leaf, lid, back, ahead, count, events, pages: [], spread: 0, busy: true, turning: false, dirty: false };
    render(); dot.hidden = true; sound.play('open'); button.setAttribute('aria-expanded', 'true');
    // Its papers drawn, the cover swings open over the spine.
    card.dataset.state = 'opening'; lid.style.transform = 'translateZ(2px)'; lid.dataset.side = 'front'; lid.classList.add('is-turning');
    const mine = book;
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      if (book !== mine) return;
      await hinge(lid, 0, flipped(), 900); if (book !== mine) return;
      lid.classList.remove('is-turning'); card.dataset.state = 'open'; mine.busy = false; nav();
    }));
    done.focus({ preventScroll: true });
  }
  // Put away: the cover swings shut over the pages and the book goes back to its corner (at once while it is still
  // opening or turning, or with less motion).
  async function close() {
    const b = book; if (!b || b.closing) return;
    if (b.busy || calm()) { shut(); return; }
    b.closing = b.busy = true; nav(); card.dataset.state = 'closing';
    fill(b.lid.lastElementChild, b.pages[2 * b.spread]);
    await hinge(b.lid, flipped(), 0, 640);
    if (book === b) shut();
  }
  function shut() {
    if (!card) return;
    book?.events.abort(); card.remove(); card = null; book = null; fresh = new Set(); ticked = new Set(); sound.play('remove');
    button.setAttribute('aria-expanded', 'false'); button.focus({ preventScroll: true });
  }
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => (card ? close() : open()));
  show();
  return { add, tick, check, refresh: show, close, destroy() { book?.events.abort(); card?.remove(); button.remove(); } };
}
