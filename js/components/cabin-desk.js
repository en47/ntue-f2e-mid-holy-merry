// The writing desk up close. Take a letter from the bundle and it comes to the middle of the desk: open it, read it, turn it
// over to see who dealt with it, put it back. Drag the postmark stamp onto an envelope's postage stamp to cancel it, and the
// wax seal onto the reply waiting in the rack to close it (or press Enter on either). Stamped and sealed stay so.
import { paperLayer, shape } from './paper-art.js';
import { DESK_LETTERS, REPLY } from '../data/cabin-letters.js';
import { NAMES } from '../data/cabin-secret.js';
import { knowsSantas } from '../services/cabin-story.js';

const PAPER = { paper: { scale: .6, grain: .45, shadow: .2 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const centre = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const near = (point, rect, pad) => rect && point.x >= rect.left - pad && point.x <= rect.left + rect.width + pad && point.y >= rect.top - pad && point.y <= rect.top + rect.height + pad;
// The two tools as they look in the hand, each in a 100 × 100 box: a rubber stamp on a turned handle, a brass seal.
const TOOLS = {
  stamp: parent => { shape('circle', { cx: 50, cy: 18, r: 14, fill: '#8f5a3c' }, parent); shape('rect', { x: 43, y: 28, width: 14, height: 40, fill: '#a86b47' }, parent); shape('rect', { x: 24, y: 66, width: 52, height: 16, rx: 4, fill: '#8f5a3c' }, parent); shape('rect', { x: 26, y: 82, width: 48, height: 10, rx: 3, fill: '#8f3b36' }, parent); },
  seal: parent => { shape('circle', { cx: 50, cy: 16, r: 12, fill: '#a86b47' }, parent); shape('rect', { x: 42, y: 24, width: 16, height: 46, rx: 8, fill: '#8f5a3c' }, parent); shape('path', { d: 'M32 70H68L72 90H28Z', fill: '#e0b04f' }, parent); },
};

export function deskGame({ layer, stage, cabin, say, later, sound, progress, save, onUse = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const local = rect => { const box = stage.getBoundingClientRect(); return { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height }; };
  const at = event => { const box = stage.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
  const desk = progress.desk;
  say('書桌上堆著一疊信。從信堆抽一封來看看；郵戳和火漆也可以拿起來用。');

  const pick = (label, run) => { const button = element('button', 'desk-pick', layer); button.type = 'button'; button.setAttribute('aria-label', label); on(button, 'click', run); return button; };
  const stack = pick('從信堆抽一封信', () => take(DESK_LETTERS[next++ % DESK_LETTERS.length], stack));
  const outbox = pick('拿起架上等著寄出的回信', () => take(REPLY, outbox));
  const tools = Object.fromEntries(Object.keys(TOOLS).map(kind => {
    const button = element('button', `desk-tool desk-${kind}`, layer); button.type = 'button';
    button.setAttribute('aria-label', kind === 'stamp' ? '郵戳：拖到信封的郵票上蓋章（也可以按 Enter）' : '火漆印：拖到回信的封口上（也可以按 Enter）');
    return [kind, button];
  }));
  // The letter on the desk: its envelope (flap, address, postage stamp, the postmark once stamped, the wax once sealed),
  // the letter itself with a front and a back, and what can be done with it.
  const work = element('div', 'desk-work', layer); work.hidden = true;
  const envelope = element('div', 'desk-envelope', work);
  const flap = element('span', 'envelope-flap', envelope), from = element('p', 'envelope-from', envelope), to = element('p', 'envelope-to', envelope);
  const postage = element('span', 'envelope-stamp', envelope), postmark = element('span', 'envelope-postmark', envelope, '北極郵局\n12 · 25'), wax = element('span', 'envelope-wax', envelope, 'S');
  for (const node of [flap, postage, postmark, wax]) node.setAttribute('aria-hidden', 'true');
  const letter = element('article', 'desk-letter', work), front = element('div', 'letter-face', letter), body = element('p', 'letter-body', front);
  const back = element('div', 'letter-face letter-back', letter), note = element('p', 'letter-note', back), sign = element('p', 'letter-sign', back), dated = element('p', 'letter-date', back);
  const actions = element('div', 'desk-actions', work);
  const action = (text, run) => { const button = element('button', '', actions, text); button.type = 'button'; on(button, 'click', run); return button; };
  const openButton = action('打開信', open), flipButton = action('翻到背面', flip), closeButton = action('收進信封', close), returnButton = action('放回去', putBack);
  let current = null, next = 0;

  function layout() {
    const rects = cabin.deskRects(); if (!rects) return;
    const place = (node, rect, least) => { const w = Math.max(least, rect.width), h = Math.max(least, rect.height); Object.assign(node.style, { left: `${rect.left + rect.width / 2 - w / 2}px`, top: `${rect.top + rect.height / 2 - h / 2}px`, width: `${w}px`, height: `${h}px` }); };
    place(stack, rects.stack, 48); place(outbox, rects.outbox, 48);
    for (const [kind, button] of Object.entries(tools)) if (!button.classList.contains('is-dragging')) place(button, rects[kind], 52);
  }
  function refresh() {
    const { entry, outgoing, open: opened, reading } = current;
    work.classList.toggle('is-reading', reading); envelope.dataset.open = String(opened);
    const sealed = outgoing && desk.sealed;
    postmark.hidden = outgoing || !desk.stamped.includes(entry.id); postage.hidden = outgoing; wax.hidden = !sealed;
    openButton.hidden = reading || sealed; openButton.textContent = outgoing ? '讀一讀回信' : '打開信';
    flipButton.hidden = !reading || outgoing; closeButton.hidden = !reading; returnButton.hidden = reading; returnButton.textContent = outgoing ? '放回架上' : '放回去';
  }
  // The envelope flies from where it was picked up to the middle of the desk, and back again.
  function fly(rect, away) {
    if (still() || !rect) { if (away) work.hidden = true; return; }
    const box = stage.getBoundingClientRect(), mine = work.getBoundingClientRect(), target = centre(rect);
    const offset = `translate(${target.x - (mine.left - box.left + mine.width / 2)}px, ${target.y - (mine.top - box.top + mine.height / 2)}px) scale(.2)`;
    if (away) { work.style.transform = offset; work.style.opacity = '0'; later(380, () => { work.hidden = true; work.style.transform = work.style.opacity = ''; }); return; }
    work.style.transition = 'none'; work.style.transform = offset; work.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { work.style.transition = work.style.transform = work.style.opacity = ''; }));
  }
  function take(entry, source) {
    if (current) { current.source.focus({ preventScroll: true }); return; }
    const outgoing = entry === REPLY;
    current = { entry, outgoing, source: source, open: outgoing && !desk.sealed, reading: false };
    from.textContent = outgoing ? '寄件：北極' : `寄件：${entry.from}`; to.textContent = entry.to;
    body.textContent = entry.body; letter.classList.remove('is-flipped'); flipButton.textContent = '翻到背面';
    if (!outgoing) { note.textContent = entry.back.note; sign.textContent = `—— ${entry.back.sign}`; dated.textContent = entry.back.date; back.dataset.hand = entry.back.hand; }
    work.hidden = false; refresh(); fly(local(source.getBoundingClientRect()), false); sound.play('pick');
    say(outgoing ? (desk.sealed ? '這封回信已經用火漆封好了，等著寄出。' : '架上這封回信還沒封口。讀完可以用火漆封起來。') : `信封上寫著：${entry.from}。`);
    (openButton.hidden ? returnButton : openButton).focus({ preventScroll: true });
  }
  function open() {
    current.open = true; current.reading = true; refresh(); sound.play('open'); say(''); onUse();
    if (!still()) { letter.classList.remove('is-unfolding'); void letter.offsetWidth; letter.classList.add('is-unfolding'); }
    (current.outgoing ? closeButton : flipButton).focus({ preventScroll: true });
  }
  function flip() {
    const flipped = letter.classList.toggle('is-flipped'); sound.play('remove');
    flipButton.textContent = flipped ? '翻回正面' : '翻到背面';
    // Once the little room behind the bookcase has been seen, the initial has a name.
    if (flipped) say(knowsSantas(progress.story.seen) ? `背面簽著「${current.entry.back.sign}」——是名牌上的${NAMES[current.entry.back.sign[0]]}。` : '背面有人寫了一行小字，還簽了名。');
  }
  function close() { current.reading = false; letter.classList.remove('is-flipped'); flipButton.textContent = '翻到背面'; refresh(); sound.play('remove'); returnButton.focus({ preventScroll: true }); }
  function putBack() {
    const { source } = current; current = null; sound.play('remove'); say('');
    fly(local(source.getBoundingClientRect()), true); source.focus({ preventScroll: true });
  }

  // The tools: drag one onto its place on the envelope (or press Enter with the right envelope on the desk).
  const targetOf = kind => {
    if (!current || current.reading) return null;
    if (kind === 'stamp' && !current.outgoing) return postage;
    if (kind === 'seal' && current.outgoing && !desk.sealed) return flap;
    return null;
  };
  function use(kind) {
    const target = targetOf(kind);
    if (!target) {
      sound.play('nope');
      say(kind === 'stamp' ? '先從信堆抽一封信，再把郵戳蓋在信封的郵票上。' : '火漆是用來封回信的：先拿起架上那封還沒封口的回信。');
      return false;
    }
    if (kind === 'stamp') {
      if (desk.stamped.includes(current.entry.id)) { say('這封已經蓋過郵戳了。'); return true; }
      desk.stamped.push(current.entry.id); save(); sound.play('thud'); refresh(); pop(postmark); say('咚！郵戳蓋好了：北極郵局，12 月 25 日。');
    } else {
      desk.sealed = true; current.open = false; save(); sound.play('click'); later(120, () => sound.play('thud')); refresh(); pop(wax); say('火漆壓好了，回信封得牢牢的，可以寄出了。');
      returnButton.focus({ preventScroll: true });
    }
    return true;
  }
  const pop = node => { if (still()) return; node.classList.remove('is-new'); void node.offsetWidth; node.classList.add('is-new'); };
  for (const [kind, button] of Object.entries(tools)) {
    let drag = null, dragged = false;
    on(button, 'pointerdown', event => {
      if (event.button > 0) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); dragged = false;
      drag = { id: event.pointerId, from: at(event), ghost: null };
    });
    on(button, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const point = at(event);
      if (!drag.ghost) {
        if (Math.hypot(point.x - drag.from.x, point.y - drag.from.y) < 6) return;
        drag.ghost = element('div', 'desk-ghost', layer); paperLayer(drag.ghost, '0 0 100 100', '', TOOLS[kind], PAPER); button.classList.add('is-dragging'); sound.play('pick');
      }
      drag.ghost.style.translate = `${point.x - 40}px ${point.y - 70}px`;
      const target = targetOf(kind); target?.classList.toggle('is-target', near(point, local(target.getBoundingClientRect()), 24));
    });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { ghost } = drag; drag = null; button.classList.remove('is-dragging');
      for (const node of [postage, flap]) node.classList.remove('is-target');
      if (!ghost) return;
      dragged = true;
      const target = targetOf(kind), hit = event.type === 'pointerup' && target && near(at(event), local(target.getBoundingClientRect()), 24);
      if (hit) { ghost.classList.add('is-pressing'); use(kind); later(260, () => ghost.remove()); } else { sound.play('drop'); ghost.remove(); }
    };
    on(button, 'pointerup', drop); on(button, 'pointercancel', drop);
    on(button, 'click', () => { if (dragged) { dragged = false; return; } use(kind); });
  }

  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); };
}
