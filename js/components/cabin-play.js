// The little games in Santa's yard. Once the camera has stepped up to a corner, paper props are laid over the scene: drag
// them (or press Enter on them) to finish the job. Each finished corner lights a star on the name board. Only one game is
// open at a time; leaving one clears its props, timers and listeners. The bigger games live in their own files.
import { paperLayer, shape } from './paper-art.js';
import { createSound } from './cabin-sound.js';
import { snowmanGame } from './cabin-snowman.js';
import { feedGame } from './cabin-feed.js';
import { PLACES, known } from './cabin-wardrobe.js';
import { readProgress, writeProgress } from '../services/cabin-progress.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .2 }, eager: true };
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const inside = (point, rect, pad = 0) => rect && point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;

// Paper props, each drawn once in a 100 × 100 box.
const ART = {
  carrot: parent => { shape('path', { d: 'M18 30L86 52 22 70C10 62 8 38 18 30Z', fill: '#e8873c' }, parent); shape('path', { d: 'M18 34C4 22 6 10 14 6 16 18 20 24 22 30ZM16 40C0 40-2 28 4 22 10 30 14 34 18 36Z', fill: '#5f8a70' }, parent); },
  hat: parent => { shape('rect', { x: 14, y: 70, width: 72, height: 12, rx: 5, fill: '#3b2a24' }, parent); shape('rect', { x: 26, y: 22, width: 48, height: 52, rx: 5, fill: '#3b2a24' }, parent); shape('rect', { x: 26, y: 58, width: 48, height: 9, fill: '#a84a42' }, parent); },
  scarf: parent => { shape('path', { d: 'M10 30C36 42 64 42 90 30V48C64 60 36 60 10 48Z', fill: '#a84a42' }, parent); shape('path', { d: 'M58 48L70 90H54L48 50Z', fill: '#87302f' }, parent); shape('path', { d: 'M20 40v10M34 43v10M66 43v10M80 40v10', stroke: '#fbf3df', 'stroke-width': 4 }, parent); },
  hay: parent => { shape('rect', { x: 8, y: 26, width: 84, height: 54, rx: 16, fill: '#d9b36a' }, parent); shape('path', { d: 'M14 44h72M14 62h72', stroke: '#b98f48', 'stroke-width': 4 }, parent); shape('path', { d: 'M36 26v54M64 26v54', stroke: '#a8774d', 'stroke-width': 5 }, parent); },
  lichen: parent => { for (const [x, y, r] of [[34, 56, 18], [54, 46, 20], [70, 60, 16], [48, 66, 16]]) shape('circle', { cx: x, cy: y, r, fill: '#b9cfa8' }, parent); for (const [x, y] of [[40, 50], [58, 40], [66, 58]]) shape('circle', { cx: x, cy: y, r: 5, fill: '#e3edd8' }, parent); },
  // The little signs that float up: a paper heart, a star.
  heart: parent => shape('path', { d: 'M50 86C20 64 8 46 14 30 20 16 40 14 50 30 60 14 80 16 86 30 92 46 80 64 50 86Z', fill: '#d9614f', stroke: '#fbf3df', 'stroke-width': 6 }, parent),
  star: parent => shape('path', { d: 'M50 8L61 36 92 38 68 58 76 90 50 72 24 90 32 58 8 38 39 36Z', fill: '#e0b04f', stroke: '#fbf3df', 'stroke-width': 5, 'stroke-linejoin': 'round' }, parent),
  gingerbread: parent => { shape('path', { d: 'M50 12C62 12 66 22 62 30 74 30 86 34 86 42 86 48 74 48 66 46L72 80C72 88 62 90 58 84L50 70 42 84C38 90 28 88 28 80L34 46C26 48 14 48 14 42 14 34 26 30 38 30 34 22 38 12 50 12Z', fill: '#b97a4a' }, parent); for (const [x, y] of [[44, 22], [56, 22]]) shape('circle', { cx: x, cy: y, r: 3, fill: '#fbf3df' }, parent); for (const y of [44, 56]) shape('circle', { cx: 50, cy: y, r: 4, fill: '#a84a42' }, parent); },
};

export function mountPlay(stage, cabin, { onFound = () => {}, announce = () => {} } = {}) {
  const layer = element('div', 'cabin-play', stage), caption = element('p', 'cabin-caption', layer);
  caption.setAttribute('aria-hidden', 'true'); caption.hidden = true;
  const timers = new Set(), later = (ms, run) => { const id = setTimeout(() => { timers.delete(id); run(); }, ms); timers.add(id); };
  const memory = { hay: 0 };
  // What lasts between visits (the snowman's outfit, the reindeer's meals today), and the yard's small sounds.
  let storage = null; try { storage = localStorage; } catch { /* this visit only */ }
  const progress = readProgress(storage, known), save = () => writeProgress(progress, storage), sound = createSound();
  let cleanup = () => {};
  function say(text) { caption.textContent = text; caption.hidden = !text; if (text) announce(text); }
  const point = event => { const rect = stage.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  function prop(kind, parent, label) {
    const button = element('button', `play-item play-${kind}`, parent); button.type = 'button'; button.setAttribute('aria-label', label);
    paperLayer(button, '0 0 100 100', '', ART[kind], PAPER); return button;
  }
  // Drag a prop by pointer; Enter or a plain click uses it on the target at once. `use` returns true when it was used up.
  function draggable(button, { use, follow = () => {} }) {
    let drag = null;
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; button.classList.add('is-dragging');
    });
    button.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      button.style.translate = `${dx}px ${dy}px`; follow(point(event));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const moved = drag.moved; drag = null; button.classList.remove('is-dragging'); follow(null);
      const used = moved ? use(point(event)) : false;
      button.style.translate = '';
      if (used) button.remove();
    };
    button.addEventListener('pointerup', drop); button.addEventListener('pointercancel', drop);
    button.addEventListener('click', event => { if (event.detail === 0 && use(null)) button.remove(); });
  }
  function burst(rect, kind, count = 3) {
    if (!rect) return;
    for (let i = 0; i < count; i++) {
      const mark = element('span', 'play-burst', layer); mark.setAttribute('aria-hidden', 'true'); paperLayer(mark, '0 0 100 100', '', ART[kind], PAPER);
      mark.style.left = `${rect.left + rect.width * (.3 + Math.random() * .4)}px`; mark.style.top = `${rect.top + rect.height * .2}px`;
      mark.style.animationDelay = `${i * .15}s`; later(1800, () => mark.remove());
    }
  }
  // A handful of paper confetti thrown up from a rectangle on the stage.
  function confetti(rect, count = 14) {
    if (!rect || still()) return;
    for (let i = 0; i < count; i++) {
      const bit = element('span', 'play-confetti', layer); bit.setAttribute('aria-hidden', 'true');
      bit.style.left = `${rect.left + rect.width * (.25 + Math.random() * .5)}px`; bit.style.top = `${rect.top + rect.height * .35}px`;
      bit.style.background = ['#a84a42', '#e0b04f', '#4f7d68', '#7cb8ec', '#fbf3df'][i % 5];
      bit.style.setProperty('--dx', `${(Math.random() - .5) * 220}px`); bit.style.setProperty('--dy', `${-60 - Math.random() * 120}px`); bit.style.setProperty('--spin', `${(Math.random() - .5) * 720}deg`);
      later(1700, () => bit.remove());
    }
  }

  const games = {
    mailbox() {
      say('郵筒的旗子豎起來了，裡面有信！點一下郵筒打開它。');
      const rect = cabin.rect('mailbox'), open = element('button', 'play-target', layer);
      open.type = 'button'; open.setAttribute('aria-label', '打開郵筒');
      Object.assign(open.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      open.addEventListener('click', () => {
        open.remove(); cabin.repaint('mailbox', { open: true }); say('');
        const letter = element('article', 'cabin-letter', layer); letter.setAttribute('aria-label', '聖誕老人的信');
        const body = element('p', 'cabin-letter-body', letter);
        body.textContent = '親愛的朋友：\n昨晚送了一整夜的禮物，現在終於能坐下來烤火了，謝謝你來看我！\n院子裡還藏著幾個小秘密：麋鹿肚子餓了、雪人還沒打扮好、馴鹿小屋的乾草也還沒人收。\n—— 聖誕老人';
        const done = element('button', 'cabin-letter-close', letter); done.type = 'button'; done.textContent = '收好信 ✓';
        done.addEventListener('click', () => { letter.remove(); say('信收好了。到院子別處逛逛吧！'); onFound('mailbox'); });
        done.focus();
      });
      open.focus();
    },
    reindeer: () => feedGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, burst, art: ART, paper: PAPER }),
    snowman: () => snowmanGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, confetti }),
    stable() {
      if (memory.hay >= 4) { say('乾草都堆好了，麋鹿今晚有得吃了。'); return; }
      say(`把乾草一捆捆拖上閣樓（${memory.hay}/4）`);
      const loft = () => cabin.rectOfBox([7.4, 1.94, -7], [.7, .5, .3]), pile = element('div', 'play-pile', layer);
      for (let i = memory.hay; i < 4; i++) {
        draggable(prop('hay', pile, '把乾草搬上閣樓'), {
          use: spot => {
            if (spot && !inside(spot, loft(), 40)) return false;
            memory.hay++; cabin.repaint('stable', { hay: memory.hay });
            say(memory.hay >= 4 ? '乾草都堆好了！麋鹿今晚有得吃了。' : `堆上閣樓了（${memory.hay}/4）`);
            if (memory.hay >= 4) onFound('stable');
            return true;
          },
        });
      }
    },
  };

  function leave() { timers.forEach(clearTimeout); timers.clear(); cleanup(); cleanup = () => {}; layer.replaceChildren(caption); say(''); delete layer.dataset.game; }
  return {
    enter(id) { leave(); if (!games[id]) return; layer.dataset.game = id; cleanup = games[id]() || (() => {}); },
    leave,
    // A line about something tapped in the village or the room; it fades on its own and never covers a game.
    note(text) { if (layer.dataset.game) return; timers.forEach(clearTimeout); timers.clear(); say(text); later(4200, () => { if (!layer.dataset.game) say(''); }); },
    // Coming back shows the yard as it was left: the snowman in his outfit, finished corners finished.
    restore(ids) {
      for (const place of Object.keys(PLACES)) cabin.dress(place, progress.outfit[place]);
      if (ids.includes('stable')) { memory.hay = 4; cabin.repaint('stable', { hay: 4 }); }
      if (ids.includes('mailbox')) cabin.repaint('mailbox', { open: true });
    },
    destroy() { leave(); sound.destroy(); layer.remove(); },
  };
}
