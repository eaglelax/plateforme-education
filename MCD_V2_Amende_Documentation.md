# Modele Conceptuel de Donnees - Version 2.1 Amendee

## Plateforme Educative Burkina Faso

**Version:** 2.1
**Date:** 2026-01-09
**Base:** ConceptualDataModel_V1.cdm + Amendements

---

## Amendements Integres

| # | Amendement | Impact |
|---|------------|--------|
| 1 | Parent peut inscrire plusieurs enfants + acces mode kiosque | `Parametre_Parental` |
| 2 | Annuler le renouvellement automatique | `Abonnement.renouvellement_auto = FALSE` |
| 3 | Abonnement PAR ENFANT (pas 2 enfants sur meme tablette) | `Abonnement` lie a `Profil_Enfant` + `Session_Active` |
| 4 | Telechargement automatique des contenus | `Contenu_Telecharge` + `Preference_Telechargement` |
| 5 | Whitelist APK pour mode kiosque | `Application_Autorisee` + `Application_Enfant_Autorisee` |
| 9 | Compte enfant avec identifiants de connexion | `Profil_Enfant` + code_connexion, mot_de_passe, pin_simplifie |
| **10** | **NOUVEAU (2026-04-29) : Domaines modulaires par pack d'abonnement + tout telechargeable** | **`Pack_Domaines` (N-N) + `Abonnement_Domaines` (snapshot)** |

---

## AMENDEMENT #9 : Identifiants de Connexion Enfant

### Cas d'utilisation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUX DE CREATION ET CONNEXION                        │
└─────────────────────────────────────────────────────────────────────────────┘

    ETAPE 1: Creation profil enfant (Espace Parent)
    ───────────────────────────────────────────────

    ┌─────────────────────────────────────────────────────────────┐
    │  ESPACE PARENT (Telephone du parent)                        │
    │                                                             │
    │  [+] Ajouter un enfant                                      │
    │                                                             │
    │  Nom/Pseudo: [ Amadou          ]                            │
    │  Age:        [ 8 ans           ]                            │
    │  Avatar:     [ 👦              ]                            │
    │                                                             │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │              Creer le profil                        │   │
    │  └─────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │  GENERATION AUTOMATIQUE                                     │
    │                                                             │
    │  ✅ Profil cree avec succes !                               │
    │                                                             │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │  IDENTIFIANTS DE CONNEXION                          │   │
    │  │  ─────────────────────────────────────────          │   │
    │  │                                                     │   │
    │  │  Code enfant:    ENF-A3K7M9                         │   │
    │  │  Mot de passe:   Xk7pL2mN                           │   │
    │  │                                                     │   │
    │  │  ⚠️ Notez ces informations !                        │   │
    │  │  Vous en aurez besoin pour connecter                │   │
    │  │  la tablette de votre enfant.                       │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    │  [📱 Envoyer par SMS]    [📋 Copier]    [OK]               │
    └─────────────────────────────────────────────────────────────┘


    ETAPE 2: Connexion sur tablette enfant
    ──────────────────────────────────────

    ┌─────────────────────────────────────────────────────────────┐
    │  TABLETTE ENFANT (Mode Kiosque)                             │
    │                                                             │
    │                     ┌─────────────┐                         │
    │                     │    LOGO     │                         │
    │                     │  Faso Yiri  │                         │
    │                     └─────────────┘                         │
    │                                                             │
    │     Code enfant:                                            │
    │     ┌─────────────────────────────────────────────────┐    │
    │     │  ENF-A3K7M9                                     │    │
    │     └─────────────────────────────────────────────────┘    │
    │                                                             │
    │     Mot de passe:                                           │
    │     ┌─────────────────────────────────────────────────┐    │
    │     │  ••••••••                                       │    │
    │     └─────────────────────────────────────────────────┘    │
    │                                                             │
    │     ┌─────────────────────────────────────────────────┐    │
    │     │              Se connecter                       │    │
    │     └─────────────────────────────────────────────────┘    │
    │                                                             │
    │     OU pour les petits (4-6 ans):                          │
    │     ┌─────────────────────────────────────────────────┐    │
    │     │         Connexion avec PIN                      │    │
    │     └─────────────────────────────────────────────────┘    │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘


    ETAPE 3: Gestion par le parent
    ──────────────────────────────

    ┌─────────────────────────────────────────────────────────────┐
    │  ESPACE PARENT > Gerer Amadou                               │
    │                                                             │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │  👦 Amadou                                          │   │
    │  │  Code: ENF-A3K7M9                                   │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    │  Identifiants de connexion:                                 │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │  [🔄 Regenerer mot de passe]                        │   │
    │  │  [📱 Envoyer identifiants par SMS]                  │   │
    │  │  [🔢 Configurer PIN simplifie]                      │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    │  Parametres parentaux:                                      │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │  Temps max/jour:  [45 min     ▼]                    │   │
    │  │  Horaires:        [16:00 - 19:00]                   │   │
    │  │  Domaines:        [Configurer...]                   │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

### Nouveaux attributs dans Profil_Enfant

| Attribut | Type | Description |
|----------|------|-------------|
| `code_connexion` | VARCHAR(20) | Code unique genere (ex: ENF-A3K7M9) - **IMMUTABLE** |
| `mot_de_passe` | VARCHAR(255) | Mot de passe hashe, genere auto, modifiable par parent |
| `pin_simplifie` | VARCHAR(6) | PIN 4-6 chiffres pour enfants 4-6 ans (optionnel) |
| `mode_connexion` | ENUM | 'mot_de_passe', 'pin', 'les_deux' |
| `mot_de_passe_modifie` | BOOLEAN | Indique si le parent a change le mdp |
| `date_dernier_changement_mdp` | DATETIME | Date du dernier changement |
| `nombre_echecs_connexion` | INTEGER | Compteur securite (blocage apres 5 echecs) |
| `compte_bloque_jusqu` | DATETIME | Date fin blocage temporaire |

### Regles metier

| Code | Regle |
|------|-------|
| BR_ENF_01 | Le `code_connexion` est genere automatiquement et ne peut PAS etre modifie |
| BR_ENF_02 | Le `mot_de_passe` est genere automatiquement mais PEUT etre modifie par le parent |
| BR_ENF_03 | Apres 5 echecs de connexion, le compte est bloque pendant 15 minutes |
| BR_ENF_04 | Le parent recoit les identifiants par SMS lors de la creation du profil |
| BR_ENF_05 | Pour les enfants 4-6 ans, le mode PIN simplifie est recommande |

---

## Diagramme du MCD Amende

```
                                        ┌─────────────────┐
                                        │      Role       │
                                        │─────────────────│
                                        │ PK id_role      │
                                        │    libelle      │
                                        │    permissions  │
                                        └────────┬────────┘
                                                 │ N
                                                 │
                                                 │ N
┌─────────────────────────┐              ┌───────┴───────────────┐
│     Journal_Action      │              │     Utilisateur       │
│─────────────────────────│              │───────────────────────│
│ PK id_log               │◄─────────────│ PK id_utilisateur     │
│    action               │      N       │    nom, prenom        │
│    entite_concernee     │              │    telephone (unique) │
│    donnees_avant/apres  │              │    email              │
│    date_action          │              │    mot_de_passe       │
└─────────────────────────┘              │    code_pin           │
                                         │    statut_compte      │
                                         └───────────┬───────────┘
                                                     │ 1
                          ┌──────────────────────────┼──────────────────────────┐
                          │                          │                          │
                          │ N                        │ N                        │ N
                          ▼                          ▼                          ▼
               ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
               │    Notification     │    │      Appareil       │    │   Profil_Enfant     │
               │─────────────────────│    │─────────────────────│    │─────────────────────│
               │ PK id_notification  │    │ PK id_appareil      │    │ PK id_enfant        │
               │    type             │    │    identifiant_unique│   │ FK id_parent        │
               │    titre, message   │    │    type_appareil    │    │    nom_pseudo       │
               │    lu               │    │    token_push       │    │    age (4-12)       │
               └─────────────────────┘    │    statut           │    │    avatar           │
                                          └──────────┬──────────┘    │    points_xp        │
                                                     │               │    niveau_global    │
                                                     │ 1             └──────────┬──────────┘
                                                     │                          │ 1
                          ┌──────────────────────────┤                          │
                          │                          │               ┌──────────┴──────────────────────────────────────────┐
                          │ N                        │               │          │          │          │          │        │
                          ▼                          │               │ 1        │ N        │ N        │ N        │ N      │ 1
           ┌─────────────────────────┐               │               ▼          ▼          ▼          ▼          ▼        ▼
           │    Session_Active       │               │    ┌──────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
           │─────────────────────────│◄──────────────┘    │ Parametre_   │ │Abonne-  │ │Domaine_ │ │Badge_   │ │Historique│ │Preference_   │
           │ PK id_session           │      N             │ Parental     │ │ment     │ │Autorise │ │Enfant   │ │Apprentis.│ │Telechargement│
           │ FK id_enfant            │                    │──────────────│ │─────────│ │─────────│ │─────────│ │─────────│ │──────────────│
           │ FK id_appareil          │◄───────┐           │PK id_param   │ │PK id_abo│ │PK id_aut│ │PK id    │ │PK id_his│ │PK id_pref    │
           │    token_session        │   1    │           │FK id_enfant  │ │FK id_enf│ │FK id_enf│ │FK id_enf│ │FK id_enf│ │FK id_enfant  │
           │    est_active           │        │           │temps_max_jour│ │FK id_typ│ │FK id_dom│ │FK id_bad│ │FK id_con│ │download_auto │
           │    date_debut           │        │           │heure_debut   │ │date_deb │ │autorise │ │date_obt │ │progress │ │wifi_only     │
           └─────────────────────────┘        │           │heure_fin     │ │date_fin │ └────┬────┘ └────┬────┘ │score    │ └──────────────┘
                      │                       │           │mode_kiosque  │ │statut   │      │          │       │duree    │
    AMENDEMENT #3:    │                       │           │code_pin_sort │ │renouv=F │      │          │       └────┬────┘
    1 seule session   │                       │           └──────────────┘ └────┬────┘      │          │            │
    active/appareil   │                       │                                 │           │          │            │
                      │                       │                AMENDEMENT #3    │ N         │          │            │
                      │                       │                                 ▼           │          │            │
                      │                       │           ┌─────────────────────────┐       │          │            │
                      │                       │           │       Paiement          │       │          │            │
                      │                       │           │─────────────────────────│       │          │            │
                      │                       │           │ PK id_paiement          │       │          │            │
                      │                       │           │ FK id_abonnement        │       │          │            │
                      │                       │           │    montant              │       │          │            │
                      │                       │           │    moyen (OM/Moov/Wave) │       │          │            │
                      │                       │           │    statut               │       │          │            │
                      │                       │           │    reference_transaction│       │          │            │
                      │                       │           └─────────────────────────┘       │          │            │
                      │                       │                                             │          │            │
                      │                       │                                             │          │            │
                      │              ┌────────┴────────────────────────────────────────┐    │          │            │
                      │              │                                                 │    │          │            │
                      │              ▼                                                 │    ▼          ▼            │
                      │   ┌─────────────────────┐                               ┌──────┴────────┐ ┌────────────┐    │
                      │   │Session_Utilisation  │                               │Domaine_Educatif│ │   Badge    │    │
                      │   │─────────────────────│                               │───────────────│ │────────────│    │
                      │   │ PK id_session_util  │                               │PK id_domaine  │ │PK id_badge │    │
                      │   │ FK id_enfant        │                               │   code        │ │   code     │    │
                      │   │ FK id_appareil      │                               │   libelle     │ │   libelle  │    │
                      │   │    duree_minutes    │                               │   icone       │ │   points   │    │
                      │   │    interrompu       │                               │   age_min/max │ │   condition│    │
                      │   └─────────────────────┘                               └───────┬───────┘ └────────────┘    │
                      │                                                                 │                           │
                      │                                                                 │ N                         │
                      │                                                                 ▼                           │
                      │                                                      ┌─────────────────┐                    │
                      │                                                      │     Niveau      │                    │
                      │                                                      │─────────────────│                    │
                      │                                                      │ PK id_niveau    │                    │
                      │                                                      │ FK id_domaine   │                    │
                      │                                                      │    numero       │                    │
                      │                                                      │    libelle      │                    │
                      │                                                      │    points_requis│                    │
                      │                                                      └────────┬────────┘                    │
                      │                                                               │                             │
                      │                                                               │ N                           │
                      │                                                               ▼                             │
                      │   ┌─────────────────────┐                           ┌─────────────────────┐                 │
                      │   │Contenu_Telecharge   │◄──────────────────────────│      Contenu        │◄────────────────┘
                      │   │─────────────────────│           N               │─────────────────────│
                      │   │ PK id_telechargement│                           │ PK id_contenu       │
                      │   │ FK id_contenu       │                           │ FK id_niveau        │
                      │   │ FK id_appareil      │                           │    titre            │
                      │   │ FK id_enfant        │                           │    type_contenu     │
                      │   │    statut           │                           │    url_fichier      │
                      │   │    telecharg_auto   │                           │    telecharg_auto   │
                      │   └─────────────────────┘                           │    points_recompense│
                      │       AMENDEMENT #4                                 │    statut           │
                      │                                                     └──────────┬──────────┘
                      │                                                                │
                      │                                        ┌───────────────────────┼───────────────────────┐
                      │                                        │                       │                       │
                      │                                        │ 0..1                  │ N                     │ N
                      │                                        ▼                       ▼                       ▼
                      │                              ┌─────────────────┐    ┌─────────────────────┐  ┌─────────────────────┐
                      │                              │      Quiz       │    │Validation_Contenu   │  │      (Historique)   │
                      │                              │─────────────────│    │─────────────────────│  │                     │
                      │                              │ PK id_quiz      │    │ PK id_validation    │  │                     │
                      │                              │ FK id_contenu   │    │ FK id_contenu       │  │                     │
                      │                              │    score_min    │    │ FK id_validateur    │  │                     │
                      │                              │    temps_limite │    │    statut           │  │                     │
                      │                              └────────┬────────┘    │    commentaire      │  │                     │
                      │                                       │             └─────────────────────┘  └─────────────────────┘
                      │                                       │ N
                      │                                       ▼
                      │                              ┌─────────────────┐
                      │                              │    Question     │
                      │                              │─────────────────│
                      │                              │ PK id_question  │
                      │                              │ FK id_quiz      │
                      │                              │    enonce       │
                      │                              │    type_question│
                      │                              │    points       │
                      │                              └────────┬────────┘
                      │                                       │ N
                      │                                       ▼
                      │                              ┌─────────────────┐
                      │                              │    Reponse      │
                      │                              │─────────────────│
                      │                              │ PK id_reponse   │
                      │                              │ FK id_question  │
                      │                              │    texte        │
                      │                              │    est_correcte │
                      │                              └─────────────────┘
                      │
                      │
                      │         AMENDEMENT #5: WHITELIST APK KIOSQUE
                      │
                      │         ┌─────────────────────────┐
                      │         │  Application_Autorisee  │
                      │         │─────────────────────────│
                      │         │ PK id_application       │
                      │         │    nom_package          │
                      │         │    nom_affichage        │
                      │         │    signature_sha256     │
                      │         │    verification_oblig   │
                      │         └───────────┬─────────────┘
                      │                     │ 1
                      │                     │
                      │                     │ N
                      │         ┌───────────┴─────────────┐
                      │         │App_Enfant_Autorisee     │
                      │         │─────────────────────────│
                      └────────►│ FK id_enfant            │
                                │ FK id_application       │
                                │ FK autorise_par         │
                                │    temps_max_journalier │
                                └─────────────────────────┘
```

---

## Liste des Entites (27)

### Entites Principales

| # | Entite | Description | Amendement |
|---|--------|-------------|------------|
| E01 | `Utilisateur` | Compte parent/admin | - |
| E02 | `Role` | Roles et permissions | - |
| E03 | `Profil_Enfant` | Profil enfant (4-12 ans) | - |
| E04 | `Type_Abonnement` | Catalogue des formules | - |
| E05 | `Abonnement` | Abonnement PAR ENFANT | #2, #3 |
| E06 | `Paiement` | Transaction Mobile Money | - |
| E07 | `Appareil` | Tablette/telephone | - |
| E08 | `Session_Active` | Session unique/appareil | #3 |
| E09 | `Parametre_Parental` | Controle parental + kiosque | #1 |

### Entites Contenu

| # | Entite | Description | Amendement |
|---|--------|-------------|------------|
| E10 | `Domaine_Educatif` | Domaines (Histoire, Sciences...) | - |
| E11 | `Domaine_Autorise` | Autorisation par enfant | - |
| E12 | `Niveau` | Niveaux progressifs | - |
| E13 | `Contenu` | Video, quiz, jeu, audio | #4 |
| E14 | `Quiz` | Configuration quiz | - |
| E15 | `Question` | Questions du quiz | - |
| E16 | `Reponse` | Reponses possibles | - |
| E17 | `Validation_Contenu` | Validation pedagogique | - |

### Entites Gamification

| # | Entite | Description | Amendement |
|---|--------|-------------|------------|
| E18 | `Badge` | Badges/recompenses | TDR |
| E19 | `Badge_Enfant` | Badges obtenus | TDR |
| E20 | `Historique_Apprentissage` | Suivi progression | - |
| E21 | `Session_Utilisation` | Temps d'ecran | - |

### Entites Telechargement (Amendement #4)

| # | Entite | Description | Amendement |
|---|--------|-------------|------------|
| E22 | `Contenu_Telecharge` | Contenus offline | #4 |
| E23 | `Preference_Telechargement` | Config telechargement | #4 |

### Entites Kiosque (Amendement #5)

| # | Entite | Description | Amendement |
|---|--------|-------------|------------|
| E24 | `Application_Autorisee` | Whitelist APK | #5 |
| E25 | `Application_Enfant_Autorisee` | Apps par enfant | #5 |

### Entites Systeme

| # | Entite | Description | Amendement |
|---|--------|-------------|------------|
| E26 | `Notification` | Alertes et messages | - |
| E27 | `Journal_Action` | Audit securite | TDR |

---

## Regles Metier Cles

| Code | Regle | Priorite |
|------|-------|----------|
| BR01 | Un enfant doit avoir son propre abonnement actif | HAUTE |
| BR02 | Un appareil = une seule session active | HAUTE |
| BR03 | Renouvellement auto desactive par defaut | MOYENNE |
| BR04 | Telechargement auto en WiFi uniquement | MOYENNE |
| BR05 | Seules apps whitelist autorisees en kiosque | HAUTE |
| BR06 | Verification abonnement offline toutes les 24-48h | HAUTE |
| BR07 | Age enfant entre 4 et 12 ans | MOYENNE |
| BR08 | Parametres parentaux obligatoires par enfant | HAUTE |

---

## Fichiers Generes

| Fichier | Description |
|---------|-------------|
| `ConceptualDataModel_V2_Amende.cdm.xml` | MCD en format XML structure |
| `MCD_V2_Amende_Documentation.md` | Cette documentation |

---

## Prochaines Etapes

1. [ ] Generer le script SQL de creation des tables
2. [ ] Creer le MLD (Modele Logique de Donnees)
3. [ ] Generer le MPD (Modele Physique de Donnees)
4. [ ] Importer dans PowerDesigner si necessaire

