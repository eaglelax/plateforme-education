const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const abonnementController = require('../controllers/abonnement.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly, adminOnly } = require('../middlewares/auth');

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * @route   GET /api/abonnements/types
 * @desc    Lister les types d'abonnements disponibles
 * @access  Public
 */
router.get('/types', abonnementController.getTypes);

// ============================================
// ROUTES PROTÉGÉES
// ============================================

router.use(authenticate);

/**
 * @route   GET /api/abonnements
 * @desc    Lister ses abonnements (parent) ou tous (admin)
 * @access  Private
 */
router.get('/', abonnementController.getAll);

/**
 * @route   GET /api/abonnements/:id
 * @desc    Obtenir un abonnement
 * @access  Private
 */
router.get('/:id',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  abonnementController.getById
);

/**
 * @route   POST /api/abonnements
 * @desc    Souscrire un abonnement pour un enfant
 * @access  Parent
 */
router.post('/',
  parentOnly,
  [
    body('enfantId').isInt().withMessage('ID enfant requis'),
    body('typeAbonnementId').isInt().withMessage('Type d\'abonnement requis')
  ],
  validate,
  abonnementController.create
);

/**
 * @route   PUT /api/abonnements/:id/renouvellement
 * @desc    Activer/désactiver le renouvellement automatique
 * @access  Parent
 */
router.put('/:id/renouvellement',
  parentOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('actif').isBoolean().withMessage('Valeur booléenne requise')
  ],
  validate,
  abonnementController.toggleRenouvellement
);

/**
 * @route   POST /api/abonnements/:id/annuler
 * @desc    Annuler un abonnement
 * @access  Parent
 */
router.post('/:id/annuler',
  parentOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('motif').optional().isString()
  ],
  validate,
  abonnementController.annuler
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * @route   POST /api/abonnements/types
 * @desc    Créer un type d'abonnement
 * @access  Admin
 */
router.post('/types',
  adminOnly,
  [
    body('nom').trim().notEmpty().withMessage('Nom requis'),
    body('prix').isFloat({ min: 0 }).withMessage('Prix invalide'),
    body('duree').isIn(['MENSUEL', 'TRIMESTRIEL', 'ANNUEL']).withMessage('Durée invalide')
  ],
  validate,
  abonnementController.createType
);

/**
 * @route   PUT /api/abonnements/types/:id
 * @desc    Modifier un type d'abonnement
 * @access  Admin
 */
router.put('/types/:id',
  adminOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  abonnementController.updateType
);

/**
 * @route   PUT /api/abonnements/:id/statut
 * @desc    Changer le statut d'un abonnement
 * @access  Admin
 */
router.put('/:id/statut',
  adminOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('statut').isIn(['actif', 'expire', 'annule', 'suspendu', 'periode_grace']).withMessage('Statut invalide')
  ],
  validate,
  abonnementController.changeStatut
);

// ============================================
// ROUTES DOMAINES PAR PACK (Amendement #10)
// ============================================

/**
 * @route   GET /api/abonnements/types/:id/domaines
 * @desc    Lister les domaines inclus dans un pack
 * @access  Private (tout utilisateur authentifie)
 */
router.get('/types/:id/domaines',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  abonnementController.getPackDomaines
);

/**
 * @route   PUT /api/abonnements/types/:id/domaines
 * @desc    Configurer les domaines inclus dans un pack
 * @access  Admin
 */
router.put('/types/:id/domaines',
  adminOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('domaineIds').isArray().withMessage('domaineIds doit etre un tableau')
  ],
  validate,
  abonnementController.setPackDomaines
);

/**
 * @route   GET /api/abonnements/:id/domaines
 * @desc    Lister les domaines accessibles d'un abonnement (snapshot)
 * @access  Private (proprietaire ou admin)
 */
router.get('/:id/domaines',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  abonnementController.getAbonnementDomaines
);

module.exports = router;
