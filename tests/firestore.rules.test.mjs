import { before, after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, collection, collectionGroup, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  writeBatch, query, where, orderBy, limit, serverTimestamp, Timestamp, setLogLevel } from 'firebase/firestore';

const projectId='demo-holy-merry';
if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Run via npm run test:firebase; no production tests allowed');
setLogLevel('silent');let env;
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});});
beforeEach(()=>env.clearFirestore());after(()=>env?.cleanup());
const visitor=uid=>env.authenticatedContext(uid,{firebase:{sign_in_provider:'anonymous'}}).firestore();
const moderator=()=>env.authenticatedContext('moderator',{admin:true,firebase:{sign_in_provider:'password'}}).firestore();
const ref=(db,uid='alice',id='letter')=>doc(db,'users',uid,'wishes',id);
const pub=db=>doc(db,'publicWishes','letter');
const letter=(extra={})=>({nickname:'小雪',content:'願大家平安。',visibility:'public',status:'pending',createdAt:serverTimestamp(),...extra});
async function create(extra={}){await setDoc(ref(visitor('alice')),letter(extra));}
async function approve(db=moderator(),changes={}){
  const s=(await getDoc(ref(db))).data(),batch=writeBatch(db);
  batch.update(ref(db),{status:'approved',reviewedAt:serverTimestamp(),reviewedBy:'moderator'});
  batch.set(pub(db),{ownerUid:'alice',nickname:s.nickname,content:s.content,createdAt:s.createdAt,publishedAt:serverTimestamp(),randomKey:.5,...changes});
  return batch.commit();
}
test('anonymous owner creates pending wish and reads own latest',async()=>{
  const db=visitor('alice');await assertSucceeds(setDoc(ref(db),letter()));
  await assertSucceeds(getDoc(ref(db)));
  await assertSucceeds(getDocs(query(collection(db,'users','alice','wishes'),orderBy('createdAt','desc'),limit(1))));
});
test('signed-out reads and writes are denied',async()=>{
  await create();const db=env.unauthenticatedContext().firestore();
  await assertFails(getDoc(ref(db)));await assertFails(setDoc(ref(db),letter()));await assertFails(getDocs(query(collection(db,'publicWishes'),limit(10))));
});
test('another visitor cannot read pending or private originals',async()=>{
  await create({visibility:'private'});const db=visitor('bob');
  await assertFails(getDoc(ref(db)));await assertFails(getDocs(query(collection(db,'users','alice','wishes'),limit(10))));
});
test('owner cannot impersonate another UID, add privileged fields or self-approve',async()=>{
  const db=visitor('bob');await assertFails(setDoc(ref(db),letter()));
  for(const extra of [{status:'approved'},{ownerUid:'bob'},{admin:true},{reviewedBy:'bob'}])await assertFails(setDoc(ref(db,'bob'),letter(extra)));
});
test('field types, size, whitespace and server time are enforced',async()=>{
  const db=visitor('alice');
  for(const extra of [{nickname:''},{nickname:'   '},{nickname:'a'.repeat(21)},{content:'\n\t  '},{content:'a'.repeat(301)},{content:42},{visibility:'everyone'},{createdAt:Timestamp.fromMillis(1)}])await assertFails(setDoc(ref(db),letter(extra)));
});
test('email/password visitors and anonymous users with an admin flag cannot moderate',async()=>{
  await create();const password=env.authenticatedContext('alice',{firebase:{sign_in_provider:'password'}}).firestore();
  await assertFails(setDoc(ref(password,'alice','new'),letter()));
  const fake=env.authenticatedContext('fake',{admin:true,firebase:{sign_in_provider:'anonymous'}}).firestore();
  await assertFails(getDoc(ref(fake)));
});
test('owners cannot edit/delete submitted letters or change moderation state',async()=>{
  await create();const db=visitor('alice');
  await assertFails(updateDoc(ref(db),{content:'changed'}));await assertFails(updateDoc(ref(db),{status:'approved'}));await assertFails(deleteDoc(ref(db)));
});
test('unbounded and excessive private queries are denied',async()=>{
  await create();const db=visitor('alice'),c=collection(db,'users','alice','wishes');
  await assertFails(getDocs(c));await assertFails(getDocs(query(c,limit(61))));
});
test('only admin can query moderation collection group, within 50 documents',async()=>{
  await create();const q=db=>query(collectionGroup(db,'wishes'),where('status','==','pending'),orderBy('createdAt'),limit(50));
  await assertFails(getDocs(q(visitor('bob'))));await assertSucceeds(getDocs(q(moderator())));
  await assertFails(getDocs(query(collectionGroup(moderator(),'wishes'),limit(51))));
});
test('ordinary users cannot create public copies or grant themselves admin',async()=>{
  await create();const db=visitor('alice');await assertFails(setDoc(pub(db),{ownerUid:'alice'}));
  await assertFails(setDoc(doc(db,'users','alice'),{admin:true}));await assertFails(setDoc(doc(db,'admins','alice'),{admin:true}));
});
test('approval without a matching public copy is denied even for admin',async()=>{
  await create();const db=moderator();await assertFails(updateDoc(ref(db),{status:'approved',reviewedAt:serverTimestamp(),reviewedBy:'moderator'}));
});
test('publishing a pending source directly is denied',async()=>{
  await create();const db=moderator(),s=(await getDoc(ref(db))).data();
  await assertFails(setDoc(pub(db),{ownerUid:'alice',nickname:s.nickname,content:s.content,createdAt:s.createdAt,publishedAt:serverTimestamp(),randomKey:.5}));
});
test('private wishes can never be published, including by admin',async()=>{
  await create({visibility:'private'});await assertFails(approve());
});
test('admin cannot alter original text, forge a public copy or expose extra fields',async()=>{
  await create();const db=moderator();await assertFails(updateDoc(ref(db),{content:'changed',status:'rejected',reviewedAt:serverTimestamp(),reviewedBy:'moderator'}));
  for(const change of [{content:'changed'},{ownerUid:'bob'},{reviewNotes:'private note'},{randomKey:2}])await assertFails(approve(db,change));
});
test('atomic approval publishes only approved public text; original remains private',async()=>{
  await create();await assertSucceeds(approve());const db=visitor('bob');
  await assertSucceeds(getDoc(pub(db)));await assertFails(getDoc(ref(db)));
  await assertSucceeds(getDocs(query(collection(db,'publicWishes'),orderBy('randomKey'),limit(10))));
  await assertFails(getDocs(collection(db,'publicWishes')));await assertFails(getDocs(query(collection(db,'publicWishes'),limit(31))));
});
test('withdrawal must remove public copy atomically',async()=>{
  await create();await approve();const db=moderator();
  await assertFails(updateDoc(ref(db),{status:'rejected',reviewedAt:serverTimestamp(),reviewedBy:'moderator'}));
  await assertFails(deleteDoc(pub(db)));
  const batch=writeBatch(db);batch.update(ref(db),{status:'rejected',reviewedAt:serverTimestamp(),reviewedBy:'moderator'});batch.delete(pub(db));await assertSucceeds(batch.commit());
  await assertFails(getDoc(ref(visitor('bob'))));
  const result=await getDocs(query(collection(visitor('bob'),'publicWishes'),limit(10)));if(!result.empty)throw Error('Rejected wish leaked');
});
test('pending private wish can be rejected without publication',async()=>{
  await create({visibility:'private'});const db=moderator();
  await assertSucceeds(updateDoc(ref(db),{status:'rejected',reviewedAt:serverTimestamp(),reviewedBy:'moderator'}));
  await assertFails(getDoc(ref(visitor('bob'))));await assertSucceeds(getDoc(ref(visitor('alice'))));
});
