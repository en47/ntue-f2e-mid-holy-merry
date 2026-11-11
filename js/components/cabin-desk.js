// The writing desk up close: a desk for answering letters. Letters that came in wait in the bundle, each in the paper it
// was written on (a child's lined page with a crayon drawing in the corner, a squared work pad): take one, open it, read
// it, turn it over to see which substitute dealt with it, put it back. Replies go out from the rack: read on Santa's own
// paper, folded into an envelope, sealed with wax (drag the seal to the flap), postmarked (drag the stamp to its postage
// stamp) and dropped into the mail sack (drag the envelope there, or press). A volunteer finds two new letters on top of
// the bundle and writes their replies, choosing what to say. Sealed, postmarked and sent are kept (cabin-progress.js).
// The drawer over the kneehole is locked, holly carved round its keyhole: the little key from the reindeer's trough opens
// it and stays in the lock (cabin-bag.js). Inside lie a magnifier, to keep, and a rocker blotter to look at closely.
import { paperLayer, shape } from './paper-art.js';
import { inspect } from './cabin-inspect.js';
import { ITEM_ART } from './cabin-items.js';
import { BLOTTER } from '../data/cabin-items.js';
import { inked } from './cabin-paper.js';
import { DESK_LETTERS, REPLY, VOLUNTEER_LETTERS } from '../data/cabin-letters.js';
import { NAMES } from '../data/cabin-secret.js';
import { knowsSantas, pending, signedUp } from '../services/cabin-story.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .2 }, eager: true };
const CRAYON = { paper: { scale: .25, grain: .5, shadow: 0, rim: '#ffffff00' }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const near = (point, rect, pad) => rect && point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;
// The two tools as they look in the hand, each in a 100 × 100 box: a rubber stamp on a turned handle, a brass seal.
const TOOLS = {
  stamp: parent => { shape('circle', { cx: 50, cy: 18, r: 14, fill: '#8f5a3c' }, parent); shape('rect', { x: 43, y: 28, width: 14, height: 40, fill: '#a86b47' }, parent); shape('rect', { x: 24, y: 66, width: 52, height: 16, rx: 4, fill: '#8f5a3c' }, parent); shape('rect', { x: 26, y: 82, width: 48, height: 10, rx: 3, fill: '#8f3b36' }, parent); },
  seal: parent => { shape('circle', { cx: 50, cy: 16, r: 12, fill: '#a86b47' }, parent); shape('rect', { x: 42, y: 24, width: 16, height: 46, rx: 8, fill: '#8f5a3c' }, parent); shape('path', { d: 'M32 70H68L72 90H28Z', fill: '#e0b04f' }, parent); },
};
// A child's crayon drawing in the corner of their letter, in a 100 × 80 box.
const line = (d, colour, parent, width = 4) => shape('path', { d, fill: 'none', stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
const DOODLES = {
  sled: parent => { line('M14 56H78Q90 56 90 44', '#c0392b', parent); line('M22 56V44H70V56', '#c0392b', parent); line('M30 44V30H62V44', '#8e5a3a', parent, 3.5); line('M10 64H84Q94 64 96 54', '#5d6d7e', parent, 3); },
  reindeer: parent => { line('M26 52Q30 38 52 38Q72 38 74 50Q72 60 52 60Q32 60 26 52Z', '#8e5a3a', parent); line('M34 60V74M44 60V74M60 60V74M68 60V74', '#8e5a3a', parent, 3.5); line('M74 46Q84 40 86 30', '#8e5a3a', parent); line('M84 30L80 16M84 30L92 18M82 24L74 18', '#a0522d', parent, 3); shape('circle', { cx: 88, cy: 32, r: 4.5, fill: '#e74c3c' }, parent); },
  book: parent => { line('M14 26Q30 20 50 28Q70 20 86 26V66Q70 60 50 68Q30 60 14 66Z', '#2e86c1', parent); line('M50 28V68', '#2e86c1', parent, 3); line('M22 38Q32 35 42 39M22 48Q32 45 42 49M58 39Q68 35 78 38M58 49Q68 45 78 48', '#f39c12', parent, 2.5); },
  friends: parent => { for (const x of [32, 68]) { shape('circle', { cx: x, cy: 22, r: 8, fill: 'none', stroke: x < 50 ? '#e67e22' : '#27ae60', 'stroke-width': 4 }, parent); line(`M${x} 30V54M${x} 54L${x - 8} 72M${x} 54L${x + 8} 72`, x < 50 ? '#e67e22' : '#27ae60', parent); } line('M32 40L50 46L68 40', '#c0392b', parent); line('M50 12Q46 4 42 8Q38 14 50 22Q62 14 58 8Q54 4 50 12Z', '#e74c3c', parent, 3); },
  nose: parent => { line('M30 30Q30 62 50 70Q70 62 70 30Q50 18 30 30Z', '#8e5a3a', parent); line('M34 26L24 8M30 18L20 18M66 26L76 8M70 18L80 18', '#a0522d', parent, 3); shape('circle', { cx: 42, cy: 40, r: 3, fill: '#3b2a24' }, parent); shape('circle', { cx: 58, cy: 40, r: 3, fill: '#3b2a24' }, parent); shape('circle', { cx: 50, cy: 58, r: 8, fill: '#e74c3c' }, parent); line('M50 74V78M40 76L36 80M60 76L64 80', '#f1c40f', parent, 2.5); },
};
// The holly in the corner of Santa's own paper.
function holly(parent) {
  shape('path', { d: 'M8 34C16 18 34 18 40 30C32 28 28 40 20 34C16 42 8 42 8 34Z', fill: '#3f6653' }, parent);
  shape('path', { d: 'M36 20C44 6 60 8 64 20C56 18 54 30 46 24C42 32 34 30 36 20Z', fill: '#4f7d68' }, parent);
  for (const [x, y] of [[36, 32], [30, 38], [42, 38]]) shape('circle', { cx: x, cy: y, r: 4.5, fill: '#c63a33' }, parent);
}
// The mail sack, tied at the neck, a few letters showing at the top, in a 100 × 110 box.
function sack(parent) {
  for (const [x, r] of [[34, -12], [52, 6], [66, 18]]) shape('rect', { x, y: 6, width: 22, height: 30, rx: 2, fill: '#fffaf0', stroke: '#dccaa9', 'stroke-width': 1.5, transform: `rotate(${r} ${x + 11} 30)` }, parent);
  shape('path', { d: 'M26 34Q50 26 74 34L80 46Q96 74 86 98Q50 110 14 98Q4 74 20 46Z', fill: '#b98d5c' }, parent);
  shape('path', { d: 'M22 44Q50 52 78 44', fill: 'none', stroke: '#7a5636', 'stroke-width': 5, 'stroke-linecap': 'round' }, parent);
  for (const x of [30, 44, 58, 72]) line(`M${x} 60Q${x - 2} 78 ${x} 96`, '#a37a4c', parent, 1.6);
  shape('rect', { x: 34, y: 62, width: 32, height: 22, rx: 3, fill: '#a84a42' }, parent);
  shape('path', { d: 'M38 66H62M38 72H58M38 78H54', stroke: '#fbf3df', 'stroke-width': 1.6 }, parent);
}

// The shallow drawer over the kneehole, cut to match the one drawn on the desk: its front slides out. Shut, a brass
// keyhole plate with a sprig of holly carved either side; unlocked, the little key stands in it (a layer of its own).
function drawerFront(parent) {
  shape('rect', { x: 0, y: 0, width: 200, height: 24, rx: 4, fill: '#9a6343' }, parent);
  shape('rect', { x: 6, y: 4, width: 188, height: 16, rx: 3, fill: '#a86b47' }, parent);
  for (const side of [-1, 1]) {
    shape('path', { d: `M${100 + side * 12} 12c${side * 6}-6 ${side * 14}-6 ${side * 20}-1c${-side * 6} 1 ${-side * 9} 5 ${-side * 20} 1Z`, fill: '#7d4f33' }, parent);
    shape('circle', { cx: 100 + side * 33, cy: 12, r: 1.8, fill: '#8f3b36' }, parent);
  }
  shape('rect', { x: 94, y: 5, width: 12, height: 14, rx: 3, fill: '#e0b04f' }, parent);
  shape('path', { d: 'M100 8.5a2 2 0 1 1 0 4l1 4h-2l1-4', fill: '#3b2a24' }, parent);
}
const drawerKey = parent => { shape('rect', { x: 99, y: 2, width: 2.4, height: 8, fill: '#c48f32' }, parent); shape('circle', { cx: 100.2, cy: 4, r: 4, fill: 'none', stroke: '#d9a441', 'stroke-width': 2.2 }, parent); shape('path', { d: 'M103 4C108 6 107 11 103 10', fill: 'none', stroke: '#b5443c', 'stroke-width': 1.2 }, parent); };
function drawerInside(parent) {
  shape('rect', { x: 0, y: 0, width: 200, height: 24, rx: 3, fill: '#4a3226' }, parent);
  shape('path', { d: 'M110 18C118 8 152 8 160 18Z', fill: '#8f5a3c' }, parent); shape('rect', { x: 131, y: 4, width: 8, height: 7, rx: 3, fill: '#6b4a33' }, parent);
  shape('circle', { cx: 56, cy: 12, r: 7, fill: '#cfe3ec', stroke: '#c48f32', 'stroke-width': 2.4 }, parent); shape('rect', { x: 62, y: 14, width: 18, height: 4, rx: 2, fill: '#8f5a3c', transform: 'rotate(18 62 14)' }, parent);
}
// The rocker blotter, each side in a 100 × 100 box: on top its rocker of turned wood with a brass knob; turned over, its
// curved pad of blotting paper, soaked with ink stains (the writing on it is laid over in the site's hand, backwards).
function rockerTop(parent) {
  shape('path', { d: 'M10 64Q50 50 90 64V74Q50 60 10 74Z', fill: '#8f5a3c' }, parent);
  shape('path', { d: 'M16 62Q50 40 84 62Q50 50 16 62Z', fill: '#a86b47' }, parent);
  shape('rect', { x: 44, y: 34, width: 12, height: 18, rx: 4, fill: '#8f5a3c' }, parent);
  shape('circle', { cx: 50, cy: 30, r: 9, fill: '#e0b04f' }, parent); shape('circle', { cx: 47, cy: 27, r: 3, fill: '#f4d98c' }, parent);
}
function rockerPad(parent) {
  shape('path', { d: 'M6 30Q50 18 94 30V72Q50 84 6 72Z', fill: '#8f5a3c' }, parent);
  shape('path', { d: 'M10 33Q50 22 90 33V69Q50 80 10 69Z', fill: '#f3ead6' }, parent);
  for (const [d, o] of [['M18 40c6-2 10 2 16 0', .35], ['M66 70c5 1 9-1 14 0', .3], ['M70 38c4-1 7 1 10 0', .3]]) shape('path', { d, fill: 'none', stroke: '#7f93a6', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: o }, parent);
}

export function deskGame({ layer, stage, cabin, say, later, sound, progress, save, bag, onUse = () => {}, onTask = () => {}, clue = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  const at = event => { const box = stage.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  const desk = progress.desk, volunteer = progress.volunteer;
  // What waits. While the job is still to do, the new letters lie on top of the bundle until answered; after that they come
  // round in the bundle with the others and can be answered again (only the first time is stamped in the register). On
  // the rack: Santa's reply to Mia until it is sent, and each reply a volunteer has written, until it is sent.
  const answered = entry => entry.id in desk.answers;
  const unanswered = () => pending(volunteer, 'letters') && desk.sorted ? VOLUNTEER_LETTERS.filter(entry => !answered(entry) && !desk.sent.includes(`reply-${entry.id}`)) : [];
  const bundle = () => [...DESK_LETTERS, ...(signedUp(volunteer) && !pending(volunteer, 'letters') ? VOLUNTEER_LETTERS.filter(entry => !answered(entry)) : [])];
  const replyTo = entry => ({ id: `reply-${entry.id}`, letter: entry.id, to: `給${entry.name}`, greeting: `親愛的${entry.name}：`, body: entry.answers[desk.answers[entry.id]], sign: `替身 ${volunteer.mark}. 代筆`, seal: volunteer.mark, name: entry.name });
  const outgoing = () => [...(desk.sent.includes(REPLY.id) ? [] : [{ ...REPLY, seal: 'S', name: '小米' }]), ...VOLUNTEER_LETTERS.filter(answered).map(replyTo)];
  say(unanswered().length ? '信堆最上面有兩封新來的信，要交給新替身回覆。點信堆抽一封來讀。' : pending(volunteer, 'letters') && !desk.sorted ? '信堆裡還沒有新的信。小房間的分揀架上，好像還有一疊信沒分。' : outgoing().length ? '書桌上堆著收到的信；左邊架子上，還有等著寄出的回信。' : '書桌上堆著收到的信。點信堆抽一封來讀。');

  const pick = (label, run) => { const button = element('button', 'desk-pick', layer); button.type = 'button'; button.setAttribute('aria-label', label); on(button, 'click', run); return button; };
  let next = 0;
  const stack = pick('從信堆抽一封信', () => { const letters = bundle(); take(unanswered()[0] ?? letters[next++ % letters.length], 'in', stack); });
  const outbox = pick('拿起架上等著寄出的回信', () => { const [reply] = outgoing(); if (reply) take(reply, 'out', outbox); else { sound.play('nope'); say('架上的回信都寄出去了。'); } });
  const tools = Object.fromEntries(Object.keys(TOOLS).map(kind => {
    const button = element('button', `desk-tool desk-${kind}`, layer); button.type = 'button';
    button.setAttribute('aria-label', kind === 'stamp' ? '郵戳：拖到要寄出的信封郵票上（也可以按 Enter）' : '火漆印：拖到要寄出的信封封口上（也可以按 Enter）');
    return [kind, button];
  }));

  // The work on the desk: a line saying what can be done next, the envelope or the letter, the buttons, the mail sack.
  const work = element('div', 'desk-work', layer); work.hidden = true;
  const guide = element('p', 'desk-guide', work), sheet = element('div', 'desk-sheet', work);
  const envelope = element('div', 'desk-envelope', sheet);
  const flap = element('span', 'envelope-flap', envelope), from = element('p', 'envelope-from', envelope), to = element('p', 'envelope-to', envelope);
  const postage = element('span', 'envelope-stamp', envelope), arrived = element('span', 'envelope-arrived', envelope, '收件'), postmark = element('span', 'envelope-postmark', envelope, '北極郵局\n12·25'), wax = element('span', 'envelope-wax', envelope);
  for (const node of [flap, postage, arrived, postmark, wax]) node.setAttribute('aria-hidden', 'true');
  // The two marks are ink: the post office's blue ring on letters that came in, the red postmark (rings and wavy lines) on replies.
  inked(arrived, '0 0 60 60', ink => shape('circle', { cx: 30, cy: 30, r: 26, fill: 'none', stroke: '#3f5a7a', 'stroke-width': 2.4 }, ink));
  inked(postmark, '0 0 220 100', ink => { shape('circle', { cx: 170, cy: 50, r: 44, fill: 'none', stroke: '#b5443c', 'stroke-width': 3 }, ink); shape('circle', { cx: 170, cy: 50, r: 37, fill: 'none', stroke: '#b5443c', 'stroke-width': 1.4 }, ink); for (const y of [30, 44, 58, 72]) shape('path', { d: `M4 ${y}q8 -6 16 0t16 0t16 0t16 0t16 0t16 0t16 0t14 0`, fill: 'none', stroke: '#b5443c', 'stroke-width': 2 }, ink); });
  const letter = element('article', 'desk-letter', sheet), front = element('div', 'letter-face', letter);
  const head = element('p', 'letter-head', front, '北極　聖誕老人'), greeting = element('p', 'letter-greeting', front), body = element('p', 'letter-body', front), signed = element('p', 'letter-signed', front);
  const doodle = element('span', 'letter-doodle', front); doodle.setAttribute('aria-hidden', 'true');
  paperLayer(element('span', 'letter-holly', front), '0 0 70 46', '', holly, PAPER).parentElement.setAttribute('aria-hidden', 'true');
  const back = element('div', 'letter-face letter-back', letter), note = element('p', 'letter-note', back), sign = element('p', 'letter-sign', back), dated = element('p', 'letter-date', back);
  // Writing a reply: Santa's paper, the greeting, three things to choose from, and the volunteer's signature.
  const compose = element('article', 'desk-letter desk-compose', sheet); compose.dataset.paper = 'santa';
  element('p', 'letter-head', compose, '北極　聖誕老人');
  const dear = element('p', 'letter-greeting', compose), choices = element('div', 'compose-choices', compose), byline = element('p', 'letter-signed', compose);
  paperLayer(element('span', 'letter-holly', compose), '0 0 70 46', '', holly, PAPER);
  const actions = element('div', 'desk-actions', work);
  const action = (text, run) => { const button = element('button', '', actions, text); button.type = 'button'; on(button, 'click', run); return button; };
  const buttons = { open: action('拆開信', open), flip: action('翻到背面', flip), write: action('寫回信 ✎', write), fold: action('摺好放進信封', fold), send: action('投進郵袋', send), back: action('放回去', putBack) };
  const mailbag = element('div', 'desk-sack', work); paperLayer(mailbag, '0 0 100 110', '', sack, PAPER); const count = element('span', 'sack-count', mailbag);
  let current = null;
  // The drawer over the kneehole: locked until the little key turns in it (and stays there); pulled out, what is inside
  // comes up on a card: the magnifier to take, the blotter to look at closely.
  const unlocked = () => bag.ever('key') && !bag.holds('key');
  const drawer = element('button', 'desk-drawer', layer); drawer.type = 'button'; drawer.setAttribute('aria-label', '書桌中間的抽屜');
  paperLayer(drawer, '0 0 200 24', 'drawer-inside', drawerInside, PAPER); paperLayer(drawer, '0 0 200 24', 'drawer-front', drawerFront, PAPER); paperLayer(drawer, '0 0 200 24', 'drawer-key', drawerKey, PAPER);
  drawer.classList.toggle('is-unlocked', unlocked());
  const forget = bag.target(drawer, {
    accepts: id => unlocked() ? '抽屜已經打開了。' : id === 'key' || '鑰匙孔很小，這個插不進去。',
    use: () => { later(450, () => { drawer.classList.add('is-unlocked'); sound.play('click'); }); onUse(); return '鑰匙插進去剛剛好，輕輕一轉——喀，抽屜的鎖開了。'; },
  });
  on(drawer, 'click', () => {
    if (!unlocked()) { sound.play('nope'); clue('desk-lock'); say('抽屜鎖著。鑰匙孔的兩邊，各刻著一小枝冬青葉。'); return; }
    if (drawer.classList.contains('is-open')) { drawer.classList.remove('is-open'); sound.play('drop'); return; }
    drawer.classList.add('is-open'); sound.play('open'); later(650, drawerCard);
  });
  let looking = null;
  function drawerCard() {
    const card = element('article', 'cabin-letter drawer-card', layer); card.setAttribute('aria-label', '書桌抽屜裡');
    element('h3', 'chair-title', card, '書桌抽屜裡');
    const things = element('div', 'drawer-things', card);
    if (!bag.ever('magnifier')) {
      const glass = element('button', 'drawer-thing', things); glass.type = 'button'; glass.setAttribute('aria-label', '黃銅框的放大鏡');
      paperLayer(glass, '0 0 100 100', '', ITEM_ART.magnifier, PAPER); element('span', 'drawer-label', glass, '放大鏡');
      on(glass, 'click', () => { const from = local(glass.getBoundingClientRect()); glass.remove(); bag.give('magnifier', from); });
    }
    const rocker = element('button', 'drawer-thing', things); rocker.type = 'button'; rocker.setAttribute('aria-label', '搖擺式吸墨器：拿起來看看');
    paperLayer(rocker, '0 0 100 100', '', rockerTop, PAPER); element('span', 'drawer-label', rocker, '吸墨器');
    on(rocker, 'click', () => {
      if (looking) return;
      looking = inspect({ host: stage, sound, title: BLOTTER.name, draw: rockerTop, words: BLOTTER.look, back: { draw: rockerPad, words: BLOTTER.back, mirror: BLOTTER.writing }, from: local(rocker.getBoundingClientRect()), turn: '拖曳或用方向鍵可以轉動，按「翻過來」看底下。', flip: '翻過來', done: '放回抽屜 ✓', onTurn: () => clue('blotter'), onClose: () => { looking = null; } });
    });
    const done = element('button', 'cabin-letter-close', card, '關上抽屜 ✓'); done.type = 'button';
    on(done, 'click', () => { card.remove(); drawer.classList.remove('is-open'); sound.play('drop'); drawer.focus({ preventScroll: true }); });
    (things.firstElementChild ?? done).focus({ preventScroll: true });
  }

  function layout() {
    const rects = cabin.deskRects(); if (!rects) return;
    const place = (node, rect, least) => { const w = Math.max(least, rect.width), h = Math.max(least, rect.height); Object.assign(node.style, { left: `${rect.left + rect.width / 2 - w / 2}px`, top: `${rect.top + rect.height / 2 - h / 2}px`, width: `${w}px`, height: `${h}px` }); };
    place(stack, rects.stack, 48); place(outbox, rects.outbox, 48);
    const { drawer: slot } = rects; Object.assign(drawer.style, { left: `${slot.left}px`, top: `${slot.top}px`, width: `${slot.width}px`, height: `${Math.max(slot.height, 20)}px` });
    for (const [kind, button] of Object.entries(tools)) if (!button.classList.contains('is-dragging')) place(button, rects[kind], 52);
  }
  // Everything shown follows the letter on the desk and how far along it is.
  function refresh() {
    const { entry, kind, step } = current, out = kind === 'out', sealed = out && desk.sealed.includes(entry.id), marked = out && desk.marked.includes(entry.id), flipped = letter.classList.contains('is-flipped');
    const answering = !out && VOLUNTEER_LETTERS.includes(entry) && signedUp(volunteer) && !answered(entry), again = answering && !unanswered().includes(entry);
    envelope.hidden = step !== 'envelope'; letter.hidden = step !== 'read'; compose.hidden = step !== 'compose';
    envelope.dataset.kind = kind; envelope.dataset.open = String(out && !sealed); arrived.hidden = out; postage.hidden = false; postmark.hidden = !marked; wax.hidden = !sealed;
    mailbag.hidden = !out; count.textContent = `已寄出 ${desk.sent.length} 封`;
    guide.textContent = step === 'compose' ? `想跟${entry.name}說什麼？選一句寫進信裡（哪一句都好）。`
      : out ? (step === 'read' ? '讀完就摺好，放進信封。' : !sealed ? '把桌上的火漆印拖到信封的封口，封起來。' : !marked ? '再把郵戳拖到右上角的郵票上，蓋上北極郵局的郵戳。' : '封好、蓋好了！把信封拖進郵袋，就寄出去了。')
      : step === 'envelope' ? `${entry.from}寄來的信，郵局已經蓋好收件章。拆開來讀讀看。`
      : flipped ? '背面是處理這封信的人寫的。' : again ? '這封信你回過了。想再寫一封不一樣的，就按「寫回信」。' : answering ? '這封信還沒有人回。讀完按「寫回信」，替聖誕老人回一封。' : '讀完可以翻到背面，看看是誰處理的。';
    // Only the tool that can be used now stands out.
    tools.seal.classList.toggle('is-ready', out && step === 'envelope' && !sealed); tools.stamp.classList.toggle('is-ready', out && step === 'envelope' && sealed && !marked);
    envelope.classList.toggle('is-ready', out && marked);
    buttons.open.hidden = out || step !== 'envelope'; buttons.flip.hidden = out || step !== 'read'; buttons.write.hidden = !answering || step !== 'read';
    buttons.fold.hidden = !(out && step === 'read') && step !== 'compose'; buttons.fold.disabled = step === 'compose' && current.choice === undefined;
    buttons.send.hidden = !(out && marked); buttons.flip.textContent = flipped ? '翻回正面' : '翻到背面';
    buttons.back.textContent = step === 'compose' ? '先不寫' : out ? '放回架上' : '放回信堆';
  }
  // The work flies from where it was picked up to its place on the desk, and back again.
  function fly(rect, away) {
    if (still() || !rect) { if (away) work.hidden = true; return; }
    const box = stage.getBoundingClientRect(), mine = work.getBoundingClientRect(), target = centre(rect);
    const offset = `translate(${target.x - (mine.left - box.left + mine.width / 2)}px, ${target.y - (mine.top - box.top + mine.height / 2)}px) scale(.2)`;
    if (away) { work.style.transform = offset; work.style.opacity = '0'; later(380, () => { work.hidden = true; work.style.transform = work.style.opacity = ''; }); return; }
    work.style.transition = 'none'; work.style.transform = offset; work.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { work.style.transition = work.style.transform = work.style.opacity = ''; }));
  }
  const pop = (node, className = 'is-new') => { if (still()) return; node.classList.remove(className); void node.offsetWidth; node.classList.add(className); };
  // A letter on the desk: one that came in starts in its envelope; a reply starts as the letter, or in its envelope once sealed.
  function take(entry, kind, source) {
    if (current) { current.source.focus({ preventScroll: true }); return; }
    current = { entry, kind, source, step: kind === 'out' && desk.sealed.includes(entry.id) ? 'envelope' : kind === 'out' ? 'read' : 'envelope' };
    letter.classList.remove('is-flipped'); letter.dataset.paper = kind === 'out' ? 'santa' : entry.paper;
    from.textContent = kind === 'out' ? '寄件：北極　聖誕老人' : `寄件：${entry.from}`; to.textContent = entry.to; wax.textContent = entry.seal ?? '';
    greeting.textContent = entry.greeting ?? ''; body.textContent = entry.body; signed.textContent = kind === 'out' ? `—— ${entry.sign}` : entry.paper === 'kid' ? `${entry.from.replace(/（.*）/, '')} 上` : '';
    head.hidden = kind !== 'out'; doodle.replaceChildren(); if (entry.doodle) paperLayer(doodle, '0 0 100 80', '', DOODLES[entry.doodle], CRAYON);
    if (kind === 'in') { note.textContent = entry.back.note; sign.textContent = `—— ${entry.back.sign ?? `${volunteer.mark}.`}`; dated.textContent = entry.back.date; back.dataset.hand = entry.back.hand; }
    work.hidden = false; refresh(); fly(local(source.getBoundingClientRect()), false); sound.play('pick'); say('');
    actions.querySelector('button:not([hidden])')?.focus({ preventScroll: true });
  }
  function open() {
    current.step = 'read'; refresh(); sound.play('open'); onUse(); pop(letter, 'is-unfolding');
    buttons.flip.focus({ preventScroll: true });
  }
  function flip() {
    const flipped = letter.classList.toggle('is-flipped'); sound.play('remove'); refresh();
    // Whoever signed the back goes in the clue book: the route note's line about the second half, or just their hands.
    if (flipped && current.entry.back.sign) clue(current.entry.id === 'route' ? 'route-note' : 'letter-backs');
    // Once the little room behind the bookcase has been seen, the initial has a name.
    if (flipped) say(!current.entry.back.sign ? `背面寫著「交給新來的替身」，簽名欄是你的縮寫：${volunteer.mark}.。` : knowsSantas(progress.story.seen) ? `背面簽著「${current.entry.back.sign}」——是名牌上的${NAMES[current.entry.back.sign[0]]}。` : '背面有人寫了一行小字，還簽了名。');
  }
  // A volunteer's reply: one of three things to say, signed with their initial; then it is folded like any other. The
  // choice counts once it is folded in (`fold`), so putting the pen down keeps the letter unanswered.
  function write() {
    const { entry } = current;
    current.step = 'compose'; current.choice = undefined; dear.textContent = `親愛的${entry.name}：`; byline.textContent = `—— 替身 ${volunteer.mark}. 代筆`; choices.replaceChildren();
    entry.answers.forEach((text, i) => {
      const choice = element('button', 'compose-choice', choices, text); choice.type = 'button'; choice.setAttribute('aria-pressed', 'false');
      on(choice, 'click', () => { current.choice = i; sound.play('pick'); for (const other of choices.children) other.setAttribute('aria-pressed', String(other === choice)); refresh(); buttons.fold.focus({ preventScroll: true }); });
    });
    refresh(); sound.play('open'); pop(compose, 'is-unfolding'); choices.firstElementChild.focus({ preventScroll: true });
  }
  // Folded into the envelope: the letter folds down and the open envelope takes its place.
  function fold() {
    const sheetOf = current.step === 'compose' ? compose : letter;
    if (current.step === 'compose') {
      // A reply just written goes into a fresh envelope, whatever an earlier one to the same child went through.
      const answered = current.entry, reply = replyTo(answered); desk.answers[answered.id] = current.choice;
      desk.sealed = desk.sealed.filter(id => id !== reply.id); desk.marked = desk.marked.filter(id => id !== reply.id); save();
      current = { entry: replyTo(answered), kind: 'out', source: outbox, step: 'compose' }; wax.textContent = volunteer.mark; to.textContent = current.entry.to; from.textContent = '寄件：北極　聖誕老人';
    }
    pop(sheetOf, 'is-folding'); sound.play('remove');
    later(still() ? 0 : 380, () => { if (!current) return; sheetOf.classList.remove('is-folding'); current.step = 'envelope'; refresh(); pop(envelope, 'is-arriving'); tools.seal.focus({ preventScroll: true }); });
  }
  // Into the sack: the envelope drops in, the sack takes it, and the count on its tag goes up.
  function send() {
    const { entry } = current;
    // A volunteer's reply, once gone, leaves its letter free to be answered again, with a fresh envelope.
    if (!desk.sent.includes(entry.id)) desk.sent.push(entry.id);
    if (entry.letter) { delete desk.answers[entry.letter]; desk.sealed = desk.sealed.filter(id => id !== entry.id); desk.marked = desk.marked.filter(id => id !== entry.id); }
    save(); sound.play('drop'); later(220, () => sound.play('jingle'));
    pop(envelope, 'is-sent'); pop(mailbag, 'is-taking'); count.textContent = `已寄出 ${desk.sent.length} 封`;
    say(`寄出去了！${entry.name}會在平安夜前收到${entry.id === REPLY.id ? '聖誕老人的' : '你寫的'}回信。`);
    if (VOLUNTEER_LETTERS.every(each => desk.sent.includes(`reply-${each.id}`))) onTask();
    later(still() ? 300 : 1300, () => { if (current?.entry !== entry) return; const { source } = current; current = null; envelope.classList.remove('is-sent'); fly(local(source.getBoundingClientRect()), true); source.focus({ preventScroll: true }); });
  }
  function putBack() {
    if (current.step === 'compose') { current.step = 'read'; refresh(); buttons.write.focus({ preventScroll: true }); return; }
    const { source } = current; current = null; sound.play('remove'); say('');
    for (const tool of Object.values(tools)) tool.classList.remove('is-ready');
    fly(local(source.getBoundingClientRect()), true); source.focus({ preventScroll: true });
  }

  // The tools: drag one onto its place on a reply's envelope (or press Enter with it on the desk). Only replies take them.
  const targetOf = kind => {
    if (!current || current.kind !== 'out' || current.step !== 'envelope') return null;
    const { id } = current.entry, sealed = desk.sealed.includes(id);
    if (kind === 'seal' && !sealed) return flap;
    if (kind === 'stamp' && sealed && !desk.marked.includes(id)) return postage;
    return null;
  };
  function use(kind) {
    const target = targetOf(kind);
    if (!target) {
      sound.play('nope');
      say(!current ? '郵戳和火漆是寄信用的：先從左邊的架子拿起要寄出的回信。' : current.kind === 'in' ? '這封是收到的信，郵局已經蓋過章了。要寄出的回信，才需要封口和蓋郵戳。' : current.step !== 'envelope' ? '先把信摺好，放進信封。' : kind === 'stamp' ? '先用火漆把封口封起來，再蓋郵戳。' : '這封已經封好了。');
      return false;
    }
    const { id } = current.entry;
    if (kind === 'seal') { desk.sealed.push(id); save(); sound.play('click'); later(120, () => sound.play('thud')); refresh(); pop(wax); say('火漆壓好了，封口封得牢牢的。'); }
    else { desk.marked.push(id); save(); sound.play('thud'); refresh(); pop(postmark); say('咚！北極郵局，12 月 25 日。'); buttons.send.focus({ preventScroll: true }); }
    return true;
  }
  for (const [kind, button] of Object.entries(tools)) {
    let drag = null, dragged = false;
    on(button, 'pointerdown', event => {
      if (event.button > 0) return;
      event.preventDefault(); try { button.setPointerCapture(event.pointerId); } catch {} dragged = false;
      drag = { id: event.pointerId, from: at(event), ghost: null };
    });
    on(button, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const point = drag.point = at(event);
      if (!drag.ghost) {
        if (Math.hypot(point.x - drag.from.x, point.y - drag.from.y) < 6) return;
        drag.ghost = element('div', 'desk-ghost', layer); paperLayer(drag.ghost, '0 0 100 100', '', TOOLS[kind], PAPER); button.classList.add('is-dragging'); sound.play('pick');
      }
      drag.ghost.style.translate = `${point.x - 40}px ${point.y - 70}px`;
      const target = targetOf(kind); target?.classList.toggle('is-target', near(point, local(target.getBoundingClientRect()), 24));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { ghost, point: last } = drag; drag = null; button.classList.remove('is-dragging');
      for (const node of [postage, flap]) node.classList.remove('is-target');
      if (!ghost) return;
      dragged = true;
      const target = targetOf(kind), hit = event.type !== 'pointercancel' && target && near(event.type === 'lostpointercapture' ? last : at(event), local(target.getBoundingClientRect()), 24);
      if (hit) { ghost.classList.add('is-pressing'); use(kind); later(260, () => ghost.remove()); } else { sound.play('drop'); ghost.remove(); }
    };
    // A release swallowed before it reaches the page (some browser extensions do that) still ends the drag: the browser takes
    // the pointer back from the button (lostpointercapture), and it counts as let go where it last was.
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop); on(button, 'lostpointercapture', drop);
    on(button, 'click', () => { if (dragged) { dragged = false; return; } use(kind); });
  }
  // The sealed, postmarked envelope can be carried to the sack by hand too.
  let carry = null, carried = false;
  on(envelope, 'pointerdown', event => {
    if (event.button > 0 || !envelope.classList.contains('is-ready')) return;
    event.preventDefault(); try { envelope.setPointerCapture(event.pointerId); } catch {}
    carry = { id: event.pointerId, x: event.clientX, y: event.clientY, point: null }; carried = false;
  });
  on(envelope, 'pointermove', event => {
    if (!carry || event.pointerId !== carry.id) return;
    const dx = event.clientX - carry.x, dy = event.clientY - carry.y;
    if (!carry.point && Math.hypot(dx, dy) < 6) return;
    carry.point = { x: event.clientX, y: event.clientY }; envelope.classList.add('is-carried'); envelope.style.translate = `${dx}px ${dy}px`;
    mailbag.classList.toggle('is-open', near(carry.point, mailbag.getBoundingClientRect(), 20));
  });
  const letGo = event => {
    if (!carry || event.pointerId !== carry.id) return;
    const { point } = carry; carry = null; envelope.classList.remove('is-carried'); envelope.style.translate = ''; mailbag.classList.remove('is-open');
    if (!point) return;
    carried = true;
    const end = event.type === 'lostpointercapture' ? point : { x: event.clientX, y: event.clientY };
    if (event.type !== 'pointercancel' && near(end, mailbag.getBoundingClientRect(), 20)) send(); else sound.play('drop');
  };
  on(envelope, 'pointerup', letGo); on(envelope, 'pointercancel', letGo); on(envelope, 'lostpointercapture', letGo);
  on(envelope, 'click', () => { if (carried) carried = false; });

  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  events.signal.addEventListener('abort', () => { forget(); looking?.close(); });
  return () => { events.abort(); watch.disconnect(); };
}
