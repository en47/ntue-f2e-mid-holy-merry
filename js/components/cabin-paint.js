// How every paper sheet of Santa's village is cut into a picture: the house and village boards, the hay hoist's pieces and
// the snowman's accessories. scripts/build-cabin-boards.mjs cuts them all ahead of time at two sizes (images/cabin/), so
// the page only downloads finished pictures instead of running the paper filter on every board while it opens. A sheet
// with no picture, or whose picture fails to load, is cut here in the browser exactly as before.
import { BOARDS, HOIST, PX, SMOKE, hayBale, hoistBracket, hoistHatch, hoistToggle, hoistWheel } from './cabin-art.js';
import { WORLD } from './cabin-world.js';
import { PLACES, WARDROBE } from './cabin-wardrobe.js';
import { paperFilter, shape } from './paper-art.js';
import { CUTS } from '../data/cabin-cuts.js';

// The hay hoist's loose parts and the chimney's puff, cut finer than the boards: they are small and seen close.
export const PIECES = {
  smoke: SMOKE,
  'hoist-bracket': { w: .62, h: .34, px: 420, draw: hoistBracket },
  'hoist-wheel': { w: HOIST.radius * 2.3, h: HOIST.radius * 2.3, px: 420, draw: hoistWheel },
  'hoist-bale': { w: HOIST.bale[0], h: HOIST.bale[1], px: 420, draw: hayBale },
  'hoist-toggle': { w: HOIST.toggle[0], h: HOIST.toggle[1], px: 420, draw: hoistToggle },
  'hoist-hatch': { w: HOIST.hatch[0], h: HOIST.hatch[1], px: 420, draw: hoistHatch, state: {} },
};
// An accessory is cut at the size of its place on the snowman; its drawing is in a 100-unit-wide box.
export function outfitBoard(item) {
  const { size: [w, h], box } = PLACES[item.place];
  return { w, h, px: 640, draw: ({ paper }, { width, height }) => item.draw(shape('g', { transform: `scale(${width / 100} ${height / box})` }, paper)) };
}
// The other looks a sheet can take, cut ahead too: the sign with one to four stars lit, the mailbox and the hatch open.
const VARIANTS = { sign: [1, 2, 3, 4].map(stars => ({ stars })), mailbox: [{ open: true }], 'hoist-hatch': [{ open: true }] };
const SHEETS = [...[...BOARDS, ...WORLD].map(board => [board.id, board]), ...Object.entries(PIECES), ...WARDROBE.map(item => [`outfit-${item.id}`, outfitBoard(item)])];
// Each sheet's look when the page opened: a game changes board.state later, and the picture only matches the first look.
const FIRST = new Map(SHEETS.map(([name, board]) => [name, JSON.stringify(board.state ?? null)]));
const variantName = (name, state) => JSON.stringify(state ?? null) === FIRST.get(name) ? name : `${name}--${Object.entries(state).map(([key, value]) => `${key}-${value}`).join('--')}`;
// Every picture there is: its file name, the board and the look it shows.
export const everyCut = () => SHEETS.flatMap(([name, board]) => [[name, board, board.state], ...(VARIANTS[name] ?? []).map(state => [variantName(name, state), board, state])]);

// The picture set for a screen: the finer one wherever boards are drawn large enough to show the difference.
export const cutSet = quality => quality > .6 ? 'large' : 'small';

// A board drawn as SVG at `quality` of its full size; nothing in it animates afterwards. Distant scenery is drawn at fewer
// art units per metre; room surfaces are cut a little coarser to save memory.
export function boardSvg(board, quality, state = board.state) {
  const px = board.px ?? PX, width = Math.round(board.w * px), height = Math.round(board.h * px), density = board.kind === 'wall' || board.kind === 'floor' ? .7 : 1;
  const svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width: Math.round(width * quality * density), height: Math.round(height * quality * density) });
  const plain = shape('g', {}, svg);
  const paper = shape('g', { filter: paperFilter(svg, 'cabin-paper', { scale: board.kind === 'scenery' ? .8 : board.kind ? 1.6 : 1.1, grain: .5, shadow: 0 }) }, svg);
  board.draw({ plain, paper, svg }, { width, height }, state);
  return svg;
}
export const boardMarkup = (board, quality, state) => new XMLSerializer().serializeToString(boardSvg(board, quality, state));

async function load(source) { const image = new Image(); image.src = source; await image.decode(); return image; }
// Cut in the browser: the slow way, kept for any sheet without a picture.
export const paintBoard = (board, quality, state) => load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(boardMarkup(board, quality, state))}`);
// The sheet called `name` in the look `state`, as an image: the ready picture when there is one, otherwise cut here.
export async function cutBoard(name, board, set, state = board.state) {
  const file = variantName(name, state), version = CUTS.sheets[file];
  if (version) {
    try { return await load(new URL(`../../images/cabin/${set}/${file}.webp?v=${version}`, import.meta.url).href); }
    catch (error) { console.warn('Cabin picture failed, cutting it here instead', file, error); }
  }
  return paintBoard(board, CUTS.sets[set], state);
}
