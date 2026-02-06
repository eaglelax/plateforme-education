# Sprint 1 - Processus de Gestion de Contenu

**Version:** 1.0
**Date:** 2026-02-01
**Statut:** En cours

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Acteurs et Roles](#2-acteurs-et-roles)
3. [Flux de travail](#3-flux-de-travail)
4. [User Stories](#4-user-stories)
5. [Maquettes](#5-maquettes)
6. [Specifications API](#6-specifications-api)
7. [Modifications Base de Donnees](#7-modifications-base-de-donnees)
8. [Regles Metier](#8-regles-metier)
9. [Criteres d'acceptation](#9-criteres-dacceptation)

---

## 1. Vue d'ensemble

Le Sprint 1 implemente le processus complet de gestion de contenu educatif, depuis la creation par le gestionnaire jusqu'a la publication, en passant par la validation.

### Objectifs

- Permettre au gestionnaire de contenu de creer tout type de contenu (video, audio, quiz, jeu, document, activite)
- Associer un quiz de fin a chaque contenu (questions + reponses)
- Permettre au validateur de revoir les contenus et d'ajouter des commentaires
- Gerer le cycle complet : creation → validation → amendements → publication

---

## 2. Acteurs et Roles

### 2.1 Gestionnaire de Contenu

| Permission | Description |
|------------|-------------|
| Creer contenu | Creer un nouveau contenu avec toutes ses informations |
| Modifier contenu | Modifier ses propres contenus (brouillon ou a amender) |
| Ajouter quiz | Associer un quiz avec questions/reponses au contenu |
| Soumettre validation | Envoyer un contenu pour validation |
| Publier | Publier un contenu valide |
| Voir historique | Voir l'historique des amendements |

### 2.2 Validateur

| Permission | Description |
|------------|-------------|
| Lister contenus | Voir la liste des contenus en attente de validation |
| Visualiser contenu | Voir tous les details du contenu (lecture seule) |
| Valider | Approuver un contenu pour publication |
| Renvoyer amendements | Ajouter un commentaire et renvoyer au gestionnaire |
| Voir statistiques | Voir les statistiques de validation |

---

## 3. Flux de travail

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FLUX DE GESTION DE CONTENU                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

    GESTIONNAIRE DE CONTENU                         VALIDATEUR
    ════════════════════════                        ══════════

    ┌─────────────────────┐
    │  1. CREER CONTENU   │
    │  - Titre            │
    │  - Description      │
    │  - Type             │
    │  - Age min/max      │
    │  - Domaine          │
    │  - Media            │
    └─────────┬───────────┘
              │
              ▼
    ┌─────────────────────┐
    │  2. AJOUTER QUIZ    │
    │  - Questions        │
    │  - Reponses         │
    │  - Score minimum    │
    └─────────┬───────────┘
              │
              ▼
    ┌─────────────────────┐
    │  3. SOUMETTRE       │
    │  Statut: brouillon  │
    │  → en_attente       │
    └─────────┬───────────┘
              │
              ├─────────────────────────────────────┐
              │                                     │
              │                                     ▼
              │                           ┌─────────────────────┐
              │                           │  4. LISTE A VALIDER │
              │                           │  Validateur voit    │
              │                           │  les contenus       │
              │                           └─────────┬───────────┘
              │                                     │
              │                                     ▼
              │                           ┌─────────────────────┐
              │                           │  5. VOIR DETAILS    │
              │                           │  - Contenu complet  │
              │                           │  - Quiz + Questions │
              │                           │  - Lecture seule    │
              │                           └─────────┬───────────┘
              │                                     │
              │                          ┌──────────┴──────────┐
              │                          │                     │
              │                          ▼                     ▼
              │               ┌─────────────────┐   ┌─────────────────────┐
              │               │ COMMENTAIRE?    │   │   PAS DE           │
              │               │ OUI → Amender   │   │   COMMENTAIRE      │
              │               └────────┬────────┘   │   → Valider        │
              │                        │            └─────────┬───────────┘
              │                        │                      │
              │                        ▼                      │
              │               ┌─────────────────┐             │
              │               │ 6. RENVOYER     │             │
              │               │ Statut:         │             │
              │               │ a_amender       │             │
              │               └────────┬────────┘             │
              │                        │                      │
    ┌─────────┴────────────────────────┘                      │
    │                                                         │
    ▼                                                         ▼
┌─────────────────────┐                            ┌─────────────────────┐
│  7. VOIR AMENDEMENTS│                            │  8. VALIDE          │
│  - Commentaire      │                            │  Statut: valide     │
│  - Modifier contenu │                            └─────────┬───────────┘
└─────────┬───────────┘                                      │
          │                                                  │
          │ (Retour etape 3)                                 │
          │                                                  │
          │                                     ┌────────────┘
          │                                     │
          │                                     ▼
          │                           ┌─────────────────────┐
          │                           │  9. PUBLIER         │
          │                           │  (Gestionnaire)     │
          │                           │  Statut: publie     │
          └───────────────────────────►                     │
                                      └─────────────────────┘
```

### Diagramme des statuts

```
                    ┌───────────┐
                    │ brouillon │
                    └─────┬─────┘
                          │ [Soumettre]
                          ▼
                ┌─────────────────────┐
                │   en_attente        │
                │   (validation)      │
                └─────────┬───────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             │             ▼
    ┌───────────┐         │      ┌───────────┐
    │ a_amender │         │      │  valide   │
    └─────┬─────┘         │      └─────┬─────┘
          │               │            │
          │ [Modifier +   │            │ [Publier]
          │  Resoumettre] │            ▼
          └───────────────┘      ┌───────────┐
                                 │  publie   │
                                 └───────────┘
```

---

## 4. User Stories

### US-1: Creer un contenu avec quiz

**En tant que** gestionnaire de contenu
**Je veux** creer un contenu educatif complet avec un quiz associe
**Afin de** proposer du contenu pedagogique aux enfants

**Criteres d'acceptation:**
- [ ] Je peux renseigner: titre, description, type, age min/max, domaine, niveau
- [ ] Je peux uploader un fichier media (video, audio, document) par drag & drop ou bouton
- [ ] Je vois une barre de progression pendant l'upload
- [ ] La duree et la taille du fichier sont detectees automatiquement
- [ ] Je peux uploader une image miniature
- [ ] Je peux ajouter un quiz avec plusieurs questions
- [ ] Chaque question peut avoir plusieurs reponses (marquer la/les correcte(s))
- [ ] Le contenu est sauvegarde en statut "brouillon"

### US-2: Soumettre un contenu pour validation

**En tant que** gestionnaire de contenu
**Je veux** soumettre mon contenu pour validation
**Afin que** le validateur puisse le revoir

**Criteres d'acceptation:**
- [ ] Je peux soumettre un contenu en statut "brouillon"
- [ ] Le statut passe a "en_attente"
- [ ] Le validateur recoit une notification

### US-3: Voir les contenus a valider

**En tant que** validateur
**Je veux** voir la liste des contenus en attente de validation
**Afin de** pouvoir les examiner

**Criteres d'acceptation:**
- [ ] Je vois la liste des contenus en statut "en_attente"
- [ ] Je vois: titre, type, age min/max, date soumission, createur
- [ ] Je peux filtrer par type, domaine, date

### US-4: Examiner un contenu en detail

**En tant que** validateur
**Je veux** voir tous les details d'un contenu
**Afin de** verifier sa qualite pedagogique

**Criteres d'acceptation:**
- [ ] Je vois toutes les informations du contenu
- [ ] Je vois le quiz complet avec questions et reponses
- [ ] Je peux visualiser le media associe
- [ ] Je ne peux PAS modifier le contenu

### US-5: Valider un contenu

**En tant que** validateur
**Je veux** approuver un contenu
**Afin qu'il** puisse etre publie

**Criteres d'acceptation:**
- [ ] Je peux valider un contenu sans commentaire obligatoire
- [ ] Le statut passe a "valide"
- [ ] Le gestionnaire recoit une notification

### US-6: Renvoyer pour amendements

**En tant que** validateur
**Je veux** renvoyer un contenu avec mes commentaires
**Afin que** le gestionnaire puisse le corriger

**Criteres d'acceptation:**
- [ ] Je dois saisir un commentaire (obligatoire)
- [ ] Le statut passe a "a_amender"
- [ ] Le gestionnaire recoit une notification avec le commentaire

### US-7: Voir mes contenus et leur statut

**En tant que** gestionnaire de contenu
**Je veux** voir la liste de mes contenus par statut
**Afin de** suivre leur progression

**Criteres d'acceptation:**
- [ ] Je vois mes contenus groupes par statut
- [ ] Pour les contenus "a_amender", je vois le commentaire du validateur
- [ ] Pour les contenus "valide", je peux les publier

### US-8: Modifier un contenu a amender

**En tant que** gestionnaire de contenu
**Je veux** modifier un contenu renvoye pour amendements
**Afin de** corriger les problemes signales

**Criteres d'acceptation:**
- [ ] Je vois le commentaire du validateur
- [ ] Je peux modifier le contenu et le quiz
- [ ] Je peux resoumettre pour validation

### US-9: Publier un contenu valide

**En tant que** gestionnaire de contenu
**Je veux** publier mes contenus valides
**Afin qu'ils** soient accessibles aux enfants

**Criteres d'acceptation:**
- [ ] Je vois la liste de mes contenus valides
- [ ] Je peux publier un contenu valide
- [ ] Le statut passe a "publie" avec la date de publication

---

## 5. Maquettes

### 5.1 Ecran: Creation de contenu

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PLATEFORME EDUCATIVE          [Gestionnaire: Jean Dupont]              [Deconnexion]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ◄ Retour                      CREER UN NOUVEAU CONTENU                             │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  INFORMATIONS GENERALES                                                      │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  Titre *                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │ Les animaux de la savane africaine                                      ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │  Description                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │ Decouvrez les animaux fascinants qui vivent dans la savane             ││   │
│  │  │ africaine: lions, elephants, girafes et bien d'autres!                 ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │  Type de contenu *           Domaine educatif *                             │   │
│  │  ┌──────────────────┐        ┌──────────────────────────────────┐          │   │
│  │  │ Video          ▼│        │ Sciences de la nature          ▼│          │   │
│  │  └──────────────────┘        └──────────────────────────────────┘          │   │
│  │                                                                              │   │
│  │  Age minimum *               Age maximum *                                   │   │
│  │  ┌──────────────────┐        ┌──────────────────────────────────┐          │   │
│  │  │ 6 ans          ▼│        │ 10 ans                         ▼│          │   │
│  │  └──────────────────┘        └──────────────────────────────────┘          │   │
│  │                                                                              │   │
│  │  Niveau                      Points XP                                       │   │
│  │  ┌──────────────────┐        ┌──────────────────────────────────┐          │   │
│  │  │ Niveau 1       ▼│        │ 15                                │          │   │
│  │  └──────────────────┘        └──────────────────────────────────┘          │   │
│  │                                                                              │   │
│  │  [ ] Contenu Premium         [ ] Telechargeable                             │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  FICHIER MEDIA *                                                             │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │                                                                         ││   │
│  │  │     ┌───────────────────────────────────────────────────────────┐       ││   │
│  │  │     │                                                           │       ││   │
│  │  │     │           Glissez-deposez votre fichier ici               │       ││   │
│  │  │     │                         ou                                │       ││   │
│  │  │     │              [Parcourir les fichiers]                     │       ││   │
│  │  │     │                                                           │       ││   │
│  │  │     │   Formats acceptes: MP4, WEBM, MP3, WAV, PDF, DOCX        │       ││   │
│  │  │     │   Taille maximale: 500 Mo                                 │       ││   │
│  │  │     │                                                           │       ││   │
│  │  │     └───────────────────────────────────────────────────────────┘       ││   │
│  │  │                                                                         ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │  Fichier selectionne: savane-africaine.mp4 (45.2 Mo)          [X Supprimer] │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │  ████████████████████████████████████████████░░░░░░░░░░  85%  Upload... ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │  Duree detectee: 12 min 34 sec                                              │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  IMAGE MINIATURE                                                             │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  ┌────────────────────┐                                                     │   │
│  │  │                    │   [Choisir une image]                               │   │
│  │  │   ┌────────────┐   │                                                     │   │
│  │  │   │   apercu   │   │   Formats: JPG, PNG, WEBP                           │   │
│  │  │   │   image    │   │   Dimensions recommandees: 640x360 px               │   │
│  │  │   └────────────┘   │   Taille max: 5 Mo                                  │   │
│  │  │                    │                                                     │   │
│  │  └────────────────────┘   savane-thumbnail.jpg (234 Ko)   [X]               │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│                         [Enregistrer le brouillon]  [Suivant: Quiz →]               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Ecran: Ajout du Quiz

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PLATEFORME EDUCATIVE          [Gestionnaire: Jean Dupont]              [Deconnexion]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ◄ Retour                      QUIZ: Les animaux de la savane                       │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  PARAMETRES DU QUIZ                                                          │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  Titre du quiz                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │ Quiz: Les animaux de la savane                                          ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │  Score minimum (%)           Temps limite (min, 0 = illimite)               │   │
│  │  ┌──────────────────┐        ┌──────────────────────────────────┐          │   │
│  │  │ 60                │        │ 10                                │          │   │
│  │  └──────────────────┘        └──────────────────────────────────┘          │   │
│  │                                                                              │   │
│  │  [X] Melanger les questions   [X] Afficher la correction                    │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  QUESTIONS (3)                                                    [+ Ajouter]│   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Question 1                                              [Modifier] [X] │  │   │
│  │  │ ─────────────────────────────────────────────────────────────────────  │  │   │
│  │  │ Type: Choix unique   |   Points: 1                                     │  │   │
│  │  │                                                                        │  │   │
│  │  │ Quel est le plus grand animal terrestre?                               │  │   │
│  │  │                                                                        │  │   │
│  │  │   ○ Le lion                                                            │  │   │
│  │  │   ● L'elephant  ← Correcte                                             │  │   │
│  │  │   ○ La girafe                                                          │  │   │
│  │  │   ○ Le rhinoceros                                                      │  │   │
│  │  └───────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Question 2                                              [Modifier] [X] │  │   │
│  │  │ ─────────────────────────────────────────────────────────────────────  │  │   │
│  │  │ Type: Vrai/Faux   |   Points: 1                                        │  │   │
│  │  │                                                                        │  │   │
│  │  │ Les girafes peuvent courir jusqu'a 60 km/h?                            │  │   │
│  │  │                                                                        │  │   │
│  │  │   ● Vrai  ← Correcte                                                   │  │   │
│  │  │   ○ Faux                                                               │  │   │
│  │  └───────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Question 3                                              [Modifier] [X] │  │   │
│  │  │ ─────────────────────────────────────────────────────────────────────  │  │   │
│  │  │ Type: Choix multiple   |   Points: 2                                   │  │   │
│  │  │                                                                        │  │   │
│  │  │ Quels animaux sont des felins? (plusieurs reponses)                    │  │   │
│  │  │                                                                        │  │   │
│  │  │   ☑ Le lion  ← Correcte                                                │  │   │
│  │  │   ☐ L'elephant                                                         │  │   │
│  │  │   ☑ Le guepard  ← Correcte                                             │  │   │
│  │  │   ☐ Le zebre                                                           │  │   │
│  │  └───────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│        [← Retour au contenu]    [Enregistrer]    [Soumettre pour validation →]      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Ecran: Liste des contenus (Gestionnaire)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PLATEFORME EDUCATIVE          [Gestionnaire: Jean Dupont]              [Deconnexion]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  MES CONTENUS                                              [+ Nouveau contenu]       │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ [Tous] [Brouillons (2)] [En attente (1)] [A amender (1)] [Valides (3)] [Publies]│
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════    │
│  A AMENDER (1)                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ Les animaux marins                                                       │   │
│  │  ───────────────────────────────────────────────────────────────────────────│   │
│  │  Type: Video  |  Age: 5-9 ans  |  Domaine: Sciences                         │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ COMMENTAIRE DU VALIDATEUR (Marie Martin - 31/01/2026):              │    │   │
│  │  │ "Merci d'ajouter des sous-titres a la video et de corriger         │    │   │
│  │  │ la question 3 du quiz dont la reponse correcte est erronee."        │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                              │   │
│  │                                     [Modifier et resoumettre →]             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════    │
│  VALIDES - PRETS A PUBLIER (3)                                                      │
│  ══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ Les animaux de la savane                                                 │   │
│  │  Type: Video  |  Age: 6-10 ans  |  Valide le: 30/01/2026                    │   │
│  │                                                           [Publier]         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ Les chiffres de 1 a 10                                                   │   │
│  │  Type: Activite  |  Age: 4-6 ans  |  Valide le: 29/01/2026                  │   │
│  │                                                           [Publier]         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ L'histoire du Burkina Faso                                               │   │
│  │  Type: Document  |  Age: 8-12 ans  |  Valide le: 28/01/2026                 │   │
│  │                                                           [Publier]         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Ecran: Liste a valider (Validateur)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PLATEFORME EDUCATIVE          [Validateur: Marie Martin]               [Deconnexion]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CONTENUS A VALIDER                                                                 │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  STATISTIQUES                                                                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │   │
│  │  │ En attente   │ │ Valides      │ │ Rejetes      │ │ Mes valid.   │        │   │
│  │  │     5        │ │    127       │ │     8        │ │     42       │        │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Filtres:  Type [Tous ▼]   Domaine [Tous ▼]   Trier par [Date soumission ▼] │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ # │ Titre                      │ Type    │ Age     │ Createur     │ Soumis  │   │
│  ├───┼────────────────────────────┼─────────┼─────────┼──────────────┼─────────┤   │
│  │ 1 │ Les couleurs primaires     │ Video   │ 4-6 ans │ Jean Dupont  │ 01/02   │   │
│  │   │                            │         │         │              │ [Voir →]│   │
│  ├───┼────────────────────────────┼─────────┼─────────┼──────────────┼─────────┤   │
│  │ 2 │ Apprendre a compter        │ Jeu     │ 4-7 ans │ Paul Kone    │ 01/02   │   │
│  │   │                            │         │         │              │ [Voir →]│   │
│  ├───┼────────────────────────────┼─────────┼─────────┼──────────────┼─────────┤   │
│  │ 3 │ Les voyelles               │ Audio   │ 5-8 ans │ Jean Dupont  │ 31/01   │   │
│  │   │                            │         │         │              │ [Voir →]│   │
│  ├───┼────────────────────────────┼─────────┼─────────┼──────────────┼─────────┤   │
│  │ 4 │ Quiz geographie Burkina    │ Quiz    │ 8-12 ans│ Awa Traore   │ 31/01   │   │
│  │   │                            │         │         │              │ [Voir →]│   │
│  ├───┼────────────────────────────┼─────────┼─────────┼──────────────┼─────────┤   │
│  │ 5 │ Les fruits locaux          │ Document│ 6-10 ans│ Paul Kone    │ 30/01   │   │
│  │   │                            │         │         │              │ [Voir →]│   │
│  └───┴────────────────────────────┴─────────┴─────────┴──────────────┴─────────┘   │
│                                                                                      │
│  Page 1 sur 1                                                    [◄] [1] [►]        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Ecran: Detail contenu (Validateur - Lecture seule)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PLATEFORME EDUCATIVE          [Validateur: Marie Martin]               [Deconnexion]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ◄ Retour a la liste                  VALIDATION DE CONTENU                         │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  INFORMATIONS DU CONTENU                                    [LECTURE SEULE]  │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  Titre: Les couleurs primaires                                               │   │
│  │  Type: Video                        Domaine: Arts et creativite              │   │
│  │  Age: 4 - 6 ans                     Niveau: Niveau 1                         │   │
│  │  Createur: Jean Dupont              Soumis le: 01/02/2026                    │   │
│  │  Points XP: 10                      Premium: Non                             │   │
│  │  Telechargeable: Oui                Duree: 8 minutes                         │   │
│  │                                                                              │   │
│  │  Description:                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │ Dans cette video, les enfants apprendront a reconnaitre et nommer les  ││   │
│  │  │ trois couleurs primaires: rouge, bleu et jaune. Ils decouvriront       ││   │
│  │  │ comment melanger ces couleurs pour creer de nouvelles teintes.         ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │  Media:                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │  ┌─────────────────────────────────────┐                                ││   │
│  │  │  │                                     │                                ││   │
│  │  │  │         [► LECTURE VIDEO]           │                                ││   │
│  │  │  │                                     │                                ││   │
│  │  │  └─────────────────────────────────────┘                                ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  QUIZ ASSOCIE                                               [LECTURE SEULE]  │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  Titre: Quiz sur les couleurs primaires                                      │   │
│  │  Score minimum: 60%                 Temps limite: 5 minutes                  │   │
│  │  Questions: 3                       Melanger: Oui                            │   │
│  │                                                                              │   │
│  │  ─────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                              │   │
│  │  Question 1 (Choix unique - 1 pt)                                            │   │
│  │  "Quelle couleur obtient-on en melangeant le bleu et le jaune?"              │   │
│  │    ○ Orange                                                                  │   │
│  │    ○ Violet                                                                  │   │
│  │    ● Vert  ← CORRECTE                                                        │   │
│  │    ○ Rose                                                                    │   │
│  │                                                                              │   │
│  │  Question 2 (Vrai/Faux - 1 pt)                                               │   │
│  │  "Le rouge est une couleur primaire?"                                        │   │
│  │    ● Vrai  ← CORRECTE                                                        │   │
│  │    ○ Faux                                                                    │   │
│  │                                                                              │   │
│  │  Question 3 (Choix unique - 1 pt)                                            │   │
│  │  "Combien y a-t-il de couleurs primaires?"                                   │   │
│  │    ○ 2                                                                       │   │
│  │    ● 3  ← CORRECTE                                                           │   │
│  │    ○ 4                                                                       │   │
│  │    ○ 5                                                                       │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  DECISION DE VALIDATION                                                      │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  Commentaire (obligatoire si amendement):                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐│   │
│  │  │                                                                         ││   │
│  │  │                                                                         ││   │
│  │  └─────────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                              │   │
│  │           [Renvoyer pour amendements]              [✓ Valider le contenu]   │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Specifications API

### 6.1 Endpoints Gestionnaire de Contenu

#### Uploader un fichier media

```
POST /api/uploads/media
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin
Content-Type: multipart/form-data

Body (form-data):
- file: (binary) Le fichier media a uploader

Formats acceptes par type:
- video: MP4, WEBM, MOV, AVI (max 500 Mo)
- audio: MP3, WAV, OGG, M4A (max 100 Mo)
- document: PDF, DOCX, PPTX (max 50 Mo)
- image: JPG, PNG, WEBP, GIF (max 10 Mo)

Response 201:
{
  "success": true,
  "message": "Fichier uploade avec succes",
  "data": {
    "fileId": "f8a7b6c5-d4e3-2f1a-0b9c-8d7e6f5a4b3c",
    "fileName": "savane-africaine.mp4",
    "fileType": "video/mp4",
    "fileSize": 47421030,
    "fileSizeMo": 45.23,
    "duration": 754,
    "durationFormatted": "12:34",
    "urlTemporaire": "/uploads/temp/f8a7b6c5-d4e3-2f1a-0b9c-8d7e6f5a4b3c.mp4"
  }
}

Response 400 (Fichier trop volumineux):
{
  "success": false,
  "error": "Le fichier depasse la taille maximale autorisee (500 Mo)"
}

Response 415 (Format non supporte):
{
  "success": false,
  "error": "Format de fichier non supporte. Formats acceptes: MP4, WEBM, MOV, AVI"
}
```

#### Uploader une miniature

```
POST /api/uploads/miniature
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin
Content-Type: multipart/form-data

Body (form-data):
- file: (binary) L'image miniature

Formats acceptes: JPG, PNG, WEBP
Dimensions recommandees: 640x360 px (16:9)
Taille maximale: 5 Mo

Response 201:
{
  "success": true,
  "message": "Miniature uploadee avec succes",
  "data": {
    "fileId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "fileName": "savane-thumbnail.jpg",
    "fileSize": 239616,
    "fileSizeKo": 234,
    "dimensions": { "width": 640, "height": 360 },
    "urlTemporaire": "/uploads/temp/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d.jpg"
  }
}
```

#### Creer un contenu (avec fichiers uploades)

```
POST /api/contenus
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin
Content-Type: application/json

Body:
{
  "titre": "Les animaux de la savane",
  "description": "Decouvrez les animaux de la savane africaine",
  "type": "video",
  "domaineId": 1,
  "niveauId": 1,
  "trancheAgeMin": 6,
  "trancheAgeMax": 10,
  "mediaFileId": "f8a7b6c5-d4e3-2f1a-0b9c-8d7e6f5a4b3c",
  "miniatureFileId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "pointsXp": 15,
  "estPremium": false,
  "estTelechargeable": true
}

Note: Les champs dureeMinutes et tailleMo sont automatiquement
      extraits du fichier uploade.

Response 201:
{
  "success": true,
  "message": "Contenu cree",
  "data": {
    "id": 123,
    "urlMedia": "/contenus/123/media/savane-africaine.mp4",
    "urlMiniature": "/contenus/123/miniature/savane-thumbnail.jpg"
  }
}
```

#### Creer un contenu (upload direct en une seule requete)

```
POST /api/contenus/with-upload
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin
Content-Type: multipart/form-data

Body (form-data):
- media: (binary) Le fichier media principal *
- miniature: (binary) L'image miniature (optionnel)
- data: (JSON string) Les metadonnees du contenu:
  {
    "titre": "Les animaux de la savane",
    "description": "Decouvrez les animaux de la savane africaine",
    "type": "video",
    "domaineId": 1,
    "niveauId": 1,
    "trancheAgeMin": 6,
    "trancheAgeMax": 10,
    "pointsXp": 15,
    "estPremium": false,
    "estTelechargeable": true
  }

Response 201:
{
  "success": true,
  "message": "Contenu cree avec fichiers",
  "data": {
    "id": 123,
    "urlMedia": "/contenus/123/media/savane-africaine.mp4",
    "urlMiniature": "/contenus/123/miniature/savane-thumbnail.jpg",
    "dureeMinutes": 12,
    "tailleMo": 45.23
  }
}
```

#### Ajouter/Modifier le quiz d'un contenu

```
POST /api/contenus/{contenuId}/quiz
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin

Body:
{
  "titre": "Quiz: Les animaux de la savane",
  "description": "Testez vos connaissances",
  "tempsLimiteMinutes": 10,
  "scoreMinimum": 60,
  "melangerQuestions": true,
  "afficherCorrection": true,
  "questions": [
    {
      "texte": "Quel est le plus grand animal terrestre?",
      "type": "choix_unique",
      "points": 1,
      "explication": "L'elephant d'Afrique est le plus grand animal terrestre",
      "reponses": [
        { "texte": "Le lion", "estCorrecte": false },
        { "texte": "L'elephant", "estCorrecte": true },
        { "texte": "La girafe", "estCorrecte": false },
        { "texte": "Le rhinoceros", "estCorrecte": false }
      ]
    },
    {
      "texte": "Les girafes peuvent courir jusqu'a 60 km/h?",
      "type": "vrai_faux",
      "points": 1,
      "reponses": [
        { "texte": "Vrai", "estCorrecte": true },
        { "texte": "Faux", "estCorrecte": false }
      ]
    }
  ]
}

Response 201:
{
  "success": true,
  "message": "Quiz cree/modifie",
  "data": { "quizId": 45 }
}
```

#### Soumettre un contenu pour validation

```
PUT /api/contenus/{id}/soumettre
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin

Response 200:
{
  "success": true,
  "message": "Contenu soumis pour validation"
}
```

#### Lister mes contenus par statut

```
GET /api/contenus/mes-contenus?statut={statut}&page=1&limit=20
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin

Parametres:
- statut: brouillon, en_attente, a_amender, valide, publie (optionnel)
- page: numero de page
- limit: nombre par page

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "titre": "Les animaux de la savane",
      "type": "video",
      "statut": "a_amender",
      "trancheAgeMin": 6,
      "trancheAgeMax": 10,
      "domaineNom": "Sciences de la nature",
      "dateCreation": "2026-01-28T10:00:00Z",
      "dateSoumission": "2026-01-29T14:00:00Z",
      "commentaireValidation": "Merci de corriger la question 2...",
      "validateurNom": "Marie Martin",
      "dateValidation": "2026-01-30T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Publier un contenu valide

```
PUT /api/contenus/{id}/publier
Authorization: Bearer {token}
Role: gestionnaire_contenu, admin

Response 200:
{
  "success": true,
  "message": "Contenu publie"
}
```

### 6.2 Endpoints Validateur

#### Lister les contenus a valider

```
GET /api/contenus/a-valider?type={type}&domaineId={id}&page=1&limit=20
Authorization: Bearer {token}
Role: validateur, admin

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "titre": "Les couleurs primaires",
      "type": "video",
      "trancheAgeMin": 4,
      "trancheAgeMax": 6,
      "domaineNom": "Arts et creativite",
      "createurNom": "Jean Dupont",
      "dateSoumission": "2026-02-01T08:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### Voir le detail d'un contenu a valider

```
GET /api/contenus/{id}/validation
Authorization: Bearer {token}
Role: validateur, admin

Response 200:
{
  "success": true,
  "data": {
    "id": 123,
    "titre": "Les couleurs primaires",
    "description": "...",
    "type": "video",
    "urlMedia": "...",
    "urlMiniature": "...",
    "dureeMinutes": 8,
    "trancheAgeMin": 4,
    "trancheAgeMax": 6,
    "pointsXp": 10,
    "estPremium": false,
    "estTelechargeable": true,
    "domaine": {
      "id": 3,
      "nom": "Arts et creativite"
    },
    "niveau": {
      "id": 1,
      "nom": "Niveau 1"
    },
    "createur": {
      "id": 5,
      "nom": "Dupont",
      "prenom": "Jean"
    },
    "dateSoumission": "2026-02-01T08:00:00Z",
    "quiz": {
      "id": 45,
      "titre": "Quiz sur les couleurs primaires",
      "scoreMinimum": 60,
      "tempsLimiteMinutes": 5,
      "melangerQuestions": true,
      "afficherCorrection": true,
      "questions": [
        {
          "id": 100,
          "texte": "Quelle couleur obtient-on en melangeant le bleu et le jaune?",
          "type": "choix_unique",
          "points": 1,
          "explication": "...",
          "reponses": [
            { "id": 1, "texte": "Orange", "estCorrecte": false },
            { "id": 2, "texte": "Violet", "estCorrecte": false },
            { "id": 3, "texte": "Vert", "estCorrecte": true },
            { "id": 4, "texte": "Rose", "estCorrecte": false }
          ]
        }
      ]
    },
    "historique": [
      {
        "action": "soumission",
        "date": "2026-02-01T08:00:00Z",
        "utilisateur": "Jean Dupont"
      }
    ]
  }
}
```

#### Valider un contenu

```
PUT /api/contenus/{id}/valider
Authorization: Bearer {token}
Role: validateur, admin

Body (optionnel):
{
  "commentaire": "Excellent contenu pedagogique!"
}

Response 200:
{
  "success": true,
  "message": "Contenu valide"
}
```

#### Renvoyer pour amendements

```
PUT /api/contenus/{id}/amender
Authorization: Bearer {token}
Role: validateur, admin

Body:
{
  "commentaire": "Merci de corriger les points suivants: ..."
}

Response 200:
{
  "success": true,
  "message": "Contenu renvoye pour amendements"
}
```

#### Statistiques de validation

```
GET /api/contenus/stats-validation
Authorization: Bearer {token}
Role: validateur, admin

Response 200:
{
  "success": true,
  "data": {
    "enAttente": 5,
    "valides": 127,
    "aAmender": 3,
    "publies": 120,
    "mesValidations": 42
  }
}
```

---

## 7. Modifications Base de Donnees

### 7.1 Modification de la table `contenus`

```sql
-- Ajouter les nouveaux statuts et colonnes
ALTER TABLE `contenus`
MODIFY COLUMN `statut` ENUM('brouillon', 'en_attente', 'a_amender', 'valide', 'publie', 'archive') DEFAULT 'brouillon',
ADD COLUMN `date_soumission` TIMESTAMP NULL AFTER `date_publication`,
ADD COLUMN `validateur_id` INT UNSIGNED NULL AFTER `createur_id`,
ADD COLUMN `commentaire_validation` TEXT NULL AFTER `validateur_id`,
ADD COLUMN `date_validation` TIMESTAMP NULL AFTER `commentaire_validation`,
ADD CONSTRAINT `fk_contenus_validateur` FOREIGN KEY (`validateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL;

CREATE INDEX `idx_contenus_validateur` ON `contenus`(`validateur_id`);
CREATE INDEX `idx_contenus_date_soumission` ON `contenus`(`date_soumission`);
```

### 7.2 Table historique des validations

```sql
-- Table pour l'historique des actions de validation
CREATE TABLE `historique_validations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` ENUM('soumission', 'validation', 'amendement', 'resoumission', 'publication') NOT NULL,
  `commentaire` TEXT,
  `statut_avant` VARCHAR(20),
  `statut_apres` VARCHAR(20),
  `date_action` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `contenu_id` INT UNSIGNED NOT NULL,
  `utilisateur_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`contenu_id`) REFERENCES `contenus`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_historique_val_contenu` ON `historique_validations`(`contenu_id`);
CREATE INDEX `idx_historique_val_date` ON `historique_validations`(`date_action`);
```

### 7.3 Table des fichiers uploades

```sql
-- Table pour stocker les metadonnees des fichiers uploades
CREATE TABLE `fichiers_uploades` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE COMMENT 'Identifiant unique du fichier',
  `nom_original` VARCHAR(255) NOT NULL COMMENT 'Nom original du fichier',
  `nom_stockage` VARCHAR(255) NOT NULL COMMENT 'Nom sur le disque',
  `chemin_relatif` VARCHAR(500) NOT NULL COMMENT 'Chemin relatif depuis uploads/',
  `type_mime` VARCHAR(100) NOT NULL,
  `taille_octets` BIGINT NOT NULL,
  `taille_mo` DECIMAL(10,2) GENERATED ALWAYS AS (taille_octets / 1048576) STORED,
  `type_fichier` ENUM('video', 'audio', 'document', 'image', 'autre') NOT NULL,
  `duree_secondes` INT DEFAULT NULL COMMENT 'Pour video/audio',
  `dimensions_largeur` INT DEFAULT NULL COMMENT 'Pour images/videos',
  `dimensions_hauteur` INT DEFAULT NULL COMMENT 'Pour images/videos',
  `hash_md5` VARCHAR(32) COMMENT 'Pour detecter les doublons',
  `est_temporaire` BOOLEAN DEFAULT TRUE,
  `date_expiration` TIMESTAMP NULL COMMENT 'Pour fichiers temporaires',
  `scan_antivirus` ENUM('en_attente', 'clean', 'infecte') DEFAULT 'en_attente',
  `date_scan` TIMESTAMP NULL,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `utilisateur_id` INT UNSIGNED NOT NULL,
  `contenu_id` INT UNSIGNED NULL COMMENT 'NULL si temporaire',
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contenu_id`) REFERENCES `contenus`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_fichiers_uuid` ON `fichiers_uploades`(`uuid`);
CREATE INDEX `idx_fichiers_contenu` ON `fichiers_uploades`(`contenu_id`);
CREATE INDEX `idx_fichiers_temporaire` ON `fichiers_uploades`(`est_temporaire`, `date_expiration`);
CREATE INDEX `idx_fichiers_hash` ON `fichiers_uploades`(`hash_md5`);
```

### 7.4 Modification de la table contenus pour les fichiers

```sql
-- Ajouter les references aux fichiers uploades
ALTER TABLE `contenus`
ADD COLUMN `fichier_media_id` INT UNSIGNED NULL AFTER `url_miniature`,
ADD COLUMN `fichier_miniature_id` INT UNSIGNED NULL AFTER `fichier_media_id`,
ADD CONSTRAINT `fk_contenus_fichier_media` FOREIGN KEY (`fichier_media_id`)
    REFERENCES `fichiers_uploades`(`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_contenus_fichier_miniature` FOREIGN KEY (`fichier_miniature_id`)
    REFERENCES `fichiers_uploades`(`id`) ON DELETE SET NULL;
```

### 7.5 Ajouter le role gestionnaire_contenu

```sql
-- Verifier et ajouter les roles necessaires
INSERT INTO `roles` (`nom`, `description`, `permissions`) VALUES
('gestionnaire_contenu', 'Gestionnaire de contenu educatif', JSON_OBJECT(
  'contenus', JSON_ARRAY('create', 'read', 'update', 'submit', 'publish'),
  'quiz', JSON_ARRAY('create', 'read', 'update', 'delete'),
  'uploads', JSON_ARRAY('create', 'read', 'delete'),
  'domaines', JSON_ARRAY('read')
)),
('validateur', 'Validateur de contenu pedagogique', JSON_OBJECT(
  'contenus', JSON_ARRAY('read', 'validate', 'reject'),
  'quiz', JSON_ARRAY('read'),
  'uploads', JSON_ARRAY('read'),
  'domaines', JSON_ARRAY('read')
))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
```

---

## 8. Regles Metier

### 8.1 Creation de contenu

| Code | Regle |
|------|-------|
| RC01 | Le titre est obligatoire et doit avoir entre 5 et 255 caracteres |
| RC02 | Le type doit etre parmi: video, audio, quiz, jeu, document, activite |
| RC03 | L'age minimum doit etre >= 4 et <= age maximum |
| RC04 | L'age maximum doit etre <= 12 et >= age minimum |
| RC05 | Un contenu est cree avec le statut "brouillon" |
| RC06 | Le domaine educatif est obligatoire |
| RC07 | Le fichier media est obligatoire (sauf pour type "quiz" et "activite") |

### 8.2 Upload de fichiers

| Code | Regle |
|------|-------|
| RU01 | Les fichiers videos acceptes: MP4, WEBM, MOV, AVI (max 500 Mo) |
| RU02 | Les fichiers audio acceptes: MP3, WAV, OGG, M4A (max 100 Mo) |
| RU03 | Les documents acceptes: PDF, DOCX, PPTX (max 50 Mo) |
| RU04 | Les miniatures acceptees: JPG, PNG, WEBP (max 5 Mo) |
| RU05 | La duree et la taille sont extraites automatiquement du fichier |
| RU06 | Les fichiers uploades sont stockes temporairement pendant 24h |
| RU07 | A la creation du contenu, les fichiers sont deplaces vers le stockage permanent |
| RU08 | Les noms de fichiers sont normalises (sans accents, espaces → tirets) |
| RU09 | Un scan antivirus est effectue sur chaque fichier uploade |
| RU10 | Les miniatures sont redimensionnees automatiquement en 640x360 px |

### 8.3 Quiz

| Code | Regle |
|------|-------|
| RQ01 | Un quiz doit avoir au moins 1 question |
| RQ02 | Chaque question doit avoir au moins 2 reponses |
| RQ03 | Chaque question doit avoir au moins 1 reponse correcte |
| RQ04 | Le score minimum doit etre entre 0 et 100 |
| RQ05 | Pour le type "vrai_faux", exactement 2 reponses sont requises |

### 8.4 Soumission

| Code | Regle |
|------|-------|
| RS01 | Seul un contenu en statut "brouillon" ou "a_amender" peut etre soumis |
| RS02 | Le createur du contenu peut soumettre son propre contenu |
| RS03 | La soumission change le statut en "en_attente" |
| RS04 | Une notification est envoyee aux validateurs |

### 8.5 Validation

| Code | Regle |
|------|-------|
| RV01 | Seul un contenu en statut "en_attente" peut etre valide |
| RV02 | La validation sans commentaire change le statut en "valide" |
| RV03 | L'amendement REQUIERT un commentaire |
| RV04 | L'amendement change le statut en "a_amender" |
| RV05 | Une notification est envoyee au createur du contenu |
| RV06 | Le validateur ne peut pas modifier le contenu |

### 8.6 Publication

| Code | Regle |
|------|-------|
| RP01 | Seul un contenu en statut "valide" peut etre publie |
| RP02 | Le createur du contenu peut publier son contenu valide |
| RP03 | La publication change le statut en "publie" |
| RP04 | La date de publication est enregistree |

---

## 9. Criteres d'acceptation

### Sprint 1 - Definition of Done

- [ ] Toutes les User Stories sont implementees et testees
- [ ] Les endpoints API sont documentes (Swagger/Postman)
- [ ] Les tests unitaires couvrent au moins 80% du code
- [ ] Les tests d'integration passent
- [ ] L'interface utilisateur est responsive
- [ ] Les notifications fonctionnent
- [ ] La documentation est a jour
- [ ] Code review effectuee
- [ ] Deploiement en environnement de test reussi

### Checklist par fonctionnalite

#### Gestionnaire de contenu
- [ ] Peut creer un contenu avec toutes les informations
- [ ] Peut uploader un fichier media (video, audio, document)
- [ ] Peut uploader une image miniature
- [ ] Voit la progression d'upload avec barre de progression
- [ ] Peut supprimer un fichier uploade avant validation
- [ ] La duree et taille sont detectees automatiquement
- [ ] Peut ajouter/modifier un quiz avec questions et reponses
- [ ] Peut soumettre un contenu pour validation
- [ ] Peut voir la liste de ses contenus par statut
- [ ] Peut modifier un contenu "a_amender"
- [ ] Peut voir le commentaire du validateur
- [ ] Peut resoumettre un contenu amende
- [ ] Peut publier un contenu valide

#### Upload de fichiers
- [ ] Drag & drop fonctionne
- [ ] Bouton "Parcourir" fonctionne
- [ ] Les formats non supportes sont rejetes avec message clair
- [ ] Les fichiers trop volumineux sont rejetes avec message clair
- [ ] La barre de progression s'affiche pendant l'upload
- [ ] Les miniatures sont redimensionnees automatiquement
- [ ] Le scan antivirus est effectue
- [ ] Les fichiers temporaires expirent apres 24h

#### Validateur
- [ ] Peut voir la liste des contenus en attente
- [ ] Peut voir les statistiques de validation
- [ ] Peut voir le detail complet d'un contenu (lecture seule)
- [ ] Peut visualiser le quiz avec toutes les questions
- [ ] Peut valider un contenu
- [ ] Peut renvoyer pour amendements avec commentaire
- [ ] Le commentaire est obligatoire pour l'amendement

#### Notifications
- [ ] Notification au validateur lors de la soumission
- [ ] Notification au gestionnaire lors de la validation
- [ ] Notification au gestionnaire lors de l'amendement

---

## Annexes

### A. Types de questions supportes

| Type | Description | Reponses |
|------|-------------|----------|
| `choix_unique` | Une seule reponse correcte | 2-6 reponses, 1 correcte |
| `choix_multiple` | Plusieurs reponses correctes | 2-6 reponses, 1+ correctes |
| `vrai_faux` | Vrai ou Faux | Exactement 2 reponses |
| `texte_libre` | Reponse textuelle | Reponse de reference |

### B. Statuts de contenu

```
brouillon     → Contenu en cours de creation
en_attente    → Soumis, en attente de validation
a_amender     → Renvoye par le validateur avec commentaires
valide        → Approuve par le validateur, pret a publier
publie        → Visible par les utilisateurs finaux
archive       → Retire de la publication
```

### C. Roles et permissions

| Role | Contenus | Quiz | Upload | Validation |
|------|----------|------|--------|------------|
| `gestionnaire_contenu` | CRUD + submit + publish | CRUD | CRUD | - |
| `validateur` | Read | Read | Read | validate + amend |
| `admin` | Full | Full | Full | Full |

### D. Formats de fichiers supportes

#### Videos
| Format | Extension | MIME Type | Taille max |
|--------|-----------|-----------|------------|
| MP4 | .mp4 | video/mp4 | 500 Mo |
| WebM | .webm | video/webm | 500 Mo |
| MOV | .mov | video/quicktime | 500 Mo |
| AVI | .avi | video/x-msvideo | 500 Mo |

#### Audio
| Format | Extension | MIME Type | Taille max |
|--------|-----------|-----------|------------|
| MP3 | .mp3 | audio/mpeg | 100 Mo |
| WAV | .wav | audio/wav | 100 Mo |
| OGG | .ogg | audio/ogg | 100 Mo |
| M4A | .m4a | audio/mp4 | 100 Mo |

#### Documents
| Format | Extension | MIME Type | Taille max |
|--------|-----------|-----------|------------|
| PDF | .pdf | application/pdf | 50 Mo |
| Word | .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | 50 Mo |
| PowerPoint | .pptx | application/vnd.openxmlformats-officedocument.presentationml.presentation | 50 Mo |

#### Images (miniatures)
| Format | Extension | MIME Type | Taille max | Dimensions |
|--------|-----------|-----------|------------|------------|
| JPEG | .jpg, .jpeg | image/jpeg | 5 Mo | 640x360 px (auto-resize) |
| PNG | .png | image/png | 5 Mo | 640x360 px (auto-resize) |
| WebP | .webp | image/webp | 5 Mo | 640x360 px (auto-resize) |

### E. Structure de stockage des fichiers

```
uploads/
├── temp/                           # Fichiers temporaires (24h)
│   └── {uuid}.{ext}
├── contenus/                       # Fichiers permanents
│   └── {contenu_id}/
│       ├── media/
│       │   └── {nom_normalise}.{ext}
│       └── miniature/
│           └── {nom_normalise}.{ext}
└── questions/                      # Images des questions de quiz
    └── {question_id}/
        └── {nom_normalise}.{ext}
```

---

**Fin du document Sprint 1**
