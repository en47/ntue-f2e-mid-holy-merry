import { mountTitleArt } from './components/title-art.js';
import { mountCabinBackdrop } from './components/cabin-backdrop.js';

// The cabin loads on its own: the page, title and footer work even when WebGL or the model does not.
const stage = document.querySelector('#cabin-stage'), status = document.querySelector('#cabin-status'), away = document.querySelector('#cabin-away');
const enter = document.querySelector('#cabin-enter'), leave = document.querySelector('#cabin-leave'), hint = document.querySelector('#cabin-hint-text');
mountTitleArt(document.querySelector('#cabin-title'), 'santas-cabin');
mountCabinBackdrop(document.querySelector('.cabin-backdrop'));
// Outside sees the whole house; inside moves up to Santa. The buttons are the keyboard and screen-reader way in and out.
function showView(view) {
  enter.hidden = view === 'inside'; leave.hidden = view !== 'inside';
  hint.textContent = view === 'inside' ? '拖曳看看屋裡四周，放開會轉回聖誕老人' : '拖曳轉轉小屋，點聖誕老人進屋';
  status.textContent = view === 'inside' ? '走進屋裡了：聖誕老人就坐在你面前。' : '回到屋外，看得到整棟小屋。';
}
enter.addEventListener('click', () => { cabin?.setView('inside'); leave.focus(); });
leave.addEventListener('click', () => { cabin?.setView('outside'); enter.focus(); });

let cabin = null, generation = 0;
// The loader's queue walks forward as this number grows (0–100).
const progress = value => { stage.dataset.progress = String(Math.round(value * 100)); };
async function mountCabin() {
  const run = ++generation;
  stage.dataset.state = 'loading'; stage.setAttribute('aria-busy', 'true'); progress(0);
  status.textContent = '小屋準備中……'; away.hidden = true;
  try {
    const { mountCabin: build } = await import('./components/cabin-scene.js');
    if (run !== generation) return;
    const result = await build(stage, { onProgress: progress, onView: showView, isCurrent: () => run === generation });
    if (!result || run !== generation) { result?.destroy(); return; }
    cabin = result;
    stage.dataset.state = 'ready'; stage.dataset.santa = result.santa ? 'home' : 'away';
    away.hidden = result.santa; progress(1);
    status.textContent = result.santa ? '聖誕老人正坐在搖椅上。' : '聖誕老人去餵麋鹿了，搖椅上留了一張紙條。';
  } catch (error) {
    if (run !== generation) return;
    console.error('Santa cabin failed to load', error);
    stage.dataset.state = 'error'; progress(1);
    status.textContent = '這個瀏覽器無法顯示 3D 小屋，請改用其他瀏覽器再試一次。';
  } finally {
    if (run === generation) stage.setAttribute('aria-busy', 'false');
  }
}
window.addEventListener('pagehide', () => { generation++; cabin?.destroy(); cabin = null; });
window.addEventListener('pageshow', event => { if (event.persisted) mountCabin(); });
mountCabin();
