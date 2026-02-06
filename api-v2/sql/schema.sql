-- ============================================
-- PLATEFORME ÉDUCATIVE BURKINA FASO
-- Script de création de la base de données
-- Version 2.0 - Tous amendements intégrés
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 1. TABLES SYSTÈME
-- ============================================

-- Table des rôles
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs (parents et admins)
DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE `utilisateurs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `telephone` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(255) UNIQUE,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `statut_compte` ENUM('actif', 'inactif', 'suspendu', 'en_attente') DEFAULT 'actif',
  `derniere_connexion` TIMESTAMP NULL,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_maj` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_utilisateurs_telephone` ON `utilisateurs`(`telephone`);
CREATE INDEX `idx_utilisateurs_email` ON `utilisateurs`(`email`);
CREATE INDEX `idx_utilisateurs_statut` ON `utilisateurs`(`statut_compte`);

-- ============================================
-- 2. TABLES PROFILS ENFANTS (Amendement #9)
-- ============================================

-- Table des profils enfants
DROP TABLE IF EXISTS `profils_enfants`;
CREATE TABLE `profils_enfants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom_pseudo` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `age` INT NOT NULL,
  `tranche_age_min` INT DEFAULT 4,
  `tranche_age_max` INT DEFAULT 12,
  `statut` ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_maj` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Amendement #9: Identifiants de connexion enfant
  `code_connexion` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Format ENF-XXXXXX, immutable',
  `mot_de_passe_enfant` VARCHAR(255) NOT NULL COMMENT 'Mot de passe généré, modifiable par parent',
  `pin_simplifie` VARCHAR(10) DEFAULT NULL COMMENT 'PIN 4 chiffres pour 4-6 ans',
  `mode_connexion` ENUM('mot_de_passe', 'pin') DEFAULT 'mot_de_passe',
  `tentatives_echouees` INT DEFAULT 0,
  `date_blocage` TIMESTAMP NULL COMMENT 'Blocage après 5 échecs pendant 15 min',
  -- Gamification
  `points_xp` INT DEFAULT 0,
  `niveau_global` INT DEFAULT 1,
  -- Référence parent
  `parent_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`parent_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_enfants_parent` ON `profils_enfants`(`parent_id`);
CREATE INDEX `idx_enfants_code` ON `profils_enfants`(`code_connexion`);
CREATE INDEX `idx_enfants_statut` ON `profils_enfants`(`statut`);

-- ============================================
-- 3. TABLES APPAREILS ET SESSIONS (Amendement #3)
-- ============================================

-- Table des appareils
DROP TABLE IF EXISTS `appareils`;
CREATE TABLE `appareils` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `type` ENUM('tablette', 'telephone', 'autre') DEFAULT 'tablette',
  `imei` VARCHAR(50) UNIQUE COMMENT 'Identifiant unique appareil',
  `modele` VARCHAR(100),
  `systeme_os` VARCHAR(50),
  `version_os` VARCHAR(20),
  `statut` ENUM('actif', 'inactif', 'bloque') DEFAULT 'actif',
  `derniere_connexion` TIMESTAMP NULL,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `parent_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`parent_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_appareils_imei` ON `appareils`(`imei`);
CREATE INDEX `idx_appareils_parent` ON `appareils`(`parent_id`);

-- Table des sessions actives (1 session par appareil - Amendement #3)
DROP TABLE IF EXISTS `sessions_actives`;
CREATE TABLE `sessions_actives` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `token_session` VARCHAR(255) NOT NULL UNIQUE,
  `date_debut` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_fin` TIMESTAMP NULL,
  `est_active` BOOLEAN DEFAULT TRUE,
  `adresse_ip` VARCHAR(45),
  `user_agent` TEXT,
  `enfant_id` INT UNSIGNED NOT NULL,
  `appareil_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appareil_id`) REFERENCES `appareils`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_session_appareil` (`appareil_id`, `est_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_sessions_enfant` ON `sessions_actives`(`enfant_id`);
CREATE INDEX `idx_sessions_appareil` ON `sessions_actives`(`appareil_id`);

-- ============================================
-- 4. TABLES ABONNEMENTS (Amendement #3: par enfant)
-- ============================================

-- Table des types d'abonnements
DROP TABLE IF EXISTS `types_abonnements`;
CREATE TABLE `types_abonnements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `prix` DECIMAL(10,2) NOT NULL,
  `devise` VARCHAR(10) DEFAULT 'XOF',
  `duree` ENUM('MENSUEL', 'TRIMESTRIEL', 'ANNUEL') NOT NULL,
  `duree_jours` INT NOT NULL,
  `nombre_appareils_max` INT DEFAULT 1,
  `telechargement_autorise` BOOLEAN DEFAULT TRUE,
  `contenu_premium` BOOLEAN DEFAULT FALSE,
  `est_actif` BOOLEAN DEFAULT TRUE,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des abonnements (par enfant - Amendement #3)
DROP TABLE IF EXISTS `abonnements`;
CREATE TABLE `abonnements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `date_debut` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_fin` TIMESTAMP NOT NULL,
  `statut` ENUM('actif', 'expire', 'annule', 'suspendu', 'periode_grace') DEFAULT 'actif',
  `periode_grace` INT DEFAULT 3 COMMENT 'Jours de grâce après expiration',
  `renouvellement_auto` BOOLEAN DEFAULT FALSE COMMENT 'Amendement #2: FALSE par défaut',
  `date_annulation` TIMESTAMP NULL,
  `motif_annulation` TEXT,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_maj` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `enfant_id` INT UNSIGNED NOT NULL COMMENT 'Amendement #3: abonnement par enfant',
  `type_abonnement_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`type_abonnement_id`) REFERENCES `types_abonnements`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_abonnements_enfant` ON `abonnements`(`enfant_id`);
CREATE INDEX `idx_abonnements_statut` ON `abonnements`(`statut`);
CREATE INDEX `idx_abonnements_date_fin` ON `abonnements`(`date_fin`);

-- ============================================
-- 5. TABLES PAIEMENTS
-- ============================================

-- Table des paiements
DROP TABLE IF EXISTS `paiements`;
CREATE TABLE `paiements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `montant` DECIMAL(10,2) NOT NULL,
  `devise` VARCHAR(10) DEFAULT 'XOF',
  `methode` ENUM('orange_money', 'moov_money', 'wave', 'carte', 'autre') NOT NULL,
  `statut` ENUM('en_attente', 'complete', 'echoue', 'rembourse', 'annule') DEFAULT 'en_attente',
  `reference_externe` VARCHAR(255) COMMENT 'Référence opérateur',
  `numero_telephone` VARCHAR(20),
  `details_transaction` JSON,
  `date_paiement` TIMESTAMP NULL,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `abonnement_id` INT UNSIGNED NOT NULL,
  `utilisateur_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`abonnement_id`) REFERENCES `abonnements`(`id`),
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_paiements_statut` ON `paiements`(`statut`);
CREATE INDEX `idx_paiements_utilisateur` ON `paiements`(`utilisateur_id`);
CREATE INDEX `idx_paiements_reference` ON `paiements`(`reference_externe`);

-- ============================================
-- 6. TABLES CONTENUS ÉDUCATIFS
-- ============================================

-- Table des domaines éducatifs
DROP TABLE IF EXISTS `domaines_educatifs`;
CREATE TABLE `domaines_educatifs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `icone` VARCHAR(255),
  `couleur` VARCHAR(20),
  `ordre_affichage` INT DEFAULT 0,
  `est_actif` BOOLEAN DEFAULT TRUE,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des niveaux
DROP TABLE IF EXISTS `niveaux`;
CREATE TABLE `niveaux` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(50) NOT NULL,
  `numero` INT NOT NULL,
  `description` TEXT,
  `points_requis` INT DEFAULT 0,
  `domaine_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`domaine_id`) REFERENCES `domaines_educatifs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_niveaux_domaine` ON `niveaux`(`domaine_id`);

-- Table des contenus
DROP TABLE IF EXISTS `contenus`;
CREATE TABLE `contenus` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` ENUM('video', 'audio', 'quiz', 'jeu', 'document', 'activite') NOT NULL,
  `url_media` VARCHAR(500),
  `url_miniature` VARCHAR(500),
  `duree_minutes` INT DEFAULT 0,
  `taille_mo` DECIMAL(10,2) DEFAULT 0,
  `tranche_age_min` INT DEFAULT 4,
  `tranche_age_max` INT DEFAULT 12,
  `points_xp` INT DEFAULT 10,
  `est_premium` BOOLEAN DEFAULT FALSE,
  `est_telechargeable` BOOLEAN DEFAULT TRUE,
  `statut` ENUM('brouillon', 'publie', 'archive') DEFAULT 'brouillon',
  `nombre_vues` INT DEFAULT 0,
  `note_moyenne` DECIMAL(3,2) DEFAULT 0,
  `date_publication` TIMESTAMP NULL,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_maj` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `domaine_id` INT UNSIGNED NOT NULL,
  `niveau_id` INT UNSIGNED,
  `createur_id` INT UNSIGNED,
  FOREIGN KEY (`domaine_id`) REFERENCES `domaines_educatifs`(`id`),
  FOREIGN KEY (`niveau_id`) REFERENCES `niveaux`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`createur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_contenus_domaine` ON `contenus`(`domaine_id`);
CREATE INDEX `idx_contenus_type` ON `contenus`(`type`);
CREATE INDEX `idx_contenus_statut` ON `contenus`(`statut`);
CREATE INDEX `idx_contenus_age` ON `contenus`(`tranche_age_min`, `tranche_age_max`);

-- ============================================
-- 7. TABLES QUIZ ET QUESTIONS
-- ============================================

-- Table des quiz
DROP TABLE IF EXISTS `quiz`;
CREATE TABLE `quiz` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `temps_limite_minutes` INT DEFAULT 0 COMMENT '0 = pas de limite',
  `nombre_questions` INT DEFAULT 0,
  `score_minimum` INT DEFAULT 60 COMMENT 'Pourcentage minimum pour réussir',
  `melanger_questions` BOOLEAN DEFAULT TRUE,
  `afficher_correction` BOOLEAN DEFAULT TRUE,
  `contenu_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`contenu_id`) REFERENCES `contenus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des questions
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `texte` TEXT NOT NULL,
  `type` ENUM('choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre') DEFAULT 'choix_unique',
  `image_url` VARCHAR(500),
  `explication` TEXT COMMENT 'Explication de la bonne réponse',
  `points` INT DEFAULT 1,
  `ordre` INT DEFAULT 0,
  `quiz_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`quiz_id`) REFERENCES `quiz`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_questions_quiz` ON `questions`(`quiz_id`);

-- Table des réponses
DROP TABLE IF EXISTS `reponses`;
CREATE TABLE `reponses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `texte` TEXT NOT NULL,
  `est_correcte` BOOLEAN DEFAULT FALSE,
  `ordre` INT DEFAULT 0,
  `question_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_reponses_question` ON `reponses`(`question_id`);

-- ============================================
-- 8. TABLES CONTRÔLE PARENTAL (Amendement #1)
-- ============================================

-- Table des paramètres parentaux
DROP TABLE IF EXISTS `parametres_parentaux`;
CREATE TABLE `parametres_parentaux` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `temps_max_quotidien` INT DEFAULT 120 COMMENT 'Minutes par jour',
  `heure_debut_autorise` TIME DEFAULT '08:00:00',
  `heure_fin_autorise` TIME DEFAULT '20:00:00',
  `jours_autorises` JSON DEFAULT '["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"]',
  -- Mode Kiosque (Amendement #1)
  `mode_kiosque_actif` BOOLEAN DEFAULT FALSE,
  `pin_parental` VARCHAR(10) COMMENT 'PIN pour sortir du mode kiosque',
  `bloquer_navigateur` BOOLEAN DEFAULT TRUE,
  `bloquer_telechargements` BOOLEAN DEFAULT TRUE,
  `bloquer_parametres` BOOLEAN DEFAULT TRUE,
  -- Filtrage contenu
  `filtrage_contenu_actif` BOOLEAN DEFAULT TRUE,
  `niveau_filtrage` ENUM('strict', 'modere', 'souple') DEFAULT 'modere',
  -- Notifications parent
  `notifications_activite` BOOLEAN DEFAULT TRUE,
  `notifications_temps_ecoule` BOOLEAN DEFAULT TRUE,
  -- Timestamps
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_maj` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `enfant_id` INT UNSIGNED NOT NULL UNIQUE,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des domaines autorisés par enfant
DROP TABLE IF EXISTS `profils_domaines_autorises`;
CREATE TABLE `profils_domaines_autorises` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `est_autorise` BOOLEAN DEFAULT TRUE,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `enfant_id` INT UNSIGNED NOT NULL,
  `domaine_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domaine_id`) REFERENCES `domaines_educatifs`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_enfant_domaine` (`enfant_id`, `domaine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TABLES MODE KIOSQUE (Amendement #5)
-- ============================================

-- Table des applications autorisées (Whitelist APK)
DROP TABLE IF EXISTS `applications_autorisees`;
CREATE TABLE `applications_autorisees` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `package_name` VARCHAR(255) NOT NULL UNIQUE COMMENT 'com.example.app',
  `description` TEXT,
  `icone_url` VARCHAR(500),
  `categorie` ENUM('education', 'jeu_educatif', 'utilitaire', 'autre') DEFAULT 'education',
  `est_valide` BOOLEAN DEFAULT TRUE,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison enfant-applications autorisées
DROP TABLE IF EXISTS `profils_apk_autorisees`;
CREATE TABLE `profils_apk_autorisees` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `est_autorise` BOOLEAN DEFAULT TRUE,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `enfant_id` INT UNSIGNED NOT NULL,
  `application_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`application_id`) REFERENCES `applications_autorisees`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_enfant_app` (`enfant_id`, `application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. TABLES TÉLÉCHARGEMENT (Amendement #4)
-- ============================================

-- Table des contenus téléchargés
DROP TABLE IF EXISTS `contenus_telecharges`;
CREATE TABLE `contenus_telecharges` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `chemin_local` VARCHAR(500),
  `taille_mo` DECIMAL(10,2),
  `statut` ENUM('en_cours', 'complete', 'echoue', 'supprime') DEFAULT 'en_cours',
  `progression` INT DEFAULT 0 COMMENT 'Pourcentage 0-100',
  `date_telechargement` TIMESTAMP NULL,
  `date_expiration` TIMESTAMP NULL COMMENT 'Contenu expire après X jours offline',
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `contenu_id` INT UNSIGNED NOT NULL,
  `appareil_id` INT UNSIGNED NOT NULL,
  `enfant_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`contenu_id`) REFERENCES `contenus`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appareil_id`) REFERENCES `appareils`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_contenu_appareil` (`contenu_id`, `appareil_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_telecharges_enfant` ON `contenus_telecharges`(`enfant_id`);
CREATE INDEX `idx_telecharges_statut` ON `contenus_telecharges`(`statut`);

-- Table des préférences de téléchargement
DROP TABLE IF EXISTS `preferences_telechargement`;
CREATE TABLE `preferences_telechargement` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `telechargement_auto` BOOLEAN DEFAULT FALSE COMMENT 'Amendement #4',
  `wifi_uniquement` BOOLEAN DEFAULT TRUE,
  `qualite_video` ENUM('basse', 'moyenne', 'haute') DEFAULT 'moyenne',
  `limite_stockage_mo` INT DEFAULT 2048 COMMENT '2 Go par défaut',
  `telecharger_nouveaux` BOOLEAN DEFAULT TRUE,
  `supprimer_visionnes` BOOLEAN DEFAULT FALSE,
  `date_maj` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `enfant_id` INT UNSIGNED NOT NULL UNIQUE,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. TABLES HISTORIQUE ET PROGRESSION
-- ============================================

-- Table de l'historique d'apprentissage
DROP TABLE IF EXISTS `historique_apprentissage`;
CREATE TABLE `historique_apprentissage` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `date_acces` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `temps_passe_secondes` INT DEFAULT 0,
  `progression` INT DEFAULT 0 COMMENT 'Pourcentage 0-100',
  `score` INT DEFAULT NULL COMMENT 'Score quiz',
  `est_complete` BOOLEAN DEFAULT FALSE,
  `points_gagnes` INT DEFAULT 0,
  `enfant_id` INT UNSIGNED NOT NULL,
  `contenu_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contenu_id`) REFERENCES `contenus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_historique_enfant` ON `historique_apprentissage`(`enfant_id`);
CREATE INDEX `idx_historique_contenu` ON `historique_apprentissage`(`contenu_id`);
CREATE INDEX `idx_historique_date` ON `historique_apprentissage`(`date_acces`);

-- Table des sessions d'utilisation (temps d'écran)
DROP TABLE IF EXISTS `sessions_utilisation`;
CREATE TABLE `sessions_utilisation` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `date_debut` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_fin` TIMESTAMP NULL,
  `duree_minutes` INT DEFAULT 0,
  `type_activite` ENUM('video', 'quiz', 'jeu', 'navigation', 'autre') DEFAULT 'autre',
  `enfant_id` INT UNSIGNED NOT NULL,
  `appareil_id` INT UNSIGNED,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appareil_id`) REFERENCES `appareils`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_sessions_util_enfant` ON `sessions_utilisation`(`enfant_id`);
CREATE INDEX `idx_sessions_util_date` ON `sessions_utilisation`(`date_debut`);

-- ============================================
-- 12. TABLES GAMIFICATION
-- ============================================

-- Table des badges
DROP TABLE IF EXISTS `badges`;
CREATE TABLE `badges` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `icone_url` VARCHAR(500),
  `condition_obtention` TEXT COMMENT 'Description de la condition',
  `type` ENUM('progression', 'temps', 'quiz', 'special') DEFAULT 'progression',
  `points_bonus` INT DEFAULT 0,
  `est_actif` BOOLEAN DEFAULT TRUE,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des badges obtenus par les enfants
DROP TABLE IF EXISTS `badges_enfants`;
CREATE TABLE `badges_enfants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `date_obtention` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `enfant_id` INT UNSIGNED NOT NULL,
  `badge_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_enfant_badge` (`enfant_id`, `badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_badges_enfants_enfant` ON `badges_enfants`(`enfant_id`);

-- ============================================
-- 13. TABLES NOTIFICATIONS
-- ============================================

-- Table des notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'alerte', 'succes', 'avertissement', 'systeme') DEFAULT 'info',
  `est_lue` BOOLEAN DEFAULT FALSE,
  `date_lecture` TIMESTAMP NULL,
  `lien_action` VARCHAR(500) COMMENT 'Lien vers une action',
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_expiration` TIMESTAMP NULL,
  `utilisateur_id` INT UNSIGNED,
  `enfant_id` INT UNSIGNED,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_notifications_utilisateur` ON `notifications`(`utilisateur_id`);
CREATE INDEX `idx_notifications_enfant` ON `notifications`(`enfant_id`);
CREATE INDEX `idx_notifications_lue` ON `notifications`(`est_lue`);

-- ============================================
-- 14. TABLES AUDIT ET SÉCURITÉ
-- ============================================

-- Table du journal des actions
DROP TABLE IF EXISTS `journal_actions`;
CREATE TABLE `journal_actions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `adresse_ip` VARCHAR(45),
  `user_agent` TEXT,
  `donnees_avant` JSON,
  `donnees_apres` JSON,
  `date_action` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `utilisateur_id` INT UNSIGNED,
  `enfant_id` INT UNSIGNED,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`enfant_id`) REFERENCES `profils_enfants`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_journal_utilisateur` ON `journal_actions`(`utilisateur_id`);
CREATE INDEX `idx_journal_date` ON `journal_actions`(`date_action`);
CREATE INDEX `idx_journal_action` ON `journal_actions`(`action`);

-- Table de validation du contenu
DROP TABLE IF EXISTS `validations_contenu`;
CREATE TABLE `validations_contenu` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `statut` ENUM('en_attente', 'approuve', 'rejete') DEFAULT 'en_attente',
  `commentaire` TEXT,
  `date_validation` TIMESTAMP NULL,
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `contenu_id` INT UNSIGNED NOT NULL,
  `validateur_id` INT UNSIGNED,
  FOREIGN KEY (`contenu_id`) REFERENCES `contenus`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`validateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
