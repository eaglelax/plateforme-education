-- Migration: Quiz scoring, badges, and level-up system
-- Date: 2026-03-16

-- ============================================
-- INSERT DEFAULT BADGES
-- ============================================

INSERT INTO badges (nom, description, icone_url, condition_obtention, type, points_bonus, est_actif) VALUES
('Premier Quiz', 'Tu as terminé ton premier quiz avec succès !', 'badge_premier_quiz', 'Réussir 1 quiz avec au moins 60%', 'quiz', 10, TRUE),
('Érudit', 'Tu as réussi 10 quiz, quel savoir !', 'badge_erudit', 'Réussir 10 quiz avec au moins 60%', 'quiz', 25, TRUE),
('Perfectionniste', 'Tu as obtenu un score parfait 3 fois !', 'badge_perfectionniste', 'Obtenir 100% à 3 quiz différents', 'quiz', 50, TRUE),
('Premier Pas', 'Tu as terminé ton premier contenu !', 'badge_premier_pas', 'Terminer 1 contenu', 'progression', 10, TRUE),
('Lecteur Assidu', 'Tu as terminé 5 contenus, continue comme ça !', 'badge_lecteur', 'Terminer 5 contenus', 'progression', 20, TRUE),
('Explorateur', 'Tu as exploré tous les domaines !', 'badge_explorateur', 'Terminer au moins 1 contenu dans chaque domaine', 'progression', 30, TRUE),
('Expert', 'Tu as atteint le niveau 5, impressionnant !', 'badge_expert', 'Atteindre le niveau 5', 'progression', 50, TRUE),
('Assidu', 'Tu as utilisé l''appli 7 jours de suite !', 'badge_assidu', 'Se connecter 7 jours consécutifs', 'temps', 30, TRUE);
