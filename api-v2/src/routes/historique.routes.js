const express = require('express');
const { param, query: queryValidator } = require('express-validator');
const router = express.Router();

const historiqueController = require('../controllers/historique.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly, enfantOnly } = require('../middlewares/auth');

router.use(authenticate);

// ============================================
// ROUTES ENFANT
// ============================================

/**
 * @route   GET /api/historique/mon-historique
 * @desc    Obtenir son propre historique (enfant)
 * @access  Enfant
 */
router.get('/mon-historique', enfantOnly, historiqueController.getMonHistorique);

/**
 * @route   GET /api/historique/mes-badges
 * @desc    Obtenir ses badges (enfant)
 * @access  Enfant
 */
router.get('/mes-badges', enfantOnly, historiqueController.getMesBadges);

/**
 * @route   GET /api/historique/mes-stats
 * @desc    Obtenir ses statistiques globales (enfant)
 * @access  Enfant
 */
router.get('/mes-stats', enfantOnly, historiqueController.getMesStats);

/**
 * @route   POST /api/historique/sync-game-xp
 * @desc    Synchroniser les XP des jeux vers le profil
 * @access  Enfant
 */
router.post('/sync-game-xp', enfantOnly, historiqueController.syncGameXp);

// ============================================
// ROUTES PARENT
// ============================================

/**
 * @route   GET /api/historique/enfant/:enfantId
 * @desc    Obtenir l'historique d'un enfant
 * @access  Parent
 */
router.get('/enfant/:enfantId',
  parentOnly,
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  historiqueController.getHistoriqueEnfant
);

/**
 * @route   GET /api/historique/enfant/:enfantId/resume
 * @desc    Obtenir un résumé de l'activité d'un enfant
 * @access  Parent
 */
router.get('/enfant/:enfantId/resume',
  parentOnly,
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  historiqueController.getResumeEnfant
);

/**
 * @route   GET /api/historique/enfant/:enfantId/temps-ecran
 * @desc    Obtenir les statistiques de temps d'écran
 * @access  Parent
 */
router.get('/enfant/:enfantId/temps-ecran',
  parentOnly,
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  historiqueController.getTempsEcran
);

/**
 * @route   GET /api/historique/enfant/:enfantId/progression
 * @desc    Obtenir la progression détaillée par domaine
 * @access  Parent
 */
router.get('/enfant/:enfantId/progression',
  parentOnly,
  [param('enfantId').isInt().withMessage('ID enfant invalide')],
  validate,
  historiqueController.getProgressionDetaille
);

module.exports = router;
