// Site music: the listener's song and volume follow them across pages; browsers may still hold the sound until their first gesture.
import { MUSIC_TRACKS, nextTrack, parseMusicPosition, parseMusicState } from '../data/music-tracks.js';
import { holly, paperLayer, shape } from './paper-art.js';

const STATE_KEY = 'holy-merry:music:v1', POSITION_KEY = 'holy-merry:music:position';
const OFF_OPTION = { id: '', title: '關閉音樂' };
const read = (store, key) => { try { return store.getItem(key); } catch { return null; } };
const write = (store, key, value) => { try { store.setItem(key, value); } catch { /* Remembering is a convenience only. */ } };
const source = id => new URL(`../../assets/audio/${id}.mp3`, import.meta.url).href;
const titleOf = id => MUSIC_TRACKS.find(track => track.id === id)?.title;

function drawNotes(parent) {
  shape('path', { d: 'M61 18V54M31 25V59', fill: 'none', stroke: '#ad3c3b', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, parent);
  shape('path', { d: 'M31 24 61 17V26L31 33Z', fill: '#ad3c3b' }, parent);
  shape('ellipse', { cx: 24, cy: 60, rx: 8.5, ry: 6.5, fill: '#ad3c3b', transform: 'rotate(-16 24 60)' }, parent);
  shape('ellipse', { cx: 54, cy: 55, rx: 8.5, ry: 6.5, fill: '#ad3c3b', transform: 'rotate(-16 54 55)' }, parent);
}
function drawFloat(parent) {
  shape('path', { d: 'M12 4V19', fill: 'none', stroke: '#d9a441', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, parent);
  shape('path', { d: 'M12 4C14 8 19 8 19 13', fill: 'none', stroke: '#d9a441', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, parent);
  shape('ellipse', { cx: 8, cy: 20, rx: 5, ry: 3.8, fill: '#d9a441' }, parent);
}
// Each piece is rasterised once; playing only moves these layers.
function buildBadge(toggle) {
  if (toggle.querySelector('.music-badge')) return;
  toggle.replaceChildren();
  const paper = { paper: { grain: .6, shadow: .26 }, eager: true };
  paperLayer(toggle, '-16 -16 116 116', 'music-badge', parent => {
    shape('circle', { cx: 42, cy: 45, r: 40, fill: '#dccaa9' }, parent);
    shape('circle', { cx: 42, cy: 42, r: 40, fill: '#fbf3df' }, parent);
    shape('circle', { cx: 42, cy: 42, r: 34, fill: 'none', stroke: '#ad3c3b', 'stroke-opacity': .55, 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }, parent);
    holly(parent, 66, 16, .5);
  }, paper);
  paperLayer(toggle, '-16 -16 116 116', 'music-note', drawNotes, paper);
  paperLayer(toggle, '-16 -16 116 116', 'music-slash', parent => shape('path', { d: 'M18 70 66 16', fill: 'none', stroke: '#87302f', 'stroke-width': 5, 'stroke-linecap': 'round' }, parent), paper);
  const float = paperLayer(toggle, '-5 -5 36 36', 'music-float music-float-a', drawFloat, paper);
  const second = float.cloneNode(true); second.className = 'art-layer music-float music-float-b'; toggle.append(second);
}
function buildOptions(host) {
  if (host.children.length) return;
  for (const { id, title } of [...MUSIC_TRACKS, OFF_OPTION]) {
    const label = document.createElement('label'), input = document.createElement('input'), name = document.createElement('span'), bars = document.createElement('i');
    label.className = 'music-option'; input.type = 'radio'; input.name = 'music-track'; input.value = id;
    name.textContent = title; bars.className = 'music-bars'; bars.setAttribute('aria-hidden', 'true');
    label.append(input, name, bars); host.append(label);
  }
}

export function mountMusic() {
  const widget = document.querySelector('.music-widget'), toggle = document.querySelector('#music-toggle'), panel = document.querySelector('#music-panel');
  const audio = document.querySelector('#site-audio'), options = document.querySelector('#music-options'), status = document.querySelector('#music-status'), volume = document.querySelector('#music-volume');
  const events = new AbortController(), { signal } = events;
  let state = parseMusicState(read(localStorage, STATE_KEY)), gesture = null;
  buildBadge(toggle); buildOptions(options);
  audio.volume = volume.value = state.volume;
  const modes = document.querySelector('#music-modes');
  audio.loop = state.mode === 'repeat';
  modes.querySelector(`[value="${state.mode}"]`).checked = true;

  const save = () => write(localStorage, STATE_KEY, JSON.stringify(state));
  const savePosition = () => { if (state.track) write(sessionStorage, POSITION_KEY, JSON.stringify({ track: state.track, time: audio.currentTime })); };
  function show(view, message, label) {
    widget.dataset.music = view; status.textContent = message; toggle.setAttribute('aria-label', label);
    for (const input of options.querySelectorAll('input')) {
      input.checked = input.value === (state.track ?? '');
      input.closest('label').classList.toggle('is-current', input.checked);
    }
  }
  const showOff = () => show('off', '音樂已關閉。', '音樂已關閉，開啟音樂選單');
  // Autoplay rules are normal here, so the song simply waits for the next tap or key press.
  function waitForGesture() {
    gesture?.abort(); gesture = new AbortController();
    const resume = () => { gesture.abort(); start(); };
    for (const type of ['pointerup', 'keydown']) document.addEventListener(type, resume, { signal: gesture.signal });
    show('waiting', `點一下畫面，就會繼續播放《${titleOf(state.track)}》。`, `《${titleOf(state.track)}》等待播放，開啟音樂選單`);
  }
  async function start() {
    gesture?.abort();
    const track = state.track;
    try {
      await audio.play();
      if (track === state.track) show('playing', `正在播放：${titleOf(track)}`, `正在播放《${titleOf(track)}》，開啟音樂選單`);
    } catch (error) {
      if (error.name === 'NotAllowedError' && track === state.track) waitForGesture();
      else if (error.name !== 'AbortError') console.warn('Music could not start', error);
    }
  }
  function load(id, time) {
    audio.src = source(id);
    if (time) audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.min(time, audio.duration || time); }, { once: true, signal });
    start();
  }
  function choose(id) {
    state = { ...state, track: id || null }; save();
    if (id) { show('waiting', `正在載入：${titleOf(id)}`, `正在載入《${titleOf(id)}》`); load(id, 0); return; }
    gesture?.abort(); audio.pause(); audio.removeAttribute('src'); audio.load(); showOff();
  }
  const setPanel = open => { panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); };
  toggle.addEventListener('click', () => setPanel(panel.hidden), { signal });
  options.addEventListener('change', event => choose(event.target.value), { signal });
  modes.addEventListener('change', event => { state = { ...state, mode: event.target.value }; audio.loop = state.mode === 'repeat'; save(); }, { signal });
  audio.addEventListener('ended', () => { if (state.track) choose(nextTrack(state.track)); }, { signal });
  volume.addEventListener('input', () => { audio.volume = state.volume = Number(volume.value); save(); }, { signal });
  audio.addEventListener('error', () => { if (state.track) show('off', `《${titleOf(state.track)}》暫時無法播放，請換一首。`, '音樂無法播放，開啟音樂選單'); }, { signal });
  document.addEventListener('pointerdown', event => { if (!panel.hidden && !widget.contains(event.target)) setPanel(false); }, { capture: true, signal });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { setPanel(false); toggle.focus(); } }, { signal });

  if (state.track) { waitForGesture(); load(state.track, parseMusicPosition(read(sessionStorage, POSITION_KEY), state.track)); }
  else showOff();
  return { destroy() { savePosition(); audio.pause(); gesture?.abort(); events.abort(); } };
}
