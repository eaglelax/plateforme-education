const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const {
  generateCodeConnexion,
  generatePassword,
  generatePin,
  getTrancheAge,
  paginate,
  paginationMeta
} = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Vérifie que l'utilisateur a accès à cet enfant
 */
async function verifyAccess(userId, enfantId, userRole) {
  const [enfant] = await query(
    'SELECT * FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  if (!enfant) {
    throw ApiError.notFound('Profil enfant non trouvé');
  }

  // Admin a accès à tout
  if (userRole === 'ADMIN') {
    return enfant;
  }

  // Parent doit être le propriétaire
  if (enfant.parent_id !== userId) {
    throw ApiError.forbidden('Accès non autorisé à ce profil enfant');
  }

  return enfant;
}

/**
 * Lister les enfants
 * GET /api/enfants
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);

  let whereClause = '1=1';
  const params = [];

  // Si parent, ne montrer que ses enfants
  if (req.user.role !== 'ADMIN') {
    whereClause = 'pe.parent_id = ?';
    params.push(req.user.id);
  }

  // Filtres optionnels
  if (req.query.statut) {
    whereClause += ' AND pe.statut = ?';
    params.push(req.query.statut);
  }

  // Compter le total
  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM profils_enfants pe WHERE ${whereClause}`,
    params
  );

  // Récupérer les enfants
  const enfants = await query(
    `SELECT pe.*,
            u.nom as parent_nom, u.prenom as parent_prenom,
            (SELECT COUNT(*) FROM abonnements WHERE enfant_id = pe.id AND statut = 'actif') as abonnement_actif,
            (SELECT COUNT(*) FROM badges_enfants WHERE enfant_id = pe.id) as badges_count
     FROM profils_enfants pe
     JOIN utilisateurs u ON pe.parent_id = u.id
     WHERE ${whereClause}
     ORDER BY pe.date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  // Formater la réponse
  const formattedEnfants = enfants.map(e => ({
    id: e.id,
    nomPseudo: e.nom_pseudo,
    avatar: e.avatar,
    age: e.age,
    trancheAge: { min: e.tranche_age_min, max: e.tranche_age_max },
    statut: e.statut,
    codeConnexion: e.code_connexion,
    modeConnexion: e.mode_connexion,
    pointsXp: e.points_xp,
    niveauGlobal: e.niveau_global,
    abonnementActif: e.abonnement_actif > 0,
    badgesCount: e.badges_count,
    dateCreation: e.date_creation,
    parent: req.user.role === 'ADMIN' ? {
      id: e.parent_id,
      nom: e.parent_nom,
      prenom: e.parent_prenom
    } : undefined
  }));

  res.json({
    success: true,
    data: formattedEnfants,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Créer un profil enfant
 * POST /api/enfants
 */
const create = asyncHandler(async (req, res) => {
  const { nomPseudo, age, avatar, modeConnexion } = req.body;

  // Calculer la tranche d'âge
  const tranche = getTrancheAge(age);

  // Générer le code de connexion unique
  let codeConnexion;
  let codeExists = true;
  while (codeExists) {
    codeConnexion = generateCodeConnexion();
    const [existing] = await query(
      'SELECT id FROM profils_enfants WHERE code_connexion = ?',
      [codeConnexion]
    );
    codeExists = !!existing;
  }

  // Générer le mot de passe
  const motDePasseClair = generatePassword(8);
  const motDePasseHash = await bcrypt.hash(motDePasseClair, 12);

  // Générer un PIN si mode PIN demandé
  let pinSimplifie = null;
  if (modeConnexion === 'pin' || age <= 6) {
    pinSimplifie = generatePin();
  }

  // Créer le profil
  const result = await query(
    `INSERT INTO profils_enfants
     (nom_pseudo, avatar, age, tranche_age_min, tranche_age_max, code_connexion,
      mot_de_passe_enfant, pin_simplifie, mode_connexion, parent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nomPseudo,
      avatar || null,
      age,
      tranche.min,
      tranche.max,
      codeConnexion,
      motDePasseHash,
      pinSimplifie,
      modeConnexion || (age <= 6 ? 'pin' : 'mot_de_passe'),
      req.user.id
    ]
  );

  // Créer les paramètres parentaux par défaut
  await query(
    `INSERT INTO parametres_parentaux (enfant_id) VALUES (?)`,
    [result.insertId]
  );

  // Créer les préférences de téléchargement par défaut
  await query(
    `INSERT INTO preferences_telechargement (enfant_id) VALUES (?)`,
    [result.insertId]
  );

  // Autoriser tous les domaines éducatifs par défaut
  const domaines = await query('SELECT id FROM domaines_educatifs WHERE est_actif = TRUE');
  for (const domaine of domaines) {
    await query(
      `INSERT INTO profils_domaines_autorises (enfant_id, domaine_id) VALUES (?, ?)`,
      [result.insertId, domaine.id]
    );
  }

  res.status(201).json({
    success: true,
    message: 'Profil enfant créé avec succès',
    data: {
      id: result.insertId,
      nomPseudo,
      age,
      codeConnexion,
      // Retourner le mot de passe en clair une seule fois à la création
      identifiants: {
        codeConnexion,
        motDePasse: motDePasseClair,
        pin: pinSimplifie,
        modeConnexion: modeConnexion || (age <= 6 ? 'pin' : 'mot_de_passe')
      }
    }
  });
});

/**
 * Obtenir un profil enfant
 * GET /api/enfants/:id
 */
const getById = asyncHandler(async (req, res) => {
  const enfant = await verifyAccess(req.user.id, req.params.id, req.user.role);

  // Récupérer l'abonnement actif
  const [abonnement] = await query(
    `SELECT a.*, ta.nom as type_nom, ta.prix
     FROM abonnements a
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     WHERE a.enfant_id = ? AND a.statut IN ('actif', 'periode_grace')
     ORDER BY a.date_fin DESC
     LIMIT 1`,
    [req.params.id]
  );

  // Récupérer les badges
  const badges = await query(
    `SELECT b.*, be.date_obtention
     FROM badges b
     JOIN badges_enfants be ON b.id = be.badge_id
     WHERE be.enfant_id = ?
     ORDER BY be.date_obtention DESC`,
    [req.params.id]
  );

  // Récupérer les paramètres parentaux
  const [parametres] = await query(
    'SELECT * FROM parametres_parentaux WHERE enfant_id = ?',
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      id: enfant.id,
      nomPseudo: enfant.nom_pseudo,
      avatar: enfant.avatar,
      age: enfant.age,
      trancheAge: { min: enfant.tranche_age_min, max: enfant.tranche_age_max },
      statut: enfant.statut,
      codeConnexion: enfant.code_connexion,
      modeConnexion: enfant.mode_connexion,
      pointsXp: enfant.points_xp,
      niveauGlobal: enfant.niveau_global,
      dateCreation: enfant.date_creation,
      abonnement: abonnement ? {
        id: abonnement.id,
        type: abonnement.type_nom,
        prix: abonnement.prix,
        dateDebut: abonnement.date_debut,
        dateFin: abonnement.date_fin,
        statut: abonnement.statut,
        renouvellementAuto: abonnement.renouvellement_auto
      } : null,
      badges,
      parametresParentaux: parametres ? {
        tempsMaxQuotidien: parametres.temps_max_quotidien,
        heureDebut: parametres.heure_debut_autorise,
        heureFin: parametres.heure_fin_autorise,
        modeKiosqueActif: parametres.mode_kiosque_actif
      } : null
    }
  });
});

/**
 * Mettre à jour un profil enfant
 * PUT /api/enfants/:id
 */
const update = asyncHandler(async (req, res) => {
  await verifyAccess(req.user.id, req.params.id, req.user.role);

  const { nomPseudo, age, avatar, statut } = req.body;

  const updates = [];
  const values = [];

  if (nomPseudo) {
    updates.push('nom_pseudo = ?');
    values.push(nomPseudo);
  }
  if (age) {
    const tranche = getTrancheAge(age);
    updates.push('age = ?, tranche_age_min = ?, tranche_age_max = ?');
    values.push(age, tranche.min, tranche.max);
  }
  if (avatar !== undefined) {
    updates.push('avatar = ?');
    values.push(avatar || null);
  }
  if (statut && req.user.role === 'ADMIN') {
    updates.push('statut = ?');
    values.push(statut);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(req.params.id);

  await query(
    `UPDATE profils_enfants SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Profil mis à jour'
  });
});

/**
 * Supprimer un profil enfant
 * DELETE /api/enfants/:id
 */
const deleteEnfant = asyncHandler(async (req, res) => {
  await verifyAccess(req.user.id, req.params.id, req.user.role);

  await query('DELETE FROM profils_enfants WHERE id = ?', [req.params.id]);

  res.json({
    success: true,
    message: 'Profil enfant supprimé'
  });
});

/**
 * Régénérer le mot de passe d'un enfant
 * POST /api/enfants/:id/regenerer-mot-de-passe
 */
const regenererMotDePasse = asyncHandler(async (req, res) => {
  const enfant = await verifyAccess(req.user.id, req.params.id, req.user.role);

  // Générer un nouveau mot de passe
  const nouveauMotDePasse = generatePassword(8);
  const hash = await bcrypt.hash(nouveauMotDePasse, 12);

  await query(
    'UPDATE profils_enfants SET mot_de_passe_enfant = ?, tentatives_echouees = 0, date_blocage = NULL WHERE id = ?',
    [hash, req.params.id]
  );

  res.json({
    success: true,
    message: 'Mot de passe régénéré',
    data: {
      codeConnexion: enfant.code_connexion,
      nouveauMotDePasse
    }
  });
});

/**
 * Configurer le PIN simplifié
 * PUT /api/enfants/:id/pin
 */
const configurerPin = asyncHandler(async (req, res) => {
  await verifyAccess(req.user.id, req.params.id, req.user.role);

  const { pin } = req.body;

  await query(
    'UPDATE profils_enfants SET pin_simplifie = ? WHERE id = ?',
    [pin, req.params.id]
  );

  res.json({
    success: true,
    message: 'PIN configuré'
  });
});

/**
 * Changer le mode de connexion
 * PUT /api/enfants/:id/mode-connexion
 */
const changerModeConnexion = asyncHandler(async (req, res) => {
  const enfant = await verifyAccess(req.user.id, req.params.id, req.user.role);

  const { mode } = req.body;

  // Si passage en mode PIN, vérifier qu'un PIN existe
  if (mode === 'pin' && !enfant.pin_simplifie) {
    throw ApiError.badRequest('Veuillez d\'abord configurer un PIN');
  }

  await query(
    'UPDATE profils_enfants SET mode_connexion = ? WHERE id = ?',
    [mode, req.params.id]
  );

  res.json({
    success: true,
    message: `Mode de connexion changé en ${mode}`
  });
});

/**
 * Obtenir les identifiants de connexion
 * GET /api/enfants/:id/identifiants
 */
const getIdentifiants = asyncHandler(async (req, res) => {
  const enfant = await verifyAccess(req.user.id, req.params.id, req.user.role);

  res.json({
    success: true,
    data: {
      codeConnexion: enfant.code_connexion,
      modeConnexion: enfant.mode_connexion,
      pinConfigure: !!enfant.pin_simplifie,
      pin: enfant.pin_simplifie // Le parent peut voir le PIN
    }
  });
});

/**
 * Obtenir la progression d'un enfant
 * GET /api/enfants/:id/progression
 */
const getProgression = asyncHandler(async (req, res) => {
  await verifyAccess(req.user.id, req.params.id, req.user.role);

  // Progression par domaine
  const progressionParDomaine = await query(
    `SELECT de.id, de.nom,
            COUNT(DISTINCT ha.contenu_id) as contenus_vus,
            SUM(ha.points_gagnes) as points_totaux,
            AVG(ha.progression) as progression_moyenne
     FROM domaines_educatifs de
     LEFT JOIN contenus c ON c.domaine_id = de.id
     LEFT JOIN historique_apprentissage ha ON ha.contenu_id = c.id AND ha.enfant_id = ?
     WHERE de.est_actif = TRUE
     GROUP BY de.id, de.nom`,
    [req.params.id]
  );

  // Statistiques globales
  const [stats] = await query(
    `SELECT
       COUNT(DISTINCT ha.contenu_id) as contenus_completes,
       SUM(ha.temps_passe_secondes) / 60 as temps_total_minutes,
       SUM(ha.points_gagnes) as points_totaux,
       AVG(ha.score) as score_moyen
     FROM historique_apprentissage ha
     WHERE ha.enfant_id = ? AND ha.est_complete = TRUE`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      global: {
        contenusCompletes: stats.contenus_completes || 0,
        tempsTotalMinutes: Math.round(stats.temps_total_minutes || 0),
        pointsTotaux: stats.points_totaux || 0,
        scoreMoyen: Math.round(stats.score_moyen || 0)
      },
      parDomaine: progressionParDomaine
    }
  });
});

/**
 * Obtenir les badges d'un enfant
 * GET /api/enfants/:id/badges
 */
const getBadges = asyncHandler(async (req, res) => {
  // Permettre à l'enfant de voir ses propres badges
  if (req.user.type === 'enfant' && req.user.id !== parseInt(req.params.id)) {
    throw ApiError.forbidden('Accès non autorisé');
  } else if (req.user.type !== 'enfant') {
    await verifyAccess(req.user.id, req.params.id, req.user.role);
  }

  const badges = await query(
    `SELECT b.*, be.date_obtention
     FROM badges b
     JOIN badges_enfants be ON b.id = be.badge_id
     WHERE be.enfant_id = ?
     ORDER BY be.date_obtention DESC`,
    [req.params.id]
  );

  // Badges non encore obtenus
  const badgesManquants = await query(
    `SELECT b.*
     FROM badges b
     WHERE b.est_actif = TRUE
       AND b.id NOT IN (SELECT badge_id FROM badges_enfants WHERE enfant_id = ?)`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      obtenus: badges,
      manquants: badgesManquants
    }
  });
});

/**
 * Obtenir les statistiques de temps d'écran
 * GET /api/enfants/:id/temps-ecran
 */
const getTempsEcran = asyncHandler(async (req, res) => {
  await verifyAccess(req.user.id, req.params.id, req.user.role);

  const { periode = '7' } = req.query; // 7 jours par défaut

  // Temps par jour
  const tempsParJour = await query(
    `SELECT DATE(date_debut) as jour, SUM(duree_minutes) as minutes
     FROM sessions_utilisation
     WHERE enfant_id = ? AND date_debut >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_debut)
     ORDER BY jour DESC`,
    [req.params.id, parseInt(periode)]
  );

  // Temps par type d'activité
  const tempsParActivite = await query(
    `SELECT type_activite, SUM(duree_minutes) as minutes
     FROM sessions_utilisation
     WHERE enfant_id = ? AND date_debut >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY type_activite`,
    [req.params.id, parseInt(periode)]
  );

  // Total sur la période
  const [total] = await query(
    `SELECT SUM(duree_minutes) as total_minutes
     FROM sessions_utilisation
     WHERE enfant_id = ? AND date_debut >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [req.params.id, parseInt(periode)]
  );

  res.json({
    success: true,
    data: {
      periode: `${periode} jours`,
      totalMinutes: total.total_minutes || 0,
      moyenneQuotidienne: Math.round((total.total_minutes || 0) / parseInt(periode)),
      parJour: tempsParJour,
      parActivite: tempsParActivite
    }
  });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  delete: deleteEnfant,
  regenererMotDePasse,
  configurerPin,
  changerModeConnexion,
  getIdentifiants,
  getProgression,
  getBadges,
  getTempsEcran
};
