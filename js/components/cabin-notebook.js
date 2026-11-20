// The visitor's clue book, a little kraft notebook in the corner of the scene: whatever is noticed around the village that
// may matter later is written in it the moment it is seen (`add`), and it keeps a hint for whatever the story is waiting
// on now (`goal`, cabin-story.js), a little plainer each time one is asked for. It shows itself once there is something
// in it, and hops when something new goes in, a job is ticked or the goal moves on.
// Opened, it is a real little book, turned as the Intro's storybook is. Shut, it lies in the middle with its elastic band
// round it and a stamp on its cover for each chapter the story is past (one finished since it was last opened is pressed
// on first); the band slips off over the edge, and the cover (as big as the board under it) swings open on the spine
// while the book slides over to lay the spread in the middle. The inside of the cover is the first left page. On a wide screen
// the two pages lie side by side about an upright spine; at 700px and narrower they lie top and bottom with the spine
// across the middle, and a finger sliding up or down turns the page once that page's words have been scrolled to their
// end. Paper index tabs are stuck to the leaves where each part begins (now, the yard, the house, the little room, the
// gifts) and stick out of the fore-edge, so each lies on the side its leaf does and rides over with it as it turns; the
// edges of the leaves show on the boards, more on the side that holds more. What each part holds is laid over its pages
// measured, so the two pages of a spread come out about as full as each other. A clue is a sticker with a little paper
// picture of the thing it was found on (cabin-clue-art.js), its name and where it was seen; tapped, what it said opens
// under it, and one just found is stuck on with a slap once its page lies open. Cut from the same paper as everything
// else (cabin-paper.js).
import { paperLayer, shape } from './paper-art.js';
import { lamp, roofHouse, snowyFir, star } from './paper-props.js';
import { ornament } from './cabin-ornaments.js';
import { CLUE_ICON, clueIcon, goalPicture, postmark, stampArt, stampFrame } from './cabin-clue-art.js';
import { CHAPTERS, GIFTS, TASKS, YARD, chaptersDone, goal, knowsSantas, points, signedUp } from '../services/cabin-story.js';
import { ever } from '../services/cabin-bag.js';
import { CLUE_PLACES, GIFT_HINTS, GIFT_ORDER, GOALS, GOAL_CLUES, NEXT, NOTEBOOK, RESTART, WONDER } from '../data/cabin-clues.js';
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
// The tabs in the book's order, each with its word: outside, the book is written in English; inside, in Chinese.
const SECTIONS = { now: ['Now', '現在'], yard: ['Yard', '院子'], house: ['Cabin', '小屋'], room: ['Room', '小房間'], gifts: ['Gifts', '見面禮'] };
// A page with nothing written on it keeps a faint paper picture of its part of the book: [viewBox, draw].
const EMBLEMS = {
  now: ['0 0 100 100', g => star(g, 50, 54, 32)],
  yard: ['0 0 100 100', g => { snowyFir(g, 40, 94, 74); snowyFir(g, 66, 94, 54, 1); }],
  house: ['0 0 100 100', g => roofHouse(g, 50, 90, 52, 36)],
  room: ['0 0 100 100', g => lamp(shape('g', { transform: 'translate(25 8) scale(.5)' }, g), 50, 178)],
  gifts: ['-6 -4 112 140', g => ornament(GIFTS[0], g)],
};
const narrow = () => Boolean(globalThis.matchMedia?.('(max-width: 700px)').matches);
const calm = () => Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
// A leaf lies over the right (or lower) page and turns about the spine to lie over the other one; the tabs of the leaves
// still to turn stick out of the right (lower) edge, those turned out of the left (upper) one.
const flipped = () => (narrow() ? 180 : -180);
const sides = () => (narrow() ? ['bottom', 'top'] : ['right', 'left']);
// Shut, the book lies in the middle: it is the right (lower) half of the spread, so the spread sits a quarter over.
const shift = amount => (narrow() ? `translateY(${amount}%)` : `translateX(${amount}%)`);
// A sheet turning stands off the page under it, its shadow longest when it is lifted highest (as the Intro's).
const FLAT = '0 1px 2px #6e55331a', LIFTED = '8px 10px 8px #6e553340';

// Where to cut a part's blocks to lay them over an even number of pages `room` tall (`ends`: where each block ends when
// they are written one under another): as few pages as hold them, each as near as can be to as full as the others, a
// page running over costing dearly. A list may go on from a left (upper) page to the one beside it, read at a glance;
// going on over a turn of the leaf (`joins`: the blocks that go on from the one before) costs enough that it only does
// when it has to. Each page is [its first block, the one after its last]; one may be empty.
export function share(ends, room, joins = []) {
  const n = ends.length, total = ends[n - 1] ?? 0, tall = (i, j) => (j > i ? ends[j - 1] - (i ? ends[i - 1] : 0) : 0);
  // Two more pages at a time until nothing runs over (or there is a page for every block).
  for (let count = 2 * Math.max(1, Math.ceil(total / (2 * room))); ; count += 2) {
    const even = total / count, cost = (height, i, page) => (height - even) ** 2 + (height > room ? 50 * (height - room) ** 2 : 0) + (joins[i] && height && !(page % 2) ? (room / 3) ** 2 : 0);
    // best[j]: the least it costs to lay the first j blocks on the pages so far, and where each of those pages starts.
    // On a tie the later cut wins, so the earlier page is the fuller one.
    let best = Array.from({ length: n + 1 }, (_, j) => [j ? Infinity : 0, []]);
    for (let page = 0; page < count; page++) {
      const next = Array.from({ length: n + 1 }, () => [Infinity, []]);
      for (let j = 0; j <= n; j++) for (let i = j; i >= 0; i--) {
        const [was, starts] = best[i], value = was + cost(tall(i, j), i, page);
        if (value < next[j][0]) next[j] = [value, [...starts, i]];
      }
      best = next;
    }
    const starts = best[n][1], pages = starts.map((start, page) => [start, starts[page + 1] ?? n]);
    if (count >= n || pages.every(([i, j]) => tall(i, j) <= room)) return pages;
  }
}

export function mountNotebook(stage, { progress, save, sound }) {
  const button = element('button', 'notebook-button', stage); button.type = 'button'; button.setAttribute('aria-label', '線索本');
  paperLayer(button, '0 0 48 56', 'notebook-icon', cover, PAPER);
  const dot = element('span', 'notebook-new', button); dot.hidden = true;
  paperLayer(dot, '0 0 20 20', '', paper => shape('circle', { cx: 10, cy: 10, r: 7, fill: '#b5443c' }, paper), { paper: { scale: .15, grain: .3, shadow: .3 }, eager: true });
  let card = null, book = null, fresh = new Set(), ticked = new Set();
  const show = () => { button.hidden = !(progress.clues.length || progress.story.left); };
  // When the goal moves on, the book only hops and shows its red dot: nothing is said (what to do now is written inside).
  let goalNow = goal(progress);
  // The goal as it stood when the book was last opened: a new one's picture pops in as the book opens, once.
  let goalRead = goalNow, goalFresh = false;
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
  // Something done that moves the story on (cabin-play.js, `milestone`): a note slides out from under the book saying what
  // comes next, for a few seconds: the goal's picture and its `task` (for the yard and the jobs, what is still left, by
  // name). It is the visitor's own jotting, the book being theirs; tapped, the book opens at "now".
  const jotting = element('button', 'notebook-next', stage); jotting.type = 'button'; jotting.hidden = true;
  let nextTimer = 0;
  function remind() {
    if (card) return;
    const now = goal(progress), { bag, volunteer, finale } = progress;
    const text = now === 'yard' ? `${NEXT.yard}${YARD.filter(id => !ever(bag, id)).map(id => NEXT.places[id]).join('、')}。`
      : now === 'jobs' ? `${NEXT.jobs}${TASKS.filter(task => !volunteer.tasks.includes(task)).map(task => JOBS[task][0]).join('、')}。`
        : now === 'wish' && points(volunteer) === TASKS.length && !finale.asked ? NEXT.asked : GOALS[now].task;
    jotting.replaceChildren();
    const picture = element('span', 'goal-picture', jotting); picture.style.backgroundImage = goalPicture(now); picture.setAttribute('aria-hidden', 'true');
    element('span', 'notebook-next-text', jotting, text); jotting.setAttribute('aria-label', `接下來：${text}（打開線索本）`);
    // Below the book, and below whatever else is up there at the moment (the caption, Santa's portrait in the room).
    const box = stage.getBoundingClientRect(), above = [button, stage.querySelector('.cabin-caption'), stage.querySelector('.chat-fold')].filter(node => node && !node.hidden && node.getClientRects().length);
    jotting.style.top = `${Math.max(...above.map(node => node.getBoundingClientRect().bottom - box.top)) + 10}px`;
    jotting.hidden = false; jotting.classList.remove('is-in'); void jotting.offsetWidth; jotting.classList.add('is-in'); sound.play('pick');
    clearTimeout(nextTimer); nextTimer = setTimeout(() => { jotting.hidden = true; }, 9000);
  }
  jotting.addEventListener('click', () => { clearTimeout(nextTimer); jotting.hidden = true; open(); });
  // A job done: its box is ticked in the book (stamped in as the book next opens), and the book hops.
  function tick(task) {
    ticked.add(task); dot.hidden = false;
    button.classList.remove('is-new'); void button.offsetWidth; button.classList.add('is-new');
    if (card) render();
  }

  // A clue as a sticker, at the end of the page's list (a new list if the page does not end in one): the picture of the
  // thing it was found on, its name, and where it was seen; tapped, what it said opens under it (one just found is open
  // already).
  function sticker(page, id) {
    const list = page.lastElementChild?.matches('.notebook-clues') ? page.lastElementChild : element('ul', 'notebook-clues', page);
    const item = element('li', fresh.has(id) ? 'clue-item is-fresh' : 'clue-item', list);
    const tag = element('button', 'clue-sticker', item); tag.type = 'button';
    const picture = element('span', 'clue-icon', tag); picture.style.backgroundImage = clueIcon(CLUE_ICON[id]); picture.setAttribute('aria-hidden', 'true');
    const words = element('span', 'clue-words', tag); element('span', 'notebook-place', words, NOTEBOOK[id].name); element('span', 'clue-where', words, NOTEBOOK[id].place);
    const text = element('p', 'clue-text', item, NOTEBOOK[id].text); text.hidden = !fresh.has(id);
    tag.setAttribute('aria-expanded', String(!text.hidden));
    tag.addEventListener('click', () => { text.hidden = !text.hidden; tag.setAttribute('aria-expanded', String(!text.hidden)); sound.play(text.hidden ? 'remove' : 'pick'); });
    return item;
  }
  // The clues found among `ids`, in the order they were found.
  const found = ids => progress.clues.filter(id => ids.includes(id));
  // The substitute's jobs (the register's list): a box for each, ticked once it is done and stamped. Each job is a block
  // of its own, going on from the one before (on the next page too, when the list has to be cut).
  function jobs() {
    const { tasks } = progress.volunteer;
    return TASKS.map((task, i) => Object.assign(page => {
      let list = page.lastElementChild?.matches('.notebook-work') && page.lastElementChild.querySelector('.notebook-jobs');
      if (!list) {
        const work = element('section', 'notebook-work', page);
        if (!i) element('h4', 'notebook-goal', work, `替身工作：完成 ${points(progress.volunteer)}／${TASKS.length}`);
        list = element('ul', 'notebook-jobs', work);
      }
      const done = tasks.includes(task), item = element('li', done ? `is-done${ticked.has(task) ? ' is-fresh' : ''}` : '', list);
      element('span', 'job-box', item, done ? '✓' : '').setAttribute('aria-hidden', 'true'); element('span', 'sr-only', item, done ? '已完成：' : '還沒做：');
      element('strong', '', item, JOBS[task][0]); element('span', '', item, JOBS[task][1]);
      return item;
    }, { join: i > 0 }));
  }
  // A hint for what the story is waiting on: one more line each time it is asked for. A pencil line parts it from what
  // comes before it on the page.
  function hints(page, now) {
    const lines = GOALS[now].hints, shown = progress.hints[now] ?? 0;
    if (page.children.length) divider(page);
    const help = element('section', 'notebook-hints', page); help.setAttribute('aria-live', 'polite');
    element('h4', 'book-label', help, '卡住了嗎？');
    lines.slice(0, shown).forEach((hint, i) => element('p', 'notebook-hint-line', help, `${i + 1}. ${hint}`));
    if (shown < lines.length) {
      const ask = element('button', 'notebook-hint', help, shown ? '再給一點提示' : '卡住了？給我一點提示'); ask.type = 'button';
      ask.addEventListener('click', () => { progress.hints[now] = shown + 1; save(); sound.play('pick'); render(); card?.querySelector('.book-page .notebook-hint, .notebook-close')?.focus({ preventScroll: true }); });
    }
    return help;
  }
  // The welcome gifts, once the secret is known: a place for each substitute's ornament, cut out in colour once found,
  // faint until then; and a hint about the next one not yet found, each time one is asked for.
  function gifts(page) {
    const box = element('section', 'notebook-gifts', page), have = progress.ornaments;
    element('h3', 'book-heading', box, SECTIONS.gifts[1]);
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
    return box;
  }
  // What the book holds, part by part, as blocks written one under another (each draws itself onto a page and returns
  // what it wrote last). Now: the goal (with what the last chapter finished left you wondering, as your own note) and,
  // once signed up, the jobs (what to do), then the clues it turns on and a hint
  // (what helps). Then each place's clues, and the gifts. A heading goes in one block with what comes first under it, so
  // a page never ends on a heading.
  function parts() {
    const now = goal(progress), { title } = GOALS[now], list = [];
    const clues = (ids, head) => ids.map((id, i) => page => { if (!i) head(page); return sticker(page, id); });
    list.push(['now', [
      page => {
        const head = element('header', 'notebook-now', page); element('h3', 'book-heading', head, SECTIONS.now[1]);
        const row = element('div', 'goal-row', head), picture = element('span', goalFresh ? 'goal-picture is-fresh' : 'goal-picture', row);
        picture.style.backgroundImage = goalPicture(now); picture.setAttribute('aria-hidden', 'true');
        const help = element('div', 'goal-words', row); element('h4', 'notebook-goal', help, title); element('p', 'notebook-task', help, GOALS[now].task);
        const last = chaptersDone(progress).at(-1), wonder = last === 'jobs' ? WONDER.jobs[progress.finale.twist ? 0 : 1] : WONDER[last];
        if (wonder) element('p', 'notebook-wonder', help, wonder);
        return head;
      },
      ...(signedUp(progress.volunteer) ? jobs() : []),
      ...clues(found(GOAL_CLUES[now] ?? []), page => element('p', 'book-label', page, '用得上的線索')),
      page => hints(page, now),
    ]]);
    for (const [id, name, ids] of CLUE_PLACES) { const here = found(ids); if (here.length) list.push([id, clues(here, page => element('h3', 'book-heading', page, name))]); }
    if (knowsSantas(progress.story.seen) || progress.ornaments.length) {
      const notes = found(GIFTS.map(mark => `gift-${mark}`)), cards = page => element('h3', 'book-heading', page, '吊飾上的小卡片');
      list.push(['gifts', [gifts, ...(notes.length ? clues(notes, cards) : [page => { cards(page); return element('p', 'notebook-empty', page, '還沒找到任何吊飾。'); }])]]);
    }
    return list;
  }
  // The book's pages: each part's blocks written one under another on a hidden page as wide as a real one, where each
  // ends read off, and the part laid over as few pages as hold it, as evenly as it goes (`share`). A part starts on a
  // left (upper) page, so its tab opens on it.
  function lay() {
    const { probe, slots: [page] } = book, style = getComputedStyle(page);
    const room = Math.max(96, page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)), list = [];
    probe.style.width = `${page.clientWidth}px`;
    for (const [section, blocks] of parts()) {
      probe.replaceChildren();
      const top = parseFloat(getComputedStyle(probe).paddingTop), ends = blocks.map(draw => { const node = draw(probe); return node.offsetTop + node.offsetHeight - top; });
      for (const [start, end] of share(ends, room, blocks.map(draw => Boolean(draw.join)))) list.push({ section, blocks: blocks.slice(start, end) });
    }
    probe.replaceChildren();
    book.size = `${page.clientWidth}x${Math.round(room)}`;
    return list;
  }

  // A page drawn: its blocks, or with none, the faint picture of its part.
  function fill(page, { section, blocks }) {
    page.replaceChildren(); page.scrollTop = 0; page.dataset.section = section;
    for (const draw of blocks) draw(page);
    if (!blocks.length) { const [box, draw] = EMBLEMS[section]; paperLayer(element('div', 'book-doodle', page), box, '', draw, PAPER); }
  }
  // The first and last spread of a part.
  const firstOf = section => Math.floor(book.pages.findIndex(page => page.section === section) / 2);
  const lastOf = section => Math.floor(book.pages.findLastIndex(page => page.section === section) / 2);
  // The edges of the leaves lying on each board (as many as three show), and on the inside of the cover as it swings.
  function stacks(left, right) {
    const [a, z] = book.halves; a.dataset.kind = String(Math.min(3, left)); z.dataset.kind = String(Math.min(3, right));
    book.lining.dataset.kind = a.dataset.kind;
  }
  // The tabs and the leaves as they lie at this spread: a leaf turned lies on the left (upper) side with its tab, the
  // others on the right (lower); shut, all of them lie under the cover.
  function lie() {
    const b = book, [ahead, turned] = sides();
    for (const tab of b.tabs.children) { tab.dataset.side = !b.shut && firstOf(tab.dataset.section) <= b.spread ? turned : ahead; tab.classList.remove('is-carried'); }
    stacks(b.shut ? 0 : b.spread, b.pages.length / 2 - 1 - (b.shut ? 0 : b.spread));
  }
  // The tabs stuck to the leaves that turn ride over on them: taken off the edge they stuck out of, and drawn on the
  // turning sheet, on its front (the side it lies on now) and its back (the side it lands on).
  function carry(sheet, sections) {
    const [ahead, turned] = sides(), front = sheet.querySelector('.leaf-tabs[data-face="front"]'), back = sheet.querySelector('.leaf-tabs[data-face="back"]');
    front.replaceChildren(); back.replaceChildren();
    for (const tab of book.tabs.children) {
      if (!sections.includes(tab.dataset.section)) continue;
      tab.classList.add('is-carried');
      for (const [carrier, side] of [[front, ahead], [back, turned]]) {
        const copy = element('span', 'book-tab', carrier, SECTIONS[tab.dataset.section][0]);
        copy.dataset.section = tab.dataset.section; copy.dataset.side = side; copy.style.setProperty('--slot', tab.style.getPropertyValue('--slot'));
      }
    }
  }
  const landed = sheet => { for (const carrier of sheet.querySelectorAll('.leaf-tabs')) carrier.replaceChildren(); sheet.classList.remove('is-turning'); };
  // Everything in it laid out and drawn again for the story as it stands, at the same place in the same part (put off
  // until a sheet has landed).
  function render() {
    const b = book; if (!b) return;
    if (b.turning) { b.dirty = true; return; }
    card.dataset.layout = narrow() ? 'stacked' : 'spread';
    const was = b.pages[2 * b.spread]?.section, into = was ? b.spread - firstOf(was) : 0;
    b.pages = lay();
    b.spread = was && firstOf(was) >= 0 ? Math.min(firstOf(was) + into, lastOf(was)) : 0;
    b.slots.forEach((page, i) => fill(page, b.pages[2 * b.spread + i]));
    fill(b.sheet, b.pages[2 * b.spread]);
    // A tab for each part there is, each in its own place along the edge (where it stays as the book fills).
    const focused = document.activeElement?.closest?.('.book-tab')?.dataset.section;
    b.tabs.replaceChildren();
    Object.keys(SECTIONS).forEach((id, slot) => {
      if (firstOf(id) < 0) return;
      const tab = element('button', 'book-tab', b.tabs); tab.type = 'button'; tab.dataset.section = id; tab.style.setProperty('--slot', String(slot));
      element('span', '', tab, SECTIONS[id][0]).lang = 'en'; element('span', 'sr-only', tab, SECTIONS[id][1]);
      tab.addEventListener('click', () => turnTo(firstOf(id)));
    });
    lie(); nav();
    if (focused) b.tabs.querySelector(`[data-section="${focused}"]`)?.focus({ preventScroll: true });
  }
  function nav() {
    const b = book; if (!b) return;
    const spreads = b.pages.length / 2, section = b.pages[2 * b.spread].section;
    b.back.disabled = b.busy || b.spread === 0; b.ahead.disabled = b.busy || b.spread === spreads - 1;
    b.count.textContent = `${SECTIONS[section][1]}　${b.spread + 1}／${spreads}`;
    for (const tab of b.tabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.section === section));
  }
  // A leaf (or the cover) turning about the spine, lifting off the page and laying itself down again. iOS Safari does not
  // reliably hide a sheet's back, so the faces swap while it stands on edge; with less motion it is simply laid down on
  // the other side.
  async function hinge(node, from, to, duration = 760) {
    const axis = narrow() ? 'rotateX' : 'rotateY', side = angle => (Math.abs(angle) > 90 ? 'back' : 'front');
    const set = angle => { node.style.transform = `translateZ(2px) ${axis}(${angle}deg)`; };
    set(from); node.dataset.side = side(from); node.classList.add('is-turning');
    if (calm() || !node.animate) { set(to); node.dataset.side = side(to); return; }
    const middle = (from + to) / 2, frame = (angle, lifted) => ({ transform: `translateZ(2px) ${axis}(${angle}deg)`, boxShadow: lifted ? LIFTED : FLAT });
    for (const [a, z, easing] of [[from, middle, 'cubic-bezier(.5,.05,.85,.55)'], [middle, to, 'cubic-bezier(.15,.45,.4,1)']]) {
      const run = node.animate([frame(a, a === middle), frame(z, z === middle)], { duration: duration / 2, easing, fill: 'forwards' });
      await run.finished.catch(() => {}); set(z); node.dataset.side = side(to); run.cancel();
    }
  }
  // The book sliding to or from the middle, and its band slipping off over the edge or back on.
  function slide(node, from, to, duration) {
    node.style.transform = to;
    if (calm() || !node.animate) return Promise.resolve();
    return node.animate([{ transform: from }, { transform: to }], { duration, easing: 'cubic-bezier(.3,.7,.3,1)' }).finished.catch(() => {});
  }
  function slip(band, off) {
    band.style.visibility = '';
    if (calm() || !band.animate) { band.style.visibility = off ? 'hidden' : ''; return Promise.resolve(); }
    const frames = [{ transform: 'none', opacity: 1 }, { transform: narrow() ? 'translateY(2.4rem)' : 'translateX(2.4rem)', opacity: 0 }];
    return band.animate(off ? frames : frames.reverse(), { duration: 240, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).finished.catch(() => {}).then(() => { band.getAnimations().forEach(run => run.cancel()); band.style.visibility = off ? 'hidden' : ''; });
  }
  // Turning to another spread: every leaf in between turns over at once, with the tabs stuck to them; the page under them
  // is the new one already.
  async function turnTo(target) {
    const b = book; if (!b || b.busy || target === b.spread || target < 0 || target >= b.pages.length / 2) return;
    b.busy = b.turning = true; nav(); sound.play('pick'); card.dataset.state = 'turning';
    const from = b.spread, forward = target > from, spreads = b.pages.length / 2, [left, right] = b.slots, [front, rear] = b.leaf.querySelectorAll(':scope > .leaf-face'), focused = document.activeElement;
    fill(front, b.pages[2 * (forward ? from : target) + 1]); fill(rear, b.pages[2 * (forward ? target : from)]);
    if (forward) fill(right, b.pages[2 * target + 1]); else fill(left, b.pages[2 * target]);
    carry(b.leaf, Object.keys(SECTIONS).filter(id => firstOf(id) > Math.min(from, target) && firstOf(id) <= Math.max(from, target)));
    // The side the leaves leave is thinner at once; the other is thicker once they land.
    stacks(Math.min(from, target), spreads - 1 - Math.max(from, target));
    await hinge(b.leaf, forward ? 0 : flipped(), forward ? flipped() : 0);
    if (book !== b) return;
    if (forward) fill(left, b.pages[2 * target]); else fill(right, b.pages[2 * target + 1]);
    landed(b.leaf); b.spread = target; b.busy = b.turning = false; card.dataset.state = 'open';
    if (b.dirty) { b.dirty = false; render(); } else { fill(b.sheet, b.pages[2 * target]); lie(); nav(); }
    if (focused?.isConnected && focused.matches('.book-tab')) focused.focus({ preventScroll: true });
  }
  function open() {
    clearTimeout(nextTimer); jotting.hidden = true;
    card = element('article', 'notebook-card', stage); card.setAttribute('aria-label', '線索本');
    const events = new AbortController(), on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal: events.signal });
    const shell = element('div', 'book', card), board = element('div', 'book-board', shell), halves = [element('div', 'board-half', board), element('div', 'board-half', board)];
    const tabs = element('div', 'book-tabs', shell); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '分頁');
    const sheets = element('div', 'book-pages', shell), slots = ['a', 'b'].map(slot => { const page = element('section', 'book-page', sheets); page.dataset.slot = slot; return page; });
    const probe = element('div', 'book-page book-probe', sheets); probe.setAttribute('aria-hidden', 'true'); probe.inert = true;
    // The leaf that turns: a front over the right (or lower) page, a back that lands over the other, and the tabs riding
    // on each, just under the paper.
    const carrier = (parent, face) => { const node = element('div', 'leaf-tabs', parent); node.dataset.face = face; return node; };
    const quiet = node => { node.setAttribute('aria-hidden', 'true'); node.inert = true; return node; };
    const leaf = quiet(element('div', 'book-leaf', shell));
    element('div', 'leaf-face leaf-front', leaf); element('div', 'leaf-face leaf-back', leaf); carrier(leaf, 'front'); carrier(leaf, 'back');
    // The cover, as big as the board it shuts over: kraft with a label outside; inside, a board like the other with the
    // first left page on it (the paper the tabs on it are stuck under).
    const lid = quiet(element('div', 'book-cover', shell)), face = element('div', 'leaf-face leaf-front cover-face', lid);
    element('p', 'cover-title', face, 'Clue Book').lang = 'en';
    // A stamp under the label for each chapter: on and postmarked for each the story is past, the next one's picture faint
    // as a shadow, the rest empty frames. One finished since the book was last opened is pressed on as it opens.
    const finished = chaptersDone(progress), next = CHAPTERS.find(id => !finished.includes(id)), pressed = finished.filter(id => !progress.stamped.includes(id));
    const stamps = element('div', 'cover-stamps', face);
    CHAPTERS.forEach((chapter, i) => {
      const slot = element('span', pressed.includes(chapter) ? 'cover-stamp is-new' : 'cover-stamp', stamps);
      slot.dataset.state = finished.includes(chapter) ? 'done' : chapter === next ? 'next' : 'later'; slot.style.setProperty('--tilt', `${[-4, 3, -2, 4, -3][i]}deg`);
      for (const [name, image] of [['stamp-frame', stampFrame(chapter, i)], ['stamp-art', stampArt(chapter)], ['stamp-mark', postmark()]]) element('span', name, slot).style.backgroundImage = image;
    });
    carrier(lid, 'front');
    const lining = element('div', 'leaf-face leaf-back cover-lining', lid); carrier(lining, 'back');
    const sheet = element('div', 'cover-page', lining);
    const band = quiet(element('div', 'book-band', shell));
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
    // Across 700px (a phone turned, a window narrowed) or at another size, the parts are laid out again, at the same place.
    const media = globalThis.matchMedia?.('(max-width: 700px)');
    if (media) on(media, 'change', () => render());
    const sized = new ResizeObserver(() => {
      const b = book, page = b?.slots[0]; if (!b || b.busy || !page) return;
      const style = getComputedStyle(page), room = Math.round(Math.max(96, page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)));
      if (`${page.clientWidth}x${room}` !== b.size) render();
    });
    sized.observe(shell); events.signal.addEventListener('abort', () => sized.disconnect());
    book = { shell, halves, tabs, slots, probe, leaf, lid, lining, sheet, band, back, ahead, count, events, pages: [], spread: 0, busy: true, turning: true, dirty: false, shut: true };
    goalFresh = goal(progress) !== goalRead; goalRead = goal(progress);
    book.turning = false; render(); book.turning = true;
    dot.hidden = true; sound.play('open'); button.setAttribute('aria-expanded', 'true');
    // Shut in the middle with its band on; the band slips off, then the cover swings open over the spine (the tab on its
    // inside page riding with it) while the book slides over to lay its spread in the middle.
    card.dataset.state = 'shut'; shell.style.transform = shift(-25); lid.style.transform = 'translateZ(2px)'; lid.dataset.side = 'front'; lid.classList.add('is-turning');
    if (!calm()) card.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    const mine = book;
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      if (book !== mine) return;
      if (pressed.length) {
        if (!calm()) { sound.play('snap'); await wait(950); if (book !== mine) return; }
        stamps.querySelectorAll('.is-new').forEach(slot => slot.classList.remove('is-new')); progress.stamped = [...finished]; save();
      }
      await slip(band, true); if (book !== mine) return;
      carry(lid, ['now']); card.dataset.state = 'opening';
      await Promise.all([hinge(lid, 0, flipped(), 900), slide(shell, shift(-25), shift(0), 640)]);
      if (book !== mine) return;
      landed(lid); card.dataset.state = 'open'; mine.shut = false; mine.busy = mine.turning = false;
      if (mine.dirty) { mine.dirty = false; render(); } else { lie(); nav(); }
      goalFresh = false;
    }));
    done.focus({ preventScroll: true });
  }
  // Put away: everything turned closes over at once with the cover (their tabs with it), the book slides back to the
  // middle, its band goes back on, and it goes back to its corner (at once while it is still opening or turning, or with
  // less motion).
  async function close() {
    const b = book; if (!b || b.closing) return;
    if (b.busy || calm()) { shut(); return; }
    b.closing = b.busy = b.turning = true; nav();
    fill(b.sheet, b.pages[2 * b.spread]);
    carry(b.lid, Object.keys(SECTIONS).filter(id => firstOf(id) >= 0 && firstOf(id) <= b.spread));
    b.lid.style.transform = `translateZ(2px) ${narrow() ? 'rotateX' : 'rotateY'}(${flipped()}deg)`; b.lid.dataset.side = 'back'; b.lid.classList.add('is-turning');
    card.dataset.state = 'closing';
    await Promise.all([hinge(b.lid, flipped(), 0, 700), wait(280).then(() => (book === b ? slide(b.shell, shift(0), shift(-25), 520) : null))]);
    if (book !== b) return;
    landed(b.lid); b.lid.classList.add('is-turning'); b.shut = true; lie(); card.dataset.state = 'shut';
    await slip(b.band, false); if (book !== b) return;
    await card.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
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
  return { add, tick, check, remind, refresh: show, close, destroy() { clearTimeout(nextTimer); book?.events.abort(); card?.remove(); button.remove(); jotting.remove(); } };
}
