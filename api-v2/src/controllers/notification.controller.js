const { query } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtenir ses notifications
 * GET /api/notifications
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { nonLues } = req.query;

  let whereClause;
  const params = [];

  if (req.user.type === 'enfant') {
    whereClause = 'enfant_id = ?';
    params.push(req.user.id);
  } else {
    whereClause = 'utilisateur_id = ?';
    params.push(req.user.id);
  }

  if (nonLues === 'true') {
    whereClause += ' AND est_lue = FALSE';
  }

  // Ne pas montrer les notifications expirées
  whereClause += ' AND (date_expiration IS NULL OR date_expiration > NOW())';

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
    params
  );

  const notifications = await query(
    `SELECT * FROM notifications
     WHERE ${whereClause}
     ORDER BY date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: notifications,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Compter les notifications non lues
 * GET /api/notifications/non-lues/count
 */
const countNonLues = asyncHandler(async (req, res) => {
  let whereClause;
  const params = [];

  if (req.user.type === 'enfant') {
    whereClause = 'enfant_id = ?';
    params.push(req.user.id);
  } else {
    whereClause = 'utilisateur_id = ?';
    params.push(req.user.id);
  }

  whereClause += ' AND est_lue = FALSE AND (date_expiration IS NULL OR date_expiration > NOW())';

  const [result] = await query(
    `SELECT COUNT(*) as count FROM notifications WHERE ${whereClause}`,
    params
  );

  res.json({
    success: true,
    data: { count: result.count }
  });
});

/**
 * Marquer une notification comme lue
 * PUT /api/notifications/:id/lire
 */
const marquerLue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let whereClause = 'id = ?';
  const params = [id];

  if (req.user.type === 'enfant') {
    whereClause += ' AND enfant_id = ?';
    params.push(req.user.id);
  } else {
    whereClause += ' AND utilisateur_id = ?';
    params.push(req.user.id);
  }

  const result = await query(
    `UPDATE notifications SET est_lue = TRUE, date_lecture = NOW() WHERE ${whereClause}`,
    params
  );

  if (result.affectedRows === 0) {
    throw ApiError.notFound('Notification non trouvée');
  }

  res.json({
    success: true,
    message: 'Notification marquée comme lue'
  });
});

/**
 * Marquer toutes les notifications comme lues
 * PUT /api/notifications/lire-toutes
 */
const marquerToutesLues = asyncHandler(async (req, res) => {
  let whereClause;
  const params = [];

  if (req.user.type === 'enfant') {
    whereClause = 'enfant_id = ?';
    params.push(req.user.id);
  } else {
    whereClause = 'utilisateur_id = ?';
    params.push(req.user.id);
  }

  whereClause += ' AND est_lue = FALSE';

  const result = await query(
    `UPDATE notifications SET est_lue = TRUE, date_lecture = NOW() WHERE ${whereClause}`,
    params
  );

  res.json({
    success: true,
    message: `${result.affectedRows} notification(s) marquée(s) comme lue(s)`
  });
});

/**
 * Supprimer une notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let whereClause = 'id = ?';
  const params = [id];

  if (req.user.type === 'enfant') {
    whereClause += ' AND enfant_id = ?';
    params.push(req.user.id);
  } else if (req.user.role !== 'ADMIN') {
    whereClause += ' AND utilisateur_id = ?';
    params.push(req.user.id);
  }

  const result = await query(`DELETE FROM notifications WHERE ${whereClause}`, params);

  if (result.affectedRows === 0) {
    throw ApiError.notFound('Notification non trouvée');
  }

  res.json({
    success: true,
    message: 'Notification supprimée'
  });
});

/**
 * Envoyer une notification (Admin)
 * POST /api/notifications/envoyer
 */
const envoyer = asyncHandler(async (req, res) => {
  const { titre, message, type, utilisateurId, enfantId, lienAction, dateExpiration } = req.body;

  if (!utilisateurId && !enfantId) {
    throw ApiError.badRequest('Destinataire requis (utilisateurId ou enfantId)');
  }

  const result = await query(
    `INSERT INTO notifications (titre, message, type, lien_action, date_expiration, utilisateur_id, enfant_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      titre,
      message,
      type || 'info',
      lienAction || null,
      dateExpiration || null,
      utilisateurId || null,
      enfantId || null
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Notification envoyée',
    data: { id: result.insertId }
  });
});

/**
 * Broadcast une notification à tous (Admin)
 * POST /api/notifications/broadcast
 */
const broadcast = asyncHandler(async (req, res) => {
  const { titre, message, type, lienAction, dateExpiration } = req.body;

  // Récupérer tous les utilisateurs actifs
  const utilisateurs = await query(
    'SELECT id FROM utilisateurs WHERE statut_compte = "actif"'
  );

  // Créer une notification pour chaque utilisateur
  const notifType = type || 'systeme';
  let count = 0;

  for (const user of utilisateurs) {
    await query(
      `INSERT INTO notifications (titre, message, type, lien_action, date_expiration, utilisateur_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titre, message, notifType, lienAction || null, dateExpiration || null, user.id]
    );
    count++;
  }

  res.status(201).json({
    success: true,
    message: `Notification envoyée à ${count} utilisateur(s)`
  });
});

module.exports = {
  getAll,
  countNonLues,
  marquerLue,
  marquerToutesLues,
  delete: deleteNotification,
  envoyer,
  broadcast
};
