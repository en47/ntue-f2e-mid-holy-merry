// Christmas morning behind the cabin: a soft sky with a low sun, far snowy hills, and the snow the house stands on.
// The snow at the bottom is the same colour as the footer's ground, so the page runs on into the footer.
import { paperLayer, shape } from './paper-art.js';

export function mountCabinBackdrop(host) {
  const sun = document.createElement('div'); sun.className = 'cabin-sun'; host.append(sun);
  paperLayer(host, '0 0 1440 400', 'cabin-hills', parent => {
    shape('path', { d: 'M0 170C200 110 380 180 620 140S1000 70 1240 130 1400 150 1440 120V400H0Z', fill: '#dbe7ec' }, parent);
    shape('path', { d: 'M0 250C260 200 480 260 760 228S1180 190 1440 230V400H0Z', fill: '#eef3f3' }, parent);
    shape('path', { d: 'M0 322C300 296 600 336 900 314S1260 298 1440 316V400H0Z', fill: '#fff9eb' }, parent);
  }, { preserveAspectRatio: 'none', paper: { scale: 1.2, grain: .45, shadow: .12, rim: '#fbf3e3' }, eager: true });
  [[6, -1], [17, -6], [29, -3], [41, -8], [52, -2], [63, -5.5], [74, -9], [85, -4], [94, -7]].forEach(([left, delay]) => {
    const flake = document.createElement('span'); flake.className = 'cabin-flake';
    flake.style.left = `${left}%`; flake.style.animationDelay = `${delay}s`; host.append(flake);
  });
}
