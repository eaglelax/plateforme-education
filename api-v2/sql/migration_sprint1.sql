-- ============================================
-- SPRINT 1 - MIGRATION GESTION DE CONTENU
-- Plateforme Educative Burkina Faso
-- Date: 2026-02-01
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 1. MODIFICATION TABLE CONTENUS
-- ============================================

-- Modifier l'enum statut pour ajouter les nouveaux etats
ALTER TABLE `contenus`
MODIFY COLUMN `statut` ENUM('brouillon', 'en_attente', 'a_amender', 'valide', 'publie', 'archive') DEFAULT 'brouillon';

-- Ajouter les colonnes pour le workflow de validation
ALTER TABLE `contenus`
ADD COLUMN IF NOT EXISTS `date_soumission` TIMESTAMP NULL AFTER `date_publication`,
ADD COLUMN IF NOT EXISTS `validateur_id` INT UNSIGNED NULL AFTER `createur_id`,
ADD COLUMN IF NOT EXISTS `commentaire_validation` TEXT NULL AFTER `validateur_id`,
ADD COLUMN IF NOT EXISTS `date_validation` TIMESTAMP NULL AFTER `commentaire_validation`;

-- Ajouter les colonnes pour les fichiers uploades
ALTER TABLE `contenus`
ADD COLUMN IF NOT EXISTS `fichier_media_id` INT UNSIGNED NULL AFTER `url_miniature`,
ADD COLUMN IF NOT EXISTS `fichier_miniature_id` INT UNSIGNED NULL AFTER `fichier_media_id`;

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS `idx_contenus_validateur` ON `contenus`(`validateur_id`);
CREATE INDEX IF NOT EXISTS `idx_contenus_date_soumission` ON `contenus`(`date_soumission`);
CREATE INDEX IF NOT EXISTS `idx_contenus_createur` ON `contenus`(`createur_id`);

-- ============================================
-- 2. TABLE FICHIERS UPLOADES
-- ============================================

DROP TABLE IF EXISTS `fichiers_uploades`;
CREATE TABLE `fichiers_uploades` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE COMMENT 'Identifiant unique du fichier',
  `nom_original` VARCHAR(255) NOT NULL COMMENT 'Nom original du fichier',
  `nom_stockage` VARCHAR(255) NOT NULL COMMENT 'Nom sur le disque',
  `chemin_relatif` VARCHAR(500) NOT NULL COMMENT 'Chemin relatif depuis uploads/',
  `type_mime` VARCHAR(100) NOT NULL,
  `taille_octets` BIGINT NOT NULL,
  `type_fichier` ENUM('video', 'audio', 'document', 'image', 'autre') NOT NULL,
  `duree_secondes` INT DEFAULT NULL COMMENT 'Pour video/audio',
  `dimensions_largeur` INT DEFAULT NULL COMMENT 'Pour images/videos',
  `dimensions_hauteur` INT DEFAULT NULL COMMENT 'Pour images/videos',
  `hash_md5` VARCHAR(32) DEFAULT NULL COMMENT 'Pour detecter les doublons',
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
CREATE INDEX `idx_fichiers_utilisateur` ON `fichiers_uploades`(`utilisateur_id`);

-- Ajouter les FK pour contenus -> fichiers
ALTER TABLE `contenus`
ADD CONSTRAINT `fk_contenus_fichier_media` FOREIGN KEY (`fichier_media_id`)
    REFERENCES `fichiers_uploades`(`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_contenus_fichier_miniature` FOREIGN KEY (`fichier_miniature_id`)
    REFERENCES `fichiers_uploades`(`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_contenus_validateur` FOREIGN KEY (`validateur_id`)
    REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL;

-- ============================================
-- 3. TABLE HISTORIQUE DES VALIDATIONS
-- ============================================

DROP TABLE IF EXISTS `historique_validations`;
CREATE TABLE `historique_validations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` ENUM('creation', 'soumission', 'validation', 'amendement', 'resoumission', 'publication') NOT NULL,
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
CREATE INDEX `idx_historique_val_utilisateur` ON `historique_validations`(`utilisateur_id`);

-- ============================================
-- 4. AJOUT DES ROLES
-- ============================================

-- Ajouter le role gestionnaire_contenu
INSERT INTO `roles` (`nom`, `description`, `permissions`) VALUES
('gestionnaire_contenu', 'Gestionnaire de contenu educatif', JSON_OBJECT(
  'contenus', JSON_ARRAY('create', 'read', 'update', 'submit', 'publish'),
  'quiz', JSON_ARRAY('create', 'read', 'update', 'delete'),
  'uploads', JSON_ARRAY('create', 'read', 'delete'),
  'domaines', JSON_ARRAY('read')
))
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`),
  `permissions` = VALUES(`permissions`);

-- Ajouter le role validateur
INSERT INTO `roles` (`nom`, `description`, `permissions`) VALUES
('validateur', 'Validateur de contenu pedagogique', JSON_OBJECT(
  'contenus', JSON_ARRAY('read', 'validate', 'reject'),
  'quiz', JSON_ARRAY('read'),
  'uploads', JSON_ARRAY('read'),
  'domaines', JSON_ARRAY('read')
))
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`),
  `permissions` = VALUES(`permissions`);

-- ============================================
-- 5. MODIFICATION TABLE QUIZ
-- ============================================

-- Ajouter des colonnes manquantes a la table quiz si necessaire
ALTER TABLE `quiz`
ADD COLUMN IF NOT EXISTS `description` TEXT AFTER `titre`;

-- ============================================
-- 6. AJOUT IMAGES AUX QUESTIONS
-- ============================================

-- Permettre d'ajouter une image a une question
ALTER TABLE `questions`
ADD COLUMN IF NOT EXISTS `fichier_image_id` INT UNSIGNED NULL AFTER `image_url`,
ADD CONSTRAINT `fk_questions_fichier_image` FOREIGN KEY (`fichier_image_id`)
    REFERENCES `fichiers_uploades`(`id`) ON DELETE SET NULL;

-- ============================================
-- 7. DONNEES DE TEST (Optionnel)
-- ============================================

-- Creer un utilisateur gestionnaire de contenu pour les tests
INSERT INTO `utilisateurs` (`nom`, `prenom`, `telephone`, `email`, `mot_de_passe`, `statut_compte`, `role_id`)
SELECT 'Gestionnaire', 'Test', '+22670000001', 'gestionnaire@test.com',
       '$2a$10$xVWsqzMOKfXgPJLhWBnRcuXMbKqK9rJ5q8fXdGvHWJZvJZy5ZvWXa', 'actif',
       (SELECT id FROM roles WHERE nom = 'gestionnaire_contenu')
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'gestionnaire@test.com');

-- Creer un utilisateur validateur pour les tests
INSERT INTO `utilisateurs` (`nom`, `prenom`, `telephone`, `email`, `mot_de_passe`, `statut_compte`, `role_id`)
SELECT 'Validateur', 'Test', '+22670000002', 'validateur@test.com',
       '$2a$10$xVWsqzMOKfXgPJLhWBnRcuXMbKqK9rJ5q8fXdGvHWJZvJZy5ZvWXa', 'actif',
       (SELECT id FROM roles WHERE nom = 'validateur')
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'validateur@test.com');

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- Note: Le mot de passe pour les utilisateurs de test est 'password123'
