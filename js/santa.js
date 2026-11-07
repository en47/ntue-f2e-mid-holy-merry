import { mountCabinBackdrop } from './components/cabin-backdrop.js';

// The cabin loads on its own: the page, title and footer work even when WebGL or the model does not.
const stage = document.querySelector('#cabin-stage'), status = document.querySelector('#cabin-status'), away = document.querySelector('#cabin-away');
const back = document.querySelector('#cabin-back'), tip = document.querySelector('#cabin-tip'), explore = [...document.querySelectorAll('.cabin-explore [data-spot]')], looks = [...document.querySelectorAll('.cabin-explore [data-look]')];
const SPOTS = ['mailbox', 'reindeer', 'snowman', 'stable'], FOUND = 'holy-merry:cabin:found', TIP = 'holy-merry:cabin:tip';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
mountCabinBackdrop(document.querySelector('.cabin-backdrop'));

// Corners already found stay found on this browser (a convenience: an empty store just starts over).
// Ids no longer in the yard (the elf that used to sit in a fir) are dropped.
let found = new Set(); try { found = new Set((JSON.parse(localStorage.getItem(FOUND)) || []).filter(id => SPOTS.includes(id))); } catch { /* start fresh */ }
let cabin = null, play = null, generation = 0, enterTimer = 0;
const progress = value => { stage.dataset.progress = String(Math.round(value * 100)); };
const markExplore = () => explore.forEach(button => button.classList.toggle('is-found', found.has(button.dataset.spot)));

function onFound(id) {
  if (found.has(id)) return;
  found.add(id); try { localStorage.setItem(FOUND, JSON.stringify([...found])); } catch { /* still lit for this visit */ }
  cabin?.setFound([...found]); cabin?.repaint('sign', { stars: found.size }); markExplore();
  status.textContent = found.size === SPOTS.length ? '招牌上的星星全亮了！院子裡的秘密你全找到了。' : `發現了一個角落（${found.size}/${SPOTS.length}），招牌上又亮了一顆星。`;
}
function onView(view) {
  back.hidden = view === 'outside'; back.textContent = view === 'inside' ? '← 走出門外' : '← 回到小屋前'; clearTimeout(enterTimer); play?.leave();
  if (SPOTS.includes(view)) enterTimer = setTimeout(() => play?.enter(view), motion.matches ? 0 : 1000);
  if (view === 'inside') status.textContent = '推開門走進屋裡：聖誕老人坐在火爐邊。拖曳可以環顧整個房間，點門口就能出去。';
  if (view === 'outside') status.textContent = '回到屋外。往左轉是遊樂場和許願角，往右轉是海邊和燈塔，雪山在小屋後面。';
}
back.addEventListener('click', () => cabin?.setView('outside'));
explore.forEach(button => button.addEventListener('click', () => { cabin?.setView(button.dataset.spot); back.focus(); }));
looks.forEach(button => button.addEventListener('click', () => { cabin?.look(button.dataset.look); stage.querySelector('.cabin-gesture').focus(); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && cabin && cabin.view !== 'outside') { cabin.setView('outside'); stage.querySelector('.cabin-gesture').focus(); } });
markExplore();

// A one-time hint, gone after the first touch of the scene.
function showTip() {
  let seen = false; try { seen = sessionStorage.getItem(TIP) === '1'; sessionStorage.setItem(TIP, '1'); } catch { /* show it anyway */ }
  if (seen) return;
  tip.hidden = false;
  const hide = () => tip.classList.add('is-gone');
  stage.addEventListener('pointerdown', hide, { once: true }); setTimeout(hide, 8000);
}

async function mountCabin() {
  const run = ++generation;
  stage.dataset.state = 'loading'; stage.setAttribute('aria-busy', 'true'); progress(0);
  status.textContent = '小屋準備中……'; away.hidden = true;
  try {
    const [{ mountCabin: build }, { mountPlay }] = await Promise.all([import('./components/cabin-scene.js'), import('./components/cabin-play.js')]);
    if (run !== generation) return;
    const result = await build(stage, { onProgress: progress, onView, onTouch: (id, note) => { if (note) play?.note(note); }, isCurrent: () => run === generation });
    if (!result || run !== generation) { result?.destroy(); return; }
    cabin = result; play = mountPlay(stage, cabin, { onFound, announce: text => { status.textContent = text; } });
    cabin.setFound([...found]);
    if (found.size) { cabin.repaint('sign', { stars: found.size }); play.restore([...found]); }
    stage.dataset.state = 'ready'; stage.dataset.santa = result.santa ? 'home' : 'away';
    away.hidden = result.santa; progress(1); showTip();
    status.textContent = result.santa ? '聖誕老人在屋裡烤火。點小屋就能推門進去，也可以左右轉轉，看看整座村子。' : '聖誕老人去餵麋鹿了，搖椅上留了一張紙條。';
  } catch (error) {
    if (run !== generation) return;
    console.error('Santa cabin failed to load', error);
    stage.dataset.state = 'error'; progress(1);
    status.textContent = '這個瀏覽器無法顯示 3D 小屋，請改用其他瀏覽器再試一次。';
  } finally {
    if (run === generation) stage.setAttribute('aria-busy', 'false');
  }
}
window.addEventListener('pagehide', () => { generation++; clearTimeout(enterTimer); play?.destroy(); play = null; cabin?.destroy(); cabin = null; });
window.addEventListener('pageshow', event => { if (event.persisted) mountCabin(); });
mountCabin();
