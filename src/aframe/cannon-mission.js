/* global AFRAME */
AFRAME.registerComponent('cannon-mission', {
  schema: {
    status: { type: 'selector', default: '#mission-status' }
  },

  init: function () {
    this.total = 0;
    this.hit = 0;
    this.statusEl = this.data.status;

    const targets = this.el.sceneEl ? this.el.sceneEl.querySelectorAll('.cannon-target') : [];
    this.total = targets.length;

    this.onTargetHit = () => {
      this.hit += 1;
      if (this.statusEl) {
        this.statusEl.setAttribute('visible', 'true');
        this.statusEl.setAttribute('value', `Mission: ${this.hit}/${this.total}`);
        if (this.hit >= this.total) {
          this.statusEl.setAttribute('value', 'Mission réussie !');
        }
      }
    };

    if (this.el.sceneEl) {
      this.el.sceneEl.addEventListener('cannon-target-hit', this.onTargetHit);
    }
  },

  remove: function () {
    if (this.el.sceneEl) {
      this.el.sceneEl.removeEventListener('cannon-target-hit', this.onTargetHit);
    }
  }
});
