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
