/* global AFRAME */
AFRAME.registerComponent('input-debug', {
  schema: {
    target: { type: 'selector', default: '#debug-status' }
  },

  init: function () {
    this.onTriggerDown = () => this.setText('TRIGGER');
    this.onTriggerUp = () => this.setText('TRIGGER UP');
    this.onGripDown = () => this.setText('GRIP');
    this.onClick = () => this.setText('CLICK');

    this.el.addEventListener('app-triggerdown', this.onTriggerDown);
    this.el.addEventListener('triggerdown', this.onTriggerDown);
    this.el.addEventListener('app-triggerup', this.onTriggerUp);
    this.el.addEventListener('triggerup', this.onTriggerUp);
    this.el.addEventListener('app-gripdown', this.onGripDown);
    this.el.addEventListener('gripdown', this.onGripDown);
    this.el.addEventListener('click', this.onClick);
  },

  setText: function (value) {
    if (!this.data.target) return;
    this.data.target.setAttribute('visible', 'true');
    this.data.target.setAttribute('value', value);
  },

  remove: function () {
    this.el.removeEventListener('app-triggerdown', this.onTriggerDown);
    this.el.removeEventListener('triggerdown', this.onTriggerDown);
    this.el.removeEventListener('app-triggerup', this.onTriggerUp);
    this.el.removeEventListener('triggerup', this.onTriggerUp);
    this.el.removeEventListener('app-gripdown', this.onGripDown);
    this.el.removeEventListener('gripdown', this.onGripDown);
    this.el.removeEventListener('click', this.onClick);
  }
});
