<script setup>
  import { ref } from 'vue';
  import '../primitives/index.js';
  import '../aframe/fit-model.js';
  import '../aframe/look-at.js';
  import '../aframe/teleport-on-click.js';
  import '../aframe/realistic-ocean.js';
  import '../aframe/proximity-dialogue.js';
  import '../aframe/cannon-target.js';
  import '../aframe/cannon-mission.js';
  import '../aframe/ambient-audio.js';
  import TheCameraRig from './TheCameraRig.vue';
  const baseUrl = import.meta.env.BASE_URL;
  const skyUrl = `${baseUrl}assets/sky.jpg`;
  const boatUrl = `${baseUrl}assets/boat.glb`;
  const mapUrl = `${baseUrl}assets/map.glb`;
  const handUrl = `${baseUrl}assets/main.glb`;
  const planUrl = `${baseUrl}assets/plan.png`;
  const tresorUrl = `${baseUrl}assets/tresor.glb`;

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
    ambient-audio

  >
    <a-assets>
      <a-asset-item id="boat" :src="boatUrl" crossorigin="anonymous"></a-asset-item>
      <a-asset-item id="map" :src="mapUrl" crossorigin="anonymous"></a-asset-item>
      <a-asset-item id="hand" :src="handUrl" crossorigin="anonymous"></a-asset-item>
      <img id="plan-texture" :src="planUrl" crossorigin="anonymous">
      <img id="sky-texture" :src="skyUrl" crossorigin="anonymous">
      <a-asset-item id="tresor" :src="tresorUrl" crossorigin="anonymous"></a-asset-item>
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
        realistic-ocean="useSphere: true; sphereRadius: 9000; size: 20000; segments: 512; waveCount: 8; waveAmp: 1.1; waveLength: 28; waveSpeed: 0.9; timeScale: 0.7; roughness: 0.12; fresnelPower: 5.0; specStrength: 1.2; foamThreshold: 0.55; foamSoftness: 0.18; curvature: 0.0000007"
        position="0 4 0"
      ></a-entity>

      <a-entity
        id="boat-model"
        :gltf-model="boatUrl"
        fit-model="targetSize: 480; y: -20; z: -80; x: 0"
        rotation="0 180 0"
      ></a-entity>

      <a-entity
        id="ching-shih"
        :gltf-model="`${baseUrl}assets/pirate.glb`"
        position="5.966 63.135 -138.7"
        rotation="0 300 0"
        scale="3.5 3.5 3.5"
        proximity-dialogue="target: #camera-rig; distance: 50; clickToSpeak: true; speak: true; voiceLang: fr-FR; rate: 0.9; pitch: 1.3; messages: Je suis Ching Shih. Née dans la misère au bord de la rivière des Perles, j'ai épousé un chef pirate... puis j'ai pris sa place. | À ma mort, je commandais 1 800 navires et 80 000 hommes. Personne — ni la Chine, ni le Portugal, ni l'Angleterre — n'a pu me vaincre. Je suis la pirate la plus puissante de l'Histoire. | J'ai imposé mes propres lois à ma flotte — pas de pillage sans ordre, pas de trahison. Ceux qui désobéissaient ne désobéissaient qu'une fois. La discipline nous a rendus invincibles. | Et toi, matelot ? Tu es nouveau sur ce navire. Tu n'as encore rien prouvé. Le titre de corsaire de la Flotte Rouge ne se donne pas... il se gagne au combat. | Une créature des abysses rôde dans ces eaux — le Kraken. Il a déjà coulé trois de mes navires. Monte au pont supérieur, utilise la longue-vue pour repérer le trésor englouti, puis élimine la bête."
      ></a-entity>

      <!-- Trésor dans l'eau — cible du télescope -->
      <a-entity
        id="tresor"
        class="telescope-target"
        :gltf-model="tresorUrl"
        position="0 -1.5 350"
        rotation="0 180 0"
        scale="5 5 5"
      ></a-entity>

      <a-entity
        id="kraken"
        class="cannon-target telescope-target"
        cannon-target="name: Kraken; hp: 5; barOffset: 0 8 0; barWidth: 6; attackInterval: 5000; attackRange: 800; requireNearCanon: true; canonPos: 27 61 -55; canonTolerance: 6"
        :gltf-model="`${baseUrl}assets/kraken.glb`"
        position="335.28 -2.065 -29.98"
        rotation="30 90 0"
        scale="2 2 2"
      >
        <a-sphere
          class="cannon-hitbox"
          radius="5"
          material="opacity: 0; transparent: true; depthWrite: false"
        ></a-sphere>
      </a-entity>

      <TheCameraRig />
    </a-entity>
  </a-scene>
</template> 
