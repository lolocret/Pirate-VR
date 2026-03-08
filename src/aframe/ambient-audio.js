/* global AFRAME */
/**
 * ambient-audio — Ocean en 3 couches + mouettes procédurales.
 * Démarre dès la première interaction utilisateur.
 */
AFRAME.registerComponent('ambient-audio', {
  schema: {
    masterVolume: { type: 'number', default: 0.9 }
  },

  init: function () {
    this._started = false;
    this._ctx = null;
    this._sources = [];
    this._lfos = [];
    this._seagullTimer = null;

    this._onInteract = () => {
      if (this._started) return;
      this._started = true;
      window.removeEventListener('click', this._onInteract);
      window.removeEventListener('keydown', this._onInteract);
      this._startAudio();
    };
    window.addEventListener('click', this._onInteract);
    window.addEventListener('keydown', this._onInteract);
  },

  _startAudio: function () {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.data.masterVolume;
    master.connect(ctx.destination);
    this._master = master;

    this._buildWaves(ctx, master);
    this._scheduleSeagull(ctx, master);
  },

  // ─── VAGUES : 3 couches indépendantes ───────────────────────────────────
  _buildWaves: function (ctx, dest) {
    // Fabrique un buffer de bruit rose (Voss-McCartney approx.)
    const makePinkNoise = (seconds) => {
      const n = Math.ceil(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
        for (let i = 0; i < n; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179;
          b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.96900 * b2 + w * 0.1538520;
          b3 = 0.86650 * b3 + w * 0.3104856;
          b4 = 0.55000 * b4 + w * 0.5329522;
          b5 = -0.7616 * b5 - w * 0.0168980;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + w * 0.5362) * 0.11;
        }
      }
      return buf;
    };

    // Crée une source loopée + filtre + LFO
    const makeWaveLayer = (buf, filterType, freq, q, gainVal, lfoRate, lfoDepth) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filt = ctx.createBiquadFilter();
      filt.type = filterType;
      filt.frequency.value = freq;
      filt.Q.value = q;

      const gain = ctx.createGain();
      gain.gain.value = gainVal;

      // LFO pour le rythme de vague
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = lfoRate;
      const lfoG = ctx.createGain();
      lfoG.gain.value = lfoDepth;
      lfo.connect(lfoG);
      lfoG.connect(gain.gain);

      src.connect(filt);
      filt.connect(gain);
      gain.connect(dest);

      src.start();
      lfo.start();
      this._sources.push(src);
      this._lfos.push(lfo);
    };

    // Couche 1 — Rumble grave (~100-300 Hz) : fond de l'océan
    const buf8 = makePinkNoise(8);
    makeWaveLayer(buf8, 'lowpass', 260, 0.5, 0.48, 0.085, 0.28);

    // Couche 2 — Swish médium (~300-900 Hz) : déferlante de la vague
    // Phase LFO légèrement décalée pour éviter la synchronisation parfaite
    const buf6 = makePinkNoise(6);
    const src2 = ctx.createBufferSource();
    src2.buffer = buf6;
    src2.loop = true;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 580;
    bpf.Q.value = 1.1;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.22;
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.112;
    const lfoG2 = ctx.createGain();
    lfoG2.gain.value = 0.14;
    lfo2.connect(lfoG2);
    lfoG2.connect(gain2.gain);
    src2.connect(bpf);
    bpf.connect(gain2);
    gain2.connect(dest);
    // Démarrer avec un léger offset pour décaler la phase
    src2.start(ctx.currentTime + 3.5);
    lfo2.start();
    this._sources.push(src2);
    this._lfos.push(lfo2);

    // Couche 3 — Écume haute (~1200-3000 Hz) : sifflement constant et léger
    const buf4 = makePinkNoise(4);
    const src3 = ctx.createBufferSource();
    src3.buffer = buf4;
    src3.loop = true;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 1400;
    const gain3 = ctx.createGain();
    gain3.gain.value = 0.055;
    src3.connect(hpf);
    hpf.connect(gain3);
    gain3.connect(dest);
    src3.start();
    this._sources.push(src3);
  },

  // ─── MOUETTES ────────────────────────────────────────────────────────────
  _scheduleSeagull: function (ctx, dest) {
    const delay = 5000 + Math.random() * 14000;
    this._seagullTimer = setTimeout(() => {
      if (!this._started) return;
      this._playSeagull(ctx, dest);
      this._scheduleSeagull(ctx, dest);
    }, delay);
  },

  _playSeagull: function (ctx, dest) {
    const t = ctx.currentTime + 0.08;
    const cries = 2 + Math.floor(Math.random() * 3);
    const baseFreq = 1100 + Math.random() * 700;

    for (let i = 0; i < cries; i++) {
      const tCry = t + i * 0.52;

      // Deux oscillateurs pour richesse harmonique (fondamentale + quinte)
      [[1.0, 'sawtooth', 0.07], [1.52, 'triangle', 0.028]].forEach(([ratio, type, vol]) => {
        const freq = baseFreq * ratio;
        const osc = ctx.createOscillator();
        osc.type = type;

        // Vibrato naturel
        const vibLfo = ctx.createOscillator();
        vibLfo.frequency.value = 6 + Math.random() * 5;
        const vibDepth = ctx.createGain();
        vibDepth.gain.value = 18 + Math.random() * 20;
        vibLfo.connect(vibDepth);
        vibDepth.connect(osc.frequency);

        // Enveloppe fréquence : cri ascendant puis descente
        osc.frequency.setValueAtTime(freq * 0.90, tCry);
        osc.frequency.linearRampToValueAtTime(freq * 1.20, tCry + 0.08);
        osc.frequency.linearRampToValueAtTime(freq * 1.00, tCry + 0.22);
        osc.frequency.linearRampToValueAtTime(freq * 0.70, tCry + 0.44);

        // Filtre pour retirer les basses
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 700;

        // Enveloppe amplitude
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, tCry);
        g.gain.linearRampToValueAtTime(vol, tCry + 0.04);
        g.gain.setValueAtTime(vol * 0.88, tCry + 0.28);
        g.gain.exponentialRampToValueAtTime(0.0001, tCry + 0.46);

        osc.connect(hpf);
        hpf.connect(g);
        g.connect(dest);

        vibLfo.start(tCry);
        vibLfo.stop(tCry + 0.48);
        osc.start(tCry);
        osc.stop(tCry + 0.48);
      });
    }
  },

  remove: function () {
    window.removeEventListener('click', this._onInteract);
    window.removeEventListener('keydown', this._onInteract);
    if (this._seagullTimer) clearTimeout(this._seagullTimer);
    this._sources.forEach(s => { try { s.stop(); } catch (_) {} });
    this._lfos.forEach(l => { try { l.stop(); } catch (_) {} });
    if (this._ctx) this._ctx.close();
  }
});
