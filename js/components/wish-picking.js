import * as THREE from 'three';

// Exact raycasts only at pointerdown; no per-frame GLB traversal or billboard transforms.
export function createWishPicker({ root, camera, treeModel, elfModel, envelopes }) {
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), box = new THREE.Box3();
  function meshHit(model, skinned = false) {
    if (!model || !model.visible) return null;
    model.updateWorldMatrix(true, true);
    if (skinned) model.traverse(node => { if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingBox(); node.computeBoundingSphere(); } });
    box.setFromObject(model);
    if (!raycaster.ray.intersectsBox(box)) return null;
    return raycaster.intersectObject(model, true)[0] || null;
  }
  return event => {
    const rect = root.getBoundingClientRect(), x = event.clientX - rect.left - (root.clientLeft || 0), y = event.clientY - rect.top - (root.clientTop || 0);
    if (x < 0 || y < 0 || x > root.clientWidth || y > root.clientHeight) return null;
    camera.updateMatrixWorld();ndc.set(x / root.clientWidth * 2 - 1, 1 - y / root.clientHeight * 2);raycaster.setFromCamera(ndc, camera);
    const candidates = [], elf = meshHit(elfModel(), true), tree = meshHit(treeModel());
    if (elf) candidates.push({ kind: 'elf', distance: elf.distance, priority: 0 });
    const envelope = envelopes.pick(raycaster);
    if (envelope) candidates.push({ ...envelope, priority: 1 });
    if (tree) candidates.push({ kind: 'tree', distance: tree.distance, priority: 2 });
    candidates.sort((a, b) => Math.abs(a.distance - b.distance) < .0001 ? a.priority - b.priority : a.distance - b.distance);
    return candidates[0] || null;
  };
}
