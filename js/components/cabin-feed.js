// Feeding the reindeer. Two foods wait in a basket: drag one to his mouth (it is taken once it comes close) or simply press
// it. A carrot he chews with a nod; gingerbread he turns his head away from and it goes back in the basket. After five meals
// he is full until tomorrow (this computer's calendar, cabin-progress.js). He does not sleep: the model has no eyelids, and
// a drooping head with open eyes looked wrong. Lichen, his favourite, is not in the basket: the pouch from the mailbox goes
// in the trough behind him (from the pocket, cabin-bag.js). He eats it there, steps aside, and where he stood a little gold
// shows in the hay; brushed aside, it is a little key. Fed and found are the pocket's to keep (lichen used, key had).
import { paperLayer } from './paper-art.js';
import { MEALS, eat, full, mealsToday } from '../services/cabin-progress.js';
import { FEED_ORDER, feedsNext } from '../services/cabin-story.js';
import { FEED } from '../data/cabin-jobs.js';

// The care log on his fence: read once the key is found (and again whenever the trough is tapped after).
const CARE_LOG = '柵欄上的照顧紀錄寫著：「今天的聖誕老人記得帶地衣來了！」往前翻，還有一行金色的字：「12/21 後半夜，地衣餵過了。—— O.」';
const FOODS = [['oats', '北極燕麥餅'], ['carrot', '胡蘿蔔'], ['lichen', '地衣'], ['gingerbread', '薑餅']];
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const near = (point, rect, pad) => rect && point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;

// A volunteer owing him his care (`wants`) finds in the basket what the barn's feeding table lists (and the gingerbread):
// he takes them only in the order of their times (cabin-story.js); a wrong one and the round starts again. Fed for the
// job, it does not count among the day's meals, so it can be done even once he is full.
export function feedGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onFound, burst, art, paper, wants = () => false, onTask = () => {}, clue = () => {} }) {
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
  // The trough: the pocket's lichen goes in it (offered at his mouth, he looks round at it instead).
  const fed = () => bag.ever('lichen') && !bag.holds('lichen'), trough = element('button', 'play-target feed-trough', layer), mouthSpot = element('span', 'feed-mouth-spot', layer);
  trough.type = 'button'; trough.setAttribute('aria-label', '麋鹿身後的餵食槽'); mouthSpot.setAttribute('aria-hidden', 'true');
  const glint = element('span', 'feed-glint', layer); glint.setAttribute('aria-hidden', 'true'); paperLayer(glint, '0 0 100 100', '', art.star, paper);
  const place = (node, rect) => rect && Object.assign(node.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  function layout() {
    place(trough, cabin.sheetRect('trough', [0, 0, 1, .8])); place(mouthSpot, cabin.mouthRect()); place(glint, cabin.sheetRect('trough', [.7, 0, .9, .4]));
    glint.hidden = !fed() || bag.ever('key');
  }
  const forget = [
    bag.target(trough, { accepts: id => id === 'lichen' || (id === 'key' ? '鑰匙不是給麋鹿的。' : '麋鹿聞了聞，把頭轉開了。'), use: eatAtTrough }),
    bag.target(mouthSpot, { accepts: id => id === 'lichen' ? '麋鹿聞了聞地衣，回頭看了看身後的餵食槽。' : '麋鹿聞了聞，把頭轉開了。', use: () => {} }),
  ];
  function eatAtTrough() {
    const rect = trough.getBoundingClientRect(), box = stage.getBoundingClientRect();
    cabin.reindeerLook({ x: rect.left - box.left + rect.width * .7, y: rect.top - box.top + rect.height * .4 }); cabin.reindeerAct('chew'); sound.play('chew');
    speak('是地衣！我最愛吃這個！'); burst(local(rect), 'heart', 3);
    later(1700, () => { cabin.repaint('trough', { eaten: true }); cabin.reindeerLook(null); cabin.reindeerStep(true); cabin.reindeerAct('happy'); sound.play('happy'); });
    later(3000, () => { layout(); say('麋鹿把地衣吃得乾乾淨淨，心滿意足地往旁邊挪了一步。牠剛才站的那頭，乾草裡好像有一點金色。'); });
    return '你把地衣放進餵食槽。';
  }
  // Brushing the hay aside where the gold shows: the little key, once.
  on(trough, 'click', () => {
    if (!fed()) { say('餵食槽裡堆著乾草。麋鹿聞了聞，好像在等什麼更好吃的。'); return; }
    if (bag.ever('key')) { say(`餵食槽裡的乾草被翻得亂七八糟。${CARE_LOG}`); clue('care-log'); return; }
    sound.play('remove'); cabin.repaint('trough', { eaten: true, taken: true }); glint.hidden = true;
    bag.give('key', local(glint.getBoundingClientRect()));
    clue('care-log'); later(2600, () => say(CARE_LOG));
  });
  // He may step aside as the corner opens (for the sleigh, cabin-sleigh.js): his mouth is followed until he stands still.
  layout(); later(600, layout); later(1300, layout); later(3200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  const done = () => { events.abort(); clearTimeout(hush); watch.disconnect(); forget.forEach(each => each()); cabin.reindeerLook(null); cabin.reindeerAct(null); };

  // The key found before the log was read (a tap elsewhere used to cut it short): the log is read on coming back.
  if (bag.ever('key') && clue('care-log')) later(2600, () => say(CARE_LOG));
  let job = wants(), served = [];
  if (full(progress) && !job) {
    say(bag.holds('lichen') ? '麋鹿今天已經吃飽了……不過聞到你口袋裡的味道，牠回頭看了看餵食槽。' : '麋鹿今天已經吃飽了，明天再來餵牠吧。');
    later(500, () => { cabin.reindeerAct('nod'); speak('今天吃飽囉，明天再來餵我！'); });
    return done;
  }

  say(job ? FEED.start : bag.holds('lichen') ? '麋鹿聞到你口袋裡的地衣，抽了抽鼻子。牠身後有個餵食槽。' : '從籃子拿食物，拖到麋鹿嘴邊餵牠吃吧！');
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
      const point = drag.point = at(event); move(drag.ghost, point);
      cabin.reindeerLook(point); showRing(near(point, cabin.mouthRect(), 40));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { ghost, point: last } = drag; drag = null; button.classList.remove('is-lifted'); showRing(false); cabin.reindeerLook(null);
      if (!ghost) return;
      dragged = true;
      const point = event.type === 'lostpointercapture' ? last : at(event);
      if (event.type !== 'pointercancel' && near(point, cabin.mouthRect(), 40)) offer(kind, button, ghost);
      else { sound.play('drop'); fly(ghost, centre(local(button.getBoundingClientRect())), false); }
    };
    // A release swallowed before it reaches the page (some browser extensions do that) still ends the drag: the browser takes
    // the pointer back from the button (lostpointercapture), and it counts as let go where it last was.
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop); on(button, 'lostpointercapture', drop);
    // A tap or Enter hands it straight to him.
    on(button, 'click', () => { if (dragged) { dragged = false; return; } offer(kind, button, null); });
  }
  const move = (ghost, point) => { const half = Number(ghost.dataset.size) / 2; ghost.style.translate = `${point.x - half}px ${point.y - half}px`; };
  function fly(ghost, point, eaten) {
    if (!ghost) return;
    ghost.classList.add('is-flying'); move(ghost, point); if (eaten) ghost.classList.add('is-eaten');
    later(320, () => ghost.remove());
  }

  // The job's round: the next by the table's clock is eaten; anything else, he shakes his head and it starts again.
  function serve(kind, button, ghost, mouth) {
    if (!feedsNext(served, kind)) {
      served = []; cabin.reindeerAct('shake'); sound.play('refuse'); speak('嗯……現在還不是吃這個的時候。');
      fly(ghost, centre(local(button.getBoundingClientRect())), false); say(FEED.wrong); return;
    }
    served.push(kind); if (mouth) fly(ghost, centre(mouth), true);
    button.classList.add('is-gone'); later(700, () => button.classList.remove('is-gone'));
    cabin.reindeerAct(kind === 'lichen' ? 'happy' : 'chew'); sound.play(kind === 'lichen' ? 'happy' : 'chew'); burst(mouth, 'heart', served.length);
    speak(kind === 'lichen' ? '是地衣！我最愛吃這個！' : FEED.good(served.length - 1) || '喀滋喀滋！');
    say(`${FEED.foods[kind]}，照餵食表餵了 ${served.length}／${FEED_ORDER.length} 樣。`);
    if (served.length === FEED_ORDER.length) { job = false; meter.hidden = false; later(1600, () => { say(FEED.done); onTask(); }); }
  }
  function offer(kind, button, ghost) {
    const mouth = cabin.mouthRect();
    if (job && kind !== 'gingerbread') { serve(kind, button, ghost, mouth); return; }
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
      burst(mouth, 'heart', 3); speak('是地衣！我最愛吃這個！'); onTask();
      clue('care-log'); later(1200, () => say(CARE_LOG));
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

  for (const [kind, label] of FOODS) if (job || kind === 'carrot' || kind === 'gingerbread') piece(kind, label);
  count(); meter.hidden = job;
  return done;
}
