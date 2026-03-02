/* global AFRAME */
AFRAME.registerComponent('gaze-react', {
  schema: {
    yaw: {type: 'number', default: 6},
    dur: {type: 'number', default: 600}
  },
  init: function () {
    this.baseRotation = this.el.getAttribute('rotation') || {x: 0, y: 0, z: 0};
    this.onEnter = () => {
      const to = {
        x: this.baseRotation.x,
        y: this.baseRotation.y + this.data.yaw,
        z: this.baseRotation.z
      };
      this.el.setAttribute('animation__gaze', {
        property: 'rotation',
        to: `${to.x} ${to.y} ${to.z}`,
        dir: 'alternate',
        dur: this.data.dur,
        loop: 2,
        easing: 'easeInOutSine'
      });
    };
    this.onLeave = () => {
      this.el.removeAttribute('animation__gaze');
      this.el.setAttribute('rotation', this.baseRotation);
    };
    this.el.addEventListener('mouseenter', this.onEnter);
    this.el.addEventListener('mouseleave', this.onLeave);
  },
  remove: function () {
    this.el.removeEventListener('mouseenter', this.onEnter);
    this.el.removeEventListener('mouseleave', this.onLeave);
  }
});
