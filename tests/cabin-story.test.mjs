import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOOK_IDS, FLIGHT_ORDER, beckon, milestone, MAIL, flyer, mailFor, sortWrong, GAPS, GIFTS, LOCK, playsOpen, LOG_ANSWER, opens, LOG_GIVEN, goal, homeShelf, logSolved, logWrong, readLog, moveBook, readShelf, santaGoes, solved, spelled } from '../js/services/cabin-story.js';
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
test('the secret is known the moment the shift log is put right; the tags and the rules are only what it takes', async () => {
  const { knowsSantas, santaReturns } = await import('../js/services/cabin-story.js');
  assert.equal(knowsSantas(['tags', 'rules']), false); assert.equal(knowsSantas(['log']), true); assert.equal(knowsSantas(['rules', 'log', 'tags']), true);
  assert.equal(santaReturns({ home: false, opened: true, seen: ['log'] }), true);
  assert.equal(santaReturns({ home: false, opened: true, seen: ['tags', 'rules'] }), false, 'not before the log is put right');
  assert.equal(santaReturns({ home: true, opened: true, seen: ['log'] }), false, 'not when he is already home');
});
// Every way of writing the eight cells with the five name tags, checked against the evidence and the duty rules: only one
// fits (docs/SANTA-PUZZLE-DESIGN.md §5). Looked at: the clear cell, two coloured blots, a spanner mark. Matched with notes
// found elsewhere: the care log, the barn note's two inks, the route note. The rest by the duty rules: no one flies two
// halves running (across midnight too), and a trainee (joined under five years before the 2026 season) flies one half.
test('the wet shift log has exactly one answer, and it needs the duty rules and the join years', async () => {
  const { LOG_ANSWER, SUBSTITUTES } = await import('../js/services/cabin-story.js'), { REGISTER } = await import('../js/data/cabin-secret.js');
  const seen = { 0: 'E', 2: 'N', 4: 'H', 5: 'N', 1: 'O', 6: 'K', 7: 'H' };
  const trainees = REGISTER.rows.filter(([, , year]) => 2026 - year < 5).map(([mark]) => mark);
  assert.deepEqual(trainees.sort(), ['E', 'O']);
  const fits = (log, rules) => log.every((mark, i) => !(i in seen) || seen[i] === mark) && (!rules || (log.every((mark, i) => i === 0 || mark !== log[i - 1]) && trainees.every(mark => log.filter(each => each === mark).length <= 1)));
  const answers = rules => { const found = []; for (let n = 0; n < 5 ** 8; n++) { const log = Array.from({ length: 8 }, (_, i) => SUBSTITUTES[Math.floor(n / 5 ** i) % 5]); if (fits(log, rules)) found.push(log.join('')); } return found; };
  assert.deepEqual(answers(true), [LOG_ANSWER.join('')], 'one answer with the rules');
  assert.ok(answers(false).length > 1, 'without the duty rules and the join years, 12/22 second half could be anyone');
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
test('the end: three stamps buy a wish, all four let you stay; told true once the old record is understood; home only by the signpost', async () => {
  const { canWish, canStay, trueMiracle, canGoHome, allEndings, opens } = await import('../js/services/cabin-story.js');
  const finale = { invited: true, twist: false, wish: null, stayed: false, endings: [] };
  const volunteer = tasks => ({ mark: 'J', tasks });
  assert.equal(opens(['2', '0', '0', '3']), true, 'the old record book opens to its year, jobs or no jobs');
  assert.equal(canWish(volunteer(['hay', 'wheel']), finale), false); assert.equal(canWish(volunteer(['hay', 'wheel', 'lichen']), finale), true);
  assert.equal(canWish(volunteer(['hay', 'wheel', 'lichen']), { ...finale, wish: 'snow' }), false, 'one wish');
  assert.equal(canStay(volunteer(['hay', 'wheel', 'lichen']), finale), false); assert.equal(canStay(volunteer(['hay', 'wheel', 'lichen', 'letters']), finale), true);
  assert.equal(canStay(volunteer(['hay', 'wheel', 'lichen', 'letters']), { ...finale, stayed: true }), false, 'signed once');
  assert.equal(trueMiracle({ ...finale, wish: 'snow' }), false, 'not without the old page');
  assert.equal(trueMiracle({ ...finale, twist: true }), false, 'not without a wish or staying');
  assert.equal(trueMiracle({ ...finale, twist: true, stayed: true }), true);
  assert.equal(canGoHome({ volunteer: { mark: '', tasks: [] }, finale }), true, 'offered the blank row, not signed: the signpost shows the way home');
  assert.equal(canGoHome({ volunteer: { mark: '', tasks: [] }, finale: { ...finale, invited: false } }), false, 'not before the row was offered');
  assert.equal(canGoHome({ volunteer: volunteer([]), finale }), false, 'not when signed up');
  assert.equal(canGoHome({ volunteer: { mark: '', tasks: [] }, finale: { ...finale, endings: ['A'] } }), true, 'chosen again, it is told again: nothing else ever tells it');
  assert.equal(allEndings({ ...finale, endings: ['A', 'B', 'C'] }), false, 'the three, and the truth too'); assert.equal(allEndings({ ...finale, endings: ['C', 'A', 'B'], truth: true }), true);
});
test('one ending reached opens the other two to watch; the true telling only once reached', async () => {
  const { canWatch } = await import('../js/services/cabin-story.js');
  const finale = { endings: [], truth: false };
  assert.deepEqual(['A', 'B', 'C', 'truth'].filter(kind => canWatch(finale, kind)), [], 'nothing before any ending');
  assert.deepEqual(['A', 'B', 'C', 'truth'].filter(kind => canWatch({ ...finale, endings: ['A'] }, kind)), ['A', 'B', 'C'], 'after A, B and C can be watched too');
  assert.deepEqual(['A', 'B', 'C', 'truth'].filter(kind => canWatch({ endings: ['C'], truth: true }, kind)), ['A', 'B', 'C', 'truth']);
  assert.equal(canWatch({ endings: ['B'], truth: false }, 'D'), false, 'only the three');
});
test('the clue book hints at the first thing the story is still waiting on', () => {
  const story = { left: false, opened: false, seen: [] }, volunteer = { mark: '', tasks: [] }, finale = { invited: false, twist: false, wish: null, stayed: false, endings: [] };
  // The yard's four things found (the lichen fed, the handle on the winch, the key and matches still in the pocket).
  const yard = { held: ['key', 'matches'], used: ['lichen', 'handle'] }, empty = { held: [], used: [] };
  const at = (changes = {}) => goal({ story: { ...story, ...changes.story }, volunteer: { ...volunteer, ...changes.volunteer }, finale: { ...finale, ...changes.finale }, bag: changes.bag ?? yard });
  const known = { opened: true, left: true, seen: ['tags', 'log', 'rules'], told: true }, signed = tasks => ({ mark: 'J', tasks });
  assert.equal(at({ bag: empty }), 'yard', 'the yard first'); assert.equal(at({ bag: { held: ['lichen', 'key', 'matches'], used: [] } }), 'yard', 'until the handle is found too');
  assert.equal(at({ story: { left: true }, bag: { held: ['key'], used: ['lichen', 'handle'] } }), 'yard', 'the matches still in the barn');
  assert.equal(at({ story: known, bag: empty }), 'join', 'past the bookcase the yard no longer matters');
  assert.equal(at({ story: { ...known, told: false } }), 'secret', 'the log put right: Santa has something to tell you first');
  assert.equal(at(), 'room'); assert.equal(at({ story: { left: true } }), 'bookcase');
  assert.equal(at({ story: { opened: true, left: true, seen: ['tags', 'rules'] } }), 'log', 'the wet shift log first');
  assert.equal(at({ story: known }), 'join'); assert.equal(at({ story: known, finale: { endings: ['A'] } }), 'endings', 'went home: other endings');
  assert.equal(at({ story: known, volunteer: signed(['hay']) }), 'jobs'); assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen']) }), 'cord');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen']), finale: { unlocked: true } }), 'reread', 'opened before the log was put right: read it again, no code to find');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen']), finale: { twist: true } }), 'jobs');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel']), finale: { twist: true } }), 'wish');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel']), finale: { twist: true, wish: 'snow', endings: ['B'], truth: true } }), 'endings');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel', 'letters']), finale: { twist: true, wish: 'snow', stayed: true, endings: ['A', 'B', 'C'], truth: true } }), 'done');
  assert.equal(at({ story: known, volunteer: signed(['hay', 'lichen', 'wheel', 'letters']), finale: { twist: true, wish: 'snow', stayed: true, endings: ['A', 'B', 'C'] } }), 'endings', 'the truth still to see');
  assert.equal(at({ story: known, finale: { twist: true, wish: 'snow', stayed: true, endings: ['A', 'B', 'C'], truth: true } }), 'done', 'all seen, then signed off: still done');
  for (const id of ['yard', 'room', 'bookcase', 'log', 'secret', 'join', 'jobs', 'cord', 'reread', 'wish', 'endings', 'done']) assert.ok(GOALS[id]?.hints.length, `${id} has hints`);
});
test('the wet shift log: one cell still reads, the rest are written back in, and only the right initials put it right', () => {
  const blank = readLog();
  assert.equal(blank.filter(Boolean).length, 1); assert.equal(blank[LOG_GIVEN], LOG_ANSWER[LOG_GIVEN]);
  assert.deepEqual(readLog(['X', 'O', 'E', 'K', 7]), ['', 'O', LOG_ANSWER[LOG_GIVEN], 'K', '', '', '', ''], 'only known initials; the clear cell stays as it reads');
  assert.equal(logSolved(blank), false); assert.equal(logWrong(blank), 7);
  const swapped = [...LOG_ANSWER]; [swapped[6], swapped[7]] = [swapped[7], swapped[6]];
  assert.equal(logWrong(swapped), 2); assert.equal(logSolved(LOG_ANSWER), true);
  assert.equal(goal({ story: { left: true, opened: true, seen: ['tags', 'rules'] }, volunteer: { mark: '', tasks: [] }, finale: { endings: [] } }), 'log');
  assert.equal(goal({ story: { left: true, opened: true, seen: ['log'], told: false }, volunteer: { mark: '', tasks: [] }, finale: { endings: [] } }), 'secret');
});
test('the cord\'s lock opens to the year on the snow globe, and nothing else', () => {
  assert.equal(opens([2, 0, 0, 3]), true); assert.equal(opens([2, 0, 0, 4]), false); assert.equal(opens('2003'), false); assert.equal(LOCK, '2003');
});
test('the music box drawer opens to the order the substitutes first flew, as the shift log has it', () => {
  assert.deepEqual(FLIGHT_ORDER, ['E', 'O', 'N', 'K', 'H']);
  assert.equal(playsOpen(['E', 'O', 'N', 'K', 'H']), true); assert.equal(playsOpen(['E', 'O', 'K', 'N', 'H']), false); assert.equal(playsOpen('EONKH'), false);
  assert.deepEqual(GIFTS, ['N', 'K', 'H', 'E', 'O'], 'a welcome ornament from each substitute');
});
test('the sorting rack: a letter goes to whoever was flying when it was postmarked; the day turns at six in the morning', () => {
  assert.equal(flyer('12/21', '20:10'), 'E'); assert.equal(flyer('12/21', '02:40'), 'O', 'after midnight, the same date: the second half of 12/21');
  assert.equal(flyer('12/23', '04:05'), 'N'); assert.equal(flyer('12/21', '05:59'), 'O'); assert.equal(flyer('12/20', '22:00'), null, 'no night on the log');
  assert.ok(MAIL.every(([, , time]) => Number(time.split(':')[0]) >= 18 || Number(time.split(':')[0]) < 6), 'every postmark is in a night');
  assert.equal(mailFor('tomas'), 'you'); assert.equal(mailFor('aya'), 'you');
  const right = Object.fromEntries([...MAIL.map(([id]) => [id, mailFor(id)]), ['tomas', 'you'], ['aya', 'you']]);
  assert.equal(sortWrong(right), 0); assert.equal(sortWrong({ ...right, m2: 'E' }), 1);
  assert.deepEqual([...new Set(MAIL.map(([id]) => mailFor(id)))].sort(), ['E', 'H', 'K', 'N', 'O'], 'every substitute gets a letter');
});
test('two volunteer jobs as rules: the feeding table by the clock, the sleigh loaded the other way round', async () => {
  const { FEED_ORDER, feedsNext, ROUTE, loadedRight } = await import('../js/services/cabin-story.js');
  assert.deepEqual(FEED_ORDER, ['oats', 'carrot', 'lichen'], 'by the times on the table');
  assert.equal(feedsNext([], 'oats'), true); assert.equal(feedsNext([], 'lichen'), false); assert.equal(feedsNext(['oats'], 'carrot'), true); assert.equal(feedsNext(['oats', 'carrot', 'lichen'], 'oats'), false);
  assert.equal(loadedRight([...ROUTE].reverse()), true, 'the last stop at the bottom, the first on top');
  assert.equal(loadedRight(ROUTE), false, 'in route order, the first stop would be at the bottom'); assert.equal(loadedRight(ROUTE.slice(1)), false); assert.equal(loadedRight(null), false);
});
test('stuck a while: one thing where the visitor is moves a little to show the way (the way there if it is elsewhere), never more', () => {
  const base = { story: { left: false, opened: false, shut: false, seen: [], told: false, shelf: homeShelf() }, volunteer: { mark: '', tasks: [] }, finale: { invited: false, twist: false, unlocked: false, wish: null, stayed: false, endings: [] }, bag: { held: [], used: [] }, desk: { sorted: false } };
  const at = (changes, place, options) => beckon({ ...base, ...changes, story: { ...base.story, ...changes.story }, finale: { ...base.finale, ...changes.finale } }, place, options);
  // The yard: the mailbox calls by itself while its flag is up; then each thing still to find, in the order they lead on.
  assert.equal(at({}, 'yard', { calling: true }), null, 'the raised flag calls already'); assert.equal(at({}, 'yard'), 'mailbox');
  assert.equal(at({ bag: { held: ['lichen'], used: [] } }, 'yard'), 'reindeer', 'hungry: he noses his trough');
  assert.equal(at({ bag: { held: [], used: ['lichen'] } }, 'yard'), 'trough', 'fed: the key in the hay');
  assert.equal(at({ bag: { held: ['key'], used: ['lichen'] } }, 'yard'), 'snow-pile');
  assert.equal(at({ bag: { held: ['key', 'handle'], used: ['lichen'] } }, 'yard'), 'hoist-tag');
  assert.equal(at({ bag: { held: ['lichen'], used: [] } }, 'room'), 'door', 'indoors too soon: the door');
  // The room: the things not used yet on this visit, then back to Santa's chair; from the yard, the door.
  const yard = { held: ['key', 'matches'], used: ['lichen', 'handle'] };
  assert.equal(at({ bag: yard }, 'room'), 'hearth'); assert.equal(at({ bag: yard }, 'room', { used: new Set(['hearth']) }), 'desk');
  assert.equal(at({ bag: yard }, 'room', { used: new Set(['hearth', 'desk']) }), 'chair', 'two used: back to the middle');
  assert.equal(at({ bag: yard }, 'yard'), 'door');
  // The bookcase: while Santa is back in his chair (after a reload), the room's things first, to send him out again; then
  // the gold books not in the four places yet, one at a time; never a plain one.
  assert.equal(at({ bag: yard, story: { left: true } }, 'room', { home: true }), 'hearth'); assert.equal(at({ bag: yard, story: { left: true } }, 'room', { home: true, used: new Set(['globe']) }), 'chair', 'one thing is enough the second time');
  const gold = turn => at({ bag: yard, story: { left: true } }, 'room', { turn });
  assert.deepEqual(new Set([0, 1, 2, 3, 4].map(gold)), new Set(['book-o1', 'book-m1', 'book-e1', 'book-r1', 'book-r2']));
  const placed = moveBook(homeShelf(), homeShelf().indexOf('book-m1'), GAPS[0]);
  assert.ok([0, 1, 2, 3].every(turn => at({ bag: yard, story: { left: true, shelf: placed } }, 'room', { turn }) !== 'book-m1'), 'M in its place stays still');
  // Behind the bookcase: the shift log, the register, the old record book; from the room the open bookcase, from the yard the door.
  const known = { opened: true, left: true, seen: ['tags', 'log', 'rules'], told: true };
  assert.equal(at({ bag: yard, story: { opened: true, left: true, seen: ['tags'] } }, 'little'), 'secret-log');
  assert.equal(at({ bag: yard, story: { opened: true, left: true, seen: ['tags'] } }, 'room'), 'bookcase');
  assert.equal(at({ bag: yard, story: { opened: true, left: true, seen: ['tags'] } }, 'yard'), 'door');
  assert.equal(at({ story: { ...known, told: false } }, 'room'), 'chair', 'Santa is back: his chair'); assert.equal(at({ story: { ...known, told: false } }, 'little'), null);
  assert.equal(at({ story: known }, 'little'), 'register'); assert.equal(at({ story: known, finale: { endings: ['A'] } }, 'little'), 'register');
  // The jobs: the first not done where the visitor is (the letters start at the rack, then the desk), or else the way to one.
  const signed = tasks => ({ mark: 'J', tasks });
  assert.equal(at({ story: known, volunteer: signed([]) }, 'yard'), 'reindeer'); assert.equal(at({ story: known, volunteer: signed(['lichen']) }, 'yard'), 'sleigh');
  assert.equal(at({ story: known, volunteer: signed(['lichen', 'hay']), finale: { twist: true } }, 'yard'), 'wheel');
  assert.equal(at({ story: known, volunteer: signed([]) }, 'little'), 'register'); assert.equal(at({ story: known, volunteer: signed([]), desk: { sorted: true } }, 'room'), 'desk');
  assert.equal(at({ story: known, volunteer: signed(['lichen', 'hay', 'wheel']), finale: { twist: true, wish: 'snow', endings: ['B'] }, desk: { sorted: true } }, 'yard'), 'door', 'other endings, from the yard: the door');
  assert.equal(at({ story: known, volunteer: signed(['lichen', 'hay']) }, 'little'), 'record'); assert.equal(at({ story: known, volunteer: signed(['lichen', 'hay']), finale: { unlocked: true } }, 'little'), 'record');
  assert.equal(at({ story: known, volunteer: signed(['lichen', 'hay', 'wheel', 'letters']), finale: { twist: true, wish: 'snow', stayed: true, endings: ['A', 'B', 'C'], truth: true } }, 'little'), null, 'all done: nothing calls');
});
test('the story has got further when a goal moves on, a yard thing is found, a job is done or an ending seen; not for a clue', () => {
  const state = () => ({ story: { left: false, opened: false, seen: [], told: false, shelf: homeShelf() }, volunteer: { mark: '', tasks: [] }, finale: { twist: false, wish: null, stayed: false, endings: [], asked: false }, bag: { held: [], used: [] } });
  const start = state(), first = milestone(start);
  const found = state(); found.bag.held.push('lichen'); assert.notEqual(milestone(found), first, 'the lichen found');
  const known = { opened: true, left: true, seen: ['tags', 'log', 'rules'], told: true };
  const signed = state(); Object.assign(signed.story, known); signed.volunteer = { mark: 'J', tasks: [] }; const before = milestone(signed);
  signed.volunteer.tasks.push('wheel'); assert.notEqual(milestone(signed), before, 'a job done');
  const ended = state(); Object.assign(ended.story, known); const unended = milestone(ended); ended.finale.endings.push('A'); assert.notEqual(milestone(ended), unended, 'an ending seen');
  assert.equal(milestone(Object.assign(state(), { clues: ['care-note'] })), first, 'a clue alone is not a step on');
});
