// The cabin's hidden story, as plain rules: no randomness, no AI, the same answer every time. The bookcase has thirteen
// places for its nine letter books: the nine along HOLY MERRY's shelf (0–8) and the four empty ones left of the SANTA
// picture book (9–12). A book moves to an empty place, or swaps with the book already there; the shelf opens when the four
// places spell MORE (the two R books are alike, either will do).
export const LETTERS = ['H', 'O', 'L', 'Y', 'M', 'E', 'R', 'R', 'Y'];
export const BOOK_IDS = ['book-h1', 'book-o1', 'book-l1', 'book-y1', 'book-m1', 'book-e1', 'book-r1', 'book-r2', 'book-y2'];
export const PLACES = 13, GAPS = [9, 10, 11, 12];
export const homeShelf = () => [...BOOK_IDS, null, null, null, null];
const letterOf = id => LETTERS[BOOK_IDS.indexOf(id)];

// A saved arrangement is used only if it still holds each book exactly once in thirteen places.
export function readShelf(saved) {
  if (!Array.isArray(saved) || saved.length !== PLACES) return homeShelf();
  const books = saved.filter(id => id !== null);
  return books.length === BOOK_IDS.length && new Set(books).size === BOOK_IDS.length && books.every(id => BOOK_IDS.includes(id)) ? [...saved] : homeShelf();
}
export function moveBook(shelf, from, to) {
  if (from === to || !shelf[from] || to < 0 || to >= PLACES) return shelf;
  const next = [...shelf]; [next[from], next[to]] = [shelf[to], shelf[from]]; return next;
}
export const spelled = shelf => GAPS.map(place => shelf[place] ? letterOf(shelf[place]) : '·').join('');
export const solved = shelf => spelled(shelf) === 'MORE';
// Santa goes out to the reindeer once the visitor has used two different things in the room (one, for someone who has
// seen him go before), and only while he is at home and the shelf is not yet open.
export const santaGoes = ({ used, left, home, opened }) => home && !opened && used >= (left ? 1 : 2);
// In the little room behind the bookcase three things tell the secret: the name tags, the shift log and the rulebook.
// Seen all three, the visitor knows there is more than one Santa; then he comes home from the reindeer. The log only counts
// once it has been put right (below): snow melted on it and the ink ran.
export const CLUES = ['tags', 'log', 'rules'];
export const knowsSantas = seen => CLUES.every(clue => seen.includes(clue));
export const santaReturns = ({ home, opened, seen }) => !home && opened && knowsSantas(seen);
// The shift log: four nights before Christmas, each flown in two halves (who started, who took over). The visitor writes
// the ink back in, a substitute's initial in each cell, from what they have seen around the village; one cell still reads.
export const NIGHTS = [['12/21', 'E', 'O'], ['12/22', 'N', 'K'], ['12/23', 'H', 'N'], ['12/24', 'K', 'H']];
export const LOG_ANSWER = NIGHTS.flatMap(([, first, second]) => [first, second]), LOG_GIVEN = 2;
export const SUBSTITUTES = ['N', 'K', 'H', 'E', 'O'];
export const readLog = saved => LOG_ANSWER.map((mark, i) => i === LOG_GIVEN ? mark : Array.isArray(saved) && SUBSTITUTES.includes(saved[i]) ? saved[i] : '');
export const logWrong = log => log.filter((mark, i) => mark !== LOG_ANSWER[i]).length;
export const logSolved = log => logWrong(log) === 0;
// The sorting rack, where the letters job starts: a letter goes to whoever was flying when it was postmarked, by the shift
// log; past midnight still counts as the night before (its second half). The two for the new substitute go to them.
export const MAIL = [['m1', '12/21', '20:10'], ['m2', '12/22', '02:40'], ['m3', '12/22', '22:30'], ['m4', '12/23', '01:15'], ['m5', '12/23', '19:50'], ['m6', '12/24', '04:05']];
const dayBefore = date => { const [month, day] = date.split('/').map(Number); return `${month}/${day - 1}`; };
export function flyer(date, time) {
  const late = Number(time.split(':')[0]) < 12, night = NIGHTS.find(([day]) => day === (late ? dayBefore(date) : date));
  return night ? night[late ? 2 : 1] : null;
}
export const mailFor = id => { const letter = MAIL.find(([each]) => each === id); return letter ? flyer(letter[1], letter[2]) : 'you'; };
export const sortWrong = placed => Object.entries(placed).filter(([id, box]) => box !== mailFor(id)).length;
// The music box's hidden drawer opens to its comb played in the order the substitutes first flew that season, as the
// shift log has it (E, O, N, K, H).
export const FLIGHT_ORDER = [...new Set(LOG_ANSWER)];
export const playsOpen = notes => Array.isArray(notes) && notes.join('') === FLIGHT_ORDER.join('');
// The welcome gifts: an ornament from each substitute, hidden somewhere for whoever comes to help next
// (cabin-ornaments.js); found, each is kept by its maker's initial.
export const GIFTS = SUBSTITUTES;
// Once the secret is known, the visitor may sign the register with an initial of their own (not one already on a name
// tag, nor Santa's S) and help: four jobs around the village, each earning a wish point the first time it is done while
// signed up. Leaving is always allowed and keeps the points earned (they come back on signing again).
export const TASKS = ['lichen', 'hay', 'letters', 'wheel'];
export const TAKEN = ['N', 'K', 'H', 'E', 'O', 'S'];
export const canSign = mark => typeof mark === 'string' && /^[A-Z]$/.test(mark) && !TAKEN.includes(mark);
export const signedUp = volunteer => canSign(volunteer.mark);
export const points = volunteer => TASKS.filter(task => volunteer.tasks.includes(task)).length;
export const pending = (volunteer, task) => signedUp(volunteer) && TASKS.includes(task) && !volunteer.tasks.includes(task);
// A job done: it counts once, and only while signed up. Returns whether it counted.
export function record(volunteer, task) { if (!pending(volunteer, task)) return false; volunteer.tasks.push(task); return true; }
// The end of the story. Two jobs done, the register's old pages can be untied: Holly's wish, granted long ago, and her on
// the shift log every year since (the second twist). Three stamps buy a wish (granted by another substitute); all four
// jobs done, the early shift on Christmas morning can be signed (staying on). Endings: A, a visitor who saw the register's
// blank row and went home without signing; B, a wish granted; C, staying on; D, either of those knowing what Holly knew.
export const WISH_COST = 3;
export const canUntie = volunteer => signedUp(volunteer) && points(volunteer) >= 2;
// The cord's little lock: four dials, opened by the year Holly's wish came true (the snow globe's base, H. · 2003).
export const LOCK = '2003';
export const opens = dials => Array.isArray(dials) && dials.join('') === LOCK;
// The blank slip under the cord: still there, in the visitor's pocket, or held to the fire and read.
export const SLIP = ['none', 'taken', 'read'];
export const canWish = (volunteer, finale) => signedUp(volunteer) && points(volunteer) >= WISH_COST && !finale.wish;
export const canStay = (volunteer, finale) => signedUp(volunteer) && points(volunteer) === TASKS.length && !finale.stayed;
export const trueMiracle = finale => finale.twist && Boolean(finale.wish || finale.stayed);
export const goesHome = ({ volunteer, finale }) => finale.invited && !signedUp(volunteer) && !finale.endings.includes('A');
// What the story is waiting on now, for the clue book's hints (data/cabin-clues.js): the first thing not yet done.
export function goal({ story, volunteer, finale }) {
  if (!story.opened) return story.left ? 'bookcase' : 'room';
  if (!knowsSantas(story.seen)) return story.seen.includes('log') ? 'secret' : 'log';
  if (!signedUp(volunteer)) return finale.endings.length ? 'endings' : 'join';
  if (!finale.twist) return canUntie(volunteer) ? 'cord' : 'jobs';
  if (!finale.wish && !finale.stayed) return points(volunteer) >= WISH_COST ? 'wish' : 'jobs';
  return finale.endings.length === 4 ? 'done' : 'endings';
}
