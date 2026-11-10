// The little room behind the bookcase, looked into from its doorway. Its things can be picked up and read: the name tags,
// the shift log and the rulebook (these three tell the secret), and the register, the stamps, the hats and the sorting
// rack. Each opens as a sheet of paper over the scene. Once the three have been read, the visitor knows (cabin-story.js),
// and the register's newest page has a blank row they may sign to volunteer (`join`, `quit`: cabin-play.js).
import { SUBSTITUTES } from './cabin-art.js';
import { CLUES, TASKS, canSign, knowsSantas, points, signedUp } from '../services/cabin-story.js';
import { JOBS, MORNING, NAMES, NOTES, REGISTER, RULES, SHIFTS } from '../data/cabin-secret.js';

const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
// Each thing: the sheet it is on, where on that sheet ([left, top, right, bottom]), and its name.
const THINGS = {
  tags: ['secret-tags', [0, .15, 1, .95], '名牌板'], log: ['secret-log', undefined, '班表'], rules: ['secret-desk', [.27, .3, .5, .46], '守則小冊'],
  register: ['secret-desk', [.08, .18, .27, .44], '登記簿'], stamps: ['secret-desk', [.52, .2, .9, .45], '郵戳章'], hats: ['secret-hats', undefined, '聖誕帽'], rack: ['secret-rack', undefined, '分揀架'],
};

export function secretGame({ layer, stage, cabin, say, later, sound, progress, save, onKnow, onShut, join, quit }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const story = progress.story, volunteer = progress.volunteer, invited = () => knowsSantas(story.seen) && !signedUp(volunteer);
  say(knowsSantas(story.seen) ? `小房間裡還是老樣子：名牌、班表、守則，和那一排郵戳章。${invited() ? REGISTER.hint : ''}` : '書櫃後面是一個小房間。牆上掛著東西，桌上也擺著東西。');
  const buttons = Object.entries(THINGS).map(([id, [, , name]]) => {
    const button = element('button', 'secret-thing', layer); button.type = 'button'; button.dataset.id = id; button.setAttribute('aria-label', `看看${name}`);
    on(button, 'click', () => open(id, button)); return [id, button];
  });
  let card = null;
  // Out of the little room and the bookcase pushed shut behind you (only once you are clear of its swing).
  const leave = element('button', 'books-enter', layer, '離開，關上書櫃 ↺'); leave.type = 'button';
  on(leave, 'click', () => { cabin.setView('inside'); setTimeout(onShut, 1300); });
  // The view can be turned a little here (to see the side walls), so the buttons follow it every frame; one out of
  // sight is put away.
  let frame = 0;
  function layout() {
    const box = stage.getBoundingClientRect();
    for (const [id, button] of buttons) {
      const [sheet, place] = THINGS[id], rect = cabin.sheetRect(sheet, place);
      const seen = rect && rect.left + rect.width / 2 > 0 && rect.left + rect.width / 2 < box.width && rect.top + rect.height / 2 > 0 && rect.top + rect.height / 2 < box.height;
      button.hidden = !seen; if (!seen) continue;
      const w = Math.max(44, rect.width), h = Math.max(44, rect.height);
      Object.assign(button.style, { left: `${rect.left + rect.width / 2 - w / 2}px`, top: `${rect.top + rect.height / 2 - h / 2}px`, width: `${w}px`, height: `${h}px` });
      button.classList.toggle('is-read', story.seen.includes(id));
    }
  }
  function open(id, from) {
    card?.remove(); sound.play('open'); say('');
    card = element('article', 'cabin-letter secret-card', layer); card.setAttribute('aria-label', THINGS[id][2]);
    if (id === 'tags') {
      element('h3', 'secret-title', card, '名牌');
      const list = element('ul', 'secret-tags', card);
      for (const [char, colour] of SUBSTITUTES) { const item = element('li', '', list); const mark = element('span', 'secret-initial', item, `${char}.`); mark.style.color = colour; element('span', '', item, NAMES[char]); }
      element('p', 'secret-note', card, '最右邊還有一個空掛勾。');
    } else if (id === 'log') {
      element('h3', 'secret-title', card, '夜班交接表');
      const list = element('ol', 'secret-log', card);
      for (const [date, shift, sign, handover, hand] of SHIFTS) { const item = element('li', '', list); item.dataset.hand = hand; item.textContent = `${date}　${shift}　${sign}　${handover}`; }
      const morning = element('li', 'is-morning', list); morning.textContent = `${MORNING.date}　${MORNING.shift}　${progress.combos.includes('santa') ? MORNING.snowman : MORNING.empty}`;
    } else if (id === 'rules') {
      element('h3', 'secret-title', card, RULES.title);
      for (const line of RULES.lines) element('p', 'secret-rule', card, line);
      element('p', 'secret-note', card, RULES.margin);
    } else if (id === 'register' && knowsSantas(story.seen)) register(card, from);
    else element('p', 'secret-note', card, NOTES[id]);
    const done = element('button', 'cabin-letter-close', card, '放回去 ✓'); done.type = 'button';
    on(done, 'click', () => close(id, from)); done.focus({ preventScroll: true });
  }
  // The register's newest page: each substitute's stamps this season, then the visitor's row, or a blank one to sign.
  function register(card, from) {
    element('h3', 'secret-title', card, REGISTER.title);
    const list = element('ul', 'register-rows', card);
    const row = (mark, count, you = false) => {
      const item = element('li', you ? 'is-you' : '', list); item.dataset.hand = you ? 'you' : mark.toLowerCase();
      element('span', 'register-mark', item, `${mark}.${you ? REGISTER.you : ''}`);
      const stamps = element('span', 'register-stamps', item); stamps.setAttribute('aria-label', `${count}／${REGISTER.full} 個章`);
      for (let i = 0; i < REGISTER.full; i++) element('span', i < count ? 'is-stamped' : '', stamps);
    };
    for (const [mark, count] of REGISTER.rows) row(mark, count);
    if (signedUp(volunteer)) {
      row(volunteer.mark, points(volunteer), true);
      element('h4', 'register-heading', card, REGISTER.jobs);
      const jobs = element('ul', 'register-jobs', card);
      for (const task of TASKS) { const item = element('li', volunteer.tasks.includes(task) ? 'is-done' : '', jobs); element('strong', '', item, JOBS[task][0]); element('span', '', item, JOBS[task][1]); }
      // Leaving takes a second press, and keeps the stamps.
      const leave = element('button', 'register-leave', card, REGISTER.leave); leave.type = 'button';
      on(leave, 'click', () => {
        if (!leave.dataset.sure) { leave.dataset.sure = '1'; leave.textContent = '確定離開'; say(REGISTER.sure); return; }
        quit(); sound.play('remove'); open('register', from); say(REGISTER.left);
      });
      return;
    }
    element('p', 'secret-note', card, REGISTER.invite);
    const grid = element('div', 'register-letters', card); grid.setAttribute('aria-label', '選一個字母當你的縮寫');
    const sign = element('button', 'register-sign', card, REGISTER.sign); sign.type = 'button'; sign.disabled = true;
    let chosen = '';
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const tile = element('button', 'register-letter', grid, char); tile.type = 'button';
      if (!canSign(char)) { tile.disabled = true; tile.title = REGISTER.taken; tile.setAttribute('aria-label', `${char}（${REGISTER.taken}）`); continue; }
      tile.setAttribute('aria-pressed', 'false');
      on(tile, 'click', () => {
        chosen = char; sound.play('pick');
        for (const other of grid.children) if (other.hasAttribute('aria-pressed')) other.setAttribute('aria-pressed', String(other === tile));
        sign.disabled = false; sign.textContent = `${REGISTER.sign}：${char}.`;
      });
    }
    on(sign, 'click', () => { if (!chosen) return; join(chosen); sound.play('thud'); open('register', from); say(REGISTER.joined(chosen)); });
  }
  function close(id, from) {
    card?.remove(); card = null; sound.play('remove');
    const before = knowsSantas(story.seen);
    if (CLUES.includes(id) && !story.seen.includes(id)) { story.seen.push(id); save(); }
    layout(); from.focus({ preventScroll: true });
    // The first discovery: more than one Santa. Told once, quietly.
    if (!before && knowsSantas(story.seen)) { later(400, () => { sound.play('jingle'); say(NOTES.known); onKnow(); }); later(4600, () => { if (!card && invited()) say(REGISTER.hint); }); }
  }
  const follow = () => { layout(); frame = requestAnimationFrame(follow); };
  follow();
  return () => { events.abort(); cancelAnimationFrame(frame); card?.remove(); };
}
