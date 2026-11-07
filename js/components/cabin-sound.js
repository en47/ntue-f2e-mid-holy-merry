// Small paper-and-bell sounds for the games in Santa's yard, made on the spot with Web Audio: no files to download.
// They follow the site's music switch (music-player.js marks the widget data-music="playing"): with the music off, or the
// browser still holding it, the yard stays silent too. Volume follows the music's volume slider.
const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };

export function createSound(widget = document.querySelector('.music-widget'), audio = document.querySelector('#site-audio')) {
  let context = null, noise = null;
  const on = () => widget?.dataset.music === 'playing';
  function start() {
    if (context) return context;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    context = new Context();
    // Half a second of soft noise, shared by the rustles and the shaker.
    noise = context.createBuffer(1, context.sampleRate / 2, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    return context;
  }
  const level = () => Math.min(1, Math.max(0, Number(audio?.volume ?? .3))) * .55;
  // A short tone that rings and fades, like a tiny bell or a plucked string.
  function tone(frequency, at, length, { type = 'triangle', gain = .22, slide } = {}) {
    const oscillator = context.createOscillator(), volume = context.createGain(), time = context.currentTime + at;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, time);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(slide, time + length);
    volume.gain.setValueAtTime(0, time); volume.gain.linearRampToValueAtTime(gain * level(), time + .012); volume.gain.exponentialRampToValueAtTime(.0001, time + length);
    oscillator.connect(volume).connect(context.destination); oscillator.start(time); oscillator.stop(time + length + .05);
  }
  // A brush of paper: noise through a band filter that sweeps.
  function rustle(at, length, from, to, gain = .18) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), volume = context.createGain(), time = context.currentTime + at;
    source.buffer = noise; filter.type = 'bandpass'; filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(from, time); filter.frequency.exponentialRampToValueAtTime(to, time + length);
    volume.gain.setValueAtTime(gain * level(), time); volume.gain.exponentialRampToValueAtTime(.0001, time + length);
    source.connect(filter).connect(volume).connect(context.destination); source.start(time); source.stop(time + length + .05);
  }
  const SOUNDS = {
    pick: () => rustle(0, .09, 2400, 4200, .12),
    snap: () => { rustle(0, .05, 3000, 1800, .1); tone(NOTE.E6, .02, .18, { gain: .16 }); tone(NOTE.A5 * 2, .07, .22, { gain: .12 }); },
    remove: () => rustle(0, .16, 4200, 1400, .14),
    nope: () => { tone(NOTE.E5, 0, .16, { type: 'sine', gain: .14 }); tone(NOTE.C5, .11, .22, { type: 'sine', gain: .12 }); },
    drop: () => tone(220, 0, .14, { type: 'sine', gain: .18, slide: 160 }),
    cheer: () => { [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7].forEach((note, i) => tone(note, i * .09, .5, { gain: .13 })); for (let i = 0; i < 4; i++) rustle(.05 + i * .1, .06, 6000, 7000, .05); },
    chew: () => { for (let i = 0; i < 3; i++) rustle(i * .16, .07, 1100, 520, .2); },
    happy: () => { tone(NOTE.E5, 0, .14, { type: 'sine', gain: .14, slide: NOTE.A5 }); tone(NOTE.A5, .15, .2, { type: 'sine', gain: .14, slide: NOTE.E6 }); },
    refuse: () => { tone(300, 0, .18, { type: 'sine', gain: .15, slide: 260 }); tone(280, .2, .26, { type: 'sine', gain: .13, slide: 220 }); },
    jingle: () => { [NOTE.G5, NOTE.C6, NOTE.E6].forEach((note, i) => tone(note, i * .07, .35, { gain: .12 })); },
  };
  return {
    play(name) {
      if (!on() || !SOUNDS[name] || !start()) return;
      if (context.state === 'suspended') context.resume().catch(() => {});
      try { SOUNDS[name](); } catch { /* a missed sound is not worth an error */ }
    },
    destroy() { context?.close().catch(() => {}); context = null; },
  };
}
