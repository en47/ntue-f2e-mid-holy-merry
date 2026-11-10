// The little games in Santa's yard. Once the camera has stepped up to a corner, paper props are laid over the scene: drag
// them (or press Enter on them) to finish the job. Each finished corner lights a star on the name board. Only one game is
// open at a time; leaving one clears its props, timers and listeners. The bigger games live in their own files.
import { paperLayer, shape } from './paper-art.js';
import { createSound } from './cabin-sound.js';
import { snowmanGame } from './cabin-snowman.js';
import { feedGame } from './cabin-feed.js';
import { pulleyGame } from './cabin-pulley.js';
import { hearthGame } from './cabin-hearth.js';
import { deskGame } from './cabin-desk.js';
import { musicboxGame } from './cabin-musicbox.js';
import { globeGame } from './cabin-globe.js';
import { booksGame } from './cabin-books.js';
import { secretGame } from './cabin-secret.js';
import { wheelGame } from './cabin-wheel.js';
import { TASKS, knowsSantas, pending, points, record, santaGoes, santaReturns } from '../services/cabin-story.js';
import { DONE, JOBS, NOTES } from '../data/cabin-secret.js';
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

// A North Pole postage stamp, 120 × 144: perforated edges, a red and a green frame, holly, a postmark over one corner and
// snowflakes; the words go over it (`task` below).
const STAMP = { paper: { scale: .3, grain: .35, shadow: .25 }, eager: true };
function perforated(x0, y0, x1, y1, step = 10, bite = 2.6) {
  let d = `M${x0} ${y0}`;
  const edge = (ax, ay, bx, by) => {
    const length = Math.hypot(bx - ax, by - ay), n = Math.round(length / step), ux = (bx - ax) / length, uy = (by - ay) / length;
    for (let i = 0; i < n; i++) { const a = (i + .5) * length / n - bite, b = a + bite * 2; d += `L${(ax + ux * a).toFixed(1)} ${(ay + uy * a).toFixed(1)}A${bite} ${bite} 0 0 0 ${(ax + ux * b).toFixed(1)} ${(ay + uy * b).toFixed(1)}`; }
    d += `L${bx} ${by}`;
  };
  edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
  return `${d}Z`;
}
function postage(parent) {
  shape('path', { d: perforated(6, 6, 114, 138), fill: '#fffaf0' }, parent);
  shape('rect', { x: 15, y: 15, width: 90, height: 114, rx: 3, fill: '#fbf1dc', stroke: '#b5443c', 'stroke-width': 3 }, parent);
  shape('rect', { x: 20, y: 20, width: 80, height: 104, rx: 2, fill: 'none', stroke: '#3f6653', 'stroke-width': 1.2 }, parent);
  shape('path', { d: 'M22 34C28 24 38 24 42 32C36 30 34 38 28 34C26 40 20 40 22 34Z', fill: '#3f6653' }, parent);
  shape('path', { d: 'M48 30C44 20 34 19 30 26C36 25 37 33 42 30C44 36 50 35 48 30Z', fill: '#4f7d68' }, parent);
  for (const [x, y] of [[37, 32], [33, 36], [41, 36]]) shape('circle', { cx: x, cy: y, r: 3, fill: '#c63a33' }, parent);
  shape('circle', { cx: 88, cy: 34, r: 15, fill: 'none', stroke: '#b5443c', 'stroke-width': 2, opacity: .5 }, parent);
  shape('circle', { cx: 88, cy: 34, r: 10.5, fill: 'none', stroke: '#b5443c', 'stroke-width': 1, opacity: .45 }, parent);
  for (const y of [27, 33, 39]) shape('path', { d: `M66 ${y}q4 -3 8 0t8 0t8 0t8 0t8 0`, fill: 'none', stroke: '#b5443c', 'stroke-width': 1.3, opacity: .38 }, parent);
  for (const [x, y] of [[30, 114], [90, 114]]) for (let a = 0; a < 3; a++) { const c = Math.cos(a * Math.PI / 3) * 4.5, n = Math.sin(a * Math.PI / 3) * 4.5; shape('path', { d: `M${x - c} ${y - n}L${x + c} ${y + n}`, stroke: '#9fc3d8', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, parent); }
}

export function mountPlay(stage, cabin, { onFound = () => {}, announce = () => {}, onSanta = () => {} } = {}) {
  const layer = element('div', 'cabin-play', stage), caption = element('p', 'cabin-caption', layer);
  caption.setAttribute('aria-hidden', 'true'); caption.hidden = true;
  const timers = new Set(), later = (ms, run) => { const id = setTimeout(() => { timers.delete(id); run(); }, ms); timers.add(id); };
  // What lasts between visits (the snowman's outfit, the reindeer's meals today, the barn's hoist), and the yard's small sounds.
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
      button.style.translate = `${dx}px ${dy}px`; follow(drag.at = point(event));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved, at: last } = drag; drag = null; button.classList.remove('is-dragging'); follow(null);
      const used = moved && event.type !== 'pointercancel' ? use(event.type === 'lostpointercapture' ? last : point(event)) : false;
      button.style.translate = '';
      if (used) button.remove();
    };
    // A release swallowed before it reaches the page (some browser extensions do that) still ends the drag (lostpointercapture).
    button.addEventListener('pointerup', drop); button.addEventListener('pointercancel', drop); button.addEventListener('lostpointercapture', drop);
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
    reindeer: () => feedGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, burst, art: ART, paper: PAPER, wants: () => pending(progress.volunteer, 'lichen'), onTask: () => task('lichen') }),
    snowman: () => snowmanGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, confetti }),
    stable: () => pulleyGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, onTask: () => task('hay') }),
    // The broken big wheel, mended up close (a sheet laid over the yard: it is too far off to walk up to).
    wheel: () => wheelGame({ layer, stage, cabin, say, later, sound, onMended: () => { task('wheel'); cabin.wheelBroken(false); }, onClose: leave }),
    // In the room: the hearth to tend, the desk's letters, the music box and the snow globe, and the bookcase to look over.
    // Each tells the room when it has been used (`onUse`): Santa goes out once enough has been done there.
    hearth: () => hearthGame({ layer, stage, cabin, say, later, sound, onUse: () => used.add('hearth') }),
    desk: () => deskGame({ layer, stage, cabin, say, later, sound, progress, save, onUse: () => used.add('desk'), onTask: () => task('letters') }),
    musicbox: () => musicboxGame({ layer, stage, cabin, say, later, sound, onUse: () => used.add('musicbox'), knows }),
    globe: () => globeGame({ layer, stage, cabin, say, later, sound, onUse: () => used.add('globe'), knows }),
    secret: () => secretGame({ layer, stage, cabin, say, later, sound, progress, save, onKnow: () => onSanta('known'), onShut: () => swing(false), join, quit }),
    shelf: () => booksGame({ layer, stage, cabin, say, later, sound, progress, save, onOpen: () => onSanta('opened'), toggle: open => swing(open), restart: () => start('shelf') }),
  };

  // The solved bookcase is a door you work by hand (from up close, cabin-books.js): pushed shut it is a wall of books
  // again; pushed again, or spelled again, it swings open.
  function swing(open = progress.story.shut) {
    const story = progress.story; if (!story.opened) return;
    story.shut = !open; save(); cabin.openBookcase(open); sound.play('creak');
    say(open ? '書櫃又慢慢轉開了，後面的小房間還在。' : '書櫃慢慢轉回原位，又是一整面普通的書牆。');
    later(3600, () => { if (!layer.dataset.game) say(''); });
  }
  // Volunteering (the rules are in cabin-story.js). Signed up, the big wheel stands still until it is mended; each job done
  // the first time is stamped in the register, with a postmark that pops up over the scene.
  function join(mark) { progress.volunteer.mark = mark; save(); cabin.wheelBroken(pending(progress.volunteer, 'wheel')); }
  function quit() { progress.volunteer.mark = ''; save(); cabin.wheelBroken(false); }
  function task(id) {
    if (!record(progress.volunteer, id)) return;
    save(); later(1500, () => {
      sound.play('thud'); say(DONE(JOBS[id][0], points(progress.volunteer), TASKS.length));
      // A postage stamp lands on the corner of the scene: the job done, a gold star for each point.
      const stamp = element('div', 'volunteer-stamp', layer); stamp.setAttribute('aria-hidden', 'true'); paperLayer(stamp, '0 0 120 144', '', postage, STAMP);
      const words = element('div', 'stamp-words', stamp);
      element('span', 'stamp-kicker', words).textContent = '替身工作'; element('span', 'stamp-done', words).textContent = '完成！';
      const stars = element('span', 'stamp-stars', words);
      for (let i = 0; i < TASKS.length; i++) element('span', i < points(progress.volunteer) ? 'is-on' : '', stars).textContent = '★';
      later(3700, () => stamp.remove());
    });
  }
  // What has been used in the room on this visit; whether the secret behind the bookcase is known.
  const used = new Set(), knows = () => knowsSantas(progress.story.seen);
  function start(id) { leave(); if (!games[id]) return; layer.dataset.game = id; cleanup = games[id]() || (() => {}); }
  function leave() { timers.forEach(clearTimeout); timers.clear(); cleanup(); cleanup = () => {}; layer.replaceChildren(caption); say(''); delete layer.dataset.game; }
  return {
    enter: start,
    leave,
    // A line about something tapped in the village or the room; it fades on its own and never covers a game.
    note(text) { if (layer.dataset.game) return; timers.forEach(clearTimeout); timers.clear(); say(text); later(4200, () => { if (!layer.dataset.game) say(''); }); },
    // Back in the middle of the room: after enough has been used there, Santa goes out to see to the reindeer (the rule is
    // in cabin-story.js). The story is decided here, never by the chat.
    inRoom() {
      const story = progress.story;
      // Once the secret is known, Santa comes home from the reindeer, and knows that you know.
      if (santaReturns({ home: cabin.santaHome, opened: story.opened, seen: story.seen })) {
        later(700, async () => { say('門外傳來踩雪的腳步聲……'); if (await cabin.santaReturn()) { say(NOTES.back); onSanta('home'); } });
        return;
      }
      if (!santaGoes({ used: used.size, left: story.left, home: cabin.santaHome, opened: story.opened })) return;
      later(900, async () => {
        say('聖誕老人站起來伸了個懶腰：「看你玩得這麼開心……哎呀，麋鹿在叫我了，我去看看牠，你慢慢逛！」');
        if (!(await cabin.santaLeave())) return;
        story.left = true; save(); onSanta('away');
        say('搖椅還輕輕晃著，椅子上留了一張紙條。');
      });
    },
    // Leaving the house before the bookcase has opened, Santa is back in his chair the next time you come in.
    outside() { if (!progress.story.opened && !cabin.santaHome) { cabin.santaBack(); onSanta('home'); } },
    get opened() { return progress.story.opened; },
    // Tapped while it stands broken, the big wheel opens to be mended instead of saying its line.
    get wheelBroken() { return pending(progress.volunteer, 'wheel'); },
    // Coming back shows the yard as it was left: the snowman in his outfit, finished corners finished.
    restore(ids) {
      for (const place of Object.keys(PLACES)) cabin.dress(place, progress.outfit[place]);
      cabin.hoist(progress.hoist.locked ? 1 : 0); if (progress.hoist.locked && progress.hoist.found) cabin.openHatch(true);
      if (ids.includes('mailbox')) cabin.repaint('mailbox', { open: true });
      cabin.placeBooks(progress.story.shelf); if (progress.story.opened) cabin.openBookcase(!progress.story.shut, false);
      cabin.wheelBroken(pending(progress.volunteer, 'wheel'), false);
    },
    destroy() { leave(); sound.destroy(); layer.remove(); },
  };
}
