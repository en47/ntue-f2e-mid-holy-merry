import assert from 'node:assert/strict';
import test from 'node:test';
import { BOARDS, CRANK, PEGS, PIECES, WHEEL, drive, link, radius } from '../js/services/cabin-gears.js';

const teeth = id => PIECES.find(piece => piece.id === id).teeth;
test('the pegs stand so that exactly one choice of sizes reaches the wheel: small, the big one from the snow, middle', () => {
  const sizes = [...new Set(PIECES.map(piece => piece.teeth))], answers = [];
  for (const a of [null, ...sizes]) for (const b of [null, ...sizes]) for (const c of [null, ...sizes]) if (drive([a, b, c]).done) answers.push([a, b, c]);
  assert.deepEqual(answers, [[teeth('m'), teeth('xl'), teeth('s')]]);
  assert.ok(PIECES.find(piece => piece.id === 'xl').snow, 'the one that is needed is the one that fell in the snow');
});
test('two gears mesh only at exactly their radii apart', () => {
  const a = { at: [0, 0], teeth: 12 };
  assert.equal(link(a, { at: [radius(12) + radius(8), 0], teeth: 8 }), 'mesh');
  assert.equal(link(a, { at: [radius(12) + radius(8), 0], teeth: 15 }), 'jam');
  assert.equal(link(a, { at: [radius(12) + radius(8), 0], teeth: 4 }), 'gap');
});
test('turning reaches as far as the gears meet; a jam anywhere it reaches stops the crank', () => {
  assert.deepEqual([drive([null, null, null]).reach, drive([null, null, null]).stop], [0, 'gap']);
  assert.deepEqual([drive([null, null, teeth('s')]).reach, drive([null, null, teeth('s')]).stop], [1, 'gap'], 'the small gear by the crank turns, then nothing');
  assert.deepEqual([drive([null, teeth('xl'), teeth('s')]).reach], [2]);
  assert.equal(drive([null, teeth('l'), teeth('s')]).stop, 'gap', 'too small to reach the next: a gap');
  assert.equal(drive([null, null, teeth('m')]).stop, 'jam', 'too big beside the crank: it jams');
  assert.equal(drive([null, null, teeth('m')]).reach, 0, 'and then nothing turns');
  assert.equal(drive([teeth('l'), null, null]).stop, 'gap', 'a jam the crank does not reach does not stop it');
  const done = drive([teeth('m'), teeth('xl'), teeth('s')]);
  assert.equal(done.done, true); assert.equal(done.reach, 4);
  assert.deepEqual(done.chain.map(gear => Math.sign(gear.spin)), [1, -1, 1, -1, 1], 'each gear turns the other way from the last');
  assert.ok(Math.abs(done.chain.at(-1).spin - CRANK.teeth / WHEEL.teeth) < 1e-9, 'the wheel turns by the crank\'s teeth over its own');
});
test('nothing overlaps on the board: the pegs, the crank and the wheel are spread apart', () => {
  const spots = [WHEEL.at, ...PEGS, CRANK.at];
  for (let i = 0; i < spots.length; i++) for (let j = i + 2; j < spots.length; j++) assert.ok(Math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1]) > radius(19) * 2, `${i} and ${j} are apart`);
  for (const [x, y] of spots) assert.ok(x > 25 && x < 175 && y > 25 && y < 125, 'inside the panel, above the toolbox');
});
test('every board: the gears it needs are in the toolbox, exactly one choice fits, nothing overlaps, all inside the panel', () => {
  const sizes = [...new Set(PIECES.map(piece => piece.teeth))], box = PIECES.map(piece => piece.teeth);
  assert.equal(BOARDS.length, 3); assert.deepEqual(BOARDS[0].pegs, PEGS); assert.deepEqual(BOARDS[0].crank, CRANK);
  BOARDS.forEach((board, n) => {
    const answers = [];
    for (const a of [null, ...sizes]) for (const b of [null, ...sizes]) for (const c of [null, ...sizes]) if (drive([a, b, c], board).done) answers.push([a, b, c]);
    assert.deepEqual(answers, [board.teeth], `board ${n}: one answer`);
    const need = [...board.teeth], spare = [...box]; for (const t of need) { const at = spare.indexOf(t); assert.ok(at >= 0, `board ${n}: a ${t}-tooth gear is in the box`); spare.splice(at, 1); }
    const spots = [{ at: WHEEL.at, teeth: WHEEL.teeth }, ...board.pegs.map((at, i) => ({ at, teeth: board.teeth[i] })), board.crank];
    for (let i = 0; i < spots.length; i++) for (let j = i + 2; j < spots.length; j++) assert.ok(Math.hypot(spots[i].at[0] - spots[j].at[0], spots[i].at[1] - spots[j].at[1]) > radius(spots[i].teeth) + radius(spots[j].teeth) + 3, `board ${n}: ${i} and ${j} do not overlap`);
    for (const { at: [x, y], teeth } of spots) assert.ok(x - radius(teeth) > 2 && x + radius(teeth) < 198 && y - radius(teeth) > 2 && y + radius(teeth) < 128, `board ${n}: inside the panel`);
  });
});

