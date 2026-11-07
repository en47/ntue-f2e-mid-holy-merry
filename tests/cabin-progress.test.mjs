import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_OUTFIT, dressed, readProgress, writeProgress } from '../js/services/cabin-progress.js';

const memory = (initial = {}) => { const data = { ...initial }; return { getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = String(value); }, data }; };

test('an empty or broken record starts as the plain snowman', () => {
  assert.deepEqual(readProgress(memory()).outfit, DEFAULT_OUTFIT);
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': '{oops' })).outfit, DEFAULT_OUTFIT);
  assert.deepEqual(readProgress(null).combos, []);
});
test('a saved outfit comes back, and unknown accessories are dropped', () => {
  const store = memory();
  writeProgress({ outfit: { head: 'top-hat', neck: 'tie', face: null, hand: 'ghost' }, combos: ['gentleman', 'gentleman', 3] }, store);
  const known = (place, id) => id !== 'ghost';
  const progress = readProgress(store, known);
  assert.deepEqual(progress.outfit, { head: 'top-hat', neck: 'tie', face: null, hand: null });
  assert.deepEqual(progress.combos, ['gentleman']);
});
test('a storage that refuses to save does not throw', () => {
  assert.equal(writeProgress({ outfit: DEFAULT_OUTFIT }, { setItem() { throw new Error('quota'); } }), false);
});
test('dressed means something in every place', () => {
  assert.equal(dressed(DEFAULT_OUTFIT), false);
  assert.equal(dressed({ head: 'beret', neck: 'bow', face: 'carrot', hand: 'broom' }), true);
});
