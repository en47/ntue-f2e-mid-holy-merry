// Walking up to something in the Christmas Market (vending.js), the way the camera walks up to things on Santa's page:
// it turns until the thing is straight ahead, then goes up to it. The street is drawn flat in layers, so all of them move
// together: they pan (the turn) and scale about the thing (the walk). Pure functions, tested in tests/market-camera.test.mjs.
const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

// Where the thing ends up and how much nearer: as large as the part of the view in sight allows (its `core`, the part that
// must stay whole, no wider than `fill` of the view), in the middle of it as far as the drawn `scene` still covers the
// whole view once scaled about the thing (no bare edge comes into sight). All in px of the market; `top` and `bottom` are
// the part of it in sight.
export function approach({ thing: { x, y, width, height, core = width }, view: { width: W, height: H, top = 0, bottom = H }, scene = { left: 0, top: 0, right: W, bottom: H }, margin = 18, fill = .94, most = 2.4 }) {
  const seen = bottom - top, scale = Math.max(1, Math.min((seen - margin * 2) / height, W * fill / core, most));
  const focus = [x + width / 2, y + height / 2];
  const to = [
    clamp(W / 2, W - scale * (scene.right - focus[0]), scale * (focus[0] - scene.left)),
    clamp(top + seen / 2, bottom - scale * (scene.bottom - focus[1]), top + scale * (focus[1] - scene.top)),
  ];
  return { focus, to, scale };
}

// A layer laid out at `offset` in the market, moved with the rest: scaled about the thing (its transform-origin there),
// then carried over by the turn (its translate). With the scale at 1 it has only turned; scaled, it has walked up too.
export function layer({ focus, to, scale }, offset = [0, 0]) {
  const n = value => `${Math.round(value * 100) / 100}px`;
  return { origin: `${n(focus[0] - offset[0])} ${n(focus[1] - offset[1])}`, translate: `${n(to[0] - focus[0])} ${n(to[1] - focus[1])}`, scale: String(Math.round(scale * 10000) / 10000) };
}
