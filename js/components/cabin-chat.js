// The corner of the room kept for talking with Santa: a sheet of letter paper on the right (along the bottom on a phone),
// his lines on the left beside a little paper portrait, yours on the right, like a chat. Talking to him is still to come (an
// AI reply is planned), so for now he greets you and the writing line waits, switched off. It shows only once you are inside
// with the door shut (css/santa.css), and folds away to a tab for a clear look round the room.
import { paperLayer, shape } from './paper-art.js';

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

export function mountCabinChat(stage) {
  const panel = element('aside', 'cabin-chat', stage); panel.setAttribute('aria-label', '和聖誕老人聊天（準備中）');
  const head = element('header', 'chat-head', panel);
  paperLayer(element('span', 'chat-avatar', head), '0 0 100 100', '', portrait, PAPER);
  element('p', 'chat-title', head, '聖誕老人');
  const fold = element('button', 'chat-fold', head, '收起'); fold.type = 'button'; fold.setAttribute('aria-expanded', 'true');
  const log = element('ol', 'chat-log', panel); log.setAttribute('role', 'log');
  for (const text of ['外面很冷吧？快坐到火爐邊暖暖身子。', '再過不久，你就能在這張信紙上寫字跟我聊天了。']) {
    const line = element('li', 'chat-line from-santa', log);
    paperLayer(element('span', 'chat-avatar', line), '0 0 100 100', '', portrait, PAPER);
    element('p', 'chat-bubble', line, text);
  }
  // Where your own lines will go; a dashed outline only, nothing is put in your mouth.
  const yours = element('li', 'chat-line from-me is-example', log); yours.setAttribute('aria-hidden', 'true');
  element('p', 'chat-bubble', yours, '你寫的話會出現在這一邊');
  const form = element('form', 'chat-form', panel);
  const label = element('label', 'sr-only', form, '寫給聖誕老人的話'); label.htmlFor = 'cabin-chat-input';
  const input = element('input', '', form); input.id = 'cabin-chat-input'; input.disabled = true; input.placeholder = '聊天功能準備中';
  const send = element('button', 'chat-send', form, '寄出'); send.type = 'submit'; send.disabled = true;
  form.addEventListener('submit', event => event.preventDefault());
  fold.addEventListener('click', () => {
    const folded = panel.classList.toggle('is-folded');
    fold.textContent = folded ? '和聖誕老人聊聊 ✉' : '收起'; fold.setAttribute('aria-expanded', String(!folded));
  });
  // While Santa is out the letter waits for him: a line on his behalf, and his name marked out.
  const absent = element('li', 'chat-line from-santa is-away', log); absent.hidden = true;
  element('p', 'chat-bubble', absent, '（聖誕老人去看麋鹿了，搖椅上留了一張紙條。）');
  return {
    destroy() { panel.remove(); },
    setAway(away) { absent.hidden = !away; panel.classList.toggle('is-away', away); },
  };
}
