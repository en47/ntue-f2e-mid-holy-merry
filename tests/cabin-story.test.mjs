import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOOK_IDS, GAPS, LOG_ANSWER, LOG_GIVEN, goal, homeShelf, logSolved, logWrong, readLog, moveBook, readShelf, santaGoes, solved, spelled } from '../js/services/cabin-story.js';
import { GOALS } from '../js/data/cabin-clues.js';

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
test('volunteering: an initial of your own, four jobs, a point each the first time while signed up', async () => {
  const { TASKS, canSign, signedUp, points, pending, record } = await import('../js/services/cabin-story.js');
  assert.deepEqual(TASKS, ['lichen', 'hay', 'letters', 'wheel']);
  assert.equal(canSign('A'), true); assert.equal(canSign('Z'), true);
  for (const mark of ['N', 'K', 'H', 'E', 'O', 'S', 'a', 'AB', '', 1, null]) assert.equal(canSign(mark), false, `${mark} cannot be signed`);
  const volunteer = { mark: '', tasks: [] };
  assert.equal(record(volunteer, 'hay'), false, 'nothing counts before signing up'); assert.equal(points(volunteer), 0);
  volunteer.mark = 'J'; assert.equal(signedUp(volunteer), true);
  assert.equal(pending(volunteer, 'hay'), true);
  assert.equal(record(volunteer, 'hay'), true); assert.equal(record(volunteer, 'hay'), false, 'a job counts once');
  assert.equal(record(volunteer, 'sweeping'), false, 'only the four jobs count');
  record(volunteer, 'wheel'); assert.equal(points(volunteer), 2);
  volunteer.mark = ''; assert.equal(signedUp(volunteer), false); assert.equal(points(volunteer), 2, 'leaving keeps the points');
  assert.equal(record(volunteer, 'lichen'), false, 'nothing counts after leaving');
});
test('the end: two jobs untie the old pages, three stamps buy a wish, all four let you stay; D needs the old page too', async () => {
  const { canUntie, canWish, canStay, trueMiracle, goesHome } = await import('../js/services/cabin-story.js');
  const finale = { invited: true, twist: false, wish: null, stayed: false, endings: [] };
  const volunteer = tasks => ({ mark: 'J', tasks });
  assert.equal(canUntie(volunteer(['hay'])), false); assert.equal(canUntie(volunteer(['hay', 'wheel'])), true);
  assert.equal(canUntie({ mark: '', tasks: ['hay', 'wheel'] }), false, 'not after leaving');
  assert.equal(canWish(volunteer(['hay', 'wheel']), finale), false); assert.equal(canWish(volunteer(['hay', 'wheel', 'lichen']), finale), true);
  assert.equal(canWish(volunteer(['hay', 'wheel', 'lichen']), { ...finale, wish: 'snow' }), false, 'one wish');
  assert.equal(canStay(volunteer(['hay', 'wheel', 'lichen']), finale), false); assert.equal(canStay(volunteer(['hay', 'wheel', 'lichen', 'letters']), finale), true);
  assert.equal(canStay(volunteer(['hay', 'wheel', 'lichen', 'letters']), { ...finale, stayed: true }), false, 'signed once');
  assert.equal(trueMiracle({ ...finale, wish: 'snow' }), false, 'not without the old page');
  assert.equal(trueMiracle({ ...finale, twist: true }), false, 'not without a wish or staying');
  assert.equal(trueMiracle({ ...finale, twist: true, stayed: true }), true);
  assert.equal(goesHome({ volunteer: { mark: '', tasks: [] }, finale }), true, 'offered the blank row, not signed: a visitor going home');
  assert.equal(goesHome({ volunteer: { mark: '', tasks: [] }, finale: { ...finale, invited: false } }), false, 'not before the row was offered');
  assert.equal(goesHome({ volunteer: volunteer([]), finale }), false, 'not when signed up');
  assert.equal(goesHome({ volunteer: { mark: '', tasks: [] }, finale: { ...finale, endings: ['A'] } }), false, 'told once');
});
test('the clue book hints at the first thing the story is still waiting on', () => {
  const story = { left: false, opened: false, seen: [] }, volunteer = { mark: '', tasks: [] }, finale = { invited: false, twist: false, wish: null, stayed: false, endings: [] };
  const at = (changes = {}) => goal({ story: { ...story, ...changes.story }, volunteer: { ...volunteer, ...changes.volunteer }, finale: { ...finale, ...changes.finale } });
  const known = { opened: true, left: true, seen: ['tags', 'log', 'rules'] }, signed = tasks => ({ mark: 'J', tasks });
  assert.equal(at(), 'room'); assert.equal(at({ story: { left: true } }), 'bookcase');
  assert.equal(at({ story: { opened: true, left: true, seen: ['tags'] } }), 'log', 'the wet shift log first');
  assert.equal(at({ story: { opened: true, left: true, seen: ['tags', 'log'] } }), 'secret');
  assert.equal(at({ story: known }), 'join'); assert.equal(at({ story: known, finale: { endings: ['A'] } }), 'endings', 'went home: other endings');
  assert.equal(at({ story: known, volunteer: signed(['hay']) }), 'jobs'); assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen']) }), 'cord');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen']), finale: { twist: true } }), 'jobs');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel']), finale: { twist: true } }), 'wish');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel']), finale: { twist: true, wish: 'snow', endings: ['B', 'D'] } }), 'endings');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel', 'letters']), finale: { twist: true, wish: 'snow', stayed: true, endings: ['A', 'B', 'C', 'D'] } }), 'done');
  for (const id of ['room', 'bookcase', 'log', 'secret', 'join', 'jobs', 'cord', 'wish', 'endings', 'done']) assert.ok(GOALS[id]?.hints.length, `${id} has hints`);
});
test('the wet shift log: one cell still reads, the rest are written back in, and only the right initials put it right', () => {
  const blank = readLog();
  assert.equal(blank.filter(Boolean).length, 1); assert.equal(blank[LOG_GIVEN], LOG_ANSWER[LOG_GIVEN]);
  assert.deepEqual(readLog(['X', 'O', 'E', 'K', 7]), ['', 'O', LOG_ANSWER[LOG_GIVEN], 'K', '', '', '', ''], 'only known initials; the clear cell stays as it reads');
  assert.equal(logSolved(blank), false); assert.equal(logWrong(blank), 7);
  const swapped = [...LOG_ANSWER]; [swapped[6], swapped[7]] = [swapped[7], swapped[6]];
  assert.equal(logWrong(swapped), 2); assert.equal(logSolved(LOG_ANSWER), true);
  assert.equal(goal({ story: { left: true, opened: true, seen: ['tags', 'rules'] }, volunteer: { mark: '', tasks: [] }, finale: { endings: [] } }), 'log');
  assert.equal(goal({ story: { left: true, opened: true, seen: ['log'] }, volunteer: { mark: '', tasks: [] }, finale: { endings: [] } }), 'secret');
});
