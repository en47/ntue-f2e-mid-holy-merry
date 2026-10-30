// SDK injection keeps the real client usable in both browser and emulator tests.
export function createFirebaseClients(sdk, config, databaseId = '(default)', emulator = null) {
  if (emulator && !config.projectId.startsWith('demo-')) throw new Error('Emulators require a demo project');
  const instances = new Map(), pending = new Map();
  async function getClient(role = 'visitor') {
    if (!['visitor', 'admin'].includes(role)) throw new Error('Unknown Firebase role');
    if (pending.has(role)) return pending.get(role);
    const ready = (async () => {
      const name = `holy-merry-${role}`;
      const app = sdk.getApps().find(a => a.name === name) || sdk.initializeApp(config, name);
      const auth = sdk.getAuth(app), db = sdk.getFirestore(app, databaseId);
      if (emulator) {
        sdk.connectAuthEmulator(auth, `http://${emulator.host}:${emulator.authPort}`, { disableWarnings: true });
        sdk.connectFirestoreEmulator(db, emulator.host, emulator.firestorePort);
      }
      if (typeof window !== 'undefined') await sdk.setPersistence(auth, role === 'admin' ? sdk.browserSessionPersistence : sdk.browserLocalPersistence);
      await auth.authStateReady();
      const client = { app, auth, db }; instances.set(role, client); return client;
    })();
    pending.set(role, ready);
    try { return await ready; } catch (error) { pending.delete(role); throw error; }
  }
  let visitorLogin;
  async function getVisitor() {
    if (visitorLogin) return visitorLogin;
    visitorLogin = (async () => {
      const client = await getClient('visitor');
      if (!client.auth.currentUser) await sdk.signInAnonymously(client.auth);
      if (!client.auth.currentUser.isAnonymous) throw new Error('Visitor must use an anonymous session');
      return client;
    })();
    try { return await visitorLogin; } finally { visitorLogin = null; }
  }
  return { getClient, getVisitor };
}
