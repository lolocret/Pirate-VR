/* global AFRAME */
AFRAME.registerComponent('teleport-on-click', {
  schema: {
    rig: {type: 'selector', default: '#rig'},
    position: {type: 'vec3'},
    useWorldPosition: {type: 'boolean', default: true},
    offset: {type: 'vec3', default: {x: 0, y: 0, z: 0}}
  },
  init: function () {
    this.onClick = () => {
      if (!this.data.rig) return;
      let targetPos;
      if (this.data.useWorldPosition) {
        const worldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(worldPos);
        worldPos.x += this.data.offset.x;
        worldPos.y += this.data.offset.y;
        worldPos.z += this.data.offset.z;
        targetPos = worldPos;
      } else {
        targetPos = this.data.position;
      }
      this.data.rig.setAttribute('position', `${targetPos.x} ${targetPos.y} ${targetPos.z}`);
      this.data.rig.emit('teleported', { position: { x: targetPos.x, y: targetPos.y, z: targetPos.z } }, false);
    };
    this.el.addEventListener('click', this.onClick);
  },
  remove: function () {
    this.el.removeEventListener('click', this.onClick);
  }
});
