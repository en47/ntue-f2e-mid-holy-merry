import test from 'node:test';
import assert from 'node:assert/strict';
import { footstep } from '../js/components/snow-doodle.js';

test('a boot print needs a full stride of mouse travel', () => {
  assert.equal(footstep([0, 0], [10, 0], 1), null);
  assert.ok(footstep([0, 0], [30, 0], 1));
});

test('boot prints alternate sides of the path and point the way the mouse went', () => {
  const left = footstep([0, 0], [30, 0], 1), right = footstep([0, 0], [30, 0], -1);
  assert.ok(left.y > 0 && right.y < 0, 'opposite sides of a rightward path');
  assert.equal(left.angle, 90, 'toe points right');
  assert.equal(Math.round(footstep([0, 0], [0, -30], 1).angle), 0, 'toe points up the screen');
});
