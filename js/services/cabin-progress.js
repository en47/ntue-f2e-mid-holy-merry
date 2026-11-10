// What a visitor has done in Santa's yard, kept in this browser only and never sent anywhere. One versioned record, so a
// Christmas passport or the cabin's story can later read the same place. Every function takes the storage, so tests pass a stand-in.
import { CLUES, TASKS, canSign, homeShelf, readShelf } from './cabin-story.js';

const KEY = 'holy-merry:cabin:v1';
export const PLACES = ['head', 'neck', 'face', 'hand'];
// The snowman as he was built: only a carrot nose.
export const DEFAULT_OUTFIT = Object.freeze({ head: null, neck: null, face: 'carrot', hand: null });
// The barn's hoist: whether its rope is hooked at the top, and whether the note behind the bale has been read. The desk:
// which letters have been postmarked, and whether the waiting reply has been sealed with wax. The story: whether Santa has
// ever gone out, how the bookcase's books stand, whether it has opened (and whether it has been pushed shut again since),
// and which clues behind it have been read
// (cabin-story.js). Volunteering: the initial signed in the register ('' when not signed up) and the jobs done for it.
const blank = () => ({ outfit: { ...DEFAULT_OUTFIT }, combos: [], feed: { day: '', count: 0 }, hoist: { locked: false, found: false }, desk: { stamped: [], sealed: false }, story: { left: false, opened: false, shut: false, shelf: homeShelf(), seen: [] }, volunteer: { mark: '', tasks: [] } });
// The reindeer eats five meals, then is full until the next day on this computer's calendar.
export const MEALS = 5;
export const dayOf = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const mealsToday = (progress, date = new Date()) => progress.feed.day === dayOf(date) ? progress.feed.count : 0;
export const full = (progress, date = new Date()) => mealsToday(progress, date) >= MEALS;
export function eat(progress, date = new Date()) { progress.feed = { day: dayOf(date), count: Math.min(MEALS, mealsToday(progress, date) + 1) }; return progress.feed.count; }

// A missing, broken or partly unknown record keeps whatever is still valid. `known(place, id)` says which accessories exist.
export function readProgress(storage = globalThis.localStorage, known = () => true) {
  let saved = null; try { saved = JSON.parse(storage?.getItem(KEY) ?? 'null'); } catch { /* a broken record starts over */ }
  const progress = blank();
  if (!saved || typeof saved !== 'object') return progress;
  for (const place of PLACES) {
    const id = saved.outfit?.[place];
    if (id === null || (typeof id === 'string' && known(place, id))) progress.outfit[place] = id;
  }
  if (Array.isArray(saved.combos)) progress.combos = [...new Set(saved.combos.filter(id => typeof id === 'string'))].slice(0, 20);
  const { day, count } = saved.feed ?? {};
  if (typeof day === 'string' && Number.isInteger(count)) progress.feed = { day, count: Math.max(0, Math.min(MEALS, count)) };
  progress.hoist = { locked: saved.hoist?.locked === true, found: saved.hoist?.found === true };
  const stamped = saved.desk?.stamped;
  progress.desk = { stamped: Array.isArray(stamped) ? [...new Set(stamped.filter(id => typeof id === 'string'))].slice(0, 20) : [], sealed: saved.desk?.sealed === true };
  const seen = saved.story?.seen;
  progress.story = { left: saved.story?.left === true, opened: saved.story?.opened === true, shut: saved.story?.shut === true, shelf: readShelf(saved.story?.shelf), seen: Array.isArray(seen) ? CLUES.filter(clue => seen.includes(clue)) : [] };
  const tasks = saved.volunteer?.tasks;
  progress.volunteer = { mark: canSign(saved.volunteer?.mark) ? saved.volunteer.mark : '', tasks: Array.isArray(tasks) ? TASKS.filter(task => tasks.includes(task)) : [] };
  return progress;
}
// Returns false when the browser will not keep it (private mode, full storage); the yard still plays for this visit.
export function writeProgress(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
export const dressed = outfit => PLACES.every(place => outfit[place]);
