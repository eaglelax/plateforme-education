require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// CORS - Autoriser les requetes cross-origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://edo.genius-universe.com'],
  credentials: true
}));

// Middleware JSON
app.use(express.json());

// Servir les fichiers statiques (uploads: media, miniatures)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route racine
app.get('/', (req, res) => {
  res.json({ message: 'API Plateforme Educative v2', status: 'OK' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', route: '/health' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', route: '/api/health' });
});

// Monter toutes les routes sous /api
app.use('/api', routes);

// Gestion des erreurs
app.use(errorHandler);

// 404 pour les routes non trouvees
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Demarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API disponible sur http://localhost:${PORT}/api`);
});

module.exports = app;
