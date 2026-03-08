/* global AFRAME */
AFRAME.registerComponent('cannon-mission', {
  schema: {
    status: { type: 'selector', default: '#mission-status' }
  },

  init: function () {
    this.statusEl = this.data.status;

    this.onTargetKilled = (evt) => {
      const name = evt && evt.detail && evt.detail.name;
      if (name !== 'Kraken') return;
      if (this.statusEl) {
        this.statusEl.setAttribute('visible', 'true');
        this.statusEl.setAttribute('value', 'Mission réussie ! Le Kraken est vaincu !');
      }
    };

    if (this.el.sceneEl) {
      this.el.sceneEl.addEventListener('cannon-target-killed', this.onTargetKilled);
    }
  },

  remove: function () {
    if (this.el.sceneEl) {
      this.el.sceneEl.removeEventListener('cannon-target-killed', this.onTargetKilled);
    }
  }
});
