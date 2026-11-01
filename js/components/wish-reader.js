// Opening a wish: the envelope flies in, the seal pops, and the letter unfolds on the same stationery visitors write on.
import { paperLayer, shape } from './paper-art.js';
import { airmailLetter, star, tagArt } from './paper-props.js';

const BOX = '-16 -16 432 302', CLOSE_MS = 520;
const SHEETS = { normal: { back: '#d9bf92', front: '#f3e3c2', flap: '#ecd6ab' }, gold: { back: '#cf9f47', front: '#f0cf83', flap: '#e9c265' } };
const paper = { paper: { scale: .9, grain: .4, shadow: .22 }, eager: true };

function buildEnvelope(host) {
  for (const [kind, colours] of Object.entries(SHEETS)) {
    const set = document.createElement('div'); set.className = `reader-set reader-${kind}`;
    paperLayer(set, BOX, 'reader-back', parent => shape('rect', { width: 400, height: 270, rx: 12, fill: colours.back }, parent), paper);
    paperLayer(set, BOX, 'reader-sheet', parent => {
      shape('rect', { x: 26, y: 12, width: 348, height: 226, rx: 4, fill: '#fdf6e6' }, parent);
      shape('rect', { x: 40, y: 26, width: 320, height: 198, rx: 3, fill: 'none', stroke: '#a84a42', 'stroke-width': 4, 'stroke-dasharray': '14 14' }, parent);
    }, paper);
    paperLayer(set, BOX, 'reader-front', parent => shape('path', { d: 'M0 34L200 168 400 34V258Q400 270 388 270H12Q0 270 0 258Z', fill: colours.front }, parent), paper);
    paperLayer(set, BOX, 'reader-flap', parent => shape('path', { d: 'M0 8Q0 0 8 0H392Q400 0 400 8L212 150Q200 158 188 150Z', fill: colours.flap }, parent), paper);
    paperLayer(set, BOX, 'reader-seal', parent => {
      shape('circle', { cx: 200, cy: 150, r: 30, fill: '#a84a42' }, parent);
      shape('circle', { cx: 200, cy: 150, r: 22, fill: 'none', stroke: '#fff3dc', 'stroke-opacity': .5, 'stroke-width': 2.5 }, parent);
      star(parent, 200, 150, 13, '#efc9b4');
    }, paper);
    host.append(set);
  }
}

export function mountWishReader(dialog) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), letter = dialog.querySelector('.reader-letter'), closeButton = dialog.querySelector('.reader-close');
  let timer = 0;
  buildEnvelope(dialog.querySelector('.reader-envelope'));
  paperLayer(letter, '0 0 380 300', 'reader-paper', airmailLetter('#a84a42', '#4f7d68', { writing: true }), { preserveAspectRatio: 'none', paper: { scale: .8, grain: .35, shadow: .24 }, eager: true });
  paperLayer(closeButton, '-8 -8 256 110', 'reader-close-art', tagArt('#a84a42', '#853a34'), { preserveAspectRatio: 'none', paper: { scale: .7, grain: .45, shadow: .24 }, eager: true });

  function finish() { clearTimeout(timer); timer = 0; dialog.classList.remove('is-opening', 'is-closing'); if (dialog.open) dialog.close(); }
  function close() {
    if (timer || !dialog.open) return;
    if (motion.matches) { finish(); return; }
    dialog.classList.remove('is-opening'); void dialog.offsetWidth; dialog.classList.add('is-closing');
    timer = setTimeout(finish, CLOSE_MS);
  }
  closeButton.addEventListener('click', close);
  // Escape and clicks outside the letter fold it away too, instead of snapping shut.
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog || event.target.classList.contains('reader-stage')) close(); });
  return {
    open({ own = false } = {}) {
      clearTimeout(timer); timer = 0; dialog.classList.remove('is-closing', 'is-opening');
      dialog.dataset.envelope = own ? 'gold' : 'normal';
      dialog.querySelector('.reader-message').scrollTop = 0;
      if (!dialog.open) dialog.showModal();
      letter.focus({ preventScroll: true });
      if (!motion.matches) { void dialog.offsetWidth; dialog.classList.add('is-opening'); }
    },
    destroy() { clearTimeout(timer); timer = 0; if (dialog.open) dialog.close(); },
  };
}
