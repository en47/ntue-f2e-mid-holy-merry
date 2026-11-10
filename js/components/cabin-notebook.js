// The visitor's clue book, a little kraft notebook in the corner of the scene: whatever is noticed around the village that
// may matter later is written in it the moment it is seen (`add`), and it keeps a hint for whatever the story is waiting
// on now (`goal`, cabin-story.js), a little plainer each time one is asked for. It shows itself once there is something
// in it, and hops when something new goes in. Cut from the same paper as everything else (cabin-paper.js draws its page).
import { paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';
import { goal } from '../services/cabin-story.js';
import { GOALS, NOTEBOOK } from '../data/cabin-clues.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const PAPER = { paper: { scale: .25, grain: .4, shadow: .3 }, eager: true };
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
    // A hint for what the story is waiting on: one more line each time it is asked for.
    const now = goal(progress), { title, hints } = GOALS[now], shown = progress.hints[now] ?? 0;
    const help = element('section', 'notebook-hints', body); help.setAttribute('aria-live', 'polite');
    element('h4', 'notebook-goal', help, `現在：${title}`);
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
  return { add, refresh: show, close, destroy() { card?.remove(); button.remove(); } };
}
