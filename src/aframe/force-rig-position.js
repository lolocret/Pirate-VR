/* global AFRAME */
AFRAME.registerComponent('force-rig-position', {
  schema: {
    position: { type: 'vec3', default: { x: 0, y: 65, z: -135 } }
  },

  init: function () {
    const apply = () => {
      const p = this.data.position;
      this.el.setAttribute('position', `${p.x} ${p.y} ${p.z}`);
      if (this.el.object3D) {
        this.el.object3D.position.set(p.x, p.y, p.z);
        this.el.object3D.updateMatrixWorld();
      }
    };

    this.applyPosition = apply;
    apply();

    if (this.el.sceneEl) {
      const applySoon = () => setTimeout(apply, 0);
      this._applySoon = applySoon;
      this.el.sceneEl.addEventListener('loaded', applySoon);
      this.el.sceneEl.addEventListener('enter-scene', applySoon);
      this.el.sceneEl.addEventListener('enter-vr', applySoon);
      this.el.sceneEl.addEventListener('exit-vr', applySoon);
    }
  },

  remove: function () {
    if (this.el.sceneEl && this._applySoon) {
      this.el.sceneEl.removeEventListener('loaded', this._applySoon);
      this.el.sceneEl.removeEventListener('enter-scene', this._applySoon);
      this.el.sceneEl.removeEventListener('enter-vr', this._applySoon);
      this.el.sceneEl.removeEventListener('exit-vr', this._applySoon);
    }
  }
});
