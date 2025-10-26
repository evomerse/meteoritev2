# Meteorite - Projet Fusionné (statique, prêt pour Vercel)

Ce dossier résulte de la fusion de vos deux projets :

- **Base principale** : contenu de `meteorite` (garde `index.html` à la racine).
- **Module Julien** : contenu de `meteorite-v1` sous `./julien/` pour préserver ses chemins relatifs (`styles.css`, `app.js`, `supabase-client.js`, etc.).

## Structure

- `index.html` : **page principale** servie à la racine (Vercel affichera celle-ci).
- `assets/` : styles, images et scripts du projet principal.
- `julien/` : pages et JS/CSS du module secondaire (index, login, register, dashboard, settings).
- `vercel.json` : configuration minimale pour un hébergement statique.
- *(aucun `node_modules` ni dossiers lourds, pour un déploiement rapide)*

> Un petit bouton discret (en bas à droite) a été injecté dans `index.html` pour accéder à `julien/index.html` sans modifier vos pages.

## Déploiement sur Vercel (statique)

1. **Créer un nouveau projet Vercel** puis **Importer** ce dossier (ou pousser sur Git et connecter le repo).
2. Framework : **Other** (Static Site). Build Command : *(vide)* - Output Directory : **/**.
3. Déployer.

## Remarques importantes

- Tous les **JS** et **formulaires** originaux ont été **conservés**. Les fichiers du module Julien ne sont **pas renommés**, ce qui évite de casser les imports relatifs.
- Si vous souhaitez que la page d'accueil soit celle de `julien/`, renommez `julien/index.html` en `index.html` (et sauvegardez l'actuel en `index-main.html`).

Bon déploiement !
