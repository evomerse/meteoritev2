# Météorite - Application Météo Moderne

Application météo web moderne et intuitive utilisant l'API Open-Meteo pour des données en temps réel.

## Fonctionnalités

### Météo en temps réel
- Recherche de ville par nom
- Géolocalisation automatique
- Affichage de la température, précipitations, vent et humidité
- Prévisions sur 7 jours
- Historique des recherches récentes

### Système de compte (optionnel)
- Inscription et connexion via Supabase Auth
- Gestion de favoris (sauvegarde de villes)
- Alertes météo personnalisées (pluie, vent, température)
- Paramètres de compte et thème clair/sombre

### Design moderne
- Composants Uiverse.io intégrés
- Palette bleue (#70b7ff, #005c99)
- Police Poppins
- Thème sombre disponible
- 100% responsive (320px à 1920px)

## Technologies utilisées

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Build**: Vite
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **API Météo**: Open-Meteo
- **Géocodage**: Nominatim (OpenStreetMap)
- **Déploiement**: Vercel

## Installation locale

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes

1. Cloner le projet
```bash
git clone <votre-repo>
cd meteorite
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
Le fichier `.env` est déjà configuré avec les credentials Supabase.

4. Lancer le serveur de développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

5. Build pour la production
```bash
npm run build
```

## Structure du projet

```
/meteorite
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── components.css
│   └── js/
│       ├── index.js
│       ├── login.js
│       ├── register.js
│       ├── favorites.js
│       ├── alerts.js
│       ├── settings.js
│       ├── supabase-client.js
│       ├── weather-api.js
│       └── storage.js
├── index.html (page principale météo)
├── login.html
├── register.html
├── favorites.html
├── alerts.html
├── settings.html
├── package.json
├── vite.config.js
└── README.md
```

## Utilisation

### Sans compte
- Consultez la météo en temps réel
- Recherchez des villes
- Utilisez la géolocalisation
- Historique local des recherches

### Avec compte
- Toutes les fonctionnalités ci-dessus
- Sauvegardez vos villes favorites
- Créez des alertes météo personnalisées
- Recevez des notifications par email
- Synchronisez votre thème

## API utilisées

### Open-Meteo API
- URL: `https://api.open-meteo.com/v1/forecast`
- Données: température, précipitations, vent, code météo
- Prévisions: horaires et journalières
- Gratuit, sans clé API requise

### Nominatim (OpenStreetMap)
- Géocodage: ville → coordonnées GPS
- Reverse géocodage: coordonnées → ville
- Gratuit

## Base de données Supabase

### Tables

**profiles**
- id (uuid, FK vers auth.users)
- email (text)
- first_name (text)
- theme_preference (text)
- created_at (timestamptz)

**favorites**
- id (uuid, PK)
- user_id (uuid, FK vers profiles)
- city_name (text)
- latitude (numeric)
- longitude (numeric)
- created_at (timestamptz)

**alerts**
- id (uuid, PK)
- user_id (uuid, FK vers profiles)
- city_name (text)
- latitude (numeric)
- longitude (numeric)
- alert_type (text: rain/wind/temperature)
- condition_operator (text: >, <, >=, <=)
- condition_value (numeric)
- is_active (boolean)
- created_at (timestamptz)
- last_triggered_at (timestamptz)

## Composants Uiverse.io

- **Loader**: JkHuger/new-deer-97
- **Carte météo**: youranonone10/young-otter-44
- **Barre de recherche**: KSAplay/bitter-panther-69
- **Carte d'alerte**: KSAplay/strong-donkey-70
- **Bouton**: akshat-patel28/light-otter-66
- **Modal**: KSAplay/mean-dolphin-87
- **Carte favori**: zanina-yassine/neat-starfish-50

## Déploiement sur Vercel

1. Connecter le repo GitHub à Vercel
2. Configuration:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Les variables d'environnement sont dans `.env`
4. Déployer

## Équipe

- **Nathan**: Intégration API Open-Meteo, logique JavaScript (recherche, géolocalisation, favoris, alertes), déploiement Vercel
- **Mathéo**: Design UI/UX, intégration des composants Uiverse.io, responsive design
- **Julien**: Base de données Supabase, authentification, gestion des profils
- **Rayen**: Edge Functions, système d'alertes automatiques, envoi d'emails

## Licence

Projet scolaire - 2025

## Support

Pour toute question ou problème, veuillez consulter la documentation:
- [Open-Meteo Docs](https://open-meteo.com/en/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)
