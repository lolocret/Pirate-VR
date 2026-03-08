/* global AFRAME, THREE */
AFRAME.registerComponent('aim-reticle', {
  schema: {
    distance: { type: 'number', default: 30 },
    color: { type: 'color', default: '#56c8ff' }
  },

  init: function () {
    this._origin = new THREE.Vector3();
    this._dir = new THREE.Vector3();

    const ring = document.createElement('a-ring');
    ring.setAttribute('radius-inner', '0.01');
    ring.setAttribute('radius-outer', '0.015');
    ring.setAttribute('material', `shader: flat; color: ${this.data.color}; opacity: 0.9; transparent: true`);
    ring.setAttribute('position', `0 0 -${this.data.distance}`);
    this.el.appendChild(ring);
    this._ring = ring;
  },

  tick: function () {
    const raycaster = this.el.components.raycaster;
    if (raycaster && raycaster.ray) {
      const hits = raycaster.intersectedEls;
      if (hits && hits.length) {
        const hit = raycaster.intersections && raycaster.intersections[0];
        if (hit && hit.point) {
          this._ring.object3D.position.copy(this.el.object3D.worldToLocal(hit.point.clone()));
          return;
        }
      }
      this._origin.copy(raycaster.ray.origin);
      this._dir.copy(raycaster.ray.direction);
      const pos = this._origin.clone().add(this._dir.multiplyScalar(this.data.distance));
      this._ring.object3D.position.copy(this.el.object3D.worldToLocal(pos));
    }
  }
});
