/**
 * Wrapper pour les fonctions async dans les routes Express
 * Capture automatiquement les erreurs et les passe au middleware d'erreur
 * @param {Function} fn - Fonction async (req, res, next)
 * @returns {Function} Fonction middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
