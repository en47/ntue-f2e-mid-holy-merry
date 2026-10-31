// Intro's paper-cut book. Same rough-cut paper as Home and Game; every sheet is one image.
import { paperLayer, shape } from './paper-art.js';
import { SNOW, holly, pine, roofHouse, star } from './paper-props.js';
import { STORY_BOX, storyGlyphs } from '../data/story-glyphs.js';

const BOARD = '#3f6655', BOARD_EDGE = '#2f5244', GOLD = '#d9b36a', CREAM = '#fbf3e3';
const stitched = (parent, x, y, width, height, rx = 12) => shape('rect', { x, y, width, height, rx, fill: 'none', stroke: GOLD, 'stroke-width': 3, 'stroke-dasharray': '11 8' }, parent);

function coverFace(parent) {
  shape('rect', { x: 8, y: 8, width: 584, height: 584, rx: 18, fill: BOARD }, parent);
  shape('rect', { x: 8, y: 8, width: 26, height: 584, rx: 10, fill: BOARD_EDGE }, parent);
  stitched(parent, 46, 28, 526, 544);
  // A snowy night through a paper window, under the title plaque.
  shape('path', { d: 'M78 560V360C78 330 100 320 130 320H470C500 320 522 330 522 360V560Z', fill: '#34506c' }, parent);
  for (const [x, y, size] of [[140, 372, 8], [468, 366, 10], [300, 352, 6], [214, 400, 5], [398, 402, 6]]) star(parent, x, y, size, '#efd08a');
  shape('path', { d: 'M78 560V470C150 430 220 456 300 448S450 424 522 462V560Z', fill: '#dbe7ec' }, parent);
  pine(parent, 132, 506, 96, '#5f8a70'); pine(parent, 470, 508, 110, '#4f7a65');
  roofHouse(parent, 300, 512, 112, 66, { roof: '#a8564c' });
  shape('path', { d: 'M78 560V516C170 486 260 522 340 510S470 496 522 516V560Z', fill: SNOW }, parent);
  // Title plaque.
  shape('path', { d: 'M108 74C200 56 400 56 492 74 526 84 536 120 530 180 534 240 526 290 492 306 400 322 200 322 108 306 74 290 66 240 70 180 64 120 74 84 108 74Z', fill: CREAM }, parent);
  shape('rect', { x: 86, y: 84, width: 428, height: 212, rx: 26, fill: 'none', stroke: '#c9a877', 'stroke-width': 2.5, 'stroke-dasharray': '8 7' }, parent);
  holly(parent, 104, 78, .78); holly(parent, 496, 78, .78); star(parent, 300, 58, 26);
}

// The inside of the cover, seen as the left page lands: board edge only, the page sits on top.
function coverInside(parent) {
  shape('rect', { x: 6, y: 6, width: 588, height: 588, rx: 16, fill: BOARD }, parent);
}

function board(parent) {
  shape('rect', { x: 8, y: 8, width: 1184, height: 584, rx: 16, fill: BOARD_EDGE, transform: 'translate(0 8)' }, parent);
  shape('rect', { x: 8, y: 8, width: 1184, height: 584, rx: 16, fill: BOARD }, parent);
}

function pageCorners(parent) {
  holly(parent, 548, 46, .5);
  star(parent, 40, 560, 9);
  shape('path', { d: 'M62 562H150', stroke: '#d9c5a2', 'stroke-width': 2, 'stroke-dasharray': '7 6', fill: 'none' }, parent);
}

export function tagArt(fill, edge) {
  const body = 'M18 12C70 8 170 8 222 12 232 13 236 18 235 28 233 40 233 50 235 62 236 72 232 77 222 78 170 82 70 82 18 78 8 77 4 72 5 62 7 50 7 40 5 28 4 18 8 13 18 12Z';
  return parent => {
    shape('path', { d: body, fill: edge, transform: 'translate(0 5)' }, parent);
    shape('path', { d: body, fill }, parent);
    shape('rect', { x: 14, y: 19, width: 212, height: 52, rx: 12, fill: 'none', stroke: '#fff3dc', 'stroke-opacity': .55, 'stroke-width': 2, 'stroke-dasharray': '7 6' }, parent);
  };
}

export function mountBookArt(root) {
  const flat = { paper: { scale: .9, grain: .5, shadow: .24 }, eager: true };
  const bookEl = root.querySelector('.intro-book');
  const boardLayer = paperLayer(bookEl, '0 0 1200 600', 'intro-book-board', board, { ...flat, preserveAspectRatio: 'none' });
  bookEl.prepend(boardLayer);
  const front = root.querySelector('[data-book="cover-front"]');
  paperLayer(front, '0 0 600 600', 'intro-cover-art', coverFace, { ...flat, preserveAspectRatio: 'xMidYMid slice' });
  const title = document.createElement('span');
  title.className = 'intro-cover-title';
  front.append(title);
  const paper = { scale: 1.8, grain: .4, shadow: .18, rim: '#fff7e8' }, palette = ['#a84a42', '#b5604a', '#4f7d68', '#a84a42', '#c08a3e'];
  storyGlyphs.forEach(({ d, pivot }, index) => {
    const letter = paperLayer(title, STORY_BOX, 'title-letter', parent => shape('path', { d, fill: palette[index % 5] }, parent), { paper, origin: pivot, eager: true });
    letter.style.animationDelay = `${-(index * 1.37) % 3.4}s`;
  });
  paperLayer(root.querySelector('[data-book="cover-inside"]'), '0 0 600 600', 'intro-cover-inside-art', coverInside, { ...flat, preserveAspectRatio: 'none' });
  const tags = [['prev', '#a84a42', '#853a34'], ['next', '#4a7560', '#3a5e4d'], ['gift', '#b98a45', '#8f6a33']];
  for (const [id, fill, edge] of tags) paperLayer(root.querySelector(`[data-book="${id}"]`), '0 0 240 90', 'tag-art', tagArt(fill, edge), { paper: { scale: .7, grain: .45, shadow: .24 }, eager: true, preserveAspectRatio: 'none' });
}

// Pages carry their own corner art so the turning leaf, a clone, looks the same.
export function decoratePage(copy) {
  paperLayer(copy, '0 0 600 600', 'intro-page-art', pageCorners, { paper: { scale: .8, grain: .3, shadow: .14 }, eager: true, preserveAspectRatio: 'xMidYMid meet' });
}
