// The music box up close. Wind its key by dragging round it clockwise (three turns at most; it will not go back the other
// way, it only clicks and springs), or press the arrow keys or Enter for a quarter turn. Let go and the little scene on
// top turns while the tune plays, both slowing as the spring runs down; wind it again whenever you like. The box keeps
// playing if you step away (the scene and cabin-sound.js keep it going).
import { paperLayer, shape } from './paper-art.js';
import { letter } from './cabin-art.js';

const element = (tag, className, parent) => { const node = document.createElement(tag); node.className = className; parent?.append(node); return node; };
// The gold medallion under the little turning scene, with its letter O: it rises while the box plays.
function medallion(parent) {
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; shape('path', { d: `M${50 + Math.cos(a) * 34} ${50 + Math.sin(a) * 34}L${50 + Math.cos(a + .13) * 46} ${50 + Math.sin(a + .13) * 46}L${50 + Math.cos(a + .26) * 34} ${50 + Math.sin(a + .26) * 34}Z`, fill: '#e9c162' }, parent); }
  shape('circle', { cx: 50, cy: 50, r: 34, fill: '#e0b04f' }, parent); shape('circle', { cx: 50, cy: 50, r: 26, fill: '#fff6dc' }, parent);
  letter(parent, 'O', 50, 51, 28, 30, { fill: '#a84a42' });
}
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

export function musicboxGame({ layer, stage, cabin, say, later, sound, onUse = () => {}, knows = () => false, clue = () => {} }) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  say('把音樂盒的發條鑰匙順時針轉幾圈，放手它就會開始轉。');
  const knob = element('button', 'musicbox-knob', layer); knob.type = 'button';
  knob.setAttribute('aria-label', '音樂盒的發條：繞著它順時針拖曳上緊，或按方向鍵右、Enter 轉四分之一圈');
  let turn = null, clicks = 0;
  const gold = element('span', 'musicbox-letter', layer); gold.setAttribute('aria-hidden', 'true');
  paperLayer(gold, '0 0 100 100', '', medallion, { paper: { scale: .35, grain: .4, shadow: .25 }, eager: true });
  function layout() {
    const rects = cabin.musicRects(); if (!rects) return;
    const { key } = rects, size = Math.max(96, key.width * 2.4), x = key.left + key.width / 2, y = key.top + key.height / 2;
    Object.assign(knob.style, { left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px` });
    const { box } = rects, medal = Math.max(44, box.width * .55); Object.assign(gold.style, { left: `${box.left + box.width / 2 - medal / 2}px`, top: `${box.top - medal * .9}px`, width: `${medal}px`, height: `${medal}px` });
  }
  const played = () => (knows() ? '盒蓋內側刻著 N 和 K：尼爾斯和克莉絲。' : '') + (sound.musicOn ? '小紙雕轉起來了。（網站音樂開著時，音樂盒的歌聲會被蓋過；關掉右下角的音樂就聽得到。）' : '叮叮咚咚……小紙雕跟著音樂慢慢轉。');
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
    if (cabin.wound > 0) { sound.tune(() => cabin.wound); say(played()); onUse(); clue('music-lid'); }
  }
  // While it plays, the gold O rises under the turning scene; the first time, it is told and written in the clue book.
  function playing() {
    const up = cabin.wound > 0; gold.classList.toggle('is-up', up);
    if (up && clue('letter-musicbox')) later(2600, () => say('小紙雕轉著轉著，底下升起一個金色的字母：O。'));
    later(500, playing);
  }
  playing();
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
  on(knob, 'pointerup', letGo); on(knob, 'pointercancel', letGo); on(knob, 'lostpointercapture', letGo);
  on(knob, 'keydown', event => {
    if (!['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault(); cabin.holdKey(true); wind(Math.PI / 2);
    clearTimeout(clicks); clicks = setTimeout(release, 700);
  });
  layout(); later(500, layout); later(1200, layout);
  const watch = new ResizeObserver(() => layout()); watch.observe(stage);
  return () => { events.abort(); watch.disconnect(); clearTimeout(clicks); if (turn || cabin.wound > 0) release(); };
}
