// The hearth up close. Firewood waits in the basket and the bellows hang beside the fire: drag a log into the fire (or press
// Enter on it) and the fire climbs, up to three logs; press the bellows' handles down and let go, and the fire flares. The
// fire itself lives in the scene (cabin-scene.js), so it keeps burning down while you are elsewhere in the room.
import { paperLayer, shape } from './paper-art.js';

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

export function hearthGame({ layer, stage, cabin, say, later, sound }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const at = event => { const box = stage.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  say('從柴籃拿一根木柴放進爐口；把風箱往下壓再放開，火會竄高。');
  const mouth = element('span', 'hearth-mouth', layer); mouth.setAttribute('aria-hidden', 'true');
  const logs = [0, 1, 2].map(() => {
    const button = element('button', 'hearth-log', layer); button.type = 'button'; button.setAttribute('aria-label', '拿一根木柴放進壁爐');
    paperLayer(button, '0 0 100 44', '', log, PAPER); return button;
  });
  const grip = element('button', 'hearth-bellows', layer); grip.type = 'button'; grip.setAttribute('aria-label', '風箱：往下壓再放開，把火吹旺（也可以按 Enter）');
  let size = 60;

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
    place(mouth, rects.mouth);
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

  // Into the fire: false (and back to the basket) when the fire already burns as high as it goes.
  function feed(button) {
    if (!cabin.hearthAdd()) { say('火已經燒得很旺了，等它小一點再添吧。'); sound.play('nope'); return false; }
    sound.play('crackle'); sparks(); say(line());
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
      const point = at(event), dx = point.x - drag.from.x, dy = point.y - drag.from.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) { drag.moved = true; button.classList.add('is-dragging'); sound.play('pick'); }
      button.style.translate = `${dx}px ${dy}px`;
      mouth.classList.toggle('is-open', near(point, cabin.hearthRects()?.mouth, 30));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved } = drag; drag = null; mouth.classList.remove('is-open'); button.classList.remove('is-dragging');
      if (!moved) return;
      dragged = true;
      const point = at(event), rect = cabin.hearthRects()?.mouth;
      if (event.type === 'pointerup' && near(point, rect, 30)) {
        // It slides into the fire from where it was let go.
        const from = button.getBoundingClientRect(), box = stage.getBoundingClientRect(), target = centre(rect);
        const dx = target.x - (from.left - box.left + from.width / 2) + Number(button.style.translate.split('px')[0] || 0), dy = target.y - (from.top - box.top + from.height / 2) + Number(button.style.translate.split(' ')[1]?.replace('px', '') || 0);
        if (feed(button)) { button.style.translate = `${dx}px ${dy}px`; return; }
      }
      sound.play('drop'); button.style.translate = '';
    };
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop);
    // A tap or Enter puts it straight on the fire.
    on(button, 'click', () => { if (dragged) { dragged = false; return; } feed(button); });
  });

  // The bellows: how far they are pressed follows the pointer down; let go past halfway and they blow.
  let press = null, spring = 0;
  const reach = () => Math.max(50, (cabin.hearthRects()?.bellows.height ?? 40) * 1.6);
  function blow() {
    cabin.blow(); sound.play('whoosh');
    if (cabin.heat > 0) { sparks(); say('呼——火焰一下竄了起來。'); } else say('風箱呼地一吹，只揚起一點灰。先放根木柴吧。');
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
  on(grip, 'pointerup', letGo); on(grip, 'pointercancel', letGo);
  on(grip, 'keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); cabin.bellows(1); blow(); later(160, () => release(1));
  });

  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); cancelAnimationFrame(spring); cabin.bellows(0); };
}
