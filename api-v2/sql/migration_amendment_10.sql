-- ============================================
-- AMENDEMENT #10 : Domaines modulaires par pack d'abonnement
-- ============================================
-- Date: 2026-04-29
-- Description:
--   Permet aux administrateurs de configurer quels domaines educatifs
--   sont inclus dans chaque pack d'abonnement.
--   Les domaines sont fiquees a la souscription (snapshot)
--   pour que les abonnements actifs ne soient pas affectes par les
--   modifications ulterieures du pack.

-- Table pack_domaines : domaines actuellement inclus dans un pack (template)
CREATE TABLE IF NOT EXISTS `pack_domaines` (
  `type_abonnement_id` INT UNSIGNED NOT NULL,
  `domaine_id` INT UNSIGNED NOT NULL,
  `date_ajout` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`type_abonnement_id`, `domaine_id`),
  FOREIGN KEY (`type_abonnement_id`) REFERENCES `types_abonnements`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domaine_id`) REFERENCES `domaines_educatifs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_pack_domaines_type` ON `pack_domaines`(`type_abonnement_id`);
CREATE INDEX `idx_pack_domaines_domaine` ON `pack_domaines`(`domaine_id`);

-- Table abonnement_domaines : snapshot des domaines accordes a un abonnement precis
CREATE TABLE IF NOT EXISTS `abonnement_domaines` (
  `abonnement_id` INT UNSIGNED NOT NULL,
  `domaine_id` INT UNSIGNED NOT NULL,
  `date_snapshot` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`abonnement_id`, `domaine_id`),
  FOREIGN KEY (`abonnement_id`) REFERENCES `abonnements`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domaine_id`) REFERENCES `domaines_educatifs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_abo_domaines_abo` ON `abonnement_domaines`(`abonnement_id`);
CREATE INDEX `idx_abo_domaines_domaine` ON `abonnement_domaines`(`domaine_id`);

-- Note: pas de migration des donnees ici. Pour les abonnements actifs existants,
-- la logique applicative considerera l'absence de configuration comme
-- "tous les domaines disponibles" (option a - transition douce).
-- Apres deploiement, l'admin doit configurer manuellement chaque pack.
