import { mountGameFrames } from './components/game-frames.js';
import { mountSleigh } from './components/game-sleigh.js';
import { mountWreath } from './components/game-wreath.js';
import { pauseOffscreen } from './components/paper-art.js';

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
  // Frameless iframe: 142px HUD/controls plus width * 510/1100.
  const reserve = sticky + outerHeight(flyingHeading) + outerHeight(flyingCaption) + edges + 142 + 32;
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
// Measure only the frameless game's outer content; its CSS and gameplay stay isolated.
const flyingFrame = document.querySelector('#flying-game');
let flyingContentObserver;
function fitFlyingFrame() {
  flyingContentObserver?.disconnect();
  const game = flyingFrame.contentDocument?.querySelector('.game');
  if (!game) return;
  function resize() {
    const height = Math.ceil(game.getBoundingClientRect().height);
    if (height > 0) flyingFrame.style.height = `${height}px`;
  }
  flyingContentObserver = new ResizeObserver(resize);
  flyingContentObserver.observe(game);
  resize();
}
flyingFrame.addEventListener('load', fitFlyingFrame);
fitFlyingFrame();
window.addEventListener('pagehide', () => flyingContentObserver?.disconnect());
window.addEventListener('pageshow', event => { if (event.persisted) fitFlyingFrame(); });
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

// Outer layout only: keep both paper panels tall enough for either game's
// natural iframe height. Mobile CSS releases the shared minimum height.
const gameFrames = [...page.querySelectorAll('.game-frame iframe')];
const panelSizeObserver = new ResizeObserver(() => {
  const height = Math.ceil(Math.max(...gameFrames.map(frame => frame.getBoundingClientRect().height)));
  page.style.setProperty('--game-panel-content-height', `${height}px`);
});
function observeGamePanels() { gameFrames.forEach(frame => panelSizeObserver.observe(frame)); }
observeGamePanels();
window.addEventListener('pagehide', () => panelSizeObserver.disconnect());
window.addEventListener('pageshow', event => { if (event.persisted) observeGamePanels(); });

const flyingSlot = document.querySelector('[data-illustration-slot="santa-flying"]');
const matchingSlot = document.querySelector('[data-illustration-slot="christmas-matching"]');
mountSleigh(flyingSlot);
mountWreath(matchingSlot);
const frames = [document.querySelector('#sleigh-game'), document.querySelector('#matching-game')];
mountGameFrames(...frames);
pauseOffscreen([flyingSlot, matchingSlot, ...frames]);
