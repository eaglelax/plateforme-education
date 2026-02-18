const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticate, adminOnly, validateurOrAdmin } = require('../middlewares/auth');

// Authentification requise pour toutes les routes
router.use(authenticate);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtenir les statistiques du tableau de bord
 * @access  Admin
 */
router.get('/dashboard', adminOnly, adminController.getDashboard);

/**
 * @route   GET /api/admin/statistiques/utilisateurs
 * @desc    Statistiques détaillées des utilisateurs
 * @access  Admin
 */
router.get('/statistiques/utilisateurs', adminOnly, adminController.getStatsUtilisateurs);

/**
 * @route   GET /api/admin/statistiques/abonnements
 * @desc    Statistiques détaillées des abonnements
 * @access  Admin
 */
router.get('/statistiques/abonnements', adminOnly, adminController.getStatsAbonnements);

/**
 * @route   GET /api/admin/statistiques/contenus
 * @desc    Statistiques détaillées des contenus
 * @access  Admin
 */
router.get('/statistiques/contenus', adminOnly, adminController.getStatsContenus);

/**
 * @route   GET /api/admin/statistiques/revenus
 * @desc    Statistiques des revenus
 * @access  Admin
 */
router.get('/statistiques/revenus', adminOnly, adminController.getStatsRevenus);

/**
 * @route   GET /api/admin/journal
 * @desc    Consulter le journal des actions
 * @access  Admin
 */
router.get('/journal', adminOnly, adminController.getJournal);

/**
 * @route   GET /api/admin/roles
 * @desc    Lister les rôles
 * @access  Admin
 */
router.get('/roles', validateurOrAdmin, adminController.getRoles);

module.exports = router;
