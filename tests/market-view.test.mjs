import test from 'node:test';
import assert from 'node:assert/strict';
import { facingPose, give, halfWidth, lens, lookOf, standoff, turnBetween, turnRange, walkAt } from '../js/services/market-view.js';

const near = (a, b, message, by = 1e-6) => assert.ok(Math.abs(a - b) < by, `${message}: ${a} ≠ ${b}`);
const deg = d => d * Math.PI / 180;

test('the lens sees at least the span across, its height kept within bounds on very wide or very tall screens', () => {
  const span = deg(76), bounds = { span, low: deg(40), high: deg(62) };
  near(halfWidth(lens(16 / 9, bounds), 16 / 9) * 2, span, 'a desk screen sees the span exactly');
  near(lens(390 / 760, bounds), deg(62), 'a tall phone stops at its tallest lens');
  near(lens(3, bounds), deg(40), 'a very wide screen at its lowest');
});

test('the view turns as far as the street is drawn on either side, and gives a little past the edge', () => {
  const range = turnRange({ left: deg(-85), right: deg(85), half: deg(38) });
  near(range.low, deg(-47), 'left'); near(range.high, deg(47), 'right');
  const tiny = turnRange({ left: deg(-20), right: deg(10), half: deg(38) });
  near(tiny.low, deg(-5), 'a lens wider than all of it stays in the middle'); near(tiny.high, deg(-5), 'both ways');
  assert.equal(give(deg(10), range), deg(10));
  assert.ok(give(deg(60), range) > range.high && give(deg(60), range) <= range.high + .08, 'a pull past the edge gives a little');
  near(turnBetween(deg(170), deg(-170)), deg(20), 'the short way round');
});

test('standing back far enough for a house to fill the view, by its height on a wide screen and its width on a phone', () => {
  const fov = deg(46), tall = standoff({ height: 2.8, width: 1.6, fov, aspect: 16 / 9 }), phone = standoff({ height: 2.8, width: 1.6, fov: deg(62), aspect: .5 });
  near(2.8 / (2 * tall * Math.tan(fov / 2)), .86, 'its height fills 86%');
  near(1.6 / (2 * phone * Math.tan(deg(31)) * .5), .86, 'on a phone its width does');
});

test('to look at a thing straight on one stands in front of it and looks along the way it faces', () => {
  const pose = facingPose({ middle: [1.8, 1.4, 2.6], facing: deg(34), distance: 3.8, height: 1.6 });
  const [x, , z] = lookOf(pose.heading), toward = [1.8 - pose.eye[0], 2.6 - pose.eye[2]], length = Math.hypot(...toward);
  near(x, toward[0] / length, 'looking at it across'); near(z, toward[1] / length, 'and down the street');
  near(Math.hypot(pose.eye[0] - 1.8, pose.eye[2] - 2.6), 3.8, 'at the distance asked');
  assert.ok(pose.pitch > 0, 'a little from above');
});

test('walking up: nearer first, the turn after; walking back: the turn first, the steps after', () => {
  const street = { eye: [0, 1.1, 7], heading: 0, pitch: 0 }, house = { eye: [-.4, 1.6, 5.8], heading: deg(34), pitch: deg(3) };
  const early = walkAt(street, house, .3), late = walkAt(street, house, .85);
  assert.ok(Math.abs(early.eye[2] - 7) > .3 && Math.abs(early.heading) < deg(2), 'a third of the way, it has come nearer and not yet turned');
  assert.ok(late.heading > deg(20), 'near the end it is turning');
  assert.deepEqual(walkAt(street, house, 1), house); assert.deepEqual(walkAt(street, house, 0), street);
  const away = walkAt(house, street, .3, { back: true });
  assert.ok(Math.abs(away.eye[2] - 5.8) < .02 && away.heading < deg(28), 'going back, it turns before it steps away');
  assert.deepEqual(walkAt(house, street, 1, { back: true }), street);
});
