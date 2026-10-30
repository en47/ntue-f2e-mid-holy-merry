// Dimensions relative to the painted envelope width, shared by geometry and placement.
export const PAPER_DEPTH = .016;
export const HANGING_DROP = .12;
export const HANGING_OUTSET = .36;
export const SWING_DURATION = 1.4;
export const MAX_SWING = Math.PI / 36; // 5 degrees; the damping keeps the actual peak smaller.
export function paperSwing(seconds) {
  if (seconds <= 0 || seconds >= SWING_DURATION) return 0;
  const progress = seconds / SWING_DURATION;
  return MAX_SWING * Math.sin(progress * Math.PI * 2) * (1 - progress) ** 2;
}
