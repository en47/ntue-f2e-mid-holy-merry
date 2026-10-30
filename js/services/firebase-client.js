import * as sdk from './firebase-sdk.js';
import { firebaseConfig, firestoreDatabaseId } from '../config/firebase-config.js';
import { createFirebaseClients } from './firebase-client-core.js';
// Production never switches to an emulator based on a URL parameter or browser storage.
export const { getClient, getVisitor } = createFirebaseClients(sdk, firebaseConfig, firestoreDatabaseId);
