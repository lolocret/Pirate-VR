/* global AFRAME */
AFRAME.registerComponent('click-feedback', {
  schema: {
    idleColor: { type: 'color', default: '#79563d' },
    hoverColor: { type: 'color', default: '#ffd166' },
    activeColor: { type: 'color', default: '#ff6b6b' }
  },

  init: function () {
    this.onHover = () => {
      this.el.setAttribute('material', 'color', this.data.hoverColor);
    };
    this.onClear = () => {
      this.el.setAttribute('material', 'color', this.data.idleColor);
    };
    this.onClick = () => {
      this.el.setAttribute('material', 'color', this.data.activeColor);
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        this.el.setAttribute('material', 'color', this.data.idleColor);
      }, 120);
    };

    this.el.addEventListener('raycaster-intersected', this.onHover);
    this.el.addEventListener('raycaster-intersected-cleared', this.onClear);
    this.el.addEventListener('click', this.onClick);
  },

  remove: function () {
    this.el.removeEventListener('raycaster-intersected', this.onHover);
    this.el.removeEventListener('raycaster-intersected-cleared', this.onClear);
    this.el.removeEventListener('click', this.onClick);
    clearTimeout(this._timer);
  }
});
