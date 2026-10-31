// Strings of Christmas lights: each bulb warms up as the pointer passes and fades slowly after it leaves.
const COLOURS = ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec', '#f4c668'];
const REACH = 130, LINGER = 2600;
// [start, end, sag] in percent of the room; both strings run behind the tree, as they would in depth.
const STRANDS = [[[0, 8], [52, 6], 12], [[52, 6], [100, 9], 11]];

function strand([[x1, y1], [x2, y2], sag], count) {
  return Array.from({ length: count }, (_, index) => {
    const t = (index + .5) / count;
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t + sag * 4 * t * (1 - t) };
  });
}

export function mountWishLights(room) {
  const host = document.createElement('div'); host.className = 'wish-lights'; host.setAttribute('aria-hidden', 'true');
  const wire = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wire.setAttribute('viewBox', '0 0 100 100'); wire.setAttribute('preserveAspectRatio', 'none');
  wire.innerHTML = STRANDS.map(([[x1, y1], [x2, y2], sag]) => `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}" fill="none" stroke="#2b3a44" stroke-width="2.2" vector-effect="non-scaling-stroke"/>`).join('');
  host.append(wire);
  const bulbs = STRANDS.flatMap(item => strand(item, 14)).map((point, index) => {
    const bulb = document.createElement('i');
    bulb.style.left = `${point.x}%`; bulb.style.top = `${point.y}%`; bulb.style.setProperty('--bulb', COLOURS[index % COLOURS.length]);
    host.append(bulb);
    return { ...point, bulb, timer: 0 };
  });
  room.querySelector('.room-sky').after(host);
  function light(item) {
    item.bulb.classList.add('is-lit');
    clearTimeout(item.timer);
    item.timer = setTimeout(() => item.bulb.classList.remove('is-lit'), LINGER);
  }
  let frame = 0, last = null;
  function sweep() {
    frame = 0;
    if (!last) return;
    const box = room.getBoundingClientRect();
    for (const item of bulbs) if (Math.hypot(box.left + box.width * item.x / 100 - last.x, box.top + box.height * item.y / 100 - last.y) < REACH) light(item);
  }
  function move(event) { last = { x: event.clientX, y: event.clientY }; if (!frame) frame = requestAnimationFrame(sweep); }
  room.addEventListener('pointermove', move, { passive: true });
  room.addEventListener('pointerdown', move, { passive: true });
  return { destroy() { cancelAnimationFrame(frame); room.removeEventListener('pointermove', move); room.removeEventListener('pointerdown', move); bulbs.forEach(item => clearTimeout(item.timer)); host.remove(); } };
}
