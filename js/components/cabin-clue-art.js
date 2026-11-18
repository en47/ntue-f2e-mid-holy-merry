// Little paper pictures for the clue book (cabin-notebook.js): on each clue's sticker the thing it was found on, and by
// the goal on the "now" page a picture of what the story is waiting on. Cut from the same paper as the rest of the
// village, drawn in a 40 × 40 box with the light from the upper left (the shaded side on the right). Clues found on the
// same thing share a picture; a gift's card shows that substitute's ornament (cabin-ornaments.js). Each picture becomes
// an image once and is kept, since the pages are drawn again at every turn of a leaf.
import { paperFilter, shape } from './paper-art.js';
import { roofHouse, snowyFir, star } from './paper-props.js';
import { perforated } from './cabin-paper.js';
import { ornament } from './cabin-ornaments.js';
import { SUBSTITUTES } from './cabin-art.js';

const KRAFT = '#e6d3ad', WOOD = '#9c7f64', WOOD_DARK = '#7a5236', NOTE = '#fbf3df', PALE = '#efe4cc', RED = '#b5443c', RED_DARK = '#8f3530';
const SHEET = '#fffdf6', LEAF = '#4f7d68', GOLD = '#e0b04f', GOLD_DARK = '#b98a3c', SNOW = '#fbf8f1', INK = '#3b2a24', PENCIL = '#8f5a3c';
// Paper on a paper sticker: a pencil-brown cut edge so it does not melt into the sticker.
const EDGE = { stroke: '#c4ab80', 'stroke-width': 1, 'stroke-linejoin': 'round' };
const line = (d, stroke, parent, width = 1.6) => shape('path', { d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
const shade = (d, parent) => shape('path', { d, fill: '#000', opacity: .07 }, parent);

export const CLUE_ART = {
  // The little parcel in the mailbox, tied up with red string and a bow.
  parcel(g) {
    shape('rect', { x: 7, y: 14, width: 26, height: 19, rx: 2, fill: '#c9a46a' }, g); shade('M27 14H31Q33 14 33 16V31Q33 33 31 33H27Z', g);
    line('M20 14V33M7 23.5H33', RED, g, 2.2);
    shape('path', { d: 'M20 14C15 6 9 9 13 13 15 15 18 14 20 14ZM20 14C25 6 31 9 27 13 25 15 22 14 20 14Z', fill: RED }, g);
  },
  // The repair tag on the winch: a kraft tag threaded on a red string.
  tag(g) {
    line('M20 12C15 6 10 6 7 2', RED, g, 1.6);
    shape('path', { d: 'M14 7H26L31 12V35H9V12Z', fill: KRAFT }, g); shade('M26 7L31 12V35H26Z', g);
    shape('circle', { cx: 20, cy: 12, r: 2.2, fill: WOOD_DARK }, g);
    line('M13 20H27M13 25H24M13 30H21', PENCIL, g, 1.4);
  },
  // A folded note in blue ink.
  note(g) {
    shape('path', { d: 'M7 9L31 7 33 32 9 34Z', fill: SHEET, ...EDGE }, g); line('M20 8L21 33', '#e2d4b8', g, 1.2);
    line('M12 15Q16 13.5 27 14M12 20Q18 18.5 27 19.5M12 25.5Q15 24.5 21 25', '#4a6b8a', g, 1.5);
  },
  // The care log: a slip with a line of gold writing, hung by red string over a bundle of hay.
  hay(g) {
    shape('path', { d: 'M5 34C5 25 10 22 20 22S35 25 35 34Z', fill: '#e3c46e' }, g);
    line('M9 32L12 25M15 33L16 24M21 33L21 23M27 33L26 24M32 32L29 25', '#c9a24a', g, 1.2);
    line('M22 9L25 3', RED, g, 1.4);
    shape('path', { d: 'M15 8L28 7.5 29 22 16 22.5Z', fill: SHEET, ...EDGE }, g); line('M18.5 13H25.5M18.5 17H24', GOLD, g, 1.6);
  },
  // The feeding chart on the barn door: a row of times, and a carrot.
  feed(g) {
    shape('rect', { x: 7, y: 5, width: 23, height: 29, rx: 1.5, fill: SHEET, ...EDGE }, g);
    line('M11 10.5H26', INK, g, 1.8); line('M11 16H26M11 21H26M11 26H21', '#d6c3a0', g, 1.3);
    shape('path', { d: 'M22 35L30 24 33.5 27Z', fill: '#e9873a' }, g); line('M31.6 25L33 20.5M32.2 25.6L36.5 23', LEAF, g, 1.6);
  },
  // The message board at the wishing corner, two notes pinned to it.
  board(g) {
    shape('rect', { x: 18.5, y: 24, width: 3, height: 12, fill: WOOD_DARK }, g);
    shape('rect', { x: 5, y: 7, width: 30, height: 19, rx: 2, fill: WOOD }, g); shade('M29 7H33Q35 7 35 9V24Q35 26 33 26H29Z', g);
    shape('path', { d: 'M8 10.5L17.5 9.5 18 19 8.5 20Z', fill: SHEET, ...EDGE }, g); shape('path', { d: 'M21 11L31 12 30.5 22 20.5 21Z', fill: '#fde6c0' }, g);
    for (const [cx, cy] of [[13, 10.5], [26, 12]]) shape('circle', { cx, cy, r: 1.5, fill: RED }, g);
  },
  // The fireplace: stones round a fire, the mantel over it.
  hearth(g) {
    shape('rect', { x: 6, y: 10, width: 28, height: 25, fill: '#c9c2b6' }, g); shade('M28 10H34V35H28Z', g);
    shape('rect', { x: 4, y: 7, width: 32, height: 4.5, rx: 1, fill: WOOD_DARK }, g);
    shape('path', { d: 'M12 35V24Q20 15 28 24V35Z', fill: INK }, g);
    shape('path', { d: 'M15 35C14 30 18 29 17.5 25 21.5 28 24.5 30 25 35Z', fill: '#e9873a' }, g);
    shape('path', { d: 'M18 35C18 32 20 31 20 29 22 31 23 33 22.5 35Z', fill: '#f4c24d' }, g);
  },
  // The drawer's keyhole on a brass plate, a sprig of holly on each side.
  keyhole(g) {
    for (const s of [-1, 1]) {
      shape('path', { d: `M${20 + s * 6} 20C${20 + s * 9} 14 ${20 + s * 15} 14 ${20 + s * 17} 18C${20 + s * 14} 18.5 ${20 + s * 13} 23 ${20 + s * 6} 20Z`, fill: LEAF }, g);
      shape('circle', { cx: 20 + s * 8.5, cy: 23.5, r: 1.8, fill: '#c63a33' }, g);
    }
    shape('rect', { x: 13, y: 7, width: 14, height: 26, rx: 6, fill: '#c9a14a' }, g); shade('M23 7.5Q27 9 27 13V27Q27 31 23 32.5Z', g);
    shape('circle', { cx: 20, cy: 16.5, r: 3.2, fill: INK }, g); shape('path', { d: 'M18.6 18.5L17.6 26H22.4L21.4 18.5Z', fill: INK }, g);
  },
  // The rocking blotter from the drawer: blotting paper under a wooden top and its knob.
  blotter(g) {
    shape('path', { d: 'M5 25Q20 34 35 25V22Q20 31 5 22Z', fill: PALE }, g);
    shape('path', { d: 'M8 21Q20 28 32 21V17Q20 24 8 17Z', fill: WOOD }, g);
    shape('rect', { x: 18.6, y: 13, width: 2.8, height: 7, fill: WOOD_DARK }, g); shape('circle', { cx: 20, cy: 12, r: 3.4, fill: WOOD_DARK }, g);
  },
  // The music box: a wooden box with a heart on it, its lid up behind and its key at the side.
  musicbox(g) {
    shape('path', { d: 'M8 15L11 8H29L32 15Z', fill: WOOD_DARK }, g);
    shape('rect', { x: 7, y: 15, width: 26, height: 17, rx: 1.5, fill: WOOD }, g); shade('M27 15H33V32H27Z', g);
    shape('rect', { x: 7, y: 15, width: 26, height: 3, fill: GOLD_DARK }, g);
    shape('path', { d: 'M20 29C14 25 15 21 17.5 21 19 21 20 22.5 20 22.5S21 21 22.5 21C25 21 26 25 20 29Z', fill: RED }, g);
    line('M33 24H36.5M36.5 21.5V26.5', GOLD_DARK, g, 1.6);
  },
  // Four gold bookmarks risen out of the music box.
  bookmarks(g) {
    [10, 16.5, 23, 29.5].forEach((x, i) => { const top = 5 + (i % 2) * 3; shape('path', { d: `M${x - 2.4} ${top}L${x} ${top + 2.2}L${x + 2.4} ${top}V30H${x - 2.4}Z`, fill: i % 2 ? GOLD_DARK : GOLD }, g); });
    shape('rect', { x: 5, y: 27, width: 30, height: 8, rx: 1.5, fill: WOOD }, g); shade('M29 27H35V35H29Z', g);
  },
  // The snow globe: the old village in the glass, on a wooden base.
  globe(g) {
    shape('circle', { cx: 20, cy: 18, r: 12.5, fill: '#dfeef3' }, g);
    shape('path', { d: 'M8 21C13 18 27 18 32 21 30 27 25 30.5 20 30.5S10 27 8 21Z', fill: SNOW }, g);
    shape('rect', { x: 16.5, y: 16, width: 7, height: 5, fill: '#e4d0b0' }, g); shape('path', { d: 'M15.5 16.5L20 12.5 24.5 16.5Z', fill: '#a8564c' }, g);
    line('M12.5 13A9 9 0 0 1 17 8.5', '#fffaf0', g, 1.3);
    shape('path', { d: 'M9 35L11 28.5H29L31 35Z', fill: WOOD_DARK }, g);
  },
  // Santa's rocking chair, the note left on its seat.
  chair(g) {
    line('M5 33Q19 38 35 31', WOOD_DARK, g, 2.6);
    line('M13 33L9 6M9 6Q13 4.5 15.5 8M12 23H29M27.5 23L29 33M10 14H25L27 23', WOOD, g, 2.6);
    shape('path', { d: 'M16 18.5L24 18 24.4 22 16.4 22.4Z', fill: SHEET, ...EDGE }, g);
  },
  // The letters on the desk: one in its envelope, a red stamp in the corner.
  letter(g) {
    shape('rect', { x: 5, y: 10, width: 30, height: 21, rx: 1.5, fill: SHEET, ...EDGE }, g); shade('M28 10H33.5Q35 10 35 11.5V29.5Q35 31 33.5 31H28Z', g);
    shape('rect', { x: 26, y: 13, width: 6, height: 7, fill: RED }, g); shape('rect', { x: 27.2, y: 14.2, width: 3.6, height: 4.6, fill: '#f3e3c3' }, g);
    line('M10 22H24M10 26.5H20', PENCIL, g, 1.4);
  },
  // The Christmas Eve route: a map folded in three, a red way across it and its stops.
  route(g) {
    shape('path', { d: 'M5 9L15 6 25 9 35 6V31L25 34 15 31 5 34Z', fill: SHEET, ...EDGE }, g);
    shape('path', { d: 'M15 6L25 9V34L15 31Z', fill: PALE }, g);
    line('M9 27C13 21 17 25 20 18S27 15 31 11', RED, g, 1.8);
    for (const [cx, cy] of [[9, 27], [20, 18], [31, 11]]) shape('circle', { cx, cy, r: 1.9, fill: RED_DARK }, g);
  },
  // A slice of lemon.
  lemon(g) {
    shape('circle', { cx: 20, cy: 20, r: 13, fill: '#e9c23e' }, g); shape('circle', { cx: 20, cy: 20, r: 10.5, fill: '#f8e49a' }, g);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(`M20 20L${(20 + Math.cos(a) * 10).toFixed(1)} ${(20 + Math.sin(a) * 10).toFixed(1)}`, '#ecc94b', g, 1.3); }
    shape('circle', { cx: 20, cy: 20, r: 1.6, fill: NOTE }, g);
  },
  // The blank slip in your row of the register, a faint lemon stain on it.
  slip(g) {
    shape('path', { d: 'M9 7L31 8.5 30 33 8 31.5Z', fill: SHEET, ...EDGE }, g);
    shape('circle', { cx: 23.5, cy: 24, r: 5.5, fill: '#f2d35b', opacity: .55 }, g);
  },
  // The name board: five tags on their hooks, each in its owner's colour.
  nameboard(g) {
    shape('rect', { x: 4, y: 7, width: 32, height: 9, rx: 1.5, fill: WOOD }, g);
    SUBSTITUTES.forEach(([, colour], i) => { const x = 8.5 + i * 5.75; line(`M${x} 13V19`, WOOD_DARK, g, 1); shape('rect', { x: x - 2.3, y: 19, width: 4.6, height: 9, rx: 1, fill: colour }, g); });
  },
  // The booklet: a page bound with red cloth down its spine.
  booklet(g) {
    shape('rect', { x: 9, y: 6, width: 23, height: 28, rx: 1, fill: SHEET, ...EDGE }, g); shade('M27 6H32V34H27Z', g);
    shape('rect', { x: 8, y: 6, width: 5.5, height: 28, rx: 1, fill: RED }, g);
    line('M17 12H28M17 17H27M17 22H28M17 27H24', PENCIL, g, 1.3);
  },
  // The register: a leather cover with a gold line, the end of a red ribbon over its top.
  ledger(g) {
    shape('rect', { x: 8, y: 6, width: 24, height: 28, rx: 2, fill: '#6b3f2e' }, g);
    shape('rect', { x: 11, y: 9, width: 18, height: 22, rx: 1, fill: 'none', stroke: GOLD, 'stroke-width': 1.2 }, g);
    shape('path', { d: 'M25 3H28.5V12L26.75 10.2 25 12Z', fill: RED }, g);
  },
  // The sorting rack: four pigeonholes, a letter in two of them.
  rack(g) {
    shape('rect', { x: 5, y: 7, width: 30, height: 27, rx: 1.5, fill: WOOD }, g);
    for (const [x, y] of [[8, 10], [21, 10], [8, 22], [21, 22]]) shape('rect', { x, y, width: 11, height: 9, fill: WOOD_DARK }, g);
    shape('rect', { x: 9.5, y: 13, width: 8, height: 6, fill: SHEET }, g); shape('rect', { x: 22.5, y: 25, width: 8, height: 6, fill: '#fde6c0' }, g);
  },
  // An old instant photo of a dressed-up snowman.
  photo(g) {
    const p = shape('g', { transform: 'rotate(-6 20 20)' }, g);
    shape('rect', { x: 9, y: 5, width: 22, height: 28, rx: 1, fill: SHEET, ...EDGE }, p); shape('rect', { x: 11, y: 7, width: 18, height: 18, fill: '#cfe0ea' }, p);
    shape('circle', { cx: 20, cy: 20.5, r: 4.6, fill: SNOW }, p); shape('circle', { cx: 20, cy: 14, r: 3.3, fill: SNOW }, p);
    shape('rect', { x: 17.5, y: 8.2, width: 5, height: 3.4, fill: INK }, p); line('M16.5 16.8H23.5', RED, p, 1.6);
  },
  // The smallest Santa hat: its white trim and its bobble.
  hat(g) {
    shape('path', { d: 'M8 29C9 18 17 8 27 9 31 9.5 33 13 31.5 17 29 15 26 16 25 19 24 22 26 26 28 29Z', fill: RED }, g);
    shape('rect', { x: 5, y: 27, width: 27, height: 7, rx: 3.5, fill: SNOW }, g); shape('circle', { cx: 31.5, cy: 18, r: 3.6, fill: SNOW }, g);
  },
  // The old record, tied shut with red cord.
  record(g) {
    shape('rect', { x: 7, y: 30, width: 26, height: 3, fill: PALE }, g);
    shape('rect', { x: 6, y: 8, width: 28, height: 23, rx: 2, fill: '#8a5a3c' }, g);
    line('M6 19.5H34M20 8V31', RED, g, 2.2); shape('circle', { cx: 20, cy: 19.5, r: 2.6, fill: RED_DARK }, g);
    line('M20 19.5L16 25M20 19.5L24 25', RED, g, 1.6);
  },
};
// A gift's card: the ornament it came with.
for (const [mark] of SUBSTITUTES) CLUE_ART[`gift-${mark}`] = g => ornament(mark, shape('g', { transform: 'translate(6 1) scale(.28)' }, g));

// The picture on each clue's sticker.
export const CLUE_ICON = {
  'care-note': 'parcel', 'repair-tag': 'tag', 'barn-note': 'note', 'care-log': 'hay', 'feed-table': 'feed', 'wish-board': 'board',
  'letter-hearth': 'hearth', 'desk-lock': 'keyhole', blotter: 'blotter', 'music-lid': 'musicbox', 'music-bookmarks': 'bookmarks', 'music-catch': 'musicbox', 'music-drawer': 'musicbox',
  'globe-village': 'globe', 'globe-base': 'globe', 'chair-note': 'chair', 'letter-backs': 'letter', route: 'route', 'route-note': 'route', 'lemon-note': 'lemon',
  tags: 'nameboard', duty: 'booklet', 'register-years': 'ledger', rules: 'booklet', 'rack-rule': 'rack', 'snowman-photo': 'photo', 'hat-2003': 'hat', 'blank-slip': 'slip', 'old-record': 'record',
  ...Object.fromEntries(SUBSTITUTES.map(([mark]) => [`gift-${mark}`, `gift-${mark}`])),
};

// The picture by the goal on the "now" page, one for each goal (data/cabin-clues.js GOALS).
export const GOAL_ART = {
  // The mailbox by the gate, snow on its back and its flag up.
  yard(g) {
    shape('rect', { x: 18.5, y: 23, width: 3, height: 14, fill: WOOD_DARK }, g);
    shape('path', { d: 'M7 24V15C7 10 11 7 16 7H24C29 7 33 10 33 15V24Z', fill: RED }, g); shade('M27 7.8C31 9 33 12 33 15V24H27Z', g);
    shape('path', { d: 'M8 12C10 7.5 13 6.5 16 6.5H24C28.5 6.5 31.5 8.5 32.5 12 28 10 24 11 20 10S12 10 8 12Z', fill: SNOW }, g);
    shape('path', { d: 'M10 24V15.5C10 12 12 10.5 15 10.5', fill: 'none', stroke: RED_DARK, 'stroke-width': 1.3 }, g);
    line('M34.5 21V5', WOOD_DARK, g, 1.6); shape('path', { d: 'M34.5 5H39V9.5H34.5Z', fill: GOLD }, g);
  },
  // The cabin, its windows lit.
  room(g) { roofHouse(g, 20, 37, 26, 18); },
  // The bookcase, its four gaps waiting for the right books.
  bookcase(g) {
    shape('rect', { x: 6, y: 4, width: 28, height: 33, rx: 1.5, fill: WOOD }, g); shade('M28 4H32.5Q34 4 34 5.5V35.5Q34 37 32.5 37H28Z', g);
    for (const y of [7, 22]) shape('rect', { x: 8.5, y, width: 23, height: 12, fill: WOOD_DARK }, g);
    const row = (floor, books) => books.forEach(([x, height, fill]) => shape('rect', { x, y: floor - height, width: 2.6, height, fill }, g));
    row(19, [[9.2, 9.5, RED], [12.2, 10.5, '#3f6653'], [15.2, 8.5, GOLD], [22, 9.5, '#7b95a6'], [25, 10.5, RED_DARK], [28, 9, '#6e4a6b']]);
    row(34, [[9.2, 10, GOLD], [15.6, 9, '#3f6653'], [18.6, 10.5, RED], [21.6, 8.5, '#7b95a6'], [28.4, 9.5, GOLD_DARK]]);
  },
  // The shift log on its clipboard, a water stain spreading on it.
  log(g) {
    shape('rect', { x: 8, y: 6, width: 24, height: 31, rx: 2, fill: '#c9a46a' }, g);
    shape('rect', { x: 10.5, y: 9.5, width: 19, height: 25, fill: SHEET, ...EDGE }, g);
    line('M10.5 15.5H29.5M10.5 21.5H29.5M10.5 27.5H29.5M20 9.5V34.5', '#d6c3a0', g, 1);
    shape('path', { d: 'M19 24C21 19 28 19 29 23 31 27 28 32 23 31 18 31 17 27 19 24Z', fill: '#9dbfd0', opacity: .55 }, g);
    shape('rect', { x: 15, y: 3.5, width: 10, height: 5, rx: 1.5, fill: '#a9b4bc' }, g);
  },
  // Santa, back home.
  secret(g) {
    shape('circle', { cx: 20, cy: 20, r: 7.5, fill: '#f2c9a8' }, g);
    shape('path', { d: 'M9 21C8 31 14 37 20 37S32 31 31 21C28 25 24 26.5 20 26.5S12 25 9 21Z', fill: SNOW }, g);
    shape('path', { d: 'M8 15C9 6 17 2 25 4 30 5 33 9 33 13L29 12C27 9 24 9 22 10Z', fill: RED }, g);
    shape('rect', { x: 7, y: 13, width: 26, height: 5, rx: 2.5, fill: SNOW }, g); shape('circle', { cx: 33, cy: 13, r: 3, fill: SNOW }, g);
    for (const x of [17, 23]) shape('circle', { cx: x, cy: 20.5, r: 1.2, fill: INK }, g);
    shape('path', { d: 'M14 25C16 23 18.5 24 20 26 21.5 24 24 23 26 25 24 28 16 28 14 25Z', fill: SNOW }, g); shape('circle', { cx: 20, cy: 23.5, r: 2, fill: '#e07a6a' }, g);
  },
  // The register open at the empty box at the bottom, a pen ready.
  join(g) {
    shape('path', { d: 'M3 10L20 12 37 10V33L20 35 3 33Z', fill: SHEET, ...EDGE }, g); line('M20 12V35', '#d6c3a0', g, 1);
    line('M7 17H16M7 21.5H16M7 26H16M24 17H33M24 21.5H33', PENCIL, g, 1.2);
    shape('rect', { x: 24, y: 24.5, width: 9, height: 4.5, fill: 'none', stroke: RED, 'stroke-width': 1.1 }, g);
    line('M27 33L37 21', INK, g, 1.8);
  },
  // The substitute's work: a stamp with a gold star, as the register gives for each job.
  jobs(g) {
    shape('path', { d: perforated(8, 5, 32, 35, 4, 1.2), fill: SHEET, ...EDGE }, g);
    shape('rect', { x: 11, y: 8, width: 18, height: 24, fill: 'none', stroke: RED, 'stroke-width': 1.2 }, g);
    star(g, 20, 20, 7.5);
  },
  // The old record, tied shut with red cord.
  cord(g) { CLUE_ART.record(g); },
  // The old record lying open, its cord loose.
  reread(g) {
    shape('path', { d: 'M3 12Q11 9 20 12Q29 9 37 12V32Q29 29 20 32Q11 29 3 32Z', fill: SHEET, ...EDGE }, g); line('M20 12V32', '#d6c3a0', g, 1);
    line('M7 16Q12 15 17 16M7 20Q12 19 17 20M7 24Q12 23 15 24M23 16Q28 15 33 16M23 20Q28 19 33 20', PENCIL, g, 1.1);
    line('M20 32Q17 36 12 37M20 32Q24 36 29 36', RED, g, 1.6);
  },
  // Three stamps' worth: three gold stars.
  wish(g) { star(g, 10.5, 25, 7); star(g, 20, 14, 9); star(g, 29.5, 25, 7); },
  // The signpost in the yard, pointing two ways.
  endings(g) {
    shape('rect', { x: 18.5, y: 7, width: 3, height: 29, fill: WOOD_DARK }, g);
    shape('path', { d: 'M7 9H30L34 13 30 17H7Z', fill: WOOD }, g); shape('path', { d: 'M33 20H10L6 24 10 28H33Z', fill: '#b08d5c' }, g);
    shape('path', { d: 'M12 37Q20 33 28 37Z', fill: SNOW }, g);
  },
  // All of it seen: the tree trimmed, a star on top.
  done(g) {
    snowyFir(g, 20, 38, 30, 0, .72);
    for (const [cx, cy, fill] of [[15.5, 25, RED], [24.5, 29, GOLD], [19, 33, '#9dbfd0'], [22, 20, RED]]) shape('circle', { cx, cy, r: 1.6, fill }, g);
    star(g, 20, 8, 5);
  },
};

const images = new Map();
let count = 0;
// A picture as a background image, cut the first time it is wanted and kept.
function picture(key, draw, size) {
  if (!images.has(key)) {
    const svg = shape('svg', { viewBox: '0 0 40 40', width: size, height: size });
    draw(shape('g', { filter: paperFilter(svg, `clue-art-${++count}`, { scale: .25, grain: .4, shadow: .3 }) }, svg));
    images.set(key, `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`);
  }
  return images.get(key);
}
export const clueIcon = name => picture(name, CLUE_ART[name], 80);
export const goalPicture = goal => picture(`goal-${goal}`, GOAL_ART[goal], 160);
