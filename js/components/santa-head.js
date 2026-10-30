import * as THREE from 'three';

// Only Head and Neck move; both limits are well inside what the beard and collar can follow.
const MAX_YAW = .42, MAX_PITCH = .16, HEAD_SHARE = .65, RESPONSE = 7;
const UP = new THREE.Vector3(0, 1, 0), SIDE = new THREE.Vector3(1, 0, 0);
const clamp = value => Math.max(-1, Math.min(1, value));

function turnInWorld(bone, yaw, pitch) {
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const delta = new THREE.Quaternion().setFromAxisAngle(UP, yaw).multiply(new THREE.Quaternion().setFromAxisAngle(SIDE, pitch));
  bone.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
}

// Follows a real mouse only. Touch devices and reduced motion keep the head on its own pose.
export function createHeadTracker(model, anchor, { onMove = () => {} } = {}) {
  const head = model.getObjectByName('mixamorigHead'), neck = model.getObjectByName('mixamorigNeck');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)'), motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let targetYaw = 0, targetPitch = 0, yaw = 0, pitch = 0;
  const enabled = () => Boolean(head && neck) && fine.matches && !motion.matches;
  function aim(event) {
    if (event.pointerType !== 'mouse' || !enabled()) return;
    const rect = anchor.getBoundingClientRect();
    targetYaw = clamp((event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * .4)) * MAX_YAW;
    targetPitch = clamp((event.clientY - (rect.top + rect.height * .3)) / (window.innerHeight * .5)) * MAX_PITCH;
    onMove();
  }
  function center() { targetYaw = targetPitch = 0; onMove(); }
  window.addEventListener('pointermove', aim, { passive: true });
  document.addEventListener('mouseleave', center);
  motion.addEventListener('change', center);
  return {
    // Call after the pose is set for this frame. Returns true while the head is still moving.
    update(delta) {
      if (!head || !neck) return false;
      const ease = 1 - Math.exp(-RESPONSE * delta);
      yaw += (targetYaw - yaw) * ease; pitch += (targetPitch - pitch) * ease;
      if (Math.abs(yaw) + Math.abs(pitch) > .0005) {
        turnInWorld(neck, yaw * (1 - HEAD_SHARE), pitch * (1 - HEAD_SHARE));
        model.updateMatrixWorld(true);
        turnInWorld(head, yaw * HEAD_SHARE, pitch * HEAD_SHARE);
      }
      return Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > .002;
    },
    destroy() {
      window.removeEventListener('pointermove', aim);
      document.removeEventListener('mouseleave', center);
      motion.removeEventListener('change', center);
    },
  };
}
