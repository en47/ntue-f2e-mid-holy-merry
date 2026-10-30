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
// Both games load local, isolated documents. Never rewrite or reload their src.
// Game 01 measures only its outer text; its original responsive game stays isolated.
const flyingView = document.querySelector('.flying-view');
const flyingHeading = flyingView.querySelector('.game-section-heading');
const flyingCaption = flyingView.querySelector('.flying-caption');
const siteHeader = document.querySelector('.site-header');
function fitFlyingView() {
  const headerStyle = getComputedStyle(siteHeader);
  const sticky = ['sticky', 'fixed'].includes(headerStyle.position) ? siteHeader.getBoundingClientRect().height : 0;
  page.style.setProperty('--sticky-header-height', `${sticky}px`);
  const outerHeight = element => {
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  };
  const frameStyle = getComputedStyle(flyingView.querySelector('.fly-frame-shell'));
  const edges = parseFloat(frameStyle.paddingTop) + parseFloat(frameStyle.paddingBottom)
    + parseFloat(frameStyle.borderTopWidth) + parseFloat(frameStyle.borderBottomWidth);
  // Original iframe: 174px HUD/controls/border plus (width - 2) * 510/1100.
  const reserve = sticky + outerHeight(flyingHeading) + outerHeight(flyingCaption) + edges + 174 + 32;
  flyingView.style.setProperty('--fly-sticky-offset', `${sticky}px`);
  flyingView.style.setProperty('--fly-reserved-height', `${Math.ceil(reserve)}px`);
}
const flyingSizeObserver = new ResizeObserver(fitFlyingView);
function observeFlyingView() {
  [flyingHeading, flyingCaption, siteHeader].forEach(element => flyingSizeObserver.observe(element));
  fitFlyingView();
}
observeFlyingView();
window.addEventListener('resize', fitFlyingView);
window.addEventListener('pagehide', () => flyingSizeObserver.disconnect());
window.addEventListener('pageshow', event => { if (event.persisted) observeFlyingView(); });
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
