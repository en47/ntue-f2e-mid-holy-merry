import test from 'node:test';
import assert from 'node:assert/strict';
import { bend, camera, flatten, pathOf, sheet, winding } from '../js/services/perspective.js';

const near = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} ≠ ${b}`);

test('the camera: the street runs to its vanishing point, the cobbles at depth 1 lie at the bottom of the picture', () => {
  const view = camera({ vp: [905, 445], focal: 480, eye: 355 / 480 });
  const [x, y] = view.ground(0, 1);
  near(x, 905, 'straight ahead'); near(y, 800, 'depth 1 is the bottom edge');
  const far = view.ground(1.2, 1e9);
  near(far[0], 905, 'far away everything meets'); near(far[1], 445, 'at the eye\'s height');
  near(view.depthAt(622.5), 2, 'and back: cobbles half way up are twice as far');
  const [, top] = view.project([0, 1, 2]);
  assert.ok(top < 445, 'what is above the eye is above the horizon');
});

test('a sheet turned toward the left: its right edge comes nearer, its face moves toward the eye', () => {
  const at = sheet({ origin: [1, -.7, 1.4], turn: 13 * Math.PI / 180, scale: .001 });
  const [, , left] = at(-500, 0), [, , right] = at(500, 0), [, , front] = at(0, 0, 100);
  assert.ok(right < 1.4 && left > 1.4, 'the right edge nearer than the left');
  assert.ok(front < 1.4, 'out of its face is toward the eye');
  near(at(0, 300)[1], -.4, 'up the sheet is up');
});

test('paths are cut into straight pieces, ends kept, closed paths kept closed', () => {
  const [line] = flatten('M0 0L10 0H20V5Z');
  assert.deepEqual(line.slice(0, 4), [[0, 0], [10, 0], [20, 0], [20, 5]]); assert.equal(line.closed, true);
  const [curve] = flatten('M0 0Q10 10 20 0', 4);
  assert.equal(curve.length, 5); assert.deepEqual(curve.at(-1), [20, 0]); near(curve[2][1], 5, 'the middle of the curve');
  const [cubic] = flatten('M0 0C0 10 20 10 20 0', 2);
  assert.deepEqual(cubic.at(-1), [20, 0]); near(cubic[1][1], 7.5, 'a cubic at its middle');
  assert.equal(flatten('M0-26C13-20 20-6 15 8').at(0).at(-1).join(), '15,8', 'numbers run together the way the art writes them');
  assert.throws(() => flatten('M0 0A5 5 0 0 1 10 0'), /unsupported/);
  assert.equal(pathOf(flatten('M0 0L10 0L10 10Z')), 'M0 0L10 0L10 10Z');
  assert.equal(bend('M0 0L10 0', ([x, y]) => [x * 2, y + 1]), 'M0 1L20 1');
});

test('a face wound clockwise on the screen looks at the eye', () => {
  assert.ok(winding([[0, 0], [10, 0], [10, 10], [0, 10]]) > 0);
  assert.ok(winding([[0, 0], [0, 10], [10, 10], [10, 0]]) < 0);
});
