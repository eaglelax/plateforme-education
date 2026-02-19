require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================================================
// SOLUTION LWS : Toutes les routes passent par /?route=
// ==================================================

// Charger les modules
let db, routes, errorHandler;
let dbConnected = false;

try {
  db = require('./src/config/database');
  routes = require('./src/routes');
  errorHandler = require('./src/middlewares/errorHandler');
} catch (err) {
  console.error('Erreur chargement modules:', err.message);
}

// Fichiers statiques pour uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route principale qui gere tout
app.all('/', async (req, res, next) => {
  const route = req.query.route || '/';

  // Si pas de parametre route, afficher info API
  if (route === '/') {
    return res.json({
      success: true,
      message: 'Plateforme Educative API',
      version: '2.0.0',
      database: dbConnected ? 'connected' : 'disconnected',
      usage: 'Utilisez ?route=/chemin pour acceder aux endpoints',
      exemples: {
        health: '/?route=/api/health',
        login: '/?route=/api/auth/login (POST)',
        register: '/?route=/api/auth/register (POST)',
        utilisateurs: '/?route=/api/utilisateurs',
        enfants: '/?route=/api/enfants',
        contenus: '/?route=/api/contenus',
        abonnements: '/?route=/api/abonnements'
      }
    });
  }

  // Health check
  if (route === '/api/health' || route === '/health') {
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  }

  // Passer aux routes API
  if (routes && route.startsWith('/api/')) {
    // Modifier l'URL pour simuler la route demandee
    req.url = route.replace('/api', '') || '/';
    req.originalUrl = route;
    req.path = req.url.split('?')[0];
    req.baseUrl = '/api';

    return routes(req, res, (err) => {
      if (err) {
        const status = err.status || err.statusCode || 500;
        return res.status(status).json({
          success: false,
          message: err.message || 'Erreur serveur'
        });
      }
      // Si next() est appele sans erreur, route non trouvee
      res.status(404).json({
        success: false,
        message: 'Route non trouvee',
        route: route
      });
    });
  }

  // Route non trouvee
  res.status(404).json({
    success: false,
    message: 'Route non trouvee',
    route: route,
    hint: 'Les routes doivent commencer par /api/'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne'
  });
});

// Demarrage
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    if (db && db.testConnection) {
      await db.testConnection();
      dbConnected = true;
      console.log('MySQL connecte');
    }
  } catch (err) {
    console.error('Erreur DB:', err.message);
    dbConnected = false;
  }

  app.listen(PORT, () => {
    console.log('Serveur demarre sur port ' + PORT);
    console.log('Mode: ' + (process.env.NODE_ENV || 'development'));
  });
}

start();

module.exports = app;
