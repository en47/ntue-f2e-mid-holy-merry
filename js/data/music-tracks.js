// Background music for the whole site; the title is what the menu shows.
export const MUSIC_TRACKS = [
  { id: 'track-1', title: '聖誕頌歌' }, { id: 'track-2', title: '平安夜' }, { id: 'track-3', title: '聖誕故事' },
  { id: 'track-4', title: '壁爐暖冬' }, { id: 'track-5', title: '聖誕快樂' },
];
export const DEFAULT_MUSIC = { track: null, volume: .3 };
const isTrack = id => MUSIC_TRACKS.some(track => track.id === id);

// `track: null` means the music is off. Damaged or outdated storage falls back to silence, never to a surprise song.
export function parseMusicState(raw) {
  try {
    const { track, volume } = JSON.parse(raw);
    return { track: isTrack(track) ? track : null, volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_MUSIC.volume };
  } catch { return { ...DEFAULT_MUSIC }; }
}
export function parseMusicPosition(raw, track) {
  try {
    const { track: saved, time } = JSON.parse(raw);
    return saved === track && Number.isFinite(time) && time > 0 ? time : 0;
  } catch { return 0; }
}
