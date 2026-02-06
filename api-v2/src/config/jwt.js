const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Génère un token d'accès JWT
 * @param {Object} payload - Données à encoder
 * @returns {string} Token JWT
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Génère un token de rafraîchissement
 * @param {Object} payload - Données à encoder
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Vérifie un token d'accès
 * @param {string} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Vérifie un token de rafraîchissement
 * @param {string} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Génère les deux tokens (accès + rafraîchissement)
 * @param {Object} user - Utilisateur
 * @returns {Object} { accessToken, refreshToken }
 */
function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role_nom || user.role,
    type: 'utilisateur'
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: user.id, type: 'utilisateur' })
  };
}

/**
 * Génère un token pour un enfant
 * @param {Object} enfant - Profil enfant
 * @returns {Object} { accessToken, refreshToken }
 */
function generateEnfantTokens(enfant) {
  const payload = {
    id: enfant.id,
    codeConnexion: enfant.code_connexion,
    parentId: enfant.parent_id,
    type: 'enfant'
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: enfant.id, type: 'enfant' })
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  generateEnfantTokens,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
