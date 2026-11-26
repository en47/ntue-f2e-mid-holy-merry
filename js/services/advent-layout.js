// The twenty-four drawers of the Advent House (components/vending-advent.js): six columns by six rows, some drawers a
// cell, some two cells wide or tall, and the 24th, the biggest, two by two at the bottom in the middle. Pure data and
// functions, tested in tests/advent-layout.test.mjs.
export const GRID = [
  ' 1  1  2  3  4  4',
  ' 5  6  7  7  8  9',
  '10  6 11 12  8 13',
  '14 15 16 16 17 18',
  '14 19 24 24 20 18',
  '21 22 24 24 23 23',
].map(row => row.trim().split(/\s+/).map(Number));
export const COLUMNS = 6, ROWS = 6, DAYS = 24;

// Each drawer's paper: red, pine green, cream or kraft (no two that touch alike), and what is printed round its number.
export const TONES = { 1: 'red', 2: 'cream', 3: 'green', 4: 'cream', 5: 'green', 6: 'cream', 7: 'red', 8: 'green', 9: 'red', 10: 'red', 11: 'green', 12: 'cream', 13: 'cream', 14: 'cream', 15: 'red', 16: 'kraft', 17: 'red', 18: 'green', 19: 'green', 20: 'cream', 21: 'red', 22: 'kraft', 23: 'kraft', 24: 'crown' };
export const MOTIFS = { 1: 'flakes', 4: 'laurel', 6: 'tree', 7: 'flakes', 8: 'star', 13: 'tree', 14: 'bell', 16: 'stars', 17: 'laurel', 18: 'laurel', 20: 'holly', 23: 'flakes', 24: 'wreath' };

// Where each day's drawer is: its first column and row, and how many of each it spans.
export function drawers(grid = GRID) {
  const found = new Map();
  grid.forEach((row, r) => row.forEach((day, c) => {
    const box = found.get(day);
    if (!box) found.set(day, { day, col: c, row: r, cols: 1, rows: 1 });
    else { box.cols = Math.max(box.cols, c - box.col + 1); box.rows = Math.max(box.rows, r - box.row + 1); box.col = Math.min(box.col, c); }
  }));
  return [...found.values()].sort((a, b) => a.day - b.day).map(box => ({ ...box, tone: TONES[box.day], motif: MOTIFS[box.day] ?? null }));
}

// True when every cell a drawer claims is its own, and it claims a whole rectangle.
export const whole = (box, grid = GRID) => {
  let cells = 0;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) if (grid[r][c] === box.day) { cells++; if (r < box.row || r >= box.row + box.rows || c < box.col || c >= box.col + box.cols) return false; }
  return cells === box.cols * box.rows;
};

// Drawers that share an edge.
export function neighbours(grid = GRID) {
  const pairs = new Set();
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
    const a = grid[r][c], b = grid[r + dr]?.[c + dc];
    if (b !== undefined && a !== b) pairs.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  }
  return [...pairs].map(pair => pair.split('-').map(Number));
}
