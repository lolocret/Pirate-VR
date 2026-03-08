/* src/aframe/realistic-ocean.js
   A-Frame component: physically-inspired ocean for VR (Gerstner waves + PBR-ish shading)
   No external textures required (but you can add a normal map if you want later).
*/
import * as THREE from "three";

AFRAME.registerComponent("realistic-ocean", {
  schema: {
    size: { type: "number", default: 2000 },      // plane width/height
    segments: { type: "int", default: 512 },      // geometry resolution (VR perf: 256–512)
    useSphere: { type: "boolean", default: false },
    sphereRadius: { type: "number", default: 6000 },
    // Wave settings
    waveCount: { type: "int", default: 8 },
    waveAmp: { type: "number", default: 0.9 },    // overall amplitude
    waveLength: { type: "number", default: 24.0 },// overall wavelength
    waveSpeed: { type: "number", default: 1.0 },  // overall speed
    timeScale: { type: "number", default: 1.0 },  // animation speed multiplier
    // Look
    deepColor: { type: "color", default: "#3d4b87" },
    shallowColor: { type: "color", default: "#446fc4" },
    foamColor: { type: "color", default: "#ffffff" },
    roughness: { type: "number", default: 0.12 }, // lower = shinier
    metalness: { type: "number", default: 0.0 },
    // Fresnel / spec
    fresnelPower: { type: "number", default: 5.0 },
    specStrength: { type: "number", default: 1.2 },
    // Foam
    foamThreshold: { type: "number", default: 0.55 },
    foamSoftness: { type: "number", default: 0.18 },
    // Misc
    receiveShadows: { type: "boolean", default: false },
    curvature: { type: "number", default: 0.000002 }, // horizon drop
  },

  init() {
    const d = this.data;

    // Geometry: plane or sphere
    let geo;
    if (d.useSphere) {
      geo = new THREE.SphereGeometry(d.sphereRadius, d.segments, Math.floor(d.segments / 2));
      geo.rotateX(-Math.PI / 2);
    } else {
      geo = new THREE.PlaneGeometry(d.size, d.size, d.segments, d.segments);
      geo.rotateX(-Math.PI / 2);
    }

    // Random-but-stable wave set
    const rng = mulberry32(1337);
    const waves = [];
    for (let i = 0; i < d.waveCount; i++) {
      const dir = new THREE.Vector2(rng() * 2 - 1, rng() * 2 - 1).normalize();
      waves.push({
        dir,
        amp: (0.25 + rng() * 0.75) * d.waveAmp,
        len: (0.6 + rng() * 1.6) * d.waveLength,
        spd: (0.6 + rng() * 1.4) * d.waveSpeed,
        steep: 0.35 + rng() * 0.35, // Gerstner steepness
      });
    }

    // Pack waves into uniforms (fixed max)
    const MAX_WAVES = 12;
    const waveDir = new Array(MAX_WAVES).fill(0).map(() => new THREE.Vector2(1, 0));
    const waveAmp = new Float32Array(MAX_WAVES);
    const waveLen = new Float32Array(MAX_WAVES);
    const waveSpd = new Float32Array(MAX_WAVES);
    const waveStp = new Float32Array(MAX_WAVES);

    for (let i = 0; i < MAX_WAVES; i++) {
      const w = waves[i] ?? waves[waves.length - 1];
      waveDir[i] = w.dir.clone();
      waveAmp[i] = w.amp;
      waveLen[i] = w.len;
      waveSpd[i] = w.spd;
      waveStp[i] = w.steep;
    }

    const mat = new THREE.ShaderMaterial({
      transparent: false,
      side: d.useSphere ? THREE.DoubleSide : THREE.FrontSide,
      uniforms: {
        uTime: { value: 0 },
        uCamPos: { value: new THREE.Vector3() },

        uDeepColor: { value: new THREE.Color(d.deepColor) },
        uShallowColor: { value: new THREE.Color(d.shallowColor) },
        uFoamColor: { value: new THREE.Color(d.foamColor) },

        uRoughness: { value: d.roughness },
        uMetalness: { value: d.metalness },
        uFresnelPower: { value: d.fresnelPower },
        uSpecStrength: { value: d.specStrength },

        uFoamThreshold: { value: d.foamThreshold },
        uFoamSoftness: { value: d.foamSoftness },

        uWaveCount: { value: Math.min(d.waveCount, MAX_WAVES) },
        uWaveDir: { value: waveDir },
        uWaveAmp: { value: waveAmp },
        uWaveLen: { value: waveLen },
        uWaveSpd: { value: waveSpd },
        uWaveStp: { value: waveStp },
        uCurvature: { value: d.curvature },

        // Lighting (tweakable)
        uSunDir: { value: new THREE.Vector3(-0.2, 0.9, -0.35).normalize() },
        uSunColor: { value: new THREE.Color("#ffffff") },
        uAmbient: { value: 0.22 },
      },
      vertexShader: /* glsl */`
        precision highp float;

        uniform float uTime;
        uniform int uWaveCount;

        uniform vec2  uWaveDir[12];
        uniform float uWaveAmp[12];
        uniform float uWaveLen[12];
        uniform float uWaveSpd[12];
        uniform float uWaveStp[12];
        uniform float uCurvature;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vHeight;

        // Gerstner wave evaluation + partial derivatives for normal
        void gerstner(in vec2 xz, in float t, out float height, out vec3 dPdX, out vec3 dPdZ) {
          height = 0.0;
          dPdX = vec3(1.0, 0.0, 0.0);
          dPdZ = vec3(0.0, 0.0, 1.0);

          for (int i = 0; i < 12; i++) {
            if (i >= uWaveCount) break;

            vec2 D = normalize(uWaveDir[i]);
            float A = uWaveAmp[i];
            float L = uWaveLen[i];
            float S = uWaveSpd[i];
            float Q = uWaveStp[i];

            float k = 6.28318530718 / max(L, 0.0001); // 2π/L
            float c = sqrt(9.81 / k) * S;             // deep water approx
            float f = k * dot(D, xz) - c * t;

            float cosf = cos(f);
            float sinf = sin(f);

            float disp = Q * A;
            dPdX += vec3(
              -D.x * D.x * disp * k * sinf,
              D.x * A * k * cosf,
              -D.x * D.y * disp * k * sinf
            );

            dPdZ += vec3(
              -D.x * D.y * disp * k * sinf,
              D.y * A * k * cosf,
              -D.y * D.y * disp * k * sinf
            );

            height += A * sinf;
          }
        }

        void main() {
          vec3 pos = position;
          vec2 xz = pos.xz;

          float h;
          vec3 dPdX;
          vec3 dPdZ;
          gerstner(xz, uTime, h, dPdX, dPdZ);

          pos.y += h;
          float dist = length(xz);
          pos.y -= dist * dist * uCurvature;

          vec3 n = normalize(cross(dPdZ, dPdX));

          vec4 world = modelMatrix * vec4(pos, 1.0);
          vWorldPos = world.xyz;
          vNormal = normalize(mat3(modelMatrix) * n);
          vHeight = h;

          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;

        uniform vec3 uCamPos;

        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;

        uniform float uRoughness;
        uniform float uMetalness;
        uniform float uFresnelPower;
        uniform float uSpecStrength;

        uniform float uFoamThreshold;
        uniform float uFoamSoftness;

        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uAmbient;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vHeight;

        float saturate(float x){ return clamp(x, 0.0, 1.0); }

        // Cheap microfacet-ish spec: Blinn-Phong mapped from roughness
        float specularTerm(vec3 N, vec3 V, vec3 L, float roughness) {
          vec3 H = normalize(V + L);
          float NoH = saturate(dot(N, H));
          float shininess = mix(180.0, 20.0, saturate(roughness));
          return pow(NoH, shininess);
        }

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(uCamPos - vWorldPos);
          vec3 L = normalize(uSunDir);

          float NoL = saturate(dot(N, L));
          float NoV = saturate(dot(N, V));

          float fresnel = pow(1.0 - NoV, uFresnelPower);

          float shallow = saturate((vHeight + 1.2) * 0.35);
          vec3 baseCol = mix(uDeepColor, uShallowColor, shallow);

          vec3 diffuse = baseCol * (uAmbient + NoL * 0.9);

          float spec = specularTerm(N, V, L, uRoughness) * uSpecStrength;
          vec3 specCol = mix(vec3(0.04), baseCol, uMetalness);
          vec3 specular = specCol * spec * uSunColor;

          float foamMask = smoothstep(uFoamThreshold, uFoamThreshold + uFoamSoftness, 1.0 - N.y);
          foamMask *= smoothstep(0.0, 1.0, (vHeight + 0.4));
          vec3 foam = uFoamColor * foamMask * (0.55 + NoL * 0.45);

          vec3 col = diffuse + specular * (0.35 + 0.65 * fresnel) + foam;

          float dist = length(uCamPos - vWorldPos);
          float fog = saturate(dist / 1500.0);
          vec3 fogCol = mix(uDeepColor, vec3(0.75, 0.85, 0.95), 0.25);
          col = mix(col, fogCol, fog * 0.55);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = true;
    mesh.receiveShadow = !!d.receiveShadows;
    if (d.useSphere) {
      mesh.position.y = -d.sphereRadius + 0.05;
    }

    this.el.setObject3D("mesh", mesh);
    this.mesh = mesh;
    this.mat = mat;
  },

  tick(t) {
    if (!this.mat) return;
    this.mat.uniforms.uTime.value = t * 0.001 * (this.data.timeScale || 1.0);

    const cam = this.el.sceneEl.camera;
    if (cam) {
      cam.getWorldPosition(this.mat.uniforms.uCamPos.value);
    }
  },

  remove() {
    if (this.mesh) {
      this.el.removeObject3D("mesh");
      this.mesh.geometry?.dispose();
      this.mesh.material?.dispose();
    }
  },
});

// Deterministic RNG
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
