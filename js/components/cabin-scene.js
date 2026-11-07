// Santa's Cabin in Three.js: the paper boards from cabin-art.js stand in a box around the seated Santa GLB.
// Drag (or arrow keys) turns the box a little; it settles back to the front on its own.
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { BOARDS, CHAIR, FRAME, PX } from './cabin-art.js';
import { paperFilter, shape } from './paper-art.js';
import { createHeadTracker } from './santa-head.js';

// Radians. The box never turns far enough to show a board edge-on or the back of the wall.
const BASE_PITCH = .13, MAX_YAW = .5, MIN_PITCH = .03, MAX_PITCH = .32, RETURN_AFTER = 1600, FOV = 30;
// Head turns stay small and are shared with the neck: larger angles crease the beard (see docs/SANTA-CABIN.md).
const HEAD = { maxYaw: .24, maxPitch: .1 };
const KRAFT = 0xc9a77c, PAPER_EDGE = 0xefe1c4;
let paperCount = 0;

// Each board is cut once into an image; nothing in the SVG animates afterwards.
async function paintBoard(board, quality) {
  const width = Math.round(board.w * PX), height = Math.round(board.h * PX);
  const svg = shape('svg', { viewBox: `0 0 ${width} ${height}`, width: Math.round(width * quality), height: Math.round(height * quality) });
  const plain = shape('g', {}, svg);
  const paper = shape('g', { filter: paperFilter(svg, `cabin-paper-${++paperCount}`, { scale: board.kind ? 1.6 : 1.1, grain: .5, shadow: 0 }) }, svg);
  board.draw({ plain, paper, svg }, { width, height });
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  await image.decode();
  return image;
}

// A cream copy of a board's silhouette, set just behind it, shows as the paper's cut edge when the box turns.
function edgeMaterial(texture) {
  const material = new THREE.MeshBasicMaterial({ color: PAPER_EDGE, map: texture, alphaTest: .4, toneMapped: false });
  material.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n\tdiffuseColor.a *= texture2D( map, vMapUv ).a;\n#endif'); };
  material.customProgramCacheKey = () => 'cabin-paper-edge';
  return material;
}

function glowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d'), gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,190,110,.75)'); gradient.addColorStop(.45, 'rgba(255,150,70,.28)'); gradient.addColorStop(1, 'rgba(255,140,60,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function shadowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d'), gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(60,35,20,.4)'); gradient.addColorStop(1, 'rgba(60,35,20,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export async function mountCabin(stage, { onProgress = () => {}, isCurrent = () => true } = {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'cabin-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true');
  const textures = new Set(), materials = new Set(), geometries = new Set(), events = new AbortController();
  // All state lives up here: the head tracker can call wake() while the boards are still being cut.
  let yaw = 0, pitch = BASE_PITCH, goalYaw = 0, goalPitch = BASE_PITCH, distance = 6, ready = false;
  let frame, lastTick = 0, lastDraw = 0, clock = 0, inView = true, dragging = false, returnTimer = 0, settling = false, resize, visible;
  const keep = (set, value) => { set.add(value); return value; };
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, 1, .1, 60);
  const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
  let environment;
  try { environment = pmrem.fromScene(room, .04); } finally { room.dispose(); pmrem.dispose(); }
  scene.environment = environment.texture; scene.environmentIntensity = .55;
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a6a55, 1.1));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.5); key.position.set(-3, 5, 4); scene.add(key);
  const fire = new THREE.PointLight(0xff9a4a, 2.4, 3.2, 1.6); fire.position.set(.95, .45, -.45); scene.add(fire);

  const box = new THREE.Group(), chair = new THREE.Group();
  chair.position.set(CHAIR.x, 0, CHAIR.z); box.add(chair); scene.add(box);

  // Cut the boards at a resolution the screen can show; phones get smaller textures.
  const quality = Math.min(1, Math.max(.5, stage.clientWidth * Math.min(devicePixelRatio || 1, 2) / 1800));
  let painted = 0, modelShare = 0;
  const report = () => onProgress(Math.min(1, painted / BOARDS.length * .35 + modelShare * .65));
  const flames = [];
  const boards = BOARDS.map(async board => {
    const image = await paintBoard(board, quality);
    const texture = keep(textures, new THREE.Texture(image));
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true;
    const material = keep(materials, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .4, toneMapped: false, side: board.mirror || board.chair && board.turn ? THREE.DoubleSide : THREE.FrontSide }));
    const geometry = keep(geometries, new THREE.PlaneGeometry(board.w, board.h));
    if (!board.flat) geometry.translate(0, board.h / 2, 0);
    const holder = new THREE.Group(), mesh = new THREE.Mesh(geometry, material);
    holder.add(mesh); holder.position.set(...board.at);
    if (board.flat) { holder.rotation.x = -Math.PI / 2; holder.position.y = .002; }
    if (board.turn) holder.rotation.y = board.turn;
    if (board.mirror) holder.scale.x = -1;
    if (!board.kind) {
      const edge = new THREE.Mesh(geometry, keep(materials, edgeMaterial(texture)));
      edge.position.z = -.012; holder.add(edge);
    }
    if (board.exterior) {
      const back = new THREE.Mesh(geometry, keep(materials, new THREE.MeshBasicMaterial({ color: KRAFT, side: THREE.BackSide, toneMapped: false })));
      holder.add(back);
    }
    if (board.flame) flames.push(holder);
    (board.chair ? chair : box).add(holder);
    painted++; report();
  });

  // Soft blob under the chair, and the warm glow of the fire on the hearth.
  const blob = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(1.1, .75)), keep(materials, new THREE.MeshBasicMaterial({ map: keep(textures, shadowTexture()), transparent: true, depthWrite: false, toneMapped: false })));
  blob.rotation.x = -Math.PI / 2; blob.position.set(CHAIR.x, .006, CHAIR.z + .05); box.add(blob);
  const glow = new THREE.Mesh(keep(geometries, new THREE.PlaneGeometry(1.1, .9)), keep(materials, new THREE.MeshBasicMaterial({ map: keep(textures, glowTexture()), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  glow.position.set(1.02, .32, -.7); box.add(glow);

  let model, spine, spineRest, tracker;
  const santa = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('../../assets/models/santa-seated-web.glb', import.meta.url).href, event => {
    if (event.total) { modelShare = event.loaded / event.total; report(); }
  }).then(gltf => {
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const seat = new THREE.Group(); seat.scale.setScalar(1 / size.y);
    model.position.set(-center.x, -bounds.min.y, -center.z); seat.add(model); chair.add(seat);
    model.traverse(node => { if (node.isMesh) { node.frustumCulled = false; } });
    spine = model.getObjectByName('mixamorigSpine2'); spineRest = spine?.quaternion.clone();
    tracker = createHeadTracker(model, stage, { ...HEAD, unanimated: true, onMove: () => wake() });
    modelShare = 1; report();
    return true;
  }).catch(error => { console.error('Seated Santa failed to load', error); modelShare = 1; report(); return false; });

  const [, santaReady] = await Promise.all([Promise.all(boards), santa]);
  if (!isCurrent()) { release3d(); return null; }
  stage.prepend(renderer.domElement);

  // View: orbit a fixed target. Wide screens fit the whole front frame; narrow ones crop to the chair and fireplace.
  const target = new THREE.Vector3(0, 1.1, 0);
  function frameView() {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(width, height, false);
    const aspect = width / height, half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // Sizes are measured at the frame, which stands nearer the camera than the box's centre.
    const wide = aspect >= 1.15, needWidth = wide ? FRAME.width + .24 : 2.6, needHeight = FRAME.height + (wide ? .2 : .15);
    distance = Math.max(needHeight / 2 / half, needWidth / 2 / (half * aspect)) + FRAME.z;
    target.set(wide ? 0 : -.12, FRAME.bottom + FRAME.height / 2, 0);
    camera.aspect = aspect; camera.updateProjectionMatrix();
  }
  function place() {
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * distance, target.y + Math.sin(pitch) * distance, target.z + Math.cos(yaw) * Math.cos(pitch) * distance);
    camera.lookAt(target);
  }

  // Idle life: the chair rocks, Santa breathes, the fire flickers. All of it stops under reduced motion.
  function pose() {
    const still = motion.matches;
    chair.rotation.x = still ? 0 : Math.sin(clock * 1.7) * .028;
    if (spine && spineRest) spine.quaternion.copy(spineRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), still ? 0 : Math.sin(clock * 1.5) * .014));
    const flicker = still ? 0 : Math.sin(clock * 9.1) * .5 + Math.sin(clock * 13.7) * .3 + Math.sin(clock * 5.3) * .2;
    for (const holder of flames) { holder.scale.y = 1 + flicker * .07; holder.scale.x = 1 + Math.sin(clock * 7.3) * (still ? 0 : .025); }
    glow.material.opacity = .85 + flicker * .12; fire.intensity = 2.4 + flicker * .45;
  }
  function draw() { place(); renderer.render(scene, camera); }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const active = dragging || settling;
    if (!active && now - lastDraw < 33) return;
    const delta = Math.min((now - (lastTick || now)) / 1000, .1); lastTick = lastDraw = now; clock += delta;
    const ease = 1 - Math.exp(-7 * delta);
    yaw += (goalYaw - yaw) * ease; pitch += (goalPitch - pitch) * ease;
    settling = Math.abs(goalYaw - yaw) + Math.abs(goalPitch - pitch) > .0008;
    pose(); tracker?.update(delta); draw();
  }
  const stop = () => { cancelAnimationFrame(frame); frame = undefined; lastTick = 0; };
  const start = () => { if (frame === undefined && inView && !document.hidden) frame = requestAnimationFrame(tick); };
  // Under reduced motion nothing runs on its own: draw once per change.
  function wake() { if (!ready) return; if (motion.matches) { yaw = goalYaw; pitch = goalPitch; pose(); tracker?.update(1); draw(); } else start(); }
  const onVisibility = () => { if (document.hidden) stop(); else if (!motion.matches) start(); };
  const onMotion = () => { if (motion.matches) { stop(); wake(); } else start(); };
  resize = new ResizeObserver(() => { frameView(); wake(); if (motion.matches || frame === undefined) draw(); });
  visible = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView && !motion.matches) start(); else stop(); });

  // Turning: drag anywhere on the stage, or use the arrow keys on the focused gesture button.
  const gesture = stage.querySelector('.cabin-gesture'), on = (target, type, handler, options = {}) => target?.addEventListener(type, handler, { ...options, signal: events.signal });
  const clampYaw = value => Math.max(-MAX_YAW, Math.min(MAX_YAW, value)), clampPitch = value => Math.max(MIN_PITCH, Math.min(MAX_PITCH, value));
  function scheduleReturn() {
    clearTimeout(returnTimer);
    if (motion.matches) return;
    returnTimer = setTimeout(() => { goalYaw = 0; goalPitch = BASE_PITCH; settling = true; start(); }, RETURN_AFTER);
  }
  let pointer = null;
  on(gesture, 'pointerdown', event => {
    if (pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: goalYaw, pitch: goalPitch };
    gesture.setPointerCapture?.(event.pointerId); dragging = true; clearTimeout(returnTimer); stage.classList.add('is-turning'); wake();
  });
  on(gesture, 'pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const scale = Math.PI / Math.max(stage.clientWidth, 1);
    goalYaw = clampYaw(pointer.yaw - (event.clientX - pointer.x) * scale * .9);
    if (event.pointerType === 'mouse') goalPitch = clampPitch(pointer.pitch + (event.clientY - pointer.y) * scale * .5);
    wake();
  });
  const release = event => {
    if (!pointer || (event && event.pointerId !== pointer.id)) return;
    pointer = null; dragging = false; stage.classList.remove('is-turning'); scheduleReturn(); wake();
  };
  on(gesture, 'pointerup', release); on(gesture, 'pointercancel', release); on(gesture, 'lostpointercapture', release);
  on(gesture, 'keydown', event => {
    const step = { ArrowLeft: [.12, 0], ArrowRight: [-.12, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05] }[event.key];
    if (step) { event.preventDefault(); goalYaw = clampYaw(goalYaw + step[0]); goalPitch = clampPitch(goalPitch + step[1]); scheduleReturn(); wake(); }
    else if (event.key === 'Escape' || event.key === 'Home') { goalYaw = 0; goalPitch = BASE_PITCH; wake(); }
  });

  ready = true; frameView(); pose(); tracker?.update(0); draw();
  resize.observe(stage); visible.observe(stage);
  document.addEventListener('visibilitychange', onVisibility, { signal: events.signal });
  motion.addEventListener('change', onMotion, { signal: events.signal });
  renderer.domElement.addEventListener('webglcontextrestored', draw, { signal: events.signal });
  if (!motion.matches) start();

  function destroy() {
    stop(); clearTimeout(returnTimer); resize?.disconnect(); visible?.disconnect();
    release3d();
  }
  return { santa: santaReady, destroy };

  // Hoisted, and touches nothing declared after the first await, so an abandoned load can call it too.
  function release3d() {
    events.abort(); tracker?.destroy();
    model?.traverse(node => {
      node.geometry?.dispose();
      for (const material of [node.material].flat()) { if (!material) continue; Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }); material.dispose(); }
      node.skeleton?.dispose();
    });
    textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
    environment?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
}
