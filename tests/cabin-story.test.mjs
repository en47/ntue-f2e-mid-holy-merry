import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOOK_IDS, GAPS, homeShelf, moveBook, readShelf, santaGoes, solved, spelled } from '../js/services/cabin-story.js';

const place = id => homeShelf().indexOf(id);
test('the shelf starts as HOLY MERRY with four empty places', () => {
  assert.deepEqual(homeShelf().slice(0, 9), BOOK_IDS); assert.equal(spelled(homeShelf()), '····'); assert.equal(solved(homeShelf()), false);
});
test('a book moves into an empty place, or swaps with the book there', () => {
  const moved = moveBook(homeShelf(), place('book-m1'), GAPS[0]);
  assert.equal(moved[GAPS[0]], 'book-m1'); assert.equal(moved[place('book-m1')], null);
  const swapped = moveBook(moved, place('book-h1'), GAPS[0]);
  assert.equal(swapped[GAPS[0]], 'book-h1'); assert.equal(swapped[place('book-h1')], 'book-m1');
  assert.deepEqual(moveBook(moved, place('book-m1'), GAPS[1]), moved, 'an empty place cannot be moved');
});
test('MORE opens the shelf, with either R; nothing else does', () => {
  let shelf = homeShelf();
  for (const [id, gap] of [['book-m1', 0], ['book-o1', 1], ['book-r2', 2], ['book-e1', 3]]) shelf = moveBook(shelf, shelf.indexOf(id), GAPS[gap]);
  assert.equal(spelled(shelf), 'MORE'); assert.equal(solved(shelf), true);
  assert.equal(solved(moveBook(shelf, GAPS[0], GAPS[1])), false, 'OMRE is not it');
});
test('a saved arrangement is kept only when every book is there once', () => {
  const shelf = moveBook(homeShelf(), 4, 9);
  assert.deepEqual(readShelf(shelf), shelf);
  assert.deepEqual(readShelf([...shelf.slice(0, 12), 'book-h1']), homeShelf());
  assert.deepEqual(readShelf('MORE'), homeShelf()); assert.deepEqual(readShelf(shelf.slice(1)), homeShelf());
});
test('Santa goes out after two things used in the room (one if he has gone before), never once the shelf is open', () => {
  assert.equal(santaGoes({ used: 1, left: false, home: true, opened: false }), false);
  assert.equal(santaGoes({ used: 2, left: false, home: true, opened: false }), true);
  assert.equal(santaGoes({ used: 1, left: true, home: true, opened: false }), true);
  assert.equal(santaGoes({ used: 3, left: true, home: false, opened: false }), false);
  assert.equal(santaGoes({ used: 3, left: true, home: true, opened: true }), false);
});
test('the secret is known once the name tags, the shift log and the rulebook have all been read', async () => {
  const { knowsSantas, santaReturns } = await import('../js/services/cabin-story.js');
  assert.equal(knowsSantas(['tags', 'log']), false); assert.equal(knowsSantas(['rules', 'log', 'tags']), true);
  assert.equal(santaReturns({ home: false, opened: true, seen: ['tags', 'log', 'rules'] }), true);
  assert.equal(santaReturns({ home: false, opened: true, seen: ['tags'] }), false, 'not before the secret is known');
  assert.equal(santaReturns({ home: true, opened: true, seen: ['tags', 'log', 'rules'] }), false, 'not when he is already home');
});
