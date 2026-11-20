// The advent house on the window sill in Santa's room (cabin-advent.js draws it): a window for each of December's first
// twenty-four days. As many are open as days of December so far: none in November (it says when it opens), all of them
// from Christmas on and the rest of the year. The windows opened are kept in the save (cabin-progress.js `advent`).
export const DAYS = 24;
export const daysOpen = date => date.getMonth() === 11 ? Math.min(date.getDate(), DAYS) : date.getMonth() === 10 ? 0 : DAYS;
// Today, by this computer's calendar. On a preview server on this computer (localhost, 127.0.0.1), `?today=12-18` stands
// in for another day, to try a December day ahead of time; anywhere else the page always goes by the real date.
export function today(where = globalThis.location) {
  const now = new Date(), asked = /^(localhost|127\.0\.0\.1)$/.test(where?.hostname ?? '') ? new URLSearchParams(where.search).get('today') : null;
  const [, month, day] = /^(\d{1,2})-(\d{1,2})$/.exec(asked ?? '') ?? [];
  return month ? new Date(now.getFullYear(), Number(month) - 1, Number(day), 12) : now;
}
// Days opened, as saved: each a day of the twenty-four, once, in order.
export const readOpened = saved => Array.isArray(saved) ? [...new Set(saved.filter(day => Number.isInteger(day) && day >= 1 && day <= DAYS))].sort((a, b) => a - b) : [];
