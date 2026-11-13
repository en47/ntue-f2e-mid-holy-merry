// The visitor's clue book, a little kraft notebook in the corner of the scene: whatever is noticed around the village that
// may matter later is written in it the moment it is seen (`add`), and it keeps a hint for whatever the story is waiting
// on now (`goal`, cabin-story.js), a little plainer each time one is asked for. It shows itself once there is something
// in it, and hops when something new goes in. Cut from the same paper as everything else (cabin-paper.js draws its page).
import { paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';
import { ornament } from './cabin-ornaments.js';
import { GIFTS, goal, knowsSantas } from '../services/cabin-story.js';
import { GIFT_HINTS, GIFT_ORDER, GOALS, NOTEBOOK, RESTART } from '../data/cabin-clues.js';
import { resetProgress } from '../services/cabin-progress.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const PAPER = { paper: { scale: .25, grain: .4, shadow: .3 }, eager: true }, GIFT_PAPER = { paper: { scale: .3, grain: .45, shadow: .25, rim: '#fbf6ea' }, eager: true };
// Between the parts of the page: a wavering pencil line with a little star in the middle.
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

export function mountNotebook(stage, { progress, save, sound }) {
  const button = element('button', 'notebook-button', stage); button.type = 'button'; button.setAttribute('aria-label', '線索本');
  paperLayer(button, '0 0 48 56', 'notebook-icon', cover, PAPER);
  const dot = element('span', 'notebook-new', button); dot.hidden = true;
  paperLayer(dot, '0 0 20 20', '', paper => shape('circle', { cx: 10, cy: 10, r: 7, fill: '#b5443c' }, paper), { paper: { scale: .15, grain: .3, shadow: .3 }, eager: true });
  let card = null, fresh = new Set();
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
  function render() {
    const body = card.querySelector('.notebook-body'); body.replaceChildren();
    element('h3', 'notebook-title', body, '線索本');
    const found = Object.keys(NOTEBOOK).filter(id => progress.clues.includes(id));
    if (!found.length) element('p', 'notebook-empty', body, '還沒記下任何線索。到處看看吧！');
    const list = element('ul', 'notebook-clues', body);
    for (const id of found) {
      const item = element('li', fresh.has(id) ? 'is-fresh' : '', list);
      element('strong', 'notebook-place', item, NOTEBOOK[id].place); element('span', '', item, NOTEBOOK[id].text);
    }
    // The welcome gifts, once the secret is known: a place for each substitute's ornament, cut out in colour once found,
    // faint until then; and a hint about the next one not yet found, each time one is asked for.
    if (knowsSantas(progress.story.seen) || progress.ornaments.length) {
      divider(body);
      const gifts = element('section', 'notebook-gifts', body), have = progress.ornaments;
      element('h4', 'notebook-goal', gifts, `見面禮：找到 ${have.length}／${GIFTS.length}`);
      element('p', 'notebook-hint-line', gifts, have.length === GIFTS.length ? '五個都找齊了，掛在小屋的聖誕樹上。' : '五位替身各藏了一個吊飾，留給新來的替身。');
      const row = element('div', 'gift-row', gifts);
      for (const mark of GIFTS) {
        const slot = element('span', have.includes(mark) ? 'gift-slot is-found' : 'gift-slot', row); slot.setAttribute('role', 'img'); slot.setAttribute('aria-label', have.includes(mark) ? `${mark}. 的吊飾，找到了` : '還沒找到的吊飾');
        paperLayer(slot, '-6 -4 112 140', '', g => (have.includes(mark) ? ornament(mark, g) : unfound(g)), GIFT_PAPER);
      }
      const missing = GIFT_ORDER.filter(mark => !have.includes(mark)), asked = Math.min(progress.hints.gifts ?? 0, missing.length);
      missing.slice(0, asked).forEach(mark => element('p', 'notebook-hint-line', gifts, `・${GIFT_HINTS[mark]}`));
      if (asked < missing.length) {
        const ask = element('button', 'notebook-hint', gifts, asked ? '還有哪裡？' : '去哪裡找？'); ask.type = 'button';
        ask.addEventListener('click', () => { progress.hints.gifts = asked + 1; save(); sound.play('pick'); render(); });
      }
    }
    // A hint for what the story is waiting on: one more line each time it is asked for.
    const now = goal(progress), { title, hints } = GOALS[now], shown = progress.hints[now] ?? 0;
    divider(body);
    const help = element('section', 'notebook-hints', body); help.setAttribute('aria-live', 'polite');
    element('h4', 'notebook-goal', help, `現在：${title}`);
    element('p', 'notebook-task', help, GOALS[now].task);
    hints.slice(0, shown).forEach((hint, i) => element('p', 'notebook-hint-line', help, `${i + 1}. ${hint}`));
    if (shown < hints.length) {
      const ask = element('button', 'notebook-hint', help, shown ? '再給一點提示' : '卡住了？給我一點提示'); ask.type = 'button';
      ask.addEventListener('click', () => { progress.hints[now] = shown + 1; save(); sound.play('pick'); render(); card.querySelector('.notebook-hint, .notebook-close')?.focus({ preventScroll: true }); });
    }
  }
  function open() {
    card = element('article', 'notebook-card', stage); card.setAttribute('aria-label', '線索本');
    element('div', 'notebook-body', card);
    const done = element('button', 'notebook-close', card, '收好 ✓'); done.type = 'button';
    done.addEventListener('click', close);
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
    // Esc closes the book and stops there, so the room behind keeps its own Esc.
    card.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } });
    render(); dot.hidden = true; sound.play('open'); button.setAttribute('aria-expanded', 'true');
    done.focus({ preventScroll: true });
  }
  function close() {
    if (!card) return;
    card.remove(); card = null; fresh = new Set(); sound.play('remove');
    button.setAttribute('aria-expanded', 'false'); button.focus({ preventScroll: true });
  }
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => (card ? close() : open()));
  show();
  return { add, check, refresh: show, close, destroy() { card?.remove(); button.remove(); } };
}
