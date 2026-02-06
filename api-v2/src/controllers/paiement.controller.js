const { query, transaction } = require('../config/database');
const { generateToken, paginate, paginationMeta, formatPhoneBF } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Lister les paiements
 * GET /api/paiements
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { statut, methode, dateDebut, dateFin } = req.query;

  let whereClause = '1=1';
  const params = [];

  // Parent ne voit que ses paiements
  if (req.user.role !== 'ADMIN') {
    whereClause += ' AND p.utilisateur_id = ?';
    params.push(req.user.id);
  }

  if (statut) {
    whereClause += ' AND p.statut = ?';
    params.push(statut);
  }

  if (methode) {
    whereClause += ' AND p.methode = ?';
    params.push(methode);
  }

  if (dateDebut) {
    whereClause += ' AND p.date_creation >= ?';
    params.push(dateDebut);
  }

  if (dateFin) {
    whereClause += ' AND p.date_creation <= ?';
    params.push(dateFin);
  }

  // Compter le total
  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM paiements p WHERE ${whereClause}`,
    params
  );

  // Récupérer les paiements
  const paiements = await query(
    `SELECT p.*,
            a.date_debut as abo_date_debut, a.date_fin as abo_date_fin,
            ta.nom as type_abonnement_nom,
            pe.nom_pseudo as enfant_nom,
            u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
     FROM paiements p
     JOIN abonnements a ON p.abonnement_id = a.id
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     JOIN utilisateurs u ON p.utilisateur_id = u.id
     WHERE ${whereClause}
     ORDER BY p.date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: paiements,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir un paiement par ID
 * GET /api/paiements/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let whereClause = 'p.id = ?';
  const params = [id];

  if (req.user.role !== 'ADMIN') {
    whereClause += ' AND p.utilisateur_id = ?';
    params.push(req.user.id);
  }

  const [paiement] = await query(
    `SELECT p.*,
            a.id as abonnement_id, a.date_debut as abo_date_debut, a.date_fin as abo_date_fin, a.statut as abo_statut,
            ta.nom as type_abonnement_nom, ta.prix as type_abonnement_prix,
            pe.nom_pseudo as enfant_nom, pe.code_connexion as enfant_code
     FROM paiements p
     JOIN abonnements a ON p.abonnement_id = a.id
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE ${whereClause}`,
    params
  );

  if (!paiement) {
    throw ApiError.notFound('Paiement non trouvé');
  }

  res.json({
    success: true,
    data: paiement
  });
});

/**
 * Initier un paiement Mobile Money
 * POST /api/paiements
 */
const initier = asyncHandler(async (req, res) => {
  const { abonnementId, methode, numeroTelephone } = req.body;

  // Vérifier que l'abonnement appartient au parent
  const [abonnement] = await query(
    `SELECT a.*, ta.prix, ta.nom as type_nom, pe.parent_id
     FROM abonnements a
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE a.id = ?`,
    [abonnementId]
  );

  if (!abonnement) {
    throw ApiError.notFound('Abonnement non trouvé');
  }

  if (abonnement.parent_id !== req.user.id) {
    throw ApiError.forbidden('Cet abonnement ne vous appartient pas');
  }

  // Vérifier s'il n'y a pas déjà un paiement en attente
  const [paiementEnAttente] = await query(
    `SELECT id FROM paiements
     WHERE abonnement_id = ? AND statut = 'en_attente'`,
    [abonnementId]
  );

  if (paiementEnAttente) {
    throw ApiError.conflict('Un paiement est déjà en attente pour cet abonnement');
  }

  // Formater le numéro de téléphone
  const phoneFormatted = formatPhoneBF(numeroTelephone);

  // Générer une référence unique
  const reference = `PAY-${Date.now()}-${generateToken(4)}`;

  // Créer le paiement
  const result = await query(
    `INSERT INTO paiements
     (montant, devise, methode, numero_telephone, reference_externe, abonnement_id, utilisateur_id)
     VALUES (?, 'XOF', ?, ?, ?, ?, ?)`,
    [abonnement.prix, methode, phoneFormatted, reference, abonnementId, req.user.id]
  );

  // TODO: Intégrer avec l'API Mobile Money réelle
  // Pour l'instant, on simule une réponse
  const paymentResponse = {
    success: true,
    reference,
    instructionsUssd: getUssdInstructions(methode, abonnement.prix, reference),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  };

  res.status(201).json({
    success: true,
    message: 'Paiement initié',
    data: {
      paiementId: result.insertId,
      montant: abonnement.prix,
      devise: 'XOF',
      methode,
      reference,
      ...paymentResponse
    }
  });
});

/**
 * Génère les instructions USSD selon l'opérateur
 */
function getUssdInstructions(methode, montant, reference) {
  switch (methode) {
    case 'orange_money':
      return `Composez #144*4*1*NUMERO_MARCHAND*${montant}*${reference}#`;
    case 'moov_money':
      return `Composez *555*1*NUMERO_MARCHAND*${montant}*${reference}#`;
    case 'wave':
      return `Ouvrez l'application Wave et scannez le QR code ou entrez la référence: ${reference}`;
    default:
      return 'Instructions non disponibles';
  }
}

/**
 * Vérifier le statut d'un paiement
 * POST /api/paiements/:id/verifier
 */
const verifier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [paiement] = await query(
    `SELECT p.*, a.id as abonnement_id
     FROM paiements p
     JOIN abonnements a ON p.abonnement_id = a.id
     JOIN profils_enfants pe ON a.enfant_id = pe.id
     WHERE p.id = ? AND pe.parent_id = ?`,
    [id, req.user.id]
  );

  if (!paiement) {
    throw ApiError.notFound('Paiement non trouvé');
  }

  // TODO: Vérifier le statut réel auprès de l'API Mobile Money
  // Pour l'instant, on retourne le statut actuel

  res.json({
    success: true,
    data: {
      id: paiement.id,
      statut: paiement.statut,
      reference: paiement.reference_externe,
      montant: paiement.montant,
      methode: paiement.methode
    }
  });
});

/**
 * Webhook Orange Money
 * POST /api/paiements/webhook/orange
 */
const webhookOrange = asyncHandler(async (req, res) => {
  // TODO: Vérifier la signature du webhook
  const { reference, status, transactionId } = req.body;

  await processWebhook(reference, status, transactionId, 'orange_money');

  res.json({ success: true });
});

/**
 * Webhook Moov Money
 * POST /api/paiements/webhook/moov
 */
const webhookMoov = asyncHandler(async (req, res) => {
  const { reference, status, transactionId } = req.body;

  await processWebhook(reference, status, transactionId, 'moov_money');

  res.json({ success: true });
});

/**
 * Webhook Wave
 * POST /api/paiements/webhook/wave
 */
const webhookWave = asyncHandler(async (req, res) => {
  const { reference, status, transactionId } = req.body;

  await processWebhook(reference, status, transactionId, 'wave');

  res.json({ success: true });
});

/**
 * Traite un webhook de paiement
 */
async function processWebhook(reference, status, transactionId, methode) {
  // Trouver le paiement
  const [paiement] = await query(
    'SELECT * FROM paiements WHERE reference_externe = ? AND methode = ?',
    [reference, methode]
  );

  if (!paiement) {
    console.error(`Paiement non trouvé: ${reference}`);
    return;
  }

  // Mapper le statut
  let newStatut;
  if (status === 'SUCCESS' || status === 'COMPLETED') {
    newStatut = 'complete';
  } else if (status === 'FAILED' || status === 'REJECTED') {
    newStatut = 'echoue';
  } else {
    return; // Ignorer les autres statuts
  }

  // Mettre à jour dans une transaction
  await transaction(async (conn) => {
    // Mettre à jour le paiement
    await conn.execute(
      `UPDATE paiements
       SET statut = ?, date_paiement = NOW(),
           details_transaction = JSON_SET(COALESCE(details_transaction, '{}'), '$.transactionId', ?)
       WHERE id = ?`,
      [newStatut, transactionId, paiement.id]
    );

    // Si paiement réussi, activer l'abonnement
    if (newStatut === 'complete') {
      await conn.execute(
        `UPDATE abonnements SET statut = 'actif' WHERE id = ?`,
        [paiement.abonnement_id]
      );

      // Créer une notification
      await conn.execute(
        `INSERT INTO notifications (titre, message, type, utilisateur_id)
         VALUES (?, ?, 'succes', ?)`,
        [
          'Paiement confirmé',
          `Votre paiement de ${paiement.montant} XOF a été confirmé.`,
          paiement.utilisateur_id
        ]
      );
    }
  });
}

/**
 * Changer le statut d'un paiement (Admin)
 * PUT /api/paiements/:id/statut
 */
const changeStatut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const [paiement] = await query('SELECT * FROM paiements WHERE id = ?', [id]);

  if (!paiement) {
    throw ApiError.notFound('Paiement non trouvé');
  }

  await transaction(async (conn) => {
    await conn.execute(
      'UPDATE paiements SET statut = ?, date_paiement = NOW() WHERE id = ?',
      [statut, id]
    );

    // Si paiement marqué comme complet, activer l'abonnement
    if (statut === 'complete') {
      await conn.execute(
        'UPDATE abonnements SET statut = "actif" WHERE id = ?',
        [paiement.abonnement_id]
      );
    }
  });

  res.json({
    success: true,
    message: `Statut changé en ${statut}`
  });
});

/**
 * Rembourser un paiement (Admin)
 * POST /api/paiements/:id/rembourser
 */
const rembourser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { motif } = req.body;

  const [paiement] = await query('SELECT * FROM paiements WHERE id = ?', [id]);

  if (!paiement) {
    throw ApiError.notFound('Paiement non trouvé');
  }

  if (paiement.statut !== 'complete') {
    throw ApiError.badRequest('Seuls les paiements complétés peuvent être remboursés');
  }

  await transaction(async (conn) => {
    await conn.execute(
      `UPDATE paiements
       SET statut = 'rembourse',
           details_transaction = JSON_SET(COALESCE(details_transaction, '{}'), '$.motifRemboursement', ?)
       WHERE id = ?`,
      [motif || 'Non spécifié', id]
    );

    // Annuler l'abonnement
    await conn.execute(
      `UPDATE abonnements SET statut = 'annule', motif_annulation = 'Remboursement' WHERE id = ?`,
      [paiement.abonnement_id]
    );

    // Notifier l'utilisateur
    await conn.execute(
      `INSERT INTO notifications (titre, message, type, utilisateur_id)
       VALUES (?, ?, 'info', ?)`,
      [
        'Remboursement effectué',
        `Votre paiement de ${paiement.montant} XOF a été remboursé.`,
        paiement.utilisateur_id
      ]
    );
  });

  res.json({
    success: true,
    message: 'Paiement remboursé'
  });
});

/**
 * Statistiques des paiements (Admin)
 * GET /api/paiements/admin/statistiques
 */
const getStatistiques = asyncHandler(async (req, res) => {
  const { periode = '30' } = req.query;

  // Total des paiements
  const [totalGeneral] = await query(
    `SELECT
       COUNT(*) as nombre_total,
       SUM(CASE WHEN statut = 'complete' THEN montant ELSE 0 END) as montant_total,
       SUM(CASE WHEN statut = 'complete' THEN 1 ELSE 0 END) as paiements_reussis,
       SUM(CASE WHEN statut = 'echoue' THEN 1 ELSE 0 END) as paiements_echoues
     FROM paiements
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [parseInt(periode)]
  );

  // Par méthode de paiement
  const parMethode = await query(
    `SELECT methode, COUNT(*) as nombre, SUM(CASE WHEN statut = 'complete' THEN montant ELSE 0 END) as montant
     FROM paiements
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY methode`,
    [parseInt(periode)]
  );

  // Par jour
  const parJour = await query(
    `SELECT DATE(date_creation) as jour, COUNT(*) as nombre,
            SUM(CASE WHEN statut = 'complete' THEN montant ELSE 0 END) as montant
     FROM paiements
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_creation)
     ORDER BY jour DESC`,
    [parseInt(periode)]
  );

  res.json({
    success: true,
    data: {
      periode: `${periode} jours`,
      general: totalGeneral,
      parMethode,
      parJour
    }
  });
});

module.exports = {
  getAll,
  getById,
  initier,
  verifier,
  webhookOrange,
  webhookMoov,
  webhookWave,
  changeStatut,
  rembourser,
  getStatistiques
};
