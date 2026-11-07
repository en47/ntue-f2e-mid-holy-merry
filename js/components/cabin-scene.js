// Santa's Cabin in Three.js: a paper dollhouse with its front cut away, standing in a snowfield that runs out to the hills.
// Two views share one scene: "outside" sees the whole house and turns it; "inside" moves the camera up to Santa.
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { BOARDS, CHAIR, FIRE, GROUND, HOUSE, LANTERN, PX, REINDEER, SIGN, SMOKE } from './cabin-art.js';
import { paperFilter, shape } from './paper-art.js';
import { createHeadTracker } from './santa-head.js';

// Head turns stay small and are shared with the neck: larger angles crease the beard (see docs/SANTA-CABIN.md).
const HEAD = { maxYaw: .24, maxPitch: .1 };
// The snow is the footer's own colour, so the page runs on into it; far away it fades into the morning haze.
const RETURN_AFTER = 1600, PAPER_EDGE = 0xefe1c4, CUT = 0xf5ecdc, SNOWFIELD = 0xfff9eb, HAZE = 0xf3e7dd;
// What each view looks at, how far it stands back (or what it must fit), its lens, and how far it may turn (radians).
const VIEWS = {
  outside: { target: [0, 1.7, .3], tallTarget: [-.85, 1.7, .3], fit: [8.8, 5.6], tallFit: [6, 5.6], fov: 36, pitch: .24, maxYaw: .55, minPitch: .1, maxPitch: .44 },
  inside: { target: [CHAIR.x + .15, .62, CHAIR.z], distance: 2.5, tallDistance: 3.2, fov: 34, pitch: .12, maxYaw: .32, minPitch: .02, maxPitch: .28 },
};
let paperCount = 0;

// Each board is cut once into an image; nothing in the SVG animates afterwards.
async function paintBoard(board, quality) {
  // Distant scenery is drawn at fewer art units per metre; room surfaces are cut a little coarser to save memory.
  const px = board.px ?? PX, width = Math.round(board.w * px), height = Math.round(board.h * px), density = board.kind === 'wall' || board.kind === 'floor' ? .7 : 1;
  const svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width: Math.round(width * quality * density), height: Math.round(height * quality * density) });
  const plain = shape('g', {}, svg);
  const paper = shape('g', { filter: paperFilter(svg, `cabin-paper-${++paperCount}`, { scale: board.kind === 'scenery' ? .8 : board.kind ? 1.6 : 1.1, grain: .5, shadow: 0 }) }, svg);
  board.draw({ plain, paper, svg }, { width, height });
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  await image.decode();
  return image;
}

// A cream copy of a board's silhouette, set just behind it, shows as the paper's cut edge when the house turns.
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

export async function mountCabin(stage, { onProgress = () => {}, onView = () => {}, isCurrent = () => true } = {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'cabin-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true');
  const textures = new Set(), materials = new Set(), geometries = new Set(), models = [], events = new AbortController();
  const keep = (set, value) => { set.add(value); return value; };
  // All state lives up here: the head tracker can call wake() while the boards are still being cut.
  let view = 'outside', yaw = 0, pitch = VIEWS.outside.pitch, goalYaw = 0, goalPitch = VIEWS.outside.pitch, ready = false;
  let frame, lastTick = 0, lastDraw = 0, clock = 0, inView = true, dragging = false, returnTimer = 0, settling = false, resize, visible;
  const target = new THREE.Vector3(...VIEWS.outside.target), goalTarget = target.clone();
  let distance = 9, goalDistance = 9, fov = VIEWS.outside.fov, goalFov = fov;

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 1, .05, 80);
  const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
  let environment;
  try { environment = pmrem.fromScene(room, .04); } finally { room.dispose(); pmrem.dispose(); }
  scene.environment = environment.texture; scene.environmentIntensity = .5;
  scene.fog = new THREE.Fog(HAZE, 16, 52);
  // Morning sun low in the upper left, as on every page; the snow bounces a cool light back up.
  scene.add(new THREE.HemisphereLight(0xeaf2f7, 0xd9e2ea, 1.05));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.5); sun.position.set(-6, 7, 5); scene.add(sun);
  const fire = new THREE.PointLight(0xff9a4a, 2.2, 3, 1.6); fire.position.set(FIRE.x, .45, -.5); scene.add(fire);
  const lanternLight = new THREE.PointLight(0xffd59a, 1.1, 3.6, 1.4); lanternLight.position.set(LANTERN.x, 2.2, LANTERN.z); scene.add(lanternLight);

  const house = new THREE.Group(), chair = new THREE.Group();
  chair.position.set(CHAIR.x, 0, CHAIR.z); house.add(chair); scene.add(house);
  const solid = (geometry, colour, position) => {
    const mesh = new THREE.Mesh(keep(geometries, geometry), keep(materials, new THREE.MeshStandardMaterial({ color: colour, roughness: 1, metalness: 0 })));
    mesh.position.copy(position); house.add(mesh); return mesh;
  };

  // The snowfield, flat-coloured like the footer below; fog turns it to haze toward the hills.
  const field = new THREE.Mesh(keep(geometries, new THREE.CircleGeometry(70, 64)), keep(materials, new THREE.MeshBasicMaterial({ color: SNOWFIELD, toneMapped: false })));
  field.rotation.x = -Math.PI / 2; field.position.y = GROUND; scene.add(field);
  // The foundation slab and the cream cut edges that make it read as a house sliced open. Every cut face sits a hair inside
  // the boards around it: two faces in exactly the same plane flicker as the camera turns.
  const gap = .004;
  solid(new THREE.BoxGeometry(HOUSE.width + HOUSE.thick * 2, -GROUND - gap, HOUSE.depth + HOUSE.thick), CUT, new THREE.Vector3(0, (GROUND - gap) / 2, -HOUSE.thick / 2));
  for (const sign of [-1, 1]) solid(new THREE.BoxGeometry(HOUSE.thick - gap * 2, HOUSE.wall, .03), CUT, new THREE.Vector3(sign * (HOUSE.width + HOUSE.thick) / 2, HOUSE.wall / 2, HOUSE.depth / 2 + .015));
  for (const side of ['left', 'right']) {
    // The roof's cut edge is a band of dark shingles with snow lying along its top.
    const roof = roofFrame(side, 'outer'), length = HOUSE.slope + HOUSE.eaves, angle = Math.atan2(roof.up.y, roof.up.x), front = HOUSE.depth / 2 + HOUSE.overhang / 2 - gap;
    const cut = solid(new THREE.BoxGeometry(length, HOUSE.roof - gap * 2, HOUSE.overhang - gap), 0x4a3f3a, roof.center.clone().addScaledVector(roof.outward, -HOUSE.roof / 2).setZ(front));
    cut.rotation.z = angle;
    // Only a lip of snow along the front edge: the rest of the roof shows its shingles with the snow painted on them.
    const snow = solid(new THREE.BoxGeometry(length * .9, .03, .2), 0xfbf8f1, roof.center.clone().addScaledVector(roof.outward, .026).addScaledVector(roof.up, -.02).setZ(HOUSE.depth / 2 + HOUSE.overhang - .1));
    snow.rotation.z = angle;
  }
  // The iron bracket the name sign hangs from, fixed to the front-left corner of the house.
  const iron = 0x3b302a, armStart = -HOUSE.width / 2 - HOUSE.thick, armEnd = SIGN.x - SIGN.arm / 2;
  solid(new THREE.BoxGeometry(armStart - armEnd, .05, .05), iron, new THREE.Vector3((armStart + armEnd) / 2, SIGN.top + .02, SIGN.z + .03));
  const strut = solid(new THREE.BoxGeometry(.62, .04, .04), iron, new THREE.Vector3(armStart - .2, SIGN.top - .2, SIGN.z + .03)); strut.rotation.z = -.78;
  solid(new THREE.BoxGeometry(.34, .14, HOUSE.depth + HOUSE.overhang * 2), 0xfbf8f1, new THREE.Vector3(0, HOUSE.ridge + HOUSE.roof * 1.05, 0));
  // The chimney rises out of the right slope over the fireplace, capped with snow.
  solid(new THREE.BoxGeometry(.34, 1.1, .34), 0xc9bba6, new THREE.Vector3(FIRE.x, 2.72, -.75));
  solid(new THREE.BoxGeometry(.42, .09, .42), 0xfbf8f1, new THREE.Vector3(FIRE.x, 3.3, -.75));

  // Cut the boards at a resolution the screen can show; phones get smaller textures.
  const quality = Math.min(1, Math.max(.5, stage.clientWidth * Math.min(devicePixelRatio || 1, 2) / 2000));
  let painted = 0, santaShare = 0, reindeerShare = 0;
  const report = () => onProgress(Math.min(1, painted / (BOARDS.length + 1) * .35 + santaShare * .45 + reindeerShare * .2));
  const flames = [], twinkles = [], swings = [], smoke = [], billboards = [];
  // Soft bluish shadows on the snow, thrown right and back, away from the low sun on the left.
  const shade = keep(textures, radialTexture([[0, 'rgba(110,140,170,.42)'], [1, 'rgba(110,140,170,0)']], 64));
  const shadowMaterial = keep(materials, new THREE.MeshBasicMaterial({ map: shade, transparent: true, depthWrite: false, toneMapped: false }));
  const shadowGeometry = keep(geometries, new THREE.PlaneGeometry(1, 1));
  function shadow(x, z, width, depth, height = 1) {
    const mesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x + height * .28, GROUND + .003, z - height * .12); mesh.scale.set(width, depth, 1);
    house.add(mesh); return mesh;
  }
  shadow(1, -.6, 4.8, 3.6, 1.2);
  // The snow surface isn't one flat white: a few broad, faint drifts shade it, far apart so they never form a pattern.
  for (const [x, z, w, d] of [[-7, -5, 9, 4], [6, 3.5, 8, 3.4], [-2, -9, 12, 4], [10, -3, 7, 3], [-10, 3, 8, 3.2]]) {
    const drift = new THREE.Mesh(shadowGeometry, shadowMaterial); drift.rotation.x = -Math.PI / 2; drift.position.set(x, GROUND + .002, z); drift.scale.set(w, d, 1); drift.material = shadowMaterial; house.add(drift);
  }
  const texture = image => { const value = keep(textures, new THREE.Texture(image)); value.colorSpace = THREE.SRGBColorSpace; value.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); value.needsUpdate = true; return value; };
  const boards = BOARDS.map(async board => {
    const map = texture(await paintBoard(board, quality));
    const material = keep(materials, new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .4, toneMapped: false, side: board.mirror || board.chair && board.turn ? THREE.DoubleSide : THREE.FrontSide }));
    const geometry = keep(geometries, new THREE.PlaneGeometry(board.w, board.h));
    const holder = new THREE.Group(), mesh = new THREE.Mesh(geometry, material);
    holder.add(mesh);
    if (board.copies) {
      // One painted sheet, planted at every [x, z, height]; each copy turns about its trunk to face the camera.
      material.side = THREE.DoubleSide;
      geometry.translate(0, board.h / 2, 0);
      for (const [x, z, size] of board.copies) {
        const tree = new THREE.Group(), scale = size / board.h;
        tree.add(new THREE.Mesh(geometry, material));
        tree.position.set(x, GROUND, z); tree.scale.setScalar(scale); billboards.push(tree);
        house.add(tree); shadow(x, z, size * .55, size * .3, size);
      }
      painted++; report(); return;
    }
    if (board.roof) {
      const roof = roofFrame(board.roof, board.layer);
      holder.position.copy(roof.center); holder.quaternion.copy(roof.quaternion);
    } else {
      geometry.translate(0, board.flat ? 0 : board.hang ? -board.h / 2 : board.h / 2, 0);
      holder.position.set(...board.at);
      if (board.flat === 'floor') { holder.rotation.x = -Math.PI / 2; holder.position.y = .002; }
      if (board.flat === 'ground') { holder.rotation.set(-Math.PI / 2, 0, board.turn ?? 0); holder.position.y = GROUND + .006; }
      else if (board.turn) holder.rotation.y = board.turn;
      if (board.mirror) holder.scale.x = -1;
      if (!board.kind && !board.flat) { const edge = new THREE.Mesh(geometry, keep(materials, edgeMaterial(map))); edge.position.z = -.012; holder.add(edge); }
      if (!board.kind && !board.flat && !board.hang && !board.chair && board.at[1] === GROUND) shadow(board.at[0], board.at[2], board.w * 1.1, board.w * .5, board.h);
    }
    if (board.flame) flames.push(holder);
    if (board.twinkle) twinkles.push(material);
    if (board.hang) swings.push([holder, board.sway ? .02 : .05]);
    (board.chair ? chair : house).add(holder);
    painted++; report();
  });
  const smokeReady = paintBoard(SMOKE, quality).then(image => {
    const map = texture(image);
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Sprite(keep(materials, new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })));
      puff.userData.phase = i / 3; smoke.push(puff); house.add(puff);
    }
    painted++; report();
  });

  // Warm glows: the fire on the hearth, the lantern and the reading lamp. Sprites always face the camera.
  const warm = keep(textures, radialTexture([[0, 'rgba(255,190,110,.8)'], [.45, 'rgba(255,150,70,.28)'], [1, 'rgba(255,140,60,0)']]));
  const glow = (position, size) => { const sprite = new THREE.Sprite(keep(materials, new THREE.SpriteMaterial({ map: warm, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }))); sprite.position.copy(position); sprite.scale.setScalar(size); house.add(sprite); return sprite; };
  const fireGlow = glow(new THREE.Vector3(FIRE.x, .28, -.7), 1), lanternGlow = glow(new THREE.Vector3(LANTERN.x, 2.68, LANTERN.z + .02), .7);
  glow(new THREE.Vector3(-.88, .78, .36), .5);
  const blob = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(1.1, .75)), keep(materials, new THREE.MeshBasicMaterial({ map: keep(textures, radialTexture([[0, 'rgba(60,35,20,.4)'], [1, 'rgba(60,35,20,0)']], 64)), transparent: true, depthWrite: false, toneMapped: false })));
  blob.rotation.x = -Math.PI / 2; blob.position.set(CHAIR.x, .006, CHAIR.z + .05); house.add(blob);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const fitModel = (model, height) => {
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.scale.setScalar(height / size.y);
    model.position.set(-center.x, -bounds.min.y, -center.z); holder.add(model); models.push(model);
    model.traverse(node => { if (node.isMesh) node.frustumCulled = false; });
    return holder;
  };
  let santaModel, spine, spineRest, tracker;
  const santa = loader.loadAsync(new URL('../../assets/models/santa-seated-web.glb', import.meta.url).href, event => { if (event.total) { santaShare = event.loaded / event.total; report(); } })
    .then(gltf => {
      santaModel = gltf.scene; chair.add(fitModel(santaModel, 1));
      spine = santaModel.getObjectByName('mixamorigSpine2'); spineRest = spine?.quaternion.clone();
      tracker = createHeadTracker(santaModel, stage, { ...HEAD, unanimated: true, onMove: () => wake() });
      return true;
    }).catch(error => { console.error('Seated Santa failed to load', error); return false; })
    .finally(() => { santaShare = 1; report(); });
  // The reindeer from the Home page waits outside; most visitors already have this file cached.
  const reindeer = loader.loadAsync(new URL('../../assets/models/reindeer-web.glb', import.meta.url).href, event => { if (event.total) { reindeerShare = event.loaded / event.total; report(); } })
    .then(gltf => { const holder = fitModel(gltf.scene, REINDEER.height); holder.position.set(REINDEER.x, GROUND, REINDEER.z); holder.rotation.y = REINDEER.turn; house.add(holder); shadow(REINDEER.x, REINDEER.z, 1.2, .6, 1); return true; })
    .catch(error => { console.error('Reindeer failed to load', error); return false; })
    .finally(() => { reindeerShare = 1; report(); });

  const [, , santaReady] = await Promise.all([Promise.all(boards), smokeReady, santa, reindeer]);
  if (!isCurrent()) { release3d(); return null; }
  stage.prepend(renderer.domElement);

  // Each view blends its lens and distance between portrait and landscape screens.
  function goalFor(name) {
    const settings = VIEWS[name], width = stage.clientWidth || 1, height = stage.clientHeight || 1, aspect = width / height;
    const t = THREE.MathUtils.clamp((aspect - .7) / (1.2 - .7), 0, 1), half = Math.tan(THREE.MathUtils.degToRad(settings.fov / 2));
    const aim = settings.tallTarget ? new THREE.Vector3(...settings.tallTarget).lerp(new THREE.Vector3(...settings.target), t) : new THREE.Vector3(...settings.target);
    let reach;
    if (settings.fit) {
      const [fitWidth, fitHeight] = settings.fit.map((value, index) => THREE.MathUtils.lerp(settings.tallFit[index], value, t));
      reach = Math.max(fitHeight / 2 / half, fitWidth / 2 / (half * aspect));
    } else reach = THREE.MathUtils.lerp(settings.tallDistance, settings.distance, t);
    return { target: aim, distance: reach, fov: settings.fov };
  }
  function frameView() {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const goal = goalFor(view); goalTarget.copy(goal.target); goalDistance = goal.distance; goalFov = goal.fov;
    if (!ready) { target.copy(goalTarget); distance = goalDistance; fov = goalFov; }
  }
  function place() {
    // A near plane that follows the distance keeps depth precise, so nothing shimmers far from the camera.
    camera.fov = fov; camera.near = Math.max(.05, distance * .03); camera.updateProjectionMatrix();
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * distance, target.y + Math.sin(pitch) * distance, target.z + Math.cos(yaw) * Math.cos(pitch) * distance);
    camera.lookAt(target);
  }

  // Idle life: the chair rocks, Santa breathes, the fire flickers, the lantern sways, smoke drifts up. Reduced motion stills all of it.
  const tilt = new THREE.Quaternion(), side = new THREE.Vector3(1, 0, 0);
  function pose() {
    const still = motion.matches, t = clock;
    chair.rotation.x = still ? 0 : Math.sin(t * 1.7) * .028;
    if (spine && spineRest) spine.quaternion.copy(spineRest).multiply(tilt.setFromAxisAngle(side, still ? 0 : Math.sin(t * 1.5) * .014));
    const flicker = still ? 0 : Math.sin(t * 9.1) * .5 + Math.sin(t * 13.7) * .3 + Math.sin(t * 5.3) * .2;
    for (const holder of flames) { holder.scale.y = 1 + flicker * .07; holder.scale.x = 1 + (still ? 0 : Math.sin(t * 7.3) * .025); }
    fireGlow.material.opacity = .85 + flicker * .12; fire.intensity = 2.2 + flicker * .4;
    for (const [index, material] of twinkles.entries()) material.opacity = still ? 1 : .72 + Math.sin(t * 2.6 + index) * .28;
    for (const [holder, swing] of swings) holder.rotation.z = still ? 0 : Math.sin(t * 1.1) * swing;
    lanternGlow.material.opacity = .85 + (still ? 0 : Math.sin(t * 3.1) * .1);
    for (const puff of smoke) {
      const life = still ? puff.userData.phase : (t * .18 + puff.userData.phase) % 1;
      puff.position.set(FIRE.x + life * 1.25, 3.38 + life * .6, -.75); puff.scale.set(.3 + life * .4, .22 + life * .28, 1);
      puff.material.opacity = Math.sin(life * Math.PI) * .9;
    }
  }
  function draw() {
    place();
    for (const tree of billboards) tree.rotation.y = Math.atan2(camera.position.x - tree.position.x, camera.position.z - tree.position.z);
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const active = dragging || settling;
    if (!active && now - lastDraw < 33) return;
    const delta = Math.min((now - (lastTick || now)) / 1000, .1); lastTick = lastDraw = now; clock += delta;
    const ease = 1 - Math.exp(-7 * delta), travel = 1 - Math.exp(-3.2 * delta);
    yaw += (goalYaw - yaw) * ease; pitch += (goalPitch - pitch) * ease;
    target.lerp(goalTarget, travel); distance += (goalDistance - distance) * travel; fov += (goalFov - fov) * travel;
    settling = Math.abs(goalYaw - yaw) + Math.abs(goalPitch - pitch) + target.distanceTo(goalTarget) + Math.abs(goalDistance - distance) > .002;
    pose(); tracker?.update(delta); draw();
  }
  const stop = () => { cancelAnimationFrame(frame); frame = undefined; lastTick = 0; };
  const start = () => { if (frame === undefined && inView && !document.hidden) frame = requestAnimationFrame(tick); };
  // Under reduced motion nothing runs on its own: every change jumps straight to its end and draws once.
  function wake() {
    if (!ready) return;
    if (motion.matches) { yaw = goalYaw; pitch = goalPitch; target.copy(goalTarget); distance = goalDistance; fov = goalFov; pose(); tracker?.update(1); draw(); }
    else { settling = true; start(); }
  }
  function setView(name) {
    if (!VIEWS[name] || name === view) return;
    view = name; clearTimeout(returnTimer);
    const goal = goalFor(view); goalTarget.copy(goal.target); goalDistance = goal.distance; goalFov = goal.fov;
    goalYaw = 0; goalPitch = VIEWS[view].pitch;
    stage.dataset.view = view; onView(view); wake();
  }
  const onVisibility = () => { if (document.hidden) stop(); else if (!motion.matches) start(); };
  const onMotion = () => { if (motion.matches) { stop(); wake(); } else start(); };

  // Turning: drag anywhere on the stage, or use the arrow keys on the focused gesture button. A tap on Santa goes inside.
  const gesture = stage.querySelector('.cabin-gesture'), on = (node, type, handler, options = {}) => node?.addEventListener(type, handler, { ...options, signal: events.signal });
  const limits = () => VIEWS[view];
  const clampYaw = value => Math.max(-limits().maxYaw, Math.min(limits().maxYaw, value)), clampPitch = value => Math.max(limits().minPitch, Math.min(limits().maxPitch, value));
  function scheduleReturn() {
    clearTimeout(returnTimer);
    if (motion.matches) return;
    returnTimer = setTimeout(() => { goalYaw = 0; goalPitch = limits().pitch; wake(); }, RETURN_AFTER);
  }
  function onSanta(x, y) {
    if (!santaModel) return false;
    const box = new THREE.Box3().setFromObject(santaModel), rect = stage.getBoundingClientRect(), corners = [];
    for (const cx of [box.min.x, box.max.x]) for (const cy of [box.min.y, box.max.y]) for (const cz of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(cx, cy, cz).project(camera));
    const xs = corners.map(point => rect.left + (point.x + 1) / 2 * rect.width), ys = corners.map(point => rect.top + (1 - point.y) / 2 * rect.height);
    return x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys);
  }
  let pointer = null;
  on(gesture, 'pointerdown', event => {
    if (pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: goalYaw, pitch: goalPitch, moved: false };
    gesture.setPointerCapture?.(event.pointerId); dragging = true; clearTimeout(returnTimer); stage.classList.add('is-turning'); wake();
  });
  on(gesture, 'pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 6) pointer.moved = true;
    const scale = Math.PI / Math.max(stage.clientWidth, 1);
    goalYaw = clampYaw(pointer.yaw - (event.clientX - pointer.x) * scale * .9);
    if (event.pointerType === 'mouse') goalPitch = clampPitch(pointer.pitch + (event.clientY - pointer.y) * scale * .5);
    wake();
  });
  const release = event => {
    if (!pointer || (event && event.pointerId !== pointer.id)) return;
    const tapped = !pointer.moved && event?.type === 'pointerup';
    pointer = null; dragging = false; stage.classList.remove('is-turning');
    if (tapped && view === 'outside' && onSanta(event.clientX, event.clientY)) setView('inside');
    else { scheduleReturn(); wake(); }
  };
  on(gesture, 'pointerup', release); on(gesture, 'pointercancel', release); on(gesture, 'lostpointercapture', release);
  on(gesture, 'click', event => { if (event.detail === 0) setView(view === 'outside' ? 'inside' : 'outside'); });
  on(gesture, 'keydown', event => {
    const step = { ArrowLeft: [.12, 0], ArrowRight: [-.12, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05] }[event.key];
    if (step) { event.preventDefault(); goalYaw = clampYaw(goalYaw + step[0]); goalPitch = clampPitch(goalPitch + step[1]); scheduleReturn(); wake(); }
    else if (event.key === 'Escape' && view === 'inside') setView('outside');
    else if (event.key === 'Home') { goalYaw = 0; goalPitch = limits().pitch; wake(); }
  });

  ready = true; frameView(); pose(); tracker?.update(0); draw();
  resize = new ResizeObserver(() => { frameView(); wake(); if (motion.matches || frame === undefined) draw(); });
  visible = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView && !motion.matches) start(); else stop(); });
  resize.observe(stage); visible.observe(stage);
  document.addEventListener('visibilitychange', onVisibility, { signal: events.signal });
  motion.addEventListener('change', onMotion, { signal: events.signal });
  renderer.domElement.addEventListener('webglcontextrestored', draw, { signal: events.signal });
  stage.dataset.view = view;
  if (!motion.matches) start();

  function destroy() {
    stop(); clearTimeout(returnTimer); resize?.disconnect(); visible?.disconnect();
    release3d();
  }
  return { santa: santaReady, destroy, setView, get view() { return view; } };

  // Hoisted, and touches nothing declared after the first await, so an abandoned load can call it too.
  function release3d() {
    events.abort(); tracker?.destroy();
    for (const model of models) model.traverse(node => {
      node.geometry?.dispose();
      for (const material of [node.material].flat()) { if (!material) continue; Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }); material.dispose(); }
      node.skeleton?.dispose();
    });
    textures.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); geometries.forEach(value => value.dispose());
    environment?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
}
