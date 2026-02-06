const mysql = require('mysql2/promise');

// Configuration du pool de connexions
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'plateforme_educative',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timezone pour Burkina Faso (UTC+0)
  timezone: '+00:00',
  // Support des dates JavaScript
  dateStrings: false
};

// Création du pool
const pool = mysql.createPool(poolConfig);

/**
 * Exécute une requête SQL avec paramètres
 * @param {string} sql - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Array>} Résultats de la requête
 */
async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Exécute plusieurs requêtes dans une transaction
 * @param {Function} callback - Fonction recevant la connexion
 * @returns {Promise<any>} Résultat de la transaction
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Teste la connexion à la base de données
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

/**
 * Ferme le pool de connexions
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool
};
