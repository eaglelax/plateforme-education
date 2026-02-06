const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const utilisateurController = require('../controllers/utilisateur.controller');
const validate = require('../middlewares/validate');
const { authenticate, adminOnly, parentOrAdmin } = require('../middlewares/auth');

// ============================================
// ROUTES PROTÉGÉES (PARENT)
// ============================================

/**
 * @route   GET /api/utilisateurs/profil
 * @desc    Obtenir son propre profil
 * @access  Private
 */
router.get('/profil', authenticate, utilisateurController.getProfil);

/**
 * @route   PUT /api/utilisateurs/profil
 * @desc    Mettre à jour son profil
 * @access  Private
 */
router.put('/profil',
  authenticate,
  [
    body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('prenom').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide'),
    body('email').optional().isEmail().withMessage('Email invalide')
  ],
  validate,
  utilisateurController.updateProfil
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * @route   GET /api/utilisateurs
 * @desc    Lister tous les utilisateurs
 * @access  Admin
 */
router.get('/', authenticate, adminOnly, utilisateurController.getAll);

/**
 * @route   GET /api/utilisateurs/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Admin
 */
router.get('/:id',
  authenticate,
  adminOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  utilisateurController.getById
);

/**
 * @route   PUT /api/utilisateurs/:id
 * @desc    Modifier un utilisateur
 * @access  Admin
 */
router.put('/:id',
  authenticate,
  adminOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('nom').optional().trim().notEmpty(),
    body('prenom').optional().trim().notEmpty(),
    body('statutCompte').optional().isIn(['actif', 'inactif', 'suspendu'])
  ],
  validate,
  utilisateurController.update
);

/**
 * @route   DELETE /api/utilisateurs/:id
 * @desc    Supprimer un utilisateur
 * @access  Admin
 */
router.delete('/:id',
  authenticate,
  adminOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  utilisateurController.delete
);

/**
 * @route   PUT /api/utilisateurs/:id/role
 * @desc    Changer le rôle d'un utilisateur
 * @access  Admin
 */
router.put('/:id/role',
  authenticate,
  adminOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('roleId').isInt().withMessage('ID de rôle invalide')
  ],
  validate,
  utilisateurController.changeRole
);

module.exports = router;
