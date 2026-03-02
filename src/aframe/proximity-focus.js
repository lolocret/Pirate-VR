/* global AFRAME, THREE */
AFRAME.registerComponent('proximity-focus', {
  schema: {
    target: {type: 'selector'},
    distance: {type: 'number', default: 8},
    dimIntensity: {type: 'number', default: 0.35}
  },
  init: function () {
    this.selfPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.lightEl = document.querySelector('#ambient-light');
    this.baseIntensity = null;
    if (this.lightEl) {
      const light = this.lightEl.getAttribute('light');
      if (light && typeof light.intensity === 'number') {
        this.baseIntensity = light.intensity;
      }
    }
  },
  tick: function () {
    if (!this.data.target || !this.lightEl || this.baseIntensity === null) return;
    this.el.object3D.getWorldPosition(this.selfPos);
    this.data.target.object3D.getWorldPosition(this.targetPos);
    const dist = this.selfPos.distanceTo(this.targetPos);
    const intensity = dist <= this.data.distance ? this.data.dimIntensity : this.baseIntensity;
    const current = this.lightEl.getAttribute('light').intensity;
    if (current !== intensity) {
      this.lightEl.setAttribute('light', 'intensity', intensity);
    }
  }
});
