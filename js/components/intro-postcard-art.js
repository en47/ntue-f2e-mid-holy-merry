// Postcard scenes: every moving part is its own paper layer, moved by the compositor.
import { shape, paperLayer } from './paper-art.js';
import { SNOW, holly, pine, star } from './paper-props.js';

const BOX = '0 0 640 360', PAPER = { scale: .8, grain: .45, shadow: .22 }, reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const path = (parent, d, fill, extra = {}) => shape('path', { d, fill, ...extra }, parent);
const line = (parent, d, stroke, width) => path(parent, d, 'none', { stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const circle = (parent, cx, cy, r, fill) => shape('circle', { cx, cy, r, fill }, parent);
const group = (parent, x, y, scale = 1) => shape('g', { transform: `translate(${x} ${y}) scale(${scale})` }, parent);
const layer = (host, draw, className = '') => paperLayer(host, BOX, `post-layer ${className}`, draw, { paper: PAPER, eager: true });
function move(element, frames, duration = 600, delay = 0, easing = 'cubic-bezier(.2,.8,.3,1.2)') {
  return element.animate(frames, { duration: reduced() ? 1 : duration, delay: reduced() ? 0 : delay, easing, fill: 'forwards' });
}
const clear = (...elements) => elements.flat().forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
const hide = element => { element.style.opacity = 0; return element; };

// Prizes are drawn around (0,0) so shoes and gift boxes can share them.
const PRIZES = {
  candy(p) { path(p, 'M-30-16L-52-30V-2ZM30-16L52-30V-2Z', '#e0b04f'); shape('rect', { x: -32, y: -34, width: 64, height: 36, rx: 16, fill: '#b5544c' }, p); line(p, 'M-12-32L-4 0M10-32L18 0', '#fbf3e3', 5); },
  chocolate(p) { shape('rect', { x: -32, y: -50, width: 64, height: 58, rx: 4, fill: '#6d4f3a' }, p); line(p, 'M-10-50V8M12-50V8M-32-22H32', '#54392a', 3); path(p, 'M-32-10H32V8H-32Z', '#d9c19a'); },
  mittens(p) { for (const x of [-22, 22]) { path(p, `M${x - 17} 4V-30C${x - 17} -54 ${x + 17} -54 ${x + 17} -30V4Z`, x < 0 ? '#a84a42' : '#4f7d68'); shape('rect', { x: x - 19, y: -4, width: 38, height: 12, rx: 4, fill: SNOW }, p); } },
  horse(p) { path(p, 'M-34 6V-20H10L16-48 38-40 30-28 24-24V6H12V-8H-22V6Z', '#a9764f'); line(p, 'M12-48L4-30', '#6d4f3a', 6); },
  book(p) { path(p, 'M-40-40C-24-48-8-46 0-38 8-46 24-48 40-40V8C24 0 8 2 0 10-8 2-24 0-40 8Z', '#fbf3e3'); line(p, 'M0-38V10', '#a84a42', 4); },
  potato(p) { path(p, 'M-36-10C-40-40 20-52 38-26 48-6 20 12-6 10-24 10-34 4-36-10Z', '#b08a5e'); for (const [x, y] of [[-14, -24], [10, -30], [18, -6], [-8, -4]]) circle(p, x, y, 3, '#8a6a45'); },
  bear(p) { for (const x of [-22, 22]) circle(p, x, -56, 12, '#a9764f'); circle(p, 0, -38, 30, '#b98a5e'); path(p, 'M-30 8C-34-16 34-16 30 8Z', '#a9764f'); circle(p, 0, -30, 12, '#ecd3b0'); circle(p, 0, -33, 4, '#54392a'); for (const x of [-11, 11]) circle(p, x, -44, 3, '#54392a'); },
  tea(p) { path(p, 'M-28-60H28L20 8H-20Z', '#c9a27a'); path(p, 'M-26-60H26V-50H-26Z', '#fbf3e3'); line(p, 'M8-60L14-82', '#a84a42', 7); for (const [x, y] of [[-12, -4], [2, 0], [12, -6], [-6, -14], [8, -14]]) circle(p, x, y, 5, '#54392a'); },
  cake(p) { shape('rect', { x: -44, y: -34, width: 88, height: 40, rx: 5, fill: '#a84a42' }, p); for (const x of [-26, 0, 26]) shape('rect', { x: x - 10, y: -46, width: 20, height: 16, rx: 3, fill: '#e3bb72' }, p); shape('rect', { x: -12, y: -34, width: 24, height: 40, fill: '#e0b04f' }, p); },
  mug(p) { shape('rect', { x: -28, y: -50, width: 50, height: 58, rx: 7, fill: '#fbf3e3' }, p); line(p, 'M22-36C42-36 42-6 22-6', '#fbf3e3', 8); pine(p, -3, -2, 40, '#4f7d68'); },
  scarf(p) { path(p, 'M-44-40C-14-58 14-58 44-40 34-20 20-22 16-24L26 10H4L0-20-34-22C-40-24-46-32-44-40Z', '#a84a42'); line(p, 'M-30-40C-10-48 10-48 30-40', '#fbf3e3', 4); },
  lantern(p) { path(p, 'M-22-46H22L28 6H-28Z', '#efbe62'); path(p, 'M-26-46H26L12-60H-12Z', '#6d5a50'); shape('rect', { x: -28, y: 4, width: 56, height: 8, fill: '#6d5a50' }, p); line(p, 'M0-46V4M-24-20H24', '#b98a45', 3); },
  sock(p) { path(p, 'M-14-52H20V-8C20 14-2 18-30 14-44 10-40-6-14-10Z', '#6f8f86'); for (const y of [-40, -24]) line(p, `M-13 ${y}H19`, '#e0b04f', 5); circle(p, -22, 2, 7, '#e0b04f'); },
  yam(p) { path(p, 'M-46-4C-30-42 24-42 44-12 50 2 30 8 10 6-14 6-34 12-46-4Z', '#9a5a4a'); path(p, 'M-6-8C-2-30 24-30 34-14 26-4 8-2-6-8Z', '#efbe62'); },
  ticket(p) { path(p, 'M-48-40H48V-22C38-20 38-6 48-4V12H-48V-4C-38-6-38-20-48-22Z', '#e0b04f'); star(p, 0, -14, 16, '#a84a42'); },
};
const prizeLayer = (host, name, x, y, scale = 1.1) => hide(layer(host, parent => PRIZES[name](group(parent, x, y, scale)), 'post-prize'));

function iceland(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#34506c' }, parent);
    for (const [x, y, size] of [[120, 70, 8], [300, 50, 6], [520, 90, 9], [430, 40, 5]]) star(parent, x, y, size, '#efd08a');
    path(parent, 'M0 250C120 200 240 240 340 220S540 210 640 240V360H0Z', '#dbe7ec');
    shape('rect', { x: 150, y: 24, width: 340, height: 262, rx: 8, fill: 'none', stroke: '#c9a877', 'stroke-width': 18 }, parent);
    line(parent, 'M320 24V286M150 150H490', '#c9a877', 10);
    shape('rect', { x: 100, y: 284, width: 440, height: 30, rx: 5, fill: '#a9845b' }, parent);
    shape('rect', { x: 100, y: 310, width: 440, height: 50, fill: '#8f6a4c' }, parent);
  });
  const elf = layer(host, parent => {
    path(parent, 'M404 300C396 240 424 214 452 214 480 214 508 240 500 300Z', '#5f8a70');
    circle(parent, 452, 182, 34, '#f2cda9');
    path(parent, 'M416 170C416 120 450 96 500 78 486 118 490 150 488 170Z', '#a84a42');
    shape('rect', { x: 412, y: 162, width: 80, height: 16, rx: 8, fill: SNOW }, parent);
    path(parent, 'M424 192C428 236 476 236 480 192 468 204 436 204 424 192Z', '#fbf8f1');
    line(parent, 'M436 180q6 6 12 0M458 180q6 6 12 0', '#5a4033', 3);
  });
  hide(elf).style.transform = 'translateX(40px)';
  const prizes = Object.fromEntries(Object.keys({ candy: 0, chocolate: 0, mittens: 0, horse: 0, book: 0, potato: 0 }).map(name => [name, prizeLayer(host, name, 250, 216, 1)]));
  const shoe = layer(host, parent => {
    path(parent, 'M176 214C170 248 160 268 166 284 170 292 180 292 188 292H340C352 292 354 278 342 270 310 254 276 256 260 238L256 208C232 200 204 202 176 214Z', '#a84a42');
    path(parent, 'M172 206C200 194 234 194 262 202L260 224C232 216 204 216 176 226Z', SNOW);
  }, 'post-shoe');
  const nights = document.createElement('div');
  nights.className = 'post-nights';
  const dots = Array.from({ length: 13 }, () => nights.appendChild(document.createElement('span')));
  host.append(nights);
  return {
    reset() { clear(elf, shoe, Object.values(prizes)); hide(elf); Object.values(prizes).forEach(hide); dots.forEach(dot => dot.classList.remove('is-on')); },
    play({ variant, step }) {
      clear(elf, shoe, Object.values(prizes)); Object.values(prizes).forEach(hide);
      dots.forEach((dot, index) => dot.classList.toggle('is-on', index <= step));
      move(elf, [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none', offset: .3 }, { opacity: 1, transform: 'none', offset: .75 }, { opacity: 0, transform: 'translateX(60px)' }], 1500, 0, 'ease-in-out');
      move(shoe, [{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], 420, 420, 'ease-in-out');
      move(prizes[variant], [{ opacity: 0, transform: 'translateY(46px) scale(.7)' }, { opacity: 1, transform: 'translateY(-42px) scale(1)' }], 620, 560);
    },
  };
}

function taiwan(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#f0dfc0' }, parent);
    for (let index = 0; index < 9; index++) { const x = 30 + index * 73; line(parent, `M${x} 0V${30 + (index % 3) * 18}`, '#a9845b', 3); circle(parent, x, 36 + (index % 3) * 18, 9, ['#a84a42', '#e0b04f', '#4f7d68'][index % 3]); }
    shape('rect', { x: 0, y: 296, width: 640, height: 64, fill: '#a9845b' }, parent);
  });
  const colours = [['#a84a42', '#f3e7cf'], ['#4f7d68', '#e0b04f'], ['#c08a3e', '#a84a42']];
  const prizes = Object.fromEntries(['bear', 'tea', 'cake', 'mug', 'scarf', 'lantern', 'sock', 'yam', 'ticket'].map(name => [name, prizeLayer(host, name, 320, 190, 1.5)]));
  const boxes = colours.map(([fill, ribbon], index) => {
    const x = 130 + index * 190;
    const body = layer(host, parent => { shape('rect', { x: x - 72, y: 186, width: 144, height: 116, rx: 5, fill }, parent); shape('rect', { x: x - 14, y: 186, width: 28, height: 116, fill: ribbon }, parent); });
    const lid = layer(host, parent => {
      shape('rect', { x: x - 82, y: 158, width: 164, height: 34, rx: 5, fill }, parent); shape('rect', { x: x - 14, y: 158, width: 28, height: 34, fill: ribbon }, parent);
      path(parent, `M${x} 158C${x - 46} 118 ${x - 62} 152 ${x} 158C${x + 46} 118 ${x + 62} 152 ${x} 158Z`, ribbon);
    });
    return { body, lid, x };
  });
  const parts = () => [...Object.values(prizes), ...boxes.flatMap(box => [box.body, box.lid])];
  return {
    reset() { clear(parts()); Object.values(prizes).forEach(hide); },
    play({ variant }, { share }) {
      clear(parts()); Object.values(prizes).forEach(hide);
      const index = share === undefined ? Math.floor(Math.random() * 3) : Math.min(2, Math.floor(share * 3)), box = boxes[index];
      move(box.lid, [{ transform: 'none' }, { transform: 'translateY(-90px) rotate(-16deg)', opacity: 0 }], 520, 240);
      for (const part of [box.body, box.lid]) move(part, [{ translate: '0 0' }, { translate: '-5px 0' }, { translate: '5px 0' }, { translate: '0 0' }], 240, 0, 'linear');
      move(prizes[variant], [{ opacity: 0, transform: `translate(${box.x - 320}px, 90px) scale(.5)` }, { opacity: 1, transform: `translate(${box.x - 320}px, -36px) scale(1)` }], 620, 480);
    },
  };
}

function wedge(index) {
  const point = angle => [320 + 118 * Math.cos(angle), 186 + 118 * .72 * Math.sin(angle)];
  const from = -Math.PI / 2 + index * Math.PI / 3, to = from + Math.PI / 3, middle = (from + to) / 2;
  return { d: `M320 186L${point(from).map(v => v.toFixed(1)).join(' ')}A118 85 0 0 1 ${point(to).map(v => v.toFixed(1)).join(' ')}Z`, berry: [320 + 78 * Math.cos(middle), 186 + 56 * Math.sin(middle)], out: [Math.cos(middle) * 60, Math.sin(middle) * 44] };
}

function japan(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#e5c9a8' }, parent);
    for (let x = 0; x < 640; x += 80) for (let y = (x / 80) % 2 ? 40 : 0; y < 360; y += 80) shape('rect', { x, y, width: 40, height: 40, fill: '#ecd7bd' }, parent);
    shape('ellipse', { cx: 320, cy: 200, rx: 176, ry: 128, fill: '#fbf8f1' }, parent);
    shape('ellipse', { cx: 320, cy: 200, rx: 150, ry: 106, fill: 'none', stroke: '#a9c8d6', 'stroke-width': 3 }, parent);
    shape('ellipse', { cx: 320, cy: 202, rx: 118, ry: 85, fill: '#e8d3a8' }, parent);
  });
  const slices = Array.from({ length: 6 }, (_, index) => {
    const { d, berry, out } = wedge(index);
    const slice = layer(host, parent => { path(parent, d, '#fffaf0', { stroke: '#ecdcc2', 'stroke-width': 2 }); path(parent, 'M0 0', 'none'); circle(parent, berry[0], berry[1], 15, '#b5544c'); path(parent, `M${berry[0] - 8} ${berry[1] - 12}L${berry[0]} ${berry[1] - 6} ${berry[0] + 8} ${berry[1] - 12}Z`, '#5f8a70'); });
    slice.dataset.out = out.join(',');
    return slice;
  });
  return {
    reset() { clear(slices); slices.forEach(slice => { slice.style.opacity = ''; }); },
    play({ step }) {
      if (step === 0) clear(slices);
      const [x, y] = slices[step].dataset.out.split(',').map(Number);
      move(slices[step], [{ transform: 'none', opacity: 1 }, { transform: `translate(${x}px,${y}px) scale(1.05)`, opacity: 1, offset: .55 }, { transform: `translate(${x * 2.6}px,${y * 2.6}px) scale(.9)`, opacity: 0 }], 800, 0, 'ease-out');
    },
  };
}

function newzealand(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#a9d0dc' }, parent);
    for (let index = 0; index < 10; index++) path(parent, 'M0-96L9-74H-9Z', '#f3dca6', { transform: `translate(540 72) rotate(${index * 36})` });
    circle(parent, 540, 72, 44, '#f2cf86');
    path(parent, 'M0 250C160 226 320 262 640 232V360H0Z', '#7fa9bd');
    path(parent, 'M0 300C200 262 420 300 640 280V360H0Z', '#efdcb4');
    line(parent, 'M250 310C246 250 236 214 214 180M250 280C264 232 290 208 316 186', '#7c5a3f', 22);
    for (const [x, y, rx, ry] of [[160, 130, 86, 62], [262, 96, 104, 72], [358, 138, 80, 58], [212, 170, 60, 36], [306, 172, 60, 36]]) shape('ellipse', { cx: x, cy: y, rx, ry, fill: '#5f8a70' }, parent);
  });
  const spots = [[132, 118], [196, 76], [270, 62], [346, 106], [386, 150], [228, 148], [300, 140]];
  const blooms = spots.map(([x, y]) => hide(paperLayer(host, BOX, `post-layer post-bloom`, parent => {
    for (let index = 0; index < 9; index++) line(parent, `M${x} ${y}l${Math.cos(index * .7) * 26} ${Math.sin(index * .7) * 22}`, '#b5443c', 5);
    circle(parent, x, y, 9, '#e0b04f');
  }, { paper: PAPER, eager: true, origin: [x, y] })));
  const kiwi = hide(layer(host, parent => {
    path(parent, 'M430 322C424 282 480 268 508 288 526 300 524 324 500 330 470 336 436 336 430 322Z', '#8a6a4c');
    circle(parent, 512, 286, 17, '#8a6a4c'); line(parent, 'M526 286L566 298', '#d9b36a', 4); line(parent, 'M462 332v16M488 332v16', '#d9b36a', 4); circle(parent, 516, 282, 3, '#2f2a26');
  }));
  const petals = document.createElement('div');
  petals.className = 'post-petals';
  host.append(petals);
  function fall() {
    petals.replaceChildren(...Array.from({ length: 14 }, (_, index) => {
      const petal = document.createElement('i');
      petal.style.left = `${16 + index * 3.6}%`; petal.style.animationDelay = `${index % 5 * .22}s`;
      return petal;
    }));
  }
  return {
    reset() { clear(blooms, kiwi); blooms.forEach(hide); hide(kiwi); petals.replaceChildren(); },
    play({ step }) {
      if (step === 0) { clear(blooms, kiwi); blooms.forEach(hide); hide(kiwi); petals.replaceChildren(); }
      move(blooms[step], [{ opacity: 0, transform: 'scale(.1)' }, { opacity: 1, transform: 'scale(1)' }], 520);
      if (step === blooms.length - 1) { fall(); move(kiwi, [{ opacity: 0, transform: 'translateX(120px)' }, { opacity: 1, transform: 'none' }], 900, 200, 'ease-out'); }
    },
  };
}

function canada(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#6f92ab' }, parent);
    for (const [x, y] of [[60, 60], [150, 120], [260, 40], [520, 60], [590, 150], [460, 130], [90, 190]]) circle(parent, x, y, 6, '#f6efe2');
    pine(parent, 76, 300, 190, '#4f7a65'); pine(parent, 572, 306, 170, '#5f8a70');
    path(parent, 'M0 300C160 270 460 290 640 276V360H0Z', SNOW);
  });
  const reply = hide(layer(host, parent => {
    shape('rect', { x: 372, y: 96, width: 170, height: 118, rx: 4, fill: '#fdf6e6' }, parent);
    line(parent, 'M392 126H520M392 148H508M392 170H470', '#c9a877', 4);
    path(parent, 'M500 182C490 172 494 164 500 166 504 162 512 166 502 182Z', '#b5544c');
  }));
  layer(host, parent => {
    path(parent, 'M236 330V150C236 74 404 74 404 150V330Z', '#a84a42');
    shape('rect', { x: 262, y: 150, width: 116, height: 16, rx: 6, fill: '#54392a' }, parent);
    shape('rect', { x: 268, y: 196, width: 104, height: 62, rx: 6, fill: '#fbf3e3' }, parent);
    star(parent, 290, 226, 12, '#a84a42');
    line(parent, 'M310 216H358M310 236H346', '#a84a42', 5);
    path(parent, 'M226 332C260 310 380 310 414 332Z', SNOW);
    path(parent, 'M238 118C270 74 370 74 402 118 380 132 260 132 238 118Z', SNOW);
  });
  const letter = hide(layer(host, parent => {
    shape('rect', { x: 92, y: 200, width: 118, height: 78, rx: 4, fill: '#fdf6e6' }, parent);
    path(parent, 'M92 204L151 244 210 204', 'none', { stroke: '#c9a877', 'stroke-width': 3 });
    circle(parent, 151, 246, 11, '#a84a42');
  }));
  return {
    reset() { clear(letter, reply); hide(letter); hide(reply); },
    play() {
      clear(letter, reply); hide(reply);
      move(letter, [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: 'translate(170px,-120px) rotate(-8deg) scale(.86)', offset: .7 }, { opacity: 0, transform: 'translate(170px,-92px) scale(.3)' }], 900, 0, 'ease-in-out');
      move(reply, [{ opacity: 0, transform: 'translate(-90px,40px) scale(.4)' }, { opacity: 1, transform: 'none' }], 620, 1050);
    },
  };
}

function brazil(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#2f4a66' }, parent);
    for (const [x, y, size] of [[80, 50, 7], [180, 90, 5], [470, 60, 8], [560, 120, 5]]) star(parent, x, y, size, '#efd08a');
    path(parent, 'M0 214C80 150 150 196 210 186S330 130 400 178 540 150 640 208V240H0Z', '#3f5f6e');
    shape('rect', { x: 0, y: 236, width: 640, height: 124, fill: '#3e6480' }, parent);
    path(parent, 'M320 20L216 234H424Z', '#3f6655');
  });
  const palettes = { gold: ['#efcf7e', '#f7dfa4', '#e0b04f'], holly: ['#d9685c', '#efcf7e', '#7fbf96'], ocean: ['#8fd3e8', '#c9eef5', '#6fb0d8'], samba: ['#e8695a', '#f2c94e', '#6fc48c', '#7fb8e8', '#d98ad0'] };
  const dots = [[320, 66], [292, 104], [346, 112], [268, 150], [320, 148], [372, 152], [246, 196], [292, 192], [346, 196], [394, 200]];
  const glows = Object.fromEntries(Object.entries(palettes).map(([name, colours]) => [name, hide(layer(host, parent => {
    dots.forEach(([x, y], index) => { circle(parent, x, y, 10, colours[index % colours.length]); circle(parent, x, 472 - y, 6, colours[index % colours.length]); });
    star(parent, 320, 28, 22, colours[0]);
    path(parent, 'M300 240H340L352 340H288Z', colours[0], { opacity: .16 });
  }))]));
  const fireworks = [[126, 96, '#e8695a'], [520, 76, '#f2c94e'], [190, 44, '#7fb8e8']].map(([x, y, colour]) => hide(paperLayer(host, BOX, 'post-layer', parent => {
    for (let index = 0; index < 12; index++) line(parent, `M${x + Math.cos(index * .52) * 14} ${y + Math.sin(index * .52) * 14}L${x + Math.cos(index * .52) * 46} ${y + Math.sin(index * .52) * 46}`, colour, 5);
  }, { paper: PAPER, eager: true, origin: [x, y] })));
  return {
    reset() { clear(Object.values(glows), fireworks); Object.values(glows).forEach(hide); fireworks.forEach(hide); },
    play({ variant }) {
      clear(Object.values(glows), fireworks); Object.values(glows).forEach(hide); fireworks.forEach(hide);
      move(glows[variant], [{ opacity: 0 }, { opacity: 1 }], 500, 0, 'ease-out');
      if (variant === 'samba') fireworks.forEach((burst, index) => move(burst, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)', offset: .5 }, { opacity: 0, transform: 'scale(1.2)' }], 1300, 300 + index * 260, 'ease-out'));
    },
  };
}

export const postcardScenes = { iceland, taiwan, japan, newzealand, canada, brazil };
