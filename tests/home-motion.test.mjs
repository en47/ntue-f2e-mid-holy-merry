import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { panFor, easePan } from '../js/components/home-parallax.js';
import { burstPieces } from '../js/components/paper-burst.js';

test('the page leans away from the pointer and stays inside the overhang', () => {
  assert.deepEqual(panFor(720, 450, 1440, 900), { x: -0, y: -0 });
  assert.ok(panFor(0, 450, 1440, 900).x > 0); assert.ok(panFor(1440, 450, 1440, 900).x < 0);
  for (const [x, y] of [[-500, -500], [9000, 9000]]) { const pan = panFor(x, y, 1440, 900); assert.ok(Math.abs(pan.x) <= 14); assert.ok(Math.abs(pan.y) <= 4.9); }
});

test('easing settles exactly on its target', () => {
  let pan = { x: 0, y: 0 }, frames = 0; const target = { x: 14, y: -4 };
  while (!pan.settled && frames < 500) { pan = easePan(pan, target); frames++; }
  assert.ok(pan.settled); assert.equal(pan.x, 14); assert.equal(pan.y, -4); assert.ok(frames < 120);
});

test('parallax never moves the characters wrapper, which would bury the models', async () => {
  const [script, css] = await Promise.all(['js/components/home-parallax.js', 'css/home.css'].map(file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')));
  assert.ok(!/\['\.characters'/.test(script));
  assert.ok(!/\.characters\s*[,{][^}]*will-change/.test(css));
  for (const selector of ['.characters-canvas', '.character-stage']) assert.match(css, new RegExp(`\\${selector} \\{[^}]*z-index: \\d`));
});

test('paper scraps spread on both sides, rise, then fall', () => {
  const pieces = burstPieces(18, () => .5);
  assert.equal(pieces.length, 18);
  assert.ok(pieces.some(piece => piece.x > 0) && pieces.some(piece => piece.x < 0));
  assert.ok(pieces.every(piece => piece.rise < 0 && piece.fall > 0));
});
