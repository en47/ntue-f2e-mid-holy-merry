import test from 'node:test';
import assert from 'node:assert/strict';
import { BLANK, MOST, MOST_WORKS, WORKS_KEY, clean, dropWork, keepWork, newKey, presetFills, readWorks, touched, writeWorks } from '../js/services/vending-works.js';

const memory = (initial = {}) => { const map = new Map(Object.entries(initial)); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), map }; };

const PAGES = { snowman: 3, tree: 2, stocking: 3 };
test('works are a list, newest first: the same thing may be coloured again and again, each kept on its own', () => {
  const one = { key: 'a-1', item: 'snowman', fills: ['#B03F37', BLANK, '#3f6653'], stickers: [['star', 120, 80, 12]], finished: true, at: 5 };
  const two = { ...one, key: 'b-2', fills: [BLANK, BLANK, '#3f6653'], finished: false, at: 9 };
  const storage = memory({ [WORKS_KEY]: JSON.stringify([one, two, { ...one, key: 'c', item: 'tree' }, { ...one, key: 'd', fills: ['red', BLANK, BLANK] }, { ...one, key: 'e', item: 'ghost' }, { ...one, key: 'Bad Key!' }, one]) });
  const works = readWorks(storage, PAGES);
  assert.deepEqual(works.map(work => work.key), ['b-2', 'a-1'], 'two snowmen, newest first; a wrong number of parts, a colour that is not one, an unknown thing, a bad key, a repeat are left out');
  assert.deepEqual(works[1], { key: 'a-1', item: 'snowman', fills: ['#b03f37', BLANK, '#3f6653'], stickers: [['star', 120, 80, 12]], finished: true, at: 5 });
});

test('a work kept goes to the front in place of its old self; the oldest go past the most kept; one can be let go', () => {
  let works = [];
  for (let i = 0; i < MOST_WORKS + 3; i++) works = keepWork(works, { key: `k-${i}`, item: 'tree', fills: [BLANK, BLANK], stickers: [], finished: false, at: i });
  assert.equal(works.length, MOST_WORKS); assert.equal(works[0].key, `k-${MOST_WORKS + 2}`); assert.ok(!works.some(work => work.key === 'k-0'), 'the oldest let go');
  works = keepWork(works, { ...works.at(-1), at: 999 }); assert.equal(works[0].at, 999); assert.equal(works.length, MOST_WORKS, 'a work kept again is not doubled');
  assert.equal(dropWork(works, works[0].key).length, MOST_WORKS - 1);
  assert.match(newKey(1700000000000, .5), /^[a-z0-9]+-[a-z0-9]+$/); assert.notEqual(newKey(1, .1), newKey(1, .2));
});

test('a broken or missing save starts with none, and a full or refused storage does not throw', () => {
  assert.deepEqual(readWorks(memory({ [WORKS_KEY]: '{oops' }), PAGES), []);
  assert.deepEqual(readWorks(memory({ [WORKS_KEY]: '{"snowman":{}}' }), PAGES), [], 'the earlier one-sheet-per-thing shape is not read');
  assert.deepEqual(readWorks(memory(), PAGES), []);
  assert.deepEqual(readWorks(null, PAGES), []);
  assert.equal(writeWorks({ setItem() { throw new Error('quota'); } }, []), false);
  const storage = memory(); assert.equal(writeWorks(storage, [{ key: 'x-1', item: 'tree', fills: [BLANK, BLANK], stickers: [], finished: false, at: 1 }]), true);
  assert.equal(readWorks(storage, PAGES)[0].fills.length, 2);
});

test('stickers out of the sheet, of an unknown kind, or too many are dropped', () => {
  const stickers = [['star', 10, 10, 0], ['moon', 10, 10, 0], ['flake', 999, 10, 0], ['holly', 10, -1, 0], ...Array.from({ length: 20 }, (_, i) => ['flake', i, i, 0])];
  const work = clean({ key: 's-1', item: 'one', fills: [BLANK], stickers }, { one: 1 });
  assert.equal(work.stickers[0][0], 'star'); assert.ok(work.stickers.every(([kind, x, y]) => kind !== 'moon' && x <= 300 && y >= 0));
  assert.equal(work.stickers.length, MOST);
});

test('a sheet counts as touched once anything is on it; the swatch cards trade colours for their own', () => {
  assert.equal(touched(null), false); assert.equal(touched({ fills: [BLANK, BLANK], stickers: [] }), false);
  assert.equal(touched({ fills: [BLANK, '#3f6653'], stickers: [] }), true); assert.equal(touched({ fills: [BLANK], stickers: [['star', 1, 1, 0]] }), true);
  const colours = ['#b03f37', '#3f6653', '#e2b65a', BLANK];
  assert.deepEqual(presetFills(colours, 'classic'), colours);
  assert.deepEqual(presetFills(colours, 'snowy'), ['#9fbdd2', '#4a5f80', '#fbfaf5', BLANK]);
  assert.deepEqual(presetFills(colours, 'nothing'), colours, 'an unknown card changes nothing');
});
