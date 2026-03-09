/* global AFRAME, THREE */
import { playCannonFire } from './audio-fx.js';

AFRAME.registerComponent('cannon-shooter', {
  schema: {
    activeAsset: { type: 'string', default: 'Canon' },
    range: { type: 'number', default: 1500 },
    rig: { type: 'selector', default: '#camera-rig' },
    canonPos: { type: 'vec3', default: { x: 27, y: 61, z: -55 } },
    posTolerance: { type: 'number', default: 3 },
    allowDesktop: { type: 'boolean', default: true },
    forceEnable: { type: 'boolean', default: true }
  },

  init: function () {
    this.currentAsset = '';
    this._raycaster = new THREE.Raycaster();
    this._origin = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._lastShot = 0;

    this.onAssetChanged = (evt) => {
      this.currentAsset = (evt && evt.detail && evt.detail.name) || '';
    };

    this.onTriggerDown = () => {
      if (!this.isCanonActive()) return;
      this.shoot();
    };
    this.onClick = () => {
      if (!this.isCanonActive()) return;
      this.shoot();
    };
    this.onSceneTrigger = () => {
      if (!this.isCanonActive()) return;
      this.shoot();
    };

    this.el.addEventListener('asset-changed', this.onAssetChanged);
    this.el.addEventListener('app-triggerdown', this.onTriggerDown);
    this.el.addEventListener('triggerdown', this.onTriggerDown);
    this.el.addEventListener('click', this.onClick);

    // Desktop testing: Space or left click to shoot
    this.onKeyDown = (evt) => {
      if (evt.code === 'Space') {
        if (!this.isCanonActive()) return;
        this.shoot();
      }
    };
    this.onMouseDown = (evt) => {
      if (evt.button !== 0) return;
      if (!this.isCanonActive()) return;
      this.shoot();
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('mousedown', this.onMouseDown);
    if (this.el.sceneEl) {
      this.el.sceneEl.addEventListener('triggerdown', this.onSceneTrigger);
      this.el.sceneEl.addEventListener('app-triggerdown', this.onSceneTrigger);
    }
  },

  isCanonActive: function () {
    if (this.data.forceEnable) return true;
    if (this.data.allowDesktop && !AFRAME.utils.device.checkHeadsetConnected()) return true;
    if (this.currentAsset === this.data.activeAsset) return true;
    if (!this.data.rig || !this.data.rig.object3D) return false;
    const p = new THREE.Vector3();
    this.data.rig.object3D.getWorldPosition(p);
    const c = this.data.canonPos;
    return Math.abs(p.x - c.x) <= this.data.posTolerance &&
      Math.abs(p.y - c.y) <= this.data.posTolerance &&
      Math.abs(p.z - c.z) <= this.data.posTolerance;
  },

  shoot: function () {
    const now = Date.now();
    if (now - this._lastShot < 180) return;
    this._lastShot = now;
    const targets = Array.from(document.querySelectorAll('.cannon-target'));
    if (targets.length === 0) return;

    const raycaster = this.el.components.raycaster;
    if (raycaster && raycaster.ray) {
      this._origin.copy(raycaster.ray.origin);
      this._dir.copy(raycaster.ray.direction);
    } else {
      const cam = this.el.sceneEl && this.el.sceneEl.camera;
      if (cam) {
        cam.getWorldPosition(this._origin);
        cam.getWorldDirection(this._dir);
      } else {
        this.el.object3D.getWorldPosition(this._origin);
        this.el.object3D.getWorldDirection(this._dir);
      }
    }

    this._raycaster.set(this._origin, this._dir);
    this._raycaster.far = this.data.range;

    const targetObjects = targets.map((t) => {
      const hitbox = t.querySelector('.cannon-hitbox');
      const obj = hitbox ? hitbox.object3D : t.object3D;
      obj.userData.cannonTargetEl = t;
      return obj;
    });

    const hits = this._raycaster.intersectObjects(targetObjects, true);
    if (!hits || hits.length === 0) return;

    const hitObj = hits[0].object;
    const hitEl = hitObj.userData.cannonTargetEl ||
      (hitObj.el && hitObj.el.closest && hitObj.el.closest('.cannon-target'));
    if (!hitEl) return;

    const targetName = (hitEl.getAttribute('cannon-target') || {}).name;
    if (hitEl.id === 'kraken' || targetName === 'Kraken') {
      playCannonFire();
    }
    hitEl.emit('cannon-hit', {}, false);
  },

  remove: function () {
    this.el.removeEventListener('asset-changed', this.onAssetChanged);
    this.el.removeEventListener('app-triggerdown', this.onTriggerDown);
    this.el.removeEventListener('triggerdown', this.onTriggerDown);
    this.el.removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('mousedown', this.onMouseDown);
    if (this.el.sceneEl) {
      this.el.sceneEl.removeEventListener('triggerdown', this.onSceneTrigger);
      this.el.sceneEl.removeEventListener('app-triggerdown', this.onSceneTrigger);
    }
  }
});
