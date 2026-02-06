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
 * Obtenir le catalogue des applications
 * GET /api/apk-autorisees/catalogue
 */
const getCatalogue = asyncHandler(async (req, res) => {
  const { categorie } = req.query;

  let whereClause = 'est_valide = TRUE';
  const params = [];

  if (categorie) {
    whereClause += ' AND categorie = ?';
    params.push(categorie);
  }

  const applications = await query(
    `SELECT id, nom, package_name, description, icone_url, categorie
     FROM applications_autorisees
     WHERE ${whereClause}
     ORDER BY categorie, nom`,
    params
  );

  res.json({
    success: true,
    data: applications
  });
});

/**
 * Obtenir les APK autorisées pour un enfant
 * GET /api/apk-autorisees/:enfantId
 */
const getForEnfant = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  const applications = await query(
    `SELECT aa.id, aa.nom, aa.package_name, aa.description, aa.icone_url, aa.categorie,
            COALESCE(paa.est_autorise, FALSE) as est_autorise
     FROM applications_autorisees aa
     LEFT JOIN profils_apk_autorisees paa ON aa.id = paa.application_id AND paa.enfant_id = ?
     WHERE aa.est_valide = TRUE
     ORDER BY aa.categorie, aa.nom`,
    [enfantId]
  );

  // Séparer autorisées et non autorisées
  const autorisees = applications.filter(a => a.est_autorise);
  const nonAutorisees = applications.filter(a => !a.est_autorise);

  res.json({
    success: true,
    data: {
      autorisees,
      nonAutorisees,
      toutes: applications
    }
  });
});

/**
 * Mettre à jour les APK autorisées
 * PUT /api/apk-autorisees/:enfantId
 */
const update = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { applications } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  for (const { applicationId, autorise } of applications) {
    const [existing] = await query(
      'SELECT id FROM profils_apk_autorisees WHERE enfant_id = ? AND application_id = ?',
      [enfantId, applicationId]
    );

    if (existing) {
      await query(
        'UPDATE profils_apk_autorisees SET est_autorise = ? WHERE enfant_id = ? AND application_id = ?',
        [autorise, enfantId, applicationId]
      );
    } else {
      await query(
        'INSERT INTO profils_apk_autorisees (enfant_id, application_id, est_autorise) VALUES (?, ?, ?)',
        [enfantId, applicationId, autorise]
      );
    }
  }

  res.json({
    success: true,
    message: 'Applications autorisées mises à jour'
  });
});

/**
 * Autoriser/bloquer une application
 * PUT /api/apk-autorisees/:enfantId/:appId
 */
const toggleApp = asyncHandler(async (req, res) => {
  const { enfantId, appId } = req.params;
  const { autorise } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  const [app] = await query(
    'SELECT id, nom FROM applications_autorisees WHERE id = ?',
    [appId]
  );

  if (!app) {
    throw ApiError.notFound('Application non trouvée');
  }

  const [existing] = await query(
    'SELECT id FROM profils_apk_autorisees WHERE enfant_id = ? AND application_id = ?',
    [enfantId, appId]
  );

  if (existing) {
    await query(
      'UPDATE profils_apk_autorisees SET est_autorise = ? WHERE enfant_id = ? AND application_id = ?',
      [autorise, enfantId, appId]
    );
  } else {
    await query(
      'INSERT INTO profils_apk_autorisees (enfant_id, application_id, est_autorise) VALUES (?, ?, ?)',
      [enfantId, appId, autorise]
    );
  }

  res.json({
    success: true,
    message: autorise
      ? `Application "${app.nom}" autorisée`
      : `Application "${app.nom}" bloquée`
  });
});

/**
 * Ajouter une application au catalogue (Admin)
 * POST /api/apk-autorisees/catalogue
 */
const addToCatalogue = asyncHandler(async (req, res) => {
  const { nom, packageName, description, iconeUrl, categorie } = req.body;

  // Vérifier si le package existe déjà
  const [existing] = await query(
    'SELECT id FROM applications_autorisees WHERE package_name = ?',
    [packageName]
  );

  if (existing) {
    throw ApiError.conflict('Cette application existe déjà dans le catalogue');
  }

  const result = await query(
    `INSERT INTO applications_autorisees (nom, package_name, description, icone_url, categorie)
     VALUES (?, ?, ?, ?, ?)`,
    [nom, packageName, description || null, iconeUrl || null, categorie]
  );

  res.status(201).json({
    success: true,
    message: 'Application ajoutée au catalogue',
    data: { id: result.insertId }
  });
});

/**
 * Modifier une application du catalogue (Admin)
 * PUT /api/apk-autorisees/catalogue/:id
 */
const updateCatalogue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, description, iconeUrl, categorie, estValide } = req.body;

  const [existing] = await query(
    'SELECT id FROM applications_autorisees WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw ApiError.notFound('Application non trouvée');
  }

  const updates = [];
  const values = [];

  if (nom) { updates.push('nom = ?'); values.push(nom); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (iconeUrl !== undefined) { updates.push('icone_url = ?'); values.push(iconeUrl); }
  if (categorie) { updates.push('categorie = ?'); values.push(categorie); }
  if (estValide !== undefined) { updates.push('est_valide = ?'); values.push(estValide); }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(id);

  await query(
    `UPDATE applications_autorisees SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Application mise à jour'
  });
});

/**
 * Supprimer une application du catalogue (Admin)
 * DELETE /api/apk-autorisees/catalogue/:id
 */
const deleteFromCatalogue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await query('DELETE FROM applications_autorisees WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Application supprimée du catalogue'
  });
});

module.exports = {
  getCatalogue,
  getForEnfant,
  update,
  toggleApp,
  addToCatalogue,
  updateCatalogue,
  deleteFromCatalogue
};
