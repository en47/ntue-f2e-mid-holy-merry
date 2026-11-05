import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PREFETCH_ASSETS } from '../js/data/prefetch-assets.js';

const require = createRequire(import.meta.url);
const { listFiles } = require('../node_modules/firebase-tools/lib/listFiles.js');

test('every prefetched file exists and has no version query to go stale', () => {
  for (const path of PREFETCH_ASSETS) {
    assert.ok(fs.existsSync(new URL(`../${path}`, import.meta.url)), path);
    assert.ok(!path.includes('?'), path);
  }
});

test('every prefetched file is also published to the backup Firebase Hosting site', () => {
  const { hosting } = JSON.parse(fs.readFileSync(new URL('../firebase.hosting.json', import.meta.url), 'utf8'));
  const published = new Set(listFiles(fileURLToPath(new URL('..', import.meta.url)), hosting.ignore));
  for (const path of PREFETCH_ASSETS) assert.ok(published.has(path), path);
});
