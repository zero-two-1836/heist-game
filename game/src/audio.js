// Velvet Fox — all sound is synthesised with WebAudio: no audio files, no
// network. A tiny two-oscillator blip kit, muted until the player first acts.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    pickup() { tone(880, 0.12, 'sine', 0.16); tone(1318, 0.18, 'sine', 0.14, 0.07); },
    coin() { tone(1568, 0.08, 'triangle', 0.12); tone(1046, 0.1, 'triangle', 0.1, 0.05); },
    coinToss() { tone(700, 0.09, 'square', 0.05, 0, 1400); },
    spotted() { tone(220, 0.28, 'sawtooth', 0.16, 0, 440); tone(220, 0.28, 'sawtooth', 0.16, 0.3, 440); },
    laser() { tone(1800, 0.15, 'square', 0.08, 0, 300); },
    caught() { tone(330, 0.5, 'sawtooth', 0.18, 0, 82); tone(165, 0.6, 'sawtooth', 0.14, 0.15, 55); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.16, i * 0.11)); },
    click() { tone(600, 0.05, 'triangle', 0.08); },
  };
}
