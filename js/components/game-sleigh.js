// Decorative paper-cut sleigh for Game 01, built like the Game 02 wreath.
import { paperLayer, shape } from './paper-art.js';

const RED = '#b5322e', RED_DARK = '#962825', GOLD = '#d8a341', CREAM = '#f7efe0', FUR = '#ad7a55', FUR_DARK = '#8b5e41', SKIN = '#f2c9a8';

const BOX = '0 0 500 330', PAPER = { grain: .7 };

function group(parent, className) {
  const element = document.createElement('div');
  element.className = `art-layer ${className}`;
  parent.append(element);
  return element;
}

function leg(deer, d, fill, origin, phase) {
  const layer = paperLayer(deer, BOX, `sleigh-leg sleigh-leg-${phase}`, parent => shape('path', { d, fill }, parent), { paper: PAPER, origin });
  return layer;
}

function deerBody(parent) {
  shape('path', { d: 'M316 176C340 156 392 158 424 170 440 176 444 214 424 224 386 240 340 238 318 224 302 214 302 188 316 176Z', fill: FUR }, parent);
  shape('path', { d: 'M316 176C302 172 296 182 304 192 312 196 318 190 320 182Z', fill: CREAM }, parent);
  shape('path', { d: 'M412 178C418 160 424 148 432 138L458 154C454 170 448 186 436 198Z', fill: FUR }, parent);
  const head = shape('g', { transform: 'translate(-8 26)' }, parent);
  shape('path', { d: 'M434 96C454 88 478 96 482 112 486 128 466 136 448 134 430 134 420 110 434 96Z', fill: FUR }, head);
  shape('circle', { cx: 484, cy: 116, r: 7.5, fill: RED }, head);
  shape('circle', { cx: 456, cy: 106, r: 3.6, fill: '#3b2a22' }, head);
  shape('path', { d: 'M432 100C420 96 412 104 416 112 424 112 432 110 436 106Z', fill: FUR_DARK }, head);
  shape('path', { d: 'M446 92C444 72 434 60 420 54M440 76C430 74 424 76 416 82M446 92C452 74 464 62 476 56M456 76C466 72 472 72 482 76', stroke: FUR_DARK, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, head);
  shape('path', { d: 'M412 180C424 186 440 190 454 186', stroke: RED, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('circle', { cx: 434, cy: 198, r: 7, fill: GOLD }, parent);
}

function reindeer(root) {
  const deer = group(root, 'sleigh-deer');
  leg(deer, 'M346 214C342 238 334 254 322 272L338 276C352 258 364 240 368 218Z', FUR_DARK, [356, 216], 'b');
  leg(deer, 'M412 208C424 228 436 242 452 252L460 238C446 228 436 212 430 198Z', FUR_DARK, [420, 204], 'a');
  leg(deer, 'M322 214C312 228 298 244 280 250L288 264C308 258 326 242 340 226Z', FUR, [332, 220], 'a');
  leg(deer, 'M398 214C400 238 396 258 388 278L404 282C414 262 420 238 420 214Z', FUR, [408, 214], 'b');
  paperLayer(deer, BOX, '', deerBody, { paper: PAPER });
}

function sack(parent) {
  shape('path', { d: 'M60 170C44 138 60 96 96 92 132 90 152 124 150 170Z', fill: '#c9a77b' }, parent);
  shape('path', { d: 'M96 92C92 84 96 76 104 78 112 80 112 88 106 94Z', fill: GOLD }, parent);
}

function santaFigure(parent) {
  const santa = shape('g', { transform: 'translate(0 -14)' }, parent);
  shape('path', { d: 'M128 196C124 150 140 124 176 122 212 122 228 150 226 196Z', fill: RED }, santa);
  shape('path', { d: 'M136 98C138 66 168 48 196 60 214 66 222 76 226 90L136 104Z', fill: RED }, santa);
  shape('path', { d: 'M140 76C128 74 116 80 110 92', stroke: RED, 'stroke-width': 18, 'stroke-linecap': 'round', fill: 'none' }, santa);
  shape('circle', { cx: 106, cy: 100, r: 12, fill: CREAM }, santa);
  shape('circle', { cx: 182, cy: 106, r: 27, fill: SKIN }, santa);
  shape('path', { d: 'M148 112C150 150 172 168 188 170 206 168 220 146 218 112 208 124 200 122 192 118 182 124 172 122 164 118 158 122 152 120 148 112Z', fill: CREAM }, santa);
  shape('path', { d: 'M132 102C160 86 200 84 228 96 232 106 226 112 218 110 190 102 164 104 142 114 132 116 128 108 132 102Z', fill: CREAM }, santa);
  shape('circle', { cx: 190, cy: 106, r: 2.8, fill: '#3b2a22' }, santa);
  shape('circle', { cx: 212, cy: 106, r: 2.8, fill: '#3b2a22' }, santa);
  shape('circle', { cx: 204, cy: 116, r: 6, fill: '#e29a84' }, santa);
}

function hull(parent) {
  shape('path', { d: 'M40 170C30 150 30 130 44 124 56 122 62 134 58 146 90 160 200 166 266 168 286 168 296 156 304 150 314 156 312 182 300 200 280 232 230 242 160 240 110 238 60 214 40 170Z', fill: RED }, parent);
  shape('path', { d: 'M56 174C100 188 210 194 292 182', stroke: GOLD, 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('path', { d: 'M92 238V262M222 238V262', stroke: GOLD, 'stroke-width': 8, fill: 'none' }, parent);
  shape('path', { d: 'M28 246C22 262 40 268 64 268H262C292 268 312 256 322 236', stroke: GOLD, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, parent);
  shape('path', { d: 'M196 136C218 136 244 146 262 158L254 176C234 170 212 164 192 158Z', fill: RED_DARK }, parent);
  shape('circle', { cx: 262, cy: 166, r: 11, fill: '#8b5e41' }, parent);
}

export function mountSleigh(slot) {
  if (!slot) return;
  const root = document.createElement('div');
  root.className = 'game-sleigh';
  reindeer(root);
  const ride = group(root, 'sleigh-ride');
  paperLayer(ride, BOX, '', sack, { paper: PAPER });
  paperLayer(ride, BOX, 'sleigh-santa', santaFigure, { paper: PAPER, origin: [176, 182] });
  paperLayer(ride, BOX, '', hull, { paper: PAPER });
  paperLayer(root, BOX, 'sleigh-reins', parent => shape('path', { d: 'M266 164C310 196 376 212 432 192', stroke: '#8f5f3d', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, parent), { paper: null });
  slot.append(root);
}
