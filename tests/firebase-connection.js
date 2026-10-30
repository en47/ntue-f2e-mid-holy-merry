const button=document.querySelector('#check'),result=document.querySelector('#result');
button.addEventListener('click',async()=>{
  button.disabled=true;result.textContent='正在載入官方 Firebase SDK……';
  try{
    const {getVisitor}=await import('../js/services/firebase-client.js');
    const {createWishRepository}=await import('../js/services/wish-repository-core.js');
    const sdk=await import('../js/services/firebase-sdk.js');
    const client=await getVisitor();
    result.textContent=`專案：${client.app.options.projectId}\n匿名登入成功\nUID：${client.auth.currentUser.uid}\n正在檢查 Firestore 讀取權限……`;
    const repository=createWishRepository(sdk,client),checks=await Promise.allSettled([repository.latestWish(),repository.publicWishes(10)]);
    checks.forEach((check,index)=>{
      const name=index===0?'本人最新願望':'已發布願望';
      result.textContent+=check.status==='fulfilled'?`\n${name}：讀取成功（${index===0?(check.value?'已有信件':'尚無信件'):check.value.length+' 封'}）`:`\n${name}：未通過（${check.reason.code||'連線失敗'}）。需檢查正式 Rules／索引。`;
    });
    result.textContent+='\n以上沒有寫入任何願望，也不代表管理員審核或樹上信封已完成。';
  }catch(error){result.textContent=`連線未完成：${error.code||error.message}\n未寫入願望，請確認網路與 Firebase Web App 設定。`;}
  finally{button.disabled=false;}
});
