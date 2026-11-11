// The visitor's pocket, as plain rules (cabin-bag.js in components draws it). Each thing in the village is picked up once.
// A tool (the magnifier, the brass pin) stays in the pocket however often it is used; a thing used up (the lichen, the
// matches, the blank slip) is gone once it has done its job; a part (the key, the handle, the big gear) is left where it
// fits, and can be seen there. Something used on the wrong thing comes straight back: only a use that works spends it.
export const ITEMS = { lichen: 'spent', key: 'fitted', handle: 'fitted', matches: 'spent', magnifier: 'tool', pin: 'tool', slip: 'spent', gear: 'fitted' };
export const ITEM_IDS = Object.keys(ITEMS);
export const emptyBag = () => ({ held: [], used: [] });
const ids = list => Array.isArray(list) ? [...new Set(list.filter(id => ITEM_IDS.includes(id)))] : [];
// A saved pocket is kept as far as it makes sense: known things once each, nothing both held and used, a tool never used up.
export function readBag(saved) {
  const used = ids(saved?.used).filter(id => ITEMS[id] !== 'tool'), held = [...new Set([...ids(saved?.held).filter(id => !used.includes(id)), ...ids(saved?.used).filter(id => ITEMS[id] === 'tool')])];
  return { held, used };
}
export const holds = (bag, id) => bag.held.includes(id);
export const ever = (bag, id) => holds(bag, id) || bag.used.includes(id);
// Picked up: true the first time only.
export function take(bag, id) { if (!ITEMS[id] || ever(bag, id)) return false; bag.held.push(id); return true; }
// Used where it works: a tool stays ('tool'); anything else leaves the pocket for good ('spent' or 'fitted'). False when it
// is not in the pocket.
export function spend(bag, id) {
  if (!holds(bag, id)) return false;
  if (ITEMS[id] !== 'tool') { bag.held = bag.held.filter(each => each !== id); bag.used.push(id); }
  return ITEMS[id];
}
