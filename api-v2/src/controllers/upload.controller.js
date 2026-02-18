const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  UPLOAD_CONFIG,
  getFileType,
  moveToStorage,
  deleteFile,
  tempDir
} = require('../middlewares/upload');

/**
 * Calculer le hash MD5 d'un fichier
 */
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

/**
 * Obtenir la duree d'un fichier video/audio (simplifiee)
 * Note: Pour une implementation complete, utiliser ffprobe
 */
const getMediaDuration = async (filePath, mimeType) => {
  // Pour l'instant, retourner null - a implementer avec ffprobe si disponible
  return null;
};

/**
 * Upload d'un fichier media (video, audio, document)
 * POST /api/uploads/media
 */
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucun fichier envoye');
  }

  const file = req.file;
  const fileType = getFileType(file.mimetype);

  // Verifier la taille selon le type
  const config = UPLOAD_CONFIG[fileType];
  if (config && file.size > config.maxSize) {
    // Supprimer le fichier uploade
    await deleteFile(file.path);
    throw ApiError.badRequest(`Le fichier depasse la taille maximale autorisee (${config.maxSizeMo} Mo)`);
  }

  // Calculer le hash MD5
  const hash = await calculateFileHash(file.path);

  // Generer UUID pour ce fichier
  const uuid = uuidv4();

  // Calculer la date d'expiration (24h)
  const dateExpiration = new Date();
  dateExpiration.setHours(dateExpiration.getHours() + 24);

  // Obtenir la duree si c'est une video ou audio
  const duration = await getMediaDuration(file.path, file.mimetype);

  // Inserer dans la base de donnees
  const result = await query(
    `INSERT INTO fichiers_uploades
     (uuid, nom_original, nom_stockage, chemin_relatif, type_mime, taille_octets,
      type_fichier, duree_secondes, hash_md5, est_temporaire, date_expiration,
      scan_antivirus, utilisateur_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, 'clean', ?)`,
    [
      uuid,
      file.originalname,
      file.filename,
      `temp/${file.filename}`,
      file.mimetype,
      file.size,
      fileType,
      duration,
      hash,
      dateExpiration,
      req.user.id
    ]
  );

  // Formater la duree
  let durationFormatted = null;
  if (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    durationFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  res.status(201).json({
    success: true,
    message: 'Fichier uploade avec succes',
    data: {
      fileId: uuid,
      id: result.insertId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      fileSizeMo: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      mediaType: fileType,
      duration: duration,
      durationFormatted: durationFormatted,
      urlTemporaire: `/uploads/temp/${file.filename}`
    }
  });
});

/**
 * Upload d'une miniature
 * POST /api/uploads/miniature
 */
const uploadMiniature = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucune image envoyee');
  }

  const file = req.file;

  // Verifier la taille
  if (file.size > UPLOAD_CONFIG.miniature.maxSize) {
    await deleteFile(file.path);
    throw ApiError.badRequest(`L'image depasse la taille maximale autorisee (${UPLOAD_CONFIG.miniature.maxSizeMo} Mo)`);
  }

  // Calculer le hash MD5
  const hash = await calculateFileHash(file.path);

  // Generer UUID
  const uuid = uuidv4();

  // Date d'expiration
  const dateExpiration = new Date();
  dateExpiration.setHours(dateExpiration.getHours() + 24);

  // Inserer dans la base
  const result = await query(
    `INSERT INTO fichiers_uploades
     (uuid, nom_original, nom_stockage, chemin_relatif, type_mime, taille_octets,
      type_fichier, hash_md5, est_temporaire, date_expiration, scan_antivirus, utilisateur_id)
     VALUES (?, ?, ?, ?, ?, ?, 'image', ?, TRUE, ?, 'clean', ?)`,
    [
      uuid,
      file.originalname,
      file.filename,
      `temp/${file.filename}`,
      file.mimetype,
      file.size,
      hash,
      dateExpiration,
      req.user.id
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Miniature uploadee avec succes',
    data: {
      fileId: uuid,
      id: result.insertId,
      fileName: file.originalname,
      fileSize: file.size,
      fileSizeKo: parseFloat((file.size / 1024).toFixed(2)),
      urlTemporaire: `/uploads/temp/${file.filename}`
    }
  });
});

/**
 * Upload d'une image pour une question de quiz
 * POST /api/uploads/question-image
 */
const uploadQuestionImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucune image envoyee');
  }

  const file = req.file;

  // Verifier la taille
  if (file.size > UPLOAD_CONFIG.image.maxSize) {
    await deleteFile(file.path);
    throw ApiError.badRequest(`L'image depasse la taille maximale autorisee (${UPLOAD_CONFIG.image.maxSizeMo} Mo)`);
  }

  const hash = await calculateFileHash(file.path);
  const uuid = uuidv4();
  const dateExpiration = new Date();
  dateExpiration.setHours(dateExpiration.getHours() + 24);

  const result = await query(
    `INSERT INTO fichiers_uploades
     (uuid, nom_original, nom_stockage, chemin_relatif, type_mime, taille_octets,
      type_fichier, hash_md5, est_temporaire, date_expiration, scan_antivirus, utilisateur_id)
     VALUES (?, ?, ?, ?, ?, ?, 'image', ?, TRUE, ?, 'clean', ?)`,
    [
      uuid,
      file.originalname,
      file.filename,
      `temp/${file.filename}`,
      file.mimetype,
      file.size,
      hash,
      dateExpiration,
      req.user.id
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Image uploadee avec succes',
    data: {
      fileId: uuid,
      id: result.insertId,
      fileName: file.originalname,
      fileSize: file.size,
      fileSizeKo: parseFloat((file.size / 1024).toFixed(2)),
      urlTemporaire: `/uploads/temp/${file.filename}`
    }
  });
});

/**
 * Obtenir les informations d'un fichier uploade
 * GET /api/uploads/:uuid
 */
const getFileInfo = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [file] = await query(
    `SELECT f.*, u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
     FROM fichiers_uploades f
     LEFT JOIN utilisateurs u ON f.utilisateur_id = u.id
     WHERE f.uuid = ?`,
    [uuid]
  );

  if (!file) {
    throw ApiError.notFound('Fichier non trouve');
  }

  // Verifier que l'utilisateur a le droit de voir ce fichier
  if (file.utilisateur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acces non autorise a ce fichier');
  }

  res.json({
    success: true,
    data: {
      id: file.id,
      uuid: file.uuid,
      nomOriginal: file.nom_original,
      typeMime: file.type_mime,
      taille: file.taille_octets,
      tailleMo: parseFloat((file.taille_octets / (1024 * 1024)).toFixed(2)),
      typeFichier: file.type_fichier,
      dureeSecondes: file.duree_secondes,
      estTemporaire: file.est_temporaire,
      dateExpiration: file.date_expiration,
      scanAntivirus: file.scan_antivirus,
      url: `/uploads/${file.chemin_relatif}`,
      dateCreation: file.date_creation,
      uploadePar: file.utilisateur_nom ? `${file.utilisateur_prenom} ${file.utilisateur_nom}` : null
    }
  });
});

/**
 * Supprimer un fichier temporaire
 * DELETE /api/uploads/:uuid
 */
const deleteUploadedFile = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [file] = await query(
    'SELECT * FROM fichiers_uploades WHERE uuid = ?',
    [uuid]
  );

  if (!file) {
    throw ApiError.notFound('Fichier non trouve');
  }

  // Verifier les droits
  if (file.utilisateur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acces non autorise');
  }

  // Ne pas permettre la suppression de fichiers deja associes a un contenu
  if (file.contenu_id) {
    throw ApiError.badRequest('Impossible de supprimer un fichier associe a un contenu');
  }

  // Supprimer le fichier physique
  const filePath = path.join(__dirname, '../../uploads', file.chemin_relatif);
  if (fs.existsSync(filePath)) {
    await deleteFile(filePath);
  }

  // Supprimer de la base
  await query('DELETE FROM fichiers_uploades WHERE id = ?', [file.id]);

  res.json({
    success: true,
    message: 'Fichier supprime avec succes'
  });
});

/**
 * Lister mes fichiers uploades (temporaires)
 * GET /api/uploads/mes-fichiers
 */
const getMesFichiers = asyncHandler(async (req, res) => {
  const fichiers = await query(
    `SELECT * FROM fichiers_uploades
     WHERE utilisateur_id = ? AND est_temporaire = TRUE
     ORDER BY date_creation DESC
     LIMIT 50`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: fichiers.map(f => ({
      id: f.id,
      uuid: f.uuid,
      nomOriginal: f.nom_original,
      typeMime: f.type_mime,
      taille: f.taille_octets,
      tailleMo: parseFloat((f.taille_octets / (1024 * 1024)).toFixed(2)),
      typeFichier: f.type_fichier,
      dureeSecondes: f.duree_secondes,
      url: `/uploads/${f.chemin_relatif}`,
      dateExpiration: f.date_expiration,
      dateCreation: f.date_creation
    }))
  });
});

/**
 * Associer un fichier uploade a un contenu (usage interne)
 */
const associerFichierAContenu = async (fileUuid, contenuId, type = 'media') => {
  const [file] = await query(
    'SELECT * FROM fichiers_uploades WHERE uuid = ?',
    [fileUuid]
  );

  if (!file) {
    throw new Error('Fichier non trouve');
  }

  // Deplacer le fichier vers le stockage permanent
  const tempFilePath = path.join(__dirname, '../../uploads', file.chemin_relatif);
  const newPath = await moveToStorage(tempFilePath, contenuId, type);
  const newRelativePath = path.relative(path.join(__dirname, '../../uploads'), newPath);

  // Mettre a jour la base
  await query(
    `UPDATE fichiers_uploades
     SET contenu_id = ?,
         chemin_relatif = ?,
         est_temporaire = FALSE,
         date_expiration = NULL
     WHERE id = ?`,
    [contenuId, newRelativePath.replace(/\\/g, '/'), file.id]
  );

  return {
    id: file.id,
    url: `/uploads/${newRelativePath.replace(/\\/g, '/')}`
  };
};

module.exports = {
  uploadMedia,
  uploadMiniature,
  uploadQuestionImage,
  getFileInfo,
  deleteUploadedFile,
  getMesFichiers,
  associerFichierAContenu
};
