# Prompt de Deploiement LWS - Plateforme Educative

Copie le texte ci-dessous et colle-le dans Claude Code pour lancer le deploiement.

---

## Prompt

```
Deploie la plateforme educative sur LWS (API + Web App). Voici les etapes :

### 1. API - Deploiement sur apieducative.genius-universe.com

- Identifiants FTP : hote=apieducative.genius-universe.com, user=apieducative@genius-universe.com, pass=EducPlatform2024BurkinaFaso
- Uploade via curl FTP les fichiers modifies de `api-v2/` vers le serveur. La structure sur le serveur est :
  - `app.js` (racine) ← correspond a `api-v2/app.js`
  - `src/` ← correspond a `api-v2/src/`
  - `package.json` ← correspond a `api-v2/package.json`
- Compare les fichiers locaux avec le dernier commit deploye pour detecter les fichiers modifies (utilise git diff --name-only)
- Pour chaque fichier modifie dans api-v2/, uploade-le au bon chemin sur le FTP (ex: `api-v2/src/controllers/contenu.controller.js` → FTP `/src/controllers/contenu.controller.js`)
- Apres upload, touche `tmp/restart.txt` sur le FTP pour redemarrer Passenger :
  curl -s -T - -u "apieducative@genius-universe.com:EducPlatform2024BurkinaFaso" "ftp://apieducative.genius-universe.com/tmp/restart.txt" < /dev/null
- Verifie que l'API repond : curl "http://apieducative.genius-universe.com/?route=/api/health"

### 2. Web App - Deploiement sur edo.genius-universe.com

- Identifiants FTP : hote=edo.genius-universe.com, user=edo@genius-universe.com, pass=EducPlatform2024BurkinaFaso
- Execute `cd web-app && npm run build` pour rebuilder
- Cree un zip `web-app-deploy.zip` contenant uniquement le contenu de `web-app/dist/` : index.html, assets/, vite.svg, .htaccess
- Uploade le zip via curl FTP a la racine :
  curl -s -T web-app/web-app-deploy.zip -u "edo@genius-universe.com:EducPlatform2024BurkinaFaso" "ftp://edo.genius-universe.com/web-app-deploy.zip"
- Dis-moi d'extraire le zip sur cPanel et de rafraichir le navigateur (Ctrl+Shift+R)

### Notes importantes
- Le serveur LWS utilise Phusion Passenger avec routing par query parameter : `?route=/api/...`
- Varnish CDN cache les reponses - utiliser `Cache-Control: no-cache` et `_t=timestamp` pour bust le cache
- Ne PAS uploader node_modules/, .env, ou fichiers de config locaux
- Si un nouveau package npm a ete ajoute cote API, il faudra l'installer manuellement sur le serveur via SSH ou migration endpoint
```
