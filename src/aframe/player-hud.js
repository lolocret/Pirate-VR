/* global AFRAME */
/**
 * player-hud — Vies du joueur avec cœurs, thème pirate.
 * Écoute l'événement "player-damage" sur la scène pour perdre une vie.
 */
AFRAME.registerComponent('player-hud', {
  schema: {
    maxLives: { type: 'number', default: 3 }
  },

  init: function () {
    const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
    const fontUrl = `${base}fonts/DejaVuSans-msdf.fnt?v=3`;
    this._lives = this.data.maxLives;

    const panel = document.createElement('a-entity');
    panel.setAttribute('position', '-0.235 0.198 -0.56');

    // ── Glow extérieur (simule blur/frosted glass) ──────────────────────
    const glow = document.createElement('a-plane');
    glow.setAttribute('width', '0.255');
    glow.setAttribute('height', '0.085');
    glow.setAttribute('material', 'shader: flat; color: #8b6a2d; opacity: 0.14; transparent: true');

    // ── Bordure or ──────────────────────────────────────────────────────
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.240');
    border.setAttribute('height', '0.072');
    border.setAttribute('position', '0 0 0.001');
    border.setAttribute('material', 'shader: flat; color: #d0a34a; opacity: 0.95; transparent: true');

    // ── Fond sombre (bleu nuit pirate) ──────────────────────────────────
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.228');
    bg.setAttribute('height', '0.060');
    bg.setAttribute('position', '0 0 0.002');
    bg.setAttribute('material', 'shader: flat; color: #1a120a; opacity: 0.96; transparent: true');

    // ── Barre dorée en haut ─────────────────────────────────────────────
    const topBar = document.createElement('a-plane');
    topBar.setAttribute('width', '0.228');
    topBar.setAttribute('height', '0.0045');
    topBar.setAttribute('position', '0 0.028 0.003');
    topBar.setAttribute('material', 'shader: flat; color: #e3be62; opacity: 1');

    // ── Points décoratifs aux 4 coins ───────────────────────────────────
    [[-0.108, 0.024], [0.108, 0.024], [-0.108, -0.024], [0.108, -0.024]].forEach(([x, y]) => {
      const dot = document.createElement('a-plane');
      dot.setAttribute('width', '0.007');
      dot.setAttribute('height', '0.007');
      dot.setAttribute('position', `${x} ${y} 0.003`);
      dot.setAttribute('material', 'shader: flat; color: #e3be62; opacity: 1');
      panel.appendChild(dot);
    });

    // ── Label "VIE" ──────────────────────────────────────────────────────
    const label = document.createElement('a-text');
    label.setAttribute('value', 'VIES');
    label.setAttribute('color', '#e0c07a');
    label.setAttribute('align', 'right');
    label.setAttribute('position', '0.095 0.011 0.004');
    label.setAttribute('scale', '0.036 0.036 0.036');
    label.setAttribute('width', '5');
    label.setAttribute('font', fontUrl);

    // ── Cœurs ─────────────────────────────────────────────────────────
    this._heartsEl = document.createElement('a-text');
    this._heartsEl.setAttribute('value', this._buildHeartString(this._lives));
    this._heartsEl.setAttribute('color', '#d64b3a');
    this._heartsEl.setAttribute('align', 'left');
    this._heartsEl.setAttribute('position', '-0.095 -0.008 0.004');
    this._heartsEl.setAttribute('scale', '0.068 0.068 0.068');
    this._heartsEl.setAttribute('width', '4');
    this._heartsEl.setAttribute('font', fontUrl);

    panel.appendChild(glow);
    panel.appendChild(border);
    panel.appendChild(bg);
    panel.appendChild(topBar);
    panel.appendChild(label);
    panel.appendChild(this._heartsEl);
    this.el.appendChild(panel);

    // ── Flash rouge plein écran (attaché à la caméra) ────────────────────
    this._flash = document.createElement('a-plane');
    this._flash.setAttribute('width',  '2');
    this._flash.setAttribute('height', '2');
    this._flash.setAttribute('position', '0 0 -0.08');
    this._flash.setAttribute('material', 'shader: flat; color: #cc0000; opacity: 0; transparent: true; depthTest: false');
    this._flash.setAttribute('visible', 'false');
    this.el.appendChild(this._flash);
    this._flashTimer = null;

    this.onDamage = () => {
      this._setLives(this._lives - 1);
      this._triggerFlash();
    };
    this.onHeal = () => this._setLives(this._lives + 1);

    if (this.el.sceneEl) {
      this.el.sceneEl.addEventListener('player-damage', this.onDamage);
      this.el.sceneEl.addEventListener('player-heal',   this.onHeal);
    }
  },

  _triggerFlash: function () {
    if (this._flashTimer) { clearTimeout(this._flashTimer); this._flashTimer = null; }
    this._flash.setAttribute('visible', 'true');
    this._flash.setAttribute('material', 'shader: flat; color: #cc0000; opacity: 0.55; transparent: true; depthTest: false');
    this._flashTimer = setTimeout(() => {
      this._flash.setAttribute('material', 'shader: flat; color: #cc0000; opacity: 0.28; transparent: true; depthTest: false');
      setTimeout(() => {
        this._flash.setAttribute('material', 'shader: flat; color: #cc0000; opacity: 0.08; transparent: true; depthTest: false');
        setTimeout(() => {
          this._flash.setAttribute('visible', 'false');
          this._flashTimer = null;
        }, 220);
      }, 220);
    }, 320);
  },

  _buildHeartString: function (lives) {
    let s = '';
    for (let i = 0; i < this.data.maxLives; i++) {
      s += i < lives ? '\u2665' : '\u2661';
      if (i < this.data.maxLives - 1) s += '  ';
    }
    return s;
  },

  _setLives: function (n) {
    this._lives = Math.max(0, Math.min(this.data.maxLives, n));
    this._heartsEl.setAttribute('value', this._buildHeartString(this._lives));
    // Rouge → orange → rouge clignotant si critique
    const color = this._lives > 1 ? '#d64b3a' : '#ff8a2a';
    this._heartsEl.setAttribute('color', color);
  },

  remove: function () {
    if (this.el.sceneEl) {
      this.el.sceneEl.removeEventListener('player-damage', this.onDamage);
      this.el.sceneEl.removeEventListener('player-heal',   this.onHeal);
    }
  }
});
