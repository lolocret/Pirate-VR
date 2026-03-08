<p align="center">
    <img src="./logo.svg" alt="Pirate VR Logo" align="center"/>
</p>
<h1 align="center">Pirate VR – Mission en mer</h1>

> Expérience VR pirate construite avec A‑Frame + Vue + Vite.

## But du jeu

Parler à Ching Shih, repérer le trésor avec la longue‑vue, puis éliminer le Kraken au canon.

## Contrôles

- **VR**
- Main droite : changer d’objet (A/B ou Grip)
- Longue‑vue : gâchette pour zoomer
- Canon : gâchette pour tirer
- Carte (main gauche) : téléportation

- **Desktop (test)**
- Déplacement : `WASD` / flèches
- Regarder : souris
- Tir : clic gauche
- Zoom : clic droit ou `Z`

## Démarrage rapide

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
```

## Déploiement local sur casque VR

1. Vérifier que le PC et le casque sont sur le même réseau.
2. Exposer le serveur :

```sh
npm run dev-expose
```

3. Ouvrir l’URL `[ip]:[port]` dans le navigateur du casque.

> Note : certificat auto‑signé, il faut accepter l’avertissement.

## Stack

- A‑Frame
- Vue 3
- Vite
