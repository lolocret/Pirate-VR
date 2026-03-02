/* global AFRAME */
AFRAME.registerComponent('gaze-fog', {
  schema: {
    density: {type: 'number', default: 0.02}
  },
  init: function () {
    this.scene = this.el.sceneEl;
    this.baseFog = this.scene.getAttribute('fog');
    this.onEnter = () => {
      if (!this.baseFog) return;
      this.scene.setAttribute('fog', {
        type: this.baseFog.type,
        color: this.baseFog.color,
        near: this.baseFog.near,
        far: this.baseFog.far,
        density: this.data.density
      });
    };
    this.onLeave = () => {
      if (!this.baseFog) return;
      this.scene.setAttribute('fog', this.baseFog);
    };
    this.el.addEventListener('mouseenter', this.onEnter);
    this.el.addEventListener('mouseleave', this.onLeave);
  },
  remove: function () {
    this.el.removeEventListener('mouseenter', this.onEnter);
    this.el.removeEventListener('mouseleave', this.onLeave);
  }
});
