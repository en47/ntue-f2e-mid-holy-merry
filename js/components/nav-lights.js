// Navigation as paper tags on a light string: each tag swings when touched, and a light runs from the last page's tag to this one.
import { paperLayer } from './paper-art.js';
import { tagArt } from './paper-props.js';
import { PENDULUM, pendulumStep } from '../data/paper-envelope-style.js';
import { NAV_STRING, nearestBulbs, stringBulbs, stringPins, travelBulbs, wireHeight, wirePath } from '../data/nav-string.js';

const NS = 'http://www.w3.org/2000/svg', LAST_PAGE = 'holy-merry:nav:last';
const COLOURS = ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec', '#f4c668'];
const TRAVEL_MS = 720, STEP_MS = 60, REVEAL_MS = 350, KICK = .8, NEIGHBOUR_KICK = .24, ARRIVAL_KICK = .55;
const compact = matchMedia('(max-width: 700px)'), motion = matchMedia('(prefers-reduced-motion: reduce)');

function remember(page) {
  try { const last = sessionStorage.getItem(LAST_PAGE); sessionStorage.setItem(LAST_PAGE, page); return last; }
  catch { return null; }
}
// Every tag shares the same two sheets of paper, so each colour is rasterised once.
function hangTag(host, sheet, label) {
  const tag = document.createElement('span'), drop = document.createElement('span'), cord = document.createElement('i');
  tag.className = 'nav-tag'; drop.className = 'nav-drop'; cord.className = 'nav-cord';
  drop.append(...[...sheet.children].map(paper => paper.cloneNode(true)), label);
  tag.append(cord, drop); host.replaceChildren(tag);
}
// The phone menu button hangs from the same string; its three lines fold into a cross while the menu is open.
function menuLabel(text) {
  const label = document.createElement('span'), icon = document.createElementNS(NS, 'svg'), words = document.createElement('span');
  label.className = 'nav-label menu-label'; icon.setAttribute('viewBox', '0 0 16 14'); icon.setAttribute('aria-hidden', 'true'); icon.classList.add('menu-icon');
  for (const y of [2, 7, 12]) { const line = document.createElementNS(NS, 'path'); line.setAttribute('d', `M2 ${y}H14`); icon.append(line); }
  words.textContent = text; label.append(icon, words);
  return label;
}
function buildTags(links, toggle) {
  if (links[0].querySelector('.nav-tag')) return;
  const sheet = document.createElement('div');
  paperLayer(sheet, '-8 -8 256 110', 'nav-paper nav-paper-cream', tagArt('#fbf3df', '#dccaa9'), { eager: true, paper: { grain: .6, shadow: .24 } });
  paperLayer(sheet, '-8 -8 256 110', 'nav-paper nav-paper-red', tagArt('#ad3c3b', '#87302f'), { eager: true, paper: { grain: .6, shadow: .24 } });
  for (const link of links) {
    const label = document.createElement('span'); label.className = 'nav-label'; label.textContent = link.textContent;
    hangTag(link, sheet, label);
  }
  if (toggle) { hangTag(toggle, sheet, menuLabel(toggle.textContent.replace('☰', '').trim())); toggle.classList.add('is-strung'); }
}

export function mountNavLights(nav) {
  const header = nav.closest('.site-header'), links = [...nav.querySelectorAll('a')];
  const current = links.find(link => link.getAttribute('aria-current') === 'page'), toggle = header?.querySelector('.menu-toggle');
  if (!header || !current) return { destroy() {} };
  buildTags(links, toggle); nav.classList.add('is-strung');
  const string = document.createElement('div'); string.className = 'nav-string'; string.setAttribute('aria-hidden', 'true');
  const wire = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
  wire.append(path); string.append(wire); header.prepend(string);

  const swings = new Map([...links, toggle].filter(Boolean).map(link => [link, { angle: 0, velocity: 0 }]));
  const events = new AbortController(), timers = new Set();
  let bulbs = [], frame = 0, lastTick = 0;
  const later = (run, delay) => { const id = setTimeout(() => { timers.delete(id); run(); }, delay); timers.add(id); };
  const tagCenter = link => {
    const box = header.getBoundingClientRect(), width = box.width;
    if (compact.matches) return width * (links.indexOf(link) + .5) / links.length;
    const rect = link.getBoundingClientRect();
    return rect.left + rect.width / 2 - box.left;
  };
  function layout() {
    const box = header.getBoundingClientRect(), shape = compact.matches ? NAV_STRING.compact : NAV_STRING.desktop;
    const pins = stringPins(links.map(tagCenter), box.width);
    wire.setAttribute('viewBox', `0 0 ${box.width} 40`);
    path.setAttribute('d', wirePath(pins, shape));
    bulbs.forEach(bulb => bulb.node.remove());
    bulbs = stringBulbs(pins, shape, box.width).map((point, index) => {
      const node = document.createElement('i'); node.className = 'nav-bulb';
      node.style.left = `${point.x}px`; node.style.top = `${point.y}px`; node.style.setProperty('--bulb', COLOURS[index % COLOURS.length]);
      string.append(node);
      return { ...point, node };
    });
    if (!compact.matches) for (const link of links) link.style.setProperty('--cord', `${link.getBoundingClientRect().top - box.top - shape.rise}px`);
    else links.forEach(link => link.style.removeProperty('--cord'));
    // The menu tag's cord ends exactly on the wire above it, wherever the curve sits.
    if (toggle && compact.matches) {
      const rect = toggle.getBoundingClientRect();
      toggle.style.setProperty('--cord', `${Math.max(8, rect.top - box.top - wireHeight(pins, shape, rect.left + rect.width / 2 - box.left))}px`);
    }
    if (!current.classList.contains('is-waiting')) lightCurrent();
  }
  function lightCurrent() { nearestBulbs(bulbs, tagCenter(current), 4).forEach(bulb => bulb.node.classList.add('is-lit')); }

  function tick(now) {
    const dt = Math.min((now - lastTick) / 1000, .033); lastTick = now;
    let moving = false;
    for (const [link, swing] of swings) {
      if (!swing.angle && !swing.velocity) continue;
      pendulumStep(swing, 0, dt);
      if (Math.abs(swing.angle) < .002 && Math.abs(swing.velocity) < .02) { swing.angle = swing.velocity = 0; link.firstChild.style.rotate = ''; continue; }
      moving = true; link.firstChild.style.rotate = `${swing.angle}rad`;
    }
    frame = moving ? requestAnimationFrame(tick) : 0;
  }
  function kick(link, velocity) {
    if (motion.matches) return;
    swings.get(link).velocity += velocity;
    if (!frame) { lastTick = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function touched(event) {
    const link = event.currentTarget, rect = link.getBoundingClientRect(), push = event.clientX < rect.left + rect.width / 2 ? -1 : 1;
    kick(link, push * KICK);
    const index = links.indexOf(link);
    if (index < 0) return;
    for (const near of [links[index - 1], links[index + 1]]) if (near) kick(near, push * NEIGHBOUR_KICK);
  }

  function travel(previous) {
    previous.classList.remove('was-current');
    const path = travelBulbs(bulbs, tagCenter(previous), tagCenter(current));
    const step = Math.min(STEP_MS, TRAVEL_MS / Math.max(path.length, 1));
    path.forEach((bulb, index) => { bulb.node.style.setProperty('--delay', `${index * step}ms`); bulb.node.classList.add('is-passing'); });
    later(() => {
      path.forEach(bulb => bulb.node.classList.remove('is-passing'));
      current.classList.remove('is-waiting'); current.classList.add('is-arriving');
      lightCurrent(); kick(current, ARRIVAL_KICK);
      later(() => current.classList.remove('is-arriving'), 600);
    }, path.length * step);
  }
  const page = current.getAttribute('href'), last = remember(page);
  const previous = last !== page && !motion.matches ? links.find(link => link.getAttribute('href') === last) : null;
  if (previous) { current.classList.add('is-waiting'); previous.classList.add('was-current'); }
  layout();
  const resize = new ResizeObserver(layout); resize.observe(header);
  if (previous) {
    const start = () => later(() => travel(previous), REVEAL_MS);
    if (document.documentElement.classList.contains('is-loading')) window.addEventListener('site-loader:done', start, { once: true, signal: events.signal });
    else start();
  }
  toggle?.addEventListener('pointerdown', touched, { signal: events.signal });
  for (const link of links) {
    link.addEventListener('pointerenter', touched, { signal: events.signal });
    link.addEventListener('click', event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) link.classList.add('is-pulled');
    }, { signal: events.signal });
  }
  document.fonts?.ready.then(() => { if (!events.signal.aborted) layout(); });
  return { destroy() {
    events.abort(); resize.disconnect(); cancelAnimationFrame(frame); frame = 0;
    timers.forEach(clearTimeout); timers.clear(); string.remove();
    for (const link of links) { link.classList.remove('is-pulled', 'is-waiting', 'is-arriving', 'was-current'); link.firstChild.style.rotate = ''; }
    if (toggle?.firstChild) toggle.firstChild.style.rotate = '';
  } };
}
