// 所有頁面共用；此模組不會啟動其他頁面的遊戲或計時器。
document.documentElement.classList.add('js-ready');
const menuToggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});

const info = {
  accessibility: ['無障礙與操作', '本網站支援鍵盤 Tab 導覽、Enter 操作按鈕，以及系統的減少動態效果設定。雪橇遊戲開始後可使用上下方向鍵移動、Escape 暫停，也提供畫面按鈕。若有閱讀需求，可透過瀏覽器調整文字大小。'],
  faq: ['常見問題', '願望會公開嗎？不會，願望僅存於目前瀏覽器的 localStorage。清除網站資料、使用不同瀏覽器或變更網站來源（包含連接埠），都可能看不到原本的願望。角色、地圖及音樂目前為素材預留區，之後會替換成自訂手繪作品。'],
  contact: ['Contact us', '聯絡方式與社群連結尚待網站作者提供。這裡已保留入口，之後可替換為正式電子郵件與社群網址。'],
};
const infoDialog = document.querySelector('#info-dialog');
document.querySelectorAll('[data-info]').forEach(button => {
  button.addEventListener('click', () => {
    const [title, content] = info[button.dataset.info];
    document.querySelector('#info-title').textContent = title;
    document.querySelector('#info-content').textContent = content;
    infoDialog.showModal();
  });
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

// 將正式音檔放進 assets/audio 後，在這裡填入相對路徑。
// 不呼叫 autoplay；跨頁不自動恢復播放。
const MUSIC_SOURCE = '';
const audio = document.querySelector('#site-audio');
const musicToggle = document.querySelector('#music-toggle');
const musicPanel = document.querySelector('#music-panel');
const musicPlay = document.querySelector('#music-play');
const musicStatus = document.querySelector('#music-status');
const volume = document.querySelector('#music-volume');
let objectURL = null;
audio.volume = Number(volume.value);
if (MUSIC_SOURCE) {
  audio.src = MUSIC_SOURCE;
  musicPlay.disabled = false;
  musicStatus.textContent = '按下播放，讓音樂陪你過聖誕。';
}
musicToggle.addEventListener('click', () => {
  musicPanel.hidden = !musicPanel.hidden;
  musicToggle.setAttribute('aria-expanded', String(!musicPanel.hidden));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !musicPanel.hidden) {
    musicPanel.hidden = true;
    musicToggle.setAttribute('aria-expanded', 'false');
    musicToggle.focus();
  }
});
volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
document.querySelector('#music-file').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  audio.pause();
  if (objectURL) URL.revokeObjectURL(objectURL);
  objectURL = URL.createObjectURL(file);
  audio.src = objectURL;
  musicPlay.disabled = false;
  musicStatus.textContent = `已選擇：${file.name}。按播放開始。`;
});
musicPlay.addEventListener('click', async () => {
  if (!audio.paused) { audio.pause(); return; }
  try { await audio.play(); } catch {
    musicStatus.textContent = '無法播放這個音檔，請選擇瀏覽器支援的 MP3、WAV 或 OGG。';
  }
});
audio.addEventListener('play', () => {
  musicPlay.textContent = '暫停';
  musicToggle.setAttribute('aria-label', '音樂播放中，開啟音樂控制');
  musicStatus.textContent = '音樂播放中。';
});
audio.addEventListener('pause', () => {
  musicPlay.textContent = '播放';
  musicToggle.setAttribute('aria-label', '開啟音樂控制');
  if (audio.src) musicStatus.textContent = '音樂已暫停。';
});
audio.addEventListener('error', () => {
  musicStatus.textContent = '音檔無法載入，請確認檔案格式或替換音檔。';
});
window.addEventListener('pagehide', event => {
  audio.pause();
  if (objectURL && !event.persisted) URL.revokeObjectURL(objectURL);
});
