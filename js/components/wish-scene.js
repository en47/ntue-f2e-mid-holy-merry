import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { treeFit, WORLD_PIXEL as PX } from './wish-layout.js';
import { createWishEnvelopes } from './wish-envelopes.js';
import { createElfBehavior, safeElfRoute } from './elf-behavior.js';
import { createElfAnimation } from './elf-animation.js';
import { mountElfInteraction } from './elf-interaction.js';
import { mountWishInteraction } from './wish-interaction.js';
import { createWishPicker } from './wish-picking.js';

const mounted = new WeakMap();
function disposeObject(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  root.traverse(n => {
    if (n.geometry) geometries.add(n.geometry);
    if (n.skeleton) skeletons.add(n.skeleton);
    for (const m of Array.isArray(n.material) ? n.material : [n.material]) if (m) {
      materials.add(m); for (const t of Object.values(m)) if (t?.isTexture) textures.add(t);
    }
  });
  textures.forEach(t => { t.source?.data?.close?.(); t.dispose(); });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); skeletons.forEach(s => s.dispose());
}
function boundsOf(model) {
  model.updateMatrixWorld(true);
  model.traverse(n => { if (n.isSkinnedMesh) { n.skeleton.update(); n.computeBoundingBox(); } });
  return new THREE.Box3().setFromObject(model);
}
function radialBounds(model, box) {
  const center = box.getCenter(new THREE.Vector3()), vertex = new THREE.Vector3(); let radius = 0;
  const height = box.max.y - box.min.y, branchPoints = Array.from({ length: 24 }, () => Array(24).fill(null));
  const branchRadii = Array(24).fill(0), samples = branchPoints.map(row => row.map(() => -1));
  model.traverse(n => {
    if (!n.isMesh) return;
    const positions = n.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(n.matrixWorld);
      const x = vertex.x - center.x, y = vertex.y - box.min.y, z = vertex.z - center.z, radial = Math.hypot(x, z);
      radius = Math.max(radius, radial);
      const band = Math.min(23, Math.max(0, Math.floor(y / height * 24)));
      const sector = Math.min(23, Math.floor((Math.atan2(x, z) + Math.PI) / (Math.PI * 2) * 24));
      branchRadii[band] = Math.max(branchRadii[band], radial);
      if (radial > samples[band][sector]) { samples[band][sector] = radial; branchPoints[band][sector] = [x, y, z]; }
    }
  });
  return { height, radius, center, bottom: box.min.y, branchPoints, branchRadii };
}

export function mountWishScene(root) {
  if (mounted.has(root)) return mounted.get(root);
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0, 1, 1, 0, .1, 50);
  camera.position.z = 15;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.domElement.className = 'wish-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true');
  root.prepend(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(); let environment;
  try { environment = pmrem.fromScene(room, .04); }
  catch (error) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); throw error; }
  finally { pmrem.dispose(); room.dispose(); }
  scene.environment = environment.texture; scene.environmentIntensity = .5;
  scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x6d86a0, 1.5));
  const key = new THREE.DirectionalLight(0xfbeed8, 1.7); key.position.set(-3, 8, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdceeff, .8); fill.position.set(5, 3, 5); scene.add(fill);
  // Transparent contact patches, shared with the same measured ground, without opaque platforms.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
  const context = shadowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(62,83,90,.24)'); gradient.addColorStop(1, 'rgba(62,83,90,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  function contact() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
    m.position.z = -.5; scene.add(m); return m;
  }
  const treeShadow = contact(), elfShadow = contact();
  const tree = new THREE.Group(), elf = new THREE.Group(), elfTurn = new THREE.Group();
  scene.add(tree, elf); elf.position.z = 2; elf.add(elfTurn);
  elf.name = 'elf-ground-position'; elfTurn.name = 'elf-user-rotation';
  const treeSlot = root.querySelector('#wish-tree-space'), lane = root.querySelector('#elf-lane');
  const letter = root.querySelector('#wish-form'), rack = root.querySelector('#stocking-station');
  const gesture = root.querySelector('#tree-gesture'), elfTarget = root.querySelector('#elf-character');
  const loading = root.querySelector('#scene-loading'), progress = root.querySelector('#scene-progress'), retry = root.querySelector('#scene-retry');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)'), loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const cleanups = [], loaded = {}, failed = new Set();
  let destroyed = false, frame = null, last = 0, visible = true, contextLost = false;
  let dirty = true, width = 0, height = 0, geometry = null;
  let elfModel = null, elfBounds = null, elfHeight = 0, ground = 0, route = null, busy = false;
  let elfAnimation = null, elfBehavior = null, elfInteraction = null, elfVersion = -1, pendingElfWish = null;
  const listen = (target, type, handler, options) => { target.addEventListener(type, handler, options); cleanups.push(() => target.removeEventListener(type, handler, options)); };
  function wake() { if (!destroyed && frame === null && visible && !document.hidden && !contextLost) frame = requestAnimationFrame(render); }
  const envelopes = createWishEnvelopes({ root, tree, camera, wake, motion, managedInteraction: true });
  root.classList.add('wish-mesh-controls');
  const pick = createWishPicker({ root, camera, treeModel: () => loaded.tree,
    elfModel: () => elf.visible && elfBehavior ? elfModel : null, envelopes });
  const interaction = mountWishInteraction(root, { pick, behavior: () => elfBehavior, tree, wake });
  function rect(element, base) { const r = element.getBoundingClientRect(); return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height, bottom: r.bottom - base.top }; }
  function layout() {
    const base = root.getBoundingClientRect(); width = root.clientWidth; height = root.clientHeight;
    if (!width || !height) return;
    // Canvas begins at the padding edge, while boundingClientRect includes the stage border.
    const origin = { left: base.left + root.clientLeft, top: base.top + root.clientTop };
    const zone = rect(treeSlot, origin), path = rect(lane, origin);
    const rackRect = rect(rack, origin);
    camera.right = width / PX; camera.top = height / PX; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.setSize(width, height, false);
    ground = (height - zone.bottom) / PX;
    if (geometry) {
      const fit = treeFit(zone, geometry); tree.scale.setScalar(fit.scale);
      tree.position.set(fit.x, ground, 0);
      envelopes.layout(geometry);
      treeShadow.scale.set(fit.height / PX * .55, .18, 1); treeShadow.position.set(fit.x, ground, -.5);
    }
    elfHeight = Math.min(path.height, zone.height * .19) / PX;
    // The orthographic snow surface spans the whole scene. Walk in front of the
    // full tree volume, rather than splitting the lane at the projected trunk.
    if (geometry) elf.position.z = Math.max(2, geometry.radius * tree.scale.x + elfHeight * .55 + .18);
    const trunkRadius = geometry ? Math.max(...geometry.branchRadii.slice(0, 2)) * tree.scale.x * PX : 0;
    const safe = geometry ? safeElfRoute({ lane: { ...path, z: elf.position.z * PX }, groundY: height - ground * PX, height: elfHeight * PX,
      obstacles: [rect(letter, origin), rackRect], tree: { x: tree.position.x * PX, radius: trunkRadius } }) : null;
    route = safe ? { left: safe.left / PX, right: safe.right / PX, height: elfHeight } : null;
    if (route) {
      elfBehavior?.setRoute(route);
      if (elfBehavior && pendingElfWish) { elfBehavior.wishDelivered(pendingElfWish); pendingElfWish = null; }
    }
    if (elfBounds) elf.scale.setScalar(elfHeight / elfBounds.height);
    dirty = false;
  }
  function render(now) {
    frame = null;
    if (destroyed || !visible || document.hidden || contextLost) { last = 0; return; }
    // Existing single renderer; cap the expensive full-tree redraw on small screens.
    if (last && now - last < (width < 700 ? 1000 / 30 : 1000 / 60) - 1) { wake(); return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    if (dirty) layout();
    let elfMoving = false;
    if (elfModel && elfBehavior && route) {
      const state = elfBehavior.tick(dt);
      if (elfVersion !== state.version) { elfAnimation.play(state.clip, state.loop, motion.matches); elfVersion = state.version; }
      elfAnimation.update(motion.matches || (state.held && !state.interactive) ? 0 : dt);
      elf.position.x = state.x;
      elf.position.y = ground;
      elfTurn.rotation.y = state.yaw;
      elfMoving = state.needsFrame;
      if (root.dataset.elfState !== state.state) root.dataset.elfState = state.state;
      if (root.dataset.elfRoutine !== state.routine) root.dataset.elfRoutine = state.routine;
      if (elfTarget.dataset.state !== state.state) elfTarget.dataset.state = state.state;
      const pressed = String(state.interactive), label = state.interactive ? '精靈互動中：拖曳旋轉，再點一下繼續活動' : '精靈：點一下停下來互動';
      if (elfTarget.getAttribute('aria-pressed') !== pressed) elfTarget.setAttribute('aria-pressed', pressed);
      if (elfTarget.getAttribute('aria-label') !== label) elfTarget.setAttribute('aria-label', label);
      elfTarget.style.left = `${state.x * PX}px`;
      elfTarget.style.top = `${height - (ground + elfHeight * .56) * PX}px`;
      elfTarget.style.width = `${Math.max(44, elfHeight * PX * .82)}px`;
      elfTarget.style.height = `${Math.max(44, elfHeight * PX * 1.18)}px`;
      elfShadow.position.set(elf.position.x, ground, elf.position.z - .1); elfShadow.scale.set(elfHeight * .65, elfHeight * .10, 1);
    }
    elfTarget.hidden = !elfModel || !route;
    elf.visible = !!elfModel && !!route;
    const envelopesMoving = envelopes.update(dt);
    envelopes.project(width,height);
    renderer.render(scene, camera);
    if (elfMoving || envelopesMoving) wake(); else last = 0;
  }
  async function load(id) {
    try {
      const file = `wish-${id}-web.glb`;
      const gltf = await loader.loadAsync(new URL(`../../assets/models/${file}`, import.meta.url).href);
      if (destroyed) { disposeObject(gltf.scene); return; }
      const model = gltf.scene;
      if (id === 'tree') {
        const box = boundsOf(model); geometry = radialBounds(model, box);
        model.position.set(-geometry.center.x, -geometry.bottom, -geometry.center.z); tree.add(model);
      } else {
        const box = boundsOf(model), center = box.getCenter(new THREE.Vector3());
        elfBounds = { height: box.max.y - box.min.y }; elfModel = model;
        model.position.set(-center.x, 0, -center.z); elfTurn.add(model);
        const response = await fetch(new URL('../../assets/animations/elf-actions.json', import.meta.url));
        if (!response.ok) throw new Error('既有精靈相容動畫載入失敗');
        const saved = await response.json();
        if (destroyed) return;
        elfAnimation = createElfAnimation(model, [...gltf.animations, ...saved.clips.map(clip => THREE.AnimationClip.parse(clip))]);
        elfBehavior = createElfBehavior({ durations: elfAnimation.durations, reduced: motion.matches });
        elfInteraction = mountElfInteraction(elfTarget, elfBehavior, wake, { pointerEvents: false });
        root.dispatchEvent(new CustomEvent('wish:elf-ready'));
      }
      loaded[id] = model; failed.delete(id); dirty = true; wake();
    } catch (error) {
      if (destroyed) return;
      failed.add(id);
      if (id === 'elf' && elfModel) {
        elfInteraction?.destroy(); elfAnimation?.destroy(); elfTurn.remove(elfModel); disposeObject(elfModel);
        elfModel = null; elfBehavior = null; elfAnimation = null; elfInteraction = null;
      }
      console.error(`Wish ${id} model:`, error);
    }
  }
  async function loadMissing() {
    if (busy || destroyed) return; busy = true; loading.hidden = false; retry.hidden = true;
    progress.textContent = '正在打開聖誕小屋……';
    await Promise.all(['tree', 'elf'].filter(id => !loaded[id]).map(load));
    busy = false;
    if (destroyed) return;
    loading.hidden = failed.size === 0;
    if (failed.size) { progress.textContent = `${[...failed].map(id => id === 'tree' ? '聖誕樹' : '精靈').join('、')}載入失敗，請檢查網路或 WebGL。`; retry.hidden = false; }
  }
  listen(gesture, 'keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) return;
    e.preventDefault(); tree.rotation.y = e.key === 'Home' ? 0 : tree.rotation.y + (e.key === 'ArrowLeft' ? -.2 : .2); wake();
  });
  listen(retry, 'click', loadMissing);
  const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; };
  listen(document, 'visibilitychange', () => { if (document.hidden) { interaction.cancel(); elfInteraction?.cancel(); stop(); } else wake(); });
  listen(motion, 'change', () => { interaction.cancel(); elfInteraction?.cancel(); elfBehavior?.setReduced(motion.matches); stop(); wake(); });
  listen(renderer.domElement, 'webglcontextlost', e => { e.preventDefault(); interaction.cancel(); contextLost = true; stop(); loading.hidden = false; progress.textContent = '3D 顯示暫時中斷，等待瀏覽器恢復。'; });
  listen(renderer.domElement, 'webglcontextrestored', () => { contextLost = false; loading.hidden = failed.size === 0; dirty = true; wake(); });
  const resize = new ResizeObserver(() => { dirty = true; wake(); }); resize.observe(root); resize.observe(treeSlot); resize.observe(lane); resize.observe(letter);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); else { interaction.cancel(); stop(); } }); observer.observe(root);
  const controller = { setWishes(wishes,onSelect,presentation) {
    envelopes.setWishes(wishes,onSelect,presentation);
    if (presentation?.newWishId) {
      if (elfBehavior && route) elfBehavior.wishDelivered(presentation.newWishId);
      else pendingElfWish = presentation.newWishId;
      wake();
    }
  }, destroy() {
    if (destroyed) return; destroyed = true; stop(); cleanups.forEach(fn => fn()); resize.disconnect(); observer.disconnect();
    interaction.destroy(); root.classList.remove('wish-mesh-controls'); elfInteraction?.destroy(); elfAnimation?.destroy(); elfTarget.hidden = true;
    envelopes.destroy();disposeObject(scene); environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); mounted.delete(root);
  } };
  mounted.set(root, controller); loadMissing(); wake(); return controller;
}
