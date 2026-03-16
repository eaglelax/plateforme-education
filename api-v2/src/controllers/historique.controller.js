const { query } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Vérifie que l'enfant appartient au parent
 */
async function verifyOwnership(parentId, enfantId) {
  const [enfant] = await query(
    'SELECT id FROM profils_enfants WHERE id = ? AND parent_id = ?',
    [enfantId, parentId]
  );
  if (!enfant) {
    throw ApiError.forbidden('Cet enfant ne vous appartient pas');
  }
}

/**
 * Obtenir son propre historique (enfant)
 * GET /api/historique/mon-historique
 */
const getMonHistorique = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { domaineId, complete } = req.query;

  let whereClause = 'ha.enfant_id = ?';
  const params = [req.user.id];

  if (domaineId) {
    whereClause += ' AND c.domaine_id = ?';
    params.push(domaineId);
  }

  if (complete === 'true') {
    whereClause += ' AND ha.est_complete = TRUE';
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total
     FROM historique_apprentissage ha
     JOIN contenus c ON ha.contenu_id = c.id
     WHERE ${whereClause}`,
    params
  );

  const historique = await query(
    `SELECT ha.*, c.titre, c.type, c.url_miniature, c.points_xp as contenu_points,
            d.nom as domaine_nom, d.icone as domaine_icone
     FROM historique_apprentissage ha
     JOIN contenus c ON ha.contenu_id = c.id
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     WHERE ${whereClause}
     ORDER BY ha.date_acces DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: historique,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir ses badges (enfant)
 * GET /api/historique/mes-badges
 */
const getMesBadges = asyncHandler(async (req, res) => {
  const badgesObtenus = await query(
    `SELECT b.*, be.date_obtention
     FROM badges b
     JOIN badges_enfants be ON b.id = be.badge_id
     WHERE be.enfant_id = ?
     ORDER BY be.date_obtention DESC`,
    [req.user.id]
  );

  const badgesNonObtenus = await query(
    `SELECT b.*
     FROM badges b
     WHERE b.est_actif = TRUE
       AND b.id NOT IN (SELECT badge_id FROM badges_enfants WHERE enfant_id = ?)
     ORDER BY b.type, b.nom`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      obtenus: badgesObtenus,
      aObtenir: badgesNonObtenus,
      totalObtenus: badgesObtenus.length
    }
  });
});

/**
 * Obtenir l'historique d'un enfant (parent)
 * GET /api/historique/enfant/:enfantId
 */
const getHistoriqueEnfant = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { page, limit } = paginate(req.query.page, req.query.limit);

  await verifyOwnership(req.user.id, enfantId);

  const [countResult] = await query(
    'SELECT COUNT(*) as total FROM historique_apprentissage WHERE enfant_id = ?',
    [enfantId]
  );

  const historique = await query(
    `SELECT ha.*, c.titre, c.type, c.url_miniature, d.nom as domaine_nom
     FROM historique_apprentissage ha
     JOIN contenus c ON ha.contenu_id = c.id
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     WHERE ha.enfant_id = ?
     ORDER BY ha.date_acces DESC
     LIMIT ? OFFSET ?`,
    [enfantId, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: historique,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir un résumé de l'activité (parent)
 * GET /api/historique/enfant/:enfantId/resume
 */
const getResumeEnfant = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { periode = '7' } = req.query;

  await verifyOwnership(req.user.id, enfantId);

  // Statistiques générales
  const [stats] = await query(
    `SELECT
       COUNT(DISTINCT ha.contenu_id) as contenus_uniques,
       SUM(CASE WHEN ha.est_complete THEN 1 ELSE 0 END) as contenus_completes,
       SUM(ha.temps_passe_secondes) / 60 as temps_total_minutes,
       SUM(ha.points_gagnes) as points_gagnes,
       AVG(CASE WHEN ha.score IS NOT NULL THEN ha.score END) as score_moyen
     FROM historique_apprentissage ha
     WHERE ha.enfant_id = ? AND ha.date_acces >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [enfantId, parseInt(periode)]
  );

  // Top domaines
  const topDomaines = await query(
    `SELECT d.nom, d.icone, d.couleur,
            COUNT(*) as acces, SUM(ha.points_gagnes) as points
     FROM historique_apprentissage ha
     JOIN contenus c ON ha.contenu_id = c.id
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     WHERE ha.enfant_id = ? AND ha.date_acces >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY d.id
     ORDER BY acces DESC
     LIMIT 5`,
    [enfantId, parseInt(periode)]
  );

  // Activité récente par jour
  const activiteParJour = await query(
    `SELECT DATE(date_acces) as jour,
            COUNT(*) as acces,
            SUM(temps_passe_secondes) / 60 as minutes
     FROM historique_apprentissage
     WHERE enfant_id = ? AND date_acces >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_acces)
     ORDER BY jour DESC`,
    [enfantId, parseInt(periode)]
  );

  // Derniers badges obtenus
  const derniersBadges = await query(
    `SELECT b.nom, b.icone_url, be.date_obtention
     FROM badges_enfants be
     JOIN badges b ON be.badge_id = b.id
     WHERE be.enfant_id = ?
     ORDER BY be.date_obtention DESC
     LIMIT 5`,
    [enfantId]
  );

  res.json({
    success: true,
    data: {
      periode: `${periode} jours`,
      statistiques: {
        contenusUniques: stats.contenus_uniques || 0,
        contenusCompletes: stats.contenus_completes || 0,
        tempsTotalMinutes: Math.round(stats.temps_total_minutes || 0),
        pointsGagnes: stats.points_gagnes || 0,
        scoreMoyen: Math.round(stats.score_moyen || 0)
      },
      topDomaines,
      activiteParJour,
      derniersBadges
    }
  });
});

/**
 * Obtenir les statistiques de temps d'écran (parent)
 * GET /api/historique/enfant/:enfantId/temps-ecran
 */
const getTempsEcran = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { periode = '7' } = req.query;

  await verifyOwnership(req.user.id, enfantId);

  // Temps par jour
  const tempsParJour = await query(
    `SELECT DATE(date_debut) as jour, SUM(duree_minutes) as minutes
     FROM sessions_utilisation
     WHERE enfant_id = ? AND date_debut >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_debut)
     ORDER BY jour DESC`,
    [enfantId, parseInt(periode)]
  );

  // Temps par type d'activité
  const tempsParType = await query(
    `SELECT type_activite, SUM(duree_minutes) as minutes
     FROM sessions_utilisation
     WHERE enfant_id = ? AND date_debut >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY type_activite`,
    [enfantId, parseInt(periode)]
  );

  // Total et moyenne
  const [totaux] = await query(
    `SELECT
       SUM(duree_minutes) as total_minutes,
       AVG(duree_minutes) as moyenne_session
     FROM sessions_utilisation
     WHERE enfant_id = ? AND date_debut >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [enfantId, parseInt(periode)]
  );

  // Récupérer les paramètres pour comparer avec la limite
  const [parametres] = await query(
    'SELECT temps_max_quotidien FROM parametres_parentaux WHERE enfant_id = ?',
    [enfantId]
  );

  res.json({
    success: true,
    data: {
      periode: `${periode} jours`,
      totalMinutes: totaux.total_minutes || 0,
      moyenneQuotidienne: Math.round((totaux.total_minutes || 0) / parseInt(periode)),
      moyenneSession: Math.round(totaux.moyenne_session || 0),
      limiteQuotidienne: parametres?.temps_max_quotidien || 120,
      parJour: tempsParJour,
      parType: tempsParType
    }
  });
});

/**
 * Obtenir la progression détaillée (parent)
 * GET /api/historique/enfant/:enfantId/progression
 */
const getProgressionDetaille = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  // Progression par domaine
  const parDomaine = await query(
    `SELECT d.id, d.nom, d.icone, d.couleur,
            COUNT(DISTINCT c.id) as contenus_total,
            COUNT(DISTINCT CASE WHEN ha.est_complete THEN ha.contenu_id END) as contenus_completes,
            SUM(ha.points_gagnes) as points_totaux,
            AVG(ha.progression) as progression_moyenne
     FROM domaines_educatifs d
     LEFT JOIN contenus c ON c.domaine_id = d.id AND c.statut = 'publie'
     LEFT JOIN historique_apprentissage ha ON ha.contenu_id = c.id AND ha.enfant_id = ?
     WHERE d.est_actif = TRUE
     GROUP BY d.id
     ORDER BY d.ordre_affichage`,
    [enfantId]
  );

  // Enrichir avec le pourcentage
  const domainesEnrichis = parDomaine.map(d => ({
    ...d,
    pourcentageComplete: d.contenus_total > 0
      ? Math.round((d.contenus_completes / d.contenus_total) * 100)
      : 0
  }));

  // Profil enfant avec XP et niveau
  const [enfant] = await query(
    'SELECT points_xp, niveau_global FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  res.json({
    success: true,
    data: {
      pointsXpTotal: enfant.points_xp,
      niveauGlobal: enfant.niveau_global,
      parDomaine: domainesEnrichis
    }
  });
});

/**
 * Obtenir ses statistiques globales (enfant)
 * GET /api/historique/mes-stats
 */
const getMesStats = asyncHandler(async (req, res) => {
  const enfantId = req.user.id;

  const [enfant] = await query(
    'SELECT points_xp, niveau_global FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  const [stats] = await query(
    `SELECT
       COUNT(CASE WHEN ha.est_complete = TRUE THEN 1 END) as contenus_termines,
       COUNT(CASE WHEN ha.est_complete = TRUE AND ha.score IS NOT NULL THEN 1 END) as quiz_termines,
       SUM(ha.temps_passe_secondes) as temps_total_secondes,
       AVG(CASE WHEN ha.score IS NOT NULL THEN ha.score END) as score_moyen,
       SUM(ha.points_gagnes) as total_points_gagnes
     FROM historique_apprentissage ha
     WHERE ha.enfant_id = ?`,
    [enfantId]
  );

  const [badgeCount] = await query(
    'SELECT COUNT(*) as count FROM badges_enfants WHERE enfant_id = ?',
    [enfantId]
  );

  // Import level helpers
  const { getLevelFromXp, getXpThreshold } = require('./quiz.controller');

  const currentLevel = getLevelFromXp(enfant.points_xp);
  const xpForCurrentLevel = getXpThreshold(currentLevel);
  const xpForNextLevel = getXpThreshold(currentLevel + 1);
  const xpInCurrentLevel = enfant.points_xp - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

  res.json({
    success: true,
    data: {
      pointsXp: enfant.points_xp,
      niveau: currentLevel,
      xpInCurrentLevel,
      xpNeededForNext,
      xpForNextLevel,
      contenusTermines: stats.contenus_termines || 0,
      quizTermines: stats.quiz_termines || 0,
      tempsTotalMinutes: Math.round((stats.temps_total_secondes || 0) / 60),
      scoreMoyen: Math.round(stats.score_moyen || 0),
      totalPointsGagnes: stats.total_points_gagnes || 0,
      badgesObtenus: badgeCount.count || 0
    }
  });
});

/**
 * Synchroniser les XP des jeux vers le profil
 * POST /api/historique/sync-game-xp
 * Body: { gameXp: int }
 */
const syncGameXp = asyncHandler(async (req, res) => {
  const enfantId = req.user.id;
  const { gameXp } = req.body;

  if (!gameXp || gameXp <= 0) {
    throw ApiError.badRequest('gameXp doit etre un entier positif');
  }

  // Add game XP to profile
  await query(
    'UPDATE profils_enfants SET points_xp = points_xp + ? WHERE id = ?',
    [gameXp, enfantId]
  );

  // Auto level-up
  const { getLevelFromXp } = require('./quiz.controller');
  const [enfant] = await query(
    'SELECT points_xp, niveau_global FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  const newLevel = getLevelFromXp(enfant.points_xp);
  if (newLevel > enfant.niveau_global) {
    await query(
      'UPDATE profils_enfants SET niveau_global = ? WHERE id = ?',
      [newLevel, enfantId]
    );
  }

  res.json({
    success: true,
    message: 'XP synchronises',
    data: {
      totalXp: enfant.points_xp,
      niveau: Math.max(newLevel, enfant.niveau_global)
    }
  });
});

module.exports = {
  getMonHistorique,
  getMesBadges,
  getMesStats,
  syncGameXp,
  getHistoriqueEnfant,
  getResumeEnfant,
  getTempsEcran,
  getProgressionDetaille
};
