import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiSave,
  FiX,
  FiUpload,
  FiVideo,
  FiFileText,
  FiImage,
  FiMusic,
  FiPlay,
  FiHelpCircle,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiSend,
  FiFile,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import { contenuService, uploadService, quizService, gestionContenuService } from '../../services/api';
import './NouveauContenu.css';

const TYPES_CONTENU = [
  { id: 'video', label: 'Video', icon: FiVideo, description: 'Contenu video educatif', accept: '.mp4,.webm,.mov,.avi' },
  { id: 'audio', label: 'Audio', icon: FiMusic, description: 'Contenu audio (contes, etc.)', accept: '.mp3,.wav,.ogg,.m4a' },
  { id: 'document', label: 'Document', icon: FiFileText, description: 'Documents PDF', accept: '.pdf,.docx,.pptx' },
  { id: 'quiz', label: 'Quiz', icon: FiHelpCircle, description: 'Questions et exercices', accept: null },
  { id: 'jeu', label: 'Jeu', icon: FiPlay, description: 'Jeux interactifs', accept: null },
  { id: 'activite', label: 'Activite', icon: FiFile, description: 'Activites educatives', accept: null },
];

const QUESTION_TYPES = [
  { id: 'choix_unique', label: 'Choix unique' },
  { id: 'choix_multiple', label: 'Choix multiple' },
  { id: 'vrai_faux', label: 'Vrai/Faux' },
];

function NouveauContenu() {
  const navigate = useNavigate();
  const { id } = useParams(); // Pour le mode edition
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [domaines, setDomaines] = useState([]);
  const [step, setStep] = useState(1); // 1: infos, 2: media, 3: quiz

  // Form data
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: '',
    domaineId: '',
    niveauId: '',
    trancheAgeMin: 4,
    trancheAgeMax: 12,
    pointsXp: 10,
    estPremium: false,
    estTelechargeable: true,
  });

  // Upload state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaFileId, setMediaFileId] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [miniatureFile, setMiniatureFile] = useState(null);
  const [miniatureFileId, setMiniatureFileId] = useState(null);
  const [miniaturePreview, setMiniaturePreview] = useState(null);
  const [miniatureProgress, setMiniatureProgress] = useState(0);

  // Quiz state
  const [quiz, setQuiz] = useState({
    titre: '',
    description: '',
    tempsLimiteMinutes: 10,
    scoreMinimum: 60,
    melangerQuestions: true,
    afficherCorrection: true,
    questions: [],
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const mediaInputRef = useRef(null);
  const miniatureInputRef = useRef(null);

  useEffect(() => {
    loadOptions();
    if (isEditMode) {
      loadContenu();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      const response = await contenuService.getDomaines();
      setDomaines(response.data?.data || []);
    } catch (error) {
      console.error('Erreur chargement domaines:', error);
    }
  };

  const loadContenu = async () => {
    setInitialLoading(true);
    try {
      const response = await contenuService.getById(id);
      const contenu = response.data?.data;
      if (contenu) {
        setFormData({
          titre: contenu.titre || '',
          description: contenu.description || '',
          type: contenu.type || '',
          domaineId: contenu.domaine_id || '',
          niveauId: contenu.niveau_id || '',
          trancheAgeMin: contenu.tranche_age_min || 4,
          trancheAgeMax: contenu.tranche_age_max || 12,
          pointsXp: contenu.points_xp || 10,
          estPremium: contenu.est_premium || false,
          estTelechargeable: contenu.est_telechargeable !== false,
        });

        if (contenu.urlMedia) {
          setMediaPreview(contenu.urlMedia);
        }
        if (contenu.urlMiniature) {
          setMiniaturePreview(contenu.urlMiniature);
        }

        // Charger le quiz si existe
        if (contenu.quiz) {
          setQuiz({
            titre: contenu.quiz.titre || '',
            description: contenu.quiz.description || '',
            tempsLimiteMinutes: contenu.quiz.temps_limite_minutes || 10,
            scoreMinimum: contenu.quiz.score_minimum || 60,
            melangerQuestions: contenu.quiz.melanger_questions !== false,
            afficherCorrection: contenu.quiz.afficher_correction !== false,
            questions: contenu.quiz.questions?.map(q => ({
              texte: q.texte,
              type: q.type,
              points: q.points || 1,
              explication: q.explication || '',
              reponses: q.reponses?.map(r => ({
                texte: r.texte,
                estCorrecte: r.est_correcte,
              })) || [],
            })) || [],
          });
        }
      }
    } catch (error) {
      setGlobalError('Erreur lors du chargement du contenu');
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, type }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: null }));
    }
  };

  // Upload handlers
  const handleMediaDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) handleMediaSelect(file);
  };

  const handleMediaSelect = async (file) => {
    if (!file) return;

    const typeConfig = TYPES_CONTENU.find(t => t.id === formData.type);
    if (typeConfig?.accept) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const acceptedExts = typeConfig.accept.split(',');
      if (!acceptedExts.includes(ext)) {
        setGlobalError(`Format non accepte. Formats acceptes: ${typeConfig.accept}`);
        return;
      }
    }

    setMediaFile(file);
    setUploading(true);
    setUploadProgress(0);
    setGlobalError('');

    try {
      const response = await uploadService.uploadMedia(file, (progress) => {
        setUploadProgress(progress);
      });

      const data = response.data?.data;
      setMediaFileId(data.fileId);
      setMediaPreview(data.urlTemporaire);
      setUploadProgress(100);
    } catch (error) {
      let msg = 'Erreur lors de l\'upload du fichier';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        msg = `Timeout: le fichier est trop gros ou la connexion trop lente (${Math.round(file.size / 1024 / 1024)} Mo)`;
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = `Erreur: ${error.message}`;
      }
      setGlobalError(msg);
      setMediaFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleMiniatureSelect = async (file) => {
    if (!file) return;

    setMiniatureFile(file);
    setMiniatureProgress(0);

    try {
      const response = await uploadService.uploadMiniature(file, (progress) => {
        setMiniatureProgress(progress);
      });

      const data = response.data?.data;
      setMiniatureFileId(data.fileId);
      setMiniaturePreview(data.urlTemporaire);
      setMiniatureProgress(100);
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Erreur lors de l\'upload de la miniature');
      setMiniatureFile(null);
    }
  };

  const removeMedia = async () => {
    if (mediaFileId) {
      try {
        await uploadService.deleteFile(mediaFileId);
      } catch (e) { /* ignore */ }
    }
    setMediaFile(null);
    setMediaFileId(null);
    setMediaPreview(null);
    setUploadProgress(0);
  };

  const removeMiniature = async () => {
    if (miniatureFileId) {
      try {
        await uploadService.deleteFile(miniatureFileId);
      } catch (e) { /* ignore */ }
    }
    setMiniatureFile(null);
    setMiniatureFileId(null);
    setMiniaturePreview(null);
    setMiniatureProgress(0);
  };

  // Quiz handlers
  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
        texte: '',
        type: 'choix_unique',
        points: 1,
        explication: '',
        reponses: [
          { texte: '', estCorrecte: false },
          { texte: '', estCorrecte: false },
        ],
      }],
    }));
  };

  const removeQuestion = (index) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addReponse = (questionIndex) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, reponses: [...q.reponses, { texte: '', estCorrecte: false }] }
          : q
      ),
    }));
  };

  const removeReponse = (questionIndex, reponseIndex) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, reponses: q.reponses.filter((_, ri) => ri !== reponseIndex) }
          : q
      ),
    }));
  };

  const updateReponse = (questionIndex, reponseIndex, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              reponses: q.reponses.map((r, ri) =>
                ri === reponseIndex ? { ...r, [field]: value } : r
              ),
            }
          : q
      ),
    }));
  };

  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= quiz.questions.length) return;
    setQuiz(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return { ...prev, questions: newQuestions };
    });
  };

  const toggleCorrectAnswer = (questionIndex, reponseIndex) => {
    const question = quiz.questions[questionIndex];
    if (question.type === 'choix_unique' || question.type === 'vrai_faux') {
      // Une seule reponse correcte
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === questionIndex
            ? {
                ...q,
                reponses: q.reponses.map((r, ri) => ({
                  ...r,
                  estCorrecte: ri === reponseIndex,
                })),
              }
            : q
        ),
      }));
    } else {
      // Plusieurs reponses correctes possibles
      updateReponse(questionIndex, reponseIndex, 'estCorrecte',
        !question.reponses[reponseIndex].estCorrecte);
    }
  };

  // Validation
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';
    if (!formData.type) newErrors.type = 'Selectionnez un type de contenu';
    if (!formData.domaineId) newErrors.domaineId = 'Selectionnez un domaine';
    if (formData.trancheAgeMin > formData.trancheAgeMax) {
      newErrors.trancheAgeMin = 'L\'age minimum doit etre inferieur au maximum';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    if (quiz.questions.length === 0) return true; // Quiz optionnel

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.texte.trim()) {
        setGlobalError(`Question ${i + 1}: le texte est requis`);
        return false;
      }
      if (q.reponses.length < 2) {
        setGlobalError(`Question ${i + 1}: au moins 2 reponses sont requises`);
        return false;
      }
      if (!q.reponses.some(r => r.estCorrecte)) {
        setGlobalError(`Question ${i + 1}: selectionnez au moins une reponse correcte`);
        return false;
      }
      if (q.reponses.some(r => !r.texte.trim())) {
        setGlobalError(`Question ${i + 1}: toutes les reponses doivent avoir un texte`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (action = 'brouillon') => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      return;
    }

    setLoading(true);
    setGlobalError('');

    try {
      const data = {
        titre: formData.titre,
        description: formData.description,
        type: formData.type,
        domaineId: parseInt(formData.domaineId),
        niveauId: formData.niveauId ? parseInt(formData.niveauId) : null,
        trancheAgeMin: parseInt(formData.trancheAgeMin),
        trancheAgeMax: parseInt(formData.trancheAgeMax),
        pointsXp: parseInt(formData.pointsXp),
        estPremium: formData.estPremium,
        estTelechargeable: formData.estTelechargeable,
        mediaFileId: mediaFileId || undefined,
        miniatureFileId: miniatureFileId || undefined,
      };

      let contenuId = id;

      if (isEditMode) {
        await contenuService.update(id, data);
      } else {
        const response = await contenuService.create(data);
        contenuId = response.data?.data?.id;
      }

      // Sauvegarder le quiz si des questions existent
      if (quiz.questions.length > 0 && contenuId) {
        await quizService.createOrUpdate(contenuId, {
          titre: quiz.titre || `Quiz: ${formData.titre}`,
          description: quiz.description,
          tempsLimiteMinutes: quiz.tempsLimiteMinutes,
          scoreMinimum: quiz.scoreMinimum,
          melangerQuestions: quiz.melangerQuestions,
          afficherCorrection: quiz.afficherCorrection,
          questions: quiz.questions,
        });
      }

      // Soumettre si demande
      if (action === 'soumettre' && contenuId) {
        await gestionContenuService.soumettre(contenuId);
      }

      navigate('/admin/mes-contenus');
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="nouveau-contenu-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement du contenu...</p>
        </div>
      </div>
    );
  }

  const typeConfig = TYPES_CONTENU.find(t => t.id === formData.type);
  const needsMediaUpload = typeConfig?.accept !== null;

  return (
    <div className="nouveau-contenu-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Modifier le contenu' : 'Nouveau contenu'}</h1>
        <p>{isEditMode ? 'Modifiez les informations du contenu' : 'Creez un nouveau contenu educatif'}</p>
      </div>

      {globalError && (
        <div className="error-alert">
          <FiAlertCircle />
          <span>{globalError}</span>
          <button onClick={() => setGlobalError('')}>&times;</button>
        </div>
      )}

      {/* Steps navigation */}
      <div className="steps-nav">
        <button
          className={`step-btn ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
          onClick={() => setStep(1)}
        >
          <span className="step-number">1</span>
          <span className="step-label">Informations</span>
        </button>
        <button
          className={`step-btn ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
          onClick={() => validateStep1() && setStep(2)}
        >
          <span className="step-number">2</span>
          <span className="step-label">Media</span>
        </button>
        <button
          className={`step-btn ${step === 3 ? 'active' : ''}`}
          onClick={() => validateStep1() && setStep(3)}
        >
          <span className="step-number">3</span>
          <span className="step-label">Quiz</span>
        </button>
      </div>

      <form className="contenu-form" onSubmit={(e) => { e.preventDefault(); handleSubmit('brouillon'); }}>

        {/* Step 1: Informations */}
        {step === 1 && (
          <div className="form-step">
            <div className="form-section">
              <h3>Type de contenu</h3>
              <div className="types-grid">
                {TYPES_CONTENU.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`type-card ${formData.type === type.id ? 'selected' : ''}`}
                      onClick={() => handleTypeSelect(type.id)}
                    >
                      <Icon size={24} />
                      <span className="type-label">{type.label}</span>
                      <span className="type-desc">{type.description}</span>
                    </button>
                  );
                })}
              </div>
              {errors.type && <span className="error-text">{errors.type}</span>}
            </div>

            <div className="form-section">
              <h3>Informations</h3>

              <div className="form-group">
                <label htmlFor="titre">Titre *</label>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  className={`form-input ${errors.titre ? 'error' : ''}`}
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Les lettres de l'alphabet"
                />
                {errors.titre && <span className="error-text">{errors.titre}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Decrivez le contenu educatif..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="domaineId">Domaine educatif *</label>
                  <select
                    id="domaineId"
                    name="domaineId"
                    className={`form-select ${errors.domaineId ? 'error' : ''}`}
                    value={formData.domaineId}
                    onChange={handleChange}
                  >
                    <option value="">Selectionnez un domaine</option>
                    {domaines.map((d) => (
                      <option key={d.id} value={d.id}>{d.nom}</option>
                    ))}
                  </select>
                  {errors.domaineId && <span className="error-text">{errors.domaineId}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="pointsXp">Points XP</label>
                  <input
                    type="number"
                    id="pointsXp"
                    name="pointsXp"
                    className="form-input"
                    value={formData.pointsXp}
                    onChange={handleChange}
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="trancheAgeMin">Age minimum</label>
                  <input
                    type="number"
                    id="trancheAgeMin"
                    name="trancheAgeMin"
                    className={`form-input ${errors.trancheAgeMin ? 'error' : ''}`}
                    value={formData.trancheAgeMin}
                    onChange={handleChange}
                    min={4}
                    max={12}
                  />
                  {errors.trancheAgeMin && <span className="error-text">{errors.trancheAgeMin}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="trancheAgeMax">Age maximum</label>
                  <input
                    type="number"
                    id="trancheAgeMax"
                    name="trancheAgeMax"
                    className="form-input"
                    value={formData.trancheAgeMax}
                    onChange={handleChange}
                    min={4}
                    max={12}
                  />
                </div>
              </div>

              <div className="form-row checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="estPremium"
                    checked={formData.estPremium}
                    onChange={handleChange}
                  />
                  <span>Contenu Premium</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="estTelechargeable"
                    checked={formData.estTelechargeable}
                    onChange={handleChange}
                  />
                  <span>Telechargeable</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                <FiX /> Annuler
              </button>
              <button type="button" className="btn btn-primary" onClick={() => validateStep1() && setStep(2)}>
                Suivant: Media
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Media Upload */}
        {step === 2 && (
          <div className="form-step">
            <div className="form-section">
              <h3>Fichier Media {needsMediaUpload && '*'}</h3>

              {!needsMediaUpload ? (
                <div className="info-box">
                  <FiHelpCircle />
                  <p>Ce type de contenu ne necessite pas de fichier media. Passez a l'etape suivante.</p>
                </div>
              ) : (
                <div
                  className={`upload-zone ${uploading ? 'uploading' : ''} ${mediaPreview ? 'has-file' : ''}`}
                  onDrop={handleMediaDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !mediaPreview && mediaInputRef.current?.click()}
                >
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept={typeConfig?.accept}
                    onChange={(e) => handleMediaSelect(e.target.files[0])}
                    hidden
                  />

                  {uploading ? (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <span>{uploadProgress}% - Upload en cours...</span>
                    </div>
                  ) : mediaPreview ? (
                    <div className="file-preview">
                      <div className="file-info">
                        <FiFile size={32} />
                        <span>{mediaFile?.name || 'Fichier uploade'}</span>
                      </div>
                      <button type="button" className="btn-remove" onClick={(e) => { e.stopPropagation(); removeMedia(); }}>
                        <FiTrash2 /> Supprimer
                      </button>
                    </div>
                  ) : (
                    <>
                      <FiUpload size={48} />
                      <p>Glissez-deposez votre fichier ici</p>
                      <span>ou cliquez pour parcourir</span>
                      <span className="accepted-formats">Formats acceptes: {typeConfig?.accept}</span>
                      <span className="size-limit">
                        Taille maximale: {formData.type === 'video' ? '500 Mo' : '200 Mo'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Image Miniature</h3>
              <div
                className={`upload-zone miniature ${miniaturePreview ? 'has-file' : ''}`}
                onClick={() => !miniaturePreview && miniatureInputRef.current?.click()}
              >
                <input
                  ref={miniatureInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleMiniatureSelect(e.target.files[0])}
                  hidden
                />

                {miniatureProgress > 0 && miniatureProgress < 100 ? (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${miniatureProgress}%` }}></div>
                    </div>
                    <span>{miniatureProgress}%</span>
                  </div>
                ) : miniaturePreview ? (
                  <div className="file-preview">
                    <img src={miniaturePreview} alt="Miniature" className="miniature-img" />
                    <button type="button" className="btn-remove" onClick={(e) => { e.stopPropagation(); removeMiniature(); }}>
                      <FiTrash2 />
                    </button>
                  </div>
                ) : (
                  <>
                    <FiImage size={32} />
                    <p>Ajouter une miniature</p>
                    <span>JPG, PNG, WEBP</span>
                    <span className="size-limit">Taille maximale: 200 Mo</span>
                  </>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                Suivant: Quiz
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quiz */}
        {step === 3 && (
          <div className="form-step">
            <div className="form-section">
              <h3>Quiz associe (optionnel)</h3>
              <p className="section-desc">Ajoutez un quiz pour tester les connaissances apres le contenu</p>

              <div className="form-row">
                <div className="form-group">
                  <label>Titre du quiz</label>
                  <input
                    type="text"
                    className="form-input"
                    value={quiz.titre}
                    onChange={(e) => setQuiz(prev => ({ ...prev, titre: e.target.value }))}
                    placeholder={`Quiz: ${formData.titre}`}
                  />
                </div>
                <div className="form-group">
                  <label>Score minimum (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quiz.scoreMinimum}
                    onChange={(e) => setQuiz(prev => ({ ...prev, scoreMinimum: parseInt(e.target.value) }))}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="form-group">
                  <label>Temps limite (min)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quiz.tempsLimiteMinutes}
                    onChange={(e) => setQuiz(prev => ({ ...prev, tempsLimiteMinutes: parseInt(e.target.value) }))}
                    min={0}
                    placeholder="0 = illimite"
                  />
                </div>
              </div>

              <div className="form-row checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={quiz.melangerQuestions}
                    onChange={(e) => setQuiz(prev => ({ ...prev, melangerQuestions: e.target.checked }))}
                  />
                  <span>Melanger les questions</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={quiz.afficherCorrection}
                    onChange={(e) => setQuiz(prev => ({ ...prev, afficherCorrection: e.target.checked }))}
                  />
                  <span>Afficher la correction</span>
                </label>
              </div>
            </div>

            {/* Questions */}
            <div className="questions-section">
              <div className="questions-header">
                <h3>Questions ({quiz.questions.length})</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>
                  <FiPlus /> Ajouter une question
                </button>
              </div>

              {quiz.questions.length === 0 ? (
                <div className="empty-questions">
                  <FiHelpCircle size={32} />
                  <p>Aucune question ajoutee</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={addQuestion}>
                    <FiPlus /> Ajouter ma premiere question
                  </button>
                </div>
              ) : (
                <div className="questions-list">
                  {quiz.questions.map((question, qIndex) => (
                    <div key={qIndex} className="question-card">
                      <div className="question-header">
                        <span className="question-number">Question {qIndex + 1}</span>
                        <select
                          className="question-type-select"
                          value={question.type}
                          onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        >
                          {QUESTION_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="question-points"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                          min={1}
                          title="Points"
                        />
                        <button type="button" className="btn-icon" title="Monter" onClick={() => moveQuestion(qIndex, -1)} disabled={qIndex === 0}>
                          <FiArrowUp />
                        </button>
                        <button type="button" className="btn-icon" title="Descendre" onClick={() => moveQuestion(qIndex, 1)} disabled={qIndex === quiz.questions.length - 1}>
                          <FiArrowDown />
                        </button>
                        <button
                          type="button"
                          className="btn-remove-question"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <textarea
                        className="question-text"
                        placeholder="Texte de la question..."
                        value={question.texte}
                        onChange={(e) => updateQuestion(qIndex, 'texte', e.target.value)}
                        rows={2}
                      />

                      <div className="reponses-list">
                        <label>Reponses (cliquez pour marquer comme correcte):</label>
                        {question.reponses.map((reponse, rIndex) => (
                          <div key={rIndex} className={`reponse-item ${reponse.estCorrecte ? 'correct' : ''}`}>
                            <button
                              type="button"
                              className="correct-toggle"
                              onClick={() => toggleCorrectAnswer(qIndex, rIndex)}
                              title={reponse.estCorrecte ? 'Reponse correcte' : 'Marquer comme correcte'}
                            >
                              {reponse.estCorrecte ? <FiCheck /> : <span className="empty-circle"></span>}
                            </button>
                            <input
                              type="text"
                              placeholder={`Reponse ${rIndex + 1}`}
                              value={reponse.texte}
                              onChange={(e) => updateReponse(qIndex, rIndex, 'texte', e.target.value)}
                            />
                            {question.reponses.length > 2 && (
                              <button
                                type="button"
                                className="btn-remove-reponse"
                                onClick={() => removeReponse(qIndex, rIndex)}
                              >
                                <FiX />
                              </button>
                            )}
                          </div>
                        ))}
                        {question.reponses.length < 6 && question.type !== 'vrai_faux' && (
                          <button
                            type="button"
                            className="btn-add-reponse"
                            onClick={() => addReponse(qIndex)}
                          >
                            <FiPlus /> Ajouter une reponse
                          </button>
                        )}
                      </div>

                      <div className="question-explanation">
                        <label>Explication (optionnel):</label>
                        <textarea
                          placeholder="Explication affichee apres la reponse..."
                          value={question.explication}
                          onChange={(e) => updateQuestion(qIndex, 'explication', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                Retour
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleSubmit('brouillon')}
                disabled={loading}
              >
                <FiSave /> {loading ? 'Sauvegarde...' : 'Sauvegarder brouillon'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSubmit('soumettre')}
                disabled={loading}
              >
                <FiSend /> {loading ? 'Envoi...' : 'Soumettre pour validation'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default NouveauContenu;
