import test from 'node:test';
import assert from 'node:assert/strict';
import { BLANK, MOST, WORKS_KEY, clean, presetFills, readWorks, touched, writeWorks } from '../js/services/vending-works.js';

const memory = (initial = {}) => { const map = new Map(Object.entries(initial)); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), map }; };

test('each thing keeps its own colours and stickers, and only works that fit their drawing are kept', () => {
  const good = { fills: ['#B03F37', BLANK, '#3f6653'], stickers: [['star', 120, 80, 12]], finished: true, at: 5 };
  const storage = memory({ [WORKS_KEY]: JSON.stringify({ snowman: good, tree: { fills: ['#123456'] }, stocking: { fills: ['red', BLANK, BLANK] }, ghost: good }) });
  const works = readWorks(storage, { snowman: 3, tree: 2, stocking: 3 });
  assert.deepEqual(Object.keys(works), ['snowman'], 'a work with the wrong number of parts, or a colour that is not one, is left out; unknown things too');
  assert.deepEqual(works.snowman, { fills: ['#b03f37', BLANK, '#3f6653'], stickers: [['star', 120, 80, 12]], finished: true, at: 5 });
});

test('a broken or missing save starts blank, and a full or refused storage does not throw', () => {
  assert.deepEqual(readWorks(memory({ [WORKS_KEY]: '{oops' }), { tree: 2 }), {});
  assert.deepEqual(readWorks(memory(), { tree: 2 }), {});
  assert.deepEqual(readWorks(null, { tree: 2 }), {});
  assert.equal(writeWorks({ setItem() { throw new Error('quota'); } }, {}), false);
  const storage = memory(); assert.equal(writeWorks(storage, { tree: { fills: [BLANK, BLANK], stickers: [], finished: false, at: 1 } }), true);
  assert.equal(readWorks(storage, { tree: 2 }).tree.fills.length, 2);
});

test('stickers out of the sheet, of an unknown kind, or too many are dropped', () => {
  const stickers = [['star', 10, 10, 0], ['moon', 10, 10, 0], ['flake', 999, 10, 0], ['holly', 10, -1, 0], ...Array.from({ length: 20 }, (_, i) => ['flake', i, i, 0])];
  const work = clean({ fills: [BLANK], stickers }, 1);
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
