// What a visitor has done in Santa's yard, kept in this browser only and never sent anywhere. One versioned record, so a
// Christmas passport or the cabin's story can later read the same place. Every function takes the storage, so tests pass a stand-in.
import { CLUES, GIFTS, LOG_ANSWER, SLIP, TASKS, canSign, homeShelf, readLog, readShelf } from './cabin-story.js';
import { emptyBag, ever, readBag } from './cabin-bag.js';
import { WISHES } from '../data/cabin-finale.js';
import { GOALS, NOTEBOOK } from '../data/cabin-clues.js';

const KEY = 'holy-merry:cabin:v1';
export const PLACES = ['head', 'neck', 'face', 'hand'];
// The snowman as he was built: only a carrot nose.
export const DEFAULT_OUTFIT = Object.freeze({ head: null, neck: null, face: 'carrot', hand: null });
// The barn's hoist: whether its rope is hooked at the top, and whether the note behind the bale has been read. The desk:
// which replies have been sealed with wax, postmarked and sent, what the volunteer chose to say in theirs (by letter), and
// whether the rack's letters have been sorted (the two new ones reach the desk only then). The story: whether Santa has
// ever gone out, how the bookcase's books stand, whether it has opened (and whether it has been pushed shut again since),
// and which clues behind it have been read, and how far the wet shift log has been written back in
// (cabin-story.js). Volunteering: the initial signed in the register ('' when not signed up) and the jobs done for it. The
// end: whether the register's blank row has been offered, the old pages untied, which wish was made, the early shift
// signed, and which endings have been seen; the cord's lock opened, and the blank slip under it taken or read. The clue book: what has been written in it, and how many hints have been asked
// for, by what the story was waiting on. The substitutes' welcome ornaments found so far (by initial), and whether they
// have been hung on the tree; how many times the big wheel's gearbox has been put right (each opens a new board). The
// pocket: what is in it now and what has been used for good (cabin-bag.js); a record from before it had a pocket starts empty,
// except that a barn hoisted then has its winch's crank fitted (the crank is the snowman's handle, so that is found too).
// What has been set right in the room for good that the pocket does not show (`placed`): the music box's catch undone by the
// brass pin (a tool, kept). A record whose music box drawer was opened before it had a catch counts it undone.
const blank = () => ({ outfit: { ...DEFAULT_OUTFIT }, combos: [], feed: { day: '', count: 0 }, hoist: { locked: false, found: false }, desk: { sealed: [], marked: [], sent: [], answers: {}, sorted: false }, story: { left: false, opened: false, shut: false, shelf: homeShelf(), seen: [], log: readLog() }, volunteer: { mark: '', tasks: [] }, finale: { invited: false, twist: false, unlocked: false, slip: 'none', wish: null, stayed: false, endings: [] }, clues: [], hints: {}, ornaments: [], tree: false, wheelRounds: 0, bag: emptyBag(), placed: [] });
export const PLACED = ['musicbox-catch'];
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
  // An older record kept only whether Santa's reply was sealed.
  const desk = saved.desk ?? {}, ids = list => Array.isArray(list) ? [...new Set(list.filter(id => typeof id === 'string'))].slice(0, 20) : [];
  const answers = desk.answers && typeof desk.answers === 'object' && !Array.isArray(desk.answers) ? Object.entries(desk.answers).filter(([, value]) => Number.isInteger(value) && value >= 0 && value < 3).slice(0, 10) : [];
  progress.desk = { sealed: desk.sealed === true ? ['reply'] : ids(desk.sealed), marked: ids(desk.marked), sent: ids(desk.sent), answers: Object.fromEntries(answers), sorted: desk.sorted === true || answers.length > 0 };
  const seen = saved.story?.seen;
  progress.story = { left: saved.story?.left === true, opened: saved.story?.opened === true, shut: saved.story?.shut === true, shelf: readShelf(saved.story?.shelf), seen: Array.isArray(seen) ? CLUES.filter(clue => seen.includes(clue)) : [] };
  // The shift log as far as it has been written back in; one read before it got wet (an older record) is whole.
  progress.story.log = progress.story.seen.includes('log') ? [...LOG_ANSWER] : readLog(saved.story?.log);
  const tasks = saved.volunteer?.tasks;
  progress.volunteer = { mark: canSign(saved.volunteer?.mark) ? saved.volunteer.mark : '', tasks: Array.isArray(tasks) ? TASKS.filter(task => tasks.includes(task)) : [] };
  // Letters answered before the rack had to be sorted first: it counts as sorted.
  if (progress.volunteer.tasks.includes('letters')) progress.desk.sorted = true;
  const end = saved.finale ?? {}, endings = end.endings;
  progress.finale = { invited: end.invited === true, twist: end.twist === true, unlocked: end.unlocked === true || end.twist === true, slip: SLIP.includes(end.slip) ? end.slip : 'none', wish: WISHES.some(wish => wish.id === end.wish) ? end.wish : null, stayed: end.stayed === true, endings: Array.isArray(endings) ? ['A', 'B', 'C', 'D'].filter(ending => endings.includes(ending)) : [] };
  if (Number.isInteger(saved.wheelRounds) && saved.wheelRounds > 0) progress.wheelRounds = Math.min(saved.wheelRounds, 999);
  // An earlier record kept the same finds as pieces of a photograph, by where they were found.
  const OLD = { music: 'N', rack: 'O', snowman: 'E', wheel: 'K', hat: 'H' }, found = Array.isArray(saved.ornaments) ? saved.ornaments : Array.isArray(saved.pieces) ? saved.pieces.map(id => OLD[id]) : [];
  progress.ornaments = GIFTS.filter(mark => found.includes(mark)); progress.tree = saved.tree === true;
  progress.bag = readBag(saved.bag);
  if ((progress.hoist.locked || progress.hoist.found) && !ever(progress.bag, 'handle')) progress.bag.used.push('handle');
  progress.placed = PLACED.filter(id => (Array.isArray(saved.placed) && saved.placed.includes(id)) || (id === 'musicbox-catch' && progress.ornaments.includes('N')));
  if (Array.isArray(saved.clues)) progress.clues = Object.keys(NOTEBOOK).filter(id => saved.clues.includes(id));
  const hints = saved.hints && typeof saved.hints === 'object' && !Array.isArray(saved.hints) ? saved.hints : {};
  // `gifts`: how many hints about the welcome gifts have been asked for.
  const most = id => id === 'gifts' ? 5 : GOALS[id].hints.length;
  progress.hints = Object.fromEntries([...Object.keys(GOALS), 'gifts'].filter(id => Number.isInteger(hints[id]) && hints[id] > 0).map(id => [id, Math.min(hints[id], most(id))]));
  return progress;
}
// Returns false when the browser will not keep it (private mode, full storage); the yard still plays for this visit.
export function writeProgress(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
export const dressed = outfit => PLACES.every(place => outfit[place]);
