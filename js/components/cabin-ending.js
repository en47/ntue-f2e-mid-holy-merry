// The endings, each told in a little paper theatre over the whole page: the page goes dark, a pop-up diorama stands up a
// layer at a time (sky, hills, the village, the snow in front) and plays its scene, while the words are written in beside
// it a character at a time under the ending's title in paper letters. Skipping (the button or Esc) puts every piece where
// it ends; under reduced motion the scene simply stands finished. The pieces are in cabin-ending-art.js and their moves in
// santa.css; which ending, and when, is decided by cabin-story.js (through cabin-play.js).
import { mountTitleArt } from './title-art.js';
import { frame, goingHome, miracle, stayingOn, wishGranted } from './cabin-ending-art.js';
import { ENDINGS, HOLLY, THEATRE, WISHES } from '../data/cabin-finale.js';
import { MORNING } from '../data/cabin-secret.js';

const SCENES = { A: goingHome, B: wishGranted, C: stayingOn, D: miracle };
const PACE = .055, PAUSE = .6;
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };

// `next`: another ending follows this one (D after B or C), so the way out says so.
export function endingTheatre({ host, ending, mark = '', both = false, wish = null, sound, next = false, onClose = () => {} }) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, before = document.activeElement, timers = new Set();
  // The dialog itself takes the focus as it opens (Tab reaches 跳過 next), so nothing is ringed while the scene plays.
  const theatre = element('dialog', 'ending-theatre', host); theatre.dataset.ending = ending; theatre.tabIndex = -1;
  let started = 0, length = 0, playing = true;
  const after = (seconds, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, seconds * 1000); timers.add(id); };
  // A line written in a character at a time from `at` seconds (in someone's `hand`); screen readers get it whole.
  // Returns when it is done.
  function write(parent, className, text, at, { pace = PACE, hand } = {}) {
    const line = element('p', className, parent); element('span', 'sr-only', line, text); if (hand) line.dataset.hand = hand;
    const ink = element('span', 'theatre-ink', line); ink.setAttribute('aria-hidden', 'true');
    [...text].forEach((char, i) => { element('span', 'theatre-char', ink, char).style.setProperty('--at', `${(at + i * pace).toFixed(3)}s`); });
    return at + text.length * pace + PAUSE;
  }
  function build() {
    const { title, en, lines, sign } = ENDINGS[ending];
    theatre.replaceChildren(); theatre.className = 'ending-theatre'; theatre.setAttribute('aria-label', `${title}：${en}`);
    const skip = element('button', 'theatre-skip', theatre, THEATRE.skip); skip.type = 'button';
    const scene = element('div', 'theatre-scene', theatre); scene.setAttribute('aria-hidden', 'true');
    const play = SCENES[ending](scene, { mark, both, wish }); frame(scene);
    const words = element('div', 'theatre-words', theatre), heading = element('h2', 'theatre-title', words, en);
    mountTitleArt(heading, `ending-${ending.toLowerCase()}`);
    const art = heading.querySelector('.title-art'); art.style.maxWidth = `calc(5.6rem * ${art.style.aspectRatio})`;
    heading.querySelectorAll('.title-letter').forEach((letter, i) => { letter.style.animationDelay = ''; letter.style.setProperty('--drop', `${(1.2 + i * .07).toFixed(2)}s`); letter.style.setProperty('--wobble', `${-(i * 1.37) % 3.4}s`); });
    element('p', 'theatre-kicker', words, title);
    let at = play.text;
    for (const line of lines) at = write(words, 'theatre-line', line, at);
    if (sign) at = write(words, 'theatre-line theatre-sign', sign, at);
    // B: the note left by whoever granted the wish, once it is pinned up. C: the early shift, signed. D: Holly's letter,
    // then the last line, slowly, once the whole village is lit.
    if (ending === 'B') { const given = WISHES.find(each => each.id === wish) || WISHES[2]; at = write(words, 'theatre-line theatre-note', `「${given.note}」——\u00a0${given.by}`, Math.max(at, play.note), { hand: given.hand }); }
    if (ending === 'C') at = write(words, 'theatre-line theatre-log', `${MORNING.date}　${MORNING.shift}　${mark}.`, Math.max(at, play.log), { hand: 'you' });
    if (ending === 'D') {
      for (const line of [HOLLY.greeting(mark), HOLLY.body, both ? HOLLY.both : HOLLY.one]) at = write(words, 'theatre-line theatre-letter', line, at, { hand: 'h' });
      at = write(words, 'theatre-line theatre-letter theatre-sign', HOLLY.sign, at, { hand: 'h' });
      at = write(words, 'theatre-line theatre-last', THEATRE.last, Math.max(at, play.last), { pace: .14 });
    }
    length = Math.max(play.length, at + .4); theatre.style.setProperty('--end', `${length.toFixed(2)}s`);
    const actions = element('div', 'theatre-actions', words);
    const again = element('button', 'theatre-again', actions, THEATRE.again), close = element('button', 'theatre-close', actions, next ? THEATRE.next : THEATRE.close);
    again.type = 'button'; close.type = 'button';
    skip.addEventListener('click', finish);
    again.addEventListener('click', () => { sound.play('pick'); timers.forEach(clearTimeout); timers.clear(); build(); });
    close.addEventListener('click', () => end());
    started = performance.now(); playing = true;
    if (still) finish(); else after(length, done);
    // A little tune from the music box while the site's music is off (it slows and stops once the scene is over);
    // with the music on, a bell as the title falls in.
    sound.tune?.(() => !playing ? 0 : Math.max(0, Math.min(1, 1 - ((performance.now() - started) / 1000 - length) / 5)));
    if (sound.musicOn) after(1.2, () => sound.play('jingle'));
  }
  function done() {
    if (theatre.classList.contains('is-done')) return;
    theatre.classList.add('is-done');
    const active = document.activeElement;
    if (active === theatre || !theatre.contains(active) || active.classList.contains('theatre-skip')) theatre.querySelector('.theatre-close').focus({ preventScroll: true });
  }
  // Everything to where it ends: the finished pieces stop there, the snow and the waving go on.
  function finish() { theatre.classList.add('is-skipped'); started = performance.now() - length * 1000; timers.forEach(clearTimeout); timers.clear(); done(); }
  function end(chain = true) {
    if (!theatre.isConnected) return;
    playing = false; timers.forEach(clearTimeout); timers.clear();
    if (theatre.open) theatre.close();
    theatre.remove(); document.documentElement.classList.remove('theatre-open');
    if (before?.isConnected) before.focus({ preventScroll: true });
    sound.play('remove'); if (chain) onClose();
  }
  // Esc skips to the end, and once it is over goes back; it stops here, so the room behind keeps its own Esc.
  const escape = () => { if (theatre.classList.contains('is-done')) end(); else finish(); };
  theatre.addEventListener('keydown', event => { if (event.key !== 'Escape') return; event.preventDefault(); event.stopPropagation(); escape(); });
  theatre.addEventListener('cancel', event => { event.preventDefault(); escape(); });
  build();
  document.documentElement.classList.add('theatre-open');
  try { theatre.showModal(); } catch { theatre.setAttribute('open', ''); }
  (still ? theatre.querySelector('.theatre-close') : theatre).focus({ preventScroll: true });
  return { close: () => end(false) };
}
