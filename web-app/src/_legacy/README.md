# Code legacy (mis de côté — non routé)

Ce dossier contient l'ancien **espace parent** (anciennement `Faso Yiri`)
qui n'est plus routé dans `App.jsx` depuis la refonte ANKA.

Le contenu est conservé au cas où certaines pages seraient réactivées
plus tard (par exemple si on décide de rouvrir un portail parent web).
**Aucun fichier d'ici ne doit être importé** par le code actif.

## Contenu

### `pages/`
Anciennes pages du portail parent :
- `Login.jsx` / `Register.jsx` — auth parent
- `Dashboard.jsx` — tableau de bord parent
- `Abonnements.jsx` — gestion d'abonnement parent
- `Contenus.jsx` — catalogue parent
- `Enfants.jsx`, `EnfantDetail.jsx`, `EnfantParametres.jsx`,
  `NouvelEnfant.jsx`, `ModifierEnfant.jsx` — gestion des profils enfants
- `Notifications.jsx`
- CSS associés + `Auth.css` orphelin

### `components/layout/`
- `Layout.jsx` / `Navbar.jsx` — layout du portail parent
  (remplacé par `components/layout/AdminLayout.jsx` côté admin)

### `components/common/`
- `ProtectedRoute.jsx` — guard parent
  (remplacé par `AdminProtectedRoute.jsx` côté admin)

## Si on les réactive

Avant de réutiliser ces composants :

1. Les **migrer vers la charte ANKA** (palette, DM Sans, logo)
2. Vérifier les **imports d'API** dans `services/api.js` (endpoints parent)
3. Décider de l'URL — par ex. `/parent/*` au lieu de `/login` direct
4. Ajouter les routes dans `App.jsx`

---

*Déplacé le 2026-06-01 lors de la refonte ANKA.*
