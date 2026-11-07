// The snowman's wardrobe: twenty-one paper accessories for four places. Each place is a small sheet laid over the snowman
// (cabin-scene.js), and an accessory is drawn inside its place's box, 100 wide, so one drawing fits both the snowman and the
// tray. Where the snowman's own parts fall in each box (from snowman() in cabin-art.js, a 0.9 × 1.4 board):
//   head box  — head circle centre (50, 75.3), radius 25.7, so its crown is at y 49.6
//   neck box  — where head meets body near y 20; the middle ball is about 52 wide at y 26
//   face box  — head centre (50, 50), radius 45; eyes at (34.3, 36.5) and (63.5, 36.5); the nose starts at the centre
//   hand box  — both twig arms: the right tip at (87.2, 25), the left at (12.8, 25), each arm rising 29° toward its tip.
//               Things he holds are drawn round the right tip; mittens go on both.
import { holly, shape } from './paper-art.js';
import { star } from './paper-props.js';

const CREAM = '#fbf3df', SNOW = '#fbf8f1', RED = '#a84a42', DEEP_RED = '#87302f', GREEN = '#4f7d68', DEEP_GREEN = '#3f6653', GOLD = '#e0b04f';
const WOOD = '#a8774d', INK = '#3b2a24', NAVY = '#3f5a6e';
// Each place: its sheet's centre and size on the snowman board (x across from the middle, y up from his foot) and the
// height of its art box.
export const PLACES = {
  head: { name: '頭部', at: [0, 1.38], size: [.7, .7], box: 100, nudge: .018 },
  neck: { name: '頸部', at: [0, .97], size: [.7, .42], box: 60, nudge: .006 },
  face: { name: '臉部', at: [0, 1.203], size: [.4, .4], box: 100, nudge: .012 },
  hand: { name: '手持', at: [0, .974], size: [1.2, .6], box: 50, nudge: .01 },
};
// The twig tips in the hand box, the arms' rise toward them (degrees), and the scale of things held in the right hand.
const RIGHT_TIP = [87.2, 25], LEFT_TIP = [12.8, 25], ARM = 29.05, HELD = .005 / .012;
function mitten(g) {
  shape('path', { d: 'M-1.8 -3.6C2 -5 6 -5 8.5 -3 10.6 -1.2 10.6 2.2 8.4 3.8 6 5.4 1 5 -1.8 3.6Z', fill: RED }, g);
  shape('path', { d: 'M1.5 -3.8C.8 -7 4.2 -8.2 5.6 -5.2Z', fill: RED }, g);
  shape('rect', { x: -5, y: -4.4, width: 3.8, height: 8.8, rx: 1.5, fill: SNOW }, g);
  shape('path', { d: 'M3.6 -1.2l1.8 1.8M6.2 -1.6l1.6 1.6', stroke: CREAM, 'stroke-width': .7, 'stroke-linecap': 'round' }, g);
}
const scarf = (g, body, tail, trim) => {
  shape('path', { d: 'M20 20C34 28 66 28 80 20V32C66 40 34 40 20 32Z', fill: body }, g);
  shape('path', { d: 'M60 33L69 58H58L54 35Z', fill: tail }, g);
  shape('path', { d: 'M59 58v-4M63 58v-4M67 58v-4', stroke: trim, 'stroke-width': 2 }, g);
};
const ITEMS = [
  // On the head.
  { id: 'santa-hat', place: 'head', name: '聖誕帽', thumb: '18 10 78 56', draw: g => {
    shape('path', { d: 'M26 54C28 30 44 14 60 16 74 18 84 28 88 40 80 34 72 32 66 34 72 40 74 48 74 54Z', fill: RED }, g);
    shape('rect', { x: 22, y: 49, width: 56, height: 11, rx: 5.5, fill: SNOW }, g);
    shape('circle', { cx: 88, cy: 41, r: 6, fill: SNOW }, g);
  } },
  { id: 'beanie', place: 'head', name: '毛帽', thumb: '18 14 64 52', draw: g => {
    shape('path', { d: 'M25 58C25 36 36 27 50 27 64 27 75 36 75 58Z', fill: GREEN }, g);
    shape('path', { d: 'M27 42H73', stroke: CREAM, 'stroke-width': 4 }, g);
    shape('rect', { x: 23, y: 52, width: 54, height: 10, rx: 4, fill: CREAM }, g);
    for (let x = 28; x < 74; x += 6) shape('path', { d: `M${x} 53v8`, stroke: '#e4d4b4', 'stroke-width': 1.6 }, g);
    shape('circle', { cx: 50, cy: 24, r: 7, fill: RED }, g);
  } },
  { id: 'top-hat', place: 'head', name: '高帽', thumb: '14 12 72 50', draw: g => {
    shape('rect', { x: 33, y: 18, width: 34, height: 37, rx: 3, fill: INK }, g);
    shape('rect', { x: 33, y: 45, width: 34, height: 6, fill: RED }, g);
    shape('ellipse', { cx: 50, cy: 56, rx: 31, ry: 5, fill: INK }, g);
    holly(g, 60, 47, .26);
  } },
  { id: 'beret', place: 'head', name: '貝雷帽', thumb: '18 24 68 40', draw: g => {
    shape('path', { d: 'M24 55C21 43 38 34 57 35 74 36 83 45 79 52 67 57 40 59 24 55Z', fill: NAVY }, g);
    shape('path', { d: 'M28 54C44 57 64 56 77 51', stroke: '#2f4556', 'stroke-width': 3, fill: 'none' }, g);
    shape('rect', { x: 51, y: 30, width: 4, height: 6, rx: 2, fill: '#2f4556' }, g);
  } },
  { id: 'earmuffs', place: 'head', name: '耳罩', thumb: '12 40 76 48', draw: g => {
    shape('path', { d: 'M25 74C24 44 76 44 75 74', stroke: '#c8574c', 'stroke-width': 4, fill: 'none' }, g);
    for (const x of [24.5, 75.5]) { shape('circle', { cx: x, cy: 76, r: 9, fill: SNOW }, g); shape('circle', { cx: x, cy: 76, r: 9, fill: 'none', stroke: '#e4d4b4', 'stroke-width': 1.6, 'stroke-dasharray': '2 3' }, g); }
  } },
  { id: 'antlers', place: 'head', name: '馴鹿角', thumb: '14 12 72 48', draw: g => {
    for (const side of [-1, 1]) {
      const x = 50 + side * 12;
      shape('path', { d: `M${x} 55C${x + side * 4} 40 ${x + side * 9} 30 ${x + side * 18} 21M${x + side * 6} 38L${x + side * 19} 36M${x + side * 11} 30L${x + side * 9} 17`, stroke: WOOD, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    }
  } },
  // Round the neck.
  { id: 'red-scarf', place: 'neck', name: '紅色圍巾', thumb: '14 14 72 48', draw: g => { scarf(g, RED, DEEP_RED, CREAM); shape('path', { d: 'M30 26v8M42 28v8M58 28v8M70 26v8', stroke: CREAM, 'stroke-width': 2.4 }, g); } },
  { id: 'plaid-scarf', place: 'neck', name: '格紋圍巾', thumb: '14 14 72 48', draw: g => {
    scarf(g, GREEN, DEEP_GREEN, CREAM);
    shape('path', { d: 'M20 27C34 34 66 34 80 27M32 23v14M50 25v14M68 23v14M61 44h6M60 51h8', stroke: RED, 'stroke-width': 2.4, fill: 'none' }, g);
    shape('path', { d: 'M40 24v14M59 24v14', stroke: CREAM, 'stroke-width': 1.4 }, g);
  } },
  { id: 'bow', place: 'neck', name: '蝴蝶結', thumb: '20 14 60 36', draw: g => {
    shape('path', { d: 'M50 28C40 16 26 18 28 28 26 38 40 40 50 28ZM50 28C60 16 74 18 72 28 74 38 60 40 50 28Z', fill: RED }, g);
    shape('path', { d: 'M48 31L42 44 47 43 50 36 53 43 58 44 52 31Z', fill: DEEP_RED }, g);
    shape('circle', { cx: 50, cy: 28, r: 5, fill: DEEP_RED }, g);
  } },
  { id: 'tie', place: 'neck', name: '領帶', thumb: '32 16 36 44', draw: g => {
    shape('path', { d: 'M45 22H55L53 29H47Z', fill: DEEP_GREEN }, g);
    shape('path', { d: 'M47 29L43 51 50 58 57 51 53 29Z', fill: GREEN }, g);
    shape('path', { d: 'M45 38L55 34M44 46L56 41', stroke: GOLD, 'stroke-width': 2.4 }, g);
  } },
  { id: 'cape', place: 'neck', name: '小披風', thumb: '6 14 88 46', draw: g => {
    for (const side of [-1, 1]) shape('path', { d: `M${50 + side * 26} 22L${50 + side * 40} 60H${50 + side * 20}L${50 + side * 16} 30Z`, fill: RED }, g);
    shape('path', { d: 'M24 21C36 28 64 28 76 21V27C64 34 36 34 24 27Z', fill: DEEP_RED }, g);
    shape('circle', { cx: 50, cy: 29, r: 4.5, fill: GOLD }, g);
  } },
  // On the face.
  { id: 'carrot', place: 'face', name: '胡蘿蔔鼻子', thumb: '44 38 58 24', draw: g => {
    shape('path', { d: 'M50 46L98 52 50 58Z', fill: '#e8873c' }, g);
    shape('path', { d: 'M62 49l-2 3M74 51l-2 3M86 51l-2 2', stroke: '#c96a28', 'stroke-width': 1.6 }, g);
  } },
  { id: 'button-nose', place: 'face', name: '紅鈕扣鼻子', thumb: '38 40 24 24', draw: g => {
    shape('circle', { cx: 50, cy: 52, r: 8, fill: '#c8443c' }, g);
    shape('circle', { cx: 47, cy: 49, r: 2.4, fill: '#f0a59b' }, g);
    for (const x of [48, 53]) shape('circle', { cx: x, cy: 54, r: 1.1, fill: DEEP_RED }, g);
  } },
  { id: 'round-glasses', place: 'face', name: '圓框眼鏡', thumb: '18 22 64 30', draw: g => {
    for (const x of [34.3, 63.5]) { shape('circle', { cx: x, cy: 36.5, r: 11, fill: '#ffffff', opacity: .35 }, g); shape('circle', { cx: x, cy: 36.5, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, g); }
    shape('path', { d: 'M45 36C48 33 51 33 53 36M23 35L12 32M75 35L86 32', stroke: INK, 'stroke-width': 2.4, fill: 'none' }, g);
  } },
  { id: 'sunglasses', place: 'face', name: '太陽眼鏡', thumb: '14 24 72 26', draw: g => {
    for (const x of [34.3, 63.5]) { shape('rect', { x: x - 12, y: 29, width: 24, height: 15, rx: 6, fill: '#2f2622' }, g); shape('path', { d: `M${x - 7} 33l5-2`, stroke: '#8a7a70', 'stroke-width': 2, 'stroke-linecap': 'round' }, g); }
    shape('path', { d: 'M46 34H52M22 33L12 31M76 33L86 31', stroke: '#2f2622', 'stroke-width': 3 }, g);
  } },
  { id: 'mustache', place: 'face', name: '小鬍子', thumb: '22 50 56 22', draw: g => {
    shape('path', { d: 'M50 61C44 54 30 55 25 64 33 62 41 67 50 63 59 67 67 62 75 64 70 55 56 54 50 61Z', fill: '#7d5636' }, g);
  } },
  // In his right hand.
  { id: 'broom', place: 'hand', name: '掃帚', thumb: '30 4 50 94', draw: g => {
    shape('path', { d: 'M43 8L58 72', stroke: WOOD, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    shape('path', { d: 'M51 70L66 70 76 96H42Z', fill: '#d9b36a' }, g);
    shape('path', { d: 'M52 76L48 94M58 76L58 94M64 76L68 94', stroke: '#b98f48', 'stroke-width': 1.8 }, g);
    shape('rect', { x: 50, y: 68, width: 18, height: 6, rx: 2, fill: RED }, g);
  } },
  { id: 'candy-cane', place: 'hand', name: '拐杖糖', thumb: '30 14 36 82', draw: g => {
    const d = 'M54 92V36C54 22 38 22 38 34';
    shape('path', { d, stroke: CREAM, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
    shape('path', { d, stroke: RED, 'stroke-width': 7, fill: 'none', 'stroke-dasharray': '5 6' }, g);
  } },
  { id: 'lantern', place: 'hand', name: '提燈', thumb: '34 44 32 46', draw: g => {
    shape('path', { d: 'M50 50V58', stroke: INK, 'stroke-width': 2 }, g);
    shape('path', { d: 'M40 61L50 55 60 61Z', fill: INK }, g);
    shape('rect', { x: 41, y: 61, width: 18, height: 22, rx: 3, fill: '#ffe3a0', stroke: INK, 'stroke-width': 2 }, g);
    shape('path', { d: 'M50 66C53 70 52 74 50 75 48 74 47 70 50 66Z', fill: '#f2a541' }, g);
    shape('rect', { x: 39, y: 83, width: 22, height: 4, rx: 2, fill: INK }, g);
  } },
  { id: 'gift', place: 'hand', name: '禮物盒', thumb: '30 30 40 44', draw: g => {
    shape('rect', { x: 36, y: 46, width: 28, height: 24, rx: 3, fill: GREEN }, g);
    shape('path', { d: 'M50 46V70M36 56H64', stroke: GOLD, 'stroke-width': 4 }, g);
    shape('path', { d: 'M50 46C44 38 38 40 42 45M50 46C56 38 62 40 58 45', stroke: GOLD, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
    star(g, 43, 63, 3, CREAM);
  } },
  // A pair, one on each twig: the cuff wraps the twig just short of its end and the mitten covers the tip. Drawn along the
  // arm (x outward, origin at the tip), then turned to the right arm's angle and mirrored for the left.
  { id: 'mittens', place: 'hand', name: '一雙手套', icon: ['-12 -10 48 22', g => { mitten(shape('g', { transform: 'translate(0 2) rotate(-20)' }, g)); mitten(shape('g', { transform: 'translate(24 2) scale(-1 1) rotate(-20)' }, g)); }], draw: g => {
    mitten(shape('g', { transform: `translate(${RIGHT_TIP[0]} ${RIGHT_TIP[1]}) rotate(${-ARM})` }, g));
    mitten(shape('g', { transform: `translate(${LEFT_TIP[0]} ${LEFT_TIP[1]}) scale(-1 1) rotate(${-ARM})` }, g));
  } },
];
for (const item of ITEMS) {
  if (item.place !== 'hand' || item.id === 'mittens') continue;
  const { draw, thumb } = item, [x, y, w, h] = thumb.split(' ').map(Number), at = ([px, py]) => [RIGHT_TIP[0] + (px - 50) * HELD, RIGHT_TIP[1] + (py - 50) * HELD];
  item.draw = g => draw(shape('g', { transform: `translate(${RIGHT_TIP[0]} ${RIGHT_TIP[1]}) scale(${HELD}) translate(-50 -50)` }, g));
  item.thumb = [...at([x, y]), w * HELD, h * HELD].map(value => +value.toFixed(2)).join(' ');
}
export const WARDROBE = ITEMS;
export const itemFor = id => ITEMS.find(item => item.id === id) ?? null;
export const known = (place, id) => ITEMS.some(item => item.id === id && item.place === place);
// Outfits that make the snowman play a part. `act` is what his paper body does (cabin-scene.js snowmanAct).
export const COMBOS = [
  { id: 'santa', needs: { head: 'santa-hat', face: 'mustache' }, act: 'hop', line: '雪人摸摸鬍子：「Ho ho ho！今天換我去送禮物！」' },
  { id: 'reindeer', needs: { head: 'antlers', face: 'button-nose' }, act: 'prance', line: '鹿角加紅鼻子，雪人學麋鹿蹦蹦跳跳！' },
  { id: 'gentleman', needs: { head: 'top-hat', neck: 'tie' }, act: 'bow', line: '高帽配領帶，雪人紳士地鞠了個躬。' },
];
