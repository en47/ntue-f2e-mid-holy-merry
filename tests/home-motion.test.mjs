import test from 'node:test';
import assert from 'node:assert/strict';
import { burstPieces } from '../js/components/paper-burst.js';

test('paper scraps spread on both sides, rise, then fall', () => {
  const pieces = burstPieces(18, () => .5);
  assert.equal(pieces.length, 18);
  assert.ok(pieces.some(piece => piece.x > 0) && pieces.some(piece => piece.x < 0));
  assert.ok(pieces.every(piece => piece.rise < 0 && piece.fall > 0));
});
