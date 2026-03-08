<script setup>
  import { ref } from 'vue';

  defineProps({
    loaded: Boolean,
  });

  const showOnboarding = ref(true);

  function enterScene() {
    showOnboarding.value = false;
    if (AFRAME.utils.device.checkHeadsetConnected() && !AFRAME.utils.device.isMobile()) {
      document.querySelector('a-scene').enterVR();
    }
    document.querySelector('a-scene').emit('enter-scene');
  }
</script>

<template>
  <div id="onboarding" v-if="showOnboarding">
    <div>
      <h1>Pirate VR – Mission en mer</h1>
      <p v-if="!loaded">Chargement...</p>
      <button v-if="loaded" @click="enterScene()">Entrer dans la mer</button>
      <div class="licences">
        <section>
          <h4>Commandes</h4>
          <ul>
            <li>
              Desktop – Déplacement clavier (ZQSD/WASD ou flèches) + souris pour regarder.
            </li>
            <li>
              VR – Téléportation via la carte + laser pour viser.
            </li>
            <li>
              Longue-vue – Gâchette pour zoomer quand elle est sélectionnée.
            </li>
          </ul>
        </section>
        <section>
          <h4>Objectif</h4>
          <p>
            Repérez le Kraken dans l’eau, puis utilisez le canon pour le toucher.
            La mission est validée quand le Kraken est détruit.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
  h1 { font-size: 1.5rem }
  a {
    color: #eee;
    text-decoration: none;
  }
  .licences {
    margin: 2rem 0;
    padding-bottom: 1rem;
    font-size: 1rem;
    text-align: left;
  }
  .licences dt {
    padding-top: 0.75rem;
    font-size: 0.9rem;
    font-weight: bold;
  }
  .licences dd {
    margin-left: 0;
    font-size: 0.8rem;
  }

  #onboarding {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #333;
    color: #ccc;
    width: 100vw;
    height: 100vh;
    padding: 1rem;
    font-family: monospace;
    z-index: 10000;
    overflow: auto;
  }
  #onboarding > * {
    margin: 0 auto;
    max-width: 50rem;
    width: calc(100vw - 10rem);
    text-align: center;
    border-radius: 0.3rem;
    padding: 1rem;
    font-size: 1.3rem;
  }
  #onboarding button {
    font-size: 1.3rem;
    padding: 0.5rem 1rem;
    border-radius: 0.3rem;
    background-color: white;
    color: black;
    border: none;
    cursor: pointer;
  }
</style>#onboarding li {
#onboarding li {
  font-size: 1rem;
  text-align: left;
}
