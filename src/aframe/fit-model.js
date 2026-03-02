/* global AFRAME, THREE */
AFRAME.registerComponent('fit-model', {
  schema: {
    targetSize: {type: 'number', default: 6},
    x: {type: 'number', default: 0},
    y: {type: 'number', default: 0.2},
    z: {type: 'number', default: -6},
  },

  init: function () {
    this.onModelLoaded = this.onModelLoaded.bind(this);
    this.el.addEventListener('model-loaded', this.onModelLoaded);
  },

  remove: function () {
    this.el.removeEventListener('model-loaded', this.onModelLoaded);
  },

  onModelLoaded: function (evt) {
    const model = evt.detail?.model;
    if (!model) return;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? this.data.targetSize / maxDim : 1;

    // Center the model in local space so parent transforms affect children.
    model.position.sub(center);

    // Scale and position the entity so children (e.g., rig) move with the boat.
    this.el.object3D.scale.setScalar(scale);

    // Place the boat so its bottom sits at data.y in world space.
    const bottomLocalY = box.min.y - center.y;
    this.el.object3D.position.set(
      this.data.x,
      this.data.y - bottomLocalY * scale,
      this.data.z
    );
  }
});
