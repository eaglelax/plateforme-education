const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const quizController = require('../controllers/quiz.controller');
const validate = require('../middlewares/validate');
const { authenticate, gestionnaireOrAdmin, validateurOrAdmin } = require('../middlewares/auth');

// Toutes les routes necessitent une authentification
router.use(authenticate);

// ============================================
// ROUTES QUIZ PAR CONTENU
// ============================================

/**
 * @route   GET /api/quiz/contenu/:contenuId
 * @desc    Obtenir le quiz d'un contenu
 * @access  Gestionnaire (proprietaire), Validateur, Admin
 */
router.get('/contenu/:contenuId',
  [param('contenuId').isInt().withMessage('ID contenu invalide')],
  validate,
  quizController.getByContenuId
);

/**
 * @route   POST /api/quiz/contenu/:contenuId
 * @desc    Creer ou modifier le quiz d'un contenu
 * @access  Gestionnaire (proprietaire), Admin
 */
router.post('/contenu/:contenuId',
  gestionnaireOrAdmin,
  [
    param('contenuId').isInt().withMessage('ID contenu invalide'),
    body('titre').optional().trim().isLength({ max: 255 }).withMessage('Titre max 255 caracteres'),
    body('scoreMinimum').optional().isInt({ min: 0, max: 100 }).withMessage('Score entre 0 et 100'),
    body('tempsLimiteMinutes').optional().isInt({ min: 0 }).withMessage('Temps limite invalide'),
    body('questions').isArray({ min: 1 }).withMessage('Au moins une question requise'),
    body('questions.*.texte').trim().notEmpty().withMessage('Texte de question requis'),
    body('questions.*.type').optional().isIn(['choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre'])
      .withMessage('Type de question invalide'),
    body('questions.*.reponses').isArray({ min: 2 }).withMessage('Au moins 2 reponses par question')
  ],
  validate,
  quizController.createOrUpdate
);

/**
 * @route   DELETE /api/quiz/contenu/:contenuId
 * @desc    Supprimer le quiz d'un contenu
 * @access  Gestionnaire (proprietaire), Admin
 */
router.delete('/contenu/:contenuId',
  gestionnaireOrAdmin,
  [param('contenuId').isInt().withMessage('ID contenu invalide')],
  validate,
  quizController.deleteQuiz
);

// ============================================
// ROUTES ENFANT — QUIZ RESULT
// ============================================

/**
 * @route   POST /api/quiz/contenu/:contenuId/resultat
 * @desc    Submit quiz result (score, XP, badges, level-up)
 * @access  Enfant (authenticated)
 */
router.post('/contenu/:contenuId/resultat',
  [
    param('contenuId').isInt().withMessage('ID contenu invalide'),
    body('score').isInt({ min: 0 }).withMessage('Score invalide'),
    body('totalQuestions').isInt({ min: 1 }).withMessage('Nombre de questions invalide')
  ],
  validate,
  quizController.submitResult
);

/**
 * @route   GET /api/quiz/levels
 * @desc    Get level thresholds
 * @access  Authenticated
 */
router.get('/levels', quizController.getLevels);

// ============================================
// ROUTES QUESTIONS
// ============================================

/**
 * @route   POST /api/quiz/:quizId/questions
 * @desc    Ajouter une question a un quiz
 * @access  Gestionnaire (proprietaire), Admin
 */
router.post('/:quizId/questions',
  gestionnaireOrAdmin,
  [
    param('quizId').isInt().withMessage('ID quiz invalide'),
    body('texte').trim().notEmpty().withMessage('Texte de question requis'),
    body('type').optional().isIn(['choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre'])
      .withMessage('Type de question invalide'),
    body('points').optional().isInt({ min: 1, max: 10 }).withMessage('Points entre 1 et 10'),
    body('reponses').isArray({ min: 2 }).withMessage('Au moins 2 reponses requises')
  ],
  validate,
  quizController.addQuestion
);

/**
 * @route   PUT /api/quiz/:quizId/questions/reorder
 * @desc    Reordonner les questions d'un quiz
 * @access  Gestionnaire (proprietaire), Admin
 */
router.put('/:quizId/questions/reorder',
  gestionnaireOrAdmin,
  [
    param('quizId').isInt().withMessage('ID quiz invalide'),
    body('questionIds').isArray({ min: 1 }).withMessage('Liste des IDs requise')
  ],
  validate,
  quizController.reorderQuestions
);

/**
 * @route   PUT /api/quiz/questions/:questionId
 * @desc    Modifier une question
 * @access  Gestionnaire (proprietaire), Admin
 */
router.put('/questions/:questionId',
  gestionnaireOrAdmin,
  [
    param('questionId').isInt().withMessage('ID question invalide'),
    body('type').optional().isIn(['choix_unique', 'choix_multiple', 'vrai_faux', 'texte_libre'])
      .withMessage('Type de question invalide'),
    body('points').optional().isInt({ min: 1, max: 10 }).withMessage('Points entre 1 et 10')
  ],
  validate,
  quizController.updateQuestion
);

/**
 * @route   DELETE /api/quiz/questions/:questionId
 * @desc    Supprimer une question
 * @access  Gestionnaire (proprietaire), Admin
 */
router.delete('/questions/:questionId',
  gestionnaireOrAdmin,
  [param('questionId').isInt().withMessage('ID question invalide')],
  validate,
  quizController.deleteQuestion
);

module.exports = router;
