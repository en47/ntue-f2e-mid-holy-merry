import test from 'node:test';
import assert from 'node:assert/strict';
import { CARS, TRACKS, trackLine, trainKeyframes } from '../js/components/game-coaster.js';

const boxX = transform => parseFloat(transform.match(/translate\(([-\d.]+)%/)[1]) * 16;

test('coaster train enters from the left, leaves to the right, then waits off screen', () => {
  const { cars, run, cycle } = trainKeyframes();
  assert.equal(cars.length, CARS);
  for (const frames of cars) {
    assert.ok(boxX(frames[0].transform) < 0, 'starts past the left edge');
    assert.ok(boxX(frames.at(-1).transform) > 1600, 'ends past the right edge');
    assert.ok(frames.every((frame, index) => index === 0 || frame.offset >= frames[index - 1].offset));
    assert.equal(frames.at(-1).offset, 1);
  }
  assert.ok(run > 5000 && run < 10000, `run ${run}`);
  assert.ok(cycle - run >= 3000, 'a pause of a few seconds between rides');
});

test('coaster climbs the lift hill slowly and races down the drop', () => {
  const { timeline } = trainKeyframes(), samples = [];
  for (let time = 0; time < timeline.duration / 1000; time += .05) {
    const distance = timeline.distanceAt(time);
    samples.push({ x: timeline.at(distance).x, speed: (timeline.distanceAt(time + .05) - distance) / .05 });
  }
  const lift = samples.find(sample => sample.x > 560).speed, fastest = Math.max(...samples.map(sample => sample.speed));
  assert.ok(fastest > lift * 3, `lift ${lift.toFixed(0)}, fastest ${fastest.toFixed(0)}`);
});

test('reduced motion parks the train on the visible part of the lift hill', () => {
  const { parked } = trainKeyframes();
  assert.equal(parked.length, CARS);
  for (const pose of parked) assert.ok(boxX(pose) > 420 && boxX(pose) < 700, pose);
});

test('the small-screen track keeps the lift hill and drop, then stays flat past the wheel', () => {
  const after = trackLine(TRACKS.flat).filter(([x]) => x > 1000);
  assert.ok(after.every(([, y]) => Math.abs(y - 346) < 4), 'no camelback after the drop');
  assert.deepEqual(TRACKS.flat.slice(0, 10), TRACKS.full.slice(0, 10));
  const { cars, run } = trainKeyframes({ points: TRACKS.flat });
  assert.ok(boxX(cars[2].at(-1).transform) > 1600 && run > 4000 && run < 10000, `run ${run}`);
});
