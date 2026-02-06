const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

// Validation pour l'inscription
const registerValidation = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  body('telephone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis')
    .matches(/^(\+?226)?[0-9]{8}$/).withMessage('Format de téléphone invalide'),
  body('email')
    .optional()
    .isEmail().withMessage('Email invalide'),
  body('motDePasse')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

// Validation pour la connexion
const loginValidation = [
  body('identifiant').trim().notEmpty().withMessage('Identifiant requis (email ou téléphone)'),
  body('motDePasse').notEmpty().withMessage('Mot de passe requis')
];

// Validation pour la connexion enfant
const loginEnfantValidation = [
  body('codeConnexion')
    .trim()
    .notEmpty().withMessage('Code de connexion requis')
    .matches(/^ENF-[A-Z0-9]{6}$/).withMessage('Format du code invalide (ENF-XXXXXX)'),
  body('motDePasse').optional(),
  body('pin').optional().isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres')
];

// Validation pour le refresh token
const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token requis')
];

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouveau parent
 * @access  Public
 */
router.post('/register', registerValidation, validate, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur (parent/admin)
 * @access  Public
 */
router.post('/login', loginValidation, validate, authController.login);

/**
 * @route   POST /api/auth/login-enfant
 * @desc    Connexion enfant avec code + mot de passe/PIN
 * @access  Public
 */
router.post('/login-enfant', loginEnfantValidation, validate, authController.loginEnfant);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renouveler le token d'accès
 * @access  Public
 */
router.post('/refresh', refreshValidation, validate, authController.refreshToken);

// ============================================
// ROUTES PROTÉGÉES
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  [
    body('ancienMotDePasse').notEmpty().withMessage('Ancien mot de passe requis'),
    body('nouveauMotDePasse').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
  ],
  validate,
  authController.changePassword
);

module.exports = router;
