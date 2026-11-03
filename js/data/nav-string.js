// Geometry of the light string across the header; pixels, measured from the header's top-left.
export const NAV_STRING = { desktop: { rise: 10, sag: 8 }, compact: { rise: 3, sag: 4 } };
const BULB_STOPS = [.22, .5, .78];

// Pins sit at each tag and repeat at the same spacing out past both edges of the header.
export function stringPins(tags, width) {
  const span = tags.length > 1 ? (tags.at(-1) - tags[0]) / (tags.length - 1) : width;
  const pins = [...tags];
  while (pins[0] > 0) pins.unshift(pins[0] - span);
  while (pins.at(-1) < width) pins.push(pins.at(-1) + span);
  return pins;
}
export function wirePath(pins, { rise, sag }) {
  return pins.slice(1).reduce((path, pin, index) => `${path}Q${(pins[index] + pin) / 2} ${rise + sag * 2} ${pin} ${rise}`, `M${pins[0]} ${rise}`);
}
// Height of the wire at x; each span's control point sits midway, so x runs linearly with the curve.
export function wireHeight(pins, { rise, sag }, x) {
  const index = Math.max(0, pins.findIndex((pin, i) => i > 0 && x <= pin) - 1), from = pins[index], to = pins[index + 1] ?? from + 1;
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return rise + sag * 4 * t * (1 - t);
}
export function stringBulbs(pins, { rise, sag }, width) {
  return pins.slice(1).flatMap((pin, index) => BULB_STOPS.map(t => ({ x: pins[index] + (pin - pins[index]) * t, y: rise + sag * 4 * t * (1 - t) }))).filter(({ x }) => x >= 0 && x <= width);
}
// The bulbs a light passes on its way from one tag to the next, in travel order.
export function travelBulbs(bulbs, from, to) {
  const low = Math.min(from, to), high = Math.max(from, to);
  const between = bulbs.filter(({ x }) => x > low && x < high).sort((a, b) => a.x - b.x);
  return to < from ? between.reverse() : between;
}
export function nearestBulbs(bulbs, x, count) {
  return [...bulbs].sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)).slice(0, count);
}
