const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const validate = require('../middlewares/validate');
const { authenticate, adminOnly } = require('../middlewares/auth');

router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Obtenir ses notifications
 * @access  Private
 */
router.get('/', notificationController.getAll);

/**
 * @route   GET /api/notifications/non-lues/count
 * @desc    Compter les notifications non lues
 * @access  Private
 */
router.get('/non-lues/count', notificationController.countNonLues);

/**
 * @route   PUT /api/notifications/:id/lire
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.put('/:id/lire',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  notificationController.marquerLue
);

/**
 * @route   PUT /api/notifications/lire-toutes
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
router.put('/lire-toutes', notificationController.marquerToutesLues);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Supprimer une notification
 * @access  Private
 */
router.delete('/:id',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  notificationController.delete
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * @route   POST /api/notifications/envoyer
 * @desc    Envoyer une notification à un utilisateur
 * @access  Admin
 */
router.post('/envoyer',
  adminOnly,
  [
    body('titre').trim().notEmpty().withMessage('Titre requis'),
    body('message').trim().notEmpty().withMessage('Message requis'),
    body('type').optional().isIn(['info', 'alerte', 'succes', 'avertissement', 'systeme']),
    body('utilisateurId').optional().isInt(),
    body('enfantId').optional().isInt()
  ],
  validate,
  notificationController.envoyer
);

/**
 * @route   POST /api/notifications/broadcast
 * @desc    Envoyer une notification à tous les utilisateurs
 * @access  Admin
 */
router.post('/broadcast',
  adminOnly,
  [
    body('titre').trim().notEmpty().withMessage('Titre requis'),
    body('message').trim().notEmpty().withMessage('Message requis'),
    body('type').optional().isIn(['info', 'alerte', 'succes', 'avertissement', 'systeme'])
  ],
  validate,
  notificationController.broadcast
);

module.exports = router;
