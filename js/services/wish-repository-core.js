export function createWishRepository(sdk, client) {
  const { auth, db } = client;
  const user = () => { if (!auth.currentUser) throw new Error('Sign in first'); return auth.currentUser; };
  const part = value => { if (typeof value !== 'string' || !value || value.includes('/')) throw new Error('Invalid document ID'); return value; };
  const privateRef = (uid, id) => sdk.doc(db, 'users', part(uid), 'wishes', part(id));
  const publicRef = id => sdk.doc(db, 'publicWishes', part(id));
  const plain = (snapshot, ownerUid) => snapshot.exists() ? {
    ...snapshot.data(), id: snapshot.id, ownerUid,
    createdAt: snapshot.data().createdAt?.toDate().toISOString() ?? null,
  } : null;
  const sameLetter = (a,b) => ['nickname','content','visibility'].every(k=>a[k]===b[k]);
  function draft(input) {
    const current = user(); if (!current.isAnonymous) throw new Error('Anonymous visitor required');
    const nickname = input.nickname?.trim(), content = input.content?.trim(), visibility = input.visibility;
    if (!nickname || nickname.length > 20 || !content || content.length > 300 || !['private','public'].includes(visibility)) throw new Error('Invalid wish');
    return Object.freeze({ id: sdk.doc(sdk.collection(db, 'users', current.uid, 'wishes')).id, ownerUid: current.uid, nickname, content, visibility });
  }
  async function submitWish(letter) {
    const current = user(); if (!current.isAnonymous || letter.ownerUid !== current.uid) throw new Error('Wish owner mismatch');
    const ref = privateRef(current.uid, letter.id);
    // A transaction fails offline instead of silently queueing a "successful" delivery.
    // Keep the same draft ID for a retry after an uncertain connection outcome.
    await sdk.runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (existing.exists()) { if (!sameLetter(existing.data(), letter)) throw new Error('Draft conflict'); return; }
      transaction.set(ref, { nickname: letter.nickname, content: letter.content, visibility: letter.visibility, status: 'pending', createdAt: sdk.serverTimestamp() });
    });
    return plain(await sdk.getDocFromServer(ref), current.uid);
  }
  async function latestWish() {
    const uid = user().uid;
    const result = await sdk.getDocsFromServer(sdk.query(sdk.collection(db,'users',uid,'wishes'),sdk.orderBy('createdAt','desc'),sdk.limit(1)));
    return result.empty ? null : plain(result.docs[0],uid);
  }
  async function publicWishes(count = 10) {
    const uid = user().uid; if (![9,10].includes(count)) throw new Error('Expected 9 or 10 wishes');
    // Bounded indexed sampling, not a full collection download or a claim of
    // mathematically uniform sampling. Exclude every wish by this visitor.
    const pivot = Math.random(), base = sdk.collection(db,'publicWishes');
    const batches = await Promise.all([
      sdk.getDocsFromServer(sdk.query(base,sdk.orderBy('randomKey'),sdk.startAt(pivot),sdk.limit(30))),
      sdk.getDocsFromServer(sdk.query(base,sdk.orderBy('randomKey'),sdk.endBefore(pivot),sdk.limit(30))),
    ]);
    const unique = new Map();
    for(const batch of batches)for(const snapshot of batch.docs) {
      const data = snapshot.data(); if(data.ownerUid !== uid)unique.set(snapshot.id,plain(snapshot,data.ownerUid));
    }
    const result = [...unique.values()];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result.slice(0,count);
  }
  async function pendingWishes() {
    const result = await sdk.getDocsFromServer(sdk.query(sdk.collectionGroup(db,'wishes'),sdk.where('status','==','pending'),sdk.orderBy('createdAt','asc'),sdk.limit(50)));
    return result.docs.map(snapshot=>plain(snapshot,snapshot.ref.parent.parent.id));
  }
  // Reuses the status + createdAt index, one page per request; the cursor continues the same status.
  async function wishesByStatus(status,after=null) {
    if(!['pending','approved','rejected'].includes(status))throw new Error('Invalid status');
    const page=[sdk.where('status','==',status),sdk.orderBy('createdAt','asc'),...(after?[sdk.startAfter(after)]:[]),sdk.limit(50)];
    const result=await sdk.getDocsFromServer(sdk.query(sdk.collectionGroup(db,'wishes'),...page));
    return { wishes:result.docs.map(snapshot=>plain(snapshot,snapshot.ref.parent.parent.id)), cursor:result.docs.length===50?result.docs.at(-1):null };
  }
  async function reviewWish(uid,id,decision) {
    if(!['approved','rejected'].includes(decision))throw new Error('Invalid decision');
    const moderator = user(), ref = privateRef(uid,id), published = publicRef(id);
    await sdk.runTransaction(db,async transaction=>{
      const [original,copy] = await Promise.all([transaction.get(ref),transaction.get(published)]);
      if(!original.exists())throw new Error('Wish does not exist');
      const data = original.data();
      if(copy.exists() && copy.data().ownerUid!==uid)throw new Error('Publication ID conflict');
      if(decision==='approved' && data.visibility!=='public')throw new Error('Private wishes cannot be published');
      transaction.update(ref,{status:decision,reviewedAt:sdk.serverTimestamp(),reviewedBy:moderator.uid});
      if(decision==='approved')transaction.set(published,{
        ownerUid:uid,nickname:data.nickname,content:data.content,createdAt:data.createdAt,
        publishedAt:sdk.serverTimestamp(),randomKey:Math.random(),
      });
      else if(copy.exists())transaction.delete(published);
    });
  }
  return { get uid(){return user().uid;}, draft, submitWish, latestWish, publicWishes, pendingWishes, wishesByStatus, reviewWish };
}
