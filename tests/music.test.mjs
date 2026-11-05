import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DEFAULT_MUSIC, MUSIC_TRACKS, musicStateFor, nextTrack, parseMusicPosition, parseMusicState } from '../js/data/music-tracks.js';

test('a first visit is silent, so music only ever starts from a choice', () => {
  assert.deepEqual(parseMusicState(null), DEFAULT_MUSIC); assert.equal(DEFAULT_MUSIC.track, null);
});
test('the saved song and volume survive a reload', () => {
  assert.deepEqual(parseMusicState('{"track":"track-3","volume":0.6,"mode":"repeat"}'), { track: 'track-3', volume: .6, mode: 'repeat' });
});
test('damaged storage falls back to silence', () => {
  assert.deepEqual(parseMusicState('{oops'), DEFAULT_MUSIC);
  assert.deepEqual(parseMusicState('{"track":"gone","volume":9,"mode":"shuffle"}'), { track: null, volume: 1, mode: 'next' });
});
test('older saved choices keep working and default to the next song', () => {
  assert.deepEqual(parseMusicState('{"track":"track-3","volume":0.6}'), { track: 'track-3', volume: .6, mode: 'next' });
});
test('a new visit starts silent, even if a song was left playing on an earlier visit', () => {
  // An older version kept the song in long-term storage; only volume and mode carry over now.
  assert.deepEqual(musicStateFor('{"track":"track-3","volume":0.6,"mode":"repeat"}', null), { track: null, volume: .6, mode: 'repeat' });
});
test('within one visit the song keeps playing from page to page', () => {
  assert.deepEqual(musicStateFor('{"volume":0.4,"mode":"next"}', '{"track":"track-2"}'), { track: 'track-2', volume: .4, mode: 'next' });
  assert.deepEqual(musicStateFor(null, '{"track":"gone"}'), DEFAULT_MUSIC);
});
test('the playlist moves on in order and wraps after the last song', () => {
  assert.equal(nextTrack('track-1'), 'track-2');
  assert.equal(nextTrack('track-5'), 'track-1');
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
