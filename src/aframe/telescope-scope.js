/* global AFRAME, THREE */
AFRAME.registerComponent('telescope-scope', {
  schema: {
    controller: { type: 'selector', default: '#asset-hand' },
    activeAsset: { type: 'string', default: 'Longue vue' },
    fov: { type: 'number', default: 18 },
    radius: { type: 'number', default: 0.18 },
    offset: { type: 'vec3', default: { x: 0.18, y: -0.08, z: -0.45 } },
    resolution: { type: 'number', default: 512 }
  },

  init: function () {
    this.sceneEl = this.el.sceneEl;
    this.renderer = this.sceneEl && this.sceneEl.renderer;
    this.scopeActive = false;
    this.triggerHeld = false;
    this.currentAsset = '';

    this._tmpVec = new THREE.Vector3();
    this._tmpQuat = new THREE.Quaternion();

    this.renderTarget = new THREE.WebGLRenderTarget(this.data.resolution, this.data.resolution);
    this.scopeCamera = new THREE.PerspectiveCamera(this.data.fov, 1, 0.01, 5000);

    const geometry = new THREE.CircleGeometry(this.data.radius, 64);
    const material = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture,
      side: THREE.DoubleSide,
      transparent: true
    });
    this.scopeMesh = new THREE.Mesh(geometry, material);
    this.scopeMesh.position.set(this.data.offset.x, this.data.offset.y, this.data.offset.z);
    this.scopeMesh.visible = false;
    this.el.object3D.add(this.scopeMesh);

    this.onAssetChanged = (evt) => {
      this.currentAsset = (evt && evt.detail && evt.detail.name) || '';
    };

    this.onTriggerDown = () => {
      this.triggerHeld = true;
      this.updateScopeState();
    };
    this.onTriggerUp = () => {
      this.triggerHeld = false;
      this.updateScopeState();
    };

    const ctrl = this.data.controller;
    if (ctrl) {
      ctrl.addEventListener('asset-changed', this.onAssetChanged);
      ctrl.addEventListener('app-triggerdown', this.onTriggerDown);
      ctrl.addEventListener('app-triggerup', this.onTriggerUp);
    }
  },

  updateScopeState: function () {
    const shouldShow = this.triggerHeld && this.currentAsset === this.data.activeAsset;
    this.scopeActive = shouldShow;
    if (this.scopeMesh) this.scopeMesh.visible = shouldShow;
  },

  tick: function () {
    if (!this.scopeActive || !this.renderer) return;
    const cam = this.el.getObject3D('camera');
    if (!cam) return;

    cam.getWorldPosition(this._tmpVec);
    cam.getWorldQuaternion(this._tmpQuat);
    this.scopeCamera.position.copy(this._tmpVec);
    this.scopeCamera.quaternion.copy(this._tmpQuat);
    this.scopeCamera.updateProjectionMatrix();

    // Avoid recursive rendering of the scope itself.
    this.scopeMesh.visible = false;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.sceneEl.object3D, this.scopeCamera);
    this.renderer.setRenderTarget(null);
    this.scopeMesh.visible = true;
  },

  remove: function () {
    const ctrl = this.data.controller;
    if (ctrl) {
      ctrl.removeEventListener('asset-changed', this.onAssetChanged);
      ctrl.removeEventListener('app-triggerdown', this.onTriggerDown);
      ctrl.removeEventListener('app-triggerup', this.onTriggerUp);
    }
    if (this.scopeMesh) {
      this.el.object3D.remove(this.scopeMesh);
      this.scopeMesh.geometry.dispose();
      this.scopeMesh.material.dispose();
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
  }
});
