// The Christmas Vending page's night, cut from paper like the other pages: a deep blue sky with a paper moon and a few
// stars, a far range of snowy peaks with a little village under it, its windows lit, and then the snow, one flat field
// from side to side, pines standing in it at both edges and drifts in front. On the left a street lamp, holly on its
// post, throws a pool of warm light on the snow. A few flakes drift down. Each piece that moves (the stars' twinkle, the
// lamp's glow, the flakes) is a layer of its own, moved by css/vending.css only without reduced motion.
import { holly, paperLayer, shape } from './paper-art.js';
import { facetedPeak, snowyFir, star } from './paper-props.js';

const PAPER = { paper: { scale: .9, grain: .42, shadow: .22, rim: '#93a7bb' }, eager: true }, SNOWY = { paper: { scale: .9, grain: .45, shadow: .18, rim: '#fffdf6' }, eager: true };
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent.append(node); return node; };
const piece = (host, className, viewBox, draw, options = PAPER) => paperLayer(element('div', `vending-piece ${className}`, host), viewBox, '', draw, options);
const STARS = [[90, 70, 9], [230, 150, 6], [330, 50, 7], [520, 120, 10], [690, 40, 6], [840, 130, 8], [980, 60, 6], [1110, 160, 7], [1320, 110, 9], [1400, 40, 6], [160, 210, 5], [620, 220, 5]];
const TWINKLE = [[430, 80, 8], [760, 180, 7], [1220, 60, 8], [40, 160, 6]];

// The moon: a pale paper crescent with two faint rounds of light about it.
function moon(g) {
  for (const [r, opacity] of [[70, .1], [50, .16]]) shape('circle', { cx: 80, cy: 80, r, fill: '#f7e9b8', opacity }, g);
  shape('path', { d: 'M88 42A40 40 0 1 0 118 96 32 32 0 1 1 88 42Z', fill: '#f6e3a4' }, g);
}
const stars = list => g => { for (const [x, y, size] of list) star(g, x, y, size, '#f3df9e'); };
// The far range and the village under it, in the night's blues, the windows warm.
function range(g) {
  const tones = { cream: '#dbe4ee', ice: '#a9bfd3', sky: '#7f9bb6', dusk: '#5d7a98' };
  facetedPeak(g, 180, 60, 300, 240, 220, tones); facetedPeak(g, 560, 20, 300, 300, 260, tones); facetedPeak(g, 980, 70, 300, 260, 240, tones); facetedPeak(g, 1330, 40, 300, 260, 240, tones);
  shape('path', { d: 'M0 250C200 226 420 244 720 232S1180 222 1440 240V300H0Z', fill: '#4c6886' }, g);
  for (const [x, w, h, roof] of [[250, 34, 22, '#8f5a4c'], [300, 26, 18, '#3f5a56'], [1030, 30, 20, '#8f5a4c'], [1076, 38, 24, '#5a4a5c'], [1124, 24, 16, '#3f5a56']]) {
    shape('rect', { x, y: 244 - h, width: w, height: h, fill: '#d9cdb8' }, g);
    shape('path', { d: `M${x - 4} ${244 - h}L${x + w / 2} ${236 - h - w / 3}L${x + w + 4} ${244 - h}Z`, fill: roof }, g);
    shape('rect', { x: x + w / 2 - 4, y: 248 - h, width: 8, height: 7, fill: '#f4cf74' }, g);
  }
}
// The snow, one field from edge to edge: a far shelf with its blue shadow, then the near snow.
function snow(g) {
  shape('path', { d: 'M0 40C240 20 520 46 760 34S1200 18 1440 36V400H0Z', fill: '#c9d8e3' }, g);
  shape('path', { d: 'M0 70C260 50 560 78 840 62S1260 52 1440 66V400H0Z', fill: '#e7eef2' }, g);
  shape('path', { d: 'M0 150C300 130 640 160 960 142S1320 132 1440 146V400H0Z', fill: '#f6f3ea' }, g);
}
const pines = list => g => { for (const [x, base, h, v] of list) snowyFir(g, x, base, h, v, .6); };
// The street lamp: an iron post with a lantern, a bow of holly; its glow and the warm pool on the snow are their own layers.
function lampPost(g) {
  shape('path', { d: 'M92 588L96 170H110L114 588Z', fill: '#4b3f45' }, g);
  shape('path', { d: 'M78 592Q103 574 128 592Z', fill: '#4b3f45' }, g);
  shape('path', { d: 'M103 172C103 150 118 138 140 138', fill: 'none', stroke: '#4b3f45', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M126 140H170L162 150H134Z', fill: '#3c3238' }, g);
  shape('path', { d: 'M134 150H162L168 214H128Z', fill: '#f6d38a' }, g);
  shape('path', { d: 'M148 150V214M131 182H165', stroke: '#3c3238', 'stroke-width': 3 }, g);
  shape('path', { d: 'M124 214H172L166 224H130Z', fill: '#3c3238' }, g);
  shape('path', { d: 'M126 140Q148 118 170 140Z', fill: '#f4f1ea' }, g);
  holly(g, 103, 300, .8);
}
const lampGlow = g => { for (const [r, opacity] of [[150, .1], [100, .14], [56, .2]]) shape('circle', { cx: 148, cy: 184, r, fill: '#ffd98a', opacity }, g); };
const lampPool = g => { for (const [rx, ry, opacity] of [[220, 44, .16], [150, 30, .2], [80, 16, .22]]) shape('ellipse', { cx: 240, cy: 60, rx, ry, fill: '#ffd68c', opacity }, g); };
// Drifts in front, at both corners.
const drift = d => g => shape('path', { d, fill: '#fbf8f1' }, g);

export function mountScene(host) {
  piece(host, 'vending-stars', '0 0 1440 260', stars(STARS), { paper: null, eager: true, preserveAspectRatio: 'xMidYMin slice' });
  piece(host, 'vending-twinkle', '0 0 1440 260', stars(TWINKLE), { paper: null, eager: true, preserveAspectRatio: 'xMidYMin slice' });
  piece(host, 'vending-moon', '0 0 160 160', moon, { paper: { scale: .4, grain: .3, shadow: 0, rim: '#f6e9c4' }, eager: true });
  piece(host, 'vending-range', '0 0 1440 300', range, { ...PAPER, preserveAspectRatio: 'xMidYMax slice' });
  piece(host, 'vending-snow', '0 0 1440 400', snow, { ...SNOWY, preserveAspectRatio: 'none' });
  piece(host, 'vending-pines is-left', '0 0 360 320', pines([[70, 300, 230, 0], [170, 312, 160, 2], [260, 306, 110, 1]]), SNOWY);
  piece(host, 'vending-pines is-right', '0 0 360 320', pines([[300, 300, 240, 1], [190, 310, 170, 0], [100, 314, 110, 2]]), SNOWY);
  const lamp = element('div', 'vending-lamp', host);
  paperLayer(lamp, '0 0 480 120', 'vending-pool', lampPool, { paper: null, eager: true });
  paperLayer(lamp, '0 0 300 600', 'vending-glow', lampGlow, { paper: null, eager: true });
  paperLayer(lamp, '0 0 300 600', 'vending-post', lampPost, PAPER);
  piece(host, 'vending-drift is-left', '0 0 400 120', drift('M0 120V60C60 30 140 20 220 44S360 70 400 120Z'), SNOWY);
  piece(host, 'vending-drift is-right', '0 0 400 120', drift('M400 120V54C330 26 250 22 170 48S40 76 0 120Z'), SNOWY);
  const flakes = element('div', 'vending-flakes', host);
  for (let i = 0; i < 14; i++) { const flake = element('i', 'vending-flake', flakes); flake.style.left = `${(i * 37 + 11) % 100}%`; flake.style.setProperty('--delay', `${-((i * 1.9) % 12)}s`); flake.style.setProperty('--drift', `${(i % 3 - 1) * 18}px`); }
}
