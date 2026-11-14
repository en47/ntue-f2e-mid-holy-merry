// Talking with Santa in the room, without AI: his paper portrait waits in the corner under the clue book (only once you
// are inside with the door shut, css/santa.css), in a holly wreath. Tapped, or Santa himself tapped, it opens a paper card
// (his stationery with a garland across the top, cabin-paper.js) with his lines on the left and yours on the right, like a
// chat, and a few replies to give underneath, as gift tags; what he says is chosen by
// cabin-play.js from data/cabin-talk.js, never here. At a turn in the story the card tells a scene instead: one line at a
// time, each moved on by your reply, ending in a choice. While he is out the corner shows the note he left on his chair.
// The writing line stays in the card, hidden and switched off, for a reply written by an AI later.
import { bow } from './cabin-paper.js';
import { leaf, paperLayer, shape } from './paper-art.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .18 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
// Santa's portrait for the chat: hat, white trim, rosy face, a cloud of beard.
function portrait(parent) {
  shape('circle', { cx: 50, cy: 52, r: 46, fill: '#dfeef3' }, parent);
  shape('path', { d: 'M22 84C14 64 22 52 34 50H66C78 52 86 64 78 84 70 96 30 96 22 84Z', fill: '#fbf8f1' }, parent);
  shape('circle', { cx: 50, cy: 50, r: 18, fill: '#f2c9a8' }, parent);
  for (const x of [43, 57]) shape('circle', { cx: x, cy: 48, r: 2.4, fill: '#3b2a24' }, parent);
  for (const x of [38, 62]) shape('circle', { cx: x, cy: 55, r: 4, fill: '#e9a08f', opacity: .8 }, parent);
  shape('circle', { cx: 50, cy: 55, r: 4.6, fill: '#e07a6a' }, parent);
  shape('path', { d: 'M34 62C40 58 46 60 50 64 54 60 60 58 66 62 62 70 38 70 34 62Z', fill: '#fbf8f1' }, parent);
  shape('path', { d: 'M28 38C30 16 56 6 76 22 82 28 82 34 80 40L72 34C70 30 66 28 62 30Z', fill: '#a84a42' }, parent);
  shape('rect', { x: 26, y: 34, width: 48, height: 10, rx: 5, fill: '#fbf8f1' }, parent);
  shape('circle', { cx: 80, cy: 40, r: 6, fill: '#fbf8f1' }, parent);
}
// The portrait in a wreath of holly and pine, berries in three places and a red bow at its foot.
function wreathed(parent) {
  shape('circle', { cx: 50, cy: 50, r: 40, fill: 'none', stroke: '#2f5240', 'stroke-width': 13 }, parent);
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2, r = 40 + (i % 2 ? 4 : -4);
    leaf(parent, `translate(${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}) rotate(${(a * 180 / Math.PI + (i % 2 ? 35 : -35)).toFixed(0)}) scale(.3)`, ['#3f6653', '#4f7d68', '#5f8a70'][i % 3]);
  }
  for (const a of [-2.4, -.75, .55]) for (const [dx, dy] of [[0, 0], [4.5, 2], [1, 4.8]]) shape('circle', { cx: 50 + Math.cos(a) * 41 + dx - 2, cy: 50 + Math.sin(a) * 41 + dy - 2, r: 3.1, fill: '#c63a33' }, parent);
  portrait(shape('g', { transform: 'translate(19 18) scale(.62)' }, parent));
  bow(parent, 50, 86, .55);
}
// The note left on his chair, folded once: three lines of his hand and an S.
function chairSlip(parent) {
  shape('path', { d: 'M18 26L80 18 86 76 24 84Z', fill: '#fbf3df' }, parent);
  shape('path', { d: 'M51 22L55 80', stroke: '#e2d4b8', 'stroke-width': 2 }, parent);
  for (const [y, end] of [[38, 74], [50, 70], [62, 60]]) shape('path', { d: `M28 ${y + 2}Q${(28 + end) / 2} ${y - 3} ${end} ${y - 2}`, stroke: '#ad3c3b', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, parent);
  shape('path', { d: 'M70 70C64 66 62 74 68 74S72 82 64 80', stroke: '#ad3c3b', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, parent);
}

// `onOpen`: the portrait tapped while Santa is in (cabin-play.js then calls `open`); `onNote`: tapped while he is out.
export function mountCabinChat(stage, { onOpen = () => {}, onNote = () => {} } = {}) {
  const panel = element('aside', 'cabin-chat is-folded', stage); panel.setAttribute('aria-label', '和聖誕老人說話');
  const fold = element('button', 'chat-fold', panel); fold.type = 'button'; fold.setAttribute('aria-expanded', 'false'); fold.setAttribute('aria-label', '和聖誕老人說話');
  paperLayer(element('span', 'chat-avatar', fold), '0 0 100 100', '', wreathed, PAPER);
  const slip = element('span', 'chat-avatar chat-slip', fold); paperLayer(slip, '0 0 100 100', '', chairSlip, PAPER); slip.hidden = true;
  const card = element('div', 'chat-card', panel);
  const head = element('header', 'chat-head', card);
  paperLayer(element('span', 'chat-avatar', head), '0 0 100 100', '', wreathed, PAPER);
  element('p', 'chat-title', head, '聖誕老人');
  const close = element('button', 'chat-close', head, '收起'); close.type = 'button';
  const log = element('ol', 'chat-log', card); log.setAttribute('role', 'log');
  const asks = element('div', 'chat-asks', card);
  const form = element('form', 'chat-form', card); form.hidden = true;
  const label = element('label', 'sr-only', form, '寫給聖誕老人的話'); label.htmlFor = 'cabin-chat-input';
  const input = element('input', '', form); input.id = 'cabin-chat-input'; input.disabled = true;
  const send = element('button', 'chat-send', form, '寄出'); send.type = 'submit'; send.disabled = true;
  form.addEventListener('submit', event => event.preventDefault());
  let away = false, scene = null;

  // A line in the card, his or yours (the bubble's paper and tail tell them apart); only the last few stay.
  function line(text, mine = false) {
    const item = element('li', `chat-line ${mine ? 'from-me' : 'from-santa'}`, log);
    element('p', 'chat-bubble', item, text);
    while (log.children.length > 6) log.firstElementChild.remove();
    item.scrollIntoView({ block: 'nearest' });
  }
  // The paper tags under the lines: [words, what tapping them does].
  function choices(list) {
    asks.replaceChildren();
    for (const [words, then] of list) { const ask = element('button', 'chat-ask', asks, words); ask.type = 'button'; ask.addEventListener('click', then); }
    asks.querySelector('button')?.focus({ preventScroll: true });
  }
  function show() { panel.classList.remove('is-folded'); fold.setAttribute('aria-expanded', 'true'); }
  function hide() { panel.classList.add('is-folded'); fold.setAttribute('aria-expanded', 'false'); }
  // A scene goes on from where it was; otherwise the card opens afresh.
  fold.addEventListener('click', () => {
    if (!panel.classList.contains('is-folded')) return hide();
    if (scene) return show();
    if (away) onNote(); else onOpen();
  });
  close.addEventListener('click', () => { hide(); fold.focus({ preventScroll: true }); });

  // The scene's next line: his line and your reply to move on, or at the end his question and the choice.
  function step() {
    const { lines, last } = scene;
    if (scene.at < lines.length) {
      const [said, reply] = lines[scene.at];
      line(said); choices([[reply, () => { line(reply, true); scene.at += 1; step(); }]]);
      return;
    }
    line(last.line);
    choices(last.choices.map(({ text, reply, then }) => [text, () => { line(text, true); line(reply); asks.replaceChildren(); scene = null; then(); close.focus({ preventScroll: true }); }]));
  }
  return {
    // His line and the questions: [{ text, answer(), more() }]; asked, your question and his answer go into the card. A
    // question with nothing more to say is put away; when none is left he says `closing`, once.
    open({ said, questions, closing }) {
      if (scene) return show();
      log.replaceChildren(); line(said);
      const ask = () => {
        const left = questions.filter(question => question.more());
        if (!left.length) { line(closing); asks.replaceChildren(); close.focus({ preventScroll: true }); return; }
        choices(left.map(({ text, answer }) => [text, () => { line(text, true); line(answer()); ask(); }]));
      };
      ask(); show();
    },
    // A turn in the story: `lines` [[his line, your reply]], then `last` { line, choices: [{ text, reply, then }] }.
    scene(lines, last) { scene = { lines, last, at: 0 }; log.replaceChildren(); step(); show(); },
    get telling() { return Boolean(scene); },
    show,
    destroy() { panel.remove(); },
    // While Santa is out the corner shows his note instead, and an open card folds away.
    setAway(out) {
      away = out; slip.hidden = !out; fold.querySelector('.chat-avatar:not(.chat-slip)').hidden = out;
      fold.setAttribute('aria-label', out ? '看聖誕老人留下的紙條' : '和聖誕老人說話');
      if (out && !scene) hide();
    },
  };
}
