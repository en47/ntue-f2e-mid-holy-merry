import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_OUTFIT, FOUND, MEALS, dayOf, dressed, eat, full, mealsToday, readProgress, resetProgress, writeProgress } from '../js/services/cabin-progress.js';
import { GOALS } from '../js/data/cabin-clues.js';

const memory = (initial = {}) => { const data = { ...initial }; return { getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = String(value); }, removeItem: key => { delete data[key]; }, data }; };
test('starting over forgets the village and its found corners, and nothing else this browser keeps', () => {
  const store = memory({ 'holy-merry:cabin:v1': '{"story":{}}', [FOUND]: '["mailbox"]', 'holy-merry:wishes:v1': '[1]', 'holy-merry:music': 'on' });
  assert.equal(resetProgress(store), true); assert.deepEqual(Object.keys(store.data).sort(), ['holy-merry:music', 'holy-merry:wishes:v1']);
  assert.equal(FOUND, 'holy-merry:cabin:found');
});

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
test('a barn hoisted before the pocket existed keeps its winch\'s crank (the snowman\'s handle) fitted', () => {
  const old = hoist => readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ hoist }) })).bag;
  assert.deepEqual(old({ locked: true, found: true }), { held: [], used: ['handle'] });
  assert.deepEqual(old({ locked: false, found: true }), { held: [], used: ['handle'] }, 'read, then let down again');
  assert.deepEqual(old({ locked: false, found: false }), { held: [], used: [] }, 'never hoisted: the handle is still in the snow');
  const fitted = readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ hoist: { locked: true, found: false }, bag: { held: ['key'], used: ['handle'] } }) })).bag;
  assert.deepEqual(fitted, { held: ['key'], used: ['handle'] }, 'once only');
});
test('the music box catch stays undone once the brass pin has undone it; a drawer opened before it had a catch counts', () => {
  const read = saved => readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify(saved) })).placed;
  assert.deepEqual(read({}), []);
  assert.deepEqual(read({ placed: ['musicbox-catch', 'musicbox-catch', 'nonsense', 4] }), ['musicbox-catch']);
  assert.deepEqual(read({ ornaments: ['N'] }), ['musicbox-catch'], 'Nils\'s ornament found before: the catch was never in the way');
  assert.deepEqual(read({ placed: 'musicbox-catch' }), []);
});
test('Santa having told you the secret is kept; a record from before counts it told once the log was put right', () => {
  const read = story => readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ story }) })).story.told;
  assert.equal(read({ seen: ['log'], told: false }), false); assert.equal(read({ seen: ['log'], told: true }), true);
  assert.equal(read({ seen: ['tags', 'log', 'rules'] }), true, 'an older record, the secret known'); assert.equal(read({ seen: ['tags'] }), false);
});
test('the blank slip and the big gear, from before the pocket: in it (or used) as they were', () => {
  const bag = saved => readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify(saved) })).bag;
  assert.deepEqual(bag({ finale: { slip: 'taken' } }), { held: ['slip'], used: [] }); assert.deepEqual(bag({ finale: { slip: 'read' } }), { held: [], used: ['slip'] });
  assert.deepEqual(bag({ volunteer: { mark: 'J', tasks: ['wheel'] } }), { held: [], used: ['gear'] }, 'the wheel mended: its gear is in the box');
  assert.deepEqual(bag({ wheelRounds: 2 }), { held: [], used: ['gear'] });
  assert.deepEqual(bag({ finale: { slip: 'taken' }, bag: { held: ['slip'], used: [] } }), { held: ['slip'], used: [] }, 'once only');
});
test('the desk remembers which replies were sealed, postmarked and sent, what was chosen to say, and the letters sorted so far', () => {
  assert.deepEqual(readProgress(memory()).desk, { sealed: [], marked: [], sent: [], answers: {}, sorted: false, rack: {} });
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { sealed: ['reply', 'reply', 7], marked: ['reply'], sent: ['reply-tomas'], answers: { tomas: 2, aya: 5, ole: 'x' } } }) });
  assert.deepEqual(readProgress(store).desk, { sealed: ['reply'], marked: ['reply'], sent: ['reply-tomas'], answers: { tomas: 2 }, sorted: true, rack: {} });
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { stamped: ['mia'], sealed: true } }) })).desk, { sealed: ['reply'], marked: [], sent: [], answers: {}, sorted: false, rack: {} }, 'an older record: the reply had been sealed');
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { sealed: 1, answers: [1] } }) })).desk, { sealed: [], marked: [], sent: [], answers: {}, sorted: false, rack: {} });
  const rack = readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { rack: { m1: 'E', tomas: 'you', m2: 'S', 'no way': 'N', m3: 7 } } }) })).desk.rack;
  assert.deepEqual(rack, { m1: 'E', tomas: 'you' }, 'letters already in a pigeonhole stay there; nothing else is kept');
});
test('a shift log put right before its copy went into the clue book is in it now too', () => {
  const clues = saved => readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify(saved) })).clues;
  assert.ok(clues({ story: { opened: true, seen: ['tags', 'log', 'rules'] }, clues: ['tags'] }).includes('shift-log'));
  assert.ok(!clues({ story: { opened: true, seen: ['tags'] }, clues: ['tags'] }).includes('shift-log'), 'not before it is put right');
});
test('the story keeps only real clues and a whole shelf', () => {
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { left: true, opened: true, seen: ['log', 'tags', 'diary', 'log'], shelf: 'x' } }) });
  const { story } = readProgress(store);
  assert.deepEqual(story.seen, ['tags', 'log']); assert.equal(story.left, true); assert.equal(story.opened, true); assert.equal(story.shelf.length, 13);
});
test('a solved bookcase remembers being pushed shut', () => {
  assert.equal(readProgress(memory()).story.shut, false);
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { opened: true, shut: true } }) })).story.shut, true);
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { opened: true, shut: 'yes' } }) })).story.shut, false);
});
test('volunteering is kept: a valid initial and the known jobs, once each', () => {
  const storage = memory();
  assert.deepEqual(readProgress(storage).volunteer, { mark: '', tasks: [] });
  storage.setItem('holy-merry:cabin:v1', JSON.stringify({ volunteer: { mark: 'J', tasks: ['hay', 'hay', 'sweeping', 'wheel'] } }));
  assert.deepEqual(readProgress(storage).volunteer, { mark: 'J', tasks: ['hay', 'wheel'] });
  storage.setItem('holy-merry:cabin:v1', JSON.stringify({ volunteer: { mark: 'N', tasks: 'hay' } }));
  assert.deepEqual(readProgress(storage).volunteer, { mark: '', tasks: [] }, 'a name tag\'s initial, or tasks that are not a list, are dropped');
});
test('the end is kept: offered, untied, the wish, staying, the endings seen, told true, asked; nothing else', () => {
  assert.deepEqual(readProgress(memory()).finale, { invited: false, twist: false, unlocked: false, slip: 'none', wish: null, stayed: false, endings: [], truth: false, asked: false });
  const store = memory({ 'holy-merry:cabin:v1': JSON.stringify({ finale: { invited: true, twist: true, wish: 'snow', stayed: true, endings: ['B', 'D', 'B', 'Z'] } }) });
  assert.deepEqual(readProgress(store).finale, { invited: true, twist: true, unlocked: true, slip: 'none', wish: 'snow', stayed: true, endings: ['B'], truth: true, asked: false }, 'an older record\'s ending D: B or C was told true');
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ finale: { endings: ['C', 'A'], truth: true, asked: true } }) })).finale, { invited: false, twist: false, unlocked: false, slip: 'none', wish: null, stayed: false, endings: ['A', 'C'], truth: true, asked: true });
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ finale: { twist: 'yes', wish: 'pony', endings: 'A', truth: 'yes', asked: 1 } }) })).finale, { invited: false, twist: false, unlocked: false, slip: 'none', wish: null, stayed: false, endings: [], truth: false, asked: false });
});
test('the clue book is kept: known clues once each, hints asked for by goal, nothing else', () => {
  const storage = memory({ 'holy-merry:cabin:v1': JSON.stringify({ clues: ['tags', 'barn-note', 'nonsense', 'tags', 3], hints: { room: 2, jobs: 9, bookcase: -1, nonsense: 1, secret: 'x' } }) });
  const progress = readProgress(storage);
  assert.deepEqual(progress.clues, ['barn-note', 'tags']); assert.deepEqual(progress.hints, { room: 2, jobs: GOALS.jobs.hints.length }, 'capped at the hints there are');
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ clues: 'tags', hints: [1] }) })).hints, {});
});
test('the shift log is kept as far as it has been written; one read before it got wet is whole', () => {
  const kept = readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { opened: true, seen: ['tags'], log: ['E', 'Z', 'K', 'K'] } }) })).story.log;
  assert.deepEqual(kept.slice(0, 4), ['E', '', 'N', 'K']);
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ story: { opened: true, seen: ['log'] } }) })).story.log, ['E', 'O', 'N', 'K', 'H', 'N', 'K', 'H']);
});
test('the cord\'s lock is kept open, and the blank slip taken or read; an older record past the old page is open', () => {
  const kept = readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ finale: { unlocked: true, slip: 'read' } }) })).finale;
  assert.equal(kept.unlocked, true); assert.equal(kept.slip, 'read');
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ finale: { slip: 'eaten' } }) })).finale.slip, 'none');
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ finale: { twist: true } }) })).finale.unlocked, true);
});
test('the welcome ornaments found are kept by their makers\' initials; an older record\'s photo pieces carry over', () => {
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ ornaments: ['O', 'N', 'Z', 'N'], tree: true }) })).ornaments, ['N', 'O']);
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ pieces: ['hat', 'music', 'nope'] }) })).ornaments, ['N', 'H']);
  assert.deepEqual(readProgress(memory()).ornaments, []); assert.equal(readProgress(memory()).tree, false);
});
test('the rack sorted is kept; letters already answered or the job done count as sorted', () => {
  assert.equal(readProgress(memory()).desk.sorted, false);
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { sorted: true } }) })).desk.sorted, true);
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ desk: { answers: { tomas: 1 } } }) })).desk.sorted, true);
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ volunteer: { mark: 'J', tasks: ['letters'] } }) })).desk.sorted, true);
});
test('hints asked for about the welcome gifts are kept too, up to one for each gift', () => {
  assert.deepEqual(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ hints: { gifts: 2, nonsense: 3 } }) })).hints, { gifts: 2 });
  assert.equal(readProgress(memory({ 'holy-merry:cabin:v1': JSON.stringify({ hints: { gifts: 40 } }) })).hints.gifts, 5);
});

