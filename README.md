# ☄️ Météorite

**Météorite** est une application météo web moderne, fluide et intuitive qui vous permet de consulter la météo en temps réel pour n'importe quelle ville dans le monde. L'application intègre des fonctionnalités avancées comme la gestion de favoris, des alertes météo personnalisées et un système d'authentification complet.

## 🌟 Fonctionnalités

### Météo en temps réel
- **Recherche de ville** : Recherchez n'importe quelle ville dans le monde
- **Géolocalisation** : Obtenez instantanément la météo de votre position actuelle
- **Prévisions 7 jours** : Consultez les prévisions météo détaillées
- **Données complètes** : Température, précipitations, vent, humidité et description météo

### Gestion des favoris
- Sauvegardez vos villes favorites
- Accès rapide à la météo de vos lieux préférés
- Interface visuelle avec cartes météo interactives

### Alertes météo personnalisées
- Créez des alertes pour la pluie, le vent ou la température
- Définissez des seuils personnalisés
- Notifications automatiques par email
- Activation/désactivation facile des alertes

### Compte utilisateur
- Inscription et connexion sécurisées
- Gestion du profil
- Modification du mot de passe
- Thème clair/sombre
- Suppression de compte

## 🛠️ Technologies utilisées

### Frontend
- **HTML5, CSS3, JavaScript (Vanilla)**
- **Vite** : Serveur de développement et bundler
- **Design responsive** : Compatible mobile, tablette et desktop

### Backend & Base de données
- **Supabase** : Authentification et base de données PostgreSQL
- **Supabase Edge Functions** : Vérification des alertes et envoi d'emails

### API
- **Open-Meteo** : Données météo en temps réel et prévisions
- **Nominatim (OpenStreetMap)** : Géocodage des villes

### Design
- **Composants Uiverse.io** : Interface moderne et animations
- **Palette de couleurs** : Bleu clair (#70b7ff), bleu foncé (#005c99), gris clair (#f4f6f9)
- **Police** : Poppins

## 📦 Installation locale

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd meteorite
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
Le fichier `.env` est déjà configuré avec les credentials Supabase.

4. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

5. **Build pour la production**
```bash
npm run build
```

## 🚀 Déploiement sur Vercel

### Déploiement automatique

1. **Connectez votre repository GitHub à Vercel**
2. **Configuration du projet** :
   - Framework Preset : Vite
   - Build Command : `npm run build`
   - Output Directory : `dist`
3. **Variables d'environnement** : Elles sont déjà dans le fichier `.env`

### Déploiement manuel

```bash
npm install -g vercel
vercel --prod
```

## 📊 Structure du projet

```
meteorite/
├── assets/
│   ├── css/
│   │   ├── main.css          # Styles principaux
│   │   └── components.css    # Styles des composants Uiverse
│   ├── js/
│   │   ├── supabase-client.js    # Client Supabase
│   │   ├── weather-api.js        # API météo
│   │   ├── favorites.js          # Gestion des favoris
│   │   ├── alerts.js             # Gestion des alertes
│   │   ├── main-page.js          # Page principale
│   │   ├── login.js              # Connexion
│   │   ├── register.js           # Inscription
│   │   ├── alerts-page.js        # Page alertes
│   │   ├── favorites-page.js     # Page favoris
│   │   └── settings-page.js      # Page paramètres
│   └── images/
├── supabase/
│   └── functions/
│       └── check-weather-alerts/  # Edge Function
├── main.html               # Page principale météo
├── login-page.html        # Page de connexion
├── register-page.html     # Page d'inscription
├── alerts-page.html       # Page des alertes
├── favorites-page.html    # Page des favoris
├── settings-page.html     # Page des paramètres
├── package.json
├── vite.config.js
└── README.md
```

## 🎨 Design et composants

L'application utilise des composants provenant de [Uiverse.io](https://uiverse.io) :

- **Carte météo** : young-otter-44
- **Barre de recherche** : bitter-panther-69
- **Loader** : new-deer-97
- **Carte d'alerte** : strong-donkey-70
- **Bouton principal** : light-otter-66
- **Modal** : mean-dolphin-87
- **Carte favori** : neat-starfish-50

## 🔐 Sécurité

- Authentification sécurisée avec Supabase Auth
- Row Level Security (RLS) sur toutes les tables
- Hashage des mots de passe
- Protection CSRF
- Validation des entrées utilisateur

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à toutes les tailles d'écran :
- **Mobile** : 320px - 767px
- **Tablette** : 768px - 1023px
- **Desktop** : 1024px et plus

## 🌐 API utilisées

### Open-Meteo
- **URL** : https://api.open-meteo.com/v1/forecast
- **Données** : Météo actuelle, prévisions horaires et journalières
- **Gratuit** : Aucune clé API requise

### Nominatim (OpenStreetMap)
- **Géocodage** : Conversion ville → coordonnées
- **Reverse géocodage** : Conversion coordonnées → ville

## 👥 Équipe de développement

- **Nathan** : Intégration API Open-Meteo, logique JavaScript (recherche, géolocalisation, favoris, alertes), déploiement Vercel
- **Mathéo** : Design UI/UX, intégration des composants Uiverse, responsive design
- **Julien** : Base de données Supabase, authentification, gestion des profils
- **Rayen** : Edge Functions, système d'alertes automatiques, emails

## 📝 Licence

Ce projet est développé dans le cadre d'un projet scolaire.

## 🔗 Liens utiles

- [Documentation Open-Meteo](https://open-meteo.com/en/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Composants Uiverse](https://uiverse.io)
- [Vercel Documentation](https://vercel.com/docs)

## 💡 Améliorations futures

- Notifications push dans le navigateur
- Graphiques de tendances météo
- Mode hors ligne avec service worker
- Support multilingue
- Intégration des cartes météo interactives
- Partage de météo sur les réseaux sociaux

---

Développé avec ☄️ par l'équipe Météorite - 2025
