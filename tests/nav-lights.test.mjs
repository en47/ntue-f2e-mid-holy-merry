import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestBulbs, stringBulbs, stringPins, travelBulbs, wirePath, wireHeight } from '../js/data/nav-string.js';

const shape = { rise: 10, sag: 8 };
test('pins reach past both header edges at the tag spacing', () => {
  const pins = stringPins([1000, 1100, 1200, 1300], 1440);
  assert.ok(pins[0] <= 0); assert.ok(pins.at(-1) >= 1440);
  pins.slice(1).forEach((pin, index) => assert.equal(pin - pins[index], 100));
});
test('the wire is one continuous swag per pin gap', () => {
  const pins = [-100, 0, 100];
  assert.equal(wirePath(pins, shape), 'M-100 10Q-50 26 0 10Q50 26 100 10');
});
test('bulbs stay on the wire and inside the header', () => {
  const bulbs = stringBulbs([-100, 0, 100, 200], shape, 150);
  assert.ok(bulbs.every(({ x, y }) => x >= 0 && x <= 150 && y > 10 && y <= 18));
  assert.ok(bulbs.some(({ y }) => y === 18), 'The middle bulb hangs at the lowest point');
});
test('a light travels towards the new tag, either way along the string', () => {
  const bulbs = [{ x: 10 }, { x: 30 }, { x: 50 }, { x: 70 }];
  assert.deepEqual(travelBulbs(bulbs, 20, 60).map(({ x }) => x), [30, 50]);
  assert.deepEqual(travelBulbs(bulbs, 60, 20).map(({ x }) => x), [50, 30]);
});
test('the bulbs around a tag are the nearest ones', () => {
  assert.deepEqual(nearestBulbs([{ x: 0 }, { x: 40 }, { x: 55 }, { x: 90 }], 50, 2).map(({ x }) => x), [55, 40]);
});

test('wire height: the menu tag cord ends on the curve between two pins', () => {
  const shape = { rise: 3, sag: 4 }, pins = [0, 100, 200];
  assert.equal(wireHeight(pins, shape, 0), 3); assert.equal(wireHeight(pins, shape, 100), 3);
  assert.equal(wireHeight(pins, shape, 50), 7); assert.equal(wireHeight(pins, shape, 150), 7);
  assert.ok(wireHeight(pins, shape, 25) > 3 && wireHeight(pins, shape, 25) < 7);
});
