-- =====================================================
-- MIGRATION BASE DE DONNEES LWS - Plateforme Educative
-- A executer sur phpMyAdmin de LWS
-- =====================================================

-- 1. Ajouter les nouveaux roles
INSERT IGNORE INTO roles (nom, description, permissions) VALUES
('VALIDATEUR', 'Validateur de contenus éducatifs', '{"content": ["read", "validate", "reject"], "reports": ["read"]}'),
('GESTIONNAIRE_CONTENU', 'Gestionnaire de contenus éducatifs', '{"content": ["create", "read", "update", "delete"], "reports": ["read"]}');

-- 2. Modifier l'enum statut de la table contenus pour ajouter 'rejete'
ALTER TABLE contenus MODIFY COLUMN statut ENUM('brouillon', 'publie', 'archive', 'rejete') DEFAULT 'brouillon';

-- 3. Ajouter la colonne validateur_id si elle n'existe pas
ALTER TABLE contenus ADD COLUMN IF NOT EXISTS validateur_id INT UNSIGNED NULL AFTER createur_id;

-- 4. Ajouter la colonne commentaire_validation si elle n'existe pas
ALTER TABLE contenus ADD COLUMN IF NOT EXISTS commentaire_validation TEXT NULL AFTER validateur_id;

-- 5. Ajouter la cle etrangere pour validateur_id (ignorer si existe deja)
-- Note: Executer separement si erreur
-- ALTER TABLE contenus ADD CONSTRAINT fk_contenus_validateur FOREIGN KEY (validateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- 6. Creer les comptes de test (mot de passe: hash bcrypt)
-- VALIDATEUR: validateur@plateforme-educative.bf / Validateur2024!
-- GESTIONNAIRE: gestionnaire@plateforme-educative.bf / Gestionnaire2024!

-- Recuperer les IDs des roles
SET @validateur_role_id = (SELECT id FROM roles WHERE nom = 'VALIDATEUR');
SET @gestionnaire_role_id = (SELECT id FROM roles WHERE nom = 'GESTIONNAIRE_CONTENU');

-- Inserer le validateur (mot de passe: Validateur2024!)
INSERT IGNORE INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
VALUES ('Validateur', 'Test', '+22670000002', 'validateur@plateforme-educative.bf',
        '$2a$12$suqfQnDUY4aTl04eI3uM0.y9anfIV4tGs8B3crMICOLhSMIGZkk76', @validateur_role_id);

-- Inserer le gestionnaire (mot de passe: Gestionnaire2024!)
INSERT IGNORE INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
VALUES ('Gestionnaire', 'Contenu', '+22670000003', 'gestionnaire@plateforme-educative.bf',
        '$2a$12$bbvfFZIrQiMDjusOhSzUse3ecl5PweXf9mInn7l2xQZEtFukhxid.', @gestionnaire_role_id);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Roles:' as '';
SELECT id, nom FROM roles;

SELECT 'Utilisateurs admin:' as '';
SELECT u.id, u.nom, u.prenom, u.email, r.nom as role
FROM utilisateurs u
JOIN roles r ON u.role_id = r.id
WHERE r.nom IN ('ADMIN', 'VALIDATEUR', 'GESTIONNAIRE_CONTENU');

SELECT 'Structure contenus:' as '';
DESCRIBE contenus;
