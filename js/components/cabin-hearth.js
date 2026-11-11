// The hearth up close. Only a dying flicker is left in the grate, too weak to catch a log: a match from the pocket (the
// box from the barn's drawer, cabin-bag.js) lights it, for good. Then firewood from the basket (drag a log into the fire,
// or press Enter on it) makes it climb, up to three logs, and the bellows (press their handles down and let go) make it
// flare. In its light the R cut in the hearthstone shows, and across the room a few book spines gleam gold. The fire itself
// lives in the scene (cabin-scene.js), so it keeps burning down (never out) while you are elsewhere in the room. The blank
// slip from the register, once it is in the visitor's pocket, waits here too: held to a fire with two logs burning, the
// lemon writing on it comes up brown, a character at a time.
import { paperLayer, shape } from './paper-art.js';
import { letter } from './cabin-art.js';
import { CORD } from '../data/cabin-finale.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .2 }, eager: true };
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const near = (point, rect, pad) => rect && point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;
// A split log in a 100 × 44 box, its cut end to the right.
function log(parent) {
  shape('rect', { x: 2, y: 6, width: 84, height: 32, rx: 15, fill: '#7d5636' }, parent);
  for (const x of [14, 34, 54]) shape('path', { d: `M${x} 16c6 4 10-2 16 3`, fill: 'none', stroke: '#5e3e29', 'stroke-width': 2.4 }, parent);
  shape('ellipse', { cx: 84, cy: 22, rx: 12, ry: 16, fill: '#c99a6a' }, parent);
  shape('ellipse', { cx: 84, cy: 22, rx: 6, ry: 8, fill: 'none', stroke: '#a8774d', 'stroke-width': 2 }, parent);
}

// The blank slip: cream paper folded once, a faint lemon mark at one corner.
function slipArt(parent) {
  shape('path', { d: 'M6 10L86 4 94 50 12 56Z', fill: '#fffaf0' }, parent);
  shape('path', { d: 'M86 4L94 50 80 40Z', fill: '#efe3c8' }, parent);
  shape('circle', { cx: 24, cy: 22, r: 8, fill: '#f6ecc4', opacity: .8 }, parent);
}

// The letter carved in the hearthstone in front of the fire, R: too shallow to see until the firelight catches its edges.
function carving(parent) {
  letter(parent, 'R', 50, 52, 46, 52, { fill: '#9a6343', stroke: '#ffcf73', 'stroke-width': 2.6, 'stroke-linejoin': 'round' });
}

export function hearthGame({ layer, stage, cabin, say, later, sound, bag, onUse = () => {}, progress, save = () => {}, clue = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const at = event => { const box = stage.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  const finale = progress?.finale, pocket = finale?.slip === 'taken';
  say(!cabin.lit ? '壁爐裡只剩一點快熄的小火苗。柴籃裡有木柴，風箱掛在一旁。' : pocket ? '從柴籃拿木柴放進爐口、用風箱把火吹旺。口袋裡那張空白紙條，也可以拿出來靠近火。' : '從柴籃拿一根木柴放進爐口；把風箱往下壓再放開，火會竄高。');
  const mouth = element('span', 'hearth-mouth', layer); mouth.setAttribute('aria-hidden', 'true');
  // The fire's mouth, for what the pocket holds: the matches light it.
  const grate = element('button', 'play-target hearth-fire', layer); grate.type = 'button'; grate.setAttribute('aria-label', '壁爐裡的火');
  const logs = [0, 1, 2].map(() => {
    const button = element('button', 'hearth-log', layer); button.type = 'button'; button.setAttribute('aria-label', '拿一根木柴放進壁爐');
    paperLayer(button, '0 0 100 44', '', log, PAPER); return button;
  });
  const grip = element('button', 'hearth-bellows', layer); grip.type = 'button'; grip.setAttribute('aria-label', '風箱：往下壓再放開，把火吹旺（也可以按 Enter）');
  let size = 60;
  const back = element('span', 'hearth-letter', layer); back.setAttribute('aria-hidden', 'true'); paperLayer(back, '0 0 100 104', '', carving, { paper: { scale: .3, grain: .6, shadow: 0, rim: '#ffd88a00' }, eager: true });
  const slip = pocket ? element('button', 'hearth-slip', layer) : null;
  if (slip) { slip.type = 'button'; slip.setAttribute('aria-label', CORD.toFire); paperLayer(slip, '0 0 100 60', '', slipArt, PAPER); }

  const place = (node, rect) => Object.assign(node.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  function layout() {
    const rects = cabin.hearthRects(); if (!rects) return;
    // The logs lie heaped on top of the basket, each turned a little, each still big enough to take with a finger.
    const { basket } = rects; size = Math.max(56, basket.width * .44);
    logs.forEach((button, i) => {
      if (button.classList.contains('is-dragging')) return;
      place(button, { left: basket.left + basket.width * (.5 + (i - 1) * .24) - size / 2, top: basket.top + basket.height * .06 - i % 2 * size * .14, width: size, height: size * .44 });
      button.style.rotate = `${[-9, 4, 11][i]}deg`;
    });
    place(mouth, rects.mouth); place(grate, rects.mouth);
    const plate = Math.max(30, rects.mouth.width * .2); place(back, { left: rects.mouth.left + rects.mouth.width / 2 - plate / 2, top: rects.mouth.top + rects.mouth.height * 1.02, width: plate, height: plate * 1.04 });
    if (slip) place(slip, { left: Math.max(8, basket.left + basket.width * .1), top: Math.max(8, basket.top - size * .95), width: size * .9, height: size * .54 });
    const handle = rects.bellows, side = Math.max(56, handle.width, handle.height);
    place(grip, { left: handle.left + handle.width / 2 - side / 2, top: handle.top + handle.height / 2 - side / 2, width: side, height: side });
  }
  function sparks() {
    if (still()) return;
    const rect = cabin.hearthRects()?.mouth; if (!rect) return;
    for (let i = 0; i < 5; i++) {
      const spark = element('span', 'hearth-spark', layer); spark.setAttribute('aria-hidden', 'true');
      spark.style.left = `${rect.left + rect.width * (.25 + Math.random() * .5)}px`; spark.style.top = `${rect.top + rect.height * .35}px`;
      spark.style.setProperty('--dx', `${(Math.random() - .5) * 60}px`); spark.style.animationDelay = `${i * .08}s`;
      later(1400, () => spark.remove());
    }
  }
  const line = () => cabin.heat > 2.5 ? '三根木柴都燒起來了，整間屋子暖烘烘的。' : '木柴劈啪作響，火又旺了一些。';

  // Into the fire: false (and back to the basket) when the fire is too weak to catch it, or already burns as high as it goes.
  function feed(button) {
    if (!cabin.lit) { say('火太弱了，木柴放上去只冒出一縷細細的煙，點不著。'); sound.play('nope'); return false; }
    if (!cabin.hearthAdd()) { say('火已經燒得很旺了，等它小一點再添吧。'); sound.play('nope'); return false; }
    sound.play('crackle'); sparks(); say(line()); onUse();
    button.classList.add('is-used'); later(1300, () => { button.classList.remove('is-used'); button.style.translate = ''; layout(); });
    return true;
  }
  logs.forEach(button => {
    let drag = null, dragged = false;
    on(button, 'pointerdown', event => {
      if (event.button > 0 || button.classList.contains('is-used')) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); dragged = false;
      drag = { id: event.pointerId, from: at(event), moved: false };
    });
    on(button, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const point = drag.point = at(event), dx = point.x - drag.from.x, dy = point.y - drag.from.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) { drag.moved = true; button.classList.add('is-dragging'); sound.play('pick'); }
      button.style.translate = `${dx}px ${dy}px`;
      mouth.classList.toggle('is-open', near(point, cabin.hearthRects()?.mouth, 30));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved, point: last } = drag; drag = null; mouth.classList.remove('is-open'); button.classList.remove('is-dragging');
      if (!moved) return;
      dragged = true;
      const point = event.type === 'lostpointercapture' ? last : at(event), rect = cabin.hearthRects()?.mouth;
      if (event.type !== 'pointercancel' && near(point, rect, 30)) {
        // It slides into the fire from where it was let go.
        const from = button.getBoundingClientRect(), box = stage.getBoundingClientRect(), target = centre(rect);
        const dx = target.x - (from.left - box.left + from.width / 2) + Number(button.style.translate.split('px')[0] || 0), dy = target.y - (from.top - box.top + from.height / 2) + Number(button.style.translate.split(' ')[1]?.replace('px', '') || 0);
        if (feed(button)) { button.style.translate = `${dx}px ${dy}px`; return; }
      }
      sound.play('drop'); button.style.translate = '';
    };
    // A release swallowed before it reaches the page (some browser extensions do that) still ends the drag: the browser takes
    // the pointer back from the button (lostpointercapture), and it counts as let go where it last was.
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop); on(button, 'lostpointercapture', drop);
    // A tap or Enter puts it straight on the fire.
    on(button, 'click', () => { if (dragged) { dragged = false; return; } feed(button); });
  });

  // The bellows: how far they are pressed follows the pointer down; let go past halfway and they blow.
  let press = null, spring = 0;
  const reach = () => Math.max(50, (cabin.hearthRects()?.bellows.height ?? 40) * 1.6);
  function blow() {
    cabin.blow(); sound.play('whoosh'); onUse();
    if (cabin.lit) { sparks(); say('呼——火焰一下竄了起來。'); } else say('風箱一吹，小火苗晃了晃，差一點就熄了。');
  }
  function release(from) {
    cancelAnimationFrame(spring);
    if (still()) { cabin.bellows(0); return; }
    const start = performance.now();
    const step = now => { const u = Math.min(1, (now - start) / 320); cabin.bellows(from * (1 - u) ** 2); if (u < 1) spring = requestAnimationFrame(step); };
    spring = requestAnimationFrame(step);
  }
  on(grip, 'pointerdown', event => {
    if (event.button > 0) return;
    event.preventDefault(); grip.setPointerCapture(event.pointerId); cancelAnimationFrame(spring);
    press = { id: event.pointerId, y: event.clientY, amount: 0 }; grip.classList.add('is-pressing');
  });
  on(grip, 'pointermove', event => {
    if (!press || event.pointerId !== press.id) return;
    press.amount = Math.max(0, Math.min(1, (event.clientY - press.y) / reach())); cabin.bellows(press.amount);
  });
  const letGo = event => {
    if (!press || event.pointerId !== press.id) return;
    const { amount } = press; press = null; grip.classList.remove('is-pressing');
    if (amount > .45) blow();
    release(amount);
  };
  on(grip, 'pointerup', letGo); on(grip, 'pointercancel', letGo); on(grip, 'lostpointercapture', letGo);
  on(grip, 'keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); cabin.bellows(1); blow(); later(160, () => release(1));
  });

  // Held to the fire: with two logs burning (they burn down slowly, so a little under two), the writing comes up;
  // otherwise it only warms.
  function roast() {
    if (cabin.heat < 1.5) { say(CORD.warm); sound.play('nope'); slip.classList.remove('is-warm'); void slip.offsetWidth; slip.classList.add('is-warm'); return; }
    slip.remove(); finale.slip = 'read'; save(); clue('lemon-note'); sound.play('open'); say('');
    const card = element('article', 'cabin-letter lemon-card', layer); card.setAttribute('aria-label', '烤過的紙條');
    const words = element('p', 'lemon-words', card), text = CORD.lemon.join('');
    const full = element('span', 'sr-only', words); full.textContent = `${text}${CORD.sign}`;
    const ink = element('span', '', words); ink.setAttribute('aria-hidden', 'true');
    [...CORD.lemon.join('\n'), '\n', ...CORD.sign].forEach((char, i) => { const each = element('span', 'lemon-char', ink); each.textContent = char; each.style.setProperty('--at', `${(.6 + i * .12).toFixed(2)}s`); });
    const done = element('button', 'cabin-letter-close', card); done.type = 'button'; done.textContent = '收好紙條 ✓';
    on(done, 'click', () => { card.remove(); sound.play('remove'); say(finale.unlocked ? CORD.known : '雪花球記得的那一年……'); });
    done.focus({ preventScroll: true });
  }
  if (slip) on(slip, 'click', roast);
  // A match struck and held to the grate: the fire catches, and stays lit.
  const forget = bag.target(grate, {
    accepts: id => id === 'matches' || (cabin.lit ? '火已經燒起來了。' : '這個放進火裡不太好。'),
    use: () => { cabin.light(); sound.play('crackle'); later(300, () => sound.play('whoosh')); sparks(); onUse(); return '嚓——火柴點著了。火苗舔上木柴，一下子旺了起來。'; },
  });
  on(grate, 'click', () => { if (!cabin.lit) { sound.play('nope'); say('爐子裡只剩一點小火苗，快要熄了。木柴放上去也點不著。'); } else say(line()); });
  // The hearthstone's letter shows while the fire burns, and the gold spines across the room catch its light; the first
  // time, both are told and written in the clue book.
  function firelight() {
    const lit = cabin.lit && cabin.heat > .6; back.classList.toggle('is-lit', lit);
    if (lit && clue('letter-hearth')) {
      later(1700, () => say('火光照到壁爐前的石板，淺淺的刻痕亮了起來——是一個字母：R。'));
      later(5200, () => say('房間另一頭，書櫃上有幾本書的書脊，在火光裡閃了一下金光。'));
    }
    later(700, firelight);
  }
  firelight();

  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); cancelAnimationFrame(spring); cabin.bellows(0); forget(); };
}
