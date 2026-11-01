import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DEFAULT_MUSIC, MUSIC_TRACKS, parseMusicPosition, parseMusicState } from '../js/data/music-tracks.js';

test('a first visit is silent, so music only ever starts from a choice', () => {
  assert.deepEqual(parseMusicState(null), DEFAULT_MUSIC); assert.equal(DEFAULT_MUSIC.track, null);
});
test('the saved song and volume survive a reload', () => {
  assert.deepEqual(parseMusicState('{"track":"track-3","volume":0.6}'), { track: 'track-3', volume: .6 });
});
test('damaged storage falls back to silence', () => {
  assert.deepEqual(parseMusicState('{oops'), DEFAULT_MUSIC);
  assert.deepEqual(parseMusicState('{"track":"gone","volume":9}'), { track: null, volume: 1 });
});
test('a position only applies to the song it was saved for', () => {
  const saved = '{"track":"track-2","time":41.5}';
  assert.equal(parseMusicPosition(saved, 'track-2'), 41.5);
  assert.equal(parseMusicPosition(saved, 'track-1'), 0);
  assert.equal(parseMusicPosition('nope', 'track-2'), 0);
});
test('the menu matches the audio manifest in song and order', async () => {
  const { tracks } = JSON.parse(await fs.readFile(new URL('../docs/AUDIO-ASSETS.json', import.meta.url), 'utf8'));
  assert.deepEqual(MUSIC_TRACKS.map(({ id, title }) => [`${id}.mp3`, title]), tracks.map(({ file, title }) => [file, title]));
});
