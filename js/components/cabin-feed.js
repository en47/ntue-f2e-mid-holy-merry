// Feeding the reindeer. Three foods wait in a basket: drag one to his mouth (it is taken once it comes close) or simply press
// it. A carrot he chews with a nod; lichen, his favourite, makes him hop; gingerbread he turns his head away from and it goes
// back in the basket. After five meals he is full until tomorrow (this computer's calendar, cabin-progress.js). He does not
// sleep: the model has no eyelids, and a drooping head with open eyes looked wrong.
import { paperLayer } from './paper-art.js';
import { MEALS, eat, full, mealsToday } from '../services/cabin-progress.js';

const FOODS = [['carrot', '胡蘿蔔'], ['lichen', '地衣'], ['gingerbread', '薑餅']];
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const near = (point, rect, pad) => rect && point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;

export function feedGame({ layer, stage, cabin, say, later, sound, progress, save, onFound, burst, art, paper }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const at = event => { const box = stage.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  const local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  // A paper speech bubble beside his head.
  const bubble = element('p', 'reindeer-bubble', layer); bubble.hidden = true; bubble.setAttribute('aria-hidden', 'true');
  let hush = 0;
  function speak(text) {
    const mouth = cabin.mouthRect(); if (!mouth) return;
    bubble.textContent = text; bubble.hidden = false;
    bubble.style.left = `${mouth.left + mouth.width / 2}px`; bubble.style.top = `${mouth.top - 18}px`;
    bubble.classList.remove('is-popping'); void bubble.offsetWidth; bubble.classList.add('is-popping');
    clearTimeout(hush); hush = setTimeout(() => { bubble.hidden = true; }, 2400);
  }
  if (full(progress)) {
    say('麋鹿今天已經吃飽了，明天再來餵牠吧。');
    later(500, () => { cabin.reindeerAct('nod'); speak('今天吃飽囉，明天再來餵我！'); });
    return () => { events.abort(); clearTimeout(hush); };
  }

  say('從籃子拿食物，拖到麋鹿嘴邊餵牠吃吧！');
  const tray = element('div', 'feed-tray', layer), meter = element('p', 'feed-meter', tray), basket = element('div', 'feed-basket', tray);
  const meals = Array.from({ length: MEALS }, () => element('span', 'feed-meal', meter));
  const ring = element('span', 'feed-mouth', layer); ring.setAttribute('aria-hidden', 'true');
  function count() {
    const eaten = mealsToday(progress);
    meals.forEach((meal, i) => meal.classList.toggle('is-eaten', i < eaten));
    meter.setAttribute('aria-label', `今天吃了 ${eaten}／${MEALS} 份`);
  }
  function showRing(show) {
    const mouth = cabin.mouthRect();
    ring.classList.toggle('is-open', Boolean(show && mouth));
    if (mouth) Object.assign(ring.style, { left: `${mouth.left}px`, top: `${mouth.top}px`, width: `${mouth.width}px`, height: `${mouth.height}px` });
  }

  function piece(kind, label) {
    const button = element('button', `play-item play-${kind}`, basket); button.type = 'button';
    button.setAttribute('aria-label', `餵麋鹿吃${label}`); button.dataset.kind = kind;
    paperLayer(button, '0 0 100 100', '', art[kind], paper);
    let drag = null, dragged = false;
    on(button, 'pointerdown', event => {
      if (event.button > 0) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); dragged = false;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ghost: null };
    });
    on(button, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.ghost) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
        const size = button.getBoundingClientRect().width * 1.2;
        drag.ghost = element('div', 'feed-ghost', layer); drag.ghost.style.width = drag.ghost.style.height = `${size}px`; drag.ghost.dataset.size = size;
        paperLayer(drag.ghost, '0 0 100 100', '', art[kind], paper);
        button.classList.add('is-lifted'); sound.play('pick');
      }
      const point = at(event); move(drag.ghost, point);
      cabin.reindeerLook(point); showRing(near(point, cabin.mouthRect(), 40));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { ghost } = drag; drag = null; button.classList.remove('is-lifted'); showRing(false); cabin.reindeerLook(null);
      if (!ghost) return;
      dragged = true;
      const point = at(event);
      if (event.type === 'pointerup' && near(point, cabin.mouthRect(), 40)) offer(kind, button, ghost);
      else { sound.play('drop'); fly(ghost, centre(local(button.getBoundingClientRect())), false); }
    };
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop);
    // A tap or Enter hands it straight to him.
    on(button, 'click', () => { if (dragged) { dragged = false; return; } offer(kind, button, null); });
  }
  const move = (ghost, point) => { const half = Number(ghost.dataset.size) / 2; ghost.style.translate = `${point.x - half}px ${point.y - half}px`; };
  function fly(ghost, point, eaten) {
    if (!ghost) return;
    ghost.classList.add('is-flying'); move(ghost, point); if (eaten) ghost.classList.add('is-eaten');
    later(320, () => ghost.remove());
  }

  function offer(kind, button, ghost) {
    const mouth = cabin.mouthRect();
    if (kind === 'gingerbread') {
      // Not for him: he turns away and the biscuit floats back to the basket.
      cabin.reindeerAct('refuse'); sound.play('refuse'); speak('不要不要，這是聖誕老人的點心！');
      fly(ghost, centre(local(button.getBoundingClientRect())), false); say('麋鹿把頭轉開了：牠不吃薑餅。柵欄上的照顧紀錄有一行：「上次那位總是記錯牠喜歡什麼。」');
      return;
    }
    if (mouth) fly(ghost, centre(mouth), true);
    // Each piece eaten is put back in the basket a moment later.
    button.classList.add('is-gone'); later(700, () => button.classList.remove('is-gone'));
    const eaten = eat(progress); save(); count();
    if (kind === 'lichen') {
      cabin.reindeerAct('happy'); sound.play('happy'); later(1800, () => { cabin.reindeerAct('chew'); sound.play('chew'); });
      burst(mouth, 'heart', 3); speak('是地衣！我最愛吃這個！');
      later(1200, () => say('柵欄上的照顧紀錄寫著：「今天的聖誕老人記得帶地衣來了！」'));
    } else {
      cabin.reindeerAct('chew'); sound.play('chew'); burst(mouth, 'heart', 1); speak(['喀滋喀滋！', '好甜的胡蘿蔔！', '再一根好不好？'][eaten % 3]);
    }
    say(`麋鹿今天吃了 ${eaten}／${MEALS} 份。`);
    if (eaten >= MEALS) later(kind === 'lichen' ? 3600 : 1900, () => {
      tray.remove(); ring.remove(); cabin.reindeerAct('happy'); sound.play('jingle'); burst(cabin.mouthRect(), 'heart', 4); speak('吃飽了，謝謝你！');
      say('麋鹿吃飽了，開心地跳了一下。明天再來餵牠吧。');
      onFound('reindeer');
    });
  }

  for (const [kind, label] of FOODS) piece(kind, label);
  count();
  return () => { events.abort(); clearTimeout(hush); cabin.reindeerLook(null); cabin.reindeerAct(null); };
}
