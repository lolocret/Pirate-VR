/* global AFRAME */
AFRAME.registerComponent('cannon-target', {
  schema: {
    name: { type: 'string', default: '' }
  },

  init: function () {
    this.hit = false;
    this.onHit = () => {
      if (this.hit) return;
      this.hit = true;
      this.el.setAttribute('visible', 'false');
      this.el.emit('cannon-target-hit', { name: this.data.name }, false);
      if (this.el.sceneEl) {
        this.el.sceneEl.emit('cannon-target-hit', { name: this.data.name }, false);
      }
    };
    this.el.addEventListener('cannon-hit', this.onHit);
  },

  remove: function () {
    this.el.removeEventListener('cannon-hit', this.onHit);
  }
});
