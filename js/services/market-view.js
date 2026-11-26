// The Christmas Market's camera (components/vending-scene.js), worked out apart from Three.js so it can be tested
// (tests/market-view.test.mjs). Angles are in radians; a heading of 0 looks down the street, a positive one to the right.
const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
const ease = u => { const t = clamp(u, 0, 1); return t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };
// The way from one heading to another the short way round.
export const turnBetween = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

// The lens for a screen: at least `span` across (radians), its height kept between `low` and `high`; a tall phone gets
// the widest, so the street still shows round the thing in front.
export function lens(aspect, { span, low, high }) { return clamp(2 * Math.atan(Math.tan(span / 2) / aspect), low, high); }
// Half the width the lens sees across, for its height `fov` on a screen `aspect` wide.
export const halfWidth = (fov, aspect) => Math.atan(Math.tan(fov / 2) * aspect);

// How far the view may turn: never past what is drawn on either side (`left`, `right`: the bearings of the street's
// last things), however wide the lens. A lens wider than all of it stays in the middle.
export function turnRange({ left, right, half }) {
  const low = left + half, high = right - half;
  return low <= high ? { low, high } : { low: (left + right) / 2, high: (left + right) / 2 };
}
// Past the edge the view gives a little, like paper, and springs back once let go (as on Santa's page).
export function give(value, { low, high }, most = .08) {
  if (value > high) return high + Math.min(most, (value - high) * .3);
  if (value < low) return low - Math.min(most, (low - value) * .3);
  return value;
}

// How far back to stand from a thing `height` tall and `width` wide so it fills `fill` of the view, whichever way it
// fits first.
export function standoff({ height, width, fov, aspect, fill = .86 }) {
  const tall = height / fill / (2 * Math.tan(fov / 2)), wide = width / fill / (2 * Math.tan(fov / 2) * aspect);
  return Math.max(tall, wide);
}

// Walking up to a thing, as on Santa's page: coming nearer first, still looking much the way one was, then turning to
// face it as one arrives. `u` runs 0 to 1; each pose is { eye: [x, y, z], heading, pitch }. Walking back away from it
// (`back`), the turn comes first and the steps after, so the way back is the way there run backwards.
export function walkAt(from, to, u, { back = false } = {}) {
  const step = back ? ease((u - .3) / .7) : ease(u / .72), turn = back ? ease(u / .7) : ease((u - .3) / .7);
  return {
    eye: from.eye.map((value, i) => value + (to.eye[i] - value) * step),
    heading: from.heading + turnBetween(from.heading, to.heading) * turn,
    pitch: from.pitch + (to.pitch - from.pitch) * turn,
  };
}

// Which way one looks at a heading: x to the right, z down the street (away from where the street begins).
export const lookOf = (heading, pitch = 0) => [Math.sin(heading) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(heading) * Math.cos(pitch)];
// Where to stand to look at a thing straight on: `distance` back from its middle against `facing` (the heading one looks
// along to see its front), the eye at `height`, looking a little down at its middle.
export function facingPose({ middle: [x, y, z], facing, distance, height }) {
  const eye = [x - Math.sin(facing) * distance, height, z + Math.cos(facing) * distance];
  return { eye, heading: facing, pitch: Math.atan2(height - y, distance) };
}
