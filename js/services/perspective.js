// The Christmas Market street's perspective (components/vending-scene.js): one pinhole camera looking straight down the
// street, and paper shapes bent through it. Pure functions, tested in tests/perspective.test.mjs.

// Screen x grows to the right and y downward; the world's X to the right, Y up and Z away from the eye. `vp` is the point
// the street runs to (level with the eye), `focal` the eye's distance to the picture in screen units, `eye` its height
// above the cobbles.
export function camera({ vp: [vx, vy], focal, eye }) {
  const project = ([x, y, z]) => [vx + focal * x / z, vy - focal * y / z];
  return {
    vp: [vx, vy], focal, eye, project,
    ground: (x, z) => project([x, -eye, z]),
    // How far away the cobbles seen at a height of the picture are.
    depthAt: y => focal * eye / (y - vy),
  };
}

// A flat sheet standing in the world: `at(u, v, w)` is the world point `u` along it, `v` up it and `w` out of it (toward
// whoever looks at its face), from `origin`, in its own units scaled by `scale`. `turn` (radians) swings its face from
// looking straight at the eye toward the left (−X).
export function sheet({ origin: [ox, oy, oz], turn = 0, scale = 1 }) {
  const cos = Math.cos(turn), sin = Math.sin(turn);
  return (u, v, w = 0) => [ox + (u * cos - w * sin) * scale, oy + v * scale, oz - (u * sin + w * cos) * scale];
}

// Path data written with absolute M, L, H, V, Q, C and Z (as opentype.js and these scenes write it) as lists of points,
// each curve cut into `steps` straight pieces. Each list remembers whether it was closed.
export function flatten(d, steps = 8) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [], lines = [];
  let i = 0, command = '', line = null, x = 0, y = 0;
  const number = () => +tokens[i++];
  const start = () => { line = [[x, y]]; line.closed = false; lines.push(line); };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) command = tokens[i++];
    else if (!command) throw new Error(`path starts without a command: ${d.slice(0, 20)}`);
    if (command === 'M') { x = number(); y = number(); start(); command = 'L'; continue; }
    if (command === 'Z') { if (line) { line.closed = true; [x, y] = line[0]; } line = null; continue; }
    if (!line) start();
    if (command === 'L') { x = number(); y = number(); line.push([x, y]); }
    else if (command === 'H') { x = number(); line.push([x, y]); }
    else if (command === 'V') { y = number(); line.push([x, y]); }
    else if (command === 'Q') {
      const [ax, ay, bx, by] = [number(), number(), number(), number()], [px, py] = [x, y];
      for (let k = 1; k <= steps; k++) { const t = k / steps, s = 1 - t; line.push([s * s * px + 2 * s * t * ax + t * t * bx, s * s * py + 2 * s * t * ay + t * t * by]); }
      [x, y] = [bx, by];
    } else if (command === 'C') {
      const [ax, ay, bx, by, cx, cy] = [number(), number(), number(), number(), number(), number()], [px, py] = [x, y];
      for (let k = 1; k <= steps; k++) { const t = k / steps, s = 1 - t; line.push([s ** 3 * px + 3 * s * s * t * ax + 3 * s * t * t * bx + t ** 3 * cx, s ** 3 * py + 3 * s * s * t * ay + 3 * s * t * t * by + t ** 3 * cy]); }
      [x, y] = [cx, cy];
    } else throw new Error(`unsupported path command ${command}`);
  }
  return lines;
}

const f = n => (Math.round(n * 10) / 10).toString();
export const pathOf = lines => lines.map(line => `M${line.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}${line.closed ? 'Z' : ''}`).join('');
// Each point of a path moved by `move` (a point in, a point out), its curves cut into straight pieces first.
export const bend = (d, move, steps = 8) => pathOf(flatten(d, steps).map(line => Object.assign(line.map(move), { closed: line.closed })));

// Twice the signed area of a polygon on the screen: above zero when its points run clockwise there (y down), which is how
// a face is wound when it looks at the eye.
export function winding(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) { const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length]; sum += x0 * y1 - x1 * y0; }
  return sum;
}
