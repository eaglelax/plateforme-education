# Commandes pour lancer le projet - Sprint 1

## Pre-requis
- Node.js >= 18.0.0
- MySQL (serveur en cours d'execution)
- npm ou yarn

---

## 1. Configuration de la Base de Donnees

```bash
# Copier le fichier .env.example vers .env dans api-v2
cd api-v2
cp .env.example .env

# Modifier .env avec vos parametres MySQL:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=votre_utilisateur
# DB_PASSWORD=votre_mot_de_passe
# DB_NAME=plateforme_educative
```

---

## 2. Installation des Dependances

### Terminal 1 - API Backend
```bash
cd api-v2
npm install
```

### Terminal 2 - Application Web (Frontend)
```bash
cd web-app
npm install
```

### Terminal 3 - Application Admin
```bash
cd admin-app
npm install
```

---

## 3. Initialisation de la Base de Donnees

```bash
cd api-v2

# Executer les migrations (creation des tables)
npm run migrate

# Remplir avec des donnees de test (optionnel)
npm run seed

# Reinitialiser la base (supprime tout et recree)
npm run reset
```

---

## 4. Lancer le Projet

### Option A: Lancer chaque service separement (recommande pour le dev)

**Terminal 1 - API Backend (port 3000)**
```bash
cd api-v2
npm run dev
```

**Terminal 2 - Application Web (port 5173)**
```bash
cd web-app
npm run dev
```

**Terminal 3 - Application Admin (port 5174)**
```bash
cd admin-app
npm run dev
```

### Option B: Script tout-en-un (Windows PowerShell)

Creer un fichier `start-all.ps1` :
```powershell
# Ouvrir 3 terminaux et lancer chaque service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-v2; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web-app; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin-app; npm run dev"
```

### Option C: Script tout-en-un (Git Bash / Linux)

Creer un fichier `start-all.sh` :
```bash
#!/bin/bash
# Lancer l'API en arriere-plan
cd api-v2 && npm run dev &
# Lancer le web-app en arriere-plan
cd ../web-app && npm run dev &
# Lancer l'admin-app en arriere-plan
cd ../admin-app && npm run dev &
wait
```

---

## 5. URLs d'acces

| Service | URL | Description |
|---------|-----|-------------|
| API Backend | http://localhost:3000 | API REST |
| Web App | http://localhost:5173 | Application utilisateur |
| Admin App | http://localhost:5174 | Interface admin |

---

## 6. Commandes Utiles

### API Backend (api-v2)
```bash
npm run dev      # Mode developpement (hot-reload)
npm run start    # Mode production
npm run migrate  # Executer les migrations
npm run seed     # Remplir la base avec des donnees test
npm run reset    # Reinitialiser la base de donnees
```

### Applications Frontend (web-app / admin-app)
```bash
npm run dev      # Mode developpement (hot-reload)
npm run build    # Build de production
npm run preview  # Preview du build
npm run lint     # Verifier le code
```

---

## 7. Tester le Sprint 1 - Gestion de Contenu

### Endpoints API principaux

**Gestionnaire de contenu:**
- `POST /api/uploads/media` - Upload fichier media
- `POST /api/uploads/miniature` - Upload miniature
- `POST /api/contenus` - Creer un contenu
- `POST /api/contenus/{id}/quiz` - Ajouter un quiz
- `PUT /api/contenus/{id}/soumettre` - Soumettre pour validation
- `GET /api/contenus/mes-contenus` - Lister mes contenus
- `PUT /api/contenus/{id}/publier` - Publier un contenu

**Validateur:**
- `GET /api/contenus/a-valider` - Contenus en attente
- `GET /api/contenus/{id}/validation` - Detail contenu
- `PUT /api/contenus/{id}/valider` - Valider
- `PUT /api/contenus/{id}/amender` - Renvoyer avec commentaire

### Collection Postman
Importer le fichier `api-v2/Plateforme_Educative_API_V2.postman_collection.json` dans Postman pour tester tous les endpoints.

---

## 8. Troubleshooting

### Erreur de connexion MySQL
```bash
# Verifier que MySQL est en cours d'execution
# Windows:
net start mysql

# Verifier les parametres dans .env
```

### Port deja utilise
```bash
# Trouver le processus utilisant le port (Windows)
netstat -ano | findstr :3000

# Tuer le processus
taskkill /PID <numero_pid> /F
```

### Reinitialiser tout
```bash
# Supprimer node_modules et reinstaller
cd api-v2 && rm -rf node_modules && npm install
cd web-app && rm -rf node_modules && npm install
cd admin-app && rm -rf node_modules && npm install
```
