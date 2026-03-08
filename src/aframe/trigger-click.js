/* global AFRAME */
AFRAME.registerComponent('trigger-click', {
  init: function () {
    this._lastEmit = 0;
    this.onTrigger = () => {
      const raycaster = this.el.components.raycaster;
      if (!raycaster) return;
      const now = Date.now();
      if (now - this._lastEmit < 120) return;
      this._lastEmit = now;

      const intersections = raycaster.intersections || [];
      let targetEl = null;
      if (intersections.length) {
        const hitObj = intersections[0].object;
        const rawEl = hitObj && hitObj.el;
        targetEl = rawEl && rawEl.closest
          ? rawEl.closest('.clickable, [clickable]')
          : rawEl;
      } else {
        const hits = raycaster.intersectedEls || [];
        if (hits.length) {
          const rawEl = hits[0];
          targetEl = rawEl && rawEl.closest
            ? rawEl.closest('.clickable, [clickable]')
            : rawEl;
        }
      }

      if (!targetEl) return;
      targetEl.emit('click');
    };

    this.el.addEventListener('app-triggerdown', this.onTrigger);
    this.el.addEventListener('triggerdown', this.onTrigger);
  },

  remove: function () {
    this.el.removeEventListener('app-triggerdown', this.onTrigger);
    this.el.removeEventListener('triggerdown', this.onTrigger);
  }
});
