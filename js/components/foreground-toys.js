// One interactive centrepiece per page footer. Each sheet is cut once; only compositor layers move.
import { holly, paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';

const PAPER = { scale: .8, grain: .5, shadow: .2 };
const motion = () => matchMedia('(prefers-reduced-motion: reduce)');
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
function toyButton(host, label) { const button = element('button', 'toy-button', host); button.type = 'button'; button.setAttribute('aria-label', label); return button; }

function sled(host) {
  const button = toyButton(host, '推雪橇出發');
  paperLayer(button, '0 -10 260 160', 'toy-sled', parent => {
    shape('path', { d: 'M28 134H190C216 134 232 118 240 96', stroke: '#a9845b', 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, parent);
    shape('path', { d: 'M62 134V106M170 134V106', stroke: '#a9845b', 'stroke-width': 8, fill: 'none' }, parent);
    shape('path', { d: 'M28 80H224L206 112H46Z', fill: '#a8564c' }, parent);
    shape('path', { d: 'M28 80C60 70 190 70 224 80 220 88 34 88 28 80Z', fill: '#fbf8f1' }, parent);
    shape('rect', { x: 50, y: 22, width: 72, height: 58, rx: 5, fill: '#e9d9b8' }, parent);
    shape('rect', { x: 78, y: 22, width: 16, height: 58, fill: '#b5625a' }, parent);
    shape('rect', { x: 128, y: 42, width: 62, height: 38, rx: 5, fill: '#8aa9ad' }, parent);
    shape('rect', { x: 152, y: 42, width: 14, height: 38, fill: '#f3e7cf' }, parent);
    star(parent, 86, 16, 15);
  }, { paper: PAPER, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    if (run) return;
    if (motion().matches) return;
    const box = button.getBoundingClientRect(), sheet = button.firstElementChild;
    // Two separate trips: it never crosses the page backwards while changing sides.
    const out = innerWidth - box.left + 30, back = box.right + 30;
    run = sheet.animate([{ transform: 'none' }, { transform: `translateX(${out}px)` }], { duration: 1600, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
    await run.finished.catch(() => {});
    const trip = run; run = sheet.animate([{ transform: `translateX(${-back}px)` }, { transform: 'none' }], { duration: 1800, easing: 'cubic-bezier(.15,.5,.3,1)' });
    trip.cancel();
    await run.finished.catch(() => {}); run = null;
  });
}

function globe(host) {
  const button = toyButton(host, '轉動地球儀');
  paperLayer(button, '0 0 200 230', 'toy-globe-base', parent => {
    shape('path', { d: 'M62 226H138L122 204H78Z', fill: '#94785f' }, parent);
    shape('path', { d: 'M100 206V176', stroke: '#94785f', 'stroke-width': 10, fill: 'none' }, parent);
    shape('path', { d: 'M28 40A100 100 0 0 0 100 192', stroke: '#b98a45', 'stroke-width': 7, fill: 'none' }, parent);
    shape('circle', { cx: 112, cy: 100, r: 80, fill: '#a8c6cc' }, parent);
  }, { paper: PAPER, eager: true });
  // Two identical strips of land slide behind a round window, so a turn never shows a seam.
  const window = element('span', 'toy-globe-window', button), strip = element('span', 'toy-globe-lands', window);
  paperLayer(strip, '0 0 480 160', '', parent => {
    for (const dx of [0, 240]) {
      shape('path', { d: `M${dx + 24} 50C${dx + 56} 26 ${dx + 92} 34 ${dx + 96} 66 ${dx + 78} 92 ${dx + 42} 90 ${dx + 24} 50Z`, fill: '#6f9676' }, parent);
      shape('path', { d: `M${dx + 136} 84C${dx + 164} 74 ${dx + 192} 92 ${dx + 182} 120 ${dx + 160} 142 ${dx + 136} 124 ${dx + 136} 84Z`, fill: '#6f9676' }, parent);
      shape('path', { d: `M${dx + 150} 24C${dx + 170} 16 ${dx + 200} 22 ${dx + 204} 40 ${dx + 186} 54 ${dx + 156} 46 ${dx + 150} 24Z`, fill: '#5f8a70' }, parent);
    }
  }, { paper: { ...PAPER, shadow: 0 }, eager: true });
  const card = paperLayer(host, '0 0 110 80', 'toy-postcard', parent => {
    shape('rect', { x: 8, y: 8, width: 94, height: 64, rx: 4, fill: '#fbf4e6' }, parent);
    shape('rect', { x: 70, y: 16, width: 22, height: 26, fill: '#b5544c' }, parent);
    shape('path', { d: 'M18 26H58M18 42H58M18 58H44', stroke: '#c9b79c', 'stroke-width': 4, fill: 'none' }, parent);
  }, { paper: PAPER, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    if (run) return;
    if (motion().matches) return;
    run = strip.animate([{ transform: 'none' }, { transform: 'translateX(-50%)' }], { duration: 1100, iterations: 2, easing: 'linear' });
    card.animate([{ opacity: 0, transform: 'translate(-50%, 40%) rotate(0) scale(.3)' }, { opacity: 1, offset: .25 }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(70%, -170%) rotate(14deg) scale(1)' }], { duration: 2200, easing: 'ease-out' });
    await run.finished.catch(() => {}); run = null;
  });
}

const PRIZES = [
  parent => star(parent, 100, 60, 34),
  parent => {
    shape('path', { d: 'M100 26C80 28 76 48 74 64 72 74 66 80 64 86H136C134 80 128 74 126 64 124 48 120 28 100 26Z', fill: '#d9a441' }, parent);
    shape('circle', { cx: 100, cy: 94, r: 9, fill: '#a84a42' }, parent);
  },
  parent => {
    shape('circle', { cx: 100, cy: 74, r: 26, fill: '#fbf8f1' }, parent);
    shape('circle', { cx: 100, cy: 38, r: 18, fill: '#fbf8f1' }, parent);
    for (const x of [93, 107]) shape('circle', { cx: x, cy: 34, r: 2.8, fill: '#3b2a22' }, parent);
    shape('path', { d: 'M100 40L116 44 100 46Z', fill: '#d9823f' }, parent);
  },
];
const CONFETTI = ['#a84a42', '#4f7d68', '#d9a441', '#7fa3a8', '#efdcae'];

// Each scrap keeps its sideways speed while gravity bends its path into a parabola.
function throwScrap(host, index) {
  const scrap = element('i', 'toy-scrap', host);
  scrap.style.background = CONFETTI[index % CONFETTI.length];
  const side = (index - 7.5) / 7.5, speed = 90 + Math.random() * 70, spin = 360 + Math.random() * 500;
  const frames = Array.from({ length: 9 }, (_, step) => {
    const t = step / 8, x = side * 150 * t, y = -speed * 2 * t + speed * 2.5 * t * t;
    return { transform: `translate(${x}px, ${y}px) rotate(${spin * t}deg)`, opacity: t > .85 ? 0 : 1 };
  });
  scrap.animate(frames, { duration: 1500, easing: 'linear' }).finished.catch(() => {}).finally(() => scrap.remove());
}

function surpriseBox(host) {
  const button = toyButton(host, '打開驚喜禮物盒'), paper = { paper: PAPER, eager: true };
  const prizes = PRIZES.map(draw => paperLayer(button, '0 0 200 190', 'toy-prize', draw, paper));
  paperLayer(button, '0 0 200 190', 'toy-box', parent => {
    shape('rect', { x: 34, y: 92, width: 132, height: 92, rx: 5, fill: '#a84a42' }, parent);
    shape('rect', { x: 88, y: 92, width: 24, height: 92, fill: '#efdcae' }, parent);
  }, paper);
  const lid = paperLayer(button, '0 0 200 190', 'toy-lid', parent => {
    shape('rect', { x: 24, y: 68, width: 152, height: 30, rx: 5, fill: '#b5604a' }, parent);
    shape('rect', { x: 88, y: 68, width: 24, height: 30, fill: '#efdcae' }, parent);
    shape('path', { d: 'M100 68C66 36 48 62 100 68C152 62 134 36 100 68Z', fill: '#efdcae' }, parent);
  }, paper);
  let busy = false, last = -1;
  button.addEventListener('click', async () => {
    if (busy || motion().matches) return;
    busy = true; host.classList.add('is-open');
    let index = Math.floor(Math.random() * prizes.length);
    if (index === last) index = (index + 1) % prizes.length;
    last = index;
    for (let scrap = 0; scrap < 16; scrap++) throwScrap(host, scrap);
    const up = lid.animate([{ transform: 'none' }, { transform: 'translate(24%, -62%) rotate(26deg)', offset: .22 }, { transform: 'translate(24%, -62%) rotate(26deg)', offset: .8 }, { transform: 'none' }], { duration: 1900, easing: 'ease-in-out' });
    prizes[index].animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'translateY(-44%) scale(1.08)', offset: .22 }, { opacity: 1, transform: 'translateY(-36%)', offset: .34 }, { opacity: 1, transform: 'translateY(-36%)', offset: .72 }, { opacity: 0, transform: 'translateY(40%)' }], { duration: 1900, easing: 'ease-out' });
    await up.finished.catch(() => {});
    host.classList.remove('is-open'); busy = false;
  });
}

function wishingStar(host) {
  const sky = element('span', 'toy-sky', host);
  paperLayer(sky, '0 0 300 120', '', parent => { for (const [x, y, size] of [[30, 60, 7], [84, 22, 5], [214, 28, 6], [272, 70, 7], [150, 12, 4]]) star(parent, x, y, size, '#f3df9e'); }, { paper: null, eager: true });
  const button = toyButton(host, '對星星許個願');
  paperLayer(button, '0 0 100 100', 'toy-star', parent => star(parent, 50, 52, 42, '#f4cf74'), { paper: { ...PAPER, rim: '#fff3cf', shadow: 0 }, eager: true });
  const streak = paperLayer(host, '0 0 220 70', 'toy-meteor', parent => {
    shape('path', { d: 'M8 12C70 24 130 40 190 54L188 62C130 50 70 34 8 12Z', fill: '#f7e9b8' }, parent);
    star(parent, 194, 56, 13, '#fff3cf');
  }, { paper: null, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    host.classList.remove('is-wishing'); void host.offsetWidth; host.classList.add('is-wishing');
    if (run || motion().matches) return;
    run = streak.animate([{ opacity: 0, transform: 'translate(-120%, -120%) rotate(-4deg)' }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(120%, 120%) rotate(-4deg)' }], { duration: 1500, easing: 'ease-in' });
    await run.finished.catch(() => {}); run = null;
  });
}

// Santa's Cabin: a sleigh bell that swings and throws paper confetti when rung.
function jingleBell(host) {
  const button = toyButton(host, '搖響雪橇鈴鐺');
  // The bell hangs from a short post set in the snow, so it is grounded like everything else in the footer.
  paperLayer(button, '0 0 200 200', 'toy-bell-post', parent => {
    shape('ellipse', { cx: 118, cy: 196, rx: 70, ry: 8, fill: '#c9d7e1', opacity: .7 }, parent);
  }, { paper: null, eager: true });
  const bell = paperLayer(button, '0 0 200 200', 'toy-bell', parent => {
    shape('path', { d: 'M72 30C72 6 128 6 128 30', stroke: '#87302f', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }, parent);
    shape('path', { d: 'M100 32C62 32 50 68 48 106 46 130 36 142 28 150H172C164 142 154 130 152 106 150 68 138 32 100 32Z', fill: '#e0b04f' }, parent);
    shape('path', { d: 'M100 32C126 32 140 62 144 102 146 128 156 142 166 150H140C134 134 132 112 128 86 124 58 116 38 100 32Z', fill: '#c08a3e', opacity: .55 }, parent);
    shape('ellipse', { cx: 80, cy: 74, rx: 10, ry: 22, fill: '#f6dc96', opacity: .85 }, parent);
    shape('rect', { x: 24, y: 148, width: 152, height: 16, rx: 8, fill: '#c08a3e' }, parent);
    shape('circle', { cx: 100, cy: 174, r: 14, fill: '#a9782a' }, parent);
    holly(parent, 100, 40, .8);
  }, { paper: PAPER, eager: true });
  let run = null;
  button.addEventListener('click', async () => {
    if (run || motion().matches) return;
    for (let scrap = 0; scrap < 12; scrap++) throwScrap(host, scrap + 2);
    run = bell.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-16deg)', offset: .2 }, { transform: 'rotate(13deg)', offset: .45 }, { transform: 'rotate(-8deg)', offset: .68 }, { transform: 'rotate(4deg)', offset: .85 }, { transform: 'rotate(0deg)' }], { duration: 1100, easing: 'ease-out' });
    await run.finished.catch(() => {}); run = null;
  });
}

// Christmas Market: a lottery drum of paper on a wooden stand. A press turns it once round (or it is turned by hand,
// dragged round its hub: once all the way round does it); a ball drops out of its mouth, rolls into the tray, and the
// prize it stands for comes up out of the tray: the four things the vending machine sells, or, now and then, a gold star.
const VIEW = [240, 220], HUB = [104, 92], MOUTH = [104, 160];
const BALLS = [
  { colour: '#e0b04f', name: '金色', prize: '金星', odds: .1 },
  { colour: '#b5443c', name: '紅色', prize: '聖誕襪', odds: .225 },
  { colour: '#4f7d68', name: '綠色', prize: '聖誕樹', odds: .225 },
  { colour: '#fbf7ee', name: '白色', prize: '雪人', odds: .225 },
  { colour: '#a8693f', name: '棕色', prize: '薑餅人', odds: .225 },
];
const LOTTERY_PRIZES = [
  parent => star(parent, 180, 108, 22, '#f2c75c'),
  parent => { shape('path', { d: 'M170 84H190V112L198 120C204 126 196 136 188 130L172 118C168 115 170 110 170 106Z', fill: '#b5443c' }, parent); shape('rect', { x: 166, y: 78, width: 28, height: 10, rx: 4, fill: '#fbf7ee' }, parent); },
  parent => { for (const [y, w] of [[82, 16], [96, 24], [110, 32]]) shape('path', { d: `M180 ${y - 14}L${180 + w / 2} ${y + 6}H${180 - w / 2}Z`, fill: '#4f7d68' }, parent); shape('rect', { x: 176, y: 116, width: 8, height: 8, fill: '#8a5a3c' }, parent); star(parent, 180, 66, 6, '#f2c75c'); },
  parent => { shape('circle', { cx: 180, cy: 112, r: 13, fill: '#fbf7ee' }, parent); shape('circle', { cx: 180, cy: 90, r: 9, fill: '#fbf7ee' }, parent); for (const x of [177, 183]) shape('circle', { cx: x, cy: 88, r: 1.4, fill: '#3b2a22' }, parent); shape('path', { d: 'M180 91L187 93 180 94Z', fill: '#d9823f' }, parent); shape('path', { d: 'M171 98H189V101H171Z', fill: '#b5443c' }, parent); },
  parent => { shape('path', { d: 'M180 74A8 8 0 1 1 179.9 74ZM172 86H188L198 96 194 100 188 96V108L194 124 188 126 180 112 172 126 166 124 172 108V96L166 100 162 96Z', fill: '#a8693f' }, parent); for (const y of [92, 100]) shape('circle', { cx: 180, cy: y, r: 1.6, fill: '#fbf7ee' }, parent); },
];
function lottery(host) {
  const button = toyButton(host, '轉動抽獎機'), paper = { paper: PAPER, eager: true }, box = `0 0 ${VIEW.join(' ')}`;
  const note = element('p', 'sr-only', host); note.setAttribute('aria-live', 'polite');
  // Behind: the wooden stand under snow, the upright that holds the drum, the back of the tray.
  paperLayer(button, box, 'toy-lottery-stand', parent => {
    shape('ellipse', { cx: 132, cy: 214, rx: 104, ry: 7, fill: '#c9d7e1', opacity: .7 }, parent);
    shape('path', { d: 'M96 92L84 196H124L112 92Z', fill: '#a9845b' }, parent);
    shape('rect', { x: 26, y: 192, width: 196, height: 20, rx: 4, fill: '#b98a5e' }, parent);
    shape('path', { d: 'M24 194C60 184 100 190 132 186S196 184 224 194L222 200H26Z', fill: '#fbf8f1' }, parent);
    shape('ellipse', { cx: 172, cy: 186, rx: 48, ry: 13, fill: '#e9dcc4' }, parent);
  }, paper);
  // The drum: an octagon of red card with a cream face, a gold rim, the arrow that says which way it goes, the crank
  // on its hub; all of it turns about the hub.
  const drum = paperLayer(button, box, 'toy-lottery-drum', parent => {
    const octagon = r => Array.from({ length: 8 }, (_, i) => { const a = (i + .5) * Math.PI / 4; return `${(HUB[0] + Math.cos(a) * r).toFixed(1)} ${(HUB[1] + Math.sin(a) * r).toFixed(1)}`; }).join('L');
    shape('path', { d: `M${octagon(72)}Z`, fill: '#b5443c' }, parent);
    shape('path', { d: `M${octagon(64)}Z`, fill: '#fbf3df' }, parent);
    shape('path', { d: `M${octagon(58)}Z`, fill: 'none', stroke: '#e0b04f', 'stroke-width': 3 }, parent);
    shape('path', { d: `M${HUB[0] - 36} ${HUB[1] - 30}Q${HUB[0]} ${HUB[1] - 56} ${HUB[0] + 34} ${HUB[1] - 32}L${HUB[0] + 30} ${HUB[1] - 42}L${HUB[0] + 48} ${HUB[1] - 26}L${HUB[0] + 26} ${HUB[1] - 20}L${HUB[0] + 30} ${HUB[1] - 26}Q${HUB[0]} ${HUB[1] - 44} ${HUB[0] - 32} ${HUB[1] - 22}Z`, fill: '#b5443c' }, parent);
    holly(parent, HUB[0] - 30, HUB[1] + 34, .55); holly(parent, HUB[0] + 30, HUB[1] + 34, .55);
    shape('path', { d: `M${HUB[0]} ${HUB[1]}L${HUB[0] - 40} ${HUB[1] + 22}`, stroke: '#8a6a4a', 'stroke-width': 7, 'stroke-linecap': 'round' }, parent);
    shape('circle', { cx: HUB[0] - 40, cy: HUB[1] + 22, r: 9, fill: '#fbf3df' }, parent);
  }, { ...paper, origin: HUB });
  // The hub's cap stays put (gold, with a star).
  paperLayer(button, box, 'toy-lottery-hub', parent => { shape('circle', { cx: HUB[0], cy: HUB[1], r: 13, fill: '#e0b04f' }, parent); star(parent, HUB[0], HUB[1], 7, '#fbf3df'); }, paper);
  // The prizes (each comes up over the tray, clear of the drum), a ball of each colour (one shown at a time), the tray's
  // front lip over it.
  const prizes = LOTTERY_PRIZES.map(draw => paperLayer(button, box, 'toy-lottery-prize', parent => draw(shape('g', { transform: 'translate(204 100) scale(1.35) translate(-180 -100)' }, parent)), paper));
  const balls = BALLS.map(({ colour }) => paperLayer(button, box, 'toy-lottery-ball', parent => { shape('circle', { cx: MOUTH[0], cy: MOUTH[1], r: 7, fill: colour }, parent); shape('circle', { cx: MOUTH[0] - 2.4, cy: MOUTH[1] - 2.4, r: 2.2, fill: '#ffffff', opacity: .7 }, parent); }, { paper: { ...PAPER, shadow: .1 }, eager: true }));
  paperLayer(button, box, 'toy-lottery-lip', parent => { shape('path', { d: 'M124 188C140 204 204 204 220 186L220 194C204 210 140 210 124 196Z', fill: '#fbf3df' }, parent); }, paper);
  const pct = ([x, y]) => `${(x / VIEW[0] * 100).toFixed(2)}% ${(y / VIEW[1] * 100).toFixed(2)}%`;
  // Where the ball goes: out of the mouth, a bounce on the tray, rolling to rest at its far side.
  const path = [[0, 0], [22, 16], [44, 28], [56, 24], [66, 30], [72, 30]];
  let angle = 0, busy = false, shown = -1, grip = null;
  const turnTo = value => { angle = value; drum.style.rotate = `${angle}deg`; };
  const pick = () => { let r = Math.random(); for (const [i, ball] of BALLS.entries()) { r -= ball.odds; if (r < 0) return i; } return BALLS.length - 1; };
  async function drop() {
    const index = pick(), ball = balls[index], { name, prize } = BALLS[index]; busy = true;
    if (shown >= 0) { balls[shown].style.opacity = 0; prizes[shown].style.opacity = 0; }
    note.textContent = `抽到${name}的球：${prize}`;
    shown = index; ball.style.opacity = 1;
    if (motion().matches) { ball.style.translate = pct(path.at(-1)); prizes[index].style.opacity = 1; busy = false; return; }
    const roll = ball.animate(path.map(point => ({ translate: pct(point) })), { duration: 900, easing: 'cubic-bezier(.4,0,.7,1)', fill: 'forwards' });
    await roll.finished.catch(() => {}); ball.style.translate = pct(path.at(-1)); roll.cancel();
    if (index === 0) for (let scrap = 0; scrap < 14; scrap++) throwScrap(host, scrap);
    const up = prizes[index].animate([{ opacity: 0, translate: '0 20%', scale: .6 }, { opacity: 1, translate: '0 -6%', scale: 1.08, offset: .35 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
    await up.finished.catch(() => {}); prizes[index].style.opacity = 1; up.cancel(); busy = false;
  }
  async function spin() {
    if (busy) return;
    if (motion().matches) { drop(); return; }
    busy = true;
    const from = angle, run = drum.animate([{ rotate: `${from}deg` }, { rotate: `${from + 360}deg` }], { duration: 1300, easing: 'cubic-bezier(.45,0,.3,1)' });
    await run.finished.catch(() => {}); turnTo((from + 360) % 360); busy = false; drop();
  }
  // Turned by hand: the drum follows the pointer round its hub, only forward; once all the way round, a ball comes.
  const hubOnScreen = () => { const rect = button.getBoundingClientRect(); return [rect.left + rect.width * HUB[0] / VIEW[0], rect.top + rect.height * HUB[1] / VIEW[1]]; };
  const bearingOf = event => { const [x, y] = hubOnScreen(); return Math.atan2(event.clientY - y, event.clientX - x) * 180 / Math.PI; };
  button.addEventListener('pointerdown', event => { if (busy || motion().matches) return; grip = { id: event.pointerId, at: bearingOf(event), turned: 0, moved: false, x: event.clientX, y: event.clientY }; });
  button.addEventListener('pointermove', event => {
    if (!grip || event.pointerId !== grip.id) return;
    if (!grip.moved && Math.hypot(event.clientX - grip.x, event.clientY - grip.y) < 6) return;
    if (!grip.moved) { grip.moved = true; button.setPointerCapture(event.pointerId); }
    const now = bearingOf(event); let delta = now - grip.at; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; grip.at = now;
    if (delta <= 0) return;
    grip.turned += delta; turnTo((angle + delta) % 360);
    if (grip.turned >= 360) { grip = null; drop(); }
  });
  const letGo = event => { if (grip && event.pointerId === grip.id) { if (grip.moved) { grip = null; button.dataset.turned = '1'; } else grip = null; } };
  button.addEventListener('pointerup', letGo); button.addEventListener('pointercancel', letGo);
  button.addEventListener('click', () => { if (button.dataset.turned) { delete button.dataset.turned; return; } spin(); });
}

const TOYS = { home: sled, intro: globe, game: surpriseBox, wish: wishingStar, santa: jingleBell, vending: lottery };
export function mountToy(root, kind) {
  const draw = TOYS[kind]; if (!draw) return;
  const host = element('div', `foreground-scene foreground-toy toy-${kind}`, root);
  draw(host);
  root.removeAttribute('aria-hidden'); // The scene now holds a real control.
}
