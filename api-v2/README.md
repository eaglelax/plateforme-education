# Plateforme Éducative Burkina Faso - API v2

API REST pour la plateforme éducative destinée aux enfants de 4 à 12 ans au Burkina Faso.

## Stack Technique

- **Node.js** >= 18.x
- **Express.js** 4.18
- **MySQL** 5.7+ / MariaDB 10.x
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe

## Installation

### 1. Cloner et installer les dépendances

```bash
cd api-v2
npm install
```

### 2. Configurer l'environnement

Copier le fichier d'exemple et le modifier :

```bash
cp .env.example .env
```

Modifier les variables dans `.env` :

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=plateforme_educative

# JWT
JWT_SECRET=votre_secret_jwt_securise
JWT_REFRESH_SECRET=votre_secret_refresh_jwt

# Serveur
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173
```

### 3. Créer la base de données

```bash
# Exécuter le script SQL
mysql -u root -p < sql/schema.sql

# Ou via le script de migration
npm run migrate
```

### 4. Insérer les données initiales

```bash
npm run seed
```

### 5. Démarrer le serveur

```bash
# Développement (avec hot reload)
npm run dev

# Production
npm start
```

## Endpoints API

### Authentification (`/api/auth`)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/register` | Inscription parent |
| POST | `/login` | Connexion utilisateur |
| POST | `/login-enfant` | Connexion enfant |
| POST | `/refresh` | Renouveler le token |
| GET | `/me` | Profil connecté |
| POST | `/logout` | Déconnexion |
| PUT | `/change-password` | Changer mot de passe |

### Utilisateurs (`/api/utilisateurs`)

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/profil` | Son profil | Authentifié |
| PUT | `/profil` | Modifier profil | Authentifié |
| GET | `/` | Lister utilisateurs | Admin |
| GET | `/:id` | Détail utilisateur | Admin |
| PUT | `/:id` | Modifier utilisateur | Admin |
| DELETE | `/:id` | Supprimer utilisateur | Admin |

### Enfants (`/api/enfants`)

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/` | Lister ses enfants | Parent |
| POST | `/` | Créer profil enfant | Parent |
| GET | `/:id` | Détail enfant | Parent |
| PUT | `/:id` | Modifier enfant | Parent |
| DELETE | `/:id` | Supprimer enfant | Parent |
| POST | `/:id/regenerer-mot-de-passe` | Nouveau mot de passe | Parent |
| PUT | `/:id/pin` | Configurer PIN | Parent |
| GET | `/:id/identifiants` | Voir identifiants | Parent |
| GET | `/:id/progression` | Progression | Parent |
| GET | `/:id/badges` | Badges obtenus | Parent/Enfant |
| GET | `/:id/temps-ecran` | Temps d'écran | Parent |

### Abonnements (`/api/abonnements`)

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/types` | Lister les formules | Public |
| GET | `/` | Mes abonnements | Authentifié |
| POST | `/` | Souscrire | Parent |
| GET | `/:id` | Détail abonnement | Authentifié |
| PUT | `/:id/renouvellement` | Toggle renouvellement | Parent |
| POST | `/:id/annuler` | Annuler | Parent |

### Contenus (`/api/contenus`)

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/domaines` | Lister domaines | Public |
| GET | `/` | Lister contenus | Public/Auth |
| GET | `/:id` | Détail contenu | Public/Auth |
| POST | `/:id/demarrer` | Démarrer contenu | Enfant |
| POST | `/:id/progression` | MAJ progression | Enfant |
| POST | `/:id/terminer` | Terminer | Enfant |
| POST | `/` | Créer contenu | Admin |
| PUT | `/:id` | Modifier contenu | Admin |
| DELETE | `/:id` | Supprimer | Admin |
| PUT | `/:id/publier` | Publier | Admin |

### Paiements (`/api/paiements`)

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/` | Mes paiements | Authentifié |
| POST | `/` | Initier paiement | Parent |
| GET | `/:id` | Détail paiement | Authentifié |
| POST | `/:id/verifier` | Vérifier statut | Parent |
| POST | `/webhook/orange` | Callback Orange Money | Public |
| POST | `/webhook/moov` | Callback Moov Money | Public |
| POST | `/webhook/wave` | Callback Wave | Public |

### Contrôle Parental

#### Paramètres (`/api/parametres-parentaux`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/:enfantId` | Obtenir paramètres |
| PUT | `/:enfantId` | Modifier paramètres |
| PUT | `/:enfantId/mode-kiosque` | Toggle kiosque |
| PUT | `/:enfantId/temps-ecran` | Config temps |
| PUT | `/:enfantId/horaires` | Config horaires |

#### Domaines autorisés (`/api/domaines-autorises`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/:enfantId` | Domaines autorisés |
| PUT | `/:enfantId` | Modifier autorisations |

#### APK autorisées (`/api/apk-autorisees`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/catalogue` | Catalogue apps |
| GET | `/:enfantId` | Apps enfant |
| PUT | `/:enfantId` | Modifier apps |

#### Téléchargement (`/api/preferences-telechargement`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/:enfantId` | Préférences |
| PUT | `/:enfantId` | Modifier préférences |
| GET | `/:enfantId/contenus` | Contenus téléchargés |

### Admin (`/api/admin`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/dashboard` | Tableau de bord |
| GET | `/statistiques/utilisateurs` | Stats utilisateurs |
| GET | `/statistiques/abonnements` | Stats abonnements |
| GET | `/statistiques/contenus` | Stats contenus |
| GET | `/statistiques/revenus` | Stats revenus |
| GET | `/journal` | Journal des actions |
| GET | `/roles` | Liste des rôles |

## Déploiement sur LWS cPanel

### 1. Préparation

```bash
# Créer le build
npm install --production
```

### 2. Upload sur cPanel

1. Créer une application Node.js dans cPanel
2. Uploader les fichiers via FTP :
   - `src/`
   - `sql/`
   - `package.json`
   - `.env` (configurer pour production)

### 3. Configuration

Dans cPanel > Setup Node.js App :
- Node.js version: 18.x ou 20.x
- Application root: `/api-v2`
- Application startup file: `src/server.js`

### 4. Variables d'environnement

Configurer dans cPanel ou créer `.env` :

```env
DB_HOST=localhost
DB_USER=c2180186c_education
DB_PASSWORD=VotreMotDePasse
DB_NAME=c2180186c_education
NODE_ENV=production
JWT_SECRET=VotreCleSecrete
CORS_ORIGINS=https://educative.genius-universe.com
```

### 5. Base de données

```bash
# Via terminal SSH ou phpMyAdmin
mysql -u c2180186c_education -p c2180186c_education < sql/schema.sql
npm run seed
```

### 6. Démarrer

Dans cPanel, cliquer sur "Run NPM Install" puis "Restart".

## Structure du Projet

```
api-v2/
├── src/
│   ├── server.js           # Point d'entrée
│   ├── config/
│   │   ├── database.js     # Pool MySQL
│   │   └── jwt.js          # Configuration JWT
│   ├── middlewares/
│   │   ├── auth.js         # Authentification
│   │   ├── validate.js     # Validation
│   │   └── errorHandler.js # Gestion erreurs
│   ├── routes/             # 14 fichiers routes
│   ├── controllers/        # 14 fichiers contrôleurs
│   ├── utils/
│   │   ├── helpers.js      # Fonctions utilitaires
│   │   ├── ApiError.js     # Classe d'erreur
│   │   └── asyncHandler.js # Wrapper async
│   └── scripts/
│       ├── migrate.js      # Migration BDD
│       └── seed.js         # Données initiales
├── sql/
│   └── schema.sql          # Script création tables
├── uploads/                # Fichiers uploadés
├── .env.example
├── package.json
└── README.md
```

## Identifiants par défaut

**Administrateur :**
- Email : `admin@plateforme-educative.bf`
- Mot de passe : `Admin2024!`

## Amendements intégrés

1. **Amendement #1** : Mode kiosque avec contrôle parental
2. **Amendement #2** : Renouvellement auto désactivé par défaut
3. **Amendement #3** : Abonnement par enfant (pas par famille)
4. **Amendement #4** : Téléchargement automatique des contenus
5. **Amendement #5** : Whitelist APK pour mode kiosque
6. **Amendement #9** : Identifiants de connexion enfant (code + mot de passe/PIN)

## Support

Pour toute question : support@plateforme-educative.bf
