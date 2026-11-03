// 所有頁面共用；此模組不會啟動其他頁面的遊戲或計時器。
import { mountForeground } from './components/page-foreground.js';
import { mountNavLights } from './components/nav-lights.js';
import { mountMusic } from './components/music-player.js';
import { mountSantaPlaceholders } from './components/santa-placeholder.js';
import { FAQ } from './data/faq.js';

document.documentElement.classList.add('js-ready');
// Animate only deliberate section-link activation; native manual scrolling stays untouched.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]:not(.skip-link)');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const hash = link.getAttribute('href');
  let target;
  try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
  if (!target) return;
  event.preventDefault();
  if (location.hash !== hash) history.pushState(null, '', hash);
  target.scrollIntoView({
    block: 'start',
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
});
const menuToggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
let navLights = mountNavLights(nav);
window.addEventListener('pagehide', () => navLights.destroy());
window.addEventListener('pageshow', event => { if (event.persisted) navLights = mountNavLights(nav); });

const info = {
  accessibility: ['無障礙與操作', '本網站支援鍵盤 Tab 導覽、Enter 操作按鈕，以及系統的減少動態效果設定。雪橇遊戲開始後可使用上下方向鍵移動、Escape 暫停，也提供畫面按鈕。若有閱讀需求，可透過瀏覽器調整文字大小。'],
  faq: ['常見問題', FAQ],
  contact: ['Contact us', '聯絡方式與社群連結尚待網站作者提供。這裡已保留入口，之後可替換為正式電子郵件與社群網址。'],
};
const infoDialog = document.querySelector('#info-dialog');
const infoContent = document.querySelector('#info-content');
// FAQ 以問答清單呈現；關閉時收回，其他說明（含 Intro 自訂的）沿用單段文字。
const faqList = document.createElement('dl');
faqList.className = 'faq-list';
faqList.hidden = true;
infoContent.after(faqList);
infoDialog.addEventListener('close', () => { faqList.hidden = true; infoContent.hidden = false; });
document.querySelectorAll('[data-info]').forEach(button => {
  button.addEventListener('click', () => {
    const [title, content] = info[button.dataset.info];
    document.querySelector('#info-title').textContent = title;
    const isList = Array.isArray(content);
    infoContent.hidden = isList; faqList.hidden = !isList;
    if (isList) {
      faqList.replaceChildren(...content.flatMap(([question, answer]) => {
        const term = document.createElement('dt'), detail = document.createElement('dd');
        term.textContent = question; detail.textContent = answer;
        return [term, detail];
      }));
    } else infoContent.textContent = content;
    infoDialog.showModal();
  });
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

let music = mountMusic();
window.addEventListener('pagehide', () => music.destroy());
window.addEventListener('pageshow', event => { if (event.persisted) music = mountMusic(); });

mountForeground(document.querySelector('.page-foreground'));
mountSantaPlaceholders();
