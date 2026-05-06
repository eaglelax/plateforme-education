import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiCheck,
  FiX,
  FiVideo,
  FiFileText,
  FiImage,
  FiMusic,
  FiPlay,
  FiHelpCircle,
  FiCheckCircle,
  FiFile,
} from 'react-icons/fi';
import { contenuService, validationService } from '../../services/api';
import useAdminAuthStore from '../../stores/adminAuthStore';
import './GestionContenus.css';
import './Validations.css';

const TYPES_ICONS = {
  video: FiVideo,
  quiz: FiHelpCircle,
  image: FiImage,
  audio: FiMusic,
  jeu: FiPlay,
  document: FiFileText,
};

// Construire l'URL complète pour les fichiers media
// Sur LWS, les fichiers passent par ?route=/api/stream/...
const getMediaUrl = (relativePath) => {
  if (!relativePath) return '';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  const isLWS = apiUrl.includes('apieducative.genius-universe.com');
  if (isLWS && relativePath.startsWith('/api/')) {
    return `${baseUrl}?route=${relativePath}`;
  }
  return `${baseUrl}${relativePath}`;
};

function GestionContenus() {
  const { user, getRole, isAdmin } = useAdminAuthStore();
  const [contenus, setContenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDomaine, setFilterDomaine] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [domaines, setDomaines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedContenu, setSelectedContenu] = useState(null);
  const [contenuDetail, setContenuDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const userRole = getRole()?.toUpperCase();
  const hasAdminRole = isAdmin();

  // Admin = lecture seule. Seul le gestionnaire proprietaire peut modifier/supprimer.
  const canEdit = (contenu) => {
    if (userRole !== 'GESTIONNAIRE_CONTENU') return false;
    return contenu.createur_id === user?.id;
  };

  // Seul le gestionnaire peut creer des contenus (admin et validateur exclus)
  const canAddContent = () => {
    return userRole === 'GESTIONNAIRE_CONTENU';
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contenusRes, domainesRes] = await Promise.allSettled([
        contenuService.getAllAdmin({ page: pagination.page, limit: pagination.limit }),
        contenuService.getDomaines(),
      ]);

      if (contenusRes.status === 'fulfilled') {
        const data = contenusRes.value.data?.data || contenusRes.value.data || [];
        setContenus(Array.isArray(data) ? data : []);
        if (contenusRes.value.data?.pagination) {
          setPagination(p => ({ ...p, total: contenusRes.value.data.pagination.total }));
        }
      } else {
        setContenus([]);
      }

      if (domainesRes.status === 'fulfilled') {
        const domainesData = domainesRes.value.data?.data || domainesRes.value.data || [];
        setDomaines(Array.isArray(domainesData) ? domainesData : []);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setContenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contenu ?')) return;

    try {
      await contenuService.delete(id);
      setContenus(contenus.filter((c) => c.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleValider = async (id, action) => {
    try {
      if (action === 'APPROUVER') {
        await validationService.valider(id);
      } else if (action === 'REJETER') {
        const commentaire = prompt('Commentaire pour le renvoi en amendement (obligatoire):');
        if (!commentaire || !commentaire.trim()) {
          alert('Le commentaire est obligatoire pour renvoyer un contenu');
          return;
        }
        await validationService.amender(id, commentaire);
      }
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  // Modal functions
  const openDetail = async (contenu) => {
    setSelectedContenu(contenu);
    setShowModal(true);
    setDetailLoading(true);
    try {
      const response = await contenuService.getById(contenu.id);
      const detail = response.data?.data || response.data || null;
      setContenuDetail(detail);
    } catch (err) {
      console.error('Erreur chargement detail:', err.response?.status, err.response?.data || err.message);
      // Fallback: utiliser les donnees de la liste comme detail partiel
      setContenuDetail(contenu);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContenu(null);
    setContenuDetail(null);
  };

  const getTypeLabel = (type) => {
    const types = {
      video: 'Video', audio: 'Audio', quiz: 'Quiz',
      jeu: 'Jeu', document: 'Document', activite: 'Activite',
    };
    return types[type] || type;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredContenus = contenus.filter((c) => {
    const matchSearch =
      c.titre?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchDomaine = !filterDomaine || c.domaine_nom === filterDomaine;
    const matchStatut = !filterStatut || c.statut?.toLowerCase() === filterStatut.toLowerCase();
    return matchSearch && matchDomaine && matchStatut;
  });

  const getStatutBadge = (statut) => {
    const s = statut?.toLowerCase();
    const badges = {
      publie: { class: 'badge-success', label: 'Publie' },
      brouillon: { class: 'badge-secondary', label: 'Brouillon' },
      en_attente: { class: 'badge-warning', label: 'En validation' },
      en_attente_validation: { class: 'badge-warning', label: 'En validation' },
      valide: { class: 'badge-success', label: 'Valide' },
      rejete: { class: 'badge-danger', label: 'Rejete' },
      a_amender: { class: 'badge-info', label: 'A amender' },
    };
    return badges[s] || { class: 'badge-secondary', label: statut };
  };

  const getTypeIcon = (type) => {
    const Icon = TYPES_ICONS[type?.toLowerCase()] || FiFileText;
    return <Icon />;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="gestion-contenus-page">
      <div className="page-header page-header-actions">
        <div>
          <h1>Gestion des contenus</h1>
          <p>{contenus.length} contenus au total</p>
        </div>
        {canAddContent() && (
          <Link to="/admin/contenus/nouveau" className="btn btn-primary">
            <FiPlus /> Nouveau contenu
          </Link>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Rechercher un contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={filterDomaine}
          onChange={(e) => setFilterDomaine(e.target.value)}
        >
          <option value="">Tous les domaines</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.nom}>
              {d.nom}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="en_attente">En validation</option>
          <option value="valide">Valide</option>
          <option value="publie">Publie</option>
          <option value="rejete">Rejete</option>
          <option value="a_amender">A amender</option>
        </select>
      </div>

      <div className="contenus-table-container">
        <table className="contenus-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Domaine</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContenus.map((contenu) => {
              const badge = getStatutBadge(contenu.statut);
              return (
                <tr key={contenu.id}>
                  <td>
                    <div className="contenu-titre-cell">
                      <div className="type-icon">{getTypeIcon(contenu.type)}</div>
                      <div>
                        <strong>{contenu.titre}</strong>
                        <span className="contenu-desc">{contenu.description?.substring(0, 60)}...</span>
                      </div>
                    </div>
                  </td>
                  <td>{contenu.domaine_nom}</td>
                  <td>
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {/* Bouton Voir: ouvre le modal de detail */}
                      <button
                        className="btn-icon"
                        title="Voir les details"
                        onClick={() => openDetail(contenu)}
                      >
                        <FiEye />
                      </button>
                      {/* Bouton Modifier: seulement si canEdit */}
                      {canEdit(contenu) && (
                        <Link
                          to={`/admin/contenus/${contenu.id}/modifier`}
                          className="btn-icon"
                          title="Modifier"
                        >
                          <FiEdit2 />
                        </Link>
                      )}
                      {/* Boutons validation: seulement pour admin/validateur */}
                      {contenu.statut?.toLowerCase() === 'en_attente' && (hasAdminRole || userRole === 'VALIDATEUR') && (
                        <>
                          <button
                            className="btn-icon success"
                            title="Approuver"
                            onClick={() => handleValider(contenu.id, 'APPROUVER')}
                          >
                            <FiCheck />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Rejeter"
                            onClick={() => handleValider(contenu.id, 'REJETER')}
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                      {/* Bouton Supprimer: seulement si canEdit */}
                      {canEdit(contenu) && (
                        <button
                          className="btn-icon danger"
                          title="Supprimer"
                          onClick={() => handleDelete(contenu.id)}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredContenus.length === 0 && (
          <div className="empty-state">
            <p>Aucun contenu trouve</p>
          </div>
        )}
      </div>

      {pagination.total > pagination.limit && (
        <div className="pagination">
          <button disabled={pagination.page === 1} onClick={() => { setPagination(p => ({ ...p, page: p.page - 1 })); loadData(); }}>Precedent</button>
          <span>Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}</span>
          <button disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => { setPagination(p => ({ ...p, page: p.page + 1 })); loadData(); }}>Suivant</button>
        </div>
      )}

      {/* Modal Detail Contenu */}
      {showModal && selectedContenu && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Details du contenu</h3>
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
                  <label>Statut:</label>
                  <span className={`badge ${getStatutBadge(selectedContenu.statut).class}`}>
                    {getStatutBadge(selectedContenu.statut).label}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Age cible:</label>
                  <span>{selectedContenu.tranche_age_min} - {selectedContenu.tranche_age_max} ans</span>
                </div>
                {selectedContenu.createur_nom && (
                  <div className="detail-row">
                    <label>Createur:</label>
                    <span>{selectedContenu.createur_prenom} {selectedContenu.createur_nom}</span>
                  </div>
                )}
                <div className="detail-row">
                  <label>Points XP:</label>
                  <span>{selectedContenu.points_xp || 10}</span>
                </div>
                <div className="detail-row">
                  <label>Date de creation:</label>
                  <span>{formatDate(selectedContenu.date_creation)}</span>
                </div>
              </div>

              {/* Details complets charges via API */}
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
                          src={`${getMediaUrl(contenuDetail.urlMiniature)}`}
                          alt={`Miniature de ${contenuDetail.titre}`}
                          className="miniature-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
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

                      {contenuDetail.type === 'video' && (
                        <div className="video-player-container">
                          <video
                            controls
                            className="video-player"
                            src={getMediaUrl(contenuDetail.urlMedia)}
                            poster={contenuDetail.urlMiniature ? getMediaUrl(contenuDetail.urlMiniature) : undefined}
                            crossOrigin="anonymous"
                          >
                            Votre navigateur ne supporte pas la lecture video.
                          </video>
                        </div>
                      )}

                      {contenuDetail.type === 'audio' && (
                        <div className="audio-player-container">
                          <div className="audio-visual">
                            {contenuDetail.urlMiniature ? (
                              <img src={`${getMediaUrl(contenuDetail.urlMiniature)}`} alt="Couverture audio" className="audio-cover" />
                            ) : (
                              <div className="audio-icon-large"><FiMusic size={48} /></div>
                            )}
                          </div>
                          <audio controls className="audio-player">
                            <source src={`${getMediaUrl(contenuDetail.urlMedia)}`} type="audio/mpeg" />
                          </audio>
                        </div>
                      )}

                      {contenuDetail.type === 'document' && (
                        <div className="document-viewer-container">
                          {contenuDetail.urlMedia.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={`${getMediaUrl(contenuDetail.urlMedia)}`} className="pdf-viewer" title="Document PDF" />
                          ) : (
                            <div className="document-download">
                              <FiFileText size={48} />
                              <p>Document disponible</p>
                              <a href={`${getMediaUrl(contenuDetail.urlMedia)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                <FiEye /> Voir le document
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {!['video', 'audio', 'document'].includes(contenuDetail.type) && (
                        <a href={`${getMediaUrl(contenuDetail.urlMedia)}`} target="_blank" rel="noopener noreferrer" className="media-link">
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
                              <li key={reponse.id} className={reponse.est_correcte ? 'correct' : ''}>
                                {reponse.est_correcte && <FiCheckCircle />}
                                {reponse.texte}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="no-detail">Details non disponibles</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Fermer
              </button>
              {canEdit(selectedContenu) && (
                <Link
                  to={`/admin/contenus/${selectedContenu.id}/modifier`}
                  className="btn btn-primary"
                  onClick={closeModal}
                >
                  <FiEdit2 /> Modifier
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionContenus;
