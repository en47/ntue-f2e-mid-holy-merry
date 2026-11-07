// Christmas morning behind the cabin: only the sky and the falling snow stay flat here. The sun is in the 3D scene, rising
// behind the far mountains (cabin-scene.js), so it stays put in the sky with them as the view turns.

export function mountCabinBackdrop(host) {
  [[6, -1], [17, -6], [29, -3], [41, -8], [52, -2], [63, -5.5], [74, -9], [85, -4], [94, -7]].forEach(([left, delay]) => {
    const flake = document.createElement('span'); flake.className = 'cabin-flake';
    flake.style.left = `${left}%`; flake.style.animationDelay = `${delay}s`; host.append(flake);
  });
}
