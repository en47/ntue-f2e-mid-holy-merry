// Christmas morning behind the cabin: only what is infinitely far stays flat here — the sky, the low sun and falling snow.
// The hills, woods and snowfield are 3D (cabin-scene.js), so they shift with distance as the view turns.

export function mountCabinBackdrop(host) {
  const sun = document.createElement('div'); sun.className = 'cabin-sun'; host.append(sun);
  [[6, -1], [17, -6], [29, -3], [41, -8], [52, -2], [63, -5.5], [74, -9], [85, -4], [94, -7]].forEach(([left, delay]) => {
    const flake = document.createElement('span'); flake.className = 'cabin-flake';
    flake.style.left = `${left}%`; flake.style.animationDelay = `${delay}s`; host.append(flake);
  });
}
