/* global AFRAME */
/**
 * mission-hud — HUD contextuel thème pirate authentique.
 * Palette : bois sombre chaud, laiton doré, texte parchemin.
 */
AFRAME.registerComponent('mission-hud', {
  schema: {
    rig: { type: 'selector', default: '#camera-rig' }
  },

  init: function () {
    const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
    this._fontUrl = `${base}fonts/DejaVu-sdf.fnt`;
    this._zones = [
      {
        pos: { x: 0, y: 65, z: -135 }, tol: 18,
        accentColor: '#5b9fd4',
        tag: 'DEPART',
        title: 'Parlez a Ching Shih',
        desc: 'La legende des mers vous attend.\nCliquez sur elle pour recevoir vos ordres.',
        ctrl: 'Clic souris  \u2022  Gachette droite'
      },
      {
        pos: { x: 2, y: 145, z: -82 }, tol: 14,
        accentColor: '#5aaa6a',
        tag: 'TELESCOPE',
        title: 'Reperez le tresor enfoui',
        desc: 'Sortez la longue-vue et zoomez\nvers l\u2019horizon pour decouvrir le coffre.',
        ctrl: 'Clic droit ou Z  \u2022  Gachette droite'
      },
      {
        pos: { x: 27, y: 61, z: -55 }, tol: 10,
        accentColor: '#d43028',
        tag: 'COMBAT',
        title: 'Eliminez le Kraken !',
        desc: 'Visez le Kraken et tirez. Plusieurs coups\nnecessaires. Il contre-attaque !',
        ctrl: 'Espace ou Clic gauche  \u2022  Gachette droite'
      },
      {
        pos: { x: 4, y: 64, z: -32 }, tol: 10,
        accentColor: '#d4822a',
        tag: 'NAVIGATION',
        title: 'Consultez votre carte',
        desc: 'Ouvrez la carte sur votre main gauche\npour choisir votre prochaine destination.',
        ctrl: 'Bouton X  \u2022  Controleur gauche'
      }
    ];

    this._currentZone = null;
    this._done = false;

    const W = 0.700;
    const H = 0.145;

    this._panel = document.createElement('a-entity');
    this._panel.setAttribute('position', '0 -0.238 -0.565');
    this._panel.setAttribute('visible', 'false');

    // ── Halo ambiant chaud ───────────────────────────────────────────────
    const halo = document.createElement('a-plane');
    halo.setAttribute('width',  `${W + 0.060}`);
    halo.setAttribute('height', `${H + 0.040}`);
    halo.setAttribute('material', 'shader: flat; color: #8b5a1a; opacity: 0.20; transparent: true');
    this._panel.appendChild(halo);

    // ── Bordure extérieure laiton foncé ──────────────────────────────────
    const border1 = document.createElement('a-plane');
    border1.setAttribute('width',  `${W + 0.022}`);
    border1.setAttribute('height', `${H + 0.018}`);
    border1.setAttribute('position', '0 0 0.001');
    border1.setAttribute('material', 'shader: flat; color: #8c6a2c; opacity: 1; transparent: false');
    this._panel.appendChild(border1);

    // ── Bordure intérieure laiton doré ───────────────────────────────────
    const border2 = document.createElement('a-plane');
    border2.setAttribute('width',  `${W + 0.010}`);
    border2.setAttribute('height', `${H + 0.007}`);
    border2.setAttribute('position', '0 0 0.002');
    border2.setAttribute('material', 'shader: flat; color: #d0a13f; opacity: 1; transparent: false');
    this._panel.appendChild(border2);

    // ── Fond bois sombre ─────────────────────────────────────────────────
    const bg = document.createElement('a-plane');
    bg.setAttribute('width',  `${W}`);
    bg.setAttribute('height', `${H}`);
    bg.setAttribute('position', '0 0 0.003');
    bg.setAttribute('material', 'shader: flat; color: #1b130b; opacity: 0.97; transparent: true');
    this._panel.appendChild(bg);

    // ── Barre de zone colorée (haut) ─────────────────────────────────────
    this._topBar = document.createElement('a-plane');
    this._topBar.setAttribute('width',  `${W}`);
    this._topBar.setAttribute('height', '0.007');
    this._topBar.setAttribute('position', `0 ${H / 2 - 0.0035} 0.004`);
    this._topBar.setAttribute('material', 'shader: flat; color: #5b9fd4; opacity: 1');
    this._panel.appendChild(this._topBar);

    // ── Filet bas de titre ────────────────────────────────────────────────
    const div1 = document.createElement('a-plane');
    div1.setAttribute('width',  `${W - 0.040}`);
    div1.setAttribute('height', '0.0015');
    div1.setAttribute('position', `0 ${H / 2 - 0.048} 0.004`);
    div1.setAttribute('material', 'shader: flat; color: #4a2a12; opacity: 1');
    this._panel.appendChild(div1);

    // ── Filet haut des contrôles ──────────────────────────────────────────
    const div2 = document.createElement('a-plane');
    div2.setAttribute('width',  `${W - 0.040}`);
    div2.setAttribute('height', '0.0015');
    div2.setAttribute('position', `0 ${-H / 2 + 0.028} 0.004`);
    div2.setAttribute('material', 'shader: flat; color: #4a2a12; opacity: 1');
    this._panel.appendChild(div2);

    // ── Coins en L (4 × 2 plans = 8 plans) ───────────────────────────────
    const cx = W / 2 - 0.001;
    const cy = H / 2 - 0.001;
    const cl = 0.058;  // longueur du bras
    const ct = 0.010;  // épaisseur
    const cz = '0.005';
    [
      [-cx, cy], [cx, cy], [-cx, -cy], [cx, -cy]
    ].forEach(([x, y]) => {
      const sx = x < 0 ? 1 : -1;
      const sy = y < 0 ? 1 : -1;
      // bras horizontal
      const h = document.createElement('a-plane');
      h.setAttribute('width',  `${cl}`);
      h.setAttribute('height', `${ct}`);
      h.setAttribute('position', `${x + sx * (cl / 2 - ct / 2)} ${y} ${cz}`);
      h.setAttribute('material', `shader: flat; color: #d0a13f; opacity: 1`);
      this._panel.appendChild(h);
      // bras vertical
      const v = document.createElement('a-plane');
      v.setAttribute('width',  `${ct}`);
      v.setAttribute('height', `${cl}`);
      v.setAttribute('position', `${x} ${y + sy * (cl / 2 - ct / 2)} ${cz}`);
      v.setAttribute('material', `shader: flat; color: #d0a13f; opacity: 1`);
      this._panel.appendChild(v);
      // carré de coin
      const sq = document.createElement('a-plane');
      sq.setAttribute('width',  `${ct}`);
      sq.setAttribute('height', `${ct}`);
      sq.setAttribute('position', `${x} ${y} ${cz}`);
      sq.setAttribute('material', 'shader: flat; color: #edc86a; opacity: 1');
      this._panel.appendChild(sq);
    });

    // ── Tag zone ──────────────────────────────────────────────────────────
    this._tagEl = document.createElement('a-text');
    this._tagEl.setAttribute('color', '#d6b26a');
    this._tagEl.setAttribute('align', 'left');
    this._tagEl.setAttribute('position', `${-W / 2 + 0.020} ${H / 2 - 0.026} 0.006`);
    this._tagEl.setAttribute('scale', '0.044 0.044 0.044');
    this._tagEl.setAttribute('width', '5');
    this._tagEl.setAttribute('lineHeight', '1.15');
    this._tagEl.setAttribute('font', this._fontUrl);
    this._panel.appendChild(this._tagEl);

    // ── Titre ─────────────────────────────────────────────────────────────
    this._titleEl = document.createElement('a-text');
    this._titleEl.setAttribute('color', '#f0dfb5');
    this._titleEl.setAttribute('align', 'center');
    this._titleEl.setAttribute('width', '7');
    this._titleEl.setAttribute('wrap-count', '64');
    this._titleEl.setAttribute('position', `0 ${H / 2 - 0.058} 0.006`);
    this._titleEl.setAttribute('scale', '0.054 0.054 0.054');
    this._titleEl.setAttribute('lineHeight', '1.12');
    this._titleEl.setAttribute('font', this._fontUrl);
    this._panel.appendChild(this._titleEl);

    // ── Description ───────────────────────────────────────────────────────
    this._descEl = document.createElement('a-text');
    this._descEl.setAttribute('color', '#c9a777');
    this._descEl.setAttribute('align', 'center');
    this._descEl.setAttribute('width', '7.5');
    this._descEl.setAttribute('wrap-count', '78');
    this._descEl.setAttribute('position', `0 -0.010 0.006`);
    this._descEl.setAttribute('scale', '0.042 0.042 0.042');
    this._descEl.setAttribute('lineHeight', '1.18');
    this._descEl.setAttribute('font', this._fontUrl);
    this._panel.appendChild(this._descEl);

    // ── Contrôles ─────────────────────────────────────────────────────────
    this._ctrlEl = document.createElement('a-text');
    this._ctrlEl.setAttribute('color', '#8b6a3b');
    this._ctrlEl.setAttribute('align', 'center');
    this._ctrlEl.setAttribute('width', '6.5');
    this._ctrlEl.setAttribute('position', `0 ${-H / 2 + 0.012} 0.006`);
    this._ctrlEl.setAttribute('scale', '0.034 0.034 0.034');
    this._ctrlEl.setAttribute('lineHeight', '1.1');
    this._ctrlEl.setAttribute('font', this._fontUrl);
    this._panel.appendChild(this._ctrlEl);

    this.el.appendChild(this._panel);
  },

  _applyZone: function (zone) {
    this._topBar.setAttribute('material', `shader: flat; color: ${zone.accentColor}; opacity: 1`);
    this._tagEl.setAttribute('color', zone.accentColor);
    this._tagEl.setAttribute('value', '\u2756  ' + zone.tag);
    this._titleEl.setAttribute('value', zone.title);
    this._descEl.setAttribute('value', zone.desc);
    this._ctrlEl.setAttribute('value', zone.ctrl);
    this._panel.setAttribute('visible', 'true');
  },

  tick: function () {
    if (this._done) return;
    const statusEl = document.querySelector('#mission-status');
    if (statusEl && statusEl.getAttribute('visible') === 'true') {
      this._done = true;
      this._panel.setAttribute('visible', 'false');
      return;
    }
    const rig = this.data.rig;
    if (!rig || !rig.object3D) return;
    const p = rig.object3D.position;
    let found = null;
    for (const z of this._zones) {
      if (
        Math.abs(p.x - z.pos.x) <= z.tol &&
        Math.abs(p.y - z.pos.y) <= z.tol &&
        Math.abs(p.z - z.pos.z) <= z.tol
      ) { found = z; break; }
    }
    if (found !== this._currentZone) {
      this._currentZone = found;
      found ? this._applyZone(found) : this._panel.setAttribute('visible', 'false');
    }
  }
});
