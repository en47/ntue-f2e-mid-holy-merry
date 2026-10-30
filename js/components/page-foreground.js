// Paper-cut ground shared by all four pages: same hills and layout, different objects per page.
import { holly, paperLayer, pauseOffscreen, pine, shape } from './paper-art.js';

const SNOW = '#fff9eb', LEFT_BOX = '0 0 420 250', RIGHT_BOX = '0 0 300 220';
const LEFT_GROUND = 'M0 250V224C70 210 150 216 220 228S360 224 420 250Z';
const RIGHT_GROUND = 'M0 220C40 196 120 192 170 200S260 190 300 204V220Z';

function hills(root) {
  paperLayer(root, '0 0 1440 240', 'foreground-hills', parent => {
    shape('path', { d: 'M0 96C170 56 300 118 480 92S760 44 960 88 1260 118 1440 70V240H0Z', fill: '#cfe1e7' }, parent);
    shape('path', { d: 'M0 150C220 110 360 160 590 136S940 92 1150 136 1340 150 1440 118V240H0Z', fill: '#e6eeee' }, parent);
  }, { preserveAspectRatio: 'none', paper: { scale: 1.2, grain: .45, shadow: .16, rim: '#fbf3e3' } });
  paperLayer(root, '0 0 1440 240', 'foreground-hills', parent => {
    shape('path', { d: 'M0 196C200 162 420 204 660 182S1120 160 1440 188V240H0Z', fill: SNOW }, parent);
  }, { preserveAspectRatio: 'none', paper: null });
}

function gift(parent, x, y, width, height, fill, ribbon) {
  shape('rect', { x, y, width, height, rx: 5, fill }, parent);
  shape('rect', { x: x - 5, y: y - 8, width: width + 10, height: 22, rx: 5, fill }, parent);
  shape('rect', { x: x + width / 2 - 8, y: y - 8, width: 16, height: height + 8, fill: ribbon }, parent);
  const cx = x + width / 2;
  shape('path', { d: `M${cx} ${y - 6}C${cx - 16} ${y - 44} ${cx - 58} ${y - 40} ${cx - 50} ${y - 16} ${cx - 44} ${y - 2} ${cx - 16} ${y - 2} ${cx} ${y - 6}ZM${cx} ${y - 6}C${cx + 16} ${y - 44} ${cx + 58} ${y - 40} ${cx + 50} ${y - 16} ${cx + 44} ${y - 2} ${cx + 16} ${y - 2} ${cx} ${y - 6}Z`, fill: ribbon }, parent);
  shape('circle', { cx, cy: y - 7, r: 8, fill: ribbon }, parent);
}

function snowman(parent, x, base) {
  const ball = (cy, r) => {
    shape('circle', { cx: x, cy, r, fill: '#fbf7ee' }, parent);
    shape('path', { d: `M${x + r * .35} ${cy - r * .92}A${r} ${r} 0 0 1 ${x + r * .35} ${cy + r * .92}A${r * 1.3} ${r * 1.3} 0 0 0 ${x + r * .35} ${cy - r * .92}Z`, fill: '#d9e5ea' }, parent);
  };
  ball(base - 42, 44); ball(base - 104, 32); ball(base - 152, 23);
  shape('path', { d: `M${x - 27} ${base - 120}C${x - 8} ${base - 110} ${x + 10} ${base - 110} ${x + 28} ${base - 120}L${x + 28} ${base - 110}C${x + 10} ${base - 100} ${x - 8} ${base - 100} ${x - 27} ${base - 110}Z`, fill: '#b5544c' }, parent);
  shape('path', { d: `M${x + 12} ${base - 110}L${x + 24} ${base - 76}L${x + 8} ${base - 78}Z`, fill: '#a34a43' }, parent);
  shape('path', { d: `M${x - 20} ${base - 170}H${x + 22}M${x - 14} ${base - 170}L${x - 12} ${base - 206}H${x + 14}L${x + 16} ${base - 170}Z`, fill: '#5a4a44', stroke: '#5a4a44', 'stroke-width': 6, 'stroke-linejoin': 'round' }, parent);
  shape('path', { d: `M${x + 12} ${base - 152}L${x + 42} ${base - 146}L${x + 12} ${base - 142}Z`, fill: '#d98a4e' }, parent);
  for (const [cx, cy] of [[x - 8, base - 160], [x + 8, base - 160], [x - 2, base - 106], [x - 2, base - 88], [x - 2, base - 58], [x - 2, base - 36]]) shape('circle', { cx, cy, r: 3.6, fill: '#4b3d38' }, parent);
}

function cottage(parent, x, base) {
  shape('path', { d: `M${x - 62} ${base}V${base - 74}H${x + 62}V${base}Z`, fill: '#dcc6a4' }, parent);
  shape('path', { d: `M${x - 84} ${base - 70}L${x} ${base - 136}L${x + 84} ${base - 70}Z`, fill: '#a8564c' }, parent);
  shape('path', { d: `M${x - 88} ${base - 66}C${x - 70} ${base - 92} ${x - 40} ${base - 108} ${x} ${base - 142} ${x + 40} ${base - 108} ${x + 70} ${base - 92} ${x + 88} ${base - 66} ${x + 60} ${base - 76} ${x + 44} ${base - 70} ${x + 26} ${base - 90} ${x} ${base - 110} ${x - 26} ${base - 90} ${x - 44} ${base - 70} ${x - 60} ${base - 76} ${x - 74} ${base - 72} ${x - 88} ${base - 66}Z`, fill: '#fbf8f1' }, parent);
  shape('rect', { x: x - 44, y: base - 56, width: 30, height: 30, rx: 3, fill: '#efbe62' }, parent);
  shape('path', { d: `M${x - 29} ${base - 56}V${base - 26}M${x - 44} ${base - 41}H${x - 14}`, stroke: '#94785f', 'stroke-width': 3, fill: 'none' }, parent);
  shape('path', { d: `M${x + 12} ${base}V${base - 52}C${x + 12} ${base - 66} ${x + 42} ${base - 66} ${x + 42} ${base - 52}V${base}Z`, fill: '#8a6248' }, parent);
}

function openBook(parent, x, base) {
  shape('path', { d: `M${x - 118} ${base}L${x - 110} ${base - 18}H${x + 110}L${x + 118} ${base}Z`, fill: '#8a5a44' }, parent);
  shape('path', { d: `M${x} ${base - 12}C${x - 34} ${base - 34} ${x - 74} ${base - 34} ${x - 108} ${base - 16}V${base - 92}C${x - 74} ${base - 112} ${x - 34} ${base - 110} ${x} ${base - 88}Z`, fill: '#f6eddc' }, parent);
  shape('path', { d: `M${x} ${base - 12}C${x + 34} ${base - 34} ${x + 74} ${base - 34} ${x + 108} ${base - 16}V${base - 92}C${x + 74} ${base - 112} ${x + 34} ${base - 110} ${x} ${base - 88}Z`, fill: '#fbf4e6' }, parent);
  shape('path', { d: `M${x - 88} ${base - 80}C${x - 66} ${base - 92} ${x - 40} ${base - 92} ${x - 18} ${base - 78}M${x - 88} ${base - 62}C${x - 66} ${base - 74} ${x - 40} ${base - 74} ${x - 18} ${base - 60}M${x - 88} ${base - 44}C${x - 66} ${base - 56} ${x - 40} ${base - 56} ${x - 18} ${base - 42}`, stroke: '#c9b79c', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

function popupTree(parent, x, base) {
  pine(parent, x, base, 78, '#5f8a70');
  shape('path', { d: `M${x + 20} ${base - 96}l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z`, fill: '#e0b04f' }, parent);
}

function candle(parent, x, base) {
  shape('path', { d: `M${x - 26} ${base}C${x - 22} ${base - 12} ${x + 22} ${base - 12} ${x + 26} ${base}Z`, fill: '#c79a50' }, parent);
  shape('rect', { x: x - 11, y: base - 66, width: 22, height: 58, rx: 3, fill: '#f6e9d3' }, parent);
}

function flame(parent, x, base) {
  shape('path', { d: `M${x} ${base - 104}C${x + 13} ${base - 88} ${x + 13} ${base - 72} ${x} ${base - 68} ${x - 13} ${base - 72} ${x - 13} ${base - 88} ${x} ${base - 104}Z`, fill: '#e9a83f' }, parent);
  shape('path', { d: `M${x} ${base - 90}C${x + 6} ${base - 82} ${x + 6} ${base - 74} ${x} ${base - 71} ${x - 6} ${base - 74} ${x - 6} ${base - 82} ${x} ${base - 90}Z`, fill: '#f8e3a4' }, parent);
}

function globe(parent, x, base) {
  shape('path', { d: `M${x - 34} ${base}H${x + 34}L${x + 20} ${base - 16}H${x - 20}Z`, fill: '#94785f' }, parent);
  shape('path', { d: `M${x} ${base - 14}V${base - 34}`, stroke: '#94785f', 'stroke-width': 9, fill: 'none' }, parent);
  shape('circle', { cx: x, cy: base - 88, r: 56, fill: '#a8c6cc' }, parent);
  shape('path', { d: `M${x - 44} ${base - 118}C${x - 20} ${base - 134} ${x - 2} ${base - 124} ${x + 2} ${base - 104} ${x - 12} ${base - 92} ${x - 34} ${base - 94} ${x - 44} ${base - 118}ZM${x + 8} ${base - 84}C${x + 30} ${base - 96} ${x + 50} ${base - 84} ${x + 46} ${base - 64} ${x + 30} ${base - 48} ${x + 12} ${base - 54} ${x + 8} ${base - 84}ZM${x - 34} ${base - 72}C${x - 22} ${base - 70} ${x - 16} ${base - 56} ${x - 26} ${base - 46} ${x - 38} ${base - 50} ${x - 40} ${base - 62} ${x - 34} ${base - 72}Z`, fill: '#6f9676' }, parent);
}

function postcard(parent, x, y, angle) {
  const card = shape('g', { transform: `rotate(${angle} ${x} ${y})` }, parent);
  shape('rect', { x: x - 44, y: y - 30, width: 88, height: 60, rx: 4, fill: '#fbf4e6' }, card);
  shape('rect', { x: x + 16, y: y - 22, width: 20, height: 24, fill: '#b5544c' }, card);
  shape('path', { d: `M${x - 34} ${y - 12}H${x + 4}M${x - 34} ${y + 2}H${x + 4}M${x - 34} ${y + 16}H${x - 8}`, stroke: '#c9b79c', 'stroke-width': 3, fill: 'none' }, card);
}

function mailbox(parent, x, base) {
  shape('path', { d: `M${x - 9} ${base}V${base - 92}H${x + 9}V${base}Z`, fill: '#94785f' }, parent);
  shape('path', { d: `M${x - 62} ${base - 86}V${base - 136}C${x - 62} ${base - 176} ${x + 62} ${base - 176} ${x + 62} ${base - 136}V${base - 86}Z`, fill: '#b5544c' }, parent);
  shape('path', { d: `M${x - 66} ${base - 136}C${x - 62} ${base - 178} ${x + 62} ${base - 178} ${x + 66} ${base - 136} ${x + 40} ${base - 152} ${x + 20} ${base - 142} ${x} ${base - 152} ${x - 20} ${base - 142} ${x - 40} ${base - 152} ${x - 66} ${base - 136}Z`, fill: '#fbf8f1' }, parent);
  shape('rect', { x: x - 34, y: base - 124, width: 68, height: 10, rx: 4, fill: '#7f3a35' }, parent);
}

function envelope(parent, x, y, angle) {
  const letter = shape('g', { transform: `rotate(${angle} ${x} ${y})` }, parent);
  shape('rect', { x: x - 40, y: y - 26, width: 80, height: 52, rx: 4, fill: '#fbf1dd' }, letter);
  shape('path', { d: `M${x - 40} ${y - 26}L${x} ${y + 6}L${x + 40} ${y - 26}`, stroke: '#d7c29f', 'stroke-width': 3, fill: 'none' }, letter);
  shape('circle', { cx: x, cy: y + 4, r: 8, fill: '#b5544c' }, letter);
}

function stocking(parent, x, y, fill) {
  shape('path', { d: `M${x - 22} ${y}V${y + 52}C${x - 22} ${y + 72} ${x - 8} ${y + 84} ${x + 14} ${y + 84} ${x + 42} ${y + 84} ${x + 44} ${y + 60} ${x + 24} ${y + 58} ${x + 22} ${y + 58} ${x + 18} ${y + 50} ${x + 18} ${y + 42}V${y}Z`, fill }, parent);
  shape('rect', { x: x - 28, y: y - 14, width: 52, height: 24, rx: 7, fill: '#f7efe0' }, parent);
}

function line(parent, d) {
  shape('path', { d, stroke: '#a9845b', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, parent);
}

// Each theme fills the same two corner canvases.
const THEMES = {
  home: {
    left: ({ tree, sway }) => { tree(82, 216, 150, 0); tree(160, 224, 96, -1.6); sway([300, 226], -1, parent => snowman(parent, 300, 226)); },
    right: ({ tree, still }) => { tree(232, 190, 130, -2.4); still(parent => cottage(parent, 106, 196)); },
  },
  intro: {
    left: ({ still, sway, bob }) => {
      still(parent => { openBook(parent, 288, 226); });
      sway([288, 142], -.8, parent => popupTree(parent, 288, 142));
      bob(-1.4, parent => postcard(parent, 64, 196, -9));
    },
    right: ({ still, sway }) => {
      still(parent => { globe(parent, 96, 200); candle(parent, 226, 200); });
      sway([226, 132], -.5, parent => flame(parent, 226, 200));
    },
  },
  game: {
    left: ({ tree, bob }) => { tree(100, 214, 170, 0); tree(172, 222, 112, -1.6); bob(0, parent => gift(parent, 186, 166, 118, 66, '#b5625a', '#efdcae')); bob(-2, parent => gift(parent, 306, 184, 84, 48, '#e9d9b8', '#b5625a')); },
    right: ({ tree, bob, still }) => { tree(212, 186, 150, -2.4); bob(-1, parent => gift(parent, 84, 142, 94, 54, '#8aa9ad', '#f3e7cf')); still(parent => holly(parent, 50, 180, .9)); },
  },
  wish: {
    left: ({ tree, still, bob }) => { tree(70, 216, 130, -1); still(parent => mailbox(parent, 226, 228)); bob(-.6, parent => envelope(parent, 350, 96, 9)); bob(-2.2, parent => envelope(parent, 118, 86, -11)); },
    right: ({ still, sway }) => {
      still(parent => { line(parent, 'M20 54C90 76 200 76 280 50'); shape('path', { d: 'M12 44H26L28 212H10ZM274 40H288L290 210H272Z', fill: '#a9845b' }, parent); });
      sway([92, 68], -.4, parent => stocking(parent, 92, 82, '#b5544c'));
      sway([204, 68], -1.8, parent => stocking(parent, 204, 82, '#6f9676'));
    },
  },
};

function scene(root, side, viewBox, ground, build) {
  const host = document.createElement('div');
  host.className = `foreground-scene foreground-${side}`;
  root.append(host);
  const paper = { scale: 1.1, grain: .6 }, delayed = (layer, delay) => { layer.style.animationDelay = `${delay}s`; };
  build({
    tree: (x, base, height, delay) => delayed(paperLayer(host, viewBox, 'foreground-sway', parent => pine(parent, x, base, height, '#5f8a70'), { paper, origin: [x, base] }), delay),
    sway: (origin, delay, draw) => delayed(paperLayer(host, viewBox, 'foreground-sway', draw, { paper, origin }), delay),
    bob: (delay, draw) => delayed(paperLayer(host, viewBox, 'foreground-bob', draw, { paper }), delay),
    still: draw => paperLayer(host, viewBox, '', draw, { paper }),
  });
  paperLayer(host, viewBox, '', parent => shape('path', { d: ground, fill: SNOW }, parent), { paper: null });
}

function flakes(root) {
  [[11, 0], [28, -3], [44, -7], [60, -1.5], [76, -5], [91, -8.5]].forEach(([left, delay]) => {
    const flake = document.createElement('span');
    flake.className = 'foreground-flake';
    flake.style.left = `${left}%`;
    flake.style.animationDelay = `${delay}s`;
    root.append(flake);
  });
}

export function mountForeground(root) {
  const theme = THEMES[root?.dataset.foreground];
  if (!theme) return;
  hills(root);
  flakes(root);
  scene(root, 'left', LEFT_BOX, LEFT_GROUND, theme.left);
  scene(root, 'right', RIGHT_BOX, RIGHT_GROUND, theme.right);
  pauseOffscreen([root]);
  if (!('IntersectionObserver' in window)) { root.classList.add('is-visible'); return; }
  const reveal = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { root.classList.add('is-visible'); reveal.disconnect(); }
  }, { threshold: .08 });
  reveal.observe(root);
}
