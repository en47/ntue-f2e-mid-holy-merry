// Dimensions relative to the painted envelope width, shared by geometry and placement.
export const PAPER_DEPTH = .05;
export const HANGING_DROP = .12;
export const HANGING_OUTSET = .36;
export const SWING_DURATION = 1.4;
export const MAX_SWING = Math.PI / 36; // 5 degrees; the damping keeps the actual peak smaller.
export function paperSwing(seconds) {
  if (seconds <= 0 || seconds >= SWING_DURATION) return 0;
  const progress = seconds / SWING_DURATION;
  return MAX_SWING * Math.sin(progress * Math.PI * 2) * (1 - progress) ** 2;
}

// A hanging envelope is a damped pendulum driven by the tree it hangs from.
export const PENDULUM = { frequency: Math.PI * 2 / 1.5, damping: .13, reach: 1.3, limit: .5, leanLimit: .32 };
// One step of angle'' = -w²·angle - 2ζw·angle' - reach·treeAcceleration. Inertia makes it lag behind the turn.
export function pendulumStep(state, treeAcceleration, dt) {
  const { frequency: w, damping, reach, limit } = PENDULUM;
  state.velocity += (-w * w * state.angle - 2 * damping * w * state.velocity - reach * treeAcceleration) * dt;
  state.angle = Math.max(-limit, Math.min(limit, state.angle + state.velocity * dt));
  return state;
}
// Spinning flings the envelope outward: tan(lean) = r·spin²/g, with g = w²·L and r/L = reach.
export const outwardLean = spin => -Math.min(PENDULUM.leanLimit, Math.atan(PENDULUM.reach * spin * spin / PENDULUM.frequency ** 2));
