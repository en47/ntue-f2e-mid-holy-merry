export function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function returnAngle(angle, delta, reducedMotion = false) {
  if (reducedMotion) return 0;
  const next = wrapAngle(angle) * Math.exp(-2.4 * Math.max(0, delta));
  return Math.abs(next) < .001 ? 0 : next;
}

// 觸控只在橫向意圖明確時旋轉，直向手勢交回瀏覽器捲動。
export function gestureIntent(dx, dy, pointerType = 'mouse') {
  if (Math.hypot(dx, dy) < 8) return 'pending';
  if (pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.15) return 'scroll';
  return 'rotate';
}

export function chooseAnimation(clips) {
  return clips.find(clip => /idle|stand|breath/i.test(clip.name))
    ?? clips.find(clip => /dance/i.test(clip.name))
    ?? clips.find(clip => /walk/i.test(clip.name))
    ?? clips[0] ?? null;
}

export function fitViewHeight(height, radius, aspect, pitch = .075) {
  // 上方保留鹿角／帽子，地面固定在畫面約 88% 處；XZ 包絡可容納 360°。
  return Math.max(2.8,
    (height * Math.cos(pitch) + 2 * radius * Math.sin(pitch)) / .79,
    2 * radius / Math.max(.1, aspect) / .88);
}
