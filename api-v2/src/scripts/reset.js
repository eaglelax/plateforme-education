require('dotenv').config();

const { pool, closePool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function reset() {
  console.log('🔄 RESET COMPLET DE LA BASE DE DONNÉES\n');
  console.log('⚠️  Attention: Toutes les données seront supprimées!\n');

  const connection = await pool.getConnection();

  try {
    // ============================================
    // 1. DÉSACTIVER LES CONTRAINTES FK
    // ============================================
    console.log('🔓 Désactivation des contraintes...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // ============================================
    // 2. RÉCUPÉRER ET SUPPRIMER TOUTES LES TABLES
    // ============================================
    console.log('🗑️  Suppression des tables existantes...');

    const [tables] = await connection.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
    `, [process.env.DB_NAME]);

    for (const row of tables) {
      const tableName = row.TABLE_NAME || row.table_name;
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`   ✓ Table ${tableName} supprimée`);
    }

    // ============================================
    // 3. RÉACTIVER LES CONTRAINTES FK
    // ============================================
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 Contraintes réactivées\n');

    // ============================================
    // 4. RECRÉER LES TABLES (MIGRATION)
    // ============================================
    console.log('📝 Recréation des tables...');

    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length < 5) continue;

      try {
        await connection.query(statement);

        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE [`"]?(\w+)[`"]?/i);
          if (match) {
            console.log(`   ✓ Table ${match[1]} créée`);
          }
        }
      } catch (error) {
        if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.code !== 'ER_DUP_KEYNAME') {
          console.error(`   ⚠️ Erreur: ${error.message}`);
        }
      }
    }

    console.log('\n🌱 Insertion des données initiales...');

    // ============================================
    // 5. SEED - RÔLES
    // ============================================
    const roles = [
      { nom: 'ADMIN', description: 'Administrateur de la plateforme', permissions: JSON.stringify({ all: true }) },
      { nom: 'PARENT', description: 'Parent gérant les profils enfants', permissions: JSON.stringify({ children: ['crud'], subscriptions: ['crud'] }) },
      { nom: 'ENFANT', description: 'Profil enfant', permissions: JSON.stringify({ content: ['read'], progress: ['read', 'update'] }) }
    ];

    for (const role of roles) {
      await connection.query(
        'INSERT INTO roles (nom, description, permissions) VALUES (?, ?, ?)',
        [role.nom, role.description, role.permissions]
      );
    }
    console.log('   ✓ Rôles créés');

    // ============================================
    // 6. SEED - ADMIN
    // ============================================
    const [adminRole] = await connection.query('SELECT id FROM roles WHERE nom = ?', ['ADMIN']);
    const adminPassword = await bcrypt.hash('Admin2024!', 12);

    await connection.query(
      `INSERT INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Admin', 'Système', '+22670000001', 'admin@plateforme-educative.bf', adminPassword, adminRole[0].id]
    );
    console.log('   ✓ Administrateur créé');

    // ============================================
    // 7. SEED - TYPES ABONNEMENTS
    // ============================================
    const typesAbonnements = [
      { nom: 'Découverte', description: 'Essai 1 mois', prix: 2500, duree: 'MENSUEL', duree_jours: 30, appareils: 1, download: false, premium: false },
      { nom: 'Essentiel', description: 'Mensuel complet', prix: 5000, duree: 'MENSUEL', duree_jours: 30, appareils: 2, download: true, premium: false },
      { nom: 'Famille', description: 'Trimestriel famille', prix: 12000, duree: 'TRIMESTRIEL', duree_jours: 90, appareils: 3, download: true, premium: true },
      { nom: 'Premium Annuel', description: 'Annuel illimité', prix: 40000, duree: 'ANNUEL', duree_jours: 365, appareils: 5, download: true, premium: true }
    ];

    for (const t of typesAbonnements) {
      await connection.query(
        `INSERT INTO types_abonnements (nom, description, prix, duree, duree_jours, nombre_appareils_max, telechargement_autorise, contenu_premium)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.nom, t.description, t.prix, t.duree, t.duree_jours, t.appareils, t.download, t.premium]
      );
    }
    console.log('   ✓ Types d\'abonnements créés');

    // ============================================
    // 8. SEED - DOMAINES ÉDUCATIFS
    // ============================================
    const domaines = [
      { nom: 'Langues', description: 'Français, Anglais et langues locales', icone: '🗣️', couleur: '#3498db', ordre: 1 },
      { nom: 'Mathématiques', description: 'Calcul, géométrie et logique', icone: '🔢', couleur: '#e74c3c', ordre: 2 },
      { nom: 'Sciences', description: 'Sciences naturelles', icone: '🔬', couleur: '#2ecc71', ordre: 3 },
      { nom: 'Histoire-Géo', description: 'Histoire du Burkina et du monde', icone: '🌍', couleur: '#f39c12', ordre: 4 },
      { nom: 'Arts', description: 'Musique, dessin et créativité', icone: '🎨', couleur: '#9b59b6', ordre: 5 },
      { nom: 'Culture Burkinabè', description: 'Traditions et patrimoine', icone: '🏛️', couleur: '#e67e22', ordre: 6 },
      { nom: 'Éducation Civique', description: 'Citoyenneté et valeurs', icone: '🤝', couleur: '#1abc9c', ordre: 7 },
      { nom: 'Informatique', description: 'Initiation au numérique', icone: '💻', couleur: '#34495e', ordre: 8 },
      { nom: 'Sport & Santé', description: 'Activités physiques', icone: '⚽', couleur: '#27ae60', ordre: 9 },
      { nom: 'Éveil Musical', description: 'Découverte musicale', icone: '🎵', couleur: '#8e44ad', ordre: 10 }
    ];

    for (const d of domaines) {
      await connection.query(
        'INSERT INTO domaines_educatifs (nom, description, icone, couleur, ordre_affichage) VALUES (?, ?, ?, ?, ?)',
        [d.nom, d.description, d.icone, d.couleur, d.ordre]
      );
    }
    console.log('   ✓ Domaines éducatifs créés');

    // ============================================
    // 9. SEED - BADGES
    // ============================================
    const badges = [
      { nom: 'Premier Pas', description: 'Terminer son premier contenu', type: 'progression', points: 10 },
      { nom: 'Explorateur', description: 'Visiter 5 domaines', type: 'progression', points: 25 },
      { nom: 'Studieux', description: 'Terminer 10 contenus', type: 'progression', points: 50 },
      { nom: 'Champion Quiz', description: 'Obtenir 100% à un quiz', type: 'quiz', points: 30 },
      { nom: 'Régulier', description: '7 jours de suite', type: 'temps', points: 40 },
      { nom: 'Expert', description: 'Terminer un domaine', type: 'progression', points: 100 },
      { nom: 'Polyglotte', description: '10 contenus en langues', type: 'special', points: 75 },
      { nom: 'Matheux', description: '10 contenus en maths', type: 'special', points: 75 },
      { nom: 'Scientifique', description: '10 contenus en sciences', type: 'special', points: 75 },
      { nom: 'Légende', description: '1000 points XP', type: 'progression', points: 200 }
    ];

    for (const b of badges) {
      await connection.query(
        'INSERT INTO badges (nom, description, type, points_bonus, condition_obtention) VALUES (?, ?, ?, ?, ?)',
        [b.nom, b.description, b.type, b.points, b.description]
      );
    }
    console.log('   ✓ Badges créés');

    // ============================================
    // 10. SEED - APPLICATIONS AUTORISÉES
    // ============================================
    const apps = [
      { nom: 'YouTube Kids', package: 'com.google.android.apps.youtube.kids', cat: 'education' },
      { nom: 'Khan Academy Kids', package: 'org.khanacademy.android', cat: 'education' },
      { nom: 'Duolingo', package: 'com.duolingo', cat: 'education' },
      { nom: 'Scratch Jr', package: 'org.scratchjr.android', cat: 'education' },
      { nom: 'PBS Kids Games', package: 'org.pbskids.gamesapp', cat: 'jeu_educatif' },
      { nom: 'Toca Life World', package: 'com.tocaboca.tocalifeworld', cat: 'jeu_educatif' },
      { nom: 'Calculatrice', package: 'com.google.android.calculator', cat: 'utilitaire' },
      { nom: 'Google Photos', package: 'com.google.android.apps.photos', cat: 'utilitaire' }
    ];

    for (const app of apps) {
      await connection.query(
        'INSERT INTO applications_autorisees (nom, package_name, categorie) VALUES (?, ?, ?)',
        [app.nom, app.package, app.cat]
      );
    }
    console.log('   ✓ Applications autorisées créées');

    // ============================================
    // 11. SEED - CONTENUS EXEMPLES
    // ============================================
    const [domaineLangues] = await connection.query('SELECT id FROM domaines_educatifs WHERE nom = ?', ['Langues']);
    const [domaineMaths] = await connection.query('SELECT id FROM domaines_educatifs WHERE nom = ?', ['Mathématiques']);
    const [domaineCulture] = await connection.query('SELECT id FROM domaines_educatifs WHERE nom = ?', ['Culture Burkinabè']);

    const contenus = [
      { titre: 'L\'alphabet français - Les voyelles', desc: 'Apprends les voyelles A, E, I, O, U', type: 'video', domaine: domaineLangues[0].id, ageMin: 4, ageMax: 6, duree: 5, xp: 10 },
      { titre: 'Compter de 1 à 10', desc: 'Apprends à compter', type: 'video', domaine: domaineMaths[0].id, ageMin: 4, ageMax: 6, duree: 8, xp: 15 },
      { titre: 'Quiz : Les additions simples', desc: 'Teste les additions', type: 'quiz', domaine: domaineMaths[0].id, ageMin: 6, ageMax: 8, duree: 10, xp: 20 },
      { titre: 'Conte : Le lièvre et l\'hyène', desc: 'Conte traditionnel', type: 'audio', domaine: domaineCulture[0].id, ageMin: 4, ageMax: 12, duree: 12, xp: 15 },
      { titre: 'Les régions du Burkina Faso', desc: 'Découvre les 13 régions', type: 'document', domaine: domaineCulture[0].id, ageMin: 8, ageMax: 12, duree: 15, xp: 25 }
    ];

    for (const c of contenus) {
      await connection.query(
        `INSERT INTO contenus (titre, description, type, domaine_id, tranche_age_min, tranche_age_max, duree_minutes, points_xp, statut, date_publication)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'publie', NOW())`,
        [c.titre, c.desc, c.type, c.domaine, c.ageMin, c.ageMax, c.duree, c.xp]
      );
    }
    console.log('   ✓ Contenus exemples créés');

    // ============================================
    // TERMINÉ
    // ============================================
    console.log('\n✅ =============================================');
    console.log('   RESET TERMINÉ AVEC SUCCÈS !');
    console.log('   =============================================');
    console.log('\n📋 Compte admin:');
    console.log('   Email: admin@plateforme-educative.bf');
    console.log('   Mot de passe: Admin2024!');
    console.log('   =============================================\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du reset:', error);
    throw error;
  } finally {
    connection.release();
    await closePool();
  }
}

// Exécuter
reset().catch(console.error);
