import assert from 'node:assert/strict';
import test from 'node:test';
import { ITEMS, ITEM_IDS, emptyBag, ever, holds, readBag, spend, take } from '../js/services/cabin-bag.js';
import { readProgress, writeProgress } from '../js/services/cabin-progress.js';

const memory = (initial = {}) => { const data = { ...initial }; return { getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = String(value); }, data }; };

test('every thing in the village is a tool, used up, or left where it fits', () => {
  assert.deepEqual(ITEM_IDS, ['lichen', 'key', 'handle', 'matches', 'magnifier', 'pin', 'slip', 'gear']);
  for (const id of ITEM_IDS) assert.ok(['tool', 'spent', 'fitted'].includes(ITEMS[id]), id);
  assert.deepEqual(ITEM_IDS.filter(id => ITEMS[id] === 'tool'), ['magnifier', 'pin']);
});
test('a thing is picked up once, and never again after it has been used', () => {
  const bag = emptyBag();
  assert.equal(take(bag, 'key'), true); assert.equal(take(bag, 'key'), false);
  assert.equal(take(bag, 'ghost'), false);
  assert.equal(spend(bag, 'key'), 'fitted');
  assert.equal(holds(bag, 'key'), false); assert.equal(ever(bag, 'key'), true);
  assert.equal(take(bag, 'key'), false, 'a key left in its lock does not come back');
});
test('a tool stays in the pocket however often it is used; nothing is spent that is not held', () => {
  const bag = emptyBag(); take(bag, 'magnifier');
  assert.equal(spend(bag, 'magnifier'), 'tool'); assert.equal(spend(bag, 'magnifier'), 'tool');
  assert.deepEqual(bag, { held: ['magnifier'], used: [] });
  assert.equal(spend(bag, 'matches'), false);
  take(bag, 'matches'); assert.equal(spend(bag, 'matches'), 'spent'); assert.equal(spend(bag, 'matches'), false);
  assert.deepEqual(bag, { held: ['magnifier'], used: ['matches'] });
});
test('a saved pocket keeps only what makes sense', () => {
  assert.deepEqual(readBag(undefined), emptyBag());
  assert.deepEqual(readBag('oops'), emptyBag());
  assert.deepEqual(readBag({ held: ['key', 'key', 'ghost', 3, 'lichen'], used: ['lichen', 'gear'] }), { held: ['key'], used: ['lichen', 'gear'] });
  assert.deepEqual(readBag({ held: [], used: ['pin', 'slip'] }), { held: ['pin'], used: ['slip'] }, 'a tool is never used up');
});
test('the pocket is saved with the rest of the yard, and an older record starts with it empty', () => {
  const old = memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { opened: true }, ornaments: ['N'] }) }), before = readProgress(old);
  assert.deepEqual(before.bag, emptyBag()); assert.equal(before.story.opened, true); assert.deepEqual(before.ornaments, ['N']);
  take(before.bag, 'handle'); take(before.bag, 'magnifier'); spend(before.bag, 'handle');
  writeProgress(before, old);
  assert.deepEqual(readProgress(old).bag, { held: ['magnifier'], used: ['handle'] });
});
