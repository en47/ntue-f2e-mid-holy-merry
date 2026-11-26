import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, DAYS, GRID, MOTIFS, ROWS, TONES, drawers, neighbours, whole } from '../js/services/advent-layout.js';

test('six by six cells hold the days 1 to 24, each exactly once, every cell taken', () => {
  assert.equal(GRID.length, ROWS); assert.ok(GRID.every(row => row.length === COLUMNS));
  const list = drawers();
  assert.deepEqual(list.map(box => box.day), Array.from({ length: DAYS }, (_, i) => i + 1));
  assert.equal(list.reduce((sum, box) => sum + box.cols * box.rows, 0), COLUMNS * ROWS, 'the drawers cover all 36 cells');
});

test('every drawer is a whole rectangle of cells', () => {
  for (const box of drawers()) assert.ok(whole(box), `day ${box.day} is one rectangle`);
  const broken = [[1, 2], [3, 1]];
  assert.equal(whole({ day: 1, col: 0, row: 0, cols: 2, rows: 1 }, broken), false, 'a day split in two is caught');
});

test('five wide drawers, four tall ones, fourteen single cells, and the 24th the one big two-by-two at the bottom in the middle', () => {
  const list = drawers(), days = test => list.filter(test).map(box => box.day);
  assert.deepEqual(days(box => box.cols === 2 && box.rows === 1), [1, 4, 7, 16, 23]);
  assert.deepEqual(days(box => box.cols === 1 && box.rows === 2), [6, 8, 14, 18]);
  assert.equal(days(box => box.cols === 1 && box.rows === 1).length, 14);
  const big = list.find(box => box.day === 24);
  assert.deepEqual([big.col, big.row, big.cols, big.rows], [2, 4, 2, 2], 'two columns in the middle, the two bottom rows');
  assert.deepEqual(days(box => box.cols * box.rows >= 4), [24], 'nothing else is as big');
});

test('drawers that touch are never the same paper, and each drawer has a paper', () => {
  for (const [a, b] of neighbours()) assert.notEqual(TONES[a], TONES[b], `days ${a} and ${b} touch`);
  assert.ok(drawers().every(box => ['red', 'green', 'cream', 'kraft', 'crown'].includes(box.tone)));
  assert.equal(drawers().filter(box => box.tone === 'crown').length, 1, 'only the 24th is crowned');
  assert.equal(MOTIFS[24], 'wreath');
});
