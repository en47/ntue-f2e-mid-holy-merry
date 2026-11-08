// The snow globe up close: the one on the mantel steps aside for one that can be shaken. Hold it and move it from side to
// side (or press the arrow keys): it tilts, the snow inside whirls up, and when let go it rocks back upright while the
// snow drifts down and settles at the foot of the little house. Something is engraved on its base.
import { paperLayer, shape } from './paper-art.js';

const PAPER = { paper: { scale: .5, grain: .4, shadow: .2 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
// The globe in a 100 × 120 box: the dome (centre 50, 48, radius 46), a red house and a fir on a snowy mound, the base.
const DOME = { x: 50, y: 48, r: 46 };
function globe(parent) {
  shape('circle', { cx: DOME.x, cy: DOME.y, r: DOME.r, fill: '#c9dfea' }, parent);
  shape('rect', { x: 30, y: 52, width: 24, height: 20, fill: '#a84a42' }, parent);
  shape('path', { d: 'M26 53L42 38L58 53Z', fill: '#fbf8f1' }, parent);
  shape('rect', { x: 39, y: 61, width: 7, height: 11, fill: '#6b4a33' }, parent);
  shape('path', { d: 'M60 72L69 42L78 72Z', fill: '#4f7d68' }, parent);
  shape('path', { d: 'M8 70Q50 62 92 70A46 46 0 0 1 8 70Z', fill: '#fbf8f1' }, parent);
  shape('path', { d: 'M20 24A36 36 0 0 1 44 9', fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: .75 }, parent);
  shape('path', { d: 'M10 120L16 92H84L90 120Z', fill: '#8f5a3c' }, parent);
  shape('rect', { x: 14, y: 90, width: 72, height: 5, rx: 2, fill: '#e0b04f' }, parent);
}

export function globeGame({ layer, stage, cabin, say, later, sound, onUse = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  say('按住雪花球左右搖一搖。');
  const holder = element('button', 'snow-globe', layer); holder.type = 'button'; holder.setAttribute('aria-label', '雪花球：按住左右搖晃，或按方向鍵左右');
  const tilt = element('span', 'globe-tilt', holder); paperLayer(tilt, '0 0 100 120', 'globe-art', globe, PAPER);
  const canvas = element('canvas', 'globe-snow', tilt); canvas.setAttribute('aria-hidden', 'true');
  element('span', 'globe-engraving', tilt, 'H. · 2003').setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  // Snow in dome units (the 100 × 120 box): each flake has a place, a speed and a size. It comes to rest on the snowy
  // mound (`ground`, the curve the art draws), where it starts.
  const ground = x => 66 + 4 * ((x - DOME.x) / 42) ** 2, rest = (flake, i) => { flake.x = 12 + (i * 37 % 76); flake.y = ground(flake.x) + (i * 13 % 5) * .6; flake.vx = flake.vy = 0; flake.still = true; };
  const flakes = Array.from({ length: 70 }, (_, i) => { const flake = { r: 1.1 + (i % 4) * .4 }; rest(flake, i); return flake; });
  let angle = 0, swing = 0, frame = 0, last = 0, drag = null, scale = 1, stirred = 0;
  const inside = flake => { const dx = flake.x - DOME.x, dy = flake.y - DOME.y; return Math.hypot(dx, dy) <= DOME.r - 3; };
  function layout() {
    const rect = cabin.globeRect(); if (!rect) return;
    const width = rect.width * 1.08, height = width * 1.2;
    Object.assign(holder.style, { left: `${rect.left + rect.width / 2 - width / 2}px`, top: `${rect.top + rect.height - height}px`, width: `${width}px`, height: `${height}px` });
    scale = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale); paint();
  }
  function paint() {
    const unit = canvas.width / 100; context.clearRect(0, 0, canvas.width, canvas.height);
    context.save(); context.beginPath(); context.arc(DOME.x * unit, DOME.y * unit, (DOME.r - 1) * unit, 0, Math.PI * 2); context.clip();
    context.fillStyle = '#fff'; context.strokeStyle = 'rgba(96, 128, 156, .45)'; context.lineWidth = .35 * unit;
    // Flakes in the air have a faint edge against the glass; those lying on the mound melt into it.
    for (const flake of flakes) { context.beginPath(); context.arc(flake.x * unit, flake.y * unit, flake.r * unit, 0, Math.PI * 2); context.fill(); if (!flake.still) context.stroke(); }
    context.restore();
  }
  // Snow stirred by a shake of `push` (dome units per second, sideways): each flake takes it a little differently, so the
  // snow scatters instead of flying as one clump.
  function stir(push) {
    const strength = Math.max(-40, Math.min(40, push)); onUse();
    for (const flake of flakes) { flake.vx += strength * (.1 + Math.random() * .9) + (Math.random() - .5) * 24; flake.vy -= Math.abs(strength) * Math.random() * .55 + Math.random() * 14; flake.still = false; }
    if (still()) { for (const flake of flakes) { flake.x = 14 + Math.random() * 72; flake.y = 14 + Math.random() * 60; } paint(); later(1200, settle); return; }
    run();
  }
  function settle() { flakes.forEach(rest); paint(); }
  function run() { if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } }
  function step(now) {
    const delta = Math.min(.05, (now - last) / 1000); last = now; let moving = Boolean(drag);
    // The globe rocks back upright like a weight on a spring.
    if (!drag) { swing += (-angle * 60 - swing * 7) * delta; angle += swing * delta; if (Math.abs(angle) > .1 || Math.abs(swing) > .5) moving = true; else { angle = 0; swing = 0; } }
    tilt.style.rotate = `${angle}deg`;
    for (const flake of flakes) {
      if (flake.still) continue;
      flake.vy += 18 * delta; flake.vx *= 1 - 1.6 * delta; flake.vy *= 1 - .9 * delta;
      flake.vx += Math.sin(now / 500 + flake.r * 9 + flake.x) * 14 * delta;
      flake.x += flake.vx * delta; flake.y += flake.vy * delta;
      if (!inside(flake)) {
        const dx = flake.x - DOME.x, dy = flake.y - DOME.y, d = Math.hypot(dx, dy), limit = DOME.r - 3;
        flake.x = DOME.x + dx / d * limit; flake.y = DOME.y + dy / d * limit; flake.vx *= -.3; flake.vy *= -.3;
      }
      // Falling onto the mound, it comes to rest there.
      if (flake.vy >= 0 && flake.y >= ground(flake.x)) { flake.y = ground(flake.x) + Math.random() * 4; flake.still = true; flake.vx = flake.vy = 0; }
      else moving = true;
    }
    paint();
    frame = moving ? requestAnimationFrame(step) : 0;
    if (!moving) say('雪慢慢落定了。底座上好像刻著什麼。');
  }
  on(holder, 'pointerdown', event => {
    if (event.button > 0) return;
    event.preventDefault(); holder.setPointerCapture(event.pointerId); holder.classList.add('is-held');
    drag = { id: event.pointerId, x: event.clientX, lastX: event.clientX, time: performance.now() }; run();
  });
  on(holder, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const now = performance.now(), speed = (event.clientX - drag.lastX) / Math.max(.008, (now - drag.time) / 1000);
    drag.lastX = event.clientX; drag.time = now;
    angle = Math.max(-16, Math.min(16, (event.clientX - drag.x) * .18));
    // A shake stirs the snow at most every tenth of a second, so a long shake does not fling it all against the glass.
    if (Math.abs(speed) > 120 && now - stirred > 100) { stirred = now; stir(speed / 40); sound.play('pick'); }
  });
  const letGo = event => { if (!drag || event.pointerId !== drag.id) return; drag = null; holder.classList.remove('is-held'); run(); };
  on(holder, 'pointerup', letGo); on(holder, 'pointercancel', letGo);
  on(holder, 'keydown', event => {
    const side = { ArrowLeft: -1, ArrowRight: 1 }[event.key] ?? (event.key === 'Enter' || event.key === ' ' ? 1 : 0);
    if (!side) return;
    event.preventDefault(); angle = side * 12; swing = 0; stir(side * 40); sound.play('pick');
  });

  cabin.showGlobe(false); layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); cancelAnimationFrame(frame); cabin.showGlobe(true); };
}
