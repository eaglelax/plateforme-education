const express = require('express');
const router = express.Router();
const { streamFile } = require('../controllers/stream.controller');

// Stream fichier media par chemin relatif
// GET /api/stream/*
router.get('/*', streamFile);

module.exports = router;
