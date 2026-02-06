const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const enfantController = require('../controllers/enfant.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly, parentOrAdmin, adminOnly } = require('../middlewares/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ============================================
// ROUTES PARENT
// ============================================

/**
 * @route   GET /api/enfants
 * @desc    Lister ses enfants (parent) ou tous les enfants (admin)
 * @access  Private
 */
router.get('/', enfantController.getAll);

/**
 * @route   POST /api/enfants
 * @desc    Créer un profil enfant
 * @access  Parent
 */
router.post('/',
  parentOnly,
  [
    body('nomPseudo').trim().notEmpty().withMessage('Le pseudo est requis'),
    body('age').isInt({ min: 4, max: 12 }).withMessage('L\'âge doit être entre 4 et 12 ans'),
    body('avatar').optional().isURL().withMessage('URL d\'avatar invalide'),
    body('modeConnexion').optional().isIn(['mot_de_passe', 'pin']).withMessage('Mode de connexion invalide')
  ],
  validate,
  enfantController.create
);

/**
 * @route   GET /api/enfants/:id
 * @desc    Obtenir un profil enfant
 * @access  Parent (propriétaire) ou Admin
 */
router.get('/:id',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.getById
);

/**
 * @route   PUT /api/enfants/:id
 * @desc    Mettre à jour un profil enfant
 * @access  Parent (propriétaire) ou Admin
 */
router.put('/:id',
  [
    param('id').isInt().withMessage('ID invalide'),
    body('nomPseudo').optional().trim().notEmpty(),
    body('age').optional().isInt({ min: 4, max: 12 }),
    body('avatar').optional(),
    body('statut').optional().isIn(['actif', 'inactif', 'suspendu'])
  ],
  validate,
  enfantController.update
);

/**
 * @route   DELETE /api/enfants/:id
 * @desc    Supprimer un profil enfant
 * @access  Parent (propriétaire) ou Admin
 */
router.delete('/:id',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.delete
);

// ============================================
// ROUTES GESTION IDENTIFIANTS (Amendement #9)
// ============================================

/**
 * @route   POST /api/enfants/:id/regenerer-mot-de-passe
 * @desc    Régénérer le mot de passe d'un enfant
 * @access  Parent (propriétaire)
 */
router.post('/:id/regenerer-mot-de-passe',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.regenererMotDePasse
);

/**
 * @route   PUT /api/enfants/:id/pin
 * @desc    Configurer/modifier le PIN simplifié
 * @access  Parent (propriétaire)
 */
router.put('/:id/pin',
  parentOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('pin').isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres').isNumeric()
  ],
  validate,
  enfantController.configurerPin
);

/**
 * @route   PUT /api/enfants/:id/mode-connexion
 * @desc    Changer le mode de connexion (mot de passe ou PIN)
 * @access  Parent (propriétaire)
 */
router.put('/:id/mode-connexion',
  parentOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('mode').isIn(['mot_de_passe', 'pin']).withMessage('Mode invalide')
  ],
  validate,
  enfantController.changerModeConnexion
);

/**
 * @route   GET /api/enfants/:id/identifiants
 * @desc    Obtenir les identifiants de connexion d'un enfant
 * @access  Parent (propriétaire)
 */
router.get('/:id/identifiants',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.getIdentifiants
);

// ============================================
// ROUTES PROGRESSION ET STATISTIQUES
// ============================================

/**
 * @route   GET /api/enfants/:id/progression
 * @desc    Obtenir la progression d'un enfant
 * @access  Parent (propriétaire) ou Admin
 */
router.get('/:id/progression',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.getProgression
);

/**
 * @route   GET /api/enfants/:id/badges
 * @desc    Obtenir les badges d'un enfant
 * @access  Parent (propriétaire), Admin ou Enfant lui-même
 */
router.get('/:id/badges',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.getBadges
);

/**
 * @route   GET /api/enfants/:id/temps-ecran
 * @desc    Obtenir les statistiques de temps d'écran
 * @access  Parent (propriétaire) ou Admin
 */
router.get('/:id/temps-ecran',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  enfantController.getTempsEcran
);

module.exports = router;
