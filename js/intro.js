import { mountIntroBook } from './components/intro-book.js';
import { mountIntroPostcards } from './components/intro-postcards.js';
// The Header is static: include its measured height in the first snap target only.
const main=document.querySelector('.intro-main');
const measureHeader=()=>main.style.setProperty('--intro-header-height',`${document.querySelector('.site-header').getBoundingClientRect().height}px`);
measureHeader();
const headerSize=new ResizeObserver(measureHeader);headerSize.observe(document.querySelector('.site-header'));
const book=mountIntroBook(document.querySelector('#intro-storybook'));
const postcards=mountIntroPostcards(document.querySelector('.intro-main'));
// Localized, up-to-date Intro help without changing other pages' shared module.
const info={accessibility:['無障礙與操作','可用 Tab 選取按鈕，Enter 或空白鍵操作。選取故事書後可用左右方向鍵翻章；明信片可按 Escape 關閉。支援系統的減少動態設定，動畫停用時內容及互動仍可使用。'],faq:['常見問題','地圖上的六個紅點可打開文化明信片，下方國家名稱也能操作。故事書共有三章；每次翻頁會先收合紙雕，再翻頁展開。地圖保留原創畫作的藝術比例。'],contact:['聯絡我們','聯絡方式與社群連結尚待網站作者提供。']};
const help=event=>{const button=event.target.closest('[data-info]');if(!button)return;const item=info[button.dataset.info];if(!item)return;event.stopImmediatePropagation();document.querySelector('#info-title').textContent=item[0];document.querySelector('#info-content').textContent=item[1];document.querySelector('#info-dialog').showModal();};
document.addEventListener('click',help,true);
addEventListener('pagehide',event=>{if(event.persisted)return;book.destroy();postcards.destroy();headerSize.disconnect();document.removeEventListener('click',help,true);},{once:false});
