AFRAME.registerComponent('asset-selector', {
  schema: {
    hand: { type: 'string', default: 'left' }
  },

  init: function () {
    const siteBase = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
    const base = siteBase.endsWith('/') ? siteBase : `${siteBase}/`;

    this.assets = [
      { name: 'Main', url: `${base}assets/main.glb`, position: '-0.015 0.14 0.596', rotation: '-10 0 0', scale: '0.1 0.1 0.1', equipPosition: '0 -0.4 0.12', equipScale: '0.22 0.22 0.22' },
      { name: 'Longue vue', url: `${base}assets/telescope.glb`, position: '-0.111 0.578 -0.226', rotation: '0 -90 1.5', scale: '0.1 0.1 0.1', equipPosition: '0.12 -0.08 0.08', equipRotation: '0 -90 90', equipScale: '0.2 0.2 0.2' },
      { name: 'Compass', url: `${base}assets/pirate_compass-converted.glb`, position: '0 0.65 0.04', rotation: '0 0 0', scale: '0.1 0.1 0.1', equipPosition: '0 0.03 -0.03', equipScale: '0.1 0.1 0.1' },
      { name: 'Pistolet', url: `${base}assets/gun.glb`, position: '0.05 0.05 0.2', rotation: '0 90 0', scale: '0.3 0.3 0.3', equipPosition: '-0.08 0.555 0.182', equipRotation: '0 90 30', equipScale: '1 1 1' }
    ];

    this.currentAssetIndex = 0;
    this.equippedEl = null;
    this.lastCycleAt = 0;

    this.teleportMap = [
      { pos: { x: 0, y: 65, z: -135 }, asset: 'Main' },
      { pos: { x: 2, y: 145, z: -82 }, asset: 'Longue vue' },
      { pos: { x: 4, y: 64, z: -32 }, asset: 'Compass' },
      { pos: { x: 27, y: 61, z: -55 }, asset: 'Pistolet' }
    ];

    this.onKeyDown = (evt) => {
      if (evt.key === 'ArrowRight') this.cycle();
    };
    window.addEventListener('keydown', this.onKeyDown);

    // VR: cycle assets with controller buttons (A/B or grip)
    this.onBtnCycle = () => this.cycle();
    this.el.addEventListener('abuttondown', this.onBtnCycle);
    this.el.addEventListener('bbuttondown', this.onBtnCycle);
    this.el.addEventListener('gripdown', this.onBtnCycle);

    this.onTeleported = (evt) => {
      const pos = evt && evt.detail && evt.detail.position;
      if (!pos) return;
      const match = this.teleportMap.find(m => this._matchesPos(m.pos, pos));
      if (!match) return;
      const idx = this.assets.findIndex(a => a.name === match.asset);
      if (idx >= 0) this.displayAsset(idx);
    };

    // Attacher le listener sur le rig une fois la scène chargée
    this.el.sceneEl.addEventListener('loaded', () => {
      this._cacheEls();
      this.displayAsset(this.currentAssetIndex);

      const rig = document.querySelector('#camera-rig');
      if (rig) {
        rig.addEventListener('teleported', this.onTeleported);
        this._rig = rig;
      }
    });
  },

  _cacheEls: function () {
    this.displayArea = this.el.querySelector('#asset-display-' + this.data.hand);
    this.textEl = this.el.querySelector('[data-asset-text]');
  },

  _matchesPos: function (a, b, tol = 2.0) {
    if (!a || !b) return false;
    return Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol && Math.abs(a.z - b.z) <= tol;
  },

  cycle: function () {
    const now = Date.now();
    if (now - this.lastCycleAt < 180) return;
    this.lastCycleAt = now;
    this.displayAsset((this.currentAssetIndex + 1) % this.assets.length);
  },

  displayAsset: function (index) {
    if (!this.displayArea || index < 0 || index >= this.assets.length) return;

    this.currentAssetIndex = index;
    const asset = this.assets[index];

    // Supprimer les anciens modèles
    const previousModels = this.displayArea.querySelectorAll('[data-asset-model]');
    previousModels.forEach(m => m.parentNode.removeChild(m));

    if (!asset.noDisplay) {
      const model = document.createElement('a-entity');
      model.setAttribute('data-asset-model', 'true');
      model.setAttribute('gltf-model', asset.url);
      model.setAttribute('position', asset.position);
      model.setAttribute('rotation', asset.rotation || '0 0 0');
      model.setAttribute('scale', asset.scale);
      model.setAttribute('visible', 'true');
      if (asset.animate) {
        model.setAttribute('animation-mixer', '');
      }

      model.addEventListener('model-loaded', (evt) => {
        if (!asset.center || !window.THREE) return;
        const obj = evt.detail && evt.detail.model;
        if (!obj) return;
        const box = new THREE.Box3().setFromObject(obj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        obj.position.sub(center);
      });

      model.addEventListener('model-error', (evt) => {
        const urls = asset.urls || (asset.url ? [asset.url] : []);
        const currentUrl = model.getAttribute('gltf-model');
        const nextIndex = urls.indexOf(currentUrl) + 1;
        if (nextIndex > 0 && nextIndex < urls.length) {
          model.setAttribute('gltf-model', urls[nextIndex]);
          return;
        }
        console.warn('Model failed to load:', currentUrl, evt && evt.detail);
      });

      this.displayArea.appendChild(model);
    }

    if (this.textEl) {
      this.textEl.setAttribute('value', `${asset.name} (${this.currentAssetIndex + 1}/${this.assets.length})`);
    }

    this.setEquipped(asset);
    this.el.emit('asset-changed', { name: asset.name }, false);
  },

  setEquipped: function (asset) {
    if (this.equippedEl) {
      this.equippedEl.parentNode.removeChild(this.equippedEl);
      this.equippedEl = null;
    }
    if (!asset) return;
    // Equip assets that define an equip position (e.g., Pistolet, Longue vue).
    if (!asset.equipPosition && !asset.equipRotation && !asset.equipScale) return;

    const model = document.createElement('a-entity');
    model.setAttribute('data-equipped', 'true');
    model.setAttribute('gltf-model', asset.url);
    model.setAttribute('position', asset.equipPosition || '0 0 0');
    model.setAttribute('rotation', asset.equipRotation || '0 0 0');
    model.setAttribute('scale', asset.equipScale || asset.scale || '0.3 0.3 0.3');
    this.el.appendChild(model);
    this.equippedEl = model;
  },

  remove: function () {
    window.removeEventListener('keydown', this.onKeyDown);
    this.el.removeEventListener('abuttondown', this.onBtnCycle);
    this.el.removeEventListener('bbuttondown', this.onBtnCycle);
    this.el.removeEventListener('gripdown', this.onBtnCycle);
    if (this._rig && this.onTeleported) {
      this._rig.removeEventListener('teleported', this.onTeleported);
    }
  }
});
