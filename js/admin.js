const form=document.querySelector('#admin-login'),panel=document.querySelector('#admin-panel');
const status=document.querySelector('#admin-status'),list=document.querySelector('#admin-wishes');
const refresh=document.querySelector('#admin-refresh'),logout=document.querySelector('#admin-signout');
let sdk,client,repository,busy=false,version=0;
function showError(error){
  const code=error.code || '';
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
async function loadQueue(){
  if(busy)return;busy=true;refresh.disabled=true;logout.disabled=true;const current=++version;
  list.replaceChildren();status.textContent='正在讀取待審核信件……';
  try{
    if(!await authorize()){
      await sdk.signOut(client.auth);panel.hidden=true;form.hidden=false;status.textContent='管理員授權已失效，請重新登入。';return;
    }
    const wishes=await repository.pendingWishes();if(current!==version)return;
    for(const wish of wishes){
      const item=document.createElement('li'),title=document.createElement('h3'),body=document.createElement('p'),meta=document.createElement('p'),actions=document.createElement('div');
      title.textContent=wish.nickname;body.className='admin-wish-content';body.textContent=wish.content;
      meta.textContent=`${wish.visibility==='public'?'同意審核後公開':'私人信件'} · ${new Date(wish.createdAt).toLocaleString('zh-TW')}`;
      actions.className='admin-actions';
      for(const [decision,label]of [['approved','核准公開'],['rejected','拒絕']]){
        const button=document.createElement('button');button.textContent=label;button.disabled=decision==='approved'&&wish.visibility!=='public';
        button.addEventListener('click',async()=>{
          if(busy)return;busy=true;refresh.disabled=true;logout.disabled=true;
          const buttons=[...list.querySelectorAll('button')],disabled=buttons.map(b=>b.disabled);let saved=false;
          buttons.forEach(b=>b.disabled=true);status.textContent='正在提交審核……';
          try{await repository.reviewWish(wish.ownerUid,wish.id,decision);saved=true;status.textContent='審核已由伺服器確認。';}
          catch(error){showError(error);}
          finally{busy=false;refresh.disabled=false;logout.disabled=false;buttons.forEach((b,i)=>b.disabled=disabled[i]);if(saved)await loadQueue();}
        });actions.append(button);
      }
      item.append(title,meta,body,actions);list.append(item);
    }
    status.textContent=wishes.length?`已讀取 ${wishes.length} 封待審信件。`:'目前沒有待審信件。';
  }catch(error){showError(error);}finally{busy=false;refresh.disabled=false;logout.disabled=false;}
}
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
refresh.addEventListener('click',loadQueue);
logout.addEventListener('click',async()=>{if(busy)return;++version;list.replaceChildren();panel.hidden=true;form.hidden=false;await sdk.signOut(client.auth);status.textContent='已登出。';});
async function start(){
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
