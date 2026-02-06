const { validationResult } = require('express-validator');

/**
 * Middleware de validation des requêtes
 * À utiliser après les règles express-validator
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: formattedErrors
    });
  }

  next();
}

module.exports = validate;
