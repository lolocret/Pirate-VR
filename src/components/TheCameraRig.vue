<script setup>
  import '../aframe/disable-in-vr.js';
  import '../aframe/hide-in-vr.js';
  import '../aframe/simple-navmesh-constraint.js';
  import '../aframe/blink-controls.js';
  import '../aframe/physx-grab.js';
  import '../aframe/controller-fallback.js';
  import '../aframe/custom-controls.js';
  import '../aframe/x-button-listener.js';
  import '../aframe/asset-selector.js';
  import '../aframe/telescope-scope.js';
  import '../aframe/cannon-shooter.js';
  import '../aframe/input-debug.js';
  import '../aframe/aim-reticle.js';
  import '../aframe/force-rig-position.js';
  import '../aframe/trigger-click.js';
  import '../aframe/click-feedback.js';
  import '../aframe/mission-hud.js';
  import '../aframe/player-hud.js';

  const base = import.meta.env.BASE_URL;
  const mapModelUrl = `${base}assets/map-converted.glb`;
  const planTextureUrl = `${base}assets/plan.png`;
</script>

<template>
  <a-entity
    id="camera-rig"
    position="0 65 -135"
    rotation="0 180 0"
    force-rig-position="position: 0 65 -135"
  >
    <a-entity
      id="head"
      look-controls="pointerLockEnabled: true"
      wasd-controls="enabled: true"
      camera
      telescope-scope="controller: #asset-hand; attachTo: #asset-hand; activeAsset: Longue vue; useScopeMesh: false; zoomFov: 10; rig: #camera-rig; telescopePos: 2 145 -82; posTolerance: 6; allowDesktop: true; forceEnable: true"
      mission-hud="rig: #camera-rig"
      player-hud
      position="0 0 0"
    >
      <a-text
        id="mission-status"
        value=""
        visible="false"
        position="0 -0.15 -0.45"
        align="center"
        color="#ffffff"
        scale="0.2 0.2 0.2"
        :font="`${base}fonts/DejaVuSans-msdf.fnt?v=3`"
      ></a-text>
      <a-entity
        geometry="primitive: circle; radius: 0.0003;"
        material="shader: flat; color: white;"
        cursor
        raycaster="far: 25; objects: .clickable, [clickable]; showLine: false;"
        position="0 0 -0.1"
        disable-in-vr="component: raycaster; disableInAR: false;"
        hide-in-vr="hideInAR: false"
      ></a-entity>
    </a-entity>


    <!-- Left hand: map attached to left controller -->
    <a-entity
      id="hand-left"
      meta-touch-controls="hand: left; model: true"
      laser-controls="hand: left; model: true"
      raycaster="far: 4; objects: [clickable]; showLine: true;"
      custom-controls="hand: left"
      trigger-click
      obb-collider
      physx-grab
      controller-fallback="hand: left"
      x-button-listener="target: #hand-map"
    >
      <!-- joystick visual attached to the hand (small and close) -->
      <a-cylinder class="controller-visual" visible="false" height="0.04" radius="0.008" position="0 -0.02 0.02" rotation="0 0 0" material="color: #333"></a-cylinder>
      <a-sphere class="fallback" radius="0.03" material="color: #44ff44" visible="false" position="0 0 0"></a-sphere>
    
      <!-- map model with plan overlay - POSITIONED AT HAND LEVEL -->
    <a-entity
      id="hand-map"
      :gltf-model="mapModelUrl"
      scale="0.15 0.15 0.15"
      position="0 -0.15 0.1"
      rotation="0 0 0"
    >
      <!-- overlay the plan texture FLAT on the map surface -->
      <a-plane
        width="3.2"
        height="2.4"
        position="0 0.014 -0.02"
        rotation="270 0 0"
        :material="`shader: flat; src: ${planTextureUrl}; side: double; transparent: true`"
      ></a-plane>
      <!-- teleport points on the map (click to teleport to the boat) -->
      <a-entity
        class="clickable"
        clickable
        click-feedback
        geometry="primitive: ring; radiusInner: 0.07; radiusOuter: 0.1; segmentsTheta: 24"
        material="shader: flat; color: #79563d; opacity: 0.9; transparent: true"
        position="-0.045 0.022 0.556"
        rotation="270 0 0"
        teleport-on-click="rig: #camera-rig; position: 27 61 -55; useWorldPosition: false"
      >
        <a-circle
          class="clickable"
          clickable
          geometry="primitive: circle; radius: 0.07"
          material="shader: flat; color: #79563d; opacity: 0.2; transparent: true"
          position="0 0 0.001"
          rotation="0 0 0"
        ></a-circle>
      </a-entity>
      <a-entity
        class="clickable"
        clickable
        click-feedback
        geometry="primitive: ring; radiusInner: 0.07; radiusOuter: 0.1; segmentsTheta: 24"
        material="shader: flat; color: #79563d; opacity: 0.9; transparent: true"
        position="-0.459 0.022 0.412"
        rotation="270 0 0"
        teleport-on-click="rig: #camera-rig; position: 4 64 -32; useWorldPosition: false"
      >
        <a-circle
          class="clickable"
          clickable
          geometry="primitive: circle; radius: 0.07"
          material="shader: flat; color: #79563d; opacity: 0.2; transparent: true"
          position="0 0 0.001"
          rotation="0 0 0"
        ></a-circle>
      </a-entity>
      <a-entity
        class="clickable"
        clickable
        click-feedback
        geometry="primitive: ring; radiusInner: 0.07; radiusOuter: 0.1; segmentsTheta: 24"
        material="shader: flat; color: #79563d; opacity: 0.9; transparent: true"
        position="0.7 0.022 0.274"
        rotation="270 0 0"
        teleport-on-click="rig: #camera-rig; position: 0 65 -135; useWorldPosition: false"
      >
        <a-circle
          class="clickable"
          clickable
          geometry="primitive: circle; radius: 0.07"
          material="shader: flat; color: #79563d; opacity: 0.2; transparent: true"
          position="0 0 0.001"
          rotation="0 0 0"
        ></a-circle>
      </a-entity>
      <a-entity
        class="clickable"
        clickable
        click-feedback
        geometry="primitive: ring; radiusInner: 0.07; radiusOuter: 0.1; segmentsTheta: 24"
        material="shader: flat; color: #79563d; opacity: 0.9; transparent: true"
        position="0.20 0.022 -0.63"
        rotation="270 0 0"
        teleport-on-click="rig: #camera-rig; position: 2 145 -82; useWorldPosition: false"
      >
        <a-circle
          class="clickable"
          clickable
          geometry="primitive: circle; radius: 0.07"
          material="shader: flat; color: #79563d; opacity: 0.2; transparent: true"
          position="0 0 0.001"
          rotation="0 0 0"
        ></a-circle>
      </a-entity>
    </a-entity>
    </a-entity>

    <!-- Right hand: asset menu attached to right controller -->
    <a-entity
      id="asset-hand"
      meta-touch-controls="hand: right; model: true"
      laser-controls="hand: right; model: true"
      raycaster="near: 0.01; far: 2000; objects: .clickable, [clickable], .cannon-target, .telescope-target; showLine: true"
      cursor="rayOrigin: entity; fuse: false"
      custom-controls="hand: right"
      controller-fallback="hand: right"
      asset-selector="hand: right"
      cannon-shooter="activeAsset: Pistolet; rig: #camera-rig; canonPos: 27 61 -55; posTolerance: 4; allowDesktop: true; forceEnable: true"
      aim-reticle="distance: 700"
      trigger-click
    >
      <!-- Display area for selected asset - bigger and more forward -->
      <a-entity id="asset-display-right" position="0.204 -0.692 0.355" rotation="-30 0 0" scale="1 1 1"></a-entity>
    </a-entity>
  </a-entity>
</template>
