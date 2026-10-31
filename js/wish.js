import { createWishDelivery } from './components/wish-delivery.js';
import { selectTreeWishes } from './services/wish-selection.js';
import { mountNightScene } from './components/wish-night.js';
import { mountWishLights } from './components/wish-lights.js';
import { paperLayer } from './components/paper-art.js';
import { airmailLetter, tagArt } from './components/paper-props.js';
const form = document.querySelector('#wish-form');
const nickname = document.querySelector('#nickname');
const content = document.querySelector('#wish-content');
const status = document.querySelector('#wish-status');
const dialog = document.querySelector('#wish-dialog');
const delivery = createWishDelivery(document.querySelector('#wish-room'),{savingText:'正在將願望寄到聖誕信箱……'});
const send=form.querySelector('button[type="submit"]'),publish=document.querySelector('#wish-public');
const cloudStatus=document.querySelector('#cloud-status'),cloudRetry=document.querySelector('#cloud-retry');
let repository=null,connecting=false,ownWish=null,publicWishes=[],treeWishes=[],draft=null,refreshVersion=0;
let pendingEnvelopeEntrance = null;
function showWish(wish){
  document.querySelector('#wish-dialog-title').textContent=`${wish.nickname} 的聖誕願望`;
  document.querySelector('#wish-dialog-date').textContent=wish.createdAt?new Intl.DateTimeFormat('zh-TW',{dateStyle:'medium',timeStyle:'short'}).format(new Date(wish.createdAt)):'';
  document.querySelector('#wish-dialog-content').textContent=wish.content;
  document.querySelector('#wish-dialog-privacy').textContent=!wish.isOwn?'這是已核准的公開願望。':wish.visibility==='private'?'這是你的私人願望，僅本人及管理員可讀。':wish.status==='approved'?'你的願望已核准公開。':wish.status==='rejected'?'這封願望未通過公開審核，其他訪客無法查看。':'你的願望仍待審核，其他訪客無法查看。';
  dialog.showModal();
}
function updateTree({ newWishId = null } = {}){
  if(!repository)return;
  treeWishes=selectTreeWishes(ownWish,publicWishes,repository.uid);
  document.querySelector('#cloud-wish-total').textContent=`${treeWishes.length} 封`;
  const list=document.querySelector('#cloud-envelope-list');list.replaceChildren();
  for(const wish of treeWishes){
    const item=document.createElement('li'),button=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');
    button.type='button';button.className='envelope';button.setAttribute('aria-label',wish.isOwn?'查看自己的最新願望（金色信封）':`查看 ${wish.nickname} 的已核准願望`);
    image.src=`assets/illustrations/wish/${wish.isOwn?'envelope-paper-star.svg':'envelope-paper.svg'}`;image.alt='';image.width=1024;image.height=680;image.loading='lazy';
    label.textContent=wish.isOwn?'自己的最新願望':wish.nickname;button.append(image,label);button.addEventListener('click',()=>showWish(wish));item.append(button);list.append(item);
  }
  if (newWishId) pendingEnvelopeEntrance = newWishId;
  if (sceneController) {
    sceneController.setWishes(treeWishes,showWish,{newWishId:pendingEnvelopeEntrance});
    pendingEnvelopeEntrance = null;
  }
}
async function refreshPublic(){
  const version=++refreshVersion;
  try{
    const result=await repository.publicWishes(ownWish?9:10);
    if(version!==refreshVersion)return;
    publicWishes=result;updateTree();
    cloudStatus.textContent=ownWish?'已連接聖誕信箱。金色信封是你的最新願望；私人及待審內容不會公開。':'已連接聖誕信箱。寄信後會出現自己的金色信封；目前僅展示已核准的公開願望。';
  }catch(error){
    // Drop stale public copies if we cannot verify they are still published.
    if(version!==refreshVersion)return;publicWishes=[];updateTree();
    cloudStatus.textContent='公開願望暫時無法讀取，已收起舊的公開信封。你仍可寄信及查看自己的願望。';cloudRetry.hidden=false;
  }
}
async function connectCloud(){
  if(connecting||delivery.busy)return;connecting=true;send.disabled=true;cloudRetry.hidden=true;cloudStatus.textContent='正在連接聖誕信箱……';
  try{
    const {visitorRepository}=await import('./services/wish-repository.js');
    repository=await visitorRepository();ownWish=await repository.latestWish();updateTree();await refreshPublic();send.disabled=false;
  }catch(error){
    repository=null;ownWish=null;publicWishes=[];treeWishes=[];sceneController?.setWishes([],showWish);
    document.querySelector('#cloud-envelope-list').replaceChildren();document.querySelector('#cloud-wish-total').textContent='0 封';
    cloudStatus.textContent='雲端信箱尚未連接，請確認網路後重試。';cloudRetry.hidden=false;
  }finally{connecting=false;}
}
cloudRetry.addEventListener('click',connectCloud);
content.addEventListener('input', () => {
  content.setCustomValidity('');
  document.querySelector('#wish-counter').textContent = `${content.value.length} / 300`;
});
nickname.addEventListener('input', () => nickname.setCustomValidity(''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!repository || connecting || delivery.busy) return;
  const name = nickname.value.trim();
  const text = content.value.trim();
  nickname.setCustomValidity(name ? '' : '請輸入暱稱，不能只有空白。');
  content.setCustomValidity(text ? '' : '請寫下一個願望，不能只有空白。');
  if (!form.reportValidity()) return;
  status.textContent = '';
  const input={nickname:name,content:text,visibility:publish.checked?'public':'private'};
  let confirmed=null;
  try {
    if(!draft || !['nickname','content','visibility'].every(key=>draft[key]===input[key]))draft=repository.draft(input);
    confirmed=await delivery.run(()=>repository.submitWish(draft));
    if(!confirmed)return;
    ownWish=confirmed;draft=null;
    document.querySelector('#receipt-message').textContent=confirmed.visibility==='private'?'雲端已確認收到你的私人願望。只有本人與管理員可讀；可點樹上的金色信封查看。':'雲端已確認收到，正在等待公開審核。目前只有本人與管理員可讀；可點金色信封查看。';
    updateTree({newWishId:confirmed.id});await refreshPublic();
  } catch (error) {
    status.textContent = confirmed?'願望已寄送成功，但顯示尚未更新，請重新整理查看。':error.name === 'AbortError'
      ? '畫面尺寸或顯示狀態已改變，信紙已展開；尚未儲存，內容仍保留，請再試一次。'
      : '雲端尚未確認寄送結果，輸入內容仍保留。請確認網路後重試相同內容，或重新整理查詢最新願望；不會改存本機冒充寄送成功。';
  }
});

function mountWishPaper(root) {
  const stretch = { eager: true, preserveAspectRatio: 'none' };
  paperLayer(root.querySelector('#wish-form'), '0 0 380 300', 'letter-art', airmailLetter('#a84a42', '#4f7d68', { writing: true }), { ...stretch, paper: { scale: .8, grain: .35, shadow: .24 } });
  for (const button of root.querySelectorAll('.letter-send')) paperLayer(button, '0 0 240 106', 'tag-art', tagArt('#a84a42', '#853a34'), { ...stretch, paper: { scale: .7, grain: .45, shadow: .24 } });
}

// The scene and Firebase load independently; WebGL failure must not disable letters.
const room = document.querySelector('#wish-room');
mountNightScene(room);
mountWishPaper(room);
const lights = mountWishLights(room);
let sceneController = null, sceneVersion = 0;
async function startScene() {
  if (sceneController) return;
  const version = ++sceneVersion;
  try {
    const { mountWishScene } = await import('./components/wish-scene.js');
    if (version !== sceneVersion) return;
    sceneController = mountWishScene(room);
    sceneController.setWishes(treeWishes,showWish,{newWishId:pendingEnvelopeEntrance});
    pendingEnvelopeEntrance = null;
  } catch (error) {
    if (version !== sceneVersion) return;
    console.error('Wish scene:', error);
    document.querySelector('#scene-progress').textContent = '3D 場景無法開啟。請使用支援 WebGL 的瀏覽器；雲端願望仍可在下方清單查看。';
    const retry = document.querySelector('#scene-retry');
    retry.hidden = false;
    retry.onclick = () => { retry.hidden = true; startScene(); };
  }
}
window.addEventListener('pagehide', event => { if (!event.persisted) lights.destroy(); delivery.cancel(); sceneVersion++; sceneController?.destroy(); sceneController = null; });
window.addEventListener('pageshow', () => { if (!sceneController) startScene(); });
startScene();
connectCloud();
