class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'http://apieducative.genius-universe.com';
  static const String apiPrefix = '?route=/api';

  // Auth
  static String get login => '$apiPrefix/auth/login';
  static String get loginEnfant => '$apiPrefix/auth/login-enfant';
  static String get register => '$apiPrefix/auth/register';
  static String get refreshToken => '$apiPrefix/auth/refresh';
  static String get me => '$apiPrefix/auth/me';
  static String get forgotPassword => '$apiPrefix/auth/forgot-password';

  // Enfants
  static String get enfants => '$apiPrefix/enfants';
  static String enfantById(int id) => '$apiPrefix/enfants/$id';
  static String enfantProgression(int id) => '$apiPrefix/enfants/$id/progression';
  static String enfantBadges(int id) => '$apiPrefix/enfants/$id/badges';
  static String enfantTempsEcran(int id) => '$apiPrefix/enfants/$id/temps-ecran';

  // Contenus
  static String get contenus => '$apiPrefix/contenus';
  static String get domaines => '$apiPrefix/contenus/domaines';
  static String contenuById(int id) => '$apiPrefix/contenus/$id';
  static String demarrerContenu(int id) => '$apiPrefix/contenus/$id/demarrer';
  static String progressionContenu(int id) => '$apiPrefix/contenus/$id/progression';
  static String terminerContenu(int id) => '$apiPrefix/contenus/$id/terminer';

  // Quiz
  static String quizByContenu(int contenuId) => '$apiPrefix/quiz/contenu/$contenuId';
  static String quizResultat(int contenuId) => '$apiPrefix/quiz/contenu/$contenuId/resultat';
  static String get quizLevels => '$apiPrefix/quiz/levels';

  // Historique (enfant)
  static String get monHistorique => '$apiPrefix/historique/mon-historique';
  static String get mesBadges => '$apiPrefix/historique/mes-badges';
  static String get mesStats => '$apiPrefix/historique/mes-stats';
  static String get syncGameXp => '$apiPrefix/historique/sync-game-xp';

  // Historique (parent)
  static String historiqueEnfant(int enfantId) => '$apiPrefix/historique/enfant/$enfantId';
  static String resumeEnfant(int enfantId) => '$apiPrefix/historique/enfant/$enfantId/resume';
  static String tempsEcranEnfant(int enfantId) => '$apiPrefix/historique/enfant/$enfantId/temps-ecran';
  static String progressionEnfant(int enfantId) => '$apiPrefix/historique/enfant/$enfantId/progression';

  // Abonnements
  static String get abonnements => '$apiPrefix/abonnements';
  static String get typesAbonnements => '$apiPrefix/abonnements/types';
  static String abonnementById(int id) => '$apiPrefix/abonnements/$id';
  static String abonnementRenouvellement(int id) => '$apiPrefix/abonnements/$id/renouvellement';
  static String abonnementAnnuler(int id) => '$apiPrefix/abonnements/$id/annuler';

  // Paiements
  static String get paiements => '$apiPrefix/paiements';
  static String paiementById(int id) => '$apiPrefix/paiements/$id';
  static String paiementVerifier(int id) => '$apiPrefix/paiements/$id/verifier';

  // Parametres parentaux
  static String parametresParentaux(int enfantId) =>
      '$apiPrefix/parametres-parentaux/$enfantId';
  static String parametresTempsEcran(int enfantId) =>
      '$apiPrefix/parametres-parentaux/$enfantId/temps-ecran';
  static String parametresHoraires(int enfantId) =>
      '$apiPrefix/parametres-parentaux/$enfantId/horaires';
  static String parametresModeKiosque(int enfantId) =>
      '$apiPrefix/parametres-parentaux/$enfantId/mode-kiosque';

  // Enfants - gestion
  static String enfantRegenerationMdp(int id) => '$apiPrefix/enfants/$id/regenerer-mot-de-passe';
  static String enfantPin(int id) => '$apiPrefix/enfants/$id/pin';
  static String enfantModeConnexion(int id) => '$apiPrefix/enfants/$id/mode-connexion';
  static String enfantIdentifiants(int id) => '$apiPrefix/enfants/$id/identifiants';

  // Utilisateur profil
  static String get profil => '$apiPrefix/utilisateurs/profil';

  // Notifications
  static String get notifications => '$apiPrefix/notification';
}
