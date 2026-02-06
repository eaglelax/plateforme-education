const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const apkAutoriseeController = require('../controllers/apkAutorisee.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly, adminOnly } = require('../middlewares/auth');

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * @route   GET /api/apk-autorisees/catalogue
 * @desc    Obtenir le catalogue des applications autorisables
 * @access  Public
 */
router.get('/catalogue', apkAutoriseeController.getCatalogue);

// ============================================
// ROUTES PARENT
// ============================================

router.use(authenticate);

/**
 * @route   GET /api/apk-autorisees/:enfantId
 * @desc    Obtenir les APK autorisées pour un enfant
 * @access  Parent
 */
router.get('/:enfantId',
  parentOnly,
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  apkAutoriseeController.getForEnfant
);

/**
 * @route   PUT /api/apk-autorisees/:enfantId
 * @desc    Mettre à jour les APK autorisées
 * @access  Parent
 */
router.put('/:enfantId',
  parentOnly,
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    body('applications').isArray().withMessage('Tableau d\'applications requis')
  ],
  validate,
  apkAutoriseeController.update
);

/**
 * @route   PUT /api/apk-autorisees/:enfantId/:appId
 * @desc    Autoriser/bloquer une application spécifique
 * @access  Parent
 */
router.put('/:enfantId/:appId',
  parentOnly,
  [
    param('enfantId').isInt().withMessage('ID enfant invalide'),
    param('appId').isInt().withMessage('ID application invalide'),
    body('autorise').isBoolean().withMessage('Valeur booléenne requise')
  ],
  validate,
  apkAutoriseeController.toggleApp
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * @route   POST /api/apk-autorisees/catalogue
 * @desc    Ajouter une application au catalogue
 * @access  Admin
 */
router.post('/catalogue',
  adminOnly,
  [
    body('nom').trim().notEmpty().withMessage('Nom requis'),
    body('packageName').trim().notEmpty().withMessage('Package name requis'),
    body('categorie').isIn(['education', 'jeu_educatif', 'utilitaire', 'autre'])
  ],
  validate,
  apkAutoriseeController.addToCatalogue
);

/**
 * @route   PUT /api/apk-autorisees/catalogue/:id
 * @desc    Modifier une application du catalogue
 * @access  Admin
 */
router.put('/catalogue/:id',
  adminOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  apkAutoriseeController.updateCatalogue
);

/**
 * @route   DELETE /api/apk-autorisees/catalogue/:id
 * @desc    Supprimer une application du catalogue
 * @access  Admin
 */
router.delete('/catalogue/:id',
  adminOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  apkAutoriseeController.deleteFromCatalogue
);

module.exports = router;
