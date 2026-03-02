AFRAME.registerComponent('controller-fallback', {
  schema: {
    hand: { type: 'string', default: '' }
  },

  init: function () {
    const el = this.el;
    const hand = this.data.hand;

    const update = () => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      let found = false;
      for (let i = 0; i < gps.length; i++) {
        const g = gps[i];
        if (!g) continue;
        const id = (g.id || '').toLowerCase();
        if (id.indexOf('oculus') !== -1 || id.indexOf('quest') !== -1 || id.indexOf('touch') !== -1 || id.indexOf('vive') !== -1) {
          if (!hand || id.indexOf(hand) !== -1 || !g.hand) {
            found = true;
            break;
          }
        }
      }

      // Always hide fallback spheres - we want hands instead
      const fallbacks = el.querySelectorAll('.fallback');
      fallbacks.forEach(node => node.setAttribute('visible', 'false'));
      // Always hide controller visual joysticks - we want hands instead
      const visuals = el.querySelectorAll('.controller-visual');
      visuals.forEach(node => node.setAttribute('visible', 'false'));
      // Always show full hand models
      const handModels = el.querySelectorAll('.hand-model');
      handModels.forEach(node => node.setAttribute('visible', 'true'));
    };

    this._interval = setInterval(update, 500);
    update();
  },

  remove: function () {
    if (this._interval) clearInterval(this._interval);
  }
});
