// The little games in Santa's yard. Once the camera has stepped up to a corner, paper props are laid over the scene: drag
// them (or press Enter on them) to finish the job. Each finished corner lights a star on the name board. Only one game is
// open at a time; leaving one clears its props, timers and listeners. The bigger games live in their own files.
import { paperLayer, shape } from './paper-art.js';
import { createSound } from './cabin-sound.js';
import { perforated } from './cabin-paper.js';
import { snowmanGame } from './cabin-snowman.js';
import { feedGame } from './cabin-feed.js';
import { pulleyGame } from './cabin-pulley.js';
import { sleighGame } from './cabin-sleigh.js';
import { hearthGame } from './cabin-hearth.js';
import { deskGame } from './cabin-desk.js';
import { musicboxGame } from './cabin-musicbox.js';
import { globeGame } from './cabin-globe.js';
import { booksGame } from './cabin-books.js';
import { secretGame } from './cabin-secret.js';
import { wheelGame } from './cabin-wheel.js';
import { wishScene } from './cabin-finale.js';
import { endingTheatre } from './cabin-ending.js';
import { postcard } from './cabin-postcard.js';
import { GIFTS, TASKS, canGoHome, canStay, canWish, knowsSantas, pending, points, record, santaGoes, signedUp, trueMiracle } from '../services/cabin-story.js';
import { BELLS, CHAIR, DONE, GOING, JOBS, NOTES } from '../data/cabin-secret.js';
import { ASK, GLOBE, NEXT, SANTA_ON_HOLLY, SIGNPOST, TWIST } from '../data/cabin-finale.js';
import { PLACES, known } from './cabin-wardrobe.js';
import { readProgress, writeProgress } from '../services/cabin-progress.js';
import { mountNotebook } from './cabin-notebook.js';
import { mountBag } from './cabin-bag.js';
import { ITEM_ART } from './cabin-items.js';
import { ever, holds } from '../services/cabin-bag.js';
import { treeCard } from './cabin-ornaments.js';

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
  // In the mailbox: Santa's letter in a cream envelope with a red seal, and a small kraft parcel tied with string and tagged.
  envelope: parent => { shape('path', { d: 'M10 28H90V78H10Z', fill: '#fbf3df' }, parent); shape('path', { d: 'M10 28L50 56 90 28', fill: 'none', stroke: '#d8c49c', 'stroke-width': 4, 'stroke-linejoin': 'round' }, parent); shape('path', { d: 'M10 78L40 52M90 78L60 52', stroke: '#e8dcc2', 'stroke-width': 3 }, parent); shape('circle', { cx: 50, cy: 56, r: 9, fill: '#b5443c' }, parent); shape('path', { d: 'M46 56h8M50 52v8', stroke: '#e6a59a', 'stroke-width': 2, 'stroke-linecap': 'round' }, parent); },
  parcel: parent => { shape('path', { d: 'M14 36H86V84H14Z', fill: '#c9a46a' }, parent); shape('path', { d: 'M14 36L24 24H76L86 36Z', fill: '#d9b98a' }, parent); shape('path', { d: 'M50 24V84M14 58H86', stroke: '#8f5a3c', 'stroke-width': 4 }, parent); shape('path', { d: 'M50 24C40 12 32 20 44 26M50 24C60 12 68 20 56 26', fill: 'none', stroke: '#8f5a3c', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, parent); shape('path', { d: 'M62 64L84 66 83 80 61 78Z', fill: '#fbf3df' }, parent); shape('path', { d: 'M66 71h12', stroke: '#b5443c', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, parent); },
  // The little signs that float up: a paper heart, a star.
  heart: parent => shape('path', { d: 'M50 86C20 64 8 46 14 30 20 16 40 14 50 30 60 14 80 16 86 30 92 46 80 64 50 86Z', fill: '#d9614f', stroke: '#fbf3df', 'stroke-width': 6 }, parent),
  star: parent => shape('path', { d: 'M50 8L61 36 92 38 68 58 76 90 50 72 24 90 32 58 8 38 39 36Z', fill: '#e0b04f', stroke: '#fbf3df', 'stroke-width': 5, 'stroke-linejoin': 'round' }, parent),
  // North Pole oat cake, for the reindeer's breakfast: a round biscuit flecked with oats, a bite gone.
  oats: parent => { shape('path', { d: 'M50 16A36 36 0 1 0 86 52 10 10 0 0 1 76 40 9 9 0 0 1 66 26 8 8 0 0 1 50 16Z', fill: '#d8b277' }, parent); shape('path', { d: 'M50 24A28 28 0 1 0 78 54', fill: 'none', stroke: '#c49a52', 'stroke-width': 3, opacity: .6 }, parent); for (const [x, y, r] of [[36, 44, 4], [52, 60, 3.4], [40, 66, 3], [62, 46, 3.4], [30, 58, 2.6], [56, 74, 2.8]]) shape('ellipse', { cx: x, cy: y, rx: r, ry: r * .55, fill: '#f1dfb4', transform: `rotate(${x * 7} ${x} ${y})` }, parent); },
  gingerbread: parent => { shape('path', { d: 'M50 12C62 12 66 22 62 30 74 30 86 34 86 42 86 48 74 48 66 46L72 80C72 88 62 90 58 84L50 70 42 84C38 90 28 88 28 80L34 46C26 48 14 48 14 42 14 34 26 30 38 30 34 22 38 12 50 12Z', fill: '#b97a4a' }, parent); for (const [x, y] of [[44, 22], [56, 22]]) shape('circle', { cx: x, cy: y, r: 3, fill: '#fbf3df' }, parent); for (const y of [44, 56]) shape('circle', { cx: 50, cy: y, r: 4, fill: '#a84a42' }, parent); },
};

// A North Pole postage stamp, 120 × 144: perforated edges, a red and a green frame, holly, a postmark over one corner and
// snowflakes; the words go over it (`task` below).
const STAMP = { paper: { scale: .3, grain: .35, shadow: .25 }, eager: true };
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
  // The clue book in the corner: games write what they show into it (`clue`).
  const notebook = mountNotebook(stage, { progress, save, sound }), clue = id => notebook.add(id);
  // The pocket in the other corner: what has been picked up, to be used where it fits (cabin-bag.js).
  const bag = mountBag(stage, { progress, save, sound, say: text => say(text) });
  // A substitute's welcome ornament, found: kept and written down (false if it was found before).
  const gift = mark => { if (progress.ornaments.includes(mark)) return false; progress.ornaments.push(mark); save(); clue(`gift-${mark}`); return true; };
  function say(text) { caption.textContent = text; caption.hidden = !text; if (text) announce(text); }
  const point = event => { const rect = stage.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  // The yard's corners finished so far (a star each on the name sign): restored from santa.js, and added to as they are.
  const corners = new Set(), found = id => { corners.add(id); onFound(id); };
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
    // The mailbox: Santa's letter for the visitor, and a little parcel for Santa himself, tied with string: a note from
    // whoever looked after the reindeer last, and a pouch of his favourite lichen (to the pocket, cabin-bag.js). Both stay
    // in the open mailbox, to be read again.
    mailbox() {
      // The two lie in the open mailbox, kept on it while the camera settles or the stage changes size.
      const shown = [], watch = new ResizeObserver(() => lay());
      function lay() {
        const spot = cabin.sheetRect('mailbox', [.12, .12, .88, .6]) ?? cabin.rect('mailbox'), size = Math.min(spot.height * .9, spot.width * .48, 110);
        for (const [thing, x] of shown) Object.assign(thing.style, { left: `${spot.left + spot.width * x - size / 2}px`, top: `${spot.top + spot.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
      }
      const things = () => {
        cabin.repaint('mailbox', { open: true });
        for (const [kind, label, x, read] of [['envelope', '聖誕老人的信', .27, letter], ['parcel', '寄給聖誕老人的小包裹', .73, parcel]]) {
          const thing = prop(kind, layer, label); thing.classList.add('mail-thing'); thing.addEventListener('click', read); shown.push([thing, x]);
        }
        lay(); later(600, lay); later(1300, lay); watch.observe(stage);
      };
      function letter() {
        sound.play('open');
        const card = element('article', 'cabin-letter', layer); card.setAttribute('aria-label', '聖誕老人的信');
        const body = element('p', 'cabin-letter-body', card);
        body.textContent = '親愛的朋友：\n昨晚送了一整夜的禮物，現在終於能坐下來烤火了，謝謝你來看我！\n院子裡還藏著幾個小秘密：麋鹿肚子餓了、雪人還沒打扮好、馴鹿小屋的乾草也還沒人收。\n—— 聖誕老人';
        const done = element('button', 'cabin-letter-close', card); done.type = 'button'; done.textContent = '收好信 ✓';
        done.addEventListener('click', () => { card.remove(); sound.play('remove'); say(bag.ever('lichen') ? '信收好了。到院子別處逛逛吧！' : '信收好了。郵筒裡還有一個用麻繩綁著的小包裹。'); found('mailbox'); });
        done.focus({ preventScroll: true });
      }
      function parcel() {
        sound.play('open'); clue('care-note');
        const card = element('article', 'cabin-letter parcel-card', layer); card.setAttribute('aria-label', '寄給聖誕老人的小包裹');
        element('h3', 'chair-title', card).textContent = '寄給聖誕老人的小包裹';
        element('p', 'parcel-note', card).textContent = '別忘了餵麋鹿。上次輪到你時，牠可是等了好久！';
        if (!bag.ever('lichen')) {
          const pouch = element('button', 'parcel-pouch', card); pouch.type = 'button'; pouch.setAttribute('aria-label', '一小包地衣，寫著「給麋鹿的點心」');
          paperLayer(pouch, '0 0 100 100', '', ITEM_ART.lichen, PAPER); element('span', 'parcel-label', pouch).textContent = '給麋鹿的點心';
          pouch.addEventListener('click', () => { const from = local(pouch.getBoundingClientRect()); pouch.remove(); bag.give('lichen', from); done.focus({ preventScroll: true }); });
        }
        const done = element('button', 'cabin-letter-close', card); done.type = 'button'; done.textContent = '收好便條 ✓';
        done.addEventListener('click', () => { card.remove(); sound.play('remove'); say(bag.ever('lichen') ? '便條放回包裹裡了。' : '包裹裡還留著那包「給麋鹿的點心」。'); });
        (card.querySelector('.parcel-pouch') ?? done).focus({ preventScroll: true });
      }
      if (corners.has('mailbox') || bag.ever('lichen') || progress.clues.includes('care-note')) { say('郵筒開著：聖誕老人的信，和一個寄給他的小包裹。'); things(); return () => watch.disconnect(); }
      say('郵筒的旗子豎起來了，裡面有東西！點一下郵筒打開它。');
      const rect = cabin.rect('mailbox'), open = element('button', 'play-target', layer);
      open.type = 'button'; open.setAttribute('aria-label', '打開郵筒');
      Object.assign(open.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      open.addEventListener('click', () => { open.remove(); sound.play('open'); say('郵筒裡有一封信，和一個用麻繩綁著的小包裹。'); things(); });
      open.focus();
      return () => watch.disconnect();
    },
    // By the reindeer: his feeding (and the job of feeding him by the barn's table), and the sleigh to load.
    reindeer: () => {
      const feeding = feedGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onFound: found, burst, art: ART, paper: PAPER, wants: () => pending(progress.volunteer, 'lichen'), onTask: () => task('lichen'), clue });
      const loading = sleighGame({ layer, stage, cabin, say, sound, later, progress, onLoaded: () => task('hay') });
      return () => { feeding(); loading(); };
    },
    snowman: () => snowmanGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onFound: found, confetti, clue, gift }),
    stable: () => pulleyGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onFound: found, fed: () => progress.volunteer.tasks.includes('lichen'), clue }),
    // The broken big wheel, mended up close (a sheet laid over the yard: it is too far off to walk up to).
    wheel: () => wheelGame({ layer, stage, cabin, say, later, sound, bag, again: !pending(progress.volunteer, 'wheel'), round: progress.wheelRounds, progress, save, clue, gift, onMended: () => { progress.wheelRounds += 1; save(); task('wheel'); cabin.wheelBroken(false); }, onClose: leave }),
    // In the room: the hearth to tend, the desk's letters, the music box and the snow globe, and the bookcase to look over.
    // Each tells the room when it has been used (`onUse`): Santa goes out once enough has been done there.
    hearth: () => hearthGame({ layer, stage, cabin, say, later, sound, bag, onUse: () => use('hearth'), progress, save, clue }),
    desk: () => deskGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onUse: () => use('desk'), onTask: () => task('letters'), clue }),
    musicbox: () => musicboxGame({ layer, stage, cabin, say, later, sound, bag, onUse: () => use('musicbox'), knows, clue, gift, progress, save }),
    globe: () => globeGame({ layer, stage, cabin, say, later, sound, bag, onUse: () => use('globe'), knows, knownLine: () => progress.finale.twist ? GLOBE : null, clue, seen: () => progress.clues.includes('globe-base') }),
    secret: () => secretGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onKnow: () => onSanta('known'), onShut: () => swing(false), join, quit, onInvite: invite, onTwist: twist, onWish: grant, onStay: stay, onReplay: kind => kind === 'truth' ? ending(finale.stayed ? 'C' : 'B', { replay: true, truth: true }) : ending(kind, { replay: true }), clue, gift }),
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
      // Where the story goes next, a moment later.
      const next = NEXT[points(progress.volunteer)]; if (next) later(3600, () => say(next));
      // A postage stamp lands on the corner of the scene: the job done, a gold star for each point.
      const stamp = element('div', 'volunteer-stamp', layer); stamp.setAttribute('aria-hidden', 'true'); paperLayer(stamp, '0 0 120 144', '', postage, STAMP);
      const words = element('div', 'stamp-words', stamp);
      element('span', 'stamp-kicker', words).textContent = '替身工作'; element('span', 'stamp-done', words).textContent = '完成！';
      const stars = element('span', 'stamp-stars', words);
      for (let i = 0; i < TASKS.length; i++) element('span', i < points(progress.volunteer) ? 'is-on' : '', stars).textContent = '★';
      later(3700, () => stamp.remove());
    });
  }
  // The end (the rules are in cabin-story.js). The second twist is told once; a wish is granted in a little scene of its
  // own; staying on is signed on the shift log. Each ending counts the moment it is reached, and is told in its paper
  // theatre (cabin-ending.js), told true (with Holly's letter, `finale.truth`) once what she knew is understood; after it,
  // a postcard to keep (cabin-postcard.js). An ending seen can be watched again from the register (`replay`: nothing is
  // reached, no postcard).
  const finale = progress.finale;
  function invite() { if (!finale.invited) { finale.invited = true; save(); } }
  let heardHolly = false;
  function twist() { if (finale.twist) return; finale.twist = true; save(); heardHolly = true; later(500, () => { sound.play('jingle'); say(TWIST); }); }
  const reach = kind => { if (!finale.endings.includes(kind)) { finale.endings.push(kind); save(); } };
  const tell = kind => { reach(kind); if (kind !== 'A' && trueMiracle(finale) && !finale.truth) { finale.truth = true; save(); } };
  let theatre = null, card = null;
  function ending(kind, { replay = false, truth = !replay && kind !== 'A' && finale.twist } = {}) {
    if (!replay) tell(kind);
    theatre?.close(); card?.close();
    const mark = progress.volunteer.mark;
    theatre = endingTheatre({ host: layer, ending: kind, truth, mark, both: Boolean(finale.wish && finale.stayed), wish: finale.wish, sound, onClose: () => { theatre = null; if (!replay) card = postcard({ host: layer, kind, truth, mark, sound, onClose: () => { card = null; } }); } });
  }
  function grant(id) {
    if (!canWish(progress.volunteer, finale)) return;
    finale.wish = id; tell('B');
    wishScene({ layer, wish: id, mark: progress.volunteer.mark, sound, later, onDone: () => ending('B') });
  }
  function stay() {
    if (!canStay(progress.volunteer, finale)) return;
    finale.stayed = true; tell('C'); cabin.repaint('secret-tags', { mine: true }); cabin.repaint('secret-hats', { mine: true });
    later(400, () => ending('C'));
  }
  // The world signpost in the yard: the only way home (A), chosen and then confirmed, for a visitor who knows the secret
  // and is not signed up; a volunteer finds a card on it; anyone else reads only what it says.
  function signpost(note) {
    if (layer.dataset.game || card) return;
    if (!finale.invited) { say(note); later(4200, () => say('')); return; }
    sound.play('open');
    const sheet = card = { close: () => node.remove() }, node = element('article', 'cabin-letter signpost-card', layer); node.setAttribute('aria-label', SIGNPOST.title);
    element('h3', 'chair-title', node).textContent = SIGNPOST.title;
    element('p', 'piece-words', node).textContent = signedUp(progress.volunteer) ? SIGNPOST.volunteer : note;
    const close = () => { node.remove(); if (card === sheet) card = null; sound.play('remove'); };
    if (canGoHome(progress)) {
      const home = element('button', 'register-sign', node); home.type = 'button'; home.textContent = SIGNPOST.home;
      home.addEventListener('click', () => {
        home.remove(); sound.play('pick');
        element('p', 'piece-words signpost-sure', node).textContent = SIGNPOST.sure;
        const row = element('div', 'signpost-actions', node), yes = element('button', 'register-sign', row), no = element('button', 'register-sign is-quiet', row);
        yes.type = no.type = 'button'; yes.textContent = SIGNPOST.yes; no.textContent = SIGNPOST.no;
        yes.addEventListener('click', () => { node.remove(); card = null; ending('A'); });
        no.addEventListener('click', close); yes.focus({ preventScroll: true });
      });
    }
    const done = element('button', 'cabin-letter-close', node); done.type = 'button'; done.textContent = SIGNPOST.close;
    done.addEventListener('click', close);
    // It opens under the finger that tapped the signpost: the click a touch sends after it must not press what is now there.
    node.inert = true; setTimeout(() => { node.inert = false; if (node.isConnected) (node.querySelector('.register-sign') ?? done).focus({ preventScroll: true }); }, 400);
  }
  // All four jobs done, back in the middle of the room: Santa asks once what comes next (kept, never asked again). Each
  // answer only says where to go; nothing ends until it is chosen at the register or on the shift log.
  function ask() {
    if (layer.dataset.game) return;
    finale.asked = true; save(); sound.play('open');
    const node = element('article', 'cabin-letter ask-card', layer); node.setAttribute('aria-label', '聖誕老人的問題');
    element('p', 'piece-words', node).textContent = ASK.question;
    const row = element('div', 'signpost-actions', node);
    for (const [id, label, reply] of ASK.options) {
      const choice = element('button', 'register-sign', row); choice.type = 'button'; choice.textContent = label;
      choice.addEventListener('click', () => { node.remove(); sound.play('pick'); say(id === 'wish' && finale.wish ? ASK.wished : reply); });
    }
    row.firstElementChild.focus({ preventScroll: true });
  }
  // All five ornaments found: back in the room, they are on the tree, and at its top a red one with your initial.
  function trimmed() {
    if (layer.dataset.game) return;
    progress.tree = true; save(); sound.play('cheer');
    const card = element('article', 'cabin-letter tree-card', layer); card.setAttribute('aria-label', '小屋的聖誕樹');
    element('h3', 'chair-title', card).textContent = '小屋的聖誕樹';
    element('p', 'piece-words', card).textContent = '五位替身的吊飾都找齊了。你把它們掛上小屋的聖誕樹——最上面，不知道什麼時候，多了一個紅色的，寫著你的縮寫。';
    treeCard(card, progress.volunteer.mark);
    element('p', 'piece-words tree-last', card).textContent = '從今天起，你也是我們的一員。';
    const done = element('button', 'cabin-letter-close', card); done.type = 'button'; done.textContent = '好 ✓';
    done.addEventListener('click', () => { card.remove(); sound.play('remove'); });
    done.focus({ preventScroll: true });
  }
  // The note on the empty chair: the bookcase's riddle, in Santa's hand. It goes in the clue book as it is read.
  function chairNote() {
    if (layer.dataset.game) return;
    clue('chair-note'); sound.play('open');
    const card = element('article', 'cabin-letter chair-card', layer); card.setAttribute('aria-label', CHAIR.title);
    element('h3', 'chair-title', card).textContent = CHAIR.title;
    for (const line of CHAIR.lines) element('p', 'chair-line', card).textContent = line;
    element('p', 'chair-sign', card).textContent = CHAIR.sign;
    const done = element('button', 'cabin-letter-close', card); done.type = 'button'; done.textContent = '收好紙條 ✓';
    done.addEventListener('click', () => { card.remove(); sound.play('remove'); say(''); });
    done.focus({ preventScroll: true });
  }
  // What has been used in the room on this visit; whether the secret behind the bookcase is known. The moment enough has
  // been used for Santa to go out, the reindeer's bells ring outside the window (he goes once back in the middle).
  const used = new Set(), knows = () => knowsSantas(progress.story.seen);
  let rang = false;
  function use(id) {
    used.add(id); const story = progress.story;
    if (rang || !santaGoes({ used: used.size, left: story.left, home: cabin.santaHome, opened: story.opened })) return;
    rang = true; later(1200, () => { sound.play('jingle'); say(BELLS); });
  }
  function start(id) { leave(); if (!games[id]) return; layer.dataset.game = id; cleanup = games[id]() || (() => {}); }
  function leave() { timers.forEach(clearTimeout); timers.clear(); theatre?.close(); theatre = null; card = null; cleanup(); cleanup = () => {}; bag.clear(); layer.replaceChildren(caption); say(''); delete layer.dataset.game; }
  return {
    enter: start,
    leave,
    // The world signpost tapped in the yard: what it says, and for a visitor who knows the secret, the way home.
    signpost,
    // A line about something tapped in the village or the room; it fades on its own and never covers a game.
    // `id`: what was tapped; the wish board's thank-you note goes in the clue book.
    note(text, id) { if (id === 'wish-board') clue('wish-board'); if (layer.dataset.game) return; timers.forEach(clearTimeout); timers.clear(); say(text); later(4200, () => { if (!layer.dataset.game) say(''); }); },
    // Back in the middle of the room: after enough has been used there, Santa goes out to see to the reindeer (the rule is
    // in cabin-story.js). The story is decided here, never by the chat.
    inRoom() {
      const story = progress.story;
      if (GIFTS.every(mark => progress.ornaments.includes(mark)) && !progress.tree) { later(900, trimmed); return; }
      // Back with Santa still out: his note is still on the chair (and in the clue book).
      if (story.left && !story.opened && !cabin.santaHome) clue('chair-note');
      // Back from the old page, Santa (if he is in) has a word about Holly; once.
      if (heardHolly && cabin.santaHome) { heardHolly = false; later(900, () => say(SANTA_ON_HOLLY)); return; }
      // All four jobs done, he asks once what comes next.
      if (signedUp(progress.volunteer) && points(progress.volunteer) === TASKS.length && !progress.finale.asked && cabin.santaHome) { later(900, ask); return; }
      // Once the secret is known, Santa tells you about it: home from the reindeer (or from his chair, already in), he opens
      // the booklet's stuck pages for you; the old record opened before, he has a word about that too. Told once (kept).
      if (story.opened && knowsSantas(story.seen) && !story.told) {
        later(700, async () => {
          if (!cabin.santaHome) { say('門外傳來踩雪的腳步聲……'); if (!(await cabin.santaReturn())) return; say(NOTES.back); onSanta('home'); }
          else say(NOTES.chair);
          story.told = true; save(); notebook.refresh();
          later(4200, () => say(NOTES.told));
          if (progress.finale.unlocked && !progress.finale.twist) later(8800, () => say(NOTES.record));
        });
        return;
      }
      if (!santaGoes({ used: used.size, left: story.left, home: cabin.santaHome, opened: story.opened })) return;
      later(900, async () => {
        say(GOING);
        if (!(await cabin.santaLeave())) return;
        story.left = true; save(); onSanta('away'); notebook.refresh();
        say('搖椅還輕輕晃著，椅子上留了一張紙條。'); later(2000, chairNote);
      });
    },
    // Leaving the house before the bookcase has opened, Santa is back in his chair the next time you come in.
    outside() {
      if (!progress.story.opened && !cabin.santaHome) { cabin.santaBack(); onSanta('home'); }
      // Going outside ends nothing: the way home is chosen at the world signpost (`signpost`).
    },
    get opened() { return progress.story.opened; },
    // Tapped while it stands broken, the big wheel opens to be mended instead of saying its line; once mended, its gearbox
    // can be opened and its gears set again (stamped only the first time).
    get wheelBroken() { return pending(progress.volunteer, 'wheel'); },
    get wheelOpen() { return pending(progress.volunteer, 'wheel') || progress.volunteer.tasks.includes('wheel'); },
    // Coming back shows the yard as it was left: the snowman in his outfit, finished corners finished, the reindeer fed at
    // his trough (and stepped aside), the snowman's drift dug, the crank on the barn's winch.
    restore(ids) {
      ids.forEach(id => corners.add(id));
      const had = id => ever(progress.bag, id), gone = id => had(id) && !holds(progress.bag, id);
      for (const place of Object.keys(PLACES)) cabin.dress(place, progress.outfit[place]);
      cabin.hoist(progress.hoist.locked ? 1 : 0); cabin.fitCrank(gone('handle')); if (gone('matches')) cabin.light(true);
      if (ids.includes('mailbox') || had('lichen') || progress.clues.includes('care-note')) cabin.repaint('mailbox', { open: true });
      if (gone('lichen')) { cabin.repaint('trough', had('key') ? { eaten: true, taken: true } : { eaten: true }); cabin.reindeerStep(true, true); }
      if (had('handle')) cabin.repaint('snow-pile', { dug: true });
      if (progress.volunteer.tasks.includes('hay')) cabin.repaint('sleigh', { loaded: true });
      // The desk's drawer with its key turned and its magnifier taken; the music box's drawer, its catch undone and Nils's star found.
      cabin.drawer('desk', { front: gone('key') ? { key: true } : {}, inside: had('magnifier') ? { taken: true } : {} });
      cabin.drawer('musicbox', { front: progress.placed.includes('musicbox-catch') ? { undone: true } : {}, inside: progress.ornaments.includes('N') ? { empty: true } : {} });
      cabin.placeBooks(progress.story.shelf); if (progress.story.opened) cabin.openBookcase(!progress.story.shut, false);
      cabin.wheelBroken(pending(progress.volunteer, 'wheel'), false);
      if (progress.finale.stayed) { cabin.repaint('secret-tags', { mine: true }); cabin.repaint('secret-hats', { mine: true }); }
    },
    destroy() { leave(); notebook.destroy(); bag.destroy(); sound.destroy(); layer.remove(); },
  };
}
