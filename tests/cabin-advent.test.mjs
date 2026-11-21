import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAYS, daysOpen, readOpened, today } from '../js/services/cabin-advent.js';
import { ADVENT, WINDOWS } from '../js/data/cabin-advent.js';
import { ADVENT_SCENES, coverScene } from '../js/components/cabin-advent-scenes.js';
import { introCultures } from '../js/data/intro-cultures.js';

test('one window a day in December up to Christmas Eve; none in November; all from Christmas on', () => {
  assert.equal(daysOpen(new Date(2026, 10, 30)), 0); assert.equal(daysOpen(new Date(2026, 11, 1)), 1); assert.equal(daysOpen(new Date(2026, 11, 18)), 18);
  assert.equal(daysOpen(new Date(2026, 11, 24)), DAYS); assert.equal(daysOpen(new Date(2026, 11, 31)), DAYS); assert.equal(daysOpen(new Date(2027, 2, 3)), DAYS, 'the rest of the year, all of them');
});
test('another day can be tried only on a preview server on this computer', () => {
  const at = (hostname, search) => today({ hostname, search });
  const tried = at('127.0.0.1', '?today=12-18'); assert.equal(tried.getMonth(), 11); assert.equal(tried.getDate(), 18);
  assert.equal(at('localhost', '?today=12-1').getDate(), 1);
  assert.notEqual(at('en47.github.io', '?today=12-18').getTime(), tried.getTime(), 'online it is always the real date');
  assert.ok(Math.abs(at('127.0.0.1', '?today=soon').getTime() - Date.now()) < 5000, 'anything else: today');
});
test('the windows opened are kept as days of the twenty-four, once each, in order', () => {
  assert.deepEqual(readOpened([5, 1, 5, 25, 0, 'x', 2.5, 24]), [1, 5, 24]); assert.deepEqual(readOpened('1,2'), []); assert.deepEqual(readOpened(undefined), []);
});
test('twenty-four windows, each with a picture, one short line and a scene to tap; the Intro countries linked', () => {
  assert.equal(WINDOWS.length, DAYS);
  assert.ok(WINDOWS.every(({ art, text }) => art && text && text.length <= 40), 'one line each, short');
  assert.ok(WINDOWS.every(({ play }) => play && play.length <= 12) && ADVENT.cover, 'what a tap on each scene does, said in a few words (for screen readers)');
  assert.equal(ADVENT_SCENES.length, DAYS); assert.ok([...ADVENT_SCENES, coverScene].every(scene => typeof scene === 'function'), 'a scene for each window, and the cover');
  // Only countries the Intro map really has are linked, to that country's postcard (the map has no Germany: its days link nowhere).
  assert.deepEqual(WINDOWS.filter(window => window.intro).map(window => window.intro).sort(), ['finland', 'iceland', 'japan', 'mexico', 'uk']);
  assert.ok(WINDOWS.every(({ intro }) => !intro || introCultures.some(culture => culture.id === intro)), 'every linked country is on the map');
  assert.ok(WINDOWS.filter(({ text }) => text.includes('德國')).every(({ intro }) => !intro));
  assert.equal(ADVENT.title, 'Advent Calendar'); assert.equal(ADVENT.name, '降臨小屋');
  assert.ok(WINDOWS.every(({ move }) => !move || ['bob', 'spin', 'swing', 'twinkle'].includes(move)));
  assert.ok(ADVENT.before(6).includes('12/1') && ADVENT.locked.includes('還沒到'));
});
test('every open door can be shut again, so the days can be opened over; the count reads whole, or short on a narrow lid', () => {
  assert.ok(ADVENT.shut.startsWith('全部關上') && ADVENT.shutLabel.includes('從頭再開'));
  assert.equal(`${ADVENT.countLead} ${ADVENT.count(5)}`, '打開了 5／24 扇'); assert.equal(ADVENT.count(0), '0／24 扇');
});
