// The music box up close. Wind its key by dragging round it clockwise (three turns at most; it will not go back the other
// way, it only clicks and springs), or press the arrow keys or Enter for a quarter turn. Let go and the little scene on
// top turns while the tune plays, both slowing as the spring runs down; wind it again whenever you like. The box keeps
// playing if you step away (the scene and cabin-sound.js keep it going).
const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

export function musicboxGame({ layer, stage, cabin, say, later, sound, onUse = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  say('把音樂盒的發條鑰匙順時針轉幾圈，放手它就會開始轉。');
  const knob = element('button', 'musicbox-knob', layer); knob.type = 'button';
  knob.setAttribute('aria-label', '音樂盒的發條：繞著它順時針拖曳上緊，或按方向鍵右、Enter 轉四分之一圈');
  let turn = null, clicks = 0;
  function layout() {
    const rects = cabin.musicRects(); if (!rects) return;
    const { key } = rects, size = Math.max(96, key.width * 2.4), x = key.left + key.width / 2, y = key.top + key.height / 2;
    Object.assign(knob.style, { left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px` });
  }
  const played = () => sound.musicOn ? '小紙雕轉起來了。（網站音樂開著時，音樂盒的歌聲會被蓋過；關掉右下角的音樂就聽得到。）' : '叮叮咚咚……小紙雕跟著音樂慢慢轉。';
  // Each 30° of winding clicks the ratchet once.
  function wind(angle) {
    const before = cabin.wound, after = cabin.wind(angle);
    const steps = Math.floor(after * 36) - Math.floor(before * 36);
    for (let i = 0; i < Math.min(3, steps); i++) later(i * 40, () => sound.tick());
    if (after >= 1 && before < 1) say('發條上滿了，放手吧。');
    return after;
  }
  function release() {
    cabin.holdKey(false);
    if (cabin.wound > 0) { sound.tune(() => cabin.wound); say(played()); onUse(); }
  }
  on(knob, 'pointerdown', event => {
    if (event.button > 0) return;
    event.preventDefault(); knob.setPointerCapture(event.pointerId); cabin.holdKey(true); knob.classList.add('is-winding');
    const box = knob.getBoundingClientRect();
    turn = { id: event.pointerId, cx: box.left + box.width / 2, cy: box.top + box.height / 2 };
    turn.last = Math.atan2(event.clientY - turn.cy, event.clientX - turn.cx);
  });
  on(knob, 'pointermove', event => {
    if (!turn || event.pointerId !== turn.id) return;
    const angle = Math.atan2(event.clientY - turn.cy, event.clientX - turn.cx), delta = wrap(angle - turn.last); turn.last = angle;
    // Clockwise on screen is a growing angle (y points down). The other way the ratchet holds: a little spring back.
    if (delta > 0) wind(delta);
    else if (delta < -.05) { knob.classList.remove('is-resisting'); void knob.offsetWidth; knob.classList.add('is-resisting'); }
  });
  const letGo = event => { if (!turn || event.pointerId !== turn.id) return; turn = null; knob.classList.remove('is-winding'); release(); };
  on(knob, 'pointerup', letGo); on(knob, 'pointercancel', letGo);
  on(knob, 'keydown', event => {
    if (!['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault(); cabin.holdKey(true); wind(Math.PI / 2);
    clearTimeout(clicks); clicks = setTimeout(release, 700);
  });
  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); clearTimeout(clicks); if (turn || cabin.wound > 0) release(); };
}
