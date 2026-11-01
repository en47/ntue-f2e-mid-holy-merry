import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = {};
vm.createContext(context);
vm.runInContext(await readFile(new URL('../vendor/game1-frameless/rules.js', import.meta.url), 'utf8'), context);
const { LANES, REACH, WAVES, speed, interval, blocked, open, nextWave, giftLane, giftMilestone, passedRecord } = context.FlightRules;

function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

test('speed keeps rising past the old 70-second cap but stays bounded', () => {
  for (const compact of [false, true]) {
    let previous = 0;
    for (let distance = 0; distance <= 20000; distance += 100) { const now = speed(distance, compact); assert.ok(now > previous); previous = now; }
    assert.ok(previous < (compact ? 300 : 430));
  }
  assert.equal(speed(0, false), 215); assert.equal(speed(0, true), 145);
  assert.ok(speed(2000, false) > 315, 'faster than the previous ceiling');
});

test('waves always leave a clear lane and never stack two chimneys', () => {
  for (const wave of WAVES) { assert.ok(open(wave).length >= 2, `${wave}`); assert.ok(!(wave.includes(3) && wave.includes(4))); }
  assert.deepEqual([...blocked([3])], [3, 4]); assert.deepEqual([...blocked([0, 4])], [0, 4]);
});

test('every clear lane can reach the next clear lane', () => {
  const rand = seeded(7);
  for (const distance of [0, 500, 2000, 8000]) {
    let clear = LANES;
    for (let i = 0; i < 4000; i++) {
      const wave = nextWave(clear, distance, rand), next = open(wave);
      assert.ok(wave, 'a fair wave always exists');
      assert.ok(clear.every(from => next.some(to => Math.abs(from - to) <= REACH)), `${clear} -> ${next}`);
      clear = next;
    }
  }
});

test('double waves wait for the player and grow more common', () => {
  const rate = distance => { const rand = seeded(11); let pairs = 0; for (let i = 0; i < 4000; i++) if (nextWave(LANES, distance, rand).length === 2) pairs++; return pairs / 4000; };
  assert.equal(rate(0), 0); assert.ok(rate(1000) > .03); assert.ok(rate(6000) > rate(1000));
});

test('gaps always fit the sleigh, an obstacle and a lane change', () => {
  const rand = seeded(3);
  for (const [compact, span] of [[false, 228.8], [true, 170.7]]) for (let distance = 0; distance <= 20000; distance += 250) for (let i = 0; i < 20; i++) {
    const gap = interval(distance, compact, span, rand);
    assert.ok(gap * speed(distance, compact) >= span + 120 + speed(distance, compact) * .35 - 1e-9);
  }
  assert.ok(interval(8000, false, 228.8, () => .5) < interval(0, false, 228.8, () => .5), 'waves get closer together');
});

test('gifts sit in a blocked lane right beside a clear one', () => {
  const rand = seeded(5);
  for (const wave of WAVES) for (let i = 0; i < 20; i++) {
    const lane = giftLane(wave, rand);
    assert.ok(blocked(wave).includes(lane), `${wave}`);
    assert.ok(open(wave).some(clear => Math.abs(clear - lane) === 1), `${wave}`);
  }
});

test('gift milestones land on every fifth gift', () => {
  assert.deepEqual([0, 1, 4, 5, 6, 10].map(giftMilestone), [false, false, false, true, false, true]);
});

test('a record fires once, and never on a first run', () => {
  assert.equal(passedRecord(99.9, 100.1, 100), true);
  assert.equal(passedRecord(100.1, 100.3, 100), false);
  assert.equal(passedRecord(50, 51, 100), false);
  assert.equal(passedRecord(0, 1, 0), false);
});
