import * as sdk from './firebase-sdk.js';
import { firebaseConfig, firestoreDatabaseId } from '../config/firebase-config.js';
import { createFirebaseClients, localEmulatorTarget } from './firebase-client-core.js';
// Only the page's own hostname decides; a URL parameter or browser storage never switches this.
const local = localEmulatorTarget(globalThis.location?.hostname);
export const { getClient, getVisitor } = createFirebaseClients(sdk, local?.config ?? firebaseConfig, firestoreDatabaseId, local?.emulator ?? null);
