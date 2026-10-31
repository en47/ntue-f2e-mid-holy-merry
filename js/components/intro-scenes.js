// The three pop-up chapters. Each key is one card that stands on its own bottom hinge.
import { paperLayer, shape } from './paper-art.js';
import { SNOW, church, fence, holly, lamp, pine, roofHouse, star } from './paper-props.js';

const SKIN = '#f2cda9', BLUSH = '#eaa491', LINE = '#5a4033', WOOD = '#8f6a4c', WOOD_DARK = '#6d4f3a', LIT = '#efbe62', STRAW = '#dcb765';
const path = (parent, d, fill, extra = {}) => shape('path', { d, fill, ...extra }, parent);
const stroke = (parent, d, color, width) => path(parent, d, 'none', { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// Closed, sleeping eyes keep every figure calm and in one family.
function face(parent, x, y, r, skin = SKIN) {
  shape('circle', { cx: x, cy: y, r, fill: skin }, parent);
  for (const side of [-1, 1]) {
    stroke(parent, `M${x + side * r * .62} ${y - r * .04}q${-side * r * .24} ${r * .22} ${-side * r * .48} 0`, LINE, 2.4);
    shape('circle', { cx: x + side * r * .6, cy: y + r * .34, r: r * .17, fill: BLUSH, opacity: .75 }, parent);
  }
  stroke(parent, `M${x - r * .14} ${y + r * .44}q${r * .14} ${r * .13} ${r * .28} 0`, LINE, 2);
}

function prayingHands(parent, x, y, sleeve) {
  path(parent, `M${x - 40} ${y + 30}C${x - 26} ${y + 6} ${x - 12} ${y} ${x} ${y + 6} ${x + 12} ${y} ${x + 26} ${y + 6} ${x + 40} ${y + 30} ${x + 18} ${y + 42} ${x - 18} ${y + 42} ${x - 40} ${y + 30}Z`, sleeve);
  path(parent, `M${x - 11} ${y + 12}L${x} ${y - 22} ${x + 11} ${y + 12}C${x + 6} ${y + 20} ${x - 6} ${y + 20} ${x - 11} ${y + 12}Z`, SKIN);
}

function mary(parent) {
  path(parent, 'M100 24C48 24 26 76 32 130 18 190 16 250 26 296H174C184 250 182 190 168 130 174 76 152 24 100 24Z', '#5d7f9f');
  path(parent, 'M64 128C52 196 56 262 62 296H138C144 262 148 196 136 128Z', '#f3e7cf');
  path(parent, 'M58 96C52 52 78 40 100 40 122 40 148 52 142 96 150 128 132 150 100 150 68 150 50 128 58 96Z', '#fbf3e3');
  path(parent, 'M64 100C60 76 76 58 100 58 124 58 140 76 136 100 138 126 126 138 124 140 134 110 118 82 100 80 82 82 66 110 76 140 74 138 62 126 64 100Z', '#8a5f42');
  face(parent, 100, 104, 34);
  prayingHands(parent, 100, 176, '#ead9bb');
}

function joseph(parent) {
  stroke(parent, 'M168 296V74C168 46 136 46 136 70', '#7c5a3f', 9);
  path(parent, 'M100 96C62 96 44 130 40 180 34 230 34 270 40 296H150C156 270 156 230 150 180 146 130 138 96 100 96Z', '#8a6a4e');
  path(parent, 'M72 110C64 180 66 250 70 296H96C92 240 92 170 96 110Z', '#6f8f73');
  path(parent, 'M106 110C112 170 112 240 110 296H128C130 240 130 170 126 110Z', '#b08f6c');
  path(parent, 'M52 86C50 44 76 26 100 26 124 26 150 44 148 86 150 110 142 118 132 122 130 96 70 96 68 122 58 118 50 110 52 86Z', '#ead9bb');
  face(parent, 100, 86, 32);
  path(parent, 'M68 92C66 142 86 158 100 158 114 158 134 142 132 92 124 112 112 116 100 116 88 116 76 112 68 92Z', '#7a5740');
  path(parent, 'M58 62C78 46 122 46 142 62 142 72 136 76 130 72 112 62 88 62 70 72 64 76 58 72 58 62Z', '#a8564c');
  shape('rect', { x: 150, y: 150, width: 34, height: 26, rx: 5, fill: SKIN }, parent);
  shape('rect', { x: 62, y: 180, width: 76, height: 10, rx: 4, fill: '#b5624f' }, parent);
}

function manger(parent) {
  stroke(parent, 'M58 186L126 92M242 186L174 92', WOOD_DARK, 16);
  stroke(parent, 'M50 110L150 186M250 110L150 186', WOOD, 14);
  path(parent, 'M40 112C80 74 220 74 260 112 240 136 60 136 40 112Z', STRAW);
  for (let x = 54; x < 250; x += 16) stroke(parent, `M${x} ${116 + (x % 3) * 3}l${(x % 5) - 2} -28`, '#c9a24f', 3);
  path(parent, 'M84 104C84 72 120 58 170 60 214 62 226 84 214 104 180 116 118 116 84 104Z', '#f6ecda');
  stroke(parent, 'M112 66C118 82 116 98 110 110M144 62C150 80 148 98 142 112', '#dcc9a8', 3);
  shape('circle', { cx: 196, cy: 74, r: 27, fill: '#fbf3e3' }, parent);
  face(parent, 198, 76, 20);
}

function sheep(parent) {
  path(parent, 'M50 124C24 120 22 84 48 78 46 50 82 40 98 58 112 34 152 38 160 60 188 50 212 78 196 100 214 120 190 146 164 134 148 152 112 152 100 136 82 150 56 144 50 124Z', '#f6ecda');
  for (const x of [70, 96, 140, 166]) shape('rect', { x, y: 128, width: 15, height: 26, rx: 6, fill: '#6d4f3a' }, parent);
  path(parent, 'M190 54C216 46 232 66 226 92 222 110 196 114 182 98 172 84 174 62 190 54Z', '#f2d9bd');
  path(parent, 'M186 58C176 48 160 52 158 66 170 72 182 70 186 58Z', '#e7c3a4');
  path(parent, 'M222 56C232 44 244 48 246 62 236 70 226 68 222 56Z', '#e7c3a4');
  stroke(parent, 'M190 80q5 5 10 0M210 78q5 5 10 0', LINE, 2.4);
  stroke(parent, 'M202 96q4 4 8 0', LINE, 2);
}

function beast(parent, x, y, scale, { coat, muzzle, ear, horn }) {
  const group = shape('g', { transform: `translate(${x} ${y}) scale(${scale})` }, parent);
  path(group, 'M-70 80C-92 28 -60 -20 0 -24 60 -20 96 28 74 80Z', coat);
  if (horn) { stroke(group, 'M-36 -46C-52 -60 -56 -76 -50 -88', '#e3cfa3', 11); stroke(group, 'M36 -46C52 -60 56 -76 50 -88', '#e3cfa3', 11); }
  path(group, 'M-46 -34C-64 -46 -84 -40 -88 -24 -72 -14 -54 -18 -46 -34Z', ear);
  path(group, 'M46 -34C64 -46 84 -40 88 -24 72 -14 54 -18 46 -34Z', ear);
  path(group, 'M-52 -14C-54 -60 -22 -66 0 -66 22 -66 54 -60 52 -14 56 30 30 44 0 44 -30 44 -56 30 -52 -14Z', coat);
  path(group, 'M-34 18C-30 -6 30 -6 34 18 32 42 -32 42 -34 18Z', muzzle);
  for (const side of [-1, 1]) { stroke(group, `M${side * 30} -22q${-side * 7} 7 ${-side * 14} 0`, LINE, 3); shape('circle', { cx: side * 13, cy: 16, r: 3.4, fill: LINE }, group); }
}

function cowDonkey(parent) {
  beast(parent, 232, 104, .92, { coat: '#8d8279', muzzle: '#d9c4ae', ear: '#756a62' });
  beast(parent, 110, 104, 1, { coat: '#b47a50', muzzle: '#f2d4b4', ear: '#9a6443', horn: true });
}

function stable(parent) {
  path(parent, 'M76 388V150H484V388Z', '#5a4232');
  path(parent, 'M96 388V190H464V388Z', '#3f2f25');
  for (const x of [130, 190, 370, 430]) stroke(parent, `M${x} 190V388`, '#4d392c', 6);
  path(parent, 'M96 388C150 340 200 372 280 356S420 340 464 388Z', STRAW);
  for (let x = 110; x < 460; x += 22) stroke(parent, `M${x} 386l${(x % 7) - 3} -${18 + (x % 5) * 4}`, '#c9a24f', 3);
  stroke(parent, 'M76 388V164M484 388V164', WOOD, 18);
  stroke(parent, 'M280 40L40 186M280 40L520 186', WOOD_DARK, 26);
  stroke(parent, 'M96 208H464', WOOD, 13);
  stroke(parent, 'M280 54V206', WOOD, 11);
  path(parent, 'M34 176L280 24 526 176C500 190 472 176 452 160 426 176 396 150 372 124 348 138 318 112 296 84 272 100 252 92 236 86 210 124 176 130 150 128 126 160 92 176 34 176Z', SNOW);
  path(parent, 'M92 266H128L124 306H96Z', LIT);
  stroke(parent, 'M110 208V266', '#6d5a50', 3);
  path(parent, 'M88 266L110 250 132 266Z', '#6d5a50');
}

function palm(parent, x, base, height) {
  const k = height / 100;
  stroke(parent, `M${x} ${base}C${x + 6 * k} ${base - 40 * k} ${x - 4 * k} ${base - 70 * k} ${x + 4 * k} ${base - 96 * k}`, '#7c6a58', 8 * k);
  for (const angle of [-150, -115, -80, -45, -10, 25]) path(parent, 'M0 0C20 -20 50 -22 72 4 48 -6 24 -4 0 0Z', '#5f7f6f', { transform: `translate(${x + 4 * k} ${base - 96 * k}) rotate(${angle}) scale(${k})` });
}

function dome(parent, x, base, width, height, wall = '#e3c9a0') {
  const half = width / 2;
  path(parent, `M${x - half} ${base}V${base - height}H${x + half}V${base}Z`, wall);
  path(parent, `M${x - half} ${base - height + 2}C${x - half} ${base - height - half * 1.2} ${x + half} ${base - height - half * 1.2} ${x + half} ${base - height + 2}Z`, '#f0dcb9');
  path(parent, `M${x - width * .13} ${base - height * .36}V${base - height * .68}C${x - width * .13} ${base - height * .86} ${x + width * .13} ${base - height * .86} ${x + width * .13} ${base - height * .68}V${base - height * .36}Z`, LIT);
}

function bethlehem(parent) {
  palm(parent, 56, 250, 120);
  dome(parent, 130, 250, 76, 86); dome(parent, 210, 250, 96, 124); dome(parent, 300, 250, 70, 74, '#d9bd92');
  palm(parent, 372, 250, 96);
  path(parent, 'M14 286C50 226 130 236 208 244S346 224 406 286Z', '#ead6b0');
}

function nightSky(parent) {
  path(parent, 'M14 516V230C14 90 130 16 280 16S546 90 546 230V516Z', '#34506c');
  for (const [x, y, size] of [[100, 190, 7], [168, 110, 9], [262, 74, 6], [344, 130, 7], [438, 112, 10], [480, 210, 7], [66, 270, 6], [212, 196, 5]]) star(parent, x, y, size, '#efd08a');
  path(parent, 'M14 516V380C120 340 220 372 330 356S490 344 546 372V516Z', '#4b6a80');
}

function shootingStar(parent) {
  path(parent, 'M112 74C168 28 232 22 286 34 240 40 218 54 208 68 234 62 256 66 270 74 228 76 176 96 124 102Z', '#f3dca6');
  star(parent, 96, 92, 62, '#e8bd62');
  star(parent, 96, 92, 30, '#f7dfa4');
}

function duskSky(parent) {
  path(parent, 'M14 516V230C14 90 130 16 280 16S546 90 546 230V516Z', '#5b7691');
  for (const [x, y] of [[92, 150], [150, 240], [206, 92], [300, 170], [360, 88], [430, 200], [496, 280], [70, 300], [250, 270], [404, 330]]) shape('circle', { cx: x, cy: y, r: 5, fill: '#f6efe2' }, parent);
  path(parent, 'M14 516V370C130 330 240 368 340 350S500 340 546 366V516Z', '#dbe7ec');
}

function nightCloud(parent) {
  path(parent, 'M40 118C14 112 16 74 46 72 48 40 90 30 108 54 124 22 180 24 192 56 222 42 256 66 244 94 268 100 266 124 240 124Z', '#3a5674');
  path(parent, 'M128 44A36 36 0 1 0 160 98 30 30 0 1 1 128 44Z', '#efcf7e');
  for (const [x, y, size] of [[76, 88, 8], [204, 80, 8], [100, 104, 5]]) star(parent, x, y, size, '#efd08a');
}

function chapel(parent) {
  pine(parent, 54, 276, 130, '#5f8a70');
  church(parent, 210, 276);
  roofHouse(parent, 350, 278, 96, 60, { roof: '#6f8f86', wall: '#ead9bb' });
  path(parent, 'M14 296C60 260 160 268 240 266S380 256 428 296Z', SNOW);
}

function cottage(parent) {
  path(parent, 'M118 366V182H402V366Z', '#c9a67c');
  path(parent, 'M300 366V182H402V366Z', '#000', { opacity: .07 });
  for (const y of [214, 248, 282, 316, 350]) stroke(parent, `M122 ${y}H398`, '#b4906a', 2);
  shape('rect', { x: 330, y: 62, width: 50, height: 90, fill: '#9c7158' }, parent);
  path(parent, 'M322 68C336 50 372 50 388 68 380 78 330 78 322 68Z', SNOW);
  path(parent, 'M64 196L260 56 456 196Z', '#8a5f47');
  path(parent, 'M52 204C60 176 96 160 124 136 160 112 214 62 260 44 306 62 360 112 396 136 424 160 460 176 468 204 440 216 416 198 396 188 372 208 344 194 322 170 300 186 268 186 252 166 226 190 196 190 176 172 150 196 120 208 96 192 80 204 64 214 52 204Z', SNOW);
  for (const x of [150, 330]) {
    shape('rect', { x, y: 232, width: 58, height: 66, rx: 8, fill: LIT }, parent);
    stroke(parent, `M${x + 29} 232v66M${x} 264h58`, '#8a6248', 4);
    path(parent, `M${x - 8} 234C${x + 6} 220 ${x + 52} 220 ${x + 66} 234Z`, SNOW);
  }
  path(parent, 'M232 366V272C232 234 288 234 288 272V366Z', '#7c563f');
  shape('circle', { cx: 276, cy: 318, r: 5, fill: LIT }, parent);
  path(parent, 'M20 380C100 346 200 368 280 362S440 348 500 380Z', SNOW);
}

function nicholas(parent) {
  stroke(parent, 'M34 296V70C34 26 92 26 92 66 92 88 62 88 62 70', '#b08f6c', 9);
  shape('ellipse', { cx: 196, cy: 240, rx: 50, ry: 58, fill: '#a98a62' }, parent);
  path(parent, 'M164 190C176 170 216 170 228 190 212 200 180 200 164 190Z', '#8c6f4d');
  for (const [x, y] of [[182, 178], [204, 174], [194, 188]]) shape('circle', { cx: x, cy: y, r: 11, fill: '#e8bd62' }, parent);
  path(parent, 'M128 108C78 108 58 158 52 204 46 250 48 276 54 296H198C204 272 206 246 198 204 192 158 174 108 128 108Z', '#a8564c');
  path(parent, 'M108 120H148V296H108Z', '#f6ecda');
  stroke(parent, 'M106 118V296M150 118V296', '#e0b04f', 7);
  path(parent, 'M84 40L128 8 172 40C184 70 178 92 172 104H84C78 92 72 70 84 40Z', '#a8564c');
  stroke(parent, 'M84 102H172', '#e0b04f', 8);
  stroke(parent, 'M128 20V90M108 50H148', '#e0b04f', 7);
  face(parent, 128, 128, 32);
  path(parent, 'M92 132C86 200 114 226 128 226 142 226 170 200 164 132 152 150 140 154 128 154 116 154 104 150 92 132Z', '#fbf8f1');
  shape('rect', { x: 26, y: 188, width: 30, height: 24, rx: 6, fill: SKIN }, parent);
}

function child(parent, x, base, dress, hair) {
  path(parent, `M${x - 36} ${base}C${x - 40} ${base - 60} ${x - 28} ${base - 104} ${x} ${base - 106} ${x + 28} ${base - 104} ${x + 40} ${base - 60} ${x + 36} ${base}Z`, dress);
  path(parent, `M${x - 20} ${base}C${x - 22} ${base - 50} ${x - 16} ${base - 78} ${x} ${base - 80} ${x + 16} ${base - 78} ${x + 22} ${base - 50} ${x + 20} ${base}Z`, '#f3e7cf');
  path(parent, `M${x - 36} ${base - 120}C${x - 44} ${base - 180} ${x + 44} ${base - 180} ${x + 36} ${base - 120} ${x + 38} ${base - 96} ${x + 30} ${base - 84} ${x + 22} ${base - 92} ${x + 10} ${base - 120} ${x - 10} ${base - 120} ${x - 22} ${base - 92} ${x - 30} ${base - 84} ${x - 38} ${base - 96} ${x - 36} ${base - 120}Z`, hair);
  face(parent, x, base - 126, 25);
  path(parent, `M${x - 7} ${base - 72}L${x} ${base - 90} ${x + 7} ${base - 72}C${x + 4} ${base - 68} ${x - 4} ${base - 68} ${x - 7} ${base - 72}Z`, SKIN);
}

function family(parent) {
  path(parent, 'M396 216C392 150 376 84 344 84 312 84 296 150 292 216Z', '#7c5f4a');
  path(parent, 'M300 92C296 50 392 50 388 92 388 110 380 118 372 118 360 96 328 96 316 118 308 118 300 110 300 92Z', '#6a4a36');
  face(parent, 344, 96, 26);
  path(parent, 'M318 102C316 138 334 148 344 148 354 148 372 138 370 102 362 116 354 118 344 118 334 118 326 116 318 102Z', '#6a4a36');
  child(parent, 66, 216, '#b5624f', '#8a5f42'); child(parent, 158, 216, '#5f8a70', '#9c6e4a'); child(parent, 248, 216, '#d9c19a', '#b5825a');
}

function fireplace(parent) {
  path(parent, 'M30 296V70H250V296Z', '#b08f6c');
  for (const y of [100, 132, 164, 196, 228, 260]) stroke(parent, `M34 ${y}H246`, '#9c7b5b', 2.4);
  path(parent, 'M78 296V190C78 130 202 130 202 190V296Z', '#4a3429');
  path(parent, 'M140 170C166 198 182 226 172 256 164 284 116 284 108 256 98 226 118 198 140 170Z', '#e8a24e');
  path(parent, 'M140 208C154 224 160 240 154 256 148 272 132 272 126 256 120 240 128 224 140 208Z', '#f7dfa4');
  stroke(parent, 'M92 288H188', WOOD_DARK, 11);
  shape('rect', { x: 18, y: 58, width: 244, height: 22, rx: 5, fill: WOOD_DARK }, parent);
  for (const [x, fill] of [[84, '#a84a42'], [140, '#4f7d68'], [196, '#d9c19a']]) {
    path(parent, `M${x - 16} 82H${x + 16}V128C${x + 16} 150 ${x + 4} 160 ${x - 18} 158 ${x - 30} 156 ${x - 32} 142 ${x - 16} 134Z`, fill);
    shape('rect', { x: x - 19, y: 78, width: 38, height: 15, rx: 5, fill: SNOW }, parent);
  }
  holly(parent, 44, 56, .46); holly(parent, 236, 56, .46);
}

function coinBag(parent) {
  path(parent, 'M50 84C50 36 70 26 76 40 82 22 110 22 114 40 124 26 142 36 142 84 176 110 176 172 96 176 16 172 14 110 50 84Z', '#a98a62');
  stroke(parent, 'M58 72C80 82 112 82 134 72', '#a84a42', 7);
  for (const [x, y] of [[80, 34], [110, 32]]) shape('circle', { cx: x, cy: y, r: 13, fill: '#e8bd62' }, parent);
}

function winterSky(parent) {
  path(parent, 'M14 516V230C14 90 130 16 280 16S546 90 546 230V516Z', '#7fa3bb');
  for (const [x, y] of [[80, 220], [130, 130], [230, 80], [340, 110], [470, 150], [500, 260], [300, 200], [186, 230]]) shape('circle', { cx: x, cy: y, r: 4.5, fill: '#f6efe2' }, parent);
  path(parent, 'M14 516V356C110 318 230 356 340 340S500 324 546 352V516Z', '#e4edf0');
}

function decoratedTree(parent) {
  pine(parent, 110, 300, 270, '#4f7a65');
  for (const [x, y, fill] of [[92, 150, '#b5544c'], [136, 176, '#e0b04f'], [74, 214, '#e0b04f'], [118, 226, '#b5544c'], [158, 244, '#b5544c'], [60, 262, '#b5544c'], [104, 268, '#e0b04f']]) shape('circle', { cx: x, cy: y, r: 9, fill }, parent);
  star(parent, 110, 34, 28);
}

function snowPine(parent) { pine(parent, 80, 216, 196, '#5f8a70'); }

function streetLamp(parent) { lamp(parent, 40, 200); path(parent, 'M6 204C20 188 62 188 76 204Z', SNOW); }

function signpost(parent) {
  stroke(parent, 'M70 226V34', WOOD, 14);
  path(parent, 'M12 56H112L134 76 112 96H12Z', '#a07c5a');
  path(parent, 'M126 112H28L8 130 28 148H126Z', '#8f6a4c');
  path(parent, 'M10 58C30 44 100 44 118 58 104 66 28 66 10 58Z', SNOW);
  holly(parent, 104, 108, .42);
  path(parent, 'M30 232C50 214 92 214 112 232Z', SNOW);
}

function gardenFence(parent) {
  fence(parent, 36, 122, 7, 44);
  path(parent, 'M6 134C60 112 280 112 340 134Z', SNOW);
  holly(parent, 170, 78, .6);
}

function snowFront(parent) {
  path(parent, 'M10 126C70 62 160 52 252 82 340 106 420 64 520 60 590 58 650 92 690 126Z', SNOW);
  for (const [x, y, w] of [[176, 104, 86], [500, 98, 96]]) path(parent, `M${x - w} ${y + 8}C${x - w * .5} ${y - 24} ${x + w * .5} ${y - 24} ${x + w} ${y + 8}C${x + w * .5} ${y + 18} ${x - w * .5} ${y + 18} ${x - w} ${y + 8}Z`, '#c7dbe6');
}

function gift(parent, x, base, width, height, fill, ribbon) {
  shape('rect', { x: x - width / 2, y: base - height, width, height, rx: 4, fill }, parent);
  shape('rect', { x: x - width * .1, y: base - height, width: width * .2, height, fill: ribbon }, parent);
  path(parent, `M${x} ${base - height}C${x - 30} ${base - height - 28} ${x - 42} ${base - height - 4} ${x} ${base - height}C${x + 30} ${base - height - 28} ${x + 42} ${base - height - 4} ${x} ${base - height}Z`, ribbon);
}

function gifts(parent) {
  gift(parent, 96, 150, 112, 92, '#a84a42', '#f3e7cf'); gift(parent, 214, 150, 96, 74, '#4f7d68', '#e0b04f'); gift(parent, 158, 154, 76, 48, '#e9d9b8', '#b5625a');
}

// Key: [viewBox, draw]. Backdrops are larger sheets and take softer paper.
export const sceneArt = {
  nightSky: ['0 0 560 530', nightSky], duskSky: ['0 0 560 530', duskSky], winterSky: ['0 0 560 530', winterSky],
  bethlehem: ['0 0 420 300', bethlehem], star: ['0 0 310 170', shootingStar], stable: ['0 0 560 404', stable],
  mary: ['0 0 200 310', mary], joseph: ['0 0 200 310', joseph], manger: ['0 0 300 204', manger], sheep: ['0 0 260 170', sheep], cowDonkey: ['0 0 346 204', cowDonkey],
  night: ['0 0 280 150', nightCloud], chapel: ['0 0 440 310', chapel], cottage: ['0 0 520 394', cottage], nicholas: ['0 0 260 310', nicholas], family: ['0 0 410 232', family], fireplace: ['0 0 280 310', fireplace],
  tree: ['0 0 220 316', decoratedTree], snowPine: ['0 0 160 230', snowPine], lamp: ['0 0 84 216', streetLamp], sign: ['0 0 146 244', signpost], fence: ['0 0 350 146', gardenFence], snowFront: ['0 0 700 140', snowFront], gifts: ['0 0 310 168', gifts],
};

const PAPER = { scale: 1, grain: .55, shadow: .26 }, SHEET = { scale: 1.2, grain: .4, shadow: .12 };

export function drawPiece(node, { art }) {
  const [viewBox, draw] = sceneArt[art];
  paperLayer(node, viewBox, '', draw, { paper: /Sky$/.test(art) ? SHEET : PAPER, eager: true, preserveAspectRatio: 'xMidYMax meet' });
}

export function drawCoin(node) { paperLayer(node, '0 0 190 190', '', coinBag, { paper: { scale: .8, grain: .5, shadow: .2 }, eager: true }); }
