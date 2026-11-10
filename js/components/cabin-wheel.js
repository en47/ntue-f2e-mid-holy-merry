// The big wheel's gearbox, mended up close. The wheel stands too far off to walk up to, so its gearbox is opened over the
// yard: a metal door swings aside on a dark panel with three empty pegs between the crank's gear and the wheel's. Loose
// gears wait in the toolbox, and the big one lies half buried in the snow where it fell. Put gears on the pegs (drag them,
// or press one and then a peg) and turn the crank (drag round it, or press the arrow keys or Enter): the gears that mesh
// turn, each the other way from the last, until the chain breaks off or jams; when it reaches the wheel, the wheel's
// lamps come on and it turns again. The rules (which gears mesh, how far the turning reaches) are in cabin-gears.js.
import { paperLayer, shape } from './paper-art.js';
import { CRANK, PEGS, PIECES, WHEEL, drive, link, radius } from '../services/cabin-gears.js';

const PAPER = { paper: { scale: .5, grain: .4, shadow: .2 }, eager: true };
// Gears are small drawings: a finer cut, so the paper's rim does not fill the gaps between their teeth.
const GEAR = { paper: { scale: .16, grain: .35, shadow: .3, rim: '#efe3cc' }, eager: true };
const W = 200, H = 170;
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const NAMES = { 8: '小齒輪', 12: '中齒輪', 15: '大齒輪', 19: '特大齒輪' };
const COLOURS = { s: '#9aa6b0', m: '#7b95a6', m2: '#7b95a6', l: '#b8734a', xl: '#c9a14a', wheel: '#a8593a', crank: '#6c7a85' };
// Where each loose gear waits: four in the toolbox, the big one in the snow at the corner.
const HOME = { s: [80, 150], m: [104, 150], l: [140, 150], m2: [178, 150], xl: [27, 150] };
// The crank turns this far, with the chain whole, before the wheel catches.
const CATCH = Math.PI * 3;
const HINTS = ['工具盒裡好像少了最大的那個……角落的雪堆裡，是不是埋著什麼？', '齒輪要剛好咬在一起：太大會擠住，太小碰不到。從曲柄旁邊開始，一格一格接上去。', '最靠近曲柄的那一格，放最小的齒輪。'];

// A gear in a box of its own, its centre in the middle: one tooth for each `teeth`, all teeth the same size, holes in the
// bigger ones, a hub and a bolt.
const reach = teeth => radius(teeth) + 1.3;
function cog(teeth, colour) {
  return parent => {
    const r = radius(teeth), root = r - 1.25, tip = r + 1.2, half = Math.PI / teeth;
    const at = (distance, angle) => `${(Math.cos(angle) * distance).toFixed(2)} ${(Math.sin(angle) * distance).toFixed(2)}`;
    let d = '';
    for (let k = 0; k < teeth; k++) { const a = k * 2 * half; d += `M${at(root, a - half * .55)}L${at(tip, a - half * .32)}L${at(tip, a + half * .32)}L${at(root, a + half * .55)}Z`; }
    shape('path', { d, fill: colour }, parent);
    shape('circle', { cx: 0, cy: 0, r: root + .2, fill: colour }, parent);
    shape('circle', { cx: 0, cy: 0, r: root - 1.4, fill: 'none', stroke: '#00000022', 'stroke-width': .8 }, parent);
    const holes = teeth >= 15 ? 5 : teeth >= 12 ? 4 : 0;
    for (let k = 0; k < holes; k++) { const a = k / holes * Math.PI * 2 + .3; shape('circle', { cx: Math.cos(a) * r * .55, cy: Math.sin(a) * r * .55, r: r * .15, fill: '#26313a' }, parent); }
    shape('circle', { cx: 0, cy: 0, r: Math.max(2.4, r * .24), fill: '#3b2a24' }, parent);
    shape('circle', { cx: 0, cy: 0, r: Math.max(1.1, r * .1), fill: '#d8c08a' }, parent);
  };
}
// The panel behind: dark painted metal, rivets, the crank's mounting plate; the toolbox's inside.
function panel(parent) {
  shape('rect', { x: 0, y: 0, width: W, height: H, fill: '#2f3d48' }, parent);
  for (let x = 20; x < W; x += 20) shape('path', { d: `M${x} 0V128`, stroke: '#ffffff0d', 'stroke-width': .6 }, parent);
  for (let y = 20; y < 128; y += 20) shape('path', { d: `M0 ${y}H${W}`, stroke: '#ffffff0d', 'stroke-width': .6 }, parent);
  for (const [x, y] of [[6, 6], [194, 6], [6, 122], [194, 122]]) { shape('circle', { cx: x, cy: y, r: 2.6, fill: '#8b97a0' }, parent); shape('circle', { cx: x - .6, cy: y - .6, r: 1, fill: '#c9d2d8' }, parent); }
  shape('circle', { cx: CRANK.at[0], cy: CRANK.at[1], r: 20, fill: '#26313a' }, parent);
  shape('rect', { x: 58, y: 130, width: 140, height: 40, rx: 4, fill: '#3b2a24' }, parent);
}
// In front: the toolbox's lip, and the snow drifted into the corner over the fallen gear.
function front(parent) {
  shape('rect', { x: 56, y: 156, width: 144, height: 14, rx: 3, fill: '#a84a42' }, parent);
  shape('rect', { x: 56, y: 156, width: 144, height: 3, fill: '#c46b5c' }, parent);
  shape('path', { d: 'M0 150C8 138 20 141 30 147S48 150 58 158V170H0Z', fill: '#fbf8f1' }, parent);
  shape('path', { d: 'M0 158C10 152 24 154 36 160S50 164 58 166V170H0Z', fill: '#e6eef2' }, parent);
}
// The big wheel's spokes round its hub (the wheel itself is far bigger than the panel); lamps on them light when it runs.
function spokes(parent) {
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; shape('path', { d: `M90 90L${90 + Math.cos(a) * 88} ${90 + Math.sin(a) * 88}`, stroke: '#ffffff26', 'stroke-width': 3 }, parent); }
  shape('circle', { cx: 90, cy: 90, r: 62, fill: 'none', stroke: '#ffffff1f', 'stroke-width': 2.4 }, parent);
}
function arm(parent) {
  shape('rect', { x: 46, y: 8, width: 8, height: 44, rx: 4, fill: '#4b3a30' }, parent);
  shape('circle', { cx: 50, cy: 50, r: 7, fill: '#d8c08a' }, parent);
  shape('circle', { cx: 50, cy: 10, r: 8, fill: '#a84a42' }, parent);
  shape('circle', { cx: 47.5, cy: 7.5, r: 2.6, fill: '#d97a6c' }, parent);
}

export function wheelGame({ layer, stage, cabin, say, later, sound, onMended, onClose }) {
  const events = new AbortController(), on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal: events.signal });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  say('');
  const box = element('article', 'gearbox', layer); box.setAttribute('aria-label', '摩天輪的動力箱');
  element('h3', 'gearbox-plaque', box, '摩天輪　動力箱');
  const guide = element('p', 'gearbox-guide', box, '輪軸和曲柄之間少了齒輪。把齒輪裝到三根軸釘上，再轉轉右下角的曲柄。');
  const board = element('div', 'gearbox-board', box);
  const place = (node, [x, y], size) => Object.assign(node.style, { left: `${(x - size) / W * 100}%`, top: `${(y - size) / H * 100}%`, width: `${size * 2 / W * 100}%`, height: `${size * 2 / H * 100}%` });
  paperLayer(element('span', 'gearbox-art', board), `0 0 ${W} ${H}`, '', panel, PAPER);
  // The wheel's hub and spokes (turning with its gear), its lamps, and its gear.
  const wheel = element('span', 'gearbox-spokes', board); place(wheel, WHEEL.at, 90); paperLayer(wheel, '0 0 180 180', '', spokes, PAPER);
  [150, 190, 230, 270, 310].forEach((deg, i) => { const lamp = element('span', 'gearbox-lamp', wheel), a = deg * Math.PI / 180; Object.assign(lamp.style, { left: `${50 + Math.cos(a) * 40 / 1.8}%`, top: `${50 + Math.sin(a) * 40 / 1.8}%`, animationDelay: `${i * .18}s` }); });
  const gear = (id, teeth, at) => { const node = element('span', 'gearbox-gear', board); place(node, at, reach(teeth)); paperLayer(node, `${-reach(teeth)} ${-reach(teeth)} ${reach(teeth) * 2} ${reach(teeth) * 2}`, '', cog(teeth, COLOURS[id]), GEAR); return node; };
  const wheelGear = gear('wheel', WHEEL.teeth, WHEEL.at), crankGear = gear('crank', CRANK.teeth, CRANK.at);
  Object.assign(element('span', 'gearbox-label', board, '輪軸').style, { left: `${WHEEL.at[0] / W * 100}%`, top: `${(WHEEL.at[1] + reach(WHEEL.teeth) + 1) / H * 100}%` });
  // The pegs: brass studs, each a button a gear can be put on.
  const pegs = PEGS.map((at, i) => {
    const peg = element('button', 'gearbox-peg', board); peg.type = 'button'; place(peg, at, 7);
    peg.setAttribute('aria-label', `軸釘${['一（靠輪軸）', '二（中間）', '三（靠曲柄）'][i]}`); return peg;
  });
  const pieces = PIECES.map(({ id, teeth, snow }) => {
    const node = element('button', `gearbox-piece${snow ? ' is-buried' : ''}`, board); node.type = 'button';
    paperLayer(node, `${-reach(teeth)} ${-reach(teeth)} ${reach(teeth) * 2} ${reach(teeth) * 2}`, '', cog(teeth, COLOURS[id]), GEAR);
    return { id, teeth, snow, node, peg: null, angle: 0 };
  });
  paperLayer(element('span', 'gearbox-art gearbox-front', board), `0 0 ${W} ${H}`, '', front, PAPER);
  element('span', 'gearbox-tray-label', board, '工具盒');
  // The crank: its gear sits under the handle; turn it by dragging round it (or its knob), or from the keyboard.
  const crank = element('button', 'gearbox-crank', board); crank.type = 'button'; place(crank, CRANK.at, 16);
  crank.setAttribute('aria-label', '曲柄：繞著它順時針拖曳，或按方向鍵右、Enter 轉半圈');
  const handle = element('span', 'gearbox-arm', board); place(handle, CRANK.at, 24); paperLayer(handle, '0 0 100 100', '', arm, PAPER);
  const knob = element('span', 'gearbox-knob', handle);
  const actions = element('div', 'gearbox-actions', box), hintButton = element('button', 'gearbox-hint', actions, '需要提示嗎？'), quit = element('button', 'gearbox-quit', actions, '先不修了');
  hintButton.type = quit.type = 'button'; hintButton.hidden = true;
  on(quit, 'click', () => onClose());
  // The gearbox's door swings open first.
  if (!still()) { const door = element('span', 'gearbox-door', board); element('span', 'gearbox-door-sign', door, '維修中'); on(door, 'animationend', () => door.remove()); }

  let crankAngle = 0, wheelAngle = 0, caught = 0, ticks = 0, mended = false, selected = null, tries = 0, hints = 0, spun = 0, frame = 0;
  const teethOnPegs = () => PEGS.map((_, i) => pieces.find(piece => piece.peg === i)?.teeth ?? null);
  // Where each gear stands and how it is turned: those the crank reaches are set tooth into gap from the one before.
  function draw() {
    for (const piece of pieces) {
      if (!piece.node.classList.contains('is-lifted')) place(piece.node, piece.peg === null ? HOME[piece.id] : PEGS[piece.peg], reach(piece.teeth));
      piece.node.classList.toggle('is-placed', piece.peg !== null); piece.node.classList.toggle('is-picked', piece === selected);
      piece.node.setAttribute('aria-label', `${NAMES[piece.teeth]}（${piece.teeth} 齒）${piece.peg !== null ? `，裝在軸釘${'一二三'[piece.peg]}上` : piece.node.classList.contains('is-buried') ? '，半埋在雪裡' : '，在工具盒裡'}`);
    }
    pegs.forEach((peg, i) => peg.classList.toggle('is-ready', Boolean(selected) && selected.peg !== i));
    const run = drive(teethOnPegs()), chain = [{ at: CRANK.at, teeth: CRANK.teeth, angle: crankAngle }];
    for (let k = 1; k < run.chain.length; k++) {
      const last = chain.at(-1), next = run.chain[k], toward = Math.atan2(next.at[1] - last.at[1], next.at[0] - last.at[0]);
      const angle = toward + Math.PI - (toward - last.angle) * last.teeth / next.teeth + Math.PI / next.teeth;
      const peg = PEGS.length - k, piece = peg >= 0 ? pieces.find(each => each.peg === peg) : null;
      if (piece) piece.angle = angle; else wheelAngle = angle;
      chain.push({ ...next, angle });
    }
    crankGear.style.rotate = handle.style.rotate = `${crankAngle}rad`;
    for (const piece of pieces) piece.node.style.rotate = `${piece.angle}rad`;
    wheelGear.style.rotate = wheel.style.rotate = `${wheelAngle}rad`;
    return run;
  }
  const flash = (node, className) => { if (still()) return; node.classList.remove(className); void node.offsetWidth; node.classList.add(className); later(700, () => node.classList.remove(className)); };
  // A gear put on a peg (a gear already there goes where this one came from), or back where it waits; then how it meets
  // its neighbours.
  function put(piece, peg) {
    const there = pieces.find(each => each.peg === peg && each !== piece);
    if (there) there.peg = piece.peg;
    piece.peg = peg; selected = null; piece.node.classList.remove('is-buried');
    const run = draw(), me = { at: PEGS[peg], teeth: piece.teeth };
    const near = [peg === 0 ? WHEEL : null, peg === PEGS.length - 1 ? CRANK : null, ...[peg - 1, peg + 1].map(i => { const each = pieces.find(other => other.peg === i); return each ? { at: PEGS[i], teeth: each.teeth } : null; })].filter(Boolean);
    const meets = near.map(other => link(me, other));
    if (meets.includes('jam')) { sound.play('nope'); flash(piece.node, 'is-jammed'); guide.textContent = `${NAMES[piece.teeth]}太大了，跟旁邊的齒輪擠在一起。`; }
    else if (meets.includes('mesh')) { sound.play('snap'); flash(piece.node, 'is-meshed'); guide.textContent = run.done ? '齒輪都接上了！轉轉曲柄試試看。' : `${NAMES[piece.teeth]}跟旁邊的齒輪咬上了。`; }
    else { sound.play('drop'); guide.textContent = near.length ? `${NAMES[piece.teeth]}碰不到旁邊的齒輪，中間空了一截。` : `${NAMES[piece.teeth]}裝上去了。`; }
  }
  function home(piece) { piece.peg = null; selected = null; sound.play('drop'); draw(); }

  // Gears by pointer: dragged near a peg they go on it; anywhere else back where they wait. A press picks one up; a press
  // on a peg (or on a gear already on a peg) puts it there.
  const units = event => { const rect = board.getBoundingClientRect(); return [(event.clientX - rect.left) / rect.width * W, (event.clientY - rect.top) / rect.height * H]; };
  const nearestPeg = ([x, y]) => { let best = -1, near = 16; PEGS.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < near) { near = d; best = i; } }); return best; };
  let drag = null, dragEnded = -Infinity;
  for (const piece of pieces) {
    on(piece.node, 'pointerdown', event => {
      if (event.button > 0 || mended) return;
      event.preventDefault(); try { piece.node.setPointerCapture(event.pointerId); } catch {}
      drag = { id: event.pointerId, piece, x: event.clientX, y: event.clientY, point: null };
    });
    on(piece.node, 'pointermove', event => {
      if (!drag || drag.piece !== piece || event.pointerId !== drag.id) return;
      if (!drag.point && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
      if (!drag.point) { piece.node.classList.add('is-lifted'); piece.node.classList.remove('is-buried'); sound.play('pick'); selected = null; draw(); }
      drag.point = units(event); place(piece.node, drag.point, reach(piece.teeth));
      const peg = nearestPeg(drag.point); pegs.forEach((each, i) => each.classList.toggle('is-near', i === peg));
    });
    // A release swallowed before it reaches the page (some browser extensions do that) still ends the drag (lostpointercapture).
    const drop = event => {
      if (!drag || drag.piece !== piece || event.pointerId !== drag.id) return;
      const { point } = drag; drag = null; piece.node.classList.remove('is-lifted'); pegs.forEach(each => each.classList.remove('is-near'));
      if (!point) return;
      dragEnded = performance.now();
      const peg = event.type === 'pointercancel' ? -1 : nearestPeg(event.type === 'lostpointercapture' ? point : units(event));
      if (peg >= 0) put(piece, peg); else home(piece);
    };
    on(piece.node, 'pointerup', drop); on(piece.node, 'pointercancel', drop); on(piece.node, 'lostpointercapture', drop);
    on(piece.node, 'click', () => {
      if (performance.now() - dragEnded < 350 || mended) return;
      if (selected && selected !== piece && piece.peg !== null) { put(selected, piece.peg); return; }
      selected = selected === piece ? null : piece; piece.node.classList.remove('is-buried');
      if (selected) { sound.play('pick'); guide.textContent = `拿起${NAMES[piece.teeth]}了，再點一根軸釘裝上去${piece.peg !== null ? '；再點它一次，就放回原位' : ''}。`; draw(); }
      else if (piece.peg !== null) home(piece);
      else draw();
    });
  }
  pegs.forEach((peg, i) => on(peg, 'click', () => { if (selected) put(selected, i); else guide.textContent = '先拿一個齒輪，再點軸釘。'; }));
  // Esc puts a picked gear down, or closes the gearbox (outside, the page has no step back to take).
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (selected) { selected = null; draw(); } else onClose();
  }, { capture: true, signal: events.signal });

  // The crank. Jammed, it will not move; otherwise it turns whatever meshes with it, and once the chain reaches the wheel
  // the wheel turns too, and after a turn and a half it catches.
  const where = ['曲柄空轉：靠曲柄的軸釘上，還沒有咬上的齒輪。', '曲柄帶動了第一個齒輪，可是中間那一格沒咬上。', '轉到中間就停了：靠輪軸的那一格沒咬上。', '三個齒輪都在轉，可是碰不到輪軸的齒輪。'];
  function turn(delta) {
    if (mended) return;
    const run = drive(teethOnPegs());
    if (run.stop === 'jam') {
      if (!crank.classList.contains('is-resisting')) { sound.play('nope'); tries++; offerHint(); }
      flash(crank, 'is-resisting'); flash(handle, 'is-resisting'); guide.textContent = '卡住了！有兩個齒輪擠在一起，曲柄轉不動。'; return;
    }
    crankAngle += delta; draw();
    for (const clicks = Math.floor(crankAngle / (Math.PI / 6)); ticks < clicks; ticks++) sound.tick();
    if (run.done) {
      caught += delta; guide.textContent = caught < CATCH / 2 ? '輪軸轉起來了……繼續轉！' : '再一下……';
      if (caught >= CATCH) mend();
      return;
    }
    spun += delta;
    if (spun > Math.PI) { spun = 0; tries++; guide.textContent = where[run.reach]; flash(run.at >= 0 ? pegs[run.at] : wheelGear, 'is-missing'); offerHint(); }
  }
  function offerHint() { if (tries >= 2 && hints < HINTS.length) hintButton.hidden = false; }
  on(hintButton, 'click', () => { guide.textContent = HINTS[hints++]; if (hints >= HINTS.length) hintButton.hidden = true; });
  later(40000, () => { if (!mended && hints < HINTS.length) hintButton.hidden = false; });
  function mend() {
    mended = true; crank.disabled = true; box.classList.add('is-running'); sound.play('jingle'); onMended();
    guide.textContent = '喀啦——輪軸咬住了！摩天輪的燈一盞盞亮起來，又慢慢轉起來了。'; say('摩天輪修好了，又慢慢地轉了起來。');
    hintButton.hidden = true; quit.textContent = '好了 ✓'; quit.focus({ preventScroll: true });
    if (still()) return;
    let last = performance.now();
    const run = now => { crankAngle += (now - last) / 1000 * .8; last = now; draw(); frame = requestAnimationFrame(run); };
    frame = requestAnimationFrame(run);
  }
  let winding = null;
  const startTurn = event => {
    if (event.button > 0 || mended) return;
    event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
    const rect = crankGear.getBoundingClientRect(); winding = { id: event.pointerId, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
    winding.last = Math.atan2(event.clientY - winding.cy, event.clientX - winding.cx); crank.classList.add('is-winding');
  };
  const moveTurn = event => {
    if (!winding || event.pointerId !== winding.id) return;
    const angle = Math.atan2(event.clientY - winding.cy, event.clientX - winding.cx), delta = wrap(angle - winding.last); winding.last = angle;
    // Clockwise on screen is a growing angle (y points down); the other way the ratchet holds.
    if (delta > 0) turn(delta);
  };
  // A release swallowed before it reaches the page still ends the turning (lostpointercapture).
  const endTurn = event => { if (!winding || event.pointerId !== winding.id) return; winding = null; crank.classList.remove('is-winding'); };
  for (const node of [crank, knob]) { on(node, 'pointerdown', startTurn); on(node, 'pointermove', moveTurn); on(node, 'pointerup', endTurn); on(node, 'pointercancel', endTurn); on(node, 'lostpointercapture', endTurn); }
  on(crank, 'keydown', event => { if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); for (let i = 0; i < 6; i++) turn(Math.PI / 12); } });
  draw();
  pieces[0].node.focus({ preventScroll: true });
  return () => { events.abort(); cancelAnimationFrame(frame); };
}
