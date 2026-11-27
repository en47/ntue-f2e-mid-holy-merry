// The coloring workshop's four pages (components/vending-coloring.js), one for each thing the vending machine sells: each a
// little scene, upright, drawn in the drawing's own 300 × 360 box. `parts` are the regions to colour, bottom to top (a
// later one lies over an earlier one, so a tap fills what shows); `ink` the lines that are not coloured (eyes, twigs,
// bricks, snowflakes); `colours` the page coloured in, one crayon for each part, in order (the 經典 swatch card).
// Every colour is one of the crayons in data/vending.js.
const R = '#b03f37', PINE = '#3f6653', CREAM = '#f4ead3', GOLD = '#e2b65a', SNOW = '#fbfaf5', COCOA = '#7a5238', PINK = '#e2aaa3', BLUE = '#9fbdd2', SAGE = '#9db59a', CARAMEL = '#b97c4a', NIGHT = '#4a5f80', CHAR = '#4a4245';
const f = n => +n.toFixed(1);
const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
// A ring: the inner circle runs the other way round, so it is left open.
const ring = (cx, cy, outer, inner) => `${circle(cx, cy, outer)}M${f(cx - inner)} ${f(cy)}a${f(inner)} ${f(inner)} 0 1 1 ${f(inner * 2)} 0a${f(inner)} ${f(inner)} 0 1 1 ${f(-inner * 2)} 0Z`;
const rect = (x, y, w, h) => `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
const star = (cx, cy, outer, inner) => `M${Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? inner : outer; return `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`; }).join('L')}Z`;
// A snowflake in ink: three strokes crossing, `r` long each way.
const flake = (cx, cy, r) => [0, 60, 120].map(a => { const c = Math.cos(a * Math.PI / 180) * r, s = Math.sin(a * Math.PI / 180) * r; return `M${f(cx - c)} ${f(cy - s)}L${f(cx + c)} ${f(cy + s)}`; }).join('');
// A small pine: two tiers and a trunk, its foot at (x, base), `h` tall.
const pine = (x, base, h) => `M${f(x)} ${f(base - h)}L${f(x + h * .32)} ${f(base - h * .52)}H${f(x + h * .18)}L${f(x + h * .4)} ${f(base - h * .14)}H${f(x - h * .4)}L${f(x - h * .18)} ${f(base - h * .52)}H${f(x - h * .32)}Z`;
// A path drawn for another box, moved: every number pair of its absolute commands (M, L, C, Q only: no H, V or relative
// ones) scaled by `s` and moved.
const move = (d, s, dx, dy) => { let i = 0; return d.replace(/-?\d+(\.\d+)?/g, n => f(i++ % 2 ? +n * s + dy : +n * s + dx)); };

// The gingerbread man of the machine's own button, smaller, in front of his gingerbread house.
const MAN = 'M150 30C178 30 196 52 196 78C196 96 188 110 176 118C196 120 222 124 244 132C262 138 264 166 244 170C222 174 202 168 186 166L190 214C204 240 222 270 232 296C240 318 216 332 202 316C186 296 170 270 150 252C130 270 114 296 98 316C84 332 60 318 68 296C78 270 96 240 110 214L114 166C98 168 78 174 56 170C36 166 38 138 56 132C78 124 104 120 124 118C112 110 104 96 104 78C104 52 122 30 150 30Z';
const man = (d, s = .66) => move(d, s, 6, 128);
const manAt = (x, y, s = .66) => [f(x * s + 6), f(y * s + 128)];

export const PAGES = {
  snowman: {
    parts: [
      'M0 0H300V230Q222 214 150 226T0 228Z', 'M0 228Q80 204 160 220T300 210V262H0Z', 'M0 260Q150 238 300 256V360H0Z',
      circle(246, 50, 20), star(52, 44, 10, 4.5), star(112, 24, 7, 3), star(196, 30, 8, 3.5),
      pine(40, 214, 84), rect(34, 212, 12, 14), pine(260, 220, 72), rect(254, 218, 12, 12),
      'M122 26H178V80H122Z', 'M122 60H178V74H122Z', circle(150, 282, 62), circle(150, 190, 46), circle(150, 112, 36),
      'M108 78H192Q198 78 198 84V86Q198 92 192 92H108Q102 92 102 86V84Q102 78 108 78Z',
      'M110 144Q150 160 190 144L192 160Q150 178 108 160Z', 'M168 158L182 206L166 210L154 166Z',
      'M150 112L186 120L150 126Z', circle(150, 176, 6), circle(150, 198, 6), circle(150, 220, 6),
      'M80 166Q64 158 62 172Q60 186 74 188Q86 188 86 176Z', 'M220 166Q236 158 238 172Q240 186 226 188Q214 188 214 176Z',
      'M204 302H254V342H204Z', 'M224 302H234V342H224Z', 'M200 292H258V304H200Z',
    ],
    ink: [circle(138, 104, 4), circle(162, 104, 4), 'M136 132Q150 140 164 132', 'M106 186L84 176M96 182L88 170', 'M194 186L216 176M204 182L212 170', flake(82, 92, 9), flake(226, 118, 7), flake(28, 150, 6), flake(276, 170, 6), 'M212 330H246'],
    colours: [BLUE, SNOW, CREAM, GOLD, GOLD, GOLD, GOLD, PINE, COCOA, SAGE, COCOA, CHAR, R, SNOW, SNOW, SNOW, CHAR, R, R, CARAMEL, CHAR, CHAR, CHAR, PINE, PINE, R, GOLD, R],
  },
  gingerbread: {
    parts: [
      'M0 0H300V236Q150 224 0 238Z', 'M0 236Q150 222 300 236V360H0Z',
      rect(252, 62, 18, 40), 'M154 124H284V240H154Z', 'M140 128L218 60L296 128Z', 'M140 128L218 60L296 128L286 138L218 78L150 138Z',
      circle(184, 96, 7), circle(218, 84, 7), circle(252, 98, 7),
      'M204 240V200Q218 184 232 200V240Z', circle(178, 172, 13), rect(246, 160, 26, 26),
      'M30 336V172Q30 146 54 146Q78 146 78 170H66Q66 158 54 158Q42 158 42 172V336Z',
      man(MAN), circle(...manAt(128, 90), 5.2), circle(...manAt(172, 90), 5.2),
      man('M150 140L124 126L124 154Z'), man('M150 140L176 126L176 154Z'), circle(...manAt(150, 140), 4.6),
      circle(...manAt(150, 178), 5.2), circle(...manAt(150, 206), 5.2), circle(...manAt(150, 234), 5.2),
      star(40, 40, 10, 4.5), star(112, 22, 7, 3), star(150, 56, 6, 2.6),
    ],
    ink: [circle(...manAt(134, 72), 3), circle(...manAt(166, 72), 3), man('M134 96Q150 110 166 96'), man('M58 150L65 142L72 150L79 142'), man('M222 150L229 142L236 150L243 142'), man('M84 306L91 298L98 306'), man('M202 306L209 298L216 306'),
      'M30 196L42 184M30 228L42 216M30 260L42 248M30 292L42 280M34 156L46 150M60 148L66 160', 'M154 204H180M246 173H272M259 160V186M178 159V185M165 172H191', flake(266, 30, 8), flake(84, 70, 6), flake(18, 104, 6)],
    colours: [BLUE, SNOW, COCOA, CARAMEL, COCOA, SNOW, R, PINE, GOLD, R, GOLD, GOLD, SNOW, CARAMEL, PINK, PINK, R, R, R, SNOW, SNOW, SNOW, GOLD, GOLD, GOLD],
  },
  tree: {
    parts: [
      'M0 0H300V296H0Z', 'M0 296H300V360H0Z', rect(18, 30, 52, 62), rect(232, 40, 50, 50),
      'M150 196L272 300H28Z', 'M150 124L248 224H52Z', 'M150 62L222 152H78Z', 'M136 298H164V318H136Z', star(150, 50, 24, 10),
      circle(126, 120, 8), circle(176, 130, 8), circle(108, 188, 9), circle(196, 178, 9), circle(150, 206, 9), circle(78, 268, 10), circle(150, 262, 10), circle(222, 268, 10),
      'M40 302H96V346H40Z', 'M64 302H72V346H64Z', 'M36 292H100V304H36Z',
      'M198 314H246V350H198Z', 'M218 314H226V350H218Z',
      'M112 324H150V352H112Z', 'M127 324H135V352H127Z',
    ],
    ink: ['M90 150Q150 174 210 150', 'M70 222Q150 252 230 222', 'M44 92L44 30M18 61H70', 'M257 40V90M232 65H282', 'M0 296H300', 'M106 66l6-6 6 6M188 66l6-6 6 6'],
    colours: [CREAM, CARAMEL, NIGHT, NIGHT, PINE, SAGE, PINE, COCOA, GOLD, R, GOLD, BLUE, R, GOLD, R, BLUE, GOLD, R, GOLD, R, PINE, R, BLUE, SNOW],
  },
  stocking: {
    parts: [
      'M0 0H300V360H0Z', ring(150, 64, 32, 20), 'M150 92L132 104L136 86Z', 'M150 92L168 104L164 86Z',
      'M30 150H270V342H30Z', 'M92 342V262Q150 212 208 262V342Z', 'M104 322H196V340H104Z',
      'M150 318Q116 292 134 262Q140 284 150 276Q146 252 166 238Q160 268 178 278Q188 298 150 318Z', 'M150 316Q134 300 146 286Q150 298 157 292Q166 304 150 316Z',
      'M16 130H284V154H16Z', 'M16 342H284V360H16Z',
      rect(42, 100, 12, 30), 'M48 88Q42 96 48 100Q54 96 48 88Z', rect(246, 100, 12, 30), 'M252 88Q246 96 252 100Q258 96 252 88Z',
      ...[48, 132, 216].flatMap(x => [
        `M${x} 160H${x + 36}V208C${x + 50} 210 ${x + 60} 216 ${x + 60} 228C${x + 60} 242 ${x + 48} 248 ${x + 34} 248H${x + 16}C${x + 6} 248 ${x} 240 ${x} 228Z`,
        `M${x + 34} 248C${x + 48} 248 ${x + 60} 242 ${x + 60} 228C${x + 60} 220 ${x + 56} 214 ${x + 50} 211C${x + 48} 226 ${x + 44} 240 ${x + 34} 248Z`,
        rect(x - 4, 148, 44, 18),
      ]),
      circle(118, 136, 5), circle(150, 134, 5), circle(182, 136, 5),
    ],
    ink: ['M30 186H92M208 186H270M30 222H92M208 222H270M30 258H92M208 258H270M30 294H92M208 294H270', 'M60 154V186M246 154V186M76 186V222M230 186V222M60 222V258M246 222V258M76 258V294M230 258V294M60 294V342M246 294V342', 'M100 141Q114 128 128 141M172 141Q186 128 200 141', 'M54 184L60 178L66 184M138 184L144 178L150 184M222 184L228 178L234 184'],
    colours: [CREAM, PINE, R, R, CARAMEL, CHAR, COCOA, GOLD, R, COCOA, COCOA, SNOW, GOLD, SNOW, GOLD, R, SNOW, SNOW, PINE, SNOW, SNOW, R, R, SNOW, R, R, R],
  },
};
