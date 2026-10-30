import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { fitViewHeight, gestureIntent, returnAngle, wrapAngle } from './character-motion.js';
import { sliceSantaDance, createReindeerDance, softenSantaLoop } from './character-animation.js';
import { createHeadTracker } from './santa-head.js';

const instances = new WeakMap();
const PITCH = .075;
const MODELS = [
  { id: 'santa', label: '聖誕老人', src: new URL('../../assets/models/santa-new.glb', import.meta.url).href, height: 2.15, speed: 1 },
  { id: 'reindeer', label: '麋鹿', src: new URL('../../assets/models/reindeer.glb', import.meta.url).href, height: 2.05, speed: 1 },
];

export function disposeModel(model) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  model.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    if (node.skeleton) skeletons.add(node.skeleton);
  });
  textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  skeletons.forEach(skeleton => skeleton.dispose());
}

// 只讀取原動畫各姿勢的外框；不修改網格、骨架、軌跡或貼圖。
export async function animationBounds(model, mixer, clip, cancelled = () => false) {
  const bounds = new THREE.Box3();
  const count = clip ? Math.min(40, Math.max(16, Math.ceil(clip.duration * 12))) : 1;
  for (let i = 0; i <= count; i++) {
    if (cancelled()) return null;
    if (clip) mixer.setTime(clip.duration * i / count);
    model.updateMatrixWorld(true);
    model.traverse(node => {
      if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingBox(); }
    });
    bounds.union(new THREE.Box3().setFromObject(model));
    if (i % 8 === 7) await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (clip) mixer.setTime(0);
  model.updateMatrixWorld(true);
  return bounds;
}

export function mountCharacters(root) {
  if (instances.has(root)) return instances.get(root);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  let disposed = false, frameId = null, lastTime = 0, layoutDirty = true;
  let width = 0, height = 0, contextLost = false;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // 兩個角色共用唯一的透明 Renderer；每個角色使用獨立 scene / mixer。
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = 'characters-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  root.prepend(renderer.domElement);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  let environment;
  try { environment = pmrem.fromScene(room, .04); }
  catch (error) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); throw error; }
  finally { room.dispose(); pmrem.dispose(); }

  function listen(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    cleanups.push(() => target.removeEventListener(type, callback, options));
  }
  const views = MODELS.map(config => {
    const card = root.querySelector(`#${config.id}-card`);
    const scene = new THREE.Scene();
    scene.environment = environment.texture;
    scene.environmentIntensity = .6;
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb0c2c4, 1.4));
    const key = new THREE.DirectionalLight(0xfff4dd, 1.8);
    key.position.set(-3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
    key.shadow.camera.right = key.shadow.camera.top = 2.5;
    key.shadow.camera.near = .1; key.shadow.camera.far = 20;
    key.shadow.normalBias = .025;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe2f0ff, .8);
    fill.position.set(4, 3, -2); scene.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.ShadowMaterial({ opacity: .13 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true; ground.position.y = -.015; scene.add(ground);
    const turn = new THREE.Group(); scene.add(turn);
    return {
      ...config, card, scene, ground, key, turn,
      camera: new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 30),
      slot: card.querySelector('[data-model-slot]'),
      status: card.querySelector('.model-status'),
      fallback: card.querySelector('.model-fallback'),
      progress: card.querySelector('[role="progressbar"]'),
      retry: card.querySelector('[data-model-action="retry"]'),
      ready: false, loading: false, playing: !motion.matches,
      model: null, mixer: null, clip: null, action: null,
      radius: 1, rect: null, visible: false, yaw: 0, pointer: null,
      returning: false, returnAt: 0, elapsed: 0,
    };
  });

  function updateAnimationState(view) {
    view.slot.dataset.animation = view.playing ? 'playing' : 'paused';
    if (view.ready) view.status.textContent = view.playing
      ? `${view.label}正在跳舞。`
      : `${view.label}動畫已暫停，按 P 可繼續。`;
  }
  function invalidateLayout() { layoutDirty = true; requestFrame(); }
  function requestFrame() {
    if (!disposed && !contextLost && !document.hidden && frameId === null) frameId = requestAnimationFrame(render);
  }
  function updateLayout() {
    const rootRect = root.getBoundingClientRect();
    const nextWidth = Math.max(1, rootRect.width), nextHeight = Math.max(1, rootRect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (width !== nextWidth || height !== nextHeight || renderer.getPixelRatio() !== dpr) {
      width = nextWidth; height = nextHeight;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
    }
    let viewHeight = 2.8;
    for (const view of views) {
      const client = view.slot.getBoundingClientRect();
      view.rect = { left: client.left - rootRect.left, right: client.right - rootRect.left,
        top: client.top - rootRect.top, bottom: client.bottom - rootRect.top, width: client.width, height: client.height };
      const r = view.rect;
      view.visible = r.width > 0 && r.height > 0 && client.bottom > 0 && client.top < window.innerHeight && client.right > 0 && client.left < window.innerWidth;
      if (view.ready) viewHeight = Math.max(viewHeight, fitViewHeight(view.height, view.radius, r.width / Math.max(1, r.height), PITCH));
    }
    // 共用世界尺度及地面投影位置，兩側腳底落在同一條基準線。
    for (const view of views) {
      const aspect = view.rect.width / Math.max(1, view.rect.height);
      const center = .38 * viewHeight / Math.cos(PITCH);
      view.camera.left = -viewHeight * aspect / 2;
      view.camera.right = viewHeight * aspect / 2;
      view.camera.top = viewHeight / 2; view.camera.bottom = -viewHeight / 2;
      view.camera.position.set(0, center + Math.sin(PITCH) * 8, Math.cos(PITCH) * 8);
      view.camera.lookAt(0, center, 0);
      view.camera.updateProjectionMatrix();
    }
    layoutDirty = false;
  }

  function render(time) {
    frameId = null;
    if (disposed || document.hidden || contextLost) { lastTime = 0; return; }
    // 手機將循環上限設為 30fps；靜止時不持續重繪。
    const interval = window.innerWidth < 700 ? 1000 / 30 : 1000 / 60;
    if (lastTime && time - lastTime < interval - 1) { requestFrame(); return; }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .06) : 0;
    lastTime = time;
    if (layoutDirty) updateLayout();
    renderer.setScissorTest(false);
    renderer.clear(true, true, true);
    renderer.setScissorTest(true);
    let active = false;
    for (const view of views) {
      if (!view.ready || !view.visible) continue;
      if (view.playing) {
        if (view.clip) {
          if (view.loop) view.loop.update(delta * view.speed);
          else view.mixer.update(delta * view.speed);
        }
        else { view.elapsed += delta; view.turn.rotation.z = Math.sin(view.elapsed * .7) * .008; }
        active = true;
      } else if (view.head) view.mixer.update(0);
      if (view.head?.update(delta)) active = true;
      if (view.returning && !view.pointer && time >= view.returnAt) {
        view.yaw = returnAngle(view.yaw, delta, motion.matches);
        if (view.yaw === 0) view.returning = false;
      }
      if (view.returning) active = true;
      view.turn.rotation.y = view.yaw;
      const r = view.rect;
      const left = Math.max(0, r.left), bottom = Math.max(0, height - r.bottom);
      const clippedWidth = Math.max(0, Math.min(width, r.right) - left);
      const clippedHeight = Math.max(0, Math.min(height, height - r.top) - bottom);
      renderer.setViewport(r.left, height - r.bottom, r.width, r.height);
      renderer.setScissor(left, bottom, clippedWidth, clippedHeight);
      renderer.render(view.scene, view.camera);
    }
    renderer.setScissorTest(false);
    if (active) requestFrame(); else lastTime = 0;
  }

  async function load(view) {
    if (view.loading || view.ready || disposed) return;
    view.loading = true; view.retry.hidden = true; view.fallback.hidden = false;
    view.progress.value = 0;
    view.slot.dataset.state = 'loading'; view.slot.setAttribute('aria-busy', 'true');
    view.status.textContent = `正在載入${view.label}…`;
    try {
      const gltf = await loader.loadAsync(view.src, event => {
        if (disposed) return;
        const percent = event.total ? Math.round(event.loaded / event.total * 100) : 0;
        view.progress.value = percent;
      });
      if (disposed) { disposeModel(gltf.scene); return; }
      view.model = gltf.scene;
      if (view.id === 'santa') view.clip = sliceSantaDance(gltf.animations);
      else {
        const dance = createReindeerDance(view.model);
        view.clip = dance.clip; view.rig = dance.rig;
      }
      view.mixer = new THREE.AnimationMixer(view.model);
      if (view.clip) {
        view.action = view.mixer.clipAction(view.clip);
        view.action.setLoop(THREE.LoopRepeat, Infinity).play();
      }
      const bounds = await animationBounds(view.model, view.mixer, view.clip, () => disposed);
      if (disposed) return;
      if (!bounds || bounds.isEmpty()) throw new Error('Empty model');
      if (view.id === 'santa') view.loop = softenSantaLoop(view.mixer, view.action, view.clip);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = view.height / size.y;
      const centered = new THREE.Group();
      centered.position.set(-center.x, -bounds.min.y, -center.z);
      centered.add(view.model);
      const normalized = new THREE.Group(); normalized.scale.setScalar(scale); normalized.add(centered);
      view.turn.add(normalized); view.attached = true;
      view.radius = Math.hypot(size.x / 2, size.z / 2) * scale;
      view.model.traverse(node => { if (node.isMesh) { node.castShadow = true; if (node.isSkinnedMesh) node.frustumCulled = false; } });
      if (view.id === 'santa') view.head = createHeadTracker(view.model, view.slot, { onMove: requestFrame });
      view.ready = true;
      view.slot.dataset.state = 'ready'; view.slot.setAttribute('aria-busy', 'false');
      view.slot.dataset.clip = view.clip?.name ?? 'whole-model-sway';
      view.fallback.hidden = true;
      view.status.textContent = view.clip
        ? `${view.label}已登場${motion.matches ? '（依減少動態設定暫停）' : '，正在跳舞。'}`
        : `${view.label}已登場；骨架無法辨識，暫用輕微搖擺。`;
      updateAnimationState(view); invalidateLayout();
    } catch (error) {
      if (disposed) return;
      view.loop?.destroy(); view.loop = null;
      if (view.model) { view.mixer?.stopAllAction(); view.mixer?.uncacheRoot(view.model); disposeModel(view.model); view.model = null; }
      view.turn.clear(); view.attached = false; view.ready = false;
      view.fallback.hidden = true;
      view.slot.dataset.state = 'error'; view.slot.setAttribute('aria-busy', 'false');
      view.status.textContent = error.message?.includes('Santa GLB 缺少')
        ? '聖誕老人模型缺少涵蓋第 1–4 秒的舞蹈，未改播其他動作。'
        : `${view.label}無法登場。請確認使用 Live Server，再重試載入。`;
      view.retry.hidden = false;
    } finally { view.loading = false; }
  }

  for (const view of views) {
    function release(event, cancelled = false) {
      const pointer = view.pointer;
      if (!pointer || (event?.pointerId !== undefined && pointer.id !== event.pointerId)) return;
      view.suppressClick = cancelled || pointer.intent !== 'pending';
      view.pointer = null;
      if (view.slot.hasPointerCapture?.(pointer.id)) view.slot.releasePointerCapture(pointer.id);
      view.yaw = wrapAngle(view.yaw);
      view.returning = true; view.returnAt = performance.now() + 450;
      if (motion.matches) { view.yaw = 0; view.returning = false; }
      view.slot.classList.remove('is-dragging'); requestFrame();
    }
    listen(view.slot, 'pointerdown', event => {
      if (!view.ready || event.button !== 0 || event.isPrimary === false) { release(null, true); return; }
      view.suppressClick = false;
      view.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: view.yaw, type: event.pointerType, intent: 'pending' };
      view.returning = false;
      view.slot.focus({ preventScroll: true });
    });
    listen(view.slot, 'pointermove', event => {
      const pointer = view.pointer;
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (pointer.intent === 'pending') pointer.intent = gestureIntent(dx, dy, pointer.type);
      if (pointer.intent === 'scroll') { release(event, true); return; }
      if (pointer.intent === 'rotate') {
        if (event.cancelable) event.preventDefault();
        if (!view.slot.hasPointerCapture(event.pointerId)) view.slot.setPointerCapture(event.pointerId);
        view.slot.classList.add('is-dragging');
        view.yaw = pointer.yaw + dx / Math.max(150, view.slot.clientWidth) * Math.PI * 2;
        requestFrame();
      }
    }, { passive: false });
    listen(view.slot, 'pointerup', event => release(event));
    listen(view.slot, 'pointercancel', event => release(event, true));
    listen(view.slot, 'lostpointercapture', event => release(event, true));
    listen(view.slot, 'pointerleave', event => { if (view.pointer?.intent === 'pending') release(event, true); });
    listen(view.slot, 'click', event => {
      if (!view.ready) return;
      if (view.suppressClick && event.detail !== 0) { view.suppressClick = false; return; }
      view.suppressClick = false;
      view.slot.dispatchEvent(new CustomEvent('character:speak', { bubbles: true, detail: { character: view.id } }));
    });
    listen(view.slot, 'keydown', event => {
      if (['Enter', ' '].includes(event.key)) {
        view.suppressClick = false;
        if (event.repeat) event.preventDefault();
        return; // 原生 button 會為 Enter / Space 產生 click。
      }
      if (view.ready && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key.toLowerCase() === 'p' || event.code === 'KeyP')) {
        event.preventDefault();
        if (!event.repeat) { view.playing = !view.playing; updateAnimationState(view); requestFrame(); }
        return;
      }
      if (!view.ready || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      view.yaw += event.key === 'ArrowLeft' ? -.3 : .3;
      view.returning = true; view.returnAt = performance.now() + 900; requestFrame();
    });
    listen(view.retry, 'click', () => load(view));
    load(view);
  }

  listen(window, 'resize', invalidateLayout, { passive: true });
  listen(window, 'scroll', invalidateLayout, { passive: true });
  if (window.visualViewport) listen(window.visualViewport, 'resize', invalidateLayout, { passive: true });
  listen(window, 'blur', () => views.forEach(view => {
    view.slot.classList.remove('is-dragging');
    view.pointer = null; view.returning = true; view.returnAt = 0; requestFrame();
  }));
  listen(document, 'visibilitychange', () => {
    lastTime = 0;
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = null; }
    else invalidateLayout();
  });
  listen(motion, 'change', () => {
    if (motion.matches) views.forEach(view => { view.playing = false; view.yaw = 0; view.returning = false; updateAnimationState(view); });
    requestFrame();
  });
  listen(renderer.domElement, 'webglcontextlost', event => {
    event.preventDefault(); contextLost = true; cancelAnimationFrame(frameId); frameId = null;
    views.forEach(view => { view.status.textContent = '3D 顯示暫停，等待瀏覽器恢復。'; });
  });
  listen(renderer.domElement, 'webglcontextrestored', () => { contextLost = false; invalidateLayout(); });
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidateLayout) : null;
  resizeObserver?.observe(root); views.forEach(view => resizeObserver?.observe(view.slot));
  const visibilityObserver = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(invalidateLayout) : null;
  views.forEach(view => visibilityObserver?.observe(view.slot));
  invalidateLayout();
  const controller = {
    destroy() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(frameId); frameId = null;
      cleanups.forEach(cleanup => cleanup());
      resizeObserver?.disconnect(); visibilityObserver?.disconnect();
      for (const view of views) {
        view.head?.destroy();
        view.loop?.destroy();
        view.mixer?.stopAllAction();
        if (view.model) view.mixer?.uncacheRoot(view.model);
        if (view.model && !view.attached) disposeModel(view.model);
        disposeModel(view.scene);
        view.key.shadow.map?.dispose();
      }
      environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      instances.delete(root);
    },
  };
  instances.set(root, controller);
  return controller;
}
