// How every paper sheet of Santa's village is cut into a picture: the house and village boards, the hay hoist's pieces and
// the snowman's accessories. scripts/build-cabin-boards.mjs cuts them all ahead of time at two sizes (images/cabin/), so
// the page only downloads finished pictures instead of running the paper filter on every board while it opens. A sheet
// with no picture, or whose picture fails to load, is cut here in the browser exactly as before.
import { BOARDS, BOOK_SHEETS, HOIST, PX, SMOKE, SPOTS, WINCH, hayBale, hoistBracket, hoistCrank, hoistDrawer, hoistTag, hoistWheel, hoistWinch } from './cabin-art.js';
import { RIGS, VIEWPOINT, WORLD } from './cabin-world.js';
import { PLACES, WARDROBE } from './cabin-wardrobe.js';
import { paperFilter, shape } from './paper-art.js';
import { CUTS } from '../data/cabin-cuts.js';

// The hay hoist's loose parts (its winch, the crank that fits it and the repair tag) and the chimney's puff, cut finer
// than the boards: they are small and seen close.
export const PIECES = {
  smoke: SMOKE,
  'hoist-bracket': { w: .62, h: .34, px: 420, draw: hoistBracket },
  'hoist-wheel': { w: HOIST.radius * 2.3, h: HOIST.radius * 2.3, px: 420, draw: hoistWheel },
  'hoist-bale': { w: HOIST.bale[0], h: HOIST.bale[1], px: 420, draw: hayBale },
  'hoist-winch': { w: WINCH.plate[0], h: WINCH.plate[1], px: 640, draw: hoistWinch },
  'hoist-crank': { w: WINCH.crank[0], h: WINCH.crank[1], px: 640, draw: hoistCrank },
  'hoist-tag': { w: WINCH.tag[0], h: WINCH.tag[1], px: 640, draw: hoistTag },
  'hoist-drawer': { w: HOIST.drawer[0], h: HOIST.drawer[1], px: 640, draw: hoistDrawer, state: {} },
};
// An accessory is cut at the size of its place on the snowman; its drawing is in a 100-unit-wide box.
export function outfitBoard(item) {
  const { size: [w, h], box } = PLACES[item.place];
  return { w, h, px: 640, draw: ({ paper }, { width, height }) => item.draw(shape('g', { transform: `scale(${width / 100} ${height / box})` }, paper)) };
}
// The other looks a sheet can take, cut ahead too: the sign with one to four stars lit, the mailbox open, the sleigh
// loaded, the reindeer's
// trough eaten from (its gold showing, then taken), the snow at the snowman's feet dug, the barn's drawer pulled out (with
// the matchbox, then without), the coat gone from its peg while Santa is out, and the back wall open behind the bookcase.
const VARIANTS = { sign: [1, 2, 3, 4].map(stars => ({ stars })), mailbox: [{ open: true }], sleigh: [{ loaded: true }], trough: [{ eaten: true }, { eaten: true, taken: true }], 'snow-pile': [{ dug: true }], 'hoist-drawer': [{ open: true, matches: true }, { open: true, matches: false }], 'front-in': [{ coat: false }], back: [{ secret: true }], 'secret-tags': [{ mine: true }], 'secret-hats': [{ mine: true }] };
const SHEETS = [...[...BOARDS, ...WORLD].map(board => [board.id, board]), ...Object.entries(PIECES), ...BOOK_SHEETS.map(sheet => [sheet.id, sheet]), ...WARDROBE.map(item => [`outfit-${item.id}`, outfitBoard(item)])];
// Each sheet's look when the page opened: a game changes board.state later, and the picture only matches the first look.
const FIRST = new Map(SHEETS.map(([name, board]) => [name, JSON.stringify(board.state ?? null)]));
const variantName = (name, state) => JSON.stringify(state ?? null) === FIRST.get(name) ? name : `${name}--${Object.entries(state).map(([key, value]) => `${key}-${value}`).join('--')}`;
// Every picture there is (the boards, the hoist's pieces, the accessories, the bookcase's books): its file name, the board
// and the look it shows.
export const everyCut = () => SHEETS.flatMap(([name, board]) => [[name, board, board.state], ...(VARIANTS[name] ?? []).map(state => [variantName(name, state), board, state])]);

// The picture set for a screen, by how fine it shows the boards: a Retina or large desktop screen, an ordinary one, a phone.
export const cutSet = quality => quality >= .9 ? 'hi' : quality > .6 ? 'large' : 'small';

// The village was drawn coarse back when the browser cut every board on each visit; as ready pictures its boards are cut as
// fine as they show on a large screen: SHARP pixels per metre at the nearest place they are seen from (where the visitor
// stands outside, or a corner of the yard), at most four times their own art. The house and the yard keep their own
// fineness, unless a board asks for more itself (`detail`: the hearth, seen up close). No picture is cut wider or taller than 4096 pixels, the most every graphics card takes. The drawing itself
// does not change, only how finely it is cut.
const SHARP = 2000, LIMIT = 4096;
const EYES = [[VIEWPOINT.x, VIEWPOINT.z], ...SPOTS.map(({ view: { target, distance, pitch, yaw } }) => [target[0] + Math.sin(yaw) * Math.cos(pitch) * distance, target[2] + Math.cos(yaw) * Math.cos(pitch) * distance])];
function detail(board) {
  if (board.detail) return board.detail;
  if (!WORLD.includes(board)) return 1;
  const at = board.rig ? RIGS[board.rig].at : board.at;
  if (!at) return 1;
  const places = board.copies ? board.copies.map(([x, z]) => [x, z]) : [[at[0], at[2]]], px = board.px ?? PX;
  const near = Math.max(1, Math.min(...EYES.flatMap(([ex, ez]) => places.map(([x, z]) => Math.hypot(x - ex, z - ez)))));
  return Math.min(4, Math.max(1, SHARP / near / px));
}

// A board drawn as SVG at `quality` of its full size; nothing in it animates afterwards. Distant scenery is drawn at fewer
// art units per metre; room surfaces are cut a little coarser to save memory.
export function boardSvg(board, quality, state = board.state) {
  const px = board.px ?? PX, width = Math.round(board.w * px), height = Math.round(board.h * px);
  const scale = Math.min(quality * (board.kind === 'wall' || board.kind === 'floor' ? .7 : 1) * detail(board), LIMIT / Math.max(width, height));
  const svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width: Math.round(width * scale), height: Math.round(height * scale) });
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
