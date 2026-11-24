// The craft booth's works, kept in this browser (localStorage) so each little thing keeps its own colours: every part's
// colour, the stickers on its sheet, and whether it was finished. A missing, broken or out-of-date entry is simply left out
// (that thing starts blank again); nothing else is touched. Pure, so tests/vending-works.test.mjs can check it in Node.
export const WORKS_KEY = 'holy-merry:vending:works', BLANK = '#fbf3e1', STICKERS = ['star', 'flake', 'holly'], MOST = 12;
const colour = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const sticker = value => Array.isArray(value) && value.length === 4 && STICKERS.includes(value[0]) && value.slice(1).every(Number.isFinite) && value[1] >= 0 && value[1] <= 300 && value[2] >= 0 && value[2] <= 360;

// One work checked against its drawing's number of parts; null if it does not fit.
export function clean(work, parts) {
  if (!work || typeof work !== 'object' || !Array.isArray(work.fills) || work.fills.length !== parts || !work.fills.every(colour)) return null;
  const stickers = Array.isArray(work.stickers) ? work.stickers.filter(sticker).slice(0, MOST) : [];
  return { fills: work.fills.map(fill => fill.toLowerCase()), stickers, finished: work.finished === true, at: Number.isFinite(work.at) ? work.at : 0 };
}
// Every work that is still good, for drawings { id: parts }.
export function readWorks(storage, drawings) {
  let saved = {};
  try { saved = JSON.parse(storage?.getItem(WORKS_KEY) ?? '{}') ?? {}; } catch { saved = {}; }
  const works = {};
  for (const [id, parts] of Object.entries(drawings)) { const work = clean(saved[id], parts); if (work) works[id] = work; }
  return works;
}
// Kept for next time; false if the browser would not keep it (it still holds for this visit).
export function writeWorks(storage, works) {
  try { storage.setItem(WORKS_KEY, JSON.stringify(works)); return true; } catch { return false; }
}
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
