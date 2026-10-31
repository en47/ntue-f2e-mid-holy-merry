import * as THREE from 'three';
import { horizontalIntent } from './wish-layout.js';
import { createPaperEnvelopeLibrary, paperSwing, SWING_DURATION } from './paper-envelope.js';
import { outwardLean, pendulumStep } from '../data/paper-envelope-style.js';
import { assignEnvelopeAnchors } from './wish-envelope-layout.js';

export function createWishEnvelopes({ root, tree, camera, wake, motion, managedInteraction = false }) {
  const group = new THREE.Group(); group.name = 'hanging-paper-wishes'; tree.add(group);
  const targets = document.createElement('div'); targets.className = 'tree-envelope-targets'; root.append(targets);
  let disposed = false, geometry = null, entries = [], onSelect = () => {}, revision = 0, lastProjection = null, width = 0, height = 0;
  let proxy = null, lastAngle = tree.rotation.y, spin = 0;
  const seedValue = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(seedValue);
  else seedValue[0] = Math.floor(Math.random() * 4294967296);
  const sessionSeed = seedValue[0];
  const proxyMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const library = createPaperEnvelopeLibrary({
    onLoad: () => { revision++; wake(); },
    onError: (kind, error) => { revision++; console.error(`Wish paper envelope ${kind}:`, error); wake(); },
  });
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), projected = new THREE.Vector3();
  const box = new THREE.Box3(), corner = new THREE.Vector3(), normal = new THREE.Vector3(), viewDirection = new THREE.Vector3();
  // The delivery wobble and the pendulum add up, so a turn during the wobble still reads naturally.
  function pose(entry) {
    entry.pivot.rotation.set(entry.lean, 0, entry.rest + entry.sway.angle + (entry.swing === null ? 0 : paperSwing(entry.swing)));
  }
  function layout(next = geometry) {
    if (next !== geometry || !proxy) {
      proxy?.geometry.dispose(); geometry = next;
      if (geometry) {
        const radii = geometry.branchRadii || Array.from({ length: 24 }, (_, i) => geometry.radius * (1 - i / 24 * .92));
        const points = [new THREE.Vector2(0, 0), ...radii.map((r, i) => new THREE.Vector2(r, geometry.height * (i + .5) / radii.length)), new THREE.Vector2(0, geometry.height)];
        // CPU-only coarse occluder. Never render or duplicate the 750k-triangle GLB.
        proxy = new THREE.Mesh(new THREE.LatheGeometry(points, 16), proxyMaterial); proxy.matrixAutoUpdate = false;
      }
    }
    if (!geometry) return;
    for (const entry of entries) {
      const placement = entry.assignment;
      entry.anchor.position.fromArray(placement.point).multiplyScalar(geometry.height);
      entry.anchor.scale.setScalar(geometry.height * placement.size);
      entry.anchor.rotation.set(0, placement.rotation[1], 0);
      entry.rest = placement.rotation[2];
      pose(entry);
      entry.anchor.userData.wishAnchor = placement.anchorId;
      entry.anchor.userData.wishZone = placement.zone;
    }
    revision++; lastProjection = null;
  }
  function occluded(point) {
    if (!proxy) return false;
    projected.copy(point).project(camera); ndc.set(projected.x, projected.y); raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(proxy, false);
    return !!hits.length && hits[0].distance < raycaster.ray.origin.distanceTo(point) - .004 * geometry.height * tree.scale.x;
  }
  function clickOccluded(point) {
    const models = tree.children.filter(child => child !== group);
    if (!models.length) return occluded(point);
    // A circular crown proxy can overestimate a branch near an existing bauble.
    // Resolve actual clicks against the original mesh once, never every animation frame.
    projected.copy(point).project(camera); ndc.set(projected.x, projected.y); raycaster.setFromCamera(ndc, camera);
    const previousFar = raycaster.far;
    raycaster.far = Math.max(0, raycaster.ray.origin.distanceTo(point) - .001 * geometry.height * tree.scale.x);
    const blocked = raycaster.intersectObjects(models, true).length > 0;
    raycaster.far = previousFar;
    return blocked;
  }
  function hit(entry, event) {
    if (!Number.isFinite(event.clientX) || event.detail === 0) return true; // Keyboard / assistive activation.
    const base = root.getBoundingClientRect();
    ndc.set((event.clientX - base.left - (root.clientLeft || 0)) / width * 2 - 1, 1 - (event.clientY - base.top - (root.clientTop || 0)) / height * 2);
    raycaster.setFromCamera(ndc, camera);
    const picked = raycaster.intersectObject(entry.board, false)[0];
    if (picked && !clickOccluded(picked.point)) return true;
    // Preserve a 44px touch target for small ornaments; test the visible body center.
    return entry.screenWidth < 44 && !clickOccluded(entry.worldCenter);
  }
  function createEntry(wish) {
    const kind = wish.isOwn ? 'gold' : 'normal', ornament = library.create(kind), button = document.createElement('button');
    group.add(ornament.anchor); ornament.anchor.visible = false;
    const entry = { ...ornament, wish, kind, button, rest: 0, swing: null, sway: { angle: 0, velocity: 0 }, lean: 0, worldCenter: new THREE.Vector3(), screenWidth: 0 };
    button.type = 'button'; button.className = 'tree-envelope-hit'; button.hidden = true;
    let drag = null, moved = false;
    if (!managedInteraction) {
    button.addEventListener('pointerdown', e => { if (e.button !== 0 || e.isPrimary === false) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, angle: tree.rotation.y }; moved = false; });
    button.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y, intent = horizontalIntent(dx, dy);
      if (intent === 'pending') return; moved = true;
      if (intent !== 'rotate') return;
      button.setPointerCapture(e.pointerId); e.preventDefault(); tree.rotation.y = drag.angle + dx * .012; wake();
    }, { passive: false });
    button.addEventListener('pointerup', () => { drag = null; });
    button.addEventListener('pointercancel', () => { moved = true; drag = null; });
    button.addEventListener('lostpointercapture', () => { drag = null; });
    }
    button.addEventListener('click', e => { e.stopPropagation(); if (!moved && !button.hidden && hit(entry, e)) onSelect(entry.wish); moved = false; drag = null; });
    targets.append(button); return entry;
  }
  function setWishes(wishes, select, { newWishId = null } = {}) {
    if (disposed) return;
    const own = wishes.find(w => w.isOwn);
    const next = [...(own ? [own] : []), ...wishes.filter(w => !w.isOwn)].slice(0, 10);
    const plan = assignEnvelopeAnchors(next, entries.map(e => e.assignment).filter(Boolean), sessionSeed);
    const placements = new Map(plan.map(p => [p.id, p]));
    const old = new Map(entries.map(e => [e.wish.id, e])); onSelect = select;
    const keep = new Set(next.map(w => w.id));
    for (const entry of entries) if (!keep.has(entry.wish.id) || next.find(w => w.id === entry.wish.id)?.isOwn !== entry.wish.isOwn) {
      group.remove(entry.anchor); entry.button.remove(); library.release(entry); old.delete(entry.wish.id);
    }
    entries = next.map(wish => {
      let entry = old.get(wish.id);
      if (!entry) entry = createEntry(wish);
      entry.assignment = placements.get(wish.id);
      entry.wish = wish;
      entry.button.setAttribute('aria-label', wish.isOwn ? '查看自己的最新願望（金色信封）' : `查看 ${wish.nickname} 的已核准願望`);
      // Only an explicit successful-delivery signal starts motion. Data refresh never does.
      if (wish.isOwn && wish.id === newWishId && !motion?.matches && !entry.hasSwung) { entry.swing = 0; entry.hasSwung = true; }
      return entry;
    });
    layout(); revision++; wake();
  }
  function update(dt) {
    let moving = false;
    // Smooth the pointer's steps into a spin rate; its change is what the envelopes feel.
    const step = Math.min(dt, .05);
    let acceleration = 0;
    if (step > 0) {
      const previous = spin;
      spin += ((tree.rotation.y - lastAngle) / step - spin) * (1 - Math.exp(-step * 18));
      if (Math.abs(spin) < .002) spin = 0;
      acceleration = (spin - previous) / step; lastAngle = tree.rotation.y;
    }
    const lean = outwardLean(spin);
    for (const entry of entries) {
      if (motion?.matches) {
        entry.sway.angle = entry.sway.velocity = entry.lean = 0;
        if (entry.swing !== null) { entry.swing = null; revision++; }
        pose(entry); continue;
      }
      if (!geometry || !entry.variant.ready) continue;
      if (entry.swing !== null) {
        entry.swing = Math.min(SWING_DURATION, entry.swing + dt);
        if (entry.swing >= SWING_DURATION) entry.swing = null; else moving = true;
        revision++;
      }
      if (step > 0 && (acceleration || entry.sway.angle || entry.sway.velocity)) {
        pendulumStep(entry.sway, acceleration, step);
        entry.lean += (lean - entry.lean) * (1 - Math.exp(-step * 6));
        if (Math.abs(entry.sway.angle) + Math.abs(entry.sway.velocity) + Math.abs(entry.lean) < .002) { entry.sway.angle = entry.sway.velocity = entry.lean = 0; } else moving = true;
        revision++;
      }
      pose(entry);
    }
    return moving || spin !== 0;
  }
  function project(nextWidth, nextHeight) {
    width = nextWidth; height = nextHeight;
    if (!geometry || !width || !height) return;
    const key = [width, height, tree.rotation.y, tree.scale.x, tree.position.x, tree.position.y, revision].join(':');
    if (key === lastProjection) return; lastProjection = key;
    tree.updateWorldMatrix(true, true); camera.updateMatrixWorld(); camera.getWorldDirection(viewDirection); proxy.matrixWorld.copy(tree.matrixWorld);
    for (const entry of entries) {
      entry.anchor.visible = entry.variant.ready && !entry.variant.failed;
      entry.button.hidden = true;
      if (!entry.anchor.visible) continue;
      entry.body.localToWorld(entry.worldCenter.copy(entry.localCenter));
      entry.body.getWorldDirection(normal);
      if (Math.abs(normal.dot(viewDirection)) < .045) continue;
      box.setFromObject(entry.body);
      // The coarse circular crown overfills the real gaps between branches.
      // Keep front-facing short-hung ornaments reachable; exact mesh depth still
      // validates each pointer click, and WebGL handles visual occlusion itself.
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity,
        clear = normal.dot(viewDirection) < -.25 || !occluded(entry.worldCenter);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        corner.set(x, y, z); projected.copy(corner).project(camera);
        minX = Math.min(minX, projected.x); maxX = Math.max(maxX, projected.x); minY = Math.min(minY, projected.y); maxY = Math.max(maxY, projected.y);
        if (!clear && !occluded(corner)) clear = true;
      }
      projected.copy(entry.worldCenter).project(camera);
      if (!clear || projected.z < -1 || projected.z > 1 || maxX < -1 || minX > 1 || maxY < -1 || minY > 1) continue;
      entry.screenWidth = (maxX - minX) * width / 2;
      entry.button.hidden = false;
      entry.button.style.left = `${(projected.x + 1) * width / 2}px`;
      entry.button.style.top = `${(1 - projected.y) * height / 2}px`;
      entry.button.style.width = `${Math.max(44, entry.screenWidth)}px`;
      entry.button.style.height = `${Math.max(44, (maxY - minY) * height / 2)}px`;
    }
  }
  function pick(pointerRay) {
    if (!geometry) return null;
    tree.updateWorldMatrix(true, true);
    let closest = null;
    for (const entry of entries) {
      if (!entry.variant.ready || entry.variant.failed) continue;
      const hit = pointerRay.intersectObject(entry.board, false)[0];
      if (hit && (!closest || hit.distance < closest.distance)) closest = { kind: 'envelope', distance: hit.distance, activate: () => onSelect(entry.wish) };
    }
    return closest;
  }
  return { setWishes, layout, update, project, pick, destroy() {
    if (disposed) return; disposed = true;
    targets.remove(); tree.remove(group); group.clear(); entries.forEach(e => library.release(e)); entries = [];
    proxy?.geometry.dispose(); proxyMaterial.dispose(); library.destroy();
  } };
}
