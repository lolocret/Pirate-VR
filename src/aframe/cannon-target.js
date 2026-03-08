/* global AFRAME, THREE */
import { playHit, playKill } from './audio-fx.js';

AFRAME.registerComponent('cannon-target', {
  schema: {
    name:          { type: 'string', default: '' },
    hp:            { type: 'number', default: 3 },
    barOffset:     { type: 'vec3',   default: { x: 0, y: 6, z: 0 } },
    barWidth:      { type: 'number', default: 5 },
    attackInterval:{ type: 'number', default: 8000 },
    attackRange:   { type: 'number', default: 400 },
    requireNearCanon: { type: 'boolean', default: false },
    canonPos:      { type: 'vec3', default: { x: 27, y: 61, z: -55 } },
    canonTolerance:{ type: 'number', default: 6 }
  },

  init: function () {
    this._hp = this.data.hp;
    this._dead = false;
    this._camPos = new THREE.Vector3();
    this._rigPos  = new THREE.Vector3();
    this._lastAttack = 0;

    // Barre de vie
    this._barWrapper = document.createElement('a-entity');
    this._barWrapper.setAttribute('position', `${this.data.barOffset.x} ${this.data.barOffset.y} ${this.data.barOffset.z}`);

    const bg = document.createElement('a-plane');
    bg.setAttribute('width', this.data.barWidth);
    bg.setAttribute('height', '0.6');
    bg.setAttribute('material', 'shader: flat; color: #111; opacity: 0.85; transparent: true; side: double');

    this._barFg = document.createElement('a-plane');
    this._barFg.setAttribute('width', this.data.barWidth);
    this._barFg.setAttribute('height', '0.6');
    this._barFg.setAttribute('position', '0 0 0.01');
    this._barFg.setAttribute('material', 'shader: flat; color: #00cc44; side: double');

    const label = document.createElement('a-text');
    const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
    label.setAttribute('value', this.data.name);
    label.setAttribute('color', '#ffffff');
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 0.6 0.01');
    label.setAttribute('scale', '0.7 0.7 0.7');
    label.setAttribute('font', `${base}fonts/DejaVu-sdf.fnt`);
    this._label = label;

    this._barWrapper.appendChild(bg);
    this._barWrapper.appendChild(this._barFg);
    this._barWrapper.appendChild(label);
    this.el.appendChild(this._barWrapper);

    this.onHit = () => {
      if (this._dead) return;
      this._hp = Math.max(0, this._hp - 1);
      this._updateBar();
      if (this._hp <= 0) {
        playKill();
        this._die();
      } else {
        playHit();
      }
    };

    this.el.addEventListener('cannon-hit', this.onHit);
  },

  _updateBar: function () {
    const ratio = this._hp / this.data.hp;
    this._barFg.object3D.scale.x = ratio;
    const color = ratio > 0.5 ? '#00cc44' : ratio > 0.25 ? '#ff8800' : '#cc0000';
    this._barFg.setAttribute('material', `shader: flat; color: ${color}; side: double`);
  },

  _die: function () {
    this._dead = true;
    this._barWrapper.setAttribute('visible', 'false');
    this.el.setAttribute('visible', 'false');
    this.el.emit('cannon-target-killed', { name: this.data.name }, false);
    if (this.el.sceneEl) {
      this.el.sceneEl.emit('cannon-target-killed', { name: this.data.name }, false);
    }
  },

  tick: function (time) {
    if (!this._barWrapper || this._dead) return;
    const cam = this.el.sceneEl && this.el.sceneEl.camera;
    if (!cam) return;
    cam.getWorldPosition(this._camPos);
    this._barWrapper.object3D.lookAt(this._camPos);

    // Attaque périodique si le joueur est à portée
    if (time - this._lastAttack >= this.data.attackInterval) {
      const rig = document.querySelector('#camera-rig');
      if (rig && rig.object3D) {
        rig.object3D.getWorldPosition(this._rigPos);
        if (this.data.requireNearCanon) {
          const c = this.data.canonPos;
          const nearCanon =
            Math.abs(this._rigPos.x - c.x) <= this.data.canonTolerance &&
            Math.abs(this._rigPos.y - c.y) <= this.data.canonTolerance &&
            Math.abs(this._rigPos.z - c.z) <= this.data.canonTolerance;
          if (!nearCanon) return;
        }
        this.el.object3D.getWorldPosition(this._camPos);
        const dx = this._camPos.x - this._rigPos.x;
        const dy = this._camPos.y - this._rigPos.y;
        const dz = this._camPos.z - this._rigPos.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist <= this.data.attackRange) {
          this._lastAttack = time;
          if (this.el.sceneEl) {
            this.el.sceneEl.emit('player-damage', { attacker: this.data.name }, false);
          }
        }
      }
    }
  },

  remove: function () {
    this.el.removeEventListener('cannon-hit', this.onHit);
  }
});
