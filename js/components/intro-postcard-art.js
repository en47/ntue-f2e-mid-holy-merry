// Postcard scenes: every moving part is its own paper layer, moved by the compositor.
import { shape, paperLayer } from './paper-art.js';
import { SNOW, holly, pine, star } from './paper-props.js';

const BOX = '0 0 640 360', PAPER = { scale: .8, grain: .45, shadow: .22 }, reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const path = (parent, d, fill, extra = {}) => shape('path', { d, fill, ...extra }, parent);
const line = (parent, d, stroke, width) => path(parent, d, 'none', { stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const circle = (parent, cx, cy, r, fill) => shape('circle', { cx, cy, r, fill }, parent);
const group = (parent, x, y, scale = 1) => shape('g', { transform: `translate(${x} ${y}) scale(${scale})` }, parent);
const layer = (host, draw, className = '') => paperLayer(host, BOX, `post-layer ${className}`, draw, { paper: PAPER, eager: true });
// Every layer spans the whole 640×360 scene, so moves are written in scene units and turned into percentages of the layer:
// the same move lands in the same spot whether the card is 330px wide on a phone or 620px on a desktop.
const shift = (x, y = 0) => `translate(${(x / 6.4).toFixed(3)}%, ${(y / 3.6).toFixed(3)}%)`;
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
  hide(elf).style.transform = shift(40);
  // Centred on the boot's opening (x 172–262), so each gift rises straight out of the shoe.
  const prizes = Object.fromEntries(Object.keys({ candy: 0, chocolate: 0, mittens: 0, horse: 0, book: 0, potato: 0 }).map(name => [name, prizeLayer(host, name, 217, 216, 1)]));
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
      move(elf, [{ opacity: 0, transform: shift(60) }, { opacity: 1, transform: 'none', offset: .3 }, { opacity: 1, transform: 'none', offset: .75 }, { opacity: 0, transform: shift(60) }], 1500, 0, 'ease-in-out');
      move(shoe, [{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], 420, 420, 'ease-in-out');
      move(prizes[variant], [{ opacity: 0, transform: `${shift(0, 46)} scale(.7)` }, { opacity: 1, transform: `${shift(0, -42)} scale(1)` }], 620, 560);
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
      move(box.lid, [{ transform: 'none' }, { transform: `${shift(0, -90)} rotate(-16deg)`, opacity: 0 }], 520, 240);
      for (const part of [box.body, box.lid]) move(part, [{ translate: '0 0' }, { translate: `${(-5 / 6.4).toFixed(3)}% 0` }, { translate: `${(5 / 6.4).toFixed(3)}% 0` }, { translate: '0 0' }], 240, 0, 'linear');
      move(prizes[variant], [{ opacity: 0, transform: `${shift(box.x - 320, 90)} scale(.5)` }, { opacity: 1, transform: `${shift(box.x - 320, -36)} scale(1)` }], 620, 480);
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
      move(slices[step], [{ transform: 'none', opacity: 1 }, { transform: `${shift(x, y)} scale(1.05)`, opacity: 1, offset: .55 }, { transform: `${shift(x * 2.6, y * 2.6)} scale(.9)`, opacity: 0 }], 800, 0, 'ease-out');
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
      if (step === blooms.length - 1) { fall(); move(kiwi, [{ opacity: 0, transform: shift(120) }, { opacity: 1, transform: 'none' }], 900, 200, 'ease-out'); }
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
      move(letter, [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: `${shift(170, -120)} rotate(-8deg) scale(.86)`, offset: .7 }, { opacity: 0, transform: `${shift(170, -92)} scale(.3)` }], 900, 0, 'ease-in-out');
      move(reply, [{ opacity: 0, transform: `${shift(-90, 40)} scale(.4)` }, { opacity: 1, transform: 'none' }], 620, 1050);
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

// Finland: Santa Claus Village at Rovaniemi, on the Arctic Circle, under the northern lights. A child walks up to the
// white line painted across the snow, steps over it into the Arctic, and Santa opens his door and waves.
function child(parent) {
  line(parent, 'M142 328V344M156 328V344', '#3e3a3c', 6);
  path(parent, 'M132 330C130 300 138 284 149 284 160 284 168 300 166 330Z', '#4f7d68');
  path(parent, 'M136 290C144 296 156 296 162 290L164 298C156 304 142 304 134 298Z', '#a84a42'); path(parent, 'M158 296L164 316 170 312 164 294Z', '#a84a42');
  circle(parent, 149, 272, 14, '#f2cda9'); circle(parent, 154, 274, 1.8, '#3b2a24'); circle(parent, 156, 279, 2.6, '#e8a493');
  path(parent, 'M134 268C134 248 148 240 164 246 158 252 162 262 164 268Z', '#a84a42'); circle(parent, 166, 246, 5, SNOW); shape('rect', { x: 132, y: 264, width: 34, height: 7, rx: 3.5, fill: SNOW }, parent);
}
function finland(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#2f4560' }, parent);
    line(parent, 'M-20 64C100 26 210 96 330 56S540 26 660 62', '#6fa88c', 22).setAttribute('opacity', '.6');
    line(parent, 'M-20 104C120 76 220 124 350 96S560 76 660 100', '#7fb3b8', 12).setAttribute('opacity', '.5');
    path(parent, 'M0 236C120 206 240 226 340 212S540 202 640 220V360H0Z', '#3e5a77');
    for (const [x, base, size] of [[40, 244, 74], [92, 240, 54], [566, 236, 70], [610, 242, 50]]) pine(parent, x, base, size, '#2f5240');
    path(parent, 'M0 252C160 238 320 254 640 242V360H0Z', SNOW);
  });
  const santa = hide(layer(host, parent => {
    path(parent, 'M424 254C424 226 430 214 440 214S456 226 456 254Z', '#a84a42');
    circle(parent, 440, 206, 9, '#f2cda9'); path(parent, 'M431 206C431 226 449 226 449 206 444 212 436 212 431 206Z', SNOW);
    path(parent, 'M430 202C430 188 444 182 456 190 450 194 450 200 450 202Z', '#a84a42'); shape('rect', { x: 428, y: 199, width: 24, height: 6, rx: 3, fill: SNOW }, parent);
    line(parent, 'M454 228L466 208', '#a84a42', 6); circle(parent, 467, 205, 4.5, '#4f7d68');
  }));
  layer(host, parent => {
    path(parent, 'M370 256V164H510V256ZM425 256V214Q440 200 455 214V256Z', '#8f3b36', { 'fill-rule': 'evenodd' });
    path(parent, 'M352 170L440 96 528 170Z', '#4b3f3a'); path(parent, 'M346 172L440 92 534 172C520 164 500 150 482 136 470 144 456 134 440 120 424 134 410 144 398 136 380 150 360 164 346 172Z', SNOW);
    for (const x of [384, 474]) { shape('rect', { x, y: 186, width: 24, height: 22, rx: 3, fill: '#efbe62' }, parent); line(parent, `M${x + 12} 186V208M${x} 197H${x + 24}`, '#7a5236', 2); }
    path(parent, 'M425 256V214Q440 200 455 214V256', 'none', { stroke: SNOW, 'stroke-width': 3 });
  });
  const door = paperLayer(host, BOX, 'post-layer', parent => path(parent, 'M425 256V214Q440 200 455 214V256Z', '#6d4f3a'), { paper: PAPER, eager: true, origin: [425, 230] });
  layer(host, parent => {
    path(parent, 'M236 360L318 252H340L282 360Z', '#fdfbf6'); line(parent, 'M236 360L318 252M282 360L340 252', '#8fb3c4', 3);
    for (const [x, y] of [[312, 262], [292, 292], [268, 326]]) { line(parent, `M${x - 26} ${y}V${y - 46}`, '#6d5a50', 4); circle(parent, x - 26, y - 50, 6, '#efbe62'); }
  });
  const sparkle = hide(paperLayer(host, BOX, 'post-layer', parent => { for (let index = 0; index < 8; index++) line(parent, `M${300 + Math.cos(index * .785) * 16} ${300 + Math.sin(index * .785) * 12}L${300 + Math.cos(index * .785) * 40} ${300 + Math.sin(index * .785) * 30}`, '#efd08a', 4); }, { paper: PAPER, eager: true, origin: [300, 300] }));
  const walker = layer(host, child);
  walker.style.transform = shift(-80);
  const parts = [santa, door, sparkle, walker];
  return {
    reset() { clear(parts); hide(santa); hide(sparkle); walker.style.transform = shift(-80); },
    play({ step }) {
      if (step === 0) {
        clear(parts); hide(santa); hide(sparkle);
        move(walker, [{ transform: shift(-80) }, { transform: `${shift(-40)} translateY(-1.5%)`, offset: .25 }, { transform: shift(0), offset: .5 }, { transform: `${shift(40)} translateY(-1.5%)`, offset: .75 }, { transform: shift(70) }], 1400, 0, 'linear');
      }
      if (step === 1) {
        move(walker, [{ transform: shift(70) }, { transform: `${shift(130)} translateY(-9%)`, offset: .5 }, { transform: shift(190) }], 700, 0, 'ease-in-out');
        move(sparkle, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)', offset: .4 }, { opacity: 0, transform: 'scale(1.3)' }], 1000, 250, 'ease-out');
      }
      if (step === 2) {
        move(door, [{ transform: 'none' }, { transform: 'perspective(400px) rotateY(-120deg)' }], 700, 0, 'ease-in-out');
        move(santa, [{ opacity: 0, transform: shift(0, 6) }, { opacity: 1, transform: 'none' }], 500, 400, 'ease-out');
      }
    },
  };
}

// United Kingdom: a Christmas cracker across the dinner table, one end in each hand. A tug; then bang, the two halves fly
// apart, a paper crown pops up and the joke's slip flutters down.
const CROWNS = { red: '#c0574c', green: '#5f8a70', gold: '#e0b04f' };
function uk(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#e9dcc4' }, parent);
    for (let x = 22; x < 640; x += 64) shape('rect', { x, y: 0, width: 26, height: 236, fill: '#e1d1b4' }, parent);
    shape('rect', { x: 244, y: 26, width: 152, height: 112, rx: 6, fill: '#34506c' }, parent); line(parent, 'M320 26V138M244 82H396', '#f3e7cf', 6);
    for (const [x, y] of [[270, 50], [350, 64], [300, 110], [372, 116]]) circle(parent, x, y, 3, SNOW);
    shape('rect', { x: 236, y: 134, width: 168, height: 10, rx: 3, fill: '#a9845b' }, parent);
    shape('rect', { x: 0, y: 236, width: 640, height: 124, fill: '#fbf8f1' }, parent); shape('rect', { x: 0, y: 236, width: 640, height: 8, fill: '#efe4cf' }, parent);
    for (const x of [116, 524]) { shape('ellipse', { cx: x, cy: 304, rx: 74, ry: 20, fill: '#fdfbf6' }, parent); shape('ellipse', { cx: x, cy: 304, rx: 58, ry: 14, fill: 'none', stroke: '#a9c8d6', 'stroke-width': 3 }, parent); }
    holly(parent, 320, 272, .9); shape('rect', { x: 312, y: 214, width: 16, height: 52, rx: 3, fill: '#fdf6e6' }, parent); path(parent, 'M320 194C328 204 328 212 320 216 312 212 312 204 320 194Z', '#e0b04f');
  });
  const crown = Object.fromEntries(Object.entries(CROWNS).map(([name, fill]) => [name, hide(layer(host, parent => path(parent, 'M286 188L292 154 306 172 320 146 334 172 348 154 354 188Z', fill)))]));
  const slip = hide(layer(host, parent => { shape('rect', { x: 296, y: 214, width: 52, height: 26, rx: 2, fill: '#fdf6e6', transform: 'rotate(-8 322 227)' }, parent); line(parent, 'M302 224H338M304 232H330', '#c9a877', 3); }));
  const bang = hide(paperLayer(host, BOX, 'post-layer', parent => { star(parent, 320, 190, 46, '#f2d88f'); for (let index = 0; index < 10; index++) line(parent, `M${320 + Math.cos(index * .63) * 50} ${190 + Math.sin(index * .63) * 40}L${320 + Math.cos(index * .63) * 70} ${190 + Math.sin(index * .63) * 56}`, '#e0b04f', 4); }, { paper: PAPER, eager: true, origin: [320, 190] }));
  const half = side => layer(host, parent => {
    const g = group(parent, 320, 190, 1); if (side < 0) g.setAttribute('transform', 'translate(320 190) scale(-1 1)');
    shape('rect', { x: 0, y: -17, width: 74, height: 34, fill: '#b5443c' }, g); shape('rect', { x: 0, y: -17, width: 16, height: 34, fill: '#e0b04f' }, g);
    path(g, 'M74-17L92-8V8L74 17Z', '#a03b34'); path(g, 'M92-8L112-20V20L92 8Z', '#b5443c'); line(g, 'M112-20V20', '#e0b04f', 3);
    line(g, 'M28-17V17M48-17V17', '#fbf3e3', 2);
    path(g, 'M100-12C120-2 150 10 190 34L180 60C140 40 110 24 96 14Z', side < 0 ? '#4f7d68' : '#a84a42'); circle(g, 104, 4, 12, '#f2cda9');
  });
  const left = half(-1), right = half(1);
  const parts = [left, right, bang, slip, ...Object.values(crown)];
  return {
    reset() { clear(parts); [bang, slip, ...Object.values(crown)].forEach(hide); },
    play({ variant, step }) {
      if (step === 0) {
        clear(parts); [bang, slip, ...Object.values(crown)].forEach(hide);
        for (const [part, side] of [[left, -1], [right, 1]]) move(part, [{ transform: 'none' }, { transform: shift(side * 10) }, { transform: shift(side * 4) }, { transform: shift(side * 12) }, { transform: shift(side * 6) }], 900, 0, 'ease-in-out');
        return;
      }
      for (const [part, side] of [[left, -1], [right, 1]]) move(part, [{ transform: shift(side * 6) }, { transform: `${shift(side * 90, 12)} rotate(${side * 10}deg)` }], 520, 0, 'cubic-bezier(.2,.9,.3,1)');
      move(bang, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.05)', offset: .3 }, { opacity: 0, transform: 'scale(1.2)' }], 700, 0, 'ease-out');
      move(crown[variant], [{ opacity: 0, transform: `${shift(0, 20)} scale(.4)` }, { opacity: 1, transform: `${shift(0, -50)} scale(1.1)`, offset: .6 }, { opacity: 1, transform: `${shift(0, -40)} scale(1)` }], 800, 200);
      move(slip, [{ opacity: 0, transform: `${shift(0, -40)} rotate(0)` }, { opacity: 1, transform: `${shift(-20, 10)} rotate(-12deg)`, offset: .5 }, { opacity: 1, transform: `${shift(10, 40)} rotate(6deg)` }], 1300, 350, 'ease-in-out');
    },
  };
}

// Mexico: Las Posadas in the plaza by night, paper banners strung overhead, paper lanterns on the ground. The star
// piñata swings at the first hit, cracks at the second, and bursts at the third: sweets and fruit all over the ground.
const PICADO = ['#d98a7c', '#e0b04f', '#6fa88c', '#7fb3d0', '#c4574c'];
function pinata(parent) {
  for (let index = 0; index < 7; index++) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 7, x = 320 + Math.cos(angle) * 38, y = 150 + Math.sin(angle) * 38, tx = 320 + Math.cos(angle) * 92, ty = 150 + Math.sin(angle) * 92;
    const side = [Math.cos(angle + Math.PI / 2) * 16, Math.sin(angle + Math.PI / 2) * 16];
    path(parent, `M${x + side[0]} ${y + side[1]}L${tx} ${ty}L${x - side[0]} ${y - side[1]}Z`, PICADO[index % 5]);
    line(parent, `M${tx} ${ty}l${Math.cos(angle) * 8 - 4} 16M${tx} ${ty}l${Math.cos(angle) * 8 + 4} 18`, PICADO[(index + 2) % 5], 3);
  }
  circle(parent, 320, 150, 42, '#e0b04f'); line(parent, 'M286 140H354M282 160H358', '#c4574c', 5);
}
function mexico(host) {
  layer(host, parent => {
    shape('rect', { x: 0, y: 0, width: 640, height: 360, fill: '#34506c' }, parent);
    line(parent, 'M-10 24Q160 54 320 28T650 26', '#d9c79f', 2.5);
    for (let index = 0; index < 13; index++) {
      const x = 8 + index * 50, y = 30 + Math.sin(index * .5) * 8, fill = PICADO[index % 5];
      path(parent, `M${x} ${y}H${x + 36}V${y + 34}L${x + 30} ${y + 40} ${x + 24} ${y + 34} ${x + 18} ${y + 40} ${x + 12} ${y + 34} ${x + 6} ${y + 40} ${x} ${y + 34}Z`, fill);
      path(parent, `M${x + 18} ${y + 8}L${x + 24} ${y + 16} ${x + 18} ${y + 24} ${x + 12} ${y + 16}Z`, '#34506c'); circle(parent, x + 9, y + 9, 2.4, '#34506c'); circle(parent, x + 27, y + 9, 2.4, '#34506c');
    }
    for (const [x, w] of [[0, 150], [500, 140]]) { shape('rect', { x, y: 150, width: w, height: 150, fill: '#c97a5a' }, parent); path(parent, `M${x + w / 2 - 22} 300V232Q${x + w / 2} 208 ${x + w / 2 + 22} 232V300Z`, '#7a5236'); shape('rect', { x: x + 18, y: 176, width: 22, height: 24, rx: 3, fill: '#efbe62' }, parent); }
    shape('rect', { x: 0, y: 296, width: 640, height: 64, fill: '#d9b07a' });
    for (const x of [176, 222, 418, 466]) { path(parent, `M${x - 11} 318L${x - 9} 296H${x + 9}L${x + 11} 318Z`, '#f3e7cf'); circle(parent, x, 306, 4, '#efbe62'); }
  });
  const candy = hide(layer(host, parent => {
    for (const [x, y, fill] of [[262, 322, '#c4574c'], [300, 334, '#6fa88c'], [338, 326, '#e0b04f'], [372, 338, '#7fb3d0'], [236, 340, '#e0b04f'], [404, 324, '#c4574c']]) { shape('rect', { x: x - 8, y: y - 5, width: 16, height: 10, rx: 4, fill }, parent); path(parent, `M${x - 8} ${y}l-7-5v10ZM${x + 8} ${y}l7-5v10Z`, fill); }
    for (const [x, y] of [[282, 342], [352, 344], [318, 318]]) { circle(parent, x, y, 9, '#e8913f'); path(parent, `M${x} ${y - 9}c3-4 8-4 9-1-3 1-6 1-9 1Z`, '#5f8a70'); }
  }));
  layer(host, parent => line(parent, 'M320 0V60', '#d9c79f', 3));
  const star = paperLayer(host, BOX, 'post-layer', pinata, { paper: PAPER, eager: true, origin: [320, 30] });
  const crack = hide(paperLayer(host, BOX, 'post-layer', parent => line(parent, 'M306 118L318 136 308 150 322 166 314 184', '#6d4f3a', 3), { paper: PAPER, eager: true, origin: [320, 30] }));
  const bits = hide(paperLayer(host, BOX, 'post-layer', parent => { for (let index = 0; index < 14; index++) { const x = 320 + Math.cos(index * .45) * (60 + (index % 3) * 18), y = 150 + Math.sin(index * .45) * (48 + (index % 3) * 14); shape('rect', { x: x - 5, y: y - 3, width: 10, height: 6, rx: 1, fill: PICADO[index % 5], transform: `rotate(${index * 41} ${x} ${y})` }, parent); } }, { paper: PAPER, eager: true, origin: [320, 150] }));
  const stick = paperLayer(host, BOX, 'post-layer', parent => { line(parent, 'M92 350L250 176', '#a9764f', 8); line(parent, 'M246 180l-14 10M240 186l-6 16', '#c4574c', 3); }, { paper: PAPER, eager: true, origin: [92, 350] });
  const parts = [star, crack, bits, stick, candy];
  const swing = (size, duration) => move(star, [{ transform: 'none' }, { transform: `rotate(${size}deg)` }, { transform: `rotate(${-size * .6}deg)` }, { transform: `rotate(${size * .3}deg)` }, { transform: 'none' }], duration, 180, 'ease-in-out');
  const strike = () => move(stick, [{ transform: 'rotate(-24deg)' }, { transform: 'rotate(4deg)', offset: .3 }, { transform: 'rotate(-24deg)' }], 700, 0, 'ease-in-out');
  stick.style.transform = 'rotate(-24deg)';
  return {
    reset() { clear(parts); hide(crack); hide(bits); hide(candy); star.style.opacity = ''; },
    play({ step }) {
      if (step === 0) { clear(parts); hide(crack); hide(bits); hide(candy); star.style.opacity = ''; }
      strike();
      if (step < 2) { swing(step ? 16 : 9, step ? 1400 : 1100); if (step === 1) move(crack, [{ opacity: 0 }, { opacity: 1 }], 200, 250, 'linear'); return; }
      for (const piece of [star, crack]) move(piece, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.25)' }], 380, 200, 'ease-out');
      move(bits, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)', offset: .35 }, { opacity: 0, transform: 'scale(1.3)' }], 1000, 200, 'ease-out');
      move(candy, [{ opacity: 0, transform: `${shift(0, -150)} scale(.5)` }, { opacity: 1, transform: 'none', offset: .7 }, { opacity: 1, transform: `${shift(0, -4)}`, offset: .85 }, { opacity: 1, transform: 'none' }], 1000, 300, 'cubic-bezier(.3,.6,.4,1)');
    },
  };
}

export const postcardScenes = { iceland, uk, finland, taiwan, japan, newzealand, canada, brazil, mexico };
