const crypto = require('crypto');

/**
 * Génère un code de connexion enfant unique (ENF-XXXXXX)
 * @returns {string} Code au format ENF-XXXXXX
 */
function generateCodeConnexion() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 pour éviter confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ENF-${code}`;
}

/**
 * Génère un mot de passe aléatoire
 * @param {number} length - Longueur du mot de passe
 * @returns {string} Mot de passe généré
 */
function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Génère un PIN à 4 chiffres
 * @returns {string} PIN à 4 chiffres
 */
function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Génère un token unique
 * @param {number} bytes - Nombre d'octets
 * @returns {string} Token hexadécimal
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Génère un UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Calcule la date de fin d'abonnement
 * @param {Date} dateDebut - Date de début
 * @param {string} duree - Durée (MENSUEL, TRIMESTRIEL, ANNUEL)
 * @returns {Date} Date de fin
 */
function calculateDateFin(dateDebut, duree) {
  const date = new Date(dateDebut);
  switch (duree) {
    case 'MENSUEL':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'TRIMESTRIEL':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'ANNUEL':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
}

/**
 * Formate une date pour MySQL
 * @param {Date} date - Date à formater
 * @returns {string} Date au format YYYY-MM-DD HH:MM:SS
 */
function formatDateMySQL(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Vérifie si une date est dans le futur
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean}
 */
function isFutureDate(date) {
  return new Date(date) > new Date();
}

/**
 * Vérifie si une date est passée
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean}
 */
function isPastDate(date) {
  return new Date(date) < new Date();
}

/**
 * Calcule l'âge à partir de la date de naissance
 * @param {Date|string} dateNaissance - Date de naissance
 * @returns {number} Âge en années
 */
function calculateAge(dateNaissance) {
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Détermine la tranche d'âge
 * @param {number} age - Âge de l'enfant
 * @returns {Object} { min, max }
 */
function getTrancheAge(age) {
  if (age >= 4 && age <= 6) return { min: 4, max: 6 };
  if (age >= 7 && age <= 9) return { min: 7, max: 9 };
  if (age >= 10 && age <= 12) return { min: 10, max: 12 };
  return { min: 4, max: 12 }; // Par défaut
}

/**
 * Pagine les résultats
 * @param {number} page - Numéro de page (1-based)
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Object} { offset, limit }
 */
function paginate(page = 1, limit = 10) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return {
    offset: (p - 1) * l,
    limit: l,
    page: p
  };
}

/**
 * Construit les métadonnées de pagination
 * @param {number} total - Nombre total d'éléments
 * @param {number} page - Page actuelle
 * @param {number} limit - Éléments par page
 * @returns {Object} Métadonnées de pagination
 */
function paginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Nettoie un objet en supprimant les valeurs null/undefined
 * @param {Object} obj - Objet à nettoyer
 * @returns {Object} Objet nettoyé
 */
function cleanObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
}

/**
 * Vérifie si un numéro de téléphone est valide (format Burkina Faso)
 * @param {string} telephone - Numéro de téléphone
 * @returns {boolean}
 */
function isValidPhoneBF(telephone) {
  // Format: +226XXXXXXXX ou 226XXXXXXXX ou XXXXXXXX
  const regex = /^(\+?226)?[0-9]{8}$/;
  return regex.test(telephone.replace(/\s/g, ''));
}

/**
 * Formate un numéro de téléphone au format international
 * @param {string} telephone - Numéro de téléphone
 * @returns {string} Numéro formaté
 */
function formatPhoneBF(telephone) {
  const cleaned = telephone.replace(/\D/g, '');
  if (cleaned.startsWith('226')) {
    return '+' + cleaned;
  }
  return '+226' + cleaned;
}

module.exports = {
  generateCodeConnexion,
  generatePassword,
  generatePin,
  generateToken,
  generateUUID,
  calculateDateFin,
  formatDateMySQL,
  isFutureDate,
  isPastDate,
  calculateAge,
  getTrancheAge,
  paginate,
  paginationMeta,
  cleanObject,
  isValidPhoneBF,
  formatPhoneBF
};
