const express = require('express');
const { body, param, query: queryValidator } = require('express-validator');
const router = express.Router();

const contenuController = require('../controllers/contenu.controller');
const validate = require('../middlewares/validate');
const { authenticate, optionalAuth, adminOnly, enfantOnly, validateurOrAdmin, gestionnaireOrAdmin, validateurOnly, gestionnaireOnly, adminRoles } = require('../middlewares/auth');

// ============================================
// ROUTES PUBLIQUES / OPTIONNELLEMENT AUTHENTIFIEES
// ============================================

/**
 * @route   GET /api/contenus/domaines
 * @desc    Lister les domaines educatifs
 * @access  Public
 */
router.get('/domaines', contenuController.getDomaines);

/**
 * @route   GET /api/contenus
 * @desc    Lister les contenus publies (filtrable par domaine, type, age)
 * @access  Public (contenus limites) / Private (contenus complets)
 */
router.get('/', optionalAuth, contenuController.getAll);

// ============================================
// ROUTES ADMIN / GESTIONNAIRE (doivent etre avant /:id)
// ============================================

/**
 * @route   GET /api/contenus/tous
 * @desc    Lister tous les contenus (admin: tout, gestionnaire: ses contenus)
 * @access  Gestionnaire, Admin
 */
router.get('/tous',
  authenticate,
  adminRoles,
  contenuController.getAllAdmin
);

// ============================================
// ROUTES VALIDATEUR / ADMIN (doivent etre avant /:id)
// ============================================

/**
 * @route   GET /api/contenus/a-valider
 * @desc    Lister les contenus en attente de validation
 * @access  Validateur, Admin
 */
router.get('/a-valider',
  authenticate,
  validateurOrAdmin,
  contenuController.getAValider
);

/**
 * @route   GET /api/contenus/stats-validation
 * @desc    Obtenir les statistiques de validation
 * @access  Validateur, Admin
 */
router.get('/stats-validation',
  authenticate,
  validateurOrAdmin,
  contenuController.getStatsValidation
);

// ============================================
// ROUTES GESTIONNAIRE DE CONTENU (doivent etre avant /:id)
// ============================================

/**
 * @route   GET /api/contenus/mes-contenus
 * @desc    Lister mes contenus par statut
 * @access  Gestionnaire, Admin
 */
router.get('/mes-contenus',
  authenticate,
  gestionnaireOrAdmin,
  contenuController.getMesContenus
);

// ============================================
// ROUTES AVEC PARAMETRE :id
// ============================================

/**
 * @route   GET /api/contenus/:id
 * @desc    Obtenir un contenu par ID
 * @access  Public (apercu) / Private (contenu complet)
 */
router.get('/:id',
  optionalAuth,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.getById
);

/**
 * @route   GET /api/contenus/:id/validation
 * @desc    Voir le detail d'un contenu pour validation (lecture seule)
 * @access  Validateur, Admin
 */
router.get('/:id/validation',
  authenticate,
  validateurOrAdmin,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.getForValidation
);

// ============================================
// ROUTES ENFANT
// ============================================

/**
 * @route   POST /api/contenus/:id/demarrer
 * @desc    Demarrer un contenu (creer entree historique)
 * @access  Enfant
 */
router.post('/:id/demarrer',
  authenticate,
  enfantOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.demarrer
);

/**
 * @route   POST /api/contenus/:id/progression
 * @desc    Mettre a jour la progression
 * @access  Enfant
 */
router.post('/:id/progression',
  authenticate,
  enfantOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('progression').isInt({ min: 0, max: 100 }).withMessage('Progression entre 0 et 100'),
    body('tempsPasse').optional().isInt({ min: 0 }).withMessage('Temps invalide')
  ],
  validate,
  contenuController.updateProgression
);

/**
 * @route   POST /api/contenus/:id/terminer
 * @desc    Marquer un contenu comme termine
 * @access  Enfant
 */
router.post('/:id/terminer',
  authenticate,
  enfantOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score entre 0 et 100')
  ],
  validate,
  contenuController.terminer
);

// ============================================
// ROUTES VALIDATEUR - ACTIONS
// ============================================

/**
 * @route   PUT /api/contenus/:id/valider
 * @desc    Valider (approuver) un contenu
 * @access  Validateur, Admin
 */
router.put('/:id/valider',
  authenticate,
  validateurOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('commentaire').optional().isString()
  ],
  validate,
  contenuController.valider
);

/**
 * @route   PUT /api/contenus/:id/amender
 * @desc    Renvoyer un contenu pour amendements (commentaire obligatoire)
 * @access  Validateur (admin lecture seule)
 */
router.put('/:id/amender',
  authenticate,
  validateurOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('commentaire').trim().notEmpty().withMessage('Le commentaire est obligatoire')
  ],
  validate,
  contenuController.amender
);

// ============================================
// ROUTES GESTIONNAIRE - ACTIONS
// ============================================

/**
 * @route   PUT /api/contenus/:id/soumettre
 * @desc    Soumettre un contenu pour validation
 * @access  Gestionnaire, Admin
 */
router.put('/:id/soumettre',
  authenticate,
  gestionnaireOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.soumettre
);

/**
 * @route   PUT /api/contenus/:id/publier
 * @desc    Publier un contenu valide
 * @access  Gestionnaire (admin lecture seule)
 */
router.put('/:id/publier',
  authenticate,
  gestionnaireOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.publier
);

// ============================================
// ROUTES GESTIONNAIRE - CRUD (admin lecture seule)
// ============================================

/**
 * @route   POST /api/contenus
 * @desc    Creer un nouveau contenu
 * @access  Gestionnaire uniquement
 */
router.post('/',
  authenticate,
  gestionnaireOnly,
  [
    body('titre').trim().notEmpty().withMessage('Titre requis')
      .isLength({ min: 5, max: 255 }).withMessage('Titre entre 5 et 255 caracteres'),
    body('type').isIn(['video', 'audio', 'quiz', 'jeu', 'document', 'activite']).withMessage('Type invalide'),
    body('domaineId').isInt().withMessage('Domaine requis'),
    body('trancheAgeMin').optional().isInt({ min: 4, max: 12 }).withMessage('Age min entre 4 et 12'),
    body('trancheAgeMax').optional().isInt({ min: 4, max: 12 }).withMessage('Age max entre 4 et 12'),
    body('pointsXp').optional().isInt({ min: 0, max: 100 }).withMessage('Points XP entre 0 et 100'),
    body('mediaFileId').optional().isUUID().withMessage('UUID media invalide'),
    body('miniatureFileId').optional().isUUID().withMessage('UUID miniature invalide')
  ],
  validate,
  contenuController.create
);

/**
 * @route   PUT /api/contenus/:id
 * @desc    Modifier un contenu (brouillon ou a_amender uniquement)
 * @access  Gestionnaire (proprietaire), Admin
 */
router.put('/:id',
  authenticate,
  gestionnaireOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('titre').optional().trim().isLength({ min: 5, max: 255 }).withMessage('Titre entre 5 et 255 caracteres'),
    body('type').optional().isIn(['video', 'audio', 'quiz', 'jeu', 'document', 'activite']).withMessage('Type invalide'),
    body('trancheAgeMin').optional().isInt({ min: 4, max: 12 }).withMessage('Age min entre 4 et 12'),
    body('trancheAgeMax').optional().isInt({ min: 4, max: 12 }).withMessage('Age max entre 4 et 12')
  ],
  validate,
  contenuController.update
);

/**
 * @route   DELETE /api/contenus/:id
 * @desc    Supprimer un contenu (createur uniquement, admin lecture seule)
 * @access  Gestionnaire (proprietaire)
 */
router.delete('/:id',
  authenticate,
  gestionnaireOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.delete
);

// ============================================
// ROUTES ADMIN - DOMAINES
// ============================================

/**
 * @route   POST /api/contenus/domaines
 * @desc    Creer un domaine educatif
 * @access  Admin
 */
router.post('/domaines',
  authenticate,
  adminOnly,
  [
    body('nom').trim().notEmpty().withMessage('Nom requis'),
    body('description').optional().isString(),
    body('icone').optional().isString(),
    body('couleur').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Couleur hexadecimale invalide')
  ],
  validate,
  contenuController.createDomaine
);

/**
 * @route   PUT /api/contenus/domaines/:id
 * @desc    Modifier un domaine
 * @access  Admin
 */
router.put('/domaines/:id',
  authenticate,
  adminOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  contenuController.updateDomaine
);

module.exports = router;
