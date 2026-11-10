// The big wheel's gearbox (cabin-wheel.js), as plain rules: the same answer every time. All the gears have teeth of one
// size, so a gear's radius follows from its tooth count, and two gears mesh when their centres stand exactly as far apart
// as their two radii: closer and they jam, further and they miss. The crank's gear drives a chain of three pegs to the
// wheel's own gear; the pegs stand where only one choice of gears fits (the geometry is the puzzle).
export const PITCH = 1.125;
export const radius = teeth => teeth * PITCH;
// The loose gears: four in the toolbox, and the big one that fell into the snow.
export const PIECES = [{ id: 's', teeth: 8 }, { id: 'm', teeth: 12 }, { id: 'l', teeth: 15 }, { id: 'm2', teeth: 12 }, { id: 'xl', teeth: 19, snow: true }];
export const WHEEL = { at: [52, 48], teeth: 15 }, CRANK = { teeth: 12 };
// From the wheel's gear down to the crank: each step is a direction (degrees, y down) and the two gears that fit there.
const step = ([x, y], degrees, a, b) => { const angle = degrees * Math.PI / 180, length = radius(a) + radius(b); return [x + Math.cos(angle) * length, y + Math.sin(angle) * length]; };
const P1 = step(WHEEL.at, 15, 15, 12), P2 = step(P1, 40, 12, 19), P3 = step(P2, 10, 19, 8);
export const PEGS = [P1, P2, P3];
CRANK.at = step(P3, 45, 8, 12);
const SLACK = .5;
// How two gears at these centres meet: 'mesh', 'jam' or 'gap'.
export function link(a, b) {
  const apart = Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]), reach = radius(a.teeth) + radius(b.teeth);
  return apart < reach - SLACK ? 'jam' : apart > reach + SLACK ? 'gap' : 'mesh';
}
// Turning the crank with these teeth on the pegs (null for an empty peg): how far along the chain the turning reaches
// (0 = only the crank, 3 = every peg, 4 = the wheel too), and why it stops there: a peg left empty or two gears not
// touching ('gap'), or two gears pressed into each other ('jam', and then nothing turns at all). `spin` gives each
// gear's turn for one turn of the crank: the other way round each step, faster on a smaller gear.
export function drive(teeth) {
  const chain = [{ ...CRANK, spin: 1 }];
  for (let i = PEGS.length - 1; i >= -1; i--) {
    const next = i < 0 ? WHEEL : teeth[i] ? { at: PEGS[i], teeth: teeth[i] } : null, last = chain.at(-1);
    if (!next) return { reach: chain.length - 1, stop: 'gap', at: i, chain };
    const meet = link(last, next);
    if (meet === 'jam') return { reach: 0, stop: 'jam', at: i, chain: chain.slice(0, 1) };
    if (meet === 'gap') return { reach: chain.length - 1, stop: 'gap', at: i, chain };
    chain.push({ ...next, spin: -last.spin * last.teeth / next.teeth });
  }
  return { reach: 4, stop: null, at: null, chain, done: true };
}
