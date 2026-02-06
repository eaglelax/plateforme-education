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
 * Obtenir les domaines autorisés pour un enfant
 * GET /api/domaines-autorises/:enfantId
 */
const get = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  // Récupérer tous les domaines avec leur statut d'autorisation
  const domaines = await query(
    `SELECT de.id, de.nom, de.description, de.icone, de.couleur,
            COALESCE(pda.est_autorise, TRUE) as est_autorise
     FROM domaines_educatifs de
     LEFT JOIN profils_domaines_autorises pda ON de.id = pda.domaine_id AND pda.enfant_id = ?
     WHERE de.est_actif = TRUE
     ORDER BY de.ordre_affichage, de.nom`,
    [enfantId]
  );

  res.json({
    success: true,
    data: domaines
  });
});

/**
 * Mettre à jour les domaines autorisés
 * PUT /api/domaines-autorises/:enfantId
 */
const update = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { domaines } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  // Mettre à jour chaque domaine
  for (const { domaineId, autorise } of domaines) {
    // Vérifier si une entrée existe
    const [existing] = await query(
      'SELECT id FROM profils_domaines_autorises WHERE enfant_id = ? AND domaine_id = ?',
      [enfantId, domaineId]
    );

    if (existing) {
      await query(
        'UPDATE profils_domaines_autorises SET est_autorise = ? WHERE enfant_id = ? AND domaine_id = ?',
        [autorise, enfantId, domaineId]
      );
    } else {
      await query(
        'INSERT INTO profils_domaines_autorises (enfant_id, domaine_id, est_autorise) VALUES (?, ?, ?)',
        [enfantId, domaineId, autorise]
      );
    }
  }

  res.json({
    success: true,
    message: 'Domaines autorisés mis à jour'
  });
});

/**
 * Autoriser/bloquer un domaine spécifique
 * PUT /api/domaines-autorises/:enfantId/:domaineId
 */
const toggleDomaine = asyncHandler(async (req, res) => {
  const { enfantId, domaineId } = req.params;
  const { autorise } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  // Vérifier que le domaine existe
  const [domaine] = await query(
    'SELECT id, nom FROM domaines_educatifs WHERE id = ?',
    [domaineId]
  );

  if (!domaine) {
    throw ApiError.notFound('Domaine non trouvé');
  }

  // Mettre à jour ou créer
  const [existing] = await query(
    'SELECT id FROM profils_domaines_autorises WHERE enfant_id = ? AND domaine_id = ?',
    [enfantId, domaineId]
  );

  if (existing) {
    await query(
      'UPDATE profils_domaines_autorises SET est_autorise = ? WHERE enfant_id = ? AND domaine_id = ?',
      [autorise, enfantId, domaineId]
    );
  } else {
    await query(
      'INSERT INTO profils_domaines_autorises (enfant_id, domaine_id, est_autorise) VALUES (?, ?, ?)',
      [enfantId, domaineId, autorise]
    );
  }

  res.json({
    success: true,
    message: autorise
      ? `Domaine "${domaine.nom}" autorisé`
      : `Domaine "${domaine.nom}" bloqué`
  });
});

module.exports = {
  get,
  update,
  toggleDomaine
};
