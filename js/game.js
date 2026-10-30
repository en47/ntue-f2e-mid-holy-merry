const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Progressive enhancement: content stays visible if JS/IntersectionObserver fails.
const page = document.querySelector('.games-page');
const reveals = [...page.querySelectorAll('[data-reveal]')];
let observer;
function revealAll() { observer?.disconnect(); page.classList.remove('reveal-ready'); reveals.forEach(element => element.classList.add('is-visible')); }
function setupReveals() {
  if (motion.matches || !('IntersectionObserver' in window)) { revealAll(); return; }
  page.classList.add('reveal-ready');
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  reveals.forEach(element => observer.observe(element));
}
motion.addEventListener('change', revealAll);
setupReveals();
window.addEventListener('pagehide', () => observer?.disconnect());
window.addEventListener('pageshow', event => {
  if (event.persisted) revealAll();
});
// Game 01 keeps its permanent GitHub Pages URL. Never rewrite or reload its src.
// Only the same-origin local Game 02 is measured; no cross-origin game access.
const matchingFrame = document.querySelector('#matching-frame');
let sizeObserver;
function fitMatchingFrame() {
  sizeObserver?.disconnect();
  const body = matchingFrame.contentDocument?.body;
  if (!body?.querySelector('#matching-app')) return;
  function resize() {
    const height = Math.ceil(body.getBoundingClientRect().height) + 2;
    if (height >= 100 && height <= 1800) matchingFrame.style.height = `${height}px`;
  }
  sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(body);
  resize();
}
matchingFrame.addEventListener('load', fitMatchingFrame);
fitMatchingFrame();
window.addEventListener('pagehide', () => sizeObserver?.disconnect());
window.addEventListener('pageshow', event => { if (event.persisted) fitMatchingFrame(); });
