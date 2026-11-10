// Christmas morning behind the cabin: only the sky and the falling snow stay flat here. The sun is in the 3D scene, rising
// behind the far mountains (cabin-scene.js), so it stays put in the sky with them as the view turns. The snow is little
// round dots of paper (an uneven edge, grain, a touch of shadow), one cut and copied; the endings' theatre and the snow
// wish fall the same snow.
import { paperLayer, shape } from './paper-art.js';

const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };
export function flakeDot() {
  return paperLayer(document.createElement('div'), '0 0 20 20', 'snow-dot', paper => {
    let d = '';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 6.4 + noise(i + 5) * 1.6; d += `${i ? 'L' : 'M'}${(10 + Math.cos(a) * r).toFixed(2)} ${(9 + Math.sin(a) * r).toFixed(2)}`; }
    shape('path', { d: `${d}Z`, fill: '#fffdf6' }, paper);
  }, { paper: { scale: .2, grain: .3, shadow: .35, rim: '#e3ebf0' }, eager: true });
}

export function mountCabinBackdrop(host) {
  const dot = flakeDot();
  [[6, -1], [17, -6], [29, -3], [41, -8], [52, -2], [63, -5.5], [74, -9], [85, -4], [94, -7]].forEach(([left, delay]) => {
    const flake = document.createElement('span'); flake.className = 'cabin-flake'; flake.append(dot.cloneNode(true));
    flake.style.left = `${left}%`; flake.style.animationDelay = `${delay}s`; host.append(flake);
  });
}
