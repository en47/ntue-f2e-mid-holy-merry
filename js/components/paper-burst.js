// Cut-paper scraps thrown from an element. Only transform and opacity animate; each scrap removes itself.
const COLOURS = ['#a84a42', '#4f7d68', '#e2b24f', '#fffbed', '#9dbfd0'], SHAPES = ['square', 'round', 'star'];
const LIMIT = 48;

export function burstPieces(count, rand = Math.random) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index + rand()) / count * Math.PI * 2, reach = 60 + rand() * 90;
    return { x: Math.cos(angle) * reach, rise: -30 - rand() * 50, fall: 90 + rand() * 120, spin: (rand() < .5 ? -1 : 1) * (240 + rand() * 360), delay: rand() * .08, colour: COLOURS[index % COLOURS.length], shape: SHAPES[index % SHAPES.length] };
  });
}

export function burstPaper(host, count = 18) {
  if (host.querySelectorAll('.paper-bit').length + count > LIMIT) return;
  for (const piece of burstPieces(count)) {
    const bit = document.createElement('span');
    bit.className = 'paper-bit'; bit.dataset.shape = piece.shape; bit.setAttribute('aria-hidden', 'true');
    bit.style.cssText = `--x:${piece.x.toFixed(1)}px;--rise:${piece.rise.toFixed(1)}px;--fall:${piece.fall.toFixed(1)}px;--spin:${piece.spin.toFixed(0)}deg;--colour:${piece.colour};animation-delay:${piece.delay.toFixed(2)}s`;
    bit.addEventListener('animationend', () => bit.remove(), { once: true });
    host.append(bit);
  }
}
