const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const parametreController = require('../controllers/parametreParental.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly } = require('../middlewares/auth');

// Toutes les routes nécessitent une authentification parent
router.use(authenticate);
router.use(parentOnly);

/**
 * @route   GET /api/parametres-parentaux/:enfantId
 * @desc    Obtenir les paramètres parentaux d'un enfant
 * @access  Parent
 */
router.get('/:enfantId',
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  parametreController.get
);

/**
 * @route   PUT /api/parametres-parentaux/:enfantId
 * @desc    Mettre à jour les paramètres parentaux
 * @access  Parent
 */
router.put('/:enfantId',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('tempsMaxQuotidien').optional().isInt({ min: 0, max: 720 }).withMessage('Temps entre 0 et 720 minutes'),
    body('heureDebut').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Format heure invalide (HH:MM:SS)'),
    body('heureFin').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Format heure invalide (HH:MM:SS)'),
    body('modeKiosqueActif').optional().isBoolean(),
    body('pinParental').optional().isLength({ min: 4, max: 6 }).isNumeric()
  ],
  validate,
  parametreController.update
);

/**
 * @route   PUT /api/parametres-parentaux/:enfantId/mode-kiosque
 * @desc    Activer/désactiver le mode kiosque
 * @access  Parent
 */
router.put('/:enfantId/mode-kiosque',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('actif').isBoolean().withMessage('Valeur booléenne requise'),
    body('pinParental').optional().isLength({ min: 4, max: 6 }).isNumeric()
  ],
  validate,
  parametreController.toggleKiosque
);

/**
 * @route   PUT /api/parametres-parentaux/:enfantId/temps-ecran
 * @desc    Configurer les limites de temps d'écran
 * @access  Parent
 */
router.put('/:enfantId/temps-ecran',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('tempsMaxQuotidien').isInt({ min: 0, max: 720 }).withMessage('Temps entre 0 et 720 minutes'),
    body('joursAutorises').optional().isArray().withMessage('Tableau de jours requis')
  ],
  validate,
  parametreController.configTempsEcran
);

/**
 * @route   PUT /api/parametres-parentaux/:enfantId/horaires
 * @desc    Configurer les horaires autorisés
 * @access  Parent
 */
router.put('/:enfantId/horaires',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('heureDebut').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Format heure invalide'),
    body('heureFin').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Format heure invalide')
  ],
  validate,
  parametreController.configHoraires
);

/**
 * @route   POST /api/parametres-parentaux/:enfantId/verifier-pin
 * @desc    Vérifier le PIN parental
 * @access  Parent
 */
router.post('/:enfantId/verifier-pin',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('pin').isLength({ min: 4, max: 6 }).isNumeric().withMessage('PIN invalide')
  ],
  validate,
  parametreController.verifierPin
);

module.exports = router;
