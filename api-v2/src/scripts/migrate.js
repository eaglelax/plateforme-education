require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool, closePool } = require('../config/database');

async function migrate() {
  console.log('🔄 Démarrage de la migration...\n');

  try {
    // Lire le fichier SQL
    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Diviser en statements individuels
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 ${statements.length} statements SQL à exécuter\n`);

    const connection = await pool.getConnection();

    try {
      // Exécuter chaque statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Ignorer les commentaires et lignes vides
        if (statement.startsWith('--') || statement.length < 5) {
          continue;
        }

        try {
          await connection.query(statement);

          // Afficher la progression pour les CREATE TABLE
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const match = statement.match(/CREATE TABLE [`"]?(\w+)[`"]?/i);
            if (match) {
              console.log(`✅ Table créée: ${match[1]}`);
            }
          }
        } catch (error) {
          // Ignorer les erreurs "table exists" et "duplicate key"
          if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.code !== 'ER_DUP_KEYNAME') {
            console.error(`⚠️ Erreur: ${error.message}`);
          }
        }
      }

      console.log('\n🎉 Migration terminée avec succès !');

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Exécuter la migration
migrate().catch(console.error);
