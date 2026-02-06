const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../config/database');

/**
 * Middleware d'authentification JWT
 * Vérifie le token et attache l'utilisateur à la requête
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Vérifier si c'est un utilisateur ou un enfant
    if (decoded.type === 'enfant') {
      const [enfant] = await query(
        `SELECT pe.*, u.id as parent_id, u.email as parent_email
         FROM profils_enfants pe
         JOIN utilisateurs u ON pe.parent_id = u.id
         WHERE pe.id = ? AND pe.statut = 'actif'`,
        [decoded.id]
      );

      if (!enfant) {
        return res.status(401).json({
          success: false,
          message: 'Profil enfant non trouvé ou inactif'
        });
      }

      req.user = {
        ...enfant,
        type: 'enfant',
        role: 'ENFANT'
      };
    } else {
      // Utilisateur standard (parent ou admin)
      const [user] = await query(
        `SELECT u.*, r.nom as role_nom
         FROM utilisateurs u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ? AND u.statut_compte = 'actif'`,
        [decoded.id]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé ou compte inactif'
        });
      }

      // Ne pas renvoyer le mot de passe
      delete user.mot_de_passe;
      req.user = {
        ...user,
        type: 'utilisateur',
        role: user.role_nom
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
}

/**
 * Middleware optionnel - n'échoue pas si pas de token
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);

      if (decoded.type === 'enfant') {
        const [enfant] = await query(
          'SELECT * FROM profils_enfants WHERE id = ?',
          [decoded.id]
        );
        if (enfant) {
          req.user = { ...enfant, type: 'enfant', role: 'ENFANT' };
        }
      } else {
        const [user] = await query(
          `SELECT u.*, r.nom as role_nom FROM utilisateurs u
           JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
          [decoded.id]
        );
        if (user) {
          delete user.mot_de_passe;
          req.user = { ...user, type: 'utilisateur', role: user.role_nom };
        }
      }
    }
  } catch (error) {
    // Ignorer les erreurs de token
  }
  next();
}

/**
 * Middleware de vérification de rôle
 * @param  {...string} roles - Rôles autorisés
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour ce rôle'
      });
    }

    next();
  };
}

/**
 * Middleware admin uniquement
 */
const adminOnly = authorize('ADMIN');

/**
 * Middleware parent uniquement
 */
const parentOnly = authorize('PARENT');

/**
 * Middleware parent ou admin
 */
const parentOrAdmin = authorize('PARENT', 'ADMIN');

/**
 * Middleware enfant uniquement
 */
const enfantOnly = authorize('ENFANT');

/**
 * Middleware validateur ou admin
 */
const validateurOrAdmin = authorize('VALIDATEUR', 'ADMIN');

/**
 * Middleware gestionnaire de contenu ou admin
 */
const gestionnaireOrAdmin = authorize('GESTIONNAIRE_CONTENU', 'ADMIN');

/**
 * Middleware pour tous les roles admin (admin, validateur, gestionnaire)
 */
const adminRoles = authorize('ADMIN', 'VALIDATEUR', 'GESTIONNAIRE_CONTENU');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  parentOnly,
  parentOrAdmin,
  enfantOnly,
  validateurOrAdmin,
  gestionnaireOrAdmin,
  adminRoles
};
