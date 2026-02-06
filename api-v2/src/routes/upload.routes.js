const express = require('express');
const { param } = require('express-validator');
const router = express.Router();

const uploadController = require('../controllers/upload.controller');
const validate = require('../middlewares/validate');
const { authenticate, gestionnaireOrAdmin } = require('../middlewares/auth');
const {
  uploadMedia: uploadMediaMiddleware,
  uploadMiniature: uploadMiniatureMiddleware,
  uploadQuestionImage: uploadQuestionImageMiddleware
} = require('../middlewares/upload');

// Toutes les routes necessitent une authentification
router.use(authenticate);

// ============================================
// ROUTES UPLOAD - GESTIONNAIRE/ADMIN
// ============================================

/**
 * @route   POST /api/uploads/media
 * @desc    Upload d'un fichier media (video, audio, document)
 * @access  Gestionnaire, Admin
 */
router.post('/media',
  gestionnaireOrAdmin,
  uploadMediaMiddleware,
  uploadController.uploadMedia
);

/**
 * @route   POST /api/uploads/miniature
 * @desc    Upload d'une image miniature
 * @access  Gestionnaire, Admin
 */
router.post('/miniature',
  gestionnaireOrAdmin,
  uploadMiniatureMiddleware,
  uploadController.uploadMiniature
);

/**
 * @route   POST /api/uploads/question-image
 * @desc    Upload d'une image pour une question de quiz
 * @access  Gestionnaire, Admin
 */
router.post('/question-image',
  gestionnaireOrAdmin,
  uploadQuestionImageMiddleware,
  uploadController.uploadQuestionImage
);

/**
 * @route   GET /api/uploads/mes-fichiers
 * @desc    Lister mes fichiers uploades temporaires
 * @access  Gestionnaire, Admin
 */
router.get('/mes-fichiers',
  gestionnaireOrAdmin,
  uploadController.getMesFichiers
);

/**
 * @route   GET /api/uploads/:uuid
 * @desc    Obtenir les informations d'un fichier uploade
 * @access  Gestionnaire, Admin (proprietaire ou admin)
 */
router.get('/:uuid',
  gestionnaireOrAdmin,
  [param('uuid').isUUID().withMessage('UUID invalide')],
  validate,
  uploadController.getFileInfo
);

/**
 * @route   DELETE /api/uploads/:uuid
 * @desc    Supprimer un fichier temporaire uploade
 * @access  Gestionnaire, Admin (proprietaire ou admin)
 */
router.delete('/:uuid',
  gestionnaireOrAdmin,
  [param('uuid').isUUID().withMessage('UUID invalide')],
  validate,
  uploadController.deleteUploadedFile
);

module.exports = router;
