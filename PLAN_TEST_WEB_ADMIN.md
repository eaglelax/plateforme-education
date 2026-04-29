# Plan de test - Web Admin

**Date :** 2026-04-13
**URL locale :** http://localhost:5173 (après `npm run dev`)
**URL prod :** http://edo.genius-universe.com

## Comptes de test

| Rôle | Email |
|---|---|
| Admin | admin@plateforme-educative.bf |
| Gestionnaire | gestionnaire@plateforme-educative.bf |
| Validateur | validateur@plateforme-educative.bf |

> Mots de passe : voir `.env` local ou demander au responsable technique.
> Ne jamais commiter les mots de passe de production dans le repo.

---

## 0. PRÉ-REQUIS — Layout & navigation

À tester **une fois** avec n'importe quel compte.

- [ ] Login redirige vers `/admin/dashboard`
- [ ] Sidebar visible à gauche (260px)
- [ ] Bouton collapse réduit à 72px (icônes seules)
- [ ] Bouton expand restaure à 260px
- [ ] Logo Faso Yiri + sous-titre "Administration" affichés
- [ ] Avatar utilisateur (initiales) + nom + rôle en bas de sidebar
- [ ] Bouton déconnexion (icône rouge) fonctionne et redirige vers login
- [ ] Topbar affiche le badge du rôle
- [ ] Mobile (< 1024px) : sidebar cachée, bouton hamburger visible
- [ ] Hamburger ouvre sidebar avec overlay sombre
- [ ] Clic sur overlay ferme sidebar
- [ ] Clic sur un lien en mobile ferme la sidebar
- [ ] Navigation entre pages garde la sidebar (pas de re-render flash)

---

## 1. ADMINISTRATEUR — `admin@fasoyiri.bf`

### 1.1 Dashboard

- [ ] Stats affichent des chiffres réels (pas "..." ni 0 partout)
  - [ ] Total utilisateurs > 0
  - [ ] Total contenus > 0
  - [ ] En attente (validation) cohérent
  - [ ] Revenus mois en FCFA
- [ ] Cartes cliquables (Contenus → /admin/contenus, En attente → /admin/contenus)
- [ ] Actions rapides visibles : Nouveau contenu, Gérer contenus, Utilisateurs
- [ ] Liste "Contenus récents" (5 derniers) avec statut
- [ ] Pas d'erreur console (F12)

### 1.2 Utilisateurs (/admin/utilisateurs)

- [ ] Liste paginée s'affiche
- [ ] Recherche par nom/email fonctionne
- [ ] Filtre par rôle fonctionne
- [ ] Bouton "Créer utilisateur" ouvre modal
- [ ] **Création utilisateur** : tous les champs validés, message d'erreur affiché DANS le modal si échec
- [ ] Création réussie → utilisateur apparaît dans la liste
- [ ] Modification utilisateur fonctionne
- [ ] Changement de rôle fonctionne
- [ ] Suppression utilisateur (avec confirmation) fonctionne

### 1.3 Profils enfants (/admin/enfants)

- [ ] Liste tous les enfants avec XP, niveau, code, statut
- [ ] Clic sur ligne → modal détail
- [ ] Modal affiche : info enfant, info parent, abonnement
- [ ] Fermeture modal OK

### 1.4 Abonnements (/admin/abonnements)

- [ ] Onglet "Types" : liste les types d'abonnement
- [ ] Création nouveau type fonctionne (utilise abonnementService.createType)
- [ ] Modification type fonctionne
- [ ] Onglet "Abonnements actifs" : liste avec filtres
- [ ] Annuler un abonnement fonctionne

### 1.5 Paiements (/admin/paiements)

- [ ] Liste paginée des paiements
- [ ] Filtres par statut/méthode/date
- [ ] Détail d'un paiement (clic)
- [ ] **Bouton "Rembourser"** sur paiement éligible → confirmation → succès
- [ ] Status passe à "remboursé"

### 1.6 Domaines (/admin/domaines)

- [ ] Liste des domaines avec couleur, nom, count contenus
- [ ] Création domaine (avec couleur picker) fonctionne
- [ ] Modification domaine fonctionne
- [ ] Désactivation (icône poubelle) avec confirmation fonctionne

### 1.7 Statistiques (/admin/statistiques)

- [ ] Page se charge sans erreur
- [ ] Chiffres NON nuls (s'il y a de la donnée)
- [ ] Graphiques affichés correctement
- [ ] Sélecteur de période fonctionne (si présent)

### 1.8 Notifications (/admin/notifications)

- [ ] Onglet "Envoyer" : formulaire OK
- [ ] **Broadcast** : sélection cible (tous/parents/enfants), titre + message → envoi
- [ ] Confirmation succès affichée
- [ ] **Envoi ciblé** : recherche utilisateur, sélection, envoi → succès
- [ ] Onglet "Mes notifications" liste OK

### 1.9 Journal d'audit (/admin/journal)

- [ ] Liste des actions récentes
- [ ] Filtres : action, utilisateur, date début/fin
- [ ] Pagination fonctionne
- [ ] Détail d'une entrée affiche métadonnées

### 1.10 Paramètres (/admin/parametres)

- [ ] Page affiche tous les champs (durée abo, âge enfant, sécurité, etc.)
- [ ] Modification d'une valeur
- [ ] Bouton "Sauvegarder" → message succès
- [ ] **Recharger la page** → valeurs persistées (localStorage)
- [ ] ⚠️ **Connu** : pas encore connecté à l'API

### 1.11 Validations (admin peut aussi valider)

- [ ] Page accessible depuis menu si admin
- [ ] Workflow complet identique au validateur (voir section 3)

---

## 2. GESTIONNAIRE DE CONTENU — `gestionnaire@fasoyiri.bf`

### 2.1 Sidebar

- [ ] Sections visibles : **General, Contenus, (PAS de Validation/Gestion/Système)**
- [ ] Liens dans Contenus : Tous les contenus, Mes contenus, Domaines
- [ ] Pas d'accès à : Utilisateurs, Enfants, Abonnements, Paiements, Stats, Notifs, Journal, Paramètres

### 2.2 Dashboard

- [ ] Card stats affiche "Mes contenus" (pas "Contenus")
- [ ] Compteur cohérent avec /admin/mes-contenus
- [ ] Action rapide "Nouveau contenu" visible
- [ ] Action rapide "Gérer les contenus" visible
- [ ] PAS d'action "Utilisateurs"
- [ ] PAS de stat "Utilisateurs" ni "Revenus"

### 2.3 Mes contenus (/admin/mes-contenus)

- [ ] Cartes stats par statut (Brouillons, En attente, À amender, Validés, Publiés)
- [ ] Clic sur carte filtre la liste
- [ ] Onglet "Tous" affiche tous mes contenus
- [ ] Pour chaque statut, boutons d'action corrects :
  - [ ] **Brouillon** : Modifier + Soumettre + Supprimer
  - [ ] **En attente** : badge "En attente de validation" (pas de bouton)
  - [ ] **À amender** : Commentaire validateur affiché en rouge + Modifier + Soumettre
  - [ ] **Validé** : Bouton Publier
  - [ ] **Publié** : Voir + Archiver

### 2.4 Création de contenu (/admin/contenus/nouveau)

- [ ] Sélection du type (vidéo/audio/document/quiz/jeu)
- [ ] Champ Niveau (1/2/3) présent
- [ ] Sélection domaine (depuis liste)
- [ ] Tranche d'âge min/max
- [ ] **Upload média** : fichier accepté jusqu'à 200MB
  - [ ] Barre de progression visible
  - [ ] Pas de timeout à 7% (timeout=45min)
- [ ] **Upload miniature** OK
- [ ] **Quiz** : ajout de questions, réponses, marquer correctes
- [ ] **Réordonner questions** (boutons ↑↓)
- [ ] Sauvegarde brouillon → redirection vers Mes contenus
- [ ] Le contenu apparaît dans "Brouillons"

### 2.5 Workflow soumission

- [ ] Sur un brouillon, clic "Soumettre" → confirmation → statut passe à "En attente"
- [ ] Le contenu disparaît de "Brouillons" et apparaît dans "En attente"

### 2.6 Workflow amendement (après que validateur ait renvoyé)

- [ ] Le contenu apparaît dans "À amender" avec commentaire validateur
- [ ] Clic Modifier → édition → re-soumettre

### 2.7 Workflow publication

- [ ] Après validation, contenu dans "Validés"
- [ ] Clic Publier → confirmation → statut "Publié"

### 2.8 Domaines

- [ ] Accès OK (gestionnaire peut gérer)
- [ ] CRUD complet identique à l'admin

### 2.9 Tous les contenus (/admin/contenus)

- [ ] Liste de TOUS les contenus (pas seulement les siens)
- [ ] Pagination 20/page
- [ ] Filtres : recherche, domaine, statut
- [ ] Peut MODIFIER/SUPPRIMER **uniquement ses propres contenus**
- [ ] Peut VOIR détail des autres contenus

---

## 3. VALIDATEUR — `validateur@fasoyiri.bf`

### 3.1 Sidebar

- [ ] Sections visibles : **General, Validation** uniquement
- [ ] PAS d'accès à : Contenus, Mes contenus, Domaines, Utilisateurs, etc.

### 3.2 Dashboard

- [ ] Stat affiche "À valider" (lien vers /validations)
- [ ] Stat "Contenus" = nombre de contenus publiés
- [ ] Action rapide "Valider les contenus" (PAS "Gérer les contenus")
- [ ] PAS de stat Utilisateurs ni Revenus

### 3.3 File de validation (/admin/validations)

- [ ] 4 cartes stats cliquables : En attente / Validés / À amender / Mes validations
- [ ] Clic sur carte filtre la liste
- [ ] Filtre par défaut : "En attente"
- [ ] Liste affiche : type icône, titre, domaine, créateur, statut, âge, date soumission

### 3.4 Validation d'un contenu

- [ ] Clic icône "œil" → modal détail s'ouvre
- [ ] **Miniature** affichée
- [ ] **Vidéo** : lecteur fonctionne, lecture, seek (avance/recule)
- [ ] **Audio** : lecteur fonctionne avec couverture
- [ ] **Document PDF** : iframe affiche le PDF
- [ ] **Quiz** : toutes les questions affichées avec réponses, réponse correcte mise en évidence
- [ ] Historique du contenu (si présent)
- [ ] Fermer modal OK

### 3.5 Action Valider

- [ ] Clic icône "check" → modal validation
- [ ] Commentaire optionnel
- [ ] Clic "Valider" → succès → contenu passe en "Validé"
- [ ] Disparaît de "En attente"
- [ ] Apparaît dans "Mes validations"

### 3.6 Action Amender

- [ ] Clic icône "X" → modal amendement
- [ ] Commentaire **obligatoire** (bouton désactivé si vide)
- [ ] Saisir commentaire → bouton activé
- [ ] Clic "Renvoyer" → succès
- [ ] Statut passe à "À amender"
- [ ] Le gestionnaire voit le commentaire dans /admin/mes-contenus

---

## 4. SÉCURITÉ & ACCÈS

### 4.1 Tentatives d'accès non autorisées

- [ ] Validateur tape `/admin/utilisateurs` dans URL → redirigé ou erreur 403
- [ ] Gestionnaire tape `/admin/parametres` → redirigé ou erreur
- [ ] Logout puis tentative `/admin/dashboard` → redirigé vers `/admin/login`

### 4.2 Tokens

- [ ] DevTools > Application > LocalStorage : présence de `admin-token` après login
- [ ] Logout supprime `admin-token`
- [ ] Token expiré → redirection vers login (à tester en supprimant manuellement le token)

---

## 5. RESPONSIVE

Tester sur largeur :

- [ ] Desktop (≥ 1280px) : sidebar 260px, contenu max-width 1400px
- [ ] Tablet (768-1024px) : sidebar cachée, hamburger
- [ ] Mobile (< 768px) : sidebar overlay, contenu padding 1rem

---

## 6. PERFORMANCE / CONSOLE

À chaque page principale :

- [ ] Pas d'erreur rouge dans console (F12)
- [ ] Pas de warning React (clés manquantes, etc.)
- [ ] Pas de requête 401/403 inattendue dans Network
- [ ] Temps de chargement < 2s sur connexion correcte
- [ ] **Vérifier** : aucun `console.log` ne leak un token ou des données utilisateur

---

## Procédure suggérée

1. Lancer `npm run dev` dans `web-app/`
2. Ouvrir http://localhost:5173
3. Tester section 0 (layout) une fois
4. Login Admin → tester sections 1 + 4 + 5 + 6
5. Logout, login Gestionnaire → tester section 2
6. Logout, login Validateur → tester section 3
7. Au fur et à mesure des bugs, me les reporter (capture + URL) pour correction

---

## Workflow E2E (test du flux complet)

Le test critique qui valide TOUT :

1. **Gestionnaire** crée un contenu vidéo + quiz → soumet
2. **Validateur** voit le contenu en attente → ouvre détail → lit la vidéo → consulte le quiz → renvoie pour amendement avec commentaire
3. **Gestionnaire** voit le commentaire → modifie → re-soumet
4. **Validateur** valide cette fois
5. **Gestionnaire** publie
6. **Admin** voit le contenu publié dans `/admin/contenus` et dans les stats du dashboard

Si ce flux passe → la plateforme est fonctionnelle.
