const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const prefController = require('../controllers/preferenceTelechargement.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly } = require('../middlewares/auth');

router.use(authenticate);
router.use(parentOnly);

/**
 * @route   GET /api/preferences-telechargement/:enfantId
 * @desc    Obtenir les préférences de téléchargement
 * @access  Parent
 */
router.get('/:enfantId',
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  prefController.get
);

/**
 * @route   PUT /api/preferences-telechargement/:enfantId
 * @desc    Mettre à jour les préférences de téléchargement
 * @access  Parent
 */
router.put('/:enfantId',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('telechargementAuto').optional().isBoolean(),
    body('wifiUniquement').optional().isBoolean(),
    body('qualiteVideo').optional().isIn(['basse', 'moyenne', 'haute']),
    body('limiteStockageMo').optional().isInt({ min: 100, max: 10240 })
  ],
  validate,
  prefController.update
);

/**
 * @route   GET /api/preferences-telechargement/:enfantId/contenus
 * @desc    Obtenir les contenus téléchargés pour un enfant
 * @access  Parent
 */
router.get('/:enfantId/contenus',
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  prefController.getContenusTelecharges
);

/**
 * @route   DELETE /api/preferences-telechargement/:enfantId/contenus/:contenuId
 * @desc    Supprimer un contenu téléchargé
 * @access  Parent
 */
router.delete('/:enfantId/contenus/:contenuId',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    param('contenuId').isInt().withMessage('ID contenu invalide')
  ],
  validate,
  prefController.supprimerContenuTelecharge
);

module.exports = router;
