import test from 'node:test';
import assert from 'node:assert/strict';
import { DELIVERY, LEVER, angle, bulbs, lit, next, pull } from '../js/services/vending-lever.js';

// A pointer 100 px from the hub at a clock angle (degrees clockwise from up), in screen pixels (y down).
const at = degrees => [Math.sin(degrees * Math.PI / 180) * 100, -Math.cos(degrees * Math.PI / 180) * 100];

test('the lever follows the pointer round its hub: one o\'clock is up, five o\'clock is all the way down', () => {
  assert.equal(pull(...at(30)), 0);
  assert.equal(pull(...at(90)), .5);
  assert.equal(pull(...at(150)), 1);
  assert.equal(pull(...at(10)), 0, 'above its rest it stays at the top');
  assert.equal(pull(...at(170)), 1, 'below its stop it stays at the bottom');
  assert.ok(pull(...at(135)) < 1 && pull(...at(135)) > .85);
  assert.equal(pull(...at(142)), 1, 'past 92% it drops the rest of the way by itself');
  assert.equal(pull(-60, -80), 0, 'round to the left of the hub, up: back at the top');
  assert.equal(pull(-60, 80), 1, 'round to the left of the hub, down: at the bottom');
  assert.equal(pull(3, 4, .4), .4, 'right on the hub it keeps where it was');
  assert.equal(angle(0), LEVER.rest * Math.PI / 180); assert.equal(angle(1), (LEVER.rest + LEVER.sweep) * Math.PI / 180);
});

test('five bulbs light along the pull, a fifth each, and go out again pulled back', () => {
  assert.deepEqual(bulbs(0), [0, 0, 0, 0, 0]);
  assert.deepEqual(bulbs(.2).map(value => +value.toFixed(6)), [1, 0, 0, 0, 0]);
  assert.deepEqual(bulbs(.5).map(value => +value.toFixed(6)), [1, 1, .5, 0, 0]);
  assert.deepEqual(bulbs(1), [1, 1, 1, 1, 1]);
  assert.deepEqual([0, .19, .2, .39, .4, .6, .8, .99, 1].map(lit), [0, 0, 1, 1, 2, 3, 4, 4, 5]);
  assert.equal(lit(-.05), 0, 'past its rest as it springs back: none');
});

test('only a pick unlocks the lever, and only a full pull let go starts the delivery', () => {
  assert.equal(next('idle', 'grab'), 'idle', 'the catch holds the lever until something is picked');
  assert.equal(next('idle', 'pick'), 'chosen');
  assert.equal(next('chosen', 'pick'), 'chosen', 'another pick changes the choice');
  assert.equal(next('chosen', 'grab'), 'pulling');
  assert.equal(next('pulling', 'short'), 'chosen', 'let go short of the bottom, it springs back');
  assert.equal(next('pulling', 'full'), 'running');
  assert.equal(next('running', 'pick'), 'running', 'no picking while it runs');
  assert.equal(next('running', 'done'), 'ready');
  assert.equal(next('ready', 'take'), 'idle');
  assert.equal(next('loading', 'pick'), 'loading');
});

test('the delivery runs in order, the swap hidden in the dark, all within four seconds', () => {
  const d = DELIVERY;
  assert.ok(d.door[1] <= d.glow[1], 'the cell\'s door is down before the curtains are lit');
  assert.ok(d.glow[1] <= d.lower[0] && d.lower[1] <= d.land[0], 'the shadow comes down once the light is on');
  assert.ok(d.land[1] <= d.dim[0] && d.dim[1] <= d.curtains[0], 'the light goes out before the curtains part (that is when the thing is itself again)');
  assert.ok(d.curtains[1] <= d.tray[0] && d.tray[1] <= d.turn[0] && d.turn[1] <= d.ready);
  assert.ok(d.ready <= 4000, 'about four seconds from letting go');
  assert.equal(d.bulbs.length, LEVER.bulbs); assert.ok(d.bulbs.every((ms, i) => i === 0 || ms > d.bulbs[i - 1]) && d.bulbs.at(-1) < d.ready);
});
