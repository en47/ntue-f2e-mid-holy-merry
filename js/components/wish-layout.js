// Pixel coordinates are measured from the rendered layout, then converted to world units.
export const WORLD_PIXEL = 100;
export function treeFit(zone, bounds) {
  const height = Math.min(zone.height * .96, zone.width * .94 * bounds.height / (2 * bounds.radius));
  return { height, scale: height / (WORLD_PIXEL * bounds.height), x: (zone.left + zone.width / 2) / WORLD_PIXEL };
}
export function horizontalIntent(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return 'pending';
  return Math.abs(dx) > Math.abs(dy) * 1.15 ? 'rotate' : 'scroll';
}
export function inPlaceClip(clip) {
  const copy = clip.clone();
  for (const track of copy.tracks) {
    if (!/Hips\.position$/.test(track.name)) continue;
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = track.values[0];
      track.values[i + 2] = track.values[2];
    }
  }
  return copy;
}
