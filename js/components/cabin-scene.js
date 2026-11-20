// Santa's Cabin in Three.js: a closed paper cottage in the middle of a snowy Christmas village. Outside, the visitor stands
// still and turns on the spot: a fair and a wishing corner to the left, a winter coast to the right, a ski mountain behind.
// Tapping the house walks the camera up to the front door and through it; inside, the view turns all the way round.
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { BOARDS, BOOKCASE, BOOKMARKS, BOOK_SHEETS, CHAIR, DESK, DOOR, DRAWERS, GLOBE, MAIL_FLAG, MUSICBOX, SECRET, FIRE, GROUND, HOIST, WINCH, HOUSE, INSIDE, LANTERN, LETTER_BOOKS, PLAIN_BOOKS, REINDEER, ROOM_PROPS, ROOM_RIGS, ROOM_SPOTS, SHELF_LAYOUT, SIGN, SPOTS, PX, adventLit, drawerPieces } from './cabin-art.js';
import { BALLOONS, COASTER, CAROUSEL, FLOATS, LIFT, LIGHTHOUSE, POND, PROPS, RIGS, RUNS, SHORE, TRACK, WHEEL, WORLD } from './cabin-world.js';
import { PLACES, itemFor } from './cabin-wardrobe.js';
import { PIECES, cutBoard, cutSet, outfitBoard } from './cabin-paint.js';
import { createHeadTracker } from './santa-head.js';

// Head turns stay small and are shared with the neck: larger angles crease the beard (see docs/SANTA-CABIN.md).
const HEAD = { maxYaw: .24, maxPitch: .1 };
// The snow is the footer's own colour, so the page runs on into it; far away it fades into the morning haze.
const RETURN_AFTER = 1600, PAPER_EDGE = 0xefe1c4, STONE = 0xd9d1c3, SNOWFIELD = 0xfff9eb, HAZE = 0xf3e7dd, SEA = 0x7fa6bf;
// Where each view stands and looks. `heading` turns the view left, `pitch` tips it down (radians). Outside, the eye stands
// in the same spot on every screen, so the fair and the coast lie the same way round on a phone as on a desktop; a narrow
// screen gets a wider lens instead (`span` is the least it must see across, between `fov` and `tallFov`), and looks a touch
// left to keep the name sign in. It may turn a quarter circle either way. Inside, it stands a few steps in from the door and
// turns all the way round, up to the rafters and down to the rug.
const VIEWS = {
  outside: { eye: [0, 2.2, 11.5], heading: 0, tallHeading: .12, pitch: .05, span: 56, fov: 36, tallFov: 76, turn: Math.PI / 2, minPitch: -.12, maxPitch: .3 },
  inside: { eye: INSIDE.eye, heading: INSIDE.heading, tallHeading: INSIDE.tallHeading, pitch: INSIDE.pitch, tallPitch: INSIDE.tallPitch, span: 92, fov: 58, tallFov: 80, turn: Infinity, minPitch: -1.1, maxPitch: 1.1 },
};
// Each corner of the yard is a view of its own: the camera steps up to it and holds still while you play there. `aside`
// moves the subject left of centre on a wide screen, to leave room for the tray of things to play with on the right.
for (const spot of SPOTS) {
  const { target, distance, pitch, yaw, aside = 0, tallDrop = 0, tallDistance = distance * 1.35 } = spot.view;
  VIEWS[spot.id] = { target, distance, tallDistance, fov: 34, pitch, heading: yaw, aside, tallDrop, turn: 0, minPitch: pitch, maxPitch: pitch };
}
// The places in the room work the same way, close up; leaving one goes back to the middle of the room.
for (const spot of ROOM_SPOTS) {
  // `turn`/`tilt`: how far a place lets you look round (the little room behind the bookcase, too narrow to see whole).
  // `open`: where the bookcase is looked at from once it stands open (from the side, past it, into the doorway).
  // `glide`: a place past Santa's chair, turned toward first and walked up to after (`aim`).
  const { target, distance, pitch, yaw, tallDistance = distance * 1.35, fov = 34, tallFov = fov, tallDrop = 0, turn = 0, tilt = 0, open, glide = false } = spot.view;
  VIEWS[spot.id] = { target, distance, tallDistance, fov, tallFov, pitch, heading: yaw, aside: 0, tallDrop, turn, minPitch: pitch - tilt, maxPitch: pitch + tilt, room: true, open, glide };
}
const indoorView = name => name === 'inside' || VIEWS[name]?.room === true;
const BACK_WALL = -HOUSE.depth / 2;
// Where the arrival starts: high over the village, off to the left, looking down at the house.
const ARRIVAL = { eye: [-9, 20, 26], heading: -.33, pitch: .63, fov: 44 };
const ease = u => u * u * (3 - 2 * u), between = (u, from, to) => ease(THREE.MathUtils.clamp((u - from) / (to - from), 0, 1));
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle)), lerp = THREE.MathUtils.lerp;
// Whether the first view from in front of the house takes in something standing at (x, z), `width` across. `sweep` is how
// far that view reaches to either side, [right, left], as headings (radians, positive to the left).
function inSight([right, left], x, z, width) {
  const [ex, , ez] = VIEWS.outside.eye, angle = Math.atan2(ex - x, ez - z), spread = Math.atan2(width / 2, Math.hypot(x - ex, z - ez));
  return angle + spread > right && angle - spread < left;
}
// The same for a board, wherever it or any copy stands. A painted skin (the sea, the carousel) shows its plain colour until
// its pattern comes, so it never holds the page up.
function boardInSight(board, sweep) {
  if (board.texture) return false;
  const at = board.rig ? RIGS[board.rig].at : board.at;
  const places = board.copies ? board.copies.map(([x, z, size]) => [x, z, size * board.w / board.h]) : [[at[0], at[2], board.w]];
  return places.some(([x, z, width]) => inSight(sweep, x, z, width));
}

// A cream copy of a board's silhouette, set just behind it, shows as the paper's cut edge when seen at an angle.
function edgeMaterial(texture) {
  const material = new THREE.MeshBasicMaterial({ color: PAPER_EDGE, map: texture, alphaTest: .4, toneMapped: false });
  material.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n\tdiffuseColor.a *= texture2D( map, vMapUv ).a;\n#endif'); };
  material.customProgramCacheKey = () => 'cabin-paper-edge';
  return material;
}
function radialTexture(stops, size = 128) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const context = canvas.getContext('2d'), gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, colour] of stops) gradient.addColorStop(at, colour);
  context.fillStyle = gradient; context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
// The lighthouse beam: bright at the lamp, fading along its length and softly to either side.
function beamTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
  const context = canvas.getContext('2d'), along = context.createLinearGradient(0, 0, 256, 0), across = context.createLinearGradient(0, 0, 0, 64);
  along.addColorStop(0, 'rgba(255,244,210,.9)'); along.addColorStop(1, 'rgba(255,244,210,0)');
  context.fillStyle = along; context.fillRect(0, 0, 256, 64);
  for (const [at, alpha] of [[0, 0], [.5, 1], [1, 0]]) across.addColorStop(at, `rgba(0,0,0,${alpha})`);
  context.globalCompositeOperation = 'destination-in'; context.fillStyle = across; context.fillRect(0, 0, 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

// Roof boards lie on the slope between the eave and the ridge; the inner face looks into the room, the outer one at the sky.
function roofFrame(side, layer) {
  const half = HOUSE.width / 2, rise = HOUSE.ridge - HOUSE.wall, sign = side === 'left' ? -1 : 1;
  const eave = new THREE.Vector3(sign * half, HOUSE.wall, 0), ridge = new THREE.Vector3(0, HOUSE.ridge, 0);
  const up = ridge.clone().sub(eave).normalize(), a = Math.abs(up.x), b = up.y;
  const inward = new THREE.Vector3(-sign * b, -a, 0), outward = inward.clone().negate();
  const normal = layer === 'inner' ? inward : outward, along = new THREE.Vector3().crossVectors(normal, up);
  const start = layer === 'inner' ? eave : eave.clone().addScaledVector(up, -HOUSE.eaves).addScaledVector(outward, HOUSE.roof);
  const end = layer === 'inner' ? ridge : ridge.clone().addScaledVector(outward, HOUSE.roof);
  return { up, outward, eave, start, end, quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(up, along, normal)), center: start.clone().add(end).multiplyScalar(.5) };
}

export async function mountCabin(stage, { onProgress = () => {}, onView = () => {}, onTouch = () => {}, isCurrent = () => true, fly = false } = {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), flying = fly && !motion.matches;
  // A desktop screen gets the scene as sharp as the page around it (up to 2×); phones stop at 1.5× to spare the battery.
  const sharpest = matchMedia('(pointer: fine)').matches ? 2 : 1.5;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'cabin-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true');
  const textures = new Set(), materials = new Set(), geometries = new Set(), models = [], events = new AbortController();
  const keep = (set, value) => { set.add(value); return value; };
  // All state lives up here: the head tracker can call wake() while the boards are still being cut.
  let view = 'outside', heading = 0, goalHeading = 0, pitch = VIEWS.outside.pitch, goalPitch = pitch, fov = VIEWS.outside.fov, goalFov = fov, ready = false, disposed = false;
  let frame, lastTick = 0, lastDraw = 0, clock = 0, inView = true, dragging = false, returnTimer = 0, settling = false, resize, visible;
  // A flick keeps turning a moment after the finger lifts; a trip is the walk through the front door, in or out. `away` is
  // where the visitor was looking outside, so coming back out faces the same way again.
  // `perched` holds the camera up at the start of the arrival until the loader has gone.
  let spin = 0, trip = null, pending = null, hovered = null, pointer = null, perched = false, away = { heading: 0, pitch: VIEWS.outside.pitch };
  // `roomIn` once the room's boards have come (just after the page opens); `choice` counts requests for a view.
  let roomIn = false, choice = 0, roomAway = null;
  const eye = new THREE.Vector3(0, 3.7, 8.6), goalEye = eye.clone(), look = new THREE.Vector3();

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 1, .05, 110);
  const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
  let environment;
  try { environment = pmrem.fromScene(room, .04); } finally { room.dispose(); pmrem.dispose(); }
  scene.environment = environment.texture; scene.environmentIntensity = .5;
  scene.fog = new THREE.Fog(HAZE, 16, 52);
  // Morning sun low in the upper left, as on every page; the snow bounces a cool light back up.
  scene.add(new THREE.HemisphereLight(0xeaf2f7, 0xd9e2ea, 1.05));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.5); sun.position.set(-6, 7, 5); scene.add(sun);
  const fire = new THREE.PointLight(0xff9a4a, 2.2, 3, 1.6); fire.position.set(FIRE.x, .45, FIRE.z + .55); scene.add(fire);
  const lanternLight = new THREE.PointLight(0xffd59a, 1.1, 3.6, 1.4); lanternLight.position.set(LANTERN.x, 2.2, LANTERN.z); scene.add(lanternLight);

  // Two groups: the room is always there (its closed walls hide it from outside); the village and the house's outer shell
  // are hidden once the visitor is indoors with the door shut, so nothing outside is drawn behind the walls.
  const world = new THREE.Group(), indoors = new THREE.Group(), chair = new THREE.Group();
  // The rocking chair is turned on the rug to face whoever walks in; it rocks about its own runners (yaw first, then rock).
  chair.position.set(CHAIR.x, 0, CHAIR.z); chair.rotation.order = 'YXZ'; chair.rotation.y = Math.atan2(INSIDE.eye[0] - CHAIR.x, INSIDE.eye[2] - CHAIR.z);
  indoors.add(chair); scene.add(world, indoors);
  const solid = (geometry, colour, position, parent = world) => {
    const mesh = new THREE.Mesh(keep(geometries, geometry), keep(materials, new THREE.MeshStandardMaterial({ color: colour, roughness: 1, metalness: 0 })));
    mesh.position.copy(position); parent.add(mesh); return mesh;
  };
  const flat = (colour, options = {}) => keep(materials, new THREE.MeshBasicMaterial({ color: colour, toneMapped: false, ...options }));

  // The snowfield, flat-coloured like the footer below; fog turns it to haze toward the hills.
  const field = new THREE.Mesh(keep(geometries, new THREE.CircleGeometry(70, 64)), flat(SNOWFIELD));
  field.rotation.x = -Math.PI / 2; field.position.y = GROUND; world.add(field);
  // The stone footing the cottage stands on and a wooden step up to the door. Faces that meet sit a hair apart: two faces in
  // exactly the same plane flicker as the camera turns.
  const gap = .004, front = HOUSE.depth / 2 + HOUSE.thick;
  solid(new THREE.BoxGeometry(HOUSE.width + HOUSE.thick * 2, -GROUND - gap, HOUSE.depth + HOUSE.thick * 2), STONE, new THREE.Vector3(0, (GROUND - gap) / 2, 0));
  solid(new THREE.BoxGeometry(DOOR.width + .44, -GROUND - gap, .38), 0xa86b47, new THREE.Vector3(0, (GROUND - gap) / 2, front + .19));
  for (const side of ['left', 'right']) {
    // The roof's front edge is a band of dark shingles with snow lying along its top.
    const roof = roofFrame(side, 'outer'), length = HOUSE.slope + HOUSE.eaves, angle = Math.atan2(roof.up.y, roof.up.x), edge = HOUSE.depth / 2 + HOUSE.overhang / 2 - gap;
    const cut = solid(new THREE.BoxGeometry(length, HOUSE.roof - gap * 2, HOUSE.overhang - gap), 0x4a3f3a, roof.center.clone().addScaledVector(roof.outward, -HOUSE.roof / 2).setZ(edge));
    cut.rotation.z = angle;
    const snow = solid(new THREE.BoxGeometry(length * .9, .03, .2), 0xfbf8f1, roof.center.clone().addScaledVector(roof.outward, .026).addScaledVector(roof.up, -.02).setZ(HOUSE.depth / 2 + HOUSE.overhang - .1));
    snow.rotation.z = angle;
  }
  // The doorway's reveal: thin jambs and a lintel close the gap between the wall's two paper faces.
  for (const sign of [-1, 1]) solid(new THREE.BoxGeometry(.03, DOOR.height, HOUSE.thick - gap * 2), 0x8f5a3c, new THREE.Vector3(sign * (DOOR.width / 2 + .015), DOOR.height / 2, DOOR.z), indoors);
  solid(new THREE.BoxGeometry(DOOR.width + .06, .03, HOUSE.thick - gap * 2), 0x8f5a3c, new THREE.Vector3(0, DOOR.height + .015, DOOR.z), indoors);
  // The iron bracket the name sign hangs from, fixed to the front-left corner of the house.
  const iron = 0x3b302a, armStart = -HOUSE.width / 2 - HOUSE.thick, armEnd = SIGN.x - SIGN.arm / 2;
  solid(new THREE.BoxGeometry(armStart - armEnd, .05, .05), iron, new THREE.Vector3((armStart + armEnd) / 2, SIGN.top + .02, SIGN.z + .03));
  const strut = solid(new THREE.BoxGeometry(.62, .04, .04), iron, new THREE.Vector3(armStart - .2, SIGN.top - .2, SIGN.z + .03)); strut.rotation.z = -.78;
  solid(new THREE.BoxGeometry(.34, .14, HOUSE.depth + HOUSE.overhang * 2), 0xfbf8f1, new THREE.Vector3(0, HOUSE.ridge + HOUSE.roof * 1.05, 0));
  // The chimney rises out of the right slope over the fireplace, capped with snow.
  solid(new THREE.BoxGeometry(.34, 1.1, .34), 0xc9bba6, new THREE.Vector3(FIRE.x, 2.72, FIRE.z));
  solid(new THREE.BoxGeometry(.42, .09, .42), 0xfbf8f1, new THREE.Vector3(FIRE.x, 3.3, FIRE.z));

  // Each view blends its lens and distance between portrait and landscape screens.
  const blend = () => THREE.MathUtils.clamp(((stage.clientWidth || 1) / (stage.clientHeight || 1) - .7) / .5, 0, 1);
  // Every board comes as a ready picture (cabin-paint.js) at a size the screen can show: phones get the smaller set.
  const set = cutSet(Math.min(1, Math.max(.5, stage.clientWidth * Math.min(devicePixelRatio || 1, 2) / 2000)));
  // What must be there before the page opens: the house, the yard and as much of the village as the first view takes in
  // (all of it when the visit opens with the flight over it). The room, Santa himself and the rest of the village follow
  // straight after, while the visitor looks round outside; nothing indoors can be seen from out there.
  // The first view's sweep is its lens's half-span either side of where it looks on this screen, with a little to spare: a
  // phone held upright sees a narrow slice, so even the reindeer, just off to the right, can come a moment later.
  const opening = goalFor('outside'), half = Math.atan(Math.tan(THREE.MathUtils.degToRad(opening.fov) / 2) * (stage.clientWidth || 1) / (stage.clientHeight || 1)) + .15;
  const sweep = [opening.heading - half, opening.heading + half], seen = board => flying || boardInSight(board, sweep);
  // The room's wall decorations (cabin-art.js DECOR) are only fetched the first time the visitor heads indoors (`furnish`):
  // someone who only walks round the yard never downloads them; the walk in gives them time to arrive.
  const indoor = board => board.room || board.chair, first = [], after = [], decor = [];
  for (const board of [...BOARDS, ...WORLD]) (board.decor ? decor : indoor(board) || WORLD.includes(board) && !seen(board) ? after : first).push(board);
  let furnished = null;
  function furnish() { furnished ??= Promise.all(decor.map(board => addBoard(board).catch(error => console.error('Decoration failed', board.id, error)))).then(() => redraw()); return furnished; }
  const reindeerFirst = flying || inSight(sweep, REINDEER.x, REINDEER.z, 1.4);
  let painted = 0, reindeerShare = reindeerFirst ? 0 : 1;
  const report = () => onProgress(Math.min(1, painted / (first.length + 1) * .6 + reindeerShare * .4));
  // Sheets by id, so a game can redraw one (the snowman's hat, the hay in the loft) and a tap can wiggle one.
  const flames = [], twinkles = [], swings = [], smoke = [], billboards = [], sheets = new Map(), lifting = new Map(), candles = [], snowfalls = [], glows = [];
  // Sheets that move as one: the tree's lights are a sheet of their own (they twinkle) hung on the same tree.
  const COMPANIONS = { tree: ['tree-lights'] };
  const together = (id, apply) => { for (const other of [id, ...(COMPANIONS[id] ?? [])]) { const sheet = sheets.get(other); if (sheet) apply(sheet); } };
  // The room's paper and the books' spines, each with its own colour, to be warmed a little by the firelight.
  const warmed = [];
  // The fire: `heat` is how many logs are burning (0–3, one burns down every 40 s); the bellows squeeze and flare it. Until
  // it has been lit with a match (`lit`, for good once it is) only a dying flicker is left in the grate and logs will not
  // catch; lit, it never burns lower than one log.
  const hearth = { heat: 0, flare: 0, squeeze: 0, lit: false };
  // The music box: `energy` is how far it is wound (0–1, three turns of the key), spent as it plays; `key` and `spin` are
  // the key's and the little scene's angles. It does not run down while a hand is on the key.
  const musicbox = { energy: 0, key: 0, spin: 0, held: false, marks: 0 };
  // The story: whether Santa is out (his chair empty, his coat gone from its peg, a note on the seat), whether a little
  // scene is playing (his going out) and holds the controls, and how far the bookcase has swung open (0–1).
  const story = { away: false, scripted: false, open: 0, opening: null, kick: -10, door: null };
  // Soft bluish shadows on the snow, thrown right and back, away from the low sun on the left.
  const shade = keep(textures, radialTexture([[0, 'rgba(110,140,170,.42)'], [1, 'rgba(110,140,170,0)']], 64));
  const shadowMaterial = flat(0xffffff, { map: shade, transparent: true, depthWrite: false });
  const shadowGeometry = keep(geometries, new THREE.PlaneGeometry(1, 1));
  function shadow(x, z, width, depth, height = 1) {
    const mesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x + height * .28, GROUND + .003, z - height * .12); mesh.scale.set(width, depth, 1);
    world.add(mesh); return mesh;
  }
  shadow(1, -.6, 4.8, 3.6, 1.2);
  // The snow surface isn't one flat white: a few broad, faint drifts shade it, far apart so they never form a pattern.
  for (const [x, z, w, d] of [[-7, -5, 9, 4], [6, 3.5, 8, 3.4], [-2, -9, 12, 4], [10, -3, 7, 3], [-10, 3, 8, 3.2]]) {
    const drift = new THREE.Mesh(shadowGeometry, shadowMaterial); drift.rotation.x = -Math.PI / 2; drift.position.set(x, GROUND + .002, z); drift.scale.set(w, d, 1); world.add(drift);
  }
  const texture = image => { const value = keep(textures, new THREE.Texture(image)); value.colorSpace = THREE.SRGBColorSpace; value.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); value.needsUpdate = true; return value; };

  // Rigs carry a set of boards together: the door on its hinge, the big wheel, the carousel, the ski mountain.
  const rigs = new Map([['door', new THREE.Group()]]), clones = new Map(), skins = new Map();
  rigs.get('door').position.set(DOOR.hinge, 0, DOOR.z); indoors.add(rigs.get('door'));
  for (const [id, { at, turn = 0 }] of Object.entries(RIGS)) { const rig = new THREE.Group(); rig.position.set(...at); rig.rotation.y = turn; rigs.set(id, rig); world.add(rig); }
  for (const [id, { at, turn = 0, tilt = 0 }] of Object.entries(ROOM_RIGS)) { const rig = new THREE.Group(); rig.position.set(...at); rig.rotation.set(0, turn, tilt); rigs.set(id, rig); indoors.add(rig); }
  // Real shelves for the things that stand on painted ones: the mantel (the snow globe) and the candle shelf (the music box).
  solid(new THREE.BoxGeometry(1.08, .03, .2), 0xa86b47, new THREE.Vector3(FIRE.x, GLOBE.y - .015, GLOBE.z), indoors);
  solid(new THREE.BoxGeometry(.2, .025, .76), 0xa86b47, new THREE.Vector3(MUSICBOX.x + .01, MUSICBOX.y - .0125, MUSICBOX.z), indoors);
  // Snow falling past a window: a pane of flakes over its view, scrolled down in the loop (each window from its own start).
  // The flakes are dots drawn once on a small canvas, nothing downloaded.
  let snowCanvas = null;
  function snowPane(holder, board) {
    if (!snowCanvas) {
      snowCanvas = document.createElement('canvas'); snowCanvas.width = snowCanvas.height = 256;
      const pen = snowCanvas.getContext('2d'), random = i => { const value = Math.sin(i * 78.233) * 43758.5453; return value - Math.floor(value); };
      for (let i = 0; i < 36; i++) { pen.globalAlpha = .75 + random(i + 5) * .25; pen.fillStyle = '#ffffff'; pen.beginPath(); pen.arc(random(i) * 256, random(i + 40) * 256, 1.6 + random(i + 80) * 2.6, 0, Math.PI * 2); pen.fill(); }
    }
    const map = keep(textures, new THREE.CanvasTexture(snowCanvas)); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(board.w / .5, board.h / .5);
    const pane = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(board.w, board.h)), keep(materials, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })));
    pane.position.z = .003; holder.add(pane); return map;
  }
  // The advent house's windows lit for today (cabin-art.js adventLit: one more each day of December), drawn on a canvas laid
  // over its dark windows; they glow softly in the loop.
  function adventLights(holder, board) {
    const scale = 3, width = Math.round(board.w * PX * scale), height = Math.round(board.h * PX * scale), canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const pen = canvas.getContext('2d'), lit = adventLit();
    board.advent({ width, height }).slice(0, lit).forEach(([x, y, w, h]) => {
      pen.shadowColor = 'rgba(255, 214, 120, .9)'; pen.shadowBlur = h * .8; pen.fillStyle = '#f4cf74'; pen.beginPath();
      if (pen.roundRect) pen.roundRect(x, y, w, h, 2 * scale); else pen.rect(x, y, w, h); pen.fill();
    });
    const map = keep(textures, new THREE.CanvasTexture(canvas)); map.colorSpace = THREE.SRGBColorSpace;
    const material = keep(materials, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }));
    const pane = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(board.w, board.h)), material); pane.position.set(0, board.h / 2, .002); holder.add(pane);
    return material;
  }
  function standBoard(board, map) {
    const material = keep(materials, new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .4, toneMapped: false, fog: board.fog !== false, side: board.mirror || board.chair && board.turn || board.billboard || board.clones ? THREE.DoubleSide : THREE.FrontSide }));
    const geometry = keep(geometries, new THREE.PlaneGeometry(board.w, board.h));
    if (board.copies) {
      // One painted sheet, planted at every [x, z, height]; each copy turns about its trunk to face the camera.
      material.side = THREE.DoubleSide;
      geometry.translate(0, board.h / 2, 0);
      for (const [x, z, size] of board.copies) {
        const tree = new THREE.Group();
        tree.add(new THREE.Mesh(geometry, material));
        tree.position.set(x, GROUND, z); tree.scale.setScalar(size / board.h); billboards.push(tree);
        world.add(tree); shadow(x, z, size * .55, size * .3, size);
      }
      return;
    }
    const parent = board.secret ? secret : board.rig ? rigs.get(board.rig) : board.chair ? chair : board.room ? indoors : world;
    const edges = !board.kind && (!board.flat || board.flat === 'seat') ? keep(materials, edgeMaterial(map)) : null;
    if (board.room || board.chair) for (const each of [material, edges]) if (each) warmed.push([each, each.color.clone()]);
    if (edges) edges.fog = board.fog !== false;
    if (!board.roof) geometry.translate(0, board.flat || board.center ? 0 : board.hang ? -board.h / 2 : board.h / 2, 0);
    const holders = Array.from({ length: board.clones ?? 1 }, () => {
      const holder = new THREE.Group(), mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = board.nudge ?? 0; holder.add(mesh);
      if (edges) { const edge = new THREE.Mesh(geometry, edges); edge.position.z = -.012; holder.add(edge); }
      if (board.roof) {
        const roof = roofFrame(board.roof, board.layer);
        holder.position.copy(roof.center); holder.quaternion.copy(roof.quaternion);
      } else {
        holder.position.set(...board.at ?? [0, 0, 0]);
        if (board.flat === 'floor') { holder.rotation.x = -Math.PI / 2; holder.position.y = .002; }
        // Lying level where it is put (the rocking chair's seat), its top edge to the back.
        if (board.flat === 'seat') holder.rotation.x = -Math.PI / 2;
        if (board.flat === 'ground') { holder.rotation.set(-Math.PI / 2, 0, board.turn ?? 0); holder.position.y = GROUND + .006; }
        else if (board.turn) holder.rotation.y = board.turn;
        if (board.mirror) holder.scale.x = -1;
      }
      if (board.billboard) billboards.push(holder);
      if (board.hang) swings.push([holder, board.sway ? .02 : .05]);
      parent.add(holder); return holder;
    });
    if (board.clones) clones.set(board.id, holders);
    const [holder] = holders;
    sheets.set(board.id, { board, material, edges, holder, home: holder.position.clone(), base: holder.scale.clone(), lift: 1 });
    if (edges && !board.rig && !board.hang && !board.chair && !board.room && board.at?.[1] === GROUND) shadow(board.at[0], board.at[2], board.w * 1.1, board.w * .5, board.h);
    if (board.flame) flames.push(holder);
    if (board.twinkle) twinkles.push(material);
    // A candle's flame flickers about its foot; snow falls past a window, between its view and its frame; the advent house
    // has the windows lit for the day laid over it.
    if (board.candle) candles.push(holder);
    if (board.snowfall) snowfalls.push(snowPane(holder, board));
    if (board.advent) glows.push(adventLights(holder, board));
  }
  // A painted pattern that wraps round a 3D shape (the sea, the carousel) instead of standing as a board.
  const skinTargets = new Map();
  const skinned = (id, colour, options = {}) => { const material = flat(colour, options); skinTargets.set(id, material); return material; };
  function skin(board, map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping; if (board.repeat) map.repeat.set(...board.repeat);
    skins.set(board.id, map);
    const material = skinTargets.get(board.id);
    if (material) { material.map = map; material.color.set(0xffffff); material.needsUpdate = true; }
  }

  // The bookcase on its hinge: wooden shelves, sides and top, and books with real thickness standing on the shelves (its
  // painted back is one of the boards). A book is a box: its spine a cut picture, its covers card of its colour, its pages
  // cream on top. The gold-spined books stand a little proud of the rest and gleam in the firelight. When the four places
  // spell MORE, those four light up for a moment (`glintBooks`).
  const sheens = new Map(), letterBooks = new Map(), coverMaterials = new Map(), golden = new Set(LETTER_BOOKS.filter(book => book.gold).map(book => book.id));
  const pages = keep(materials, new THREE.MeshStandardMaterial({ color: 0xf3e6c8, roughness: 1 }));
  const gleam = keep(textures, radialTexture([[0, 'rgba(255,226,150,1)'], [.55, 'rgba(255,214,120,.35)'], [1, 'rgba(255,214,120,0)']], 64));
  function bookGeometry(w, h, d) {
    // Three groups of faces: covers (both sides, the bottom, the back), pages (the top) and the spine (the front).
    const geometry = new THREE.BoxGeometry(w, h, d), index = [...geometry.index.array], face = i => index.slice(i * 6, i * 6 + 6);
    geometry.setIndex([...[0, 1, 3, 5].flatMap(face), ...face(2), ...face(4)]);
    geometry.clearGroups(); geometry.addGroup(0, 24, 0); geometry.addGroup(24, 6, 1); geometry.addGroup(30, 6, 2);
    return keep(geometries, geometry.translate(0, h / 2, d / 2));
  }
  function book(map, colour, w, h, d = .17) {
    if (!coverMaterials.has(colour)) coverMaterials.set(colour, keep(materials, new THREE.MeshStandardMaterial({ color: new THREE.Color(colour).multiplyScalar(.82), roughness: 1 })));
    const spine = keep(materials, new THREE.MeshBasicMaterial({ map, toneMapped: false }));
    warmed.push([spine, spine.color.clone()]);
    return new THREE.Mesh(bookGeometry(w, h, d), [coverMaterials.get(colour), pages, spine]);
  }
  // The thirteen places a letter book can stand (cabin-story.js): along HOLY MERRY's shelf, then the four left of SANTA.
  const bookPlaces = [...SHELF_LAYOUT.letters.map(x => [x, BOOKCASE.shelves[2]]), ...SHELF_LAYOUT.slots.map(x => [x, BOOKCASE.shelves[1]])];
  let shelfNow = null;
  const bookGoal = (mesh, place) => { const [x, y] = bookPlaces[place]; mesh.userData.goal = new THREE.Vector3(x, y, golden.has(mesh.userData.id) ? .042 : .03); };
  const secret = new THREE.Group(); secret.visible = false; indoors.add(secret);
  async function buildBookcase() {
    const { width, height, depth, shelves } = BOOKCASE, rig = rigs.get('bookcase'), wood = (geometry, colour, x, y, z) => solid(geometry, colour, new THREE.Vector3(x, y, z), rig);
    wood(new THREE.BoxGeometry(width, shelves[0], depth), 0x8f5a3c, width / 2, shelves[0] / 2, depth / 2);
    for (const y of shelves.slice(1)) wood(new THREE.BoxGeometry(width - .05, .024, depth), 0xa86b47, width / 2, y - .012, depth / 2);
    for (const x of [.0125, width - .0125]) wood(new THREE.BoxGeometry(.025, height, depth), 0x8f5a3c, x, height / 2, depth / 2);
    wood(new THREE.BoxGeometry(width + .03, .04, depth + .03), 0xa86b47, width / 2, height + .02, depth / 2);
    const maps = new Map(await Promise.all(BOOK_SHEETS.map(async sheet => [sheet.id, texture(await cutBoard(sheet.id, sheet, set))])));
    if (disposed) return;
    LETTER_BOOKS.forEach((entry, i) => {
      const mesh = book(maps.get(entry.id), entry.colour, entry.w, entry.h);
      mesh.userData.size = [entry.w, entry.h]; mesh.userData.id = entry.id; bookGoal(mesh, i); mesh.position.copy(mesh.userData.goal); rig.add(mesh); letterBooks.set(entry.id, mesh);
      const sheen = keep(materials, new THREE.MeshBasicMaterial({ map: gleam, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      const glint = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(entry.w * 1.3, entry.h * 1.1)), sheen);
      glint.position.set(0, entry.h * .48, .172); mesh.add(glint); sheens.set(entry.id, sheen);
    });
    for (const { shelf, variant, x, w, h } of PLAIN_BOOKS) {
      const mesh = book(maps.get(`book-plain-${variant}`), ['#3f5a7a', '#7d5636', '#3f6653', '#8f3b36'][variant], w, h);
      mesh.position.set(x, shelves[shelf], .03); rig.add(mesh);
    }
    // Books stand where the visitor last left them.
    if (shelfNow) shelfNow.forEach((id, place) => { const mesh = id && letterBooks.get(id); if (mesh) { bookGoal(mesh, place); mesh.position.copy(mesh.userData.goal); } });
    const cover = book(maps.get('santa-book'), '#8f3b36', .24, .3, .028);
    cover.position.set(SHELF_LAYOUT.santa, shelves[1], .08); cover.rotation.x = -.12; rig.add(cover);
    redraw();
  }

  // The carousel is the one ride built round: a paper drum, roof and fringe that turn as one, horses rising and falling.
  const carousel = rigs.get('carousel'), gold = flat(0xe0b04f), cream = flat(0xf1e4c8);
  const part = (geometry, material, y) => { const mesh = new THREE.Mesh(keep(geometries, geometry), material); mesh.position.y = y; carousel.add(mesh); return mesh; };
  const canopy = CAROUSEL.radius + .25, pole = keep(geometries, new THREE.CylinderGeometry(.03, .03, CAROUSEL.top - .3, 8));
  part(new THREE.CylinderGeometry(CAROUSEL.radius, CAROUSEL.radius + .05, .3, 48), [skinned('carousel-drum', 0xa84a42), cream, cream], .15);
  part(new THREE.CylinderGeometry(.1, .1, CAROUSEL.top - .3, 12), gold, .15 + CAROUSEL.top / 2);
  part(new THREE.ConeGeometry(canopy, 1.05, 48, 1, true), skinned('carousel-roof', 0xa84a42, { side: THREE.DoubleSide }), CAROUSEL.top + .525);
  part(new THREE.CylinderGeometry(canopy, canopy, .34, 48, 1, true), skinned('carousel-fringe', 0xa84a42, { side: THREE.DoubleSide, transparent: true, alphaTest: .4 }), CAROUSEL.top - .17);
  part(new THREE.CircleGeometry(canopy, 48), cream, CAROUSEL.top).rotation.x = Math.PI / 2;
  part(new THREE.SphereGeometry(.14, 16, 12), gold, CAROUSEL.top + 1.12);
  for (let i = 0; i < CAROUSEL.horses; i++) {
    const angle = i / CAROUSEL.horses * Math.PI * 2, mesh = new THREE.Mesh(pole, gold);
    mesh.position.set(Math.sin(angle) * CAROUSEL.ring, .15 + CAROUSEL.top / 2, Math.cos(angle) * CAROUSEL.ring); carousel.add(mesh);
  }
  shadow(CAROUSEL.x, CAROUSEL.z, 4.4, 2.4, 3);
  shadow(WHEEL.x, WHEEL.z, 5.4, 2.2, 5);

  // The bay: one flat sheet of sea beyond the shoreline, a band of wet sand on the land side and a lip of foam that laps.
  const shoreLine = new THREE.SplineCurve(SHORE.map(([x, z]) => new THREE.Vector2(x, -z))).getPoints(72);
  const seaGeometry = keep(geometries, new THREE.ShapeGeometry(new THREE.Shape([...shoreLine, new THREE.Vector2(95, shoreLine.at(-1).y), new THREE.Vector2(95, shoreLine[0].y)])));
  seaGeometry.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeometry, skinned('sea', SEA, { side: THREE.DoubleSide })); sea.position.y = GROUND + .012; world.add(sea);
  function ribbon(from, to, colour, y, opacity = 1) {
    const positions = [], index = [];
    shoreLine.forEach((point, i) => {
      const a = shoreLine[Math.max(0, i - 1)], b = shoreLine[Math.min(shoreLine.length - 1, i + 1)], dx = b.x - a.x, dz = a.y - b.y, length = Math.hypot(dx, dz) || 1;
      const nx = dz / length, nz = -dx / length, x = point.x, z = -point.y;
      positions.push(x + nx * from, y, z + nz * from, x + nx * to, y, z + nz * to);
      if (i) index.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
    });
    const geometry = keep(geometries, new THREE.BufferGeometry()); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(index);
    const mesh = new THREE.Mesh(geometry, flat(colour, { side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity === 1 })); world.add(mesh); return mesh;
  }
  ribbon(-.9, .02, 0xe4ded2, GROUND + .006);
  const foam = ribbon(-.05, .45, 0xf4f8f8, GROUND + .02, .85);

  let spray = null;
  const smokeReady = cutBoard('smoke', PIECES.smoke, set).then(image => {
    const map = texture(image);
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Sprite(keep(materials, new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })));
      puff.userData.phase = i / 3; smoke.push(puff); world.add(puff);
    }
    // The snow a drift throws up when it calls (`beckon`): the same paper puff, out of sight until then.
    spray = new THREE.Sprite(keep(materials, new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }))); spray.visible = false; world.add(spray);
    painted++; report();
  });
  // A village board that fails is left out; a house board that fails before the page opens fails the whole cabin.
  const addBoard = async board => {
    const image = await cutBoard(board.id, board, set); if (disposed) return;
    const map = texture(image); if (board.texture) skin(board, map); else standBoard(board, map);
    if (restyled.delete(board.id)) paintSheet(board.id, sheets.get(board.id));
  };
  const restyled = new Set();
  const boards = first.map(async board => {
    try { await addBoard(board); }
    catch (error) { if (!WORLD.includes(board)) throw error; console.error('Village board failed', board.id, error); }
    painted++; report();
  });
  const flagPart = cutBoard('mailbox-flag', PIECES['mailbox-flag'], set);
  const hoistParts = Promise.all(['hoist-bracket', 'hoist-wheel', 'hoist-bale', 'hoist-winch', 'hoist-crank', 'hoist-tag'].map(name => cutBoard(name, PIECES[name], set)));

  // Warm glows: the fire, the lantern, the reading lamp, the porch and the lighthouse lamp. Sprites always face the camera.
  const warm = keep(textures, radialTexture([[0, 'rgba(255,190,110,.8)'], [.45, 'rgba(255,150,70,.28)'], [1, 'rgba(255,140,60,0)']]));
  const glow = (position, size, parent = indoors) => { const sprite = new THREE.Sprite(keep(materials, new THREE.SpriteMaterial({ map: warm, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }))); sprite.position.copy(position); sprite.scale.setScalar(size); parent.add(sprite); return sprite; };
  const fireGlow = glow(new THREE.Vector3(FIRE.x, .28, FIRE.z - .05), 1), lanternGlow = glow(new THREE.Vector3(LANTERN.x, 2.68, LANTERN.z + .02), .7);
  // The desk lamp's glow, under its shade (the desk faces the room, so the sheet's right-hand end is toward the back). Its
  // halo fades as the eye comes close (walking up to the window sill passes by it), as a real one would not show up close.
  const deskGlow = glow(new THREE.Vector3(DESK.x + .03, DESK.h * (1 - (DESK.items.lamp[1] + DESK.items.lamp[3]) / 2.6), DESK.z + (.5 - (DESK.items.lamp[0] + DESK.items.lamp[2]) / 2) * DESK.w), .5);
  // The little room behind the bookcase: plain warm walls and a lamp; what is in it is laid out by cabin-secret.js.
  (() => {
    const { left, width, height, depth, wall } = SECRET, back = BACK_WALL - depth, mid = left + width / 2, walls = 0xb98f63;
    solid(new THREE.BoxGeometry(width, .02, depth), 0x8f6444, new THREE.Vector3(mid, -.01, BACK_WALL - depth / 2), secret);
    // The ceiling and side walls stand just inside the doorway: lined up with the back wall's own face they would flicker
    // against it along the doorway's edges.
    solid(new THREE.BoxGeometry(width, wall, depth), 0x7a5236, new THREE.Vector3(mid, height - wall / 2, BACK_WALL - depth / 2), secret);
    solid(new THREE.BoxGeometry(width, height, wall), walls, new THREE.Vector3(mid, height / 2, back), secret);
    for (const x of [left + wall / 2, left + width - wall / 2]) solid(new THREE.BoxGeometry(wall, height, depth), walls, new THREE.Vector3(x, height / 2, BACK_WALL - depth / 2), secret);
    const lamp = new THREE.PointLight(0xffc98a, 1.6, 2.2, 1.5); lamp.position.set(mid, height - .15, back + .3); secret.add(lamp);
    glow(new THREE.Vector3(mid, height - .2, back + .32), .7, secret);
  })();
  // The morning sun, just risen: half hidden behind the far range's second peak, up and to the left of the house, where the
  // scene's light comes from. It is part of the 3D world, so it keeps its place among the mountains as the view turns.
  (() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d'), halo = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [at, colour] of [[0, 'rgba(255,246,214,1)'], [.3, 'rgba(253,234,176,1)'], [.34, 'rgba(250,218,160,.8)'], [.6, 'rgba(250,222,170,.3)'], [1, 'rgba(250,222,170,0)']]) halo.addColorStop(at, colour);
    context.fillStyle = halo; context.fillRect(0, 0, 256, 256);
    const map = keep(textures, new THREE.CanvasTexture(canvas)); map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(keep(materials, new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, fog: false })));
    sprite.position.set(-27.5, 8.45, -62); sprite.scale.setScalar(20); world.add(sprite);
  })();
  const doorGlow = glow(new THREE.Vector3(0, DOOR.height * .6, front + .3), 1.5, world), lampGlow = glow(new THREE.Vector3(LIGHTHOUSE.x, LIGHTHOUSE.lamp, LIGHTHOUSE.z + .15), 1.3, world);
  const beam = new THREE.Group(), beamMaterial = keep(materials, new THREE.MeshBasicMaterial({ map: keep(textures, beamTexture()), transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  const beamGeometry = keep(geometries, new THREE.PlaneGeometry(7, 1).translate(3.5, 0, 0));
  for (const tilt of [0, Math.PI / 2]) { const ray = new THREE.Mesh(beamGeometry, beamMaterial); ray.rotation.x = tilt; beam.add(ray); }
  beam.position.set(LIGHTHOUSE.x, LIGHTHOUSE.lamp, LIGHTHOUSE.z); world.add(beam);
  const blob = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(1.1, .75)), flat(0xffffff, { map: keep(textures, radialTexture([[0, 'rgba(60,35,20,.4)'], [1, 'rgba(60,35,20,0)']], 64)), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(CHAIR.x, .006, CHAIR.z + .05); indoors.add(blob);

  // What can be tapped: the yard's corners, the house itself and a few things in the village; furniture once inside.
  const unseen = flat(0xffffff, { visible: false }), unit = keep(geometries, new THREE.BoxGeometry(1, 1, 1));
  const target = ([[x, y, z], [w, h, d]], data) => { const mesh = new THREE.Mesh(unit, unseen); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.userData = data; scene.add(mesh); return mesh; };
  const yardTargets = [...SPOTS.map(spot => target(spot.box, { spot: spot.id })), target([[0, 1.5, 0], [HOUSE.width + .4, 3.3, HOUSE.depth + .3]], { house: true }), ...PROPS.map(prop => target(prop.box, { prop }))];
  // The bookcase as a whole, on its hinge, so it can be tapped wherever it stands, open or shut.
  const caseTarget = new THREE.Mesh(unit, unseen); caseTarget.position.set(BOOKCASE.width / 2, BOOKCASE.height / 2, BOOKCASE.depth / 2);
  caseTarget.scale.set(BOOKCASE.width, BOOKCASE.height, BOOKCASE.depth); caseTarget.userData = { bookcase: true }; rigs.get('bookcase').add(caseTarget);
  const roomTargets = [caseTarget, ...ROOM_SPOTS.map(spot => target(spot.box, { spot: spot.id })), ...ROOM_PROPS.filter(prop => prop.box).map(prop => target(prop.box, { prop }))];
  let snowmanMove = null, reindeerAim = [0, 0], reindeerTurn = [0, 0], reindeerAction = null, reindeerAside = 0, reindeerShift = 0;
  // Something calling the visitor over when they seem stuck (cabin-play.js decides what, by cabin-story.js `beckon`): one
  // small move of its own, a second or two long (`BECKON`), ending just where it rests. `moving(kind)` is how far through it
  // is, 0 → 1 (null: something else, or nothing). A gold book is a 'book'.
  const BECKON = { mailbox: .7, trough: 1.4, reindeer: 1.8, 'snow-pile': 1.5, 'hoist-tag': 1.4, door: 1.2, hearth: 1.5, desk: 1, musicbox: 1.2, globe: 1.6, book: 1.1, bookcase: 1.5, chair: 1.6, 'secret-log': 1.8, register: 2, record: 1.6, sleigh: 1.6, wheel: 1.8 };
  let calling = null;
  const moving = kind => calling?.kind === kind ? Math.min(1, (clock - calling.at) / calling.length) : null;
  const shiver = (u, turns, size) => Math.sin(u * Math.PI * turns) * size * (1 - u);
  // Turns a sheet by `angle` about one of its own axes through `point` on it ([x, y] from the middle of its foot), which
  // stays where it was: a board on its nail, a page on its spine. `rock` tips one on a corner of its foot and back, never
  // sinking it into what it stands on.
  const UPRIGHT = new THREE.Vector3(0, 1, 0), FACING = new THREE.Vector3(0, 0, 1);
  const turnBy = new THREE.Quaternion(), yawBy = new THREE.Quaternion(), pin = new THREE.Vector3(), pinGone = new THREE.Vector3();
  function pivot({ holder, home, board }, axis, angle, [x, y]) {
    yawBy.setFromAxisAngle(UPRIGHT, board.turn ?? 0); turnBy.setFromAxisAngle(axis, angle); holder.quaternion.copy(yawBy).multiply(turnBy);
    pin.set(x, y, 0); pinGone.copy(pin).applyQuaternion(turnBy); holder.position.copy(home).add(pin.sub(pinGone).applyQuaternion(yawBy));
  }
  const rock = (sheet, angle) => pivot(sheet, FACING, angle, [(angle > 0 ? -.5 : .5) * sheet.board.w, 0]);
  const wiggles = new Map(), runs = RUNS.map(points => new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)))), track = new THREE.SplineCurve(TRACK.map(([x, y]) => new THREE.Vector2(x, y)));
  // The coaster's timetable, worked out once. The chain pulls the train slowly to the top of the lift hill; from there it
  // coasts, its speed set by how far it has dropped below the crest (v² = v₀² + 2g·drop) less a little friction for the
  // distance run, so it crawls up the lift, races down the drop and slows over each lower hill. g is in scene units per
  // second² (one unit is about 1.3 m). `rides` holds, for each of 400 equal steps along the track, the time to get there.
  const ride = (() => {
    const STEPS = 400, G = 7.5, CHAIN = 1.2, FRICTION = .45, points = track.getSpacedPoints(STEPS), step = track.getLength() / STEPS;
    let crest = 0; points.forEach((point, i) => { if (point.x <= COASTER.lift[1] + .3 && point.y > points[crest].y) crest = i; });
    const speed = i => i <= crest ? CHAIN : Math.max(.9, Math.sqrt(CHAIN * CHAIN + 2 * G * (points[crest].y - points[i].y) - FRICTION * (i - crest) * step));
    const times = [0];
    for (let i = 1; i <= STEPS; i++) times.push(times[i - 1] + step / ((speed(i - 1) + speed(i)) / 2));
    // Where the front of the train is (0–1 along the track) after `time` seconds of the ride. Past the tunnel mouth it keeps
    // going at its last speed, beyond 1, so every car runs on into the tunnel instead of the train stopping short of it.
    const end = times[STEPS], last = speed(STEPS), length = track.getLength();
    return { length: end + 2.5, at(time) {
      if (time >= end) return 1 + (time - end) * last / length;
      let low = 0, high = STEPS; while (high - low > 1) { const mid = (low + high) >> 1; if (times[mid] <= time) low = mid; else high = mid; }
      return (low + (time - times[low]) / ((times[high] - times[low]) || 1)) / STEPS;
    } };
  })();
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const fitModel = (model, height) => {
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.scale.setScalar(height / size.y);
    model.position.set(-center.x, -bounds.min.y, -center.z); holder.add(model); models.push(model);
    model.traverse(node => { if (node.isMesh) node.frustumCulled = false; });
    return holder;
  };
  // The reindeer's mouth has no bone of its own: it sits at a fixed point in the frame of the bone behind his ears (Head_3),
  // so it follows every nod and turn. Measured on the model from his red nose and smile.
  const MOUTH = new THREE.Vector3(0, -.24, .14);
  let santaModel, spine, spineRest, tracker, reindeerHolder, reindeerHead, reindeerRest, reindeerSkull, reindeerShadow, reindeerScale = 1;
  // Fed at his trough, he steps this far aside (x, z) and stays there, off the end of it he stood over.
  const ASIDE = [.34, .12];
  const loadSanta = () => loader.loadAsync(new URL('../../assets/models/santa-seated-web.glb', import.meta.url).href)
    .then(gltf => {
      if (disposed) { free(gltf.scene); return false; }
      santaModel = gltf.scene; chair.add(fitModel(santaModel, 1));
      spine = santaModel.getObjectByName('mixamorigSpine2'); spineRest = spine?.quaternion.clone();
      tracker = createHeadTracker(santaModel, stage, { ...HEAD, unanimated: true, onMove: () => wake() });
      redraw(); return true;
    }).catch(error => { console.error('Seated Santa failed to load', error); return false; });
  // The reindeer from the Home page waits outside; most visitors already have this file cached.
  const loadReindeer = () => loader.loadAsync(new URL('../../assets/models/reindeer-web.glb', import.meta.url).href, event => { if (event.total && reindeerFirst) { reindeerShare = event.loaded / event.total; report(); } })
    .then(gltf => {
      if (disposed) { free(gltf.scene); return false; }
      const holder = fitModel(gltf.scene, REINDEER.height); holder.position.set(REINDEER.x, GROUND, REINDEER.z); holder.rotation.y = REINDEER.turn; world.add(holder); reindeerShadow = shadow(REINDEER.x, REINDEER.z, 1.2, .6, 1);
      reindeerHolder = holder; reindeerScale = holder.scale.x; gltf.scene.traverse(node => { if (node.isBone && /Head_0$/.test(node.name)) reindeerHead = node; if (node.isBone && /Head_3$/.test(node.name)) reindeerSkull = node; }); reindeerRest = reindeerHead?.quaternion.clone();
      if (ready) redraw();
      return true;
    })
    .catch(error => { console.error('Reindeer failed to load', error); return false; })
    .finally(() => { reindeerShare = 1; report(); });

  const reindeer = reindeerFirst ? loadReindeer() : null;
  await Promise.all([Promise.all(boards), smokeReady, reindeer]);
  // The snowman's wardrobe: a small sheet for each place, laid just in front of him so it moves, turns and bows with him.
  // Each accessory is cut the first time it is worn and kept, so trying it on again is instant.
  const snowman = sheets.get('snowman'), worn = new Map(), outfits = new Map();
  if (snowman) {
    snowman.holder.rotation.order = 'YXZ';
    for (const [place, { at: [x, y], size: [w, h], nudge }] of Object.entries(PLACES)) {
      const mesh = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(w, h)), keep(materials, new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .4, toneMapped: false })));
      mesh.position.set(x, y, nudge); mesh.visible = false; snowman.holder.add(mesh); worn.set(place, { mesh, id: null });
    }
  }
  // The desk's and the music box's drawers (cabin-art.js DRAWERS): each a little box of paper pieces (front, floor seen
  // from above, two sides, back) set into its furniture's dark slot, on the furniture's own sheet so it stands and turns
  // with it. Shut, only its front shows: the rest is inside, behind the sheet. Pulled out, the box slides toward the room
  // and its floor shows from above. Each eases toward `open` (0 or 1); its front's and floor's looks are states of their
  // pieces, cut ahead. What a game asks before the room is ready is kept (`drawerLooks`) and used when it is.
  const drawers = new Map(), drawerLooks = new Map();
  const piece = (id, part, state) => { const name = `${id}-drawer-${part}`; return cutBoard(name, PIECES[name], set, state ?? PIECES[name].state); };
  async function buildDrawer(id) {
    const { sheet: under, slot: [x0, , x1, y1], depth, slide } = DRAWERS[id], host = sheets.get(under);
    if (!host || disposed || drawers.has(id)) return;
    const { board, holder } = host, { front: [fw, fh], floor: [lw, lh], side: [sw, sh] } = drawerPieces(id), look = drawerLooks.get(id) ?? {};
    const [front, floor, side] = (await Promise.all([piece(id, 'front', look.front), piece(id, 'inside', look.inside), piece(id, 'side')])).map(texture);
    if (disposed) return;
    const plane = (map, w, h) => {
      const material = keep(materials, new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .4, toneMapped: false, side: THREE.DoubleSide }));
      if (board.room) warmed.push([material, material.color.clone()]);
      return new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(w, h)), material);
    };
    const base = board.nudge ?? 0, box = new THREE.Group(), floorY = fh * .14;
    box.position.set(((x0 + x1) / 2 - .5) * board.w, (1 - y1) * board.h, base);
    // The furniture is a standing sheet with its top painted on, so nothing may go behind it (it would show above the
    // painted top): the box is only ever as deep as it has come out. Its floor and sides reach from its front back to the
    // furniture's face, the floor showing the front part of its picture; its back, inside the furniture, is never seen.
    const face = plane(front, fw, fh), inside = new THREE.Group(); face.position.set(0, fh / 2, .004);
    const bottom = plane(floor, lw, lh); bottom.rotation.x = -Math.PI / 2; bottom.position.y = floorY;
    const walls = [-1, 1].map(x => { const wall = plane(side, sw, sh); wall.rotation.y = Math.PI / 2; wall.position.set(x * lw / 2, floorY + sh / 2, 0); inside.add(wall); return wall; });
    inside.add(bottom); box.add(inside, face); holder.add(box);
    const open = look.open ? 1 : 0;
    drawers.set(id, { box, face, bottom, walls, inside, base, slide, depth, open, out: open, shown: { front: look.front ?? {}, inside: look.inside ?? {} } });
    restyleDrawer(id); redraw();
  }
  // A drawer's front or floor changed: its piece in its new look.
  async function restyleDrawer(id) {
    const drawer = drawers.get(id), look = drawerLooks.get(id) ?? {}; if (!drawer) return;
    for (const [part, mesh] of [['front', drawer.face], ['inside', drawer.bottom]]) {
      const state = look[part] ?? {}; if (JSON.stringify(state) === JSON.stringify(drawer.shown[part])) continue;
      drawer.shown[part] = state;
      const map = texture(await piece(id, part, state)); if (disposed) return;
      const old = mesh.material.map; mesh.material.map = map; textures.delete(old); old.dispose(); redraw();
    }
  }
  // The hay hoist on the barn: paper pieces on the barn's own sheet, so they stand and turn with it. One number, how far
  // the bale has been wound up (0 to 1), places everything: the bale rises as far as the winch's spool winds rope in, the
  // spool (with the crank, once it is fitted) and the pulley turn by that length of rope, and the rope to the bale runs
  // from the wheel's rim down to it. The repair tag swings when the winch is tried without its crank. The drawer behind the
  // bale is a real one (DRAWERS.barn, `drawer`).
  // The mailbox's flag, raised while Santa's letter waits: on the mailbox's sheet, turning about its pole's foot. It lies
  // down until the visitor has arrived (`mailCall`), then springs up; after that the box gives a little hop every few
  // seconds, its flag waving, until it is opened. Lowered (hidden: the box's own picture shows it down) once opened.
  const mail = sheets.get('mailbox'), flag = { mesh: null, up: true, rise: null };
  if (mail) {
    const geometry = keep(geometries, new THREE.PlaneGeometry(MAIL_FLAG.w, MAIL_FLAG.h)); geometry.translate(MAIL_FLAG.w * (.5 - MAIL_FLAG.pivot), MAIL_FLAG.h / 2, 0);
    flag.mesh = new THREE.Mesh(geometry, keep(materials, new THREE.MeshBasicMaterial({ map: texture(await flagPart), transparent: true, alphaTest: .4, toneMapped: false })));
    flag.mesh.position.set(...MAIL_FLAG.at); flag.mesh.scale.setScalar(1.3); flag.mesh.visible = flag.up; mail.holder.add(flag.mesh);
  }
  const barn = sheets.get('stable'), hoist = { pull: 0, swing: -10 };
  if (barn) {
    const sheet = (map, w, h, lift = 0, shift = 0) => { const geometry = keep(geometries, new THREE.PlaneGeometry(w, h)); geometry.translate(shift * w, lift * h, 0); const mesh = new THREE.Mesh(geometry, keep(materials, new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .4, toneMapped: false }))); barn.holder.add(mesh); return mesh; };
    const [bracket, wheel, bale, winch, crank, tag] = (await hoistParts).map(texture);
    const hang = HOIST.x - HOIST.radius, pull = HOIST.x + HOIST.radius, [cw, ch] = WINCH.crank, [gw, gh] = WINCH.tag;
    hoist.bale = sheet(bale, ...HOIST.bale, .5); hoist.bale.position.set(hang, 0, .16);
    sheet(winch, ...WINCH.plate).position.set(WINCH.x, WINCH.y, .18);
    // The tag hangs from the top of its string, the crank turns about its square hole.
    hoist.tag = sheet(tag, gw, gh, -.5, .44); hoist.tag.position.set(...WINCH.tagAt, .19);
    hoist.crank = sheet(crank, cw, ch, cw / ch / 2 - .5); hoist.crank.position.set(WINCH.x, WINCH.y, .21); hoist.crank.visible = false;
    hoist.wheel = sheet(wheel, HOIST.radius * 2.3, HOIST.radius * 2.3); hoist.wheel.position.set(HOIST.x, HOIST.wheel, .21);
    sheet(bracket, .62, .34).position.set(HOIST.x, HOIST.wheel + .11, .13);
    const rope = keep(geometries, new THREE.PlaneGeometry(.022, 1).translate(0, -.5, 0)), cord = flat(0xb98a52);
    hoist.ropes = [hang, pull].map(x => { const mesh = new THREE.Mesh(rope, cord); mesh.position.set(x, HOIST.wheel, .19); barn.holder.add(mesh); return mesh; });
    // The little drawer at the hoist's foot, a real one (as the desk's): built now the barn stands.
    buildDrawer('barn').catch(error => console.error('Drawer failed', 'barn', error));
    hoist.ropes[1].scale.y = HOIST.wheel - WINCH.y;
  }
  function placeHoist() {
    if (!hoist.bale) return;
    const rise = hoist.pull * HOIST.lift, baleTop = rise + HOIST.bale[1];
    hoist.bale.position.y = rise;
    hoist.wheel.rotation.z = -rise / HOIST.radius; hoist.crank.rotation.z = hoist.turn ?? rise / WINCH.spool;
    hoist.ropes[0].scale.y = HOIST.wheel - baleTop;
  }
  placeHoist();
  function outfitTexture(item) {
    if (!outfits.has(item.id)) {
      outfits.set(item.id, cutBoard(`outfit-${item.id}`, outfitBoard(item), set).then(image => texture(image)));
    }
    return outfits.get(item.id);
  }
  if (!isCurrent()) { release3d(); return null; }
  stage.prepend(renderer.domElement);

  // A view's settings as they stand now: the bookcase, standing open (or swinging open), is looked at from the side. Both
  // the goal and the turning limits read this, or the two would pull the camera back and forth.
  function settingsOf(name) {
    const settings = VIEWS[name];
    return settings.open && (story.opening ? story.opening.to : story.open) > .5 ? { ...settings, target: settings.open.target, heading: settings.open.yaw } : settings;
  }
  function goalFor(name) {
    const t = blend(), aspect = (stage.clientWidth || 1) / (stage.clientHeight || 1), settings = settingsOf(name);
    if (settings.eye) {
      const lens = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(settings.span / 2)) / aspect));
      return { eye: new THREE.Vector3(...settings.eye), heading: lerp(settings.tallHeading ?? settings.heading, settings.heading, t), pitch: lerp(settings.tallPitch ?? settings.pitch, settings.pitch, t), fov: THREE.MathUtils.clamp(lens, settings.fov, settings.tallFov) };
    }
    const aim = new THREE.Vector3(...settings.target), reach = lerp(settings.tallDistance, settings.distance, t);
    // On a tall phone the tray sits along the bottom instead, so the subject is raised into the space above it.
    if (settings.tallDrop) aim.y -= settings.tallDrop * (1 - t);
    if (settings.aside) aim.add(new THREE.Vector3(Math.cos(settings.heading), 0, -Math.sin(settings.heading)).multiplyScalar(settings.aside * t));
    const turn = settings.heading ?? 0, tip = settings.pitch;
    return { eye: aim.add(new THREE.Vector3(Math.sin(turn) * Math.cos(tip), Math.sin(tip), Math.cos(turn) * Math.cos(tip)).multiplyScalar(reach)), heading: turn, pitch: tip, fov: lerp(settings.tallFov ?? settings.fov, settings.fov, t) };
  }
  const home = () => { const settings = settingsOf(view); return lerp(settings.tallHeading ?? settings.heading ?? 0, settings.heading ?? 0, blend()); };
  const turnLimit = () => VIEWS[view].turn;
  // Past the edge of the village the view gives a little, like paper, and springs back once let go.
  function clampTurn(value, soft = false) {
    const limit = turnLimit(), low = home() - limit, high = home() + limit;
    if (!Number.isFinite(limit)) return value;
    if (soft && value > high) return high + Math.min(.1, (value - high) * .3);
    if (soft && value < low) return low - Math.min(.1, (low - value) * .3);
    return THREE.MathUtils.clamp(value, low, high);
  }
  const clampPitch = value => THREE.MathUtils.clamp(value, VIEWS[view].minPitch, VIEWS[view].maxPitch);
  function frameView() {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, sharpest)); renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (trip || perched) return;
    const goal = goalFor(view); goalEye.copy(goal.eye); goalFov = goal.fov;
    if (!ready) { eye.copy(goalEye); fov = goalFov; heading = goalHeading = goal.heading; pitch = goalPitch = goal.pitch; }
    goalHeading = clampTurn(goalHeading);
  }
  function place() {
    // A near plane that follows the distance from the house keeps depth precise, so nothing shimmers far from the camera.
    camera.fov = fov; camera.near = THREE.MathUtils.clamp(eye.length() * .03, .03, .3); camera.updateProjectionMatrix();
    // High up during the arrival the haze thins out, so the whole village shows from the air.
    const lift = Math.max(0, eye.y - 4); scene.fog.near = 16 + lift * 1.2; scene.fog.far = 52 + lift * 1.8;
    camera.position.copy(eye);
    camera.lookAt(look.set(-Math.sin(heading) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(heading) * Math.cos(pitch)).add(eye));
  }

  // Idle life: the chair rocks, Santa breathes, the fire flickers, the lantern sways, smoke drifts up, the fair turns, the
  // sea moves. Reduced motion stills all of it.
  const tilt = new THREE.Quaternion(), side = new THREE.Vector3(1, 0, 0);
  function pose() {
    const still = motion.matches, t = clock;
    // The chair rocks; just after Santa has got up from it, it rocks harder for a while on its own.
    chair.rotation.x = still ? 0 : Math.sin(t * 1.7) * .028 + Math.exp(-(t - story.kick) * .7) * Math.sin((t - story.kick) * 4) * .09;
    if (santaModel) santaModel.visible = !story.away;
    // The seat and the note on it show only while he is out: sitting, his thighs slope down below the seat's front edge.
    for (const id of ['chair-note', 'chair-seat']) { const holder = sheets.get(id)?.holder; if (holder) holder.visible = story.away; }
    if (story.door && !trip) { const u = THREE.MathUtils.clamp((t - story.door.start) / story.door.length, 0, 1); rigs.get('door').rotation.y = lerp(story.door.from, story.door.to, ease(u)); }
    // Calling: the shut door rattles in its frame, as in a gust.
    const knock = moving('door'); if (knock !== null && !story.door && !trip) rigs.get('door').rotation.y = shiver(knock, 6, .035);
    // The bookcase swings on its hinge into the room.
    if (story.opening) { const u = THREE.MathUtils.clamp((t - story.opening.start) / 2.6, 0, 1); story.open = story.opening.from + (story.opening.to - story.opening.from) * ease(u); }
    // Hinged at its left edge, it swings out into the room toward the left wall, about 55°.
    // Calling, standing open, it swings a little further on its hinge and back (shut, it gives the shake below).
    const creak = moving('bookcase');
    rigs.get('bookcase').rotation.y = -.95 * story.open + (creak === null || story.opening ? 0 : shiver(creak, 3, .05) * story.open); secret.visible = story.open > 0 && indoorView(view);
    // A gold book calling hops twice where it stands (one held in the hand is left alone).
    const bounce = moving('book'), hopping = bounce === null ? null : letterBooks.get(calling.id);
    if (hopping && !hopping.userData.held && hopping.userData.goal) hopping.position.y = hopping.userData.goal.y + Math.abs(Math.sin(bounce * Math.PI * 2)) * .02 * (1 - bounce * .5);
    if (story.shake && t - story.shake < .5) rigs.get('bookcase').position.x = BOOKCASE.left + Math.sin((t - story.shake) * 60) * .004 * (1 - (t - story.shake) * 2); else rigs.get('bookcase').position.x = BOOKCASE.left;
    if (spine && spineRest) spine.quaternion.copy(spineRest).multiply(tilt.setFromAxisAngle(side, still ? 0 : Math.sin(t * 1.5) * .014));
    const flicker = still ? 0 : Math.sin(t * 9.1) * .5 + Math.sin(t * 13.7) * .3 + Math.sin(t * 5.3) * .2;
    // The fire burns as high as it is fed and flares when the bellows blow. Its light warms the room a little: the paper is
    // not lit by lamps, so its colour is warmed by hand. The books that spelled MORE glow for a moment.
    const warmth = hearth.heat / 3, blaze = hearth.lit ? 1 + hearth.heat * .22 + hearth.flare * .45 : .32 + hearth.flare * .12;
    // Calling, the fire licks up once and sinks back: a low one to twice its height, a burning one a little.
    const lick = moving('hearth'), leap = lick === null ? 0 : Math.sin(lick * Math.PI) * (hearth.lit ? .35 : 1.1) * (1 - lick * .3);
    for (const holder of flames) { holder.scale.y = (1 + flicker * .07) * blaze * (1 + leap); holder.scale.x = (1 + (still ? 0 : Math.sin(t * 7.3) * .025)) * (1 + hearth.heat * .08 + hearth.flare * .12); }
    deskGlow.material.opacity = THREE.MathUtils.clamp((eye.distanceTo(deskGlow.position) - .35) / .5, 0, 1);
    fireGlow.material.opacity = hearth.lit ? Math.min(1, .85 + flicker * .12 + hearth.flare * .15) : .3 + flicker * .08; fireGlow.scale.setScalar(hearth.lit ? 1 + warmth * .4 + hearth.flare * .3 : .55);
    fire.intensity = hearth.lit ? 2.2 + flicker * .4 + warmth * 2.4 + hearth.flare * 2 : .9 + flicker * .2; fire.distance = 3 + warmth * 1.4;
    const tint = warmth * .08 + hearth.flare * .04;
    for (const [material, base] of warmed) material.color.setRGB(base.r, base.g * (1 - tint * .45), base.b * (1 - tint));
    const glow = story.glint ? Math.max(0, Math.sin(Math.min(1, (t - story.glint.at) / 1.6) * Math.PI)) : 0;
    // The gold spines catch the firelight once the fire is lit, brighter the higher it burns.
    const gleaming = hearth.lit ? (.16 + warmth * .3 + hearth.flare * .25) * (.85 + flicker * .15) : 0;
    for (const [id, sheen] of sheens) sheen.opacity = Math.max(story.glint?.ids.includes(id) ? glow * .85 : 0, golden.has(id) ? gleaming : 0);
    if (story.glint && t - story.glint.at > 1.6) story.glint = null;
    (clones.get('hearth-log') ?? []).forEach((log, i) => { log.visible = hearth.heat > i; log.position.set(FIRE.x + [-.06, .06, 0][i], .1 + (i === 2 ? .05 : 0), BACK_WALL + .14 + i * .004); log.rotation.z = [.06, -.05, .02][i]; });
    // The bellows open in a V about the nozzle; squeezing closes them and folds the leather.
    const open = .34 * (1 - hearth.squeeze) + .05, [left, right, leather] = ['bellows-left', 'bellows-right', 'bellows-leather'].map(id => sheets.get(id)?.holder);
    if (left && right) { left.rotation.z = open; right.rotation.z = -open; }
    if (leather) leather.scale.x = .25 + .75 * open / .39;
    // The music box's key and its turning scene (two crossed cut-outs, so it never turns edge-on to nothing).
    const key = sheets.get('musicbox-key')?.holder, twitch = moving('musicbox'); if (key) key.rotation.z = musicbox.key + (twitch === null ? 0 : shiver(twitch, 4, .3));
    (clones.get('musicbox-scene') ?? []).forEach((scene, i) => { scene.rotation.y = musicbox.spin + i * Math.PI / 2; });
    // While it plays, the four gold bookmarks rise out of the box, a pair each side of its scene, and sway; after, they sink.
    musicbox.marks += ((musicbox.energy > 0 ? 1 : 0) - musicbox.marks) * (still ? 1 : .05);
    (clones.get('musicbox-bookmarks') ?? []).forEach((mark, i) => {
      mark.position.set((i ? 1 : -1) * BOOKMARKS.x, BOOKMARKS.rest + musicbox.marks * BOOKMARKS.rise, BOOKMARKS.z);
      mark.rotation.z = still ? 0 : Math.sin(t * 1.3 + i * 2) * .05 * musicbox.marks;
    });
    for (const [index, material] of twinkles.entries()) material.opacity = still ? 1 : .8 + Math.sin(t * 2.6 + index) * .2;
    for (const [index, holder] of candles.entries()) {
      holder.scale.set(1 + (still ? 0 : Math.sin(t * 8.3 + index * 2) * .05), 1 + (still ? 0 : Math.sin(t * 11.1 + index) * .07 + Math.sin(t * 5.7 + index * 3) * .05), 1);
      holder.rotation.z = still ? 0 : Math.sin(t * 4.1 + index) * .06;
    }
    for (const [index, texture] of snowfalls.entries()) if (!still) { texture.offset.y = (t * .045 + index * .37) % 1; texture.offset.x = Math.sin(t * .3 + index) * .03; }
    for (const [index, material] of glows.entries()) material.opacity = still ? 1 : .88 + Math.sin(t * 1.7 + index) * .1;
    for (const [holder, swing] of swings) holder.rotation.z = still ? 0 : Math.sin(t * 1.1 + holder.id) * swing;
    lanternGlow.material.opacity = .85 + (still ? 0 : Math.sin(t * 3.1) * .1);
    doorGlow.material.opacity = (hovered === 'house' ? .55 : .2) + (still ? 0 : Math.sin(t * 1.8) * .06);
    // The snowman's little performances: a hop, a spin when he is all dressed, a gentleman's bow, a reindeer's prance.
    if (snowman && snowmanMove) {
      const { kind, start: begun } = snowmanMove, length = { hop: 1.2, spin: 1.4, bow: 1.6, prance: 1.5 }[kind], u = Math.min(1, (t - begun) / length), holder = snowman.holder;
      const hop = kind === 'hop' ? Math.abs(Math.sin(u * Math.PI * 2)) * .2 * (1 - u * .5) : kind === 'prance' ? Math.abs(Math.sin(u * Math.PI * 3)) * .14 : kind === 'spin' ? Math.sin(u * Math.PI) * .22 : 0;
      holder.position.y = snowman.home.y + hop;
      holder.rotation.y = snowman.board.turn + (kind === 'spin' ? ease(u) * Math.PI * 2 : 0);
      holder.rotation.x = kind === 'bow' ? Math.sin(u * Math.PI) * .32 : 0;
      if (kind === 'prance') holder.rotation.z = Math.sin(u * Math.PI * 6) * .08 * (1 - u);
      if (u >= 1) { holder.position.y = snowman.home.y; holder.rotation.set(0, snowman.board.turn, 0); snowmanMove = null; }
    }
    for (const [id, started] of wiggles) {
      const u = (t - started) / 1.6;
      together(id, sheet => { sheet.holder.rotation.z = u < 1 ? Math.sin(u * Math.PI * 5) * .12 * (1 - u) : 0; });
      if (u >= 1) wiggles.delete(id);
    }
    // Whatever the mouse is over rises a little off the page.
    for (const [id, sheet] of lifting) {
      const goal = hovered === id ? 1.05 : 1;
      sheet.lift += (goal - sheet.lift) * (still ? 1 : .25); together(id, other => other.holder.scale.copy(other.base).multiplyScalar(sheet.lift));
      if (goal === 1 && Math.abs(sheet.lift - 1) < .002) { together(id, other => other.holder.scale.copy(other.base)); lifting.delete(id); }
    }
    // Things calling the visitor over. The trough's hay heaves (as if something stirred in it; also when the reindeer noses
    // it); the drift shudders and throws up a little snow; the snow globe and the sleigh rock on their feet; the shift log
    // swings on its nail; the register's top page lifts in a draught and falls back; the old record book rocks on its foot.
    const nosed = calling?.kind === 'reindeer' ? THREE.MathUtils.clamp(((t - calling.at) / calling.length - .35) / .5, 0, 1) : null, rustle = moving('trough') ?? nosed;
    const hay = sheets.get('trough'); if (rustle !== null && hay) hay.holder.scale.set(hay.base.x * (1 + shiver(rustle, 4, .025)), hay.base.y * (1 + Math.abs(shiver(rustle, 4, .07))), hay.base.z);
    const flurry = moving('snow-pile'), pile = sheets.get('snow-pile');
    if (flurry !== null && pile) {
      pile.holder.scale.set(pile.base.x * (1 + shiver(flurry, 3, .04)), pile.base.y * (1 - shiver(flurry, 3, .06)), pile.base.z);
      if (spray) { spray.visible = flurry < 1; spray.position.set(pile.home.x, pile.home.y + pile.board.h * .8 + flurry * .35, pile.home.z + .05); spray.scale.set(.18 + flurry * .3, .13 + flurry * .22, 1); spray.material.opacity = Math.sin(flurry * Math.PI) * .9; }
    }
    for (const [kind, id, size] of [['globe', 'snowglobe', .09], ['sleigh', 'sleigh', .045]]) { const u = moving(kind), sheet = sheets.get(id); if (u !== null && sheet) rock(sheet, shiver(u, 4, size)); }
    const sway = moving('secret-log'), log = sheets.get('secret-log'); if (sway !== null && log) pivot(log, FACING, shiver(sway, 4, .06), [0, log.board.h]);
    const draught = moving('register'), page = sheets.get('secret-page'); if (draught !== null && page) pivot(page, UPRIGHT, -Math.sin(draught * Math.PI) * .8 + shiver(draught, 7, .05), [-page.board.w / 2, 0]);
    const tip = moving('record'), record = sheets.get('secret-record'); if (tip !== null && record) rock(record, shiver(tip, 3, .12));
    // The reindeer's head follows the food in your hand. Eating, he chews (small quick bobs with the head a little down);
    // lichen, his favourite, makes him hop and nod; gingerbread he turns away from. Only the head bone turns and the whole
    // body lifts: nothing in the model is stretched.
    if (reindeerHead && reindeerRest) {
      const response = still ? 1 : .15;
      reindeerTurn[0] += (reindeerAim[0] - reindeerTurn[0]) * response; reindeerTurn[1] += (reindeerAim[1] - reindeerTurn[1]) * response;
      let extraYaw = 0, extraPitch = 0, hop = 0;
      if (reindeerAction) {
        const { kind } = reindeerAction, u = still ? 1 : Math.min(1, (t - reindeerAction.start) / (kind === 'nod' || kind === 'shake' ? 1.4 : 1.8));
        if (kind === 'nod') extraPitch = Math.sin(u * Math.PI * 4) * .18;
        if (kind === 'shake') extraYaw = Math.sin(u * Math.PI * 5) * .3;
        if (kind === 'chew') extraPitch = Math.sin(u * Math.PI) * .1 + Math.sin(u * Math.PI * 12) * .045 * (1 - u);
        if (kind === 'happy') { extraPitch = Math.sin(u * Math.PI * 4) * .2; hop = Math.abs(Math.sin(u * Math.PI * 2)) * .12 * (1 - u * .4); }
        // Calling: he turns to his trough and noses it, twice.
        if (kind === 'nuzzle') { const reach = Math.sin(u * Math.PI); extraYaw = -.55 * reach; extraPitch = .24 * reach + Math.sin(u * Math.PI * 6) * .05 * reach; }
        if (kind === 'refuse') extraYaw = Math.sin(Math.min(1, u * 3) * Math.PI / 2) * .5 * (u < .7 ? 1 : (1 - u) / .3) + Math.sin(u * Math.PI * 8) * .05;
        if (u >= 1) reindeerAction = null;
      }
      // At rest he is never quite still: breathing, shifting his weight, his head drifting a little.
      if (!still) { extraYaw += Math.sin(t * .6) * .07; extraPitch += Math.sin(t * 1.3 + 1) * .03; }
      reindeerShift += (reindeerAside - reindeerShift) * (still ? 1 : .05);
      reindeerHolder.position.set(REINDEER.x + ASIDE[0] * reindeerShift, GROUND + hop, REINDEER.z + ASIDE[1] * reindeerShift);
      reindeerShadow?.position.set(REINDEER.x + ASIDE[0] * reindeerShift + .28, GROUND + .003, REINDEER.z + ASIDE[1] * reindeerShift - .12);
      reindeerHolder.rotation.z = still ? 0 : Math.sin(t * .9) * .015;
      reindeerHolder.scale.set(reindeerScale, reindeerScale * (still ? 1 : 1 + Math.sin(t * 1.7) * .01), reindeerScale);
      reindeerHead.quaternion.copy(reindeerRest);
      reindeerHolder.updateMatrixWorld(true);
      const parent = reindeerHead.parent.getWorldQuaternion(new THREE.Quaternion()), across = new THREE.Vector3(1, 0, 0).applyQuaternion(reindeerHolder.quaternion);
      const delta = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), reindeerTurn[0] + extraYaw).multiply(new THREE.Quaternion().setFromAxisAngle(across, reindeerTurn[1] + extraPitch));
      reindeerHead.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
    }
    // The mailbox calling: its flag springs up (overshooting a little), then every four seconds the box hops and rattles.
    if (flag.mesh) {
      const since = flag.rise === null ? -1 : t - flag.rise, beat = since > 1.6 ? (since - 1.6) % 4 / .7 : 1, hop = still ? 1 : flag.up && beat < 1 ? beat : moving('mailbox') ?? 1;
      flag.mesh.rotation.z = still ? 0 : since < 0 ? -Math.PI / 2 : since < .8 ? -Math.PI / 2 * Math.exp(-7.5 * since) * Math.cos(since * 12.5) : hop < 1 ? Math.sin(hop * Math.PI * 4) * .35 * (1 - hop) : 0;
      mail.holder.position.y = mail.home.y + (hop < 1 ? Math.abs(Math.sin(hop * Math.PI * 2)) * .09 * (1 - hop * .4) : 0);
      mail.holder.rotation.z = hop < 1 ? Math.sin(hop * Math.PI * 6) * .07 * (1 - hop) : 0;
    }
    // The barn's repair tag swings for a moment; its drawer, pulled open, stands a little out of the wall.
    if (hoist.tag) { const u = (t - hoist.swing) / 1.4; hoist.tag.rotation.z = !still && u < 1 ? Math.sin(u * Math.PI * 5) * .35 * (1 - u) : 0; }
    // The desk's and the music box's drawers slide out of their slots, or back in.
    // Calling, the desk's drawer rattles in its slot.
    const rattle = moving('desk');
    for (const [id, drawer] of drawers) {
      drawer.out += (drawer.open - drawer.out) * (still ? 1 : .14); if (Math.abs(drawer.open - drawer.out) < .002) drawer.out = drawer.open;
      const reach = drawer.out * drawer.slide, share = reach / drawer.depth;
      drawer.box.position.z = drawer.base + reach + (id === 'desk' && rattle !== null ? shiver(rattle, 8, .01) : 0); drawer.inside.visible = reach > .002;
      if (!drawer.inside.visible) continue;
      drawer.bottom.scale.y = share; drawer.bottom.position.z = .004 - reach / 2; drawer.bottom.material.map.repeat.y = share;
      for (const wall of drawer.walls) { wall.scale.x = share; wall.position.z = .004 - reach / 2; }
    }
    for (const puff of smoke) {
      const life = still ? puff.userData.phase : (t * .18 + puff.userData.phase) % 1;
      puff.position.set(FIRE.x + life * 1.25, 3.38 + life * .6, FIRE.z); puff.scale.set(.3 + life * .4, .22 + life * .28, 1);
      puff.material.opacity = Math.sin(life * Math.PI) * .9;
    }
    if (world.visible) village(t, still);
    if (calling && t - calling.at >= calling.length) { calling = null; delete stage.dataset.beckon; }
  }
  // The village keeps slowly going: the wheel and the carousel turn, waves rock, a boat bobs, gulls circle the lighthouse,
  // skiers come down the runs and lift cabins climb. Under reduced motion each stands still where it is. The big wheel
  // keeps its own turning, so it can slow to a stop while it stands broken (a volunteer's job) and pick up again once mended.
  const fair = { broken: false, speed: 1, angle: 0, last: null };
  function village(t, still) {
    const turn = still ? 0 : t, wheel = sheets.get('wheel'), red = clones.get('car-red') ?? [], green = clones.get('car-green') ?? [];
    const step = fair.last === null ? 0 : Math.min(.1, Math.max(0, t - fair.last)); fair.last = t;
    fair.speed += ((fair.broken ? 0 : 1) - fair.speed) * Math.min(1, step * .8); fair.angle += step * .1 * fair.speed;
    // Calling while it stands broken, the big wheel lurches as if to start, and stops.
    const lurch = moving('wheel'), spin = (still ? 0 : fair.angle) + (lurch === null ? 0 : shiver(lurch, 2, .06));
    if (wheel) wheel.holder.rotation.z = spin;
    const cars = red.flatMap((car, i) => [car, green[i]]).filter(Boolean);
    cars.forEach((car, i) => { const angle = spin + i / 8 * Math.PI * 2; car.position.set(Math.cos(angle) * WHEEL.radius, Math.sin(angle) * WHEEL.radius, .08); });
    carousel.rotation.y = turn * .32;
    (clones.get('horse') ?? []).forEach((horse, i, all) => {
      const angle = i / all.length * Math.PI * 2;
      horse.position.set(Math.sin(angle) * CAROUSEL.ring, .95 + (still ? 0 : Math.sin(t * 2.2 + i * 1.7) * .1), Math.cos(angle) * CAROUSEL.ring); horse.rotation.y = angle;
    });
    ['wave-near', 'wave-mid'].forEach((id, i) => {
      const sheet = sheets.get(id); if (!sheet) return;
      const along = still ? 0 : Math.sin(t * .3 + i * 2) * .3, turned = sheet.board.turn;
      sheet.holder.position.set(sheet.home.x + Math.cos(turned) * along, sheet.home.y + (still ? 0 : Math.sin(t * .9 + i * 1.7) * .035), sheet.home.z - Math.sin(turned) * along);
    });
    const boat = sheets.get('boat');
    if (boat) { boat.holder.position.y = boat.home.y + (still ? 0 : Math.sin(t * .8) * .05); boat.holder.rotation.z = still ? 0 : Math.sin(t * .6) * .05; }
    beam.rotation.y = still ? .6 : t * .4; lampGlow.material.opacity = .55 + (still ? 0 : Math.sin(t * 1.6) * .15);
    if (skins.has('sea')) skins.get('sea').offset.x = still ? 0 : t * .01;
    foam.position.x = still ? 0 : Math.sin(t * .7) * .07;
    (clones.get('gull') ?? []).forEach((bird, i) => {
      const angle = turn * (.22 + i * .05) + i * 2.1, radius = 2.4 + i * .8;
      bird.position.set(LIGHTHOUSE.x - 3 + Math.cos(angle) * radius, 4.3 + i * .5 + (still ? 0 : Math.sin(t * .7 + i) * .2), LIGHTHOUSE.z + 1 + Math.sin(angle) * radius);
      bird.scale.y = still ? 1 : .55 + Math.abs(Math.sin(t * 5 + i)) * .45;
    });
    (clones.get('skier') ?? []).forEach((skier, i) => {
      const run = runs[i % runs.length], u = still ? .25 + i * .2 : (t * .035 + i * .37) % 1, at = run.getPoint(u), next = run.getPoint(Math.min(1, u + .01));
      skier.position.set(at.x, at.y + .3, .05); skier.scale.x = next.x < at.x ? -1 : 1; skier.visible = u < .985;
    });
    // The coaster train runs its timetable: out of the station, up the chain, down the drop, over the two lower hills and into
    // the tunnel, then a short wait out of sight. The station and the tunnel hill are a sheet in front of the cars, so a car is
    // hidden by them as it comes and goes; it is switched off only once it is fully inside. The cars keep a fixed spacing
    // along the rail, just above it, tilted with it.
    const train = [clones.get('coaster-car-a')?.[0], sheets.get('coaster-car-b')?.holder, clones.get('coaster-car-a')?.[1]].filter(Boolean), front = still ? .3 : ride.at(t % ride.length);
    train.forEach((car, i) => {
      const u = front - i * .034, x = u > 0 && u < 1 ? track.getPointAt(u).x : 9;
      car.visible = u > 0 && x < 6.25; if (!car.visible) return;
      const at = track.getPointAt(u), along = track.getTangentAt(u);
      car.position.set(at.x - along.y * .2, at.y + along.x * .2, .06); car.rotation.z = Math.atan2(along.y, along.x);
    });
    // Hot-air balloons hang over the fair, each drifting and bobbing on its own slow beat.
    // The green balloon is a single board, so it is a sheet rather than a set of clones.
    [...(clones.get('balloon-red') ?? []), sheets.get('balloon-green')?.holder].filter(Boolean).forEach((ball, i) => {
      const [x, y, z] = BALLOONS[i % BALLOONS.length], drift = still ? 0 : 1;
      ball.position.set(x + Math.sin(t * .13 + i * 2) * .6 * drift, y + Math.sin(t * .4 + i * 1.3) * .25 * drift, z + Math.cos(t * .11 + i) * .4 * drift);
    });
    // Two skaters glide round the pond, each on her own beat; seen from the visitor, she faces the way she is going.
    const across = [Math.cos(POND.turn), -Math.sin(POND.turn)], along = [Math.sin(POND.turn), Math.cos(POND.turn)], right = [Math.cos(heading), -Math.sin(heading)];
    ['skater-red', 'skater-green'].forEach((id, i) => {
      const skater = sheets.get(id)?.holder; if (!skater) return;
      const angle = (still ? 1 : t * (.45 + i * .12)) + i * Math.PI, [a, b] = POND.radius;
      const dx = across[0] * Math.cos(angle) * a + along[0] * Math.sin(angle) * b, dz = across[1] * Math.cos(angle) * a + along[1] * Math.sin(angle) * b;
      skater.position.set(POND.x + dx, GROUND + .01, POND.z + dz);
      const vx = -across[0] * Math.sin(angle) * a + along[0] * Math.cos(angle) * b, vz = -across[1] * Math.sin(angle) * a + along[1] * Math.cos(angle) * b;
      skater.scale.x = vx * right[0] + vz * right[1] < 0 ? -1 : 1;
    });
    // Buoys and the seal's floe ride the swell.
    (clones.get('buoy') ?? []).forEach((float, i) => { const [x, z] = FLOATS[i]; float.position.set(x, GROUND - .14 + (still ? 0 : Math.sin(t * 1.1 + i * 2) * .05), z); float.rotation.z = still ? 0 : Math.sin(t * .9 + i) * .08; });
    const floe = sheets.get('seal-floe');
    if (floe) { floe.holder.position.y = floe.home.y + (still ? 0 : Math.sin(t * .7 + 1) * .04); floe.holder.rotation.z = still ? 0 : Math.sin(t * .5) * .03; }
    (clones.get('gondola') ?? []).forEach((cabin, i, all) => {
      const u = still ? i / all.length : (t * .02 + i / all.length) % 1;
      cabin.position.set(lerp(LIFT.from[0], LIFT.to[0], u), lerp(LIFT.from[1], LIFT.to[1], u), .07);
    });
  }
  // The two skinned models cost far more to draw than all the paper together: Santa is drawn only on the way in, inside
  // and on the way out (from outside the walls hide him), the reindeer only while he is in view.
  const frustum = new THREE.Frustum(), viewProjection = new THREE.Matrix4(), reindeerBounds = new THREE.Sphere(new THREE.Vector3(REINDEER.x, GROUND + .7, REINDEER.z), 1.2);
  // What moves when something calls (`beckon`), and whether it is in sight: everything it hangs from shown, and its middle
  // inside the view (on a narrow screen a thing at the side waits until the visitor turns to it).
  const beckoning = id => ({ door: rigs.get('door'), bookcase: rigs.get('bookcase'), chair, reindeer: reindeerHolder, 'hoist-tag': hoist.tag, hearth: flames[0], desk: drawers.get('desk')?.box, musicbox: sheets.get('musicbox-key')?.holder, globe: sheets.get('snowglobe')?.holder, register: sheets.get('secret-page')?.holder, record: sheets.get('secret-record')?.holder })[id] ?? letterBooks.get(id) ?? sheets.get(id)?.holder;
  const bounds = new THREE.Box3(), middle = new THREE.Vector3();
  function showing(thing) {
    for (let node = thing; node; node = node.parent) if (!node.visible) return false;
    camera.updateMatrixWorld(); frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    return frustum.containsPoint(bounds.setFromObject(thing).getCenter(middle));
  }
  function draw() {
    place();
    chair.visible = indoorView(view) || trip?.direction === 'in' || trip?.direction === 'out';
    if (reindeerHolder) {
      camera.updateMatrixWorld(); frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      reindeerHolder.visible = frustum.intersectsSphere(reindeerBounds);
    }
    for (const item of billboards) item.rotation.y = Math.atan2(camera.position.x - item.position.x, camera.position.z - item.position.z);
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const active = dragging || settling || trip;
    if (!active && now - lastDraw < 33) return;
    const delta = Math.min((now - (lastTick || now)) / 1000, .1); lastTick = lastDraw = now; clock += delta;
    hearth.heat = Math.max(hearth.lit ? 1 : 0, hearth.heat - delta / 40); hearth.flare = Math.max(0, hearth.flare - delta * 1.4);
    for (const mesh of letterBooks.values()) if (mesh.userData.goal && !mesh.userData.held && mesh.position.distanceToSquared(mesh.userData.goal) > 1e-7) { mesh.position.lerp(mesh.userData.goal, Math.min(1, delta * 12)); settling = true; }
    if (musicbox.energy > 0 && !musicbox.held) { musicbox.spin += delta * (.5 + 2.4 * musicbox.energy); musicbox.key -= delta * (.6 + 1.8 * musicbox.energy); musicbox.energy = Math.max(0, musicbox.energy - delta / 26); }
    if (trip) walking();
    else {
      if (spin && !pointer) {
        const next = goalHeading + spin * delta, held = clampTurn(next);
        goalHeading = held; spin = held !== next ? 0 : spin * Math.exp(-3.2 * delta);
        if (Math.abs(spin) < .02) spin = 0;
      }
      const response = 1 - Math.exp(-7 * delta), travel = 1 - Math.exp(-travelRate * delta);
      heading += (goalHeading - heading) * response; pitch += (goalPitch - pitch) * response;
      eye.lerp(goalEye, travel); fov += (goalFov - fov) * travel;
      settling = spin !== 0 || Math.abs(goalHeading - heading) + Math.abs(goalPitch - pitch) + eye.distanceTo(goalEye) + Math.abs(goalFov - fov) > .002;
    }
    pose(); tracker?.update(delta); draw();
  }
  const stop = () => { cancelAnimationFrame(frame); frame = undefined; lastTick = 0; };
  const start = () => { if (frame === undefined && inView && !document.hidden) frame = requestAnimationFrame(tick); };
  // Under reduced motion nothing runs on its own: every change jumps straight to its end and draws once.
  // `redraw` also draws a still frame when the loop is stopped, for something that has just arrived.
  const redraw = () => { wake(); if (motion.matches || frame === undefined) draw(); };
  function wake() {
    if (!ready) return;
    if (motion.matches) { if (trip) finishTrip(); heading = goalHeading; pitch = goalPitch; eye.copy(goalEye); fov = goalFov; spin = 0; pose(); tracker?.update(1); draw(); }
    else { settling = true; start(); }
  }
  // Point the goals at a view. Outside comes back to wherever the visitor was looking before stepping away. A place that
  // `glide`s (the window sill, Santa's chair between it and the middle of the room) is turned toward first and walked up to
  // after, a little slower, so the chair goes out of sight to the side instead of sweeping past the eye. (Coming back
  // from it, the room is dark for the moment, cabin-advent.js.)
  let glideTimer = 0, travelRate = 3.2;
  function aim(name) {
    const goal = goalFor(name), facing = name === 'outside' ? away : name === 'inside' && roomAway ? roomAway : goal;
    const toEye = () => { goalEye.copy(goal.eye); goalFov = goal.fov; wake(); };
    clearTimeout(glideTimer); travelRate = 3.2; goalHeading = facing.heading; goalPitch = facing.pitch;
    if (motion.matches || !VIEWS[name]?.glide) { toEye(); return; }
    travelRate = 2.2; glideTimer = setTimeout(toEye, 420);
  }
  // One step back: from a place in the room to the middle of the room, from anywhere else out in front of the house.
  function back() { setView(VIEWS[view].room ? 'inside' : 'outside'); }
  function setView(name) {
    if (!VIEWS[name] || story.scripted) return;
    if (indoorView(name)) furnish();
    const asked = ++choice;
    if (indoorView(name) && !indoorView(view) && !roomIn) { roomReady.then(() => { if (asked === choice) setView(name); }); return; }
    if (trip?.direction === 'fly') finishTrip();
    if (trip) { pending = name; return; }
    if (name === view) return;
    const from = view; clearTimeout(returnTimer); spin = 0;
    if (from === 'outside') away = { heading: wrap(goalHeading), pitch: goalPitch };
    // Stepping up to something in the room remembers where you were looking, to face that way again after.
    if (from === 'inside' && VIEWS[name].room) roomAway = { heading: goalHeading, pitch: goalPitch };
    // Indoors leads only out of the door (a corner of the yard is reached by walking out first), and a place in the room is
    // reached by walking in first.
    if (indoorView(from) && !indoorView(name) && name !== 'outside') { pending = name; name = 'outside'; }
    if (!indoorView(from) && VIEWS[name].room) { pending = name; name = 'inside'; }
    view = name; stage.dataset.view = name;
    if (indoorView(name) !== indoorView(from)) { walk(indoorView(name) ? 'in' : 'out'); return; }
    aim(name); onView(name); wake();
  }

  // Walking in or out: along a fixed path through the front door, timed so the door swings open just before the eye reaches
  // it and shuts again behind (or, going out, in front of) it. The door opens outward, away from the walker. 'fly' is the
  // arrival: from high over the village down to where the visitor stands.
  function walk(direction, done) {
    const goal = goalFor(direction === 'in' ? 'inside' : 'outside'), inner = HOUSE.depth / 2;
    if (direction === 'out') { world.visible = true; goal.heading = away.heading; goal.pitch = away.pitch; }
    if (direction === 'in') onView('inside');
    const from = { at: 0, eye: eye.clone(), heading: direction === 'in' ? heading : wrap(heading), pitch, fov };
    const keys = direction === 'fly' ? [
      from,
      { at: .55, eye: new THREE.Vector3(-3.5, 7, 16), heading: -.22, pitch: .35, fov: 40 },
      { at: 1, ...goal },
    ] : direction === 'in' ? [
      from,
      { at: .36, eye: new THREE.Vector3(0, 1.45, front + 3), heading: 0, pitch: .07, fov: 42 },
      { at: .6, eye: new THREE.Vector3(0, 1.08, front + .55), heading: 0, pitch: .04, fov: 52 },
      { at: .8, eye: new THREE.Vector3(0, 1.1, inner - .25), heading: 0, pitch: .08, fov: 60 },
      { at: 1, ...goal },
    ] : [
      from,
      { at: .24, eye: new THREE.Vector3(0, 1.1, inner - .3), heading: 0, pitch: .1, fov: 60 },
      { at: .5, eye: new THREE.Vector3(0, 1.08, front + .7), heading: 0, pitch: .06, fov: 50 },
      { at: .76, eye: new THREE.Vector3(0, 1.6, front + 3.4), heading: 0, pitch: .1, fov: 42 },
      { at: 1, ...goal },
    ];
    trip = { direction, keys, done, curve: new THREE.CatmullRomCurve3(keys.map(key => key.eye)), start: clock, length: { fly: 5.2, in: 3.6, out: 3.4 }[direction] };
    stage.classList.add('is-walking'); setHover(null);
    if (motion.matches) { finishTrip(); wake(); } else { settling = true; start(); }
  }
  function walking() {
    const raw = Math.min(1, (clock - trip.start) / trip.length), u = ease(raw), { keys } = trip;
    let i = 0; while (i < keys.length - 2 && u > keys[i + 1].at) i++;
    const local = THREE.MathUtils.clamp((u - keys[i].at) / (keys[i + 1].at - keys[i].at), 0, 1), s = ease(local);
    trip.curve.getPoint((i + local) / (keys.length - 1), eye);
    heading = lerp(keys[i].heading, keys[i + 1].heading, s); pitch = lerp(keys[i].pitch, keys[i + 1].pitch, s); fov = lerp(keys[i].fov, keys[i + 1].fov, s);
    const open = { in: between(u, .42, .6) - between(u, .84, 1), out: between(u, .1, .3) - between(u, .56, .8) }[trip.direction] ?? 0;
    rigs.get('door').rotation.y = -open * DOOR.swing;
    if (raw >= 1) finishTrip();
  }
  function finishTrip() {
    const { direction, keys, done } = trip, last = keys.at(-1);
    trip = null; stage.classList.remove('is-walking');
    eye.copy(last.eye); goalEye.copy(last.eye); heading = goalHeading = last.heading; pitch = goalPitch = last.pitch; fov = goalFov = last.fov;
    rigs.get('door').rotation.y = 0; world.visible = direction !== 'in';
    if (direction === 'out') onView('outside');
    done?.();
    if (pending) { const next = pending; pending = null; setView(next); }
  }
  const onVisibility = () => { if (document.hidden) stop(); else if (!motion.matches) start(); };
  const onMotion = () => { if (motion.matches) { stop(); wake(); } else start(); };

  // Turning: drag anywhere on the stage, or use the arrow keys on the focused gesture button. A tap on the house walks in.
  const gesture = stage.querySelector('.cabin-gesture'), on = (node, type, handler, options = {}) => node?.addEventListener(type, handler, { ...options, signal: events.signal });
  function scheduleReturn() {
    clearTimeout(returnTimer);
    // Only the yard corners settle back by themselves, so the game laid over them stays lined up.
    if (motion.matches || !playing() || VIEWS[view].turn) return;
    returnTimer = setTimeout(() => { goalHeading = home(); goalPitch = VIEWS[view].pitch; wake(); }, RETURN_AFTER);
  }
  // Whether a point on screen is on Santa: a quick check against his box, then against the model itself.
  function onSanta(x, y) {
    if (!santaModel || story.away) return false;
    const box = new THREE.Box3().setFromObject(santaModel), rect = stage.getBoundingClientRect(), corners = [];
    for (const cx of [box.min.x, box.max.x]) for (const cy of [box.min.y, box.max.y]) for (const cz of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(cx, cy, cz).project(camera));
    if (corners.some(point => point.z > 1)) return false;
    const xs = corners.map(point => rect.left + (point.x + 1) / 2 * rect.width), ys = corners.map(point => rect.top + (1 - point.y) / 2 * rect.height);
    if (x < Math.min(...xs) || x > Math.max(...xs) || y < Math.min(...ys) || y > Math.max(...ys)) return false;
    // Inside his box, only a point on Santa himself counts: the bookcase behind him shows between his arm and the chair.
    ndc.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(santaModel, true).length > 0;
  }
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // Where on the stage part of a sheet shows ([left, top, right, bottom] of it, 0–1; null when behind the camera).
  function sheetRectOf(id, [x0, y0, x1, y1] = [0, 0, 1, 1]) {
    const sheet = sheets.get(id); if (!sheet) return null;
    const { holder, board } = sheet; holder.updateMatrixWorld(true);
    const rect = stage.getBoundingClientRect(), points = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([fx, fy]) => holder.localToWorld(new THREE.Vector3((fx - .5) * board.w, (1 - fy) * board.h, .01)).project(camera));
    if (points.some(point => point.z > 1)) return null;
    const xs = points.map(p => (p.x + 1) / 2 * rect.width), ys = points.map(p => (1 - p.y) / 2 * rect.height);
    return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  function hitAt(x, y) {
    const rect = stage.getBoundingClientRect(), targets = view === 'inside' ? roomTargets : view === 'outside' ? yardTargets : [];
    ndc.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    // Once the bookcase stands open, its doorway leads into the little room and the case itself is no longer a place.
    // The bookcase itself (its own target turns with it) is where to step up to it; its doorway, once open, leads in.
    const open = story.open > .5, usable = data => data.spot === 'secret' ? open : data.spot !== 'shelf';
    const hits = raycaster.intersectObjects(targets, false).map(hit => hit.object.userData).filter(usable);
    // The sleigh stands just behind the reindeer's corner: where it shows, left of him and above his trough, the tap (and
    // the pointer) is for the sleigh, not for the corner in front of it.
    const sleigh = view === 'outside' && hits[0]?.spot === 'reindeer' && hits.find(data => data.prop?.id === 'sleigh'), part = sleigh && sheetRectOf('sleigh', [0, .05, .6, .72]);
    if (part && x - rect.left >= part.left && x - rect.left <= part.left + part.width && y - rect.top >= part.top && y - rect.top <= part.top + part.height) return sleigh;
    return hits[0] ?? null;
  }
  // Screen rectangle (relative to the stage) of a spot's box or of any world-space box, for the games laid over the scene.
  function rectOfBox(center, size) {
    const rect = stage.getBoundingClientRect(), xs = [], ys = [];
    for (const dx of [-.5, .5]) for (const dy of [-.5, .5]) for (const dz of [-.5, .5]) {
      const point = new THREE.Vector3(center[0] + dx * size[0], center[1] + dy * size[1], center[2] + dz * size[2]).project(camera);
      xs.push((point.x + 1) / 2 * rect.width); ys.push((1 - point.y) / 2 * rect.height);
    }
    return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  function setHover(id) {
    if (id === hovered) return;
    hovered = id;
    const sheet = sheets.get(id);
    if (sheet && !sheet.board.rig) lifting.set(id, sheet);
    wake();
  }
  // A tap on a thing in the village or the room: a little wiggle, and its line for the caption.
  function touch(prop) {
    const sheet = sheets.get(prop.id);
    if (sheet && !sheet.board.rig && !motion.matches) { wiggles.set(prop.id, clock); wake(); }
    onTouch(prop.id, prop.note);
  }
  function tap(x, y) {
    if (view === 'inside') {
      if (onSanta(x, y)) { touch(ROOM_PROPS.find(prop => prop.id === 'santa')); return; }
      const hit = hitAt(x, y);
      if (hit?.prop?.id === 'door') setView('outside'); else if (hit?.bookcase) setView('shelf'); else if (hit?.spot) setView(hit.spot); else if (hit?.prop) touch(hit.prop);
      return;
    }
    if (view !== 'outside') return;
    const hit = hitAt(x, y), spot = hit?.spot;
    if (spot) setView(spot);
    else if (hit?.house) setView('inside');
    else if (hit?.prop) touch(hit.prop);
  }
  let hoverFrame = 0;
  on(gesture, 'pointermove', event => {
    if (pointer || trip || event.pointerType !== 'mouse' || hoverFrame) return;
    hoverFrame = requestAnimationFrame(() => {
      hoverFrame = 0;
      const hit = view === 'inside' && onSanta(event.clientX, event.clientY) ? { prop: { id: 'santa' } } : hitAt(event.clientX, event.clientY);
      stage.classList.toggle('is-pointing', Boolean(hit));
      setHover(hit?.spot ?? hit?.prop?.id ?? (hit?.house ? 'house' : null));
      gaze(event.clientX, event.clientY);
    });
  });
  on(gesture, 'pointerleave', () => { stage.classList.remove('is-pointing'); setHover(null); gaze(null); });
  // The reindeer looks at the pointer: at a point just in front of the screen, on the line through the pointer, so with the
  // pointer in the middle he looks straight at the visitor. Head turns are capped well inside what looks natural.
  function gaze(x, y) {
    if (x == null || !reindeerSkull || !(view === 'outside' || view === 'reindeer')) { reindeerAim = [0, 0]; wake(); return; }
    const rect = stage.getBoundingClientRect();
    ndc.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera);
    const toward = raycaster.ray.at(1.5, new THREE.Vector3()).sub(reindeerSkull.getWorldPosition(new THREE.Vector3()));
    reindeerAim = [THREE.MathUtils.clamp(wrap(Math.atan2(toward.x, toward.z) - REINDEER.turn), -.6, .6), THREE.MathUtils.clamp(-Math.atan2(toward.y, Math.hypot(toward.x, toward.z)), -.3, .35)];
    wake();
  }
  // Any touch or key during the arrival lands at once: nobody has to wait for the flight to start looking round.
  const land = () => { if (trip?.direction === 'fly') finishTrip(); };
  // At a corner of the yard the view holds still: the game laid over it gets every drag.
  const playing = () => SPOTS.some(spot => spot.id === view) || VIEWS[view].room === true;
  on(gesture, 'pointerdown', event => {
    land();
    if ((playing() && !VIEWS[view].turn) || story.scripted) return;
    if (pointer || trip || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, heading: goalHeading, pitch: goalPitch, moved: false, lastX: event.clientX, lastTime: performance.now(), speed: 0 };
    gesture.setPointerCapture?.(event.pointerId); dragging = true; spin = 0; clearTimeout(returnTimer); stage.classList.add('is-turning'); wake();
  });
  on(gesture, 'pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 6) pointer.moved = true;
    // The village moves with the finger: dragging right turns the view left, as if pulling the scene round.
    const span = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * camera.aspect), scale = span / Math.max(stage.clientWidth, 1) * 1.15;
    goalHeading = clampTurn(pointer.heading + (event.clientX - pointer.x) * scale, true);
    if (event.pointerType === 'mouse' || view === 'inside') goalPitch = clampPitch(pointer.pitch - (event.clientY - pointer.y) * scale);
    const now = performance.now(), elapsed = Math.max(1, now - pointer.lastTime);
    pointer.speed = pointer.speed * .6 + (event.clientX - pointer.lastX) * scale / elapsed * 1000 * .4; pointer.lastX = event.clientX; pointer.lastTime = now;
    wake();
  });
  const release = event => {
    if (!pointer || (event && event.pointerId !== pointer.id)) return;
    const tapped = !pointer.moved && event?.type === 'pointerup', flick = performance.now() - pointer.lastTime < 80 ? pointer.speed : 0;
    pointer = null; dragging = false; stage.classList.remove('is-turning');
    goalHeading = clampTurn(goalHeading);
    if (tapped) { tap(event.clientX, event.clientY); return; }
    if (Math.abs(flick) > .4 && !motion.matches) spin = THREE.MathUtils.clamp(flick, -3, 3);
    scheduleReturn(); wake();
  };
  on(gesture, 'pointerup', release); on(gesture, 'pointercancel', release); on(gesture, 'lostpointercapture', release);
  on(gesture, 'click', event => { if (event.detail === 0) setView(view === 'outside' ? 'inside' : 'outside'); });
  on(gesture, 'keydown', event => {
    land();
    const step = { ArrowLeft: [.15, 0], ArrowRight: [-.15, 0], ArrowUp: [0, -.06], ArrowDown: [0, .06] }[event.key];
    if (step && !trip && (!playing() || VIEWS[view].turn)) { event.preventDefault(); spin = 0; goalHeading = clampTurn(goalHeading + step[0]); goalPitch = clampPitch(goalPitch + step[1]); scheduleReturn(); wake(); }
    else if (event.key === 'Escape' && view !== 'outside') { event.preventDefault(); back(); }
    else if (event.key === 'Home' && !trip) { goalHeading = home(); goalPitch = VIEWS[view].pitch; wake(); }
  });

  ready = true; frameView();
  if (flying) {
    perched = true; eye.set(...ARRIVAL.eye); goalEye.copy(eye); heading = goalHeading = ARRIVAL.heading; pitch = goalPitch = ARRIVAL.pitch; fov = goalFov = ARRIVAL.fov;
  }
  pose(); tracker?.update(0); draw();
  resize = new ResizeObserver(() => { frameView(); wake(); if (motion.matches || frame === undefined) draw(); });
  visible = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView && !motion.matches) start(); else stop(); });
  resize.observe(stage); visible.observe(stage);
  document.addEventListener('visibilitychange', onVisibility, { signal: events.signal });
  motion.addEventListener('change', onMotion, { signal: events.signal });
  renderer.domElement.addEventListener('webglcontextrestored', draw, { signal: events.signal });
  stage.dataset.view = view;
  if (!motion.matches) start();
  const roomReady = Promise.all([...after.filter(indoor).map(board => addBoard(board).catch(error => console.error('Room board failed', board.id, error))), buildBookcase().catch(error => console.error('Bookcase failed', error))]).then(() => { roomIn = true; redraw(); return Promise.all(Object.keys(DRAWERS).map(id => buildDrawer(id).catch(error => console.error('Drawer failed', id, error)))); });
  for (const board of after.filter(board => !indoor(board))) addBoard(board).then(redraw, error => console.error('Village board failed', board.id, error));
  const santaReady = loadSanta();
  if (!reindeer) loadReindeer();

  function destroy() {
    stop(); clearTimeout(returnTimer); clearTimeout(glideTimer); clearTimeout(story.mend); storyTimers.forEach(clearTimeout); cancelAnimationFrame(hoverFrame); resize?.disconnect(); visible?.disconnect();
    release3d();
  }
  // What the games may do to the scene.
  // Set a board's look outright (undefined: as it was drawn); repaint() below changes only part of it.
  // A board not cut yet (the room comes after the page opens) may already be on its way in its first look: it is cut
  // again in the new one as soon as it arrives (addBoard).
  function restyle(id, state) { const sheet = sheets.get(id), board = sheet?.board ?? BOARDS.find(item => item.id === id); if (!board) return; board.state = state; if (sheet) return paintSheet(id, sheet); restyled.add(id); }
  const storyTimers = [];
  function repaint(id, patch) {
    const sheet = sheets.get(id); if (!sheet) return;
    sheet.board.state = { ...sheet.board.state, ...patch }; return paintSheet(id, sheet);
  }
  async function paintSheet(id, sheet) {
    const image = await cutBoard(id, sheet.board, set);
    if (disposed) return;
    const next = texture(image), old = sheet.material.map;
    sheet.material.map = next; if (sheet.edges) sheet.edges.map = next; textures.delete(old); old.dispose(); wake(); if (motion.matches || frame === undefined) draw();
  }
  const api = {
    // Resolves true once Santa sits in his chair, false if his model could not load.
    santa: santaReady, destroy, setView, get view() { return view; }, repaint, restyle,
    // Where the visitor is: the yard (and the village round it), the room, or the little room behind the bookcase.
    get where() { return view === 'secret' ? 'little' : indoorView(view) ? 'room' : 'yard'; },
    rect: id => { const spot = [...SPOTS, ...ROOM_SPOTS].find(item => item.id === id); return spot ? rectOfBox(...spot.box) : null; },
    back,
    // The hearth: feed the fire a log (false when it already burns as high as it goes), squeeze the bellows (0–1) and let
    // them blow; and where the fire's mouth, the basket and the bellows' handles are on screen.
    hearthAdd() { if (!hearth.lit || hearth.heat > 2.5) return false; hearth.heat = Math.min(3, hearth.heat + 1); redraw(); return true; },
    // Lit with a match, for good (`now`: already burning when the room comes back).
    light(now = false) { if (hearth.lit) return; hearth.lit = true; hearth.heat = Math.max(hearth.heat, now ? 1 : 2.2); hearth.flare = now || motion.matches ? 0 : 1.2; redraw(); },
    get lit() { return hearth.lit; },
    bellows(amount) { hearth.squeeze = THREE.MathUtils.clamp(amount, 0, 1); redraw(); },
    blow() { hearth.flare = motion.matches ? 0 : 1; if (hearth.lit) hearth.heat = Math.min(3, hearth.heat + .3); redraw(); },
    get heat() { return hearth.heat; },
    // The story. Santa goes out to the reindeer: the view turns to the door, the coat leaves its peg, the door opens and
    // shuts, and turning back the chair is empty and still rocking. Resolves when it is over. He comes back unseen.
    get santaHome() { return !story.away && Boolean(santaModel); },
    santaLeave() {
      if (story.away || !santaModel || view !== 'inside' || trip) return Promise.resolve(false);
      return new Promise(done => {
        const quick = motion.matches, at = (ms, run) => storyTimers.push(setTimeout(() => { if (!disposed) run(); }, quick ? 0 : ms));
        story.scripted = true; spin = 0; const facing = { heading: goalHeading, pitch: goalPitch };
        goalHeading = 2.5; goalPitch = .1; wake();
        at(1500, () => { story.away = true; story.kick = clock; restyle('decor-coat', { coat: false }); story.door = { from: 0, to: -DOOR.swing * .75, start: clock, length: .45 }; wake(); });
        at(2300, () => { story.door = { from: -DOOR.swing * .75, to: 0, start: clock, length: .45 }; wake(); });
        at(3000, () => { goalHeading = facing.heading; goalPitch = facing.pitch; wake(); });
        at(4300, () => { story.scripted = false; story.door = null; rigs.get('door').rotation.y = 0; redraw(); done(true); });
      });
    },
    santaBack() { if (!story.away) return; story.away = false; restyle('decor-coat', {}); redraw(); },
    // He comes back in the same way, the other way round: the door, his coat on its peg again, and him in his chair.
    santaReturn() {
      if (!story.away || view !== 'inside' || trip) return Promise.resolve(false);
      return new Promise(done => {
        const quick = motion.matches, at = (ms, run) => storyTimers.push(setTimeout(() => { if (!disposed) run(); }, quick ? 0 : ms));
        story.scripted = true; spin = 0; const facing = { heading: goalHeading, pitch: goalPitch };
        goalHeading = 2.5; goalPitch = .1; wake();
        at(1400, () => { story.door = { from: 0, to: -DOOR.swing * .75, start: clock, length: .45 }; wake(); });
        at(2200, () => { story.door = { from: -DOOR.swing * .75, to: 0, start: clock, length: .45 }; story.away = false; restyle('decor-coat', {}); wake(); });
        at(2900, () => { goalHeading = facing.heading; goalPitch = facing.pitch; wake(); });
        at(4200, () => { story.scripted = false; story.door = null; rigs.get('door').rotation.y = 0; redraw(); done(true); });
      });
    },
    // Where something on one of the room's sheets is on screen: `place` is [left, top, right, bottom] as fractions.
    // The two drawers that slide out (the desk's, the music box's): open or shut, and the look of their front and floor
    // (`front`, `inside`: states of their pieces).
    drawer(id, { open, front, inside } = {}) {
      const look = { ...(drawerLooks.get(id) ?? {}) };
      if (open !== undefined) look.open = open;
      if (front) look.front = front;
      if (inside) look.inside = inside;
      drawerLooks.set(id, look);
      const drawer = drawers.get(id); if (!drawer) return;
      drawer.open = look.open ? 1 : 0; restyleDrawer(id); redraw();
    },
    // Where a drawer's front is on screen (stage pixels), wherever it has slid to; null before it is there.
    drawerRect(id) {
      const drawer = drawers.get(id); if (!drawer) return null;
      const { face } = drawer, { width: w, height: h } = face.geometry.parameters; face.updateMatrixWorld(true);
      const rect = stage.getBoundingClientRect(), points = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => face.localToWorld(new THREE.Vector3(sx * w / 2, sy * h / 2, 0)).project(camera));
      if (points.some(point => point.z > 1)) return null;
      const xs = points.map(p => (p.x + 1) / 2 * rect.width), ys = points.map(p => (1 - p.y) / 2 * rect.height);
      return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    },
    get drawersReady() { return drawers.size === Object.keys(DRAWERS).length; },
    sheetRect: sheetRectOf,
    // The letter books: where each place is on screen (and which book stands there), holding one up to the pointer, which
    // place it was let go over (or -1), and laying them all out as the shelf now stands.
    bookRects(shelf) {
      const rig = rigs.get('bookcase'); rig.updateMatrixWorld(true);
      return bookPlaces.map(([x, y], place) => {
        const id = shelf[place], [w, h] = id ? letterBooks.get(id)?.userData.size ?? [.07, .26] : [.072, .25];
        const corners = [[x - w / 2, y], [x + w / 2, y], [x - w / 2, y + h], [x + w / 2, y + h]].map(([px, py]) => rig.localToWorld(new THREE.Vector3(px, py, .2)).project(camera));
        const rect = stage.getBoundingClientRect(), xs = corners.map(p => (p.x + 1) / 2 * rect.width), ys = corners.map(p => (1 - p.y) / 2 * rect.height);
        return { id, left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      });
    },
    holdBook(id, clientX, clientY) {
      const mesh = letterBooks.get(id); if (!mesh) return;
      const rig = rigs.get('bookcase'), rect = stage.getBoundingClientRect(); rig.updateMatrixWorld(true);
      ndc.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera);
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(rig.matrixWorld), plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, rig.localToWorld(new THREE.Vector3(0, 0, .3))), hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const local = rig.worldToLocal(hit), [, h] = mesh.userData.size;
      for (const other of letterBooks.values()) if (other !== mesh && other.userData.held) { other.userData.held = false; other.rotation.z = 0; }
      mesh.userData.held = true; mesh.position.set(THREE.MathUtils.clamp(local.x, .04, BOOKCASE.width - .04), THREE.MathUtils.clamp(local.y - h / 2, .05, BOOKCASE.height - h), .12); mesh.rotation.z = .06;
      wake(); if (motion.matches || frame === undefined) draw();
    },
    dropBook(id) {
      const mesh = letterBooks.get(id); if (!mesh) return -1;
      mesh.userData.held = false; mesh.rotation.z = 0;
      const [, h] = mesh.userData.size, x = mesh.position.x, y = mesh.position.y + h / 2;
      let best = -1, near = Infinity;
      bookPlaces.forEach(([px, py], place) => { const d = Math.hypot(px - x, (py + .13 - y) * .5); if (d < near) { near = d; best = place; } });
      return near < .08 ? best : -1;
    },
    placeBooks(shelf) {
      shelfNow = [...shelf];
      // Every book back on the shelf as it now stands: none is left in hand, or leaning.
      shelf.forEach((id, place) => { const mesh = id && letterBooks.get(id); if (mesh) { bookGoal(mesh, place); mesh.userData.held = false; mesh.rotation.z = 0; } });
      if (motion.matches) for (const mesh of letterBooks.values()) mesh.position.copy(mesh.userData.goal);
      redraw();
    },
    // The four books that spelled it light up, the case gives a little shake, then it swings open into the room; or stands
    // open already.
    glintBooks(ids = []) { hearth.flare = motion.matches ? 0 : 1.6; story.shake = motion.matches ? null : clock; story.glint = motion.matches ? null : { at: clock, ids }; redraw(); },
    // Once the puzzle is solved the bookcase is a door: it can be pushed shut and opened again. Shutting, the wall behind
    // is mended only once the case covers the doorway again.
    openBookcase(open = true, animate = true) {
      story.solved = true; clearTimeout(story.mend);
      const still = !animate || motion.matches;
      if (open || still) restyle('back', open ? { secret: true } : undefined);
      else story.mend = setTimeout(() => { if (!disposed && story.open < .01) restyle('back', undefined); }, 2700);
      if (still) { story.opening = null; story.open = open ? 1 : 0; } else story.opening = { from: story.open, to: open ? 1 : 0, start: clock };
      // Up close, the view turns with it: past the open case into the doorway, or square on to the shelves.
      if (view === 'shelf') aim('shelf');
      redraw();
    },
    get bookcaseOpen() { return story.open > .5; },
    // The big wheel broken (it slows to a stop) or going again.
    wheelBroken(broken, animate = true) { fair.broken = broken; if (!animate || motion.matches) fair.speed = broken ? 0 : 1; redraw(); },
    // The music box: turn its key by `angle` (radians, positive winds it; it takes three turns), hold it still while a hand
    // is on it, and how wound it is now (0–1); where its key and box are on screen.
    wind(angle) { const before = musicbox.energy; musicbox.energy = THREE.MathUtils.clamp(musicbox.energy + angle / (Math.PI * 6), 0, 1); musicbox.key += (musicbox.energy - before) * Math.PI * 6; redraw(); return musicbox.energy; },
    holdKey(held) { musicbox.held = held; redraw(); },
    get wound() { return musicbox.energy; },
    musicRects() {
      const key = sheets.get('musicbox-key')?.holder; if (!key) return null;
      key.updateMatrixWorld(true);
      return { key: rectOfBox(key.getWorldPosition(new THREE.Vector3()).toArray(), [.08, .08, .08]), box: rectOfBox([MUSICBOX.x, MUSICBOX.y + .1, MUSICBOX.z], [.16, .26, .3]) };
    },
    // The snow globe: where it stands on screen, and hiding it while the one that can be shaken is laid over it.
    globeRect: () => rectOfBox([GLOBE.x, GLOBE.y + GLOBE.h / 2, GLOBE.z], [GLOBE.w, GLOBE.h, .001]),
    showGlobe(shown) { const globe = sheets.get('snowglobe')?.holder; if (globe) globe.visible = shown; redraw(); },
    // Where the things on the desk are on screen (stage pixels), from their places on the desk's sheet.
    deskRects() {
      const holder = sheets.get('desk')?.holder; if (!holder) return null;
      holder.updateMatrixWorld(true);
      const rect = stage.getBoundingClientRect(), corner = (fx, fy) => holder.localToWorld(new THREE.Vector3((fx - .5) * DESK.w, (1 - fy) * DESK.h, .01)).project(camera);
      return Object.fromEntries(Object.entries(DESK.items).map(([name, [x0, y0, x1, y1]]) => {
        const points = [corner(x0, y0), corner(x1, y0), corner(x0, y1), corner(x1, y1)], xs = points.map(p => (p.x + 1) / 2 * rect.width), ys = points.map(p => (1 - p.y) / 2 * rect.height);
        return [name, { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }];
      }));
    },
    hearthRects() {
      const [left, right] = ['bellows-left', 'bellows-right'].map(id => sheets.get(id)?.holder);
      if (!left || !right) return null;
      const tip = holder => { holder.updateMatrixWorld(true); return holder.localToWorld(new THREE.Vector3(0, .34, 0)); };
      const handles = tip(left).add(tip(right)).multiplyScalar(.5);
      return { mouth: rectOfBox([FIRE.x, .27, BACK_WALL + .2], [.46, .3, .05]), basket: rectOfBox([.47, .17, BACK_WALL + .42], [.34, .22, .05]), bellows: rectOfBox(handles.toArray(), [.22, .16, .05]) };
    },
    rectOfBox,
    // Fly down from over the village to the front of the house; resolves once landed (at once when there is no flight).
    arrive() { if (!perched) return Promise.resolve(); perched = false; return new Promise(done => walk('fly', done)); },
    wave(id) { if (!motion.matches) { wiggles.set(id, clock); wake(); } },
    // A thing calling the visitor over when they seem stuck (cabin-play.js): its little move, only where it can be seen.
    // False when out of sight, something else is already moving, or nothing moves at all (reduced motion).
    beckon(id) {
      const kind = id.startsWith('book-') ? 'book' : id, thing = beckoning(id);
      if (motion.matches || calling || trip || story.scripted || !BECKON[kind] || !thing || !showing(thing)) return false;
      calling = { id, kind, at: clock, length: BECKON[kind] };
      if (kind === 'hoist-tag') hoist.swing = clock;
      if (kind === 'chair') story.kick = clock;
      if (kind === 'reindeer') reindeerAction = { kind: 'nuzzle', start: clock };
      if (kind === 'bookcase' && story.open < .5) story.shake = clock;
      stage.dataset.beckon = id; wake(); return true;
    },
    // Put an accessory on the snowman (null takes that place's off). Resolves once it shows.
    async dress(place, id) {
      const slot = worn.get(place), item = id && itemFor(id);
      if (!slot) return;
      slot.id = item ? id : null;
      if (!item) { slot.mesh.visible = false; wake(); if (motion.matches || frame === undefined) draw(); return; }
      const map = await outfitTexture(item);
      if (disposed || slot.id !== id) return;
      slot.mesh.material.map = map; slot.mesh.material.needsUpdate = true; slot.mesh.visible = true; wake(); if (motion.matches || frame === undefined) draw();
    },
    // Where a place on the snowman is on screen (stage pixels), for the tray's drop targets.
    placeRect(place) {
      const slot = worn.get(place); if (!slot) return null;
      const rect = stage.getBoundingClientRect(), { size: [w, h] } = PLACES[place], xs = [], ys = [];
      slot.mesh.updateWorldMatrix(true, false);
      for (const [dx, dy] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) {
        const point = new THREE.Vector3(dx * w, dy * h, 0).applyMatrix4(slot.mesh.matrixWorld).project(camera);
        xs.push((point.x + 1) / 2 * rect.width); ys.push((1 - point.y) / 2 * rect.height);
      }
      return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    },
    // The hay hoist: how far the bale is wound up (0–1) and where the crank stands (radians; by default as far as the
    // rope wound in has turned it); whether the crank is fitted; a swing of the repair tag; and where its parts are on
    // screen (the drawer behind the bale is `drawer('barn')`).
    hoist(pull, turn) { hoist.pull = THREE.MathUtils.clamp(pull, 0, 1); hoist.turn = turn; placeHoist(); wake(); if (motion.matches || frame === undefined) draw(); },
    fitCrank(fitted) { if (!hoist.crank) return; hoist.crank.visible = fitted; redraw(); },
    swingTag() { hoist.swing = clock; wake(); },
    hoistRects() {
      if (!barn || !hoist.bale) return null;
      barn.holder.updateMatrixWorld(true);
      const [gw, gh] = WINCH.tag, reach = WINCH.arm + WINCH.crank[0] / 2;
      const local = (center, size) => {
        const rect = stage.getBoundingClientRect(), xs = [], ys = [];
        for (const dx of [-.5, .5]) for (const dy of [-.5, .5]) {
          const point = new THREE.Vector3(center[0] + dx * size[0], center[1] + dy * size[1], center[2]).applyMatrix4(barn.holder.matrixWorld).project(camera);
          xs.push((point.x + 1) / 2 * rect.width); ys.push((1 - point.y) / 2 * rect.height);
        }
        return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      };
      // `crank` is the circle its knob runs round, to turn a drag about the hub into turns of the winch.
      return { winch: local([WINCH.x, WINCH.y, .2], WINCH.plate), crank: local([WINCH.x, WINCH.y, .21], [reach * 2, reach * 2]), tag: local([WINCH.tagAt[0] + gw * .44, WINCH.tagAt[1] - gh / 2, .19], [gw, gh]), wheel: local([HOIST.x, HOIST.wheel, .21], [HOIST.radius * 2, HOIST.radius * 2]) };
    },
    // The mailbox's flag: up while Santa's letter waits unread, down (hidden) once the box has been opened.
    mailFlag(up) { flag.up = up; if (flag.mesh) flag.mesh.visible = up; redraw(); },
    // The visitor has arrived in the yard: a moment later (the loader may still be fading) the flag springs up from lying
    // down. Reduced motion: it is simply up.
    mailCall() { if (flag.rise === null) { flag.rise = clock + .7; wake(); } },
    snowmanAct(kind) { if (motion.matches || !snowman) return; snowmanMove = { kind, start: clock }; wake(); },
    // A thing in the village touched without a pointer (from the explore list): its wiggle, and its line.
    touch(id) { const prop = PROPS.find(each => each.id === id); if (prop) touch(prop); },
    // Turn to face one side of the village: 'left' (the fair), 'right' (the coast) or 'back' (the house and the mountain).
    look(direction) {
      const turn = { left: 1.2, right: -1.2 }[direction] ?? lerp(VIEWS.outside.tallHeading, 0, blend());
      away = { heading: turn, pitch: VIEWS.outside.pitch };
      if (view !== 'outside') { setView('outside'); return; }
      spin = 0; goalHeading = clampTurn(turn); goalPitch = away.pitch; wake();
    },
    // Points the reindeer's head at a spot on the stage (stage pixels); null looks straight ahead again.
    reindeerLook(point) { const rect = stage.getBoundingClientRect(); gaze(point && rect.left + point.x, point && rect.top + point.y); },
    reindeerAct(kind) { reindeerAction = kind ? { kind, start: clock } : null; wake(); },
    // Steps aside from his trough (or back to where he stood); at once when `now`.
    reindeerStep(aside, now = false) { reindeerAside = aside ? 1 : 0; if (now) reindeerShift = reindeerAside; redraw(); },
    // His mouth on screen (stage pixels), a little generous, for the food to be dropped into.
    mouthRect() {
      if (!reindeerSkull) return null;
      reindeerHolder.updateMatrixWorld(true);
      return rectOfBox(reindeerSkull.localToWorld(MOUTH.clone()).toArray(), [.34, .3, .34]);
    },
  };
  return api;

  function free(model) {
    model.traverse(node => {
      node.geometry?.dispose();
      for (const material of [node.material].flat()) { if (!material) continue; Object.values(material).forEach(value => { if (value?.isTexture) value.dispose(); }); material.dispose(); }
      node.skeleton?.dispose();
    });
  }
  // Hoisted, and touches nothing declared after the first await, so an abandoned load can call it too.
  function release3d() {
    disposed = true; events.abort(); tracker?.destroy();
    models.forEach(free);
    textures.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); geometries.forEach(value => value.dispose());
    environment?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
}
