/* global AFRAME */
/**
 * custom-controls — Mappe les événements bruts du contrôleur vers des événements app.
 * Les composants de contrôleur (meta-touch-controls, laser-controls) sont déjà
 * déclarés dans le template HTML. Ce composant ne fait que le remapping d'events.
 * On N'ajoute PAS oculus-touch-controls / vive-controls ici pour éviter les
 * doublons d'événements qui font tirer deux fois ou toggle deux fois.
 */
AFRAME.registerComponent('custom-controls', {
  schema: {
    hand: { type: 'string', default: '' }
  },

  init: function () {
    const el = this.el;
    const map = (from, to) => el.addEventListener(from, () => el.emit(to, {}, false));
    map('triggerdown',     'app-triggerdown');
    map('triggerup',       'app-triggerup');
    map('gripdown',        'app-gripdown');
    map('gripup',          'app-gripup');
    map('thumbstickmoved', 'app-thumbstickmoved');
  }
});
