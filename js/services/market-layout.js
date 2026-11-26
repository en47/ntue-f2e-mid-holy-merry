// Where everything in the Christmas Market stands (components/vending-scene.js lays the square out from it, vending.js
// sets the machine there, vending-advent.js the Advent House), worked out apart from Three.js so it can be checked
// (tests/market-layout.test.mjs). The square is laid out from a picture of it (docs/VENDING-MARKET.md): every thing is
// placed by where it stands in the picture. The picture is 1370 px wide, its scene from y 110 to 860; the camera that
// took it stands FRAME.eye metres up, its horizon at y FRAME.horizon, its lens FRAME.fov across. A thing that stands on
// the ground is placed where the ray through its foot meets the ground, and sized so that its top and sides fall where
// the picture has them; a thing whose foot is hidden is set at a depth and sized the same way.
// Metres; x to the right, z toward the visitor. A thing's `turn` turns its front (+z) about its upright, toward +x as it
// grows. A footprint runs `left` and `right` across a thing's front from its foot, `back` and `front` behind and before it.
const DEG = Math.PI / 180;
export const FRAME = { width: 1370, top: 110, height: 750, fov: 60 * DEG, horizon: 425, eye: 1.5 };
const F = FRAME.width / 2 / Math.tan(FRAME.fov / 2), MIDDLE = FRAME.top + FRAME.height / 2;
const PITCH = Math.atan((MIDDLE - FRAME.horizon) / F), C = Math.cos(PITCH), S = Math.sin(PITCH);
export const VIEW = { eye: [0, FRAME.eye, 0], heading: 0, pitch: PITCH };
// How tall the picture's lens is: no screen sees less than this from top to bottom (a wide one sees more to either side,
// where the square runs on past the picture: WINGS).
export const FRAME_TALL = 2 * Math.atan(Math.tan(FRAME.fov / 2) * FRAME.height / FRAME.width);
// The ray through a point of the picture, scaled so that one unit along it is one metre of depth straight ahead.
const ray = (u, v) => { const dx = (u - FRAME.width / 2) / F, dy = -(v - MIDDLE) / F; return [dx, dy * C - S, -dy * S - C]; };
// Where the ray through (u, v) meets the ground: [x, z] and its depth.
export function ground(u, v) { const d = ray(u, v), t = FRAME.eye / -d[1]; return { at: [d[0] * t, d[2] * t], depth: t }; }
// How tall a thing standing `z` metres along is if its top shows at y = v.
function heightAt(depthZ, v) { const k = (MIDDLE - v) / F; return FRAME.eye + (-depthZ) * (k * C - S) / (C + k * S); }
// Something standing on the ground whose box in the picture is [x0, y0, x1, y1] (its foot at the middle of the bottom
// unless `foot` says where), turned `turn` (radians; 0 square to the camera's axis, + its front toward the right).
export function standing([x0, y0, x1, y1], { turn = 0, foot = null } = {}) {
  const [fu, fv] = foot ?? [(x0 + x1) / 2, y1], { at, depth } = ground(fu, fv);
  const height = heightAt(at[1], y0), width = (x1 - x0) / F * depth / Math.max(.35, Math.cos(turn));
  return { at, turn, width, height, depth, box: [x0, y0, x1, y1] };
}
// Something set at `depth` metres whose box in the picture is [x0, y0, x1, y1]; `foot` is the height of its bottom.
export function backdrop([x0, y0, x1, y1], depth) {
  const bottom = ray((x0 + x1) / 2, y1), top = ray((x0 + x1) / 2, y0);
  const z = bottom[2] * depth, footY = FRAME.eye + bottom[1] * depth, topY = FRAME.eye + top[1] * depth * (bottom[2] / top[2]);
  return { at: [bottom[0] * depth, z], foot: footY, width: (x1 - x0) / F * depth, height: topY - footY, depth, box: [x0, y0, x1, y1] };
}
// A point on a thing turned `turn` at `at`: `across` metres along its front (to its right), `out` metres before it.
export const along = ({ at: [x, z], turn }, across, out = 0) => [x + across * Math.cos(turn) + out * Math.sin(turn), z - across * Math.sin(turn) + out * Math.cos(turn)];

// The machine (its box from the top of its star to the foot of its step), turned a little toward the middle of the
// square: nearly square to the visitor, turned just past the way to them so that its deep red side shows on its left.
// Its card (vending-papercraft.js) is 1.27 units tall and runs MACHINE_DEPTH units back from its front.
export const MACHINE_DEPTH = .78;
const machine = standing([265, 268, 548, 768], { turn: 23 * DEG, foot: [394, 766] }), unit = machine.height / 1.27;
export const MACHINE = { ...machine, left: .29 * unit, right: .29 * unit, back: (MACHINE_DEPTH - .105) * unit, front: .26, lever: { left: -.29 * unit, right: .52 * unit, back: -.1, front: .22 } };
// The Advent House across from it, turned to face the machine.
export const HOUSE = { ...standing([993, 220, 1320, 655], { turn: -45 * DEG, foot: [1128, 652] }), left: 1.15, right: 1.15, back: .9, front: .3 };
// Beside the machine: its lamp (a red bow on the post), the presents at its foot, a snowy fir and a crate of snow at the
// corner; the chalkboard on its right, turned as the machine is.
export const LAMP = { ...standing([158, 338, 258, 768], { foot: [208, 768] }), left: .12, right: .12, back: .12, front: .12 };
export const GIFTS = [{ name: 'left', ...standing([142, 650, 304, 802]) }, { name: 'house-left', ...standing([936, 586, 1018, 648]) }, { name: 'house-right', ...standing([1210, 610, 1300, 694]) }];
export const FIR = standing([14, 382, 170, 722]);
export const CRATE = standing([14, 668, 160, 834]);
export const EASEL = { ...standing([526, 570, 699, 754], { turn: MACHINE.turn }), left: .4, right: .4, back: .25, front: .05 };
// The stalls, wooden booths `deep` metres deep standing slanted to the lane: one under the sign behind the lamp, two
// down the left of the lane, one at the right edge, and one past it.
export const STALLS = [
  { look: 'sign', ...standing([10, 298, 305, 645], { turn: 52 * DEG }), deep: 1.1 },
  { look: 'ornaments', ...standing([520, 298, 700, 592], { turn: 44 * DEG }), deep: 1.3 },
  { look: 'toys', ...standing([716, 380, 860, 550], { turn: 44 * DEG }), deep: 1.2 },
  { look: 'gifts', ...standing([1350, 382, 1490, 760], { turn: -60 * DEG }), deep: 1 },
  // (past the picture's right edge, seen on a wide screen and when the view turns to the house)
  { look: 'cocoa', ...standing([1590, 350, 1740, 700], { turn: -66 * DEG }), deep: 1.2 },
].map(stall => ({ ...stall, left: stall.width / 2, right: stall.width / 2, back: stall.deep ?? .12, front: stall.deep ? .62 : .1 }));
// The corner building over the first stall, the house at the top right.
export const CORNER = backdrop([-480, 100, 330, 600], 10.5);
export const RIGHT_HOUSE = backdrop([1250, 190, 2010, 600], 12);
// Down the lane: the little lit tree and the snowy bushes at its end; the houses round it, the clock tower among them;
// the houses on the left behind the stalls; a few firs on the hills; the mountains; the sky.
export const SMALL_TREE = standing([846, 383, 900, 524]);
export const BUSHES = standing([900, 462, 992, 542]);
export const TOWN = backdrop([748, 200, 1012, 480], 34);
export const LEFT_TOWN = backdrop([378, 128, 650, 532], 17);
export const FOREST = backdrop([-500, 300, 2000, 480], 42);
export const MOUNTAINS = backdrop([560, 226, 1010, 448], 90);
export const SKY = backdrop([-700, -260, 2100, 470], 140);
// The title's sign hangs at the top left, and the string of stars runs from under its right edge across the sky: both
// at the same depth, so that they meet on any screen (vending.js sets the sign where this rectangle shows). It hangs low
// enough for the snow on it to clear the top of the view, and ends short of the star on the machine's crest.
export const SIGN = backdrop([40, 128, 372, 272], 7.5);
export const STARS = backdrop([362, 128, 1970, 218], 7.5);
// The string of bulbs and pennants across the lane, tied to the front post of the ornament stall's far end (and, at the
// other end, by vending-advent.js, to the bracket of the Advent House's left lantern).
export const PENNANT_FROM = (([x, z]) => [x, STALLS[1].height * .8, z])(along(STALLS[1], STALLS[1].width / 2 - .06, .02));
// Snow on the cobbles (where it lies in the picture) and banked here and there.
export const PATCHES = [[560, 772, .7], [760, 690, .5], [690, 548, .6], [1060, 770, .7], [980, 606, .6], [880, 562, .6], [1180, 838, .8], [620, 650, .45], [420, 840, .6]].map(([u, v, size]) => ({ ...ground(u, v), size }));
export const BANKS = [{ ...standing([0, 760, 360, 862]) }, { ...standing([1150, 590, 1372, 644]) }, { ...standing([880, 524, 990, 552]) }, { ...standing([494, 760, 600, 784]) }, { ...standing([1480, 740, 1980, 880]) }, { ...standing([-520, 750, 20, 890]) }];
// The square running on past the picture's edges (seen on a wide screen, or when the view turns to the house or the
// machine): a snowy fir and presents at either side.
export const WINGS = { firs: [standing([1730, 330, 1930, 760]), standing([-330, 380, -150, 760])], gifts: [standing([1620, 650, 1760, 780]), standing([-160, 660, -10, 800])] };
// Three elves about the market: one before the ornament stall reaching for a bauble, one by the toy stall with a cup of
// cocoa, one carrying presents across the lane along `z`: it comes out from behind the machine (at `from` the machine
// hides it) and goes all the way to the Advent House, round behind its front (at `to` the house hides it), and again.
export const ELVES = { height: .9, bauble: [.5, -10.1], cocoa: [1.75, -12.3], walk: { z: -8.6, from: -1.6, to: 2.8 } };

// Which way a point lies from the eye (0 straight ahead, positive to the right), and how far.
export const bearing = ([ex, , ez], [x, z]) => Math.atan2(x - ex, ez - z);
export const distance = ([ex, , ez], [x, z]) => Math.hypot(x - ex, z - ez);
// The four corners of a thing's footprint on the ground.
export function footprint({ at: [x, z], turn = 0, left, right, back, front }) {
  return [[-left, -back], [right, -back], [right, front], [-left, front]].map(([a, b]) => along({ at: [x, z], turn }, a, b));
}
// Two footprints overlap unless a line runs between them (both are convex).
export function overlaps(a, b) {
  for (const shape of [a, b]) for (let i = 0; i < shape.length; i++) {
    const [x1, z1] = shape[i], [x2, z2] = shape[(i + 1) % shape.length], nx = z2 - z1, nz = x1 - x2;
    const on = points => points.map(([x, z]) => x * nx + z * nz), pa = on(a), pb = on(b);
    if (Math.max(...pa) <= Math.min(...pb) + 1e-9 || Math.max(...pb) <= Math.min(...pa) + 1e-9) return false;
  }
  return true;
}
// How far a point is from a footprint's edge (0 if inside).
export function clearance([px, pz], corners) {
  let inside = false, nearest = Infinity;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const [x1, z1] = corners[j], [x2, z2] = corners[i];
    if ((z1 > pz) !== (z2 > pz) && px < (x2 - x1) * (pz - z1) / (z2 - z1) + x1) inside = !inside;
    const dx = x2 - x1, dz = z2 - z1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / (dx * dx + dz * dz)));
    nearest = Math.min(nearest, Math.hypot(px - x1 - dx * t, pz - z1 - dz * t));
  }
  return inside ? 0 : nearest;
}
// Where a point of the square shows in the picture (the inverse of `ground` and `standing`): [u, v].
export function picture([x, y, z]) {
  const dx = x, dy = y - FRAME.eye, dz = z, forward = -dz * C - dy * S, up = dy * C - dz * S;
  return [FRAME.width / 2 + dx / forward * F, MIDDLE - up / forward * F];
}
