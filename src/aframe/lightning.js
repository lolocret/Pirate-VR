/* global AFRAME */
AFRAME.registerComponent('lightning', {
  schema: {
    minDelay: {type: 'number', default: 3000},
    maxDelay: {type: 'number', default: 9000},
    flashMs: {type: 'number', default: 120},
    doubleChance: {type: 'number', default: 0.4},
    intensity: {type: 'number', default: 4},
    afterglow: {type: 'number', default: 0.6}
  },

  init: function () {
    this.light = this.el.getObject3D('light');
    this.baseIntensity = 0;
    this.timer = null;
    this.trigger = this.trigger.bind(this);
  },

  play: function () {
    if (!this.light) this.light = this.el.getObject3D('light');
    if (this.light) this.baseIntensity = this.light.intensity || 0;
    this.scheduleNext();
  },

  pause: function () {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  scheduleNext: function () {
    const min = Math.max(200, this.data.minDelay);
    const max = Math.max(min, this.data.maxDelay);
    const delay = min + Math.random() * (max - min);
    this.timer = setTimeout(this.trigger, delay);
  },

  trigger: function () {
    if (!this.light) this.light = this.el.getObject3D('light');
    if (!this.light) return;

    const strong = this.data.intensity;
    const weak = this.data.afterglow;
    const flashMs = this.data.flashMs;
    const doubleFlash = Math.random() < this.data.doubleChance;

    this.light.intensity = strong;
    setTimeout(() => {
      this.light.intensity = weak;
      setTimeout(() => {
        if (doubleFlash) {
          this.light.intensity = strong * 0.8;
          setTimeout(() => {
            this.light.intensity = weak;
            setTimeout(() => {
              this.light.intensity = this.baseIntensity;
              this.scheduleNext();
            }, flashMs);
          }, flashMs);
        } else {
          this.light.intensity = this.baseIntensity;
          this.scheduleNext();
        }
      }, flashMs);
    }, flashMs);
  }
});
