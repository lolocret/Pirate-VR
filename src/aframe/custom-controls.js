AFRAME.registerComponent('custom-controls', {
  schema: {
    hand: { type: 'string', default: '' },
    model: { type: 'string', default: '' }
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    // Configure common 6DoF controller components to try to attach
    const config = { hand: data.hand, model: false };
    el.setAttribute('meta-touch-controls', config);
    el.setAttribute('vive-controls', config);
    el.setAttribute('windows-motion-controls', config);
    el.setAttribute('oculus-touch-controls', config);
    el.setAttribute('laser-controls', { hand: data.hand });

    // If user provided a custom model, set it (model can be empty)
    if (data.model) {
      el.setAttribute('gltf-model', data.model);
    }

    // Map some button events to higher-level events for app code
    const mapEvent = (from, to) => el.addEventListener(from, () => el.emit(to));
    mapEvent('triggerdown', 'app-triggerdown');
    mapEvent('triggerup', 'app-triggerup');
    mapEvent('gripdown', 'app-gripdown');
    mapEvent('gripup', 'app-gripup');
    mapEvent('thumbstickmoved', 'app-thumbstickmoved');
  }
});
