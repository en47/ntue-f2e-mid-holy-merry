import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as appSdk from 'firebase/app';
import * as authSdk from 'firebase/auth';
import * as dbSdk from 'firebase/firestore';
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getAuth as adminAuth } from 'firebase-admin/auth';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFile } from 'node:fs/promises';
import { createFirebaseClients } from '../js/services/firebase-client-core.js';
import { createWishRepository } from '../js/services/wish-repository-core.js';
const projectId='demo-holy-merry';
if(!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Both emulators required; never run against production');
test('real Auth + Firestore SDK: anonymous identity, retry-safe write, private read, admin claim and atomic moderation',async()=>{
  const env=await initializeTestEnvironment({projectId,firestore:{rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
  await env.clearFirestore();dbSdk.setLogLevel('silent');
  const sdk={...appSdk,...authSdk,...dbSdk};
  const clients=createFirebaseClients(sdk,{apiKey:'emulator-only-key',projectId},'(default)',{host:'127.0.0.1',authPort:9099,firestorePort:8080});
  const admin=initializeAdmin({projectId},'emulator-admin-only');
  let other;
  try{
    const [a,a2]=await Promise.all([clients.getVisitor(),clients.getVisitor()]);assert.equal(a.auth.currentUser.uid,a2.auth.currentUser.uid);
    const uid=a.auth.currentUser.uid,repo=createWishRepository(sdk,a);assert.equal(await repo.latestWish(),null);
    const draft=repo.draft({nickname:'Emulator 訪客',content:'僅模擬器測試，不送到正式資料庫。',visibility:'public'});
    const saved=await repo.submitWish(draft);assert.equal(saved.status,'pending');assert.ok(saved.createdAt);
    const retry=await repo.submitWish(draft);assert.equal(retry.id,saved.id);assert.equal((await repo.latestWish()).id,saved.id);
    const all=await dbSdk.getDocsFromServer(dbSdk.query(dbSdk.collection(a.db,'users',uid,'wishes'),dbSdk.limit(60)));assert.equal(all.size,1);
    other=appSdk.initializeApp({apiKey:'emulator-only-key',projectId},'emulator-other');
    const auth=authSdk.getAuth(other),db=dbSdk.getFirestore(other);authSdk.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});dbSdk.connectFirestoreEmulator(db,'127.0.0.1',8080);
    await authSdk.signInAnonymously(auth);const otherRepo=createWishRepository(sdk,{auth,db});
    await assert.rejects(dbSdk.getDocFromServer(dbSdk.doc(db,'users',uid,'wishes',saved.id)),e=>e.code==='permission-denied');
    assert.equal((await otherRepo.publicWishes()).length,0);
    const m=await clients.getClient('admin');await authSdk.createUserWithEmailAndPassword(m.auth,`moderator-${Date.now()}@example.test`,'Emulator-only-password-123');
    assert.equal(a.auth.currentUser.uid,uid,'Admin login must not replace visitor identity');
    const modRepo=createWishRepository(sdk,m);await assert.rejects(modRepo.pendingWishes(),e=>e.code==='permission-denied');
    await adminAuth(admin).setCustomUserClaims(m.auth.currentUser.uid,{admin:true});
    await m.auth.currentUser.getIdToken(true);
    assert.ok((await modRepo.pendingWishes()).some(w=>w.id===saved.id));
    await modRepo.reviewWish(uid,saved.id,'approved');
    assert.equal((await otherRepo.publicWishes()).length,1);assert.equal((await repo.publicWishes(9)).length,0,'Exclude own public letters');
    const local=repo.draft({nickname:'私人測試',content:'不得公開',visibility:'private'});await repo.submitWish(local);
    await assert.rejects(modRepo.reviewWish(uid,local.id,'approved'),/Private wishes/);
    await modRepo.reviewWish(uid,saved.id,'rejected');assert.equal((await otherRepo.publicWishes()).length,0);
    assert.equal((await repo.latestWish()).id,local.id);
    // Refresh/resume uses the existing auth user; it must not create a fresh UID.
    assert.equal((await clients.getVisitor()).auth.currentUser.uid,uid);
  }finally{
    for(const app of appSdk.getApps()){await dbSdk.terminate(dbSdk.getFirestore(app));await appSdk.deleteApp(app);}
    await deleteAdmin(admin);await env.cleanup();
  }
});
