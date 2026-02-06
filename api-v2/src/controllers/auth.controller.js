const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateTokens, generateEnfantTokens, verifyRefreshToken } = require('../config/jwt');
const { generateToken } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Inscription d'un nouveau parent
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, email, motDePasse } = req.body;

  // Vérifier si le téléphone existe déjà
  const [existingPhone] = await query(
    'SELECT id FROM utilisateurs WHERE telephone = ?',
    [telephone]
  );
  if (existingPhone) {
    throw ApiError.conflict('Ce numéro de téléphone est déjà utilisé');
  }

  // Vérifier si l'email existe déjà
  if (email) {
    const [existingEmail] = await query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );
    if (existingEmail) {
      throw ApiError.conflict('Cet email est déjà utilisé');
    }
  }

  // Récupérer l'ID du rôle PARENT
  const [roleParent] = await query(
    'SELECT id FROM roles WHERE nom = ?',
    ['PARENT']
  );
  if (!roleParent) {
    throw ApiError.internal('Rôle PARENT non trouvé');
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(motDePasse, 12);

  // Créer l'utilisateur
  const result = await query(
    `INSERT INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nom, prenom, telephone, email || null, hashedPassword, roleParent.id]
  );

  // Récupérer l'utilisateur créé
  const [user] = await query(
    `SELECT u.id, u.nom, u.prenom, u.telephone, u.email, u.statut_compte, r.nom as role
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [result.insertId]
  );

  // Générer les tokens
  const tokens = generateTokens(user);

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: {
      utilisateur: user,
      ...tokens
    }
  });
});

/**
 * Connexion utilisateur (parent/admin)
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { identifiant, motDePasse } = req.body;

  // Rechercher l'utilisateur par email ou téléphone
  const [user] = await query(
    `SELECT u.*, r.nom as role_nom
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE (u.email = ? OR u.telephone = ?) AND u.statut_compte = 'actif'`,
    [identifiant, identifiant]
  );

  if (!user) {
    throw ApiError.unauthorized('Identifiants incorrects');
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(motDePasse, user.mot_de_passe);
  if (!isValidPassword) {
    throw ApiError.unauthorized('Identifiants incorrects');
  }

  // Mettre à jour la dernière connexion
  await query(
    'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
    [user.id]
  );

  // Générer les tokens
  const tokens = generateTokens(user);

  // Préparer la réponse (sans le mot de passe)
  delete user.mot_de_passe;

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      utilisateur: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        email: user.email,
        role: user.role_nom,
        statutCompte: user.statut_compte
      },
      ...tokens
    }
  });
});

/**
 * Connexion enfant avec code + mot de passe/PIN
 * POST /api/auth/login-enfant
 */
const loginEnfant = asyncHandler(async (req, res) => {
  const { codeConnexion, motDePasse, pin } = req.body;

  // Rechercher l'enfant par code de connexion
  const [enfant] = await query(
    `SELECT pe.*, u.telephone as parent_telephone, u.email as parent_email
     FROM profils_enfants pe
     JOIN utilisateurs u ON pe.parent_id = u.id
     WHERE pe.code_connexion = ?`,
    [codeConnexion]
  );

  if (!enfant) {
    throw ApiError.unauthorized('Code de connexion invalide');
  }

  // Vérifier si le compte est bloqué
  if (enfant.date_blocage && new Date(enfant.date_blocage) > new Date()) {
    const minutesRestantes = Math.ceil((new Date(enfant.date_blocage) - new Date()) / 60000);
    throw ApiError.tooManyRequests(`Compte bloqué. Réessayez dans ${minutesRestantes} minute(s)`);
  }

  // Vérifier le statut
  if (enfant.statut !== 'actif') {
    throw ApiError.forbidden('Ce profil enfant est inactif');
  }

  // Vérifier l'authentification selon le mode
  let isValid = false;

  if (enfant.mode_connexion === 'pin' && pin) {
    isValid = enfant.pin_simplifie === pin;
  } else if (motDePasse) {
    isValid = await bcrypt.compare(motDePasse, enfant.mot_de_passe_enfant);
  }

  if (!isValid) {
    // Incrémenter les tentatives échouées
    const tentatives = (enfant.tentatives_echouees || 0) + 1;

    if (tentatives >= 5) {
      // Bloquer pour 15 minutes
      await query(
        'UPDATE profils_enfants SET tentatives_echouees = ?, date_blocage = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
        [tentatives, enfant.id]
      );
      throw ApiError.tooManyRequests('Trop de tentatives. Compte bloqué pour 15 minutes');
    } else {
      await query(
        'UPDATE profils_enfants SET tentatives_echouees = ? WHERE id = ?',
        [tentatives, enfant.id]
      );
    }

    throw ApiError.unauthorized('Mot de passe ou PIN incorrect');
  }

  // Réinitialiser les tentatives échouées
  await query(
    'UPDATE profils_enfants SET tentatives_echouees = 0, date_blocage = NULL WHERE id = ?',
    [enfant.id]
  );

  // Vérifier si l'enfant a un abonnement actif
  const [abonnement] = await query(
    `SELECT a.*, ta.nom as type_nom
     FROM abonnements a
     JOIN types_abonnements ta ON a.type_abonnement_id = ta.id
     WHERE a.enfant_id = ? AND a.statut IN ('actif', 'periode_grace') AND a.date_fin >= NOW()
     ORDER BY a.date_fin DESC
     LIMIT 1`,
    [enfant.id]
  );

  // Générer les tokens
  const tokens = generateEnfantTokens(enfant);

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      enfant: {
        id: enfant.id,
        nomPseudo: enfant.nom_pseudo,
        avatar: enfant.avatar,
        age: enfant.age,
        codeConnexion: enfant.code_connexion,
        pointsXp: enfant.points_xp,
        niveauGlobal: enfant.niveau_global
      },
      abonnement: abonnement ? {
        id: abonnement.id,
        type: abonnement.type_nom,
        dateFin: abonnement.date_fin,
        statut: abonnement.statut
      } : null,
      ...tokens
    }
  });
});

/**
 * Renouveler le token d'accès
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  // Vérifier le refresh token
  const decoded = verifyRefreshToken(token);

  if (decoded.type === 'enfant') {
    const [enfant] = await query(
      'SELECT * FROM profils_enfants WHERE id = ? AND statut = "actif"',
      [decoded.id]
    );

    if (!enfant) {
      throw ApiError.unauthorized('Session invalide');
    }

    const tokens = generateEnfantTokens(enfant);

    res.json({
      success: true,
      data: tokens
    });
  } else {
    const [user] = await query(
      `SELECT u.*, r.nom as role_nom FROM utilisateurs u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.statut_compte = 'actif'`,
      [decoded.id]
    );

    if (!user) {
      throw ApiError.unauthorized('Session invalide');
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      data: tokens
    });
  }
});

/**
 * Obtenir le profil de l'utilisateur connecté
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  if (req.user.type === 'enfant') {
    // Récupérer les infos complètes de l'enfant
    const [enfant] = await query(
      `SELECT pe.*,
              (SELECT COUNT(*) FROM badges_enfants WHERE enfant_id = pe.id) as badges_count
       FROM profils_enfants pe
       WHERE pe.id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        type: 'enfant',
        profil: {
          id: enfant.id,
          nomPseudo: enfant.nom_pseudo,
          avatar: enfant.avatar,
          age: enfant.age,
          codeConnexion: enfant.code_connexion,
          pointsXp: enfant.points_xp,
          niveauGlobal: enfant.niveau_global,
          badgesCount: enfant.badges_count
        }
      }
    });
  } else {
    // Récupérer les infos de l'utilisateur avec le nombre d'enfants
    const [user] = await query(
      `SELECT u.id, u.nom, u.prenom, u.telephone, u.email, u.statut_compte, r.nom as role,
              (SELECT COUNT(*) FROM profils_enfants WHERE parent_id = u.id) as enfants_count
       FROM utilisateurs u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        type: 'utilisateur',
        profil: user
      }
    });
  }
});

/**
 * Déconnexion
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // Pour une déconnexion complète côté serveur, on pourrait:
  // - Invalider le refresh token en BDD
  // - Fermer les sessions actives
  // Ici on renvoie simplement un succès (le client supprime les tokens)

  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/**
 * Changer le mot de passe
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { ancienMotDePasse, nouveauMotDePasse } = req.body;

  if (req.user.type === 'enfant') {
    throw ApiError.forbidden('Les enfants ne peuvent pas changer leur mot de passe');
  }

  // Récupérer l'utilisateur avec son mot de passe
  const [user] = await query(
    'SELECT mot_de_passe FROM utilisateurs WHERE id = ?',
    [req.user.id]
  );

  // Vérifier l'ancien mot de passe
  const isValid = await bcrypt.compare(ancienMotDePasse, user.mot_de_passe);
  if (!isValid) {
    throw ApiError.unauthorized('Ancien mot de passe incorrect');
  }

  // Hasher et mettre à jour le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 12);
  await query(
    'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
    [hashedPassword, req.user.id]
  );

  res.json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
});

module.exports = {
  register,
  login,
  loginEnfant,
  refreshToken,
  getMe,
  logout,
  changePassword
};
