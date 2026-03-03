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
      this.el.sceneEl.addEventListener('loaded', apply);
    }
  },

  remove: function () {
    if (this.el.sceneEl && this.applyPosition) {
      this.el.sceneEl.removeEventListener('loaded', this.applyPosition);
    }
  }
});
