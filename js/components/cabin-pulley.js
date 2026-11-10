// The barn's hay hoist. Pull the wooden toggle down and the bale rises with it while the wheel under the eave turns. Let go
// part way and the bale's weight slides it back down; pull it all the way and the rope can be hooked to hold it. Up there the
// bale no longer hides a hatch in the wall, and in the hatch is a crate with a note. Hooked and read stay kept (cabin-progress.js).
import { shape } from './paper-art.js';

const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const TOP = .92;

export function pulleyGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, onTask = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const state = progress.hoist, still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pull = state.locked ? 1 : 0, fall = 0, holding = 0, notch = 0;
  const grip = element('button', 'hoist-grip', layer); grip.type = 'button'; grip.setAttribute('aria-label', '木頭握把：往下拉繩子（也可以按方向鍵上下）');
  const hint = element('span', 'hoist-hint', layer); hint.textContent = '往下拉 ↓'; hint.setAttribute('aria-hidden', 'true');
  const hook = element('button', 'hoist-hook', layer); hook.type = 'button'; hook.textContent = '掛上掛鉤固定'; hook.hidden = true;
  const hatch = element('button', 'play-target hoist-hatch', layer); hatch.type = 'button'; hatch.setAttribute('aria-label', '打開牆裡的小木箱'); hatch.hidden = true;
  const loosen = element('button', 'hoist-release', layer); loosen.type = 'button'; loosen.textContent = '鬆開滑輪 ↺'; loosen.hidden = true;

  const place = (node, rect, pad = 0) => Object.assign(node.style, { left: `${rect.left - pad}px`, top: `${rect.top - pad}px`, width: `${rect.width + pad * 2}px`, height: `${rect.height + pad * 2}px` });
  function layout() {
    const rects = cabin.hoistRects(); if (!rects) return;
    const grab = Math.max(0, (56 - rects.toggle.width) / 2);
    place(grip, rects.toggle, grab);
    Object.assign(hint.style, { left: `${rects.toggle.left + rects.toggle.width + grab + 8}px`, top: `${rects.toggle.top}px` });
    Object.assign(hook.style, { left: `${rects.toggle.left + rects.toggle.width + grab + 8}px`, top: `${rects.toggle.top + rects.toggle.height / 2}px` });
    Object.assign(loosen.style, { left: `${rects.wheel.left + rects.wheel.width + 12}px`, top: `${rects.wheel.top}px` });
    place(hatch, rects.hatch, 6);
  }
  // Every change of the pull goes through here: the scene follows, the buttons follow the toggle, and the rope creaks.
  function set(value) {
    pull = Math.max(0, Math.min(1, value)); cabin.hoist(pull); layout();
    const step = Math.floor(pull * 8); if (step !== notch) { notch = step; sound.play('creak'); }
    hint.hidden = state.locked || pull > .05;
  }
  function settle() {
    hook.hidden = !(pull >= TOP && !state.locked); hatch.hidden = !state.locked; loosen.hidden = !state.locked;
    grip.disabled = state.locked; grip.classList.toggle('is-locked', state.locked);
  }
  // Let go below the top: the bale's weight takes it back down, faster as it goes, and it lands with a soft thud.
  function drop() {
    cancelAnimationFrame(fall); clearTimeout(holding); hook.hidden = true;
    if (pull <= 0) return;
    if (still()) { set(0); sound.play('thud'); return; }
    let speed = 0, before = performance.now();
    const step = now => {
      const delta = Math.min(.05, (now - before) / 1000); before = now; speed += 2.6 * delta;
      set(pull - speed * delta);
      if (pull > 0) fall = requestAnimationFrame(step);
      else { sound.play('thud'); say('乾草太重，滑回地上了。再拉一次，拉到頂就能掛上掛鉤。'); }
    };
    fall = requestAnimationFrame(step);
  }
  // At the top the rope catches for a moment: hook it now, or it slips.
  function atTop() {
    say('拉到頂了！趁現在把繩子掛上掛鉤。'); settle(); hook.focus({ preventScroll: true });
    clearTimeout(holding); holding = setTimeout(() => { if (!state.locked) drop(); }, 3200);
  }

  let drag = null;
  on(grip, 'pointerdown', event => {
    if (state.locked || event.button > 0) return;
    event.preventDefault(); grip.setPointerCapture(event.pointerId); cancelAnimationFrame(fall); clearTimeout(holding); hook.hidden = true;
    drag = { id: event.pointerId, y: event.clientY, from: pull, reach: Math.max(40, cabin.hoistRects()?.reach ?? 200) };
    grip.classList.add('is-pulling'); sound.play('pick');
  });
  on(grip, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    set(drag.from + (event.clientY - drag.y) / drag.reach);
  });
  const letGo = event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null; grip.classList.remove('is-pulling');
    if (pull >= TOP) atTop(); else drop();
  };
  on(grip, 'pointerup', letGo); on(grip, 'pointercancel', letGo); on(grip, 'lostpointercapture', letGo);
  on(grip, 'keydown', event => {
    const step = { ArrowDown: .12, ArrowUp: -.12 }[event.key];
    if (!step || state.locked) return;
    event.preventDefault(); cancelAnimationFrame(fall); clearTimeout(holding);
    set(pull + step);
    if (pull >= TOP) atTop(); else { hook.hidden = true; clearTimeout(holding); holding = setTimeout(drop, 1600); }
  });
  on(hook, 'click', () => {
    clearTimeout(holding); state.locked = true; save(); set(1); sound.play('click'); settle(); onTask();
    say('掛好了！乾草吊在半空中，牆腳原本被擋住的地方露出一個小暗格。'); hatch.focus({ preventScroll: true });
  });
  on(hatch, 'click', () => {
    cabin.openHatch(true); sound.play('open'); hatch.hidden = true; say('');
    // A scrap of paper in two hands: someone wrote the date and the shift, someone else finished it.
    const note = element('article', 'cabin-letter cabin-note', layer); note.setAttribute('aria-label', '暗格裡的紙條');
    const first = element('p', 'note-line note-first', note); first.textContent = '12/24 — 夜班交接';
    const second = element('p', 'note-line note-second', note); second.textContent = '完成';
    const mark = shape('svg', { viewBox: '0 0 90 34', class: 'note-mark', 'aria-hidden': 'true' }, second);
    shape('path', { d: 'M4 18L12 27 30 5', fill: 'none', stroke: 'currentColor', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mark);
    shape('path', { d: 'M40 24C44 10 50 8 52 16S56 30 60 18 66 6 70 18C72 24 78 26 86 14', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, mark);
    const close = element('button', 'cabin-letter-close', note); close.type = 'button'; close.textContent = '收好紙條 ✓';
    on(close, 'click', () => {
      note.remove(); state.found = true; save(); onFound('stable'); sound.play('remove');
      say('紙條收回箱子裡了。上面有兩種不同的筆跡……'); loosen.focus({ preventScroll: true }); hatch.hidden = false;
    });
    close.focus({ preventScroll: true });
  });
  on(loosen, 'click', () => {
    state.locked = false; save(); cabin.openHatch(false); settle();
    say('滑輪鬆開了，乾草慢慢降回地上。'); drop(); grip.focus({ preventScroll: true });
  });

  say(state.locked ? (state.found ? '乾草還吊著，暗格裡的木箱收著那張紙條。想再拉一次，就先鬆開滑輪。' : '乾草吊在半空中，牆腳露出一個小暗格。') : '抓住木頭握把往下拉，乾草就會升起來。');
  set(pull); settle(); layout();
  later(600, layout); later(1300, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => {
    events.abort(); watch.disconnect(); cancelAnimationFrame(fall); clearTimeout(holding);
    // Leaving with the rope unhooked lets the bale back down to the snow.
    if (!state.locked && pull > 0) cabin.hoist(0);
  };
}
