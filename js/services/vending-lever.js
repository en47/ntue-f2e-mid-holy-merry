// The vending machine's lever and its delivery as plain numbers (components/vending-machine.js does the drawing; see
// docs/VENDING-MACHINE.md). The lever swings in front of the machine like a clock's hand, from one o'clock down to five
// o'clock; five bulbs light along its arc, a fifth of the pull each; past LEVER.snap it drops the rest of the way by itself.
// Only a pull all the way down and let go sets the delivery going. Tested in tests/vending-lever.test.mjs.
export const LEVER = { rest: 30, sweep: 120, snap: .92, bulbs: 5 };

// How far down the lever is (0–1) for a pointer (dx, dy) screen pixels from its hub, y down: the pointer's angle clockwise
// from straight up. Round to the left of the hub it holds whichever end is nearer; right on the hub it keeps `last`.
export function pull(dx, dy, last = 0) {
  if (Math.hypot(dx, dy) < 8) return last;
  let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
  if (angle < 0) angle = angle < -90 ? 180 : 0;
  const value = Math.min(1, Math.max(0, (angle - LEVER.rest) / LEVER.sweep));
  return value >= LEVER.snap ? 1 : value;
}
// The lever's angle for a pull, in radians clockwise from straight up.
export const angle = progress => (LEVER.rest + LEVER.sweep * progress) * Math.PI / 180;
// Each bulb's brightness (0–1): the k-th fills over the k-th fifth of the pull. And how many are fully lit.
export const bulbs = progress => Array.from({ length: LEVER.bulbs }, (_, k) => Math.min(1, Math.max(0, progress * LEVER.bulbs - k)));
export const lit = progress => Math.min(LEVER.bulbs, Math.floor(Math.max(0, progress) * LEVER.bulbs + 1e-9));

// What a thing done leads to: a pick unlocks the lever; a grab before that does nothing; let go short of the bottom and it
// springs back, all the way down and the delivery runs; when it is done the thing waits on the stage until it is taken.
const MOVES = {
  idle: { pick: 'chosen' },
  chosen: { pick: 'chosen', grab: 'pulling' },
  pulling: { short: 'chosen', full: 'running' },
  running: { done: 'ready' },
  ready: { take: 'idle' },
};
export const next = (state, event) => MOVES[state]?.[event] ?? state;

// The delivery, in milliseconds after the lever is let go: the lever springs back as the machine gives a little shudder
// and the cell's door comes down; the curtains light up from behind and the thing's shadow is let down onto the stage; the
// light goes out (the thing is itself again behind the curtains, now dark), the curtains part, the tray slides out, it
// turns to you. The five bulbs go out one by one meanwhile, as if the pull's strength were being spent.
export const DELIVERY = {
  back: [0, 380], shudder: [50, 650], door: [200, 650], glow: [600, 1000], lower: [1000, 1900], land: [1900, 2100],
  dim: [2200, 2350], curtains: [2350, 2950], tray: [2950, 3450], turn: [3450, 3950], ready: 3950,
  bulbs: [700, 1200, 1700, 2200, 2700],
};
