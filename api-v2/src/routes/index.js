const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth.routes');
const utilisateurRoutes = require('./utilisateur.routes');
const enfantRoutes = require('./enfant.routes');
const abonnementRoutes = require('./abonnement.routes');
const contenuRoutes = require('./contenu.routes');
const paiementRoutes = require('./paiement.routes');
const appareilRoutes = require('./appareil.routes');
const notificationRoutes = require('./notification.routes');
const parametreParentalRoutes = require('./parametreParental.routes');
const domaineAutoriseRoutes = require('./domaineAutorise.routes');
const apkAutoriseeRoutes = require('./apkAutorisee.routes');
const preferenceTelechargementRoutes = require('./preferenceTelechargement.routes');
const historiqueRoutes = require('./historique.routes');
const adminRoutes = require('./admin.routes');
const uploadRoutes = require('./upload.routes');
const quizRoutes = require('./quiz.routes');

// Montage des routes
router.use('/auth', authRoutes);
router.use('/utilisateurs', utilisateurRoutes);
router.use('/enfants', enfantRoutes);
router.use('/abonnements', abonnementRoutes);
router.use('/contenus', contenuRoutes);
router.use('/paiements', paiementRoutes);
router.use('/appareils', appareilRoutes);
router.use('/notifications', notificationRoutes);
router.use('/parametres-parentaux', parametreParentalRoutes);
router.use('/domaines-autorises', domaineAutoriseRoutes);
router.use('/apk-autorisees', apkAutoriseeRoutes);
router.use('/preferences-telechargement', preferenceTelechargementRoutes);
router.use('/historique', historiqueRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);
router.use('/quiz', quizRoutes);

module.exports = router;
