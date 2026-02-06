const { query } = require('../config/database');
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
 * Obtenir les préférences de téléchargement
 * GET /api/preferences-telechargement/:enfantId
 */
const get = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  const [prefs] = await query(
    'SELECT * FROM preferences_telechargement WHERE enfant_id = ?',
    [enfantId]
  );

  if (!prefs) {
    throw ApiError.notFound('Préférences non trouvées');
  }

  // Calculer l'espace utilisé
  const [espaceUtilise] = await query(
    `SELECT COALESCE(SUM(taille_mo), 0) as espace_utilise
     FROM contenus_telecharges
     WHERE enfant_id = ? AND statut = 'complete'`,
    [enfantId]
  );

  res.json({
    success: true,
    data: {
      telechargementAuto: prefs.telechargement_auto,
      wifiUniquement: prefs.wifi_uniquement,
      qualiteVideo: prefs.qualite_video,
      limiteStockageMo: prefs.limite_stockage_mo,
      telechargerNouveaux: prefs.telecharger_nouveaux,
      supprimerVisionnes: prefs.supprimer_visionnes,
      espaceUtiliseMo: parseFloat(espaceUtilise.espace_utilise),
      espaceDisponibleMo: prefs.limite_stockage_mo - parseFloat(espaceUtilise.espace_utilise)
    }
  });
});

/**
 * Mettre à jour les préférences de téléchargement
 * PUT /api/preferences-telechargement/:enfantId
 */
const update = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const {
    telechargementAuto, wifiUniquement, qualiteVideo,
    limiteStockageMo, telechargerNouveaux, supprimerVisionnes
  } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  const updates = [];
  const values = [];

  if (telechargementAuto !== undefined) {
    updates.push('telechargement_auto = ?');
    values.push(telechargementAuto);
  }
  if (wifiUniquement !== undefined) {
    updates.push('wifi_uniquement = ?');
    values.push(wifiUniquement);
  }
  if (qualiteVideo) {
    updates.push('qualite_video = ?');
    values.push(qualiteVideo);
  }
  if (limiteStockageMo) {
    updates.push('limite_stockage_mo = ?');
    values.push(limiteStockageMo);
  }
  if (telechargerNouveaux !== undefined) {
    updates.push('telecharger_nouveaux = ?');
    values.push(telechargerNouveaux);
  }
  if (supprimerVisionnes !== undefined) {
    updates.push('supprimer_visionnes = ?');
    values.push(supprimerVisionnes);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(enfantId);

  await query(
    `UPDATE preferences_telechargement SET ${updates.join(', ')} WHERE enfant_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Préférences mises à jour'
  });
});

/**
 * Obtenir les contenus téléchargés
 * GET /api/preferences-telechargement/:enfantId/contenus
 */
const getContenusTelecharges = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  const contenus = await query(
    `SELECT ct.*, c.titre, c.type, c.url_miniature, c.duree_minutes,
            a.nom as appareil_nom
     FROM contenus_telecharges ct
     JOIN contenus c ON ct.contenu_id = c.id
     JOIN appareils a ON ct.appareil_id = a.id
     WHERE ct.enfant_id = ?
     ORDER BY ct.date_creation DESC`,
    [enfantId]
  );

  // Calculer le total
  const total = contenus.reduce((sum, c) => sum + parseFloat(c.taille_mo || 0), 0);

  res.json({
    success: true,
    data: {
      contenus,
      totalMo: total,
      nombreContenus: contenus.length
    }
  });
});

/**
 * Supprimer un contenu téléchargé
 * DELETE /api/preferences-telechargement/:enfantId/contenus/:contenuId
 */
const supprimerContenuTelecharge = asyncHandler(async (req, res) => {
  const { enfantId, contenuId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  const result = await query(
    `UPDATE contenus_telecharges
     SET statut = 'supprime'
     WHERE enfant_id = ? AND contenu_id = ?`,
    [enfantId, contenuId]
  );

  if (result.affectedRows === 0) {
    throw ApiError.notFound('Contenu téléchargé non trouvé');
  }

  res.json({
    success: true,
    message: 'Contenu marqué comme supprimé'
  });
});

module.exports = {
  get,
  update,
  getContenusTelecharges,
  supprimerContenuTelecharge
};
