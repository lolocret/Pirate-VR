/* global AFRAME, THREE */
import { playTelescopeZoom, playTreasureFound } from './audio-fx.js';

AFRAME.registerComponent('telescope-scope', {
  schema: {
    controller: { type: 'selector', default: '#asset-hand' },
    attachTo: { type: 'selector', default: '#asset-hand' },
    activeAsset: { type: 'string', default: 'Longue vue' },
    fov: { type: 'number', default: 18 },
    radius: { type: 'number', default: 0.18 },
    offset: { type: 'vec3', default: { x: 0.0, y: 0.0, z: -0.5 } },
    distance: { type: 'number', default: 0.6 },
    resolution: { type: 'number', default: 512 },
    useScopeMesh: { type: 'boolean', default: false },
    zoomFov: { type: 'number', default: 18 },
    targets: { type: 'string', default: '.telescope-target' },
    status: { type: 'selector', default: '#mission-status' },
    treasureMessage: { type: 'string', default: 'Tresor trouve ! Mission validee !' },
    treasureMessageMs: { type: 'number', default: 4000 },
    rig: { type: 'selector', default: '#camera-rig' },
    telescopePos: { type: 'vec3', default: { x: 2, y: 145, z: -82 } },
    posTolerance: { type: 'number', default: 4 },
    allowDesktop: { type: 'boolean', default: true },
    forceEnable: { type: 'boolean', default: true }
  },

  init: function () {
    this.sceneEl = this.el.sceneEl;
    this.renderer = this.sceneEl && this.sceneEl.renderer;
    this.scopeActive = false;
    this.zoomActive = false;
    this.currentAsset = '';
    this._seen = new Set();
    this._origFov = null;
    this._raycaster = new THREE.Raycaster();

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
    // Flip so texture faces back toward the camera.
    this.scopeMesh.rotation.y = Math.PI;
    this.scopeMesh.visible = false;

    const attachTarget = this.data.attachTo || this.el;
    const attachObj = attachTarget && attachTarget.object3D ? attachTarget.object3D : this.el.object3D;
    if (this.data.useScopeMesh) {
      attachObj.add(this.scopeMesh);
    }

    this.onAssetChanged = (evt) => {
      this.currentAsset = (evt && evt.detail && evt.detail.name) || '';
    };

    this._lastToggle = 0;
    this._toggleTelescope = () => {
      if (!this.isTelescopeActive()) return;
      const now = Date.now();
      if (now - this._lastToggle < 600) return; // debounce — évite le double-toggle
      this._lastToggle = now;
      this.zoomActive = !this.zoomActive;
      this.updateScopeState();
    };
    this.onTriggerDown = this._toggleTelescope;
    this.onClick = this._toggleTelescope;
    this.onTriggerUp = () => {};
    this.onAltToggle = this._toggleTelescope;
    this.onSceneTrigger = () => this._toggleTelescope();

    // Desktop testing: Key Z or right click toggles zoom
    this.onKeyDown = (evt) => {
      if (evt.code !== 'KeyZ') return;
      this._toggleTelescope();
    };
    this.onMouseDown = (evt) => {
      if (evt.button !== 2) return;
      this._toggleTelescope();
    };

    this._boundCtrls = new Set();
    this._bindController = (ctrl) => {
      if (!ctrl || this._boundCtrls.has(ctrl)) return;
      this._boundCtrls.add(ctrl);
      ctrl.addEventListener('asset-changed', this.onAssetChanged);
      ctrl.addEventListener('app-triggerdown', this.onTriggerDown);
      ctrl.addEventListener('triggerdown', this.onTriggerDown);
      ctrl.addEventListener('app-gripdown', this.onTriggerDown);
      ctrl.addEventListener('gripdown', this.onTriggerDown);
      ctrl.addEventListener('thumbstickdown', this.onAltToggle);
      ctrl.addEventListener('trackpaddown', this.onAltToggle);
      ctrl.addEventListener('xbuttondown', this.onAltToggle);
      ctrl.addEventListener('ybuttondown', this.onAltToggle);
      ctrl.addEventListener('app-triggerup', this.onTriggerUp);
      ctrl.addEventListener('triggerup', this.onTriggerUp);
      ctrl.addEventListener('click', this.onClick);
      ctrl.addEventListener('abuttondown', this.onTriggerDown);
      ctrl.addEventListener('bbuttondown', this.onTriggerDown);
    };
    this._bindControllers = () => {
      const right = this.data.controller || document.querySelector('#asset-hand');
      const left = document.querySelector('#hand-left');
      this._bindController(right);
      this._bindController(left);
    };
    this._bindControllers();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('mousedown', this.onMouseDown);
    if (this.el.sceneEl) {
      this.el.sceneEl.addEventListener('triggerdown', this.onSceneTrigger);
      this.el.sceneEl.addEventListener('app-triggerdown', this.onSceneTrigger);
    }
  },

  updateScopeState: function () {
    const shouldShow = this.zoomActive && this.isTelescopeActive();
    this.scopeActive = shouldShow;
    playTelescopeZoom(shouldShow);
    if (this.scopeMesh) this.scopeMesh.visible = shouldShow && this.data.useScopeMesh;

    const cam = this.el.getObject3D('camera') || (this.el.sceneEl && this.el.sceneEl.camera);
    if (cam) {
      if (shouldShow) {
        if (this._origFov == null) this._origFov = cam.fov;
        cam.fov = this.data.zoomFov;
        cam.updateProjectionMatrix();
      } else if (this._origFov != null) {
        cam.fov = this._origFov;
        cam.updateProjectionMatrix();
      }
    }
  },

  update: function () {
    if (this._bindControllers) this._bindControllers();
  },

  isTelescopeActive: function () {
    if (this.data.forceEnable) return true;
    if (this.data.allowDesktop && !AFRAME.utils.device.checkHeadsetConnected()) return true;
    if (this.currentAsset === this.data.activeAsset) return true;
    if (!this.data.rig || !this.data.rig.object3D) return false;
    const p = new THREE.Vector3();
    this.data.rig.object3D.getWorldPosition(p);
    const t = this.data.telescopePos;
    return Math.abs(p.x - t.x) <= this.data.posTolerance &&
      Math.abs(p.y - t.y) <= this.data.posTolerance &&
      Math.abs(p.z - t.z) <= this.data.posTolerance;
  },

  tick: function () {
    if (this._bindControllers) this._bindControllers();
    if (!this.scopeActive || !this.renderer) return;
    const attachTarget = this.data.attachTo || this.el;
    const attachObj = attachTarget && attachTarget.object3D ? attachTarget.object3D : null;
    if (!attachObj) return;

    let ctrlForRay = this.data.controller || null;
    if (!ctrlForRay && this._boundCtrls && this._boundCtrls.size) {
      for (const c of this._boundCtrls) {
        if (c && c.components && c.components.raycaster) { ctrlForRay = c; break; }
      }
      if (!ctrlForRay) ctrlForRay = this._boundCtrls.values().next().value || null;
    }
    const raycaster = ctrlForRay && ctrlForRay.components && ctrlForRay.components.raycaster;
    if (raycaster && raycaster.ray) {
      this.scopeCamera.position.copy(raycaster.ray.origin);
      this._tmpVec.copy(raycaster.ray.origin).add(this._tmpVec.copy(raycaster.ray.direction).multiplyScalar(10));
      this.scopeCamera.lookAt(this._tmpVec);

      if (this.scopeMesh && this.scopeMesh.parent) {
        const worldPos = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(this.data.distance));
        this.scopeMesh.parent.worldToLocal(worldPos);
        this.scopeMesh.position.copy(worldPos);
      }
    } else {
      attachObj.getWorldPosition(this._tmpVec);
      attachObj.getWorldQuaternion(this._tmpQuat);
      this.scopeCamera.position.copy(this._tmpVec);
      this.scopeCamera.quaternion.copy(this._tmpQuat);
      if (this.scopeMesh && this.scopeMesh.parent) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this._tmpQuat);
        const worldPos = this._tmpVec.clone().add(forward.multiplyScalar(this.data.distance));
        this.scopeMesh.parent.worldToLocal(worldPos);
        this.scopeMesh.position.copy(worldPos);
      }
    }
    this.scopeCamera.updateProjectionMatrix();

    if (this.data.useScopeMesh) {
      // Avoid recursive rendering of the scope itself.
      this.scopeMesh.visible = false;
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.sceneEl.object3D, this.scopeCamera);
      this.renderer.setRenderTarget(null);
      this.scopeMesh.visible = true;
    }

    // Telescope mission: validate when both targets are seen while zoomed.
    const rc = ctrlForRay && ctrlForRay.components && ctrlForRay.components.raycaster;
    const targetSelector = this.data.targets || '.telescope-target';
    const targets = Array.from(document.querySelectorAll(targetSelector));
    if (targets.length) {
      if (rc && rc.ray) {
        this._raycaster.set(rc.ray.origin, rc.ray.direction);
      } else {
        const origin = new THREE.Vector3();
        const dir = new THREE.Vector3(0, 0, -1);
        this.scopeCamera.getWorldPosition(origin);
        dir.applyQuaternion(this.scopeCamera.getWorldQuaternion(new THREE.Quaternion()));
        this._raycaster.set(origin, dir);
      }
      this._raycaster.far = 4000;
      const hit = this._raycaster.intersectObjects(targets.map(t => t.object3D), true);
      if (hit && hit.length) {
        const el = hit[0].object.el && hit[0].object.el.closest
          ? hit[0].object.el.closest(targetSelector)
          : hit[0].object.el;
        if (el && el.id) {
          this._seen.add(el.id);
        }
      }
      if (this._seen.has('tresor') && !this._tresorFound) {
        this._tresorFound = true;
        playTreasureFound();
        const statusEl = this.data.status;
        if (statusEl) {
          statusEl.setAttribute('visible', 'true');
          statusEl.setAttribute('value', this.data.treasureMessage);
          if (this._treasureTimer) clearTimeout(this._treasureTimer);
          this._treasureTimer = setTimeout(() => {
            statusEl.setAttribute('visible', 'false');
          }, this.data.treasureMessageMs);
        }
      }
    }
  },

  remove: function () {
    if (this._boundCtrls && this._boundCtrls.size) {
      for (const ctrl of this._boundCtrls) {
        if (!ctrl) continue;
        ctrl.removeEventListener('asset-changed', this.onAssetChanged);
        ctrl.removeEventListener('app-triggerdown', this.onTriggerDown);
        ctrl.removeEventListener('triggerdown', this.onTriggerDown);
        ctrl.removeEventListener('app-gripdown', this.onTriggerDown);
        ctrl.removeEventListener('gripdown', this.onTriggerDown);
        ctrl.removeEventListener('thumbstickdown', this.onAltToggle);
        ctrl.removeEventListener('trackpaddown', this.onAltToggle);
        ctrl.removeEventListener('xbuttondown', this.onAltToggle);
        ctrl.removeEventListener('ybuttondown', this.onAltToggle);
        ctrl.removeEventListener('app-triggerup', this.onTriggerUp);
        ctrl.removeEventListener('triggerup', this.onTriggerUp);
        ctrl.removeEventListener('click', this.onClick);
        ctrl.removeEventListener('abuttondown', this.onTriggerDown);
        ctrl.removeEventListener('bbuttondown', this.onTriggerDown);
      }
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('mousedown', this.onMouseDown);
    if (this.el.sceneEl) {
      this.el.sceneEl.removeEventListener('triggerdown', this.onSceneTrigger);
      this.el.sceneEl.removeEventListener('app-triggerdown', this.onSceneTrigger);
    }
    if (this.scopeMesh) {
      if (this.scopeMesh.parent) {
        this.scopeMesh.parent.remove(this.scopeMesh);
      }
      this.scopeMesh.geometry.dispose();
      this.scopeMesh.material.dispose();
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    if (this._treasureTimer) {
      clearTimeout(this._treasureTimer);
      this._treasureTimer = null;
    }
  }
});
