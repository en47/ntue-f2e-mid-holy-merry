// Paper frames around the two games. Everything sits outside the iframes and never takes a click.
import { holly, paperLayer, shape } from './paper-art.js';
import { SHADE, SNOW, star } from './paper-props.js';

const PAPER = { scale: .9, grain: .45, shadow: .22 }, RED = '#a84a42', GOLD = '#d9b36a', ROPE = '#a9845b';
const CAP = 'M6 78C34 44 96 30 190 34 280 22 370 40 470 32S660 22 760 34 930 28 994 78C960 74 944 86 918 78 884 92 852 88 824 78 790 92 742 90 712 78 672 90 628 88 596 78 556 92 506 90 474 78 438 90 388 90 356 78 316 92 268 90 240 78 206 90 164 88 138 78 106 90 60 84 6 78Z';
// A real bank of snow under the frame: thick in the middle, tapering to nothing at both ends.
const DRIFT = 'M6 74C40 40 120 20 230 26 320 8 430 24 520 18S700 6 790 24 930 32 994 74C1000 84 980 90 950 90 700 96 300 96 50 90 20 90 0 84 6 74Z';

function snowCap(parent) {
  shape('path', { d: CAP, fill: SHADE, transform: 'translate(0 6)' }, parent);
  shape('path', { d: CAP, fill: SNOW }, parent);
}

function sleighCap(parent) {
  snowCap(parent);
  // A sleigh rope sagging between its pegs, strung with little bells.
  shape('path', { d: 'M90 46C200 88 310 88 420 52 520 88 640 88 900 46', stroke: ROPE, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, parent);
  for (const [x, y] of [[170, 66], [300, 72], [520, 70], [660, 72], [790, 62]]) {
    shape('path', { d: `M${x - 8} ${y + 14}C${x - 6} ${y + 2} ${x + 6} ${y + 2} ${x + 8} ${y + 14}Z`, fill: GOLD }, parent);
    shape('circle', { cx: x, cy: y + 15, r: 2.6, fill: RED }, parent);
  }
}

function wreathCap(parent) {
  snowCap(parent);
  for (const [x, y, size, tilt] of [[70, 56, .5], [230, 44, .42], [770, 44, .42], [930, 56, .5]]) holly(parent, x, y, size);
  // A ribbon bow tied at the centre of the frame.
  shape('path', { d: 'M500 46C462 14 416 18 420 50 424 78 470 72 500 54 530 72 576 78 580 50 584 18 538 14 500 46Z', fill: RED }, parent);
  shape('path', { d: 'M494 54L470 92 490 86 500 96 508 86 530 92 506 54Z', fill: '#8f3e37' }, parent);
  shape('circle', { cx: 500, cy: 50, r: 11, fill: '#c0574d' }, parent);
}

function bell(parent) {
  shape('path', { d: 'M40 0V26', stroke: ROPE, 'stroke-width': 4, fill: 'none' }, parent);
  shape('path', { d: 'M40 24C20 26 16 46 14 62 12 72 8 76 6 82H74C72 76 68 72 66 62 64 46 60 26 40 24Z', fill: GOLD }, parent);
  shape('path', { d: 'M24 56C30 50 50 50 56 56', stroke: '#b98a45', 'stroke-width': 3, fill: 'none' }, parent);
  shape('circle', { cx: 40, cy: 90, r: 9, fill: RED }, parent);
}

function bauble(parent) {
  shape('path', { d: 'M40 0V24', stroke: ROPE, 'stroke-width': 4, fill: 'none' }, parent);
  shape('rect', { x: 32, y: 22, width: 16, height: 10, fill: GOLD }, parent);
  shape('circle', { cx: 40, cy: 62, r: 30, fill: '#4f7d68' }, parent);
  shape('path', { d: 'M12 56C24 66 56 66 68 56', stroke: '#fbf3e3', 'stroke-width': 4, fill: 'none' }, parent);
  star(parent, 40, 76, 8);
}

function drift(parent) {
  shape('path', { d: DRIFT, fill: SHADE, transform: 'translate(0 3)' }, parent);
  shape('path', { d: DRIFT, fill: SNOW }, parent);
  for (const [x, y, width, height] of [[220, 62, 130, 22], [560, 56, 170, 24], [810, 66, 110, 18]]) shape('path', { d: `M${x - width} ${y + 10}C${x - width / 2} ${y - height} ${x + width / 2} ${y - height} ${x + width} ${y + 10}C${x + width / 2} ${y + 18} ${x - width / 2} ${y + 18} ${x - width} ${y + 10}Z`, fill: '#dbe7ee' }, parent);
}

function dress(frame, cap, charm) {
  paperLayer(frame, '-24 0 1048 110', 'frame-cap', cap, { paper: PAPER });
  paperLayer(frame, '-24 0 1048 100', 'frame-drift', drift, { paper: { ...PAPER, grain: .3 } });
  paperLayer(frame, '0 0 80 104', 'frame-charm', charm, { paper: { ...PAPER, scale: .6 }, origin: [40, 0] });
}

export function mountGameFrames(flying, matching) {
  dress(flying, sleighCap, bell);
  dress(matching, wreathCap, bauble);
}
