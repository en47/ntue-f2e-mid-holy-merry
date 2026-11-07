// What a visitor has done in Santa's yard, kept in this browser only and never sent anywhere. One versioned record, so a
// Christmas passport or the cabin's story can later read the same place. Every function takes the storage, so tests pass a stand-in.
const KEY = 'holy-merry:cabin:v1';
export const PLACES = ['head', 'neck', 'face', 'hand'];
// The snowman as he was built: only a carrot nose.
export const DEFAULT_OUTFIT = Object.freeze({ head: null, neck: null, face: 'carrot', hand: null });
const blank = () => ({ outfit: { ...DEFAULT_OUTFIT }, combos: [] });

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
  return progress;
}
// Returns false when the browser will not keep it (private mode, full storage); the yard still plays for this visit.
export function writeProgress(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
export const dressed = outfit => PLACES.every(place => outfit[place]);
