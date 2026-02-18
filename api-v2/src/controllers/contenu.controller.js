const { query } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { associerFichierAContenu } = require('./upload.controller');

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Enregistrer une action dans l'historique des validations
 */
const logValidationAction = async (contenuId, utilisateurId, action, statutAvant, statutApres, commentaire = null) => {
  await query(
    `INSERT INTO historique_validations
     (contenu_id, utilisateur_id, action, statut_avant, statut_apres, commentaire)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [contenuId, utilisateurId, action, statutAvant, statutApres, commentaire]
  );
};

/**
 * Creer une notification
 */
const creerNotification = async (utilisateurId, titre, message, type = 'info', lienAction = null) => {
  await query(
    `INSERT INTO notifications (utilisateur_id, titre, message, type, lien_action)
     VALUES (?, ?, ?, ?, ?)`,
    [utilisateurId, titre, message, type, lienAction]
  );
};

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * Lister les domaines educatifs
 * GET /api/contenus/domaines
 */
const getDomaines = asyncHandler(async (req, res) => {
  const domaines = await query(
    `SELECT d.*,
            (SELECT COUNT(*) FROM contenus WHERE domaine_id = d.id AND statut = 'publie') as contenus_count
     FROM domaines_educatifs d
     WHERE d.est_actif = TRUE
     ORDER BY d.ordre_affichage, d.nom`
  );

  res.json({
    success: true,
    data: domaines
  });
});

/**
 * Lister les contenus publies
 * GET /api/contenus
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { domaineId, type, ageMin, ageMax, premium, search } = req.query;

  let whereClause = "c.statut = 'publie'";
  const params = [];

  if (domaineId) {
    whereClause += ' AND c.domaine_id = ?';
    params.push(domaineId);
  }

  if (type) {
    whereClause += ' AND c.type = ?';
    params.push(type);
  }

  if (ageMin) {
    whereClause += ' AND c.tranche_age_max >= ?';
    params.push(parseInt(ageMin));
  }

  if (ageMax) {
    whereClause += ' AND c.tranche_age_min <= ?';
    params.push(parseInt(ageMax));
  }

  if (premium !== undefined) {
    whereClause += ' AND c.est_premium = ?';
    params.push(premium === 'true');
  }

  if (search) {
    whereClause += ' AND (c.titre LIKE ? OR c.description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (req.user && req.user.type === 'enfant') {
    whereClause += ` AND c.domaine_id IN (
      SELECT domaine_id FROM profils_domaines_autorises
      WHERE enfant_id = ? AND est_autorise = TRUE
    )`;
    params.push(req.user.id);
    whereClause += ' AND c.tranche_age_min <= ? AND c.tranche_age_max >= ?';
    params.push(req.user.age, req.user.age);
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM contenus c WHERE ${whereClause}`,
    params
  );

  const contenus = await query(
    `SELECT c.*, d.nom as domaine_nom, d.icone as domaine_icone,
            n.nom as niveau_nom
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     LEFT JOIN niveaux n ON c.niveau_id = n.id
     WHERE ${whereClause}
     ORDER BY c.date_publication DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: contenus,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Lister tous les contenus (admin/gestionnaire)
 * GET /api/contenus/tous
 */
const getAllAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { domaineId, type, statut, search } = req.query;

  let whereClause = '1=1';
  const params = [];

  // Tous les roles admin voient tous les contenus

  if (statut) {
    whereClause += ' AND c.statut = ?';
    params.push(statut);
  }

  if (domaineId) {
    whereClause += ' AND c.domaine_id = ?';
    params.push(domaineId);
  }

  if (type) {
    whereClause += ' AND c.type = ?';
    params.push(type);
  }

  if (search) {
    whereClause += ' AND (c.titre LIKE ? OR c.description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM contenus c WHERE ${whereClause}`,
    params
  );

  const contenus = await query(
    `SELECT c.*, d.nom as domaine_nom, d.icone as domaine_icone,
            n.nom as niveau_nom,
            u.nom as createur_nom, u.prenom as createur_prenom
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     LEFT JOIN niveaux n ON c.niveau_id = n.id
     LEFT JOIN utilisateurs u ON c.createur_id = u.id
     WHERE ${whereClause}
     ORDER BY c.date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: contenus,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir un contenu par ID
 * GET /api/contenus/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [contenu] = await query(
    `SELECT c.*, d.nom as domaine_nom, d.description as domaine_description,
            n.nom as niveau_nom, n.numero as niveau_numero,
            u.nom as createur_nom, u.prenom as createur_prenom,
            fm.chemin_relatif as media_path, fm.type_mime as media_type,
            fm.duree_secondes as media_duree, fm.taille_octets as media_taille,
            fmini.chemin_relatif as miniature_path
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     LEFT JOIN niveaux n ON c.niveau_id = n.id
     LEFT JOIN utilisateurs u ON c.createur_id = u.id
     LEFT JOIN fichiers_uploades fm ON c.fichier_media_id = fm.id
     LEFT JOIN fichiers_uploades fmini ON c.fichier_miniature_id = fmini.id
     WHERE c.id = ?`,
    [id]
  );

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  // Recuperer le quiz si existe
  let quiz = null;
  const [quizData] = await query('SELECT * FROM quiz WHERE contenu_id = ?', [id]);

  if (quizData) {
    const questions = await query(
      `SELECT q.* FROM questions q WHERE q.quiz_id = ? ORDER BY q.ordre`,
      [quizData.id]
    );

    for (let question of questions) {
      const reponses = await query(
        `SELECT id, texte, est_correcte, ordre FROM reponses WHERE question_id = ? ORDER BY ordre`,
        [question.id]
      );
      question.reponses = reponses;
    }

    quiz = { ...quizData, questions };
  }

  // Incrementer le nombre de vues si publie
  if (contenu.statut === 'publie') {
    await query('UPDATE contenus SET nombre_vues = nombre_vues + 1 WHERE id = ?', [id]);
  }

  res.json({
    success: true,
    data: {
      ...contenu,
      urlMedia: contenu.media_path ? `/uploads/${contenu.media_path}` : contenu.url_media,
      urlMiniature: contenu.miniature_path ? `/uploads/${contenu.miniature_path}` : contenu.url_miniature,
      quiz
    }
  });
});

// ============================================
// ROUTES GESTIONNAIRE DE CONTENU
// ============================================

/**
 * Creer un contenu
 * POST /api/contenus
 */
const create = asyncHandler(async (req, res) => {
  const {
    titre, description, type, domaineId, niveauId,
    trancheAgeMin, trancheAgeMax, pointsXp, estPremium,
    estTelechargeable, mediaFileId, miniatureFileId
  } = req.body;

  // Verifier que le domaine existe
  const [domaine] = await query('SELECT id FROM domaines_educatifs WHERE id = ?', [domaineId]);
  if (!domaine) {
    throw ApiError.notFound('Domaine non trouve');
  }

  // Creer le contenu
  const result = await query(
    `INSERT INTO contenus
     (titre, description, type, domaine_id, niveau_id, tranche_age_min,
      tranche_age_max, points_xp, est_premium, est_telechargeable, createur_id, statut)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brouillon')`,
    [
      titre,
      description || null,
      type,
      domaineId,
      niveauId || null,
      trancheAgeMin || 4,
      trancheAgeMax || 12,
      pointsXp || 10,
      estPremium || false,
      estTelechargeable !== false,
      req.user.id
    ]
  );

  const contenuId = result.insertId;

  // Associer les fichiers si fournis
  let mediaUrl = null;
  let miniatureUrl = null;

  if (mediaFileId) {
    try {
      const mediaResult = await associerFichierAContenu(mediaFileId, contenuId, 'media');
      mediaUrl = mediaResult.url;
      await query('UPDATE contenus SET fichier_media_id = ?, url_media = ? WHERE id = ?',
        [mediaResult.id, mediaUrl, contenuId]);
    } catch (error) {
      console.error('Erreur association media:', error);
    }
  }

  if (miniatureFileId) {
    try {
      const miniatureResult = await associerFichierAContenu(miniatureFileId, contenuId, 'miniature');
      miniatureUrl = miniatureResult.url;
      await query('UPDATE contenus SET fichier_miniature_id = ?, url_miniature = ? WHERE id = ?',
        [miniatureResult.id, miniatureUrl, contenuId]);
    } catch (error) {
      console.error('Erreur association miniature:', error);
    }
  }

  // Logger l'action
  await logValidationAction(contenuId, req.user.id, 'creation', null, 'brouillon');

  res.status(201).json({
    success: true,
    message: 'Contenu cree',
    data: {
      id: contenuId,
      urlMedia: mediaUrl,
      urlMiniature: miniatureUrl
    }
  });
});

/**
 * Modifier un contenu
 * PUT /api/contenus/:id
 */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verifier que le contenu existe et appartient a l'utilisateur
  const [contenu] = await query('SELECT * FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  // Verifier les droits (createur ou admin)
  if (contenu.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Vous ne pouvez modifier que vos propres contenus');
  }

  // Verifier le statut (seuls brouillon et a_amender peuvent etre modifies)
  if (!['brouillon', 'a_amender'].includes(contenu.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie (statut: ' + contenu.statut + ')');
  }

  const allowedFields = [
    'titre', 'description', 'type', 'domaine_id', 'niveau_id',
    'tranche_age_min', 'tranche_age_max', 'points_xp',
    'est_premium', 'est_telechargeable'
  ];

  const fieldMap = {
    domaineId: 'domaine_id',
    niveauId: 'niveau_id',
    trancheAgeMin: 'tranche_age_min',
    trancheAgeMax: 'tranche_age_max',
    pointsXp: 'points_xp',
    estPremium: 'est_premium',
    estTelechargeable: 'est_telechargeable'
  };

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(req.body)) {
    const dbField = fieldMap[key] || key;
    if (allowedFields.includes(dbField) && value !== undefined) {
      updates.push(`${dbField} = ?`);
      values.push(value);
    }
  }

  // Gerer les fichiers
  if (req.body.mediaFileId) {
    const mediaResult = await associerFichierAContenu(req.body.mediaFileId, id, 'media');
    updates.push('fichier_media_id = ?', 'url_media = ?');
    values.push(mediaResult.id, mediaResult.url);
  }

  if (req.body.miniatureFileId) {
    const miniatureResult = await associerFichierAContenu(req.body.miniatureFileId, id, 'miniature');
    updates.push('fichier_miniature_id = ?', 'url_miniature = ?');
    values.push(miniatureResult.id, miniatureResult.url);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnee a mettre a jour');
  }

  values.push(id);
  await query(`UPDATE contenus SET ${updates.join(', ')} WHERE id = ?`, values);

  res.json({
    success: true,
    message: 'Contenu mis a jour'
  });
});

/**
 * Lister mes contenus (gestionnaire)
 * GET /api/contenus/mes-contenus
 */
const getMesContenus = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { statut } = req.query;

  let whereClause = 'c.createur_id = ?';
  const params = [req.user.id];

  if (statut) {
    whereClause += ' AND c.statut = ?';
    params.push(statut);
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM contenus c WHERE ${whereClause}`,
    params
  );

  const contenus = await query(
    `SELECT c.*, d.nom as domaine_nom,
            v.nom as validateur_nom, v.prenom as validateur_prenom
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     LEFT JOIN utilisateurs v ON c.validateur_id = v.id
     WHERE ${whereClause}
     ORDER BY
       CASE c.statut
         WHEN 'a_amender' THEN 1
         WHEN 'valide' THEN 2
         WHEN 'en_attente' THEN 3
         WHEN 'brouillon' THEN 4
         ELSE 5
       END,
       c.date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  // Ajouter des stats
  const stats = await query(
    `SELECT statut, COUNT(*) as count
     FROM contenus WHERE createur_id = ? GROUP BY statut`,
    [req.user.id]
  );

  const statsMap = {};
  stats.forEach(s => { statsMap[s.statut] = s.count; });

  res.json({
    success: true,
    data: contenus.map(c => ({
      ...c,
      validateurNom: c.validateur_nom ? `${c.validateur_prenom} ${c.validateur_nom}` : null
    })),
    stats: {
      brouillon: statsMap.brouillon || 0,
      en_attente: statsMap.en_attente || 0,
      a_amender: statsMap.a_amender || 0,
      valide: statsMap.valide || 0,
      publie: statsMap.publie || 0
    },
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Soumettre un contenu pour validation
 * PUT /api/contenus/:id/soumettre
 */
const soumettre = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [contenu] = await query('SELECT * FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  if (contenu.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Vous ne pouvez soumettre que vos propres contenus');
  }

  if (!['brouillon', 'a_amender'].includes(contenu.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut pas etre soumis (statut: ' + contenu.statut + ')');
  }

  const action = contenu.statut === 'a_amender' ? 'resoumission' : 'soumission';

  await query(
    `UPDATE contenus SET statut = 'en_attente', date_soumission = NOW() WHERE id = ?`,
    [id]
  );

  await logValidationAction(id, req.user.id, action, contenu.statut, 'en_attente');

  // Notifier les validateurs
  const validateurs = await query(
    `SELECT u.id FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE r.nom IN ('VALIDATEUR', 'ADMIN') AND u.statut_compte = 'actif'`
  );

  for (const validateur of validateurs) {
    await creerNotification(
      validateur.id,
      'Nouveau contenu a valider',
      `Le contenu "${contenu.titre}" est en attente de validation.`,
      'info',
      `/contenus/${id}/validation`
    );
  }

  res.json({
    success: true,
    message: 'Contenu soumis pour validation'
  });
});

/**
 * Publier un contenu valide
 * PUT /api/contenus/:id/publier
 */
const publier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [contenu] = await query('SELECT * FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  if (contenu.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Vous ne pouvez publier que vos propres contenus');
  }

  if (contenu.statut !== 'valide') {
    throw ApiError.badRequest('Seuls les contenus valides peuvent etre publies (statut actuel: ' + contenu.statut + ')');
  }

  await query(
    `UPDATE contenus SET statut = 'publie', date_publication = NOW() WHERE id = ?`,
    [id]
  );

  await logValidationAction(id, req.user.id, 'publication', 'valide', 'publie');

  res.json({
    success: true,
    message: 'Contenu publie avec succes'
  });
});

// ============================================
// ROUTES VALIDATEUR
// ============================================

/**
 * Lister les contenus a valider
 * GET /api/contenus/a-valider
 */
const getAValider = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { type, domaineId, statut, mesValidations } = req.query;

  let whereClause = "";
  const params = [];

  // Filtrer par statut ou par mes validations
  if (mesValidations === 'true') {
    // Mes validations: contenus valides par moi
    whereClause = "c.validateur_id = ?";
    params.push(req.user.id);
  } else if (statut === 'all') {
    // Tous les contenus visibles par le validateur
    whereClause = "c.statut IN ('en_attente', 'valide', 'a_amender')";
  } else if (statut && ['en_attente', 'valide', 'a_amender'].includes(statut)) {
    whereClause = "c.statut = ?";
    params.push(statut);
  } else {
    // Par defaut: en attente
    whereClause = "c.statut = 'en_attente'";
  }

  if (type) {
    whereClause += ' AND c.type = ?';
    params.push(type);
  }

  if (domaineId) {
    whereClause += ' AND c.domaine_id = ?';
    params.push(domaineId);
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM contenus c WHERE ${whereClause}`,
    params
  );

  const contenus = await query(
    `SELECT c.*, d.nom as domaine_nom, d.icone as domaine_icone,
            u.nom as createur_nom, u.prenom as createur_prenom,
            fm.chemin_relatif as media_path, fm.type_mime as media_type,
            fm.duree_secondes as media_duree,
            fmini.chemin_relatif as miniature_path
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     LEFT JOIN utilisateurs u ON c.createur_id = u.id
     LEFT JOIN fichiers_uploades fm ON c.fichier_media_id = fm.id
     LEFT JOIN fichiers_uploades fmini ON c.fichier_miniature_id = fmini.id
     WHERE ${whereClause}
     ORDER BY c.date_soumission ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: contenus.map(c => ({
      ...c,
      createurNom: `${c.createur_prenom} ${c.createur_nom}`,
      urlMedia: c.media_path ? `/uploads/${c.media_path}` : c.url_media,
      urlMiniature: c.miniature_path ? `/uploads/${c.miniature_path}` : c.url_miniature
    })),
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Voir le detail d'un contenu pour validation
 * GET /api/contenus/:id/validation
 */
const getForValidation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [contenu] = await query(
    `SELECT c.*, d.nom as domaine_nom, d.description as domaine_description,
            n.nom as niveau_nom, n.numero as niveau_numero,
            u.nom as createur_nom, u.prenom as createur_prenom,
            fm.chemin_relatif as media_path, fm.type_mime as media_type,
            fm.duree_secondes as media_duree, fm.taille_octets as media_taille,
            fmini.chemin_relatif as miniature_path
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     LEFT JOIN niveaux n ON c.niveau_id = n.id
     LEFT JOIN utilisateurs u ON c.createur_id = u.id
     LEFT JOIN fichiers_uploades fm ON c.fichier_media_id = fm.id
     LEFT JOIN fichiers_uploades fmini ON c.fichier_miniature_id = fmini.id
     WHERE c.id = ?`,
    [id]
  );

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  // Recuperer le quiz complet
  let quiz = null;
  const [quizData] = await query('SELECT * FROM quiz WHERE contenu_id = ?', [id]);

  if (quizData) {
    const questions = await query(
      `SELECT q.* FROM questions q WHERE q.quiz_id = ? ORDER BY q.ordre`,
      [quizData.id]
    );

    for (let question of questions) {
      const reponses = await query(
        `SELECT id, texte, est_correcte, ordre FROM reponses WHERE question_id = ? ORDER BY ordre`,
        [question.id]
      );
      question.reponses = reponses;
    }

    quiz = { ...quizData, questions };
  }

  // Historique des validations
  const historique = await query(
    `SELECT hv.*, u.nom, u.prenom
     FROM historique_validations hv
     LEFT JOIN utilisateurs u ON hv.utilisateur_id = u.id
     WHERE hv.contenu_id = ?
     ORDER BY hv.date_action DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...contenu,
      urlMedia: contenu.media_path ? `/uploads/${contenu.media_path}` : contenu.url_media,
      urlMiniature: contenu.miniature_path ? `/uploads/${contenu.miniature_path}` : contenu.url_miniature,
      createur: {
        id: contenu.createur_id,
        nom: contenu.createur_nom,
        prenom: contenu.createur_prenom
      },
      domaine: {
        id: contenu.domaine_id,
        nom: contenu.domaine_nom,
        description: contenu.domaine_description
      },
      niveau: contenu.niveau_id ? {
        id: contenu.niveau_id,
        nom: contenu.niveau_nom,
        numero: contenu.niveau_numero
      } : null,
      quiz,
      historique: historique.map(h => ({
        action: h.action,
        commentaire: h.commentaire,
        statutAvant: h.statut_avant,
        statutApres: h.statut_apres,
        dateAction: h.date_action,
        utilisateur: `${h.prenom} ${h.nom}`
      }))
    }
  });
});

/**
 * Valider un contenu
 * PUT /api/contenus/:id/valider
 */
const valider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { commentaire } = req.body;

  const [contenu] = await query('SELECT * FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  if (contenu.statut !== 'en_attente') {
    throw ApiError.badRequest('Ce contenu ne peut pas etre valide (statut: ' + contenu.statut + ')');
  }

  await query(
    `UPDATE contenus
     SET statut = 'valide',
         validateur_id = ?,
         commentaire_validation = ?,
         date_validation = NOW()
     WHERE id = ?`,
    [req.user.id, commentaire || null, id]
  );

  await logValidationAction(id, req.user.id, 'validation', 'en_attente', 'valide', commentaire);

  // Notifier le createur
  await creerNotification(
    contenu.createur_id,
    'Contenu valide',
    `Votre contenu "${contenu.titre}" a ete valide. Vous pouvez maintenant le publier.`,
    'succes',
    `/mes-contenus`
  );

  res.json({
    success: true,
    message: 'Contenu valide avec succes'
  });
});

/**
 * Renvoyer un contenu pour amendements
 * PUT /api/contenus/:id/amender
 */
const amender = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { commentaire } = req.body;

  if (!commentaire || commentaire.trim().length === 0) {
    throw ApiError.badRequest('Le commentaire est obligatoire pour renvoyer un contenu en amendement');
  }

  const [contenu] = await query('SELECT * FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  if (contenu.statut !== 'en_attente') {
    throw ApiError.badRequest('Ce contenu ne peut pas etre renvoye pour amendement (statut: ' + contenu.statut + ')');
  }

  await query(
    `UPDATE contenus
     SET statut = 'a_amender',
         validateur_id = ?,
         commentaire_validation = ?,
         date_validation = NOW()
     WHERE id = ?`,
    [req.user.id, commentaire, id]
  );

  await logValidationAction(id, req.user.id, 'amendement', 'en_attente', 'a_amender', commentaire);

  // Notifier le createur
  await creerNotification(
    contenu.createur_id,
    'Contenu a amender',
    `Votre contenu "${contenu.titre}" necessite des modifications. Consultez les commentaires du validateur.`,
    'avertissement',
    `/mes-contenus`
  );

  res.json({
    success: true,
    message: 'Contenu renvoye pour amendements'
  });
});

/**
 * Obtenir les statistiques de validation
 * GET /api/contenus/stats-validation
 */
const getStatsValidation = asyncHandler(async (req, res) => {
  const [stats] = await query(`
    SELECT
      (SELECT COUNT(*) FROM contenus WHERE statut = 'en_attente') as en_attente,
      (SELECT COUNT(*) FROM contenus WHERE statut = 'valide') as valides,
      (SELECT COUNT(*) FROM contenus WHERE statut = 'a_amender') as a_amender,
      (SELECT COUNT(*) FROM contenus WHERE statut = 'publie') as publies,
      (SELECT COUNT(*) FROM contenus WHERE validateur_id = ?) as mes_validations
  `, [req.user.id]);

  res.json({
    success: true,
    data: {
      enAttente: stats.en_attente,
      valides: stats.valides,
      aAmender: stats.a_amender,
      publies: stats.publies,
      mesValidations: stats.mes_validations
    }
  });
});

// ============================================
// ROUTES ENFANT
// ============================================

/**
 * Demarrer un contenu
 * POST /api/contenus/:id/demarrer
 */
const demarrer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [contenu] = await query(
    'SELECT * FROM contenus WHERE id = ? AND statut = "publie"',
    [id]
  );

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  const [abonnement] = await query(
    `SELECT a.* FROM abonnements a
     WHERE a.enfant_id = ? AND a.statut IN ('actif', 'periode_grace') AND a.date_fin >= NOW()`,
    [req.user.id]
  );

  if (!abonnement && contenu.est_premium) {
    throw ApiError.forbidden('Abonnement requis pour acceder a ce contenu premium');
  }

  const result = await query(
    `INSERT INTO historique_apprentissage (enfant_id, contenu_id)
     VALUES (?, ?)`,
    [req.user.id, id]
  );

  await query(
    `INSERT INTO sessions_utilisation (enfant_id, type_activite)
     VALUES (?, ?)`,
    [req.user.id, contenu.type]
  );

  res.json({
    success: true,
    message: 'Contenu demarre',
    data: { historiqueId: result.insertId }
  });
});

/**
 * Mettre a jour la progression
 * POST /api/contenus/:id/progression
 */
const updateProgression = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progression, tempsPasse } = req.body;

  await query(
    `UPDATE historique_apprentissage
     SET progression = GREATEST(progression, ?),
         temps_passe_secondes = temps_passe_secondes + ?
     WHERE enfant_id = ? AND contenu_id = ?
     ORDER BY date_acces DESC
     LIMIT 1`,
    [progression, tempsPasse || 0, req.user.id, id]
  );

  res.json({
    success: true,
    message: 'Progression mise a jour'
  });
});

/**
 * Marquer un contenu comme termine
 * POST /api/contenus/:id/terminer
 */
const terminer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  const [contenu] = await query('SELECT points_xp FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  await query(
    `UPDATE historique_apprentissage
     SET progression = 100, est_complete = TRUE, score = ?, points_gagnes = ?
     WHERE enfant_id = ? AND contenu_id = ?
     ORDER BY date_acces DESC
     LIMIT 1`,
    [score || null, contenu.points_xp, req.user.id, id]
  );

  await query(
    `UPDATE profils_enfants SET points_xp = points_xp + ? WHERE id = ?`,
    [contenu.points_xp, req.user.id]
  );

  await query(
    `UPDATE sessions_utilisation
     SET date_fin = NOW(), duree_minutes = TIMESTAMPDIFF(MINUTE, date_debut, NOW())
     WHERE enfant_id = ? AND date_fin IS NULL
     ORDER BY date_debut DESC
     LIMIT 1`,
    [req.user.id]
  );

  res.json({
    success: true,
    message: 'Contenu termine',
    data: { pointsGagnes: contenu.points_xp }
  });
});

// ============================================
// ROUTES ADMIN - DOMAINES
// ============================================

/**
 * Creer un domaine
 * POST /api/contenus/domaines
 */
const createDomaine = asyncHandler(async (req, res) => {
  const { nom, description, icone, couleur, ordreAffichage } = req.body;

  const result = await query(
    `INSERT INTO domaines_educatifs (nom, description, icone, couleur, ordre_affichage)
     VALUES (?, ?, ?, ?, ?)`,
    [nom, description || null, icone || null, couleur || null, ordreAffichage || 0]
  );

  res.status(201).json({
    success: true,
    message: 'Domaine cree',
    data: { id: result.insertId }
  });
});

/**
 * Modifier un domaine
 * PUT /api/contenus/domaines/:id
 */
const updateDomaine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, description, icone, couleur, ordreAffichage, estActif } = req.body;

  const updates = [];
  const values = [];

  if (nom) { updates.push('nom = ?'); values.push(nom); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (icone !== undefined) { updates.push('icone = ?'); values.push(icone); }
  if (couleur !== undefined) { updates.push('couleur = ?'); values.push(couleur); }
  if (ordreAffichage !== undefined) { updates.push('ordre_affichage = ?'); values.push(ordreAffichage); }
  if (estActif !== undefined) { updates.push('est_actif = ?'); values.push(estActif); }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnee a mettre a jour');
  }

  values.push(id);
  await query(`UPDATE domaines_educatifs SET ${updates.join(', ')} WHERE id = ?`, values);

  res.json({
    success: true,
    message: 'Domaine mis a jour'
  });
});

/**
 * Supprimer un contenu
 * DELETE /api/contenus/:id
 */
const deleteContenu = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [contenu] = await query('SELECT id FROM contenus WHERE id = ?', [id]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  await query('DELETE FROM contenus WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Contenu supprime'
  });
});

module.exports = {
  getDomaines,
  getAll,
  getAllAdmin,
  getById,
  create,
  update,
  delete: deleteContenu,
  getMesContenus,
  soumettre,
  publier,
  getAValider,
  getForValidation,
  valider,
  amender,
  getStatsValidation,
  demarrer,
  updateProgression,
  terminer,
  createDomaine,
  updateDomaine
};
