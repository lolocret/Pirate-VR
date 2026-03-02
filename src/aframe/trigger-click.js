/* global AFRAME */
AFRAME.registerComponent('trigger-click', {
  init: function () {
    this.onTrigger = () => {
      const raycaster = this.el.components.raycaster;
      const hits = raycaster && raycaster.intersectedEls;
      if (!hits || hits.length === 0) return;
      const target = hits[0];
      target.emit('click');
    };

    this.el.addEventListener('app-triggerdown', this.onTrigger);
  },

  remove: function () {
    this.el.removeEventListener('app-triggerdown', this.onTrigger);
  }
});
