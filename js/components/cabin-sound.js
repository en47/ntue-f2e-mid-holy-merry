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
    creak: () => { tone(520, 0, .16, { type: 'sawtooth', gain: .04, slide: 610 }); tone(610, .05, .12, { type: 'sine', gain: .06, slide: 480 }); },
    click: () => { rustle(0, .03, 3600, 3000, .2); tone(1400, 0, .06, { type: 'square', gain: .05 }); tone(900, .05, .07, { type: 'square', gain: .04 }); },
    thud: () => { tone(140, 0, .22, { type: 'sine', gain: .25, slide: 70 }); rustle(0, .14, 900, 300, .12); },
    open: () => { tone(330, 0, .28, { type: 'triangle', gain: .07, slide: 420 }); rustle(.05, .18, 2600, 1200, .1); },
    jingle: () => { [NOTE.G5, NOTE.C6, NOTE.E6].forEach((note, i) => tone(note, i * .07, .35, { gain: .12 })); },
    // A log catching: a few dry snaps over a low thump. The bellows: one long breath of air.
    crackle: () => { tone(150, 0, .2, { type: 'sine', gain: .12, slide: 90 }); for (let i = 0; i < 6; i++) rustle(.05 + i * .07 + (i % 3) * .015, .03, 3200 + i * 300, 1800, .12); },
    whoosh: () => rustle(0, .5, 380, 1400, .22),
  };
  // The music box's tune, written for this page: a little waltz in C. Unlike the yard's sounds it plays only while the
  // site's music is off (with the music on, the two would clash). It slows as the spring runs down and stops when it has.
  const TUNE = [['E5', 1], ['G5', 1], ['C6', 1], ['B5', 1], ['G5', 1], ['E5', 1], ['F5', 1], ['A5', 1], ['C6', 1], ['B5', 3], ['A5', 1], ['F5', 1], ['D5', 1], ['G5', 1], ['E5', 1], ['C5', 1], ['D5', 1], ['G5', 1], ['B5', 1], ['C6', 3]];
  const PITCH = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5 };
  let tuneTimer = 0;
  const boxReady = () => !on() && start() && (context.state !== 'suspended' || (context.resume().catch(() => {}), true));
  function stopTune() { clearTimeout(tuneTimer); tuneTimer = 0; }
  return {
    // The music box: `wound()` says how wound it is (0–1); a click of its ratchet; whether the site's music is playing.
    tune(wound) {
      stopTune(); let index = 0;
      const step = () => {
        const left = wound();
        if (left <= 0 || !boxReady()) { tuneTimer = 0; return; }
        const [note, beats] = TUNE[index++ % TUNE.length], beat = .3 / (.4 + .6 * left);
        try { tone(PITCH[note], 0, beat * beats * 1.8, { type: 'sine', gain: .2 }); tone(PITCH[note] * 2, 0, beat * .7, { type: 'triangle', gain: .05 }); } catch { /* a missed note is not worth an error */ }
        tuneTimer = setTimeout(step, beat * beats * 1000);
      };
      step();
    },
    tick() { if (boxReady()) try { tone(2600, 0, .03, { type: 'square', gain: .04 }); } catch { /* fine */ } },
    get musicOn() { return on(); },
    play(name) {
      if (!on() || !SOUNDS[name] || !start()) return;
      if (context.state === 'suspended') context.resume().catch(() => {});
      try { SOUNDS[name](); } catch { /* a missed sound is not worth an error */ }
    },
    destroy() { stopTune(); context?.close().catch(() => {}); context = null; },
  };
}
