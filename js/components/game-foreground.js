// Paper-cut ground that closes the page: hills stretch, the corner scenes keep their shape.
import { holly, paperLayer, pine, shape } from './paper-art.js';

const SNOW = '#fff9eb';

function hills(root) {
  paperLayer(root, '0 0 1440 240', 'foreground-hills', parent => {
    shape('path', { d: 'M0 96C170 56 300 118 480 92S760 44 960 88 1260 118 1440 70V240H0Z', fill: '#cfe1e7' }, parent);
    shape('path', { d: 'M0 150C220 110 360 160 590 136S940 92 1150 136 1340 150 1440 118V240H0Z', fill: '#e6eeee' }, parent);
  }, { preserveAspectRatio: 'none', paper: { scale: 1.2, grain: .45, shadow: .16, rim: '#fbf3e3' } });
  paperLayer(root, '0 0 1440 240', 'foreground-hills', parent => {
    shape('path', { d: 'M0 196C200 162 420 204 660 182S1120 160 1440 188V240H0Z', fill: SNOW }, parent);
  }, { preserveAspectRatio: 'none', paper: null });
}

function drawGift(parent, x, y, width, height, fill, ribbon) {
  shape('rect', { x, y, width, height, rx: 5, fill }, parent);
  shape('rect', { x: x - 5, y: y - 8, width: width + 10, height: 22, rx: 5, fill }, parent);
  shape('rect', { x: x + width / 2 - 8, y: y - 8, width: 16, height: height + 8, fill: ribbon }, parent);
  const cx = x + width / 2;
  shape('path', { d: `M${cx} ${y - 6}C${cx - 16} ${y - 44} ${cx - 58} ${y - 40} ${cx - 50} ${y - 16} ${cx - 44} ${y - 2} ${cx - 16} ${y - 2} ${cx} ${y - 6}ZM${cx} ${y - 6}C${cx + 16} ${y - 44} ${cx + 58} ${y - 40} ${cx + 50} ${y - 16} ${cx + 44} ${y - 2} ${cx + 16} ${y - 2} ${cx} ${y - 6}Z`, fill: ribbon }, parent);
  shape('circle', { cx, cy: y - 7, r: 8, fill: ribbon }, parent);
}

function scene(root, className, viewBox, ground, build) {
  const host = document.createElement('div');
  host.className = `foreground-scene ${className}`;
  root.append(host);
  const paper = { scale: 1.1, grain: .6 };
  build({
    tree: (x, base, height, delay) => {
      paperLayer(host, viewBox, 'foreground-pine', parent => pine(parent, x, base, height, '#5f8a70'), { paper, origin: [x, base] }).style.animationDelay = `${delay}s`;
    },
    gift: (delay, ...shapeArgs) => {
      paperLayer(host, viewBox, 'foreground-gift', parent => drawGift(parent, ...shapeArgs), { paper }).style.animationDelay = `${delay}s`;
    },
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
  if (!root) return;
  hills(root);
  flakes(root);
  scene(root, 'foreground-left', '0 0 420 250', 'M0 250V224C70 210 150 216 220 228S360 224 420 250Z', ({ tree, gift }) => {
    tree(100, 214, 170, 0);
    tree(172, 222, 112, -1.6);
    gift(0, 186, 166, 118, 66, '#b5625a', '#efdcae');
    gift(-2, 306, 184, 84, 48, '#e9d9b8', '#b5625a');
  });
  scene(root, 'foreground-right', '0 0 300 220', 'M0 220C40 196 120 192 170 200S260 190 300 204V220Z', ({ tree, gift, still }) => {
    tree(212, 186, 150, -2.4);
    gift(-1, 84, 142, 94, 54, '#8aa9ad', '#f3e7cf');
    still(parent => holly(parent, 50, 180, .9));
  });
}
