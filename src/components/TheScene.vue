<script setup>
  import '../primitives/index.js';
  import '../aframe/fit-model.js';
  import '../aframe/look-at.js';
  import '../aframe/teleport-on-click.js';
  import TheCameraRig from './TheCameraRig.vue';
  const baseUrl = import.meta.env.BASE_URL;
  const skyUrl = `${baseUrl}assets/sky.jpg`;
  const boatUrl = `${baseUrl}assets/boat.glb`;
  const mapUrl = `${baseUrl}assets/map.glb`;
  const handUrl = `${baseUrl}assets/main.glb`;
  const planUrl = `${baseUrl}assets/plan.png`;

  defineProps({
    scale: Number,
    overlaySelector: String,
  });

  const emit = defineEmits(['loaded']);
</script>

<template>
  <a-scene
    stats
    @loaded="emit('loaded')"
    xr-mode-ui="enabled: true"
    renderer="colorManagement: true"
    fog="type: exponential; color: #6f5a8f; near: 8; far: 28; density: 0.0016"

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

    <a-entity id="world" scale="2 2 2">
      <a-sky
        :material="`shader: flat; side: back; src: ${skyUrl}; color: #ffffff`"
        radius="640"
        rotation="0 -90 0"
      ></a-sky>

      <a-ocean
        material="color: #10364a; metalness: 0.05; roughness: 0.25; transparent: true; opacity: 0.9;"
        width="2080"
        depth="2080"
        density="80"
        speed="1.6"
        position="0 0 0"
        amplitude="1.2"
      ></a-ocean>
      <a-ocean
        material="color: #0b2a3a; metalness: 0.1; roughness: 0.15; transparent: true; opacity: 0.4;"
        width="2080"
        depth="2080"
        density="85"
        speed="1.4"
        position="0 0.03 0"
        amplitude="0.6"
        amplitude-variance="0.35"
      ></a-ocean>
      <a-ocean
        material="color: #1b4f72; metalness: 0.02; roughness: 0.35; transparent: true; opacity: 0.6;"
        width="2080"
        depth="2080"
        density="70"
        speed="1.1"
        position="0 0.06 0"
        amplitude="1.4"
        amplitude-variance="0.25"
      ></a-ocean>

      <a-entity
        id="boat-model"
        :gltf-model="boatUrl"
        fit-model="targetSize: 480; y: -20; z: -80; x: 0"
        rotation="0 180 0"
      ></a-entity>

      <TheCameraRig />
    </a-entity>
  </a-scene>
</template> 
