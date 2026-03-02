AFRAME.registerComponent('map-picker', {
  schema: {
    target: { type: 'selector' },
    y: { type: 'number', default: 0.016 },
    color: { type: 'color', default: '#ffd34d' },
  },

  init() {
    this.onClick = this.onClick.bind(this);
    this.el.addEventListener('click', this.onClick);

    const targetEl = this.data.target || this.el;
    this.marker = targetEl.querySelector('.map-picker-marker');
    if (!this.marker) {
      this.marker = document.createElement('a-entity');
      this.marker.classList.add('map-picker-marker');
      this.marker.setAttribute(
        'geometry',
        'primitive: ring; radiusInner: 0.03; radiusOuter: 0.045; segmentsTheta: 24'
      );
      this.marker.setAttribute(
        'material',
        `shader: flat; color: ${this.data.color}; opacity: 0.95; transparent: true`
      );
      this.marker.setAttribute('rotation', '270 0 0');
      this.marker.setAttribute('position', `0 ${this.data.y} 0`);
      targetEl.appendChild(this.marker);
    }
  },

  remove() {
    this.el.removeEventListener('click', this.onClick);
  },

  onClick(evt) {
    const intersection = evt && evt.detail && evt.detail.intersection;
    if (!intersection || !intersection.point) return;

    const targetEl = this.data.target || this.el;
    const localPoint = intersection.point.clone();
    targetEl.object3D.worldToLocal(localPoint);

    this.marker.setAttribute(
      'position',
      `${localPoint.x.toFixed(3)} ${this.data.y} ${localPoint.z.toFixed(3)}`
    );

    // Log coords for copying
    // eslint-disable-next-line no-console
    console.log(
      `[map-picker] local position: ${localPoint.x.toFixed(3)} ${this.data.y.toFixed(
        3
      )} ${localPoint.z.toFixed(3)}`
    );
  },
});
