import { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiAlertCircle,
  FiVideo,
  FiMusic,
  FiFileText,
  FiPlay,
  FiHelpCircle,
  FiFile,
  FiRefreshCw,
} from 'react-icons/fi';
import { validationService } from '../../services/api';
import './Validations.css';

const TYPE_ICONS = {
  video: FiVideo,
  audio: FiMusic,
  document: FiFileText,
  quiz: FiHelpCircle,
  jeu: FiPlay,
  activite: FiFile,
};

// URL de base pour les fichiers statiques (uploads) - sans /api
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

function Validations() {
  const [contenus, setContenus] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContenu, setSelectedContenu] = useState(null);
  const [contenuDetail, setContenuDetail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'validate', 'amend'
  const [commentaire, setCommentaire] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterStatut, setFilterStatut] = useState('en_attente'); // Filtre par statut

  // Charger les stats au montage
  useEffect(() => {
    fetchStats();
  }, []);

  // Recharger les contenus quand le filtre change
  useEffect(() => {
    fetchContenus();
  }, [filterStatut]);

  const fetchStats = async () => {
    try {
      const statsRes = await validationService.getStats();
      setStats(statsRes.data?.data || null);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const fetchContenus = async () => {
    setLoading(true);
    setError('');
    try {
      // Construire les parametres selon le filtre
      const params = {};
      if (filterStatut === 'mes_validations') {
        params.mesValidations = 'true';
      } else if (filterStatut !== 'all') {
        params.statut = filterStatut;
      } else {
        params.statut = 'all';
      }

      const contenusRes = await validationService.getAValider(params);
      setContenus(contenusRes.data?.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des donnees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchStats(), fetchContenus()]);
  };

  const fetchContenuDetail = async (id) => {
    setDetailLoading(true);
    try {
      const response = await validationService.getDetailValidation(id);
      setContenuDetail(response.data?.data || null);
    } catch (err) {
      console.error('Erreur chargement detail:', err);
      setContenuDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openModal = async (contenu, type) => {
    setSelectedContenu(contenu);
    setModalType(type);
    setCommentaire('');
    setShowModal(true);

    // Charger les details complets si on veut voir
    if (type === 'view') {
      await fetchContenuDetail(contenu.id);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContenu(null);
    setContenuDetail(null);
    setModalType('');
    setCommentaire('');
  };

  const handleValidate = async () => {
    if (!selectedContenu) return;
    setActionLoading(true);
    try {
      await validationService.valider(selectedContenu.id, commentaire);
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAmend = async () => {
    if (!selectedContenu || !commentaire.trim()) {
      setError('Le commentaire est obligatoire pour renvoyer en amendement');
      return;
    }
    setActionLoading(true);
    try {
      await validationService.amender(selectedContenu.id, commentaire);
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi en amendement');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      video: 'Video',
      audio: 'Audio',
      quiz: 'Quiz',
      jeu: 'Jeu',
      document: 'Document',
      activite: 'Activite'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    const Icon = TYPE_ICONS[type] || FiFile;
    return <Icon />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="validations-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement des contenus a valider...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="validations-page">
      <div className="validations-header">
        <div>
          <h1>Validation des contenus</h1>
          <p>Examinez et validez les contenus educatifs soumis</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <FiRefreshCw /> Rafraichir
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}>Fermer</button>
        </div>
      )}

      {/* Statistiques - Cartes cliquables pour filtrer */}
      {stats && (
        <div className="stats-grid">
          <button
            className={`stat-card pending clickable ${filterStatut === 'en_attente' ? 'active' : ''}`}
            onClick={() => setFilterStatut('en_attente')}
          >
            <FiClock className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.enAttente}</span>
              <span className="stat-label">En attente</span>
            </div>
          </button>
          <button
            className={`stat-card success clickable ${filterStatut === 'valide' ? 'active' : ''}`}
            onClick={() => setFilterStatut('valide')}
          >
            <FiCheckCircle className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.valides}</span>
              <span className="stat-label">Valides</span>
            </div>
          </button>
          <button
            className={`stat-card warning clickable ${filterStatut === 'a_amender' ? 'active' : ''}`}
            onClick={() => setFilterStatut('a_amender')}
          >
            <FiXCircle className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.aAmender}</span>
              <span className="stat-label">A amender</span>
            </div>
          </button>
          <button
            className={`stat-card info clickable ${filterStatut === 'mes_validations' ? 'active' : ''}`}
            onClick={() => setFilterStatut('mes_validations')}
          >
            <FiCheckCircle className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{stats.mesValidations}</span>
              <span className="stat-label">Mes validations</span>
            </div>
          </button>
        </div>
      )}

      {/* Liste des contenus filtrés */}
      <div className="contenus-section">
        <h2>
          {filterStatut === 'en_attente' && `Contenus en attente (${contenus.length})`}
          {filterStatut === 'valide' && `Contenus validés (${contenus.length})`}
          {filterStatut === 'a_amender' && `Contenus à amender (${contenus.length})`}
          {filterStatut === 'mes_validations' && `Mes validations (${contenus.length})`}
        </h2>

        {contenus.length === 0 ? (
          <div className="empty-state">
            <FiCheckCircle size={48} />
            <p>
              {filterStatut === 'en_attente' && 'Aucun contenu en attente de validation'}
              {filterStatut === 'valide' && 'Aucun contenu validé'}
              {filterStatut === 'a_amender' && 'Aucun contenu à amender'}
              {filterStatut === 'mes_validations' && 'Aucune validation effectuée'}
            </p>
          </div>
        ) : (
          <div className="contenus-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Domaine</th>
                  <th>Createur</th>
                  <th>Statut</th>
                  <th>Age cible</th>
                  <th>Soumis le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contenus.map((contenu) => (
                  <tr key={contenu.id}>
                    <td>
                      <div className={`type-icon ${contenu.type}`}>
                        {getTypeIcon(contenu.type)}
                      </div>
                    </td>
                    <td className="title-cell">
                      <strong>{contenu.titre}</strong>
                      {contenu.description && (
                        <span className="description">{contenu.description.substring(0, 60)}...</span>
                      )}
                    </td>
                    <td>{contenu.domaine_nom}</td>
                    <td>{contenu.createurNom || `${contenu.createur_prenom} ${contenu.createur_nom}`}</td>
                    <td>
                      <span className={`status-badge status-${contenu.statut}`}>
                        {contenu.statut === 'en_attente' && 'En attente'}
                        {contenu.statut === 'valide' && 'Validé'}
                        {contenu.statut === 'a_amender' && 'À amender'}
                        {contenu.statut === 'publie' && 'Publié'}
                      </span>
                    </td>
                    <td>{contenu.tranche_age_min}-{contenu.tranche_age_max} ans</td>
                    <td>{formatDate(contenu.date_soumission)}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-action view"
                        onClick={() => openModal(contenu, 'view')}
                        title="Voir les details"
                      >
                        <FiEye />
                      </button>
                      {/* Boutons validation uniquement pour contenus en_attente */}
                      {contenu.statut === 'en_attente' && (
                        <>
                          <button
                            className="btn-action validate"
                            onClick={() => openModal(contenu, 'validate')}
                            title="Valider"
                          >
                            <FiCheckCircle />
                          </button>
                          <button
                            className="btn-action amend"
                            onClick={() => openModal(contenu, 'amend')}
                            title="Renvoyer pour amendement"
                          >
                            <FiXCircle />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedContenu && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'view' && 'Details du contenu'}
                {modalType === 'validate' && 'Valider le contenu'}
                {modalType === 'amend' && 'Renvoyer pour amendement'}
              </h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="modal-body">
              {/* Infos basiques */}
              <div className="contenu-details">
                <div className="detail-row">
                  <label>Titre:</label>
                  <span>{selectedContenu.titre}</span>
                </div>
                <div className="detail-row">
                  <label>Type:</label>
                  <span className={`type-badge ${selectedContenu.type}`}>
                    {getTypeIcon(selectedContenu.type)}
                    {getTypeLabel(selectedContenu.type)}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Domaine:</label>
                  <span>{selectedContenu.domaine_nom}</span>
                </div>
                <div className="detail-row">
                  <label>Description:</label>
                  <p>{selectedContenu.description || 'Aucune description'}</p>
                </div>
                <div className="detail-row">
                  <label>Age cible:</label>
                  <span>{selectedContenu.tranche_age_min} - {selectedContenu.tranche_age_max} ans</span>
                </div>
                <div className="detail-row">
                  <label>Createur:</label>
                  <span>{selectedContenu.createurNom || `${selectedContenu.createur_prenom} ${selectedContenu.createur_nom}`}</span>
                </div>
                <div className="detail-row">
                  <label>Points XP:</label>
                  <span>{selectedContenu.points_xp || 10}</span>
                </div>
              </div>

              {/* Details complets avec quiz (en mode view) */}
              {modalType === 'view' && (
                <>
                  {detailLoading ? (
                    <div className="detail-loading">
                      <div className="loader small"></div>
                      <p>Chargement des details...</p>
                    </div>
                  ) : contenuDetail ? (
                    <>
                      {/* Miniature */}
                      {contenuDetail.urlMiniature && (
                        <div className="miniature-section">
                          <h4>Miniature</h4>
                          <div className="miniature-container">
                            <img
                              src={`${getBaseUrl()}${contenuDetail.urlMiniature}`}
                              alt={`Miniature de ${contenuDetail.titre}`}
                              className="miniature-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="miniature-placeholder" style={{ display: 'none' }}>
                              {getTypeIcon(contenuDetail.type)}
                              <span>Miniature non disponible</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Media Player selon le type */}
                      {contenuDetail.urlMedia && (
                        <div className="media-section">
                          <h4>Contenu Media</h4>

                          {/* Video Player */}
                          {contenuDetail.type === 'video' && (
                            <div className="video-player-container">
                              <video
                                controls
                                className="video-player"
                                poster={contenuDetail.urlMiniature ? `${getBaseUrl()}${contenuDetail.urlMiniature}` : undefined}
                              >
                                <source
                                  src={`${getBaseUrl()}${contenuDetail.urlMedia}`}
                                  type="video/mp4"
                                />
                                Votre navigateur ne supporte pas la lecture video.
                              </video>
                            </div>
                          )}

                          {/* Audio Player */}
                          {contenuDetail.type === 'audio' && (
                            <div className="audio-player-container">
                              <div className="audio-visual">
                                {contenuDetail.urlMiniature ? (
                                  <img
                                    src={`${getBaseUrl()}${contenuDetail.urlMiniature}`}
                                    alt="Couverture audio"
                                    className="audio-cover"
                                  />
                                ) : (
                                  <div className="audio-icon-large">
                                    <FiMusic size={48} />
                                  </div>
                                )}
                              </div>
                              <audio
                                controls
                                className="audio-player"
                              >
                                <source
                                  src={`${getBaseUrl()}${contenuDetail.urlMedia}`}
                                  type="audio/mpeg"
                                />
                                Votre navigateur ne supporte pas la lecture audio.
                              </audio>
                            </div>
                          )}

                          {/* Document Viewer */}
                          {contenuDetail.type === 'document' && (
                            <div className="document-viewer-container">
                              {contenuDetail.urlMedia.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                  src={`${getBaseUrl()}${contenuDetail.urlMedia}`}
                                  className="pdf-viewer"
                                  title="Document PDF"
                                />
                              ) : (
                                <div className="document-download">
                                  <FiFileText size={48} />
                                  <p>Document disponible</p>
                                  <a
                                    href={`${getBaseUrl()}${contenuDetail.urlMedia}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                  >
                                    <FiEye /> Voir le document
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Autres types - lien generique */}
                          {!['video', 'audio', 'document'].includes(contenuDetail.type) && (
                            <a
                              href={`${getBaseUrl()}${contenuDetail.urlMedia}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="media-link"
                            >
                              <FiPlay /> Voir le contenu
                            </a>
                          )}
                        </div>
                      )}

                      {/* Quiz */}
                      {contenuDetail.quiz && (
                        <div className="quiz-section">
                          <h4>Quiz associe</h4>
                          <div className="quiz-info">
                            <span>Titre: {contenuDetail.quiz.titre}</span>
                            <span>Score minimum: {contenuDetail.quiz.score_minimum}%</span>
                            <span>Temps limite: {contenuDetail.quiz.temps_limite_minutes || 'Illimite'} min</span>
                            <span>Questions: {contenuDetail.quiz.questions?.length || 0}</span>
                          </div>

                          {contenuDetail.quiz.questions?.map((question, qIndex) => (
                            <div key={question.id} className="question-card">
                              <div className="question-header">
                                <span className="question-number">Q{qIndex + 1}</span>
                                <span className="question-type">{question.type}</span>
                                <span className="question-points">{question.points} pt(s)</span>
                              </div>
                              <p className="question-text">{question.texte}</p>
                              <ul className="answers-list">
                                {question.reponses?.map((reponse) => (
                                  <li
                                    key={reponse.id}
                                    className={reponse.est_correcte ? 'correct' : ''}
                                  >
                                    {reponse.est_correcte && <FiCheckCircle />}
                                    {reponse.texte}
                                  </li>
                                ))}
                              </ul>
                              {question.explication && (
                                <p className="question-explanation">
                                  <strong>Explication:</strong> {question.explication}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Historique */}
                      {contenuDetail.historique?.length > 0 && (
                        <div className="historique-section">
                          <h4>Historique</h4>
                          <ul className="historique-list">
                            {contenuDetail.historique.map((h, i) => (
                              <li key={i}>
                                <span className="action">{h.action}</span>
                                <span className="user">par {h.utilisateur}</span>
                                <span className="date">{formatDate(h.dateAction)}</span>
                                {h.commentaire && <p className="comment">{h.commentaire}</p>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="no-detail">Details non disponibles</p>
                  )}
                </>
              )}

              {/* Formulaire validation */}
              {modalType === 'validate' && (
                <div className="action-form">
                  <label>Commentaire (optionnel):</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Ajoutez un commentaire pour le createur..."
                    rows={3}
                  />
                </div>
              )}

              {/* Formulaire amendement */}
              {modalType === 'amend' && (
                <div className="action-form">
                  <label>Commentaire *:</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Expliquez les modifications necessaires..."
                    rows={4}
                    required
                  />
                  <p className="form-help">
                    Ce commentaire sera visible par le gestionnaire de contenu pour qu'il puisse effectuer les corrections demandees.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Fermer
              </button>

              {modalType === 'validate' && (
                <button
                  className="btn btn-success"
                  onClick={handleValidate}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Validation...' : 'Valider'}
                </button>
              )}

              {modalType === 'amend' && (
                <button
                  className="btn btn-warning"
                  onClick={handleAmend}
                  disabled={actionLoading || !commentaire.trim()}
                >
                  {actionLoading ? 'Envoi...' : 'Renvoyer pour amendement'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Validations;
