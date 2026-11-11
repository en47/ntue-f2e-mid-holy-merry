// The snow globe up close: the one on the mantel steps aside for one that can be shaken. Hold it and move it from side to
// side (or press the arrow keys): it tilts, the snow inside whirls up, and when let go it rocks back upright while the
// snow drifts down and settles at the foot of the little houses. Inside is the village as it was in 2003, too small to
// make out, and something too small to read is engraved on its base: the magnifier from the desk drawer (from the pocket,
// cabin-bag.js) shows both, close up on a card of its own.
import { paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';

const PAPER = { paper: { scale: .5, grain: .4, shadow: .2 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
// The globe in a 100 × 120 box: the dome (centre 50, 48, radius 46), the old village on a snowy mound (the cabin with a
// little room built on at its back left, one window lit, and a fir), the base.
const DOME = { x: 50, y: 48, r: 46 };
function cabin2003(parent, x, y, s) {
  shape('rect', { x: x - 13 * s, y: y - 14 * s, width: 9 * s, height: 10 * s, fill: '#87302f' }, parent);
  shape('path', { d: `M${x - 14 * s} ${y - 13.5 * s}L${x - 8.5 * s} ${y - 19 * s}L${x - 3 * s} ${y - 13.5 * s}Z`, fill: '#fbf8f1' }, parent);
  shape('rect', { x: x - 11 * s, y: y - 11.5 * s, width: 3.4 * s, height: 3.4 * s, fill: '#f4cf74' }, parent);
  shape('rect', { x: x - 6 * s, y: y - 18 * s, width: 24 * s, height: 18 * s, fill: '#a84a42' }, parent);
  shape('path', { d: `M${x - 10 * s} ${y - 17 * s}L${x + 6 * s} ${y - 32 * s}L${x + 22 * s} ${y - 17 * s}Z`, fill: '#fbf8f1' }, parent);
  shape('rect', { x: x + 3 * s, y: y - 11 * s, width: 7 * s, height: 11 * s, fill: '#6b4a33' }, parent);
}
function globe(parent) {
  shape('circle', { cx: DOME.x, cy: DOME.y, r: DOME.r, fill: '#c9dfea' }, parent);
  cabin2003(parent, 36, 72, 1);
  shape('path', { d: 'M60 72L69 42L78 72Z', fill: '#4f7d68' }, parent);
  shape('path', { d: 'M8 70Q50 62 92 70A46 46 0 0 1 8 70Z', fill: '#fbf8f1' }, parent);
  shape('path', { d: 'M10 120L16 92H84L90 120Z', fill: '#8f5a3c' }, parent);
  shape('rect', { x: 14, y: 90, width: 72, height: 5, rx: 2, fill: '#e0b04f' }, parent);
}
// Under the magnifier, 200 × 200: the old cabin large, the little room at its back left with its lit window plain to see.
function magnified(parent) {
  shape('circle', { cx: 100, cy: 100, r: 96, fill: '#dbeaf2' }, parent);
  shape('path', { d: 'M8 132Q100 112 192 132A96 96 0 0 1 8 132Z', fill: '#fbf8f1' }, parent);
  cabin2003(parent, 92, 136, 3.4);
  shape('path', { d: 'M150 136L166 70L182 136Z', fill: '#4f7d68' }, parent);
  for (const [x, y] of [[40, 50], [70, 34], [120, 46], [160, 40], [30, 90], [176, 96]]) shape('circle', { cx: x, cy: y, r: 2.6, fill: '#fff' }, parent);
}

export function globeGame({ layer, stage, cabin, say, later, sound, bag, onUse = () => {}, knows = () => false, knownLine = () => null, clue = () => {}, seen = () => false }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  say('按住雪花球左右搖一搖。');
  const holder = element('button', 'snow-globe', layer); holder.type = 'button'; holder.setAttribute('aria-label', '雪花球：按住左右搖晃，或按方向鍵左右');
  const tilt = element('span', 'globe-tilt', holder); paperLayer(tilt, '0 0 100 120', 'globe-art', globe, PAPER);
  const canvas = element('canvas', 'globe-snow', tilt); canvas.setAttribute('aria-hidden', 'true');
  element('span', 'globe-engraving', tilt, 'H. · 2003').setAttribute('aria-hidden', 'true');
  // A glint over the little houses once the snow has settled.
  const glint = element('span', 'globe-glint', tilt); glint.setAttribute('aria-hidden', 'true'); paperLayer(glint, '0 0 20 20', '', paper => star(paper, 10, 10, 8, '#fff4cc'), { paper: { scale: .15, grain: .2, shadow: 0, rim: '#ffffff00' }, eager: true });
  const context = canvas.getContext('2d');
  // Snow in dome units (the 100 × 120 box), as snow in water is: many small flat flakes and a few bigger ones, some nearer
  // the glass (bigger, brighter) and some further in. Each tumbles as it goes, a thin sliver edge-on and a bright one turned
  // flat to you, and sinks slowly, swaying; a shake sets the water turning and the snow goes round with it. Flakes come to
  // rest on the snowy mound (`ground`, the curve the art draws), where they start, and melt into it.
  const ground = x => 66 + 4 * ((x - DOME.x) / 42) ** 2, rest = (flake, i) => { flake.x = 12 + (i * 37 % 76); flake.y = ground(flake.x) + (i * 13 % 5) * .6; flake.vx = flake.vy = 0; flake.still = true; };
  const flakes = Array.from({ length: 180 }, (_, i) => {
    const near = Math.random(), flake = { near, r: (.35 + Math.random() ** 3 * 1.2) * (.75 + near * .5), turn: Math.random() * 6.3, spin: (Math.random() - .5) * 9, sway: Math.random() * 6.3, wobble: .7 + Math.random() * 1.6, drift: Math.random() * 6.3 };
    rest(flake, i); return flake;
  });
  // One soft flake, drawn once and stamped for every flake, and its shadow: a moving flake has a faint blue-grey shade
  // just below it, so it shows on the pale glass without an outline (a rim made them look like bubbles).
  const soft = colour => { const sprite = document.createElement('canvas'), pen = sprite.getContext('2d'), fill = pen.createRadialGradient(16, 16, 0, 16, 16, 16); sprite.width = sprite.height = 32;
    for (const [at, alpha] of [[0, 1], [.45, .9], [1, 0]]) fill.addColorStop(at, `rgba(${colour}, ${alpha})`);
    pen.fillStyle = fill; pen.fillRect(0, 0, 32, 32); return sprite; };
  const sprite = soft('255, 255, 255'), shadow = soft('84, 114, 142');
  // `churn` is how stirred up the water still is (0–1): while it lasts each flake wanders its own way through the whole
  // globe; as it calms they begin to sink.
  // `told`: whether this shake's settling has been told (once most of the snow is down, not waiting for the last flake).
  let angle = 0, swing = 0, frame = 0, last = 0, drag = null, scale = 1, stirred = 0, swirl = 0, churn = 0, told = false;
  const inside = flake => { const dx = flake.x - DOME.x, dy = flake.y - DOME.y; return Math.hypot(dx, dy) <= DOME.r - 3; };
  function layout() {
    const rect = cabin.globeRect(); if (!rect) return;
    const width = rect.width * 1.08, height = width * 1.2;
    Object.assign(holder.style, { left: `${rect.left + rect.width / 2 - width / 2}px`, top: `${rect.top + rect.height - height}px`, width: `${width}px`, height: `${height}px` });
    scale = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale); paint();
  }
  function paint() {
    const unit = canvas.width / 100, cx = DOME.x * unit, cy = DOME.y * unit, radius = (DOME.r - 1) * unit;
    context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height);
    context.save(); context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.clip();
    for (const flake of flakes) {
      const face = Math.abs(Math.cos(flake.turn)), size = flake.r * unit * 2.4, alpha = flake.still ? .55 : (.55 + flake.near * .45) * (.5 + face * .5);
      context.setTransform(1, 0, 0, 1, flake.x * unit, flake.y * unit); context.rotate(flake.sway + flake.turn * .3); context.scale(1, .22 + face * .78);
      if (!flake.still) { context.globalAlpha = alpha * .45; context.drawImage(shadow, -size / 2 + .3 * unit, -size / 2 + .5 * unit, size, size); }
      context.globalAlpha = alpha; context.drawImage(sprite, -size / 2, -size / 2, size, size);
    }
    context.setTransform(1, 0, 0, 1, 0, 0); context.globalAlpha = 1;
    // The glass: a little deeper in colour toward its rim, and a highlight lying over the snow.
    const rim = context.createRadialGradient(cx, cy, radius * .6, cx, cy, radius);
    rim.addColorStop(0, 'rgba(70, 102, 132, 0)'); rim.addColorStop(1, 'rgba(70, 102, 132, .2)');
    context.fillStyle = rim; context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    context.restore();
    context.strokeStyle = 'rgba(255, 255, 255, .5)'; context.lineWidth = 2.4 * unit; context.lineCap = 'round';
    context.beginPath(); context.arc(cx, cy, radius * .82, Math.PI * 1.08, Math.PI * 1.42); context.stroke();
  }
  // A shake of `push` (dome units per second, sideways) tosses every flake its own way, a little along the shake, so the
  // snow fills the globe instead of flying as one clump (or piling against the top); flakes lying on the mound are lifted
  // off it. It also churns the water, and sets it turning.
  function stir(push) {
    const strength = Math.max(-40, Math.min(40, push)); onUse(); told = false;
    swirl = Math.max(-1.2, Math.min(1.2, swirl + strength * .008)); churn = Math.min(1, churn + Math.abs(strength) / 40 * .3);
    for (const flake of flakes) {
      const toss = Math.abs(strength) * (.3 + Math.random() * .7), way = Math.random() * Math.PI * 2;
      flake.vx = flake.vx * .5 + strength * .35 + Math.cos(way) * toss;
      flake.vy = flake.vy * .5 + Math.sin(way) * toss - (flake.still ? 20 + Math.random() * 25 : Math.random() * 6); flake.still = false;
    }
    if (still()) { for (const flake of flakes) { flake.x = 14 + Math.random() * 72; flake.y = 14 + Math.random() * 60; } paint(); later(1200, () => { settle(); settled(); }); return; }
    run();
  }
  function settle() { flakes.forEach(rest); churn = swirl = 0; paint(); }
  // Settled: the little village glints; too small to make out without the magnifier.
  function settled() {
    say(knownLine() ?? (seen() ? (knows() ? '雪慢慢落定了。底座刻著「H. · 2003」——是荷莉。' : '雪慢慢落定了。球裡那座小小的舊村子，和底座的「H. · 2003」。') : '雪慢慢落定了。球裡是一座小小的聖誕村，小得看不清楚；底座上好像也刻著什麼。'));
    glint.classList.remove('is-on'); void glint.offsetWidth; glint.classList.add('is-on');
  }
  // The magnifier held to the glass (it goes back in the pocket): the village and the base, close up.
  let lens = null;
  function magnify() {
    if (frame && !told) { say('雪還在球裡打轉，等它落定再看。'); return; }
    lens?.remove(); sound.play('open'); clue('globe-village'); clue('globe-base');
    lens = element('article', 'cabin-letter lens-card', layer); lens.setAttribute('aria-label', '放大鏡下的雪花球');
    element('h3', 'chair-title', lens, '放大鏡下的雪花球');
    const view = element('div', 'lens-view', lens); view.setAttribute('role', 'img'); view.setAttribute('aria-label', '球裡的舊小屋，左後方多了一個有窗的小房間，窗裡亮著燈');
    paperLayer(view, '0 0 200 200', '', magnified, PAPER);
    element('p', 'lens-base', lens, 'H. · 2003');
    element('p', 'piece-words', lens, '球裡的舊小屋，左後方多了一個小房間，小窗裡亮著燈。底座刻著一行小字。');
    const done = element('button', 'cabin-letter-close', lens, '收起放大鏡 ✓'); done.type = 'button';
    on(done, 'click', () => { lens.remove(); lens = null; sound.play('remove'); holder.focus({ preventScroll: true }); });
    done.focus({ preventScroll: true });
  }
  const forget = bag.target(holder, { accepts: id => id === 'magnifier' || '這個對雪花球沒什麼用。', use: () => { later(450, magnify); } });
  function run() { if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } }
  function step(now) {
    const delta = Math.min(.05, (now - last) / 1000); last = now; let moving = Boolean(drag);
    // The globe rocks back upright like a weight on a spring; the water's turning slowly dies away.
    if (!drag) { swing += (-angle * 60 - swing * 7) * delta; angle += swing * delta; if (Math.abs(angle) > .1 || Math.abs(swing) > .5) moving = true; else { angle = 0; swing = 0; } }
    tilt.style.rotate = `${angle}deg`; swirl *= Math.exp(-1 * delta); churn *= Math.exp(-.95 * delta);
    for (const flake of flakes) {
      if (flake.still) continue;
      const dx = flake.x - DOME.x, dy = flake.y - DOME.y, flat = Math.abs(Math.cos(flake.turn));
      // Each flake drifts with the water: round the centre, its own wandering while the water is churned, and a sway; and
      // sinks, slower lying flat, and hardly at all while the water still churns.
      flake.drift += (Math.random() - .5) * 5 * delta;
      const sink = (10 + flake.r * 8) * (1 - .4 * flat) * (1 - .8 * churn), sway = Math.sin(now / 1000 * flake.wobble + flake.sway) * 3.5, wander = churn * 26;
      flake.vx += (-dy * swirl + Math.cos(flake.drift) * wander + sway - flake.vx) * Math.min(1, 2.2 * delta);
      flake.vy += (dx * swirl + (Math.sin(flake.drift) - .25) * wander + sink - flake.vy) * Math.min(1, 1.4 * delta);
      flake.turn += flake.spin * delta * (.35 + Math.min(1, Math.hypot(flake.vx, flake.vy) / 18));
      flake.x += flake.vx * delta; flake.y += flake.vy * delta;
      if (!inside(flake)) {
        const ex = flake.x - DOME.x, ey = flake.y - DOME.y, d = Math.hypot(ex, ey), limit = DOME.r - 3;
        flake.x = DOME.x + ex / d * limit; flake.y = DOME.y + ey / d * limit; flake.vx *= -.2; flake.vy *= -.2;
        // Against the lower glass it slides inward, down toward the mound.
        if (ey > 0) flake.vx -= Math.sign(ex) * 6;
      }
      // Falling onto the mound it comes to rest there. At the very edge the glass is lower than the mound, so a flake can
      // land on the glass's foot instead; it slides onto the mound's edge.
      const foot = DOME.y + Math.sqrt(Math.max(0, (DOME.r - 3) ** 2 - (flake.x - DOME.x) ** 2));
      if (flake.vy >= 0 && flake.y >= Math.min(ground(flake.x), foot - .5)) { flake.x = Math.max(14, Math.min(86, flake.x)); flake.y = ground(flake.x) + Math.random() * 3; flake.still = true; flake.vx = flake.vy = 0; }
      else moving = true;
    }
    paint();
    frame = moving ? requestAnimationFrame(step) : 0;
    if (!told && !drag && (!moving || flakes.filter(flake => flake.still).length >= flakes.length * .85)) { told = true; settled(); }
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
  on(holder, 'pointerup', letGo); on(holder, 'pointercancel', letGo); on(holder, 'lostpointercapture', letGo);
  on(holder, 'keydown', event => {
    const side = { ArrowLeft: -1, ArrowRight: 1 }[event.key] ?? (event.key === 'Enter' || event.key === ' ' ? 1 : 0);
    if (!side) return;
    event.preventDefault(); angle = side * 12; swing = 0; stir(side * 40); sound.play('pick');
  });

  cabin.showGlobe(false); layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); cancelAnimationFrame(frame); forget(); lens?.remove(); cabin.showGlobe(true); };
}
