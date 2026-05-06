# API Faso Yiri — Référence complète

> **Base URL (production LWS)** : `https://apieducative.genius-universe.com`
> **Format URL spécial LWS** : `?route=/api/...` (Phusion Passenger ne route que `/`)
>
> **En local** : `http://localhost:3001/api/...` (sans `?route=`)

---

## 1. Conventions générales

### 1.1 Format des URLs (production)

```
https://apieducative.genius-universe.com/?route=/api/<module>/<endpoint>
```

Exemples :
- `?route=/api/auth/login`
- `?route=/api/contenus/domaines`
- `?route=/api/enfants/5/progression`

### 1.2 Authentification

Header obligatoire pour les routes protégées :
```
Authorization: Bearer <accessToken>
```

Le token est obtenu via `POST /api/auth/login` (champ `data.accessToken`).
Durée de vie : **7 jours** (refresh token : 30 jours).

### 1.3 Encapsulation standard

**Toutes** les réponses suivent ce format :

#### Succès simple
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "message": "..." (optionnel)
}
```

#### Succès paginé
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [ ... ] (validations, optionnel)
}
```

### 1.4 Codes HTTP

| Code | Signification |
|------|--------------|
| 200 | OK |
| 201 | Créé |
| 400 | Données invalides (validation) |
| 401 | Token absent / expiré → frontend redirige vers `/login` |
| 403 | Pas les droits (rôle insuffisant) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

### 1.5 Pagination

Tous les endpoints `GET` listant des ressources acceptent :
- `?page=1` (défaut: 1)
- `?limit=10` (défaut: 10, max: 100)

---

## 2. AUTH — `/api/auth`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| POST | `/api/auth/register` | Public | Inscription parent |
| POST | `/api/auth/login` | Public | Connexion (parent/admin/gestionnaire/validateur) |
| POST | `/api/auth/login-enfant` | Public | Connexion enfant (code + mot de passe ou PIN) |
| POST | `/api/auth/refresh` | Public | Renouveler accessToken via refreshToken |
| GET | `/api/auth/me` | Privé | Profil de l'utilisateur connecté |
| POST | `/api/auth/logout` | Privé | Déconnexion |
| PUT | `/api/auth/change-password` | Privé | Changer mot de passe |

### POST `/api/auth/login`

**Payload :**
```json
{
  "identifiant": "admin@plateforme-educative.bf",
  "motDePasse": "MotDePasse"
}
```
> `identifiant` peut être l'email **ou** le téléphone.

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "utilisateur": {
      "id": 1,
      "nom": "Admin",
      "prenom": "Système",
      "telephone": "+22670000001",
      "email": "admin@plateforme-educative.bf",
      "role": "ADMIN",
      "statutCompte": "actif"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> Rôles possibles : `ADMIN`, `PARENT`, `ENFANT`, `VALIDATEUR`, `GESTIONNAIRE_CONTENU`

### POST `/api/auth/login-enfant`

**Payload :**
```json
{
  "codeConnexion": "ENF-PAHMN2",
  "motDePasse": "secret"
}
```
> ou avec PIN : `{ "codeConnexion": "ENF-XXXXXX", "pin": "1234" }`

### POST `/api/auth/register`

**Payload :**
```json
{
  "nom": "Doe",
  "prenom": "John",
  "telephone": "+22670000000",
  "email": "john@example.com",
  "motDePasse": "MotDePasse2026!"
}
```
- `email` optionnel
- `telephone` au format `+226XXXXXXXX` ou 8 chiffres
- `motDePasse` ≥ 6 caractères

### GET `/api/auth/me`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "type": "utilisateur",
    "profil": {
      "id": 1,
      "nom": "Admin",
      "prenom": "Système",
      "telephone": "+22670000001",
      "email": "admin@plateforme-educative.bf",
      "statut_compte": "actif",
      "role": "ADMIN",
      "enfants_count": 0
    }
  }
}
```

### PUT `/api/auth/change-password`

**Payload :**
```json
{
  "ancienMotDePasse": "ancien",
  "nouveauMotDePasse": "nouveau"
}
```

---

## 3. UTILISATEURS — `/api/utilisateurs` (Admin)

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/utilisateurs` | Admin | Lister (pagination, filtres) |
| GET | `/api/utilisateurs/:id` | Admin | Détail |
| POST | `/api/utilisateurs` | Admin/Validateur | Créer (avec rôle) |
| PUT | `/api/utilisateurs/:id` | Admin | Modifier |
| DELETE | `/api/utilisateurs/:id` | Admin | Supprimer |
| PUT | `/api/utilisateurs/:id/role` | Admin | Changer rôle |

### GET `/api/utilisateurs`

**Query params :** `?page=1&limit=10&role=PARENT&statut=actif&search=ouedraogo`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "nom": "Ouedraogo",
      "prenom": "Amadou",
      "telephone": "70000001",
      "email": "test.parent@fasoyiri.com",
      "statut_compte": "actif",
      "derniere_connexion": "2026-03-04T12:31:17.000Z",
      "date_creation": "2026-02-27T11:38:54.000Z",
      "role": "PARENT",
      "enfants_count": 3
    }
  ],
  "pagination": {
    "total": 12, "page": 1, "limit": 10,
    "totalPages": 2, "hasNext": true, "hasPrev": false
  }
}
```

### POST `/api/utilisateurs`

**Payload :**
```json
{
  "nom": "Test",
  "prenom": "Validateur",
  "telephone": "+22670111111",
  "email": "validateur@example.com",
  "motDePasse": "Test2026!",
  "roleId": 7
}
```
> `roleId` : 1=ADMIN, 2=PARENT, 7=VALIDATEUR, 8=GESTIONNAIRE_CONTENU
> VALIDATEUR ne peut créer que des GESTIONNAIRE_CONTENU.

### PUT `/api/utilisateurs/:id`

**Payload :**
```json
{
  "nom": "Nouveau",
  "prenom": "Nouveau",
  "email": "nouveau@example.com",
  "statutCompte": "actif"
}
```
> Tous les champs sont optionnels (PATCH-like)

---

## 4. ENFANTS — `/api/enfants`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/enfants` | Privé | Liste (parent: ses enfants ; admin: tous) |
| POST | `/api/enfants` | Parent | Créer profil |
| GET | `/api/enfants/:id` | Parent owner / Admin | Détail |
| PUT | `/api/enfants/:id` | Parent owner / Admin | Modifier |
| DELETE | `/api/enfants/:id` | Parent owner / Admin | Supprimer |
| GET | `/api/enfants/:id/progression` | Parent / Admin | Progression |
| GET | `/api/enfants/:id/badges` | Parent / Admin / Enfant | Badges |
| GET | `/api/enfants/:id/temps-ecran?periode=7` | Parent / Admin | Temps d'écran |
| GET | `/api/enfants/:id/identifiants` | Parent | Récupérer code+mot de passe |
| POST | `/api/enfants/:id/regenerer-mot-de-passe` | Parent | Reset mot de passe |
| PUT | `/api/enfants/:id/pin` | Parent | Configurer PIN (4 chiffres) |
| PUT | `/api/enfants/:id/mode-connexion` | Parent | `mot_de_passe` ou `pin` |

### GET `/api/enfants`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nomPseudo": "Axo",
      "avatar": null,
      "age": 12,
      "trancheAge": { "min": 10, "max": 12 },
      "statut": "actif",
      "codeConnexion": "ENF-PAHMN2",
      "modeConnexion": "mot_de_passe",
      "pointsXp": 0,
      "niveauGlobal": 1,
      "abonnementActif": false,
      "badgesCount": 0,
      "dateCreation": "2026-02-27T13:25:03.000Z",
      "parent": {
        "id": 12,
        "nom": "Ouedraogo",
        "prenom": "Amadou"
      }
    }
  ],
  "pagination": { ... }
}
```

### POST `/api/enfants`

**Payload :**
```json
{
  "nomPseudo": "Axo",
  "age": 8,
  "avatar": "https://...",
  "modeConnexion": "mot_de_passe"
}
```
- `age` entre 4 et 12
- `modeConnexion` : `mot_de_passe` (défaut) ou `pin`

---

## 5. CONTENUS — `/api/contenus`

### Routes publiques / mixtes

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/contenus/domaines` | Public | Liste domaines actifs |
| GET | `/api/contenus` | Public/Optionnel | Catalogue (publié uniquement) |
| GET | `/api/contenus/:id` | Public/Optionnel | Détail |

### Routes Admin / Gestionnaire

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/contenus/tous` | Gestionnaire/Admin | Tous les contenus (tous statuts) |
| GET | `/api/contenus/mes-contenus` | Gestionnaire/Admin | Mes contenus + stats |
| POST | `/api/contenus` | Gestionnaire/Admin | Créer |
| PUT | `/api/contenus/:id` | Owner/Admin | Modifier (brouillon ou a_amender) |
| DELETE | `/api/contenus/:id` | Admin | Supprimer |
| PUT | `/api/contenus/:id/soumettre` | Gestionnaire/Admin | Brouillon → en_attente |
| PUT | `/api/contenus/:id/publier` | Gestionnaire/Admin | Validé → publié |

### Routes Validateur / Admin

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/contenus/a-valider` | Validateur/Admin | File de validation |
| GET | `/api/contenus/stats-validation` | Validateur/Admin | Compteurs |
| GET | `/api/contenus/:id/validation` | Validateur/Admin | Détail (lecture seule) |
| PUT | `/api/contenus/:id/valider` | Validateur/Admin | Approuver |
| PUT | `/api/contenus/:id/amender` | Validateur/Admin | Renvoyer (commentaire obligatoire) |

### Routes Domaines (Admin)

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/contenus/domaines` | Créer domaine |
| PUT | `/api/contenus/domaines/:id` | Modifier (`estActif`, etc.) |

### Routes Enfant

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/contenus/:id/demarrer` | Démarre la lecture |
| POST | `/api/contenus/:id/progression` | Update progression `{progression: 0-100, tempsPasse}` |
| POST | `/api/contenus/:id/terminer` | Marque terminé `{score: 0-100}` |

### GET `/api/contenus/domaines` (réponse)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nom": "Langues",
      "description": "Français, Anglais et langues locales",
      "icone": "🗣️",
      "couleur": "#3498db",
      "ordre_affichage": 1,
      "est_actif": 1,
      "date_creation": "2026-01-29T13:02:41.000Z",
      "contenus_count": 2
    }
  ]
}
```

### GET `/api/contenus` ou `/contenus/tous` (réponse)

```json
{
  "success": true,
  "data": [
    {
      "id": 18,
      "titre": "test video",
      "description": "test",
      "type": "video",
      "url_media": "/api/stream/contenus/18/media/booshle.mp4",
      "url_miniature": "/api/stream/contenus/18/miniature/screenshot.png",
      "duree_minutes": 0,
      "taille_mo": "0.00",
      "tranche_age_min": 9,
      "tranche_age_max": 12,
      "points_xp": 10,
      "est_premium": 0,
      "est_telechargeable": 1,
      "statut": "publie",
      "nombre_vues": 16,
      "note_moyenne": "0.00",
      "date_publication": "2026-03-10T22:28:06.000Z",
      "date_soumission": "2026-03-10T21:43:54.000Z",
      "date_creation": "2026-03-10T21:43:54.000Z",
      "domaine_id": 8,
      "createur_id": 8,
      "validateur_id": 7,
      "commentaire_validation": null,
      "domaine_nom": "Informatique",
      "domaine_icone": "💻"
    }
  ],
  "pagination": { ... }
}
```

> Statuts possibles : `brouillon`, `en_attente`, `valide`, `a_amender`, `rejete`, `publie`, `archive`
> Types : `video`, `audio`, `quiz`, `jeu`, `document`, `activite`

### POST `/api/contenus`

**Payload :**
```json
{
  "titre": "Mon contenu",
  "description": "Description",
  "type": "video",
  "domaineId": 1,
  "trancheAgeMin": 5,
  "trancheAgeMax": 8,
  "pointsXp": 10,
  "mediaFileId": "uuid-du-fichier-uploade",
  "miniatureFileId": "uuid-de-la-miniature"
}
```
> `mediaFileId` / `miniatureFileId` viennent de `POST /api/uploads/media` et `POST /api/uploads/miniature`

### PUT `/api/contenus/:id/valider`

**Payload :**
```json
{ "commentaire": "Bon travail" }
```
> Commentaire optionnel.

### PUT `/api/contenus/:id/amender`

**Payload :**
```json
{ "commentaire": "Corriger l'orthographe à 2:34" }
```
> Commentaire **obligatoire** (non vide).

---

## 6. QUIZ — `/api/quiz`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/quiz/contenu/:contenuId` | Quiz d'un contenu |
| POST | `/api/quiz/contenu/:contenuId` | Créer/MAJ quiz |
| DELETE | `/api/quiz/contenu/:contenuId` | Supprimer quiz |
| POST | `/api/quiz/:quizId/questions` | Ajouter question |
| PUT | `/api/quiz/questions/:questionId` | Modifier question |
| DELETE | `/api/quiz/questions/:questionId` | Supprimer question |
| PUT | `/api/quiz/:quizId/questions/reorder` | Réordonner `{questionIds: [...]}` |

### POST `/api/quiz/contenu/:contenuId`

**Payload :**
```json
{
  "titre": "Quiz du chapitre 1",
  "scoreMinimum": 60,
  "tempsLimiteMinutes": 10
}
```

### POST `/api/quiz/:quizId/questions`

**Payload :**
```json
{
  "texte": "Combien font 2+2 ?",
  "type": "qcm",
  "points": 1,
  "explication": "Addition simple",
  "reponses": [
    { "texte": "3", "estCorrecte": false },
    { "texte": "4", "estCorrecte": true },
    { "texte": "5", "estCorrecte": false }
  ]
}
```

---

## 7. ABONNEMENTS — `/api/abonnements`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/abonnements/types` | Public | Liste des formules (avec domaines depuis amendement #10) |
| GET | `/api/abonnements` | Privé | Liste (parent: les siens; admin: tous) |
| GET | `/api/abonnements/:id` | Privé | Détail |
| POST | `/api/abonnements` | Parent | Souscrire (snapshot domaines auto) |
| PUT | `/api/abonnements/:id/renouvellement` | Parent | Toggle renouvellement |
| POST | `/api/abonnements/:id/annuler` | Parent | Annuler avec motif |
| POST | `/api/abonnements/types` | Admin | Créer formule (avec `domaineIds`) |
| PUT | `/api/abonnements/types/:id` | Admin | Modifier formule |
| **GET** | **`/api/abonnements/types/:id/domaines`** | **Privé** | **Domaines d'un pack (template)** |
| **PUT** | **`/api/abonnements/types/:id/domaines`** | **Admin** | **Configurer domaines d'un pack** |
| **GET** | **`/api/abonnements/:id/domaines`** | **Privé** | **Domaines snapshot d'un abonnement actif** |

### GET `/api/abonnements/types`

```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "nom": "Premium Annuel",
      "description": "Meilleure offre ! Accès illimité pendant 1 an",
      "prix": "40000.00",
      "devise": "XOF",
      "duree": "ANNUEL",
      "duree_jours": 365,
      "nombre_appareils_max": 5,
      "telechargement_autorise": 1,
      "contenu_premium": 1
    }
  ]
}
```

### POST `/api/abonnements` (souscrire)

**Payload :**
```json
{
  "enfantId": 1,
  "typeAbonnementId": 4
}
```

> **Amendement #10** : à la souscription, les domaines actuels du pack sont copiés vers `abonnement_domaines`. Les modifications ultérieures du pack n'affectent pas cet abonnement.

### Amendement #10 : Domaines par pack

**`GET /api/abonnements/types`** retourne désormais un champ `domaines` pour chaque pack :

```json
{
  "id": 4,
  "nom": "Premium Annuel",
  "prix": "40000.00",
  "duree": "ANNUEL",
  "domaines": [
    { "id": 1, "nom": "Langues", "icone": "🗣️", "couleur": "#3498db" },
    { "id": 2, "nom": "Mathématiques", "icone": "🔢", "couleur": "#e74c3c" }
  ]
}
```

**`PUT /api/abonnements/types/:id/domaines`** (Admin)
```json
{ "domaineIds": [1, 2, 5, 6] }
```
> Remplace toute la liste actuelle. `[]` = pack non configuré → fallback "tous les domaines".

**`GET /api/abonnements/:id/domaines`** — domaines réellement accessibles pour cet abonnement (snapshot, ne change pas même si pack modifié).

**Filtrage automatique du catalogue :** quand un enfant authentifié appelle `GET /api/contenus`, le serveur filtre automatiquement par les domaines de son abonnement actif. Aucun paramètre côté client.

---

## 8. PAIEMENTS — `/api/paiements`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/paiements` | Privé | Liste paginée |
| GET | `/api/paiements/:id` | Privé | Détail |
| POST | `/api/paiements` | Parent | Initier paiement |
| POST | `/api/paiements/:id/verifier` | Parent | Vérifier statut |
| POST | `/api/paiements/:id/rembourser` | Admin | Rembourser |

### POST `/api/paiements`

**Payload :**
```json
{
  "abonnementId": 4,
  "methode": "orange_money",
  "numeroTelephone": "+22670000000"
}
```
> Méthodes : `orange_money`, `moov_money`, `wave`, etc.

### GET `/api/paiements` (réponse)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "montant": "40000.00",
      "devise": "XOF",
      "methode": "orange_money",
      "statut": "en_attente",
      "reference_externe": "PAY-1772192504044-1f5c64c6",
      "numero_telephone": "+22655012658",
      "date_paiement": null,
      "date_creation": "2026-02-27T12:41:44.000Z",
      "abonnement_id": 1,
      "utilisateur_id": 12,
      "type_abonnement_nom": "Premium Annuel",
      "enfant_nom": "Awa",
      "utilisateur_nom": "Ouedraogo",
      "utilisateur_prenom": "Amadou"
    }
  ],
  "pagination": { ... }
}
```

> Statuts : `en_attente`, `reussi`, `echec`, `rembourse`

---

## 9. NOTIFICATIONS — `/api/notifications`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/notifications` | Privé | Mes notifications |
| PUT | `/api/notifications/:id/lue` | Privé | Marquer une lue |
| PUT | `/api/notifications/lues` | Privé | Marquer toutes lues |
| POST | `/api/notifications/envoyer` | Admin | Envoi ciblé |
| POST | `/api/notifications/broadcast` | Admin | Envoi à tous |

### POST `/api/notifications/broadcast`

**Payload :**
```json
{
  "titre": "Maintenance prévue",
  "message": "La plateforme sera indisponible dimanche...",
  "cible": "tous",
  "type": "info"
}
```
> `cible` : `tous`, `parents`, `enfants`, `admins`
> `type` : `info`, `success`, `warning`, `error`

### GET `/api/notifications` (réponse)

```json
{
  "success": true,
  "data": [
    {
      "id": 29,
      "titre": "Nouveau contenu a valider",
      "message": "Le contenu \"test video\" est en attente de validation.",
      "type": "info",
      "est_lue": 0,
      "date_lecture": null,
      "lien_action": "/contenus/18/validation",
      "date_creation": "2026-03-10T21:43:55.000Z",
      "utilisateur_id": 1,
      "enfant_id": null
    }
  ],
  "pagination": { ... }
}
```

---

## 10. UPLOADS — `/api/uploads`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| POST | `/api/uploads/media` | Gestionnaire/Admin | Upload vidéo/audio/document (200MB max) |
| POST | `/api/uploads/miniature` | Gestionnaire/Admin | Upload miniature image |
| POST | `/api/uploads/question-image` | Gestionnaire/Admin | Upload image quiz |
| GET | `/api/uploads/mes-fichiers` | Gestionnaire/Admin | Liste mes fichiers temporaires |
| GET | `/api/uploads/:uuid` | Gestionnaire/Admin | Info fichier |
| DELETE | `/api/uploads/:uuid` | Gestionnaire/Admin | Supprimer fichier |

**Format envoi :** `multipart/form-data` avec champ `media` / `miniature` / `image`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "uuid": "abc123-...",
    "nomOriginal": "video.mp4",
    "taille": 12345678,
    "mimeType": "video/mp4",
    "dateUpload": "..."
  }
}
```

> Le `uuid` retourné est à passer dans `mediaFileId` lors de la création du contenu.

---

## 11. ADMIN — `/api/admin`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/admin/dashboard?periode=7` | Statistiques dashboard |
| GET | `/api/admin/statistiques/:type` | Stats détaillées (`utilisateurs`, `contenus`, `revenus`) |
| GET | `/api/admin/roles` | Liste des rôles |
| GET | `/api/admin/journal?action=&utilisateur=&dateDebut=&dateFin=` | Journal d'audit |

### GET `/api/admin/dashboard` (réponse)

```json
{
  "success": true,
  "data": {
    "compteurs": {
      "utilisateurs": { "total": 12, "actifs": "12", "nouveauxAujourdhui": "0" },
      "enfants": { "total": 5, "actifs": "5" },
      "abonnements": { "total": 1, "actifs": "1", "expires": "0" },
      "contenus": { "total": 16, "publies": "12", "brouillons": "0" },
      "revenus": { "total": "0.00", "moisEnCours": "0.00" }
    },
    "activiteRecente": [],
    "derniersUtilisateurs": [
      {
        "id": 15,
        "nom": "...",
        "prenom": "...",
        "email": "...",
        "date_creation": "...",
        "role": "GESTIONNAIRE_CONTENU"
      }
    ],
    "derniersPaiements": [
      {
        "id": 1,
        "montant": "40000.00",
        "methode": "orange_money",
        "statut": "en_attente",
        "date_creation": "...",
        "utilisateur_nom": "Ouedraogo",
        "utilisateur_prenom": "Amadou"
      }
    ]
  }
}
```

### GET `/api/admin/roles` (réponse)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nom": "ADMIN",
      "description": "Administrateur de la plateforme avec tous les droits",
      "permissions": "{\"users\":[\"create\",\"read\",\"update\",\"delete\"], ...}",
      "utilisateurs_count": 1
    }
  ]
}
```

---

## 12. STREAM (médias) — `/api/stream`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/stream/contenus/:id/media/:fichier` | Stream vidéo/audio (Range supporté) |
| GET | `/api/stream/contenus/:id/miniature/:fichier` | Image miniature |

> Supporte les requêtes Range (HTTP 206) pour le seek vidéo.
> Pas d'authentification stricte (URL signée pas implémentée).

---

## 13. AUTRES MODULES (rapide)

### `/api/historique` (Parent / Admin)
- `GET /enfant/:enfantId` — historique de visionnage
- `GET /enfant/:enfantId/resume` — résumé
- `GET /enfant/:enfantId/temps-ecran`
- `GET /enfant/:enfantId/progression`

### `/api/parametres-parentaux`
- `GET /enfant/:enfantId`
- `PUT /enfant/:enfantId` — limites de temps, plages horaires

### `/api/domaines-autorises`
- `GET /enfant/:enfantId`
- `PUT /enfant/:enfantId` `{domaineIds: [...]}`
- `POST /enfant/:enfantId/toggle/:domaineId`

### `/api/appareils` (Parent)
- Liste des appareils enregistrés par parent

### `/api/apk-autorisees` (Admin)
- Versions Android autorisées

### `/api/preferences-telechargement`
- Préférences téléchargement WiFi-only par enfant

---

## 14. RÔLES & PERMISSIONS

| Rôle | ID | Accès |
|------|----|---|
| ADMIN | 1 | Tout |
| PARENT | 2 | Ses enfants, abonnements, paiements |
| ENFANT | 3 | Contenus, progression |
| VALIDATEUR | 7 | Validation contenus, créer gestionnaires |
| GESTIONNAIRE_CONTENU | 8 | CRUD ses contenus, soumettre/publier |

---

## 15. EXEMPLE FLUTTER (Dio)

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://apieducative.genius-universe.com',
  headers: {'Content-Type': 'application/json'},
));

// Helper pour LWS ?route= pattern
String r(String path) => '/?route=$path';

// Login
final res = await dio.post(r('/api/auth/login'), data: {
  'identifiant': 'admin@plateforme-educative.bf',
  'motDePasse': 'xxx',
});
final token = res.data['data']['accessToken'];

// Liste contenus avec auth
dio.options.headers['Authorization'] = 'Bearer $token';
final contenus = await dio.get(r('/api/contenus'));
print(contenus.data['data']); // Array de contenus
print(contenus.data['pagination']); // { total, page, ... }
```

---

## 16. LISTE COMPLÈTE DES FICHIERS DE RÉPONSE CAPTURÉS

Les vraies réponses JSON de production sont dans `captures/` :
- `auth_me.json`, `utilisateurs.json`, `enfants.json`
- `contenus.json`, `contenus_domaines.json`, `contenus_tous.json`
- `contenus_mes-contenus.json`, `contenus_a-valider.json`
- `abonnements.json`, `abonnements_types.json`
- `paiements.json`, `notifications.json`
- `admin_dashboard.json`, `admin_roles.json`, `admin_statistiques_utilisateurs.json`

Utilise-les comme référence définitive de la structure réelle.
