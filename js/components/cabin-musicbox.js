// The music box up close. Wind its key by dragging round it clockwise (three turns at most; it will not go back the other
// way, it only clicks and springs), or press the arrow keys or Enter for a quarter turn. Let go and the little scene on
// top turns while the tune plays, both slowing as the spring runs down; wind it again whenever you like. While it plays,
// four blank gold bookmarks rise under the scene, cut like the ribbons hanging in the bookcase's four empty places. The box
// keeps playing if you step away (the scene and cabin-sound.js keep it going). Under the box a little drawer is held shut
// by a brass catch with a pinhole beside it: the brass pin from the little room's postmark tray (cabin-bag.js) undoes it,
// for good (`placed`, cabin-progress.js).
import { paperLayer, shape } from './paper-art.js';
import { SUBSTITUTES, ribbon } from './cabin-art.js';
import { inked } from './cabin-paper.js';
import { showOrnament } from './cabin-ornaments.js';
import { FLIGHT_ORDER, playsOpen } from '../services/cabin-story.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const PAPER = { paper: { scale: .35, grain: .4, shadow: .25 }, eager: true };
const COLOURS = Object.fromEntries(SUBSTITUTES);
// The hidden comb under the box, low to high: each tine engraved with an initial and tuned so that the order the
// substitutes first flew (E, O, N, K, H) falls down in fourths, E A D G C.
const COMB = [['H', 'C5', 92], ['N', 'D5', 82], ['E', 'E5', 72], ['K', 'G5', 62], ['O', 'A5', 54]];
// The drawer front under the music box: red-brown wood, a brass pull, the engraved line along it; and the brass catch
// across its edge with the pinhole beside it, a layer of its own (gone once undone).
function drawerFront(parent) {
  shape('rect', { x: 2, y: 2, width: 116, height: 26, rx: 4, fill: '#8a3530' }, parent);
  shape('rect', { x: 8, y: 6, width: 104, height: 18, rx: 3, fill: '#a8423b' }, parent);
  shape('path', { d: 'M18 15H48M72 15H102', stroke: '#e0b04f', 'stroke-width': 1.2, opacity: .7 }, parent);
  shape('rect', { x: 52, y: 10, width: 16, height: 9, rx: 4, fill: '#e0b04f' }, parent);
}
function drawerCatch(parent) {
  shape('rect', { x: 92, y: 0, width: 9, height: 20, rx: 2, fill: '#c9a24f' }, parent);
  shape('circle', { cx: 96.5, cy: 15, r: 1.6, fill: '#6b5226' }, parent);
  shape('circle', { cx: 108, cy: 15, r: 2.2, fill: '#2a1a14' }, parent); shape('circle', { cx: 108, cy: 15, r: 3.6, fill: 'none', stroke: '#c9a24f', 'stroke-width': 1.2 }, parent);
}
// The comb's brass bar and the pinned drum behind it, 300 × 150; the tines are pieces of their own (they ring).
function combBar(parent) {
  shape('rect', { x: 14, y: 8, width: 272, height: 30, rx: 10, fill: '#8f6a2c' }, parent);
  for (let i = 0; i < 18; i++) shape('circle', { cx: 26 + i * 14.6, cy: 18 + (i % 3) * 4, r: 1.8, fill: '#e9c162' }, parent);
  shape('rect', { x: 20, y: 34, width: 260, height: 14, rx: 3, fill: '#d6a947' }, parent);
  for (const x of [34, 266]) shape('circle', { cx: x, cy: 41, r: 3, fill: '#8f6a2c' }, parent);
}
const tine = length => parent => {
  shape('path', { d: `M8 0H32V${length - 6}Q20 ${length + 4} 8 ${length - 6}Z`, fill: '#e0b04f' }, parent);
  shape('path', { d: `M12 0H17V${length - 8}H12Z`, fill: '#f4d98c', opacity: .8 }, parent);
};
// The four gold bookmarks that rise under the little turning scene: blank, side by side from a little brass bar.
function bookmarks(parent) {
  shape('rect', { x: 10, y: 8, width: 80, height: 8, rx: 4, fill: '#8f6a2c' }, parent);
  for (const x of [22, 41, 60, 79]) ribbon(parent, x, 12, 11, 76);
}
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

export function musicboxGame({ layer, stage, cabin, say, later, sound, bag, onUse = () => {}, knows = () => false, clue = () => {}, gift = () => false, progress, save = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  say('把音樂盒的發條鑰匙順時針轉幾圈，放手它就會開始轉。');
  const knob = element('button', 'musicbox-knob', layer); knob.type = 'button';
  knob.setAttribute('aria-label', '音樂盒的發條：繞著它順時針拖曳上緊，或按方向鍵右、Enter 轉四分之一圈');
  let turn = null, clicks = 0;
  // A little drawer under the box, held by its catch until the brass pin undoes it; inside, a comb that opens it.
  const undone = () => progress.placed.includes('musicbox-catch');
  const drawer = element('button', 'musicbox-drawer', layer); drawer.type = 'button'; drawer.setAttribute('aria-label', '音樂盒底下的小抽屜');
  paperLayer(drawer, '0 0 120 30', '', drawerFront, PAPER); paperLayer(drawer, '0 0 120 30', 'drawer-catch', drawerCatch, PAPER); drawer.classList.toggle('is-undone', undone());
  on(drawer, 'click', () => {
    if (undone()) { combCard(); return; }
    sound.play('nope'); clue('music-catch'); say('音樂盒底下有個小抽屜，被一根黃銅卡榫卡住了。卡榫旁邊，有一個很小的孔。');
  });
  const forget = bag.target(drawer, {
    accepts: id => undone() ? '卡榫已經鬆開了。' : id === 'pin' || '孔太小了，這個伸不進去。',
    use: () => { progress.placed.push('musicbox-catch'); save(); later(400, () => { drawer.classList.add('is-undone'); sound.play('snap'); }); later(1100, combCard); return '撥針伸進小孔，輕輕一撥——卡榫鬆開了。'; },
  });
  if (knows() && !undone()) later(1600, () => say('音樂盒底下的小抽屜，還被那根黃銅卡榫卡著。'));
  const gold = element('span', 'musicbox-letter', layer); gold.setAttribute('aria-hidden', 'true');
  paperLayer(gold, '0 0 100 100', '', bookmarks, { paper: { scale: .35, grain: .4, shadow: .25 }, eager: true });
  function layout() {
    const rects = cabin.musicRects(); if (!rects) return;
    const { key } = rects, size = Math.max(96, key.width * 2.4), x = key.left + key.width / 2, y = key.top + key.height / 2;
    Object.assign(knob.style, { left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px` });
    { const w = Math.max(88, rects.box.width * .7), h = w / 4; Object.assign(drawer.style, { left: `${rects.box.left + rects.box.width / 2 - w / 2}px`, top: `${rects.box.top + rects.box.height * .9 - h}px`, width: `${w}px`, height: `${h}px` }); }
    // The bookmarks stand up over the box, kept clear of the caption along the top.
    const { box } = rects, medal = Math.max(44, box.width * .4); Object.assign(gold.style, { left: `${box.left + box.width / 2 - medal / 2}px`, top: `${Math.max(76, box.top - medal * .78)}px`, width: `${medal}px`, height: `${medal}px` });
  }
  const played = () => (knows() ? '盒蓋內側刻著 N 和 K：尼爾斯和克莉絲。' : '') + (sound.musicOn ? '小紙雕轉起來了。（網站音樂開著時，音樂盒的歌聲會被蓋過；關掉右下角的音樂就聽得到。）' : '叮叮咚咚……小紙雕跟著音樂慢慢轉。');
  // Each 30° of winding clicks the ratchet once.
  function wind(angle) {
    const before = cabin.wound, after = cabin.wind(angle);
    const steps = Math.floor(after * 36) - Math.floor(before * 36);
    for (let i = 0; i < Math.min(3, steps); i++) later(i * 40, () => sound.tick());
    if (after >= 1 && before < 1) say('發條上滿了，放手吧。');
    return after;
  }
  function release() {
    cabin.holdKey(false);
    if (cabin.wound > 0) { sound.tune(() => cabin.wound); say(played()); onUse(); clue('music-lid'); }
  }
  // While it plays, the four gold bookmarks rise under the turning scene; the first time, they are told and written in the
  // clue book.
  // The drawer's comb, up close: five tines to pluck; five plucked in the right order and the drawer springs open on a
  // welcome ornament Nils hid for the next new substitute. Played wrong, the comb buzzes and starts again.
  let card = null;
  function combCard() {
    card?.remove(); sound.play('open'); say('');
    card = element('article', 'cabin-letter comb-card', layer); card.setAttribute('aria-label', '音樂盒底的小抽屜');
    element('h3', 'comb-title', card, '音樂盒底的小抽屜');
    const words = element('p', 'comb-words', card);
    const close = () => { card?.remove(); card = null; sound.play('remove'); drawer.focus({ preventScroll: true }); };
    if (progress.ornaments.includes('N')) words.textContent = '抽屜開著，尼爾斯的吊飾你已經收好了。';
    else {
      words.textContent = '抽屜上刻著一行小字：「照我們那一季飛的順序，彈一次。」裡面是一排小小的音梳，每一根都刻著一個字母。';
      const comb = element('div', 'comb', card); paperLayer(comb, '0 0 300 150', 'comb-bar', combBar, PAPER);
      const notes = element('div', 'comb-notes', card); notes.setAttribute('aria-live', 'polite');
      const dots = FLIGHT_ORDER.map(() => { const dot = element('span', 'comb-dot', notes); inked(dot, '0 0 20 20', ink => shape('circle', { cx: 10, cy: 10, r: 6, fill: '#b5443c' }, ink)); return dot; });
      let played = [];
      COMB.forEach(([mark, note, length], i) => {
        const button = element('button', 'comb-tine', comb); button.type = 'button'; button.setAttribute('aria-label', `撥 ${mark}. 那一根音梳`);
        Object.assign(button.style, { left: `${(38 + i * 52) / 3}%`, height: `${(length + 6) / 1.5}%` });
        paperLayer(button, `0 0 40 ${length + 6}`, '', tine(length), PAPER);
        const name = element('span', 'comb-mark', button, `${mark}.`); name.style.color = COLOURS[mark];
        on(button, 'click', () => {
          if (played.length >= FLIGHT_ORDER.length || card.classList.contains('is-open')) return;
          sound.pluck(note); button.classList.remove('is-ringing'); void button.offsetWidth; button.classList.add('is-ringing');
          played.push(mark); dots[played.length - 1].classList.add('is-on');
          if (played.length < FLIGHT_ORDER.length) return;
          if (playsOpen(played)) { later(500, () => { gift('N'); clue('music-drawer'); sound.play('snap'); words.textContent = '喀噠——抽屜彈開了！'; comb.remove(); notes.remove(); opened(card, true); }); return; }
          later(450, () => { sound.play('nope'); comb.classList.remove('is-buzz'); void comb.offsetWidth; comb.classList.add('is-buzz'); words.textContent = '音梳「嗡」地響了一聲，抽屜還是卡著。照那一季飛的順序，再彈一次。'; });
          later(1100, () => { played = []; dots.forEach(dot => dot.classList.remove('is-on')); });
        });
      });
      comb.querySelector('.comb-tine').focus({ preventScroll: true });
    }
    const done = element('button', 'cabin-letter-close', card, '放回去 ✓'); done.type = 'button'; on(done, 'click', close);
    if (progress.ornaments.includes('N') && !card.querySelector('.comb')) opened(card, false);
  }
  // The drawer open: Nils's ornament inside, a red paper star, and the line on its tag.
  function opened(card, fresh) {
    card.classList.add('is-open');
    const done = card.querySelector('.cabin-letter-close');
    if (fresh) card.insertBefore(element('p', 'comb-words', null, '裡面躺著一個紅色的紙星星吊飾，綁著一張小卡片——是尼爾斯留給新替身的見面禮。'), done);
    showOrnament(card, 'N', done);
  }
  function playing() {
    const up = cabin.wound > 0; gold.classList.toggle('is-up', up);
    if (up && clue('music-bookmarks')) later(2600, () => say('小紙雕轉著轉著，底下升起四枚金色的書籤，上面一個字也沒有。'));
    later(500, playing);
  }
  playing();
  on(knob, 'pointerdown', event => {
    if (event.button > 0) return;
    event.preventDefault(); knob.setPointerCapture(event.pointerId); cabin.holdKey(true); knob.classList.add('is-winding');
    const box = knob.getBoundingClientRect();
    turn = { id: event.pointerId, cx: box.left + box.width / 2, cy: box.top + box.height / 2 };
    turn.last = Math.atan2(event.clientY - turn.cy, event.clientX - turn.cx);
  });
  on(knob, 'pointermove', event => {
    if (!turn || event.pointerId !== turn.id) return;
    const angle = Math.atan2(event.clientY - turn.cy, event.clientX - turn.cx), delta = wrap(angle - turn.last); turn.last = angle;
    // Clockwise on screen is a growing angle (y points down). The other way the ratchet holds: a little spring back.
    if (delta > 0) wind(delta);
    else if (delta < -.05) { knob.classList.remove('is-resisting'); void knob.offsetWidth; knob.classList.add('is-resisting'); }
  });
  const letGo = event => { if (!turn || event.pointerId !== turn.id) return; turn = null; knob.classList.remove('is-winding'); release(); };
  on(knob, 'pointerup', letGo); on(knob, 'pointercancel', letGo); on(knob, 'lostpointercapture', letGo);
  on(knob, 'keydown', event => {
    if (!['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault(); cabin.holdKey(true); wind(Math.PI / 2);
    clearTimeout(clicks); clicks = setTimeout(release, 700);
  });
  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { card?.remove(); events.abort(); watch.disconnect(); clearTimeout(clicks); forget(); if (turn || cabin.wound > 0) release(); };
}
