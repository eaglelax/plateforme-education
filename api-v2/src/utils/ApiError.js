/**
 * Classe d'erreur personnalisée pour l'API
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }

  static badRequest(message = 'Requête invalide', errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Non authentifié') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Accès non autorisé') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Ressource non trouvée') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflit - Cette ressource existe déjà') {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Trop de requêtes') {
    return new ApiError(429, message);
  }

  static internal(message = 'Erreur interne du serveur') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
