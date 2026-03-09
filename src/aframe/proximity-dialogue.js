/* global AFRAME */
/**
 * proximity-dialogue — Dialogue séquentiel pirate.
 * Supporte plusieurs messages séparés par " | ".
 * Chaque clic avance au message suivant.
 */
AFRAME.registerComponent('proximity-dialogue', {
  schema: {
    target:       { type: 'selector', default: '#camera-rig' },
    distance:     { type: 'number',   default: 50 },
    text:         { type: 'string',   default: '' },
    messages:     { type: 'string',   default: '' },
    speak:        { type: 'boolean',  default: true },
    voiceLang:    { type: 'string',   default: 'fr-FR' },
    voiceName:    { type: 'string',   default: '' },
    rate:         { type: 'number',   default: 0.9 },
    pitch:        { type: 'number',   default: 1.3 },
    clickToSpeak: { type: 'boolean',  default: true }
  },

  init: function () {
    this._msgIndex  = 0;
    this._speaking  = false;
    this._voice     = null;
    this._visible   = false;

    // Parse messages: "messages" prend le dessus sur "text"
    const raw = this.data.messages || this.data.text || '';
    this._msgs = raw.split(' | ').map(s => s.trim()).filter(Boolean);

    this._buildBubble();

    this._lastClick = 0;
    this.el.classList.add('clickable');
    this.el.setAttribute('clickable', '');
    this._refreshRaycasters = () => {
      const scene = this.el.sceneEl;
      if (!scene) return;
      const rcs = scene.querySelectorAll('[raycaster]');
      rcs.forEach((rcEl) => {
        const rc = rcEl.components && rcEl.components.raycaster;
        if (!rc || !rc.refreshObjects) return;
        // Avoid calling too early while A-Frame is still initializing.
        if (!rcEl.sceneEl || !rcEl.sceneEl.object3D) return;
        try {
          rc.refreshObjects();
        } catch (e) {
          // Safe guard: A-Frame can throw if called during init; ignore.
        }
      });
    };
    if (this.el.sceneEl) {
      this.el.sceneEl.addEventListener('loaded', () => this._refreshRaycasters());
    }
    this.onClick = () => {
      if (this._msgs.length === 0) return;
      const now = Date.now();
      if (now - this._lastClick < 600) return; // debounce anti-double-trigger
      this._lastClick = now;
      this._bubble.setAttribute('visible', 'true');
      // Ensure raycasters see the bubble after it becomes visible.
      setTimeout(() => this._refreshRaycasters(), 0);
      this._showMessage(this._msgIndex);
    };
    this.el.addEventListener('click', this.onClick);
    if (this._bubble) this._bubble.addEventListener('click', this.onClick);
    this._refreshRaycasters();

    // Voix TTS
    this._pickVoice = () => {
      if (!window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices() || [];
      if (!voices.length) return;
      if (this.data.voiceName) {
        this._voice = voices.find(v => v.name === this.data.voiceName) || null;
        if (this._voice) return;
      }
      const lang = this.data.voiceLang;
      const byLang = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
      const femRx = /(female|femme|amelie|aur[eé]lie|juliette|marie|siri|thomas)/i;
      this._voice = byLang.find(v => femRx.test(v.name)) || byLang[0] || voices[0] || null;
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', this._pickVoice);
      this._pickVoice();
    }
  },

  _buildBubble: function () {
    const panel = document.createElement('a-entity');
    panel.setAttribute('position', '0 2.1 -0.8');
    panel.setAttribute('scale', '1.00 1.00 1.00');
    panel.setAttribute('visible', 'false');
    panel.classList.add('clickable');
    panel.setAttribute('clickable', '');
    panel.setAttribute('look-at', '#camera-rig');
    this._bubble = panel;

    // Glow bronze
    const glow = document.createElement('a-plane');
    glow.setAttribute('width', '4.8');
    glow.setAttribute('height', '2.4');
    glow.setAttribute('material', 'shader: flat; color: #9b6b2e; opacity: 0.12; transparent: true');
    panel.appendChild(glow);

    // Bordure laiton
    const border = document.createElement('a-plane');
    border.setAttribute('width', '4.55');
    border.setAttribute('height', '2.22');
    border.setAttribute('position', '0 0 0.005');
    border.setAttribute('material', 'shader: flat; color: #c79b3d; opacity: 0.95; transparent: true');
    panel.appendChild(border);

    // Fond bois sombre
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '4.38');
    bg.setAttribute('height', '2.08');
    bg.setAttribute('position', '0 0 0.01');
    bg.setAttribute('material', 'shader: flat; color: #1c140c; opacity: 0.96; transparent: true');
    panel.appendChild(bg);

    // Barre accent haut
    const topBar = document.createElement('a-plane');
    topBar.setAttribute('width', '4.38');
    topBar.setAttribute('height', '0.055');
    topBar.setAttribute('position', '0 1.013 0.015');
    topBar.setAttribute('material', 'shader: flat; color: #c79b3d; opacity: 1');
    panel.appendChild(topBar);

    // Coins décoratifs
    [[-2.12, 0.97], [2.12, 0.97], [-2.12, -0.97], [2.12, -0.97]].forEach(([x, y]) => {
      const c = document.createElement('a-plane');
      c.setAttribute('width', '0.09');
      c.setAttribute('height', '0.09');
      c.setAttribute('position', `${x} ${y} 0.02`);
      c.setAttribute('material', 'shader: flat; color: #e3c070; opacity: 1');
      panel.appendChild(c);
    });

    const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
    const fontUrl = `${base}fonts/DejaVuSans-msdf.fnt?v=3`;

    // Header : nom du personnage
    const nameEl = document.createElement('a-text');
    nameEl.setAttribute('value', '\u2756 CHING SHIH \u2014 Capitaine de la Flotte Rouge \u2756');
    nameEl.setAttribute('color', '#d2b065');
    nameEl.setAttribute('align', 'center');
    nameEl.setAttribute('width', '7');
    nameEl.setAttribute('position', '0 0.78 0.02');
    nameEl.setAttribute('scale', '0.50 0.50 0.50');
    nameEl.setAttribute('font', fontUrl);
    panel.appendChild(nameEl);

    // Séparateur
    const sep = document.createElement('a-plane');
    sep.setAttribute('width', '3.8');
    sep.setAttribute('height', '0.008');
    sep.setAttribute('position', '0 0.59 0.02');
    sep.setAttribute('material', 'shader: flat; color: #3b2a16; opacity: 1');
    panel.appendChild(sep);

    // Texte principal du message
    this._textEl = document.createElement('a-text');
    this._textEl.setAttribute('value', '');
    this._textEl.setAttribute('color', '#f1e6cf');
    this._textEl.setAttribute('align', 'center');
    this._textEl.setAttribute('width', '7.2');
    this._textEl.setAttribute('wrap-count', '50');
    this._textEl.setAttribute('position', '0 0.08 0.02');
    this._textEl.setAttribute('scale', '0.60 0.60 0.60');
    this._textEl.setAttribute('font', fontUrl);
    panel.appendChild(this._textEl);

    // Séparateur bas
    const sep2 = document.createElement('a-plane');
    sep2.setAttribute('width', '3.8');
    sep2.setAttribute('height', '0.008');
    sep2.setAttribute('position', '0 -0.66 0.02');
    sep2.setAttribute('material', 'shader: flat; color: #3b2a16; opacity: 1');
    panel.appendChild(sep2);

    // Indicateur de progression
    this._progressEl = document.createElement('a-text');
    this._progressEl.setAttribute('value', '');
    this._progressEl.setAttribute('color', '#b18a4a');
    this._progressEl.setAttribute('align', 'center');
    this._progressEl.setAttribute('width', '5');
    this._progressEl.setAttribute('position', '0 -0.78 0.02');
    this._progressEl.setAttribute('scale', '0.40 0.40 0.40');
    this._progressEl.setAttribute('font', fontUrl);
    panel.appendChild(this._progressEl);

    // Hint "cliquer pour continuer"
    this._hintEl = document.createElement('a-text');
    this._hintEl.setAttribute('value', '');
    this._hintEl.setAttribute('color', '#8a6a34');
    this._hintEl.setAttribute('align', 'center');
    this._hintEl.setAttribute('width', '5');
    this._hintEl.setAttribute('position', '0 -0.94 0.02');
    this._hintEl.setAttribute('scale', '0.36 0.36 0.36');
    this._hintEl.setAttribute('font', fontUrl);
    panel.appendChild(this._hintEl);

    this.el.appendChild(panel);
  },

  _showMessage: function (idx) {
    if (!this._msgs.length) return;
    this._msgIndex = idx;
    const msg   = this._msgs[idx];
    const total = this._msgs.length;
    const isLast = idx === total - 1;

    this._textEl.setAttribute('value', msg);
    this._progressEl.setAttribute('value', `${idx + 1} / ${total}`);
    this._hintEl.setAttribute('value', isLast ? '[ Cliquez pour fermer ]' : '[ Cliquez pour continuer \u25B6 ]');

    // Avancer l'index pour le prochain clic
    if (!isLast) {
      this._msgIndex = idx + 1;
    } else {
      // Dernier message : prochain clic ferme
      this._msgIndex = -1;
    }

    if (this._msgIndex === -1) {
      // Prochain clic fermera
      this.el.removeEventListener('click', this.onClick);
      this.onClick = () => {
        const now = Date.now();
        if (now - this._lastClick < 600) return;
        this._lastClick = now;
        this._bubble.setAttribute('visible', 'false');
        this.stopSpeech();
        this._msgIndex = 0;
        this.el.removeEventListener('click', this.onClick);
        this.onClick = () => {
          const t = Date.now();
          if (t - this._lastClick < 600) return;
          this._lastClick = t;
          this._bubble.setAttribute('visible', 'true');
          this._showMessage(0);
        };
        this.el.addEventListener('click', this.onClick);
      };
      this.el.addEventListener('click', this.onClick);
    }

    this._speakText(msg);
  },

  _speakText: function (text) {
    if (!this.data.speak || !window.speechSynthesis) return;
    if (!text.trim()) return;
    this.stopSpeech();
    const utter = new SpeechSynthesisUtterance(text);
    if (this._voice) utter.voice = this._voice;
    utter.lang  = this.data.voiceLang;
    utter.rate  = this.data.rate;
    utter.pitch = this.data.pitch;
    utter.onend   = () => { this._speaking = false; };
    utter.onerror = () => { this._speaking = false; };
    this._speaking = true;
    window.speechSynthesis.speak(utter);
  },

  stopSpeech: function () {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    this._speaking = false;
  },

  tick: function () {
    // Ferme si on s'éloigne trop
    if (!this.data.target || !this.data.target.object3D) return;
    const a = this.el.object3D.position;
    const b = this.data.target.object3D.position;
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const inRange = dist <= this.data.distance;
    if (!inRange && this._visible) {
      this._visible = false;
      this._bubble.setAttribute('visible', 'false');
      this.stopSpeech();
    }
    this._visible = this._bubble.getAttribute('visible') === 'true';
  },

  remove: function () {
    this.el.removeEventListener('click', this.onClick);
    if (this._bubble) this._bubble.removeEventListener('click', this.onClick);
    if (window.speechSynthesis) {
      window.speechSynthesis.removeEventListener('voiceschanged', this._pickVoice);
    }
  }
});
