// Muted paper-cut signposts for the Games hero. Text stays in HTML above the boards.
import { holly, paperFilter, rasterize, shape } from './paper-art.js';

const WOOD = '#bb9c7d', GRAIN = '#9a7c61', PLATE = '#f6eddc', SNOW = '#fbf8f1', SHADE = '#d9e5ea';
const TITLE_BOX = '0 0 1120 724', NAV_BOX = '0 0 1052 724';

function snowcap(parent, d) {
  shape('path', { d, fill: SHADE, transform: 'translate(0 10)' }, parent);
  shape('path', { d, fill: SNOW }, parent);
}

function lines(parent, d) {
  shape('path', { d, stroke: GRAIN, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-opacity': .55, fill: 'none' }, parent);
}

function mound(parent, d) {
  shape('path', { d, fill: SHADE, transform: 'translate(0 8)' }, parent);
  shape('path', { d, fill: SNOW }, parent);
}

function titleBase(svg) {
  const paper = shape('g', { filter: paperFilter(svg, 'sign-title-base', { scale: 1.7, shadow: .22 }) }, svg);
  shape('path', { d: 'M520 470H618L624 640H514Z', fill: GRAIN }, paper);
  lines(paper, 'M548 500V610M586 505V620');
  mound(paper, 'M96 672C120 620 210 616 280 632 340 590 450 612 500 628 570 596 690 600 740 636 800 626 850 646 860 676 620 696 300 694 96 672Z');
}

function titleBoard(svg) {
  const paper = shape('g', { filter: paperFilter(svg, 'sign-title-board', { scale: 1.7, shadow: .26 }) }, svg);
  shape('path', { d: 'M168 132C320 112 470 128 620 122S900 112 1010 130C1048 138 1056 176 1052 230 1048 300 1060 380 1050 450 1044 490 1012 502 960 502 780 510 420 498 200 504 160 504 140 480 142 440 148 350 136 250 140 180 142 150 148 136 168 132Z', fill: WOOD }, paper);
  lines(paper, 'M160 240H176M158 340H178M1022 250H1042M1020 360H1042M300 482H420M640 484H820');
  shape('path', { d: 'M214 176C380 160 560 178 720 170S930 164 984 178C1006 186 1010 220 1006 270 1002 330 1012 390 1004 430 1000 452 980 458 930 458 760 464 420 454 226 460 198 460 188 440 190 410 196 340 184 260 188 210 190 186 196 178 214 176Z', fill: PLATE }, paper);
  snowcap(paper, 'M132 168C120 120 170 92 230 100 300 70 380 110 450 100S590 84 660 104 800 78 880 98 1010 84 1060 124C1084 146 1076 196 1058 200 1036 204 1040 160 1010 158 960 156 950 190 910 184 860 178 860 146 800 148 730 150 730 176 680 176 630 176 620 148 560 150 490 152 480 172 430 170 370 168 370 146 310 150 260 154 250 186 210 180 176 174 186 150 160 156 144 160 138 176 132 168Z');
  holly(paper, 196, 138, 2);
}

const ARROW = 'M170 120C340 104 560 124 760 112L860 110C900 110 950 190 982 226 950 262 900 342 860 340 640 350 400 332 180 344 150 344 142 318 146 280 150 240 140 180 146 146 148 128 156 122 170 120Z';
const ARROW_PLATE = 'M206 156C380 142 560 160 750 150L842 148C872 150 910 200 936 226 910 252 872 302 842 304 640 312 400 296 214 308 190 308 184 288 186 260 190 230 180 196 186 172 188 160 194 158 206 156Z';
const ARROW_SNOW = 'M136 148C126 104 176 84 240 92 310 66 390 102 470 92S610 76 690 94 800 72 860 88C900 92 920 122 930 140 936 164 918 170 906 158 890 142 880 170 840 164 790 158 790 136 730 138 670 140 670 164 610 164 550 164 550 140 490 142 430 144 430 164 370 160 320 156 320 136 262 142 210 148 216 176 180 166 156 160 160 150 136 148Z';

function arrowBoard(svg, id, transform, sprig) {
  const paper = shape('g', { filter: paperFilter(svg, id, { scale: 1.7, shadow: .26 }) }, svg);
  const board = shape('g', { transform }, paper);
  shape('path', { d: ARROW, fill: WOOD }, board);
  lines(board, 'M158 230H174M160 290H176M300 326H440M620 330H780');
  shape('path', { d: ARROW_PLATE, fill: PLATE }, board);
  snowcap(board, ARROW_SNOW);
  holly(board, ...sprig);
}

function navBase(svg) {
  const paper = shape('g', { filter: paperFilter(svg, 'sign-nav-base', { scale: 1.7, shadow: .22 }) }, svg);
  shape('path', { d: 'M500 46H596L606 640H492Z', fill: GRAIN }, paper);
  lines(paper, 'M530 70V620M566 80V630');
  shape('path', { d: 'M486 62C482 22 530 10 550 12 590 10 616 30 610 62 580 54 520 54 486 62Z', fill: SNOW }, paper);
  mound(paper, 'M150 672C180 626 270 620 340 636 410 600 520 612 570 630 640 604 760 610 810 640 870 630 930 650 944 676 720 696 380 694 150 672Z');
}

const PARTS = {
  'title-base': [TITLE_BOX, titleBase],
  'title-board': [TITLE_BOX, titleBoard],
  'nav-base': [NAV_BOX, navBase],
  'nav-top': [NAV_BOX, svg => arrowBoard(svg, 'sign-nav-top', 'translate(0 -4)', [192, 122, 1.8])],
  'nav-bottom': [NAV_BOX, svg => arrowBoard(svg, 'sign-nav-bottom', 'translate(10 296) scale(.97 .82)', [846, 112, 1.9])],
};

export function mountHeroSigns(root) {
  for (const slot of root.querySelectorAll('[data-sign]')) {
    const [viewBox, draw] = PARTS[slot.dataset.sign];
    const svg = shape('svg', { viewBox });
    draw(svg);
    const image = rasterize(svg);
    image.className = 'sign-art';
    slot.append(image);
  }
}
