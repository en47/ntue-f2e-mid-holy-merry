import * as sdk from './firebase-sdk.js';
import { getVisitor, getClient } from './firebase-client.js';
import { createWishRepository } from './wish-repository-core.js';
export async function visitorRepository() { return createWishRepository(sdk,await getVisitor()); }
export async function adminRepository() { return createWishRepository(sdk,await getClient('admin')); }
