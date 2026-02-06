const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticate, adminOnly } = require('../middlewares/auth');

// Toutes les routes admin nécessitent authentification + rôle ADMIN
router.use(authenticate);
router.use(adminOnly);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtenir les statistiques du tableau de bord
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   GET /api/admin/statistiques/utilisateurs
 * @desc    Statistiques détaillées des utilisateurs
 * @access  Admin
 */
router.get('/statistiques/utilisateurs', adminController.getStatsUtilisateurs);

/**
 * @route   GET /api/admin/statistiques/abonnements
 * @desc    Statistiques détaillées des abonnements
 * @access  Admin
 */
router.get('/statistiques/abonnements', adminController.getStatsAbonnements);

/**
 * @route   GET /api/admin/statistiques/contenus
 * @desc    Statistiques détaillées des contenus
 * @access  Admin
 */
router.get('/statistiques/contenus', adminController.getStatsContenus);

/**
 * @route   GET /api/admin/statistiques/revenus
 * @desc    Statistiques des revenus
 * @access  Admin
 */
router.get('/statistiques/revenus', adminController.getStatsRevenus);

/**
 * @route   GET /api/admin/journal
 * @desc    Consulter le journal des actions
 * @access  Admin
 */
router.get('/journal', adminController.getJournal);

/**
 * @route   GET /api/admin/roles
 * @desc    Lister les rôles
 * @access  Admin
 */
router.get('/roles', adminController.getRoles);

module.exports = router;
