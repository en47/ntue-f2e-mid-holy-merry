import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_OUTFIT, MEALS, dayOf, dressed, eat, full, mealsToday, readProgress, writeProgress } from '../js/services/cabin-progress.js';

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
test('the reindeer is full after five meals, until the next day', () => {
  const progress = readProgress(memory()), today = new Date(2026, 11, 24, 20), tomorrow = new Date(2026, 11, 25, 7);
  for (let i = 1; i <= MEALS; i++) assert.equal(eat(progress, today), i);
  assert.equal(eat(progress, today), MEALS, 'never more than five');
  assert.equal(full(progress, today), true);
  assert.equal(mealsToday(progress, tomorrow), 0); assert.equal(full(progress, tomorrow), false);
  assert.equal(dayOf(today), '2026-12-24');
});
test('a saved meal count is read back and kept in range', () => {
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ feed: { day: '2026-12-24', count: 99 } }) });
  assert.deepEqual(readProgress(store).feed, { day: '2026-12-24', count: MEALS });
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ feed: { day: 3, count: 'x' } }) })).feed, { day: '', count: 0 });
});
test('the hoist remembers being hooked and the note being read, and nothing else', () => {
  assert.deepEqual(readProgress(memory()).hoist, { locked: false, found: false });
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ hoist: { locked: true, found: 'yes' } }) });
  assert.deepEqual(readProgress(store).hoist, { locked: true, found: false });
});
test('the desk remembers which letters were postmarked and whether the reply is sealed', () => {
  assert.deepEqual(readProgress(memory()).desk, { stamped: [], sealed: false });
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { stamped: ['mia', 'mia', 7, 'ole'], sealed: true } }) });
  assert.deepEqual(readProgress(store).desk, { stamped: ['mia', 'ole'], sealed: true });
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { stamped: 'mia', sealed: 1 } }) })).desk, { stamped: [], sealed: false });
});
test('the story keeps only real clues and a whole shelf', () => {
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { left: true, opened: true, seen: ['log', 'tags', 'diary', 'log'], shelf: 'x' } }) });
  const { story } = readProgress(store);
  assert.deepEqual(story.seen, ['tags', 'log']); assert.equal(story.left, true); assert.equal(story.opened, true); assert.equal(story.shelf.length, 13);
});
