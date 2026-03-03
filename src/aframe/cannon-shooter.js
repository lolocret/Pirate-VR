/* global AFRAME, THREE */
AFRAME.registerComponent('cannon-shooter', {
  schema: {
    activeAsset: { type: 'string', default: 'Canon' },
    range: { type: 'number', default: 1500 }
  },

  init: function () {
    this.currentAsset = '';
    this._raycaster = new THREE.Raycaster();
    this._origin = new THREE.Vector3();
    this._dir = new THREE.Vector3();

    this.onAssetChanged = (evt) => {
      this.currentAsset = (evt && evt.detail && evt.detail.name) || '';
    };

    this.onTriggerDown = () => {
      if (this.currentAsset !== this.data.activeAsset) return;
      this.shoot();
    };

    this.el.addEventListener('asset-changed', this.onAssetChanged);
    this.el.addEventListener('app-triggerdown', this.onTriggerDown);
  },

  shoot: function () {
    const targets = Array.from(document.querySelectorAll('.cannon-target'));
    if (targets.length === 0) return;

    const raycaster = this.el.components.raycaster;
    if (raycaster && raycaster.ray) {
      this._origin.copy(raycaster.ray.origin);
      this._dir.copy(raycaster.ray.direction);
    } else {
      this.el.object3D.getWorldPosition(this._origin);
      this.el.object3D.getWorldDirection(this._dir);
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

    hitEl.emit('cannon-hit', {}, false);
  },

  remove: function () {
    this.el.removeEventListener('asset-changed', this.onAssetChanged);
    this.el.removeEventListener('app-triggerdown', this.onTriggerDown);
  }
});
