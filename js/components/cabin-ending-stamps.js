// The endings as a row of stamps, in the register (cabin-secret.js) and in the clue book (cabin-notebook.js): A, B and C,
// inked in red once reached and a red ring once any has been (cabin-story.js `canWatch`: then all three can be watched),
// faint before; and the gold star once one was told true. Pressed, one is watched: `watch('A' | 'B' | 'C' | 'truth')`.
import { shape } from './paper-art.js';
import { inked } from './cabin-paper.js';
import { ENDING_KINDS, canWatch } from '../services/cabin-story.js';
import { SEEN, TRUTH } from '../data/cabin-finale.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const STAR = 'M15 2L18.6 10.6 27.8 11.2 20.6 17 23 26 15 21 7 26 9.4 17 2.2 11.2 11.4 10.6Z';
export function endingStamps(parent, finale, watch) {
  const row = element('p', 'register-endings', parent); element('span', '', row, `${SEEN}：`);
  for (const kind of [...ENDING_KINDS, 'truth']) {
    const reached = kind === 'truth' ? finale.truth === true : finale.endings.includes(kind), open = canWatch(finale, kind), name = kind === 'truth' ? TRUTH.star : `結局 ${kind}`;
    const mark = element(open ? 'button' : 'span', `${reached ? 'is-seen' : open ? 'is-open' : ''}${kind === 'truth' ? ' ending-truth' : ''}`, row);
    mark.setAttribute('aria-label', reached ? `再看一次${name}` : open ? `看看${name}（還沒走到）` : `${name}，還沒看過`);
    if (open) { mark.type = 'button'; mark.addEventListener('click', () => watch(kind)); }
    if (kind === 'truth') {
      inked(element('span', 'truth-star', mark), '0 0 30 30', ink => shape('path', { d: STAR, ...(reached ? { fill: '#d9a93c' } : { fill: 'none', stroke: '#d6c6a4', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }) }, ink));
      element('span', 'ending-letter', mark, TRUTH.star); continue;
    }
    inked(mark, '0 0 30 30', ink => shape('circle', reached ? { cx: 15, cy: 15, r: 13, fill: '#b5443c' } : open ? { cx: 15, cy: 15, r: 12, fill: 'none', stroke: '#b5443c', 'stroke-width': 2 } : { cx: 15, cy: 15, r: 12, fill: 'none', stroke: '#d6c6a4', 'stroke-width': 1.8 }, ink));
    element('span', 'ending-letter', mark, kind);
  }
  return row;
}
