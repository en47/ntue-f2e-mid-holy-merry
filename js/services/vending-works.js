// The coloring workshop's works, kept in this browser (localStorage): a list, newest first, so the same thing may be
// coloured as often as one likes, each its own work: which thing, every part's colour, the stickers on its sheet, whether
// it was finished, and when it was last touched. A missing, broken or out-of-date entry is simply left out; at most
// MOST_WORKS are kept (the oldest going first). The first save of an earlier version (one sheet per thing, on simpler
// drawings) is not read and not touched. Pure, so tests/vending-works.test.mjs can check it in Node.
export const WORKS_KEY = 'holy-merry:vending:works:v2', BLANK = '#fbf3e1', STICKERS = ['star', 'flake', 'holly'], MOST = 12, MOST_WORKS = 24;
const colour = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const sticker = value => Array.isArray(value) && value.length === 4 && STICKERS.includes(value[0]) && value.slice(1).every(Number.isFinite) && value[1] >= 0 && value[1] <= 300 && value[2] >= 0 && value[2] <= 360;
const named = value => typeof value === 'string' && /^[a-z0-9-]{1,40}$/.test(value);

// One work checked against its page's number of parts (`pages`: { thing: parts }); null if it does not fit.
export function clean(work, pages) {
  if (!work || typeof work !== 'object' || !named(work.key) || !Object.hasOwn(pages, work.item)) return null;
  if (!Array.isArray(work.fills) || work.fills.length !== pages[work.item] || !work.fills.every(colour)) return null;
  const stickers = Array.isArray(work.stickers) ? work.stickers.filter(sticker).slice(0, MOST) : [];
  return { key: work.key, item: work.item, fills: work.fills.map(fill => fill.toLowerCase()), stickers, finished: work.finished === true, at: Number.isFinite(work.at) ? work.at : 0 };
}
// Every work that is still good, newest first, each key once, at most MOST_WORKS.
export function readWorks(storage, pages) {
  let saved = [];
  try { saved = JSON.parse(storage?.getItem(WORKS_KEY) ?? '[]'); } catch { saved = []; }
  const seen = new Set(), works = [];
  for (const work of Array.isArray(saved) ? saved : []) { const good = clean(work, pages); if (good && !seen.has(good.key)) { seen.add(good.key); works.push(good); } }
  return works.sort((a, b) => b.at - a.at).slice(0, MOST_WORKS);
}
// Kept for next time; false if the browser would not keep it (it still holds for this visit).
export function writeWorks(storage, works) {
  try { storage.setItem(WORKS_KEY, JSON.stringify(works)); return true; } catch { return false; }
}
// A new work's name: when it was begun and a little chance, in letters and digits.
export const newKey = (now = Date.now(), chance = Math.random()) => `${now.toString(36)}-${Math.floor(chance * 1e6).toString(36)}`;
// The list with `work` in it (in its old place's stead, or new), newest first, the oldest let go past `most`.
export const keepWork = (works, work, most = MOST_WORKS) => [work, ...works.filter(each => each.key !== work.key)].sort((a, b) => b.at - a.at).slice(0, most);
// The list without the work called `key`.
export const dropWork = (works, key) => works.filter(each => each.key !== key);
// Whether a sheet has anything on it.
export const touched = work => Boolean(work && (work.fills.some(fill => fill !== BLANK) || work.stickers.length));
// A ready-made colouring: the drawing's own colours (`colours`, one per part) put through one of the swatch cards. The
// classic card keeps them; the others trade each for one of their own crayons.
export const PRESETS = {
  classic: {},
  snowy: { '#b03f37': '#9fbdd2', '#3f6653': '#4a5f80', '#e2b65a': '#fbfaf5', '#b97c4a': '#9db59a', '#e2aaa3': '#f4ead3', '#7a5238': '#4a5f80' },
  candy: { '#3f6653': '#9db59a', '#b03f37': '#e2aaa3', '#7a5238': '#b97c4a', '#4a5f80': '#9fbdd2', '#4a4245': '#b03f37' },
};
export const presetFills = (colours, preset) => colours.map(fill => PRESETS[preset]?.[fill] ?? fill);
