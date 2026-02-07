# Script de Corrections UI - Gestionnaire & Validateur

## Prompt pour Claude Code (Terminal)

Copiez ce prompt et collez-le dans Claude Code :

---

```
Corrige les bugs suivants dans l'interface Gestionnaire de Contenu et Validateur de la plateforme educative. Voici les corrections a effectuer :

## BUG 1 : Bouton "Nouveau contenu" visible pour le Validateur

Fichier : web-app/src/pages/admin/AdminDashboard.jsx

Le validateur ne doit PAS pouvoir ajouter de contenu. Il ne fait que reviser.
- Dans la section "Actions rapides" (ligne ~124), le lien vers "/admin/contenus/nouveau" doit etre masque pour le role "validateur"
- Ajouter une condition pour n'afficher ce bouton que si userRole === 'gestionnaire_contenu' OU hasAdminRole

## BUG 2 : Contenus recents ne s'actualisent pas

Fichier : web-app/src/pages/admin/AdminDashboard.jsx

Les contenus recents sont en dur (DEMO_CONTENUS_RECENTS). Il faut :
1. Supprimer les donnees DEMO
2. Creer un useEffect qui appelle l'API pour recuperer les vrais contenus recents
3. Utiliser le service contenuService ou adminService pour recuperer les derniers contenus
4. Afficher un loader pendant le chargement
5. Gerer le cas d'erreur

Le endpoint probable est : GET /api/contenus?limit=5&sort=date_creation:desc
Ou utiliser adminService.getDashboard() si ca retourne deja les contenus recents.

## BUG 3 : Gestionnaire peut modifier/supprimer les contenus des autres

Fichier : web-app/src/pages/admin/GestionContenus.jsx

Regles metier :
- Le gestionnaire PEUT VOIR tous les contenus (c'est OK actuellement)
- Le gestionnaire ne peut MODIFIER que les contenus qu'il a crees
- Le gestionnaire ne peut SUPPRIMER que les contenus qu'il a crees
- L'admin peut tout modifier/supprimer

Corrections :
1. Recuperer l'ID de l'utilisateur connecte depuis useAdminAuthStore
2. Dans le tableau, pour chaque contenu, comparer contenu.createur_id avec l'ID de l'utilisateur courant
3. Masquer les boutons Modifier (FiEdit2) et Supprimer (FiTrash2) si l'utilisateur n'est pas le createur ET n'est pas admin
4. Garder le bouton Voir (FiEye) visible pour tous

Code exemple pour la condition :
const { user, isAdmin } = useAdminAuthStore();
const canEdit = (contenu) => contenu.createur_id === user?.id || isAdmin();

Puis dans le JSX :
{canEdit(contenu) && (
  <Link to={...modifier}>...</Link>
)}
{canEdit(contenu) && (
  <button onClick={() => handleDelete(...)}>...</button>
)}

## BUG 4 : Bouton "Nouveau contenu" dans GestionContenus.jsx pour Validateur

Fichier : web-app/src/pages/admin/GestionContenus.jsx

Meme probleme que BUG 1 : le bouton "Nouveau contenu" (ligne ~162) doit etre masque pour le validateur.
Ajouter la meme condition de role.

## RESUME DES FICHIERS A MODIFIER

1. web-app/src/pages/admin/AdminDashboard.jsx
   - Masquer "Nouveau contenu" pour validateur
   - Charger les contenus recents depuis l'API

2. web-app/src/pages/admin/GestionContenus.jsx
   - Masquer "Nouveau contenu" pour validateur
   - Masquer Modifier/Supprimer si pas createur (sauf admin)

## IMPORTANT

- Ne pas casser les fonctionnalites existantes
- Tester que l'admin peut toujours tout faire
- Tester que le gestionnaire peut voir tous les contenus mais modifier/supprimer seulement les siens
- Tester que le validateur ne voit plus le bouton "Nouveau contenu"
```

---

## Commande rapide (one-liner)

Si vous preferez une version courte :

```
Corrige AdminDashboard.jsx et GestionContenus.jsx : 1) Masquer bouton "Nouveau contenu" pour le role validateur (il ne fait que reviser). 2) Charger les contenus recents depuis l'API au lieu des donnees DEMO statiques. 3) Dans GestionContenus, masquer les boutons Modifier et Supprimer si l'utilisateur n'est pas le createur du contenu (sauf si admin). Le gestionnaire peut VOIR tous les contenus mais ne peut modifier/supprimer que les siens.
```

---

## Verification apres correction

Testez ces scenarios :

| Role | Voir contenus | Ajouter | Modifier (sien) | Modifier (autre) | Supprimer (sien) | Supprimer (autre) |
|------|---------------|---------|-----------------|------------------|------------------|-------------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestionnaire | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Validateur | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
