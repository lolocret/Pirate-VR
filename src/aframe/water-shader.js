/* global AFRAME, THREE */
AFRAME.registerShader('simple-water', {
  schema: {
    color: { type: 'color', default: '#1b5a80' },
    opacity: { type: 'number', default: 0.8 },
    waveHeight: { type: 'number', default: 0.6 },
    waveSpeed: { type: 'number', default: 0.25 },
    waveScale: { type: 'number', default: 0.6 }
  },

  init: function (data) {
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(data.color) },
        opacity: { value: data.opacity },
        waveHeight: { value: data.waveHeight },
        waveSpeed: { value: data.waveSpeed },
        waveScale: { value: data.waveScale }
      },
      vertexShader: `
        uniform float time;
        uniform float waveHeight;
        uniform float waveSpeed;
        uniform float waveScale;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float t = time * waveSpeed;
          float wave = sin((pos.x * 0.02) + t) + cos((pos.z * 0.018) + t * 1.2);
          float ripple = sin((pos.x + pos.z) * 0.04 + t * 1.5);
          pos.y += (wave * 0.5 + ripple * 0.3) * waveHeight;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          float shade = 0.55 + 0.45 * vUv.y;
          gl_FragColor = vec4(color * shade, opacity);
        }
      `
    });
  },

  update: function (data) {
    if (!this.material) return;
    this.material.uniforms.color.value.set(data.color);
    this.material.uniforms.opacity.value = data.opacity;
    this.material.uniforms.waveHeight.value = data.waveHeight;
    this.material.uniforms.waveSpeed.value = data.waveSpeed;
    this.material.uniforms.waveScale.value = data.waveScale;
  },

  tick: function (time) {
    if (!this.material) return;
    this.material.uniforms.time.value = time * 0.001;
  }
});
