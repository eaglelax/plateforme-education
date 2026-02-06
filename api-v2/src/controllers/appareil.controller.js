const { query } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Vérifie que l'appareil appartient au parent
 */
async function verifyOwnership(parentId, appareilId) {
  const [appareil] = await query(
    'SELECT * FROM appareils WHERE id = ? AND parent_id = ?',
    [appareilId, parentId]
  );
  if (!appareil) {
    throw ApiError.forbidden('Cet appareil ne vous appartient pas');
  }
  return appareil;
}

/**
 * Lister les appareils
 * GET /api/appareils
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);

  let whereClause = '1=1';
  const params = [];

  if (req.user.role !== 'ADMIN') {
    whereClause = 'a.parent_id = ?';
    params.push(req.user.id);
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM appareils a WHERE ${whereClause}`,
    params
  );

  const appareils = await query(
    `SELECT a.*,
            (SELECT COUNT(*) FROM sessions_actives WHERE appareil_id = a.id AND est_active = TRUE) as sessions_actives
     FROM appareils a
     WHERE ${whereClause}
     ORDER BY a.derniere_connexion DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: appareils,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir un appareil
 * GET /api/appareils/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let appareil;
  if (req.user.role === 'ADMIN') {
    [appareil] = await query('SELECT * FROM appareils WHERE id = ?', [id]);
  } else {
    appareil = await verifyOwnership(req.user.id, id);
  }

  if (!appareil) {
    throw ApiError.notFound('Appareil non trouvé');
  }

  // Sessions actives
  const sessions = await query(
    `SELECT sa.*, pe.nom_pseudo as enfant_nom
     FROM sessions_actives sa
     JOIN profils_enfants pe ON sa.enfant_id = pe.id
     WHERE sa.appareil_id = ? AND sa.est_active = TRUE`,
    [id]
  );

  // Contenus téléchargés
  const contenus = await query(
    `SELECT ct.*, c.titre, c.type
     FROM contenus_telecharges ct
     JOIN contenus c ON ct.contenu_id = c.id
     WHERE ct.appareil_id = ? AND ct.statut = 'complete'`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...appareil,
      sessionsActives: sessions,
      contenusTelecharges: contenus
    }
  });
});

/**
 * Enregistrer un appareil
 * POST /api/appareils
 */
const create = asyncHandler(async (req, res) => {
  const { nom, type, imei, modele, systemeOs, versionOs } = req.body;

  // Vérifier si l'IMEI existe déjà
  if (imei) {
    const [existing] = await query(
      'SELECT id FROM appareils WHERE imei = ?',
      [imei]
    );
    if (existing) {
      throw ApiError.conflict('Cet IMEI est déjà enregistré');
    }
  }

  const result = await query(
    `INSERT INTO appareils (nom, type, imei, modele, systeme_os, version_os, parent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nom, type || 'tablette', imei || null, modele || null, systemeOs || null, versionOs || null, req.user.id]
  );

  res.status(201).json({
    success: true,
    message: 'Appareil enregistré',
    data: { id: result.insertId }
  });
});

/**
 * Modifier un appareil
 * PUT /api/appareils/:id
 */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await verifyOwnership(req.user.id, id);

  const { nom, type, modele, systemeOs, versionOs } = req.body;

  const updates = [];
  const values = [];

  if (nom) { updates.push('nom = ?'); values.push(nom); }
  if (type) { updates.push('type = ?'); values.push(type); }
  if (modele !== undefined) { updates.push('modele = ?'); values.push(modele); }
  if (systemeOs !== undefined) { updates.push('systeme_os = ?'); values.push(systemeOs); }
  if (versionOs !== undefined) { updates.push('version_os = ?'); values.push(versionOs); }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(id);

  await query(`UPDATE appareils SET ${updates.join(', ')} WHERE id = ?`, values);

  res.json({
    success: true,
    message: 'Appareil mis à jour'
  });
});

/**
 * Supprimer un appareil
 * DELETE /api/appareils/:id
 */
const deleteAppareil = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await verifyOwnership(req.user.id, id);

  await query('DELETE FROM appareils WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Appareil supprimé'
  });
});

/**
 * Bloquer/débloquer un appareil
 * PUT /api/appareils/:id/bloquer
 */
const toggleBloquer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bloquer } = req.body;

  await verifyOwnership(req.user.id, id);

  const newStatut = bloquer ? 'bloque' : 'actif';

  await query('UPDATE appareils SET statut = ? WHERE id = ?', [newStatut, id]);

  // Si blocage, fermer toutes les sessions actives
  if (bloquer) {
    await query(
      'UPDATE sessions_actives SET est_active = FALSE, date_fin = NOW() WHERE appareil_id = ? AND est_active = TRUE',
      [id]
    );
  }

  res.json({
    success: true,
    message: bloquer ? 'Appareil bloqué' : 'Appareil débloqué'
  });
});

/**
 * Obtenir les sessions sur un appareil
 * GET /api/appareils/:id/sessions
 */
const getSessions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await verifyOwnership(req.user.id, id);

  const sessions = await query(
    `SELECT sa.*, pe.nom_pseudo as enfant_nom, pe.avatar as enfant_avatar
     FROM sessions_actives sa
     JOIN profils_enfants pe ON sa.enfant_id = pe.id
     WHERE sa.appareil_id = ?
     ORDER BY sa.date_debut DESC
     LIMIT 50`,
    [id]
  );

  res.json({
    success: true,
    data: sessions
  });
});

/**
 * Déconnecter toutes les sessions
 * POST /api/appareils/:id/deconnecter
 */
const deconnecterSessions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await verifyOwnership(req.user.id, id);

  const result = await query(
    'UPDATE sessions_actives SET est_active = FALSE, date_fin = NOW() WHERE appareil_id = ? AND est_active = TRUE',
    [id]
  );

  res.json({
    success: true,
    message: `${result.affectedRows} session(s) déconnectée(s)`
  });
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteAppareil,
  toggleBloquer,
  getSessions,
  deconnecterSessions
};
