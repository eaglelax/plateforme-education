# Guide de Deploiement sur LWS cPanel XL2

## Vos URLs

```
API:      http://apieducative.genius-universe.com
Frontend: http://educative.genius-universe.com (a creer)
```

---

## PARTIE 1: Deploiement de l'API Node.js

### Etape 1: Configurer Node.js dans cPanel

1. Dans cPanel, cherchez **"Setup Node.js App"** ou **"Application Node.js"**
2. Cliquez sur **"CREATE APPLICATION"**
3. Configurez:
   - **Node.js version**: 18.x ou 20.x (la plus recente disponible)
   - **Application mode**: Production
   - **Application root**: `apieducative.genius-universe.com`
   - **Application URL**: `apieducative.genius-universe.com`
   - **Application startup file**: `src/server.js`
4. Cliquez sur **"CREATE"**

**IMPORTANT**: Notez la commande pour entrer dans l'environnement virtuel (affichee apres creation)

### Etape 2: Uploader les fichiers de l'API

**Via le Gestionnaire de fichiers cPanel:**
1. Allez dans **"Gestionnaire de fichiers"**
2. Naviguez vers le dossier `apieducative.genius-universe.com/`
3. Uploadez les elements suivants du dossier `api/`:
   - `src/` (dossier complet)
   - `prisma/` (dossier complet)
   - `public/` (dossier complet)
   - `package.json`
   - `package-lock.json`

### Etape 3: Creer le fichier .env

Dans le dossier `apieducative.genius-universe.com/`, creez un fichier `.env` avec ce contenu:

```env
# Configuration Serveur
PORT=3000
NODE_ENV=production

# Base de donnees MySQL LWS
DATABASE_URL="mysql://<DB_USER>:<DB_PASSWORD>@localhost:3306/<DB_NAME>"

# JWT Secret
JWT_SECRET=<GENERER_64_CARACTERES_ALEATOIRES>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Configuration Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# URLs Frontend
FRONTEND_URL=http://educative.genius-universe.com
ADMIN_URL=http://educative.genius-universe.com/admin

# CORS
CORS_ORIGINS=http://educative.genius-universe.com,https://educative.genius-universe.com
```

### Etape 4: Installer les dependances

1. Dans cPanel, retournez dans **"Setup Node.js App"**
2. Cliquez sur votre application `apieducative.genius-universe.com`
3. Cliquez sur **"Run NPM Install"**

**OU via Terminal cPanel:**
```bash
# Entrer dans l'environnement Node.js (utilisez la commande notee a l'etape 1)
source /home/c2180186c/nodevenv/apieducative.genius-universe.com/18/bin/activate

cd ~/apieducative.genius-universe.com
npm install --production
```

### Etape 5: Initialiser la base de donnees

Dans le Terminal cPanel:
```bash
# Assurez-vous d'etre dans l'environnement Node.js
source /home/c2180186c/nodevenv/apieducative.genius-universe.com/18/bin/activate
cd ~/apieducative.genius-universe.com

# Generer le client Prisma
npx prisma generate

# Appliquer les migrations (creer les tables)
npx prisma migrate deploy

# Creer l'admin et les donnees de base
npm run seed
```

### Etape 6: Demarrer l'application

1. Dans **"Setup Node.js App"**
2. Cliquez sur **"RESTART"**

### Etape 7: Tester l'API

Visitez: `http://apieducative.genius-universe.com/api/health`

Reponse attendue:
```json
{
  "status": "OK",
  "message": "Plateforme Educative API is running",
  "timestamp": "...",
  "version": "1.0.0"
}
```

---

## PARTIE 2: Deploiement du Frontend (Web-App)

### Etape 1: Creer le sous-domaine pour le frontend

1. Dans cPanel, cliquez sur **"Sous-domaines"**
2. Creez: `educative.genius-universe.com`
   - Sous-domaine: `educative`
   - Domaine: `genius-universe.com`
   - Racine du document: `educative.genius-universe.com`

### Etape 2: Construire l'application sur votre PC

Ouvrez un terminal dans le dossier `web-app/`:

```bash
cd web-app

# Construire l'application (utilise .env.production automatiquement)
npm run build
```

Cela cree un dossier `dist/` avec les fichiers optimises.

### Etape 3: Uploader le frontend

1. Dans cPanel > **"Gestionnaire de fichiers"**
2. Naviguez vers `educative.genius-universe.com/`
3. Uploadez **TOUT le contenu** du dossier `dist/`:
   - `index.html`
   - `assets/` (dossier)
4. Uploadez le fichier `.htaccess` du dossier `web-app/`

### Etape 4: Verifier le .htaccess

Le fichier `.htaccess` dans `educative.genius-universe.com/` doit contenir:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Ne pas rediriger les fichiers et dossiers existants
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rediriger tout vers index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache pour les fichiers statiques
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Securite
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

---

## PARTIE 3: Verification finale

### Test de l'API
```
http://apieducative.genius-universe.com/api/health
```

### Test du Frontend
```
http://educative.genius-universe.com
```

### Test de connexion Admin
```
http://educative.genius-universe.com/admin/login

Email: admin@plateforme-educative.bf
Mot de passe: Admin2024!
```

---

## Depannage

### L'API ne demarre pas
1. Verifiez les logs: cPanel > "Setup Node.js App" > "View stderr log"
2. Verifiez le fichier `.env`
3. Verifiez que `src/server.js` existe

### Erreur "Cannot find module"
```bash
# Dans le terminal cPanel, reinstallez:
source /home/c2180186c/nodevenv/apieducative.genius-universe.com/18/bin/activate
cd ~/apieducative.genius-universe.com
rm -rf node_modules
npm install --production
npx prisma generate
```

### Erreur de base de donnees
1. Verifiez dans phpMyAdmin que la base `c2180186c_education` existe
2. Verifiez le format de DATABASE_URL

### Erreur CORS
Verifiez que `CORS_ORIGINS` dans `.env` contient votre domaine frontend

### Page blanche sur le frontend
1. Verifiez que `.htaccess` est present
2. Ouvrez la console du navigateur (F12) pour voir les erreurs

---

## Resume des URLs

| Element | URL |
|---------|-----|
| API | http://apieducative.genius-universe.com |
| API Health | http://apieducative.genius-universe.com/api/health |
| Frontend | http://educative.genius-universe.com |
| Admin Login | http://educative.genius-universe.com/admin/login |

## Identifiants Admin

| Champ | Valeur |
|-------|--------|
| Email | admin@plateforme-educative.bf |
| Mot de passe | Admin2024! |

**IMPORTANT**: Changez le mot de passe admin apres la premiere connexion !

---

## Mise a jour future

### API
1. Uploadez les nouveaux fichiers
2. cPanel > "Setup Node.js App" > "Run NPM Install" (si package.json modifie)
3. Cliquez "RESTART"

### Frontend
1. `npm run build` sur votre PC
2. Uploadez le contenu de `dist/`
