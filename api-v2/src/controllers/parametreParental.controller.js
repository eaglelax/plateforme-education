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
  return enfant;
}

/**
 * Obtenir les paramètres parentaux
 * GET /api/parametres-parentaux/:enfantId
 */
const get = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  const [parametres] = await query(
    'SELECT * FROM parametres_parentaux WHERE enfant_id = ?',
    [enfantId]
  );

  if (!parametres) {
    throw ApiError.notFound('Paramètres non trouvés');
  }

  res.json({
    success: true,
    data: {
      tempsMaxQuotidien: parametres.temps_max_quotidien,
      heureDebut: parametres.heure_debut_autorise,
      heureFin: parametres.heure_fin_autorise,
      joursAutorises: parametres.jours_autorises ? JSON.parse(parametres.jours_autorises) : [],
      modeKiosqueActif: parametres.mode_kiosque_actif,
      pinParentalConfigure: !!parametres.pin_parental,
      bloquerNavigateur: parametres.bloquer_navigateur,
      bloquerTelechargements: parametres.bloquer_telechargements,
      bloquerParametres: parametres.bloquer_parametres,
      filtrageContenuActif: parametres.filtrage_contenu_actif,
      niveauFiltrage: parametres.niveau_filtrage,
      notificationsActivite: parametres.notifications_activite,
      notificationsTempsEcoule: parametres.notifications_temps_ecoule
    }
  });
});

/**
 * Mettre à jour les paramètres parentaux
 * PUT /api/parametres-parentaux/:enfantId
 */
const update = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;

  await verifyOwnership(req.user.id, enfantId);

  const {
    tempsMaxQuotidien, heureDebut, heureFin, joursAutorises,
    modeKiosqueActif, pinParental, bloquerNavigateur, bloquerTelechargements,
    bloquerParametres, filtrageContenuActif, niveauFiltrage,
    notificationsActivite, notificationsTempsEcoule
  } = req.body;

  const updates = [];
  const values = [];

  if (tempsMaxQuotidien !== undefined) {
    updates.push('temps_max_quotidien = ?');
    values.push(tempsMaxQuotidien);
  }
  if (heureDebut) {
    updates.push('heure_debut_autorise = ?');
    values.push(heureDebut);
  }
  if (heureFin) {
    updates.push('heure_fin_autorise = ?');
    values.push(heureFin);
  }
  if (joursAutorises) {
    updates.push('jours_autorises = ?');
    values.push(JSON.stringify(joursAutorises));
  }
  if (modeKiosqueActif !== undefined) {
    updates.push('mode_kiosque_actif = ?');
    values.push(modeKiosqueActif);
  }
  if (pinParental) {
    updates.push('pin_parental = ?');
    values.push(pinParental);
  }
  if (bloquerNavigateur !== undefined) {
    updates.push('bloquer_navigateur = ?');
    values.push(bloquerNavigateur);
  }
  if (bloquerTelechargements !== undefined) {
    updates.push('bloquer_telechargements = ?');
    values.push(bloquerTelechargements);
  }
  if (bloquerParametres !== undefined) {
    updates.push('bloquer_parametres = ?');
    values.push(bloquerParametres);
  }
  if (filtrageContenuActif !== undefined) {
    updates.push('filtrage_contenu_actif = ?');
    values.push(filtrageContenuActif);
  }
  if (niveauFiltrage) {
    updates.push('niveau_filtrage = ?');
    values.push(niveauFiltrage);
  }
  if (notificationsActivite !== undefined) {
    updates.push('notifications_activite = ?');
    values.push(notificationsActivite);
  }
  if (notificationsTempsEcoule !== undefined) {
    updates.push('notifications_temps_ecoule = ?');
    values.push(notificationsTempsEcoule);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(enfantId);

  await query(
    `UPDATE parametres_parentaux SET ${updates.join(', ')} WHERE enfant_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Paramètres mis à jour'
  });
});

/**
 * Activer/désactiver le mode kiosque
 * PUT /api/parametres-parentaux/:enfantId/mode-kiosque
 */
const toggleKiosque = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { actif, pinParental } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  // Si activation, vérifier qu'un PIN est configuré ou fourni
  if (actif) {
    const [parametres] = await query(
      'SELECT pin_parental FROM parametres_parentaux WHERE enfant_id = ?',
      [enfantId]
    );

    if (!parametres.pin_parental && !pinParental) {
      throw ApiError.badRequest('Un PIN parental est requis pour activer le mode kiosque');
    }

    const updateQuery = pinParental
      ? 'UPDATE parametres_parentaux SET mode_kiosque_actif = TRUE, pin_parental = ? WHERE enfant_id = ?'
      : 'UPDATE parametres_parentaux SET mode_kiosque_actif = TRUE WHERE enfant_id = ?';

    const params = pinParental ? [pinParental, enfantId] : [enfantId];
    await query(updateQuery, params);
  } else {
    await query(
      'UPDATE parametres_parentaux SET mode_kiosque_actif = FALSE WHERE enfant_id = ?',
      [enfantId]
    );
  }

  res.json({
    success: true,
    message: actif ? 'Mode kiosque activé' : 'Mode kiosque désactivé'
  });
});

/**
 * Configurer les limites de temps d'écran
 * PUT /api/parametres-parentaux/:enfantId/temps-ecran
 */
const configTempsEcran = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { tempsMaxQuotidien, joursAutorises } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  const updates = ['temps_max_quotidien = ?'];
  const values = [tempsMaxQuotidien];

  if (joursAutorises) {
    updates.push('jours_autorises = ?');
    values.push(JSON.stringify(joursAutorises));
  }

  values.push(enfantId);

  await query(
    `UPDATE parametres_parentaux SET ${updates.join(', ')} WHERE enfant_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Limites de temps configurées'
  });
});

/**
 * Configurer les horaires autorisés
 * PUT /api/parametres-parentaux/:enfantId/horaires
 */
const configHoraires = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { heureDebut, heureFin } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  await query(
    `UPDATE parametres_parentaux
     SET heure_debut_autorise = ?, heure_fin_autorise = ?
     WHERE enfant_id = ?`,
    [heureDebut, heureFin, enfantId]
  );

  res.json({
    success: true,
    message: 'Horaires configurés'
  });
});

/**
 * Vérifier le PIN parental
 * POST /api/parametres-parentaux/:enfantId/verifier-pin
 */
const verifierPin = asyncHandler(async (req, res) => {
  const { enfantId } = req.params;
  const { pin } = req.body;

  await verifyOwnership(req.user.id, enfantId);

  const [parametres] = await query(
    'SELECT pin_parental FROM parametres_parentaux WHERE enfant_id = ?',
    [enfantId]
  );

  if (!parametres || !parametres.pin_parental) {
    throw ApiError.badRequest('Aucun PIN parental configuré');
  }

  const isValid = parametres.pin_parental === pin;

  res.json({
    success: true,
    data: { valide: isValid }
  });
});

module.exports = {
  get,
  update,
  toggleKiosque,
  configTempsEcran,
  configHoraires,
  verifierPin
};
