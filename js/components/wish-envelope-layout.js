import { wishTreeAnchors } from '../data/wish-tree-anchors.js';
import { envelopeShapes } from '../data/envelope-shapes.js';
import { HANGING_DROP, HANGING_OUTSET } from '../data/paper-envelope-style.js';

const ZONES = ['upper', 'middle', 'lower'];
export function hashPlacement(text) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}
const randomFor = text => hashPlacement(text) / 4294967296;
const quadrant = angle => Math.floor(((angle + Math.PI / 4 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2));
const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const distance = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));

export function envelopeZoneCounts(count) {
  count = Math.min(10, Math.max(0, count));
  const exact = [.2, .3, .5].map(weight => count * weight), result = exact.map(Math.floor);
  const remainder = exact.map((value, i) => ({ i, fraction: value - result[i] }))
    .sort((a, b) => b.fraction - a.fraction || b.i - a.i);
  const remaining = count - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) result[remainder[i].i]++;
  return Object.fromEntries(ZONES.map((zone, i) => [zone, result[i]]));
}

function placement(wish, anchor, seed) {
  const key = `${seed}:${wish.id}`, variation = label => randomFor(`${key}:${label}`);
  const size = (wish.isOwn ? .106 : .098) * (.96 + variation('size') * .08);
  // Branch-facing yaw is static. Only a separate hanging pivot has a small local roll.
  const tilt = (3 + variation('tilt') * 3) * Math.PI / 180 * (variation('tilt-side') < .5 ? -1 : 1);
  const rotation = [0, anchor.angle, tilt];
  const data = envelopeShapes[wish.isOwn ? 'gold' : 'normal'], [left, top, right, bottom] = data.bounds;
  const sourceWidth = right - left;
  // Match the actual paper body's top pivot, curved thread, and image-space bounds.
  const local = [((left + right) / 2 - data.anchor[0]) / sourceWidth,
    -HANGING_DROP + (data.anchor[1] - (top + bottom) / 2) / sourceWidth, HANGING_OUTSET];
  const [rx, ry, rz] = rotation, [sx, cx, sy, cy, sz, cz] = [Math.sin(rx), Math.cos(rx), Math.sin(ry), Math.cos(ry), Math.sin(rz), Math.cos(rz)];
  // THREE Euler XYZ: rotate Z, then Y, then X.
  const x = local[0] * cz - local[1] * sz, y = local[0] * sz + local[1] * cz;
  const xx = x * cy + local[2] * sy, zz = -x * sy + local[2] * cy;
  const center = [xx, y * cx - zz * sx, y * sx + zz * cx].map((v, i) => anchor.point[i] + v * size);
  return { id: wish.id, isOwn: !!wish.isOwn, anchorId: anchor.id, zone: anchor.zone,
    point: anchor.point, rotation, size, center, radius: size * .67, angle: anchor.angle };
}

export function envelopesSeparated(a, b) {
  // Conservative body spheres include slight rest tilt, paper relief and the small new-wish swing.
  return distance(a.center, b.center) >= a.radius + b.radius + .008;
}

export function assignEnvelopeAnchors(wishes, previous = [], seed = 0) {
  // Input contains only the existing selected wishes; this module never fetches or changes data.
  const own = wishes.find(wish => wish.isOwn);
  const selected = [...(own ? [own] : []), ...wishes.filter(wish => !wish.isOwn)].slice(0, 10);
  const quotas = envelopeZoneCounts(selected.length), assigned = [], ids = new Set(selected.map(w => w.id));
  const candidates = wish => wishTreeAnchors.map(anchor => placement(wish, anchor, seed));
  const valid = next => quotas[next.zone] > 0 && assigned.every(old => old.anchorId !== next.anchorId && envelopesSeparated(old, next));
  const add = next => { assigned.push(next); quotas[next.zone]--; };

  // Preserve settled ornaments and their poses when public data refreshes.
  for (const old of previous) {
    const wish = selected.find(w => w.id === old.id && !!w.isOwn === old.isOwn);
    if (wish && ids.has(old.id) && valid(old)) add(old);
  }
  const newOwn = own && !assigned.some(p => p.id === own.id);
  if (newOwn) {
    const preferred = quotas.middle ? 'middle' : quotas.lower ? 'lower' : 'upper';
    const options = candidates(own).filter(valid);
    options.sort((a, b) => (b.zone === preferred) - (a.zone === preferred) || angleDistance(a.angle, 0) - angleDistance(b.angle, 0) || a.anchorId.localeCompare(b.anchorId));
    if (options[0]) add(options[0]);
  }
  const pending = selected.filter(w => !assigned.some(p => p.id === w.id))
    .sort((a, b) => hashPlacement(`${seed}:${a.id}`) - hashPlacement(`${seed}:${b.id}`) || a.id.localeCompare(b.id));
  for (const wish of pending) {
    const counts = [0, 0, 0, 0]; assigned.forEach(p => counts[quadrant(p.angle)]++);
    const options = candidates(wish).filter(valid);
    function score(p) {
      const nearestAngle = assigned.length ? Math.min(...assigned.map(a => angleDistance(a.angle, p.angle))) : Math.PI;
      const nearestBody = assigned.length ? Math.min(...assigned.map(a => distance(a.center, p.center))) : 1;
      return -counts[quadrant(p.angle)] * 2 + nearestAngle * .35 + nearestBody * 1.5
        + randomFor(`${seed}:${wish.id}:${p.anchorId}`) * .3;
    }
    options.sort((a, b) => score(b) - score(a) || a.anchorId.localeCompare(b.anchorId));
    if (!options[0]) throw new Error('Validated tree anchors cannot accommodate this wish collection safely');
    add(options[0]);
  }
  return assigned;
}
