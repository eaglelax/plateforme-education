require('dotenv').config();

const bcrypt = require('bcryptjs');
const { query, closePool } = require('../config/database');

async function seed() {
  console.log('🌱 Démarrage du seed...\n');

  try {
    // ============================================
    // 1. RÔLES
    // ============================================
    console.log('📝 Création des rôles...');

    const roles = [
      {
        nom: 'ADMIN',
        description: 'Administrateur de la plateforme avec tous les droits',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          children: ['create', 'read', 'update', 'delete'],
          content: ['create', 'read', 'update', 'delete', 'publish', 'validate'],
          subscriptions: ['create', 'read', 'update', 'delete'],
          payments: ['read', 'update', 'refund'],
          settings: ['read', 'update'],
          reports: ['read']
        })
      },
      {
        nom: 'VALIDATEUR',
        description: 'Validateur de contenus éducatifs',
        permissions: JSON.stringify({
          content: ['read', 'validate', 'reject'],
          reports: ['read']
        })
      },
      {
        nom: 'GESTIONNAIRE_CONTENU',
        description: 'Gestionnaire de contenus éducatifs',
        permissions: JSON.stringify({
          content: ['create', 'read', 'update', 'delete'],
          reports: ['read']
        })
      },
      {
        nom: 'PARENT',
        description: 'Parent gérant les profils de ses enfants',
        permissions: JSON.stringify({
          children: ['create', 'read', 'update', 'delete'],
          subscriptions: ['create', 'read', 'update'],
          payments: ['create', 'read'],
          settings: ['read', 'update']
        })
      },
      {
        nom: 'ENFANT',
        description: 'Profil enfant avec accès aux contenus',
        permissions: JSON.stringify({
          content: ['read'],
          progress: ['read', 'update']
        })
      }
    ];

    for (const role of roles) {
      await query(
        `INSERT IGNORE INTO roles (nom, description, permissions) VALUES (?, ?, ?)`,
        [role.nom, role.description, role.permissions]
      );
    }
    console.log('✅ Rôles créés\n');

    // ============================================
    // 2. ADMINISTRATEUR
    // ============================================
    console.log('👤 Création du compte administrateur...');

    const [adminRole] = await query('SELECT id FROM roles WHERE nom = ?', ['ADMIN']);
    const adminPassword = await bcrypt.hash('Admin2024!', 12);

    await query(
      `INSERT IGNORE INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Admin', 'Système', '+22670000001', 'admin@plateforme-educative.bf', adminPassword, adminRole.id]
    );
    console.log('✅ Administrateur créé');
    console.log('   Email: admin@plateforme-educative.bf');
    console.log('   Mot de passe: Admin2024!\n');

    // ============================================
    // 2b. VALIDATEUR
    // ============================================
    console.log('👤 Création du compte validateur...');

    const [validateurRole] = await query('SELECT id FROM roles WHERE nom = ?', ['VALIDATEUR']);
    const validateurPassword = await bcrypt.hash('Validateur2024!', 12);

    await query(
      `INSERT IGNORE INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Validateur', 'Test', '+22670000002', 'validateur@plateforme-educative.bf', validateurPassword, validateurRole.id]
    );
    console.log('✅ Validateur créé');
    console.log('   Email: validateur@plateforme-educative.bf');
    console.log('   Mot de passe: Validateur2024!\n');

    // ============================================
    // 2c. GESTIONNAIRE DE CONTENU
    // ============================================
    console.log('👤 Création du compte gestionnaire de contenu...');

    const [gestionnaireRole] = await query('SELECT id FROM roles WHERE nom = ?', ['GESTIONNAIRE_CONTENU']);
    const gestionnairePassword = await bcrypt.hash('Gestionnaire2024!', 12);

    await query(
      `INSERT IGNORE INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Gestionnaire', 'Contenu', '+22670000003', 'gestionnaire@plateforme-educative.bf', gestionnairePassword, gestionnaireRole.id]
    );
    console.log('✅ Gestionnaire de contenu créé');
    console.log('   Email: gestionnaire@plateforme-educative.bf');
    console.log('   Mot de passe: Gestionnaire2024!\n');

    // ============================================
    // 2d. PARENT TEST
    // ============================================
    console.log('👤 Création du compte parent test...');

    const [parentRole] = await query('SELECT id FROM roles WHERE nom = ?', ['PARENT']);
    const parentPassword = await bcrypt.hash('Parent2024!', 12);

    await query(
      `INSERT IGNORE INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Ouedraogo', 'Aminata', '+22670000004', 'parent@plateforme-educative.bf', parentPassword, parentRole.id]
    );
    console.log('✅ Parent test créé');
    console.log('   Email: parent@plateforme-educative.bf');
    console.log('   Mot de passe: Parent2024!\n');

    // ============================================
    // 3. TYPES D'ABONNEMENTS
    // ============================================
    console.log('💰 Création des types d\'abonnements...');

    const typesAbonnements = [
      {
        nom: 'Découverte',
        description: 'Parfait pour essayer la plateforme pendant 1 mois',
        prix: 2500,
        duree: 'MENSUEL',
        duree_jours: 30,
        nombre_appareils_max: 1,
        telechargement_autorise: false,
        contenu_premium: false
      },
      {
        nom: 'Essentiel',
        description: 'Abonnement mensuel avec accès complet',
        prix: 5000,
        duree: 'MENSUEL',
        duree_jours: 30,
        nombre_appareils_max: 2,
        telechargement_autorise: true,
        contenu_premium: false
      },
      {
        nom: 'Famille',
        description: 'Abonnement trimestriel pour toute la famille',
        prix: 12000,
        duree: 'TRIMESTRIEL',
        duree_jours: 90,
        nombre_appareils_max: 3,
        telechargement_autorise: true,
        contenu_premium: true
      },
      {
        nom: 'Premium Annuel',
        description: 'Meilleure offre ! Accès illimité pendant 1 an',
        prix: 40000,
        duree: 'ANNUEL',
        duree_jours: 365,
        nombre_appareils_max: 5,
        telechargement_autorise: true,
        contenu_premium: true
      }
    ];

    for (const type of typesAbonnements) {
      await query(
        `INSERT IGNORE INTO types_abonnements
         (nom, description, prix, duree, duree_jours, nombre_appareils_max, telechargement_autorise, contenu_premium)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [type.nom, type.description, type.prix, type.duree, type.duree_jours,
         type.nombre_appareils_max, type.telechargement_autorise, type.contenu_premium]
      );
    }
    console.log('✅ Types d\'abonnements créés\n');

    // ============================================
    // 4. DOMAINES ÉDUCATIFS
    // ============================================
    console.log('📚 Création des domaines éducatifs...');

    const domaines = [
      { nom: 'Langues', description: 'Français, Anglais et langues locales', icone: '🗣️', couleur: '#3498db', ordre: 1 },
      { nom: 'Mathématiques', description: 'Calcul, géométrie et logique', icone: '🔢', couleur: '#e74c3c', ordre: 2 },
      { nom: 'Sciences', description: 'Sciences naturelles et expériences', icone: '🔬', couleur: '#2ecc71', ordre: 3 },
      { nom: 'Histoire-Géo', description: 'Histoire du Burkina et du monde', icone: '🌍', couleur: '#f39c12', ordre: 4 },
      { nom: 'Arts', description: 'Musique, dessin et créativité', icone: '🎨', couleur: '#9b59b6', ordre: 5 },
      { nom: 'Culture Burkinabè', description: 'Traditions, contes et patrimoine', icone: '🏛️', couleur: '#e67e22', ordre: 6 },
      { nom: 'Éducation Civique', description: 'Citoyenneté et valeurs', icone: '🤝', couleur: '#1abc9c', ordre: 7 },
      { nom: 'Informatique', description: 'Initiation au numérique', icone: '💻', couleur: '#34495e', ordre: 8 },
      { nom: 'Sport & Santé', description: 'Activités physiques et hygiène', icone: '⚽', couleur: '#27ae60', ordre: 9 },
      { nom: 'Éveil Musical', description: 'Découverte des instruments', icone: '🎵', couleur: '#8e44ad', ordre: 10 }
    ];

    for (const domaine of domaines) {
      await query(
        `INSERT IGNORE INTO domaines_educatifs (nom, description, icone, couleur, ordre_affichage)
         VALUES (?, ?, ?, ?, ?)`,
        [domaine.nom, domaine.description, domaine.icone, domaine.couleur, domaine.ordre]
      );
    }
    console.log('✅ Domaines éducatifs créés\n');

    // ============================================
    // 5. BADGES
    // ============================================
    console.log('🏆 Création des badges...');

    const badges = [
      { nom: 'Premier Pas', description: 'Terminer son premier contenu', type: 'progression', points: 10 },
      { nom: 'Explorateur', description: 'Visiter 5 domaines différents', type: 'progression', points: 25 },
      { nom: 'Studieux', description: 'Terminer 10 contenus', type: 'progression', points: 50 },
      { nom: 'Champion Quiz', description: 'Obtenir 100% à un quiz', type: 'quiz', points: 30 },
      { nom: 'Régulier', description: 'Se connecter 7 jours de suite', type: 'temps', points: 40 },
      { nom: 'Expert', description: 'Terminer tous les contenus d\'un domaine', type: 'progression', points: 100 },
      { nom: 'Polyglotte', description: 'Terminer 10 contenus en langues', type: 'special', points: 75 },
      { nom: 'Matheux', description: 'Terminer 10 contenus en maths', type: 'special', points: 75 },
      { nom: 'Scientifique', description: 'Terminer 10 contenus en sciences', type: 'special', points: 75 },
      { nom: 'Légende', description: 'Obtenir 1000 points XP', type: 'progression', points: 200 }
    ];

    for (const badge of badges) {
      await query(
        `INSERT IGNORE INTO badges (nom, description, type, points_bonus, condition_obtention)
         VALUES (?, ?, ?, ?, ?)`,
        [badge.nom, badge.description, badge.type, badge.points, badge.description]
      );
    }
    console.log('✅ Badges créés\n');

    // ============================================
    // 6. APPLICATIONS AUTORISÉES (MODE KIOSQUE)
    // ============================================
    console.log('📱 Création du catalogue d\'applications...');

    const applications = [
      { nom: 'YouTube Kids', package_name: 'com.google.android.apps.youtube.kids', categorie: 'education' },
      { nom: 'Khan Academy Kids', package_name: 'org.khanacademy.android', categorie: 'education' },
      { nom: 'Duolingo', package_name: 'com.duolingo', categorie: 'education' },
      { nom: 'Scratch Jr', package_name: 'org.scratchjr.android', categorie: 'education' },
      { nom: 'PBS Kids Games', package_name: 'org.pbskids.gamesapp', categorie: 'jeu_educatif' },
      { nom: 'Toca Life World', package_name: 'com.tocaboca.tocalifeworld', categorie: 'jeu_educatif' },
      { nom: 'Calculatrice', package_name: 'com.google.android.calculator', categorie: 'utilitaire' },
      { nom: 'Google Photos', package_name: 'com.google.android.apps.photos', categorie: 'utilitaire' }
    ];

    for (const app of applications) {
      await query(
        `INSERT IGNORE INTO applications_autorisees (nom, package_name, categorie)
         VALUES (?, ?, ?)`,
        [app.nom, app.package_name, app.categorie]
      );
    }
    console.log('✅ Applications autorisées créées\n');

    // ============================================
    // 7. CONTENUS EXEMPLES
    // ============================================
    console.log('📖 Création de contenus exemples...');

    const [domaineLangues] = await query('SELECT id FROM domaines_educatifs WHERE nom = ?', ['Langues']);
    const [domaineMaths] = await query('SELECT id FROM domaines_educatifs WHERE nom = ?', ['Mathématiques']);
    const [domaineCulture] = await query('SELECT id FROM domaines_educatifs WHERE nom = ?', ['Culture Burkinabè']);

    const contenus = [
      {
        titre: 'L\'alphabet français - Les voyelles',
        description: 'Apprends à reconnaître et prononcer les voyelles A, E, I, O, U',
        type: 'video',
        domaine_id: domaineLangues.id,
        tranche_age_min: 4,
        tranche_age_max: 6,
        duree_minutes: 5,
        points_xp: 10,
        statut: 'publie'
      },
      {
        titre: 'Compter de 1 à 10',
        description: 'Apprends à compter de 1 à 10 avec des objets du quotidien',
        type: 'video',
        domaine_id: domaineMaths.id,
        tranche_age_min: 4,
        tranche_age_max: 6,
        duree_minutes: 8,
        points_xp: 15,
        statut: 'publie'
      },
      {
        titre: 'Quiz : Les additions simples',
        description: 'Teste tes connaissances sur les additions de 1 à 10',
        type: 'quiz',
        domaine_id: domaineMaths.id,
        tranche_age_min: 6,
        tranche_age_max: 8,
        duree_minutes: 10,
        points_xp: 20,
        statut: 'publie'
      },
      {
        titre: 'Conte : Le lièvre et l\'hyène',
        description: 'Un conte traditionnel burkinabè sur la ruse et l\'intelligence',
        type: 'audio',
        domaine_id: domaineCulture.id,
        tranche_age_min: 4,
        tranche_age_max: 12,
        duree_minutes: 12,
        points_xp: 15,
        statut: 'publie'
      },
      {
        titre: 'Les régions du Burkina Faso',
        description: 'Découvre les 13 régions du Burkina Faso et leurs spécificités',
        type: 'document',
        domaine_id: domaineCulture.id,
        tranche_age_min: 8,
        tranche_age_max: 12,
        duree_minutes: 15,
        points_xp: 25,
        statut: 'publie'
      }
    ];

    for (const contenu of contenus) {
      await query(
        `INSERT IGNORE INTO contenus
         (titre, description, type, domaine_id, tranche_age_min, tranche_age_max, duree_minutes, points_xp, statut, date_publication)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [contenu.titre, contenu.description, contenu.type, contenu.domaine_id,
         contenu.tranche_age_min, contenu.tranche_age_max, contenu.duree_minutes,
         contenu.points_xp, contenu.statut]
      );
    }
    console.log('✅ Contenus exemples créés\n');

    console.log('🎉 Seed terminé avec succès !');
    console.log('\n📋 Récapitulatif :');
    console.log('   - 5 rôles (ADMIN, VALIDATEUR, GESTIONNAIRE_CONTENU, PARENT, ENFANT)');
    console.log('   - 4 utilisateurs de test');
    console.log('   - 4 types d\'abonnements');
    console.log('   - 10 domaines éducatifs');
    console.log('   - 10 badges');
    console.log('   - 8 applications autorisées');
    console.log('   - 5 contenus exemples');
    console.log('\n🔑 Comptes de test :');
    console.log('   ADMIN:        admin@plateforme-educative.bf / Admin2024!');
    console.log('   VALIDATEUR:   validateur@plateforme-educative.bf / Validateur2024!');
    console.log('   GESTIONNAIRE: gestionnaire@plateforme-educative.bf / Gestionnaire2024!');
    console.log('   PARENT:       parent@plateforme-educative.bf / Parent2024!');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Exécuter le seed
seed().catch(console.error);
