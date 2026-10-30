import { mountHeroSigns } from './components/game-hero-signs.js';

// Hero navigation is independent of model loading; manual scrolling stays native.
const hero = document.querySelector('.games-hero');
mountHeroSigns(hero);
let navigationFrame;
hero.querySelectorAll('[data-game-target]').forEach(button => {
  button.addEventListener('click', () => {
    const panel = document.getElementById(button.dataset.gameTarget);
    if (!panel) return;
    // Give keyboard users the game's existing controls without a second native scroll.
    panel.querySelector('iframe')?.focus({ preventScroll: true });
    cancelAnimationFrame(navigationFrame);
    navigationFrame = requestAnimationFrame(() => {
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const header = document.querySelector('.site-header');
      const headerStyle = header && getComputedStyle(header);
      const headerInset = headerStyle && ['fixed', 'sticky'].includes(headerStyle.position)
        ? Math.max(0, header.getBoundingClientRect().height + Math.max(0, parseFloat(headerStyle.top) || 0) - viewportTop)
        : 0;
      const gutter = 16;
      const visibleTop = viewportTop + headerInset + gutter;
      const availableHeight = Math.max(0, viewportHeight - headerInset - gutter * 2);
      const rect = panel.getBoundingClientRect();
      // Center a fitting panel; a taller game starts below the header with controls first.
      const inset = visibleTop + Math.max(0, (availableHeight - rect.height) / 2);
      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - inset),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
  });
});

// Paper layers open once their artwork is decoded, so nothing unfolds half-painted.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const artwork = [...hero.querySelectorAll('img')].map(image => image.decode().catch(() => {}));
Promise.race([Promise.all(artwork), new Promise(resolve => setTimeout(resolve, 1500))]).then(() => hero.classList.add('is-opening'));

// The Home Santa GLB in bind pose: arms lowered, then a gentle procedural sway.
const slot = hero.querySelector('.games-hero-santa');
const status = hero.querySelector('.games-hero-model-status');
let cleanup = () => {}, generation = 0;
const VIEW_HEIGHT = .54, VIEW_CENTER = .75;
function disposeModel(model) {
  const textures = new Set();
  model.traverse(node => {
    node.geometry?.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue;
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
      material.dispose();
    }
    node.skeleton?.dispose();
  });
  textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
}
async function mountSanta() {
  const run = ++generation;
  slot.dataset.state = 'loading'; slot.setAttribute('aria-busy', 'true'); status.hidden = false;
  status.textContent = '正在載入聖誕老人…';
  try {
    const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('../vendor/three/examples/jsm/loaders/GLTFLoader.js'),
      import('../vendor/three/examples/jsm/environments/RoomEnvironment.js'),
    ]);
    if (run !== generation) return;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    slot.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20);
    const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
    let environment, model, resizeObserver, visibleObserver, frame, lastDraw = 0, inView = true;
    const restore = () => render();
    const stop = () => { cancelAnimationFrame(frame); frame = undefined; };
    const start = () => { if (frame === undefined && inView && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick); };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    const onMotion = () => { if (motion.matches) { stop(); settle(0); renderer.render(scene, camera); } else start(); };
    cleanup = () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
      visibleObserver?.disconnect();
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('webglcontextrestored', restore);
      if (model) disposeModel(model);
      environment?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
    try { environment = pmrem.fromScene(room, .04); }
    finally { room.dispose(); pmrem.dispose(); }
    scene.environment = environment.texture;
    scene.environmentIntensity = .6;
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb0c2c4, 1.4));
    const light = new THREE.DirectionalLight(0xfff4dd, 1.8);
    light.position.set(-3, 6, 4); scene.add(light);
    const fill = new THREE.DirectionalLight(0xe2f0ff, .8);
    fill.position.set(4, 3, -2); scene.add(fill);
    const gltf = await new GLTFLoader().loadAsync(new URL('../assets/models/santa-dance.glb', import.meta.url).href);
    if (run !== generation) { disposeModel(gltf.scene); return; }
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    if (bounds.isEmpty()) throw new Error('Empty Santa GLB');
    const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const portrait = new THREE.Group();
    portrait.scale.setScalar(1 / size.y);
    model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
    portrait.add(model); scene.add(portrait);
    // Bones are posed at runtime only; the GLB file and its dance clip stay untouched.
    const bone = name => model.getObjectByName(`mixamorig${name}`);
    const spine = bone('Spine1'), neck = bone('Neck'), head = bone('Head');
    if (!spine || !neck || !head) throw new Error('Santa skeleton is missing spine bones');
    const pose = new THREE.Quaternion(), roll = new THREE.Vector3(0, 0, 1), yaw = new THREE.Vector3(0, 1, 0);
    // Aim each arm segment straight down in world space; bind-pose bone axes are not mirrored.
    function lowerArm(joint) {
      if (!joint?.children[0]) return;
      joint.updateWorldMatrix(true, true);
      const from = joint.getWorldPosition(new THREE.Vector3());
      const along = joint.children[0].getWorldPosition(new THREE.Vector3()).sub(from).normalize();
      const down = new THREE.Vector3(Math.sign(from.x) * .22, -1, .08).normalize();
      const parent = joint.parent.getWorldQuaternion(new THREE.Quaternion());
      const delta = new THREE.Quaternion().setFromUnitVectors(along, down);
      joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
    }
    for (const side of ['Left', 'Right']) { lowerArm(bone(`${side}Arm`)); lowerArm(bone(`${side}ForeArm`)); }
    const rest = new Map([spine, neck, head].map(joint => [joint, joint.quaternion.clone()]));
    const turn = (joint, axis, angle) => joint.quaternion.copy(rest.get(joint)).multiply(pose.setFromAxisAngle(axis, angle));
    function settle(time) {
      const sway = Math.sin(time * 1.15);
      turn(spine, roll, sway * .03);
      turn(neck, roll, Math.sin(time * 1.15 - .5) * .022);
      turn(head, yaw, Math.sin(time * .62) * .05);
    }
    function render() {
      const width = slot.clientWidth, height = slot.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      // The slot's bottom edge sits behind the snow hill, which hides the chest crop.
      const aspect = width / height;
      camera.left = -VIEW_HEIGHT * aspect / 2; camera.right = VIEW_HEIGHT * aspect / 2;
      camera.top = VIEW_HEIGHT / 2; camera.bottom = -VIEW_HEIGHT / 2;
      camera.position.set(0, VIEW_CENTER, 5); camera.lookAt(0, VIEW_CENTER, 0);
      camera.updateProjectionMatrix(); renderer.render(scene, camera);
    }
    function tick(now) {
      frame = requestAnimationFrame(tick);
      if (now - lastDraw < 33) return;
      lastDraw = now; settle(now / 1000); renderer.render(scene, camera);
    }
    settle(0);
    resizeObserver = new ResizeObserver(render); resizeObserver.observe(slot);
    renderer.domElement.addEventListener('webglcontextrestored', restore);
    render();
    visibleObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) start(); else stop(); });
    visibleObserver.observe(hero);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    start();
    slot.dataset.state = 'ready'; slot.setAttribute('aria-busy', 'false'); status.hidden = true;
  } catch (error) {
    if (run !== generation) return;
    cleanup(); cleanup = () => {};
    slot.dataset.state = 'error'; slot.setAttribute('aria-busy', 'false');
    status.textContent = '聖誕老人無法載入：assets/models/santa-dance.glb。請確認 WebGL 2 與本機伺服器。';
    console.error('Games hero Santa failed to load', error);
  }
}
window.addEventListener('pagehide', () => { generation++; cleanup(); cleanup = () => {}; });
window.addEventListener('pageshow', event => { if (event.persisted) mountSanta(); });
mountSanta();
