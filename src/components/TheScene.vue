<script setup>
  import { ref } from 'vue';
  import '../primitives/index.js';
  import '../aframe/fit-model.js';
  import '../aframe/look-at.js';
  import '../aframe/teleport-on-click.js';
  import '../aframe/realistic-ocean.js';
  import '../aframe/cannon-target.js';
  import '../aframe/cannon-mission.js';
  import TheCameraRig from './TheCameraRig.vue';
  const baseUrl = import.meta.env.BASE_URL;
  const skyUrl = `${baseUrl}assets/sky.jpg`;
  const boatUrl = `${baseUrl}assets/boat.glb`;
  const mapUrl = `${baseUrl}assets/map.glb`;
  const handUrl = `${baseUrl}assets/main.glb`;
  const planUrl = `${baseUrl}assets/plan.png`;

  const props = defineProps({
    scale: Number,
    overlaySelector: String,
  });

  const emit = defineEmits(['loaded']);
  const sceneReady = ref(false);
</script>

<template>
  <a-scene
    @loaded="sceneReady = true; emit('loaded')"
    xr-mode-ui="enabled: true"
    renderer="colorManagement: true; antialias: true; precision: highp"
    fog="type: exponential; color: #6f5a8f; near: 8; far: 28; density: 0.001"
    cannon-mission

  >
    <a-assets>
      <a-asset-item id="boat" :src="boatUrl" crossorigin="anonymous"></a-asset-item>
      <a-asset-item id="map" :src="mapUrl" crossorigin="anonymous"></a-asset-item>
      <a-asset-item id="hand" :src="handUrl" crossorigin="anonymous"></a-asset-item>
      <img id="plan-texture" :src="planUrl" crossorigin="anonymous">
      <img id="sky-texture" :src="skyUrl" crossorigin="anonymous">
    </a-assets>

    <a-entity 
    light="type: ambient; color: #cfe2ff; intensity: 0.55"
    ></a-entity>
    <a-entity
      light="type: directional; color: #b7d8ff; intensity: 0.85"
      position="3 6 2"
    ></a-entity>

    <a-entity v-if="sceneReady" id="world" scale="2 2 2">
      <a-sky
        :material="`shader: flat; side: back; src: ${skyUrl}; color: #ffffff`"
        radius="1200"
        rotation="0 -90 0"
      ></a-sky>

      <a-entity
        realistic-ocean="useSphere: true; sphereRadius: 9000; size: 20000; segments: 512; waveCount: 8; waveAmp: 0.9; waveLength: 28; waveSpeed: 1.0; roughness: 0.12; fresnelPower: 5.0; specStrength: 1.2; foamThreshold: 0.55; foamSoftness: 0.18; curvature: 0.0000007"
      ></a-entity>

      <a-entity
        id="boat-model"
        :gltf-model="boatUrl"
        fit-model="targetSize: 480; y: -20; z: -80; x: 0"
        rotation="0 180 0"
      ></a-entity>

      <a-entity
        id="kraken"
        class="cannon-target"
        cannon-target="name: Kraken"
        :gltf-model="`${baseUrl}assets/kraken.glb`"
        position="-27 2 -320"
        rotation="0 -120 0"
        scale="3 3 3"
      >
        <a-sphere
          class="cannon-hitbox"
          radius="5"
          material="opacity: 0; transparent: true; depthWrite: false"
        ></a-sphere>
      </a-entity>

      <a-entity
        id="monstre"
        class="cannon-target"
        cannon-target="name: Monstre"
        :gltf-model="`${baseUrl}assets/monstre.glb`"
        position="-27 2 -260"
        rotation="0 140 0"
        scale="4 4 4"
      >
        <a-sphere
          class="cannon-hitbox"
          radius="7"
          material="opacity: 0; transparent: true; depthWrite: false"
        ></a-sphere>
      </a-entity>

      <TheCameraRig />
    </a-entity>
  </a-scene>
</template> 
