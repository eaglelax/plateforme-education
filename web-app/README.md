# ANKA — Administration

Interface d'administration de la plateforme éducative **ANKA EdTech**.

> *Nos cultures. Leur avenir.*

## Stack

- **React 19** + **Vite 7**
- **React Router 7** — navigation
- **TanStack Query 5** — data fetching
- **Zustand 5** — state global (auth, thème)
- **DM Sans** — typographie officielle ANKA

## Design system

L'interface respecte la charte graphique ANKA v1.0
(`design/anka_brand_kit_v2/anka_brand/charte/ANKA_Brand_Guidelines.pdf`).

| Token | Hex | Usage |
|---|---|---|
| Noir ANKA | `#0D0D0D` | Texte principal |
| Blanc Chaud | `#F8F7F5` | Fond principal |
| Terracotta | `#C85A2A` | Accent / interactions |
| Or | `#D4941A` | Accent secondaire |
| Gris Moyen | `#888888` | Texte secondaire |
| Gris Clair | `#E0DDD8` | Bordures |

Le thème (Light / Dark) est piloté par `useThemeStore`
(`src/stores/themeStore.js`), persisté en `localStorage` sous la clé
`anka-theme`. L'attribut `data-theme="dark"` est appliqué sur
`<html>` pour basculer les variables CSS.

## Démarrer en local

```bash
npm install
npm run dev
```

Le serveur tourne par défaut sur `http://localhost:5173`.

## Scripts

- `npm run dev` — serveur de développement (HMR)
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build
- `npm run lint` — ESLint

## Structure

```
src/
├── assets/              # logos & images
├── components/
│   ├── common/          # AnkaLogo, ThemeToggle, ErrorBoundary, RoleGuard...
│   └── layout/          # AdminLayout (sidebar + topbar)
├── pages/admin/         # 14 pages routées sur /admin/*
├── stores/              # adminAuthStore, themeStore
├── services/api.js      # client HTTP
├── styles/index.css     # design system (tokens + utilities)
└── App.jsx              # router
```

## Rôles supportés

- `ADMIN` — gestion complète, lecture seule sur contenus
- `GESTIONNAIRE_CONTENU` — création / édition contenus
- `VALIDATEUR` — validation des contenus soumis

---

© 2025 ANKA EdTech — Ouagadougou, Burkina Faso
