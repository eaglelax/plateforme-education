const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Configuration des limites et formats par type
const UPLOAD_CONFIG = {
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    extensions: ['.mp4', '.webm', '.mov', '.avi'],
    maxSize: 500 * 1024 * 1024, // 500 Mo
    maxSizeMo: 500
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    maxSize: 100 * 1024 * 1024, // 100 Mo
    maxSizeMo: 100
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-powerpoint'
    ],
    extensions: ['.pdf', '.docx', '.pptx', '.doc', '.ppt'],
    maxSize: 50 * 1024 * 1024, // 50 Mo
    maxSizeMo: 50
  },
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxSize: 10 * 1024 * 1024, // 10 Mo
    maxSizeMo: 10
  },
  miniature: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5 Mo
    maxSizeMo: 5
  }
};

// Tous les types de media (video, audio, document)
const MEDIA_CONFIG = {
  mimeTypes: [
    ...UPLOAD_CONFIG.video.mimeTypes,
    ...UPLOAD_CONFIG.audio.mimeTypes,
    ...UPLOAD_CONFIG.document.mimeTypes
  ],
  extensions: [
    ...UPLOAD_CONFIG.video.extensions,
    ...UPLOAD_CONFIG.audio.extensions,
    ...UPLOAD_CONFIG.document.extensions
  ],
  maxSize: 500 * 1024 * 1024 // 500 Mo (le plus grand)
};

// Creer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(uploadsDir, 'temp');
const contenusDir = path.join(uploadsDir, 'contenus');

[uploadsDir, tempDir, contenusDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Normaliser le nom de fichier (supprimer accents, espaces)
 */
const normalizeFileName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);

  // Normaliser: supprimer accents, remplacer espaces par tirets, supprimer caracteres speciaux
  const normalized = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-zA-Z0-9]/g, '-') // Remplacer caracteres speciaux par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .replace(/^-|-$/g, '') // Supprimer tirets debut/fin
    .toLowerCase()
    .substring(0, 50); // Limiter la longueur

  return normalized || 'fichier';
};

/**
 * Determiner le type de fichier a partir du MIME type
 */
const getFileType = (mimeType) => {
  if (UPLOAD_CONFIG.video.mimeTypes.includes(mimeType)) return 'video';
  if (UPLOAD_CONFIG.audio.mimeTypes.includes(mimeType)) return 'audio';
  if (UPLOAD_CONFIG.document.mimeTypes.includes(mimeType)) return 'document';
  if (UPLOAD_CONFIG.image.mimeTypes.includes(mimeType)) return 'image';
  return 'autre';
};

/**
 * Configuration du stockage temporaire
 */
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uuid = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    const normalizedName = normalizeFileName(file.originalname);
    const filename = `${uuid}_${normalizedName}${ext}`;

    // Stocker les infos dans req pour utilisation ulterieure
    req.uploadInfo = {
      uuid,
      originalName: file.originalname,
      storageName: filename,
      extension: ext
    };

    cb(null, filename);
  }
});

/**
 * Filtre pour les fichiers media (video, audio, document)
 */
const mediaFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!MEDIA_CONFIG.mimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(415, `Format de fichier non supporte. Formats acceptes: ${MEDIA_CONFIG.extensions.join(', ')}`), false);
  }

  if (!MEDIA_CONFIG.extensions.includes(ext)) {
    return cb(new ApiError(415, `Extension de fichier non supportee. Extensions acceptees: ${MEDIA_CONFIG.extensions.join(', ')}`), false);
  }

  cb(null, true);
};

/**
 * Filtre pour les miniatures (images uniquement)
 */
const miniatureFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!UPLOAD_CONFIG.miniature.mimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(415, `Format de miniature non supporte. Formats acceptes: JPG, PNG, WEBP`), false);
  }

  if (!UPLOAD_CONFIG.miniature.extensions.includes(ext)) {
    return cb(new ApiError(415, `Extension de fichier non supportee pour miniature`), false);
  }

  cb(null, true);
};

/**
 * Filtre pour les images de questions
 */
const questionImageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!UPLOAD_CONFIG.image.mimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(415, `Format d'image non supporte. Formats acceptes: JPG, PNG, WEBP, GIF`), false);
  }

  cb(null, true);
};

/**
 * Middleware pour upload de fichier media
 */
const uploadMedia = multer({
  storage: tempStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: MEDIA_CONFIG.maxSize,
    files: 1
  }
}).single('media');

/**
 * Middleware pour upload de miniature
 */
const uploadMiniature = multer({
  storage: tempStorage,
  fileFilter: miniatureFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.miniature.maxSize,
    files: 1
  }
}).single('miniature');

/**
 * Middleware pour upload d'image de question
 */
const uploadQuestionImage = multer({
  storage: tempStorage,
  fileFilter: questionImageFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.image.maxSize,
    files: 1
  }
}).single('image');

/**
 * Middleware pour upload multiple (media + miniature)
 */
const uploadContenuFiles = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'media') {
      return mediaFileFilter(req, file, cb);
    } else if (file.fieldname === 'miniature') {
      return miniatureFileFilter(req, file, cb);
    }
    cb(new ApiError(400, 'Champ de fichier non reconnu'), false);
  },
  limits: {
    fileSize: MEDIA_CONFIG.maxSize,
    files: 2
  }
}).fields([
  { name: 'media', maxCount: 1 },
  { name: 'miniature', maxCount: 1 }
]);

/**
 * Wrapper pour gerer les erreurs Multer
 */
const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(413, 'Le fichier depasse la taille maximale autorisee'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ApiError(400, 'Trop de fichiers envoyes'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError(400, 'Champ de fichier inattendu'));
        }
        return next(new ApiError(400, `Erreur upload: ${err.message}`));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
};

/**
 * Deplacer un fichier temporaire vers le stockage permanent
 */
const moveToStorage = async (tempFilePath, contenuId, type = 'media') => {
  const contenuDir = path.join(contenusDir, String(contenuId), type);

  if (!fs.existsSync(contenuDir)) {
    fs.mkdirSync(contenuDir, { recursive: true });
  }

  const fileName = path.basename(tempFilePath);
  // Retirer le UUID du nom pour le stockage permanent
  const cleanFileName = fileName.replace(/^[a-f0-9-]+_/, '');
  const destPath = path.join(contenuDir, cleanFileName);

  return new Promise((resolve, reject) => {
    fs.rename(tempFilePath, destPath, (err) => {
      if (err) {
        // Si rename echoue (cross-device), copier puis supprimer
        const readStream = fs.createReadStream(tempFilePath);
        const writeStream = fs.createWriteStream(destPath);

        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('close', () => {
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) console.error('Erreur suppression fichier temp:', unlinkErr);
            resolve(destPath);
          });
        });

        readStream.pipe(writeStream);
      } else {
        resolve(destPath);
      }
    });
  });
};

/**
 * Supprimer un fichier
 */
const deleteFile = (filePath) => {
  return new Promise((resolve) => {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erreur suppression fichier:', err);
      resolve();
    });
  });
};

/**
 * Nettoyer les fichiers temporaires expires (a executer periodiquement)
 */
const cleanExpiredTempFiles = async () => {
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 heures

  for (const file of files) {
    if (file === '.gitkeep') continue;

    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtimeMs;

    if (fileAge > maxAge) {
      await deleteFile(filePath);
      console.log(`Fichier temporaire expire supprime: ${file}`);
    }
  }
};

module.exports = {
  UPLOAD_CONFIG,
  MEDIA_CONFIG,
  getFileType,
  normalizeFileName,
  uploadMedia: handleMulterError(uploadMedia),
  uploadMiniature: handleMulterError(uploadMiniature),
  uploadQuestionImage: handleMulterError(uploadQuestionImage),
  uploadContenuFiles: handleMulterError(uploadContenuFiles),
  moveToStorage,
  deleteFile,
  cleanExpiredTempFiles,
  tempDir,
  contenusDir
};
