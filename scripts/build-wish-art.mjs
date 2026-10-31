// 產生 Wish 頁的 SVG 素材（信封、折好的信、聖誕襪）與 js/data/envelope-shapes.js。執行：node scripts/build-wish-art.mjs
import fs from 'node:fs/promises';

const DIR = 'assets/illustrations/wish', W = 1024, H = 680;
const grain = (scale = 1) => `<filter id="p" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="${.035 / scale}" numOctaves="2" seed="4" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="${4 * scale}" result="c"/><feMorphology in="c" operator="dilate" radius="${2 * scale}" result="e"/><feFlood flood-color="#f6ecda"/><feComposite in2="e" operator="in" result="r"/><feTurbulence type="fractalNoise" baseFrequency="${.85 / scale} ${.55 / scale}" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 .96 0 0 0 0 .86 0 0 0 .6 -.3"/><feComposite in2="c" operator="in" result="g"/><feMerge><feMergeNode in="r"/><feMergeNode in="c"/><feMergeNode in="g"/></feMerge></filter>`;
const svg = (w, h, body, filter = grain()) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${filter}</defs><g filter="url(#p)">${body}</g></svg>\n`;
const starPath = (x, y, size) => `M${Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? size * .45 : size; return `${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`; }).join('L')}Z`;

// Envelope: 3D geometry reuses these outlines, so paper edge, flap and seal line up with the print.
const [L, T, R, B] = [40, 60, 984, 620], RADIUS = 36;
const round = Array.from({ length: 4 }, (_, corner) => Array.from({ length: 6 }, (_, step) => {
  const a = (corner + step / 5) * Math.PI / 2, cx = corner === 0 || corner === 3 ? R - RADIUS : L + RADIUS, cy = corner < 2 ? B - RADIUS : T + RADIUS;
  return [Math.round(cx + Math.cos(a) * RADIUS), Math.round(cy + Math.sin(a) * RADIUS)];
})).flat();
const outline = round.map(p => p.join(' ')).join('L');
const flap = [[60, 84], [964, 84], [512, 372]], seal = { center: [512, 352], radius: 62 };
const stripes = (a, b) => Array.from({ length: 36 }, (_, i) => {
  const t = i / 36, s = 1 / 72, edge = u => u < .5 ? [L + 22 + (R - L - 44) * u * 2, T + 22] : [R - 22 - (R - L - 44) * (u - .5) * 2, B - 22];
  const [x1, y1] = edge(t), [x2, y2] = edge(t + s);
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${i % 2 ? a : b}" stroke-width="30"/>`;
}).join('');
function envelope({ paper, inner, fold, sealFill, sealMark, trim }) {
  return svg(W, H, `<path d="M${outline}Z" fill="${paper}"/>${trim}
<path d="M${L + 30} ${B - 44}L440 330M${R - 30} ${B - 44}L584 330" stroke="${inner}" stroke-width="6" fill="none"/>
<path d="M${flap.map(p => p.join(' ')).join('L')}Z" fill="${fold}"/>
<circle cx="${seal.center[0]}" cy="${seal.center[1]}" r="${seal.radius}" fill="${sealFill}"/><circle cx="${seal.center[0]}" cy="${seal.center[1]}" r="46" fill="none" stroke="#fff3dc" stroke-opacity=".5" stroke-width="5"/>
<path d="${starPath(seal.center[0], seal.center[1], 30)}" fill="${sealMark}"/>`);
}
const normal = envelope({ paper: '#f7e7c6', inner: '#d9bf92', fold: '#ecd6ab', sealFill: '#a84a42', sealMark: '#efc9b4', trim: stripes('#a84a42', '#4f7d68') });
const gold = envelope({ paper: '#ecc878', inner: '#cda04f', fold: '#e2b75f', sealFill: '#a84a42', sealMark: '#f6dc98', trim: `<path d="${starPath(150, 545, 28)}${starPath(874, 545, 28)}${starPath(260, 570, 15)}${starPath(764, 570, 15)}" fill="#fbecc4"/>` });

// A letter folded in three, the shape that drops into the stocking.
const folded = svg(600, 220, `<path d="M16 16H584V204H16Z" fill="#fbf1dd"/><path d="M16 16H584V112C400 122 200 104 16 112Z" fill="#f2e2c4"/><path d="M16 112C200 104 400 122 584 112" stroke="#d9c5a2" stroke-width="3" fill="none"/>`);

// The hook post and stocking share one coordinate box, so they stack exactly.
const SW = 240, SH = 340, soft = grain(.7);
const post = svg(SW, SH, `<path d="M22 332C50 304 120 300 170 310S224 318 234 332Z" fill="#e6edf3"/><path d="M34 320L40 58C42 18 96 8 134 20 156 28 164 44 156 58L142 54C146 40 134 34 118 32 84 26 58 34 56 60L52 320Z" fill="#8c6a4e"/><path d="M38 50C48 14 100 6 136 18 146 22 152 28 156 34 128 28 92 22 64 38 54 42 44 48 38 50Z" fill="#e6edf3"/><path d="M148 52V76" stroke="#a84a42" stroke-width="5"/>`, soft);
const body = 'M112 104V196C112 214 100 224 88 236 64 258 72 298 112 304 142 308 176 302 190 280 198 266 196 248 190 238V104Z';
const sock = svg(SW, SH, `<path d="M104 88H198V110H104Z" fill="#6f2f2a"/><path d="${body}" fill="#a84a42"/><path d="M92 234C74 252 74 290 112 302 118 280 112 250 92 234Z" fill="#f6ecda"/><path d="M190 240C196 262 192 284 170 298 152 290 150 256 190 240Z" fill="#f6ecda"/>
<path d="M114 148H190M114 176H190" stroke="#4f7d68" stroke-width="10"/><path d="${starPath(150, 222, 22)}" fill="#e6c068"/><circle cx="104" cy="272" r="4" fill="#d9c5a2"/><circle cx="178" cy="264" r="4" fill="#d9c5a2"/>`, soft);
const cuff = svg(SW, SH, `<path d="M96 84C126 74 176 74 206 84 212 96 212 112 206 122 176 132 126 132 96 122 90 112 90 96 96 84Z" fill="#f6ecda"/><path d="M104 104C136 112 168 112 198 104" stroke="#d9c5a2" stroke-width="3" fill="none"/>`, soft);

const shapes = {
  normal: { file: 'envelope-paper.svg', sourceSize: [W, H], bounds: [L, T, R, B], anchor: [512, T + 8], outline: round, holes: [], flap, seal, paperPatch: [110, 430, 240, 130] },
  gold: { file: 'envelope-paper-star.svg', sourceSize: [W, H], bounds: [L, T, R, B], anchor: [512, T + 8], outline: round, holes: [], flap, seal, paperPatch: [340, 440, 340, 100] },
};
for (const [file, content] of [['envelope-paper.svg', normal], ['envelope-paper-star.svg', gold], ['letter-folded.svg', folded], ['stocking-post.svg', post], ['stocking-sock.svg', sock], ['stocking-cuff.svg', cuff]]) await fs.writeFile(`${DIR}/${file}`, content);
await fs.writeFile('js/data/envelope-shapes.js', `// 由 scripts/build-wish-art.mjs 產生，請勿手改。\nexport const envelopeShapes = ${JSON.stringify(shapes)};\n`);
