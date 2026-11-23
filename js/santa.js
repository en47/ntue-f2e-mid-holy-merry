import { mountCabinBackdrop } from './components/cabin-backdrop.js';
import { mountCabinPaper } from './components/cabin-paper.js';
import { mountCabinChat } from './components/cabin-chat.js';
import { paperLayer, shape } from './components/paper-art.js';
import { star } from './components/paper-props.js';

// The cabin loads on its own: the page, title and footer work even when WebGL or the model does not.
const stage = document.querySelector('#cabin-stage'), status = document.querySelector('#cabin-status'), away = document.querySelector('#cabin-away');
const back = document.querySelector('#cabin-back'), tip = document.querySelector('#cabin-tip'), explore = [...document.querySelectorAll('.cabin-explore [data-spot]')], looks = [...document.querySelectorAll('.cabin-explore [data-look]')];
const SPOTS = ['mailbox', 'reindeer', 'snowman', 'stable'], ROOMS = ['hearth', 'desk', 'musicbox', 'globe', 'shelf', 'secret', 'advent'], FOUND = 'holy-merry:cabin:found', TIP = 'holy-merry:cabin:tip';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
// The flight down over the village is for a large desktop window; a phone, a tablet or a small window starts at the house.
const roomy = matchMedia('(min-width: 1100px) and (min-height: 650px) and (hover: hover) and (pointer: fine)');
// A phone held sideways: the cabin is as tall as the screen (css/santa.css), so opening a corner or the room scrolls it fully
// into view, with the trays down its right side.
const sideways = matchMedia('(orientation: landscape) and (max-height: 500px)'), cabinBox = stage.closest('.cabin');
function fitSideways() {
  const box = cabinBox.getBoundingClientRect();
  if (sideways.matches && (box.top < -1 || box.bottom > innerHeight + 1)) cabinBox.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
}
mountCabinBackdrop(document.querySelector('.cabin-backdrop'));
mountCabinPaper(document.querySelector('.cabin'));
// Talking with Santa in the room: his portrait in the corner, and the card his preset lines open in (cabin-chat.js).
const chat = mountCabinChat(stage, { onOpen: () => play?.chat(), onNote: () => play?.chairNote() });

// Corners already found stay found on this browser (a convenience: an empty store just starts over).
// Ids no longer in the yard (the elf that used to sit in a fir) are dropped.
let found = new Set(); try { found = new Set((JSON.parse(localStorage.getItem(FOUND)) || []).filter(id => SPOTS.includes(id))); } catch { /* start fresh */ }
let cabin = null, play = null, generation = 0, enterTimer = 0;
const progress = value => { stage.dataset.progress = String(Math.round(value * 100)); };
const markExplore = () => explore.forEach(button => button.classList.toggle('is-found', found.has(button.dataset.spot)));

function onFound(id) {
  if (found.has(id)) return;
  found.add(id); try { localStorage.setItem(FOUND, JSON.stringify([...found])); } catch { /* still lit for this visit */ }
  cabin?.repaint('sign', { stars: found.size }); markExplore();
  status.textContent = found.size === SPOTS.length ? '招牌上的星星全亮了！院子裡的秘密你全找到了。' : `發現了一個角落（${found.size}/${SPOTS.length}），招牌上又亮了一顆星。`;
}
function onView(view) {
  if (view !== 'outside') { tip.classList.add('is-gone'); welcome?.stop(); fitSideways(); }
  back.hidden = view === 'outside'; back.textContent = view === 'inside' ? '← 走出門外' : ROOMS.includes(view) ? '← 回到房間' : '← 回到小屋前'; clearTimeout(enterTimer); play?.leave();
  // The window sill is turned toward and walked up to more slowly (cabin-scene.js `glide`): its box opens as the walk ends.
  if (SPOTS.includes(view) || ROOMS.includes(view)) enterTimer = setTimeout(() => play?.enter(view), motion.matches ? 0 : view === 'advent' ? 1600 : 1000);
  if (view === 'inside') play?.inRoom();
  if (view === 'outside') { play?.outside(); chat.setAway(Boolean(cabin && !cabin.santaHome)); }
  if (view === 'outside' && touchOutside) { const id = touchOutside; touchOutside = ''; setTimeout(() => cabin?.touch(id), motion.matches ? 0 : 1200); }
  if (view === 'inside') status.textContent = '推開門走進屋裡：聖誕老人坐在火爐邊。拖曳可以環顧整個房間，點門口就能出去。';
  if (view === 'hearth') status.textContent = '走到壁爐前：可以從柴籃添柴，也可以壓一壓風箱。';
  if (view === 'desk') status.textContent = '走到書桌前：可以抽一封信來讀，也可以蓋郵戳、封火漆。';
  if (view === 'musicbox') status.textContent = '走到音樂盒前：轉幾圈發條，它就會叮叮咚咚地轉起來。';
  if (view === 'globe') status.textContent = '拿起爐台上的雪花球：左右搖一搖，看雪花慢慢落下。';
  if (view === 'secret') status.textContent = '走進書櫃後的小房間：牆上掛著名牌，桌上擺著一本小冊子。';
  if (view === 'shelf') status.textContent = '走到書櫃前，看看架上的書。';
  if (view === 'advent') status.textContent = '走到窗前：窗台上的降臨小屋打開了，十二月每天可以開一扇門。';
  if (view === 'outside') status.textContent = '回到屋外。往左轉是遊樂場和許願角，往右轉是海邊和燈塔，雪山在小屋後面。';
}
back.addEventListener('click', () => cabin?.back());
explore.forEach(button => button.addEventListener('click', () => { cabin?.setView(button.dataset.spot); back.focus(); }));
looks.forEach(button => button.addEventListener('click', () => { cabin?.look(button.dataset.look); stage.querySelector('.cabin-gesture').focus(); }));
// The world signpost (the way home) from the list too: in the yard it is read at once; from anywhere else, once back out.
let touchOutside = '';
document.querySelectorAll('.cabin-explore [data-touch]').forEach(button => button.addEventListener('click', () => { if (!cabin) return; if (cabin.view === 'outside') cabin.touch(button.dataset.touch); else { touchOutside = button.dataset.touch; cabin.setView('outside'); } }));
// Escape steps back once (from the hearth to the room, from the room out of the door); the scene may have taken it already.
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.defaultPrevented && cabin && cabin.view !== 'outside') { cabin.back(); stage.querySelector('.cabin-gesture').focus(); } });
markExplore();

// A one-time hint. On a first visit, before the mailbox has been opened, the visitor is welcomed instead (`welcomeIn`);
// afterwards it says how to look around, gone after the first touch of the scene.
function showTip() {
  let seen = false; try { seen = sessionStorage.getItem(TIP) === '1'; sessionStorage.setItem(TIP, '1'); } catch { /* show it anyway */ }
  if (seen) return;
  if (!found.has('mailbox')) { welcomeIn(); return; }
  tip.hidden = false;
  const hide = () => tip.classList.add('is-gone');
  stage.addEventListener('pointerdown', hide, { once: true }); setTimeout(hide, 8000);
}
// The welcome: a red paper ribbon across the top of the village with a tag hung under it saying what to do first, and a
// little envelope bobbing over the mailbox to point it out (pressed, it opens the mailbox). Both stay until the visitor
// goes to the mailbox (or anywhere else), the envelope following the mailbox as the view turns, hidden when it is out
// of sight.
const el = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent.append(node); return node; };
const PAPER = { paper: { scale: .3, grain: .45, shadow: .3 }, eager: true };
// The ribbon: a red band, its two ends folded back behind it and notched.
function ribbon(g) {
  for (const side of [v => v, v => 420 - v]) {
    shape('path', { d: `M${side(4)} 38H${side(62)}V84H${side(4)}L${side(20)} 61Z`, fill: '#8f3530' }, g);
    shape('path', { d: `M${side(50)} 72L${side(62)} 84V72Z`, fill: '#6b2724' }, g);
  }
  shape('path', { d: 'M50 18H370V72H50Z', fill: '#b5443c' }, g);
  shape('path', { d: 'M58 25H362M58 65H362', fill: 'none', stroke: '#e9a8a0', 'stroke-width': 1.4, opacity: .7 }, g);
}
// The envelope over the mailbox: cream, its flap folded down, a red wax seal and a gold glint.
function envelope(g) {
  shape('rect', { x: 4, y: 12, width: 56, height: 36, rx: 3, fill: '#fbf3df' }, g);
  shape('path', { d: 'M5 47L25 30M59 47L39 30', fill: 'none', stroke: '#e0cfa8', 'stroke-width': 1.6 }, g);
  shape('path', { d: 'M5 14L32 34 59 14', fill: 'none', stroke: '#c9a46a', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
  shape('circle', { cx: 32, cy: 33, r: 6, fill: '#b5443c' }, g);
  star(g, 55, 8, 7, '#e0b04f');
}
let welcome = null;
function welcomeIn() {
  const sign = el('div', 'cabin-welcome', stage), banner = el('div', 'welcome-banner', sign);
  paperLayer(banner, '0 0 420 92', 'welcome-ribbon', ribbon, PAPER);
  el('span', 'welcome-title', banner, '歡迎來到聖誕小村');
  el('p', 'welcome-note', sign, '聖誕老人在郵筒裡留了一封信，點郵筒打開看看');
  const marker = el('button', 'mail-marker', stage); marker.type = 'button'; marker.hidden = true; marker.setAttribute('aria-label', '打開郵筒');
  paperLayer(marker, '0 0 64 52', '', envelope, PAPER);
  marker.addEventListener('click', () => cabin?.setView('mailbox'));
  let frame = 0;
  const follow = () => {
    const box = stage.dataset.view === 'outside' ? cabin?.sheetRect('mailbox', [.3, .15, .7, .15]) : null;
    const shown = Boolean(box && box.left + box.width > 0 && box.left < stage.clientWidth && box.top > 0 && box.top < stage.clientHeight);
    marker.hidden = !shown; if (shown) Object.assign(marker.style, { left: `${box.left + box.width / 2}px`, top: `${box.top}px` });
    frame = requestAnimationFrame(follow);
  };
  follow();
  welcome = { stop() { cancelAnimationFrame(frame); marker.remove(); sign.classList.add('is-gone'); setTimeout(() => sign.remove(), 700); welcome = null; } };
}

// The first visit opens with a flight down over the village, once the loader has faded; a page back from the cache does not.
// Santa's own model comes just after the page opens (he is indoors, out of sight): the note on his chair waits until it is
// known that he cannot come.
async function mountCabin(fly = true) {
  const run = ++generation;
  stage.dataset.state = 'loading'; stage.setAttribute('aria-busy', 'true'); progress(0);
  status.textContent = '小屋準備中……'; away.hidden = true;
  try {
    const [{ mountCabin: build }, { mountPlay }] = await Promise.all([import('./components/cabin-scene.js'), import('./components/cabin-play.js')]);
    if (run !== generation) return;
    const result = await build(stage, { onProgress: progress, onView, onTouch: (id, note) => { if (id === 'wheel' && play?.wheelOpen) play.enter('wheel'); else if (id === 'world-sign') play?.signpost(note); else if (id === 'santa') play?.chat(); else if (id === 'sleigh' && play?.canLoad) play.loadSleigh(); else if (id === 'window') cabin?.setView('advent'); else if (note) play?.note(note, id); }, isCurrent: () => run === generation, fly: fly && roomy.matches });
    if (!result || run !== generation) { result?.destroy(); return; }
    cabin = result; play = mountPlay(stage, cabin, { onFound, announce: text => { status.textContent = text; }, onSanta: state => { if (state === 'away' || state === 'home') chat.setAway(state === 'away'); }, talk: chat });
    if (found.size) cabin.repaint('sign', { stars: found.size });
    play.restore([...found]);
    stage.dataset.state = 'ready'; stage.dataset.santa = 'home'; progress(1);
    const arrive = () => cabin?.arrive().then(() => { showTip(); play?.arrived(); });
    if (document.documentElement.classList.contains('is-loading')) addEventListener('site-loader:done', arrive, { once: true }); else arrive();
    const welcome = status.textContent = '聖誕老人在屋裡烤火。點小屋就能推門進去，也可以左右轉轉，看看整座村子。';
    result.santa.then(home => {
      if (home || run !== generation) return;
      stage.dataset.santa = 'away'; away.hidden = false;
      if (status.textContent === welcome) status.textContent = '聖誕老人去餵麋鹿了，搖椅上留了一張紙條。';
    });
  } catch (error) {
    if (run !== generation) return;
    console.error('Santa cabin failed to load', error);
    stage.dataset.state = 'error'; progress(1);
    status.textContent = '這個瀏覽器無法顯示 3D 小屋，請改用其他瀏覽器再試一次。';
  } finally {
    if (run === generation) stage.setAttribute('aria-busy', 'false');
  }
}
window.addEventListener('pagehide', () => { generation++; clearTimeout(enterTimer); welcome?.stop(); play?.destroy(); play = null; cabin?.destroy(); cabin = null; });
window.addEventListener('pageshow', event => { if (event.persisted) mountCabin(false); });
mountCabin();
