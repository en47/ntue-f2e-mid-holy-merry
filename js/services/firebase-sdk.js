// Pin all browser imports to the same official modular SDK version.
export { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
export { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence,
  signInAnonymously, signInWithEmailAndPassword, signOut, getIdTokenResult,
  connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
export { getFirestore, collection, collectionGroup, doc, query, where, orderBy,
  limit, startAt, startAfter, endBefore, getDocsFromServer, getDocFromServer, runTransaction,
  serverTimestamp, deleteField, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
