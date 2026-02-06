const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const paiementController = require('../controllers/paiement.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly, adminOnly } = require('../middlewares/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ============================================
// ROUTES PARENT
// ============================================

/**
 * @route   GET /api/paiements
 * @desc    Lister ses paiements (parent) ou tous (admin)
 * @access  Private
 */
router.get('/', paiementController.getAll);

/**
 * @route   GET /api/paiements/:id
 * @desc    Obtenir un paiement
 * @access  Private
 */
router.get('/:id',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  paiementController.getById
);

/**
 * @route   POST /api/paiements
 * @desc    Initier un paiement Mobile Money
 * @access  Parent
 */
router.post('/',
  parentOnly,
  [
    body('abonnementId').isInt().withMessage('ID abonnement requis'),
    body('methode').isIn(['orange_money', 'moov_money', 'wave']).withMessage('Méthode de paiement invalide'),
    body('numeroTelephone')
      .matches(/^(\+?226)?[0-9]{8}$/)
      .withMessage('Numéro de téléphone invalide')
  ],
  validate,
  paiementController.initier
);

/**
 * @route   POST /api/paiements/:id/verifier
 * @desc    Vérifier le statut d'un paiement
 * @access  Parent
 */
router.post('/:id/verifier',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  paiementController.verifier
);

// ============================================
// ROUTES WEBHOOK (CALLBACK MOBILE MONEY)
// ============================================

/**
 * @route   POST /api/paiements/webhook/orange
 * @desc    Webhook callback Orange Money
 * @access  Public (vérifié par signature)
 */
router.post('/webhook/orange', paiementController.webhookOrange);

/**
 * @route   POST /api/paiements/webhook/moov
 * @desc    Webhook callback Moov Money
 * @access  Public (vérifié par signature)
 */
router.post('/webhook/moov', paiementController.webhookMoov);

/**
 * @route   POST /api/paiements/webhook/wave
 * @desc    Webhook callback Wave
 * @access  Public (vérifié par signature)
 */
router.post('/webhook/wave', paiementController.webhookWave);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * @route   PUT /api/paiements/:id/statut
 * @desc    Changer le statut d'un paiement manuellement
 * @access  Admin
 */
router.put('/:id/statut',
  adminOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('statut').isIn(['en_attente', 'complete', 'echoue', 'rembourse', 'annule']).withMessage('Statut invalide')
  ],
  validate,
  paiementController.changeStatut
);

/**
 * @route   POST /api/paiements/:id/rembourser
 * @desc    Rembourser un paiement
 * @access  Admin
 */
router.post('/:id/rembourser',
  adminOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('motif').optional().isString()
  ],
  validate,
  paiementController.rembourser
);

/**
 * @route   GET /api/paiements/statistiques
 * @desc    Statistiques des paiements
 * @access  Admin
 */
router.get('/admin/statistiques', adminOnly, paiementController.getStatistiques);

module.exports = router;
