/**
 * audio-fx.js — Sons procéduraux via Web Audio API.
 * Aucun fichier audio requis.
 */

let _ctx = null;

function getCtx () {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function makeNoise (ctx, duration) {
  const size = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}

/** Tir de canon — boom grave */
export function playCannonFire () {
  const c = getCtx();
  const t = c.currentTime;

  // Sub boom (très grave)
  const sub = c.createOscillator();
  const gSub = c.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(55, t);
  sub.frequency.exponentialRampToValueAtTime(22, t + 0.65);
  gSub.gain.setValueAtTime(2.2, t);
  gSub.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
  sub.connect(gSub);
  gSub.connect(c.destination);
  sub.start(t);
  sub.stop(t + 0.7);

  // Oscillateur grave qui descend
  const osc = c.createOscillator();
  const gOsc = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(32, t + 0.6);
  gOsc.gain.setValueAtTime(1.6, t);
  gOsc.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.connect(gOsc);
  gOsc.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.65);

  // Transient sec (claque)
  const crack = c.createOscillator();
  const gCrack = c.createGain();
  crack.type = 'square';
  crack.frequency.setValueAtTime(620, t);
  crack.frequency.exponentialRampToValueAtTime(180, t + 0.08);
  gCrack.gain.setValueAtTime(0.6, t);
  gCrack.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  crack.connect(gCrack);
  gCrack.connect(c.destination);
  crack.start(t);
  crack.stop(t + 0.09);

  // Bruit de poudre (plus large)
  const noise = makeNoise(c, 0.45);
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 520;
  const gNoise = c.createGain();
  gNoise.gain.setValueAtTime(1.3, t);
  gNoise.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  noise.connect(filt);
  filt.connect(gNoise);
  gNoise.connect(c.destination);
  noise.start(t);
}

/** Impact sur un monstre */
export function playHit () {
  const c = getCtx();
  const t = c.currentTime;

  const noise = makeNoise(c, 0.18);
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = 700;
  filt.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  noise.connect(filt);
  filt.connect(gain);
  gain.connect(c.destination);
  noise.start(t);

  // Petit click métallique
  const click = c.createOscillator();
  const gClick = c.createGain();
  click.type = 'square';
  click.frequency.setValueAtTime(480, t);
  click.frequency.exponentialRampToValueAtTime(120, t + 0.06);
  gClick.gain.setValueAtTime(0.25, t);
  gClick.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  click.connect(gClick);
  gClick.connect(c.destination);
  click.start(t);
  click.stop(t + 0.07);
}

/** Mort d'un monstre — explosion dramatique */
export function playKill () {
  const c = getCtx();
  const t = c.currentTime;

  // Boom profond
  const osc = c.createOscillator();
  const gOsc = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(18, t + 1.1);
  gOsc.gain.setValueAtTime(2.2, t);
  gOsc.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  osc.connect(gOsc);
  gOsc.connect(c.destination);
  osc.start(t);
  osc.stop(t + 1.2);

  // Longue traîne de bruit grave
  const noise = makeNoise(c, 1.0);
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 500;
  const gNoise = c.createGain();
  gNoise.gain.setValueAtTime(1.5, t);
  gNoise.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  noise.connect(filt);
  filt.connect(gNoise);
  gNoise.connect(c.destination);
  noise.start(t);

  // Harmonique perçant
  const osc2 = c.createOscillator();
  const gOsc2 = c.createGain();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(320, t);
  osc2.frequency.exponentialRampToValueAtTime(60, t + 0.4);
  gOsc2.gain.setValueAtTime(0.5, t);
  gOsc2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc2.connect(gOsc2);
  gOsc2.connect(c.destination);
  osc2.start(t);
  osc2.stop(t + 0.45);
}

/** Activation / désactivation du zoom télescope */
export function playTelescopeZoom (on) {
  const c = getCtx();
  const t = c.currentTime;
  const dur = on ? 0.22 : 0.16;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  if (on) {
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + dur);
  } else {
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + dur);
  }
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Trésor découvert — mélodie de victoire */
export function playTreasureFound () {
  const c = getCtx();
  const t = c.currentTime;

  // Arpège majeur : C5, E5, G5, C6 + accord final
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = t + i * 0.13;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.35, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });

  // Shimmer final (accord complet)
  const chordNotes = [523.25, 659.25, 783.99];
  const chordStart = t + notes.length * 0.13 + 0.05;
  chordNotes.forEach(freq => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, chordStart);
    gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.7);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(chordStart);
    osc.stop(chordStart + 0.75);
  });
}
