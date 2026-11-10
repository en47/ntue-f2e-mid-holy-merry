// The end of the cabin's story, laid over the scene: a wish being granted by another substitute (a little paper scene for
// each wish, then the note they leave in their own hand), and the cards that tell each ending. Everything is cut from the
// same paper as the rest of the site; under reduced motion each scene simply stands still. When they appear is decided by
// cabin-story.js (through cabin-play.js).
import { paperLayer, shape } from './paper-art.js';
import { ENDINGS, HOLLY, WISHES } from '../data/cabin-finale.js';

const PAPER = { paper: { scale: .5, grain: .45, shadow: .2 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const W = 200, H = 120;

// The scenes, each in a 200 × 120 box.
function night(parent) {
  shape('rect', { x: 0, y: 0, width: W, height: H, fill: '#2f4a6b' }, parent);
  shape('circle', { cx: 160, cy: 26, r: 12, fill: '#fbf3df' }, parent); shape('circle', { cx: 165, cy: 22, r: 11, fill: '#2f4a6b' }, parent);
  for (const [x, y] of [[20, 18], [48, 30], [80, 12], [112, 26], [136, 44], [186, 54], [30, 52]]) shape('circle', { cx: x, cy: y, r: 1.3, fill: '#fbf3df' }, parent);
  shape('path', { d: 'M0 96Q50 82 100 92T200 88V120H0Z', fill: '#e6eef2' }, parent);
  shape('path', { d: 'M0 104Q60 94 120 102T200 100V120H0Z', fill: '#fbf8f1' }, parent);
  for (const [x, h] of [[34, 18], [150, 22], [174, 16]]) shape('path', { d: `M${x} ${100 - h}L${x + 7} 100H${x - 7}Z`, fill: '#3f6653' }, parent);
  shape('rect', { x: 84, y: 82, width: 26, height: 16, fill: '#a84a42' }, parent); shape('path', { d: 'M80 83L97 70L114 83Z', fill: '#fbf8f1' }, parent);
  shape('rect', { x: 94, y: 88, width: 6, height: 6, fill: '#f4cf74' }, parent);
}
function sleigh(parent) {
  shape('path', { d: 'M4 28H52Q60 28 60 20', fill: 'none', stroke: '#e0b04f', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, parent);
  shape('path', { d: 'M10 26V14H48V26Z', fill: '#b5443c' }, parent);
  shape('path', { d: 'M8 14Q8 6 16 6H22V14Z', fill: '#8a3530' }, parent);
  shape('circle', { cx: 30, cy: 9, r: 4, fill: '#f2c9a5' }, parent); shape('path', { d: 'M26 8Q30 1 34 8Z', fill: '#c63a33' }, parent);
  shape('path', { d: 'M52 18Q62 10 74 14', fill: 'none', stroke: '#8f6a4c', 'stroke-width': 1.2 }, parent);
  shape('path', { d: 'M70 20Q72 12 82 12Q90 12 90 20Q86 24 78 24Q72 24 70 20Z', fill: '#9b6a45' }, parent);
  for (const x of [74, 78, 84, 88]) shape('path', { d: `M${x} 23V32`, stroke: '#9b6a45', 'stroke-width': 1.6 }, parent);
  shape('path', { d: 'M88 13L92 4M90 9L95 8', stroke: '#7a5236', 'stroke-width': 1.4, fill: 'none' }, parent);
  shape('circle', { cx: 93, cy: 15, r: 1.8, fill: '#e74c3c' }, parent);
}
function village(parent) {
  shape('rect', { x: 0, y: 0, width: W, height: H, fill: '#cfe3ec' }, parent);
  shape('path', { d: 'M0 70L40 40L70 62L110 30L150 58L200 36V120H0Z', fill: '#e6eef2' }, parent);
  shape('path', { d: 'M0 92Q60 80 120 90T200 86V120H0Z', fill: '#fbf8f1' }, parent);
  for (const [x, w, roof] of [[30, 30, '#a84a42'], [120, 34, '#3f6653'], [160, 24, '#8f5a3c']]) { shape('rect', { x, y: 76, width: w, height: 18, fill: '#ecdcc0' }, parent); shape('path', { d: `M${x - 4} 77L${x + w / 2} 62L${x + w + 4} 77Z`, fill: roof }, parent); shape('path', { d: `M${x - 3} 76L${x + w / 2} 63L${x + w + 3} 76`, fill: 'none', stroke: '#fbf8f1', 'stroke-width': 2.5 }, parent); }
  for (const x of [80, 96, 190]) shape('path', { d: `M${x} 74L${x + 8} 94H${x - 8}Z`, fill: '#3f6653' }, parent);
}
function room(parent) {
  shape('rect', { x: 0, y: 0, width: W, height: H, fill: '#efe0c4' }, parent);
  shape('rect', { x: 0, y: 92, width: W, height: 28, fill: '#a8774d' }, parent);
  shape('path', { d: 'M150 20L174 88H126Z', fill: '#3f6653' }, parent); shape('path', { d: 'M150 34L168 88H132Z', fill: '#4f7d68' }, parent);
  shape('rect', { x: 146, y: 88, width: 8, height: 8, fill: '#6b4a33' }, parent);
  for (const [x, y, c] of [[142, 52, '#d9614f'], [158, 64, '#e0b04f'], [148, 76, '#6f9fc0'], [160, 44, '#8fbf7f']]) shape('circle', { cx: x, cy: y, r: 2.6, fill: c }, parent);
  shape('path', { d: 'M150 12L152.5 18 159 18.5 154 22.5 156 29 150 25 144 29 146 22.5 141 18.5 147.5 18Z', fill: '#e0b04f' }, parent);
}
function box(parent) {
  shape('rect', { x: 10, y: 20, width: 80, height: 58, rx: 3, fill: '#b5443c' }, parent);
  shape('rect', { x: 44, y: 20, width: 12, height: 58, fill: '#e0b04f' }, parent);
}
function lid(parent) {
  shape('rect', { x: 4, y: 14, width: 92, height: 18, rx: 3, fill: '#c9564c' }, parent);
  shape('rect', { x: 44, y: 14, width: 12, height: 18, fill: '#e9c162' }, parent);
  shape('path', { d: 'M50 14C38 0 26 6 34 14ZM50 14C62 0 74 6 66 14Z', fill: '#e0b04f' }, parent);
}
function ornament(parent) {
  shape('path', { d: 'M50 4L61 34 92 36 68 56 76 88 50 70 24 88 32 56 8 36 39 34Z', fill: '#e0b04f' }, parent);
  shape('circle', { cx: 50, cy: 50, r: 18, fill: '#fff6dc' }, parent);
}
function sky(parent) {
  shape('rect', { x: 0, y: 0, width: W, height: H, fill: '#cfe3ec' }, parent);
  for (const [x, y, s] of [[30, 30, 1], [140, 20, 1.3], [170, 70, .9], [60, 80, .8]]) shape('path', { d: `M${x} ${y}q${8 * s} ${-10 * s} ${18 * s} 0q${10 * s} ${-6 * s} ${16 * s} ${4 * s}q${6 * s} ${8 * s} ${-4 * s} ${8 * s}H${x - 2 * s}q${-8 * s} 0 ${2 * s} ${-12 * s}Z`, fill: '#fbf8f1' }, parent);
  shape('path', { d: 'M0 104Q60 96 120 102T200 100V120H0Z', fill: '#fbf8f1' }, parent);
}
function balloon(parent) {
  shape('path', { d: 'M30 4C10 4 4 22 8 34C12 44 22 50 26 56H34C38 50 48 44 52 34C56 22 50 4 30 4Z', fill: '#b5443c' }, parent);
  shape('path', { d: 'M30 4C24 14 22 40 26 56H34C38 40 36 14 30 4Z', fill: '#fbf3df' }, parent);
  shape('path', { d: 'M26 56L24 64M34 56L36 64', stroke: '#8f6a4c', 'stroke-width': 1.2 }, parent);
  shape('rect', { x: 22, y: 64, width: 16, height: 9, rx: 2, fill: '#a8774d' }, parent);
  shape('path', { d: 'M30 73V80', stroke: '#8f6a4c', 'stroke-width': 1 }, parent);
  shape('rect', { x: 23, y: 80, width: 14, height: 10, fill: '#fffaf0' }, parent); shape('path', { d: 'M23 80L30 86L37 80', fill: 'none', stroke: '#c9b48f', 'stroke-width': 1 }, parent);
}

// A wish being granted: the paper scene for it, then the note left by whoever granted it.
export function wishScene({ layer, wish, mark, sound, later, onDone }) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, given = WISHES.find(each => each.id === wish);
  const card = element('article', 'wish-card', layer); card.dataset.wish = wish; card.setAttribute('aria-label', `願望：${given.name}`);
  element('h3', 'finale-title', card, given.name);
  const scene = element('div', 'wish-scene', card), words = element('p', 'wish-words', card);
  const note = element('p', 'wish-note', card); note.dataset.hand = given.hand; note.hidden = true;
  const actions = element('div', 'desk-actions', card), next = element('button', '', actions, '好 ✓'); next.type = 'button'; next.hidden = true;
  next.addEventListener('click', () => { card.remove(); onDone(); });
  const done = () => { note.textContent = `「${given.note}」—— ${given.by}`; note.hidden = false; next.hidden = false; sound.play('jingle'); next.focus({ preventScroll: true }); };
  const art = (draw, viewBox = `0 0 ${W} ${H}`) => paperLayer(element('span', 'wish-art', scene), viewBox, '', draw, PAPER);
  if (wish === 'sleigh') {
    art(night); paperLayer(element('span', 'wish-sleigh', scene), '0 0 100 36', '', sleigh, PAPER);
    words.textContent = '雪橇從屋頂上滑了出去，繞著村子飛了一大圈。';
    later(still ? 300 : 4400, done);
  } else if (wish === 'snow') {
    art(village);
    for (let i = 0; i < 46; i++) { const flake = element('span', 'wish-flake', scene); flake.style.left = `${(i * 37) % 100}%`; flake.style.animationDelay = `${-(i * 0.73) % 6}s`; flake.style.scale = String(.6 + (i % 5) * .15); }
    storm(still ? 0 : 40000);
    words.textContent = '雪一片接著一片落下來，屋頂、樹梢和整片天空都白了。';
    later(still ? 300 : 3800, done);
  } else if (wish === 'gift') {
    art(room);
    const gift = element('button', 'wish-gift', scene); gift.type = 'button'; gift.setAttribute('aria-label', '打開禮物');
    paperLayer(element('span', 'wish-box', gift), '0 0 100 80', '', box, PAPER); const top = element('span', 'wish-lid', gift); paperLayer(top, '0 0 100 34', '', lid, PAPER);
    const star = element('span', 'wish-ornament', scene); paperLayer(star, '0 0 100 92', '', ornament, PAPER); element('span', 'wish-initial', star, `${mark}.`); star.hidden = true;
    words.textContent = '聖誕樹下多了一個綁著金色緞帶的禮物，標籤上寫著你的縮寫。點它打開。';
    gift.addEventListener('click', () => { if (gift.disabled) return; gift.disabled = true; card.classList.add('is-open'); star.hidden = false; sound.play('open'); words.textContent = '盒子裡是一顆金色的星星吊飾，中間寫著你的縮寫。'; later(still ? 200 : 1400, done); }, { once: true });
    gift.focus({ preventScroll: true });
  } else {
    art(sky);
    const choices = element('div', 'compose-choices wish-choices', card); card.insertBefore(choices, actions);
    words.textContent = '想把哪一句祝福，送給你重要的人？';
    given.blessings.forEach(text => {
      const choice = element('button', 'compose-choice', choices, text); choice.type = 'button';
      choice.addEventListener('click', () => {
        choices.remove(); sound.play('pick');
        paperLayer(element('span', 'wish-balloon', scene), '0 0 60 92', '', balloon, PAPER);
        words.textContent = `信紙上寫著：「${text}」熱氣球載著它，慢慢飄向遠方。`;
        later(still ? 300 : 4200, done);
      }, { once: true });
    });
    choices.firstElementChild.focus({ preventScroll: true });
  }
  return card;
}

// More snow over the whole village for a while (the flat sky behind the scene, cabin-backdrop.js), then as before.
function storm(ms) {
  const host = document.querySelector('.cabin-backdrop'); if (!host || !ms) return;
  const flakes = Array.from({ length: 36 }, (_, i) => { const flake = element('span', 'cabin-flake is-storm', host); flake.style.left = `${(i * 29) % 100}%`; flake.style.animationDelay = `${-(i * .61) % 6}s`; return flake; });
  setTimeout(() => flakes.forEach(flake => flake.remove()), ms);
}

// A card telling one ending; D carries Holly's letter. `both`: the visitor wished and stayed.
export function endingCard({ layer, ending, mark, both = false, sound, onClose = () => {} }) {
  const { title, lines, sign } = ENDINGS[ending];
  const card = element('article', 'finale-card', layer); card.dataset.ending = ending; card.setAttribute('aria-label', title);
  element('h3', 'finale-title', card, title);
  for (const line of lines) element('p', 'finale-line', card, line);
  if (sign) element('p', 'finale-sign', card, sign);
  if (ending === 'D') {
    const letter = element('div', 'finale-letter', card);
    element('p', 'finale-line', letter, HOLLY.greeting(mark)); element('p', 'finale-line', letter, HOLLY.body);
    element('p', 'finale-line', letter, both ? HOLLY.both : HOLLY.one); element('p', 'finale-sign', letter, HOLLY.sign);
  }
  const close = element('button', 'cabin-letter-close', card, '收好 ✓'); close.type = 'button';
  close.addEventListener('click', () => { card.remove(); sound.play('remove'); onClose(); });
  sound.play(ending === 'D' ? 'jingle' : 'open'); close.focus({ preventScroll: true });
  return card;
}
