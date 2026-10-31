import { mountIntroBook } from './components/intro-book.js';
import { mountIntroPostcards } from './components/intro-postcards.js';
import { decoratePage, mountBookArt, tagArt } from './components/intro-art.js';
import { drawCoin, drawPiece } from './components/intro-scenes.js';
import { mountMapArt, mountScrollArt } from './components/intro-map.js';
import { paperLayer } from './components/paper-art.js';
import { mountIntroScroll } from './components/intro-scroll.js';
// The Header is static: include its measured height in the first snap target only.
const main=document.querySelector('.intro-main');
const measureHeader=()=>main.style.setProperty('--intro-header-height',`${document.querySelector('.site-header').getBoundingClientRect().height}px`);
measureHeader();
const headerSize=new ResizeObserver(measureHeader);headerSize.observe(document.querySelector('.site-header'));
const storybook=document.querySelector('#intro-storybook');
mountBookArt(storybook);
const book=mountIntroBook(storybook,{art:{page:decoratePage,piece:drawPiece,coin:drawCoin}});
const postcards=mountIntroPostcards(document.querySelector('.intro-main'));
const cultures=document.querySelector('#christmas-cultures');
mountScrollArt(cultures);
paperLayer(cultures.querySelector('.intro-letter-open'),'0 0 240 90','tag-art',tagArt('#a84a42','#853a34'),{paper:{scale:.7,grain:.45,shadow:.24},eager:true,preserveAspectRatio:'none'});
const scroll=mountIntroScroll(cultures,{sleigh:mountMapArt(cultures.querySelector('.intro-map-canvas'))});
// Localized, up-to-date Intro help without changing other pages' shared module.
const info={accessibility:['無障礙與操作','可用 Tab 選取按鈕，Enter 或空白鍵操作。選取故事書後可用左右方向鍵翻章；明信片可按 Escape 關閉。支援系統的減少動態設定，動畫停用時內容及互動仍可使用。'],faq:['常見問題','地圖上的六個紅點可打開文化明信片，下方國家名稱也能操作。故事書共有三章；每次翻頁會先收合紙雕，再翻頁展開。地圖保留原創畫作的藝術比例。'],contact:['聯絡我們','聯絡方式與社群連結尚待網站作者提供。']};
const help=event=>{const button=event.target.closest('[data-info]');if(!button)return;const item=info[button.dataset.info];if(!item)return;event.stopImmediatePropagation();document.querySelector('#info-title').textContent=item[0];document.querySelector('#info-content').textContent=item[1];document.querySelector('#info-dialog').showModal();};
document.addEventListener('click',help,true);
addEventListener('pagehide',event=>{if(event.persisted)return;book.destroy();postcards.destroy();scroll.destroy();headerSize.disconnect();document.removeEventListener('click',help,true);},{once:false});
