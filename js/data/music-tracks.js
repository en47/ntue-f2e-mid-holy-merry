// Background music for the whole site; the title is what the menu shows.
export const MUSIC_TRACKS = [
  { id: 'track-1', title: '聖誕頌歌' }, { id: 'track-2', title: '平安夜' }, { id: 'track-3', title: '聖誕故事' },
  { id: 'track-4', title: '壁爐暖冬' }, { id: 'track-5', title: '聖誕快樂' },
];
export const MUSIC_MODES = ['next', 'repeat'];
export const DEFAULT_MUSIC = { track: null, volume: .3, mode: 'next' };
const isTrack = id => MUSIC_TRACKS.some(track => track.id === id);

// `track: null` means the music is off. Damaged or outdated storage falls back to silence, never to a surprise song.
export function parseMusicState(raw) {
  try {
    const { track, volume, mode } = JSON.parse(raw);
    return { track: isTrack(track) ? track : null, volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_MUSIC.volume, mode: MUSIC_MODES.includes(mode) ? mode : DEFAULT_MUSIC.mode };
  } catch { return { ...DEFAULT_MUSIC }; }
}
// Volume and play mode are kept for good; the song itself only lasts one visit (one tab), so every new visit starts silent.
// Songs saved long-term by older versions are ignored, which turns returning visitors' music off as the FAQ promises.
export function musicStateFor(keptRaw, visitRaw) {
  const { volume, mode } = parseMusicState(keptRaw);
  return { track: parseMusicState(visitRaw).track, volume, mode };
}
// The playlist wraps, so "next" keeps playing after the last song.
export const nextTrack = id => MUSIC_TRACKS[(MUSIC_TRACKS.findIndex(track => track.id === id) + 1) % MUSIC_TRACKS.length].id;
export function parseMusicPosition(raw, track) {
  try {
    const { track: saved, time } = JSON.parse(raw);
    return saved === track && Number.isFinite(time) && time > 0 ? time : 0;
  } catch { return 0; }
}
