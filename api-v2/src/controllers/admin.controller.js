const { query } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Tableau de bord admin
 * GET /api/admin/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  // Compteurs généraux
  const [utilisateurs] = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN statut_compte = 'actif' THEN 1 ELSE 0 END) as actifs,
       SUM(CASE WHEN DATE(date_creation) = CURDATE() THEN 1 ELSE 0 END) as nouveaux_aujourdhui
     FROM utilisateurs`
  );

  const [enfants] = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs
     FROM profils_enfants`
  );

  const [abonnements] = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs,
       SUM(CASE WHEN statut = 'expire' THEN 1 ELSE 0 END) as expires
     FROM abonnements`
  );

  const [contenus] = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN statut = 'publie' THEN 1 ELSE 0 END) as publies,
       SUM(CASE WHEN statut = 'brouillon' THEN 1 ELSE 0 END) as brouillons
     FROM contenus`
  );

  const [paiements] = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN statut = 'complete' THEN montant ELSE 0 END) as revenus_total,
       SUM(CASE WHEN statut = 'complete' AND MONTH(date_paiement) = MONTH(NOW()) THEN montant ELSE 0 END) as revenus_mois
     FROM paiements`
  );

  // Activité récente (7 derniers jours)
  const activiteRecente = await query(
    `SELECT DATE(date_creation) as jour, COUNT(*) as inscriptions
     FROM utilisateurs
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(date_creation)
     ORDER BY jour DESC`
  );

  // Derniers utilisateurs
  const derniersUtilisateurs = await query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.date_creation, r.nom as role
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.date_creation DESC
     LIMIT 5`
  );

  // Derniers paiements
  const derniersPaiements = await query(
    `SELECT p.id, p.montant, p.methode, p.statut, p.date_creation,
            u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
     FROM paiements p
     JOIN utilisateurs u ON p.utilisateur_id = u.id
     ORDER BY p.date_creation DESC
     LIMIT 5`
  );

  res.json({
    success: true,
    data: {
      compteurs: {
        utilisateurs: {
          total: utilisateurs.total,
          actifs: utilisateurs.actifs,
          nouveauxAujourdhui: utilisateurs.nouveaux_aujourdhui
        },
        enfants: {
          total: enfants.total,
          actifs: enfants.actifs
        },
        abonnements: {
          total: abonnements.total,
          actifs: abonnements.actifs,
          expires: abonnements.expires
        },
        contenus: {
          total: contenus.total,
          publies: contenus.publies,
          brouillons: contenus.brouillons
        },
        revenus: {
          total: paiements.revenus_total || 0,
          moisEnCours: paiements.revenus_mois || 0
        }
      },
      activiteRecente,
      derniersUtilisateurs,
      derniersPaiements
    }
  });
});

/**
 * Statistiques utilisateurs
 * GET /api/admin/statistiques/utilisateurs
 */
const getStatsUtilisateurs = asyncHandler(async (req, res) => {
  const { periode = '30' } = req.query;

  // Par statut
  const parStatut = await query(
    `SELECT statut_compte, COUNT(*) as nombre
     FROM utilisateurs
     GROUP BY statut_compte`
  );

  // Par rôle
  const parRole = await query(
    `SELECT r.nom, COUNT(*) as nombre
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     GROUP BY r.id`
  );

  // Inscriptions par jour
  const inscriptionsParJour = await query(
    `SELECT DATE(date_creation) as jour, COUNT(*) as nombre
     FROM utilisateurs
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_creation)
     ORDER BY jour`,
    [parseInt(periode)]
  );

  // Connexions récentes
  const connexionsRecentes = await query(
    `SELECT DATE(derniere_connexion) as jour, COUNT(*) as nombre
     FROM utilisateurs
     WHERE derniere_connexion >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(derniere_connexion)
     ORDER BY jour`,
    [parseInt(periode)]
  );

  res.json({
    success: true,
    data: {
      parStatut,
      parRole,
      inscriptionsParJour,
      connexionsRecentes
    }
  });
});

/**
 * Statistiques abonnements
 * GET /api/admin/statistiques/abonnements
 */
const getStatsAbonnements = asyncHandler(async (req, res) => {
  const { periode = '30' } = req.query;

  // Par statut
  const parStatut = await query(
    `SELECT statut, COUNT(*) as nombre
     FROM abonnements
     GROUP BY statut`
  );

  // Par type
  const parType = await query(
    `SELECT ta.nom, ta.prix, COUNT(*) as nombre
     FROM abonnements a
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     GROUP BY ta.id`
  );

  // Nouveaux abonnements par jour
  const nouveauxParJour = await query(
    `SELECT DATE(date_creation) as jour, COUNT(*) as nombre
     FROM abonnements
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_creation)
     ORDER BY jour`,
    [parseInt(periode)]
  );

  // Expirations à venir
  const expirationsSemaine = await query(
    `SELECT DATE(date_fin) as jour, COUNT(*) as nombre
     FROM abonnements
     WHERE statut = 'actif' AND date_fin BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(date_fin)
     ORDER BY jour`
  );

  // Taux de renouvellement
  const [tauxRenouvellement] = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN renouvellement_auto = TRUE THEN 1 ELSE 0 END) as auto_renouvellement
     FROM abonnements
     WHERE statut = 'actif'`
  );

  res.json({
    success: true,
    data: {
      parStatut,
      parType,
      nouveauxParJour,
      expirationsSemaine,
      tauxRenouvellement: tauxRenouvellement.total > 0
        ? Math.round((tauxRenouvellement.auto_renouvellement / tauxRenouvellement.total) * 100)
        : 0
    }
  });
});

/**
 * Statistiques contenus
 * GET /api/admin/statistiques/contenus
 */
const getStatsContenus = asyncHandler(async (req, res) => {
  // Par type
  const parType = await query(
    `SELECT type, COUNT(*) as nombre,
            SUM(CASE WHEN statut = 'publie' THEN 1 ELSE 0 END) as publies
     FROM contenus
     GROUP BY type`
  );

  // Par domaine
  const parDomaine = await query(
    `SELECT d.nom, d.couleur, COUNT(*) as nombre
     FROM contenus c
     JOIN domaines_educatifs d ON c.domaine_id = d.id
     GROUP BY d.id
     ORDER BY nombre DESC`
  );

  // Les plus vus
  const plusVus = await query(
    `SELECT id, titre, type, nombre_vues, note_moyenne
     FROM contenus
     WHERE statut = 'publie'
     ORDER BY nombre_vues DESC
     LIMIT 10`
  );

  // Les mieux notés
  const mieuxNotes = await query(
    `SELECT id, titre, type, note_moyenne, nombre_vues
     FROM contenus
     WHERE statut = 'publie' AND note_moyenne > 0
     ORDER BY note_moyenne DESC
     LIMIT 10`
  );

  res.json({
    success: true,
    data: {
      parType,
      parDomaine,
      plusVus,
      mieuxNotes
    }
  });
});

/**
 * Statistiques revenus
 * GET /api/admin/statistiques/revenus
 */
const getStatsRevenus = asyncHandler(async (req, res) => {
  const { periode = '30' } = req.query;

  // Total par période
  const [totaux] = await query(
    `SELECT
       SUM(CASE WHEN statut = 'complete' THEN montant ELSE 0 END) as revenus,
       COUNT(CASE WHEN statut = 'complete' THEN 1 END) as paiements_reussis,
       COUNT(CASE WHEN statut = 'echoue' THEN 1 END) as paiements_echoues
     FROM paiements
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [parseInt(periode)]
  );

  // Par méthode de paiement
  const parMethode = await query(
    `SELECT methode, COUNT(*) as nombre,
            SUM(CASE WHEN statut = 'complete' THEN montant ELSE 0 END) as revenus
     FROM paiements
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY methode`,
    [parseInt(periode)]
  );

  // Par jour
  const parJour = await query(
    `SELECT DATE(date_paiement) as jour,
            SUM(montant) as revenus, COUNT(*) as nombre
     FROM paiements
     WHERE statut = 'complete' AND date_paiement >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(date_paiement)
     ORDER BY jour`,
    [parseInt(periode)]
  );

  // Par mois (12 derniers mois)
  const parMois = await query(
    `SELECT DATE_FORMAT(date_paiement, '%Y-%m') as mois,
            SUM(montant) as revenus, COUNT(*) as nombre
     FROM paiements
     WHERE statut = 'complete' AND date_paiement >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY DATE_FORMAT(date_paiement, '%Y-%m')
     ORDER BY mois`
  );

  res.json({
    success: true,
    data: {
      periode: `${periode} jours`,
      totaux: {
        revenus: totaux.revenus || 0,
        paiementsReussis: totaux.paiements_reussis || 0,
        paiementsEchoues: totaux.paiements_echoues || 0
      },
      parMethode,
      parJour,
      parMois
    }
  });
});

/**
 * Journal des actions
 * GET /api/admin/journal
 */
const getJournal = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { action, utilisateurId, dateDebut, dateFin } = req.query;

  let whereClause = '1=1';
  const params = [];

  if (action) {
    whereClause += ' AND ja.action LIKE ?';
    params.push(`%${action}%`);
  }

  if (utilisateurId) {
    whereClause += ' AND ja.utilisateur_id = ?';
    params.push(utilisateurId);
  }

  if (dateDebut) {
    whereClause += ' AND ja.date_action >= ?';
    params.push(dateDebut);
  }

  if (dateFin) {
    whereClause += ' AND ja.date_action <= ?';
    params.push(dateFin);
  }

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM journal_actions ja WHERE ${whereClause}`,
    params
  );

  const journal = await query(
    `SELECT ja.*,
            u.nom as utilisateur_nom, u.prenom as utilisateur_prenom,
            pe.nom_pseudo as enfant_nom
     FROM journal_actions ja
     LEFT JOIN utilisateurs u ON ja.utilisateur_id = u.id
     LEFT JOIN profils_enfants pe ON ja.enfant_id = pe.id
     WHERE ${whereClause}
     ORDER BY ja.date_action DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: journal,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Lister les rôles
 * GET /api/admin/roles
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = await query(
    `SELECT r.*,
            (SELECT COUNT(*) FROM utilisateurs WHERE role_id = r.id) as utilisateurs_count
     FROM roles r
     ORDER BY r.id`
  );

  res.json({
    success: true,
    data: roles
  });
});

module.exports = {
  getDashboard,
  getStatsUtilisateurs,
  getStatsAbonnements,
  getStatsContenus,
  getStatsRevenus,
  getJournal,
  getRoles
};
