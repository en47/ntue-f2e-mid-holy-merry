// 回到頁面頂端：圓形紙雕徽章疊在音樂按鈕正上方，中間是一支拐杖糖箭頭。
// 捲到看得見頁尾、而且已往下捲超過大半個畫面才淡入；不需要捲動的短頁面不出現。
import { holly, paperLayer, shape } from './paper-art.js';

const ARROW = 'M42 64V26M28 39 42 25 56 39';

function badge(parent) {
  shape('circle', { cx: 42, cy: 45, r: 40, fill: '#dccaa9' }, parent);
  shape('circle', { cx: 42, cy: 42, r: 40, fill: '#fbf3df' }, parent);
  shape('circle', { cx: 42, cy: 42, r: 34, fill: 'none', stroke: '#ad3c3b', 'stroke-opacity': .55, 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }, parent);
  holly(parent, 18, 16, .42);
}

// Candy cane: a red rim, white sugar, then red stripes laid along the same arrow.
function candyArrow(parent) {
  const stroke = (color, width, extra = {}) => shape('path', { d: ARROW, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }, parent);
  stroke('#87302f', 12);
  stroke('#fffaf0', 8.5);
  stroke('#c8463f', 8.5, { 'stroke-linecap': 'butt', 'stroke-dasharray': '5 5', 'stroke-dashoffset': 2 });
}

export function mountBackToTop() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return { destroy() {} };
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'back-to-top'; button.setAttribute('aria-label', '回到頁面頂端');
  const paper = { paper: { grain: .6, shadow: .26 }, eager: true };
  paperLayer(button, '-16 -16 116 116', 'back-to-top-badge', badge, paper);
  const arrow = paperLayer(button, '-16 -16 116 116', 'back-to-top-arrow', candyArrow, paper);
  document.body.append(button);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let footerSeen = false, frame = 0;
  const update = () => {
    frame = 0;
    const scrollable = document.documentElement.scrollHeight > innerHeight * 1.4;
    button.classList.toggle('is-shown', scrollable && footerSeen && scrollY > innerHeight * .6);
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(([entry]) => { footerSeen = entry.isIntersecting; queue(); });
  observer.observe(footer);
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);

  button.addEventListener('click', event => {
    if (!motion.matches) { arrow.classList.remove('is-launching'); void arrow.offsetWidth; arrow.classList.add('is-launching'); }
    scrollTo({ top: 0, behavior: motion.matches ? 'instant' : 'smooth' });
    // Keyboard activation (detail 0) moves focus back to the top, so the next Tab starts there; mouse clicks keep focus as is.
    if (event.detail === 0) document.querySelector('.brand')?.focus({ preventScroll: true });
  });
  arrow.addEventListener('animationend', () => arrow.classList.remove('is-launching'));

  return {
    destroy() {
      observer.disconnect(); cancelAnimationFrame(frame);
      removeEventListener('scroll', queue); removeEventListener('resize', queue);
      button.remove();
    },
  };
}
