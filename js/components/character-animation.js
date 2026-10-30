import * as THREE from 'three';

// 直接以秒裁切，並在兩端取原插值器的值。subclip 的 endFrame 為排除端點，
// 此處保留原檔 1.000 與 4.000 秒，避免少一幀或把常數 STEP 軌跡裁掉。
export function sliceSantaDance(clips, start = 1, end = 4) {
  const original = clips.find(clip => /dance/i.test(clip.name)) ?? clips[0];
  if (!original || original.duration < end) throw new Error('Santa GLB 缺少涵蓋 1–4 秒的原始動畫。');
  const tracks = original.tracks.map(source => {
    const times = [start, ...Array.from(source.times).filter(t => t > start && t < end), end];
    const interpolant = source.createInterpolant();
    const values = times.flatMap(time => Array.from(interpolant.evaluate(time)));
    const track = source.clone();
    track.times = new source.times.constructor(times.map(time => time - start));
    track.values = new source.values.constructor(values);
    return track;
  });
  const intervals = original.tracks.flatMap(track => Array.from(track.times).slice(1).map((t, i) => t - track.times[i])).filter(n => n > .001 && n < .2).sort((a,b) => a-b);
  const fps = intervals.length ? Math.round(1 / intervals[Math.floor(intervals.length / 2)]) : null;
  const clip = new THREE.AnimationClip(`${original.name}:1–4s`, end - start, tracks);
  clip.userData = { source: original.name, start, end, sourceFPS: fps, startFrame: fps && start * fps, endFrame: fps && end * fps };
  return clip;
}

// 原第 4 秒與第 1 秒不是同一姿勢。只混合選定區間的端點，不補新關鍵影格。
// 設為 0 可檢視完全未混合的原始三秒循環；週期仍為三秒。
export function softenSantaLoop(mixer, action, clip, seconds = .18) {
  const endClip = clip.clone(); endClip.name = `${clip.name}:endpoint`;
  const endpoint = mixer.clipAction(endClip).setLoop(THREE.LoopOnce, 1);
  endpoint.clampWhenFinished = true; endpoint.play(); endpoint.paused = true;
  endpoint.time = clip.duration; endpoint.setEffectiveWeight(0);
  let elapsed = seconds;
  const loop = event => { if (event.action === action) elapsed = 0; };
  mixer.addEventListener('loop', loop);
  return {
    update(delta) {
      mixer.update(delta);
      if (elapsed < seconds) {
        elapsed = Math.min(seconds, elapsed + delta);
        const t = seconds > 0 ? elapsed / seconds : 1;
        const weight = t * t * (3 - 2 * t);
        action.setEffectiveWeight(weight); endpoint.setEffectiveWeight(1 - weight);
        mixer.update(0);
      }
    },
    destroy() { mixer.removeEventListener('loop', loop); endpoint.stop(); mixer.uncacheClip(endClip); },
  };
}

// GLTFLoader 會清除骨名內的「:」，以正規化名稱辨識實際綁定骨架。
const boneName = name => name.replace(/[^a-zA-Z0-9_]/g, '');
export function createReindeerDance(model) {
  model.updateMatrixWorld(true);
  model.traverse(node => { if (node.isSkinnedMesh) node.skeleton.pose(); });
  model.updateMatrixWorld(true);
  const bones = [];
  model.traverse(node => { if (node.isBone) bones.push(node); });
  const find = name => bones.find(bone => boneName(bone.name) === name);
  const fronts = ['Left', 'Right'].map(side => [0,1,2,3].map(i => find(`tripo0_${side}_Limb_${i}`)));
  const hinds = ['Left', 'Right'].map(side => find(`tripo1_${side}_Limb_3`));
  const spine = find('tripoSpine_1'), head = find('tripoHead_0'), root = find('tripoRoot');
  if (!fronts.flat().every(Boolean) || !hinds.every(Boolean) || !spine || !head || !root) {
    return { clip: null, rig: '無法可靠辨識四肢骨架，暫用整體輕微搖擺。' };
  }
  const duration = 4, times = Array.from({length:97}, (_, i) => i / 24), tracks = [];
  const pulse = (t, from, to) => t > from && t < to ? Math.sin(Math.PI * (t - from) / (to - from)) ** 2 : 0;
  const rotation = (bone, axis, value) => {
    const localAxis = axis.clone().applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert());
    const rest = bone.quaternion.clone();
    const values = times.flatMap(t => rest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(localAxis, value(t))).toArray());
    tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`, times, values));
  };
  fronts.forEach((leg, i) => leg.slice(0,3).forEach((bone, joint) => {
    const angles = [.10, -.35, .20];
    rotation(bone, new THREE.Vector3(1,0,0), t => angles[joint] * pulse(t, i ? 1.85 : .3, i ? 3.05 : 1.5));
  }));
  // 只搖動前半身，後腿不加入步行軌跡；原地小跳安排在兩次抬腿之後。
  const sway = t => .075 * Math.sin(t / duration * Math.PI * 2);
  rotation(spine, new THREE.Vector3(0,0,1), sway);
  rotation(head, new THREE.Vector3(1,0,0), t => .06 * Math.sin(t / duration * Math.PI * 4));
  // 前半身左右擺動時補償支撐點，後腿不受 Spine_1 影響。
  // 以兩隻前蹄的綁定位置求平均水平位移、最低垂直位移，避免整隻原地滑行。
  const pivot = spine.getWorldPosition(new THREE.Vector3());
  const offsets = fronts.map(leg => leg[3].getWorldPosition(new THREE.Vector3()).sub(pivot));
  const inverseParent = spine.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const spineRest = spine.position.clone();
  const zAxis = new THREE.Vector3(0,0,1);
  tracks.push(new THREE.VectorKeyframeTrack(`${spine.uuid}.position`, times, times.flatMap(t => {
    const turn = new THREE.Quaternion().setFromAxisAngle(zAxis, sway(t));
    const displacements = offsets.map(offset => offset.clone().applyQuaternion(turn).sub(offset));
    const correction = new THREE.Vector3(
      -(displacements[0].x + displacements[1].x) / 2,
      -Math.min(displacements[0].y, displacements[1].y),
      -(displacements[0].z + displacements[1].z) / 2,
    ).applyQuaternion(inverseParent);
    return spineRest.clone().add(correction).toArray();
  })));
  const rest = root.position.clone();
  const up = new THREE.Vector3(0,1,0).applyQuaternion(root.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
  tracks.push(new THREE.VectorKeyframeTrack(`${root.uuid}.position`, times,
    times.flatMap(t => rest.clone().addScaledVector(up, .008 * pulse(t, 3.2, 3.9)).toArray())));
  const clip = new THREE.AnimationClip('storybook:reindeer-dance', duration, tracks);
  clip.userData = { custom: true, frontLegs: fronts.map(leg => leg.map(b => b.name)), hindFeet: hinds.map(b => b.name), maxJointAngles: [.10,-.35,.20], bounce: .008, swayRadians: .075, headNodRadians: .06, plantedFrontCompensation: true };
  return { clip, rig: '四肢及頭頸骨架可用：交替抬前腿、輕搖、點頭與原地小跳。' };
}
