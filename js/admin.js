const form=document.querySelector('#admin-login'),panel=document.querySelector('#admin-panel');
const status=document.querySelector('#admin-status'),list=document.querySelector('#admin-wishes');
const more=document.querySelector('#admin-more'),hint=document.querySelector('#admin-tab-hint'),tabs=[...document.querySelectorAll('.admin-tabs button')];
const refresh=document.querySelector('#admin-refresh'),logout=document.querySelector('#admin-signout');
const VIEWS={
  pending:{hint:'新寄來的信。私人信件只能拒絕，不會公開。',found:n=>`已讀取 ${n} 封待審信件。`,empty:'目前沒有待審信件。'},
  approved:{hint:'這些信都在聖誕樹的隨機庫裡。撤回後會立刻離開，原信保留。',found:n=>`已讀取 ${n} 封已公開願望。`,empty:'目前沒有已公開願望。'},
  rejected:{hint:'未公開的信。同意公開過的信可以重新同意，放回隨機庫。',found:n=>`已讀取 ${n} 封已拒絕願望。`,empty:'目前沒有已拒絕願望。'},
};
let sdk,client,repository,busy=false,version=0,view='pending',cursor=null,shown=0;
function showError(error){
  const code=error.code || '';
  // Local previews use the emulator, whose accounts are separate from the real project.
  if(client?.app.options.projectId.startsWith('demo-')&&code.startsWith('auth/')){
    status.textContent=code.includes('network-request')?'本機預覽要連模擬器，但它沒有開。請先執行 npx firebase emulators:start --only auth,firestore --project demo-holy-merry，再執行 npm run admin:local。':'本機模擬器裡沒有這個帳號，正式帳號不能在這裡登入。請執行 npm run admin:local，用它顯示的測試帳號登入。';
    return;
  }
  status.textContent=code.includes('permission-denied')?'資料庫拒絕存取。請確認正式 Rules 已部署、管理員 claim 已設定，且審核索引已建立。'
    :code.includes('failed-precondition')?'審核查詢尚缺索引，請依 FIREBASE-SETUP.md 部署 indexes。'
    :code.startsWith('auth/')?'登入失敗，請確認帳號、密碼或稍後重試。'
    :'操作未完成，請確認網路後重試。沒有以本機狀態冒充審核成功。';
}
async function authorize(){
  if(!client.auth.currentUser)return false;
  const token=await sdk.getIdTokenResult(client.auth.currentUser,true);
  return token.claims.admin===true && token.signInProvider==='password';
}
// Every action locks all buttons, and only the server's confirmation counts as done.
async function decide(wish,decision){
  if(busy)return;busy=true;refresh.disabled=true;logout.disabled=true;
  const buttons=[...list.querySelectorAll('button')],disabled=buttons.map(b=>b.disabled);let saved=false;
  buttons.forEach(b=>b.disabled=true);status.textContent='正在提交審核……';
  try{await repository.reviewWish(wish.ownerUid,wish.id,decision);saved=true;status.textContent='審核已由伺服器確認。';}
  catch(error){showError(error);}
  finally{busy=false;refresh.disabled=false;logout.disabled=false;buttons.forEach((b,i)=>b.disabled=disabled[i]);if(saved)await loadQueue();}
}
function actionButton(label,handler,{disabled=false,quiet=false}={}){
  const button=document.createElement('button');button.textContent=label;button.disabled=disabled;button.classList.toggle('is-quiet',quiet);button.addEventListener('click',handler);return button;
}
function wishItem(wish){
  const item=document.createElement('li'),title=document.createElement('h3'),body=document.createElement('p'),meta=document.createElement('p'),row=document.createElement('div');
  const open=wish.visibility==='public';
  title.textContent=wish.nickname;body.className='admin-wish-content';body.textContent=wish.content;
  meta.className='admin-wish-meta';meta.textContent=`${open?'同意公開':'私人信件'} · ${new Date(wish.createdAt).toLocaleString('zh-TW')}`;
  row.className='admin-actions';
  if(wish.status==='pending')row.append(actionButton('核准公開',()=>decide(wish,'approved'),{disabled:!open}),actionButton('拒絕',()=>decide(wish,'rejected'),{quiet:true}));
  if(wish.status==='approved')row.append(actionButton('撤回公開',()=>{if(confirm(`確定要撤回「${wish.nickname}」的願望嗎？它會立刻從聖誕樹上移除。`))decide(wish,'rejected');},{quiet:true}));
  if(wish.status==='rejected')row.append(actionButton('重新同意',()=>decide(wish,'approved'),{disabled:!open}));
  item.className=`is-${wish.status}`;item.append(title,meta,body,row);return item;
}
async function loadQueue(append=false){
  if(busy)return;busy=true;refresh.disabled=true;logout.disabled=true;more.disabled=true;const current=++version;
  if(!append){list.replaceChildren();cursor=null;shown=0;more.hidden=true;}
  hint.textContent=VIEWS[view].hint;status.textContent='正在讀取信件……';
  try{
    if(!await authorize()){
      await sdk.signOut(client.auth);panel.hidden=true;form.hidden=false;status.textContent='管理員授權已失效，請重新登入。';return;
    }
    const page=await repository.wishesByStatus(view,cursor);if(current!==version)return;
    list.append(...page.wishes.map(wishItem));
    cursor=page.cursor;shown+=page.wishes.length;more.hidden=!cursor;
    status.textContent=shown?VIEWS[view].found(shown):VIEWS[view].empty;
  }catch(error){showError(error);}finally{busy=false;refresh.disabled=false;logout.disabled=false;more.disabled=false;}
}
for(const tab of tabs)tab.addEventListener('click',()=>{
  if(busy||tab.dataset.status===view)return;view=tab.dataset.status;
  tabs.forEach(item=>item.setAttribute('aria-pressed',String(item===tab)));loadQueue();
});
more.addEventListener('click',()=>loadQueue(true));
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!client)return;busy=true;form.querySelector('button').disabled=true;
  try{
    await sdk.signInWithEmailAndPassword(client.auth,document.querySelector('#admin-email').value.trim(),document.querySelector('#admin-password').value);
    document.querySelector('#admin-password').value='';
    if(!await authorize()){
      const uid=client.auth.currentUser.uid;await sdk.signOut(client.auth);
      status.textContent=`帳號已驗證，但尚未授予管理員權限。請在可信任本機執行初始化工具。\n此帳號 UID：${uid}`;return;
    }
    form.hidden=true;panel.hidden=false;
  }catch(error){document.querySelector('#admin-password').value='';showError(error);}
  finally{busy=false;form.querySelector('button').disabled=false;}
  if(!panel.hidden)await loadQueue();
});
refresh.addEventListener('click',()=>loadQueue());
logout.addEventListener('click',async()=>{if(busy)return;++version;list.replaceChildren();panel.hidden=true;form.hidden=false;await sdk.signOut(client.auth);status.textContent='已登出。';});
// Only three sheets of paper, cut once; the cards themselves stay plain CSS so 50 of them scroll lightly.
async function dress(){
  const [{paperLayer,shape},{airmailLetter}]=await Promise.all([import('./components/paper-art.js'),import('./components/paper-props.js')]);
  paperLayer(document.querySelector('.admin-hills'),'0 0 1440 240','',parent=>{
    shape('path',{d:'M0 96C170 56 300 118 480 92S760 44 960 88 1260 118 1440 70V240H0Z',fill:'#cfe1e7'},parent);
    shape('path',{d:'M0 150C220 110 360 160 590 136S940 92 1150 136 1340 150 1440 118V240H0Z',fill:'#fbf8f1'},parent);
  },{paper:{scale:1.2,grain:.4,shadow:.14},preserveAspectRatio:'none'});
  paperLayer(form,'0 0 380 300','letter-art',airmailLetter('#a84a42','#4f7d68',{writing:true}),{paper:{scale:.8,grain:.35,shadow:.24},eager:true,preserveAspectRatio:'none'});
}
async function start(){
  dress();
  form.querySelector('button').disabled=true;
  try{
    sdk=await import('./services/firebase-sdk.js');
    const [{getClient},{createWishRepository}]=await Promise.all([import('./services/firebase-client.js'),import('./services/wish-repository-core.js')]);
    client=await getClient('admin');repository=createWishRepository(sdk,client);
    if(await authorize()){form.hidden=true;panel.hidden=false;await loadQueue();}
    else if(client.auth.currentUser)await sdk.signOut(client.auth);
  }catch(error){status.textContent='Firebase 無法初始化。請確認網路及 Web App 設定後重新整理。';}
  finally{form.querySelector('button').disabled=!client;}
}
start();
