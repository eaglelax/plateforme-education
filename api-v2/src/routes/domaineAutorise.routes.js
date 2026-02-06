const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const domaineAutoriseController = require('../controllers/domaineAutorise.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly } = require('../middlewares/auth');

router.use(authenticate);
router.use(parentOnly);

/**
 * @route   GET /api/domaines-autorises/:enfantId
 * @desc    Obtenir les domaines autorisés pour un enfant
 * @access  Parent
 */
router.get('/:enfantId',
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  domaineAutoriseController.get
);

/**
 * @route   PUT /api/domaines-autorises/:enfantId
 * @desc    Mettre à jour les domaines autorisés
 * @access  Parent
 */
router.put('/:enfantId',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('domaines').isArray().withMessage('Tableau de domaines requis'),
    body('domaines.*.domaineId').isInt().withMessage('ID domaine invalide'),
    body('domaines.*.autorise').isBoolean().withMessage('Valeur booléenne requise')
  ],
  validate,
  domaineAutoriseController.update
);

/**
 * @route   PUT /api/domaines-autorises/:enfantId/:domaineId
 * @desc    Autoriser/bloquer un domaine spécifique
 * @access  Parent
 */
router.put('/:enfantId/:domaineId',
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    param('domaineId').isInt().withMessage('ID domaine invalide'),
    body('autorise').isBoolean().withMessage('Valeur booléenne requise')
  ],
  validate,
  domaineAutoriseController.toggleDomaine
);

module.exports = router;
