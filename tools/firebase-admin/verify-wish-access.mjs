// Explicit production audit: reads Firestore, creates one anonymous Auth session,
// and never writes, approves, rejects, deletes or publishes a wish.
import assert from 'node:assert/strict';
import { initializeApp as initializeAdmin, applicationDefault, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb } from 'firebase-admin/firestore';
import * as appSdk from 'firebase/app';
import * as authSdk from 'firebase/auth';
import * as dbSdk from 'firebase/firestore';
import { firebaseConfig } from '../../js/config/firebase-config.js';
import { createWishRepository } from '../../js/services/wish-repository-core.js';

const args=process.argv.slice(2), value=flag=>args[args.indexOf(flag)+1];
const phase=value('--phase'), uid=value('--uid');
if(value('--project')!=='holymerry'||!['pending','approved'].includes(phase)||!uid||uid.startsWith('--')) {
  throw Error('Usage: node tools/firebase-admin/verify-wish-access.mjs --project holymerry --uid ADMIN_UID --phase pending|approved');
}
if(process.env.FIREBASE_AUTH_EMULATOR_HOST||process.env.FIRESTORE_EMULATOR_HOST)throw Error('Refusing emulator environment');
assert.equal(firebaseConfig.projectId,'holymerry');
const admin=initializeAdmin({projectId:'holymerry',credential:applicationDefault()},'trusted-production-audit');
let visitor;
const checks=[];
try {
  const account=await getAdminAuth(admin).getUser(uid);
  assert.equal(account.disabled,false);
  assert.ok(account.providerData.some(provider=>provider.providerId==='password'));
  assert.equal(account.customClaims?.admin,true);
  checks.push('Specified enabled password account has admin:true (Admin SDK server read)');
  const trustedDb=getAdminDb(admin);
  const queue=await trustedDb.collectionGroup('wishes').where('status','==',phase).orderBy('createdAt','asc').limit(50).get();
  const matches=queue.docs.filter(doc=>doc.get('nickname')==='47'&&doc.get('content')==='你好'&&doc.get('visibility')==='public');
  assert.equal(matches.length,1,'Expected exactly one named test wish in the first 50 matching records');
  const target=matches[0],source=target.data(),published=await trustedDb.doc(`publicWishes/${target.id}`).get();
  assert.equal(published.exists,phase==='approved');
  if(published.exists) {
    const copy=published.data();
    for(const key of ['nickname','content'])assert.equal(copy[key],source[key]);
    assert.equal(copy.ownerUid,target.ref.parent.parent.id);
    assert.ok(copy.createdAt.isEqual(source.createdAt));
    assert.ok(copy.publishedAt);
    assert.equal(source.reviewedBy,uid);
    assert.ok(source.reviewedAt);
  }
  checks.push(`Named test wish is ${phase}; public copy ${published.exists?'matches original':'does not exist'}`);
  const privateBatches=await Promise.all(['pending','rejected'].map(status=>trustedDb.collectionGroup('wishes').where('status','==',status).orderBy('createdAt','asc').limit(50).get()));
  const privateMatches=privateBatches.flatMap(batch=>batch.docs).filter(doc=>doc.get('visibility')==='private'&&doc.get('nickname')==='Firebase 私人驗收');
  assert.equal(privateMatches.length,1,'Expected the existing designated private test record');
  const privateWish=privateMatches[0];
  assert.equal((await trustedDb.doc(`publicWishes/${privateWish.id}`).get()).exists,false);
  checks.push(`Existing private test is ${privateWish.get('status')} and has no public copy`);
  visitor=appSdk.initializeApp(firebaseConfig,`production-audit-${Date.now()}`);
  const auth=authSdk.getAuth(visitor),db=dbSdk.getFirestore(visitor);
  await authSdk.signInAnonymously(auth);
  assert.notEqual(auth.currentUser.uid,target.ref.parent.parent.id);
  const token=await authSdk.getIdTokenResult(auth.currentUser,true);
  assert.notEqual(token.claims.admin,true);
  const sdk={...appSdk,...authSdk,...dbSdk},repo=createWishRepository(sdk,{auth,db});
  for(const document of [target,privateWish]) {
    await assert.rejects(dbSdk.getDocFromServer(dbSdk.doc(db,document.ref.path)),error=>error.code==='permission-denied');
  }
  checks.push('Other anonymous user cannot read original test letter or private letter');
  await assert.rejects(repo.pendingWishes(),error=>error.code==='permission-denied');
  checks.push('Other anonymous user cannot query moderation queue');
  const publicCopy=await dbSdk.getDocFromServer(dbSdk.doc(db,'publicWishes',target.id));
  assert.equal(publicCopy.exists(),phase==='approved');
  const sample=await repo.publicWishes(10);
  assert.ok(sample.length<=10);
  assert.ok(sample.every(wish=>wish.ownerUid!==auth.currentUser.uid));
  if(phase==='pending')assert.ok(!sample.some(wish=>wish.id===target.id));
  else {
    const publishedCount=await trustedDb.collection('publicWishes').count().get();
    // With a larger pool, a random sample is allowed not to contain this letter.
    if(publishedCount.data().count<=30)assert.ok(sample.some(wish=>wish.id===target.id));
  }
  checks.push(`Anonymous public server query verified (${sample.length} of maximum 10)`);
  console.log(JSON.stringify({project:'holymerry',phase,targetPath:target.ref.path,checks,passed:true},null,2));
} finally {
  if(visitor){await dbSdk.terminate(dbSdk.getFirestore(visitor));await appSdk.deleteApp(visitor);}
  await deleteAdmin(admin);
}
