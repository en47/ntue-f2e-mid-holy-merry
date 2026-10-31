export function stockingMouth(rect) {
  // SVG viewBox 240×340; object-fit:contain, object-position:center bottom.
  const scale = Math.min(rect.width / 240, rect.height / 340);
  const left = rect.left + (rect.width - 240 * scale) / 2;
  const top = rect.top + rect.height - 340 * scale;
  return { x: left + 151 * scale, y: top + 100 * scale, left, top, width: 240 * scale, height: 340 * scale };
}
export function deliveryPath(start, end, steps = 60) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const arc = Math.min(90, Math.max(28, Math.hypot(dx, dy) * .23));
  const a = { x: start.x + dx * .2 + arc, y: start.y - arc };
  const b = { x: end.x + arc * .6, y: end.y - Math.abs(dy) * .25 - arc };
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, q = 1 - t;
    const x = q*q*q*start.x + 3*q*q*t*a.x + 3*q*t*t*b.x + t*t*t*end.x;
    const y = q*q*q*start.y + 3*q*q*t*a.y + 3*q*t*t*b.y + t*t*t*end.y;
    const scale = 1 + .1 * Math.sin(t * Math.PI) - .8 * t*t;
    const angle = 7*t - 12*Math.sin(t*Math.PI*2) * (1-t);
    return { offset: t, transform: `translate3d(${x-start.x}px,${y-start.y}px,0) rotate(${angle}deg) scale(${scale})` };
  });
}
