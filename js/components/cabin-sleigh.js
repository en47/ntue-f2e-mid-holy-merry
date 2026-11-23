// Putting the sleigh away, one of Christmas Day's closing jobs. Beside the reindeer stands the sleigh, home from the night
// and wiped clean; the four sacks of spare presents nobody needed go back on its rack for the next time out. The rack is
// narrow, so they go one on another, and at each stop only the top one can be got at. The route is on the desk (the work
// note in the bundle): the first stop has to go on last. Tap a sack to put it on top of the rack, tap the top one to take it
// back off; all four on, the rules check (cabin-story.js `loadedRight`). Loaded right, the job is stamped (the first
// time, cabin-play.js) and the sleigh in the yard stands loaded from then on; wrong, the sacks come back off. The sleigh
// stands behind the reindeer: for a volunteer he steps aside to make room (as he does once fed at his trough), and only
// the part of the sleigh clear of him can be tapped. Before signing up there is nothing to load, and nothing to tap.
import { paperLayer, shape } from './paper-art.js';
import { ROUTE, loadedRight, signedUp } from '../services/cabin-story.js';
import { SLEIGH } from '../data/cabin-jobs.js';

const PAPER = { paper: { scale: .4, grain: .45, shadow: .25 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
// Each stop's sack has a tag of its own colour; they lie on the snow in no particular order.
export const SACKS = { 台北: '#b5443c', 東京: '#3f6653', 雷克雅維克: '#3f5a7a', 多倫多: '#b98a3c' };
const PILE = ['東京', '多倫多', '台北', '雷克雅維克'];
// A sack of presents, 100 × 80: kraft, tied at the neck with red cord, a tag of its stop's colour (the name is written
// over it).
const sack = colour => g => {
  shape('path', { d: 'M18 74Q8 50 22 30L34 22H66L78 30Q92 50 82 74Z', fill: '#c9a46a' }, g);
  shape('path', { d: 'M34 22Q40 6 50 14Q60 6 66 22', fill: '#b8925a' }, g);
  shape('path', { d: 'M30 26Q50 32 70 26', fill: 'none', stroke: '#b5443c', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M28 44H72V66H28Z', fill: colour, opacity: .92 }, g);
  shape('path', { d: 'M24 72Q50 78 76 72', fill: 'none', stroke: '#a8774d', 'stroke-width': 2, opacity: .6 }, g);
};

// `openNow`: the sleigh was tapped from the yard, so its rack opens straight away.
export function sleighGame({ layer, stage, cabin, say, sound, later, progress, openNow = false, onLoaded = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const volunteer = progress.volunteer, loaded = () => volunteer.tasks.includes('hay');
  if (!signedUp(volunteer) && !loaded()) return () => {};
  cabin.reindeerStep(true);
  const spot = element('button', 'play-target sleigh-spot', layer); spot.type = 'button'; spot.setAttribute('aria-label', SLEIGH.label);
  // The sleigh's left part, out from behind him once he has stepped aside.
  const layout = () => { const rect = cabin.sheetRect('sleigh', [.04, .35, .58, 1]); if (rect) Object.assign(spot.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }); };
  let card = null, stack = [];
  on(spot, 'click', open);
  function open() {
    card?.remove(); sound.play('open'); say('');
    card = element('article', 'cabin-letter sleigh-card', layer); card.setAttribute('aria-label', SLEIGH.title);
    element('h3', 'chair-title', card, SLEIGH.title); element('p', 'sleigh-rule', card, SLEIGH.rule);
    const rack = element('ol', 'sleigh-rack', card); rack.setAttribute('aria-label', '雪橇的貨架（由下往上）');
    const pile = element('div', 'sleigh-pile', card);
    const note = element('p', 'secret-note', card, loaded() ? SLEIGH.loaded : SLEIGH.how);
    const button = (city, parent) => {
      const node = element('button', 'sleigh-sack', parent); node.type = 'button'; node.dataset.city = city;
      paperLayer(node, '0 0 100 80', '', sack(SACKS[city]), PAPER); element('span', 'sleigh-tag', node, SLEIGH.tag(city)); return node;
    };
    // The rack from the bottom up, and what is still on the snow.
    function render() {
      rack.replaceChildren(); pile.replaceChildren();
      const shown = loaded() ? [...ROUTE].reverse() : stack;
      shown.forEach((city, i) => {
        const node = button(city, element('li', 'sleigh-slot', rack)), top = i === shown.length - 1;
        node.setAttribute('aria-label', `貨架第 ${i + 1} 層（由下往上）：${city}${top && !loaded() ? '，點一下拿下來' : ''}`);
        node.disabled = loaded() || !top;
        on(node, 'click', () => { stack.pop(); sound.play('remove'); render(); });
      });
      for (let i = shown.length; i < ROUTE.length; i++) element('li', 'sleigh-slot is-empty', rack).setAttribute('aria-hidden', 'true');
      if (loaded()) return;
      for (const city of PILE.filter(each => !stack.includes(each))) {
        const node = button(city, pile); node.setAttribute('aria-label', `給${city}的備用禮物袋：放上貨架`);
        on(node, 'click', () => put(city));
      }
    }
    function put(city) {
      stack.push(city); sound.play('snap'); render();
      if (stack.length < ROUTE.length) return;
      later(500, () => {
        if (loadedRight(stack)) { stack = []; sound.play('cheer'); note.textContent = SLEIGH.done; say(SLEIGH.done); cabin.repaint('sleigh', { loaded: true }); onLoaded(); render(); return; }
        sound.play('nope'); say(SLEIGH.wrong(ROUTE[0])); note.textContent = SLEIGH.wrong(ROUTE[0]);
        later(900, () => { stack = []; sound.play('remove'); render(); });
      });
    }
    const done = element('button', 'cabin-letter-close', card, '好 ✓'); done.type = 'button';
    on(done, 'click', () => { card.remove(); card = null; stack = []; sound.play('remove'); spot.focus({ preventScroll: true }); });
    render(); (pile.querySelector('.sleigh-sack') ?? done).focus({ preventScroll: true });
  }
  layout(); later(600, layout); later(1300, layout); if (openNow) later(300, open);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); card?.remove(); };
}
