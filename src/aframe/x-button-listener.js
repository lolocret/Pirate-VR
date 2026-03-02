AFRAME.registerComponent('x-button-listener', {
  schema: {
    target: { type: 'selector' }
  },

  init: function () {
    const el = this.el;
    const target = this.data.target;

    if (!target) return;

    this._handler = function () {
      const vis = target.getAttribute('visible');
      target.setAttribute('visible', vis ? false : true);
    };

    el.addEventListener('xbuttondown', this._handler);
  },

  remove: function () {
    if (this._handler) this.el.removeEventListener('xbuttondown', this._handler);
  }
});
