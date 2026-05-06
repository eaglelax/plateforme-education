const { query } = require('../config/database');
const { calculateDateFin, paginate, paginationMeta } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Vérifie que le parent possède cet enfant
 */
async function verifyEnfantOwnership(parentId, enfantId) {
  const [enfant] = await query(
    'SELECT * FROM profils_enfants WHERE id = ? AND parent_id = ?',
    [enfantId, parentId]
  );
  if (!enfant) {
    throw ApiError.forbidden('Cet enfant ne vous appartient pas');
  }
  return enfant;
}

/**
 * Lister les types d'abonnements
 * GET /api/abonnements/types
 */
const getTypes = asyncHandler(async (req, res) => {
  const types = await query(
    `SELECT id, nom, description, prix, devise, duree, duree_jours,
            nombre_appareils_max, telechargement_autorise, contenu_premium
     FROM types_abonnements
     WHERE est_actif = TRUE
     ORDER BY prix ASC`
  );

  // Joindre les domaines inclus dans chaque pack (Amendement #10)
  if (types.length > 0) {
    const ids = types.map(t => t.id);
    const placeholders = ids.map(() => '?').join(',');
    const liens = await query(
      `SELECT pd.type_abonnement_id, d.id, d.nom, d.icone, d.couleur
       FROM pack_domaines pd
       JOIN domaines_educatifs d ON pd.domaine_id = d.id
       WHERE pd.type_abonnement_id IN (${placeholders}) AND d.est_actif = TRUE
       ORDER BY d.ordre_affichage`,
      ids
    );
    const grouped = {};
    for (const l of liens) {
      if (!grouped[l.type_abonnement_id]) grouped[l.type_abonnement_id] = [];
      grouped[l.type_abonnement_id].push({ id: l.id, nom: l.nom, icone: l.icone, couleur: l.couleur });
    }
    for (const t of types) {
      t.domaines = grouped[t.id] || [];
    }
  }

  res.json({
    success: true,
    data: types
  });
});

/**
 * Obtenir les domaines inclus dans un pack (Amendement #10)
 * GET /api/abonnements/types/:id/domaines
 */
const getPackDomaines = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [type] = await query('SELECT id FROM types_abonnements WHERE id = ?', [id]);
  if (!type) {
    throw ApiError.notFound('Type d\'abonnement non trouve');
  }

  const domaines = await query(
    `SELECT d.id, d.nom, d.description, d.icone, d.couleur, d.ordre_affichage
     FROM pack_domaines pd
     JOIN domaines_educatifs d ON pd.domaine_id = d.id
     WHERE pd.type_abonnement_id = ?
     ORDER BY d.ordre_affichage`,
    [id]
  );

  res.json({
    success: true,
    data: domaines
  });
});

/**
 * Configurer les domaines inclus dans un pack (Admin uniquement) (Amendement #10)
 * PUT /api/abonnements/types/:id/domaines
 * Body: { domaineIds: [1, 2, 3] }
 */
const setPackDomaines = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { domaineIds } = req.body;

  if (!Array.isArray(domaineIds)) {
    throw ApiError.badRequest('domaineIds doit etre un tableau');
  }

  const [type] = await query('SELECT id FROM types_abonnements WHERE id = ?', [id]);
  if (!type) {
    throw ApiError.notFound('Type d\'abonnement non trouve');
  }

  // Verifier que tous les domaines existent
  if (domaineIds.length > 0) {
    const placeholders = domaineIds.map(() => '?').join(',');
    const existing = await query(
      `SELECT id FROM domaines_educatifs WHERE id IN (${placeholders})`,
      domaineIds
    );
    if (existing.length !== domaineIds.length) {
      throw ApiError.badRequest('Un ou plusieurs domaines sont invalides');
    }
  }

  // Remplacer la configuration : delete + insert
  await query('DELETE FROM pack_domaines WHERE type_abonnement_id = ?', [id]);

  if (domaineIds.length > 0) {
    const values = domaineIds.map(() => '(?, ?)').join(', ');
    const params = [];
    for (const did of domaineIds) {
      params.push(id, did);
    }
    await query(
      `INSERT INTO pack_domaines (type_abonnement_id, domaine_id) VALUES ${values}`,
      params
    );
  }

  res.json({
    success: true,
    message: `${domaineIds.length} domaine(s) configure(s) pour le pack`,
    data: { typeAbonnementId: parseInt(id), domaineIds }
  });
});

/**
 * Obtenir les domaines accessibles pour un abonnement (snapshot) (Amendement #10)
 * GET /api/abonnements/:id/domaines
 */
const getAbonnementDomaines = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verifier acces
  let whereClause = 'a.id = ?';
  const params = [id];
  if (req.user.role !== 'ADMIN') {
    whereClause += ' AND pe.parent_id = ?';
    params.push(req.user.id);
  }

  const [abo] = await query(
    `SELECT a.id FROM abonnements a
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE ${whereClause}`,
    params
  );

  if (!abo) {
    throw ApiError.notFound('Abonnement non trouve');
  }

  const domaines = await query(
    `SELECT d.id, d.nom, d.description, d.icone, d.couleur
     FROM abonnement_domaines ad
     JOIN domaines_educatifs d ON ad.domaine_id = d.id
     WHERE ad.abonnement_id = ? AND d.est_actif = TRUE
     ORDER BY d.ordre_affichage`,
    [id]
  );

  res.json({
    success: true,
    data: domaines
  });
});

/**
 * Lister les abonnements
 * GET /api/abonnements
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { statut, enfantId } = req.query;

  let whereClause = '1=1';
  const params = [];

  // Parent ne voit que ses abonnements
  if (req.user.role !== 'ADMIN') {
    whereClause += ' AND pe.parent_id = ?';
    params.push(req.user.id);
  }

  if (statut) {
    whereClause += ' AND a.statut = ?';
    params.push(statut);
  }

  if (enfantId) {
    whereClause += ' AND a.enfant_id = ?';
    params.push(enfantId);
  }

  // Compter le total
  const [countResult] = await query(
    `SELECT COUNT(*) as total
     FROM abonnements a
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE ${whereClause}`,
    params
  );

  // Récupérer les abonnements
  const abonnements = await query(
    `SELECT a.*,
            ta.nom as type_nom, ta.prix, ta.duree, ta.devise,
            pe.nom_pseudo as enfant_nom, pe.code_connexion
     FROM abonnements a
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE ${whereClause}
     ORDER BY a.date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  const formattedAbonnements = abonnements.map(a => ({
    id: a.id,
    dateDebut: a.date_debut,
    dateFin: a.date_fin,
    statut: a.statut,
    renouvellementAuto: a.renouvellement_auto,
    periodeGrace: a.periode_grace,
    type: {
      id: a.type_abonnement_id,
      nom: a.type_nom,
      prix: a.prix,
      duree: a.duree,
      devise: a.devise
    },
    enfant: {
      id: a.enfant_id,
      nom: a.enfant_nom,
      codeConnexion: a.code_connexion
    }
  }));

  res.json({
    success: true,
    data: formattedAbonnements,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir un abonnement
 * GET /api/abonnements/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let whereClause = 'a.id = ?';
  const params = [id];

  // Parent ne voit que ses abonnements
  if (req.user.role !== 'ADMIN') {
    whereClause += ' AND pe.parent_id = ?';
    params.push(req.user.id);
  }

  const [abonnement] = await query(
    `SELECT a.*,
            ta.nom as type_nom, ta.prix, ta.duree, ta.devise, ta.description as type_description,
            pe.nom_pseudo as enfant_nom, pe.code_connexion, pe.avatar as enfant_avatar
     FROM abonnements a
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE ${whereClause}`,
    params
  );

  if (!abonnement) {
    throw ApiError.notFound('Abonnement non trouvé');
  }

  // Récupérer les paiements associés
  const paiements = await query(
    `SELECT id, montant, methode, statut, date_paiement, date_creation
     FROM paiements
     WHERE abonnement_id = ?
     ORDER BY date_creation DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      id: abonnement.id,
      dateDebut: abonnement.date_debut,
      dateFin: abonnement.date_fin,
      statut: abonnement.statut,
      renouvellementAuto: abonnement.renouvellement_auto,
      periodeGrace: abonnement.periode_grace,
      dateAnnulation: abonnement.date_annulation,
      motifAnnulation: abonnement.motif_annulation,
      type: {
        id: abonnement.type_abonnement_id,
        nom: abonnement.type_nom,
        description: abonnement.type_description,
        prix: abonnement.prix,
        duree: abonnement.duree,
        devise: abonnement.devise
      },
      enfant: {
        id: abonnement.enfant_id,
        nom: abonnement.enfant_nom,
        codeConnexion: abonnement.code_connexion,
        avatar: abonnement.enfant_avatar
      },
      paiements
    }
  });
});

/**
 * Souscrire un abonnement pour un enfant
 * POST /api/abonnements
 */
const create = asyncHandler(async (req, res) => {
  const { enfantId, typeAbonnementId } = req.body;

  // Vérifier que l'enfant appartient au parent
  await verifyEnfantOwnership(req.user.id, enfantId);

  // Vérifier le type d'abonnement
  const [type] = await query(
    'SELECT * FROM types_abonnements WHERE id = ? AND est_actif = TRUE',
    [typeAbonnementId]
  );

  if (!type) {
    throw ApiError.notFound('Type d\'abonnement non trouvé ou inactif');
  }

  // Vérifier si l'enfant a déjà un abonnement actif
  const [existingAbo] = await query(
    `SELECT id FROM abonnements
     WHERE enfant_id = ? AND statut IN ('actif', 'periode_grace')`,
    [enfantId]
  );

  if (existingAbo) {
    throw ApiError.conflict('Cet enfant a déjà un abonnement actif');
  }

  // Calculer les dates
  const dateDebut = new Date();
  const dateFin = calculateDateFin(dateDebut, type.duree);

  // Créer l'abonnement (statut en attente de paiement)
  const result = await query(
    `INSERT INTO abonnements
     (date_debut, date_fin, statut, renouvellement_auto, enfant_id, type_abonnement_id)
     VALUES (?, ?, 'actif', FALSE, ?, ?)`,
    [dateDebut, dateFin, enfantId, typeAbonnementId]
  );

  // Amendement #10 : snapshot des domaines du pack vers l'abonnement
  // Si le pack n'a aucune config, l'abonnement n'a pas non plus de snapshot.
  // Le filtrage applicatif considere alors "aucun snapshot" = "tous les domaines" (option a).
  const packDomaines = await query(
    'SELECT domaine_id FROM pack_domaines WHERE type_abonnement_id = ?',
    [typeAbonnementId]
  );

  if (packDomaines.length > 0) {
    const values = packDomaines.map(() => '(?, ?)').join(', ');
    const params = [];
    for (const pd of packDomaines) {
      params.push(result.insertId, pd.domaine_id);
    }
    await query(
      `INSERT INTO abonnement_domaines (abonnement_id, domaine_id) VALUES ${values}`,
      params
    );
  }

  res.status(201).json({
    success: true,
    message: 'Abonnement créé',
    data: {
      id: result.insertId,
      dateDebut,
      dateFin,
      statut: 'actif',
      type: {
        nom: type.nom,
        prix: type.prix,
        duree: type.duree
      }
    }
  });
});

/**
 * Activer/désactiver le renouvellement automatique
 * PUT /api/abonnements/:id/renouvellement
 */
const toggleRenouvellement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actif } = req.body;

  // Vérifier que l'abonnement appartient au parent
  const [abo] = await query(
    `SELECT a.* FROM abonnements a
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE a.id = ? AND pe.parent_id = ?`,
    [id, req.user.id]
  );

  if (!abo) {
    throw ApiError.notFound('Abonnement non trouvé');
  }

  await query(
    'UPDATE abonnements SET renouvellement_auto = ? WHERE id = ?',
    [actif, id]
  );

  res.json({
    success: true,
    message: actif
      ? 'Renouvellement automatique activé'
      : 'Renouvellement automatique désactivé'
  });
});

/**
 * Annuler un abonnement
 * POST /api/abonnements/:id/annuler
 */
const annuler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { motif } = req.body;

  // Vérifier que l'abonnement appartient au parent
  const [abo] = await query(
    `SELECT a.* FROM abonnements a
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE a.id = ? AND pe.parent_id = ?`,
    [id, req.user.id]
  );

  if (!abo) {
    throw ApiError.notFound('Abonnement non trouvé');
  }

  if (abo.statut === 'annule') {
    throw ApiError.badRequest('Cet abonnement est déjà annulé');
  }

  await query(
    `UPDATE abonnements
     SET statut = 'annule', renouvellement_auto = FALSE,
         date_annulation = NOW(), motif_annulation = ?
     WHERE id = ?`,
    [motif || null, id]
  );

  res.json({
    success: true,
    message: 'Abonnement annulé'
  });
});

/**
 * Créer un type d'abonnement (Admin)
 * POST /api/abonnements/types
 */
const createType = asyncHandler(async (req, res) => {
  const {
    nom, description, prix, duree, nombreAppareilsMax,
    telechargementAutorise, contenuPremium, domaineIds
  } = req.body;

  // Calculer la durée en jours
  const dureeJours = {
    'MENSUEL': 30,
    'TRIMESTRIEL': 90,
    'ANNUEL': 365
  }[duree];

  const result = await query(
    `INSERT INTO types_abonnements
     (nom, description, prix, duree, duree_jours, nombre_appareils_max,
      telechargement_autorise, contenu_premium)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nom,
      description || null,
      prix,
      duree,
      dureeJours,
      nombreAppareilsMax || 1,
      telechargementAutorise !== false,
      contenuPremium || false
    ]
  );

  // Amendement #10 : associer les domaines si fournis
  if (Array.isArray(domaineIds) && domaineIds.length > 0) {
    const values = domaineIds.map(() => '(?, ?)').join(', ');
    const params = [];
    for (const did of domaineIds) {
      params.push(result.insertId, did);
    }
    await query(
      `INSERT INTO pack_domaines (type_abonnement_id, domaine_id) VALUES ${values}`,
      params
    );
  }

  res.status(201).json({
    success: true,
    message: 'Type d\'abonnement créé',
    data: { id: result.insertId }
  });
});

/**
 * Modifier un type d'abonnement (Admin)
 * PUT /api/abonnements/types/:id
 */
const updateType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, description, prix, estActif } = req.body;

  const [existing] = await query(
    'SELECT id FROM types_abonnements WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw ApiError.notFound('Type d\'abonnement non trouvé');
  }

  const updates = [];
  const values = [];

  if (nom) {
    updates.push('nom = ?');
    values.push(nom);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (prix !== undefined) {
    updates.push('prix = ?');
    values.push(prix);
  }
  if (estActif !== undefined) {
    updates.push('est_actif = ?');
    values.push(estActif);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(id);

  await query(
    `UPDATE types_abonnements SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Type d\'abonnement mis à jour'
  });
});

/**
 * Changer le statut d'un abonnement (Admin)
 * PUT /api/abonnements/:id/statut
 */
const changeStatut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const [abo] = await query('SELECT id FROM abonnements WHERE id = ?', [id]);

  if (!abo) {
    throw ApiError.notFound('Abonnement non trouvé');
  }

  await query('UPDATE abonnements SET statut = ? WHERE id = ?', [statut, id]);

  res.json({
    success: true,
    message: `Statut changé en ${statut}`
  });
});

module.exports = {
  getTypes,
  getAll,
  getById,
  create,
  toggleRenouvellement,
  annuler,
  createType,
  updateType,
  changeStatut,
  getPackDomaines,
  setPackDomaines,
  getAbonnementDomaines
};
