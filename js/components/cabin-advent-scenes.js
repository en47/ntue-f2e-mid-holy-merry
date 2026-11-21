// The day's little scene in the advent box's lid (cabin-advent.js), one for each of the twenty-four windows and one for
// the lid's cover while no window's day is shown: cut from paper in layers like the Intro postcards, it stands up like a
// pop-up page when its day is shown and plays once; a tap plays it again or goes on a step (another candle lit, another
// strawberry on the cake …). Every moving part is its own layer, moved by the compositor; a layer drawn hidden stays so
// until its turn. Each scene returns how many taps make a round (`steps`), `play(step, sound)` and `reset()`.
// Under reduced motion a tap still shows its result, without the movement.
import { paperLayer, pine, shape } from './paper-art.js';
import { cloud } from './paper-props.js';

export const SCENE = '0 0 280 240';
const PAPER = { paper: { scale: .5, grain: .45, shadow: .26 }, eager: true };
const NIGHT = '#2b3d58', NIGHT_DEEP = '#22324a', HILL = '#3a506d', SNOW = '#fbf8f1', SNOW_SHADE = '#dfe6ec', MOON = '#f3e6b8';
const WALL = '#ecdcc0', WALL_SHADE = '#e3cfae', WOOD = '#a8774d', WOOD_DARK = '#6b4a33', WOOD_LIGHT = '#c9a27a', INSIDE = '#4a3428';
const RED = '#b5443c', RED_DARK = '#8f3530', GREEN = '#3f6653', GREEN_LIGHT = '#5f8a70', GOLD = '#e0b04f', GOLD_DARK = '#b98a3c';
const CREAM = '#fbf3df', SKIN = '#f2cda9', INK = '#3b2a24', ORANGE = '#d9874a', SLATE = '#7b95a6';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const path = (g, d, fill, extra = {}) => shape('path', { d, fill, ...extra }, g);
const line = (g, d, stroke, width = 3) => path(g, d, 'none', { stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const circle = (g, cx, cy, r, fill, extra = {}) => shape('circle', { cx, cy, r, fill, ...extra }, g);
const ellipse = (g, cx, cy, rx, ry, fill, extra = {}) => shape('ellipse', { cx, cy, rx, ry, fill, ...extra }, g);
const rect = (g, x, y, width, height, fill, rx = 0, extra = {}) => shape('rect', { x, y, width, height, rx, fill, ...extra }, g);
const group = (g, x, y, scale = 1, turn = 0) => shape('g', { transform: `translate(${x} ${y}) rotate(${turn}) scale(${scale})` }, g);
// Moves are written in scene units and turned into percentages of the layer (every layer spans the whole scene).
const shift = (x, y = 0) => `translate(${(x / 2.8).toFixed(2)}%, ${(y / 2.4).toFixed(2)}%)`;
const layer = (host, draw, origin, paper = PAPER.paper) => paperLayer(host, SCENE, 'advent-cut', draw, { ...PAPER, paper, origin });
const hidden = (host, draw, origin, paper) => hide(layer(host, draw, origin, paper));
function move(node, frames, duration = 600, delay = 0, easing = 'cubic-bezier(.2,.8,.3,1.2)') {
  return node.animate(frames, { duration: reduced() ? 1 : duration, delay: reduced() ? 0 : delay, easing, fill: 'both' });
}
const clear = (...nodes) => nodes.flat().forEach(node => node.getAnimations().forEach(animation => animation.cancel()));
function hide(node) { node.style.opacity = 0; return node; }
const show = node => { node.style.opacity = ''; return node; };
const pop = (node, delay = 0, from = shift(0, -60)) => move(show(node), [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], 620, delay, 'cubic-bezier(.3,1.4,.5,1)');
// A burst of paper bits, a puff of snow, notes or steam: one layer, scaled out from its middle and faded.
const burst = (node, delay = 0) => move(show(node), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)', offset: .35 }, { opacity: 0, transform: 'scale(1.25)' }], 1100, delay, 'ease-out');
const rise = (node, delay = 0, by = -40) => move(show(node), [{ opacity: 0, transform: 'none' }, { opacity: 1, transform: shift(0, by * .4), offset: .3 }, { opacity: 0, transform: shift(0, by) }], 1500, delay, 'ease-out');

// The scenery the scenes share: a night over snow (a far hill, the moon), a room's wall over a table.
function night(g, { sky = NIGHT, moon = [212, 64], far = true, ground = 'M0 196Q70 180 140 192T280 188V240H0Z' } = {}) {
  rect(g, 0, 0, 280, 240, sky);
  if (moon) { circle(g, moon[0], moon[1], 15, MOON); circle(g, moon[0] + 7, moon[1] - 5, 13, sky); }
  if (far) path(g, 'M0 178Q50 156 104 170T206 160 280 168V240H0Z', HILL);
  path(g, ground, SNOW);
}
function room(g, { wall = WALL, table = 186 } = {}) {
  rect(g, 0, 0, 280, 240, wall);
  for (let x = 14; x < 280; x += 42) rect(g, x, 0, 16, table, WALL_SHADE, 0, { opacity: .5 });
  rect(g, 0, table, 280, 240 - table, WOOD); rect(g, 0, table, 280, 7, WOOD_LIGHT); rect(g, 0, table + 30, 280, 24, '#000', 0, { opacity: .07 });
}
const snowDots = (g, dots, fill = SNOW) => dots.forEach(([x, y, r = 2.6]) => circle(g, x, y, r, fill));
const FLURRY = [[40, 30], [70, 60, 2], [104, 24], [128, 70, 2.2], [160, 40], [190, 76, 2], [220, 30, 2.4], [246, 66], [56, 96, 2], [150, 104, 2], [236, 108, 2.2], [92, 120, 2.4], [200, 128, 2]];

// The sleigh, side on, facing right: its curled back, the seat, the scrolled front, gold trim, the runner under it.
function sleighArt(g, x, y, s = 1, { body = RED, trim = GOLD, runner = WOOD_DARK } = {}) {
  const at = group(g, x, y, s);
  line(at, 'M-8 6H116C130 6 138-2 138-14', runner, 5); line(at, 'M12-12V6M94-12V6', runner, 4);
  path(at, 'M0-12C-14-14-20-40-14-62C-10-76 6-78 8-66 10-58 2-54-2-56 2-44 10-36 24-36H84C100-36 106-46 112-54 118-62 130-60 128-50 126-40 116-24 104-12Z', body);
  line(at, 'M2-20H102', trim, 3); line(at, 'M-6-58C-2-66 4-66 4-62', trim, 2.5); line(at, 'M120-52C122-48 120-44 116-44', trim, 2.5);
}

// Cover: the little house on the sill, small on a snowy hill at night; a tap lets the snow come down harder.
function cover(host) {
  layer(host, g => {
    night(g, { moon: [62, 60] });
    pine(g, 40, 196, 64, GREEN); pine(g, 246, 192, 54, GREEN_LIGHT);
  });
  layer(host, g => {
    rect(g, 168, 104, 14, 30, '#9c5a44'); rect(g, 165, 100, 20, 7, SNOW, 3);
    path(g, 'M96 190V140H184V190Z', WALL);
    path(g, 'M86 144L140 98 194 144Z', RED); path(g, 'M86 144L140 98 194 144H184L140 108 96 144Z', SNOW);
    for (const [x, y] of [[106, 152], [158, 152]]) { rect(g, x, y, 16, 14, GOLD, 2); line(g, `M${x + 8} ${y}v14M${x} ${y + 7}h16`, WOOD_DARK, 1.6); }
    path(g, 'M131 190V170Q140 160 149 170V190Z', RED_DARK); circle(g, 140, 126, 6, GOLD);
    path(g, 'M70 196Q140 182 210 196V204H70Z', SNOW);
  });
  const smoke = hidden(host, g => { for (const [x, y, r] of [[176, 92, 6], [182, 80, 8], [174, 66, 9]]) circle(g, x, y, r, SNOW, { opacity: .8 }); }, [176, 96]);
  const flurry = hidden(host, g => snowDots(g, FLURRY));
  return {
    steps: 1,
    reset() { clear(smoke, flurry); hide(smoke); hide(flurry); },
    play() {
      clear(smoke, flurry);
      move(show(flurry), [{ opacity: 0, transform: shift(0, -50) }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .8 }, { opacity: 0, transform: shift(-10, 70) }], 2600, 0, 'linear');
      rise(smoke, 200, -30);
    },
  };
}

// 1: a little German advent calendar on the table, three little doors in it; each tap opens the next.
const LITTLE = [[104, 128, 22, 22, RED, 'star'], [154, 128, 22, 22, GREEN, 'heart'], [128, 156, 24, 30, GOLD, 'tree']];
function calendar(host) {
  layer(host, g => room(g));
  layer(host, g => {
    path(g, 'M84 192V110H196V192Z', '#f3e6cc');
    path(g, 'M72 114L140 56 208 114Z', RED); path(g, 'M72 114L140 56 208 114H198L140 66 82 114Z', SNOW);
    line(g, 'M86 120H194M86 150H194', '#7a5236', 4); line(g, 'M88 112V190M192 112V190', '#7a5236', 4);
    rect(g, 78, 190, 124, 6, WOOD_DARK, 2);
    for (const [x, y, w, h, , inside] of LITTLE) {
      rect(g, x - 3, y - 3, w + 6, h + 6, CREAM, 3); rect(g, x, y, w, h, INSIDE, 2);
      const cx = x + w / 2, cy = y + h / 2;
      if (inside === 'star') path(g, `M${cx} ${cy - 7}l2 5 5.5.4-4.2 3.4 1.4 5.4-4.7-3-4.7 3 1.4-5.4-4.2-3.4 5.5-.4Z`, GOLD);
      if (inside === 'heart') path(g, `M${cx} ${cy + 6}c-9-6-9-12-4-13 2-.5 4 1 4 3 0-2 2-3.5 4-3 5 1 5 7-4 13Z`, RED);
      if (inside === 'tree') { path(g, `M${cx} ${cy - 10}l9 15h-18Z`, GREEN_LIGHT); rect(g, cx - 2, cy + 5, 4, 5, WOOD); }
    }
  });
  const doors = LITTLE.map(([x, y, w, h, fill]) => layer(host, g => { rect(g, x, y, w, h, fill, 2); circle(g, x + w - 5, y + h / 2, 1.8, GOLD); }, [x, y + h / 2]));
  return {
    steps: 3,
    reset() { clear(doors); },
    play(step, sound) {
      if (step === 0) doors.forEach(door => move(door, [{ transform: 'none' }], 300, 0, 'ease-in'));
      move(doors[step], [{ transform: 'none' }, { transform: 'perspective(400px) rotateY(-150deg)' }], 760, step === 0 ? 320 : 0, 'cubic-bezier(.3,1.2,.5,1)');
      sound?.play('open');
    },
  };
}

// 2: the sleigh, checked: it rocks on its runners, its two bells swing, a puff of snow.
function sleigh(host) {
  layer(host, g => { night(g); pine(g, 30, 194, 70, GREEN); pine(g, 254, 190, 50, GREEN_LIGHT); });
  const body = layer(host, g => sleighArt(g, 62, 196), [130, 200]);
  const bells = layer(host, g => { line(g, 'M190 142C186 150 182 156 176 160', WOOD_DARK, 2.5); for (const [x, y] of [[176, 164], [186, 168]]) { circle(g, x, y, 6.5, GOLD); line(g, `M${x - 3} ${y + 2}h6`, GOLD_DARK, 1.5); } }, [190, 142]);
  const puff = hidden(host, g => snowDots(g, [[56, 196, 5], [48, 188, 4], [66, 186, 4.5], [42, 198, 3], [74, 194, 3.4]]), [58, 194]);
  return {
    steps: 1,
    reset() { clear(body, bells, puff); hide(puff); },
    play(step, sound) {
      move(body, [{ transform: 'none' }, { transform: 'rotate(-2.5deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(-1deg)' }, { transform: 'none' }], 900, 0, 'ease-in-out');
      move(bells, [{ transform: 'none' }, { transform: 'rotate(22deg)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'none' }], 1300, 60, 'ease-in-out');
      burst(puff); sound?.play('jingle');
    },
  };
}

// 3: Korvatunturi, the ear-shaped fell, under the northern lights; a wish floats up to it and its ears prick up.
function fell(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, NIGHT_DEEP);
    line(g, 'M-10 84C40 60 92 96 142 74S232 56 290 82', '#6fa88c', 14); line(g, 'M-10 108C50 90 100 116 150 98S240 86 290 104', '#7fb3b8', 8);
    for (const [x, y] of [[60, 40], [226, 46]]) circle(g, x, y, 1.6, MOON);
  });
  layer(host, g => {
    path(g, 'M-4 212C30 190 52 160 72 130 82 112 92 92 104 88 114 86 120 104 126 118 132 128 148 128 154 118 160 104 166 86 176 88 188 92 198 112 208 130 228 160 250 190 284 212Z', '#5d7d97');
    path(g, 'M208 130C228 160 250 190 284 212H200C214 184 214 154 208 130Z', '#000', { opacity: .08 });
  });
  const ears = [[104, 88, -1], [176, 88, 1]].map(([x, y, side]) => layer(host, g => {
    path(g, `M${x - 18} ${y + 30}C${x - 12} ${y + 12} ${x - 6} ${y} ${x} ${y} ${x + 7} ${y} ${x + 12} ${y + 14} ${x + 18} ${y + 30}Z`, '#5d7d97');
    path(g, `M${x - 11} ${y + 14}C${x - 7} ${y + 5} ${x - 3} ${y} ${x} ${y} ${x + 5} ${y} ${x + 9} ${y + 7} ${x + 12} ${y + 15} ${x + 5} ${y + 10} ${x - 4} ${y + 12} ${x - 11} ${y + 14}Z`, SNOW);
  }, [x + side * 2, y + 30]));
  layer(host, g => {
    path(g, 'M0 204Q80 188 140 198T280 196V240H0Z', SNOW); pine(g, 36, 210, 44, GREEN); pine(g, 58, 214, 32, GREEN_LIGHT); pine(g, 238, 212, 40, GREEN);
    rect(g, 168, 182, 28, 20, RED_DARK); path(g, 'M163 184L182 168 201 184Z', SNOW); rect(g, 175, 188, 7, 7, GOLD, 1);
  });
  const wish = hidden(host, g => { rect(g, 128, 206, 24, 16, CREAM, 2); line(g, 'M128 207l12 8 12-8', '#c9a877', 1.5); path(g, 'M140 218c-4-3-4-6-2-6.5 1-.2 2 .5 2 1.5 0-1 1-1.7 2-1.5 2 .5 2 3.5-2 6.5Z', RED); }, [140, 214]);
  return {
    steps: 1,
    reset() { clear(ears, wish); hide(wish); },
    play(step, sound) {
      move(show(wish), [{ opacity: 0, transform: 'none' }, { opacity: 1, transform: shift(-10, -30), offset: .2 }, { opacity: 1, transform: `${shift(12, -70)} scale(.8)`, offset: .55 }, { opacity: 0, transform: `${shift(0, -96)} scale(.4)` }], 1800, 0, 'ease-in-out');
      ears.forEach((ear, i) => move(ear, [{ transform: 'none' }, { transform: `rotate(${i ? 9 : -9}deg)` }, { transform: `rotate(${i ? -4 : 4}deg)` }, { transform: `rotate(${i ? 6 : -6}deg)` }, { transform: 'none' }], 700, 1500 + i * 160, 'ease-in-out'));
      sound?.play('happy');
    },
  };
}

// 4: the young reindeer's take-off practice: a run, a leap, head first into the cloud, and back down.
function reindeerArt(g, x, y, s = 1) {
  const at = group(g, x, y, s);
  line(at, 'M-16-30V0M-6-28V0M14-28V0M24-30V0', '#7a5236', 5);
  ellipse(at, 4, -40, 30, 16, '#9a6b47'); ellipse(at, 6, -34, 18, 8, '#c9a27a');
  path(at, 'M22-48C28-56 30-62 32-66 36-60 36-52 30-42Z', '#9a6b47');
  circle(at, 36, -68, 11, '#9a6b47'); ellipse(at, 46, -64, 9, 7, '#c9a27a'); circle(at, 54, -65, 3.6, RED);
  circle(at, 38, -71, 1.8, INK); path(at, 'M28-76C24-82 26-86 30-84 32-82 32-78 30-74Z', '#7a5236');
  line(at, 'M33-77C30-90 26-96 20-100M28-90L18-92M39-78C42-92 48-98 56-100M46-90L56-88', '#7a5236', 3);
  path(at, 'M-26-46C-32-50-34-44-30-40Z', SNOW); path(at, 'M24-52C30-48 36-48 40-54 40-48 34-42 26-44Z', RED_DARK);
}
function reindeer(host) {
  layer(host, g => { rect(g, 0, 0, 280, 240, '#56708f'); circle(g, 60, 52, 12, MOON, { opacity: .9 }); path(g, 'M0 190Q60 170 130 182T280 204V240H0Z', SNOW); pine(g, 246, 206, 46, GREEN); });
  const deer = layer(host, g => reindeerArt(g, 66, 188), [70, 188]);
  const sky = layer(host, g => cloud(g, 190, 88, .55), [190, 96]);
  const puff = hidden(host, g => snowDots(g, [[176, 112, 4], [192, 116, 3], [164, 104, 3], [206, 108, 3.4], [184, 122, 2.6]]), [184, 112]);
  return {
    steps: 1,
    reset() { clear(deer, sky, puff); hide(puff); },
    play(step, sound) {
      move(deer, [{ transform: 'none' }, { transform: 'translate(0, 1%) scale(1.04, .9)', offset: .14 }, { transform: `${shift(70, -78)} rotate(-12deg)`, offset: .42 }, { transform: `${shift(74, -74)} rotate(-6deg)`, offset: .56 }, { transform: `${shift(40, -24)} rotate(12deg)`, offset: .74 }, { transform: `${shift(6, 0)} rotate(0deg)`, offset: .88 }, { transform: 'none' }], 1800, 0, 'ease-in-out');
      move(sky, [{ transform: 'none' }, { transform: 'none', offset: .4 }, { transform: 'scale(1.12, .86)', offset: .48 }, { transform: 'scale(.96, 1.06)', offset: .6 }, { transform: 'none' }], 1800, 0, 'ease-out');
      burst(puff, 800);
      sound?.play('whoosh');
    },
  };
}

// 5: Nils's music box on the table, its lid up and a little fir on its turntable: the key turns, the fir spins, notes rise.
function musicbox(host) {
  layer(host, g => room(g, { table: 182 }));
  layer(host, g => {
    path(g, 'M86 130L98 84H206L198 130Z', WOOD_DARK); path(g, 'M94 126L104 90H200L193 126Z', RED_DARK);
    rect(g, 80, 126, 124, 58, WOOD, 4); rect(g, 80, 126, 124, 9, WOOD_LIGHT, 3); rect(g, 88, 142, 108, 34, '#000', 3, { opacity: .06 });
    path(g, 'M142 170c-11-7-11-15-5-16 3-.5 5 1.5 5 4 0-2.5 2-4.5 5-4 6 1 6 9-5 16Z', GOLD);
    rect(g, 86, 182, 12, 6, WOOD_DARK, 2); rect(g, 186, 182, 12, 6, WOOD_DARK, 2);
    ellipse(g, 142, 127, 22, 5, GOLD_DARK);
  });
  const fir = layer(host, g => {
    rect(g, 139, 112, 6, 14, WOOD_DARK); path(g, 'M142 66L160 96H150L164 116H120L134 96H124Z', GREEN_LIGHT);
    for (const [x, y, fill] of [[134, 104, RED], [150, 92, GOLD], [146, 110, CREAM]]) circle(g, x, y, 3.2, fill);
  }, [142, 120]);
  const key = layer(host, g => { line(g, 'M204 156H214', GOLD_DARK, 4); path(g, 'M214 156c0-9 12-11 12-3 0 3-3 3-6 3 3 0 6 0 6 3 0 8-12 6-12-3Z', GOLD); }, [214, 156]);
  const notes = hidden(host, g => {
    for (const [x, y, fill] of [[216, 112, INK], [236, 88, RED_DARK], [200, 72, INK]]) { ellipse(g, x, y, 5, 3.6, fill, { transform: `rotate(-20 ${x} ${y})` }); line(g, `M${x + 4} ${y - 1}V${y - 20}C${x + 8} ${y - 16} ${x + 12} ${y - 14} ${x + 12} ${y - 8}`, fill, 2); }
  }, [216, 96]);
  return {
    steps: 1,
    reset() { clear(fir, key, notes); hide(notes); },
    play(step, sound) {
      move(key, [{ transform: 'none' }, { transform: 'rotate(720deg)' }], 1400, 0, 'ease-in-out');
      move(fir, [{ transform: 'none' }, { transform: 'scaleX(-1)' }, { transform: 'none' }, { transform: 'scaleX(-1)' }, { transform: 'none' }], 1800, 200, 'ease-in-out');
      rise(notes, 300, -50); sound?.play('jingle');
    },
  };
}

// 6: St Nicholas's: a pair of polished boots on the mat by the front door; each tap, something more is found in them.
function boot(g, x, y, s = 1) {
  const at = group(g, x, y, s);
  path(at, 'M0 0V-58Q0-62 4-62H24Q28-62 28-58V-24C28-16 36-12 46-11 54-10 56-4 56 0Z', '#3d3230');
  rect(at, -1, -4, 58, 5, '#2a2220', 2); line(at, 'M6-54V-30', '#ffffff', 2.5).setAttribute('opacity', '.3');
  rect(at, -2, -64, 32, 6, '#5a4a44', 2);
}
const TREATS = [[80, 132, 'orange'], [117, 132, 'coin'], [124, 128, 'cane']];
function boots(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, '#dccfb4');
    rect(g, 168, 30, 94, 172, WOOD, 4); for (const [x, y, h] of [[178, 42, 58], [220, 42, 58], [178, 112, 78], [220, 112, 78]]) rect(g, x, y, 32, h, '#000', 2, { opacity: .07 });
    circle(g, 178, 132, 3.4, GOLD); circle(g, 215, 72, 17, 'none', { stroke: GREEN, 'stroke-width': 8 }); path(g, 'M215 86l-7 9 7-3 7 3Z', RED);
    rect(g, 0, 200, 280, 40, '#b48a5e'); line(g, 'M0 216H280', '#9c754d', 1.5); rect(g, 50, 196, 124, 12, '#9e5047', 3);
  });
  const treats = TREATS.map(([x, y, kind]) => hidden(host, g => {
    if (kind === 'orange') { circle(g, x, y, 10, ORANGE); path(g, `M${x} ${y - 10}c3-5 9-5 11-2-4 1-7 2-11 2Z`, GREEN_LIGHT); }
    if (kind === 'coin') { circle(g, x, y, 9, GOLD); circle(g, x, y, 6, 'none', { stroke: GOLD_DARK, 'stroke-width': 1.6 }); }
    if (kind === 'cane') { line(g, `M${x} ${y + 10}V${y - 22}C${x} ${y - 32} ${x + 12} ${y - 32} ${x + 12} ${y - 22}`, SNOW, 6); line(g, `M${x} ${y + 10}V${y - 22}C${x} ${y - 32} ${x + 12} ${y - 32} ${x + 12} ${y - 22}`, RED, 6).setAttribute('stroke-dasharray', '5 5'); }
  }, [x, y]));
  layer(host, g => { boot(g, 66, 198); boot(g, 102, 200, 1.04); });
  return {
    steps: 3,
    reset() { clear(treats); treats.forEach(hide); },
    play(step, sound) {
      if (step === 0) { clear(treats); treats.forEach(hide); }
      pop(treats[step], 0, shift(0, -90)); sound?.play('drop');
    },
  };
}

// 7: a strawberry shortcake on a plate, Japan's Christmas cake; a strawberry more for each tap, five in all.
const BERRIES = [[106, 112], [128, 104], [154, 104], [176, 112], [141, 122]];
function cake(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, '#e5c9a8');
    for (let x = 0; x < 280; x += 56) for (let y = (x / 56) % 2 ? 28 : 0; y < 240; y += 56) rect(g, x, y, 28, 28, '#ecd7bd');
    ellipse(g, 140, 182, 106, 34, SNOW); ellipse(g, 140, 182, 92, 28, 'none', { stroke: '#a9c8d6', 'stroke-width': 2.5 });
  });
  layer(host, g => {
    path(g, 'M72 120V168C72 182 102 192 140 192S208 182 208 168V120Z', '#fbf1df');
    path(g, 'M72 144H208V151C208 156 176 160 140 160S72 156 72 151Z', '#d98a7c');
    ellipse(g, 140, 120, 68, 20, '#fffaf0');
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; circle(g, 140 + Math.cos(a) * 60, 124 + Math.sin(a) * 14, 6, '#fffdf6'); }
  });
  const berries = BERRIES.map(([x, y]) => hidden(host, g => {
    path(g, `M${x} ${y + 10}C${x - 10} ${y + 2} ${x - 8} ${y - 7} ${x} ${y - 6} ${x + 8} ${y - 7} ${x + 10} ${y + 2} ${x} ${y + 10}Z`, RED);
    path(g, `M${x - 6} ${y - 6}L${x} ${y - 3}L${x + 6} ${y - 6}L${x} ${y - 10}Z`, GREEN_LIGHT);
    for (const [dx, dy] of [[-3, 0], [3, 1], [0, 5]]) circle(g, x + dx, y + dy, .9, '#f3d9a0');
  }, [x, y + 10]));
  return {
    steps: 5,
    reset() { clear(berries); berries.forEach(hide); },
    play(step, sound) {
      if (step === 0) { clear(berries); berries.forEach(hide); }
      pop(berries[step], 0, shift(0, -70)); sound?.play('drop');
    },
  };
}

// 8: the Ferris wheel in the playground at night, its gears oiled: a tap turns it on by one car, the drive gear spinning.
function wheel(host) {
  layer(host, g => { night(g, { moon: [54, 54] }); line(g, 'M140 108L96 204M140 108L184 204', WOOD_DARK, 7); rect(g, 82, 200, 116, 8, WOOD_DARK, 3); });
  const ring = layer(host, g => {
    circle(g, 140, 108, 70, 'none', { stroke: '#e3d3b0', 'stroke-width': 5 }); circle(g, 140, 108, 56, 'none', { stroke: '#e3d3b0', 'stroke-width': 2 });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(g, `M140 108L${(140 + Math.cos(a) * 70).toFixed(1)} ${(108 + Math.sin(a) * 70).toFixed(1)}`, '#e3d3b0', 2.5); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, x = 140 + Math.cos(a) * 70, y = 108 + Math.sin(a) * 70; circle(g, x, y, 10, [RED, GOLD, GREEN_LIGHT, CREAM][i % 4]); circle(g, x, y, 4.5, '#000', { opacity: .12 }); }
    circle(g, 140, 108, 9, GOLD);
  }, [140, 108]);
  const gear = layer(host, g => {
    const teeth = Array.from({ length: 20 }, (_, i) => { const a = i * Math.PI / 10, r = i % 2 ? 12 : 16; return `${(204 + Math.cos(a) * r).toFixed(1)} ${(186 + Math.sin(a) * r).toFixed(1)}`; });
    path(g, `M${teeth.join('L')}Z`, GOLD_DARK); circle(g, 204, 186, 5, INK);
  }, [204, 186]);
  let turned = 0;
  return {
    steps: 1,
    reset() { clear(ring, gear); turned = 0; },
    play(step, sound) {
      turned += 45;
      move(ring, [{ transform: `rotate(${turned - 45}deg)` }, { transform: `rotate(${turned}deg)` }], 1300, 0, 'cubic-bezier(.45,0,.2,1)');
      move(gear, [{ transform: `rotate(${-(turned - 45) * 4}deg)` }, { transform: `rotate(${-turned * 4}deg)` }], 1300, 0, 'cubic-bezier(.45,0,.2,1)');
      sound?.play('creak');
    },
  };
}

// 9: a poinsettia in its pot on the sill: its red "petals", which are leaves, open out round the little yellow flowers.
const bract = (g, x, y, turn, length, fill) => path(g, 'M0 0C8-6 22-8 40 0 22 8 8 6 0 0Z', fill, { transform: `translate(${x} ${y}) rotate(${turn}) scale(${length / 40})` });
function poinsettia(host) {
  layer(host, g => room(g, { wall: '#e6dcc6', table: 190 }));
  layer(host, g => {
    for (const [turn, length] of [[165, 62], [15, 62], [135, 54], [45, 54], [105, 40], [75, 40]]) bract(g, 140, 128, turn, length, GREEN);
    path(g, 'M104 146H176L166 202H114Z', '#b5674a'); path(g, 'M150 146H176L166 202H146Z', '#000', { opacity: .07 }); rect(g, 96, 138, 88, 14, '#c97a5a', 3);
  });
  const bud = layer(host, g => { for (const turn of [-150, -120, -90, -60, -30]) bract(g, 140, 120, turn, 30, GREEN_LIGHT); circle(g, 140, 120, 5, GOLD); }, [140, 120]);
  const bloom = hidden(host, g => {
    for (let i = 0; i < 8; i++) bract(g, 140, 114, i * 45 - 90, 60, i % 2 ? '#a8443c' : RED);
    for (let i = 0; i < 6; i++) bract(g, 140, 114, i * 60 - 60, 34, '#c4574c');
    for (const [x, y] of [[140, 114], [133, 109], [147, 110], [136, 120], [145, 120]]) circle(g, x, y, 3.4, GOLD);
  }, [140, 114]);
  return {
    steps: 1,
    reset() { clear(bud, bloom); hide(bloom); },
    play(step, sound) {
      clear(bloom);
      move(bud, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.6)' }], 400, 0, 'ease-in');
      move(show(bloom), [{ opacity: 0, transform: 'scale(.15) rotate(-60deg)' }, { opacity: 1, transform: 'scale(1.06) rotate(4deg)', offset: .7 }, { opacity: 1, transform: 'none' }], 1100, 150, 'ease-out');
      sound?.play('happy');
    },
  };
}

// 10: the sorting rack on the wall, six pigeonholes already full: a tap and another letter slides into an empty one.
const PIGEONHOLES = Array.from({ length: 9 }, (_, i) => [68 + (i % 3) * 50, 60 + Math.floor(i / 3) * 44]);
function envelope(g, x, y, turn = 0) {
  const at = group(g, x, y, 1, turn);
  rect(at, -16, -11, 32, 22, CREAM, 2); line(at, 'M-16-10L0 2 16-10', '#c9a877', 1.5); circle(at, 0, 3, 3, RED);
}
function rack(host) {
  layer(host, g => room(g, { table: 206 }));
  const frame = layer(host, g => {
    rect(g, 58, 50, 164, 146, WOOD, 5);
    for (const [x, y] of PIGEONHOLES) rect(g, x, y, 44, 38, INSIDE, 2);
    rect(g, 52, 192, 176, 10, WOOD_DARK, 3);
    for (const i of [0, 1, 3, 5, 6, 8]) envelope(g, PIGEONHOLES[i][0] + 22, PIGEONHOLES[i][1] + 22, (i % 2 ? -1 : 1) * 4);
  }, [140, 196]);
  const letters = [2, 4, 7].map(i => hidden(host, g => envelope(g, PIGEONHOLES[i][0] + 22, PIGEONHOLES[i][1] + 22, i === 4 ? 3 : -3), [PIGEONHOLES[i][0] + 22, PIGEONHOLES[i][1] + 22]));
  return {
    steps: 3,
    reset() { clear(frame, letters); letters.forEach(hide); },
    play(step, sound) {
      if (step === 0) { clear(frame, letters); letters.forEach(hide); }
      move(show(letters[step]), [{ opacity: 0, transform: `${shift(110, 90)} rotate(30deg)` }, { opacity: 1, transform: 'none' }], 760, 0, 'cubic-bezier(.2,.9,.3,1.05)');
      if (step === 2) move(frame, [{ transform: 'none' }, { transform: 'rotate(-1.6deg)' }, { transform: 'rotate(1.2deg)' }, { transform: 'none' }], 500, 760, 'ease-in-out');
      sound?.play('snap');
    },
  };
}

// 11: one of Iceland's thirteen Yule Lads at the window by night: he peeks over the sill and leaves a present in the shoe.
function yule(host) {
  layer(host, g => { rect(g, 0, 0, 280, 240, NIGHT); circle(g, 196, 60, 11, MOON); path(g, 'M0 150Q140 128 280 150V240H0Z', SNOW_SHADE); });
  const lad = hidden(host, g => {
    path(g, 'M120 180C120 150 134 140 150 140S180 150 180 180Z', '#5f8a70');
    circle(g, 150, 136, 16, SKIN); circle(g, 157, 140, 6, '#e8a493');
    for (const x of [144, 156]) circle(g, x, 132, 1.8, INK);
    path(g, 'M136 144C138 160 162 160 164 144 156 150 144 150 136 144Z', '#e9e4da');
    path(g, 'M132 128C134 104 150 92 174 88 164 104 168 118 168 128Z', RED); rect(g, 130, 124, 40, 8, SNOW, 4); circle(g, 174, 88, 5, SNOW);
  }, [150, 170]);
  layer(host, g => {
    path(g, 'M0 0H280V240H0ZM58 34H222V166H58Z', WALL, { 'fill-rule': 'evenodd' });
    path(g, 'M50 26H230V174H50ZM60 36H220V164H60Z', CREAM, { 'fill-rule': 'evenodd' }); line(g, 'M140 34V166M58 100H222', CREAM, 6);
    rect(g, 38, 166, 204, 12, WOOD, 3); rect(g, 44, 178, 192, 6, WOOD_DARK, 2);
  });
  const gift = hidden(host, g => { rect(g, 106, 140, 22, 18, GREEN, 2); rect(g, 115, 140, 4, 18, GOLD); path(g, 'M117 140c-6-7-10-2-4 0 6-2 10-7 4 0Z', GOLD); }, [117, 150]);
  layer(host, g => {
    path(g, 'M96 150C94 160 92 166 96 168H150C156 168 156 160 150 158 140 154 132 154 128 148L126 140C116 136 106 138 96 142Z', RED);
    path(g, 'M94 140C106 134 118 134 128 138L127 146C116 142 106 143 95 148Z', SNOW);
  });
  return {
    steps: 1,
    reset() { clear(lad, gift); hide(lad); hide(gift); },
    play(step, sound) {
      clear(gift); hide(gift);
      move(show(lad), [{ opacity: 0, transform: shift(0, 44) }, { opacity: 1, transform: 'none', offset: .28 }, { opacity: 1, transform: `${shift(-4, 0)} rotate(-4deg)`, offset: .5 }, { opacity: 1, transform: 'none', offset: .72 }, { opacity: 0, transform: shift(0, 44) }], 2200, 0, 'ease-in-out');
      pop(gift, 800, shift(10, -60)); sound?.play('pick');
    },
  };
}

// 12: Elo's snowman in his new scarf: a gust of wind, the scarf's end flies up, his hat tips and settles.
function snowman(host) {
  layer(host, g => { rect(g, 0, 0, 280, 240, '#9fb7cb'); cloud(g, 66, 70, .38, '#f4f1ea'); path(g, 'M0 184Q70 166 140 178T280 172V240H0Z', SNOW); pine(g, 238, 190, 62, GREEN_LIGHT); });
  layer(host, g => {
    line(g, 'M114 144L76 122M88 129L80 116', WOOD_DARK, 3.5); line(g, 'M166 144L204 124M192 130L200 116', WOOD_DARK, 3.5);
    circle(g, 140, 174, 36, SNOW); path(g, 'M160 145A36 36 0 0 1 152 208 30 30 0 0 0 160 145Z', SNOW_SHADE); circle(g, 140, 122, 24, SNOW);
    for (const y of [162, 178, 194]) circle(g, 140, y, 3, INK);
    for (const x of [132, 148]) circle(g, x, 116, 2.6, INK);
    path(g, 'M141 122L162 127 141 129Z', ORANGE);
    for (const [x, y] of [[130, 132], [135, 135], [141, 136], [147, 135], [152, 132]]) circle(g, x, y, 1.4, INK);
    path(g, 'M116 140C128 148 152 148 164 140L166 150C152 156 128 156 114 150Z', RED); line(g, 'M124 146L124 152M134 148V154M146 148V154M156 146V152', CREAM, 3);
  });
  const tail = layer(host, g => { path(g, 'M148 146L156 186 170 182 160 144Z', RED); line(g, 'M152 160L164 157M154 170L166 167', CREAM, 3); line(g, 'M157 186V192M162 185V191M167 183V189', RED_DARK, 2); }, [154, 146]);
  const hat = layer(host, g => { rect(g, 124, 74, 32, 26, INK, 3); rect(g, 116, 96, 48, 7, INK, 3); rect(g, 124, 88, 32, 6, RED_DARK); }, [140, 100]);
  const gust = hidden(host, g => { line(g, 'M20 92C50 82 70 96 96 88', SNOW, 2.5); line(g, 'M10 126C44 118 66 130 92 122', SNOW, 2.5); snowDots(g, [[60, 106, 2.4], [100, 112, 2], [36, 144, 2.2]]); });
  return {
    steps: 1,
    reset() { clear(tail, hat, gust); hide(gust); },
    play(step, sound) {
      move(show(gust), [{ opacity: 0, transform: shift(-40) }, { opacity: 1, offset: .3 }, { opacity: 0, transform: shift(170) }], 1300, 0, 'ease-out');
      move(tail, [{ transform: 'none' }, { transform: 'rotate(-34deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }], 1500, 220, 'ease-in-out');
      move(hat, [{ transform: 'none' }, { transform: `${shift(4, -8)} rotate(12deg)` }, { transform: 'rotate(-5deg)' }, { transform: 'none' }], 1100, 260, 'ease-in-out');
      sound?.play('whoosh');
    },
  };
}

// 13: St Lucia's day in Sweden: a girl in white with a crown of candles in its lingonberry wreath; each tap lights one more,
// and with the last the windows of the village below light up too.
const CANDLES = [124, 134, 146, 156];
function lucia(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, NIGHT_DEEP);
    path(g, 'M0 196Q70 182 140 190T280 186V240H0Z', SNOW);
    for (const [x, base, w] of [[30, 196, 40], [214, 192, 46], [244, 194, 30]]) { rect(g, x - w / 2, base - 26, w, 26, '#41546e'); path(g, `M${x - w / 2 - 4} ${base - 24}L${x} ${base - 26 - w * .5}L${x + w / 2 + 4} ${base - 24}Z`, SNOW); }
    for (const [x, y] of [[24, 178], [36, 178], [206, 174], [222, 174], [244, 178]]) rect(g, x - 4, y - 4, 8, 8, '#2b3a50', 1);
  });
  const windows = hidden(host, g => { for (const [x, y] of [[24, 178], [36, 178], [206, 174], [222, 174], [244, 178]]) rect(g, x - 4, y - 4, 8, 8, GOLD, 1); });
  const halo = hidden(host, g => { circle(g, 140, 118, 54, GOLD, { opacity: .16 }); circle(g, 140, 118, 36, GOLD, { opacity: .14 }); }, [140, 118]);
  layer(host, g => {
    path(g, 'M100 240C106 196 116 166 126 152H154C164 166 174 196 180 240Z', SNOW); path(g, 'M150 156C160 170 168 200 172 240H154C156 206 154 178 150 156Z', SNOW_SHADE);
    path(g, 'M112 200C130 206 150 206 168 200L170 212C150 218 130 218 110 212Z', RED);
    path(g, 'M118 128C116 104 164 104 162 128 160 150 120 150 118 128Z', '#e8c77a'); circle(g, 140, 132, 17, SKIN);
    line(g, 'M132 132q3 3 6 0M143 132q3 3 6 0', INK, 1.6); circle(g, 131, 138, 3, '#e8a493', { opacity: .7 }); circle(g, 149, 138, 3, '#e8a493', { opacity: .7 });
    path(g, 'M136 141q4 3 8 0', 'none', { stroke: RED_DARK, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    ellipse(g, 140, 116, 25, 7, GREEN); for (const [x, y] of [[122, 118], [132, 121], [148, 121], [158, 118]]) circle(g, x, y, 2.2, RED);
    for (const x of CANDLES) rect(g, x - 2.6, 96, 5.2, 20, CREAM, 1.5);
  });
  const flames = CANDLES.map(x => hidden(host, g => { path(g, `M${x} 82C${x + 5} 88 ${x + 5} 94 ${x} 96 ${x - 5} 94 ${x - 5} 88 ${x} 82Z`, GOLD); path(g, `M${x} 88C${x + 2} 91 ${x + 2} 93 ${x} 94 ${x - 2} 93 ${x - 2} 91 ${x} 88Z`, '#f7dfa4'); }, [x, 96]));
  return {
    steps: 4,
    reset() { clear(flames, windows, halo); [...flames, windows, halo].forEach(hide); },
    play(step, sound) {
      if (step === 0) { clear(flames, windows, halo); [...flames, windows, halo].forEach(hide); }
      move(show(flames[step]), [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.25)', offset: .5 }, { opacity: 1, transform: 'scale(.92)', offset: .75 }, { opacity: 1, transform: 'none' }], 700, 0, 'ease-out');
      if (step === 3) { move(show(windows), [{ opacity: 0 }, { opacity: 1 }], 900, 500, 'ease-out'); move(show(halo), [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], 1000, 400, 'ease-out'); }
      sound?.play(step === 3 ? 'cheer' : 'happy');
    },
  };
}

// 14: Ola's cleaned postmark stamp over a letter on the post office desk: down it comes, thump, and the mark is on it.
function stamp(host) {
  layer(host, g => { room(g, { wall: '#e6d8bd', table: 160 }); rect(g, 0, 160, 280, 80, '#a8774d'); for (const y of [182, 206, 228]) line(g, `M0 ${y}H280`, '#946540', 1.4); });
  layer(host, g => {
    path(g, 'M58 206L92 168H226L196 206Z', CREAM); path(g, 'M58 206L130 186 196 206', 'none', { stroke: '#c9a877', 'stroke-width': 1.6 }); path(g, 'M92 168L140 186 226 168', 'none', { stroke: '#e3d3b0', 'stroke-width': 1.6 });
    path(g, 'M190 174L212 174 206 186 184 186Z', '#c7dbe6'); path(g, 'M194 176L208 176 204 184 190 184Z', GREEN_LIGHT);
  });
  const mark = hidden(host, g => { ellipse(g, 150, 190, 17, 9, 'none', { stroke: RED, 'stroke-width': 2.4 }); line(g, 'M168 186q5-3 10 0t10 0M168 192q5-3 10 0t10 0', RED, 1.8); circle(g, 150, 190, 2.4, RED); }, [150, 190]);
  const tool = layer(host, g => {
    circle(g, 150, 70, 13, WOOD_LIGHT); rect(g, 144, 80, 12, 40, WOOD, 3); rect(g, 126, 118, 48, 16, WOOD_DARK, 3); rect(g, 128, 133, 44, 6, RED_DARK, 2);
  }, [150, 136]);
  return {
    steps: 1,
    reset() { clear(tool, mark); hide(mark); },
    play(step, sound) {
      clear(mark); hide(mark);
      move(tool, [{ transform: 'none' }, { transform: shift(0, -10), offset: .25 }, { transform: `${shift(0, 48)} scale(1.02, .96)`, offset: .45 }, { transform: shift(0, 46), offset: .6 }, { transform: 'none' }], 1200, 0, 'ease-in-out');
      move(show(mark), [{ opacity: 0 }, { opacity: 0, offset: .45 }, { opacity: 1, offset: .5 }, { opacity: 1 }], 1200, 0, 'linear');
      sound?.play('thud');
    },
  };
}

// 15: the first Christmas card sold, England, 1843: it opens on its fold to a toast, three glasses raised together.
function card(host) {
  layer(host, g => room(g, { wall: '#e9dcc4', table: 192 }));
  layer(host, g => {
    rect(g, 110, 58, 106, 136, '#fffaf0', 3); rect(g, 118, 66, 90, 120, 'none', 2, { stroke: GREEN, 'stroke-width': 1.6 });
    for (const [x, turn] of [[142, -16], [163, 0], [184, 16]]) { const at = group(g, x, 128, 1, turn); path(at, 'M-9-26H9C9-12 4-6 0-6-4-6-9-12-9-26Z', '#e9eef0'); path(at, 'M-8-18H8C7-11 3-8 0-8-3-8-7-11-8-18Z', RED); line(at, 'M0-6V12M-7 12H7', '#cfd8dc', 2); }
    for (const [x, y, r] of [[152, 92, 2], [163, 86, 2.4], [174, 92, 2]]) circle(g, x, y, r, GOLD);
    for (const turn of [-30, 30]) path(g, 'M0 0C8-8 21-6 27 0 21 6 8 8 0 0Z', GREEN, { transform: `translate(163 168) scale(${turn < 0 ? -1 : 1} 1) rotate(${Math.abs(turn)})` });
    circle(g, 160, 166, 3.2, RED); circle(g, 166, 167, 3.2, RED);
  });
  const leftSide = hidden(host, g => { path(g, 'M110 58L26 66V188L110 194Z', '#f6efe0'); line(g, 'M46 98L94 94M46 112L90 109M46 126L84 124', '#c9b48f', 2); for (const turn of [-30, 30]) path(g, 'M0 0C6-6 16-5 21 0 16 5 6 6 0 0Z', GREEN, { transform: `translate(68 160) scale(${turn < 0 ? -1 : 1} 1) rotate(${Math.abs(turn)})` }); circle(g, 68, 159, 2.8, RED); });
  const front = layer(host, g => {
    rect(g, 110, 58, 106, 136, '#f3e6cc', 3); rect(g, 118, 66, 90, 120, 'none', 2, { stroke: RED_DARK, 'stroke-width': 2 });
    for (const turn of [-40, 10, 60]) path(g, 'M0 0C10-10 26-8 34 0 26 8 10 10 0 0Z', GREEN, { transform: `translate(163 126) rotate(${turn - 90})` });
    for (const [x, y] of [[159, 128], [167, 128], [163, 134]]) circle(g, x, y, 4.4, RED);
  }, [110, 126]);
  front.style.backfaceVisibility = 'hidden';
  return {
    steps: 2,
    reset() { clear(front, leftSide); hide(leftSide); },
    play(step, sound) {
      const shut = { transform: 'none' }, open = { transform: 'perspective(500px) rotateY(-170deg)' };
      move(front, step ? [open, shut] : [shut, open], 1000, 0, 'cubic-bezier(.4,0,.2,1)');
      move(show(leftSide), step ? [{ opacity: 1 }, { opacity: 1, offset: .4 }, { opacity: 0, offset: .5 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0, offset: .5 }, { opacity: 1, offset: .6 }, { opacity: 1 }], 1000, 0, 'linear');
      sound?.play('open');
    },
  };
}

// 16: the fire laid with the wood Santa split: it flares up, a marshmallow on a stick turns golden, sparks fly up.
function hearth(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, WALL); rect(g, 0, 206, 280, 34, WOOD_DARK);
    path(g, 'M56 206V86H224V206Z', '#d8cbb4'); for (const [x, y, w] of [[56, 86, 40], [96, 86, 46], [142, 86, 40], [182, 86, 42], [56, 110, 26], [196, 110, 28], [56, 140, 22], [202, 140, 22], [56, 170, 26], [198, 170, 26]]) rect(g, x + 2, y + 2, w - 4, 20, '#cfc0a5', 2);
    path(g, 'M84 206V148C84 118 196 118 196 148V206Z', INSIDE); rect(g, 44, 74, 192, 14, WOOD, 3);
    path(g, 'M64 88V110C64 118 76 118 80 112L84 104V88Z', RED); rect(g, 62, 86, 24, 6, SNOW, 2);
  });
  const fire = layer(host, g => {
    path(g, 'M110 196C104 176 116 162 122 146 126 160 132 164 136 150 140 136 146 128 148 120 154 138 166 150 168 166 172 156 174 152 176 148 182 166 180 184 172 196Z', ORANGE);
    path(g, 'M124 196C120 182 128 172 132 164 136 172 140 174 144 164 148 156 150 150 152 146 156 160 164 170 162 184 160 192 158 196 156 196Z', GOLD);
    path(g, 'M136 196C134 188 138 182 142 178 144 184 148 186 150 182 152 188 152 194 150 196Z', '#f7dfa4');
  }, [142, 198]);
  layer(host, g => { line(g, 'M100 200L184 190', WOOD_DARK, 9); line(g, 'M104 192L180 202', '#7a5236', 9); });
  const sparks = hidden(host, g => { for (const [x, y] of [[132, 112], [150, 100], [142, 124], [160, 116], [124, 128]]) circle(g, x, y, 1.8, GOLD); }, [142, 130]);
  const stick = layer(host, g => { line(g, 'M262 236L182 150', '#8a6a4c', 3.5); rect(g, 170, 136, 18, 16, SNOW, 5); }, [262, 236]);
  const toasted = hidden(host, g => { rect(g, 170, 136, 18, 16, '#d9a35f', 5); rect(g, 172, 138, 8, 5, '#e8c27f', 2); }, [262, 236]);
  return {
    steps: 1,
    reset() { clear(fire, sparks, stick, toasted); hide(sparks); hide(toasted); },
    play(step, sound) {
      clear(toasted); hide(toasted);
      move(fire, [{ transform: 'none' }, { transform: 'scale(1.18, 1.3)' }, { transform: 'scale(.96, 1.08)' }, { transform: 'scale(1.1, 1.2)' }, { transform: 'none' }], 1400, 0, 'ease-in-out');
      for (const piece of [stick, toasted]) move(piece, [{ transform: 'none' }, { transform: 'rotate(-6deg)', offset: .3 }, { transform: 'rotate(-6deg)', offset: .7 }, { transform: 'none' }], 1800, 0, 'ease-in-out');
      move(show(toasted), [{ opacity: 0 }, { opacity: 0, offset: .35 }, { opacity: 1, offset: .7 }, { opacity: 1 }], 1800, 0, 'linear');
      rise(sparks, 200, -60); sound?.play('crackle');
    },
  };
}

// 17: glass baubles on a fir, as Germany's glass-blowers first made them: a tap sets them swinging, one glinting.
const BAUBLES = [[88, 100, 118, 13, RED], [192, 100, 120, 14, GOLD], [58, 162, 182, 15, '#8fb3c4'], [222, 162, 184, 15, CREAM]];
function baubles(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, '#d9e2de'); for (let x = 20; x < 280; x += 46) rect(g, x, 0, 18, 240, '#cfdad5', 0, { opacity: .6 });
    rect(g, 0, 218, 280, 22, WOOD); pine(g, 140, 236, 210, GREEN);
  });
  const balls = BAUBLES.map(([x, top, y, r, fill]) => layer(host, g => {
    line(g, `M${x} ${top}V${y - r}`, '#c9b48f', 1.6); rect(g, x - 4, y - r - 6, 8, 7, GOLD_DARK, 2);
    circle(g, x, y, r, fill); path(g, `M${x - r} ${y}Q${x} ${y + r * .4} ${x + r} ${y}`, 'none', { stroke: fill === GOLD ? RED : GOLD, 'stroke-width': 2.4 });
    ellipse(g, x - r * .38, y - r * .38, r * .22, r * .12, '#ffffff', { opacity: .6, transform: `rotate(-40 ${x - r * .38} ${y - r * .38})` });
  }, [x, top]));
  const glint = hidden(host, g => path(g, 'M182 124L194 112 199 117 187 129Z', '#ffffff', { opacity: .7 }), [190, 120]);
  return {
    steps: 1,
    reset() { clear(balls, glint); hide(glint); },
    play(step, sound) {
      balls.forEach((ball, i) => move(ball, [{ transform: 'none' }, { transform: `rotate(${i % 2 ? -14 : 14}deg)` }, { transform: `rotate(${i % 2 ? 9 : -9}deg)` }, { transform: `rotate(${i % 2 ? -5 : 5}deg)` }, { transform: 'none' }], 1600, i * 120, 'ease-in-out'));
      move(show(glint), [{ opacity: 0, transform: shift(-12, 12) }, { opacity: 1, offset: .5 }, { opacity: 0, transform: shift(12, -12) }], 900, 500, 'ease-in-out');
      sound?.play('jingle');
    },
  };
}

// 18: Santa himself, cheering you on (the report's day): his arm goes up for a high five, a shower of paper confetti.
function cheer(host) {
  layer(host, g => { rect(g, 0, 0, 280, 240, '#6f8fa8'); path(g, 'M0 196Q70 182 140 190T280 186V240H0Z', SNOW); pine(g, 34, 196, 58, GREEN); pine(g, 250, 194, 48, GREEN_LIGHT); });
  const arm = layer(host, g => { path(g, 'M186 196C200 176 214 150 222 122L240 128C234 160 220 188 206 206Z', RED); rect(g, 218, 112, 26, 12, SNOW, 5, { transform: 'rotate(18 231 118)' }); path(g, 'M224 112C220 96 232 84 244 90 252 94 252 106 244 114Z', GREEN); path(g, 'M244 96C246 86 254 84 256 90 256 96 250 100 246 102Z', GREEN); }, [196, 200]);
  layer(host, g => {
    path(g, 'M58 240C62 196 96 168 140 168S218 196 222 240Z', RED); rect(g, 132, 168, 16, 72, SNOW); path(g, 'M96 182C112 172 168 172 184 182 176 192 104 192 96 182Z', SNOW);
    circle(g, 140, 120, 26, SKIN);
    path(g, 'M112 118C110 158 124 180 140 182 156 180 170 158 168 118 160 132 120 132 112 118Z', SNOW);
    path(g, 'M140 128C132 122 120 124 118 132 126 130 134 134 140 132 146 134 154 130 162 132 160 124 148 122 140 128Z', '#ece8e0');
    circle(g, 140, 124, 5, '#e8a493');
    line(g, 'M127 110q4-4 8 0M145 110q4-4 8 0', INK, 2);
    circle(g, 124, 120, 4, '#e8a493', { opacity: .6 }); circle(g, 156, 120, 4, '#e8a493', { opacity: .6 });
    path(g, 'M112 100C114 76 132 62 156 64 176 66 186 84 190 98 178 90 170 92 168 100Z', RED); rect(g, 108, 94, 64, 14, SNOW, 7); circle(g, 192, 100, 8, SNOW);
  });
  const bits = hidden(host, g => {
    const colours = [GOLD, RED, GREEN_LIGHT, CREAM, SLATE];
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, d = 44 + (i % 3) * 14, x = 228 + Math.cos(a) * d, y = 96 + Math.sin(a) * d * .8; rect(g, x - 3, y - 2, 7, 4, colours[i % 5], 1, { transform: `rotate(${i * 37} ${x} ${y})` }); }
  }, [228, 96]);
  return {
    steps: 1,
    reset() { clear(arm, bits); hide(bits); },
    play(step, sound) {
      move(arm, [{ transform: 'none' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'none' }], 1300, 0, 'ease-in-out');
      burst(bits, 250); sound?.play('cheer');
    },
  };
}

// 19: a gingerbread house in the dark wood, as in Hansel and Gretel: a knock, the door swings open, a gingerbread man waves.
function gingerbread(host) {
  layer(host, g => { night(g, { moon: [58, 56], far: false }); for (const [x, h] of [[24, 120], [52, 90], [234, 110], [262, 84]]) pine(g, x, 200, h, '#2f5240'); });
  const man = hidden(host, g => {
    circle(g, 140, 160, 8, '#c08a5a'); path(g, 'M132 168H148L154 186 148 196 144 186H136L132 196 126 186Z', '#c08a5a'); line(g, 'M132 172L122 166M148 172L158 164', '#c08a5a', 5);
    for (const x of [137, 143]) circle(g, x, 158, 1.2, INK); path(g, 'M136 163q4 3 8 0', 'none', { stroke: SNOW, 'stroke-width': 1.4 });
    for (const y of [175, 182]) circle(g, 140, y, 1.5, RED);
  }, [140, 196]);
  layer(host, g => {
    path(g, 'M90 196V122H190V196ZM128 196V164Q140 150 152 164V196Z', '#b07a4f', { 'fill-rule': 'evenodd' });
    path(g, 'M78 126L140 74 202 126Z', '#8f5a3c'); line(g, 'M78 126L140 74 202 126', SNOW, 6);
    for (let i = 0; i < 9; i++) circle(g, 86 + i * 13.5, 128, 4.4, SNOW);
    for (const [x, y, fill] of [[112, 106, RED], [140, 92, GREEN_LIGHT], [168, 106, GOLD], [126, 112, GOLD], [154, 112, RED]]) circle(g, x, y, 4, fill);
    rect(g, 100, 140, 20, 18, GOLD, 2); rect(g, 160, 140, 20, 18, GOLD, 2); for (const x of [100, 160]) rect(g, x - 2, 138, 24, 22, 'none', 3, { stroke: SNOW, 'stroke-width': 2.4 });
    path(g, 'M128 196V164Q140 150 152 164V196', 'none', { stroke: SNOW, 'stroke-width': 2.4 });
  });
  const door = layer(host, g => { path(g, 'M128 196V164Q140 150 152 164V196Z', '#9a6440'); path(g, 'M132 192V166Q140 156 148 166V192Z', 'none', { stroke: SNOW, 'stroke-width': 1.6 }); circle(g, 147, 180, 2.2, RED); }, [128, 178]);
  return {
    steps: 1,
    reset() { clear(door, man); hide(man); },
    play(step, sound) {
      move(door, [{ transform: 'none' }, { transform: 'perspective(400px) rotateY(-120deg)', offset: .3 }, { transform: 'perspective(400px) rotateY(-120deg)', offset: .8 }, { transform: 'none' }], 2600, 0, 'ease-in-out');
      move(show(man), [{ opacity: 0, transform: 'none' }, { opacity: 1, transform: 'none', offset: .2 }, { opacity: 1, transform: `${shift(0, -6)} rotate(-8deg)`, offset: .35 }, { opacity: 1, transform: 'rotate(6deg)', offset: .5 }, { opacity: 1, transform: `${shift(0, -6)} rotate(-6deg)`, offset: .62 }, { opacity: 1, transform: 'none', offset: .75 }, { opacity: 0, transform: 'none', offset: .9 }, { opacity: 0 }], 2600, 0, 'ease-in-out');
      sound?.play('creak');
    },
  };
}

// 20: Holly's hand warmer for the cold sky, held between a pair of mittens: they squeeze it, it glows, warmth rises.
function mitten(g, x, y, turn, flip = 1) {
  const at = shape('g', { transform: `translate(${x} ${y}) rotate(${turn}) scale(${flip} 1)` }, g);
  path(at, 'M-16 0V-38C-16-56 16-56 16-38V0Z', '#9e5047'); path(at, 'M14-22C26-22 30-36 22-40 17-42 14-36 14-30Z', '#9e5047');
  rect(at, -16, -16, 32, 5, CREAM); rect(at, -18, -2, 36, 16, CREAM, 3); line(at, 'M-12 2V10M-6 2V10M0 2V10M6 2V10M12 2V10', '#e3cfae', 2);
}
function warmer(host) {
  layer(host, g => { night(g, { moon: [216, 58] }); pine(g, 34, 196, 50, GREEN); pine(g, 250, 200, 40, GREEN_LIGHT); });
  const glow = hidden(host, g => { circle(g, 140, 134, 60, GOLD, { opacity: .14 }); circle(g, 140, 134, 42, GOLD, { opacity: .16 }); }, [140, 134]);
  const pouch = layer(host, g => { rect(g, 114, 110, 52, 46, CREAM, 10); rect(g, 114, 110, 52, 46, 'none', 10, { stroke: '#e3cfae', 'stroke-width': 3 }); path(g, 'M140 146c-11-7-11-16-5-17 3-.5 5 1.5 5 4 0-2.5 2-4.5 5-4 6 1 6 10-5 17Z', RED); }, [140, 134]);
  const hands = [[96, 200, 14, 1], [184, 200, -14, -1]].map(([x, y, turn, flip]) => layer(host, g => mitten(g, x, y, turn, flip), [x, y]));
  const warmth = hidden(host, g => { for (const x of [126, 140, 154]) line(g, `M${x} 100C${x - 6} 92 ${x + 6} 86 ${x} 78S${x + 6} 66 ${x} 58`, '#f7dfa4', 3); }, [140, 96]);
  return {
    steps: 1,
    reset() { clear(glow, pouch, hands, warmth); hide(glow); hide(warmth); },
    play(step, sound) {
      hands.forEach((hand, i) => move(hand, [{ transform: 'none' }, { transform: shift(i ? -5 : 5) }, { transform: 'none' }, { transform: shift(i ? -5 : 5) }, { transform: 'none' }], 1000, 0, 'ease-in-out'));
      move(pouch, [{ transform: 'none' }, { transform: 'scale(.95, 1.04)', offset: .25 }, { transform: 'none', offset: .5 }, { transform: 'scale(.95, 1.04)', offset: .75 }, { transform: 'none' }], 1000, 0, 'ease-in-out');
      move(show(glow), [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1.05)', offset: .6 }, { opacity: .8, transform: 'none' }], 1600, 600, 'ease-out');
      rise(warmth, 700, -36); sound?.play('pick');
    },
  };
}

// 21: around the winter solstice, the longest night of the year: the moon crosses the whole sky over a cabin with its
// light on, and the stars come out one by one.
function solstice(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, '#1f2d44'); path(g, 'M0 186Q60 160 120 176T240 166 280 170V240H0Z', HILL); path(g, 'M0 204Q90 190 160 200T280 196V240H0Z', SNOW);
    rect(g, 196, 172, 40, 28, '#3d3230'); path(g, 'M190 174L216 152 242 174Z', SNOW); rect(g, 210, 180, 10, 10, GOLD, 1);
    pine(g, 40, 206, 54, GREEN); pine(g, 66, 210, 38, GREEN_LIGHT);
  });
  const stars = [[70, 40], [120, 72], [168, 34], [222, 70], [100, 30]].map(([x, y]) => hidden(host, g => path(g, `M${x} ${y - 6}L${x + 1.6} ${y - 1.6} ${x + 6} ${y} ${x + 1.6} ${y + 1.6} ${x} ${y + 6} ${x - 1.6} ${y + 1.6} ${x - 6} ${y} ${x - 1.6} ${y - 1.6}Z`, MOON), [x, y]));
  const moon = layer(host, g => circle(g, 44, 110, 15, MOON), [44, 110]);
  return {
    steps: 1,
    reset() { clear(moon, stars); stars.forEach(hide); },
    play(step, sound) {
      clear(stars); stars.forEach(hide);
      move(moon, [{ transform: 'none' }, { transform: shift(48, -52), offset: .25 }, { transform: shift(96, -70), offset: .5 }, { transform: shift(144, -52), offset: .75 }, { transform: shift(192, 0) }], 4200, 0, 'linear');
      stars.forEach((star, i) => move(show(star), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], 600, 700 + i * 600, 'ease-out'));
      sound?.play('happy');
    },
  };
}

// 22: the little reindeer's supper in the barn: oat cakes, a carrot, lichen in the basket; each tap, one is munched.
const SUPPER = [[96, 152, 'carrot'], [120, 148, 'oats'], [146, 150, 'lichen']];
function feed(host) {
  layer(host, g => {
    for (let x = 0; x < 280; x += 28) rect(g, x, 0, 28, 240, x % 56 ? '#a8774d' : '#9c6c45');
    rect(g, 0, 200, 280, 40, '#d9b36a'); for (const [x, y] of [[26, 214], [84, 226], [196, 214], [242, 228]]) line(g, `M${x} ${y}l18-4M${x + 4} ${y + 6}l16-3`, '#b98a3c', 2);
  });
  const food = SUPPER.map(([x, y, kind]) => layer(host, g => {
    if (kind === 'carrot') { path(g, `M${x - 4} ${y - 18}L${x + 6} ${y - 16}L${x + 2} ${y + 14}Z`, ORANGE); line(g, `M${x} ${y - 18}l-4-8M${x + 2} ${y - 18}l2-9M${x + 4} ${y - 17}l6-6`, GREEN_LIGHT, 2.4); }
    if (kind === 'oats') for (const [dx, dy] of [[0, 0], [10, 6], [-6, 8]]) { circle(g, x + dx, y + dy, 8, '#d9b07a'); for (const [ex, ey] of [[-2, -2], [2, 1], [-1, 3]]) circle(g, x + dx + ex, y + dy + ey, 1, '#b98a5e'); }
    if (kind === 'lichen') for (const [dx, dy, r] of [[0, 0, 7], [8, 4, 6], [-6, 6, 5], [4, -6, 5]]) circle(g, x + dx, y + dy, r, '#b9c9a0');
  }, [x, y]));
  layer(host, g => { path(g, 'M70 160H176L166 202H80Z', WOOD_LIGHT); for (let i = 0; i < 4; i++) line(g, `M72 ${166 + i * 9}H174`, '#b08a5e', 1.8); rect(g, 66, 154, 114, 10, '#b08a5e', 4); });
  const head = layer(host, g => {
    path(g, 'M286 230C266 200 244 176 230 150L254 136C268 164 284 188 300 210Z', '#9a6b47');
    path(g, 'M234 132C220 126 200 128 194 138 190 146 198 154 212 154 226 154 240 150 246 142Z', '#9a6b47'); ellipse(g, 198, 144, 10, 8, '#c9a27a'); circle(g, 190, 143, 3.6, RED);
    circle(g, 220, 134, 2, INK); path(g, 'M236 128C240 118 248 116 250 120 250 126 244 130 238 132Z', '#7a5236');
    line(g, 'M228 128C226 112 220 104 212 100M222 114L212 110M236 126C240 110 248 102 258 100M246 110L256 112', '#7a5236', 3);
  }, [250, 160]);
  return {
    steps: 3,
    reset() { clear(food, head); },
    play(step, sound) {
      if (step === 0) clear(food);
      const [x, y] = SUPPER[step];
      move(food[step], [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: `${shift((194 - x) * .5, -40)} rotate(-20deg)`, offset: .3 }, { opacity: 1, transform: `${shift(194 - x, 144 - y)} scale(.7)`, offset: .5 }, { opacity: 0, transform: `${shift(194 - x, 144 - y)} scale(.2)`, offset: .62 }, { opacity: 0, transform: `${shift(194 - x, 144 - y)} scale(.2)` }], 1700, 0, 'ease-in-out');
      move(head, [{ transform: 'none' }, { transform: 'none', offset: .45 }, { transform: 'rotate(-5deg)', offset: .55 }, { transform: 'rotate(2deg)', offset: .65 }, { transform: 'rotate(-4deg)', offset: .75 }, { transform: 'rotate(1deg)', offset: .85 }, { transform: 'none' }], 1700, 0, 'ease-in-out');
      sound?.play('chew');
    },
  };
}

// 23: the sleigh, nearly loaded: each tap, one more present on the seat before the sack, the last on top of the pile.
const PRESENTS = [[88, 168, 26, 24, GREEN, GOLD], [114, 168, 22, 20, GOLD, RED], [100, 144, 22, 18, RED, GOLD], [102, 126, 16, 14, SLATE, CREAM]];
function load(host) {
  layer(host, g => { night(g, { moon: [56, 56] }); rect(g, 232, 70, 60, 130, WOOD, 3); for (const y of [90, 130, 170]) line(g, `M232 ${y}H292`, WOOD_DARK, 1.6); path(g, 'M226 64L262 40 298 64Z', SNOW); });
  layer(host, g => {
    path(g, 'M112 170C102 142 108 114 130 104 124 96 128 90 138 92 146 88 156 92 154 100 176 108 186 138 178 170Z', '#9e5047');
    line(g, 'M128 102C136 106 146 106 154 102', GOLD, 3); line(g, 'M132 118C128 132 130 148 134 162M158 118C162 132 160 148 156 162', '#8a4238', 2);
  });
  const presents = PRESENTS.map(([x, y, w, h, fill, ribbon]) => hidden(host, g => { rect(g, x - w / 2, y - h, w, h, fill, 2); rect(g, x - 2.5, y - h, 5, h, ribbon); path(g, `M${x} ${y - h}c-6-7-10-2-4 0 6-2 10-7 4 0Z`, ribbon); }, [x, y]));
  layer(host, g => sleighArt(g, 54, 198));
  return {
    steps: 4,
    reset() { clear(presents); presents.forEach(hide); },
    play(step, sound) {
      if (step === 0) { clear(presents); presents.forEach(hide); }
      pop(presents[step], 0, shift(0, -100));
      sound?.play(step === 3 ? 'jingle' : 'drop');
    },
  };
}

// 24: Christmas Eve: over the snowy roofs, Santa's sleigh and his reindeer fly across the big full moon.
function flight(host) {
  layer(host, g => {
    rect(g, 0, 0, 280, 240, NIGHT_DEEP); circle(g, 176, 92, 46, MOON); circle(g, 160, 80, 8, '#e9dba8'); circle(g, 190, 106, 6, '#e9dba8');
    for (const [x, base, w, h] of [[28, 240, 60, 56], [92, 240, 54, 70], [150, 240, 64, 50], [214, 240, 58, 64], [266, 240, 50, 54]]) { rect(g, x - w / 2, base - h, w, h, '#2a3a52'); path(g, `M${x - w / 2 - 6} ${base - h + 2}L${x} ${base - h - w * .42}L${x + w / 2 + 6} ${base - h + 2}Z`, SNOW); }
    for (const [x, y] of [[20, 206], [84, 196], [104, 214], [146, 216], [224, 204], [262, 214]]) rect(g, x - 5, y - 5, 10, 10, GOLD, 1);
  });
  const team = hidden(host, g => {
    const ink = '#1a2638', at = group(g, 0, 0, .78);
    for (const x of [96, 132]) { ellipse(at, x, 120, 16, 7, ink); line(at, `M${x - 10} 124l-6 10M${x - 4} 125l-2 10M${x + 8} 124l4 9M${x + 12} 123l8 7`, ink, 2.6); path(at, `M${x + 12} 116C${x + 16} 108 ${x + 20} 104 ${x + 26} 104 ${x + 28} 108 ${x + 24} 112 ${x + 18} 116Z`, ink); line(at, `M${x + 22} 104l-2-10M${x + 20} 98l-5-2M${x + 25} 104l4-9`, ink, 2); }
    line(at, 'M60 120C80 118 104 118 132 118', ink, 1.6);
    sleighArt(at, -6, 136, .52, { body: ink, trim: ink, runner: ink });
    circle(at, 24, 98, 7, ink); path(at, 'M18 96C20 84 30 80 36 84 32 88 30 92 30 96Z', ink); path(at, 'M14 116C12 104 18 100 26 100 34 102 36 110 34 116Z', ink);
  }, [60, 100], { scale: .5, grain: .2, shadow: 0, rim: '#1a2638' });
  return {
    steps: 1,
    reset() { clear(team); hide(team); },
    play(step, sound) {
      move(show(team), [{ opacity: 0, transform: `${shift(-120, 70)} rotate(-8deg)` }, { opacity: 1, transform: `${shift(-80, 50)} rotate(-8deg)`, offset: .12 }, { opacity: 1, transform: `${shift(150, -30)} rotate(-6deg)`, offset: .82 }, { opacity: 0, transform: `${shift(220, -60)} rotate(-6deg)` }], 3600, 0, 'linear');
      sound?.play('jingle');
    },
  };
}

// The scenes by day (the first is the first of December), and the cover.
export const ADVENT_SCENES = [calendar, sleigh, fell, reindeer, musicbox, boots, cake, wheel, poinsettia, rack, yule, snowman, lucia, stamp, card, hearth, baubles, cheer, gingerbread, warmer, solstice, feed, load, flight];
export const coverScene = cover;
