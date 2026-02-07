import axios from 'axios';

// URL de base - LWS utilise le format ?route=
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Detection si on est sur LWS (production)
const isLWS = BASE_URL.includes('apieducative.genius-universe.com');

// Fonction pour construire l'URL avec ?route= pour LWS
const buildUrl = (path) => {
  if (isLWS) {
    let cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (!cleanPath.startsWith('/api/')) {
      cleanPath = `/api${cleanPath}`;
    }
    // LWS format: https://apieducative.genius-universe.com/?route=/api/...
    return `https://apieducative.genius-universe.com/?route=${cleanPath}`;
  }
  return `${BASE_URL}${path}`;
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes timeout
});

// Intercepteur pour ajouter le token et construire l'URL
api.interceptors.request.use(
  (config) => {
    const originalUrl = config.url || '';
    config.url = buildUrl(originalUrl);

    console.log('[API] Request:', config.method?.toUpperCase(), config.url);

    // Ne pas envoyer de token pour login/register
    const isAuthRoute = originalUrl.includes('/auth/login') || originalUrl.includes('/auth/register');

    if (!isAuthRoute) {
      // Detecter si on est sur une page admin (URL du navigateur ou route API admin)
      const isAdminContext = window.location.pathname.startsWith('/admin') ||
        originalUrl.includes('/a-valider') ||
        originalUrl.includes('/mes-contenus') ||
        originalUrl.includes('/contenus/tous') ||
        originalUrl.includes('/stats-validation') ||
        originalUrl.includes('/validation');

      // Utiliser admin-token en priorite si contexte admin
      const token = isAdminContext
        ? (localStorage.getItem('admin-token') || localStorage.getItem('token'))
        : (localStorage.getItem('token') || localStorage.getItem('admin-token'));

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gerer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// ============================================
// SERVICES AUTH
// ============================================
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin-token');
  },
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ============================================
// SERVICES ENFANTS
// ============================================
export const enfantService = {
  getAll: (params) => api.get('/enfants', { params }),
  getMesEnfants: () => api.get('/enfants'),
  getById: (id) => api.get(`/enfants/${id}`),
  create: (data) => api.post('/enfants', data),
  update: (id, data) => api.put(`/enfants/${id}`, data),
  delete: (id) => api.delete(`/enfants/${id}`),
  // Gestion identifiants
  getIdentifiants: (id) => api.get(`/enfants/${id}/identifiants`),
  regenererMotDePasse: (id) => api.post(`/enfants/${id}/regenerer-mot-de-passe`),
  configurerPin: (id, pin) => api.put(`/enfants/${id}/pin`, { pin }),
  changerModeConnexion: (id, mode) => api.put(`/enfants/${id}/mode-connexion`, { mode }),
  // Progression
  getProgression: (id) => api.get(`/enfants/${id}/progression`),
  getBadges: (id) => api.get(`/enfants/${id}/badges`),
  getTempsEcran: (id, periode = 7) => api.get(`/enfants/${id}/temps-ecran`, { params: { periode } }),
};

// ============================================
// SERVICES ABONNEMENTS
// ============================================
export const abonnementService = {
  getTypes: () => api.get('/abonnements/types'),
  getAll: (params) => api.get('/abonnements', { params }),
  getMesAbonnements: () => api.get('/abonnements'),
  getById: (id) => api.get(`/abonnements/${id}`),
  souscrire: (enfantId, typeAbonnementId) => api.post('/abonnements', { enfantId, typeAbonnementId }),
  toggleRenouvellement: (id, actif) => api.put(`/abonnements/${id}/renouvellement`, { actif }),
  annuler: (id, motif) => api.post(`/abonnements/${id}/annuler`, { motif }),
};

// ============================================
// SERVICES CONTENUS
// ============================================
export const contenuService = {
  getDomaines: () => api.get('/contenus/domaines'),
  getAll: (params) => api.get('/contenus', { params }),
  getCatalogue: (params) => api.get('/contenus', { params }),
  getAllAdmin: (params) => api.get('/contenus/tous', { params }),
  getById: (id) => api.get(`/contenus/${id}`),
  // Admin
  create: (data) => api.post('/contenus', data),
  update: (id, data) => api.put(`/contenus/${id}`, data),
  delete: (id) => api.delete(`/contenus/${id}`),
  publier: (id) => api.put(`/contenus/${id}/publier`),
  createDomaine: (data) => api.post('/contenus/domaines', data),
  updateDomaine: (id, data) => api.put(`/contenus/domaines/${id}`, data),
};

// ============================================
// SERVICES GESTION CONTENU (Gestionnaire)
// ============================================
export const gestionContenuService = {
  // Obtenir mes contenus (avec stats par statut)
  getMesContenus: (params) => api.get('/contenus/mes-contenus', { params }),
  // Soumettre un contenu pour validation
  soumettre: (id) => api.put(`/contenus/${id}/soumettre`),
  // Publier un contenu validé
  publier: (id) => api.put(`/contenus/${id}/publier`),
  // Obtenir le détail pour validation
  getForValidation: (id) => api.get(`/contenus/${id}/validation`),
};

// ============================================
// SERVICES UPLOAD
// ============================================
export const uploadService = {
  // Upload d'un fichier média (video, audio, document)
  uploadMedia: (file, onProgress) => {
    const formData = new FormData();
    formData.append('media', file);
    return api.post('/uploads/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
  // Upload d'une miniature
  uploadMiniature: (file, onProgress) => {
    const formData = new FormData();
    formData.append('miniature', file);
    return api.post('/uploads/miniature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
  // Upload d'une image pour question de quiz
  uploadQuestionImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/uploads/question-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Obtenir les infos d'un fichier uploadé
  getFileInfo: (uuid) => api.get(`/uploads/${uuid}`),
  // Supprimer un fichier uploadé
  deleteFile: (uuid) => api.delete(`/uploads/${uuid}`),
  // Lister mes fichiers temporaires
  getMesFichiers: () => api.get('/uploads/mes-fichiers'),
};

// ============================================
// SERVICES QUIZ
// ============================================
export const quizService = {
  // Obtenir le quiz d'un contenu
  getByContenuId: (contenuId) => api.get(`/quiz/contenu/${contenuId}`),
  // Créer ou modifier le quiz d'un contenu
  createOrUpdate: (contenuId, data) => api.post(`/quiz/contenu/${contenuId}`, data),
  // Supprimer le quiz d'un contenu
  delete: (contenuId) => api.delete(`/quiz/contenu/${contenuId}`),
  // Ajouter une question
  addQuestion: (quizId, data) => api.post(`/quiz/${quizId}/questions`, data),
  // Modifier une question
  updateQuestion: (questionId, data) => api.put(`/quiz/questions/${questionId}`, data),
  // Supprimer une question
  deleteQuestion: (questionId) => api.delete(`/quiz/questions/${questionId}`),
  // Réordonner les questions
  reorderQuestions: (quizId, questionIds) => api.put(`/quiz/${quizId}/questions/reorder`, { questionIds }),
};

// ============================================
// SERVICES NOTIFICATIONS
// ============================================
export const notificationService = {
  getAll: () => api.get('/notifications'),
  marquerLue: (id) => api.put(`/notifications/${id}/lue`),
  marquerToutesLues: () => api.put('/notifications/lues'),
};

// ============================================
// SERVICES PARAMETRES PARENTAUX
// ============================================
export const parametreParentalService = {
  get: (enfantId) => api.get(`/parametres-parentaux/enfant/${enfantId}`),
  update: (enfantId, data) => api.put(`/parametres-parentaux/enfant/${enfantId}`, data),
};

// ============================================
// SERVICES DOMAINES AUTORISES
// ============================================
export const domaineAutoriseService = {
  get: (enfantId) => api.get(`/domaines-autorises/enfant/${enfantId}`),
  update: (enfantId, domaineIds) => api.put(`/domaines-autorises/enfant/${enfantId}`, { domaineIds }),
  toggle: (enfantId, domaineId) => api.post(`/domaines-autorises/enfant/${enfantId}/toggle/${domaineId}`),
};

// ============================================
// SERVICES HISTORIQUE
// ============================================
export const historiqueService = {
  get: (enfantId, params) => api.get(`/historique/enfant/${enfantId}`, { params }),
  getHistorique: (enfantId, params) => api.get(`/historique/enfant/${enfantId}`, { params }),
  getResume: (enfantId) => api.get(`/historique/enfant/${enfantId}/resume`),
  getTempsEcran: (enfantId) => api.get(`/historique/enfant/${enfantId}/temps-ecran`),
  getProgression: (enfantId) => api.get(`/historique/enfant/${enfantId}/progression`),
  getStatistiques: (enfantId) => api.get(`/historique/enfant/${enfantId}/resume`),
};

// ============================================
// SERVICES PAIEMENT
// ============================================
export const paiementService = {
  getAll: () => api.get('/paiements'),
  getById: (id) => api.get(`/paiements/${id}`),
  initier: (data) => {
    // Adapter les noms de champs pour l'API
    const payload = {
      abonnementId: data.typeAbonnementId || data.abonnementId,
      methode: (data.modePaiement || data.methode || '').toLowerCase().replace('_', '_'),
      numeroTelephone: data.telephone || data.numeroTelephone,
    };
    return api.post('/paiements', payload);
  },
  verifier: (id) => api.post(`/paiements/${id}/verifier`),
};

// ============================================
// SERVICES ADMIN
// ============================================
export const adminService = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  // Statistiques
  getStats: (type) => api.get(`/admin/statistiques/${type}`),
  // Utilisateurs
  getUtilisateurs: (params) => api.get('/utilisateurs', { params }),
  getUtilisateur: (id) => api.get(`/utilisateurs/${id}`),
  updateUtilisateur: (id, data) => api.put(`/utilisateurs/${id}`, data),
  deleteUtilisateur: (id) => api.delete(`/utilisateurs/${id}`),
  // Contenus
  validerContenu: (id) => api.put(`/contenus/${id}/publier`),
};

// ============================================
// SERVICES VALIDATION (Validateurs)
// ============================================
export const validationService = {
  // Obtenir les contenus en attente de validation
  getAValider: (params) => api.get('/contenus/a-valider', { params }),
  // Obtenir les statistiques de validation
  getStats: () => api.get('/contenus/stats-validation'),
  // Valider (approuver) un contenu
  valider: (id, commentaire) => api.put(`/contenus/${id}/valider`, { commentaire }),
  // Renvoyer pour amendements (avec commentaire obligatoire)
  amender: (id, commentaire) => api.put(`/contenus/${id}/amender`, { commentaire }),
  // Obtenir le détail d'un contenu pour validation (avec quiz)
  getDetailValidation: (id) => api.get(`/contenus/${id}/validation`),
};

export default api;
