AFRAME.registerComponent('asset-selector', {
  schema: {
    hand: { type: 'string', default: 'left' }
  },

  init: function () {
    const el = this.el;
    const hand = this.data.hand;

    const siteBase = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';

    const resolveAssetUrls = (relPath) => {
      const base = siteBase.endsWith('/') ? siteBase : `${siteBase}/`;
      const rel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
      return [
        `${base}${rel}`,
        `/${rel}`
      ];
    };

    const assets = [
      { name: 'Main', url: `${siteBase}assets/main.glb`, position: '0 -0.2 0.54', rotation: '-10 0 0', scale: '0.2 0.2 0.2', equipPosition: '0 -0.4 0.12', equipScale: '0.22 0.22 0.22' },
      { name: 'Épée', urls: resolveAssetUrls('assets/epee.glb'), position: '0 0 -0.3', rotation: '0 90 0', scale: '0.2 0.2 0.2', equipPosition: '0 -0.05 -0.04', equipScale: '0.22 0.22 0.22', center: true },
      { name: 'Longue vue', url: `${siteBase}assets/telescope.glb`, position: '0.12 -0.1 0.2', rotation: '0 90 20', scale: '0.2 0.2 0.2', equipPosition: '0.12 -0.08 0.08', equipRotation: '0 90 90', equipScale: '0.2 0.2 0.2' },
      { name: 'Compass', url: `${siteBase}assets/pirate_compass-converted.glb`, position: '0 0.65 0.04', rotation: '0 0 0', scale: '0.1 0.1 0.1', equipPosition: '0 0.03 -0.03', equipScale: '0.1 0.1 0.1' },
      { name: 'Drapeau', url: `${siteBase}assets/pirate_flag_animated-converted.glb`, position: '0 1 0.6', rotation: '0 180 0', scale: '0.005 0.005 0.005', equipPosition: '0 -0.06 -0.02', equipScale: '0.16 0.16 0.16', center: true, animate: true }
    ];

    let currentAssetIndex = 0;

    // Find the display area and text elements (may not be ready yet)
    let displayArea = el.querySelector('#asset-display-' + hand);
    let textEl = el.querySelector('[data-asset-text]');

    const cacheEls = () => {
      displayArea = el.querySelector('#asset-display-' + hand);
      textEl = el.querySelector('[data-asset-text]');
      return displayArea;
    };
    
    console.log(`asset-selector init: hand=${hand}, displayArea=${displayArea}, textEl=${textEl}`);
    
    const displayAsset = (index) => {
      if (!displayArea) {
        cacheEls();
      }
      if (!displayArea || index < 0 || index >= assets.length) {
        console.log(`displayAsset called but displayArea missing or invalid index`);
        return;
      }

      currentAssetIndex = index;
      const asset = assets[index];

      // Remove all previous asset models
      const previousModels = displayArea.querySelectorAll('[data-asset-model]');
      previousModels.forEach(m => m.parentNode.removeChild(m));

      // Add new asset model
      const model = document.createElement('a-entity');
      model.setAttribute('data-asset-model', 'true');
      const initialUrl = asset.url || (asset.urls && asset.urls[0]);
      model.setAttribute('gltf-model', initialUrl);
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
          const nextUrl = urls[nextIndex];
          console.warn('Model failed to load, retrying with:', nextUrl);
          model.setAttribute('gltf-model', nextUrl);
          return;
        }
        console.warn('Model failed to load:', currentUrl, evt && evt.detail);
      });
      
      displayArea.appendChild(model);

      // Update text
      if (textEl) {
        textEl.setAttribute('value', `${asset.name} (${currentAssetIndex + 1}/${assets.length})`);
      }

      el.emit('asset-changed', { name: asset.name }, false);
      console.log(`Asset displayed: ${asset.name} at URL: ${initialUrl}`);
    };

    // Manual cycle (desktop debug)
    let lastCycleAt = 0;
    const cycle = (evt) => {
      const now = Date.now();
      if (now - lastCycleAt < 180) return;
      lastCycleAt = now;
      displayAsset((currentAssetIndex + 1) % assets.length);
    };

    // Keyboard: ArrowRight to cycle (desktop debug)
    this.onKeyDown = (evt) => {
      if (evt.key === 'ArrowRight') cycle(evt);
    };
    window.addEventListener('keydown', this.onKeyDown);

    const findAssetIndex = (name) => assets.findIndex(a => a.name === name);
    const matchesPos = (a, b, tol = 0.5) => {
      if (!a || !b) return false;
      return Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol && Math.abs(a.z - b.z) <= tol;
    };

    const teleportMap = [
      { pos: { x: 0, y: 65, z: -135 }, asset: 'Main' },
      { pos: { x: 2, y: 145, z: -82 }, asset: 'Longue vue' },
      { pos: { x: 4, y: 64, z: -32 }, asset: 'Compass' },
      { pos: { x: 27, y: 61, z: -55 }, asset: 'Épée' }
    ];

    const onTeleported = (evt) => {
      const pos = evt && evt.detail && evt.detail.position;
      if (!pos) return;
      const match = teleportMap.find(m => matchesPos(m.pos, pos));
      if (!match) return;
      const idx = findAssetIndex(match.asset);
      if (idx >= 0) displayAsset(idx);
    };

    const attachTeleportListener = () => {
      const rig = document.querySelector('#camera-rig');
      if (!rig) return false;
      rig.addEventListener('teleported', onTeleported);
      this._rig = rig;
      this._onTeleported = onTeleported;
      return true;
    };

    if (!attachTeleportListener()) {
      setTimeout(attachTeleportListener, 200);
    }

    // Disabled equip/unequip on grip to avoid double assets

    // Display the first asset on init
    displayAsset(0);
    if (!displayArea) {
      setTimeout(() => {
        cacheEls();
        displayAsset(currentAssetIndex);
      }, 50);
    }
  },

  remove: function () {
    if (this.onKeyDown) {
      window.removeEventListener('keydown', this.onKeyDown);
    }
    if (this._rig && this._onTeleported) {
      this._rig.removeEventListener('teleported', this._onTeleported);
    }
  }
});
